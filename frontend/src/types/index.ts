export interface PricePoint {
  date: string;
  modal_price: number;
  min_price: number;
  max_price: number;
  arrival_tonnes?: number | null;
  is_forecast: boolean;
  lower_bound?: number;
  upper_bound?: number;
}

export interface MarketPriceResponse {
  state: string;
  district: string;
  market: string;
  commodity: string;
  variety: string;
  latest_date: string;
  latest_modal_price: number;
  latest_min_price: number;
  latest_max_price: number;
  latest_arrival_tonnes?: number | null;
  arrival_reported: boolean;
  price_change_7d: number;
  price_change_7d_pct: number;
  price_trend: 'rising' | 'falling' | 'stable';
  trend_summary: string;
  data_source: string;
  last_updated: string;
  disclaimer: string;
  historical_points: PricePoint[];
  forecast_points: PricePoint[];
  is_forecast_available: boolean;
  forecast_status_message?: string | null;
  observation_date?: string;
  last_fetched_at?: string;
  mode: 'live' | 'demo';
}

export interface MarketHierarchyResponse {
  states: string[];
  districts: string[];
  mandis: string[];
  commodities: string[];
  varieties: string[];
  selected_state?: string;
  selected_district?: string;
  selected_mandi?: string;
  selected_commodity?: string;
}

export interface CropOption {
  id: string;
  name: string;
  category: string;
  is_pilot: boolean;
}

export interface MandiOption {
  id: string;
  name: string;
  district: string;
  state: string;
  default_crop?: string;
  latitude?: number;
  longitude?: number;
}

export interface StorageFacility {
  id: string;
  facility_id?: string;
  name: string;
  facility_name?: string;
  facility_type: string;
  facility_category?: string;
  state?: string;
  district: string;
  subdistrict_tehsil?: string;
  taluka: string;
  village_town?: string;
  address: string;
  pincode: string;
  latitude?: number;
  longitude?: number;
  accepted_crops: string;
  accepted_commodities?: string;
  storage_method?: string;
  capacity_metric_tonnes?: number;
  capacity_total_mt?: number;
  capacity_available_mt?: number;
  storage_price_per_quintal_month?: number;
  fee_per_quintal_month_inr?: number;
  contact_phone?: string;
  contact_email?: string;
  registration_authority?: string;
  registration_id?: string;
  verification_status?: string;
  verified_by?: string;
  verification_date?: string;
  availability_status?: string;
  status: string;
  source_name?: string;
  source_url?: string;
  source_record_date?: string;
  last_verified_at?: string;
  location_precision?: string;
  booking_required?: boolean;
  humidity_control: boolean;
  aeration_system: boolean;
  notes: string;
  distance_km?: number;
}

export interface StorageSearchResponse {
  total_found: number;
  query_location?: string;
  query_coords?: { latitude: number; longitude: number };
  distance_type: string;
  facilities: StorageFacility[];
  nearest_facility?: StorageFacility;
  nearest_facility_distance_km?: number;
  location_resolved?: boolean;
  resolution_source?: string;
  search_radius_km?: number;
  warning?: string;
}

export interface StateAggregateRecord {
  state_ut_as_published: string;
  reported_cold_storage_count: number;
  reported_capacity_mt: number;
  as_of_date: string;
  source_url: string;
  source_type: string;
  data_quality_note?: string;
}

export interface StateAggregateResponse {
  national_total_storages: number;
  national_total_capacity_mt: number;
  as_of_date: string;
  source_url: string;
  data_quality_disclaimer: string;
  records: StateAggregateRecord[];
}

export interface DataSourceRecord {
  source_name: string;
  source_type: string;
  coverage: string;
  granularity: string;
  use_in_sevasathi: string;
  important_fields_or_capabilities: string;
  limitations: string;
  last_seen_or_reference_date: string;
  url: string;
}

export interface MidhProjectRecord {
  project_id: string;
  sr_no: number;
  district_raw: string;
  district_normalized: string;
  financial_year: string;
  beneficiary_name_raw: string;
  address_raw: string;
  taluka_normalized?: string;
  pincode?: string;
  subsidy_disbursed_lakh_inr: number;
  capacity_mt: number;
  source_document: string;
  source_page: number;
  record_type: string;
  operational_status: string;
  verification_status: string;
  review_flags: string;
  notes: string;
}

export interface MidhStagingSummary {
  total_projects: number;
  total_capacity_mt: number;
  total_subsidy_lakh_inr: number;
  review_flags_count: number;
  districts_count: number;
  years_covered: string;
  data_integrity_notice: string;
}

export interface MidhStagingResponse {
  summary: MidhStagingSummary;
  total_filtered: number;
  projects: MidhProjectRecord[];
}



export interface CalculatorRequest {
  harvest_quantity_quintals: number;
  current_price_per_quintal: number;
  current_selling_cost_per_quintal: number;
  expected_future_price_per_quintal: number;
  storage_duration_months: number;
  storage_cost_per_quintal_month: number;
  storage_loss_percentage: number;
  future_selling_cost_per_quintal: number;
  other_additional_costs: number;
  minimum_cash_required: number;
}

export interface StrategyDetail {
  strategy_id: string;
  name: string;
  tagline: string;
  immediate_quantity_sold: number;
  immediate_cash_net: number;
  stored_quantity_initial: number;
  stored_quantity_net_after_loss: number;
  loss_quantity_quintals: number;
  storage_cost_total: number;
  future_gross_revenue: number;
  future_net_realized: number;
  total_net_income: number;
  net_difference_vs_immediate: number;
  percentage_gain_vs_immediate: number;
  is_cash_requirement_met: boolean;
  verdict: string;
  pros: string[];
  risks: string[];
}

export interface CalculatorResponse {
  harvest_quantity: number;
  break_even_future_price: number;
  recommended_strategy_id: string;
  decision_rationale: string;
  assumptions_summary: string[];
  disclaimer: string;
  strategy_a_sell_now: StrategyDetail;
  strategy_b_store_all: StrategyDetail;
  strategy_c_partial: StrategyDetail;
}
