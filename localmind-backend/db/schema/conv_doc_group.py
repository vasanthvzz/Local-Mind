from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Enum, UUID, Table
from sqlalchemy.orm import relationship
from db.database_adapter import Base
from datetime import datetime
from datetime import timezone


class ConversationDocumentGroupORM(Base):
    __tablename__ = 'conversation_groups'

    conversation_id = Column(UUID(as_uuid=True), ForeignKey('conversation.id', ondelete='CASCADE'), primary_key=True)
    group_id = Column(UUID(as_uuid=True), ForeignKey('document_group.id', ondelete='CASCADE'), primary_key=True)
    added_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    # Relationships
    conversation = relationship('ConversationORM', back_populates='group_links')
    document_group = relationship('DocumentGroupORM', back_populates='conversation_links')
