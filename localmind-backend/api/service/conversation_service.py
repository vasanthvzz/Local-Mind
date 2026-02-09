from api.model.domain_model import Conversation
from api.model.request_model import CreateConversationRequest
from db.repository.conversation_repo import ConversationRepo


class ConversationService:
    def __init__(self,db):
        self.conversation_repo = ConversationRepo(db)

    # def get_all_document_groups(self):
    #     return self.document_group_repo.get_all_document_groups()
    def create_conversation(self, request : CreateConversationRequest):
        try:
            new_conversation = self.conversation_repo.create_conversation(request.title, request.conv_type)
            for i in request.group_ids:
                self.conversation_repo.map_conversation_group(conversation_id=new_conversation.id, group_id=i)
            return new_conversation
        except Exception as e:
            print(e)

    def get_conversation_by_id(self,conversation_id: str):
        try:
            return self.conversation_repo.get_conversation_by_id(conversation_id)
        except Exception as e:
            print(e)
            return None

    def get_all_conversations(self):
        try:
            conversations =  self.conversation_repo.get_all_conversation()
            result = []
            for i in conversations:
                result.append(Conversation.model_validate(i))
            return result
        except Exception as e:
            print(e)
            return []

    def get_messages(self, conversation_id: str):
        try:
            messages = self.conversation_repo.get_messages(conversation_id)
            return messages
        except Exception as e:
            print(f"Error fetching messages: {e}")
            return []

    def delete_conversation(self, conversation_id: str):
        try:
            self.conversation_repo.delete_conversation(conversation_id)
            return True
        except Exception as e:
            print(f"Error deleting conversation: {e}")
            return False
