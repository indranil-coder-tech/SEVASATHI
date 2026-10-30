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
  CheckCircle2,
  Sprout,
  Tractor,
} from 'lucide-react';
import { NeomorphicCard } from '../components/NeomorphicCard';
import { fetchMarketPrices } from '../services/api';
import type { MarketPriceResponse } from '../types';
import { useApp } from '../context/AppContext';
import { MiniSparkline } from '../components/MiniSparkline';
import { AgriImage } from '../components/AgriImage';

interface DashboardProps {
  onNavigate: (tab: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  const [marketData, setMarketData] = useState<MarketPriceResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const { t, userLocation, requestLocation, formatCurrency, translateEntity, formatDate } = useApp();

  const [activeImageIdx, setActiveImageIdx] = useState<number>(0);
  const [isPaused, setIsPaused] = useState<boolean>(false);

  // Automatically cycle through hero images every 4 seconds
  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(() => {
      setActiveImageIdx((prev) => (prev + 1) % 4);
    }, 4000);
    return () => clearInterval(interval);
  }, [isPaused]);

  const heroImages = [
    {
      id: 'green_fields',
      name: 'hero_green_fields',
      title: t('dashboard.img_market_title'),
      caption: t('dashboard.hero_image_caption'),
      alt: t('dashboard.hero_image_alt'),
      icon: TrendingUp,
      tag: 'समृद्ध शिवार',
    },
    {
      id: 'tractor',
      name: 'tractor_harvest_farming',
      title: t('dashboard.img_tractor_title'),
      caption: t('dashboard.img_tractor_desc'),
      alt: t('dashboard.img_tractor_title'),
      icon: Tractor,
      tag: 'आधुनिक मशागत',
    },
    {
      id: 'sprout',
      name: 'crop_seedling_sprout',
      title: t('dashboard.img_sprout_title'),
      caption: t('dashboard.img_sprout_desc'),
      alt: t('dashboard.img_sprout_title'),
      icon: Sprout,
      tag: 'पीक संगोपन',
    },
    {
      id: 'terraced',
      name: 'terraced_orchard_landscape',
      title: t('dashboard.img_storage_title'),
      caption: t('dashboard.img_storage_desc'),
      alt: t('dashboard.img_storage_title'),
      icon: Warehouse,
      tag: 'साठवणूक शिवार',
    },
  ];

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

  const workflowSteps = [
    {
      num: t('dashboard.workflow_step1_num'),
      title: t('dashboard.workflow_step1_title'),
      desc: t('dashboard.workflow_step1_desc'),
      tab: 'market',
      icon: TrendingUp,
    },
    {
      num: t('dashboard.workflow_step2_num'),
      title: t('dashboard.workflow_step2_title'),
      desc: t('dashboard.workflow_step2_desc'),
      tab: 'market',
      icon: BarChart3,
    },
    {
      num: t('dashboard.workflow_step3_num'),
      title: t('dashboard.workflow_step3_title'),
      desc: t('dashboard.workflow_step3_desc'),
      tab: 'storage',
      icon: Warehouse,
    },
    {
      num: t('dashboard.workflow_step4_num'),
      title: t('dashboard.workflow_step4_title'),
      desc: t('dashboard.workflow_step4_desc'),
      tab: 'calculator',
      icon: Calculator,
    },
    {
      num: t('dashboard.workflow_step5_num'),
      title: t('dashboard.workflow_step5_title'),
      desc: t('dashboard.workflow_step5_desc'),
      tab: 'calculator',
      icon: CheckCircle2,
    },
  ];

  return (
    <div className="space-y-10 animate-fade-in">
      {/* Live Location Alert Bar */}
      <div className="p-3 sm:p-4 rounded-2xl neo-card bg-gradient-to-r from-[#E9EEE8] via-[#e2ebe0] to-[#E9EEE8] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs border-l-4 border-[#52785B]">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-full bg-[#52785B]/20 flex items-center justify-center text-[#52785B] flex-shrink-0">
            <MapPin className="w-4 h-4 animate-bounce" />
          </div>
          <div>
            <div className="font-bold text-[#26352B]">
              {t('nav.location_detected')}:{' '}
              <span className="text-[#304C38]">{userLocation.displayName}</span>
            </div>
            <p className="text-[#69776D] text-[11px] mt-0.5">
              {t('nav.location_prompt_banner')}
            </p>
          </div>
        </div>

        <button
          onClick={requestLocation}
          className="neo-btn px-3 py-1.5 rounded-full text-xs font-bold text-[#304C38] flex items-center gap-1.5 flex-shrink-0"
        >
          <Navigation className="w-3.5 h-3.5 text-[#52785B]" />
          <span>{t('nav.location_allow_btn')}</span>
        </button>
      </div>

      {/* Hero Section with Authentic Farmer Photograph */}
      <section className="relative overflow-hidden neo-card p-6 sm:p-8 lg:p-10 bg-gradient-to-br from-[#E9EEE8] via-[#E4ECE3] to-[#E9EEE8]">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left Column: Text & Actions */}
          <div className="lg:col-span-7 space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#52785B]/15 text-[#304C38] text-xs font-semibold border border-[#52785B]/30">
              <Sparkles className="w-3.5 h-3.5 text-[#52785B]" />
              <span>{t('dashboard.hero_pill')}</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-[#26352B] leading-tight">
              {t('dashboard.hero_title_1')}{' '}
              <span className="text-[#52785B] block sm:inline">{t('dashboard.hero_title_2')}</span>
            </h1>

            <p className="text-sm sm:text-base text-[#69776D] leading-relaxed">
              {t('dashboard.hero_description')}
            </p>

            {/* Core Principle Quote */}
            <div className="p-3.5 sm:p-4 rounded-xl neo-inset border-l-4 border-[#52785B] bg-[#E9EEE8]">
              <p className="text-xs sm:text-sm font-semibold text-[#26352B] italic">
                {t('dashboard.hero_quote')}
              </p>
            </div>

            {/* Quick Action CTAs */}
            <div className="pt-2 flex flex-wrap gap-3">
              <button
                onClick={() => onNavigate('storage')}
                className="neo-btn-primary px-5 py-2.5 sm:px-6 sm:py-3 text-xs sm:text-sm font-semibold flex items-center gap-2"
              >
                <Warehouse className="w-4 h-4" />
                <span>{t('dashboard.btn_find_storage')}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={() => onNavigate('market')}
                className="neo-btn px-5 py-2.5 sm:px-6 sm:py-3 text-xs sm:text-sm font-semibold flex items-center gap-2 text-[#26352B]"
              >
                <TrendingUp className="w-4 h-4 text-[#52785B]" />
                <span>{t('dashboard.btn_explore_market')}</span>
              </button>

              <button
                onClick={() => onNavigate('calculator')}
                className="neo-btn px-5 py-2.5 sm:px-6 sm:py-3 text-xs sm:text-sm font-semibold flex items-center gap-2 text-[#26352B]"
              >
                <Calculator className="w-4 h-4 text-[#52785B]" />
                <span>{t('dashboard.btn_calculator')}</span>
              </button>
            </div>
          </div>

          {/* Right Column: Authentic Agricultural Showcase (Auto-changing slideshow) */}
          <div
            className="lg:col-span-5 flex flex-col justify-center space-y-3"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
            onTouchStart={() => setIsPaused(true)}
            onTouchEnd={() => setIsPaused(false)}
          >
            <div className="relative group">
              <AgriImage
                key={heroImages[activeImageIdx].name}
                name={heroImages[activeImageIdx].name}
                alt={heroImages[activeImageIdx].alt}
                caption={heroImages[activeImageIdx].caption}
                priority={true}
                aspectRatio="aspect-[4/3] sm:aspect-[16/10] lg:aspect-[4/3]"
                className="shadow-md neo-card border border-[#d8e2d7] transition-all duration-500"
              />
              <div className="absolute top-3 left-3 px-3 py-1 rounded-full bg-[#304C38]/85 backdrop-blur-md text-white text-[11px] font-semibold flex items-center gap-1.5 shadow-sm">
                <Sparkles className="w-3.5 h-3.5 text-[#A9C3AC]" />
                <span>{heroImages[activeImageIdx].tag}</span>
              </div>
            </div>

            {/* Thumbnail Navigation Selector */}
            <div className="grid grid-cols-4 gap-2">
              {heroImages.map((img, idx) => {
                const IconComponent = img.icon;
                const isActive = activeImageIdx === idx;
                return (
                  <button
                    key={img.id}
                    onClick={() => {
                      setActiveImageIdx(idx);
                    }}
                    className={`p-1.5 sm:p-2 rounded-xl text-left transition-all text-[11px] font-semibold flex flex-col items-center justify-center gap-1 border ${
                      isActive
                        ? 'bg-[#52785B] text-white shadow-sm border-[#52785B]'
                        : 'neo-btn text-[#69776D] hover:text-[#26352B] border-transparent'
                    }`}
                    title={img.title}
                  >
                    <div className="flex items-center gap-1">
                      <IconComponent className="w-3.5 h-3.5 flex-shrink-0" />
                      <span className="hidden sm:inline truncate">{img.tag.split(' ')[0]}</span>
                    </div>
                    {/* Active indicator bar */}
                    <div className="w-full h-0.5 rounded-full bg-black/10 overflow-hidden mt-0.5">
                      <div
                        className={`h-full transition-all duration-300 rounded-full ${
                          isActive ? 'bg-white w-full' : 'w-0'
                        }`}
                      />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Feature A: Farmer-Friendly Quick-Start Workflow */}
      <section className="space-y-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg neo-inset flex items-center justify-center text-[#52785B]">
              <Sparkles className="w-4 h-4" />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-[#26352B]">
              {t('dashboard.workflow_title')}
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-[#69776D] mt-1">
            {t('dashboard.workflow_subtitle')}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
          {workflowSteps.map((step, idx) => {
            const Icon = step.icon;
            return (
              <button
                key={idx}
                onClick={() => onNavigate(step.tab)}
                className="neo-card p-4 text-left transition-all hover:scale-[1.02] active:scale-[0.98] group flex flex-col justify-between h-full bg-[#E9EEE8] border border-transparent hover:border-[#52785B]/40 cursor-pointer"
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="w-7 h-7 rounded-full bg-[#52785B] text-white text-xs font-bold flex items-center justify-center shadow-sm">
                      {step.num}
                    </span>
                    <Icon className="w-4 h-4 text-[#52785B] group-hover:translate-x-0.5 transition-transform" />
                  </div>
                  <h3 className="text-sm font-bold text-[#26352B] leading-snug group-hover:text-[#304C38]">
                    {step.title}
                  </h3>
                  <p className="text-[11px] text-[#69776D] leading-relaxed">
                    {step.desc}
                  </p>
                </div>
                <div className="pt-3 mt-2 border-t border-[#d8e0d6] flex items-center justify-between text-[11px] font-semibold text-[#52785B]">
                  <span>{t('common.next')}</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* Live Market Snapshot & Mini Trend */}
      <section className="space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h2 className="text-xl font-bold text-[#26352B]">
              {t('dashboard.snapshot_title')}
            </h2>
            <p className="text-xs text-[#69776D]">
              {t('dashboard.snapshot_subtitle')}
            </p>
          </div>
          <button
            onClick={() => onNavigate('market')}
            className="text-xs font-semibold text-[#52785B] hover:underline flex items-center gap-1"
          >
            <span>{t('dashboard.full_mandi_analytics')}</span>
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

      {/* Agricultural Life Cycle & Platform Capabilities Gallery */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#52785B]/15 text-[#304C38] text-xs font-semibold mb-1">
              <Sparkles className="w-3.5 h-3.5 text-[#52785B]" />
              <span>{t('dashboard.gallery_title')}</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-[#26352B]">
              {t('dashboard.gallery_title')}
            </h2>
            <p className="text-xs sm:text-sm text-[#69776D] mt-0.5">
              {t('dashboard.gallery_subtitle')}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Crop Care & Quality */}
          <div
            onClick={() => {
              setActiveImageIdx(2);
              onNavigate('calculator');
            }}
            className="neo-card p-3 rounded-2xl flex flex-col justify-between group hover:border-[#52785B]/50 cursor-pointer transition-all hover:scale-[1.01] bg-[#E9EEE8]"
          >
            <div className="space-y-2.5">
              <AgriImage
                name="crop_seedling_sprout"
                alt={t('dashboard.img_sprout_title')}
                aspectRatio="aspect-[16/10]"
                className="rounded-xl shadow-xs border border-[#d8e0d6]"
              />
              <div className="px-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#52785B]">
                    १. {t('common.verified')}
                  </span>
                  <Sprout className="w-3.5 h-3.5 text-[#52785B]" />
                </div>
                <h3 className="text-sm font-bold text-[#26352B] group-hover:text-[#304C38] mt-0.5">
                  {t('dashboard.img_sprout_title')}
                </h3>
                <p className="text-xs text-[#69776D] mt-1 leading-relaxed">
                  {t('dashboard.img_sprout_desc')}
                </p>
              </div>
            </div>
            <div className="pt-3 mt-2 border-t border-[#d8e0d6] px-1 flex items-center justify-between text-xs font-semibold text-[#52785B]">
              <span>{t('dashboard.btn_calculator')}</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Card 2: Field Operations & Harvesting */}
          <div
            onClick={() => {
              setActiveImageIdx(1);
              onNavigate('calculator');
            }}
            className="neo-card p-3 rounded-2xl flex flex-col justify-between group hover:border-[#52785B]/50 cursor-pointer transition-all hover:scale-[1.01] bg-[#E9EEE8]"
          >
            <div className="space-y-2.5">
              <AgriImage
                name="tractor_harvest_farming"
                alt={t('dashboard.img_tractor_title')}
                aspectRatio="aspect-[16/10]"
                className="rounded-xl shadow-xs border border-[#d8e0d6]"
              />
              <div className="px-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#52785B]">
                    २. {t('common.verified')}
                  </span>
                  <Tractor className="w-3.5 h-3.5 text-[#52785B]" />
                </div>
                <h3 className="text-sm font-bold text-[#26352B] group-hover:text-[#304C38] mt-0.5">
                  {t('dashboard.img_tractor_title')}
                </h3>
                <p className="text-xs text-[#69776D] mt-1 leading-relaxed">
                  {t('dashboard.img_tractor_desc')}
                </p>
              </div>
            </div>
            <div className="pt-3 mt-2 border-t border-[#d8e0d6] px-1 flex items-center justify-between text-xs font-semibold text-[#52785B]">
              <span>{t('dashboard.btn_calculator')}</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Card 3: Storage & Infrastructure */}
          <div
            onClick={() => {
              setActiveImageIdx(3);
              onNavigate('storage');
            }}
            className="neo-card p-3 rounded-2xl flex flex-col justify-between group hover:border-[#52785B]/50 cursor-pointer transition-all hover:scale-[1.01] bg-[#E9EEE8]"
          >
            <div className="space-y-2.5">
              <AgriImage
                name="terraced_orchard_landscape"
                alt={t('dashboard.img_storage_title')}
                aspectRatio="aspect-[16/10]"
                className="rounded-xl shadow-xs border border-[#d8e0d6]"
              />
              <div className="px-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#52785B]">
                    ३. {t('common.verified')}
                  </span>
                  <Warehouse className="w-3.5 h-3.5 text-[#52785B]" />
                </div>
                <h3 className="text-sm font-bold text-[#26352B] group-hover:text-[#304C38] mt-0.5">
                  {t('dashboard.img_storage_title')}
                </h3>
                <p className="text-xs text-[#69776D] mt-1 leading-relaxed">
                  {t('dashboard.img_storage_desc')}
                </p>
              </div>
            </div>
            <div className="pt-3 mt-2 border-t border-[#d8e0d6] px-1 flex items-center justify-between text-xs font-semibold text-[#52785B]">
              <span>{t('dashboard.btn_find_storage')}</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Card 4: Profitable Market Sales */}
          <div
            onClick={() => {
              setActiveImageIdx(0);
              onNavigate('market');
            }}
            className="neo-card p-3 rounded-2xl flex flex-col justify-between group hover:border-[#52785B]/50 cursor-pointer transition-all hover:scale-[1.01] bg-[#E9EEE8]"
          >
            <div className="space-y-2.5">
              <AgriImage
                name="hero_green_fields"
                alt={t('dashboard.img_market_title')}
                aspectRatio="aspect-[16/10]"
                className="rounded-xl shadow-xs border border-[#d8e0d6]"
              />
              <div className="px-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#52785B]">
                    ४. {t('common.verified')}
                  </span>
                  <TrendingUp className="w-3.5 h-3.5 text-[#52785B]" />
                </div>
                <h3 className="text-sm font-bold text-[#26352B] group-hover:text-[#304C38] mt-0.5">
                  {t('dashboard.img_market_title')}
                </h3>
                <p className="text-xs text-[#69776D] mt-1 leading-relaxed">
                  {t('dashboard.img_market_desc')}
                </p>
              </div>
            </div>
            <div className="pt-3 mt-2 border-t border-[#d8e0d6] px-1 flex items-center justify-between text-xs font-semibold text-[#52785B]">
              <span>{t('dashboard.btn_explore_market')}</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </div>
      </section>

      {/* How SevaSathi Helps (3 Core Pillars) */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold text-[#26352B]">
          {t('dashboard.pillars_title')}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <NeomorphicCard className="space-y-3">
            <div className="w-10 h-10 rounded-xl neo-inset flex items-center justify-center text-[#52785B]">
              <BarChart3 className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-[#26352B]">
              {t('dashboard.pillar_1_title')}
            </h3>
            <p className="text-xs text-[#69776D] leading-relaxed">
              {t('dashboard.pillar_1_desc')}
            </p>
          </NeomorphicCard>

          <NeomorphicCard className="space-y-3">
            <div className="w-10 h-10 rounded-xl neo-inset flex items-center justify-center text-[#52785B]">
              <MapPin className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-[#26352B]">
              {t('dashboard.pillar_2_title')}
            </h3>
            <p className="text-xs text-[#69776D] leading-relaxed">
              {t('dashboard.pillar_2_desc')}
            </p>
          </NeomorphicCard>

          <NeomorphicCard className="space-y-3">
            <div className="w-10 h-10 rounded-xl neo-inset flex items-center justify-center text-[#52785B]">
              <Scale className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-[#26352B]">
              {t('dashboard.pillar_3_title')}
            </h3>
            <p className="text-xs text-[#69776D] leading-relaxed">
              {t('dashboard.pillar_3_desc')}
            </p>
          </NeomorphicCard>
        </div>
      </section>

      {/* Transparency Disclaimer Notice */}
      <section className="p-4 rounded-2xl neo-inset bg-[#E9EEE8] flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-[#52785B] flex-shrink-0 mt-0.5" />
        <div className="text-xs text-[#69776D] leading-relaxed">
          <strong className="text-[#26352B] block mb-0.5">
            {t('dashboard.disclaimer_title')}
          </strong>
          {t('dashboard.disclaimer_desc')}
        </div>
      </section>
    </div>
  );
};
