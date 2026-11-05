# In-memory ingestion status, shared by the routes and the background job.
# shortcut: process-local state, so the service must run a single replica.
STATUS: dict[str, str] = {}


def set_status(lecture_id: str, status: str) -> None:
    STATUS[lecture_id] = status


def get_status(lecture_id: str) -> str | None:
    return STATUS.get(lecture_id)
