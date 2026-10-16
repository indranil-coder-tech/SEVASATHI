import pytest
import pandas as pd
from app.storage import calculate_haversine_distance, storage_service

def test_haversine_distance_known():
    # Lasalgaon APMC (20.1472, 74.2281) to Pimpalgaon Baswant (20.1741, 73.9856)
    # Geodesic straight-line distance is approx 25-26 km
    dist = calculate_haversine_distance(20.1472, 74.2281, 20.1741, 73.9856)
    assert 24.0 <= dist <= 28.0

# 1. If typed query is Pune while old GPS coordinates are near Lasalgaon, results are resolved around Pune—not Lasalgaon.
def test_typed_pune_with_stale_lasalgaon_gps():
    res = storage_service.search_facilities(
        mode="text",
        lat=20.1472,  # Stale GPS near Lasalgaon
        lng=74.2281,
        query="Pune",
        radius_km=100.0
    )
    assert res.location_resolved is True
    assert res.resolution_source in ["gazetteer", "geocoder"]
    assert res.query_coords is not None
    assert abs(res.query_coords["latitude"] - 18.5204) < 0.1
    assert abs(res.query_coords["longitude"] - 73.8567) < 0.1
    assert res.total_found > 0
    # First facility must be in Pune district, not Lasalgaon (Nashik)
    assert res.facilities[0].district == "Pune"
    assert "Nashik" not in res.facilities[0].district

# 2. An unrecognized village does not silently produce Lasalgaon results.
def test_unrecognized_village_no_silent_lasalgaon_fallback():
    res = storage_service.search_facilities(
        mode="text",
        query="NonExistentUnknownVillage12345"
    )
    assert res.location_resolved is False
    assert res.resolution_source == "none"
    assert res.total_found == 0
    assert len(res.facilities) == 0
    assert res.warning is not None
    assert "ओळखता आले नाही" in res.warning or "not recognized" in res.warning
    # Confirm no silent Lasalgaon facility was returned
    assert all("Lasalgaon" not in f.name for f in res.facilities)

# 3. A valid PIN code resolves to the correct place or returns a clear no-match.
def test_pin_code_resolution_and_invalid_pin():
    # Valid PIN for Lasalgaon (422306)
    res_valid = storage_service.search_facilities(query="422306", radius_km=50.0)
    assert res_valid.location_resolved is True
    assert res_valid.total_found > 0
    assert res_valid.facilities[0].distance_km < 5.0
    assert res_valid.facilities[0].pincode == "422306"

    # Valid PIN for Pune Gultekdi (411037)
    res_pune_pin = storage_service.search_facilities(query="411037", radius_km=50.0)
    assert res_pune_pin.location_resolved is True
    assert res_pune_pin.facilities[0].district == "Pune"

    # Invalid non-existent PIN
    res_invalid = storage_service.search_facilities(query="999999")
    assert res_invalid.location_resolved is False
    assert res_invalid.total_found == 0
    assert len(res_invalid.facilities) == 0

# 4. District/taluka and Marathi alias queries are normalized correctly.
def test_marathi_aliases_normalization():
    # Marathi: 'पुणे' (Pune)
    res_pune = storage_service.search_facilities(query="पुणे", radius_km=100.0)
    assert res_pune.location_resolved is True
    assert res_pune.total_found > 0
    assert res_pune.facilities[0].district == "Pune"

    # Marathi: 'नाशिक' (Nashik)
    res_nsk = storage_service.search_facilities(query="नाशिक", radius_km=50.0)
    assert res_nsk.location_resolved is True
    assert res_nsk.facilities[0].district == "Nashik"

    # Marathi: 'अहमदनगर' (Ahmednagar)
    res_ahm = storage_service.search_facilities(query="अहमदनगर", radius_km=100.0)
    assert res_ahm.location_resolved is True
    assert any(f.district == "Ahmednagar" for f in res_ahm.facilities)

    # Marathi: 'लासलगाव' (Lasalgaon)
    res_lsl = storage_service.search_facilities(query="लासलगाव", radius_km=25.0)
    assert res_lsl.location_resolved is True
    assert "Lasalgaon" in res_lsl.facilities[0].name

# 5. Crop and type filters return only compatible records.
def test_crop_and_type_filters_compatibility():
    # Crop filter: Grains
    res_grain = storage_service.search_facilities(
        query="Pune",
        crop_filter="grain",
        radius_km=100.0
    )
    for fac in res_grain.facilities:
        assert any(term in fac.accepted_crops.lower() for term in ["grain", "soyabean", "pulses", "wheat"])
        # Ventilated onion chawls are not for dry grains
        assert "ventilated" not in fac.facility_type.lower()

    # Facility type filter: Ventilated Onion Chawl
    res_chawl = storage_service.search_facilities(
        query="Nashik",
        type_filter="ventilated",
        radius_km=100.0
    )
    for fac in res_chawl.facilities:
        assert "ventilated" in fac.facility_type.lower() or "chawl" in fac.facility_type.lower()

    # Facility type filter: Refrigerated Cold Storage
    res_cold = storage_service.search_facilities(
        query="Nashik",
        type_filter="cold",
        radius_km=100.0
    )
    for fac in res_cold.facilities:
        assert "cold" in fac.facility_type.lower() or "refrigerated" in fac.facility_type.lower()

# 6. Radius filtering removes distant facilities and gives a clear empty state when none is nearby.
def test_radius_filtering_and_empty_state():
    # Pune with tight 5 km radius
    res_tight = storage_service.search_facilities(query="Pune", radius_km=5.0)
    for fac in res_tight.facilities:
        assert fac.distance_km <= 5.0
    
    # Tiny radius where no facilities exist
    res_empty = storage_service.search_facilities(query="Pune", radius_km=0.1)
    assert res_empty.total_found == 0
    assert len(res_empty.facilities) == 0
    assert res_empty.warning is not None
    assert "Radius" in res_empty.warning or "वाढवा" in res_empty.warning

# 7. Coordinates-only GPS search still works.
def test_coordinates_only_gps_search():
    res = storage_service.search_facilities(
        mode="coordinates",
        lat=20.1472,
        lng=74.2281,
        radius_km=25.0
    )
    assert res.location_resolved is True
    assert res.resolution_source == "gps"
    assert res.total_found > 0
    assert res.facilities[0].distance_km < 1.0
    assert "Lasalgaon" in res.facilities[0].name

# 8. Missing data and unverified status are displayed honestly.
def test_missing_data_and_honest_reporting():
    res = storage_service.search_facilities(query="Nashik", radius_km=100.0)
    # Check that some facilities have None/null fees and capacities instead of fabricated zeros
    has_null_fee = any(f.storage_price_per_quintal_month is None for f in res.facilities)
    assert has_null_fee is True, "Unverified facility fees must remain None/null rather than guessed or set to zero"

    # Check verification status field
    for fac in res.facilities:
        assert fac.verification_status in ["officially_registered", "self_reported", "unverified", "pending_verification"]

# 9. Market data provenance: synthetic data is clearly labeled as SIMULATED DEMO DATA.
def test_mandi_prices_provenance_label():
    from app.storage import DATA_DIR
    import os
    prices_csv = os.path.join(DATA_DIR, "mandi_prices_maharashtra.csv")
    df = pd.read_csv(prices_csv)
    assert "data_source" in df.columns
    unique_sources = df["data_source"].unique()
    assert any("SIMULATED DEMO DATA" in src for src in unique_sources), (
        "Mandi price prototype dataset must be labeled clearly as SIMULATED DEMO DATA"
    )
    # Confirm it does not falsely claim to be official AGMARKNET history without simulation notice
    assert not any(src.strip() == "AGMARKNET / Directorate of Marketing & Inspection, Govt of India" for src in unique_sources)

# 10. State aggregate dataset and data source register integration.
def test_statewise_aggregates_and_data_sources():
    agg = storage_service.get_statewise_aggregates()
    assert agg.national_total_storages > 8000
    assert agg.national_total_capacity_mt > 35000000
    assert len(agg.records) >= 30
    # Confirm Maharashtra is present
    mh_rec = next((r for r in agg.records if "Maharashtra" in r.state_ut_as_published), None)
    assert mh_rec is not None
    assert mh_rec.reported_cold_storage_count == 672

    sources = storage_service.get_data_sources()
    assert len(sources) >= 5
    assert any("NHB" in s.source_name for s in sources)
    assert any("WDRA" in s.source_name for s in sources)
    assert any("MIDH" in s.source_name for s in sources)

# 11. MIDH Historical Staging Dataset Integrity & Verification
def test_midh_staging_dataset_integrity():
    summary = storage_service.get_midh_staging_summary()
    assert summary.total_projects == 183, f"Expected 183 projects, got {summary.total_projects}"
    assert abs(summary.total_subsidy_lakh_inr - 11550.43) < 0.1, f"Subsidy total mismatch: {summary.total_subsidy_lakh_inr}"
    assert summary.districts_count == 20, f"Expected 20 districts, got {summary.districts_count}"
    assert summary.review_flags_count > 0, "Expected review flags to be detected"
    
    # Check all records
    res = storage_service.get_midh_staging_projects(limit=250)
    assert res.total_filtered == 183
    assert len(res.projects) == 183

    for p in res.projects:
        assert p.operational_status == "unverified_historical_project", (
            f"Record {p.project_id} must have operational_status 'unverified_historical_project'"
        )
        assert p.verification_status == "government_listed_project", (
            f"Record {p.project_id} must have verification_status 'government_listed_project'"
        )
        assert p.source_document == "Maharashtra State MIDH Cold Storage & Integrated Cold Chain Beneficiaries List (2005-06 to 2022-23)"
        assert 1 <= p.source_page <= 8

# 12. MIDH Duplicate & Expansion Detection
def test_midh_duplicate_and_expansion_detection():
    # Filter by duplicates / expansions
    dup_res = storage_service.get_midh_staging_projects(flag_filter="duplicate")
    assert dup_res.total_filtered >= 8, f"Expected at least 8 duplicate/expansion records, got {dup_res.total_filtered}"
    
    # Verify specific known expansions and duplicates from PDF
    flagged_sr_nos = {p.sr_no for p in dup_res.projects}
    # Sr 32 is expansion of Sr 31 (Agarwal Cold Storage)
    assert 32 in flagged_sr_nos, "Sr 32 (Agarwal expansion) should be flagged"
    # Sr 65 is expansion of Sr 55 (Deccan Cold Storage)
    assert 65 in flagged_sr_nos, "Sr 65 (Deccan expansion) should be flagged"
    # Sr 159 is duplicate address of Sr 155 (Madhav Agro Exports)
    assert 159 in flagged_sr_nos, "Sr 159 (Madhav Agro duplicate) should be flagged"

# 13. MIDH Historical Projects kept separate from Operational Facilities Search
def test_midh_staging_separate_from_operational_facilities():
    # Regular operational search should only query storage_facilities_maharashtra.csv
    search_res = storage_service.search_facilities(query="Nashik", radius_km=100.0)
    for fac in search_res.facilities:
        assert fac.verification_status != "government_listed_project", (
            "Operational facility search must not mix unverified historical MIDH projects"
        )
        assert not fac.id.startswith("MIDH-"), (
            "MIDH project IDs should not leak into operational facility search results"
        )

# 14. MIDH Missing Coordinates preserved (no false centroids assigned to facilities)
def test_midh_missing_coordinates_preserved():
    # Staging projects must not have false coordinates assigned as facility coordinates
    res = storage_service.get_midh_staging_projects(limit=250)
    for p in res.projects:
        # None of the staging records should pretend to have exact GPS coordinates
        # Address and taluka are preserved, but coordinates are left uninvented
        assert not hasattr(p, "latitude") or p.latitude is None

