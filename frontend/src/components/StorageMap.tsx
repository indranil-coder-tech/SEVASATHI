import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { StorageFacility } from '../types';
import { Navigation } from 'lucide-react';
import { useAppContext } from '../context/AppContext';

interface StorageMapProps {
  facilities: StorageFacility[];
  selectedFacility: StorageFacility | null;
  onSelectFacility: (fac: StorageFacility) => void;
  userCoords?: { latitude: number; longitude: number };
}

// Custom DivIcons to avoid missing Leaflet png assets
const createFacilityIcon = (type: string, isSelected: boolean) => {
  const isChawl = type.toLowerCase().includes('chawl');
  const isCold = type.toLowerCase().includes('cold');

  let bgClass = 'bg-[#52785B] text-white';
  if (isCold) bgClass = 'bg-[#3b6e8c] text-white';
  else if (!isChawl) bgClass = 'bg-[#686b58] text-white';

  const selectedRing = isSelected
    ? 'ring-4 ring-offset-2 ring-emerald-500 scale-125 z-50'
    : 'hover:scale-110';

  const html = `
    <div class="flex items-center justify-center w-8 h-8 rounded-full shadow-lg ${bgClass} ${selectedRing} transition-all duration-200 border-2 border-white cursor-pointer">
      <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    </div>
  `;

  return L.divIcon({
    html,
    className: 'custom-facility-pin',
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -18],
  });
};

const createUserIcon = () => {
  const html = `
    <div class="relative flex items-center justify-center w-8 h-8">
      <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
      <div class="relative flex items-center justify-center w-6 h-6 rounded-full bg-amber-600 text-white border-2 border-white shadow-md">
        <svg class="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
          <circle cx="10" cy="10" r="5" />
        </svg>
      </div>
    </div>
  `;

  return L.divIcon({
    html,
    className: 'custom-user-pin',
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -18],
  });
};

// Map Recenter Helper Component
const MapViewUpdater: React.FC<{
  center: [number, number];
  zoom: number;
}> = ({ center, zoom }) => {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, zoom, { duration: 1.2 });
  }, [center, zoom, map]);
  return null;
};

export const StorageMap: React.FC<StorageMapProps> = ({
  facilities,
  selectedFacility,
  onSelectFacility,
  userCoords,
}) => {
  const { t, formatCurrency } = useAppContext();
  // Center determination: selected facility, or user coords, or Lasalgaon center
  const defaultCenter: [number, number] = [20.1472, 74.2281];
  const activeCenter: [number, number] =
    selectedFacility && selectedFacility.latitude != null && selectedFacility.longitude != null
      ? [selectedFacility.latitude, selectedFacility.longitude]
      : userCoords && userCoords.latitude != null && userCoords.longitude != null
      ? [userCoords.latitude, userCoords.longitude]
      : defaultCenter;

  const currentZoom = selectedFacility ? 13 : userCoords ? 10 : 9;

  // Filter facilities that have valid numeric coordinates
  const validFacilities = facilities.filter(
    (fac) =>
      fac.latitude != null &&
      fac.longitude != null &&
      !isNaN(fac.latitude) &&
      !isNaN(fac.longitude)
  );

  return (
    <div className="relative w-full h-[400px] sm:h-[480px] rounded-2xl overflow-hidden neo-card p-1 bg-[#E9EEE8]">
      <MapContainer
        center={activeCenter}
        zoom={currentZoom}
        scrollWheelZoom={false}
        className="w-full h-full rounded-xl"
      >
        <MapViewUpdater center={activeCenter} zoom={currentZoom} />

        {/* OpenStreetMap Tile Layer with Required Attribution */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* User Location Marker */}
        {userCoords && userCoords.latitude != null && userCoords.longitude != null && (
          <Marker
            position={[userCoords.latitude, userCoords.longitude]}
            icon={createUserIcon()}
          >
            <Popup>
              <div className="p-2 text-xs">
                <span className="font-bold text-[#26352B]">{t('storage.map_user_location')}</span>
                <p className="text-[#69776D] mt-0.5">
                  {t('storage.map_user_location_sub')}
                </p>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Facility Markers */}
        {validFacilities.map((fac) => {
          const isSelected = selectedFacility?.id === fac.id;
          const fee = fac.fee_per_quintal_month_inr ?? fac.storage_price_per_quintal_month;
          return (
            <Marker
              key={fac.id}
              position={[fac.latitude!, fac.longitude!]}
              icon={createFacilityIcon(fac.facility_type, isSelected)}
              eventHandlers={{
                click: () => onSelectFacility(fac),
              }}
            >
              <Popup>
                <div className="p-2.5 max-w-xs space-y-2 text-xs">
                  <div className="border-b border-[#cfd8ce] pb-1.5">
                    <span className="font-bold text-sm text-[#26352B] block">
                      {fac.name}
                    </span>
                    <span className="inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-medium bg-[#52785B]/15 text-[#304C38] border border-[#52785B]/30">
                      {fac.facility_type}
                    </span>
                  </div>

                  <p className="text-[#69776D]">{fac.address}</p>

                  <div className="flex justify-between font-medium">
                    <span className="text-[#69776D]">{t('storage.indicative_fee')}</span>
                    <span className="text-[#304C38] font-bold">
                      {fee ? `${formatCurrency(fee)} / ${t('common.quintals')} / ${t('common.month')}` : t('storage.not_provided')}
                    </span>
                  </div>

                  {fac.distance_km !== undefined && (
                    <div className="flex justify-between">
                      <span className="text-[#69776D]">{t('storage.approx_distance')}</span>
                      <span className="font-semibold text-[#26352B]">
                        ~{fac.distance_km} {t('storage.straight_line_short')}
                      </span>
                    </div>
                  )}

                  <div className="pt-2 flex gap-2">
                    <button
                      onClick={() => onSelectFacility(fac)}
                      className="flex-1 py-1 px-2 rounded-lg bg-[#52785B] text-white text-[11px] font-semibold text-center hover:bg-[#43644a]"
                    >
                      {t('common.view_details')}
                    </button>
                    <a
                      href={`https://www.google.com/maps/dir/?api=1&destination=${fac.latitude},${fac.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="py-1 px-2 rounded-lg bg-gray-200 text-gray-800 text-[11px] font-medium flex items-center justify-center hover:bg-gray-300"
                    >
                      <Navigation className="w-3.5 h-3.5 mr-1" />
                      {t('storage.maps_link')}
                    </a>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>

      {/* Map Legend Overlay */}
      <div className="absolute bottom-3 left-3 z-[1000] bg-[#E9EEE8]/95 backdrop-blur-md p-2.5 rounded-xl border border-[#d8e0d6] shadow-md text-[11px] space-y-1">
        <div className="font-semibold text-[#26352B] mb-1">{t('storage.legend_title')}</div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-[#52785B]"></span>
          <span className="text-[#69776D]">{t('storage.legend_chawl')}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-[#3b6e8c]"></span>
          <span className="text-[#69776D]">{t('storage.legend_cold')}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-[#686b58]"></span>
          <span className="text-[#69776D]">{t('storage.legend_warehouse')}</span>
        </div>
        {userCoords && (
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-amber-600"></span>
            <span className="text-[#69776D]">{t('storage.legend_user_loc')}</span>
          </div>
        )}
      </div>
    </div>
  );
};
