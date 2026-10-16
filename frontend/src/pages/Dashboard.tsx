import React, { useEffect, useState } from 'react';
import {
  TrendingUp,
  Warehouse,
  Calculator,
  ArrowRight,
  AlertCircle,
  Sparkles,
  BarChart3,
  Scale,
  MapPin,
  Navigation,
} from 'lucide-react';
import { NeomorphicCard } from '../components/NeomorphicCard';
import { fetchMarketPrices } from '../services/api';
import type { MarketPriceResponse } from '../types';
import { useApp } from '../context/AppContext';
import { MiniSparkline } from '../components/MiniSparkline';

interface DashboardProps {
  onNavigate: (tab: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  const [marketData, setMarketData] = useState<MarketPriceResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const { t, userLocation, requestLocation, formatCurrency, translateEntity, formatDate } = useApp();

  useEffect(() => {
    let isMounted = true;
    async function loadQuickData() {
      try {
        setLoading(true);
        const data = await fetchMarketPrices('onion', 'lasalgaon', '30d', 5);
        if (isMounted) {
          setMarketData(data);
          setError(null);
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err.message || 'Failed to connect to market service.');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadQuickData();
    return () => {
      isMounted = false;
    };
  }, []);

  const chartPoints = marketData
    ? marketData.historical_points.slice(-14).map((pt) => ({
        date: pt.date.slice(5),
        price: pt.modal_price,
      }))
    : [];

  return (
    <div className="space-y-10 animate-fade-in">
      {/* Live Location Alert Bar if Prompting / Detected */}
      <div className="p-3 sm:p-4 rounded-2xl neo-card bg-gradient-to-r from-[#E9EEE8] via-[#e2ebe0] to-[#E9EEE8] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs border-l-4 border-[#52785B]">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-full bg-[#52785B]/20 flex items-center justify-center text-[#52785B] flex-shrink-0">
            <MapPin className="w-4 h-4 animate-bounce" />
          </div>
          <div>
            <div className="font-bold text-[#26352B]">
              {t('location_detected')}:{' '}
              <span className="text-[#304C38]">{userLocation.displayName}</span>
            </div>
            <p className="text-[#69776D] text-[11px] mt-0.5">
              {t('location_prompt_banner')}
            </p>
          </div>
        </div>

        <button
          onClick={requestLocation}
          className="neo-btn px-3 py-1.5 rounded-full text-xs font-bold text-[#304C38] flex items-center gap-1.5 flex-shrink-0"
        >
          <Navigation className="w-3.5 h-3.5 text-[#52785B]" />
          <span>{t('location_allow_btn')}</span>
        </button>
      </div>

      {/* Hero Welcome Banner */}
      <section className="relative overflow-hidden neo-card p-6 sm:p-10 bg-gradient-to-br from-[#E9EEE8] via-[#E4ECE3] to-[#E9EEE8]">
        <div className="max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#52785B]/15 text-[#304C38] text-xs font-semibold border border-[#52785B]/30">
            <Sparkles className="w-3.5 h-3.5 text-[#52785B]" />
            <span>{t('hero_pill')}</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-[#26352B] leading-tight">
            {t('hero_title_1')}{' '}
            <span className="text-[#52785B] block sm:inline">{t('hero_title_2')}</span>
          </h1>

          <p className="text-base sm:text-lg text-[#69776D] leading-relaxed">
            {t('hero_description')}
          </p>

          {/* Core Principle Quote */}
          <div className="p-4 rounded-xl neo-inset border-l-4 border-[#52785B] bg-[#E9EEE8]">
            <p className="text-sm font-semibold text-[#26352B] italic">
              {t('hero_quote')}
            </p>
          </div>

          {/* Quick Action CTAs */}
          <div className="pt-2 flex flex-wrap gap-3">
            <button
              onClick={() => onNavigate('storage')}
              className="neo-btn-primary px-6 py-3 text-sm font-semibold flex items-center gap-2"
            >
              <Warehouse className="w-4 h-4" />
              <span>{t('btn_find_storage')}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => onNavigate('market')}
              className="neo-btn px-6 py-3 text-sm font-semibold flex items-center gap-2 text-[#26352B]"
            >
              <TrendingUp className="w-4 h-4 text-[#52785B]" />
              <span>{t('btn_explore_market')}</span>
            </button>

            <button
              onClick={() => onNavigate('calculator')}
              className="neo-btn px-6 py-3 text-sm font-semibold flex items-center gap-2 text-[#26352B]"
            >
              <Calculator className="w-4 h-4 text-[#52785B]" />
              <span>{t('btn_calculator')}</span>
            </button>
          </div>
        </div>
      </section>

      {/* Live Market Snapshot & Mini Trend */}
      <section className="space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h2 className="text-xl font-bold text-[#26352B]">
              {t('snapshot_title')}
            </h2>
            <p className="text-xs text-[#69776D]">
              {t('snapshot_subtitle')}
            </p>
          </div>
          <button
            onClick={() => onNavigate('market')}
            className="text-xs font-semibold text-[#52785B] hover:underline flex items-center gap-1"
          >
            <span>{t('full_mandi_analytics')}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {loading ? (
          <div className="neo-card p-8 text-center text-[#69776D] flex flex-col items-center justify-center gap-2">
            <div className="w-7 h-7 border-3 border-[#52785B] border-t-transparent rounded-full animate-spin"></div>
            <p className="text-xs font-medium">{t('common.loading')}</p>
          </div>
        ) : error ? (
          <div className="neo-card p-6 border-red-200 bg-red-50/50 text-red-800 text-sm flex items-center gap-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        ) : marketData ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Metric Card 1: Latest Price */}
            <NeomorphicCard className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-[#69776D]">
                  {t('dashboard.latest_modal_price')}
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-[#52785B]/15 text-[#304C38]">
                  {formatDate(marketData.latest_date)}
                </span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-[#26352B]">
                  {formatCurrency(marketData.latest_modal_price)}
                </span>
                <span className="text-xs font-medium text-[#69776D]">{t('common.per_quintal')}</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span
                  className={`font-semibold ${
                    marketData.price_change_7d >= 0 ? 'text-emerald-700' : 'text-red-700'
                  }`}
                >
                  {marketData.price_change_7d >= 0 ? '+' : ''}
                  {formatCurrency(marketData.price_change_7d)} ({marketData.price_change_7d_pct}%)
                </span>
                <span className="text-[#69776D]">• {t('dashboard.vs_7_days')}</span>
              </div>
              <div className="pt-2 border-t border-[#d8e0d6] text-xs text-[#69776D] flex justify-between">
                <span>{t('dashboard.daily_arrivals')}</span>
                <span className="font-semibold text-[#26352B]">
                  {marketData.latest_arrival_tonnes} {t('common.tonnes')}
                </span>
              </div>
            </NeomorphicCard>

            {/* Metric Card 2: Price Spread & Baseline Forecast */}
            <NeomorphicCard className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-[#69776D]">
                  {t('dashboard.min_max_spread')}
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-amber-100 text-amber-800">
                  {t('dashboard.statistical_baseline')}
                </span>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-[#69776D]">{t('dashboard.min_max')}</span>
                  <span className="font-bold text-[#26352B]">
                    {formatCurrency(marketData.latest_min_price)} – {formatCurrency(marketData.latest_max_price)}
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-[#69776D]">{t('dashboard.forecast_horizon')}</span>
                  <span className="font-bold text-[#52785B]">
                    {marketData.forecast_points.length > 0
                      ? `${formatCurrency(Math.round(marketData.forecast_points[0].modal_price))} – ${formatCurrency(Math.round(
                          marketData.forecast_points[marketData.forecast_points.length - 1].modal_price
                        ))}`
                      : t('dashboard.evaluating')}
                  </span>
                </div>
              </div>
              <p className="text-xs text-[#69776D] line-clamp-2 pt-2 border-t border-[#d8e0d6]">
                {marketData.trend_summary}
              </p>
            </NeomorphicCard>

            {/* Metric Card 3: Mini Sparkline Chart */}
            <NeomorphicCard className="flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-[#69776D]">
                  {t('dashboard.trend_line')}
                </span>
                <span className="text-[10px] text-[#52785B] font-bold">{t('dashboard.trend_badge')}</span>
              </div>
              <div className="h-28 w-full">
                <MiniSparkline data={chartPoints} />
              </div>
              <div className="text-[11px] text-[#69776D] flex items-center justify-between pt-1">
                <span>{translateEntity(marketData.market, 'market')} {translateEntity(marketData.commodity, 'commodity')}</span>
                <span className="text-[#304C38] font-medium">{t('common.verified')} AGMARKNET</span>
              </div>
            </NeomorphicCard>
          </div>
        ) : null}
      </section>

      {/* How SevaSathi Helps (3 Core Pillars) */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold text-[#26352B]">
          {t('pillars_title')}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <NeomorphicCard className="space-y-3">
            <div className="w-10 h-10 rounded-xl neo-inset flex items-center justify-center text-[#52785B]">
              <BarChart3 className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-[#26352B]">
              {t('pillar_1_title')}
            </h3>
            <p className="text-xs text-[#69776D] leading-relaxed">
              {t('pillar_1_desc')}
            </p>
          </NeomorphicCard>

          <NeomorphicCard className="space-y-3">
            <div className="w-10 h-10 rounded-xl neo-inset flex items-center justify-center text-[#52785B]">
              <MapPin className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-[#26352B]">
              {t('pillar_2_title')}
            </h3>
            <p className="text-xs text-[#69776D] leading-relaxed">
              {t('pillar_2_desc')}
            </p>
          </NeomorphicCard>

          <NeomorphicCard className="space-y-3">
            <div className="w-10 h-10 rounded-xl neo-inset flex items-center justify-center text-[#52785B]">
              <Scale className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-[#26352B]">
              {t('pillar_3_title')}
            </h3>
            <p className="text-xs text-[#69776D] leading-relaxed">
              {t('pillar_3_desc')}
            </p>
          </NeomorphicCard>
        </div>
      </section>

      {/* Transparency Disclaimer Notice */}
      <section className="p-4 rounded-2xl neo-inset bg-[#E9EEE8] flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-[#52785B] flex-shrink-0 mt-0.5" />
        <div className="text-xs text-[#69776D] leading-relaxed">
          <strong className="text-[#26352B] block mb-0.5">
            {t('disclaimer_title')}
          </strong>
          {t('disclaimer_desc')}
        </div>
      </section>
    </div>
  );
};
