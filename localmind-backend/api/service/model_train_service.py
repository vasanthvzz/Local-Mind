
import logging
from api.config import settings
from db.repository.document_repo import DocumentRepo
from api.service.file_storage_service import FileStorageService
from db.schema.enums import FileFormat

import httpx
import uuid
import os
import asyncio

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class ModelTrainService:
    def __init__(self, db):
        self.document_repo = DocumentRepo(db)
        self.file_storage_service = FileStorageService()
        if not os.path.exists(settings.VECTOR_DB_DIR):
            os.makedirs(settings.VECTOR_DB_DIR)
        
        try:
            import chromadb
            self.chroma_client = chromadb.PersistentClient(path=settings.VECTOR_DB_DIR)
            self.collection = self.chroma_client.get_or_create_collection(
                name="localmind_rag",
                metadata={"hnsw:space": "cosine"}
            )
        except ImportError:
            self.chroma_client = None
            self.collection = None
            logger.error("ChromaDB not installed or failed to import. RAG features will not work.")

        try:
            from langchain_text_splitters import RecursiveCharacterTextSplitter
            self.splitter = RecursiveCharacterTextSplitter(
                chunk_size=settings.CHUNK_SIZE,
                chunk_overlap=settings.CHUNK_OVERLAP,
                length_function=len,
                is_separator_regex=False,
            )
        except ImportError:
            self.splitter = None
            logger.warning("LangChain text splitters not found.")

    async def train_model(self,document_id):
        logger.info("Starting model training (indexing documents)...")
        
        # 1. Get all documents from the database
        documents = self.document_repo.get_document_by_group(document_id)
        if not documents:
            logger.info("No documents found to index.")
            return {"status": "success", "message": "No documents to index"}
        
        logger.info(f"Found {len(documents)} documents to process.")
        
        processed_count = 0
        
        # 2. Iterate and process each document
        for doc in documents:
            try:
                # 3. Read content
                # FileStorageService saves files with just the ID as name (no extension usually, or with?)
                # Looking at FileStorageService.store_file, it uses file_id directly.
                file_path = self.file_storage_service.get_file_path(str(doc.id))
                
                if not file_path.exists():
                    logger.warning(f"File not found for document {doc.id}: {file_path}")
                    continue
                
                content = self._read_file_content(file_path, doc.format.value)
                
                if not content.strip():
                    logger.warning(f"Document {doc.id} is empty or unreadable (format: {doc.format}).")
                    continue

                # 4. Chunk content
                chunks = self._chunk_text(content)
                logger.info(f"Document {doc.name} split into {len(chunks)} chunks.")
                
                if not chunks:
                    continue
                
                # 5. Embed and store
                # 5. Embed and store
                ids = [f"{doc.id}_{i}" for i in range(len(chunks))]
                metadatas = [{"document_id": str(doc.id), "source": doc.name} for _ in chunks]
                
                embeddings = []
                # Fetch embeddings from Ollama in parallel with a concurrency limit
                sem = asyncio.Semaphore(25)  # Limit to 15 concurrent requests for 6800XT

                async def get_embedding_with_limit(chunk, client):
                    async with sem:
                        return await self._get_embedding(chunk, client)

                try:
                    async with httpx.AsyncClient(timeout=60.0) as client:
                        tasks = [get_embedding_with_limit(chunk, client) for chunk in chunks]
                        results = await asyncio.gather(*tasks)
                        
                        for i, emb in enumerate(results):
                            if emb:
                                embeddings.append(emb)
                            else:
                                logger.error(f"Failed to get embedding for chunk {i} in {doc.name}")
                except Exception as e:
                     logger.error(f"Error during parallel embedding fetching: {e}")
                     continue

                if len(embeddings) != len(ids):
                    logger.error(f"Mismatch in embeddings count for {doc.name}. Skipping upsert.")
                    continue

                # 6. Upsert to Chroma
                self.collection.upsert(
                    ids=ids,
                    documents=chunks,
                    embeddings=embeddings,
                    metadatas=metadatas
                )
                processed_count += 1
                logger.info(f"Indexed document: {doc.name}")

            except Exception as e:
                logger.error(f"Error processing document {doc.id}: {e}")
                continue
                
        logger.info(f"Model training complete. Processed {processed_count}/{len(documents)} documents.")
        return {"status": "success", "processed": processed_count, "total": len(documents)}

    def _read_file_content(self, file_path: str, file_format: str) -> str:
        if file_format == FileFormat.TXT.value:
            with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                return f.read()
        elif file_format == FileFormat.PDF.value:
            try:
                import pypdf
                reader = pypdf.PdfReader(file_path)
                text = ""
                for page in reader.pages:
                    text += page.extract_text() + "\n"
                return text
            except ImportError:
                 logger.warning("pypdf not installed. Cannot read PDF. returning empty.")
                 return ""
            except Exception as e:
                 logger.error(f"Error reading PDF: {e}")
                 return ""

        try:
            with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                return f.read()
        except:
            return ""

    def _chunk_text(self, text: str) -> list[str]:
        if self.splitter:
            return self.splitter.split_text(text)
        
        logger.warning("Splitter not initialized. Returning empty list.")
        return []   

    async def _get_embedding(self, text: str, client: httpx.AsyncClient = None):
        try:
            if client:
                response = await client.post(
                    f"{settings.LLM_BASE_URL}/api/embeddings",
                    json={
                        "model": settings.EMBEDDING_MODEL,
                        "prompt": text
                    }
                )
            else:
                async with httpx.AsyncClient(timeout=30.0) as async_client:
                    response = await async_client.post(
                        f"{settings.LLM_BASE_URL}/api/embeddings",
                        json={
                            "model": settings.EMBEDDING_MODEL,
                            "prompt": text
                        }
                    )
            
            response.raise_for_status()
            data = response.json()
            return data.get("embedding")
        except Exception as e:
            logger.error(f"Embedding error: {e}")
            return None
