---
name: dcf-wacc-valuation-expert
description: "Institutional-grade DCF and WACC valuation expert. Trigger on: 'explain DCF', 'DCF valuation methodology', 'calculate WACC', 'WACC calculation details', 'build DCF model', 'valuation methodology', 'cost of capital', 'intrinsic valuation'. Delivers hedge-fund quality step-by-step guidance, formulas, examples, sensitivities, and best practices. Complements the Elite Multi-Agent Research Collective and vinyl-record-valuation skill."
---

# DCF & WACC Valuation Expert

## Overview

This skill provides precise, institutional-standard explanations and application guidance for Discounted Cash Flow (DCF) valuation and Weighted Average Cost of Capital (WACC) calculation.

When you need the full spec, open `references/dcf_wacc_spec.md`.

## Core Workflow

1. Confirm whether the user wants FCFF (enterprise DCF) vs FCFE (equity DCF).
2. Collect missing inputs before producing numbers (revenue, margins, capex, NWC, tax, net debt, shares, beta, Rf, MRP, target D/E).
3. Deliver the methodology + formulas (KaTeX) + worked example.
4. Run sensitivities (WACC, terminal growth, key drivers).
5. State assumptions, confidence, and next steps.

## DCF Methodology (FCFF)

### What is DCF?
Intrinsic valuation method that estimates the present value of expected future free cash flows discounted at the appropriate risk-adjusted rate (WACC for FCFF models).

### Step-by-Step Process
- Forecast Free Cash Flow to the Firm (FCFF) for an explicit period (typically 5–10 years).
- Calculate terminal value (perpetuity growth or exit multiple).
- Discount FCFF and terminal value to present using WACC.
- Derive Enterprise Value → Equity Value → Per-share value (always show the bridge).

### Key Formulas (KaTeX)

- FCFF: `[ \\text{FCFF}_t = \\text{EBIT}_t \\times (1 - t) + \\text{D\\&A}_t - \\text{Capex}_t - \\Delta\\text{NWC}_t ]`
- Terminal Value (Gordon Growth): `[ \\text{TV}_n = \\frac{\\text{FCFF}_{n+1}}{WACC - g} ]`
- Enterprise Value: `[ \\text{EV} = \\sum_{t=1}^{n} \\frac{\\text{FCFF}_t}{(1 + WACC)^t} + \\frac{\\text{TV}_n}{(1 + WACC)^n} ]`

## WACC Calculation

### Core Formula (KaTeX)
`[ WACC = \\left( \\frac{E}{V} \\times R_e \\right) + \\left( \\frac{D}{V} \\times R_d \\times (1 - T_c) \\right) ]`

### Components (Always Explain)
- Cost of equity: CAPM with country risk when applicable: `[ R_e = R_f + \\beta \\times (R_m - R_f) + CRP ]`
- Cost of debt: pre-tax YTM (or risk-free + spread), then apply tax shield separately.
- Weights: prefer market values; for private companies, use target/industry median capital structure.
- Tax: marginal statutory rate for the relevant jurisdiction (avoid mixing with effective rates).

## Best Practices & Sensitivities

- Run base / bull / bear cases; include sensitivity tables on WACC (±0.5%, ±1.0%), terminal growth, and key operating drivers.
- Flag that terminal value often drives 60–80% of EV.
- Common pitfalls: stale beta, book-value weights, mixing effective vs marginal tax rates, circularity (solve via target weights or iteration).
- Never rely on DCF alone; consider trading comps, precedents, SOTP.

## Quality & Ethics Gate

- State assumptions and confidence level.
- Refuse to present a single “correct” valuation; frame as an intrinsic estimate.
- Do not output a full company valuation without sufficient inputs—ask for them first.
