import glob
import os
import asyncio
from dotenv import load_dotenv
load_dotenv()

from debug import debug

from fastapi import BackgroundTasks, FastAPI, HTTPException

from ingest_status import get_status, set_status
from ingestion import ingest
from retrieval import query
from req_schemas import IngestData, QueryRequest
from storage.factory import get_storage
from vectorstore import delete_lecture_vectors


app = FastAPI()


def _temp_paths(slug: str) -> tuple[str, str]:
  return f"videos/test_{slug}.mp4", f"transcribe/test_{slug}.txt"


def _remove_temp_files(lecture_id: str) -> None:
  # The slug also contains the course id, so match it instead of rebuilding it.
  patterns = (
    f"videos/test_*_{lecture_id}.mp4",
    f"transcribe/test_*_{lecture_id}.txt",
  )
  for pattern in patterns:
    for path in glob.glob(pattern):
      try:
        os.remove(path)
      except Exception as e:
        debug(f"Error removing temporary file {path}: {e}")


async def _run_ingest(data: IngestData):
  video_path, _ = _temp_paths(f"{data.course_id}_{data.lecture_id}")

  try:
    await asyncio.to_thread(
      get_storage().download_file, data.resource_url, video_path
    )

    await ingest(data)

    # ingest() returns early when a cleanup request already marked it failed.
    if get_status(data.lecture_id) != "failed":
      set_status(data.lecture_id, "completed")
  except Exception as e:
    debug(f"Ingestion failed for lecture {data.lecture_id}: {e}")
    set_status(data.lecture_id, "failed")
  finally:
    _remove_temp_files(data.lecture_id)

    if get_status(data.lecture_id) == "failed":
      # Vectors may have been stored before a cleanup request landed.
      delete_lecture_vectors(data.lecture_id)


@app.get("/health")
async def root():
  
  return {"message": "Running"}

@app.post("/ingest", status_code=202)
async def ingest_video(data: IngestData, background: BackgroundTasks):
  # Set before returning so the worker's first status check cannot see a 404.
  set_status(data.lecture_id, "processing")
  background.add_task(_run_ingest, data)

  return {"status": "processing"}

@app.get("/ingest/{lecture_id}")
async def ingest_status(lecture_id: str):
  status = get_status(lecture_id)
  if status is None:
    raise HTTPException(status_code=404, detail="No ingestion job for this lecture")
  return {"status": status}

@app.delete("/ingest/{lecture_id}")
async def ingest_cleanup(lecture_id: str):
  set_status(lecture_id, "failed")
  delete_lecture_vectors(lecture_id)
  _remove_temp_files(lecture_id)
  return {"status": "failed"}

@app.post("/chat/{course_id}/{lecture_id}")
async def queryLectures(course_id: str, lecture_id: str, data: QueryRequest):
  return {
    "message": str(await query(course_id, lecture_id, data))
  }
