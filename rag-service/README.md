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
   - Generates text embeddings with Ollama in development (`nomic-embed-text:v1.5`, 768 dims) and Gemini in production (`gemini-embedding-001`, 3072 dims).
   - Injects the text chunks along with metadata (`course_id` and `lecture_id`) into the vector database.
   - **Development**: Persists chunks locally using ChromaDB in the `./chroma_db` directory.
   - **Production**: Stores chunks remotely using Qdrant.
6. **Callback**: Invokes a callback to the backend service `/api/v1/internal-rag/vectordb-processed` to mark the vector processing as completed.

### Query Pipeline

1. **Query**: The client asks a question about a lecture via the backend, which proxies the query to `/chat/{course_id}/{lecture_id}`.
2. **Similarity Search**: Performs a semantic similarity search against the vector database, fetching the top 5 most relevant document chunks filtered specifically by the requested `course_id` and `lecture_id`.
3. **Prompt Generation**: Construct a structured prompt using a LangChain `ChatPromptTemplate` that strictly enforces answering from the retrieved context without using prior/general knowledge.
4. **LLM Generation**: Queries the Google Gemini API (`ChatGoogleGenerativeAI`, e.g. `gemini-3.5-flash`) to synthesize the teaching assistant answer and returns the text response to the backend.

---

## Endpoints

| Endpoint                         | Method | Payload             | Description                                            |
| -------------------------------- | ------ | ------------------- | ------------------------------------------------------ |
| `/health`                        | GET    | None                | Health check endpoint returning service status         |
| `/ingest`                        | POST   | `IngestData` JSON   | Downloads, transcribes, and vectorizes a lecture video |
| `/chat/{course_id}/{lecture_id}` | POST   | `QueryRequest` JSON | Queries the database and LLM for context-based answers |

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
├── model.py                # ChatGoogleGenerativeAI (Gemini) model configuration
├── req_schemas.py          # Pydantic data schemas
└── requirements.txt        # Python package dependencies
```

---

## Configuration

The service uses the following environment variables:

| Variable                 | Description                                                                                  |
| ------------------------ | -------------------------------------------------------------------------------------------- |
| `PYTHON_PORT`            | The port the FastAPI server listens on (defaults to `8000`)                                  |
| `PYTHON_ENV`             | Environment identifier. Set to `development` to use local ChromaDB, otherwise Qdrant is used |
| `BACKEND_URL`            | Base URL of the backend API (for callback notifications)                                     |
| `GEMINI_API_KEY`         | (or `GOOGLE_API_KEY`) API Key for Google Gemini API                                          |
| `GEMINI_MODEL`           | Gemini model name (defaults to `gemini-1.5-flash`)                                           |
| `GEMINI_EMBEDDING_MODEL` | Gemini embedding model, production only (defaults to `gemini-embedding-001`)                 |
| `OLLAMA_BASE_URL`        | Development embeddings endpoint (defaults to `http://host.docker.internal:11434`)            |
| `OLLAMA_EMBEDDING_MODEL` | Development embeddings model (defaults to `nomic-embed-text:v1.5`)                           |
| `QDRANT_URL`             | URL of the Qdrant instance (used in production)                                              |
| `QDRANT_API_KEY`         | API Key for Qdrant database (used in production)                                             |
| `LANGCHAIN_API_KEY`      | (Optional) API key for LangSmith tracing                                                     |
| `LANGCHAIN_PROJECT`      | (Optional) LangSmith project identifier                                                      |
| `LANGCHAIN_TRACING_V2`   | (Optional) Flag to toggle LangSmith tracing (`true`/`false`)                                 |

---

## Running the Service

### Using Docker Compose

To spin up the FastAPI RAG service:

```bash
docker compose -f docker-compose.rag.yml up --build -d
```

The FastAPI documentation will be available locally at `http://localhost:8000/docs`.
