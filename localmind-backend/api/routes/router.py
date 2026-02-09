from fastapi import APIRouter
from api.routes.endpoint import conversation,document,document_group,test,chat

api_router = APIRouter()

api_router.include_router(
    conversation.router, prefix="/conversation", tags=["conversation"]
)

api_router.include_router(
    document.router, prefix="/document", tags=["document"]
)

api_router.include_router(
    document_group.router, prefix="/document_group", tags=["document_group"]
)

api_router.include_router(
    test.router, prefix="/test", tags=["test"]
)

api_router.include_router(
    chat.router, prefix="/chat", tags=["chat"]
)
# api_router.include_router(
#     query.router,
#     prefix="/query",
#     tags=["query"]
# )
#
# api_router.include_router(
#     conversation.router,
#     prefix="/conversation",
#     tags=["conversation"]
# )
#
