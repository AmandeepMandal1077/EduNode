import asyncio
from faster_whisper import WhisperModel
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.document_loaders import TextLoader
from req_schemas import IngestData
from vectorstore import vector_store
from langsmith import traceable


splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
text_extractor = WhisperModel("base", device="cpu")


@traceable(name="transcribe_video")
def transcribe_video(video_url: str, slug: str) -> str:
    print(f"Starting transcription for {video_url}...")
    segments, info = text_extractor.transcribe(video_url, language="en")

    print(f"Saving transcription for {video_url}...")
    file_path = f"transcribe/test_{slug}.txt"
    with open(file_path, "w") as f:
        for segment in segments:
            f.write(segment.text)
    
    return file_path

@traceable(name="load_and_split_documents")
def load_and_split_documents(file_path: str, course_id: str, lecture_id: str):
    loader = TextLoader(file_path)
    documents = loader.load()

    print(f"Splitting documents for {file_path}...")
    texts = splitter.split_documents(documents)
    for text in texts:
        text.metadata["course_id"] = course_id
        text.metadata["lecture_id"] = lecture_id
    
    return texts

@traceable(name="store_documents")
async def store_documents(texts, video_url: str):
    global vector_store
    print(f"Adding documents to vector store for {video_url}...")
    await vector_store.aadd_documents(texts)

@traceable(name="ingest_pipeline")
async def ingest(data: IngestData):
    slug = f"{data.course_id}_{data.lecture_id}"
    video_url = f"videos/test_{slug}.mp4"

    file_path = await asyncio.to_thread(transcribe_video, video_url, slug)
    texts = await asyncio.to_thread(load_and_split_documents, file_path, data.course_id, data.lecture_id)
    await store_documents(texts, video_url)

    print(f"Finished ingesting {video_url}")

