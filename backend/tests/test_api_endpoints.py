import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_root_endpoint():
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "online"
    assert "/docs" in data["docs"]

def test_health_endpoint():
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "Maharashtra" in data["pilot_region"]

def test_crops_endpoint():
    response = client.get("/api/market/crops")
    assert response.status_code == 200
    crops = response.json()
    assert len(crops) >= 3
    assert any(c["id"] == "onion" for c in crops)

def test_mandis_endpoint():
    response = client.get("/api/market/mandis")
    assert response.status_code == 200
    mandis = response.json()
    assert len(mandis) >= 6
    assert any(m["id"] == "lasalgaon" for m in mandis)

def test_market_hierarchy_endpoint():
    response = client.get("/api/market/hierarchy?state=Maharashtra&district=Nashik")
    assert response.status_code == 200
    data = response.json()
    assert "Maharashtra" in data["states"]
    assert "Nashik" in data["districts"]
    assert len(data["mandis"]) > 0
    assert any("lasalgaon" in m.lower() or "pimpalgaon" in m.lower() for m in data["mandis"])
    assert "Onion" in data["commodities"]

def test_market_prices_genuine_live_endpoint():
    response = client.get("/api/market/prices?crop=onion&mandi=lasalgaon&range=30d&forecast_days=7")
    assert response.status_code == 200
    data = response.json()
    assert "lasalgaon" in data["market"].lower()
    assert data["commodity"].lower() == "onion"
    assert data["latest_modal_price"] > 0
    assert len(data["historical_points"]) > 0
    assert "data.gov.in" in data["data_source"] or "AGMARKNET" in data["data_source"]
    # Verify no manufactured arrivals
    assert data["arrival_reported"] is False
    assert data["latest_arrival_tonnes"] is None

def test_market_prices_demo_mode():
    response = client.get("/api/market/prices?crop=onion&mandi=lasalgaon&range=30d&forecast_days=7&mode=demo")
    assert response.status_code == 200
    data = response.json()
    assert data["mode"] == "demo"
    assert len(data["forecast_points"]) == 7
    assert data["forecast_points"][0]["lower_bound"] is not None
    assert data["forecast_points"][0]["upper_bound"] is not None

def test_market_prices_no_silent_fallback_on_missing_pair():
    # If a market does not have data for a commodity, it must NOT silently return another market's data
    response = client.get("/api/market/prices?commodity=NonExistentFruit999&market=Lasalgaon&state=Maharashtra")
    assert response.status_code == 404
    error_msg = response.json().get("detail", "")
    assert "No official government price records found" in error_msg
    assert "No cross-market fallback" in error_msg

def test_storage_facilities_search():
    # Search near Lasalgaon
    response = client.get("/api/storage/facilities?lat=20.1472&lng=74.2281&radius_km=25")
    assert response.status_code == 200
    data = response.json()
    assert data["total_found"] > 0
    assert len(data["facilities"]) > 0
    # First facility should be very close to Lasalgaon
    assert data["facilities"][0]["distance_km"] < 2.0
    assert data["location_resolved"] is True
    assert data["resolution_source"] == "gps"

def test_storage_facilities_query_resolution():
    # Search by text query with mode=text
    response = client.get("/api/storage/facilities?mode=text&query=Pimpalgaon&radius_km=50")
    assert response.status_code == 200
    data = response.json()
    assert data["total_found"] > 0
    assert data["location_resolved"] is True
    assert "Pimpalgaon" in data["facilities"][0]["name"] or data["facilities"][0]["distance_km"] < 5.0

def test_state_aggregate_endpoint():
    response = client.get("/api/storage/state-aggregate")
    assert response.status_code == 200
    data = response.json()
    assert data["national_total_storages"] > 8000
    assert len(data["records"]) >= 30
    assert any(r["state_ut_as_published"] == "Maharashtra" for r in data["records"])

def test_data_sources_endpoint():
    response = client.get("/api/data-sources")
    assert response.status_code == 200
    sources = response.json()
    assert len(sources) >= 5
    assert any("NHB" in s["source_name"] for s in sources)


def test_calculator_api_evaluation():
    payload = {
        "harvest_quantity_quintals": 120.0,
        "current_price_per_quintal": 2100.0,
        "current_selling_cost_per_quintal": 50.0,
        "expected_future_price_per_quintal": 2700.0,
        "storage_duration_months": 2.0,
        "storage_cost_per_quintal_month": 45.0,
        "storage_loss_percentage": 7.0,
        "future_selling_cost_per_quintal": 50.0,
        "other_additional_costs": 600.0,
        "minimum_cash_required": 40000.0
    }
    response = client.post("/api/calculator/evaluate", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["harvest_quantity"] == 120.0
    assert data["break_even_future_price"] > 2100.0
    assert data["strategy_a_sell_now"]["total_net_income"] > 0
    assert data["strategy_b_store_all"]["total_net_income"] > 0
    assert data["strategy_c_partial"]["is_cash_requirement_met"] is True

def test_midh_staging_summary_endpoint():
    response = client.get("/api/storage/staging/summary")
    assert response.status_code == 200
    data = response.json()
    assert data["total_projects"] == 183
    assert abs(data["total_subsidy_lakh_inr"] - 11550.43) < 0.1
    assert data["districts_count"] == 20
    assert "Historical MIDH government subsidy list" in data["data_integrity_notice"]

def test_midh_staging_projects_endpoint_and_filters():
    # 1. Base query
    res = client.get("/api/storage/staging/midh-projects?limit=50")
    assert res.status_code == 200
    data = res.json()
    assert data["summary"]["total_projects"] == 183
    assert data["total_filtered"] == 183
    assert len(data["projects"]) == 50

    # 2. Filter by district (e.g. Pune)
    res_pune = client.get("/api/storage/staging/midh-projects?district=Pune")
    assert res_pune.status_code == 200
    pune_data = res_pune.json()
    assert pune_data["total_filtered"] > 0
    assert all(p["district_normalized"] == "Pune" for p in pune_data["projects"])

    # 3. Filter by duplicates
    res_dup = client.get("/api/storage/staging/midh-projects?flag_filter=duplicate")
    assert res_dup.status_code == 200
    dup_data = res_dup.json()
    assert dup_data["total_filtered"] >= 8
    assert all(any(term in p["review_flags"].lower() for term in ["duplicate", "expansion", "same"]) for p in dup_data["projects"])


