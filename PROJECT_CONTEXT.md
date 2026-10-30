# PROJECT CONTEXT: SEVASATHI (सेवासाथी)
### AI-Powered Agricultural Post-Harvest Decision Support Prototype

> **Tagline:** *"Smarter Selling. Better Decisions. Stronger Farming."*  
> **Core Principle:** *"We don't optimize for the highest predicted price. We help farmers make informed decisions about their expected net income."*

---

## 1. Executive Summary & Vision

**SevaSathi** is a specialized, mobile-responsive decision support web application built for an agricultural decision prototype. It addresses one of the most persistent post-harvest vulnerabilities in Indian agriculture: **the distress selling trap**.

Farmers in India frequently sell their entire harvest immediately after cutting because they either lack immediate cash liquidity or do not know where to access affordable, crop-compatible storage facilities. This simultaneous surge in supply across agricultural markets (APMC mandis) causes severe price crashes, depressing farmer earnings.

SevaSathi solves this by uniting five post-harvest capabilities into a single, intuitive interface:
1. **Verified APMC Market Intelligence**: Historical price records, trading volumes, and short-term baseline projections, with explicit disclosure of simulated prototype data vs. official OGD/AGMARKNET ingestion.
2. **Nearby Storage Finder**: Proximity-sorted, interactive geographic discovery of verified ventilated onion chawls, WDRA warehouses, and cold storages with configurable 25/50/100 km radius filtering.
3. **Decoupled Location Resolution**: Independent text/PIN search using an administrative Indian gazetteer & policy-compliant OpenStreetMap geocoder alongside explicit GPS coordinate lookups—with **zero silent fallbacks to Lasalgaon**.
4. **Sell-or-Store Decision Engine**: Pure, transparent arithmetic evaluating immediate sale vs full holding vs cash-hedged partial sales (Strategy C).
5. **Data Provenance & Statewise Intelligence**: Live integration of the official parliamentary Cold Storage Statewise Aggregate (as of 31-Jan-2026) and the Data Source Register.
6. **Tri-Lingual Localization**: Built-in support for **Marathi (मराठी - Default)**, **Hindi (हिंदी)**, and **English** with persistent header toggle.

---

## 2. Target Audience & Pilot Scope

- **Target Audience**:
  - Smallholder and medium farmers in western and central India.
  - Farmer Producer Organizations (FPOs) and agricultural cooperatives.
  - Agricultural extension officers, rural fintech credit evaluators, and agri students.
  - Hackathon judges assessing real-world feasibility, transparent modeling, and UI craft.

- **Pilot Region & Commodity Focus**:
  - **Geography**: Maharashtra, India — specifically the Nashik, Pune, Ahmednagar / Ahilyanagar, Solapur, Jalgaon, Latur, and Chhatrapati Sambhajinagar belts.
  - **Anchor Commodity**: **Onion (*कांदा*)**, with benchmark APMC mandi **Lasalgaon (लासलगाव)** — the largest wholesale onion market in Asia.
  - **Comparative Commodities**: Soyabean (Latur) and Cotton (Jalgaon) to demonstrate multi-crop extensibility.

---

## 3. The Agricultural Problem & Onion Post-Harvest Dynamics

### The Post-Harvest Reality in Maharashtra
Maharashtra produces **over 40% of India's annual onion supply**. Onion farming operates across three seasonal cycles:
1. **Kharif** (harvested Oct–Nov): High moisture, short shelf-life (~1 month), typically sold immediately.
2. **Late Kharif / Rangada** (harvested Jan–Feb): Moderate shelf-life (~1.5–2 months).
3. **Rabi / Garva** (harvested March–May): Firm outer skin, good dry matter, stored for 3–6 months to bridge monsoon supply shortages.

### Why Storage Decisions Often Fail Without SevaSathi
- **The "Price-Only" Fallacy**: A farmer might hear that onion prices are expected to rise from ₹2,100 to ₹2,500/quintal over two months. However, if physiological weight loss (moisture evaporation and rot) is 8%, storage charges are ₹45/q/month, and handling costs are ₹50/q, the net income from storage can actually be lower than selling on harvest day.
- **Storage Incompatibility & Bulb Sprouting**: Onions contain ~85% water. Conventional refrigerated cold storage without controlled atmosphere causes dew condensation upon unloading, triggering rapid outer skin peeling and black mold (*Aspergillus niger*). Rabi onions require **scientifically engineered bottom-draft naturally ventilated onion chawls** (developed by ICAR-DOGR and subsidized by NHB).
- **The Cash Liquidity Constraint**: Farmers often cannot afford 100% storage because local moneylenders, labor, tractor dues, and next-season input costs demand immediate cash on harvest day.

### The SevaSathi Breakthrough: Strategy C (Balanced Partial Sale)
Instead of forcing a binary "sell all or store all" choice, SevaSathi calculates the exact volume needed to meet the farmer's immediate cash requirement ($Cash_{\text{req}}$) today, preserving the surplus in storage for off-season market appreciation.

---

## 4. Technical Architecture & Technology Stack

SevaSathi is built with a decoupled, high-performance architecture:

```
┌─────────────────────────────────────────────────────────────┐
│                      FRONTEND (Vite)                        │
│  React 19 + TypeScript + Tailwind CSS v4 + Neomorphism UI   │
│  Recharts (Price Trajectories) + React Leaflet (OSM Map)    │
│  NearbyStorage: Decoupled Mode (Text vs GPS) + 25-100km     │
└──────────────────────────────┬──────────────────────────────┘
                               │ HTTP / JSON REST API
┌──────────────────────────────▼──────────────────────────────┐
│                    BACKEND (FastAPI)                        │
│  Python 3.14 + Pandas + NumPy + Pydantic v2 + Uvicorn       │
│  - /api/market/*            : AGMARKNET feeds & WMA forecast│
│  - /api/storage/facilities  : Gazetteer + OSM Geocoder +    │
│                               Haversine Proximity Search    │
│  - /api/storage/state-aggregate : Official 2026 State/UT Cap│
│  - /api/data-sources        : Provenance Register           │
│  - /api/calculator/*        : Transparent Decision Math     │
└──────────────────────────────┬──────────────────────────────┘
                               │ Sourced CSV Datasets
┌──────────────────────────────▼──────────────────────────────┐
│                     DATA REPOSITORIES                       │
│  - cold_storage_statewise_aggregate_asof_2026-01-31.csv     │
│  - data_source_register.csv (RFC 4180 Source Registry)      │
│  - storage_facility_master_template.csv (Master Schema)     │
│  - storage_facilities_maharashtra.csv (NHB/WDRA/MSWC records)│
│  - mandi_prices_maharashtra.csv (Simulated Demo Prototype)  │
│  - import_ogd_prices.py (Live OGD India Ingestion Tool)     │
└─────────────────────────────────────────────────────────────┘
```

### Detailed Tech Stack
- **Frontend**:
  - `React 19` & `Vite`: Ultra-fast build times, zero runtime lag.
  - `TypeScript`: Strict type contracts with `verbatimModuleSyntax`.
  - `Tailwind CSS v4`: Modern CSS engine using `@tailwindcss/vite`.
  - `Recharts`: Composed line and area charts with 80% confidence interval bands.
  - `Leaflet` & `React Leaflet`: Interactive OpenStreetMap viewer with custom SVG pin markers.
  - `Lucide React`: Lightweight, accessible icon system.
- **Backend**:
  - `Python 3.14` & `FastAPI`: High-throughput asynchronous REST API.
  - `Pandas` & `NumPy`: Series processing, rolling statistics, and filtering.
  - `Pydantic v2`: Strict request/response payload validation.
  - `Pytest`: 23 automated unit and integration tests covering all acceptance criteria.

---

## 5. Visual Design System — Premium Neomorphism

The user interface follows a consistent, soft Neomorphic design system created specifically for an earthy, calm, trustworthy agricultural decision system:
- **Canvas / Background**: `#E9EEE8` (Muted soft sage)
- **Raised Neomorphic Cards**: `#E9EEE8` with dual-drop shadows:
  - `box-shadow: 7px 7px 16px rgba(180, 193, 180, 0.65), -7px -7px 16px rgba(255, 255, 255, 0.95); border-radius: 20px;`
- **Inset Controls**: Inputs and active buttons:
  - `box-shadow: inset 3px 3px 6px rgba(175, 188, 175, 0.6), inset -3px -3px 6px rgba(255, 255, 255, 0.95);`
- **Primary Sage Green**: `#52785B`
- **Deep Forest Green**: `#304C38`
- **Muted Cream**: `#F6F4EC`
- **Typography**: Inter and Plus Jakarta Sans.
- **Mobile First**: Clean responsive layout, zero horizontal overflow, touch-friendly tap targets.

---

## 6. Mathematical, Geographic & Search Models

### A. Location Search & Resolution Pipeline
- **Explicit Request Modes**:
  - `mode=text`: Resolves manual text queries (villages, talukas, districts, PIN codes) without sending stale coordinates.
  - `mode=coordinates`: Direct GPS search using verified device coordinates.
  - `mode=demo`: Clearly labeled fallback to Lasalgaon pilot center.
- **Normalized Administrative Gazetteer**:
  - Pre-mapped centroids for Maharashtra districts, talukas, APMC mandi centers, and PIN codes.
  - Strict token matching preventing accidental substring collisions on short names.
  - Multi-lingual alias normalization (English, Marathi देवनागरी, and transliterations).
- **Policy-Compliant Nominatim Resolver**:
  - Rate-limited to at most 1 request per second.
  - Custom User-Agent header (`SevaSathi-AgriPlatform/1.0`).
  - In-memory caching for hits and misses to prevent redundant external queries.
  - Validation ensuring returned results match search tokens rather than broad state boundaries.
- **Zero Silent Fallback**:
  - If a place cannot be recognized, the engine returns `location_resolved=false` with an empty facility list and a clear advisory message. Never substitutes Lasalgaon.

### B. Proximity & Haversine Distance Model
- **Haversine Geodesic Formula**:
  $$a = \sin^2\left(\frac{\Delta \phi}{2}\right) + \cos(\phi_1)\cos(\phi_2)\sin^2\left(\frac{\Delta \lambda}{2}\right)$$
  $$d = 2 R \arcsin(\sqrt{a}) \quad \text{where } R = 6,371 \text{ km}$$
- **Radius Thresholding**: Default 25 km, with visible 25/50/100 km and unlimited choices.
- **Labeling**: Explicitly disclosed as straight-line geodesic distance (`सरळ रेषेतील अंतर`), distinct from road transit mileage.

### C. Market Forecasting Baseline
- **Methodology**: Weighted Moving Average (WMA) combined with Holt-style damped linear velocity over a 14-day rolling window.
- **Dampening Factor**: $\phi = 0.82$ per projection day forward to prevent runaway momentum.
- **Uncertainty Interval**: Expanding 80% prediction interval:
  $$\text{Margin}_t = 1.28 \times \sigma_{\text{daily}} \times \sqrt{t}$$
- **Ethical Safeguard**: All projected prices are explicitly labeled as statistical baseline estimates, never guaranteed financial futures.

### D. Sell-or-Store Arithmetic Evaluation
Given:
- Harvest volume $Q$ (quintals)
- Current mandi price $P_{\text{now}}$ (₹/q) and selling cost $C_{\text{sell}}$ (₹/q)
- Expected future price $P_{\text{future}}$ (₹/q)
- Storage months $M$, monthly storage rate $C_{\text{store}}$ (₹/q/month)
- Expected physiological loss fraction $L$ (shrinkage/rot %)
- Additional fixed transit/inspection cost $C_{\text{other}}$
- Minimum immediate cash required $Cash_{\text{req}}$ (₹)

1. **Strategy A (100% Immediate Sale)**:
   $$\text{Cash Now} = Q \times (P_{\text{now}} - C_{\text{sell}})$$
   $$\text{Total Net Income} = \text{Cash Now}$$

2. **Strategy B (100% Storage & Sell Later)**:
   $$\text{Cash Now} = ₹0$$
   $$\text{Stored Quantity Net} = Q \times (1 - L)$$
   $$\text{Storage Fees} = Q \times C_{\text{store}} \times M$$
   $$\text{Future Costs} = (\text{Stored Quantity Net} \times C_{\text{sell}}) + C_{\text{other}}$$
   $$\text{Total Net Income} = (\text{Stored Quantity Net} \times P_{\text{future}}) - \text{Storage Fees} - \text{Future Costs}$$

3. **Strategy C (Balanced Partial Sale)**:
   $$\text{Net Price Per Quintal Today} = P_{\text{now}} - C_{\text{sell}}$$
   $$\text{Quantity Sold Today} = \min\left(Q, \left\lceil \frac{Cash_{\text{req}}}{\text{Net Price Per Quintal Today}} \right\rceil\right)$$
   $$\text{Remaining For Storage} = Q - \text{Quantity Sold Today}$$

4. **Break-Even Future Price ($P_{\text{BE}}$)**:
   $$P_{\text{BE}} = \frac{\text{Strategy A Net} + \text{Storage Fees} + \text{Future Costs}}{\text{Stored Quantity Net}}$$

---

## 7. Data Provenance, Integrity & Registers

| Data Layer | Source Registry / Authority | Grain & Coverage | Ingestion & Handling Rules |
|---|---|---|---|
| **Storage Facilities** | National Horticulture Board (NHB) Cold Storage Registry, WDRA, MSWC | Facility level (Nashik, Pune, Ahmednagar, Solapur, Jalgaon, Latur, Chhatrapati Sambhajinagar) | Conforms to `storage_facility_master_template.csv`. Unverified fees/capacities kept as `null` (displayed as "Not provided"). Only verified IDs earn "Officially registered" badge. |
| **MIDH Historical Projects Staging** | Maharashtra Agriculture Department MIDH Scheme List (2005-06 to 2022-23) | Project/facility level (183 records; 20 districts; 405,162.84 MT sanctioned capacity; ₹11,550.43 Lakhs disbursed subsidy) | Extracted via `backend/scripts/extract_midh_pdf.py` into `backend/data/midh_cold_chain_projects_staging.csv`. Kept strictly in staging as unverified historical projects (`operational_status: unverified_historical_project`). Duplicate/expansion projects (e.g. Agarwal Cold Storage Sr 31/32, Deccan Cold Storage Sr 55/65, Madhav Agro Sr 155/159) flagged for review. False centroids strictly avoided; missing coordinates left null. |
| **State Cold Storage Aggregate** | Rajya Sabha Official Answer Annexure (Snapshot as of 31-01-2026) | State/UT level (35 published rows; national total 8,831 cold storages; 40.3M MT capacity) | Preserved in `cold_storage_statewise_aggregate_asof_2026-01-31.csv` and served via `/api/storage/state-aggregate`. Used for dashboard context only; never used for nearby search. |
| **Data Source Register** | Government Data Register (`data_source_register.csv`) | Registry metadata across NHB, MIDH, OGD India, WDRA, e-NAM, Sansad | Rendered in About page table. Documents capabilities, limitations, and direct portal links. |
| **Daily Mandi Prices** | OGD India / AGMARKNET API (Catalog: `current-daily-price-various-commodities-various-markets-mandi`) | Daily mandi observations by market, commodity, and variety | Ingested via `backend/scripts/import_ogd_prices.py`. Preserves raw timestamps and URLs. Prototype historical file labeled clearly as `SIMULATED DEMO DATA`. |

---

## 8. Deliverables & Acceptance Criteria Status

- [x] **Project Scaffolding**: React 19 + TypeScript + Vite + Tailwind v4 + Python FastAPI.
- [x] **Visual Design System**: Soft Neomorphism with `#E9EEE8` canvas, `#52785B` sage accents, and dual drop shadows.
- [x] **Feature A — Market Intelligence**: Mandi selector, 7d/30d/90d Recharts chart, baseline forecast with CI band, trend summary, and simulated prototype disclosure.
- [x] **Feature B — Nearby Storage Finder & Staging Registry**:
  - [x] Decoupled manual text vs. GPS coordinate flow (`mode=text|coordinates|demo`).
  - [x] Zero silent Lasalgaon fallback: unrecognized places return `location_resolved=false` with advisory notice.
  - [x] Normalized Indian gazetteer & policy-compliant Nominatim geocoding.
  - [x] Configurable 25/50/100 km radius selector with empty-state expansion action.
  - [x] Leaflet map with safe coordinate filtering and straight-line distance disclosure.
  - [x] Honest data reporting: unverified rates and capacities displayed as "Not provided" rather than guessing.
  - [x] **Dedicated MIDH Historical Staging Sub-tab**: Interactive registry of all 183 government-subsidized projects with district, financial year, and duplicate/expansion filtering.
- [x] **Feature C — Sell-or-Store Calculator**: Strategy A, B, and C comparative cards, break-even future price banner, cash-need satisfaction evaluation.
- [x] **Feature D — State Aggregate, MIDH Staging & Data Source APIs**:
  - [x] `/api/storage/state-aggregate` (National/Statewide distribution).
  - [x] `/api/data-sources` (Provenance register with MIDH entry).
  - [x] `/api/storage/staging/summary` (183 projects, ₹11,550.43 Lakhs subsidy, 405,162.84 MT approved capacity).
  - [x] `/api/storage/staging/midh-projects` (Search, district, financial year, and flag filtering).
- [x] **Automated Tests**: 40 passing Pytest test cases (`40 passed in 15.41s`) covering location search, duplicate handling, missing coordinates, genuine live ingestion, extreme calculator boundary cases, cash shortfall rules, and 100% localization key parity across `mr.json`, `hi.json`, and `en.json`.
- [x] **Authentic Agricultural Photo System**: Real-world licensed photographs from Wikimedia Commons and Flickr Commons (CC BY-SA 4.0, CC BY 2.0, CC BY-SA 3.0) with local WebP and JPG fallbacks and legal attributions in `frontend/public/images/agriculture/ATTRIBUTIONS.md`.
- [x] **Farmer Quick-Start Journey**: Interactive 5-step workflow stepper on Dashboard guiding farmers from market rate lookup to final storage and sale decisions.
- [x] **Crop & Storage Compatibility Guidance**: Scientific visual education section detailing differences between Naturally Ventilated Onion Chawls, Refrigerated Cold Stores, and WDRA Warehouses with ICAR-DOGR and NHB references.
- [x] **Printable Decision Summary Report**: Browser-native print-ready decision report with user input record, 3-strategy comparison table, break-even price, and signature block.
- [x] **Production Build**: Clean Vite compilation (`tsc -b && vite build` completed in 2.54s) with zero TypeScript errors.
- [x] **Documentation**: Updated `README.md` and comprehensive `PROJECT_CONTEXT.md`.

