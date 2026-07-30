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
            You are a retrieval-augmented teaching assistant.

            Use ONLY the supplied context.

            If the context does not contain enough information
            to answer the question, respond exactly:

            "I could not find that information in the course."

            Never:
            - use prior knowledge
            - guess
            - fabricate information
            - answer from general knowledge
            """
        ),
        (
            "human",
            """
            Context:
            {context}

            Question:
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
