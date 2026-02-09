from datetime import datetime
from uuid import UUID
from pydantic import BaseModel, ConfigDict

from db.schema.enums import ConversationType, MessageSender


class Conversation(BaseModel):
    id : UUID
    title: str
    created_at: datetime
    updated_at: datetime
    conv_type : ConversationType
    model_config = ConfigDict(from_attributes=True)


class Message(BaseModel):
    id : UUID
    conversation_id : UUID
    text : str
    created_at : datetime
    sender : MessageSender
    model_config = ConfigDict(from_attributes=True)
