import os

PROVIDERS = {"aws", "azure", "localstack"}


def get_storage_provider() -> str:
    provider = os.getenv("STORAGE_PROVIDER", "aws").strip().lower()
    if provider not in PROVIDERS:
        raise ValueError(
            f"Invalid STORAGE_PROVIDER '{provider}'. Expected one of: {sorted(PROVIDERS)}"
        )
    return provider


def get_storage_container() -> str:
    container = (
        os.getenv("STORAGE_CONTAINER")
        or os.getenv("S3_BUCKET_NAME")
        or os.getenv("S3_BUCKET")
    )
    if not container:
        raise ValueError(
            "STORAGE_CONTAINER is not set (legacy S3_BUCKET_NAME is also accepted)"
        )
    return container


def get_storage_region() -> str:
    return os.getenv("STORAGE_REGION") or os.getenv("AWS_REGION") or "us-east-1"


def get_storage_endpoint() -> str | None:
    return os.getenv("STORAGE_ENDPOINT") or None


def get_storage_credentials() -> tuple[str, str] | None:
    access_key = os.getenv("STORAGE_ACCESS_KEY") or os.getenv("AWS_ACCESS_KEY_ID")
    secret_key = os.getenv("STORAGE_SECRET_KEY") or os.getenv("AWS_SECRET_ACCESS_KEY")
    if not access_key or not secret_key:
        return None
    return access_key, secret_key


def get_storage_connection_string() -> str | None:
    return os.getenv("STORAGE_CONNECTION_STRING") or os.getenv(
        "AZURE_STORAGE_CONNECTION_STRING"
    )


def get_storage_account_name() -> str | None:
    return os.getenv("STORAGE_ACCOUNT_NAME") or os.getenv(
        "AZURE_STORAGE_ACCOUNT_NAME"
    )


def get_storage_account_key() -> str | None:
    return os.getenv("STORAGE_ACCOUNT_KEY") or os.getenv(
        "AZURE_STORAGE_ACCOUNT_KEY"
    )
