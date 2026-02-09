import asyncio
from starlette.responses import StreamingResponse
from api.routes.endpoint.conversation import router
from api.service.llm_service import LLMService
from api.service.message_service import MessageService
from api.service.conversation_service import ConversationService
from api.model.domain_model import Message
from db.schema.enums import MessageSender,ConversationType
from api.service.search_service import SearchService

class ChatService:
    def __init__(self, db):
        self.llm_service = LLMService(db)
        self.message_service = MessageService(db)
        self.conversation_service = ConversationService(db)
        self.search_service = SearchService(db)

    def create_chat_messages(self, conversation_id: str, message_text: str):
        # Create user message
        user_message = self.message_service.create_message(conversation_id, message_text, MessageSender.USER)
        # Create placeholder assistant message
        assistant_message = self.message_service.create_message(conversation_id, "", MessageSender.ASSISTANT)
        return str(user_message.id), str(assistant_message.id)

    def get_all_messages(self, conversation_id: str):
        messages = self.message_service.get_message_by_conversation(conversation_id)
        result = []
        for msg in messages:
            result.append(Message.model_validate(msg))
        return result


    async def get_chat_stream(self, conversation_id: str, message: str, assistant_message_id: str):
        full_response = ""
        db_messages = self.message_service.get_message_by_conversation(conversation_id)
        context_text = ""
        conversation = self.conversation_service.get_conversation_by_id(conversation_id)
        instruction = ""

        if conversation.conv_type != ConversationType.GENERAL:
            search_result = await self.search_service.search(message, conversation_id)
            if search_result:
                # Format context clearly for the LLM
                context_texts = [f"Source: {res.get('metadata', {}).get('source', 'Unknown')}\n{res.get('content', '')}" for res in search_result]
                context_text = "\n\n---\n\n".join(context_texts)
                print(f"RAG Context found: {len(search_result)} chunks")

        # Ensure chronological order
        db_messages.sort(key=lambda x: x.created_at)
        
        history = []
        for msg in db_messages:
            role = "user" if msg.sender == MessageSender.USER else "assistant"
            if str(msg.id) == assistant_message_id:
                continue
            history.append({"role": role, "content": msg.text})
            
        # Pass context to LLM service (we need to update LLMService to handle this)
        async for chunk in self.llm_service.get_result(message,conversation.conv_type, history, context=context_text):
            full_response += chunk
            yield chunk
        
        # After streaming completes, update the assistant message in the DB
        if assistant_message_id:
            self.message_service.update_message(assistant_message_id, text=full_response)