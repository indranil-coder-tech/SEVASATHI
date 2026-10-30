import pytest
from fastapi.testclient import TestClient
from hypothesis import given, strategies as st
from app.main import app
from app.storage import calculate_haversine_distance, storage_service

client = TestClient(app)

def test_missing_coordinates_in_coordinate_mode_returns_422():
    """P1.1: GET /api/storage/facilities?mode=coordinates with no lat/lng must return 422, not 500."""
    response = client.get("/api/storage/facilities?mode=coordinates")
    assert response.status_code == 422
    data = response.json()
    assert "detail" in data
    assert "lat" in str(data["detail"]).lower() or "coordinates" in str(data["detail"]).lower()

def test_missing_lat_only_returns_422():
    response = client.get("/api/storage/facilities?mode=coordinates&lng=74.2281")
    assert response.status_code == 422

def test_missing_lng_only_returns_422():
    response = client.get("/api/storage/facilities?mode=coordinates&lat=20.1472")
    assert response.status_code == 422

def test_out_of_range_coordinates_rejected():
    """P1.2: Validate lat in [-90, 90], lng in [-180, 180]."""
    res_lat = client.get("/api/storage/facilities?mode=coordinates&lat=999&lng=74.0")
    assert res_lat.status_code == 422

    res_lng = client.get("/api/storage/facilities?mode=coordinates&lat=20.0&lng=999")
    assert res_lng.status_code == 422

def test_outside_india_bounding_box_advisory_or_rejection():
    """P1.2: Points outside India bounding box (lat ~6-38, lng ~68-98) should yield an advisory warning."""
    response = client.get("/api/storage/facilities?mode=coordinates&lat=51.5074&lng=-0.1278")  # London
    assert response.status_code in [200, 422]
    if response.status_code == 200:
        data = response.json()
        assert data.get("warning") is not None
        assert "india" in data["warning"].lower() or "outside" in data["warning"].lower() or "महाराष्ट्र" in data["warning"]

def test_negative_radius_rejected():
    """P1.3: radius_km must be > 0."""
    response = client.get("/api/storage/facilities?radius_km=-5")
    assert response.status_code == 422

def test_zero_radius_rejected():
    """P1.3: radius_km=0 is invalid (gt=0)."""
    response = client.get("/api/storage/facilities?radius_km=0")
    assert response.status_code == 422

def test_excessive_radius_rejected():
    """P1.3: radius_km over sane max (e.g. > 1000) rejected with 422."""
    response = client.get("/api/storage/facilities?radius_km=50000")
    assert response.status_code == 422

def test_sangli_gps_search_provides_nearest_fallback_or_metadata():
    """P1.4: GPS search from Sangli (16.8524, 74.5815) returns nearest facility info even if 0 inside small radius."""
    response = client.get("/api/storage/facilities?mode=coordinates&lat=16.8524&lng=74.5815&radius_km=25")
    assert response.status_code == 200
    data = response.json()
    assert data["location_resolved"] is True
    # If 0 facilities within 25km, metadata must provide the nearest facility regardless of radius
    assert "nearest_facility" in data or "nearest_facility_distance_km" in data or data.get("total_found", 0) > 0

@given(
    lat1=st.floats(min_value=-89.0, max_value=89.0),
    lng1=st.floats(min_value=-179.0, max_value=179.0),
    lat2=st.floats(min_value=-89.0, max_value=89.0),
    lng2=st.floats(min_value=-179.0, max_value=179.0)
)
def test_haversine_hypothesis_properties(lat1, lng1, lat2, lng2):
    """Property test: Haversine distance is symmetric, non-negative, and <= Earth circumference."""
    d1 = calculate_haversine_distance(lat1, lng1, lat2, lng2)
    d2 = calculate_haversine_distance(lat2, lng2, lat1, lng1)
    assert d1 >= 0.0
    assert abs(d1 - d2) < 1e-4
    assert d1 <= 20038.0  # Max half-circumference of Earth (~20,015 km)
