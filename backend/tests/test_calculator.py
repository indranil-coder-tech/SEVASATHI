import pytest
from app.models import CalculatorRequest
from app.calculator import evaluate_sell_or_store

def test_calculator_immediate_sale():
    req = CalculatorRequest(
        harvest_quantity_quintals=100.0,
        current_price_per_quintal=2000.0,
        current_selling_cost_per_quintal=50.0,
        expected_future_price_per_quintal=2500.0,
        storage_duration_months=2.0,
        storage_cost_per_quintal_month=45.0,
        storage_loss_percentage=7.0,
        future_selling_cost_per_quintal=50.0,
        other_additional_costs=500.0,
        minimum_cash_required=0.0
    )
    res = evaluate_sell_or_store(req)
    
    # Strategy A: 100 quintals * (2000 - 50) = 195,000
    assert res.strategy_a_sell_now.total_net_income == 195000.0
    assert res.strategy_a_sell_now.immediate_quantity_sold == 100.0
    assert res.strategy_a_sell_now.stored_quantity_initial == 0.0

def test_calculator_break_even_and_loss():
    # If future price is below break-even, Strategy A should be favored or Strategy B should have negative diff
    req = CalculatorRequest(
        harvest_quantity_quintals=100.0,
        current_price_per_quintal=2200.0,
        current_selling_cost_per_quintal=50.0,
        expected_future_price_per_quintal=2100.0,  # Lower than current!
        storage_duration_months=2.0,
        storage_cost_per_quintal_month=50.0,
        storage_loss_percentage=8.0,
        future_selling_cost_per_quintal=50.0,
        other_additional_costs=500.0,
        minimum_cash_required=0.0
    )
    res = evaluate_sell_or_store(req)
    assert res.recommended_strategy_id == "strategy_a"
    assert res.strategy_b_store_all.net_difference_vs_immediate < 0
    assert res.break_even_future_price > 2200.0

def test_calculator_partial_sale_cash_requirement():
    # Farmer needs Rs 50,000 immediately
    req = CalculatorRequest(
        harvest_quantity_quintals=100.0,
        current_price_per_quintal=2000.0,
        current_selling_cost_per_quintal=50.0,
        expected_future_price_per_quintal=2700.0,
        storage_duration_months=2.0,
        storage_cost_per_quintal_month=40.0,
        storage_loss_percentage=6.0,
        future_selling_cost_per_quintal=50.0,
        other_additional_costs=500.0,
        minimum_cash_required=50000.0
    )
    res = evaluate_sell_or_store(req)
    # Strategy B provides 0 immediate cash, so it should not meet cash requirement
    assert res.strategy_b_store_all.is_cash_requirement_met is False
    # Strategy C must generate >= 50,000 immediate cash
    assert res.strategy_c_partial.is_cash_requirement_met is True
    assert res.strategy_c_partial.immediate_cash_net >= 50000.0
    assert res.strategy_c_partial.stored_quantity_initial > 0
    assert res.recommended_strategy_id == "strategy_c"
