from typing import List, Optional
from pydantic import BaseModel, Field

# Market Models
class PricePoint(BaseModel):
    date: str
    modal_price: float
    min_price: float
    max_price: float
    arrival_tonnes: Optional[float] = None
    is_forecast: bool = False
    lower_bound: Optional[float] = None
    upper_bound: Optional[float] = None

class MarketPriceResponse(BaseModel):
    state: str
    district: str
    market: str
    commodity: str
    variety: str
    latest_date: str
    latest_modal_price: float
    latest_min_price: float
    latest_max_price: float
    latest_arrival_tonnes: Optional[float] = None
    arrival_reported: bool = False
    price_change_7d: float = 0.0
    price_change_7d_pct: float = 0.0
    price_trend: str  # "rising" | "falling" | "stable"
    trend_summary: str
    data_source: str
    last_updated: str
    disclaimer: str
    historical_points: List[PricePoint] = Field(default_factory=list)
    forecast_points: List[PricePoint] = Field(default_factory=list)
    is_forecast_available: bool = False
    forecast_status_message: Optional[str] = None
    observation_date: Optional[str] = None
    last_fetched_at: Optional[str] = None
    mode: str = "live"

class CropOption(BaseModel):
    id: str
    name: str
    category: str
    is_pilot: bool = False

class MandiOption(BaseModel):
    id: str
    name: str
    district: str
    state: str
    default_crop: Optional[str] = "onion"
    latitude: Optional[float] = None
    longitude: Optional[float] = None

class MarketHierarchyResponse(BaseModel):
    states: List[str]
    districts: List[str]
    mandis: List[str]
    commodities: List[str]
    varieties: List[str]
    selected_state: Optional[str] = None
    selected_district: Optional[str] = None
    selected_mandi: Optional[str] = None
    selected_commodity: Optional[str] = None

# Storage Models
class StorageFacility(BaseModel):
    id: str
    facility_id: Optional[str] = None
    name: str
    facility_name: Optional[str] = None
    facility_type: str
    facility_category: Optional[str] = None
    state: str = "Maharashtra"
    district: str
    subdistrict_tehsil: Optional[str] = None
    taluka: str
    village_town: Optional[str] = None
    address: str
    pincode: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    accepted_crops: str
    accepted_commodities: Optional[str] = None
    storage_method: Optional[str] = None
    capacity_metric_tonnes: Optional[float] = None
    capacity_total_mt: Optional[float] = None
    capacity_available_mt: Optional[float] = None
    storage_price_per_quintal_month: Optional[float] = None
    fee_per_quintal_month_inr: Optional[float] = None
    contact_phone: Optional[str] = None
    contact_email: Optional[str] = None
    registration_authority: Optional[str] = None
    registration_id: Optional[str] = None
    verification_status: str = "unverified"
    verified_by: Optional[str] = None
    verification_date: Optional[str] = None
    availability_status: str = "unknown"
    status: str = "unknown"
    source_name: Optional[str] = None
    source_url: Optional[str] = None
    source_record_date: Optional[str] = None
    last_verified_at: Optional[str] = None
    location_precision: Optional[str] = "exact_pin"
    booking_required: Optional[bool] = None
    humidity_control: bool = False
    aeration_system: bool = False
    notes: str = ""
    distance_km: Optional[float] = None

class StorageSearchResponse(BaseModel):
    total_found: int
    query_location: Optional[str] = None
    query_coords: Optional[dict] = None
    distance_type: str = "Geodesic straight-line approximation"
    facilities: List[StorageFacility]
    location_resolved: bool = True
    resolution_source: str = "none"  # "gazetteer", "geocoder", "gps", "manual", "none", "demo"
    search_radius_km: Optional[float] = None
    warning: Optional[str] = None

# State Aggregate & Provenance Models
class StateAggregateRecord(BaseModel):
    state_ut_as_published: str
    reported_cold_storage_count: int
    reported_capacity_mt: int
    as_of_date: str
    source_url: str
    source_type: str
    data_quality_note: Optional[str] = None

class StateAggregateResponse(BaseModel):
    national_total_storages: int
    national_total_capacity_mt: int
    as_of_date: str
    source_url: str
    data_quality_disclaimer: str
    records: List[StateAggregateRecord]

class DataSourceRecord(BaseModel):
    source_name: str
    source_type: str
    coverage: str
    granularity: str
    use_in_sevasathi: str
    important_fields_or_capabilities: str
    limitations: str
    last_seen_or_reference_date: str
    url: str

# Maharashtra MIDH Cold Storage Historical Staging Models
class MidhProjectRecord(BaseModel):
    project_id: str
    sr_no: int
    district_raw: str
    district_normalized: str
    financial_year: str
    beneficiary_name_raw: str
    address_raw: str
    taluka_normalized: Optional[str] = None
    pincode: Optional[str] = None
    subsidy_disbursed_lakh_inr: float
    capacity_mt: float
    source_document: str
    source_page: int
    record_type: str = "Government Subsidy Project"
    operational_status: str = "unverified_historical_project"
    verification_status: str = "government_listed_project"
    review_flags: str = "Clean"
    notes: str = ""

class MidhStagingSummary(BaseModel):
    total_projects: int
    total_capacity_mt: float
    total_subsidy_lakh_inr: float
    review_flags_count: int
    districts_count: int
    years_covered: str
    data_integrity_notice: str

class MidhStagingResponse(BaseModel):
    summary: MidhStagingSummary
    total_filtered: int
    projects: List[MidhProjectRecord]



# Calculator Models
class CalculatorRequest(BaseModel):
    harvest_quantity_quintals: float = Field(gt=0, description="Harvest volume in quintals")
    current_price_per_quintal: float = Field(gt=0, description="Current market price in Rs/quintal")
    current_selling_cost_per_quintal: float = Field(ge=0, default=50.0, description="Mandi handling, transport, cess")
    expected_future_price_per_quintal: float = Field(gt=0, description="Expected price after storage in Rs/quintal")
    storage_duration_months: float = Field(gt=0, default=2.0, description="Planned storage months")
    storage_cost_per_quintal_month: float = Field(ge=0, default=45.0, description="Storage fee in Rs/q/month")
    storage_loss_percentage: float = Field(ge=0, le=100, default=7.0, description="Expected physiological weight loss & shrinkage %")
    future_selling_cost_per_quintal: float = Field(ge=0, default=50.0, description="Future transport and cess per quintal")
    other_additional_costs: float = Field(ge=0, default=500.0, description="Unloading, inspection, bag replacement")
    minimum_cash_required: float = Field(ge=0, default=0.0, description="Immediate liquidity need in Rs")

class StrategyDetail(BaseModel):
    strategy_id: str
    name: str
    tagline: str
    immediate_quantity_sold: float
    immediate_cash_net: float
    stored_quantity_initial: float
    stored_quantity_net_after_loss: float
    loss_quantity_quintals: float
    storage_cost_total: float
    future_gross_revenue: float
    future_net_realized: float
    total_net_income: float
    net_difference_vs_immediate: float
    percentage_gain_vs_immediate: float
    is_cash_requirement_met: bool
    verdict: str
    pros: List[str]
    risks: List[str]

class CalculatorResponse(BaseModel):
    harvest_quantity: float
    break_even_future_price: float
    recommended_strategy_id: str
    decision_rationale: str
    assumptions_summary: List[str]
    disclaimer: str
    strategy_a_sell_now: StrategyDetail
    strategy_b_store_all: StrategyDetail
    strategy_c_partial: StrategyDetail
