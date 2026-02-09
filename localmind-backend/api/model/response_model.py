from datetime import datetime
from typing import Optional, List
from uuid import UUID
from db.schema.enums import ConversationType
from pydantic import BaseModel, ConfigDict


class DocumentRead(BaseModel):
    id: UUID
    group_id: UUID
    name: str
    uploaded_at: datetime
    path: str
    format: str

    model_config = ConfigDict(from_attributes=True)

# 2. Define the DocumentGroup schema
class DocumentGroupResponse(BaseModel):
    id: UUID
    name: str
    created_at: datetime
    updated_at: datetime
    last_trained: datetime
    embed_path: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)

    # # This includes the list of documents in the response
    # document: List[DocumentRead] = []

