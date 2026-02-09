from pydantic import BaseModel
from db.schema.enums import ConversationType


class CreateConversationRequest(BaseModel):
    title : str
    conv_type : ConversationType
    group_ids : list

class MessageRequest(BaseModel):
    text: str
