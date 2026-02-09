from api.model.response_model import DocumentGroupResponse
from db.repository.document_group_repo import DocumentGroupRepo

class DocumentGroupService:
    def __init__(self,db):
        self.document_group_repo = DocumentGroupRepo(db)

    def get_all_document_groups(self):
        return self.document_group_repo.get_all_document_groups()

    def get_document_group(self,group_id):
        return self.document_group_repo.get_document_group(group_id)



    def create_document_group(self, group_name: str):
        orm_group = self.document_group_repo.create_document_group(group_name)
        return DocumentGroupResponse.model_validate(orm_group)

    def get_document_group_by_conversation_id(self, conversation_id):
        return self.document_group_repo.get_document_group_by_conversation_id(conversation_id)