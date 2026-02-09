from db.database_adapter import Base
from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Enum, UUID
from sqlalchemy.orm import relationship
from uuid import uuid4
from datetime import datetime, timezone


class DocumentGroupORM(Base):
    __tablename__ = "document_group"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    name = Column(String, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    last_trained = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    embed_path = Column(String,nullable=True)

    document = relationship(
        "DocumentORM",
        back_populates="document_group",
        cascade="all, delete-orphan"
    )

    conversation_links = relationship('ConversationDocumentGroupORM', back_populates='document_group', cascade="all, delete-orphan")
