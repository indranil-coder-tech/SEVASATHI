# SevaSathi — Master Quality Assurance Test Plan

**Version:** 1.2.0-qa  
**Scope:** SevaSathi Full Stack (React 19 + TypeScript + FastAPI + Pandas)  
**Author:** QA Engineering & Systems Architecture  
**Target Environment:** Local Full Stack + Production (Vercel / Netlify + Cloud Web Service)

---

## 1. Objectives & Approach
This test plan provides comprehensive verification of the SevaSathi platform across functional accuracy, boundary edge cases, geographic integrity, API resilience, multi-lingual localization, accessibility (a11y), responsive design, and production deployment safety.

Testing uses a multi-tier pyramid:
1. **Static Analysis & Linters**: Strict TypeScript, Oxlint (with hooks rules), Ruff, Mypy, dependency vulnerability scanners (`pip-audit`, `npm audit`).
2. **Backend Unit & Property Tests**: Pytest with `httpx`, `pytest-cov`, and `hypothesis` property-based testing. Line coverage target ≥ 90%.
3. **Frontend Unit & Integration Tests**: Vitest + React Testing Library + MSW (Mock Service Worker). Coverage target ≥ 80%.
4. **End-to-End & Cross-Browser Tests**: Playwright covering Chromium, Firefox, WebKit, and mobile viewport emulation (Pixel 7 / iPhone 14, 390x844).
5. **Accessibility & Quality Audits**: `@axe-core/playwright` and Google Lighthouse mobile budgets.

---

## 2. Test Scope & Module Breakdown

| Module ID | Module Name | Scope & Key Verification Points |
|---|---|---|
| **MOD-01** | **API Contract & Validation** | OpenAPI compliance, Pydantic schemas, query param boundary checking, 422 vs 500 error handling, CORS headers. |
| **MOD-02** | **Storage Finder & Proximity** | Text/PIN search, coordinate search, Haversine accuracy, zero silent Lasalgaon fallback, Sangli 0-facility nearest-neighbor recommendation. |
| **MOD-03** | **Market Intelligence** | APMC cascades, 7d/30d/90d ranges, weighted moving average forecast, demo vs live provenance banners, missing pair handling. |
| **MOD-04** | **Sell-or-Store Calculator** | Strategy A (Sell Now), Strategy B (Store All), Strategy C (Hedging). Mathematical boundary checking, cash deficit calculation, shrinkage loss math. |
| **MOD-05** | **MIDH Registry & Provenance** | Pagination (limit/offset), district/year/flag filtering, aggregate validation against 183 parliamentary records. |
| **MOD-06** | **Localization (i18n)** | Marathi (mr), Hindi (hi), and English (en). Dynamic translation persistence, zero hardcoded strings, Devanagari rendering. |
| **MOD-07** | **Navigation & SPA Routing** | Deep link refreshes, 404 handling, browser history navigation, client-side route transitions without 404 from host. |
| **MOD-08** | **UI & Responsive Layout** | Viewports (320px, 360px, 390px, 768px, 1024px, 1440px), touch target ≥ 44px, neomorphic contrast, zero horizontal overflow. |
| **MOD-09** | **Accessibility (a11y)** | WCAG 2.1 AA compliance, axe-core automated scans (0 critical/serious), keyboard navigation, ARIA attributes. |
| **MOD-10** | **Performance & Assets** | Mobile Lighthouse score (Perf ≥ 90, A11y ≥ 95), LCP < 2.5s, CLS < 0.1, code-splitting chunks (vendor-charts, vendor-maps). |
| **MOD-11** | **Security & Policy** | Query input fuzzing, CORS verification with foreign origin rejection, secret hygiene in client bundles, rate limits. |
| **MOD-12** | **Resilience & Fault Tolerance** | Backend offline handling, HTML-response detection (P0 root cause prevention), AbortController timeouts, retry on GET, global offline banner. |

---

## 3. Test Execution Tools & Frameworks
- **Python**: `pytest>=8.0`, `pytest-cov>=7.0`, `hypothesis>=6.170`, `httpx>=0.28`.
- **Frontend Unit**: `vitest`, `@testing-library/react`, `msw`.
- **E2E / A11y**: `@playwright/test`, `@axe-core/playwright`.
- **Performance**: `lighthouse`, `lhci`.

---

## 4. Defect Severity & Priority Classification
- **Severity S0 (Blocker)**: Application crashes or returns unhandled runtime error preventing primary user flow (e.g., P0 JSON parse error).
- **Severity S1 (Critical)**: Backend 500 error on valid/invalid inputs or major functional breakdown.
- **Severity S2 (Major)**: Data inaccuracy, broken filter logic, or localized hardcoded text bypassing language selector.
- **Severity S3 (Moderate)**: Minor UI alignment, redundant render passes, or missing non-critical feedback.
- **Severity S4 (Minor)**: Deprecated code syntax, code cleanup, or documentation drift.

- **Priority P0**: Immediate blocker fix before any testing can proceed.
- **Priority P1**: Essential functional correction to be completed in current sprint.
- **Priority P2**: Deployment hygiene, configuration cleanup, and documentation synchronization.
- **Priority P3**: Nice-to-have optimizations.

---

## 5. Exit Criteria
1. 100% of defined test cases executed.
2. 0 failing test cases; 0 open S0, S1, or S2 defects.
3. Backend line coverage ≥ 90%; Frontend coverage ≥ 80%.
4. Zero unhandled HTML-as-JSON errors across all pages under simulated network/server failure.
5. Lighthouse Mobile: Performance ≥ 90, Accessibility ≥ 95, Best Practices ≥ 95, SEO ≥ 90.
