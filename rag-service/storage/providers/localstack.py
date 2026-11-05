from storage.base import Storage
from storage.config import get_storage_credentials, get_storage_endpoint
from storage.providers.s3 import S3Storage


def create_storage() -> Storage:
    return S3Storage(
        endpoint=get_storage_endpoint() or "http://localstack:4566",
        credentials=get_storage_credentials() or ("test", "test"),
    )
