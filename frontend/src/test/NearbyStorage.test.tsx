import React, { Suspense } from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AppProvider } from '../context/AppContext';
import { NearbyStorage } from '../pages/NearbyStorage';
import * as api from '../services/api';

vi.mock('../services/api', async () => {
  const actual = await vi.importActual('../services/api');
  return {
    ...actual,
    searchStorageFacilities: vi.fn(),
  };
});

// Mock StorageMap lazy loaded component to avoid Leaflet DOM issues in jsdom
vi.mock('../components/StorageMap', () => ({
  StorageMap: () => <div data-testid="storage-map-mock">Mocked Storage Map</div>,
}));

describe('NearbyStorage Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('TC-STR-01: Renders storage search controls and displays facilities for district query', async () => {
    vi.mocked(api.searchStorageFacilities).mockResolvedValue({
      facilities: [
        {
          id: 'WH-NAS-01',
          name: 'Pimpalgaon APMC Cold Storage',
          district: 'Nashik',
          facility_type: 'Cold Storage',
          crop: 'onion',
          capacity_total_mt: 5000,
          fee_per_quintal_month_inr: 25,
          contact_phone: '+91-2550-200001',
          latitude: 20.17,
          longitude: 73.98,
          distance_km: 12.5,
          verification_status: 'officially_registered',
          notes: 'Verified data',
          taluka: 'Niphad',
          address: 'Pimpalgaon Baswant',
          pincode: '422209',
          accepted_crops: 'onion',
          status: 'operational',
          humidity_control: true,
          aeration_system: true,
        },
      ],
      total_found: 1,
      distance_type: 'geodesic',
    });

    render(
      <AppProvider>
        <Suspense fallback={<div>Loading...</div>}>
          <NearbyStorage />
        </Suspense>
      </AppProvider>
    );

    // Enter query and search
    const searchInput = screen.getByRole('textbox');
    fireEvent.change(searchInput, { target: { value: 'Nashik' } });

    const searchBtn = screen.getByRole('button', { name: /शोधा|Search/i });
    fireEvent.click(searchBtn);

    await waitFor(() => {
      expect(screen.getByText('Pimpalgaon APMC Cold Storage')).toBeInTheDocument();
    });

    expect(screen.getByText(/5,000 MT/)).toBeInTheDocument();
    expect(screen.getByText(/Niphad/)).toBeInTheDocument();
    expect(screen.getByText(/नाशिक|Nashik/)).toBeInTheDocument();
  });

  it('TC-STR-02: Sangli GPS search with 0 results within radius displays Nearest Facility recommendation card', async () => {
    vi.mocked(api.searchStorageFacilities).mockResolvedValue({
      facilities: [],
      total_found: 0,
      nearest_facility: {
        id: 'WH-SOL-01',
        name: 'Solapur Regional Ag-Warehouse',
        district: 'Solapur',
        facility_type: 'Warehouse',
        crop: 'onion',
        capacity_total_mt: 8000,
        fee_per_quintal_month_inr: 20,
        contact_phone: '+91-217-2345678',
        latitude: 17.6599,
        longitude: 75.9064,
        distance_km: 142.3,
        verification_status: 'officially_registered',
        notes: 'Solapur regional warehouse',
        taluka: 'North Solapur',
        address: 'Solapur MIDC',
        pincode: '413006',
        accepted_crops: 'onion',
        status: 'operational',
        humidity_control: true,
        aeration_system: true,
      },
      nearest_facility_distance_km: 142.3,
      distance_type: 'geodesic',
    });

    render(
      <AppProvider>
        <Suspense fallback={<div>Loading...</div>}>
          <NearbyStorage />
        </Suspense>
      </AppProvider>
    );

    // Click GPS button
    const gpsButton = screen.getByRole('button', { name: /GPS/i });
    fireEvent.click(gpsButton);

    await waitFor(() => {
      // Nearest facility card should be displayed
      expect(screen.getByText(/Solapur Regional Ag-Warehouse/)).toBeInTheDocument();
      expect(screen.getByText(/142.3 km/)).toBeInTheDocument();
    });
  });

  it('Displays error message gracefully when API request fails', async () => {
    vi.mocked(api.searchStorageFacilities).mockRejectedValue(
      new Error('Failed to fetch storage facilities')
    );

    render(
      <AppProvider>
        <Suspense fallback={<div>Loading...</div>}>
          <NearbyStorage />
        </Suspense>
      </AppProvider>
    );

    const searchInput = screen.getByRole('textbox');
    fireEvent.change(searchInput, { target: { value: 'Pune' } });

    const searchBtn = screen.getByRole('button', { name: /शोधा|Search/i });
    fireEvent.click(searchBtn);

    await waitFor(() => {
      expect(screen.getByText(/Failed to fetch storage facilities/i)).toBeInTheDocument();
    });
  });
});
