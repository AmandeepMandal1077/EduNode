from abc import ABC, abstractmethod


class Storage(ABC):
    """Provider-neutral object storage contract for the RAG service."""

    @abstractmethod
    def download_file(self, key: str, destination: str) -> None:
        raise NotImplementedError
