# EduNode — Retrieval-Augmented Generation (RAG) Service

A FastAPI-based microservice that handles transcription of lecture videos and provides retrieval-augmented chat generation for course lectures.

This service is internal and acts as a specialized backend service for processing media text transcripts and answering context-specific student questions.

---

## Core Flow

This service exposes endpoints used by the main application backend and the background media worker:

### Ingestion Pipeline
1. **Trigger**: The background media worker finishes processing video segments and triggers `/ingest` on this service.
2. **Download**: The service retrieves the video file from the provided S3 resource URL.
3. **Transcription**: transcribes the audio from the video using `faster-whisper` (utilizing the Whisper "base" model running on CPU).
4. **Text Splitting**: Splits the generated text transcripts into chunks (chunk size of 1000 characters, overlap of 200) using LangChain's `RecursiveCharacterTextSplitter`.
5. **Vector Store Injection**:
   - Generates text embeddings using Ollama (`embeddinggemma:latest` model).
   - Injects the text chunks along with metadata (`course_id` and `lecture_id`) into the vector database.
   - **Development**: Persists chunks locally using ChromaDB in the `./chroma_db` directory.
   - **Production**: Stores chunks remotely using Qdrant.
6. **Callback**: Invokes a callback to the backend service `/api/v1/internal-rag/vectordb-processed` to mark the vector processing as completed.

### Query Pipeline
1. **Query**: The client asks a question about a lecture via the backend, which proxies the query to `/chat/{course_id}/{lecture_id}`.
2. **Similarity Search**: Performs a semantic similarity search against the vector database, fetching the top 5 most relevant document chunks filtered specifically by the requested `course_id` and `lecture_id`.
3. **Prompt Generation**: Construct a structured prompt using a LangChain `ChatPromptTemplate` that strictly enforces answering from the retrieved context without using prior/general knowledge.
4. **LLM Generation**: Queries the local Ollama LLM (`gpt-oss:20b-cloud` model) to synthesize the teaching assistant answer and returns the text response to the backend.

---

## Endpoints

| Endpoint | Method | Payload | Description |
|---|---|---|---|
| `/health` | GET | None | Health check endpoint returning service status |
| `/ingest` | POST | `IngestData` JSON | Downloads, transcribes, and vectorizes a lecture video |
| `/chat/{course_id}/{lecture_id}` | POST | `QueryRequest` JSON | Queries the database and LLM for context-based answers |

---

## Directory Structure

```
rag-service/
├── docker-compose.rag.yml  # Standalone Docker Compose configuration
├── Dockerfile              # Container definition for FastAPI app
├── main.py                 # FastAPI router and main endpoint definitions
├── ingestion.py            # Whisper transcription and chunking logic
├── retrieval.py            # Vector retriever and LLM prompt generation
├── vectorstore.py          # Vector database client selector (ChromaDB / Qdrant)
├── model.py                # ChatOllama model configuration
├── req_schemas.py          # Pydantic data schemas
└── requirements.txt        # Python package dependencies
```

---

## Configuration

The service uses the following environment variables:

| Variable | Description |
|---|---|
| `PYTHON_PORT` | The port the FastAPI server listens on (defaults to `8000`) |
| `PYTHON_ENV` | Environment identifier. Set to `development` to use local ChromaDB, otherwise Qdrant is used |
| `BACKEND_URL` | Base URL of the backend API (for callback notifications) |
| `OLLAMA_BASE_URL` | Base URL for the Ollama server (defaults to `http://localhost:11434`) |
| `OLLAMA_API_KEY` | Authentication key for Ollama endpoints |
| `QDRANT_URL` | URL of the Qdrant instance (used in production) |
| `QDRANT_API_KEY` | API Key for Qdrant database (used in production) |
| `LANGCHAIN_API_KEY` | (Optional) API key for LangSmith tracing |
| `LANGCHAIN_PROJECT` | (Optional) LangSmith project identifier |
| `LANGCHAIN_TRACING_V2` | (Optional) Flag to toggle LangSmith tracing (`true`/`false`) |

---

## Running the Service

### Using Docker Compose
To spin up both the FastAPI RAG service and the Ollama dependency service:

```bash
docker compose -f docker-compose.rag.yml up --build -d
```

The FastAPI documentation will be available locally at `http://localhost:8000/docs`.

### Downloading Ollama Models
Once the containers are running, you must download the embedding and LLM models inside the Ollama container for the service to work:

```bash
# Pull the embedding model
docker exec -it $(docker ps -q -f name=ollama) ollama pull embeddinggemma:latest

# Pull the LLM model
docker exec -it $(docker ps -q -f name=ollama) ollama pull gpt-oss:20b-cloud
```
