from pydantic import BaseModel

class IngestData(BaseModel):
  resource_url: str
  course_id: str
  lecture_id: str

class QueryRequest(BaseModel):
  question: str
  include_context: bool = False