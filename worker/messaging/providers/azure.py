import base64
import json

from azure.core.credentials import AzureNamedKeyCredential
from azure.storage.queue import QueueClient

from messaging.base import JobMessage, Queue
from messaging.config import (
    get_queue_account_key,
    get_queue_account_name,
    get_queue_connection_string,
    get_queue_name,
)


def _decode_payload(content: str) -> dict:
    try:
        return json.loads(content)
    except (TypeError, ValueError):
        return json.loads(base64.b64decode(content).decode("utf-8"))


class AzureQueue(Queue):
    provider = "azure"

    def __init__(self) -> None:
        queue_name = get_queue_name()
        connection_string = get_queue_connection_string()

        if connection_string:
            self._client = QueueClient.from_connection_string(
                connection_string, queue_name
            )
        else:
            account_name = get_queue_account_name()
            account_key = get_queue_account_key()
            if not account_name or not account_key:
                raise ValueError(
                    "Azure queue requires QUEUE_CONNECTION_STRING "
                    "or QUEUE_ACCOUNT_NAME / QUEUE_ACCOUNT_KEY"
                )
            self._client = QueueClient(
                account_url=f"https://{account_name}.queue.core.windows.net",
                queue_name=queue_name,
                credential=AzureNamedKeyCredential(account_name, account_key),
            )

    def receive(
        self,
        *,
        max_messages: int = 1,
        visibility_timeout: int = 300,
        wait_seconds: int = 20,
    ) -> list[JobMessage]:
        messages = self._client.receive_messages(
            max_messages=max_messages,
            visibility_timeout=visibility_timeout,
            timeout=wait_seconds,
        )

        return [
            JobMessage(
                id=message.id,
                receipt=message.pop_receipt or "",
                payload=_decode_payload(message.content),
                raw=message,
            )
            for message in messages
        ]

    def delete(self, message: JobMessage) -> None:
        self._client.delete_message(message.raw)

    def extend_visibility(self, message: JobMessage, seconds: int) -> None:
        message.raw = self._client.update_message(
            message.raw,
            visibility_timeout=seconds,
        )


def create_queue() -> Queue:
    return AzureQueue()
