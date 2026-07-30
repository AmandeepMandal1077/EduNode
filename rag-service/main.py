import os
import asyncio
from dotenv import load_dotenv
load_dotenv()

from debug import debug

import boto3
from fastapi import FastAPI, requests
from httpx import Request
import httpx

from ingestion import ingest
from retrieval import query
from req_schemas import IngestData, QueryRequest

AWS_REGION = os.getenv("AWS_REGION", "ap-south-1")
AWS_ACCESS_KEY_ID = os.getenv("AWS_ACCESS_KEY_ID")
AWS_SECRET_ACCESS_KEY = os.getenv("AWS_SECRET_ACCESS_KEY")
S3_BUCKET_NAME = os.getenv("S3_BUCKET_NAME")

s3_client = boto3.client(
    "s3",
    region_name=AWS_REGION,
    aws_access_key_id=AWS_ACCESS_KEY_ID,
    aws_secret_access_key=AWS_SECRET_ACCESS_KEY,
)


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
    # Download video file from S3 asynchronously
    await asyncio.to_thread(s3_client.download_file, S3_BUCKET_NAME, data.resource_url, video_path)

    await ingest(data)
  finally:
    # Clean up temporary video and transcription files to avoid disk leaks
    for path in (video_path, transcript_path):
      try:
        if os.path.exists(path):
          os.remove(path)
      except Exception as e:
        debug(f"Error removing temporary file {path}: {e}")

  return {
    "message": "Ingestion completed successfully",
  }

@app.post("/chat/{course_id}/{lecture_id}")
async def queryLectures(course_id: str, lecture_id: str, data: QueryRequest):
  return {
    "message": str(await query(course_id, lecture_id, data))
  }
