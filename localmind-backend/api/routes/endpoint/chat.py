from fastapi import APIRouter, Depends
from starlette.responses import StreamingResponse

import uuid
from typing import List
from api.model.request_model import CreateConversationRequest, MessageRequest
from api.model.domain_model import Message
from api.service.chat_service import ChatService
from api.service.conversation_service import ConversationService
from db.database_adapter import get_db


router = APIRouter()

@router.post("/{conversation_id}/all", response_model=List[Message])
async def get_all_messages_post(conversation_id: str, db=Depends(get_db)):
    service = ChatService(db)
    return service.get_all_messages(conversation_id)

@router.post("/{conversation_id}/message",)
async def get_response(conversation_id: str, request: MessageRequest, db=Depends(get_db)):
    service = ChatService(db)
    
    # Create DB records for the messages
    user_msg_id, assistant_msg_id = service.create_chat_messages(conversation_id, request.text)
    
    return StreamingResponse(
        service.get_chat_stream(conversation_id, request.text, assistant_msg_id),
        media_type="text/plain",
        headers={
            "x-user-message-id": user_msg_id,
            "x-assistant-message-id": assistant_msg_id,
            "Access-Control-Expose-Headers": "x-user-message-id, x-assistant-message-id"
        }
    )

