# SevaSathi — Static Analysis & Code Audit Report

**Date:** 2026-10-30  
**Repository Branch:** `fix/qa-hardening`  
**Tooling:** `oxlint 1.81.0`, `tsc 6.0.2`, `ruff 0.17.3`, `mypy 2.4.1`, `npm audit`, `pip-audit 2.10.1`

---

## 1. Executive Summary

| Category | Status | Notes |
|---|---|---|
| **TypeScript Strict** | Passed (0 errors) | `tsc -b` compiles cleanly |
| **Oxlint** | 12 warnings | React hooks exhaustive deps & state-in-effect |
| **Python Ruff** | 227 issues | Deprecated typing imports, unused vars, f-strings |
| **Python Mypy** | 8 errors | Missing None checks on coordinates (P1.1 root cause!) |
| **npm audit** | 0 vulnerabilities | 0 low/moderate/high/critical |
| **pip-audit** | 0 vulnerabilities | 0 CVEs detected in python venv |
| **Secrets in bundle** | Clean | Grep verified no API keys in frontend dist |
| **TypeScript `any`** | 13 occurrences | Catch blocks and untyped context functions |

---

## 2. Detailed Findings

### SA-01 (Mypy / Runtime): Missing None check on coordinate queries (P1.1)
- **File & Line:** `backend/app/storage.py:589-590`
- **Severity:** High (S1 / P1)
- **Description:** `float(lat)` and `float(lng)` are called directly without validating if `lat` or `lng` is `None` when `mode=coordinates`, causing an unhandled `TypeError` (HTTP 500).
- **Fix:** Add Pydantic query validation / explicit check returning 422 with a descriptive error message.

### SA-02 (Mypy): Optional Pandas DataFrame unchecked methods
- **File & Line:** `backend/app/storage.py:356, 389, 611`
- **Severity:** Medium (S2)
- **Description:** `self.df` can theoretically be None if `_load_data()` fails, yet `.iterrows()` and `.copy()` are called without assertion.
- **Fix:** Guard `self.df is not None` before accessing dataframe operations.

### SA-03 (Oxlint): React Hooks Exhaustive Dependencies
- **File & Line:** `frontend/src/pages/CalculatorPage.tsx:111`, `frontend/src/components/MidhStagingRegistry.tsx:59`, `frontend/src/pages/NearbyStorage.tsx:246, 257`
- **Severity:** Medium (S2 / P1.7)
- **Description:** Missing callback dependencies (`runCalculation`, `loadData`, `executeTextSearch`, `executeGpsSearch`) in `useEffect` dependency arrays, causing potential stale closure or infinite rendering loops.
- **Fix:** Wrap functions in `useCallback` or orchestrate single-flight search functions with AbortController.

### SA-04 (Oxlint): Synchronous `setState` inside `useEffect`
- **File & Line:** `frontend/src/pages/NearbyStorage.tsx:60, 246, 257`, `frontend/src/pages/MarketIntelligence.tsx:225`
- **Severity:** Low (S3)
- **Description:** Setting state synchronously inside effects triggers redundant render passes and cascading updates.
- **Fix:** Derive state during rendering or structure effects to only respond to external state changes.

### SA-05 (Code Audit): Untyped `err: any` and `obj: any` (P1.8)
- **File & Line:** 13 locations in `MidhStagingRegistry.tsx`, `AppContext.tsx`, `CalculatorPage.tsx`, `Dashboard.tsx`, `MarketIntelligence.tsx`, `NearbyStorage.tsx`.
- **Severity:** Medium (S3)
- **Description:** Catch blocks use `err: any` and bypass TypeScript type-safety.
- **Fix:** Introduce `ApiError` class and type-guard utilities (`err instanceof ApiError`, `err instanceof Error`).

### SA-06 (i18n): Hardcoded Marathi Strings Bypassing i18n (P1.6)
- **File & Line:** `NearbyStorage.tsx:258`, `NearbyStorage.tsx:72`, `CalculatorPage.tsx:52-58, 553-594`
- **Severity:** Medium (S2 / P1.6)
- **Description:** Template string `` `GPS स्थान प्राप्त झाले: ${userLocation.displayName}` `` and calculator validation error strings are hardcoded in Marathi and do not change when switching to English or Hindi.
- **Fix:** Move all strings into `locales/en.json`, `locales/hi.json`, `locales/mr.json` and access via `t()`.

### SA-07 (Security / API): Missing Content-Type verification in `api.ts` (P0)
- **File & Line:** `frontend/src/services/api.ts`
- **Severity:** Critical (S0 / P0)
- **Description:** `api.ts` parses `await res.json()` directly without checking `res.headers.get('content-type')`. When the backend is offline or misconfigured, SPA rewrites return `text/html` (200 OK), causing `Unexpected token '<', "<!doctype "` uncaught JSON parse error in all components.
- **Fix:** Centralized API client wrapper with content-type checking, abort controller timeout, retry for GET requests, and typed `ApiError` throwing user-friendly localized messages.

### SA-08 (Ruff): Deprecated `typing` annotations and unused imports
- **File & Line:** Multiple files in `backend/app/`
- **Severity:** Low (S4)
- **Description:** Python 3.11+ modern syntax permits `list[T]`, `dict[K, V]`, `X | None` instead of `typing.List`, `typing.Dict`, `typing.Optional`.
- **Fix:** Run `ruff check --fix` and `ruff format` to modernize codebase.
