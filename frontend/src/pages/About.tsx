import React, { useState, useEffect } from 'react';
import {
  Sprout,
  Database,
  Award,
  Lightbulb,
  Cpu,
  ExternalLink,
  BarChart,
  AlertCircle,
} from 'lucide-react';
import { NeomorphicCard } from '../components/NeomorphicCard';
import { fetchDataSources, fetchStatewiseAggregates } from '../services/api';
import type { DataSourceRecord, StateAggregateResponse } from '../types';
import { useAppContext } from '../context/AppContext';
import { formatNumber } from '../utils/formatters';
import { AgriImage } from '../components/AgriImage';

export const About: React.FC = () => {
  const { t, language } = useAppContext();
  const [dataSources, setDataSources] = useState<DataSourceRecord[]>([]);
  const [stateAggregates, setStateAggregates] = useState<StateAggregateResponse | null>(null);
  const [loadingSources, setLoadingSources] = useState<boolean>(true);

  useEffect(() => {
    async function loadProvenance() {
      try {
        setLoadingSources(true);
        const [sources, agg] = await Promise.all([
          fetchDataSources().catch(() => []),
          fetchStatewiseAggregates().catch(() => null),
        ]);
        setDataSources(sources);
        setStateAggregates(agg);
      } finally {
        setLoadingSources(false);
      }
    }
    loadProvenance();
  }, []);

  return (
    <div className="space-y-10 animate-fade-in max-w-4xl mx-auto">
      {/* Page Title */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#52785B]/15 text-[#304C38] text-xs font-semibold border border-[#52785B]/30">
          <Sprout className="w-4 h-4 text-[#52785B]" />
          <span>{t('about.hackathon_badge')}</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-[#26352B]">
          {t('about.page_title')}
        </h1>
        <p className="text-base text-[#69776D] font-medium max-w-2xl mx-auto">
          {t('about.page_tagline')}
        </p>
      </div>

      {/* Core Principle Callout */}
      <NeomorphicCard className="p-6 sm:p-8 border-l-4 border-[#52785B] bg-gradient-to-br from-[#E9EEE8] via-[#e2ebe0] to-[#E9EEE8]">
        <div className="space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-[#52785B]">
            {t('about.philosophy_title')}
          </span>
          <blockquote className="text-lg sm:text-xl font-bold text-[#26352B] italic leading-snug">
            {t('about.philosophy_quote')}
          </blockquote>
          <p className="text-xs sm:text-sm text-[#69776D] leading-relaxed pt-2">
            {t('about.philosophy_desc')}
          </p>
        </div>
      </NeomorphicCard>

      {/* The Onion Post-Harvest Dilemma in Maharashtra */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Lightbulb className="w-5 h-5 text-[#52785B]" />
          <h2 className="text-xl font-bold text-[#26352B]">
            {t('about.dilemma_title')}
          </h2>
        </div>

        <NeomorphicCard className="space-y-4 text-xs sm:text-sm text-[#69776D] leading-relaxed">
          <p>
            {t('about.dilemma_intro')}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-1">
            <AgriImage
              name="rural_maharashtra_harvest"
              alt="Harvesting operations in rural Maharashtra"
              caption="Peak harvest season in rural Maharashtra often creates market gluts and liquidity stress"
              aspectRatio="aspect-[16/10]"
              className="shadow-sm border border-[#d8e0d6]"
            />
            <AgriImage
              name="tractor_harvest_farming"
              alt="Modern mechanization and field operations in rural Maharashtra"
              caption="Modern mechanized farming and strategic post-harvest planning minimize distress sales"
              aspectRatio="aspect-[16/10]"
              className="shadow-sm border border-[#d8e0d6]"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
            <div className="p-3.5 rounded-xl neo-inset bg-[#E9EEE8] space-y-1.5">
              <span className="font-bold text-[#26352B] block text-xs">
                {t('about.dilemma_1_title')}
              </span>
              <p className="text-xs">
                {t('about.dilemma_1_desc')}
              </p>
            </div>

            <div className="p-3.5 rounded-xl neo-inset bg-[#E9EEE8] space-y-1.5">
              <span className="font-bold text-[#26352B] block text-xs">
                {t('about.dilemma_2_title')}
              </span>
              <p className="text-xs">
                {t('about.dilemma_2_desc')}
              </p>
            </div>

            <div className="p-3.5 rounded-xl neo-inset bg-[#E9EEE8] space-y-1.5">
              <span className="font-bold text-[#26352B] block text-xs">
                {t('about.dilemma_3_title')}
              </span>
              <p className="text-xs">
                {t('about.dilemma_3_desc')}
              </p>
            </div>

            <div className="p-3.5 rounded-xl neo-inset bg-[#E9EEE8] space-y-1.5">
              <span className="font-bold text-[#26352B] block text-xs">
                {t('about.dilemma_4_title')}
              </span>
              <p className="text-xs">
                {t('about.dilemma_4_desc')}
              </p>
            </div>
          </div>
        </NeomorphicCard>
      </section>

      {/* Official Government Data Sources Register */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Database className="w-5 h-5 text-[#52785B]" />
          <h2 className="text-xl font-bold text-[#26352B]">
            {t('about.sources_title')}
          </h2>
        </div>

        <NeomorphicCard className="space-y-4">
          <p className="text-xs sm:text-sm text-[#69776D] leading-relaxed">
            {t('about.sources_desc')}
          </p>

          {loadingSources ? (
            <div className="p-6 text-center text-xs text-[#69776D]">
              <div className="w-5 h-5 border-2 border-[#52785B] border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
              <span>{t('about.sources_loading')}</span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[#cfd8ce] text-[#26352B]">
                    <th className="pb-2 font-bold">{t('about.col_source_name')}</th>
                    <th className="pb-2 font-bold">{t('about.col_category')}</th>
                    <th className="pb-2 font-bold">{t('about.col_role')}</th>
                    <th className="pb-2 font-bold">{t('about.col_limitations')}</th>
                    <th className="pb-2 font-bold text-right">{t('about.col_url')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e4ece2]">
                  {dataSources.map((ds, idx) => (
                    <tr key={idx} className="hover:bg-[#f0f4ef] transition-colors">
                      <td className="py-2.5 pr-2 font-semibold text-[#26352B]">{ds.source_name}</td>
                      <td className="py-2.5 pr-2 text-[#69776D] whitespace-nowrap">{ds.source_type}</td>
                      <td className="py-2.5 pr-2 text-[#304C38]">{ds.use_in_sevasathi}</td>
                      <td className="py-2.5 pr-2 text-[#69776D] text-[11px] max-w-xs">{ds.limitations}</td>
                      <td className="py-2.5 text-right whitespace-nowrap">
                        <a
                          href={ds.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[#52785B] font-semibold hover:underline"
                        >
                          <span>{t('about.portal_link')}</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </NeomorphicCard>
      </section>

      {/* National Cold Storage Aggregate Overview (31-Jan-2026 Snapshot) */}
      {stateAggregates && (
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <BarChart className="w-5 h-5 text-[#52785B]" />
            <h2 className="text-xl font-bold text-[#26352B]">
              {t('about.benchmark_title')}
            </h2>
          </div>

          <NeomorphicCard className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-3.5 rounded-xl neo-inset bg-[#E9EEE8]">
                <span className="text-xs text-[#69776D] block">{t('about.national_storages')}</span>
                <span className="text-2xl font-extrabold text-[#26352B]">
                  {formatNumber(stateAggregates.national_total_storages, language)}
                </span>
                <span className="text-[10px] text-[#69776D] block mt-0.5">{t('about.national_as_of')}</span>
              </div>

              <div className="p-3.5 rounded-xl neo-inset bg-[#E9EEE8]">
                <span className="text-xs text-[#69776D] block">{t('about.national_capacity')}</span>
                <span className="text-2xl font-extrabold text-[#304C38]">
                  {formatNumber(Number((stateAggregates.national_total_capacity_mt / 1000000).toFixed(1)), language)}M MT
                </span>
                <span className="text-[10px] text-[#69776D] block mt-0.5">{t('about.national_capacity_sub')}</span>
              </div>

              <div className="p-3.5 rounded-xl neo-inset bg-[#E9EEE8]">
                <span className="text-xs text-[#69776D] block">{t('about.mh_storages')}</span>
                <span className="text-2xl font-extrabold text-[#52785B]">{formatNumber(672, language)}</span>
                <span className="text-[10px] text-[#69776D] block mt-0.5">{t('about.mh_capacity_reported')}</span>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-amber-700 flex-shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <span className="font-bold block">{t('about.aggregate_disclaimer_title')}</span>
                <p>{stateAggregates.data_quality_disclaimer}</p>
              </div>
            </div>
          </NeomorphicCard>
        </section>
      )}

      {/* Technology Stack & Architecture */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Cpu className="w-5 h-5 text-[#52785B]" />
          <h2 className="text-xl font-bold text-[#26352B]">
            {t('about.tech_stack_title')}
          </h2>
        </div>

        <NeomorphicCard className="space-y-3 text-xs sm:text-sm text-[#69776D]">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <strong className="text-[#26352B] block">{t('about.frontend_arch_title')}</strong>
              <ul className="list-disc list-inside space-y-1 text-xs pt-1">
                <li>React 19 + TypeScript + Vite</li>
                <li>Tailwind CSS v4 with custom Neomorphism theme</li>
                <li>Recharts for price trajectory & confidence band visualization</li>
                <li>React Leaflet & Leaflet for interactive storage mapping</li>
                <li>Multi-lingual support: Marathi (मराठी), Hindi (हिंदी), English</li>
              </ul>
            </div>

            <div>
              <strong className="text-[#26352B] block">{t('about.backend_arch_title')}</strong>
              <ul className="list-disc list-inside space-y-1 text-xs pt-1">
                <li>Python 3.14 + FastAPI + Pydantic v2 validation</li>
                <li>Pandas & NumPy for price slicing & aggregation</li>
                <li>Admin Place Gazetteer & policy-compliant OpenStreetMap geocoding</li>
                <li>Haversine geodesic straight-line distance engine with radius filtering</li>
                <li>32 automated Pytest test cases covering arithmetic & location acceptance criteria</li>
              </ul>
            </div>
          </div>
        </NeomorphicCard>
      </section>

      {/* Hackathon Prototype Commitment */}
      <NeomorphicCard className="p-6 bg-[#E9EEE8] border border-[#d8e0d6] space-y-3">
        <div className="flex items-center gap-2 text-sm font-bold text-[#304C38]">
          <Award className="w-4 h-4 text-[#52785B]" />
          <span>{t('about.transparency_notice_title')}</span>
        </div>
        <p className="text-xs text-[#69776D] leading-relaxed">
          {t('about.transparency_notice_desc')}
        </p>
      </NeomorphicCard>
    </div>
  );
};

