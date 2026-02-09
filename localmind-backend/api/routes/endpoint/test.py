import asyncio

from fastapi import APIRouter
from starlette.responses import StreamingResponse

router = APIRouter()

@router.post("/{conversation_id}/message")
async def test_func(conversation_id : str):
    async def generate_stream():
        for i in range(1, 11):
            yield f"{i}\n"
            await asyncio.sleep(0.5)

    return StreamingResponse(
        generate_stream(),
        media_type="text/plain"
    )