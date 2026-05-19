# DCF & WACC Valuation Expert — Full Spec

Institutional-grade DCF and WACC valuation expert. Trigger on: "explain DCF", "DCF valuation methodology", "calculate WACC", "WACC calculation details", "build DCF model", "valuation methodology", "cost of capital", "intrinsic valuation". Delivers hedge-fund quality step-by-step guidance, formulas, examples, sensitivities, and best practices. Complements the Elite Multi-Agent Research Collective and vinyl-record-valuation skill.

## Overview

This skill provides precise, institutional-standard explanations and application guidance for Discounted Cash Flow (DCF) valuation and Weighted Average Cost of Capital (WACC) calculation. It is designed for analysts, investors, and report writers who need accurate, evidence-based methodology without simplification errors. All content follows the standards used by top investment banks, private equity firms, and the CFA curriculum.

## Instructions

### 1. DCF Valuation Methodology (Core Process)

Deliver the following structured explanation when triggered:

**What is DCF?**  
Intrinsic valuation method that estimates the present value of expected future free cash flows discounted at the appropriate risk-adjusted rate (WACC for FCFF models).

**Step-by-Step Process:**

1. Forecast Free Cash Flow to the Firm (FCFF) for explicit period (5–10 years).
2. Calculate Terminal Value (perpetuity growth or exit multiple).
3. Discount all cash flows and terminal value to present using WACC.
4. Derive Enterprise Value → Equity Value → Per-share value.

**Key Formulas (use KaTeX in output):**

- FCFF formula: `[ \\text{FCFF}_t = \\text{EBIT}_t \\times (1 - t) + \\text{D\\&A}_t - \\text{Capex}_t - \\Delta\\text{NWC}_t ]`
- Terminal Value (Gordon Growth): `[ \\text{TV}_n = \\frac{\\text{FCFF}_{n+1}}{WACC - g} ]`
- Enterprise Value: `[ \\text{EV} = \\sum_{t=1}^{n} \\frac{\\text{FCFF}_t}{(1 + WACC)^t} + \\frac{\\text{TV}_n}{(1 + WACC)^n} ]`

Equity Value bridge and per-share calculation must always be shown.

### 2. WACC Calculation Details (Core Component)

Core Formula: `[ WACC = \\left( \\frac{E}{V} \\times R_e \\right) + \\left( \\frac{D}{V} \\times R_d \\times (1 - T_c) \\right) ]`

**Component Breakdown (always explain each):**

- Cost of Equity (R_e): Use CAPM `[ R_e = R_f + \\beta \\times (R_m - R_f) + CRP ]`
  - Detail risk-free rate selection, beta unlevering/relevering at target capital structure, market risk premium (4.5–6.0%), and country risk premium when applicable.
- Cost of Debt (R_d): Pre-tax YTM or credit spread + risk-free rate. Tax shield applied separately.
- Weights: Market values preferred. For private companies or targets, use industry median or stated target D/E. Avoid book values.
- Tax Rate: Marginal statutory rate in relevant jurisdiction.
- Worked Example Structure: Always include a clean table with hypothetical 2026 numbers showing full WACC derivation.

### 3. Institutional Best Practices & Sensitivities

- Run base / bull / bear cases + sensitivity tables on WACC (±0.5%, ±1.0%), terminal growth, and revenue CAGR.
- Flag that terminal value often drives 60–80% of EV.
- Common pitfalls: stale beta, book-value weights, mixing effective vs marginal tax rates, circularity (solve via target weights or iteration).
- Complementary methods: Trading comps, precedent transactions, SOTP – never rely on DCF alone.

### 4. Integration & Output Standards

- When user requests DCF or WACC in context of a company, first collect key inputs (revenue projections, margins, capex, net debt, beta, risk-free rate, tax rate) before delivering numbers.
- Always disclose assumptions and confidence level.
- For full reports, hand off to Elite Multi-Agent Research Collective (Institutional Report Writer) for polished memo format.
- Use KaTeX for all equations in final output.
- Provide actionable next steps (e.g., "Run sensitivity on WACC 8.5%–9.5%").

### 5. Quality & Ethics Gate

- Only deliver when all major assumptions are stated.
- Refuse to produce a full company valuation without sufficient data (request inputs instead).
- Never present DCF as the single "correct" value — frame as one important intrinsic estimate alongside market multiples.

## Limitations

Highly sensitive to assumptions (especially WACC and terminal growth). Not suitable for early-stage companies with negative or unpredictable cash flows. Requires high-quality forecasts.

