from storage.config import get_storage_credentials
from storage.providers.s3 import S3Storage
from storage.base import Storage


def create_storage() -> Storage:
    credentials = get_storage_credentials()
    if not credentials:
        raise ValueError(
            "Storage credentials are not set (STORAGE_ACCESS_KEY / STORAGE_SECRET_KEY)"
        )
    return S3Storage(endpoint=None, credentials=credentials, provider="aws")
