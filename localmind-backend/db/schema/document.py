from db.database_adapter import Base
from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Enum, UUID
from sqlalchemy.orm import relationship
from uuid import uuid4
from datetime import datetime, timezone
from db.schema.enums import FileFormat

class DocumentORM(Base):
    __tablename__ = "document"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    group_id = Column(UUID(as_uuid=True), ForeignKey("document_group.id"))
    name = Column(String, nullable=False)
    uploaded_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    path = Column(String, nullable=False,unique=True)
    format = Column(Enum(FileFormat), nullable=False, )

    document_group = relationship("DocumentGroupORM", back_populates="document")
