import boto3
from botocore.config import Config

from storage.base import Storage
from storage.config import (
    get_storage_container,
    get_storage_public_base_url,
    get_storage_region,
)


class S3Storage(Storage):
    """S3-compatible storage. Used by the aws and localstack providers."""

    def __init__(
        self,
        *,
        endpoint: str | None,
        credentials: tuple[str, str],
        provider: str,
        public_base_url: str | None = None,
    ) -> None:
        self.provider = provider
        self._container = get_storage_container()
        self._region = get_storage_region()
        self._public_base_url = public_base_url or get_storage_public_base_url()

        self._client = boto3.client(
            "s3",
            region_name=self._region,
            endpoint_url=endpoint,
            aws_access_key_id=credentials[0],
            aws_secret_access_key=credentials[1],
            config=Config(s3={"addressing_style": "path"}) if endpoint else None,
        )

    def download_file(self, key: str, destination: str) -> None:
        self._client.download_file(self._container, key, destination)

    def upload_file(self, local_path: str, key: str, content_type: str) -> None:
        self._client.upload_file(
            local_path,
            self._container,
            key,
            ExtraArgs={"ContentType": content_type},
        )

    def delete_object(self, key: str) -> None:
        self._client.delete_object(Bucket=self._container, Key=key)

    def get_public_url(self, key: str) -> str:
        base_url = (
            self._public_base_url
            or f"https://{self._container}.s3.{self._region}.amazonaws.com"
        )
        return f"{base_url.rstrip('/')}/{key}"
