FROM python:3.12-slim

ENV PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    HF_HOME=/app/.cache

WORKDIR /app

COPY requirements.txt ./
RUN pip install -r requirements.txt

# Bake the Whisper model so cold starts don't download it (~150 MB).
RUN python -c "from faster_whisper import WhisperModel; WhisperModel('base', device='cpu')"

COPY . .

RUN mkdir -p videos transcribe chroma_db \
    && useradd -m -u 1001 app \
    && chown -R app:app /app
USER app

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
