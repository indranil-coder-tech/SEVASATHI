import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.models import CalculatorRequest
from app.calculator import evaluate_sell_or_store

client = TestClient(app)

def test_calculator_validation_boundaries():
    """Cover lines 15, 17, 19, 21, 23, 25, 27 in calculator.py"""
    with pytest.raises(ValueError, match="Harvest quantity"):
        evaluate_sell_or_store(CalculatorRequest.model_construct(
            harvest_quantity_quintals=-5.0,
            current_price_per_quintal=2000.0,
            expected_future_price_per_quintal=2500.0
        ))

    with pytest.raises(ValueError, match="Current price"):
        evaluate_sell_or_store(CalculatorRequest.model_construct(
            harvest_quantity_quintals=100.0,
            current_price_per_quintal=0.0,
            expected_future_price_per_quintal=2500.0
        ))

    with pytest.raises(ValueError, match="Expected future price"):
        evaluate_sell_or_store(CalculatorRequest.model_construct(
            harvest_quantity_quintals=100.0,
            current_price_per_quintal=2000.0,
            expected_future_price_per_quintal=-10.0
        ))

    with pytest.raises(ValueError, match="Storage duration"):
        evaluate_sell_or_store(CalculatorRequest.model_construct(
            harvest_quantity_quintals=100.0,
            current_price_per_quintal=2000.0,
            expected_future_price_per_quintal=2500.0,
            storage_duration_months=0.0
        ))

    with pytest.raises(ValueError, match="Storage loss"):
        evaluate_sell_or_store(CalculatorRequest.model_construct(
            harvest_quantity_quintals=100.0,
            current_price_per_quintal=2000.0,
            expected_future_price_per_quintal=2500.0,
            storage_duration_months=1.0,
            storage_loss_percentage=150.0
        ))

    with pytest.raises(ValueError, match="Selling costs"):
        evaluate_sell_or_store(CalculatorRequest.model_construct(
            harvest_quantity_quintals=100.0,
            current_price_per_quintal=2000.0,
            expected_future_price_per_quintal=2500.0,
            storage_duration_months=1.0,
            storage_loss_percentage=5.0,
            current_selling_cost_per_quintal=-5.0,
            future_selling_cost_per_quintal=0.0
        ))

    with pytest.raises(ValueError, match="Minimum cash required"):
        evaluate_sell_or_store(CalculatorRequest.model_construct(
            harvest_quantity_quintals=100.0,
            current_price_per_quintal=2000.0,
            expected_future_price_per_quintal=2500.0,
            storage_duration_months=1.0,
            storage_loss_percentage=5.0,
            current_selling_cost_per_quintal=10.0,
            future_selling_cost_per_quintal=10.0,
            minimum_cash_required=-100.0
        ))

def test_calculator_api_endpoint_valid():
    payload = {
        "harvest_quantity_quintals": 100,
        "current_price_per_quintal": 2200,
        "expected_future_price_per_quintal": 2800,
        "storage_duration_months": 3,
        "storage_cost_per_quintal_month": 45,
        "storage_loss_percentage": 5,
        "current_selling_cost_per_quintal": 50,
        "future_selling_cost_per_quintal": 50,
        "other_additional_costs": 1000,
        "minimum_cash_required": 40000
    }
    res = client.post("/api/calculator/evaluate", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert "strategy_a_sell_now" in data
    assert "strategy_b_store_all" in data
    assert "strategy_c_partial" in data
    assert data["recommended_strategy_id"] in ["strategy_a", "strategy_b", "strategy_c"]

def test_calculator_api_endpoint_invalid_raises_422():
    payload = {
        "harvest_quantity_quintals": -100,
        "current_price_per_quintal": 2200,
        "expected_future_price_per_quintal": 2800
    }
    res = client.post("/api/calculator/evaluate", json=payload)
    assert res.status_code == 422

def test_state_aggregate_endpoint():
    res = client.get("/api/storage/state-aggregate")
    assert res.status_code == 200
    data = res.json()
    assert data["national_total_storages"] > 0
    assert len(data["records"]) > 30

def test_data_sources_endpoint():
    res = client.get("/api/data-sources")
    assert res.status_code == 200
    sources = res.json()
    assert isinstance(sources, list)
    assert len(sources) > 0
    assert "source_name" in sources[0]

def test_midh_staging_endpoints():
    res = client.get("/api/storage/staging/midh-projects?limit=5&offset=0")
    assert res.status_code == 200
    data = res.json()
    assert data["total_filtered"] > 0
    assert len(data["projects"]) <= 5

    res_summary = client.get("/api/storage/staging/summary")
    assert res_summary.status_code == 200
    summary = res_summary.json()
    assert summary["total_projects"] > 0
    assert summary["total_capacity_mt"] > 0

def test_storage_facilities_filters():
    res_potato = client.get("/api/storage/facilities?crop=potato&radius_km=100")
    assert res_potato.status_code == 200

    res_grapes = client.get("/api/storage/facilities?crop=grape&radius_km=100")
    assert res_grapes.status_code == 200

    res_grain = client.get("/api/storage/facilities?crop=grain&radius_km=100")
    assert res_grain.status_code == 200

    res_cold = client.get("/api/storage/facilities?type=cold&radius_km=100")
    assert res_cold.status_code == 200

    res_wh = client.get("/api/storage/facilities?type=warehouse&radius_km=100")
    assert res_wh.status_code == 200

def test_market_prices_ranges_and_varieties():
    for r in ["7d", "90d"]:
        res = client.get(f"/api/market/prices?crop=onion&mandi=lasalgaon&range={r}&forecast_days=10")
        assert res.status_code == 200
        data = res.json()
        assert len(data["historical_points"]) > 0

def test_market_prices_missing_pair_returns_404():
    res = client.get("/api/market/prices?crop=unknown_crop_xyz&mandi=lasalgaon")
    assert res.status_code in [400, 404]

def test_market_filters_alias():
    res = client.get("/api/market/filters?state=Maharashtra&district=Nashik")
    assert res.status_code == 200
    data = res.json()
    assert "Maharashtra" in data["states"]
