from fastapi import UploadFile, HTTPException
import shutil
import os
from pathlib import Path
from api.config import settings

from sqlalchemy import true


class FileStorageService:
    def __init__(self):
        self.UPLOAD_DIR = Path(settings.DOCUMENTS_DIR)

    async def store_file(self,file_id:str,file:UploadFile):
        self.UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
        file_path = self.UPLOAD_DIR / file_id

        try:
            # Method 1: Using shutil (efficient for large files)
            with file_path.open("wb") as buffer:
                shutil.copyfileobj(file.file, buffer)

            # Method 2: Alternative - read all at once (simpler but uses more memory)
            # contents = await file.read()
            # with file_path.open("wb") as f:
            #     f.write(contents)

            return True

        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error uploading file: {str(e)}")
        finally:
            await file.close()

    def delete_document(self, document_id):
        file_path = self.UPLOAD_DIR / document_id
        try:
            if file_path.exists():
                file_path.unlink()
                return True

        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error deleting file: {str(e)}")
            return False

    def get_file_path(self, file_id: str) -> Path:
        return self.UPLOAD_DIR / file_id