from enum import Enum as PyEnum

class FileFormat(str, PyEnum):
    PDF = "pdf"
    TXT = "txt"
    DOC = "doc"
    DOCX = "docx"

class ConversationType(str, PyEnum):
    GENERAL = "general"
    RAG = "rag"
    STRICT_RAG = "strict_rag"

class MessageSender(str, PyEnum):
    ASSISTANT = "assistant",
    USER = "user"