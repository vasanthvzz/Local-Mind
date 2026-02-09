from uuid import UUID

from fastapi import APIRouter, UploadFile, File, HTTPException, Depends

from api.service.document_service import DocumentService
from db.database_adapter import get_db

router = APIRouter()


@router.post("/{group_id}/upload")
async def upload_document(group_id:str,file: UploadFile = File(...),db=Depends(get_db)):
    service = DocumentService(db)
    await service.create_document(UUID(group_id),file)


@router.delete("/{document_id}")
async def delete_document(document_id:str,db=Depends(get_db)):
    service = DocumentService(db)
    service.delete_document(document_id)
