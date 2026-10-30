import React, { Suspense } from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AppProvider } from '../context/AppContext';
import { MarketIntelligence } from '../pages/MarketIntelligence';
import * as api from '../services/api';

vi.mock('../services/api', async () => {
  const actual = await vi.importActual('../services/api');
  return {
    ...actual,
    fetchMarketHierarchy: vi.fn(),
    fetchMarketPrices: vi.fn(),
  };
});

vi.mock('../components/PriceChart', () => ({
  PriceChart: () => <div data-testid="price-chart-mock">Price Chart Mock</div>,
}));

describe('MarketIntelligence Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockHierarchy = {
    states: ['Maharashtra'],
    districts: ['Nashik', 'Pune'],
    mandis: ['Lasalgaon', 'Pimpalgaon'],
    commodities: ['Onion', 'Soyabean'],
    varieties: ['Red', 'Local'],
    selected_state: 'Maharashtra',
    selected_district: 'Nashik',
    selected_mandi: 'Lasalgaon',
    selected_commodity: 'Onion',
  };

  const mockPrices = {
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
    price_change_7d: 80,
    price_change_7d_pct: 3.45,
    price_trend: 'rising' as const,
    trend_summary: 'Steady arrivals with good buyer participation',
    data_source: 'Agmarknet API Direct',
    last_updated: '2026-10-30',
    disclaimer: 'Official agmarknet live feed',
    historical_points: [
      { date: '2026-10-24', modal_price: 2320, min_price: 1750, max_price: 2700, is_forecast: false },
      { date: '2026-10-30', modal_price: 2400, min_price: 1800, max_price: 2800, is_forecast: false },
    ],
    forecast_points: [
      { date: '2026-11-06', modal_price: 2600, min_price: 2000, max_price: 3000, is_forecast: true },
    ],
    is_forecast_available: true,
    mode: 'live' as const,
  };

  it('TC-MKT-01 & TC-MKT-02: Renders market hierarchy selectors and displays modal price metrics', async () => {
    vi.mocked(api.fetchMarketHierarchy).mockResolvedValue(mockHierarchy);
    vi.mocked(api.fetchMarketPrices).mockResolvedValue(mockPrices);

    render(
      <AppProvider>
        <Suspense fallback={<div>Loading...</div>}>
          <MarketIntelligence />
        </Suspense>
      </AppProvider>
    );

    await waitFor(() => {
      expect(screen.getAllByText(/२,४००|2,400/).length).toBeGreaterThan(0);
    });

    await waitFor(() => {
      expect(screen.getByText('Price Chart Mock')).toBeInTheDocument();
    });
  });

  it('TC-MKT-03: Navigates to calculator with active crop and price parameters', async () => {
    vi.mocked(api.fetchMarketHierarchy).mockResolvedValue(mockHierarchy);
    vi.mocked(api.fetchMarketPrices).mockResolvedValue(mockPrices);
    const onNavigateToCalculator = vi.fn();

    render(
      <AppProvider>
        <Suspense fallback={<div>Loading...</div>}>
          <MarketIntelligence onNavigateToCalculator={onNavigateToCalculator} />
        </Suspense>
      </AppProvider>
    );

    await waitFor(() => {
      expect(screen.getAllByText(/२,४००|2,400/).length).toBeGreaterThan(0);
    });

    const calcBtn = screen.getByRole('button', { name: /हिशोब करा|Calculate/i });
    fireEvent.click(calcBtn);

    expect(onNavigateToCalculator).toHaveBeenCalled();
  });
});
