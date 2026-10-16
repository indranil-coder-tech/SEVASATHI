import os
import json
import pytest
from datetime import datetime, timedelta
from app.storage import StorageService
from app.gov_mandi_service import GovMandiService
from app.calculator import evaluate_sell_or_store
from app.models import CalculatorRequest

DATA_DIR = os.path.join(os.path.dirname(__file__), "..", "data")
LOCALES_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "frontend", "src", "locales")


# ---------------------------------------------------------------------------
# 1. Storage Location Resolution & Stale GPS Overriding
# ---------------------------------------------------------------------------

def test_typed_pune_with_stale_lasalgaon_gps():
    """
    Audit failure mode: Typing 'Pune' with existing Lasalgaon GPS coordinates
    must resolve around Pune (~18.52, 73.85), NOT Lasalgaon at 0 km.
    """
    service = StorageService()
    # User had Lasalgaon GPS cached, but explicitly typed "Pune"
    res = service.search_facilities(
        mode="text",
        lat=20.1472,
        lng=74.2281,
        query="Pune",
        radius_km=100.0
    )
    assert res.location_resolved is True
    assert res.resolution_source in ["gazetteer", "geocoder"]
    assert res.query_coords is not None
    # Pune latitude is ~18.52, longitude ~73.85
    lat = res.query_coords["latitude"] if isinstance(res.query_coords, dict) else res.query_coords.latitude
    lng = res.query_coords["longitude"] if isinstance(res.query_coords, dict) else res.query_coords.longitude
    assert 18.0 <= lat <= 19.0
    assert 73.0 <= lng <= 74.5
    # Any returned facilities should have distance relative to Pune, not Lasalgaon (which is ~180-210 km away)
    if res.facilities:
        for f in res.facilities:
            assert f.distance_km is not None
            # If Lasalgaon facility was returned, its distance from Pune must be > 150 km, NEVER 0 km
            if "lasalgaon" in f.name.lower() or "niphad" in f.taluka.lower():
                assert f.distance_km > 150.0


def test_unknown_location_no_silent_fallback():
    """
    Audit failure mode: Searching an unknown location must return a clear no-match state,
    NEVER silently default to Lasalgaon coordinates or facilities.
    """
    service = StorageService()
    res = service.search_facilities(
        mode="text",
        query="NonExistentPlaceXYZ98765",
        radius_km=50.0
    )
    assert res.location_resolved is False
    assert res.resolution_source == "none"
    assert len(res.facilities) == 0
    assert res.query_coords is None
    assert res.warning is not None
    assert "ओळखता आले नाही" in res.warning or "was not recognized" in res.warning


# ---------------------------------------------------------------------------
# 2. Market Prices: No Cross-Market Substitution & Provenance
# ---------------------------------------------------------------------------

def test_cotton_at_ahmednagar_no_cross_market_substitution():
    """
    Audit failure mode: Requesting Cotton at Ahmednagar must return no data / error,
    NEVER silently substitute Jalgaon prices or another market.
    """
    service = GovMandiService()

    # In demo mode:
    with pytest.raises(ValueError) as excinfo:
        service.get_market_data(
            commodity="Cotton",
            market="Ahmednagar",
            time_range="30d",
            mode="demo"
        )
    assert "Cotton at Ahmednagar" in str(excinfo.value)
    assert "No cross-market fallback" in str(excinfo.value)

    # In live mode (or offline test mode where live falls back to genuine/demo without fallback):
    with pytest.raises(ValueError) as excinfo_live:
        service.get_market_data(
            commodity="Cotton",
            market="Ahmednagar",
            time_range="30d",
            mode="live"
        )
    assert "Cotton at Ahmednagar" in str(excinfo_live.value)
    assert "No cross-market fallback" in str(excinfo_live.value)


def test_demo_mode_data_provenance_labels():
    """
    Audit failure mode: Demo mode data must never claim to be live official Agmarknet records.
    Provenance, disclaimer, and mode fields must be unmistakably marked.
    """
    service = GovMandiService()
    res = service.get_market_data(
        commodity="Onion",
        market="Lasalgaon",
        time_range="30d",
        mode="demo"
    )
    assert res.mode == "demo"
    assert "demo" in res.data_source.lower() or "simulated" in res.data_source.lower() or "reference" in res.data_source.lower()
    assert "डेमो" in res.disclaimer or "Demo" in res.disclaimer or "Simulated" in res.disclaimer
    assert res.observation_date is not None
    assert res.last_fetched_at is not None


# ---------------------------------------------------------------------------
# 3. Calendar-Date Range Windows (7d, 30d, 90d)
# ---------------------------------------------------------------------------

def test_range_filters_calendar_date_arithmetic():
    """
    Audit failure mode: 7d, 30d, 90d must represent calendar-date windows,
    not merely slicing the last 7, 30, or 90 rows.
    """
    service = GovMandiService()

    res_7d = service.get_market_data(commodity="Onion", market="Lasalgaon", time_range="7d", mode="demo")
    res_30d = service.get_market_data(commodity="Onion", market="Lasalgaon", time_range="30d", mode="demo")
    res_90d = service.get_market_data(commodity="Onion", market="Lasalgaon", time_range="90d", mode="demo")

    assert len(res_7d.historical_points) > 0
    assert len(res_30d.historical_points) >= len(res_7d.historical_points)
    assert len(res_90d.historical_points) >= len(res_30d.historical_points)

    # Verify calendar boundary for 7d
    latest_dt = datetime.strptime(res_7d.latest_date, "%Y-%m-%d").date()
    cutoff_7d = latest_dt - timedelta(days=7)
    for pt in res_7d.historical_points:
        pt_dt = datetime.strptime(pt.date, "%Y-%m-%d").date()
        assert pt_dt >= cutoff_7d, f"Point date {pt.date} is outside the 7-day calendar window (cutoff {cutoff_7d})"

    # Verify calendar boundary for 30d
    cutoff_30d = latest_dt - timedelta(days=30)
    for pt in res_30d.historical_points:
        pt_dt = datetime.strptime(pt.date, "%Y-%m-%d").date()
        assert pt_dt >= cutoff_30d, f"Point date {pt.date} is outside the 30-day calendar window (cutoff {cutoff_30d})"


# ---------------------------------------------------------------------------
# 4. Calculator Integrity & Cash Shortfall Logic
# ---------------------------------------------------------------------------

def test_strategy_c_cannot_be_recommended_when_cash_shortfall():
    """
    Audit failure mode: Strategy C (Store & Sell Later with Partial Sale)
    must NEVER be recommended as meeting cash needs if is_cash_requirement_met is False.
    """
    req = CalculatorRequest(
        harvest_quantity_quintals=100.0,
        current_price_per_quintal=2000.0,
        current_selling_cost_per_quintal=50.0,
        expected_future_price_per_quintal=2800.0,
        storage_duration_months=3.0,
        storage_cost_per_quintal_month=60.0,
        storage_loss_percentage=5.0,
        future_selling_cost_per_quintal=50.0,
        other_additional_costs=500.0,
        minimum_cash_required=300000.0  # ₹3,00,000 > total proceeds (100 * (2000-50) = 1,95,000)
    )
    resp = evaluate_sell_or_store(req)
    strategy_c = resp.strategy_c_partial

    # Strategy C must explicitly declare cash requirement is NOT met
    assert strategy_c.is_cash_requirement_met is False

    # Recommended strategy must NOT be Strategy C claiming to satisfy urgent cash
    assert resp.recommended_strategy_id != "strategy_c", "Strategy C was recommended even though is_cash_requirement_met is False!"


def test_calculator_extreme_inputs_and_boundaries():
    """
    Audit failure mode: Handle extreme inputs gracefully:
    - 100% storage loss boundary
    - Selling cost >= current price
    - Zero/negative inputs rejected by validation
    """
    # 1. 100% storage loss boundary
    req_100_loss = CalculatorRequest(
        harvest_quantity_quintals=100.0,
        current_price_per_quintal=2000.0,
        current_selling_cost_per_quintal=30.0,
        expected_future_price_per_quintal=3000.0,
        storage_duration_months=2.0,
        storage_cost_per_quintal_month=50.0,
        storage_loss_percentage=100.0,  # 100% loss
        future_selling_cost_per_quintal=30.0,
        other_additional_costs=0.0,
        minimum_cash_required=0.0
    )
    resp_100 = evaluate_sell_or_store(req_100_loss)
    # With 100% loss, stored net income must be negative (storage cost incurred, 0 harvest sold)
    assert resp_100.strategy_b_store_all.total_net_income < 0
    assert resp_100.recommended_strategy_id == "strategy_a"

    # 2. Selling cost >= current price
    req_high_selling_cost = CalculatorRequest(
        harvest_quantity_quintals=50.0,
        current_price_per_quintal=500.0,
        current_selling_cost_per_quintal=600.0,  # Selling cost exceeds current price
        expected_future_price_per_quintal=600.0,
        storage_duration_months=1.0,
        storage_cost_per_quintal_month=20.0,
        storage_loss_percentage=2.0,
        future_selling_cost_per_quintal=50.0,
        other_additional_costs=0.0,
        minimum_cash_required=0.0
    )
    resp_cost = evaluate_sell_or_store(req_high_selling_cost)
    assert resp_cost.strategy_a_sell_now.total_net_income <= 0

    # 3. Invalid negative inputs raise ValueError
    with pytest.raises(ValueError):
        invalid_req = CalculatorRequest(
            harvest_quantity_quintals=-10.0,
            current_price_per_quintal=2000.0,
            current_selling_cost_per_quintal=50.0,
            expected_future_price_per_quintal=2500.0,
            storage_duration_months=2.0,
            storage_cost_per_quintal_month=50.0,
            storage_loss_percentage=5.0,
            future_selling_cost_per_quintal=50.0,
            other_additional_costs=0.0,
            minimum_cash_required=0.0
        )
        evaluate_sell_or_store(invalid_req)


# ---------------------------------------------------------------------------
# 5. Localization Dictionary Key Parity (mr.json, hi.json, en.json)
# ---------------------------------------------------------------------------

def test_locale_dictionary_parity():
    """
    Audit failure mode: Verify that all three localization dictionaries
    (mr.json, hi.json, en.json) have 100% key parity with no missing keys.
    """
    def extract_keys(d, prefix=""):
        keys = set()
        for k, v in d.items():
            full_k = f"{prefix}.{k}" if prefix else k
            if isinstance(v, dict):
                keys.update(extract_keys(v, full_k))
            else:
                keys.add(full_k)
        return keys

    with open(os.path.join(LOCALES_DIR, "en.json"), encoding="utf-8") as f:
        en = json.load(f)
    with open(os.path.join(LOCALES_DIR, "hi.json"), encoding="utf-8") as f:
        hi = json.load(f)
    with open(os.path.join(LOCALES_DIR, "mr.json"), encoding="utf-8") as f:
        mr = json.load(f)

    en_keys = extract_keys(en)
    hi_keys = extract_keys(hi)
    mr_keys = extract_keys(mr)

    diff_hi = en_keys.symmetric_difference(hi_keys)
    diff_mr = en_keys.symmetric_difference(mr_keys)

    assert len(diff_hi) == 0, f"Discrepancy between en.json and hi.json: {diff_hi}"
    assert len(diff_mr) == 0, f"Discrepancy between en.json and mr.json: {diff_mr}"
    assert len(en_keys) == len(hi_keys) == len(mr_keys)
