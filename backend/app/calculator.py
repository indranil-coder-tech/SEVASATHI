import math

from app.models import CalculatorRequest, CalculatorResponse, StrategyDetail


def evaluate_sell_or_store(req: CalculatorRequest) -> CalculatorResponse:
    """
    Transparent arithmetic evaluation for agricultural harvest post-harvest decision support.
    Compares:
      Strategy A: Sell 100% Immediately
      Strategy B: Store 100% and Sell Later
      Strategy C: Balanced Partial Sale (meet cash need today, store remaining)
    """
    # Input validation for mathematical boundaries
    if req.harvest_quantity_quintals <= 0:
        raise ValueError("Harvest quantity must be greater than zero.")
    if req.current_price_per_quintal <= 0:
        raise ValueError("Current price per quintal must be greater than zero.")
    if req.expected_future_price_per_quintal <= 0:
        raise ValueError("Expected future price per quintal must be greater than zero.")
    if req.storage_duration_months <= 0:
        raise ValueError("Storage duration in months must be greater than zero.")
    if req.storage_loss_percentage < 0 or req.storage_loss_percentage > 100:
        raise ValueError("Storage loss percentage must be between 0 and 100.")
    if (
        req.current_selling_cost_per_quintal < 0
        or req.future_selling_cost_per_quintal < 0
    ):
        raise ValueError("Selling costs cannot be negative.")
    if req.minimum_cash_required < 0:
        raise ValueError("Minimum cash required cannot be negative.")

    q_total = float(req.harvest_quantity_quintals)
    p_now = float(req.current_price_per_quintal)
    c_sell_now = float(req.current_selling_cost_per_quintal)
    p_future = float(req.expected_future_price_per_quintal)
    m_months = float(req.storage_duration_months)
    c_store_monthly = float(req.storage_cost_per_quintal_month)
    loss_fraction = float(req.storage_loss_percentage) / 100.0
    c_sell_future = float(req.future_selling_cost_per_quintal)
    c_other = float(req.other_additional_costs)
    cash_req = float(req.minimum_cash_required)

    net_per_q_now = max(0.0, p_now - c_sell_now)

    # ----------------------------------------------------
    # STRATEGY A: Immediate 100% Sale
    # ----------------------------------------------------
    strat_a_imm_cash = round(q_total * net_per_q_now, 2)
    strat_a_meets_cash = strat_a_imm_cash >= cash_req

    strat_a = StrategyDetail(
        strategy_id="strategy_a",
        name="Strategy A: Immediate Full Sale",
        tagline="Sell 100% of produce at current mandi prices",
        immediate_quantity_sold=round(q_total, 2),
        immediate_cash_net=strat_a_imm_cash,
        stored_quantity_initial=0.0,
        stored_quantity_net_after_loss=0.0,
        loss_quantity_quintals=0.0,
        storage_cost_total=0.0,
        future_gross_revenue=0.0,
        future_net_realized=0.0,
        total_net_income=strat_a_imm_cash,
        net_difference_vs_immediate=0.0,
        percentage_gain_vs_immediate=0.0,
        is_cash_requirement_met=strat_a_meets_cash,
        verdict="Zero market price risk; captures liquidity instantly with no storage or physiological loss.",
        pros=[
            "Immediate cash realization for urgent household or seasonal input needs",
            "Zero storage charges, labor, or bagging fees",
            "No risk of physiological weight loss, rot, or post-harvest price crashes",
        ],
        risks=[
            "No upside exposure if market supply tightens and prices surge",
            "Vulnerable to harvest-glut price suppression typical during peak arrivals",
        ],
    )

    # ----------------------------------------------------
    # STRATEGY B: Full Storage and Sell Later
    # ----------------------------------------------------
    strat_b_loss_q = round(q_total * loss_fraction, 2)
    strat_b_stored_net = max(0.0, round(q_total - strat_b_loss_q, 2))
    strat_b_store_fees = round(q_total * c_store_monthly * m_months, 2)
    strat_b_future_gross = round(strat_b_stored_net * p_future, 2)
    strat_b_future_costs = round((strat_b_stored_net * c_sell_future) + c_other, 2)
    strat_b_future_net = round(
        strat_b_future_gross - strat_b_store_fees - strat_b_future_costs, 2
    )
    strat_b_total_net = strat_b_future_net
    strat_b_diff = round(strat_b_total_net - strat_a_imm_cash, 2)
    strat_b_pct = (
        round((strat_b_diff / strat_a_imm_cash * 100.0), 2)
        if strat_a_imm_cash > 0
        else 0.0
    )
    strat_b_meets_cash = cash_req <= 0.0

    b_verdict = (
        f"Delivers an estimated net gain of ₹{abs(int(strat_b_diff)):,} ({strat_b_pct:+.1f}%) "
        f"if future mandi prices reach ₹{int(p_future)}/q."
        if strat_b_diff > 0
        else f"Results in an estimated net deficit of ₹{abs(int(strat_b_diff)):,} ({strat_b_pct:.1f}%) "
        f"compared to immediate sale due to storage charges and crop shrinkage."
    )

    strat_b = StrategyDetail(
        strategy_id="strategy_b",
        name="Strategy B: Store 100% and Sell Later",
        tagline="Hold entire harvest in verified storage facility",
        immediate_quantity_sold=0.0,
        immediate_cash_net=0.0,
        stored_quantity_initial=round(q_total, 2),
        stored_quantity_net_after_loss=strat_b_stored_net,
        loss_quantity_quintals=strat_b_loss_q,
        storage_cost_total=strat_b_store_fees,
        future_gross_revenue=strat_b_future_gross,
        future_net_realized=strat_b_future_net,
        total_net_income=strat_b_total_net,
        net_difference_vs_immediate=strat_b_diff,
        percentage_gain_vs_immediate=strat_b_pct,
        is_cash_requirement_met=strat_b_meets_cash,
        verdict=b_verdict,
        pros=[
            f"Captures full price appreciation if market rises to ₹{int(p_future)}/q",
            "Avoids selling at current seasonal supply-peak distress pricing",
        ],
        risks=[
            f"Generates ₹0 immediate cash; fails immediate requirement if you need ₹{int(cash_req):,}",
            f"Incurs {req.storage_loss_percentage}% physical shrinkage ({strat_b_loss_q} q lost)",
            "Downside risk if off-season prices fail to clear break-even threshold",
        ],
    )

    # ----------------------------------------------------
    # STRATEGY C: Balanced Partial Sale
    # ----------------------------------------------------
    if cash_req > 0:
        if net_per_q_now > 0:
            needed_q = math.ceil(cash_req / net_per_q_now)
            strat_c_imm_q = min(q_total, float(needed_q))
        else:
            strat_c_imm_q = q_total
    else:
        # Default balanced split: 30% immediate hedging, 70% storage
        strat_c_imm_q = round(q_total * 0.3, 2)

    strat_c_imm_cash = round(strat_c_imm_q * net_per_q_now, 2)
    strat_c_stored_init = max(0.0, round(q_total - strat_c_imm_q, 2))

    if strat_c_stored_init > 0:
        strat_c_loss_q = round(strat_c_stored_init * loss_fraction, 2)
        strat_c_stored_net = max(0.0, round(strat_c_stored_init - strat_c_loss_q, 2))
        strat_c_store_fees = round(strat_c_stored_init * c_store_monthly * m_months, 2)
        strat_c_future_gross = round(strat_c_stored_net * p_future, 2)
        # Pro-rate additional costs by fraction stored
        strat_c_c_other = round(c_other * (strat_c_stored_init / q_total), 2)
        strat_c_future_costs = round(
            (strat_c_stored_net * c_sell_future) + strat_c_c_other, 2
        )
        strat_c_future_net = round(
            strat_c_future_gross - strat_c_store_fees - strat_c_future_costs, 2
        )
    else:
        strat_c_loss_q = 0.0
        strat_c_stored_net = 0.0
        strat_c_store_fees = 0.0
        strat_c_future_gross = 0.0
        strat_c_future_net = 0.0

    strat_c_total_net = round(strat_c_imm_cash + strat_c_future_net, 2)
    strat_c_diff = round(strat_c_total_net - strat_a_imm_cash, 2)
    strat_c_pct = (
        round((strat_c_diff / strat_a_imm_cash * 100.0), 2)
        if strat_a_imm_cash > 0
        else 0.0
    )
    strat_c_meets_cash = strat_c_imm_cash >= cash_req

    if strat_c_meets_cash:
        c_verdict = (
            f"Generates ₹{int(strat_c_imm_cash):,} immediately to satisfy cash flow needs, while preserving "
            f"{strat_c_stored_init} quintals in storage for ₹{abs(int(strat_c_diff)):,} ({strat_c_pct:+.1f}%) net surplus."
            if strat_c_diff >= 0
            else f"Provides needed ₹{int(strat_c_imm_cash):,} liquidity now, but storage portion underperforms immediate sale."
        )
    else:
        c_verdict = (
            f"Generates ₹{int(strat_c_imm_cash):,} upfront, which falls short of the ₹{int(cash_req):,} requirement. "
            f"Shortfall is ₹{int(cash_req - strat_c_imm_cash):,}."
        )

    strat_c_pros = []
    if strat_c_meets_cash:
        strat_c_pros.append(
            f"Fulfills immediate liquidity requirements (₹{int(strat_c_imm_cash):,} cash in hand today)"
        )
    else:
        strat_c_pros.append(
            f"Unlocks ₹{int(strat_c_imm_cash):,} immediate cash (partial realization)"
        )

    strat_c_pros.append(f"Hedges downside price risk on {strat_c_imm_q} quintals")
    if strat_c_stored_net > 0:
        strat_c_pros.append(
            f"Retains {strat_c_stored_net} quintals exposure to expected off-season price rally"
        )

    strat_c_risks = []
    if not strat_c_meets_cash:
        strat_c_risks.append(
            f"Does NOT satisfy immediate cash requirement of ₹{int(cash_req):,} (deficit: ₹{int(cash_req - strat_c_imm_cash):,})"
        )
    strat_c_risks.append("Lower upside than 100% storage if prices spike significantly")
    if strat_c_loss_q > 0:
        strat_c_risks.append(
            f"Still incurs {strat_c_loss_q} q physiological shrinkage on the stored portion"
        )

    strat_c = StrategyDetail(
        strategy_id="strategy_c",
        name="Strategy C: Balanced Partial Sale",
        tagline="Sell enough now to cover cash needs, store remaining harvest",
        immediate_quantity_sold=strat_c_imm_q,
        immediate_cash_net=strat_c_imm_cash,
        stored_quantity_initial=strat_c_stored_init,
        stored_quantity_net_after_loss=strat_c_stored_net,
        loss_quantity_quintals=strat_c_loss_q,
        storage_cost_total=strat_c_store_fees,
        future_gross_revenue=strat_c_future_gross,
        future_net_realized=strat_c_future_net,
        total_net_income=strat_c_total_net,
        net_difference_vs_immediate=strat_c_diff,
        percentage_gain_vs_immediate=strat_c_pct,
        is_cash_requirement_met=strat_c_meets_cash,
        verdict=c_verdict,
        pros=strat_c_pros,
        risks=strat_c_risks,
    )

    # ----------------------------------------------------
    # BREAK-EVEN CALCULATION
    # ----------------------------------------------------
    # P_be is future price where Strategy B Net == Strategy A Net
    # stored_net * P_be - store_fees - (stored_net * c_sell_future + c_other) = strat_a_imm_cash
    # P_be = (strat_a_imm_cash + store_fees + (stored_net * c_sell_future + c_other)) / stored_net
    if strat_b_stored_net > 0:
        break_even_p = (
            strat_a_imm_cash
            + strat_b_store_fees
            + (strat_b_stored_net * c_sell_future)
            + c_other
        ) / strat_b_stored_net
        break_even_p = round(break_even_p, 1)
    else:
        break_even_p = round(p_now, 1)

    # ----------------------------------------------------
    # RECOMMENDATION & RATIONALE
    # ----------------------------------------------------
    if cash_req > 0:
        if strat_c_meets_cash and strat_c_diff > 0 and strat_c_stored_init > 0:
            recommended_id = "strategy_c"
            rationale = (
                f"Strategy C is recommended. While storing 100% yields a theoretical gain, your immediate "
                f"cash requirement of ₹{int(cash_req):,} would force distress borrowing. Strategy C unlocks "
                f"₹{int(strat_c_imm_cash):,} upfront without sacrificing the upside on the remaining {strat_c_stored_init} quintals."
            )
        elif not strat_c_meets_cash:
            recommended_id = "strategy_a"
            rationale = (
                f"Strategy A is recommended. Your immediate cash requirement of ₹{int(cash_req):,} cannot be satisfied "
                f"by partial storage (Strategy C only generates ₹{int(strat_c_imm_cash):,}). Selling immediately captures "
                f"the maximum possible cash (₹{int(strat_a_imm_cash):,}) today."
            )
        else:
            recommended_id = "strategy_a"
            rationale = (
                f"Strategy A is recommended. The expected future price (₹{int(p_future)}/q) does not adequately clear "
                f"the break-even barrier of ₹{int(break_even_p)}/q once storage fees and {req.storage_loss_percentage}% shrinkage "
                f"are accounted for. Selling immediately secures maximum net cash."
            )
    else:
        if p_future < break_even_p or strat_b_diff <= 0:
            recommended_id = "strategy_a"
            rationale = (
                f"Strategy A is recommended. The anticipated future price (₹{int(p_future)}/q) falls below the "
                f"minimum break-even threshold of ₹{int(break_even_p)}/q. Storing would erode your net return by ₹{abs(int(strat_b_diff)):,}."
            )
        elif strat_b_diff > 0:
            recommended_id = "strategy_b"
            rationale = (
                f"Strategy B is recommended. The expected market price (₹{int(p_future)}/q) comfortably surpasses "
                f"the break-even hurdle of ₹{int(break_even_p)}/q, delivering a projected ₹{abs(int(strat_b_diff)):,} (+{strat_b_pct:.1f}%) "
                f"net income premium over immediate sale."
            )
        else:
            recommended_id = "strategy_a"
            rationale = "Strategy A is recommended because storing produce does not clear break-even costs."

    assumptions = [
        f"Physical shrinkage & weight loss: {req.storage_loss_percentage}% over {m_months} months",
        f"Storage charges: ₹{c_store_monthly}/quintal/month",
        f"Mandi handling & transit costs: ₹{c_sell_now}/q today, ₹{c_sell_future}/q future",
        f"Break-even future price requirement: ₹{break_even_p}/quintal",
    ]

    return CalculatorResponse(
        harvest_quantity=q_total,
        break_even_future_price=break_even_p,
        recommended_strategy_id=recommended_id,
        decision_rationale=rationale,
        assumptions_summary=assumptions,
        disclaimer="Transparent mathematical model for post-harvest decision support. Actual warehouse shrinkage, moisture loss, and realized mandi prices depend on ambient climate and market fluctuations.",
        strategy_a_sell_now=strat_a,
        strategy_b_store_all=strat_b,
        strategy_c_partial=strat_c,
    )
