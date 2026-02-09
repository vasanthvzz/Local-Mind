from datetime import datetime
from typing import Any

import sqlalchemy

from db.database_adapter import SessionLocal
from db.schema.document_group import DocumentGroupORM
from db.schema.conv_doc_group import ConversationDocumentGroupORM



class DocumentGroupRepo:
    def __init__(self,db):
        self.db_session = db

    def create_document_group(self, title: str = "title"):
        try:
            new_document = DocumentGroupORM(name=title)
            self.db_session.add(new_document)
            self.db_session.commit()
            return new_document
        except Exception as e:
            print(e)

    def get_all_document_groups(self) -> list[DocumentGroupORM] | None:
        try:
            all_documents = self.db_session.query(DocumentGroupORM).all()
            return all_documents
        except Exception as e:
            print(e)

    def get_document_group(self, document_id):
        try:
            return self.db_session.query(DocumentGroupORM).filter(DocumentGroupORM.id == document_id).one_or_none()
        except Exception as e:
            print(e)

    def get_document_group_by_conversation_id(self, conversation_id):
        try:
            mapper =  self.db_session.query(ConversationDocumentGroupORM).filter(ConversationDocumentGroupORM.conversation_id == conversation_id).all()
            result = []
            for i in mapper:
                result.append(self.db_session.query(DocumentGroupORM).filter(DocumentGroupORM.id == i.group_id).first())
            return result
        except Exception as e:
            print(e)

    def update_document_uploaded(self,group_id):
        try:
            group = self.db_session.query(DocumentGroupORM).filter(DocumentGroupORM.id == group_id).one_or_none()
            group.updated_at = datetime.now()
            self.db_session.commit()
            return group
        except Exception as e:
            print(e)

    def is_augmented(self,group_id)->bool | None:
        try:
            group = self.db_session.query(DocumentGroupORM).filter(DocumentGroupORM.id == group_id).one_or_none()
            return group.updated_at < group.last_trained
        except Exception as e:
            print(e)

    def update_document_trained(self,group_id):
        try:
            group = self.db_session.query(DocumentGroupORM).filter(DocumentGroupORM.id == group_id).one_or_none()
            group.last_trained = datetime.now()
            self.db_session.commit()
            return group
        except Exception as e:
            print(e)    