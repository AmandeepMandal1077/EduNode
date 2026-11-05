from storage.base import Storage
from storage.config import get_storage_provider
from storage.providers import aws, azure, localstack

_storage: Storage | None = None


def get_storage() -> Storage:
    global _storage
    if _storage is None:
        provider = get_storage_provider()
        factories = {
            "aws": aws.create_storage,
            "azure": azure.create_storage,
            "localstack": localstack.create_storage,
        }
        _storage = factories[provider]()
    return _storage
