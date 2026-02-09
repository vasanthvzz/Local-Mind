from db.database_adapter import SessionLocal
from db.schema.message import MessageORM
from db.schema.enums import MessageSender

class MessageRepo:
    def __init__(self,db):
        self.db_session = db

    def get_message_by_id(self, message_id):
        return self.db_session.query(MessageORM).filter(MessageORM.id == message_id).one_or_none()

    def get_message_by_conversation(self, conversation_id):
        return self.db_session.query(MessageORM).filter(MessageORM.conversation_id == conversation_id).order_by(MessageORM.created_at).all()

    def create_message(self, conversation_id,message_text:str,role:MessageSender):
        message = MessageORM(conversation_id=conversation_id,text=message_text,sender=role)
        self.db_session.add(message)
        self.db_session.commit()
        return message
    
    def update_message(self, message_id: str, text: str):
        message_obj = self.get_message_by_id(message_id)
        if message_obj:
            message_obj.text = text
            self.db_session.commit()
            self.db_session.refresh(message_obj)
        return message_obj