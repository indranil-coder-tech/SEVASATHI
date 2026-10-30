import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import App from '../App';
import * as api from '../services/api';

vi.mock('../services/api', async () => {
  const actual = await vi.importActual('../services/api');
  return {
    ...actual,
    checkBackendHealth: vi.fn(),
    fetchMarketPrices: vi.fn().mockResolvedValue({
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
    }),
  };
});

// Mock lazy-loaded page components for fast and isolated App shell verification
vi.mock('../pages/Dashboard', () => ({
  Dashboard: () => <div data-testid="dashboard-page">Dashboard Mock</div>,
}));

vi.mock('../pages/MarketIntelligence', () => ({
  MarketIntelligence: () => <div data-testid="market-page">Market Mock</div>,
}));

vi.mock('../pages/NearbyStorage', () => ({
  NearbyStorage: () => <div data-testid="storage-page">Storage Mock</div>,
}));

vi.mock('../pages/CalculatorPage', () => ({
  CalculatorPage: () => <div data-testid="calculator-page">Calculator Mock</div>,
}));

vi.mock('../pages/About', () => ({
  About: () => <div data-testid="about-page">About Mock</div>,
}));

describe('App Root Shell', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders app shell, navigation bar, footer, and active tab content', async () => {
    vi.mocked(api.checkBackendHealth).mockResolvedValue({ healthy: true, status: 'healthy' });

    render(<App />);

    await waitFor(() => {
      expect(screen.getByTestId('dashboard-page')).toBeInTheDocument();
    });
    expect(screen.getAllByText(/SevaSathi/i).length).toBeGreaterThan(0);
  });

  it('displays backend offline banner when health check reports unhealthy, allows dismissal', async () => {
    vi.mocked(api.checkBackendHealth).mockResolvedValue({ healthy: false, status: 'offline', detail: 'Server down' });

    render(<App />);

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    const dismissBtn = screen.getByRole('button', { name: /✕|Dismiss/i });
    fireEvent.click(dismissBtn);

    await waitFor(() => {
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });
  });
});
