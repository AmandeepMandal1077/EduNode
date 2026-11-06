from azure.core.credentials import AzureNamedKeyCredential
from azure.core.exceptions import ResourceNotFoundError
from azure.storage.blob import BlobServiceClient, ContentSettings

from storage.base import Storage
from storage.config import (
    get_storage_account_key,
    get_storage_account_name,
    get_storage_connection_string,
    get_storage_container,
    get_storage_public_base_url,
)


class AzureStorage(Storage):
    provider = "azure"

    def __init__(self) -> None:
        self._container = get_storage_container()
        self._public_base_url = get_storage_public_base_url()

        connection_string = get_storage_connection_string()
        if connection_string:
            self._client = BlobServiceClient.from_connection_string(connection_string)
        else:
            account_name = get_storage_account_name()
            account_key = get_storage_account_key()
            if not account_name or not account_key:
                raise ValueError(
                    "Azure storage requires STORAGE_CONNECTION_STRING "
                    "or STORAGE_ACCOUNT_NAME / STORAGE_ACCOUNT_KEY"
                )
            self._client = BlobServiceClient(
                account_url=f"https://{account_name}.blob.core.windows.net",
                credential=AzureNamedKeyCredential(account_name, account_key),
            )

        self._container_client = self._client.get_container_client(self._container)

    def _blob(self, key: str):
        return self._container_client.get_blob_client(key)

    def download_file(self, key: str, destination: str) -> None:
        with open(destination, "wb") as target:
            self._blob(key).download_blob().readinto(target)

    def upload_file(self, local_path: str, key: str, content_type: str) -> None:
        with open(local_path, "rb") as source:
            self._blob(key).upload_blob(
                source,
                overwrite=True,
                content_settings=ContentSettings(content_type=content_type),
            )

    def delete_object(self, key: str) -> None:
        try:
            self._blob(key).delete_blob()
        except ResourceNotFoundError:
            pass

    def get_public_url(self, key: str) -> str:
        base_url = (
            self._public_base_url
            or f"https://{self._client.account_name}.blob.core.windows.net/{self._container}"
        )
        return f"{base_url.rstrip('/')}/{key}"


def create_storage() -> Storage:
    return AzureStorage()
