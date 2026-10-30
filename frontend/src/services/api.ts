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

export class ApiError extends Error {
  public status: number;
  public code: 'HTML_RESPONSE' | 'TIMEOUT' | 'NETWORK_ERROR' | 'HTTP_ERROR' | 'PARSE_ERROR';
  public isBackendOffline: boolean;
  public userMessage: string;

  constructor(
    status: number,
    code: 'HTML_RESPONSE' | 'TIMEOUT' | 'NETWORK_ERROR' | 'HTTP_ERROR' | 'PARSE_ERROR',
    message: string,
    isBackendOffline: boolean = false,
    userMessage?: string
  ) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.isBackendOffline = isBackendOffline;
    this.userMessage = userMessage || message;
  }
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}

export function getErrorMessage(error: unknown, fallback: string = 'An unexpected error occurred'): string {
  if (error instanceof ApiError) {
    return error.userMessage;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return fallback;
}

const rawBase = (import.meta.env.VITE_API_BASE_URL || '').trim().replace(/\/+$/, '');
export const API_BASE = rawBase
  ? (rawBase.endsWith('/api') ? rawBase : `${rawBase}/api`)
  : '/api';

interface ApiFetchOptions extends RequestInit {
  timeoutMs?: number;
  retries?: number;
}

/**
 * Robust HTTP client:
 * 1. Verifies Content-Type includes application/json before parsing.
 * 2. Intercepts HTML responses (common when SPA routing or missing backend serves index.html)
 *    and converts them to typed ApiError with a clean message.
 * 3. Enforces request timeouts via AbortController.
 * 4. Automatic retry on network or server timeouts for idempotent requests.
 * 5. Masks internal parse failures from leaking into UI components.
 */
export async function apiFetch<T>(endpoint: string, options: ApiFetchOptions = {}): Promise<T> {
  const { timeoutMs = 12000, retries = 1, signal: externalSignal, ...fetchOptions } = options;
  const isGet = !fetchOptions.method || fetchOptions.method.toUpperCase() === 'GET';
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  let lastError: Error | null = null;
  const maxAttempts = isGet ? Math.max(1, retries + 1) : 1;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    // Chain external abort signal if provided
    let abortListener: (() => void) | null = null;
    if (externalSignal) {
      if (externalSignal.aborted) {
        clearTimeout(timeoutId);
        throw new ApiError(0, 'TIMEOUT', 'Request was cancelled by user', false, 'Request cancelled');
      }
      abortListener = () => controller.abort();
      externalSignal.addEventListener('abort', abortListener);
    }

    try {
      const res = await fetch(url, {
        ...fetchOptions,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      if (abortListener && externalSignal) {
        externalSignal.removeEventListener('abort', abortListener);
      }

      const contentType = res.headers.get('content-type') || '';
      const isJson = contentType.includes('application/json');

      // Check for HTML returned instead of JSON (P0 root cause)
      if (!isJson) {
        const preview = await res.text().catch(() => '');
        const isHtml = preview.trim().toLowerCase().startsWith('<!doctype') || preview.includes('<html');
        if (isHtml) {
          throw new ApiError(
            res.status,
            'HTML_RESPONSE',
            `Server returned HTML instead of JSON for ${endpoint}. Backend may be offline or misconfigured.`,
            true,
            'सर्व्हर उपलब्ध नाही किंवा चुकीचा कॉन्फिगर केला आहे. (Server is unreachable or misconfigured)'
          );
        }
        throw new ApiError(
          res.status,
          'PARSE_ERROR',
          `Expected application/json but received ${contentType} for ${endpoint}`,
          res.status >= 500,
          'डेटा प्राप्त करताना त्रुटी आली. (Invalid response format from server)'
        );
      }

      if (!res.ok) {
        let errorDetail = `HTTP ${res.status}`;
        try {
          const errJson = await res.json();
          errorDetail = errJson.detail || errJson.message || errorDetail;
        } catch {
          // ignore error JSON parse failure
        }
        throw new ApiError(
          res.status,
          'HTTP_ERROR',
          errorDetail,
          res.status >= 500,
          errorDetail
        );
      }

      const data = await res.json();
      return data as T;
    } catch (err: unknown) {
      clearTimeout(timeoutId);
      if (abortListener && externalSignal) {
        externalSignal.removeEventListener('abort', abortListener);
      }

      if (err instanceof ApiError) {
        lastError = err;
        // Don't retry on client errors (4xx)
        if (err.status >= 400 && err.status < 500 && err.code !== 'HTML_RESPONSE') {
          throw err;
        }
      } else if (err instanceof DOMException && err.name === 'AbortError') {
        lastError = new ApiError(
          0,
          'TIMEOUT',
          `Request to ${endpoint} timed out after ${timeoutMs}ms`,
          true,
          'सर्व्हर प्रतिसाद देण्यास वेळ लागत आहे. (Request timed out. Server may be sleeping/waking up)'
        );
      } else {
        lastError = new ApiError(
          0,
          'NETWORK_ERROR',
          err instanceof Error ? (err instanceof Error ? err.message : String(err)) : 'Network connection failed',
          true,
          'नेटवर्क त्रुटी: सर्व्हरशी संपर्क होऊ शकला नाही. (Network error: Unable to contact server)'
        );
      }

      // Wait a short moment before retry on GET
      if (attempt < maxAttempts - 1) {
        await new Promise((r) => setTimeout(r, 800));
      }
    }
  }

  throw lastError || new ApiError(0, 'NETWORK_ERROR', 'Request failed after retries', true);
}

export async function checkBackendHealth(): Promise<{ healthy: boolean; status: string; detail?: string }> {
  try {
    const data = await apiFetch<{ status: string; pilot_region?: string }>('/health', {
      timeoutMs: 5000,
      retries: 0,
    });
    return {
      healthy: data.status === 'healthy' || data.status === 'ok',
      status: data.status || 'unknown',
    };
  } catch (err) {
    return {
      healthy: false,
      status: 'offline',
      detail: getErrorMessage(err),
    };
  }
}

export async function fetchCrops(): Promise<CropOption[]> {
  return apiFetch<CropOption[]>('/market/crops');
}

export async function fetchMandis(): Promise<MandiOption[]> {
  return apiFetch<MandiOption[]>('/market/mandis');
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

  const queryStr = params.toString();
  return apiFetch<MarketHierarchyResponse>(`/market/hierarchy${queryStr ? `?${queryStr}` : ''}`);
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

  return apiFetch<MarketPriceResponse>(`/market/prices?${params.toString()}`);
}

export async function searchStorageFacilities(
  options: {
    mode?: 'text' | 'coordinates' | 'demo' | 'auto';
    lat?: number;
    lng?: number;
    query?: string;
    crop?: string;
    type?: string;
    radius_km?: number;
  },
  signal?: AbortSignal
): Promise<StorageSearchResponse> {
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

  return apiFetch<StorageSearchResponse>(`/storage/facilities?${params.toString()}`, { signal });
}

export async function fetchStatewiseAggregates(): Promise<StateAggregateResponse> {
  return apiFetch<StateAggregateResponse>('/storage/state-aggregate');
}

export async function fetchDataSources(): Promise<DataSourceRecord[]> {
  return apiFetch<DataSourceRecord[]>('/data-sources');
}

export async function fetchMidhStagingSummary(): Promise<MidhStagingSummary> {
  return apiFetch<MidhStagingSummary>('/storage/staging/summary');
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

  const queryStr = params.toString();
  return apiFetch<MidhStagingResponse>(`/storage/staging/midh-projects${queryStr ? `?${queryStr}` : ''}`);
}

export async function evaluateCalculator(
  payload: CalculatorRequest
): Promise<CalculatorResponse> {
  return apiFetch<CalculatorResponse>('/calculator/evaluate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
}
