import json

import boto3

from messaging.base import JobMessage, Queue
from messaging.config import get_queue_credentials, get_queue_region, get_queue_url


class SQSQueue(Queue):
    """SQS-compatible queue. Used by the aws and localstack providers."""

    def __init__(self, *, endpoint: str | None, credentials: tuple[str, str]) -> None:
        self._url = get_queue_url()
        self._client = boto3.client(
            "sqs",
            region_name=get_queue_region(),
            endpoint_url=endpoint,
            aws_access_key_id=credentials[0],
            aws_secret_access_key=credentials[1],
        )

    def receive(
        self,
        *,
        max_messages: int = 1,
        visibility_timeout: int = 300,
        wait_seconds: int = 20,
    ) -> list[JobMessage]:
        response = self._client.receive_message(
            QueueUrl=self._url,
            MaxNumberOfMessages=max_messages,
            WaitTimeSeconds=wait_seconds,
            VisibilityTimeout=visibility_timeout,
        )

        messages: list[JobMessage] = []
        for raw in response.get("Messages", []):
            messages.append(
                JobMessage(
                    id=raw["MessageId"],
                    receipt=raw["ReceiptHandle"],
                    payload=json.loads(raw["Body"]),
                    raw=raw,
                )
            )
        return messages

    def delete(self, message: JobMessage) -> None:
        self._client.delete_message(
            QueueUrl=self._url,
            ReceiptHandle=message.receipt,
        )

    def extend_visibility(self, message: JobMessage, seconds: int) -> None:
        self._client.change_message_visibility(
            QueueUrl=self._url,
            ReceiptHandle=message.receipt,
            VisibilityTimeout=seconds,
        )
