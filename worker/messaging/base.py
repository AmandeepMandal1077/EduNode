from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import Any


@dataclass
class JobMessage:
    """Normalized queue message so the worker never sees provider payloads."""

    id: str
    receipt: str
    payload: dict[str, Any]
    raw: Any


class Queue(ABC):
    @abstractmethod
    def receive(
        self,
        *,
        max_messages: int = 1,
        visibility_timeout: int = 300,
        wait_seconds: int = 20,
    ) -> list[JobMessage]:
        raise NotImplementedError

    @abstractmethod
    def delete(self, message: JobMessage) -> None:
        raise NotImplementedError

    @abstractmethod
    def extend_visibility(self, message: JobMessage, seconds: int) -> None:
        raise NotImplementedError
