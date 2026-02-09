from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api.routes.router import api_router
from db.database_adapter import Base, engine

Base.metadata.create_all(bind=engine)
app = FastAPI()


app.include_router(api_router, prefix="/api")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["x-message-id", "x-user-message-id", "x-assistant-message-id"],
)

