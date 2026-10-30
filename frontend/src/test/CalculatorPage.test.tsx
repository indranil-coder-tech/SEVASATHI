import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AppProvider } from '../context/AppContext';
import { CalculatorPage } from '../pages/CalculatorPage';
import * as api from '../services/api';
import type { CalculatorResponse } from '../types';

vi.mock('../services/api', async () => {
  const actual = await vi.importActual('../services/api');
  return {
    ...actual,
    evaluateCalculator: vi.fn(),
  };
});

describe('CalculatorPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockResponse: CalculatorResponse = {
    harvest_quantity: 100,
    break_even_future_price: 2415,
    recommended_strategy_id: 'strategy_b',
    decision_rationale: 'साठवणुकीमुळे निव्वळ अतिरिक्त नफा मिळतो',
    assumptions_summary: ['2 months storage', '7% weight loss', 'Storage cost: ₹45/q/mo'],
    disclaimer: 'Prototype estimate for agricultural decision support.',
    strategy_a_sell_now: {
      strategy_id: 'strategy_a',
      name: 'काढणीनंतर लगेच विक्री',
      tagline: 'लगेच रोख रक्कम',
      immediate_quantity_sold: 100,
      immediate_cash_net: 210000,
      stored_quantity_initial: 0,
      stored_quantity_net_after_loss: 0,
      loss_quantity_quintals: 0,
      storage_cost_total: 0,
      future_gross_revenue: 0,
      future_net_realized: 0,
      total_net_income: 210000,
      net_difference_vs_immediate: 0,
      percentage_gain_vs_immediate: 0,
      is_cash_requirement_met: true,
      verdict: 'सुरक्षित पण कमी नफा',
      pros: ['लगेच रोख रक्कम'],
      risks: ['भाववाढीचा फायदा नाही'],
    },
    strategy_b_store_all: {
      strategy_id: 'strategy_b',
      name: 'चाळीत किंवा शीतगृहात साठवणूक',
      tagline: 'संपूर्ण माल साठवून भविष्यातील भाववाढीचा लाभ',
      immediate_quantity_sold: 0,
      immediate_cash_net: 0,
      stored_quantity_initial: 100,
      stored_quantity_net_after_loss: 93,
      loss_quantity_quintals: 7,
      storage_cost_total: 9000,
      future_gross_revenue: 246450,
      future_net_realized: 232300,
      total_net_income: 232300,
      net_difference_vs_immediate: 22300,
      percentage_gain_vs_immediate: 10.6,
      is_cash_requirement_met: false,
      verdict: 'सर्वाधिक नफा मिळवून देणारा पर्याय',
      pros: ['जास्तीत जास्त निव्वळ नफा'],
      risks: ['वजन घट आणि सडण्याची शक्यता'],
    },
    strategy_c_partial: {
      strategy_id: 'strategy_c',
      name: 'अंशतः विक्री + साठवणूक',
      tagline: 'तातडीच्या गरजांसाठी विक्री व उर्वरित मालाची साठवणूक',
      immediate_quantity_sold: 30,
      immediate_cash_net: 63000,
      stored_quantity_initial: 70,
      stored_quantity_net_after_loss: 65.1,
      loss_quantity_quintals: 4.9,
      storage_cost_total: 6300,
      future_gross_revenue: 172515,
      future_net_realized: 162965,
      total_net_income: 225965,
      net_difference_vs_immediate: 15965,
      percentage_gain_vs_immediate: 7.6,
      is_cash_requirement_met: true,
      verdict: 'संतुलित पर्याय: रोख रक्कम आणि नफा दोन्ही',
      pros: ['रोख गरज पूर्ण होते'],
      risks: ['मध्यम धोका'],
    },
  };

  it('TC-CALC-01 & TC-CALC-02: Renders calculator and displays 3-strategy evaluation results', async () => {
    vi.mocked(api.evaluateCalculator).mockResolvedValue(mockResponse);

    render(
      <AppProvider>
        <CalculatorPage />
      </AppProvider>
    );

    // Initial heading
    expect(screen.getByText(/विक्री किंवा साठवणूक/i)).toBeInTheDocument();

    // Trigger calculation
    const recalcBtn = screen.getByRole('button', { name: /हिशोब|Calculate/i });
    fireEvent.click(recalcBtn);

    // Wait for auto-calculated result to be displayed (matches either Devanagari or Latin digits)
    await waitFor(() => {
      expect(screen.getAllByText(/२,३२,३००|2,32,300/).length).toBeGreaterThan(0);
    });

    expect(screen.getAllByText(/२,१०,०००|2,10,000/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/साठवणुकीमुळे निव्वळ अतिरिक्त नफा मिळतो/).length).toBeGreaterThan(0);
  });

  it('TC-CALC-03: Displays API error banner when evaluation fails', async () => {
    vi.mocked(api.evaluateCalculator).mockRejectedValue(new Error('Calculation service unavailable'));

    render(
      <AppProvider>
        <CalculatorPage />
      </AppProvider>
    );

    const recalcBtn = screen.getByRole('button', { name: /हिशोब|Calculate/i });
    fireEvent.click(recalcBtn);

    await waitFor(() => {
      expect(screen.getByText(/Calculation service unavailable/i)).toBeInTheDocument();
    });
  });
});
