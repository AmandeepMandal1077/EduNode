import os
import langchain_ollama

# ollama_base_url = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
# ollama_api_key = os.getenv("OLLAMA_API_KEY")
# ollama_llm = langchain_ollama.ChatOllama(
#     model="gpt-oss:20b-cloud",
#     open_api_key=ollama_api_key,
#     open_api_base=ollama_base_url
# )
model_name = os.environ.get("OLLAMA_MODEL")
ollama_llm = langchain_ollama.ChatOllama(
    model=model_name
)