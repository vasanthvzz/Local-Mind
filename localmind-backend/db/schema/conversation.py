from uuid import uuid4
from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Enum, UUID
from sqlalchemy.orm import relationship
from db.database_adapter import Base
from datetime import datetime
from datetime import timezone

from db.schema.enums import ConversationType


class ConversationORM(Base):
    __tablename__ = "conversation"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    title = Column(String, index=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    conv_type = Column(Enum(ConversationType),nullable=False,default=ConversationType.GENERAL)

    messages = relationship(
        "MessageORM",
        back_populates="conversation",
        cascade="all, delete-orphan"
    )

    group_links = relationship('ConversationDocumentGroupORM', back_populates='conversation', cascade="all, delete-orphan")
