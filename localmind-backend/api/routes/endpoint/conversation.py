from mailbox import Message

from fastapi import APIRouter, Depends

from api.model.request_model import CreateConversationRequest
from db.database_adapter import get_db
from api.service.conversation_service import ConversationService
from api.model.domain_model import Conversation


router = APIRouter()


@router.get("/{conversation_id}/messages")
async def get_messages(conversation_id: str, db=Depends(get_db)):
    service = ConversationService(db)
    return service.get_messages(conversation_id)

@router.get("/{conversation_id}/message")
async def temp(conversation_id):
    # m = Message("jifiaof",'asdad')
    return ""

@router.delete("/{conversation_id}")
async def delete_conversation(conversation_id: str, db=Depends(get_db)):
    service = ConversationService(db)
    return service.delete_conversation(conversation_id)

@router.get("/{conversation_id}")
async def temp2(conversation_id):
    # m = Message("jifiaof",'asdad')
    return ""

@router.post("/new")
async def create_conversation(request : CreateConversationRequest,db=Depends(get_db)):
    service = ConversationService(db)
    conv = service.create_conversation(request)
    return Conversation.model_validate(conv)


@router.get("/")
async def get_all_conversations(db=Depends(get_db)):
    service = ConversationService(db)
    return service.get_all_conversations()


