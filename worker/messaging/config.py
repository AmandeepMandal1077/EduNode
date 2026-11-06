import os

PROVIDERS = {"aws", "azure", "localstack"}


def get_queue_provider() -> str:
    provider = os.getenv("QUEUE_PROVIDER", "aws").strip().lower()
    if provider not in PROVIDERS:
        raise ValueError(
            f"Invalid QUEUE_PROVIDER '{provider}'. Expected one of: {sorted(PROVIDERS)}"
        )
    return provider


def get_queue_url() -> str:
    url = os.getenv("QUEUE_URL") or os.getenv("SQS_QUEUE_URL")
    if not url:
        raise ValueError("QUEUE_URL is not set (legacy SQS_QUEUE_URL is also accepted)")
    return url


def get_queue_name() -> str:
    name = os.getenv("QUEUE_NAME")
    if name:
        return name
    return get_queue_url().rstrip("/").split("/")[-1]


def get_queue_endpoint() -> str | None:
    return os.getenv("QUEUE_ENDPOINT") or None


def get_queue_region() -> str:
    return (
        os.getenv("QUEUE_REGION")
        or os.getenv("STORAGE_REGION")
        or os.getenv("AWS_REGION")
        or "us-east-1"
    )


def get_queue_credentials() -> tuple[str, str] | None:
    access_key = (
        os.getenv("QUEUE_ACCESS_KEY")
        or os.getenv("STORAGE_ACCESS_KEY")
        or os.getenv("AWS_ACCESS_KEY_ID")
    )
    secret_key = (
        os.getenv("QUEUE_SECRET_KEY")
        or os.getenv("STORAGE_SECRET_KEY")
        or os.getenv("AWS_SECRET_ACCESS_KEY")
    )
    if not access_key or not secret_key:
        return None
    return access_key, secret_key


def get_queue_connection_string() -> str | None:
    return (
        os.getenv("QUEUE_CONNECTION_STRING")
        or os.getenv("STORAGE_CONNECTION_STRING")
        or os.getenv("AZURE_STORAGE_CONNECTION_STRING")
    )


def get_queue_account_name() -> str | None:
    return (
        os.getenv("QUEUE_ACCOUNT_NAME")
        or os.getenv("STORAGE_ACCOUNT_NAME")
        or os.getenv("AZURE_STORAGE_ACCOUNT_NAME")
    )


def get_queue_account_key() -> str | None:
    return (
        os.getenv("QUEUE_ACCOUNT_KEY")
        or os.getenv("STORAGE_ACCOUNT_KEY")
        or os.getenv("AZURE_STORAGE_ACCOUNT_KEY")
    )
