from db.database_adapter import Base  # Import Base first

# Import all models in the correct order
from db.schema.conversation import ConversationORM
from db.schema.document_group import DocumentGroupORM
from db.schema.conv_doc_group import ConversationDocumentGroupORM
from db.schema.document import DocumentORM
from db.schema.message import MessageORM

# Ensure all models are available before any operations
__all__ = [
    'Base',
    'ConversationORM',
    'DocumentGroupORM',
    'ConversationDocumentGroupORM',
    'DocumentORM',
    'MessageORM'
]