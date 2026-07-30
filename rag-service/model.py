import os
from langchain_google_genai import ChatGoogleGenerativeAI

gemini_api_key = os.getenv("GEMINI_API_KEY")
model_name = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")

gemini_llm = ChatGoogleGenerativeAI(
    model=model_name,
    google_api_key=gemini_api_key,
)
