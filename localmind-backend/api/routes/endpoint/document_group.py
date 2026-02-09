from fastapi import APIRouter, Depends

from api.model.response_model import DocumentGroupResponse
from api.service.document_group_service import DocumentGroupService
from api.service.document_service import DocumentService
from db.database_adapter import get_db
from db.schema.document_group import DocumentGroupORM
from api.service.model_train_service import ModelTrainService

router = APIRouter()


@router.get("/groups")
async def get_document_groups(db=Depends(get_db)):
    service = DocumentGroupService(db)
    return service.get_all_document_groups()

@router.get("/{group_id}/documents")
async def get_document_group(group_id: str,db=Depends(get_db)):
    service = DocumentService(db)
    return service.get_document_by_group(group_id)


@router.post("/new/{group_name}", response_model=DocumentGroupResponse)
async def create_document_group(group_name: str,db=Depends(get_db)):
    service = DocumentGroupService(db)
    return service.create_document_group(group_name)


@router.post("/{group_id}/train")
async def train_document_group(group_id: str,db=Depends(get_db)):
    service = ModelTrainService(db)
    return await service.train_model(group_id)
