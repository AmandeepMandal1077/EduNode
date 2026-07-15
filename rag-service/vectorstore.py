import os
from debug import debug

from langchain_ollama import OllamaEmbeddings

ollama_base_url = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")

embedding_model = os.environ.get("OLLAMA_EMBEDDING_MODEL")
embeddings = OllamaEmbeddings(
    model=embedding_model,
)

PYTHON_ENV = os.environ.get("PYTHON_ENV", "development")

if PYTHON_ENV == "development":
    from langchain_chroma import Chroma

    vector_store = Chroma(
        embedding_function=embeddings,
        collection_name="test",
        persist_directory="./chroma_db",
    )
    debug("Using ChromaDB (development)")
else:
    from langchain_qdrant import QdrantVectorStore

    vector_store = QdrantVectorStore.from_existing_collection(
        embedding=embeddings,
        collection_name="my_docs",
        url=os.environ["QDRANT_URL"],
        api_key=os.environ["QDRANT_API_KEY"],
    )
    debug("Using Qdrant (production)")
