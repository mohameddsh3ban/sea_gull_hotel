import pytest
from httpx import AsyncClient
from firebase_admin import credentials, initialize_app
import os
from unittest.mock import patch
import sys

@pytest.fixture(scope="session")
def anyio_backend():
    return "asyncio"

@pytest.fixture(scope="session")
async def client():
    """
    Returns an Asynchronous TestClient for the FastAPI application.
    Mocks environment variables and Firebase initialization.
    """
    # Mock environment variables for settings
    mock_env = {
        "MAILGUN_API_KEY": "test-mailgun-api-key",
        "MAILGUN_DOMAIN": "test-mailgun-domain.com",
        "ADMIN_SECRET": "test-admin-secret",
        "CRON_SECRET": "test-cron-secret",
        "FIREBASE_STORAGE_BUCKET": "test-bucket",
        "LOCAL_TIMEZONE": "UTC", # Ensure timezone is set for datetime operations
        "FRONTEND_BASE_URL": "http://localhost:3000",
        "ALLOWED_ORIGINS": "http://localhost:5173,http://localhost:3000"
    }

    with patch.dict(os.environ, mock_env):
        # Clear app.core.config and app.main from sys.modules to force reload with mocked env vars
        if "app.core.config" in sys.modules:
            del sys.modules["app.core.config"]
        if "app.main" in sys.modules:
            del sys.modules["app.main"]
        
        # Re-import settings and app after mocking environment variables
        from app.core.config import Settings
        from app.main import app # Import app here, after env vars are mocked
        
        # Re-instantiate settings to pick up mocked environment variables
        test_settings = Settings()
        
        with patch("app.core.config.settings", test_settings):
            # Mock Firebase Admin SDK initialization
            with patch("firebase_admin.initialize_app") as mock_initialize_app:
                with patch("firebase_admin.credentials.Certificate"):
                    async with AsyncClient(app=app, base_url="http://test") as client:
                        yield client
