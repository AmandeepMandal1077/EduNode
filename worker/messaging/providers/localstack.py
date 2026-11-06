from messaging.base import Queue
from messaging.config import get_queue_credentials, get_queue_endpoint
from messaging.providers.sqs import SQSQueue


def create_queue() -> Queue:
    return SQSQueue(
        endpoint=get_queue_endpoint() or "http://localstack:4566",
        credentials=get_queue_credentials() or ("test", "test"),
    )
