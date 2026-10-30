import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  apiFetch,
  ApiError,
  checkBackendHealth,
  fetchCrops,
  fetchMandis,
  fetchMarketHierarchy,
  fetchMarketPrices,
  searchStorageFacilities,
  fetchStatewiseAggregates,
  fetchDataSources,
  fetchMidhStagingSummary,
  fetchMidhStagingProjects,
  evaluateCalculator,
  getErrorMessage,
  isApiError,
} from '../services/api';

describe('Hardened API Client (api.ts)', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('TC-RES-01: Intercepts HTML response instead of JSON and throws typed ApiError (P0 bug fix)', async () => {
    global.fetch = vi.fn().mockImplementation(() =>
      Promise.resolve(
        new Response('<!DOCTYPE html><html><head><title>SevaSathi</title></head><body><div id="root"></div></body></html>', {
          status: 200,
          headers: {
            'content-type': 'text/html; charset=utf-8',
          },
        })
      )
    );

    try {
      await fetchCrops();
      expect.fail('Should have thrown an ApiError');
    } catch (err: unknown) {
      expect(isApiError(err)).toBe(true);
      if (err instanceof ApiError) {
        expect(err.code).toBe('HTML_RESPONSE');
        expect(err.isBackendOffline).toBe(true);
        // Verify no raw parser error leaked
        expect(err.message).not.toContain("Unexpected token '<'");
        expect(err.userMessage).toContain('सर्व्हर उपलब्ध नाही किंवा चुकीचा कॉन्फिगर केला आहे');
      }
    }
  });

  it('TC-RES-02: Times out using AbortController when server hangs', async () => {
    global.fetch = vi.fn().mockImplementation((_url, options) => {
      return new Promise((_, reject) => {
        const signal = options?.signal as AbortSignal | undefined;
        if (signal) {
          signal.addEventListener('abort', () => {
            const abortErr = new DOMException('The user aborted a request.', 'AbortError');
            reject(abortErr);
          });
        }
      });
    });

    try {
      await apiFetch('/storage/facilities', { timeoutMs: 50, retries: 0 });
      expect.fail('Should have timed out');
    } catch (err: unknown) {
      expect(isApiError(err)).toBe(true);
      if (err instanceof ApiError) {
        expect(err.code).toBe('TIMEOUT');
        expect(err.isBackendOffline).toBe(true);
      }
    }
  });

  it('Retries GET requests once on network failure', async () => {
    let callCount = 0;
    global.fetch = vi.fn().mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        return Promise.reject(new Error('Failed to fetch'));
      }
      return Promise.resolve(
        new Response(JSON.stringify([{ id: 'onion', name: 'Onion', category: 'Vegetable', is_pilot: true }]), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        })
      );
    });

    const crops = await fetchCrops();
    expect(callCount).toBe(2);
    expect(crops).toHaveLength(1);
    expect(crops[0].id).toBe('onion');
  });

  it('Does not retry 4xx client errors', async () => {
    let callCount = 0;
    global.fetch = vi.fn().mockImplementation(() => {
      callCount++;
      return Promise.resolve(
        new Response(JSON.stringify({ detail: 'Invalid parameters' }), {
          status: 422,
          headers: { 'content-type': 'application/json' },
        })
      );
    });

    try {
      await searchStorageFacilities({ mode: 'coordinates' });
      expect.fail('Should fail with 422');
    } catch (err: unknown) {
      expect(callCount).toBe(1); // No retries on 4xx
      expect(isApiError(err)).toBe(true);
      if (err instanceof ApiError) {
        expect(err.status).toBe(422);
        expect(err.userMessage).toBe('Invalid parameters');
      }
    }
  });

  it('checkBackendHealth detects offline status when HTML is returned', async () => {
    const mockHtmlResponse = new Response('<!DOCTYPE html><html><body>Error</body></html>', {
      status: 200,
      headers: { 'content-type': 'text/html' },
    });
    global.fetch = vi.fn().mockResolvedValue(mockHtmlResponse);

    const health = await checkBackendHealth();
    expect(health.healthy).toBe(false);
    expect(health.status).toBe('offline');
  });

  it('getErrorMessage returns clean fallback string', () => {
    expect(getErrorMessage(new Error('Network drop'))).toBe('Network drop');
    expect(getErrorMessage('some string error')).toBe('An unexpected error occurred');
  });

  it('fetchMandis, fetchMarketHierarchy, and fetchMarketPrices invoke correct endpoints', async () => {
    const jsonOk = (data: unknown) =>
      vi.fn().mockImplementation(() =>
        Promise.resolve(
          new Response(JSON.stringify(data), {
            status: 200,
            headers: { 'content-type': 'application/json' },
          })
        )
      );

    global.fetch = jsonOk([{ id: 'lasalgaon', name: 'Lasalgaon', district: 'Nashik' }]);
    const mandis = await fetchMandis();
    expect(mandis[0].name).toBe('Lasalgaon');

    global.fetch = jsonOk({ states: ['Maharashtra'], districts: ['Nashik'], mandis: ['Lasalgaon'], commodities: ['Onion'], varieties: [] });
    const hierarchy = await fetchMarketHierarchy({ state: 'Maharashtra', district: 'Nashik' });
    expect(hierarchy.mandis).toContain('Lasalgaon');

    global.fetch = jsonOk({
      state: 'Maharashtra',
      district: 'Nashik',
      market: 'Lasalgaon',
      commodity: 'Onion',
      variety: 'Red',
      latest_date: '2026-10-30',
      latest_modal_price: 2400,
      latest_min_price: 1800,
      latest_max_price: 2800,
      arrival_reported: true,
      price_change_7d: 50,
      price_change_7d_pct: 2.1,
      price_trend: 'rising',
      trend_summary: 'Upward trend',
      data_source: 'live',
      last_updated: '2026-10-30',
      disclaimer: 'Disclaimer',
      historical_points: [],
      forecast_points: [],
      is_forecast_available: false,
      mode: 'live',
    });
    const prices = await fetchMarketPrices({ crop: 'onion', mandi: 'lasalgaon' });
    expect(prices.latest_modal_price).toBe(2400);

    const legacyPrices = await fetchMarketPrices('onion', 'lasalgaon', '7d', 3);
    expect(legacyPrices.commodity).toBe('Onion');
  });

  it('storage, staging, and calculator endpoints function with valid parameters', async () => {
    const jsonOk = (data: unknown) =>
      vi.fn().mockImplementation(() =>
        Promise.resolve(
          new Response(JSON.stringify(data), {
            status: 200,
            headers: { 'content-type': 'application/json' },
          })
        )
      );

    global.fetch = jsonOk({
      facilities: [],
      total: 0,
      nearest_facility: {
        id: 'WH-01',
        name: 'Nashik Warehouse',
        district: 'Nashik',
        type: 'Warehouse',
        crop: 'onion',
        capacity_mt: 5000,
        available_mt: 2000,
        rate_per_mt_month: 200,
        contact_phone: '1234567890',
        latitude: 20.0,
        longitude: 73.8,
        distance_km: 140,
        source_category: 'Demo',
        source_badge: 'Demo',
        source_verified: false,
        source_note: 'Note',
      },
      nearest_facility_distance_km: 140,
      source_summary: { live_data_gov: 0, demo_fallback: 1 },
      search_mode: 'coordinates',
    });
    const storageRes = await searchStorageFacilities({ mode: 'coordinates', lat: 16.85, lng: 74.58 });
    expect(storageRes.nearest_facility?.name).toBe('Nashik Warehouse');

    global.fetch = jsonOk({ states: [{ state: 'Maharashtra', count: 18, capacity_mt: 10000 }] });
    const agg = await fetchStatewiseAggregates();
    expect(agg.states).toHaveLength(1);

    global.fetch = jsonOk([{ id: 'ds1', name: 'Agmarknet', status: 'active', freshness: 'Realtime', records_count: 100 }]);
    const dataSources = await fetchDataSources();
    expect(dataSources[0].name).toBe('Agmarknet');

    global.fetch = jsonOk({ total_projects: 42, total_capacity_mt: 50000, total_subsidy_lakhs: 1200, top_districts: [] });
    const stagingSummary = await fetchMidhStagingSummary();
    expect(stagingSummary.total_projects).toBe(42);

    global.fetch = jsonOk({ projects: [], total_filtered: 0, total_unfiltered: 0, page: 1, limit: 10 });
    const stagingProj = await fetchMidhStagingProjects({ district: 'Pune', limit: 10 });
    expect(stagingProj.projects).toEqual([]);

    global.fetch = jsonOk({
      crop: 'onion',
      quantity_quintals: 100,
      holding_period_months: 3,
      current_price_per_quintal: 2000,
      strategy_a: { name: 'Sell Now', net_revenue: 200000, roas: 0 },
      strategy_b: { name: 'Hold in Cold Storage', net_revenue: 250000, roas: 1.25 },
      strategy_c: { name: 'Hold + Warehouse Receipt Loan', net_revenue: 260000, roas: 1.3 },
      recommendation: { strategy: 'Strategy C', reasoning: 'Highest net gain' },
    });
    const calc = await evaluateCalculator({
      crop: 'onion',
      quantity_quintals: 100,
      holding_period_months: 3,
      storage_type: 'cold_storage',
      current_price: 2000,
    });
    expect(calc.recommendation.strategy).toBe('Strategy C');
  });
});
