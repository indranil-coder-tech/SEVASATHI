import React, { useMemo } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts';
import type { PricePoint } from '../types';
import { useAppContext } from '../context/AppContext';

interface PriceChartProps {
  historicalData: PricePoint[];
  forecastData: PricePoint[];
  timeRange: '7d' | '30d' | '90d';
  onRangeChange: (range: '7d' | '30d' | '90d') => void;
  commodityName: string;
}

interface ChartItem {
  date: string;
  displayDate: string;
  historicalModal: number | null;
  historicalMin: number | null;
  historicalMax: number | null;
  forecastModal: number | null;
  forecastLower: number | null;
  forecastUpper: number | null;
  forecastBand: [number, number] | null;
  isForecast: boolean;
  arrivalTonnes: number | null;
}

export const PriceChart: React.FC<PriceChartProps> = ({
  historicalData,
  forecastData,
  timeRange,
  onRangeChange,
  commodityName,
}) => {
  const { t, formatCurrency } = useAppContext();
  // Format data for Recharts
  const chartData: ChartItem[] = useMemo(() => {
    const list: ChartItem[] = [];

    // Historical points
    historicalData.forEach((pt) => {
      list.push({
        date: pt.date,
        displayDate: pt.date.slice(5), // MM-DD
        historicalModal: pt.modal_price,
        historicalMin: pt.min_price,
        historicalMax: pt.max_price,
        forecastModal: null,
        forecastLower: null,
        forecastUpper: null,
        forecastBand: null,
        isForecast: false,
        arrivalTonnes: pt.arrival_tonnes ?? null,
      });
    });

    // Bridge point: Connect historical line to forecast line seamlessly
    if (historicalData.length > 0 && forecastData.length > 0) {
      const lastHist = historicalData[historicalData.length - 1];
      const lastIndex = list.length - 1;
      if (lastIndex >= 0) {
        list[lastIndex].forecastModal = lastHist.modal_price;
      }
    }

    // Forecast points
    forecastData.forEach((pt) => {
      const lower = pt.lower_bound || pt.modal_price * 0.92;
      const upper = pt.upper_bound || pt.modal_price * 1.08;
      list.push({
        date: pt.date,
        displayDate: pt.date.slice(5) + ' (Est)',
        historicalModal: null,
        historicalMin: null,
        historicalMax: null,
        forecastModal: pt.modal_price,
        forecastLower: lower,
        forecastUpper: upper,
        forecastBand: [lower, upper],
        isForecast: true,
        arrivalTonnes: pt.arrival_tonnes ?? null,
      });
    });

    return list;
  }, [historicalData, forecastData]);

  // Determine min & max Y-axis domains
  const yDomain = useMemo(() => {
    let min = Infinity;
    let max = -Infinity;
    chartData.forEach((d) => {
      if (d.historicalModal !== null) {
        min = Math.min(min, d.historicalModal);
        max = Math.max(max, d.historicalModal);
      }
      if (d.historicalMin !== null) min = Math.min(min, d.historicalMin);
      if (d.historicalMax !== null) max = Math.max(max, d.historicalMax);
      if (d.forecastModal !== null) {
        min = Math.min(min, d.forecastModal);
        max = Math.max(max, d.forecastModal);
      }
      if (d.forecastLower !== null) min = Math.min(min, d.forecastLower);
      if (d.forecastUpper !== null) max = Math.max(max, d.forecastUpper);
    });
    if (min === Infinity) return [1000, 3000];
    const padding = max === min ? Math.max(200, min * 0.15) : Math.max(100, (max - min) * 0.15);
    return [Math.max(0, Math.floor((min - padding) / 100) * 100), Math.ceil((max + padding) / 100) * 100];
  }, [chartData]);

  return (
    <div className="space-y-4">
      {/* Chart Header Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-[#26352B]">
            {t('charts.trajectory_title', { commodity: commodityName })}
          </h3>
          <p className="text-xs text-[#59665C]">
            {t('charts.trajectory_subtitle')}
          </p>
        </div>

        {/* Time Range Selector */}
        <div className="flex items-center gap-1.5 p-1 rounded-full neo-inset bg-[#E9EEE8]">
          {(['7d', '30d', '90d'] as const).map((r) => (
            <button
              key={r}
              onClick={() => onRangeChange(r)}
              className={`px-3 py-1 text-xs font-semibold rounded-full transition-all ${
                timeRange === r
                  ? 'bg-[#52785B] text-[#F6F4EC] shadow-sm'
                  : 'text-[#26352B] hover:text-[#52785B]'
              }`}
            >
              {r === '7d' ? t('charts.range_7d') : r === '30d' ? t('charts.range_30d') : t('charts.range_90d')}
            </button>
          ))}
        </div>
      </div>

      {/* Recharts Container */}
      <div className="w-full h-80 sm:h-96 p-2 rounded-2xl neo-inset bg-[#E9EEE8]">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 20, right: 20, bottom: 20, left: 10 }}>
            <defs>
              <linearGradient id="forecastAreaGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#52785B" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#52785B" stopOpacity={0.03} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke="#d5ded4" vertical={false} />

            <XAxis
              dataKey="displayDate"
              stroke="#59665C"
              fontSize={11}
              tickLine={false}
              interval="preserveStartEnd"
            />

            <YAxis
              domain={yDomain}
              stroke="#59665C"
              fontSize={11}
              tickLine={false}
              tickFormatter={(v) => `₹${v}`}
              width={60}
            />

            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload || !payload.length) return null;
                const d = payload[0].payload as ChartItem;
                return (
                  <div className="p-3 bg-[#E9EEE8] border border-[#cfd8ce] rounded-xl shadow-lg text-xs space-y-1.5 neo-card-sm min-w-44">
                    <div className="flex items-center justify-between border-b border-[#cfd8ce] pb-1 font-semibold text-[#26352B]">
                      <span>{d.date}</span>
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] ${
                          d.isForecast
                            ? 'bg-amber-100 text-amber-800 border border-amber-300'
                            : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        }`}
                      >
                        {d.isForecast ? t('charts.tooltip_baseline_est') : t('charts.tooltip_mandi_obs')}
                      </span>
                    </div>

                    {!d.isForecast ? (
                      <>
                        <div className="flex justify-between">
                          <span className="text-[#59665C]">{t('charts.tooltip_modal')}</span>
                          <span className="font-bold text-[#304C38]">
                            {formatCurrency(d.historicalModal)} / {t('common.quintals')}
                          </span>
                        </div>
                        {d.historicalMin !== null && d.historicalMax !== null && (
                          <div className="flex justify-between text-[#59665C]">
                            <span>{t('charts.tooltip_min_max')}</span>
                            <span>
                              {formatCurrency(d.historicalMin)} – {formatCurrency(d.historicalMax)}
                            </span>
                          </div>
                        )}
                        {d.arrivalTonnes !== null && (
                          <div className="flex justify-between text-[#59665C]">
                            <span>{t('charts.tooltip_arrivals')}</span>
                            <span>{d.arrivalTonnes} {t('common.tonnes')}</span>
                          </div>
                        )}
                      </>
                    ) : (
                      <>
                        <div className="flex justify-between">
                          <span className="text-[#59665C]">{t('charts.tooltip_projected')}</span>
                          <span className="font-bold text-[#52785B]">
                            {formatCurrency(d.forecastModal)} / {t('common.quintals')}
                          </span>
                        </div>
                        <div className="flex justify-between text-[#59665C]">
                          <span>{t('charts.tooltip_band')}</span>
                          <span>
                            {formatCurrency(d.forecastLower)} – {formatCurrency(d.forecastUpper)}
                          </span>
                        </div>
                        <p className="text-[10px] text-amber-700 italic pt-1">
                          {t('charts.extrapolation_disclaimer')}
                        </p>
                      </>
                    )}
                  </div>
                );
              }}
            />

            <Legend
              verticalAlign="top"
              align="right"
              wrapperStyle={{ paddingBottom: '10px', fontSize: '12px' }}
            />

            {/* Confidence Band for forecast */}
            <Area
              type="monotone"
              dataKey="forecastBand"
              stroke="none"
              fill="url(#forecastAreaGrad)"
              name={t('charts.forecast_band')}
            />

            {/* Historical Modal Price Line */}
            <Line
              type="monotone"
              dataKey="historicalModal"
              name={t('charts.historical_modal')}
              stroke="#304C38"
              strokeWidth={2.5}
              dot={{ r: 2, fill: '#304C38' }}
              activeDot={{ r: 5, fill: '#52785B' }}
              connectNulls={false}
            />

            {/* Forecasted Modal Price Line */}
            <Line
              type="monotone"
              dataKey="forecastModal"
              name={t('charts.forecast_modal')}
              stroke="#52785B"
              strokeWidth={2.5}
              strokeDasharray="6 4"
              dot={{ r: 3, fill: '#52785B', stroke: '#ffffff', strokeWidth: 1.5 }}
              connectNulls={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
