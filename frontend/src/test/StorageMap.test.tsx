import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { AppProvider } from '../context/AppContext';
import { StorageMap } from '../components/StorageMap';
import type { StorageFacility } from '../types';

vi.mock('react-leaflet', () => ({
  MapContainer: ({ children }: { children: React.ReactNode }) => <div data-testid="map-container">{children}</div>,
  TileLayer: () => <div data-testid="tile-layer" />,
  Marker: ({ children, eventHandlers }: { children: React.ReactNode; eventHandlers?: { click?: () => void } }) => (
    <div data-testid="map-marker" onClick={() => eventHandlers?.click?.()}>{children}</div>
  ),
  Popup: ({ children }: { children: React.ReactNode }) => <div data-testid="map-popup">{children}</div>,
  useMap: () => ({ flyTo: vi.fn() }),
}));

describe('StorageMap Component', () => {
  const mockFacilities: StorageFacility[] = [
    {
      id: 'FAC-01',
      name: 'Nashik Cold Store',
      district: 'Nashik',
      facility_type: 'Cold Storage',
      capacity_total_mt: 5000,
      fee_per_quintal_month_inr: 25,
      latitude: 20.15,
      longitude: 74.22,
      distance_km: 10,
      taluka: 'Niphad',
      address: 'Pimpalgaon Baswant',
      pincode: '422209',
      accepted_crops: 'onion',
      status: 'operational',
      humidity_control: true,
      aeration_system: true,
      notes: 'Cold store',
    },
    {
      id: 'FAC-02',
      name: 'Yeola Onion Chawl',
      district: 'Nashik',
      facility_type: 'Onion Chawl',
      capacity_total_mt: 1000,
      fee_per_quintal_month_inr: 15,
      latitude: 20.04,
      longitude: 74.48,
      distance_km: 25,
      taluka: 'Yeola',
      address: 'Yeola APMC',
      pincode: '423401',
      accepted_crops: 'onion',
      status: 'operational',
      humidity_control: false,
      aeration_system: true,
      notes: 'Chawl',
    },
  ];

  it('renders MapContainer, TileLayer, and markers for facilities and user position', () => {
    const handleSelect = vi.fn();
    render(
      <AppProvider>
        <StorageMap
          facilities={mockFacilities}
          selectedFacility={null}
          onSelectFacility={handleSelect}
          userCoords={{ latitude: 20.14, longitude: 74.22 }}
        />
      </AppProvider>
    );

    expect(screen.getByTestId('map-container')).toBeInTheDocument();
    expect(screen.getByTestId('tile-layer')).toBeInTheDocument();
    
    // Markers rendered for 2 facilities + 1 user position = 3 markers
    const markers = screen.getAllByTestId('map-marker');
    expect(markers.length).toBeGreaterThanOrEqual(2);

    // Clicking the first facility marker triggers selection callback
    fireEvent.click(markers[1]);
    expect(handleSelect).toHaveBeenCalledWith(mockFacilities[0]);
  });
});
