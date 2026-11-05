from messaging.base import Queue
from messaging.config import get_queue_provider
from messaging.providers import aws, azure, localstack

_queue: Queue | None = None


def get_queue() -> Queue:
    global _queue
    if _queue is None:
        provider = get_queue_provider()
        factories = {
            "aws": aws.create_queue,
            "azure": azure.create_queue,
            "localstack": localstack.create_queue,
        }
        _queue = factories[provider]()
    return _queue
