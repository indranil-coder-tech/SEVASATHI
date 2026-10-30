import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AppProvider } from '../context/AppContext';
import { About } from '../pages/About';
import * as api from '../services/api';

vi.mock('../services/api', async () => {
  const actual = await vi.importActual('../services/api');
  return {
    ...actual,
    fetchDataSources: vi.fn(),
    fetchStatewiseAggregates: vi.fn(),
  };
});

describe('About Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('TC-ABT-01: Renders project background and data governance details', async () => {
    vi.mocked(api.fetchDataSources).mockResolvedValue([
      {
        source_name: 'Agmarknet API (data.gov.in)',
        source_type: 'Government Open Data',
        coverage: 'Maharashtra Agricultural Markets',
        freshness: 'Daily',
        status: 'Operational',
        records_count: 5000,
        api_endpoint: '/market/prices',
      },
    ]);

    vi.mocked(api.fetchStatewiseAggregates).mockResolvedValue({
      national_total_storages: 8653,
      national_total_capacity_mt: 38245120,
      as_of_date: '2026-10-15',
      source_url: 'https://data.gov.in',
      data_quality_disclaimer: 'Official published aggregate figures.',
      records: [
        {
          state_ut_as_published: 'MAHARASHTRA',
          reported_cold_storage_count: 632,
          reported_capacity_mt: 1045230,
          as_of_date: '2026-10-15',
          source_url: 'https://data.gov.in',
          source_type: 'MIDH/DMI Registry',
        },
      ],
    });

    render(
      <AppProvider>
        <About />
      </AppProvider>
    );

    expect(screen.getAllByText(/सेवासाथी|SevaSathi/i).length).toBeGreaterThan(0);

    await waitFor(() => {
      expect(screen.getByText('Agmarknet API (data.gov.in)')).toBeInTheDocument();
      expect(screen.getByText('Official published aggregate figures.')).toBeInTheDocument();
    });
  });
});
