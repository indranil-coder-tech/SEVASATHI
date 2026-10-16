import React, { useState, useEffect } from 'react';
import {
  Search,
  Navigation,
  Phone,
  Filter,
  ShieldCheck,
  AlertTriangle,
  Wind,
  Droplets,
  ExternalLink,
  MapPin,
  Compass,
  Maximize2,
} from 'lucide-react';
import { NeomorphicCard } from '../components/NeomorphicCard';
import { searchStorageFacilities } from '../services/api';
import type { StorageFacility, StorageSearchResponse } from '../types';
import { useApp } from '../context/AppContext';

const StorageMap = React.lazy(() =>
  import('../components/StorageMap').then((m) => ({ default: m.StorageMap }))
);

const MidhStagingRegistry = React.lazy(() =>
  import('../components/MidhStagingRegistry').then((m) => ({ default: m.MidhStagingRegistry }))
);

export const NearbyStorage: React.FC = () => {
  const { t, userLocation, requestLocation, formatCurrency, translateEntity } = useApp();

  // Storage page sub-tab: 'finder' (active facilities finder) vs 'midh_staging' (MIDH historical registry)
  const [storageViewMode, setStorageViewMode] = useState<'finder' | 'midh_staging'>('finder');

  // Search parameters
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [cropFilter, setCropFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [radiusKm, setRadiusKm] = useState<number>(25);

  // Active search mode: 'text' (typed place/PIN), 'coordinates' (GPS), or 'demo' (pilot center)
  const [activeSearchMode, setActiveSearchMode] = useState<'text' | 'coordinates' | 'demo'>('demo');

  // Search results & metadata
  const [facilities, setFacilities] = useState<StorageFacility[]>([]);
  const [selectedFacility, setSelectedFacility] = useState<StorageFacility | null>(null);
  const [userCoords, setUserCoords] = useState<{ latitude: number; longitude: number } | undefined>(undefined);
  const [resolvedLocationName, setResolvedLocationName] = useState<string>('लासलगाव (Lasalgaon Pilot Center)');
  const [resolutionSource, setResolutionSource] = useState<string>('demo');
  const [locationResolved, setLocationResolved] = useState<boolean>(true);
  const [apiWarning, setApiWarning] = useState<string | null>(null);

  // Loading & error states
  const [loading, setLoading] = useState<boolean>(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [locationStatus, setLocationStatus] = useState<string | null>(null);
  const searchReqIdRef = React.useRef<number>(0);

  // Execute text location search (DO NOT pass stale coordinates)
  const executeTextSearch = async (queryText?: string, explicitRadius?: number) => {
    const q = queryText !== undefined ? queryText : searchQuery;
    if (!q || !q.trim()) return;

    const currentReqId = ++searchReqIdRef.current;
    try {
      setLoading(true);
      setFetchError(null);
      setActiveSearchMode('text');

      const currentRadius = explicitRadius !== undefined ? explicitRadius : radiusKm;

      const res: StorageSearchResponse = await searchStorageFacilities({
        mode: 'text',
        query: q.trim(),
        crop: cropFilter !== 'all' ? cropFilter : undefined,
        type: typeFilter !== 'all' ? typeFilter : undefined,
        radius_km: currentRadius > 0 ? currentRadius : undefined,
      });

      if (currentReqId !== searchReqIdRef.current) return;

      setFacilities(res.facilities);
      setLocationResolved(res.location_resolved ?? true);
      setResolutionSource(res.resolution_source || 'text');
      setApiWarning(res.warning || null);

      if (res.query_location) {
        setResolvedLocationName(res.query_location);
      }
      if (res.query_coords) {
        setUserCoords(res.query_coords);
      }

      if (res.facilities.length > 0) {
        setSelectedFacility((prev) => {
          if (prev && res.facilities.some((f) => f.id === prev.id)) {
            return res.facilities.find((f) => f.id === prev.id) || res.facilities[0];
          }
          return res.facilities[0];
        });
      } else {
        setSelectedFacility(null);
      }
    } catch (err: any) {
      if (currentReqId === searchReqIdRef.current) {
        setFetchError(err.message || 'Failed to search storage facilities.');
      }
    } finally {
      if (currentReqId === searchReqIdRef.current) {
        setLoading(false);
      }
    }
  };

  // Execute GPS coordinate search (explicit coordinates)
  const executeGpsSearch = async (
    lat: number,
    lng: number,
    displayName?: string,
    explicitRadius?: number
  ) => {
    const currentReqId = ++searchReqIdRef.current;
    try {
      setLoading(true);
      setFetchError(null);
      setActiveSearchMode('coordinates');
      setUserCoords({ latitude: lat, longitude: lng });

      const currentRadius = explicitRadius !== undefined ? explicitRadius : radiusKm;

      const res: StorageSearchResponse = await searchStorageFacilities({
        mode: 'coordinates',
        lat,
        lng,
        crop: cropFilter !== 'all' ? cropFilter : undefined,
        type: typeFilter !== 'all' ? typeFilter : undefined,
        radius_km: currentRadius > 0 ? currentRadius : undefined,
      });

      if (currentReqId !== searchReqIdRef.current) return;

      setFacilities(res.facilities);
      setLocationResolved(true);
      setResolutionSource('gps');
      setApiWarning(res.warning || null);

      if (displayName) {
        setResolvedLocationName(displayName);
      } else if (res.query_location) {
        setResolvedLocationName(res.query_location);
      }

      if (res.facilities.length > 0) {
        setSelectedFacility((prev) => {
          if (prev && res.facilities.some((f) => f.id === prev.id)) {
            return res.facilities.find((f) => f.id === prev.id) || res.facilities[0];
          }
          return res.facilities[0];
        });
      } else {
        setSelectedFacility(null);
      }
    } catch (err: any) {
      if (currentReqId === searchReqIdRef.current) {
        setFetchError(err.message || 'Failed to search storage facilities by GPS.');
      }
    } finally {
      if (currentReqId === searchReqIdRef.current) {
        setLoading(false);
      }
    }
  };

  // Execute demo/initial default search
  const executeInitialSearch = async (explicitRadius?: number) => {
    const currentReqId = ++searchReqIdRef.current;
    try {
      setLoading(true);
      setFetchError(null);
      const currentRadius = explicitRadius !== undefined ? explicitRadius : radiusKm;

      const res: StorageSearchResponse = await searchStorageFacilities({
        mode: 'demo',
        crop: cropFilter !== 'all' ? cropFilter : undefined,
        type: typeFilter !== 'all' ? typeFilter : undefined,
        radius_km: currentRadius > 0 ? currentRadius : undefined,
      });

      if (currentReqId !== searchReqIdRef.current) return;

      setFacilities(res.facilities);
      setLocationResolved(res.location_resolved ?? true);
      setResolutionSource('demo');
      setApiWarning(res.warning || null);
      if (res.query_location) setResolvedLocationName(res.query_location);
      if (res.query_coords) setUserCoords(res.query_coords);

      if (res.facilities.length > 0) {
        setSelectedFacility((prev) => {
          if (prev && res.facilities.some((f) => f.id === prev.id)) {
            return res.facilities.find((f) => f.id === prev.id) || res.facilities[0];
          }
          return res.facilities[0];
        });
      } else {
        setSelectedFacility(null);
      }
    } catch (err: any) {
      if (currentReqId === searchReqIdRef.current) {
        setFetchError(err.message || 'Failed to initialize storage finder.');
      }
    } finally {
      if (currentReqId === searchReqIdRef.current) {
        setLoading(false);
      }
    }
  };

  // Re-run search whenever filters or radius change
  useEffect(() => {
    if (activeSearchMode === 'text' && searchQuery.trim()) {
      executeTextSearch(searchQuery);
    } else if (activeSearchMode === 'coordinates' && userCoords) {
      executeGpsSearch(userCoords.latitude, userCoords.longitude, resolvedLocationName);
    } else {
      executeInitialSearch();
    }
  }, [cropFilter, typeFilter, radiusKm]);

  // Sync if global userLocation changes from browser prompt
  useEffect(() => {
    if (userLocation.status === 'granted') {
      executeGpsSearch(userLocation.latitude, userLocation.longitude, userLocation.displayName);
      setLocationStatus(`GPS स्थान प्राप्त झाले: ${userLocation.displayName}`);
    }
  }, [userLocation.status, userLocation.latitude, userLocation.longitude]);

  // Handle "Use my location" button click
  const handleUseMyLocation = () => {
    setSearchQuery('');
    requestLocation();
    setLocationStatus(t('location_detecting'));
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#26352B]">
          {t('storage.page_title')}
        </h1>
        <p className="text-xs sm:text-sm text-[#69776D]">
          {t('storage.page_desc')}
        </p>
      </div>

      {/* Sub-tab Switcher: Active Facilities vs Historical MIDH Staging */}
      <div className="flex items-center gap-2 border-b border-[#d8e0d6] pb-3 overflow-x-auto">
        <button
          onClick={() => setStorageViewMode('finder')}
          className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 flex-shrink-0 ${
            storageViewMode === 'finder'
              ? 'neo-btn-primary shadow-sm'
              : 'neo-btn text-[#69776D] hover:text-[#26352B]'
          }`}
        >
          <MapPin className="w-4 h-4" />
          <span>{t('storage.tab_finder')}</span>
        </button>

        <button
          onClick={() => setStorageViewMode('midh_staging')}
          className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 flex-shrink-0 ${
            storageViewMode === 'midh_staging'
              ? 'neo-btn-primary shadow-sm'
              : 'neo-btn text-[#69776D] hover:text-[#26352B]'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>{t('storage.tab_midh')}</span>
        </button>
      </div>

      {storageViewMode === 'midh_staging' ? (
        <React.Suspense
          fallback={
            <div className="w-full h-72 rounded-2xl neo-card flex flex-col items-center justify-center gap-2 text-xs text-[#69776D]">
              <div className="w-6 h-6 border-2 border-[#52785B] border-t-transparent rounded-full animate-spin" />
              <span>{t('common.loading')}</span>
            </div>
          }
        >
          <MidhStagingRegistry />
        </React.Suspense>
      ) : (
        <>
          {fetchError && (
            <div className="p-3 bg-red-100 text-red-800 text-xs rounded-xl neo-card flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0" />
              <span>{fetchError}</span>
            </div>
          )}

      {/* Dynamic API Resolution & Advisory Warning Banner */}
      {apiWarning && (
        <div
          className={`p-3.5 rounded-xl neo-card text-xs flex items-start gap-2.5 border-l-4 ${
            !locationResolved
              ? 'bg-amber-50 text-amber-900 border-amber-500'
              : 'bg-[#EBF1EA] text-[#304C38] border-[#52785B]'
          }`}
        >
          <AlertTriangle
            className={`w-4 h-4 flex-shrink-0 mt-0.5 ${
              !locationResolved ? 'text-amber-600' : 'text-[#52785B]'
            }`}
          />
          <div className="space-y-1">
            <span className="font-bold block">
              {!locationResolved ? t('storage.location_unresolved_title') : t('storage.location_resolved_title')}
            </span>
            <p className="leading-relaxed">{apiWarning}</p>
          </div>
        </div>
      )}

      {/* Search & Location Bar */}
      <NeomorphicCard className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          {/* Manual Query Input */}
          <div className="md:col-span-8 flex items-center neo-inset px-3 py-2 bg-[#E9EEE8] rounded-xl">
            <Search className="w-4 h-4 text-[#69776D] mr-2 flex-shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  executeTextSearch();
                }
              }}
              placeholder={t('storage.search_placeholder')}
              className="w-full bg-transparent text-sm text-[#26352B] outline-none placeholder-[#839187]"
            />
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  executeInitialSearch();
                }}
                className="text-xs text-[#69776D] hover:text-[#26352B] ml-2 px-1"
              >
                {t('common.clear')}
              </button>
            )}
          </div>

          {/* Search Button */}
          <button
            onClick={() => executeTextSearch()}
            className="md:col-span-2 neo-btn-primary py-2.5 px-4 text-xs font-semibold flex items-center justify-center gap-1.5"
          >
            <Search className="w-3.5 h-3.5" />
            <span>{t('storage.btn_search')}</span>
          </button>

          {/* GPS Button */}
          <button
            onClick={handleUseMyLocation}
            className="md:col-span-2 neo-btn py-2.5 px-3 text-xs font-semibold flex items-center justify-center gap-1.5 text-[#304C38]"
            title={t('storage.use_gps')}
          >
            <Navigation className="w-3.5 h-3.5 text-[#52785B]" />
            <span>{t('storage.use_gps')}</span>
          </button>
        </div>

        {/* Location Status Message */}
        {locationStatus && (
          <div className="text-xs text-[#52785B] bg-[#52785B]/10 p-2.5 rounded-lg flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MapPin className="w-3.5 h-3.5 text-[#52785B]" />
              <span>{locationStatus}</span>
            </div>
            <button
              onClick={() => setLocationStatus(null)}
              className="text-[#69776D] hover:text-[#26352B] px-1"
            >
              ✕
            </button>
          </div>
        )}

        {/* Filters & Radius Controls */}
        <div className="pt-2 border-t border-[#d8e0d6] flex flex-wrap items-center gap-4 text-xs">
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-[#52785B]" />
            <span className="font-bold text-[#26352B]">{t('storage.filter_heading')}</span>
          </div>

          {/* Crop Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-[#69776D]">{t('storage.filter_crop')}</span>
            <select
              value={cropFilter}
              onChange={(e) => setCropFilter(e.target.value)}
              className="neo-inset py-1 px-2.5 rounded-lg bg-[#E9EEE8] text-[#26352B] font-medium outline-none cursor-pointer"
            >
              <option value="all">{t('storage.all_crops')}</option>
              <option value="onion">{translateEntity('Onion', 'commodity')}</option>
              <option value="potato">{translateEntity('Potato', 'commodity')}</option>
              <option value="garlic">{translateEntity('Garlic', 'commodity')}</option>
              <option value="grapes">द्राक्षे / डाळिंब (Fruits)</option>
              <option value="grains">{translateEntity('Soyabean', 'commodity')} / धान्य</option>
            </select>
          </div>

          {/* Type Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-[#69776D]">{t('storage.filter_type')}</span>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="neo-inset py-1 px-2.5 rounded-lg bg-[#E9EEE8] text-[#26352B] font-medium outline-none cursor-pointer"
            >
              <option value="all">{t('storage.all_types')}</option>
              <option value="ventilated">{t('storage.onion_chawl')}</option>
              <option value="cold">{t('storage.cold_storage')}</option>
              <option value="warehouse">{t('storage.warehouse')}</option>
            </select>
          </div>

          {/* Configurable Radius Selector */}
          <div className="flex items-center gap-1.5">
            <Compass className="w-3.5 h-3.5 text-[#52785B]" />
            <span className="text-[#69776D]">{t('storage.search_radius_label')}</span>
            <div className="inline-flex rounded-lg neo-inset p-0.5 bg-[#E9EEE8]">
              {[25, 50, 100, 0].map((r) => (
                <button
                  key={r}
                  onClick={() => setRadiusKm(r)}
                  className={`px-2 py-0.5 text-[11px] font-bold rounded-md transition-all ${
                    radiusKm === r
                      ? 'bg-[#52785B] text-white shadow-sm'
                      : 'text-[#69776D] hover:text-[#26352B]'
                  }`}
                >
                  {r === 0 ? t('storage.all_radius') : `${r} km`}
                </button>
              ))}
            </div>
          </div>

          {/* Location & Count Metadata */}
          <div className="ml-auto text-[#69776D] text-[11px] flex items-center gap-2">
            <span>
              {t('storage.available_centers_count', { count: String(facilities.length) })}
            </span>
            <span>•</span>
            <span className="inline-flex items-center gap-1">
              {t('storage.location_label')} <strong className="text-[#304C38]">{resolvedLocationName}</strong>
              <span className="text-[10px] px-1.5 py-0.2 rounded font-semibold bg-[#52785B]/15 text-[#304C38]">
                {resolutionSource === 'gps'
                  ? 'GPS'
                  : resolutionSource === 'gazetteer'
                  ? 'Admin Gazetteer'
                  : resolutionSource === 'geocoder'
                  ? 'OSM Geocoder'
                  : 'Demo Center'}
              </span>
            </span>
          </div>
        </div>
      </NeomorphicCard>

      {/* Main Two-Column Layout: Map + Distance-Sorted Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Interactive Map */}
        <div className="lg:col-span-7 space-y-3 sticky top-20">
          <React.Suspense
            fallback={
              <div className="h-[460px] w-full rounded-2xl neo-card flex flex-col items-center justify-center gap-2 text-xs text-[#69776D]">
                <div className="w-7 h-7 border-3 border-[#52785B] border-t-transparent rounded-full animate-spin" />
                <span>{t('common.loading')}</span>
              </div>
            }
          >
            <StorageMap
              facilities={facilities}
              selectedFacility={selectedFacility}
              onSelectFacility={(fac) => {
                setSelectedFacility(fac);
                const el = document.getElementById(`fac-card-${fac.id}`);
                if (el) el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
              }}
              userCoords={userCoords}
            />
          </React.Suspense>
          <div className="text-[11px] text-[#69776D] px-2 flex items-center justify-between">
            <span>{t('storage.straight_line_geo')}</span>
            <span>{t('storage.osm_attribution')}</span>
          </div>
        </div>

        {/* Right Column: Distance-Sorted Facility Cards */}
        <div className="lg:col-span-5 space-y-4 lg:max-h-[800px] lg:overflow-y-auto pr-1">
          {loading ? (
            <div className="neo-card p-8 text-center text-[#69776D] space-y-2">
              <div className="w-6 h-6 border-2 border-[#52785B] border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="text-xs">{t('storage.searching_nearby')}</p>
            </div>
          ) : !locationResolved ? (
            /* Honest Unrecognized Location Empty State */
            <NeomorphicCard className="p-8 text-center space-y-3 border-l-4 border-amber-500">
              <AlertTriangle className="w-9 h-9 text-amber-600 mx-auto" />
              <h3 className="text-sm font-bold text-[#26352B]">
                {t('storage.unrecognized_loc_title')}
              </h3>
              <p className="text-xs text-[#69776D] leading-relaxed">
                {t('storage.unrecognized_loc_desc')}
              </p>
              <div className="flex flex-wrap justify-center gap-2 pt-2">
                <button
                  onClick={() => {
                    setSearchQuery('Nashik');
                    executeTextSearch('Nashik');
                  }}
                  className="neo-btn px-3 py-1.5 text-xs font-semibold text-[#52785B]"
                >
                  नाशिक (Nashik)
                </button>
                <button
                  onClick={() => {
                    setSearchQuery('Pune');
                    executeTextSearch('Pune');
                  }}
                  className="neo-btn px-3 py-1.5 text-xs font-semibold text-[#52785B]"
                >
                  पुणे (Pune)
                </button>
                <button
                  onClick={() => {
                    setSearchQuery('Ahmednagar');
                    executeTextSearch('Ahmednagar');
                  }}
                  className="neo-btn px-3 py-1.5 text-xs font-semibold text-[#52785B]"
                >
                  अहिल्यानगर (Ahmednagar)
                </button>
                <button
                  onClick={() => {
                    setSearchQuery('Solapur');
                    executeTextSearch('Solapur');
                  }}
                  className="neo-btn px-3 py-1.5 text-xs font-semibold text-[#52785B]"
                >
                  सोलापूर (Solapur)
                </button>
              </div>
            </NeomorphicCard>
          ) : facilities.length === 0 ? (
            /* Honest Empty State Within Radius */
            <NeomorphicCard className="p-8 text-center space-y-3">
              <AlertTriangle className="w-8 h-8 text-amber-600 mx-auto" />
              <h3 className="text-sm font-bold text-[#26352B]">
                {radiusKm > 0
                  ? t('storage.no_facilities_within_radius', { km: String(radiusKm) })
                  : t('storage.no_facilities_found_short')}
              </h3>
              <p className="text-xs text-[#69776D] leading-relaxed">
                {t('storage.increase_radius_prompt')}
              </p>
              <div className="flex flex-wrap justify-center gap-2 pt-1">
                <button
                  onClick={() => setRadiusKm(50)}
                  className="neo-btn-primary px-3 py-1.5 text-xs font-semibold flex items-center gap-1"
                >
                  <Maximize2 className="w-3 h-3" />
                  <span>{t('storage.expand_radius_50')}</span>
                </button>
                <button
                  onClick={() => setRadiusKm(100)}
                  className="neo-btn px-3 py-1.5 text-xs font-semibold text-[#304C38]"
                >
                  <span>{t('storage.expand_radius_100')}</span>
                </button>
                <button
                  onClick={() => setRadiusKm(0)}
                  className="neo-btn px-3 py-1.5 text-xs font-semibold text-[#69776D]"
                >
                  <span>{t('storage.show_all_facilities')}</span>
                </button>
              </div>
            </NeomorphicCard>
          ) : (
            facilities.map((fac) => {
              const isSelected = selectedFacility?.id === fac.id;
              const isChawl = fac.facility_type.toLowerCase().includes('chawl');
              const isCold = fac.facility_type.toLowerCase().includes('cold');
              const fee = fac.fee_per_quintal_month_inr ?? fac.storage_price_per_quintal_month;
              const cap = fac.capacity_total_mt ?? fac.capacity_metric_tonnes;
              const isOfficial = fac.verification_status === 'officially_registered';

              return (
                <div
                  key={fac.id}
                  id={`fac-card-${fac.id}`}
                  role="button"
                  tabIndex={0}
                  aria-pressed={isSelected}
                  onClick={() => setSelectedFacility(fac)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setSelectedFacility(fac);
                    }
                  }}
                  className={`p-4 rounded-2xl transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#52785B] ${
                    isSelected
                      ? 'neo-card ring-2 ring-[#52785B] bg-[#E3ECE1]'
                      : 'neo-card hover:bg-[#e4eae2]'
                  }`}
                >
                  <div className="space-y-3">
                    {/* Facility Top Header */}
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="text-sm font-bold text-[#26352B] leading-snug">
                          {fac.name}
                        </h3>
                        <p className="text-xs text-[#69776D] mt-0.5">
                          {fac.taluka}, {translateEntity(fac.district, 'district')} • {fac.pincode}
                        </p>
                      </div>

                      {fac.distance_km !== undefined && (
                        <div className="text-right flex-shrink-0">
                          <span className="inline-block px-2.5 py-1 rounded-full text-xs font-extrabold bg-[#52785B] text-white">
                            ~{fac.distance_km} {t('storage.straight_line_short')}
                          </span>
                          <span className="block text-[9px] text-[#69776D] mt-0.5">
                            {t('storage.distance_straight', { dist: String(fac.distance_km) })}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Badges: Category & Authentic Verification Status */}
                    <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                      <span
                        className={`px-2 py-0.5 rounded font-medium ${
                          isChawl
                            ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                            : isCold
                            ? 'bg-blue-100 text-blue-900 border border-blue-300'
                            : 'bg-stone-200 text-stone-800 border border-stone-300'
                        }`}
                      >
                        {fac.facility_type}
                      </span>

                      {/* Official Verification Badge */}
                      {isOfficial ? (
                        <span className="px-2 py-0.5 rounded font-medium bg-[#52785B]/15 text-[#304C38] flex items-center gap-1 border border-[#52785B]/30">
                          <ShieldCheck className="w-3 h-3 text-[#52785B]" />
                          <span>{t('storage.officially_registered')} ({fac.registration_authority || 'NHB/WDRA'})</span>
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded font-medium bg-amber-100 text-amber-900 flex items-center gap-1 border border-amber-300">
                          <AlertTriangle className="w-3 h-3 text-amber-700" />
                          <span>{t('storage.unverified_badge')}</span>
                        </span>
                      )}

                      {fac.last_verified_at && (
                        <span className="text-[10px] text-[#69776D]">
                          {t('storage.verified_checking')} {fac.last_verified_at}
                        </span>
                      )}
                    </div>

                    {/* Rates & Capacity (Honest Null Reporting) */}
                    <div className="p-2.5 rounded-xl neo-inset bg-[#E9EEE8] grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-[#69776D] block text-[10px]">{t('storage.indicative_fee')}</span>
                        {fee ? (
                          <span className="font-bold text-[#304C38]">
                            {formatCurrency(fee)} / {t('common.quintals')} / {t('common.month')}
                          </span>
                        ) : (
                          <span className="font-medium text-[#69776D] italic">
                            {t('storage.fee_not_provided')}
                          </span>
                        )}
                      </div>
                      <div>
                        <span className="text-[#69776D] block text-[10px]">{t('storage.capacity')}</span>
                        {cap ? (
                          <div className="space-y-0.5">
                            <span className="font-semibold text-[#26352B] block">
                              {cap.toLocaleString()} MT
                            </span>
                            <span className="text-[10px] text-[#59665C] block">
                              {fac.capacity_available_mt != null
                                ? `${t('storage.available_space')}: ${fac.capacity_available_mt} MT`
                                : t('storage.vacancy_call_confirm')}
                            </span>
                          </div>
                        ) : (
                          <span className="font-medium text-[#69776D] italic">
                            {t('common.not_reported')}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Storage Engineering Features */}
                    <div className="flex items-center gap-3 text-xs text-[#69776D]">
                      <div className="flex items-center gap-1">
                        <Wind
                          className={`w-3.5 h-3.5 ${
                            fac.aeration_system ? 'text-emerald-700' : 'text-gray-400'
                          }`}
                        />
                        <span>
                          {fac.aeration_system ? t('storage.ventilated_design') : t('storage.simple_design')}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Droplets
                          className={`w-3.5 h-3.5 ${
                            fac.humidity_control ? 'text-blue-700' : 'text-gray-400'
                          }`}
                        />
                        <span>
                          {fac.humidity_control ? t('storage.humidity_control_text') : t('storage.natural_ambient')}
                        </span>
                      </div>
                    </div>

                    {/* Educational / Crop Compatibility Note */}
                    {fac.notes && (
                      <p className="text-[11px] text-[#69776D] bg-[#F6F4EC] p-2 rounded-lg border border-[#e2dfd4] leading-relaxed">
                        <strong className="text-[#26352B]">{t('storage.storage_tip')}: </strong>
                        {fac.notes}
                      </p>
                    )}

                    {/* Official Source Link if available */}
                    {fac.source_url && (
                      <div className="text-[10px] text-[#69776D] flex items-center justify-between pt-0.5">
                        <span className="truncate">
                          {t('storage.record_source')} <span className="text-[#26352B] font-semibold">{fac.source_name || 'NHB Registry'}</span>
                        </span>
                        <a
                          href={fac.source_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#52785B] hover:underline flex items-center gap-0.5 flex-shrink-0"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <span>{t('storage.original_record')}</span>
                          <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      </div>
                    )}

                    {/* Actions: Call & Directions */}
                    <div className="pt-1 flex items-center gap-2">
                      {fac.contact_phone ? (
                        <a
                          href={`tel:${fac.contact_phone}`}
                          className="flex-1 neo-btn py-2 px-3 text-xs font-semibold text-[#26352B] flex items-center justify-center gap-1.5 hover:bg-emerald-50"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Phone className="w-3.5 h-3.5 text-[#52785B]" />
                          <span>{t('storage.call_facility')}</span>
                        </a>
                      ) : (
                        <button
                          disabled
                          className="flex-1 neo-btn py-2 px-3 text-xs font-medium text-gray-400 cursor-not-allowed opacity-75"
                          title={t('storage.contact_not_available')}
                        >
                          <span>{t('storage.contact_not_available')}</span>
                        </button>
                      )}

                      {fac.latitude != null && fac.longitude != null ? (
                        <a
                          href={`https://www.google.com/maps/dir/?api=1&destination=${fac.latitude},${fac.longitude}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 neo-btn-primary py-2 px-3 text-xs font-semibold flex items-center justify-center gap-1.5"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Navigation className="w-3.5 h-3.5" />
                          <span>{t('storage.get_directions')}</span>
                          <ExternalLink className="w-3 h-3 ml-0.5" />
                        </a>
                      ) : null}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
        </>
      )}
    </div>
  );
};
