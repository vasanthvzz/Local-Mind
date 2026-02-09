from uuid import UUID
from db.database_adapter import SessionLocal
from db.schema.document import DocumentORM
from db.schema.enums import FileFormat


class DocumentRepo:
    def __init__(self,db):
        self.db_session = db

    def upload_document(self,document_id:UUID,group_id:UUID,file_name:str,path:str,file_format:FileFormat):
        self.db_session.add(DocumentORM(name=file_name,id=document_id,group_id=group_id,path=path,format=file_format))
        self.db_session.commit()

    def delete_document(self,document_id : UUID):
        document = self.db_session.get(DocumentORM,document_id)
        self.db_session.delete(document)
        self.db_session.commit()

    def get_document_by_group(self,group_id):
        return self.db_session.query(DocumentORM).filter(DocumentORM.group_id == group_id).all()