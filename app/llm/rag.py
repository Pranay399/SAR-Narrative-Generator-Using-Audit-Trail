import os
import chromadb
from llama_index.core import VectorStoreIndex, SimpleDirectoryReader, StorageContext
from llama_index.vector_stores.chroma import ChromaVectorStore
from llama_index.embeddings.ollama import OllamaEmbedding
from app.core.config import settings

def initialize_rag_pipeline(docs_dir: str = "data/guidelines"):
    """
    Sets up the RAG pipeline using LlamaIndex and ChromaDB to parse 
    KYC Policies and RBI Initiatives.
    """
    # Initialize Chroma Database Client
    db = chromadb.PersistentClient(path="./chroma_db")
    chroma_collection = db.get_or_create_collection("aml_guidelines")
    
    # Associate Chroma with LlamaIndex
    vector_store = ChromaVectorStore(chroma_collection=chroma_collection)
    storage_context = StorageContext.from_defaults(vector_store=vector_store)
    
    # Set up Ollama Embedding (using standard nomic-embed-text for efficiency)
    embed_model = OllamaEmbedding(model_name="nomic-embed-text", base_url=settings.OLLAMA_BASE_URL)
    
    # Store settings globally for llama index if needed
    from llama_index.core import Settings as LlamaSettings
    LlamaSettings.embed_model = embed_model
    
    # Indexing (If guidelines exist)
    if os.path.exists(docs_dir) and os.listdir(docs_dir):
        documents = SimpleDirectoryReader(docs_dir).load_data()
        index = VectorStoreIndex.from_documents(
            documents, storage_context=storage_context
        )
    else:
        # Load from existing if no new documents are present
        index = VectorStoreIndex.from_vector_store(
            vector_store
        )
        
    return index

def retrieve_aml_context(query: str, index) -> str:
    """Retrieves relevant AML guidelines based on the query."""
    retriever = index.as_retriever(similarity_top_k=3)
    nodes = retriever.retrieve(query)
    context = "\n\n".join([n.get_content() for n in nodes])
    return context
