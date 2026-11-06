from abc import ABC, abstractmethod


class Storage(ABC):
    """Provider-neutral object storage contract for the media worker."""

    @abstractmethod
    def download_file(self, key: str, destination: str) -> None:
        raise NotImplementedError

    @abstractmethod
    def upload_file(self, local_path: str, key: str, content_type: str) -> None:
        raise NotImplementedError

    @abstractmethod
    def delete_object(self, key: str) -> None:
        raise NotImplementedError

    @abstractmethod
    def get_public_url(self, key: str) -> str:
        raise NotImplementedError
