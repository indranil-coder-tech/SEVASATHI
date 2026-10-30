import json
import urllib.request
from unittest.mock import MagicMock, patch
import pytest
from fastapi.testclient import TestClient
from app.main import app, market_service, storage_service
from app.storage import (
    resolve_via_nominatim,
    normalize_query_text,
    calculate_haversine_distance
)
from app.gov_mandi_service import gov_mandi_service
from app.models import CalculatorRequest
from app.calculator import evaluate_sell_or_store

client = TestClient(app)

def test_gov_mandi_no_api_key():
    with patch.object(gov_mandi_service, "api_key", None):
        res = gov_mandi_service.fetch_live_records()
        assert res == []

def test_gov_mandi_http_error_retry():
    with patch.object(gov_mandi_service, "api_key", "test_key"):
        with patch("urllib.request.urlopen", side_effect=urllib.error.URLError("Network unreachable")):
            res = gov_mandi_service.fetch_live_records()
            assert res == []

def test_gov_mandi_cache_hit_and_miss():
    gov_mandi_service._set_cache("test_cache_key", {"data": 123})
    assert gov_mandi_service._get_from_cache("test_cache_key") == {"data": 123}
    assert gov_mandi_service._get_from_cache("non_existent_key_xyz") is None

def test_nominatim_pin_mismatch():
    mock_response = [
        {
            "lat": "19.0",
            "lon": "73.0",
            "display_name": "Somewhere",
            "address": {"postcode": "111111"}
        }
    ]
    mock_resp = MagicMock()
    mock_resp.status = 200
    mock_resp.read.return_value = json.dumps(mock_response).encode("utf-8")
    mock_resp.__enter__.return_value = mock_resp

    with patch("urllib.request.urlopen", return_value=mock_resp):
        res = resolve_via_nominatim("999888")
        assert res is None

def test_nominatim_token_mismatch():
    mock_response = [
        {
            "lat": "19.0",
            "lon": "73.0",
            "display_name": "Maharashtra, India"
        }
    ]
    mock_resp = MagicMock()
    mock_resp.status = 200
    mock_resp.read.return_value = json.dumps(mock_response).encode("utf-8")
    mock_resp.__enter__.return_value = mock_resp

    with patch("urllib.request.urlopen", return_value=mock_resp):
        res = resolve_via_nominatim("SpecialUniquePlaceQuery")
        assert res is None

def test_nominatim_exception_handling():
    with patch("urllib.request.urlopen", side_effect=Exception("Timeout")):
        res = resolve_via_nominatim("ErrorTestQuery")
        assert res is None

def test_normalize_empty_query():
    assert normalize_query_text("") == ""
    assert normalize_query_text("   ") == ""
    assert normalize_query_text(None) == ""

def test_haversine_same_point():
    assert calculate_haversine_distance(20.0, 74.0, 20.0, 74.0) == 0.0

def test_calculator_extreme_cash_requirement():
    req = CalculatorRequest(
        harvest_quantity_quintals=100.0,
        current_price_per_quintal=2000.0,
        current_selling_cost_per_quintal=50.0,
        expected_future_price_per_quintal=3000.0,
        storage_duration_months=3.0,
        storage_cost_per_quintal_month=40.0,
        storage_loss_percentage=5.0,
        future_selling_cost_per_quintal=50.0,
        other_additional_costs=1000.0,
        minimum_cash_required=500000.0
    )
    res = evaluate_sell_or_store(req)
    assert res.strategy_c_partial.is_cash_requirement_met is False
    assert res.strategy_c_partial.immediate_quantity_sold == 100.0

def test_calculator_moderate_cash_requirement():
    req = CalculatorRequest(
        harvest_quantity_quintals=100.0,
        current_price_per_quintal=2000.0,
        current_selling_cost_per_quintal=50.0,
        expected_future_price_per_quintal=3000.0,
        storage_duration_months=3.0,
        storage_cost_per_quintal_month=40.0,
        storage_loss_percentage=5.0,
        future_selling_cost_per_quintal=50.0,
        other_additional_costs=1000.0,
        minimum_cash_required=97500.0
    )
    res = evaluate_sell_or_store(req)
    assert res.strategy_c_partial.is_cash_requirement_met is True
    assert res.strategy_c_partial.immediate_quantity_sold == 50.0
    assert res.strategy_c_partial.stored_quantity_initial == 50.0

def test_main_exception_handlers():
    with patch.object(market_service, "get_filter_hierarchy", side_effect=Exception("DB fail")):
        r = client.get("/api/market/hierarchy")
        assert r.status_code == 500

    with patch.object(storage_service, "get_statewise_aggregates", side_effect=Exception("Agg fail")):
        r = client.get("/api/storage/state-aggregate")
        assert r.status_code == 500

    with patch.object(storage_service, "get_data_sources", side_effect=Exception("Sources fail")):
        r = client.get("/api/data-sources")
        assert r.status_code == 500

    with patch.object(storage_service, "get_midh_staging_summary", side_effect=Exception("Summary fail")):
        r = client.get("/api/storage/staging/summary")
        assert r.status_code == 500

    with patch.object(storage_service, "get_midh_staging_projects", side_effect=Exception("Projects fail")):
        r = client.get("/api/storage/staging/midh-projects")
        assert r.status_code == 500

    with patch.object(storage_service, "search_facilities", side_effect=Exception("Search fail")):
        r = client.get("/api/storage/facilities")
        assert r.status_code == 500

    with patch("app.main.evaluate_sell_or_store", side_effect=Exception("Calc fail")):
        valid_payload = {
            "harvest_quantity_quintals": 100,
            "current_price_per_quintal": 2000,
            "expected_future_price_per_quintal": 2500
        }
        r = client.post("/api/calculator/evaluate", json=valid_payload)
        assert r.status_code == 422
