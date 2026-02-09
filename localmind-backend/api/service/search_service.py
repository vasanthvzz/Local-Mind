import os
import logging
import httpx
import chromadb
from api.config import settings
from db.repository.document_repo import DocumentRepo
from db.repository.document_group_repo import DocumentGroupRepo
from flashrank import Ranker, RerankRequest

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class SearchService:
    def __init__(self, db):
        self.document_repo = DocumentRepo(db)
        self.document_group_repo = DocumentGroupRepo(db)
        
        if not os.path.exists(settings.VECTOR_DB_DIR):
            os.makedirs(settings.VECTOR_DB_DIR)
        
        try:
            self.chroma_client = chromadb.PersistentClient(path=settings.VECTOR_DB_DIR)
            self.collection = self.chroma_client.get_or_create_collection(
                name="localmind_rag",
                metadata={"hnsw:space": "cosine"}
            )
        except Exception as e:
            logger.error(f"Error initializing ChromaDB: {e}")
            self.chroma_client = None
            self.collection = None
        
        try:
             self.ranker = Ranker()
        except Exception as e:
             logger.error(f"Error initializing FlashRank: {e}")
             self.ranker = None

    async def search(self, query: str, conversation_id: str, n_results: int = 5):
        """
        Search for relevant document chunks for a given query within the context 
        of a conversation's assigned document groups.
        """
        if not self.collection:
            logger.warning("ChromaDB collection not available.")
            return []

        # 1. Get document groups assigned to this conversation
        # Note: This relies on the method you added to DocumentGroupRepo
        document_groups = self.document_group_repo.get_document_group_by_conversation_id(conversation_id)
        
        if not document_groups:
            logger.info(f"No document groups found for conversation {conversation_id}")
            return []

        # 2. Collect all valid document IDs from these groups
        allowed_doc_ids = []
        for group in document_groups:
            # We assume get_document_by_group returns a list of objects with an 'id' attribute
            docs = self.document_repo.get_document_by_group(group.id)
            for doc in docs:
                allowed_doc_ids.append(str(doc.id))
        
        # If no documents are in the groups, return empty
        if not allowed_doc_ids:
            logger.info("No documents found in the assigned groups.")
            return []
        
        # 3. Generate embedding for the query
        query_embedding = await self._get_embedding(query)
        if not query_embedding:
            logger.warning("Failed to generate query embedding.")
            return []

        # 4. Query ChromaDB with filtering
        # We filter by document_id being in our allowed list
        try:
            # RETRIEVAL PHASE
            # We fetch MORE candidates than requested (e.g. 3x) to give the reranker enough options
            retrieval_limit = n_results * 3
            
            results = self.collection.query(
                query_embeddings=[query_embedding],
                n_results=retrieval_limit,
                where={"document_id": {"$in": allowed_doc_ids}}
            )
            
            initial_results = []
            
            if results and results['documents']:
                num_matches = len(results['documents'][0])
                for i in range(num_matches):
                    # We skip the static distance check here because the Re-ranker is much smarter
                    item = {
                        "id": results['ids'][0][i],
                        "text": results['documents'][0][i],
                        "meta": results['metadatas'][0][i] if results['metadatas'] else {},
                        # Flatten metadata for FlashRank if needed, but it accepts a dict 'meta'
                    }
                    initial_results.append(item)
            
            if not initial_results:
                return []

            # RERANKING PHASE
            if self.ranker:
                logger.info(f"Reranking {len(initial_results)} documents...")
                rerank_request = RerankRequest(query=query, passages=initial_results)
                reranked_results = self.ranker.rerank(rerank_request)
                
                # Sort by score descending (FlashRank usually does this, but good to be safe)
                # FlashRank returns dicts with 'score' key
                # We limit to the original requested n_results
                final_output = []
                for res in reranked_results[:n_results]:
                     final_output.append({
                         "content": res['text'],
                         "metadata": res['meta'],
                         "id": res['id'],
                         "score": res['score']
                     })
                return final_output
            
            else:
                # Fallback if ranker failed to load
                fallback_output = []
                for item in initial_results[:n_results]:
                    fallback_output.append({
                        "content": item['text'],
                        "metadata": item['meta'],
                        "id": item['id']
                    })
                return fallback_output

        except Exception as e:
            logger.error(f"Error querying ChromaDB: {e}")
            return []

    async def _get_embedding(self, text: str):
        """
        Generates an embedding for the given text using the configured LLM service.
        """
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(
                    f"{settings.LLM_BASE_URL}/api/embeddings",
                    json={
                        "model": settings.EMBEDDING_MODEL,
                        "prompt": text
                    }
                )
                
                if response.status_code != 200:
                    logger.error(f"Embedding API error: {response.text}")
                    return None
                    
                data = response.json()
                return data.get("embedding")
        except Exception as e:
            logger.error(f"Error generating embedding: {e}")
            return None