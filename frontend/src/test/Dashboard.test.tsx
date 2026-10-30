import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AppProvider } from '../context/AppContext';
import { Dashboard } from '../pages/Dashboard';
import * as api from '../services/api';

vi.mock('../services/api', async () => {
  const actual = await vi.importActual('../services/api');
  return {
    ...actual,
    fetchMarketPrices: vi.fn(),
  };
});

describe('Dashboard Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockPriceResponse = {
    state: 'Maharashtra',
    district: 'Nashik',
    market: 'Lasalgaon',
    commodity: 'Onion',
    variety: 'Red',
    latest_date: '2026-10-30',
    latest_modal_price: 2450,
    latest_min_price: 1800,
    latest_max_price: 2900,
    arrival_reported: true,
    price_change_7d: 120,
    price_change_7d_pct: 5.15,
    price_trend: 'rising' as const,
    trend_summary: 'Upward momentum due to tight arrivals',
    data_source: 'Agmarknet Direct',
    last_updated: '2026-10-30',
    disclaimer: 'Official Agmarknet Daily Feed',
    historical_points: [
      { date: '2026-10-24', modal_price: 2330, min_price: 1750, max_price: 2780, is_forecast: false },
      { date: '2026-10-30', modal_price: 2450, min_price: 1800, max_price: 2900, is_forecast: false },
    ],
    forecast_points: [],
    is_forecast_available: false,
    mode: 'live' as const,
  };

  it('TC-DSH-01: Renders hero banner, key stats, and handles quick navigation actions', async () => {
    vi.mocked(api.fetchMarketPrices).mockResolvedValue(mockPriceResponse);
    const onNavigate = vi.fn();

    render(
      <AppProvider>
        <Dashboard onNavigate={onNavigate} />
      </AppProvider>
    );

    await waitFor(() => {
      expect(screen.getAllByText(/२,४५०|2,450/).length).toBeGreaterThan(0);
    });

    // Test quick navigation action
    const storageBtn = screen.getByRole('button', { name: /साठवणूक केंद्र शोधा|Find Storage/i });
    fireEvent.click(storageBtn);
    expect(onNavigate).toHaveBeenCalledWith('storage');
  });

  it('TC-DSH-02: Handles market price fetch failure gracefully with fallback notice', async () => {
    vi.mocked(api.fetchMarketPrices).mockRejectedValue(new Error('Network drop'));
    const onNavigate = vi.fn();

    render(
      <AppProvider>
        <Dashboard onNavigate={onNavigate} />
      </AppProvider>
    );

    await waitFor(() => {
      expect(screen.getByText(/Network drop/i)).toBeInTheDocument();
    });
  });
});
