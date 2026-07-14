import os
import asyncio
from dotenv import load_dotenv
load_dotenv()

# Silence all print() output in production
if os.getenv("PYTHON_ENV") == "production":
    import builtins
    builtins.print = lambda *args, **kwargs: None

import urllib
import urllib.request
from fastapi import FastAPI, requests
from httpx import Request
import httpx

from ingestion import ingest
from retrieval import query
from req_schemas import IngestData, QueryRequest


app = FastAPI()

@app.get("/health")
async def root():
  
  return {"message": "Running"}

@app.post("/ingest")
async def ingest_video(data: IngestData):
  # Ensure target directories exist
  os.makedirs("videos", exist_ok=True)
  os.makedirs("transcribe", exist_ok=True)

  slug = f"{data.course_id}_{data.lecture_id}"
  video_path = f"videos/test_{slug}.mp4"
  transcript_path = f"transcribe/test_{slug}.txt"

  try:
    # Download video file asynchronously
    await asyncio.to_thread(urllib.request.urlretrieve, data.resource_url, video_path)
    
    await ingest(data)
    
    async with httpx.AsyncClient() as client:
      backend_url = os.getenv("BACKEND_URL")
      await client.post(
        f"{backend_url}/api/v1/internal-rag/vectordb-processed",
        json={
          "course_id": data.course_id,
          "lecture_id": data.lecture_id
        },
        timeout=None
      )
  finally:
    # Clean up temporary video and transcription files to avoid disk leaks
    for path in (video_path, transcript_path):
      try:
        if os.path.exists(path):
          os.remove(path)
      except Exception as e:
        print(f"Error removing temporary file {path}: {e}")

  return {
    "message": "Ingestion completed successfully",
  }

@app.post("/chat/{course_id}/{lecture_id}")
async def queryLectures(course_id: str, lecture_id: str, data: QueryRequest):
  return {
    "message": str(await query(course_id, lecture_id, data))
  }
