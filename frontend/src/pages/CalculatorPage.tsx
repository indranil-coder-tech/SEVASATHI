import React, { useState, useEffect } from 'react';
import {
  Scale,
  Info,
} from 'lucide-react';
import { NeomorphicCard } from '../components/NeomorphicCard';
import { evaluateCalculator } from '../services/api';
import type { CalculatorRequest, CalculatorResponse, StrategyDetail } from '../types';
import { useAppContext } from '../context/AppContext';

interface CalculatorPageProps {
  initialValues?: {
    crop?: string;
    mandi?: string;
    currentPrice?: number;
    expectedFuturePrice?: number;
  };
}

export const CalculatorPage: React.FC<CalculatorPageProps> = ({ initialValues }) => {
  const { t, formatCurrency } = useAppContext();
  // Input states with sensible Maharashtra onion defaults
  const [harvestQuantity, setHarvestQuantity] = useState<number>(100);
  const [currentPrice, setCurrentPrice] = useState<number>(initialValues?.currentPrice || 2150);
  const [currentSellingCost, setCurrentSellingCost] = useState<number>(50);
  const [expectedFuturePrice, setExpectedFuturePrice] = useState<number>(
    initialValues?.expectedFuturePrice || 2650
  );
  const [storageMonths, setStorageMonths] = useState<number>(2);
  const [storageMonthlyCost, setStorageMonthlyCost] = useState<number>(45);
  const [storageLossPct, setStorageLossPct] = useState<number>(7);
  const [futureSellingCost, setFutureSellingCost] = useState<number>(50);
  const [otherCosts, setOtherCosts] = useState<number>(500);
  const [cashRequired, setCashRequired] = useState<number>(50000);

  const [result, setResult] = useState<CalculatorResponse | null>(null);
  const [calcError, setCalcError] = useState<string | null>(null);
  const [isCalculating, setIsCalculating] = useState<boolean>(false);
  const requestIdRef = React.useRef<number>(0);

  // Sync if initial values change
  useEffect(() => {
    if (initialValues?.currentPrice) setCurrentPrice(initialValues.currentPrice);
    if (initialValues?.expectedFuturePrice) setExpectedFuturePrice(initialValues.expectedFuturePrice);
  }, [initialValues]);

  // Validate inputs locally before sending to backend
  const validateInputs = (): string | null => {
    if (!harvestQuantity || harvestQuantity <= 0) return 'कृपया पिकाचे एकूण वजन (क्विंटल) योग्य टाका (Harvest quantity must be > 0).';
    if (!currentPrice || currentPrice <= 0) return 'कृपया आजचा चालू बाजारभाव योग्य टाका (Current price must be > 0).';
    if (!expectedFuturePrice || expectedFuturePrice <= 0) return 'कृपया साठवणुकीनंतरचा अपेक्षित भाव योग्य टाका (Expected future price must be > 0).';
    if (!storageMonths || storageMonths <= 0) return 'कृपया साठवणूक कालावधी (महिने) योग्य टाका (Storage duration must be > 0).';
    if (storageLossPct < 0 || storageLossPct > 100) return 'अपेक्षित घट 0% ते 100% दरम्यान असावी (Storage loss must be 0-100%).';
    if (currentSellingCost < 0 || futureSellingCost < 0) return 'विक्री खर्च ऋण (negative) असू शकत नाही (Selling costs cannot be negative).';
    if (cashRequired < 0) return 'तातडीची रोख गरज ऋण असू शकत नाही (Cash requirement cannot be negative).';
    return null;
  };

  // Recalculate with stale response cancellation
  const runCalculation = async () => {
    const validationErr = validateInputs();
    if (validationErr) {
      setCalcError(validationErr);
      return;
    }

    const currentReqId = ++requestIdRef.current;
    setIsCalculating(true);
    setCalcError(null);

    try {
      const payload: CalculatorRequest = {
        harvest_quantity_quintals: Number(harvestQuantity),
        current_price_per_quintal: Number(currentPrice),
        current_selling_cost_per_quintal: Number(currentSellingCost),
        expected_future_price_per_quintal: Number(expectedFuturePrice),
        storage_duration_months: Number(storageMonths),
        storage_cost_per_quintal_month: Number(storageMonthlyCost),
        storage_loss_percentage: Number(storageLossPct),
        future_selling_cost_per_quintal: Number(futureSellingCost),
        other_additional_costs: Number(otherCosts),
        minimum_cash_required: Number(cashRequired),
      };

      const res = await evaluateCalculator(payload);
      // Discard stale responses if newer inputs were submitted
      if (currentReqId === requestIdRef.current) {
        setResult(res);
      }
    } catch (err: any) {
      if (currentReqId === requestIdRef.current) {
        setCalcError(err.message || 'Calculation failed. Please verify your inputs.');
      }
    } finally {
      if (currentReqId === requestIdRef.current) {
        setIsCalculating(false);
      }
    }
  };

  // Debounced auto-calculation (300ms) with cleanup to prevent rapid redundant calls
  useEffect(() => {
    const timer = setTimeout(() => {
      runCalculation();
    }, 300);

    return () => clearTimeout(timer);
  }, [
    harvestQuantity,
    currentPrice,
    currentSellingCost,
    expectedFuturePrice,
    storageMonths,
    storageMonthlyCost,
    storageLossPct,
    futureSellingCost,
    otherCosts,
    cashRequired,
  ]);

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#26352B]">
          {t('calculator.page_title')}
        </h1>
        <p className="text-xs sm:text-sm text-[#69776D]">
          {t('calculator.page_subtitle')}
        </p>
      </div>

      {calcError && (
        <div className="p-3 bg-red-100 text-red-800 text-xs rounded-xl neo-card">
          {calcError}
        </div>
      )}

      {/* Input Parameters Section */}
      <NeomorphicCard className="space-y-5">
        <div className="flex items-center justify-between border-b border-[#d8e0d6] pb-3">
          <div className="flex items-center gap-2">
            <Scale className="w-5 h-5 text-[#52785B]" />
            <h2 className="text-base font-bold text-[#26352B]">
              {t('calculator.params_title')}
            </h2>
          </div>
          <span className="text-xs text-[#52785B] font-medium hidden sm:inline">
            {t('calculator.interactive_hint')}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
          {/* Input 1: Harvest Quantity */}
          <div className="space-y-1">
            <label className="font-bold text-[#26352B]">
              {t('calculator.total_harvest')}
            </label>
            <div className="neo-inset px-3 py-2 bg-[#E9EEE8] rounded-xl flex items-center justify-between">
              <input
                type="number"
                min="1"
                step="5"
                value={harvestQuantity}
                onChange={(e) => setHarvestQuantity(Math.max(1, Number(e.target.value)))}
                className="w-full bg-transparent font-bold text-sm text-[#26352B] outline-none"
              />
              <span className="text-[#69776D] font-medium ml-2">{t('common.quintals')}</span>
            </div>
            <p className="text-[10px] text-[#69776D]">{t('calculator.total_harvest_sub')}</p>
          </div>

          {/* Input 2: Current Mandi Price */}
          <div className="space-y-1">
            <label className="font-bold text-[#26352B]">
              {t('calculator.current_price')}
            </label>
            <div className="neo-inset px-3 py-2 bg-[#E9EEE8] rounded-xl flex items-center justify-between">
              <input
                type="number"
                min="100"
                step="50"
                value={currentPrice}
                onChange={(e) => setCurrentPrice(Math.max(1, Number(e.target.value)))}
                className="w-full bg-transparent font-bold text-sm text-[#26352B] outline-none"
              />
              <span className="text-[#69776D] font-medium ml-2">₹ / {t('common.quintals')}</span>
            </div>
            <p className="text-[10px] text-[#69776D]">{t('calculator.current_price_sub')}</p>
          </div>

          {/* Input 3: Expected Future Price */}
          <div className="space-y-1">
            <label className="font-bold text-[#26352B]">
              {t('calculator.future_price')}
            </label>
            <div className="neo-inset px-3 py-2 bg-[#E9EEE8] rounded-xl flex items-center justify-between">
              <input
                type="number"
                min="100"
                step="50"
                value={expectedFuturePrice}
                onChange={(e) => setExpectedFuturePrice(Math.max(1, Number(e.target.value)))}
                className="w-full bg-transparent font-bold text-sm text-[#52785B] outline-none"
              />
              <span className="text-[#69776D] font-medium ml-2">₹ / {t('common.quintals')}</span>
            </div>
            <p className="text-[10px] text-[#69776D]">{t('calculator.future_price_sub')}</p>
          </div>

          {/* Input 4: Minimum Cash Requirement */}
          <div className="space-y-1">
            <label className="font-bold text-[#26352B]">
              {t('calculator.urgent_cash')}
            </label>
            <div className="neo-inset px-3 py-2 bg-[#E9EEE8] rounded-xl flex items-center justify-between">
              <input
                type="number"
                min="0"
                step="5000"
                value={cashRequired}
                onChange={(e) => setCashRequired(Math.max(0, Number(e.target.value)))}
                className="w-full bg-transparent font-bold text-sm text-[#26352B] outline-none"
              />
              <span className="text-[#69776D] font-medium ml-2">₹</span>
            </div>
            <p className="text-[10px] text-[#69776D]">{t('calculator.urgent_cash_sub')}</p>
          </div>

          {/* Input 5: Storage Duration */}
          <div className="space-y-1">
            <label className="font-bold text-[#26352B]">
              {t('calculator.storage_duration')}
            </label>
            <div className="neo-inset px-3 py-2 bg-[#E9EEE8] rounded-xl flex items-center justify-between">
              <input
                type="number"
                min="0.5"
                max="6"
                step="0.5"
                value={storageMonths}
                onChange={(e) => setStorageMonths(Math.max(0.1, Number(e.target.value)))}
                className="w-full bg-transparent font-bold text-sm text-[#26352B] outline-none"
              />
              <span className="text-[#69776D] font-medium ml-2">{t('common.months')}</span>
            </div>
            <p className="text-[10px] text-[#69776D]">{t('calculator.storage_duration_sub')}</p>
          </div>

          {/* Input 6: Monthly Storage Fee */}
          <div className="space-y-1">
            <label className="font-bold text-[#26352B]">
              {t('calculator.storage_rate')}
            </label>
            <div className="neo-inset px-3 py-2 bg-[#E9EEE8] rounded-xl flex items-center justify-between">
              <input
                type="number"
                min="0"
                step="5"
                value={storageMonthlyCost}
                onChange={(e) => setStorageMonthlyCost(Math.max(0, Number(e.target.value)))}
                className="w-full bg-transparent font-bold text-sm text-[#26352B] outline-none"
              />
              <span className="text-[#69776D] font-medium ml-2">₹/{t('common.quintals')}/{t('common.month')}</span>
            </div>
            <p className="text-[10px] text-[#69776D]">{t('calculator.storage_rate_sub')}</p>
          </div>

          {/* Input 7: Physiological Loss / Shrinkage % */}
          <div className="space-y-1">
            <label className="font-bold text-[#26352B]">
              {t('calculator.loss_percentage')}
            </label>
            <div className="neo-inset px-3 py-2 bg-[#E9EEE8] rounded-xl flex items-center justify-between">
              <input
                type="number"
                min="0"
                max="30"
                step="1"
                value={storageLossPct}
                onChange={(e) => setStorageLossPct(Math.max(0, Math.min(50, Number(e.target.value))))}
                className="w-full bg-transparent font-bold text-sm text-[#26352B] outline-none"
              />
              <span className="text-[#69776D] font-medium ml-2">%</span>
            </div>
            <p className="text-[10px] text-[#69776D]">{t('calculator.loss_percentage_sub')}</p>
          </div>

          {/* Input 8: Selling & Mandi Costs */}
          <div className="space-y-1">
            <label className="font-bold text-[#26352B]">
              {t('calculator.selling_costs_handling')}
            </label>
            <div className="neo-inset px-3 py-2 bg-[#E9EEE8] rounded-xl flex items-center justify-between">
              <input
                type="number"
                min="0"
                step="5"
                value={currentSellingCost}
                onChange={(e) => {
                  const val = Math.max(0, Number(e.target.value));
                  setCurrentSellingCost(val);
                  setFutureSellingCost(val);
                }}
                className="w-full bg-transparent font-bold text-sm text-[#26352B] outline-none"
              />
              <span className="text-[#69776D] font-medium ml-2">₹ / {t('common.quintals')}</span>
            </div>
            <p className="text-[10px] text-[#69776D]">{t('calculator.selling_costs_sub')}</p>
          </div>

          {/* Input 9: Other Fixed Transit Costs */}
          <div className="space-y-1">
            <label className="font-bold text-[#26352B]">
              {t('calculator.other_fixed_costs')}
            </label>
            <div className="neo-inset px-3 py-2 bg-[#E9EEE8] rounded-xl flex items-center justify-between">
              <input
                type="number"
                min="0"
                step="100"
                value={otherCosts}
                onChange={(e) => setOtherCosts(Math.max(0, Number(e.target.value)))}
                className="w-full bg-transparent font-bold text-sm text-[#26352B] outline-none"
              />
              <span className="text-[#69776D] font-medium ml-2">₹</span>
            </div>
            <p className="text-[10px] text-[#69776D]">{t('calculator.other_fixed_sub')}</p>
          </div>
        </div>

        {/* Calculate Action & Status Indicator */}
        <div className="flex items-center justify-between pt-3 border-t border-[#d8e0d6]">
          <div className="text-xs text-[#59665C] flex items-center gap-2">
            {isCalculating && (
              <>
                <div className="w-4 h-4 border-2 border-[#52785B] border-t-transparent rounded-full animate-spin" />
                <span>{t('common.calculating') || 'हिशोब करत आहे... (Calculating...)'}</span>
              </>
            )}
          </div>
          <button
            type="button"
            onClick={runCalculation}
            disabled={isCalculating}
            className="neo-btn-primary px-5 py-2 text-xs font-bold flex items-center gap-1.5"
          >
            <span>{t('calculator.recalculate_btn') || 'पुन्हा हिशोब करा (Calculate)'}</span>
          </button>
        </div>
      </NeomorphicCard>

      {/* Results Section */}
      {result && (
        <div className="space-y-6">
          {/* Break-Even Banner */}
          <div className="p-4 sm:p-5 rounded-2xl neo-card bg-gradient-to-r from-[#E9EEE8] via-[#e2ebe0] to-[#E9EEE8] flex flex-col sm:flex-row items-center justify-between gap-4 border-l-4 border-[#52785B]">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-[#69776D]">
                {t('calculator.break_even_title')}
              </span>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="text-2xl sm:text-3xl font-extrabold text-[#304C38]">
                  {formatCurrency(result.break_even_future_price)} / {t('common.quintals')}
                </span>
                <span className="text-xs text-[#69776D]">
                  ({t('calculator.future_price')}: {formatCurrency(expectedFuturePrice)}/{t('common.quintals')})
                </span>
              </div>
              <p className="text-xs text-[#26352B] mt-1">
                {expectedFuturePrice >= result.break_even_future_price ? (
                  <span className="text-emerald-800 font-semibold">
                    ✓ {t('calculator.hurdle_cleared', {
                      diff: String(Math.round(expectedFuturePrice - result.break_even_future_price)),
                    })}
                  </span>
                ) : (
                  <span className="text-amber-800 font-semibold">
                    ⚠ {t('calculator.hurdle_failed')}
                  </span>
                )}
              </p>
            </div>

            <div className="p-3 rounded-xl neo-inset bg-[#E9EEE8] text-xs text-right sm:max-w-xs">
              <span className="text-[10px] text-[#69776D] uppercase block">
                {t('calculator.recommended_title')}
              </span>
              <strong className="text-sm font-bold text-[#52785B] block">
                {result.recommended_strategy_id === 'strategy_c'
                  ? t('calculator.strategy_c_name')
                  : result.recommended_strategy_id === 'strategy_b'
                  ? t('calculator.strategy_b_name')
                  : t('calculator.strategy_a_name')}
              </strong>
            </div>
          </div>

          {/* Strategy Rationale */}
          <div className="p-4 rounded-xl neo-inset bg-[#E9EEE8] text-xs sm:text-sm text-[#26352B] leading-relaxed">
            <strong className="text-[#304C38] block mb-1">
              {t('calculator.analysis_title')}
            </strong>
            {result.decision_rationale}
          </div>

          {/* 3 Strategy Comparison Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Card 1: Strategy A */}
            <StrategyResultCard
              detail={result.strategy_a_sell_now}
              isRecommended={result.recommended_strategy_id === 'strategy_a'}
              cashRequirement={cashRequired}
            />

            {/* Card 2: Strategy B */}
            <StrategyResultCard
              detail={result.strategy_b_store_all}
              isRecommended={result.recommended_strategy_id === 'strategy_b'}
              cashRequirement={cashRequired}
            />

            {/* Card 3: Strategy C */}
            <StrategyResultCard
              detail={result.strategy_c_partial}
              isRecommended={result.recommended_strategy_id === 'strategy_c'}
              cashRequirement={cashRequired}
            />
          </div>

          {/* Assumptions & Formula Summary */}
          <NeomorphicCard className="space-y-3">
            <div className="flex items-center gap-2">
              <Info className="w-4 h-4 text-[#52785B]" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#26352B]">
                {t('calculator.assumptions_title')}
              </h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs text-[#69776D]">
              {result.assumptions_summary.map((assump, idx) => (
                <div key={idx} className="p-2 rounded-lg neo-inset bg-[#E9EEE8]">
                  {assump}
                </div>
              ))}
            </div>
            <p className="text-[11px] text-[#69776D] pt-2 border-t border-[#d8e0d6]">
              {result.disclaimer}
            </p>
          </NeomorphicCard>
        </div>
      )}
    </div>
  );
};

// Sub-component for individual strategy cards
const StrategyResultCard: React.FC<{
  detail: StrategyDetail;
  isRecommended: boolean;
  cashRequirement: number;
}> = ({ detail, isRecommended, cashRequirement }) => {
  const { t, formatCurrency } = useAppContext();

  const strategyName =
    detail.strategy_id === 'strategy_a'
      ? t('calculator.strategy_a_name')
      : detail.strategy_id === 'strategy_b'
      ? t('calculator.strategy_b_name')
      : t('calculator.strategy_c_name');

  const strategyTagline =
    detail.strategy_id === 'strategy_a'
      ? t('calculator.strategy_a_tag')
      : detail.strategy_id === 'strategy_b'
      ? t('calculator.strategy_b_tag')
      : t('calculator.strategy_c_tag');

  return (
    <div
      className={`p-5 rounded-2xl transition-all flex flex-col justify-between ${
        isRecommended
          ? 'neo-card ring-2 ring-[#52785B] bg-gradient-to-b from-[#e3ede1] to-[#E9EEE8]'
          : 'neo-card bg-[#E9EEE8]'
      }`}
    >
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-2 border-b border-[#d8e0d6] pb-3">
          <div>
            <h3 className="text-base font-extrabold text-[#26352B]">
              {strategyName}
            </h3>
            <p className="text-xs text-[#69776D] mt-0.5">{strategyTagline}</p>
          </div>

          {isRecommended && (
            <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-[#52785B] text-white flex-shrink-0">
              {t('calculator.badge_recommended')}
            </span>
          )}
        </div>

        {/* Expected Net Income */}
        <div className="space-y-1">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-[#69776D]">
            {t('calculator.total_net')}
          </span>
          <div className="text-2xl sm:text-3xl font-black text-[#26352B]">
            {formatCurrency(Math.round(detail.total_net_income))}
          </div>
          {detail.strategy_id !== 'strategy_a' && (
            <div className="text-xs font-semibold">
              <span
                className={
                  detail.net_difference_vs_immediate >= 0
                    ? 'text-emerald-700'
                    : 'text-red-700'
                }
              >
                {detail.net_difference_vs_immediate >= 0 ? '+' : ''}
                {formatCurrency(Math.round(detail.net_difference_vs_immediate))} (
                {detail.percentage_gain_vs_immediate >= 0 ? '+' : ''}
                {detail.percentage_gain_vs_immediate}%)
              </span>
              <span className="text-[#69776D] ml-1">{t('calculator.vs_immediate')}</span>
            </div>
          )}
        </div>

        {/* Breakdown items */}
        <div className="space-y-2 pt-2 border-t border-[#d8e0d6] text-xs">
          <div className="flex justify-between">
            <span className="text-[#69776D]">{t('calculator.immediate_cash')}</span>
            <span
              className={`font-bold ${
                detail.is_cash_requirement_met
                  ? 'text-emerald-800'
                  : 'text-amber-800'
              }`}
            >
              {formatCurrency(Math.round(detail.immediate_cash_net))}
              {cashRequirement > 0 && !detail.is_cash_requirement_met && ` (${t('calculator.deficit')})`}
            </span>
          </div>

          <div className="flex justify-between">
            <span className="text-[#69776D]">{t('calculator.produce_stored')}</span>
            <span className="font-semibold text-[#26352B]">
              {detail.stored_quantity_initial} {t('common.quintals')}
              {detail.loss_quantity_quintals > 0 && (
                <span className="text-[#69776D] font-normal">
                  {' '}
                  (-{detail.loss_quantity_quintals} {t('common.quintals')} {t('calculator.loss_qty')})
                </span>
              )}
            </span>
          </div>

          {detail.storage_cost_total > 0 && (
            <div className="flex justify-between">
              <span className="text-[#69776D]">{t('calculator.total_storage_fees')}</span>
              <span className="font-semibold text-[#26352B]">
                {formatCurrency(Math.round(detail.storage_cost_total))}
              </span>
            </div>
          )}

          {detail.future_gross_revenue > 0 && (
            <div className="flex justify-between">
              <span className="text-[#69776D]">{t('calculator.future_net')}</span>
              <span className="font-bold text-[#52785B]">
                {formatCurrency(Math.round(detail.future_net_realized))}
              </span>
            </div>
          )}
        </div>

        {/* Pros & Risks */}
        <div className="pt-2 border-t border-[#d8e0d6] space-y-2 text-[11px]">
          <div className="space-y-1">
            <span className="font-bold text-emerald-900 block">{t('calculator.pros_title')}</span>
            {detail.pros.map((pro, i) => (
              <p key={i} className="text-[#304C38] flex items-start gap-1">
                <span className="text-emerald-600">✓</span> {pro}
              </p>
            ))}
          </div>

          <div className="space-y-1">
            <span className="font-bold text-amber-900 block">{t('calculator.risks_title')}</span>
            {detail.risks.map((risk, i) => (
              <p key={i} className="text-[#69776D] flex items-start gap-1">
                <span className="text-amber-600">⚠</span> {risk}
              </p>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-[#d8e0d6] text-[11px] font-medium text-[#304C38] italic">
        {detail.verdict}
      </div>
    </div>
  );
};
