from messaging.base import Queue
from messaging.config import get_queue_credentials
from messaging.providers.sqs import SQSQueue


def create_queue() -> Queue:
    credentials = get_queue_credentials()
    if not credentials:
        raise ValueError(
            "Queue credentials are not set (QUEUE_ACCESS_KEY / QUEUE_SECRET_KEY)"
        )
    return SQSQueue(endpoint=None, credentials=credentials)
