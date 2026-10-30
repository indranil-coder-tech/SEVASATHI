import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_cors_allowed_local_origin():
    """Verify that localhost origin receives proper CORS headers."""
    response = client.options(
        "/api/health",
        headers={
            "Origin": "http://localhost:5173",
            "Access-Control-Request-Method": "GET"
        }
    )
    assert response.status_code == 200
    assert response.headers.get("access-control-allow-origin") == "http://localhost:5173"

def test_cors_rejected_unknown_origin():
    """Verify that an untrusted foreign origin is rejected or not granted allow-origin."""
    response = client.options(
        "/api/health",
        headers={
            "Origin": "https://malicious-phishing-site.com",
            "Access-Control-Request-Method": "GET"
        }
    )
    # FastApi/Starlette CORSMiddleware does NOT echo the origin when origin does not match allowed origins or regex
    allow_origin = response.headers.get("access-control-allow-origin")
    assert allow_origin != "https://malicious-phishing-site.com"
