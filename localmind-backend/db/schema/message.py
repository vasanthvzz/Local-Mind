from db.database_adapter import Base
from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Enum, UUID
from sqlalchemy.orm import relationship
from uuid import uuid4
from datetime import datetime,timezone

from db.schema.enums import MessageSender


class MessageORM(Base):

    __tablename__ = "message"

    id = Column(UUID(as_uuid=True), primary_key=True,default=uuid4)
    conversation_id = Column(UUID(as_uuid=True), ForeignKey('conversation.id',ondelete="CASCADE"), nullable=False)
    text = Column(String,nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    sender = Column(Enum(MessageSender), nullable=False)

    conversation = relationship("ConversationORM", back_populates="messages")