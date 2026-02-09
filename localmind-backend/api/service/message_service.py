from db.repository.message_repo import MessageRepo
from db.schema.enums import MessageSender


class MessageService:
    def __init__(self,db):
        self.db = db
        self.message_repo = MessageRepo(db)

    def create_message(self,conversation_id : str, message : str, role : MessageSender):
        message = self.message_repo.create_message(conversation_id,message,role)
        return message

    def get_message_by_id(self,message_id : str):
        return self.message_repo.get_message_by_id(message_id)

    def get_message_by_conversation(self,conversation_id : str):
        return self.message_repo.get_message_by_conversation(conversation_id)

    def update_message(self, message_id: str, text: str):
        return self.message_repo.update_message(message_id, text)