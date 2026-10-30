import React, { useState, useEffect } from 'react';
import {
  FileText,
  Search,
  AlertTriangle,
  CheckCircle2,
  Filter,
  Building,
  Calendar,
  Layers,
  Coins,
  MapPinOff,
  Info
} from 'lucide-react';
import { NeomorphicCard } from './NeomorphicCard';
import { fetchMidhStagingProjects } from '../services/api';
import type { MidhProjectRecord, MidhStagingSummary } from '../types';
import { useAppContext } from '../context/AppContext';

export const MidhStagingRegistry: React.FC = () => {
  const { t, translateEntity } = useAppContext();
  const [summary, setSummary] = useState<MidhStagingSummary | null>(null);
  const [projects, setProjects] = useState<MidhProjectRecord[]>([]);
  const [totalFiltered, setTotalFiltered] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('all');
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [flagFilter, setFlagFilter] = useState<string>('all');
  const [displayLimit, setDisplayLimit] = useState<number>(50);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetchMidhStagingProjects({
        district: selectedDistrict !== 'all' ? selectedDistrict : undefined,
        financial_year: selectedYear !== 'all' ? selectedYear : undefined,
        query: searchQuery.trim() || undefined,
        flag_filter: flagFilter !== 'all' ? flagFilter : undefined,
        limit: displayLimit,
        offset: 0,
      });
      setSummary(res.summary);
      setProjects(res.projects);
      setTotalFiltered(res.total_filtered);
    } catch (err: unknown) {
      setError((err instanceof Error ? err.message : String(err)) || 'प्रकल्प डेटा लोड करण्यास त्रुटी आली.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedDistrict, selectedYear, flagFilter, displayLimit]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadData();
  };

  return (
    <div className="space-y-6">
      {/* Header & Context */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[11px] font-semibold border border-blue-200 mb-1.5">
            <FileText className="w-3 h-3 text-blue-600" />
            <span>{t('midh.badge')}</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-[#26352B]">
            {t('midh.title')}
          </h2>
          <p className="text-xs text-[#69776D] mt-0.5">
            {t('midh.subtitle')}
          </p>
        </div>
      </div>

      {/* Critical Historical Data Integrity Disclaimer */}
      <div className="p-4 rounded-xl bg-amber-50 border border-amber-300 text-amber-950 text-xs space-y-2">
        <div className="flex items-center gap-2 font-bold text-amber-900 text-sm">
          <AlertTriangle className="w-4 h-4 text-amber-700 flex-shrink-0" />
          <span>{t('midh.disclaimer_title')}</span>
        </div>
        <p className="leading-relaxed">
          {t('midh.disclaimer_1')}
        </p>
        <p className="leading-relaxed">
          {t('midh.disclaimer_2')}
        </p>
        <p className="leading-relaxed">
          {t('midh.disclaimer_3')}
        </p>
      </div>

      {/* Summary KPI Cards */}
      {summary && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <div className="p-3.5 rounded-xl neo-inset bg-[#E9EEE8] space-y-0.5">
            <div className="flex items-center gap-1.5 text-xs text-[#69776D]">
              <Building className="w-3.5 h-3.5 text-[#52785B]" />
              <span>{t('midh.kpi_total_projects')}</span>
            </div>
            <span className="text-xl sm:text-2xl font-extrabold text-[#26352B]">
              {summary.total_projects}
            </span>
            <span className="text-[10px] text-[#69776D] block">183 {t('common.verified')}</span>
          </div>

          <div className="p-3.5 rounded-xl neo-inset bg-[#E9EEE8] space-y-0.5">
            <div className="flex items-center gap-1.5 text-xs text-[#69776D]">
              <Layers className="w-3.5 h-3.5 text-[#304C38]" />
              <span>{t('midh.kpi_approved_capacity')}</span>
            </div>
            <span className="text-xl sm:text-2xl font-extrabold text-[#304C38]">
              {(summary.total_capacity_mt || 0).toLocaleString('en-IN')}
            </span>
            <span className="text-[10px] text-[#69776D] block">MT ({t('common.tonnes')})</span>
          </div>

          <div className="p-3.5 rounded-xl neo-inset bg-[#E9EEE8] space-y-0.5">
            <div className="flex items-center gap-1.5 text-xs text-[#69776D]">
              <Coins className="w-3.5 h-3.5 text-emerald-700" />
              <span>{t('midh.kpi_disbursed_subsidy')}</span>
            </div>
            <span className="text-xl sm:text-2xl font-extrabold text-emerald-800">
              ₹{((summary.total_subsidy_lakh_inr || 0) / 100).toFixed(2)} Cr
            </span>
            <span className="text-[10px] text-[#69776D] block">₹{(summary.total_subsidy_lakh_inr || 0).toLocaleString('en-IN')} L</span>
          </div>

          <div className="p-3.5 rounded-xl neo-inset bg-[#E9EEE8] space-y-0.5">
            <div className="flex items-center gap-1.5 text-xs text-[#69776D]">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
              <span>{t('midh.kpi_review_flags')}</span>
            </div>
            <span className="text-xl sm:text-2xl font-extrabold text-amber-700">
              {summary.review_flags_count}
            </span>
            <span className="text-[10px] text-[#69776D] block">{t('midh.duplicates_only')}</span>
          </div>
        </div>
      )}

      {/* Filter and Search Controls */}
      <NeomorphicCard className="p-4 space-y-3">
        <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          {/* Query input */}
          <div className="sm:col-span-4 flex items-center neo-inset px-3 py-2 bg-[#E9EEE8] rounded-xl">
            <Search className="w-4 h-4 text-[#69776D] mr-2 flex-shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('midh.search_placeholder')}
              className="w-full bg-transparent text-xs text-[#26352B] outline-none placeholder-[#839187]"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  loadData();
                }}
                className="text-xs text-[#69776D] hover:text-[#26352B] ml-1 px-1"
              >
                ✕
              </button>
            )}
          </div>

          {/* District filter */}
          <div className="sm:col-span-3">
            <select
              value={selectedDistrict}
              onChange={(e) => setSelectedDistrict(e.target.value)}
              className="w-full text-xs neo-inset bg-[#E9EEE8] p-2.5 rounded-xl text-[#26352B] outline-none cursor-pointer"
            >
              <option value="all">{t('midh.all_districts')}</option>
              <option value="Nashik">{translateEntity('Nashik', 'district')} (Nashik)</option>
              <option value="Pune">{translateEntity('Pune', 'district')} (Pune)</option>
              <option value="Ahmednagar">{translateEntity('Ahmednagar', 'district')} (Ahmednagar)</option>
              <option value="Jalgaon">{translateEntity('Jalgaon', 'district')} (Jalgaon)</option>
              <option value="Solapur">{translateEntity('Solapur', 'district')} (Solapur)</option>
              <option value="Latur">{translateEntity('Latur', 'district')} (Latur)</option>
              <option value="Thane">{translateEntity('Thane', 'district')} (Thane)</option>
              <option value="Raigad">{translateEntity('Raigad', 'district')} (Raigad)</option>
              <option value="Dhule">{translateEntity('Dhule', 'district')} (Dhule)</option>
              <option value="Nandurbar">{translateEntity('Nandurbar', 'district')} (Nandurbar)</option>
              <option value="Satara">{translateEntity('Satara', 'district')} (Satara)</option>
              <option value="Sangli">{translateEntity('Sangli', 'district')} (Sangli)</option>
              <option value="Kolhapur">{translateEntity('Kolhapur', 'district')} (Kolhapur)</option>
              <option value="Chhatrapati Sambhajinagar">{translateEntity('Chhatrapati Sambhajinagar', 'district')} (Aurangabad)</option>
              <option value="Jalna">{translateEntity('Jalna', 'district')} (Jalna)</option>
              <option value="Beed">{translateEntity('Beed', 'district')} (Beed)</option>
              <option value="Osmanabad">{translateEntity('Dharashiv', 'district')} (Dharashiv)</option>
              <option value="Amravati">{translateEntity('Amravati', 'district')} (Amravati)</option>
              <option value="Nagpur">{translateEntity('Nagpur', 'district')} (Nagpur)</option>
              <option value="Wardha">{translateEntity('Wardha', 'district')} (Wardha)</option>
            </select>
          </div>

          {/* Financial Year filter */}
          <div className="sm:col-span-2">
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="w-full text-xs neo-inset bg-[#E9EEE8] p-2.5 rounded-xl text-[#26352B] outline-none cursor-pointer"
            >
              <option value="all">{t('midh.all_years')}</option>
              <option value="2006-07">2006-07</option>
              <option value="2007-08">2007-08</option>
              <option value="2008-09">2008-09</option>
              <option value="2009-10">2009-10</option>
              <option value="2010-11">2010-11</option>
              <option value="2011-12">2011-12</option>
              <option value="2012-13">2012-13</option>
              <option value="2013-14">2013-14</option>
              <option value="2014-15">2014-15</option>
              <option value="2015-16">2015-16</option>
              <option value="2016-17">2016-17</option>
              <option value="2017-18">2017-18</option>
              <option value="2018-19">2018-19</option>
              <option value="2019-20">2019-20</option>
              <option value="2020-21">2020-21</option>
              <option value="2021-22">2021-22</option>
              <option value="2022-23">2022-23</option>
            </select>
          </div>

          {/* Status / Flag Filter */}
          <div className="sm:col-span-2">
            <select
              value={flagFilter}
              onChange={(e) => setFlagFilter(e.target.value)}
              className="w-full text-xs neo-inset bg-[#E9EEE8] p-2.5 rounded-xl text-[#26352B] outline-none cursor-pointer"
            >
              <option value="all">{t('midh.all_flags')}</option>
              <option value="duplicate">{t('midh.duplicates_only')}</option>
              <option value="clean">{t('midh.clean_only')}</option>
              <option value="flagged">{t('midh.flagged_only')}</option>
            </select>
          </div>

          {/* Search Trigger */}
          <div className="sm:col-span-1">
            <button
              type="submit"
              className="w-full neo-btn-primary py-2.5 px-2 text-xs font-semibold flex items-center justify-center"
              title={t('common.filter')}
            >
              <Filter className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>

        <div className="flex items-center justify-between text-xs text-[#69776D] pt-1 border-t border-[#d8e0d6]">
          <span>
            {t('midh.results_count', { count: String(totalFiltered), shown: String(projects.length) })}
          </span>
          {displayLimit < totalFiltered && (
            <button
              onClick={() => setDisplayLimit((prev) => prev + 50)}
              className="text-[#52785B] font-semibold hover:underline"
            >
              {t('midh.show_more_50')}
            </button>
          )}
        </div>
      </NeomorphicCard>

      {/* Project Records Listing */}
      {loading ? (
        <div className="text-center py-12 text-[#69776D] text-xs space-y-2">
          <div className="w-6 h-6 border-2 border-[#52785B] border-t-transparent rounded-full animate-spin mx-auto" />
          <p>{t('midh.loading_projects')}</p>
        </div>
      ) : error ? (
        <div className="p-4 bg-red-100 text-red-800 text-xs rounded-xl flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0" />
          <span>{error}</span>
        </div>
      ) : projects.length === 0 ? (
        <div className="text-center py-12 text-[#69776D] text-xs neo-card p-6 rounded-2xl">
          <Info className="w-8 h-8 text-gray-400 mx-auto mb-2" />
          <p className="font-semibold text-sm text-[#26352B]">{t('midh.no_projects_found')}</p>
          <p className="mt-1">{t('midh.no_projects_desc')}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {projects.map((proj) => {
            const isExpansionOrDup = proj.review_flags.toLowerCase().includes('duplicate') ||
              proj.review_flags.toLowerCase().includes('expansion') ||
              proj.review_flags.toLowerCase().includes('same');

            return (
              <div
                key={proj.project_id}
                className="p-4 rounded-xl neo-card bg-[#E9EEE8] border border-[#d8e0d6] hover:border-[#52785B]/40 transition-all space-y-3"
              >
                {/* Header row: Sr No, Name, Badge */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2 py-0.5 rounded bg-gray-200 text-gray-800 text-[11px] font-mono font-bold">
                        #{proj.sr_no}
                      </span>
                      <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-800 text-[11px] font-mono">
                        {proj.project_id}
                      </span>
                      <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-800 text-[10px] font-medium border border-amber-200 flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-amber-600" />
                        {t('midh.year_label', { year: proj.financial_year })}
                      </span>
                      <span className="px-2 py-0.5 rounded bg-gray-100 text-gray-700 text-[10px]">
                        {t('midh.page_label', { page: String(proj.source_page) })}
                      </span>
                    </div>

                    <h3 className="text-sm sm:text-base font-bold text-[#26352B] pt-0.5">
                      {proj.beneficiary_name_raw}
                    </h3>
                  </div>

                  {/* Review flag badge */}
                  <div className="flex-shrink-0">
                    {isExpansionOrDup ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                        <AlertTriangle className="w-3 h-3 text-amber-700" />
                        <span>{proj.review_flags}</span>
                      </span>
                    ) : proj.review_flags === 'Clean' ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-900 border border-emerald-300">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        <span>{t('midh.clean_record')}</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-900 border border-blue-200">
                        <Info className="w-3 h-3 text-blue-600" />
                        <span>{proj.review_flags}</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Address & Taluka Details */}
                <div className="text-xs text-[#69776D] bg-[#F4F7F3] p-2.5 rounded-lg border border-[#e1e6df] space-y-1">
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                    <span>
                      <strong className="text-[#26352B]">{t('midh.district_label')} </strong>
                      {translateEntity(proj.district_normalized, 'district')} ({proj.district_raw})
                    </span>
                    {proj.taluka_normalized && (
                      <span>
                        <strong className="text-[#26352B]">{t('midh.taluka_label')} </strong>
                        {proj.taluka_normalized}
                      </span>
                    )}
                    {proj.pincode && (
                      <span>
                        <strong className="text-[#26352B]">{t('midh.pincode_label')} </strong>
                        {proj.pincode}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-[#556358] leading-relaxed">
                    <strong className="text-[#26352B]">{t('midh.address_label')} </strong>
                    {proj.address_raw}
                  </p>
                </div>

                {/* Capacity & Subsidy metrics */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1 text-xs">
                  <div className="p-2 rounded-lg bg-[#E9EEE8] neo-inset">
                    <span className="text-[10px] text-[#69776D] block">{t('midh.kpi_approved_capacity')}</span>
                    <strong className="text-sm text-[#26352B] font-bold">
                      {proj.capacity_mt.toLocaleString('en-IN')} MT
                    </strong>
                  </div>

                  <div className="p-2 rounded-lg bg-[#E9EEE8] neo-inset">
                    <span className="text-[10px] text-[#69776D] block">{t('midh.kpi_disbursed_subsidy')}</span>
                    <strong className="text-sm text-emerald-800 font-bold">
                      ₹{proj.subsidy_disbursed_lakh_inr.toFixed(2)} L
                    </strong>
                  </div>

                  <div className="col-span-2 sm:col-span-1 p-2 rounded-lg bg-[#E9EEE8] neo-inset flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-[#69776D] block">GPS</span>
                      <span className="text-xs text-gray-500 font-medium flex items-center gap-1">
                        <MapPinOff className="w-3 h-3 text-gray-400" />
                        {t('midh.gps_omitted')}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Notes if expansion/duplicate */}
                {proj.notes && (
                  <p className="text-[10px] text-[#69776D] italic">
                    {t('midh.tip_label')} {proj.notes}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
