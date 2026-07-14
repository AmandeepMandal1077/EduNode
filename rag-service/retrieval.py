from typing import Any
from langchain.messages import SystemMessage, HumanMessage
from langchain_core.prompts import ChatPromptTemplate
from req_schemas import QueryRequest
from vectorstore import vector_store
from model import ollama_llm
from langsmith import traceable

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
        print(f"Retrieved {len(docs)} documents for course_id={course_id}, lecture_id={lecture_id}.")
        print("Context retrieved:")
        for i, doc in enumerate(docs):
            print(f"Chunk {i+1}: {doc.page_content[:100]}...")
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

    llm_result = await ollama_llm.ainvoke(messages)
    response = llm_result.content if hasattr(llm_result, "content") else str(llm_result)

    if getattr(data, "include_context", False):
        return {
            "response": response,
            "context": context
        }

    return response
