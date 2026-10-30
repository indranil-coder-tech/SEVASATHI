import json
import urllib.request
from unittest.mock import MagicMock, patch
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.storage import resolve_via_nominatim, storage_service
from app.gov_mandi_service import gov_mandi_service

client = TestClient(app)

def test_root_endpoint():
    res = client.get("/")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "online"
    assert "SevaSathi" in data["service"]

def test_geocode_with_nominatim_mock_success():
    """Test successful geocoding via Nominatim with mocked HTTP response."""
    mock_response_data = [
        {
            "lat": "19.9975",
            "lon": "73.7898",
            "display_name": "Nashik, Maharashtra, India",
            "address": {"state": "Maharashtra"}
        }
    ]
    mock_resp = MagicMock()
    mock_resp.status = 200
    mock_resp.read.return_value = json.dumps(mock_response_data).encode("utf-8")
    mock_resp.__enter__.return_value = mock_resp

    with patch("urllib.request.urlopen", return_value=mock_resp):
        res = resolve_via_nominatim("Nashik City Unique Mock")
        assert res is not None
        lat, lng, name = res
        assert abs(lat - 19.9975) < 0.01
        assert abs(lng - 73.7898) < 0.01
        assert "Nashik" in name

def test_geocode_with_nominatim_pin_match():
    """Test PIN code geocoding via Nominatim."""
    mock_response_data = [
        {
            "lat": "18.5204",
            "lon": "73.8567",
            "display_name": "Pune 411001, Maharashtra, India",
            "address": {"postcode": "411001", "state": "Maharashtra"}
        }
    ]
    mock_resp = MagicMock()
    mock_resp.status = 200
    mock_resp.read.return_value = json.dumps(mock_response_data).encode("utf-8")
    mock_resp.__enter__.return_value = mock_resp

    with patch("urllib.request.urlopen", return_value=mock_resp):
        res = resolve_via_nominatim("411001")
        assert res is not None
        assert abs(res[0] - 18.5204) < 0.01

def test_data_gov_in_fetch_mock_success():
    """Test live data.gov.in fetch with mocked HTTP response."""
    sample_raw_records = [
        {
            "state": "Maharashtra",
            "district": "Nashik",
            "market": "Lasalgaon",
            "commodity": "Onion",
            "variety": "Red",
            "arrival_date": "28/10/2026",
            "min_price": "1800",
            "max_price": "2400",
            "modal_price": "2150"
        }
    ]
    mock_body = {
        "status": "ok",
        "total": 1,
        "count": 1,
        "limit": 10,
        "offset": 0,
        "records": sample_raw_records
    }
    mock_resp = MagicMock()
    mock_resp.status = 200
    mock_resp.read.return_value = json.dumps(mock_body).encode("utf-8")
    mock_resp.__enter__.return_value = mock_resp

    with patch.object(gov_mandi_service, "api_key", "mock_dummy_api_key"):
        with patch("urllib.request.urlopen", return_value=mock_resp):
            records = gov_mandi_service.fetch_live_records(
                state="Maharashtra",
                district="Nashik",
                market="Lasalgaon",
                commodity="Onion"
            )
            assert len(records) > 0
            assert records[0]["modal_price"] == 2150.0

def test_storage_facility_search_all():
    res = storage_service.search_facilities(mode="demo", radius_km=1000.0)
    assert res.total_found > 0
    assert len(res.facilities) > 0
