import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { AppProvider } from '../context/AppContext';
import { PriceChart } from '../components/PriceChart';
import type { PricePoint } from '../types';

vi.mock('recharts', async () => {
  const actual = await vi.importActual<typeof import('recharts')>('recharts');
  return {
    ...actual,
    ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
      <div data-testid="responsive-container" style={{ width: 800, height: 400 }}>
        {children}
      </div>
    ),
  };
});

describe('PriceChart Component', () => {
  const historicalData: PricePoint[] = [
    { date: '2026-10-20', modal_price: 2100, min_price: 1800, max_price: 2300, is_forecast: false, arrival_tonnes: 150 },
    { date: '2026-10-25', modal_price: 2200, min_price: 1900, max_price: 2400, is_forecast: false, arrival_tonnes: 120 },
  ];

  const forecastData: PricePoint[] = [
    { date: '2026-10-28', modal_price: 2350, min_price: 2000, max_price: 2500, is_forecast: true, lower_bound: 2150, upper_bound: 2550 },
  ];

  it('renders time range buttons, chart container, and switches intervals', () => {
    const handleRangeChange = vi.fn();
    render(
      <AppProvider>
        <PriceChart
          historicalData={historicalData}
          forecastData={forecastData}
          timeRange="30d"
          onRangeChange={handleRangeChange}
          commodityName="Onion"
        />
      </AppProvider>
    );

    expect(screen.getByTestId('responsive-container')).toBeInTheDocument();

    // Click 7d range (७ दिवस in Marathi)
    const btn7d = screen.getByRole('button', { name: /७ दिवस|7d/i });
    fireEvent.click(btn7d);
    expect(handleRangeChange).toHaveBeenCalledWith('7d');
  });

  it('renders gracefully even when empty data is provided', () => {
    render(
      <AppProvider>
        <PriceChart
          historicalData={[]}
          forecastData={[]}
          timeRange="30d"
          onRangeChange={vi.fn()}
          commodityName="Onion"
        />
      </AppProvider>
    );

    expect(screen.getByTestId('responsive-container')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /३० दिवस|30d/i })).toBeInTheDocument();
  });
});
