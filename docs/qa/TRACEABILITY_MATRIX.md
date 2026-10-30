# SevaSathi — Requirements Traceability Matrix (RTM)

| Requirement Description | Source (PROJECT_CONTEXT.md) | Test Case ID(s) | Verification Method | Status |
|---|---|---|---|---|
| **REQ-01: APMC Market Intelligence** (daily prices, rolling avg, projections) | Sec 1.1, Sec 4 | TC-MKT-01, TC-MKT-02 | Backend Pytest + Frontend Vitest/E2E | Covered |
| **REQ-02: Data Provenance & Demo Mode Disclosure** (explicit prototype vs OGD labels) | Sec 1.1, Sec 1.5 | TC-MKT-03, TC-API-07 | Pytest + E2E | Covered |
| **REQ-03: Zero Silent Fallback to Lasalgaon** (unknown query returns unrecognised, not Lasalgaon) | Sec 1.3, Sec 6.A | TC-STR-02, TC-STR-08 | Pytest + Unit | Covered |
| **REQ-04: Nearby Storage Geodesic Discovery** (Haversine proximity sorting, 25/50/100km radius) | Sec 1.2, Sec 6.B | TC-STR-01, TC-API-04 | Pytest Property + UI Tests | Covered |
| **REQ-05: Sangli / Low Density Fallback** (clear nearest-neighbor distance disclosure) | Sec 1.2, P1.4 | TC-STR-03 | Pytest + E2E | Covered |
| **REQ-06: Crop & Storage Compatibility Filtering** (ventilated onion chawls vs cold storage) | Sec 3, Sec 6 | TC-STR-06 | Pytest + E2E | Covered |
| **REQ-07: Sell-or-Store Decision Engine** (Strategy A, B, and C transparent arithmetic) | Sec 1.4, Sec 3 | TC-CAL-01 to TC-CAL-05 | Pytest + Hypothesis + Vitest | Covered |
| **REQ-08: Statewise Storage Aggregate** (36 states/UTs parliamentary capacity) | Sec 1.5, Sec 4 | TC-API-08, TC-MID-01 | Pytest + UI | Covered |
| **REQ-09: Tri-Lingual Localization** (Marathi default, Hindi, English persistent toggle) | Sec 1.6 | TC-I18-01 to TC-I18-03 | Vitest + E2E + i18n grep | Covered |
| **REQ-10: Neomorphic Design & Mobile-First Layout** (touch targets ≥ 44px, no horiz overflow) | Sec 5 | TC-UI-01, TC-PERF-01 | Playwright Mobile Viewport + Lighthouse | Covered |
| **REQ-11: Resilient API Client** (HTML response interception, typed ApiError, offline banner) | P0 Finding | TC-RES-01, TC-RES-02, TC-NAV-01 | Vitest Mock Service Worker + E2E | Covered |
| **REQ-12: Accessibility & WCAG 2.1 AA** (zero serious/critical violations, keyboard navigation) | QA Standard | TC-A11-01, TC-A11-02 | `@axe-core/playwright` | Covered |
