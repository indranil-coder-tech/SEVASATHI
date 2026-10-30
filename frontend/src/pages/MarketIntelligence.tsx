import React, { useState, useEffect, useCallback } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Layers,
  MapPin,
  RefreshCw,
  ShieldCheck,
  Calculator,
  ArrowRight,
  Database,
  Calendar,
  AlertCircle,
  Building2,
  Tag,
  Warehouse,
} from 'lucide-react';
import { NeomorphicCard } from '../components/NeomorphicCard';
import { fetchMarketHierarchy, fetchMarketPrices } from '../services/api';
import type { MarketPriceResponse } from '../types';
import { useApp } from '../context/AppContext';
import { AgriImage } from '../components/AgriImage';

const PriceChart = React.lazy(() =>
  import('../components/PriceChart').then((m) => ({ default: m.PriceChart }))
);

interface MarketIntelligenceProps {
  onNavigateToCalculator?: (data: {
    crop: string;
    mandi: string;
    currentPrice: number;
    expectedFuturePrice: number;
  }) => void;
  onNavigateToStorage?: (crop: string) => void;
}

export const MarketIntelligence: React.FC<MarketIntelligenceProps> = ({
  onNavigateToCalculator,
  onNavigateToStorage,
}) => {
  const {
    t,
    translateEntity,
    formatDate,
    formatCurrency,
    formatNumber,
    formatPriceUnit,
  } = useApp();

  // Filter options from official hierarchy
  const [states, setStates] = useState<string[]>(['Maharashtra']);
  const [districts, setDistricts] = useState<string[]>([]);
  const [mandis, setMandis] = useState<string[]>([]);
  const [commodities, setCommodities] = useState<string[]>([]);
  const [varieties, setVarieties] = useState<string[]>([]);

  // Selected filter values
  const [selectedState, setSelectedState] = useState<string>('Maharashtra');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('Nashik');
  const [selectedMandi, setSelectedMandi] = useState<string>('Lasalgaon(Vinchur)');
  const [selectedCommodity, setSelectedCommodity] = useState<string>('Onion');
  const [selectedVariety, setSelectedVariety] = useState<string>('');
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');
  const [mode, setMode] = useState<'live' | 'demo'>('live');

  // Market response state
  const [marketData, setMarketData] = useState<MarketPriceResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [hierarchyInitialized, setHierarchyInitialized] = useState<boolean>(false);

  // 1. Initial hierarchy loading
  useEffect(() => {
    async function initHierarchy() {
      try {
        const hier = await fetchMarketHierarchy({
          state: 'Maharashtra',
          district: 'Nashik',
          commodity: 'Onion',
        });
        setStates(hier.states);
        setDistricts(hier.districts);
        setMandis(hier.mandis);
        setCommodities(hier.commodities);
        setVarieties(hier.varieties);

        if (hier.selected_state) setSelectedState(hier.selected_state);
        if (hier.selected_district) setSelectedDistrict(hier.selected_district);
        if (hier.selected_mandi) setSelectedMandi(hier.selected_mandi);
        if (hier.selected_commodity) setSelectedCommodity(hier.selected_commodity);

        setHierarchyInitialized(true);
      } catch (err: unknown) {
        console.error('Failed to load initial market hierarchy', err);
        setHierarchyInitialized(true);
      }
    }
    initHierarchy();
  }, []);

  // 2. Dependent state change handler
  const handleStateChange = async (newState: string) => {
    setSelectedState(newState);
    setLoading(true);
    try {
      const hier = await fetchMarketHierarchy({ state: newState });
      setDistricts(hier.districts);
      setMandis(hier.mandis);
      setCommodities(hier.commodities);
      setVarieties(hier.varieties);

      const nextDist = hier.selected_district || hier.districts[0] || '';
      const nextMandi = hier.selected_mandi || hier.mandis[0] || '';
      const nextComm = hier.selected_commodity || hier.commodities[0] || 'Onion';

      setSelectedDistrict(nextDist);
      setSelectedMandi(nextMandi);
      setSelectedCommodity(nextComm);
      setSelectedVariety('');
    } catch (err: unknown) {
      console.error('Failed to update state hierarchy', err);
    }
  };

  // 3. Dependent district change handler
  const handleDistrictChange = async (newDistrict: string) => {
    setSelectedDistrict(newDistrict);
    setLoading(true);
    try {
      const hier = await fetchMarketHierarchy({
        state: selectedState,
        district: newDistrict,
      });
      setMandis(hier.mandis);
      setCommodities(hier.commodities);
      setVarieties(hier.varieties);

      const nextMandi = hier.selected_mandi || hier.mandis[0] || '';
      const nextComm = hier.selected_commodity || hier.commodities[0] || 'Onion';

      setSelectedMandi(nextMandi);
      setSelectedCommodity(nextComm);
      setSelectedVariety('');
    } catch (err: unknown) {
      console.error('Failed to update district hierarchy', err);
    }
  };

  // 4. Dependent mandi change handler
  const handleMandiChange = async (newMandi: string) => {
    setSelectedMandi(newMandi);
    setLoading(true);
    try {
      const hier = await fetchMarketHierarchy({
        state: selectedState,
        district: selectedDistrict,
        market: newMandi,
      });
      setCommodities(hier.commodities);
      setVarieties(hier.varieties);

      const nextComm = hier.selected_commodity || hier.commodities[0] || 'Onion';
      setSelectedCommodity(nextComm);
      setSelectedVariety('');
    } catch (err: unknown) {
      console.error('Failed to update mandi hierarchy', err);
    }
  };

  // 5. Dependent commodity change handler
  const handleCommodityChange = async (newComm: string) => {
    setSelectedCommodity(newComm);
    try {
      const hier = await fetchMarketHierarchy({
        state: selectedState,
        district: selectedDistrict,
        market: selectedMandi,
        commodity: newComm,
      });
      setVarieties(hier.varieties);
      setSelectedVariety('');
    } catch (err: unknown) {
      console.error('Failed to update commodity hierarchy', err);
    }
  };

  // 6. Fetch market prices for currently selected hierarchy
  const loadMarketData = useCallback(async () => {
    if (!hierarchyInitialized) return;
    try {
      setLoading(true);
      setError(null);
      const res = await fetchMarketPrices({
        state: selectedState,
        district: selectedDistrict,
        market: selectedMandi,
        commodity: selectedCommodity,
        variety: selectedVariety || undefined,
        range: timeRange,
        forecastDays: 7,
        mode: mode,
      });
      setMarketData(res);
    } catch (err: unknown) {
      setMarketData(null);
      setError((err instanceof Error ? err.message : String(err)) || t('market.no_data_title'));
    } finally {
      setLoading(false);
    }
  }, [
    hierarchyInitialized,
    selectedState,
    selectedDistrict,
    selectedMandi,
    selectedCommodity,
    selectedVariety,
    timeRange,
    mode,
    t,
  ]);

  useEffect(() => {
    loadMarketData();
  }, [loadMarketData]);

  // Quick reset to benchmark Lasalgaon Onion
  const resetToLasalgaon = () => {
    setSelectedState('Maharashtra');
    setSelectedDistrict('Nashik');
    setSelectedMandi('Lasalgaon(Vinchur)');
    setSelectedCommodity('Onion');
    setSelectedVariety('');
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in">
      {/* Header & Controls */}
      <div className="space-y-4">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
          <div className="lg:col-span-8 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#26352B]">
                {t('market.page_title')}
              </h1>
              <span className="text-[10px] sm:text-xs uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                {t('market.feed_badge')}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-[#69776D] leading-relaxed">
              {t('market.page_subtitle')}
            </p>
          </div>

          <div className="lg:col-span-4">
            <AgriImage
              name="market_mandi_trading"
              alt={t('market.context_image_alt')}
              caption={t('market.context_image_caption')}
              aspectRatio="aspect-[16/9] lg:aspect-[16/8]"
              className="max-h-36 shadow-sm border border-[#d8e0d6]"
            />
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="text-xs text-[#69776D]">
            {t('market.hierarchy_subtitle')}
          </div>

          <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
            {/* Mode Toggle */}
            <div className="flex items-center p-1 rounded-xl neo-inset bg-[#E9EEE8] text-xs">
              <button
                onClick={() => setMode('live')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all text-xs ${
                  mode === 'live'
                    ? 'bg-[#52785B] text-white shadow-sm'
                    : 'text-[#69776D] hover:text-[#26352B]'
                }`}
              >
                {t('market.mode_live')}
              </button>
              <button
                onClick={() => setMode('demo')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all text-xs ${
                  mode === 'demo'
                    ? 'bg-amber-600 text-white shadow-sm'
                    : 'text-[#69776D] hover:text-[#26352B]'
                }`}
              >
                {t('market.mode_demo')}
              </button>
            </div>

            <button
              onClick={loadMarketData}
              disabled={loading}
              className="neo-btn px-3 py-2 text-xs font-semibold flex items-center gap-1.5 text-[#26352B]"
              title={t('market.refresh_feed')}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">{t('market.refresh_feed')}</span>
            </button>
          </div>
        </div>

        {/* 5-Step Dependent Filter Bar */}
        <NeomorphicCard className="p-4 sm:p-5 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#d8e0d6] pb-2 gap-1">
            <span className="text-xs font-bold text-[#26352B] flex items-center gap-1.5 uppercase tracking-wide">
              <Building2 className="w-4 h-4 text-[#52785B] flex-shrink-0" />
              <span>{t('market.hierarchy_title')}</span>
            </span>
            <span className="text-[11px] text-[#69776D]">
              {t('market.hierarchy_subtitle')}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {/* 1. State Selector */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-[#26352B] flex items-center gap-1">
                <span>{t('market.step_1_state')}</span>
              </label>
              <div className="neo-inset p-1 bg-[#E9EEE8] rounded-xl">
                <select
                  value={selectedState}
                  onChange={(e) => handleStateChange(e.target.value)}
                  className="w-full bg-transparent px-2.5 py-1.5 text-xs text-[#26352B] font-semibold outline-none cursor-pointer truncate"
                >
                  {states.map((st) => (
                    <option key={st} value={st}>
                      {translateEntity('state', st)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* 2. District Selector */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-[#26352B] flex items-center gap-1">
                <MapPin className="w-3 h-3 text-[#52785B]" />
                <span>{t('market.step_2_district')}</span>
              </label>
              <div className="neo-inset p-1 bg-[#E9EEE8] rounded-xl">
                <select
                  value={selectedDistrict}
                  onChange={(e) => handleDistrictChange(e.target.value)}
                  className="w-full bg-transparent px-2.5 py-1.5 text-xs text-[#26352B] font-semibold outline-none cursor-pointer truncate"
                >
                  {districts.length > 0 ? (
                    districts.map((d) => (
                      <option key={d} value={d}>
                        {translateEntity('district', d)}
                      </option>
                    ))
                  ) : (
                    <option value="">{t('market.no_districts_found')}</option>
                  )}
                </select>
              </div>
            </div>

            {/* 3. APMC Mandi Selector */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-[#26352B] flex items-center gap-1">
                <Building2 className="w-3 h-3 text-[#52785B]" />
                <span>{t('market.step_3_mandi')}</span>
              </label>
              <div className="neo-inset p-1 bg-[#E9EEE8] rounded-xl">
                <select
                  value={selectedMandi}
                  onChange={(e) => handleMandiChange(e.target.value)}
                  className="w-full bg-transparent px-2.5 py-1.5 text-xs text-[#26352B] font-semibold outline-none cursor-pointer truncate"
                >
                  {mandis.length > 0 ? (
                    mandis.map((m) => (
                      <option key={m} value={m}>
                        {translateEntity('market', m)}
                      </option>
                    ))
                  ) : (
                    <option value="">{t('market.no_mandis_found')}</option>
                  )}
                </select>
              </div>
            </div>

            {/* 4. Commodity Selector */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-[#26352B] flex items-center gap-1">
                <Layers className="w-3 h-3 text-[#52785B]" />
                <span>{t('market.step_4_commodity')}</span>
              </label>
              <div className="neo-inset p-1 bg-[#E9EEE8] rounded-xl">
                <select
                  value={selectedCommodity}
                  onChange={(e) => handleCommodityChange(e.target.value)}
                  className="w-full bg-transparent px-2.5 py-1.5 text-xs text-[#26352B] font-semibold outline-none cursor-pointer truncate"
                >
                  {commodities.length > 0 ? (
                    commodities.map((c) => (
                      <option key={c} value={c}>
                        {translateEntity('commodity', c)}
                      </option>
                    ))
                  ) : (
                    <option value="Onion">{translateEntity('commodity', 'Onion')}</option>
                  )}
                </select>
              </div>
            </div>

            {/* 5. Variety Selector */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-[#26352B] flex items-center gap-1">
                <Tag className="w-3 h-3 text-[#52785B]" />
                <span>{t('market.step_5_variety')}</span>
              </label>
              <div className="neo-inset p-1 bg-[#E9EEE8] rounded-xl">
                <select
                  value={selectedVariety}
                  onChange={(e) => setSelectedVariety(e.target.value)}
                  className="w-full bg-transparent px-2.5 py-1.5 text-xs text-[#26352B] font-semibold outline-none cursor-pointer truncate"
                >
                  <option value="">{t('market.all_varieties')}</option>
                  {varieties.map((v) => (
                    <option key={v} value={v}>
                      {translateEntity('variety', v)}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </NeomorphicCard>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="neo-card p-8 sm:p-12 text-center text-[#69776D] space-y-3">
          <div className="w-8 h-8 border-3 border-[#52785B] border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xs sm:text-sm font-medium">
            {t('market.loading_records')}
          </p>
        </div>
      )}

      {/* No-Data / Error State (Strict: No Silent Fallback) */}
      {!loading && error && (
        <NeomorphicCard className="p-6 sm:p-8 border-amber-300 bg-amber-50/40 text-[#26352B] space-y-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl neo-inset bg-amber-100 flex items-center justify-center text-amber-800 shrink-0">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm sm:text-base font-bold text-amber-950">
                {t('market.no_data_title')}
              </h3>
              <p className="text-xs sm:text-sm text-[#4A5568] leading-relaxed">
                {error}
              </p>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-white/70 border border-amber-200 text-xs text-[#4A5568] space-y-1.5">
            <p className="font-semibold text-amber-900">
              {t('market.no_data_reason_title')}
            </p>
            <ul className="list-disc list-inside space-y-1 text-[#69776D]">
              <li>{t('market.no_data_reason_1')}</li>
              <li>{t('market.no_data_reason_2')}</li>
              <li>{t('market.no_data_reason_3')}</li>
            </ul>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-1">
            <button
              onClick={resetToLasalgaon}
              className="neo-btn-primary px-4 py-2 text-xs font-semibold flex items-center gap-2"
            >
              <span>{t('market.btn_reset_benchmark')}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setMode('demo')}
              className="neo-btn px-4 py-2 text-xs font-semibold text-[#26352B] flex items-center gap-1.5"
            >
              <span>{t('market.btn_switch_demo')}</span>
            </button>
            <button
              onClick={loadMarketData}
              className="neo-btn px-4 py-2 text-xs font-semibold text-[#26352B]"
            >
              {t('market.btn_retry_query')}
            </button>
          </div>
        </NeomorphicCard>
      )}

      {/* Main Content Area */}
      {!loading && marketData && (
        <div className="space-y-6 sm:space-y-8">
          {/* Active Yard Status Banner */}
          <div className="p-3.5 sm:p-4 rounded-2xl bg-[#52785B]/10 border border-[#52785B]/25 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5">
              <ShieldCheck className="w-4 h-4 text-[#52785B] shrink-0" />
              <div>
                <span className="font-bold text-[#304C38]">
                  {translateEntity('market', marketData.market)} ({translateEntity('district', marketData.district)}, {translateEntity('state', marketData.state)})
                </span>
                <span className="text-[#69776D] block sm:inline sm:ml-2">
                  {t('market.step_4_commodity')}: <strong className="text-[#26352B]">{translateEntity('commodity', marketData.commodity)}</strong> ({translateEntity('variety', marketData.variety)})
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 text-[11px] text-[#69776D]">
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-[#52785B]" />
                <span>{t('market.actual_obs_date')} <strong className="text-[#26352B]">{formatDate(marketData.latest_date)}</strong></span>
              </span>
              <span className="px-2 py-0.5 rounded-md font-bold bg-white text-[#304C38] border border-[#52785B]/20">
                {marketData.mode === 'demo' ? t('market.demo_badge') : t('market.agmarknet_verified')}
              </span>
            </div>
          </div>

          {/* Contextual Action Bar — Connected Quick-Start Journey */}
          <div className="p-3.5 sm:p-4 rounded-2xl neo-card bg-gradient-to-r from-[#E9EEE8] via-[#e4ede2] to-[#E9EEE8] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-l-4 border-[#52785B]">
            <div className="flex items-center gap-2">
              <span className="text-xs sm:text-sm font-bold text-[#26352B]">
                {translateEntity('commodity', marketData.commodity)} @ {translateEntity('market', marketData.market)}:{' '}
                <span className="text-[#304C38]">{formatCurrency(marketData.latest_modal_price)} / q</span>
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
              {onNavigateToStorage && (
                <button
                  onClick={() => onNavigateToStorage(marketData.commodity)}
                  className="neo-btn px-3 py-1.5 text-xs font-semibold text-[#304C38] flex items-center gap-1.5 flex-1 sm:flex-none justify-center"
                >
                  <Warehouse className="w-3.5 h-3.5 text-[#52785B]" />
                  <span>{t('market.action_find_storage_for_crop', { crop: translateEntity('commodity', marketData.commodity) })}</span>
                </button>
              )}

              {onNavigateToCalculator && (
                <button
                  onClick={() => {
                    const futureP =
                      marketData.forecast_points.length > 0
                        ? Math.round(marketData.forecast_points[marketData.forecast_points.length - 1].modal_price)
                        : Math.round(marketData.latest_modal_price * 1.2);
                    onNavigateToCalculator({
                      crop: marketData.commodity,
                      mandi: marketData.market,
                      currentPrice: marketData.latest_modal_price,
                      expectedFuturePrice: futureP,
                    });
                  }}
                  className="neo-btn-primary px-3.5 py-1.5 text-xs font-semibold flex items-center gap-1.5 flex-1 sm:flex-none justify-center shadow-sm"
                >
                  <Calculator className="w-3.5 h-3.5" />
                  <span>{t('market.action_calculate_for_crop', { price: marketData.latest_modal_price })}</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>

          {/* 4 Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {/* Metric 1: Latest Modal Price */}
            <NeomorphicCard className="p-4 sm:p-5 space-y-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#69776D]">
                {t('market.latest_modal_price')}
              </span>
              <div className="flex items-baseline gap-1.5 flex-wrap">
                <span className="text-2xl sm:text-3xl font-extrabold text-[#26352B]">
                  {formatCurrency(marketData.latest_modal_price)}
                </span>
                <span className="text-xs text-[#69776D]">{formatPriceUnit()}</span>
              </div>
              <div className="flex items-center gap-2 text-xs flex-wrap">
                {marketData.price_trend === 'rising' ? (
                  <span className="flex items-center gap-1 font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full text-[11px]">
                    <TrendingUp className="w-3.5 h-3.5" />
                    +{marketData.price_change_7d_pct}%
                  </span>
                ) : marketData.price_trend === 'falling' ? (
                  <span className="flex items-center gap-1 font-semibold text-red-700 bg-red-100 px-2 py-0.5 rounded-full text-[11px]">
                    <TrendingDown className="w-3.5 h-3.5" />
                    {marketData.price_change_7d_pct}%
                  </span>
                ) : (
                  <span className="flex items-center gap-1 font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-full text-[11px]">
                    <Minus className="w-3.5 h-3.5" />
                    {t('common.verified')}
                  </span>
                )}
                <span className="text-[#69776D]">{t('dashboard.vs_7_days')}</span>
              </div>
            </NeomorphicCard>

            {/* Metric 2: Price Spread */}
            <NeomorphicCard className="p-4 sm:p-5 space-y-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#69776D]">
                {t('market.min_max_range')}
              </span>
              <div className="space-y-1">
                <div className="text-base sm:text-lg font-bold text-[#26352B]">
                  {formatCurrency(marketData.latest_min_price)} – {formatCurrency(marketData.latest_max_price)}
                </div>
                <p className="text-xs text-[#69776D]">
                  {t('market.spread_label')} {formatCurrency(marketData.latest_max_price - marketData.latest_min_price)}/q
                </p>
              </div>
              <div className="text-[11px] text-[#52785B] font-medium pt-1">
                {t('market.step_5_variety')}: {translateEntity('variety', marketData.variety)}
              </div>
            </NeomorphicCard>

            {/* Metric 3: Daily Arrivals Volume (Honest Provenance) */}
            <NeomorphicCard className="p-4 sm:p-5 space-y-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#69776D]">
                {t('market.reported_arrivals')}
              </span>
              <div className="flex items-baseline gap-1.5 flex-wrap">
                {marketData.arrival_reported && typeof marketData.latest_arrival_tonnes === 'number' ? (
                  <>
                    <span className="text-2xl sm:text-3xl font-extrabold text-[#26352B]">
                      {formatNumber(marketData.latest_arrival_tonnes)}
                    </span>
                    <span className="text-xs text-[#69776D]">{t('common.tonnes')}</span>
                  </>
                ) : (
                  <span className="text-lg sm:text-xl font-bold text-[#69776D]">
                    {t('common.not_reported')}
                  </span>
                )}
              </div>
              <p className="text-xs text-[#69776D]">
                {marketData.arrival_reported
                  ? `${t('market.actual_obs_date')} ${formatDate(marketData.latest_date)}`
                  : t('market.arrivals_not_published')}
              </p>
            </NeomorphicCard>

            {/* Metric 4: 7-Day Baseline Forecast Status */}
            <NeomorphicCard className="p-4 sm:p-5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-[#69776D]">
                  {t('market.projected_trend')}
                </span>
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                    marketData.is_forecast_available
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  {marketData.is_forecast_available ? t('market.projection_badge') : t('market.integrity_badge')}
                </span>
              </div>
              {marketData.is_forecast_available && marketData.forecast_points.length > 0 ? (
                <>
                  <div className="text-base sm:text-lg font-bold text-[#52785B]">
                    {formatCurrency(marketData.forecast_points[0].modal_price)} – {formatCurrency(marketData.forecast_points[marketData.forecast_points.length - 1].modal_price)}
                    <span className="text-xs font-normal text-[#69776D]"> {formatPriceUnit()}</span>
                  </div>
                  <p className="text-xs text-[#69776D]">
                    {t('market.forecast_extrapolation_note')}
                  </p>
                </>
              ) : (
                <div className="space-y-1">
                  <div className="text-xs sm:text-sm font-semibold text-[#26352B]">
                    {t('market.forecast_paused_title')}
                  </div>
                  <p className="text-[11px] text-[#69776D]">
                    {t('market.forecast_paused_desc')}
                  </p>
                </div>
              )}
            </NeomorphicCard>
          </div>

          {/* Price Trajectory Chart */}
          <NeomorphicCard className="p-4 sm:p-6">
            <React.Suspense
              fallback={
                <div className="h-80 w-full flex flex-col items-center justify-center gap-2 text-xs text-[#69776D]">
                  <div className="w-8 h-8 border-3 border-[#52785B] border-t-transparent rounded-full animate-spin" />
                  <span>{t('common.loading')}</span>
                </div>
              }
            >
              <PriceChart
                historicalData={marketData.historical_points}
                forecastData={marketData.forecast_points}
                timeRange={timeRange}
                onRangeChange={setTimeRange}
                commodityName={translateEntity('commodity', marketData.commodity)}
              />
            </React.Suspense>
            {/* Observation Notice */}
            <div className="mt-3 pt-3 border-t border-[#d8e0d6] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs text-[#69776D]">
              <span className="flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5 text-[#52785B] flex-shrink-0" />
                <span>{t('market.observations_count', { count: marketData.historical_points.length })}</span>
              </span>
              <span>
                {t('market.source_attribution')} <strong>{marketData.data_source}</strong>
              </span>
            </div>
          </NeomorphicCard>

          {/* Market Narrative & Calculator CTA */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
            <NeomorphicCard className="lg:col-span-2 p-4 sm:p-6 space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg neo-inset flex items-center justify-center text-[#52785B] flex-shrink-0">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-[#26352B]">
                  {t('market.narrative_title')}
                </h3>
              </div>
              <p className="text-xs sm:text-sm text-[#26352B] leading-relaxed">
                {marketData.trend_summary}
              </p>
              <div className="pt-2 border-t border-[#d8e0d6] text-xs text-[#69776D] space-y-1">
                <p>
                  <strong className="text-[#26352B]">{t('market.source_attribution')}</strong> {marketData.data_source} ({t('market.actual_obs_date')} {formatDate(marketData.latest_date)})
                </p>
                <p>
                  <strong className="text-[#26352B]">{t('market.data_integrity_note')}</strong> {marketData.disclaimer}
                </p>
              </div>
            </NeomorphicCard>

            {/* Quick Transition to Sell-or-Store Calculator */}
            {onNavigateToCalculator && (
              <NeomorphicCard className="flex flex-col justify-between space-y-4 p-4 sm:p-6 bg-gradient-to-br from-[#E9EEE8] to-[#E3EAE2]">
                <div className="space-y-2">
                  <div className="w-8 h-8 rounded-lg neo-inset flex items-center justify-center text-[#52785B]">
                    <Calculator className="w-4 h-4" />
                  </div>
                  <h3 className="text-sm font-bold text-[#26352B]">
                    {t('market.calc_transfer_title')}
                  </h3>
                  <p className="text-xs text-[#69776D]">
                    {t('market.calc_transfer_desc')}
                  </p>
                </div>

                <button
                  onClick={() => {
                    const futureP =
                      marketData.forecast_points.length > 0
                        ? Math.round(marketData.forecast_points[marketData.forecast_points.length - 1].modal_price)
                        : marketData.latest_modal_price + 300;
                    onNavigateToCalculator({
                      crop: marketData.commodity,
                      mandi: marketData.market,
                      currentPrice: marketData.latest_modal_price,
                      expectedFuturePrice: futureP,
                    });
                  }}
                  className="neo-btn-primary py-2.5 px-4 text-xs font-semibold flex items-center justify-center gap-2"
                >
                  <span>{t('market.calc_transfer_btn')}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </NeomorphicCard>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
