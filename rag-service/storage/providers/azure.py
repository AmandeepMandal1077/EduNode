from azure.core.credentials import AzureNamedKeyCredential
from azure.storage.blob import BlobServiceClient

from storage.base import Storage
from storage.config import (
    get_storage_account_key,
    get_storage_account_name,
    get_storage_connection_string,
    get_storage_container,
)


class AzureStorage(Storage):
    def __init__(self) -> None:
        self._container = get_storage_container()

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

    def download_file(self, key: str, destination: str) -> None:
        blob = self._client.get_blob_client(self._container, key)
        with open(destination, "wb") as target:
            blob.download_blob().readinto(target)


def create_storage() -> Storage:
    return AzureStorage()
