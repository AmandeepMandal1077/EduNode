FROM python:3.12-slim
ENV PYTHONUNBUFFERED=1

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir --default-timeout=1000 -r requirements.txt

COPY . .

RUN mkdir -p videos transcribe

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
