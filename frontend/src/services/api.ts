import type {
  CropOption,
  MandiOption,
  MarketPriceResponse,
  MarketHierarchyResponse,
  StorageSearchResponse,
  CalculatorRequest,
  CalculatorResponse,
  StateAggregateResponse,
  DataSourceRecord,
  MidhStagingSummary,
  MidhStagingResponse,
} from '../types';

const rawBase = (import.meta.env.VITE_API_BASE_URL || '').trim().replace(/\/+$/, '');
const API_BASE = rawBase
  ? (rawBase.endsWith('/api') ? rawBase : `${rawBase}/api`)
  : '/api';

export async function fetchCrops(): Promise<CropOption[]> {
  const res = await fetch(`${API_BASE}/market/crops`);
  if (!res.ok) {
    throw new Error(`Failed to load crops (${res.status})`);
  }
  return res.json();
}

export async function fetchMandis(): Promise<MandiOption[]> {
  const res = await fetch(`${API_BASE}/market/mandis`);
  if (!res.ok) {
    throw new Error(`Failed to load mandis (${res.status})`);
  }
  return res.json();
}

export async function fetchMarketHierarchy(options?: {
  state?: string;
  district?: string;
  market?: string;
  commodity?: string;
}): Promise<MarketHierarchyResponse> {
  const params = new URLSearchParams();
  if (options?.state) params.set('state', options.state);
  if (options?.district) params.set('district', options.district);
  if (options?.market) params.set('market', options.market);
  if (options?.commodity) params.set('commodity', options.commodity);

  const res = await fetch(`${API_BASE}/market/hierarchy?${params.toString()}`);
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || `Failed to fetch market hierarchy (${res.status})`);
  }
  return res.json();
}

export interface FetchMarketPricesParams {
  crop?: string;
  mandi?: string;
  state?: string;
  district?: string;
  market?: string;
  commodity?: string;
  variety?: string;
  range?: string;
  forecastDays?: number;
  mode?: 'live' | 'demo';
}

export async function fetchMarketPrices(
  paramOrCrop: FetchMarketPricesParams | string = 'onion',
  legacyMandi?: string,
  legacyRange: string = '30d',
  legacyForecastDays: number = 7
): Promise<MarketPriceResponse> {
  const params = new URLSearchParams();

  if (typeof paramOrCrop === 'string') {
    params.set('crop', paramOrCrop);
    if (legacyMandi) params.set('mandi', legacyMandi);
    params.set('range', legacyRange);
    params.set('forecast_days', legacyForecastDays.toString());
  } else {
    if (paramOrCrop.crop) params.set('crop', paramOrCrop.crop);
    if (paramOrCrop.mandi) params.set('mandi', paramOrCrop.mandi);
    if (paramOrCrop.state) params.set('state', paramOrCrop.state);
    if (paramOrCrop.district) params.set('district', paramOrCrop.district);
    if (paramOrCrop.market) params.set('market', paramOrCrop.market);
    if (paramOrCrop.commodity) params.set('commodity', paramOrCrop.commodity);
    if (paramOrCrop.variety) params.set('variety', paramOrCrop.variety);
    if (paramOrCrop.range) params.set('range', paramOrCrop.range);
    if (paramOrCrop.forecastDays) params.set('forecast_days', paramOrCrop.forecastDays.toString());
    if (paramOrCrop.mode) params.set('mode', paramOrCrop.mode);
  }

  const res = await fetch(`${API_BASE}/market/prices?${params.toString()}`);
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || `Failed to fetch market data (${res.status})`);
  }
  return res.json();
}

export async function searchStorageFacilities(options: {
  mode?: 'text' | 'coordinates' | 'demo' | 'auto';
  lat?: number;
  lng?: number;
  query?: string;
  crop?: string;
  type?: string;
  radius_km?: number;
}): Promise<StorageSearchResponse> {
  const params = new URLSearchParams();
  if (options.mode) {
    params.set('mode', options.mode);
  }
  if (options.lat !== undefined && options.lng !== undefined) {
    params.set('lat', options.lat.toString());
    params.set('lng', options.lng.toString());
  }
  if (options.query) {
    params.set('query', options.query);
  }
  if (options.crop) {
    params.set('crop', options.crop);
  }
  if (options.type) {
    params.set('type', options.type);
  }
  if (options.radius_km !== undefined) {
    params.set('radius_km', options.radius_km.toString());
  }

  const res = await fetch(`${API_BASE}/storage/facilities?${params.toString()}`);
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || `Failed to search storage facilities (${res.status})`);
  }
  return res.json();
}

export async function fetchStatewiseAggregates(): Promise<StateAggregateResponse> {
  const res = await fetch(`${API_BASE}/storage/state-aggregate`);
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || `Failed to fetch state aggregate data (${res.status})`);
  }
  return res.json();
}

export async function fetchDataSources(): Promise<DataSourceRecord[]> {
  const res = await fetch(`${API_BASE}/data-sources`);
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || `Failed to fetch data source register (${res.status})`);
  }
  return res.json();
}

export async function fetchMidhStagingSummary(): Promise<MidhStagingSummary> {
  const res = await fetch(`${API_BASE}/storage/staging/summary`);
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || `Failed to fetch MIDH staging summary (${res.status})`);
  }
  return res.json();
}

export async function fetchMidhStagingProjects(options?: {
  district?: string;
  financial_year?: string;
  query?: string;
  flag_filter?: string;
  limit?: number;
  offset?: number;
}): Promise<MidhStagingResponse> {
  const params = new URLSearchParams();
  if (options?.district) params.set('district', options.district);
  if (options?.financial_year) params.set('financial_year', options.financial_year);
  if (options?.query) params.set('query', options.query);
  if (options?.flag_filter) params.set('flag_filter', options.flag_filter);
  if (options?.limit !== undefined) params.set('limit', options.limit.toString());
  if (options?.offset !== undefined) params.set('offset', options.offset.toString());

  const res = await fetch(`${API_BASE}/storage/staging/midh-projects?${params.toString()}`);
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || `Failed to query MIDH projects (${res.status})`);
  }
  return res.json();
}

export async function evaluateCalculator(
  payload: CalculatorRequest
): Promise<CalculatorResponse> {
  const res = await fetch(`${API_BASE}/calculator/evaluate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || `Calculation failed (${res.status})`);
  }
  return res.json();
}
