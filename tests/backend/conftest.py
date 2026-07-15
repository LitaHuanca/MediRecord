import os
import pytest
from httpx import AsyncClient

BASE_URL = os.environ.get("STAGING_API_URL", "http://localhost:8000")


@pytest.fixture
def base_url() -> str:
    return BASE_URL


@pytest.fixture
async def http_client():
    async with AsyncClient(base_url=BASE_URL) as client:
        yield client
