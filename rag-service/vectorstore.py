import os

from debug import debug

PYTHON_ENV = os.environ.get("PYTHON_ENV", "development")

if PYTHON_ENV == "development":
    from langchain_chroma import Chroma
    from langchain_community.embeddings import OllamaEmbeddings

    # Local Ollama (nomic-embed-text = 768 dims) keeps dev off paid APIs.
    # shortcut: langchain_community is deprecated; swap to langchain-ollama on LangChain 1.0.
    embeddings = OllamaEmbeddings(
        model=os.getenv("OLLAMA_EMBEDDING_MODEL", "nomic-embed-text:v1.5"),
        base_url=os.getenv("OLLAMA_BASE_URL", "http://host.docker.internal:11434"),
    )

    vector_store = Chroma(
        embedding_function=embeddings,
        collection_name="test",
        persist_directory="./chroma_db",
    )
    debug("Using ChromaDB + Ollama embeddings (development)")
else:
    from langchain_google_genai import GoogleGenerativeAIEmbeddings
    from langchain_qdrant import QdrantVectorStore

    # gemini-embedding-001 defaults to 3072 dims. The Qdrant collection must be
    # created with the same size; changing this model requires re-indexing.
    embeddings = GoogleGenerativeAIEmbeddings(
        model=os.getenv("GEMINI_EMBEDDING_MODEL", "gemini-embedding-001"),
        google_api_key=os.getenv("GEMINI_API_KEY"),
    )

    vector_store = QdrantVectorStore.from_existing_collection(
        embedding=embeddings,
        collection_name="my_docs",
        url=os.environ["QDRANT_URL"],
        api_key=os.environ["QDRANT_API_KEY"],
    )
    debug("Using Qdrant + Gemini embeddings (production)")


def delete_lecture_vectors(lecture_id: str) -> None:
    """Removes every chunk of a lecture, used when ingestion fails or is cleaned up."""
    if PYTHON_ENV == "development":
        vector_store.delete(where={"lecture_id": lecture_id})
        return

    from qdrant_client.models import FieldCondition, Filter, MatchValue

    # langchain_qdrant nests document metadata under "metadata" in the payload.
    vector_store.client.delete(
        collection_name=vector_store.collection_name,
        points_selector=Filter(
            must=[
                FieldCondition(
                    key="metadata.lecture_id",
                    match=MatchValue(value=lecture_id),
                )
            ]
        ),
    )
