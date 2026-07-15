import os

_is_dev = os.getenv("PYTHON_ENV", "development") == "development"

def debug(*args, **kwargs):
    if _is_dev:
        print(*args, **kwargs)
