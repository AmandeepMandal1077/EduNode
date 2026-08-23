from langchain_core.prompts import ChatPromptTemplate
from pydantic import BaseModel
from req_schemas import QueryRequest
from vectorstore import vector_store
from model import gemini_llm
from langsmith import traceable
from debug import debug


class RAGResponse(BaseModel):
    answer: str


structured_llm = gemini_llm.with_structured_output(RAGResponse)


@traceable(name="query_pipeline")
async def query(course_id: str, lecture_id: str, data: QueryRequest):
    retriever = vector_store.as_retriever(
        search_type="similarity",
        search_kwargs={
            "k": 5,
            "filter": {
                "$and": [
                    {"course_id": course_id},
                    {"lecture_id": lecture_id},
                ]
            }
        }
    )

    def format_docs(docs):
        debug(f"Retrieved {len(docs)} documents for course_id={course_id}, lecture_id={lecture_id}.")
        debug("Context retrieved:")
        for i, doc in enumerate(docs):
            debug(f"Chunk {i+1}: {doc.page_content[:100]}...")
        return "\n\n".join(doc.page_content for doc in docs)

    prompt = ChatPromptTemplate.from_messages([
    (
        "system",
        """
        You are an AI Teaching Assistant for an online course.

        Don't point out towards lecture if information needed to answer is sufficient.

        Guidelines:
        1. Context-First: Always check the provided Context first. If the Context contains the answer, base your explanation directly on it.
        2. Unmentioned / Missing Details:
           - If the question is related to the course topic but the specific detail was NOT mentioned in the context:
             a) Explicitly state that the video does not cover or mention this specific detail.
             b) Provide the standard, accurate answer using general programming knowledge, clearly labeled as supplementary information.
        3. Completely Off-Topic / Unrelated Questions:
           - If the question is completely unrelated to the subject of the video, respond:
             "I could not find that information in this course, and it is outside the scope of this lecture."
        4. Tone: Clear, educational, concise, and helpful.
        """
    ),
    (
        "human",
        """
        Context from video transcript:
        {context}

        Student Question:
        {question}
        """
    )
])

    docs = await retriever.ainvoke(data.question)
    context = format_docs(docs)

    messages = prompt.format_messages(
        context=context,
        question=data.question
    )

    result: RAGResponse = await structured_llm.ainvoke(messages)

    if getattr(data, "include_context", False):
        return {
            "response": result.answer,
            "context": context
        }

    return result.answer
