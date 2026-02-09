from db.database_adapter import SessionLocal, get_db
from db.schema import ConversationDocumentGroupORM
from db.schema.conversation import ConversationORM
from db.schema.enums import ConversationType


class ConversationRepo:

    def __init__(self,db):
        self.db_session = db

    def create_conversation(self, title: str = "title",conv_type : ConversationType = ConversationType.GENERAL):
        new_conversation = ConversationORM(title=title, conv_type= conv_type)
        self.db_session.add(new_conversation)
        self.db_session.commit()
        return new_conversation

    def get_all_conversation(self):
        return self.db_session.query(ConversationORM).all()

    def get_conversation_by_id(self,conversation_id) -> ConversationORM:
        return self.db_session.query(ConversationORM).filter_by(id=conversation_id).first()

    def delete_conversation(self, conversation_id):
        conversation = self.get_conversation_by_id(conversation_id)
        if conversation:
            self.db_session.delete(conversation)
            self.db_session.commit()
            return True
        return False

    def map_conversation_group(self,conversation_id,group_id):
        mapper = ConversationDocumentGroupORM(conversation_id=conversation_id,group_id=group_id)
        self.db_session.add(mapper)
        self.db_session.commit()    
