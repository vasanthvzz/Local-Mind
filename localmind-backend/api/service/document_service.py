from fastapi import UploadFile,HTTPException
from api.service.file_storage_service import FileStorageService
from db.repository.document_group_repo import DocumentGroupRepo
from db.repository.document_repo import DocumentRepo
from uuid import uuid4, UUID
from api.model.response_model import DocumentRead

from db.schema.enums import FileFormat


class DocumentService:
    def __init__(self,db):
        self.file_storage_service = FileStorageService()
        self.document_repo = DocumentRepo(db)
        self.document_group_repo = DocumentGroupRepo(db)

    def get_document_by_group(self,group_id):
        try:
            result = []
            for doc in self.document_repo.get_document_by_group(group_id):
                result.append(DocumentRead.model_validate(doc))
            return result
        except Exception as e:
            print(e)

    def delete_document(self,document_id):
        try:
            self.document_repo.delete_document(UUID(document_id))
            self.file_storage_service.delete_document(document_id)
        except Exception as e:
            print(e)

    async def create_document(self,group_id:UUID,file : UploadFile):
        try:
            document_id = uuid4()
            if await self.file_storage_service.store_file(str(document_id), file):
                path = "/storage/documents/"+str(document_id)
                filename = file.filename.split(".")[0]
                file_format = file.filename.split(".")[-1].lower()
                try:
                    format_enum = FileFormat(file_format)
                except ValueError:
                    raise HTTPException(
                        status_code=400,
                        detail=f"Unsupported file format: {file_format}. Supported: {[f.value for f in FileFormat]}"
                    )
                self.document_repo.upload_document(document_id,group_id,filename,path,format_enum)
                self.document_group_repo.update_document_uploaded(group_id)

        except Exception as e:
            print(e)

