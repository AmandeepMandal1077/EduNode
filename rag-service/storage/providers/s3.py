import boto3
from botocore.config import Config

from storage.base import Storage
from storage.config import get_storage_container, get_storage_region


class S3Storage(Storage):
    def __init__(self, *, endpoint: str | None, credentials: tuple[str, str]) -> None:
        self._container = get_storage_container()
        self._client = boto3.client(
            "s3",
            region_name=get_storage_region(),
            endpoint_url=endpoint,
            aws_access_key_id=credentials[0],
            aws_secret_access_key=credentials[1],
            config=Config(s3={"addressing_style": "path"}) if endpoint else None,
        )

    def download_file(self, key: str, destination: str) -> None:
        self._client.download_file(self._container, key, destination)
