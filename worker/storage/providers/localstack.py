from storage.base import Storage
from storage.config import (
    get_storage_container,
    get_storage_credentials,
    get_storage_endpoint,
    get_storage_public_base_url,
)
from storage.providers.s3 import S3Storage


def create_storage() -> Storage:
    return S3Storage(
        endpoint=get_storage_endpoint() or "http://localstack:4566",
        credentials=get_storage_credentials() or ("test", "test"),
        provider="localstack",
        public_base_url=get_storage_public_base_url()
        or f"http://localhost:4566/{get_storage_container()}",
    )
