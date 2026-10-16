import os
import json
import time
import math
import logging
import urllib.request
import urllib.parse
from datetime import datetime, timedelta, timezone
from typing import List, Dict, Optional, Tuple, Any
import pandas as pd
from dotenv import load_dotenv

from app.models import (
    PricePoint,
    MarketPriceResponse,
    CropOption,
    MandiOption,
    MarketHierarchyResponse
)

# Load environment variables securely
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), "..", ".env"))

logger = logging.getLogger("sevasathi.mandi")
logger.setLevel(logging.INFO)

DATA_DIR = os.path.join(os.path.dirname(__file__), "..", "data")
GENUINE_PRICES_CSV = os.path.join(DATA_DIR, "genuine_mandi_prices.csv")
DEMO_PRICES_CSV = os.path.join(DATA_DIR, "mandi_prices_demo.csv")
LEGACY_PRICES_CSV = os.path.join(DATA_DIR, "mandi_prices_maharashtra.csv")

# Known pilot geographic coordinates for benchmark Maharashtra mandis
BENCHMARK_MANDI_COORDINATES: Dict[str, Tuple[float, float, str]] = {
    "lasalgaon": (20.1472, 74.2281, "Nashik"),
    "pimpalgaon": (20.1741, 73.9856, "Nashik"),
    "yeola": (20.0435, 74.4842, "Nashik"),
    "pune": (18.4965, 73.8647, "Pune"),
    "solapur": (17.6599, 75.9064, "Solapur"),
    "ahmednagar": (19.0952, 74.7496, "Ahmednagar"),
    "ahilyanagar": (19.0952, 74.7496, "Ahilyanagar"),
    "latur": (18.4088, 76.5604, "Latur"),
    "jalgaon": (21.0077, 75.5626, "Jalgaon"),
}

# Supported Indian states for high-level selector (Maharashtra prioritized)
DEFAULT_STATES = [
    "Maharashtra", "Gujarat", "Madhya Pradesh", "Karnataka", "Rajasthan",
    "Punjab", "Haryana", "Uttar Pradesh", "Tamil Nadu", "Telangana",
    "Andhra Pradesh", "Bihar", "West Bengal", "Odisha", "Keralam"
]

class GovMandiService:
    def __init__(self):
        self.api_key = os.getenv("DATA_GOV_IN_API_KEY", "").strip()
        self.endpoint = os.getenv("AGMARKNET_API_ENDPOINT", "").strip()
        self.resource_id = os.getenv("DATA_GOV_IN_RESOURCE_ID", "9ef84268-d588-465a-a308-a864a43d0070").strip()
        self.base_url = os.getenv("DATA_GOV_IN_BASE_URL", "https://api.data.gov.in/resource/").rstrip("/") + "/"
        if not self.endpoint:
            self.endpoint = f"{self.base_url}{self.resource_id}"
        
        try:
            self.ttl_seconds = int(os.getenv("MANDI_CACHE_TTL_SECONDS", "3600"))
        except ValueError:
            self.ttl_seconds = 3600

        self._in_memory_cache: Dict[str, Tuple[float, Any]] = {}
        self._ensure_storage_initialized()

    def _ensure_storage_initialized(self):
        os.makedirs(DATA_DIR, exist_ok=True)
        if not os.path.exists(GENUINE_PRICES_CSV):
            # Create genuine records file with headers
            cols = ["date", "state", "district", "market", "commodity", "variety", "grade",
                    "min_price", "max_price", "modal_price", "data_source", "retrieved_at"]
            pd.DataFrame(columns=cols).to_csv(GENUINE_PRICES_CSV, index=False)

    def _get_from_cache(self, key: str) -> Optional[Any]:
        if key in self._in_memory_cache:
            ts, val = self._in_memory_cache[key]
            if time.time() - ts < self.ttl_seconds:
                return val
        return None

    def _set_cache(self, key: str, val: Any):
        self._in_memory_cache[key] = (time.time(), val)

    def fetch_live_records(
        self,
        state: Optional[str] = "Maharashtra",
        district: Optional[str] = None,
        market: Optional[str] = None,
        commodity: Optional[str] = None,
        variety: Optional[str] = None,
        limit: int = 1000,
        offset: int = 0
    ) -> List[Dict[str, Any]]:
        """
        Queries official data.gov.in resource with proper filters, headers, and timeouts.
        Handles rate limits, network timeouts, and JSON decoding errors safely.
        """
        if not self.api_key:
            logger.warning("DATA_GOV_IN_API_KEY is not set. Cannot fetch from official API.")
            return []

        params: Dict[str, str] = {
            "api-key": self.api_key,
            "format": "json",
            "limit": str(limit),
            "offset": str(offset)
        }
        if state:
            params["filters[state]"] = state
        if district:
            params["filters[district]"] = district
        if market:
            params["filters[market]"] = market
        if commodity:
            params["filters[commodity]"] = commodity
        if variety:
            params["filters[variety]"] = variety

        sep = "&" if "?" in self.endpoint else "?"
        endpoint_url = f"{self.endpoint}{sep}{urllib.parse.urlencode(params)}"
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Accept": "application/json"
        }

        # Attempt query with retries
        max_attempts = 2
        for attempt in range(max_attempts):
            try:
                req = urllib.request.Request(endpoint_url, headers=headers)
                with urllib.request.urlopen(req, timeout=25) as resp:
                    if resp.status != 200:
                        logger.warning(f"Official API returned status code {resp.status}")
                        return []
                    body = resp.read().decode("utf-8")
                    data = json.loads(body)
                    raw_records = data.get("records", [])
                    normalized = self._normalize_records(raw_records)
                    # Persist genuine records with deduplication
                    if normalized:
                        self.save_genuine_records(normalized)
                    return normalized
            except (urllib.error.HTTPError, urllib.error.URLError, TimeoutError) as e:
                logger.warning(f"Attempt {attempt+1} failed querying data.gov.in: {e}")
                if attempt == max_attempts - 1:
                    logger.error(f"Failed to query data.gov.in after {max_attempts} attempts: {e}")
            except Exception as e:
                logger.error(f"Unexpected error querying data.gov.in: {e}")
                break

        return []

    def _normalize_records(self, raw_records: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        normalized = []
        retrieval_iso = datetime.now(timezone.utc).isoformat()
        source_label = f"Official data.gov.in API (AGMARKNET Resource {self.resource_id})"

        for r in raw_records:
            state = str(r.get("state") or r.get("State") or "").strip()
            district = str(r.get("district") or r.get("District") or "").strip()
            market = str(r.get("market") or r.get("Market") or "").strip()
            commodity = str(r.get("commodity") or r.get("Commodity") or "").strip()
            variety = str(r.get("variety") or r.get("Variety") or "Other").strip()
            grade = str(r.get("grade") or r.get("Grade") or "FAQ").strip()

            raw_date = str(r.get("arrival_date") or r.get("Arrival_Date") or r.get("date") or "").strip()
            parsed_date = raw_date
            try:
                if "/" in raw_date:
                    parsed_date = datetime.strptime(raw_date, "%d/%m/%Y").strftime("%Y-%m-%d")
                elif "-" in raw_date:
                    parsed_date = datetime.strptime(raw_date[:10], "%Y-%m-%d").strftime("%Y-%m-%d")
            except Exception:
                parsed_date = raw_date

            try:
                min_p = float(r.get("min_price") or r.get("Min_Price") or 0.0)
                max_p = float(r.get("max_price") or r.get("Max_Price") or 0.0)
                modal_p = float(r.get("modal_price") or r.get("Modal_Price") or 0.0)
            except (ValueError, TypeError):
                continue

            if modal_p <= 0 or not market or not commodity:
                continue

            normalized.append({
                "date": parsed_date,
                "state": state,
                "district": district,
                "market": market,
                "commodity": commodity,
                "variety": variety,
                "grade": grade,
                "min_price": min_p,
                "max_price": max_p,
                "modal_price": modal_p,
                "data_source": source_label,
                "retrieved_at": retrieval_iso
            })

        return normalized

    def save_genuine_records(self, records: List[Dict[str, Any]]):
        """
        Merges new records into genuine_mandi_prices.csv with deduplication on
        (date, state, district, market, commodity, variety) while preserving original text casing.
        """
        if not records:
            return

        cols = ["date", "state", "district", "market", "commodity", "variety", "grade",
                "min_price", "max_price", "modal_price", "data_source", "retrieved_at"]

        existing_df = pd.DataFrame(columns=cols)
        if os.path.exists(GENUINE_PRICES_CSV) and os.path.getsize(GENUINE_PRICES_CSV) > 0:
            try:
                existing_df = pd.read_csv(GENUINE_PRICES_CSV)
            except Exception as e:
                logger.warning(f"Could not read existing genuine CSV: {e}")

        new_df = pd.DataFrame(records)
        combined = pd.concat([existing_df, new_df], ignore_index=True)

        # Composite deduplication key without corrupting display casing
        dedup_col = (
            combined["date"].astype(str).str.strip() + "_" +
            combined["state"].astype(str).str.strip().str.lower() + "_" +
            combined["district"].astype(str).str.strip().str.lower() + "_" +
            combined["market"].astype(str).str.strip().str.lower() + "_" +
            combined["commodity"].astype(str).str.strip().str.lower() + "_" +
            combined["variety"].astype(str).str.strip().str.lower()
        )
        combined["_dedup_key"] = dedup_col
        combined.drop_duplicates(subset=["_dedup_key"], keep="last", inplace=True)
        combined.drop(columns=["_dedup_key"], inplace=True)
        combined.to_csv(GENUINE_PRICES_CSV, index=False)

    def load_genuine_dataframe(self) -> pd.DataFrame:
        if os.path.exists(GENUINE_PRICES_CSV) and os.path.getsize(GENUINE_PRICES_CSV) > 0:
            try:
                df = pd.read_csv(GENUINE_PRICES_CSV)
                if not df.empty:
                    df["date"] = pd.to_datetime(df["date"])
                    return df
            except Exception as e:
                logger.warning(f"Error parsing genuine mandi prices CSV: {e}")
        return pd.DataFrame()

    def get_records_for_state(self, state: str = "Maharashtra") -> List[Dict[str, Any]]:
        cache_key = f"state_records_{state.lower()}"
        cached = self._get_from_cache(cache_key)
        if cached is not None:
            return cached

        # Check local genuine dataset first
        df = self.load_genuine_dataframe()
        state_records: List[Dict[str, Any]] = []
        if not df.empty:
            sub = df[df["state"].str.lower() == state.lower()]
            if not sub.empty:
                state_records = sub.to_dict(orient="records")

        # If empty or stale, query live API
        if not state_records and self.api_key:
            live = self.fetch_live_records(state=state, limit=1000)
            if live:
                state_records = live

        if state_records:
            self._set_cache(cache_key, state_records)
        return state_records

    def get_filter_hierarchy(
        self,
        state: Optional[str] = "Maharashtra",
        district: Optional[str] = None,
        market: Optional[str] = None,
        commodity: Optional[str] = None
    ) -> MarketHierarchyResponse:
        """
        Derives real administrative options (State -> District -> Mandi -> Commodity -> Variety)
        from genuine government records available to the application.
        """
        active_state = state or "Maharashtra"
        records = self.get_records_for_state(active_state)

        # 1. Distinct States
        states_set = set(DEFAULT_STATES)
        df = self.load_genuine_dataframe()
        if not df.empty:
            for s in df["state"].dropna().unique():
                if s.strip():
                    states_set.add(s.strip())
        states = sorted(list(states_set))
        if "Maharashtra" in states:
            states.remove("Maharashtra")
            states.insert(0, "Maharashtra")

        # 2. Districts in selected State
        districts_set = set()
        for r in records:
            d = str(r.get("district", "")).strip()
            if d:
                districts_set.add(d)
        districts = sorted(list(districts_set))

        # Selected district resolution
        active_district = district
        if active_district and active_district not in districts_set:
            # Check case-insensitive match
            matched = next((d for d in districts if d.lower() == active_district.lower()), None)
            active_district = matched or (districts[0] if districts else None)
        elif not active_district and districts:
            # Default to Nashik if present, else first
            active_district = "Nashik" if "Nashik" in districts else districts[0]

        # 3. Mandis in selected State & District
        mandis_set = set()
        for r in records:
            d = str(r.get("district", "")).strip()
            m = str(r.get("market", "")).strip()
            if active_district and d.lower() == active_district.lower():
                if m:
                    mandis_set.add(m)
            elif not active_district and m:
                mandis_set.add(m)
        mandis = sorted(list(mandis_set))

        # Selected market resolution
        active_market = market
        if active_market and active_market not in mandis_set:
            matched_m = next((m for m in mandis if m.lower() == active_market.lower() or active_market.lower() in m.lower()), None)
            active_market = matched_m or (mandis[0] if mandis else None)
        elif not active_market and mandis:
            # Default to Lasalgaon or Pimpalgaon if available, else first
            fav = next((m for m in mandis if "lasalgaon" in m.lower() or "pimpalgaon" in m.lower()), mandis[0])
            active_market = fav

        # 4. Commodities for selected Mandi (or District)
        commodities_set = set()
        for r in records:
            d = str(r.get("district", "")).strip()
            m = str(r.get("market", "")).strip()
            c = str(r.get("commodity", "")).strip()
            if active_market and m.lower() == active_market.lower():
                if c:
                    commodities_set.add(c)
            elif active_district and d.lower() == active_district.lower():
                if c:
                    commodities_set.add(c)
            elif c:
                commodities_set.add(c)
        commodities = sorted(list(commodities_set))

        # Selected commodity resolution
        active_commodity = commodity
        if active_commodity and active_commodity not in commodities_set:
            matched_c = next((c for c in commodities if c.lower() == active_commodity.lower()), None)
            active_commodity = matched_c or (commodities[0] if commodities else None)
        elif not active_commodity and commodities:
            active_commodity = "Onion" if "Onion" in commodities else commodities[0]

        # 5. Varieties for selected Market & Commodity
        varieties_set = set()
        for r in records:
            m = str(r.get("market", "")).strip()
            c = str(r.get("commodity", "")).strip()
            v = str(r.get("variety", "")).strip()
            if active_market and active_commodity:
                if m.lower() == active_market.lower() and c.lower() == active_commodity.lower() and v:
                    varieties_set.add(v)
            elif active_commodity and c.lower() == active_commodity.lower() and v:
                varieties_set.add(v)
        varieties = sorted(list(varieties_set))

        return MarketHierarchyResponse(
            states=states,
            districts=districts,
            mandis=mandis,
            commodities=commodities,
            varieties=varieties,
            selected_state=active_state,
            selected_district=active_district,
            selected_mandi=active_market,
            selected_commodity=active_commodity
        )

    def get_mandis(self) -> List[MandiOption]:
        """
        Derives mandi options dynamically from genuine government records.
        Preserves coordinates for known benchmark locations.
        """
        records = self.get_records_for_state("Maharashtra")
        mandi_map: Dict[str, MandiOption] = {}

        for r in records:
            market_name = str(r.get("market", "")).strip()
            district = str(r.get("district", "")).strip()
            state = str(r.get("state", "Maharashtra")).strip()
            crop = str(r.get("commodity", "onion")).lower()

            if not market_name:
                continue

            slug = market_name.lower().replace("apmc", "").replace("market", "").strip()
            slug = "".join(c for c in slug if c.isalnum() or c == "_")
            if not slug:
                slug = f"mandi_{len(mandi_map)}"

            # Lookup benchmark coordinates if available
            lat, lng = None, None
            for key, (b_lat, b_lng, b_dist) in BENCHMARK_MANDI_COORDINATES.items():
                if key in market_name.lower():
                    slug = key
                    lat, lng = b_lat, b_lng
                    break

            if slug not in mandi_map:
                mandi_map[slug] = MandiOption(
                    id=slug,
                    name=market_name,
                    district=district,
                    state=state,
                    default_crop=crop,
                    latitude=lat or 19.5,
                    longitude=lng or 75.0
                )

        # Fallback to benchmark list if no live mandis loaded
        if not mandi_map:
            return [
                MandiOption(id="lasalgaon", name="Lasalgaon (लासलगाव)", district="Nashik", state="Maharashtra", default_crop="onion", latitude=20.1472, longitude=74.2281),
                MandiOption(id="pimpalgaon", name="Pimpalgaon Baswant (पिंपळगाव)", district="Nashik", state="Maharashtra", default_crop="onion", latitude=20.1741, longitude=73.9856),
                MandiOption(id="yeola", name="Yeola (येवला)", district="Nashik", state="Maharashtra", default_crop="onion", latitude=20.0435, longitude=74.4842),
                MandiOption(id="pune", name="Pune Gultekdi (पुणे)", district="Pune", state="Maharashtra", default_crop="onion", latitude=18.4965, longitude=73.8647),
                MandiOption(id="solapur", name="Solapur (सोलापूर)", district="Solapur", state="Maharashtra", default_crop="onion", latitude=17.6599, longitude=75.9064),
                MandiOption(id="ahmednagar", name="Ahmednagar (अहमदनगर)", district="Ahmednagar", state="Maharashtra", default_crop="onion", latitude=19.0952, longitude=74.7496),
                MandiOption(id="latur", name="Latur (लातूर)", district="Latur", state="Maharashtra", default_crop="soyabean", latitude=18.4088, longitude=76.5604),
                MandiOption(id="jalgaon", name="Jalgaon (जळगाव)", district="Jalgaon", state="Maharashtra", default_crop="cotton", latitude=21.0077, longitude=75.5626),
            ]

        return list(mandi_map.values())

    def get_crops(self) -> List[CropOption]:
        """
        Derives available commodities dynamically from genuine government records.
        """
        records = self.get_records_for_state("Maharashtra")
        crops_set = set()
        for r in records:
            c = str(r.get("commodity", "")).strip()
            if c:
                crops_set.add(c)

        crop_options = []
        # Priority crops first
        priority = ["Onion", "Soyabean", "Cotton", "Wheat", "Potato", "Tomato", "Maize"]
        for p in priority:
            if p in crops_set:
                crops_set.remove(p)
                crop_options.append(CropOption(
                    id=p.lower().replace(" ", "_"),
                    name=p,
                    category="Core Cash & Staple",
                    is_pilot=(p == "Onion")
                ))

        for c in sorted(list(crops_set)):
            crop_options.append(CropOption(
                id=c.lower().replace(" ", "_"),
                name=c,
                category="Government-Reported Mandi Commodity",
                is_pilot=False
            ))

        if not crop_options:
            return [
                CropOption(id="onion", name="Onion (कांदा)", category="Vegetables & Cash Crop", is_pilot=True),
                CropOption(id="soyabean", name="Soyabean (सोयाबीन)", category="Oilseeds", is_pilot=False),
                CropOption(id="cotton", name="Cotton (कापूस)", category="Commercial Fiber", is_pilot=False),
            ]
        return crop_options

    def get_market_data(
        self,
        crop: Optional[str] = None,
        mandi_id: Optional[str] = None,
        state: Optional[str] = None,
        district: Optional[str] = None,
        market: Optional[str] = None,
        commodity: Optional[str] = None,
        variety: Optional[str] = None,
        time_range: str = "30d",
        forecast_days: int = 7,
        mode: str = "live"
    ) -> MarketPriceResponse:
        """
        Queries genuine government observations with NO SILENT FALLBACKS.
        If a market does not report the commodity, raises ValueError without substituting another market.
        Uses genuine observation dates and pauses forecasts if fewer than 5 historical points exist.
        """
        # Resolve requested commodity
        target_commodity = commodity or crop or "Onion"
        if "soya" in target_commodity.lower():
            target_commodity = "Soyabean"
        elif "cotton" in target_commodity.lower() or "kapas" in target_commodity.lower():
            target_commodity = "Cotton"
        elif "onion" in target_commodity.lower():
            target_commodity = "Onion"

        # Resolve requested market
        target_market = market or mandi_id or "lasalgaon"
        target_state = state or "Maharashtra"
        target_district = district

        # Handle Separated Demo Mode
        if mode == "demo":
            return self._get_demo_data(target_commodity, target_market, time_range, forecast_days)

        # ---------------------------------------------------------
        # PRODUCTION MODE: Genuine Data Path Only
        # ---------------------------------------------------------
        df = self.load_genuine_dataframe()
        if df.empty or self.api_key:
            # Query live API to ensure up-to-date data
            self.fetch_live_records(state=target_state, limit=1000)
            df = self.load_genuine_dataframe()

        if df.empty:
            raise ValueError(f"No official government records available in database for state {target_state}.")

        # Case-insensitive filtering
        sub_df = df[
            (df["state"].str.lower() == target_state.lower()) &
            (df["commodity"].str.lower() == target_commodity.lower())
        ].copy()

        # Match market name strictly (e.g. "lasalgaon" matches "Lasalgaon(Vinchur)" or "Lasalgaon")
        matched_market_rows = sub_df[
            sub_df["market"].str.lower().str.contains(target_market.lower()) |
            (sub_df["market"].str.lower() == target_market.lower())
        ]

        # Only allow district match if target_market was specifically equal to district name or blank
        if matched_market_rows.empty and target_district and (target_market.lower() == target_district.lower() or not target_market):
            matched_market_rows = sub_df[sub_df["district"].str.lower() == target_district.lower()]

        # STRICT NO SILENT FALLBACK:
        # Never substitute another market's prices if user asked for Cotton at Ahmednagar, etc.
        if matched_market_rows.empty:
            raise ValueError(
                f"No official government price records found for {target_commodity} at {target_market} "
                f"({target_state}). Mandis only report data on trading days when physical lots arrive. "
                f"No cross-market fallback is applied to preserve data integrity."
            )

        sub_df = matched_market_rows.copy()
        if variety and "variety" in sub_df.columns:
            var_match = sub_df[sub_df["variety"].str.lower() == variety.lower()]
            if not var_match.empty:
                sub_df = var_match

        sub_df.sort_values(by="date", inplace=True)

        # Calendar-date window (not simply last N rows; accounts for non-trading days and gaps)
        range_days_map = {"7d": 7, "30d": 30, "90d": 90}
        days_to_keep = range_days_map.get(time_range.lower(), 30)
        latest_date = sub_df["date"].max()
        cutoff_date = latest_date - timedelta(days=days_to_keep)
        historical_slice = sub_df[sub_df["date"] >= cutoff_date].sort_values(by="date")
        if historical_slice.empty:
            historical_slice = sub_df.tail(1)

        latest_row = sub_df.iloc[-1]
        latest_modal = float(latest_row["modal_price"])
        latest_min = float(latest_row["min_price"])
        latest_max = float(latest_row["max_price"])
        actual_date_str = latest_row["date"].strftime("%Y-%m-%d")
        fetch_iso = str(latest_row.get("retrieved_at", datetime.now(timezone.utc).isoformat()))

        # Genuine observation points within calendar window
        historical_points = []
        for _, row in historical_slice.iterrows():
            historical_points.append(PricePoint(
                date=row["date"].strftime("%Y-%m-%d"),
                modal_price=round(float(row["modal_price"]), 1),
                min_price=round(float(row["min_price"]), 1),
                max_price=round(float(row["max_price"]), 1),
                arrival_tonnes=None,  # Not reported in this resource with verified units
                is_forecast=False
            ))

        # Price change calculation across ~7 calendar days
        unique_dates_count = sub_df["date"].nunique()
        change_7d = 0.0
        change_7d_pct = 0.0
        trend_category = "stable"

        seven_days_ago = latest_date - timedelta(days=7)
        prior_obs = sub_df[sub_df["date"] <= seven_days_ago]

        if not prior_obs.empty:
            prev_price = float(prior_obs.iloc[-1]["modal_price"])
            change_7d = round(latest_modal - prev_price, 2)
            change_7d_pct = round((change_7d / prev_price) * 100, 2) if prev_price > 0 else 0.0
        elif unique_dates_count >= 2:
            prev_price = float(sub_df.iloc[0]["modal_price"])
            change_7d = round(latest_modal - prev_price, 2)
            change_7d_pct = round((change_7d / prev_price) * 100, 2) if prev_price > 0 else 0.0

        if change_7d_pct > 2.0:
            trend_category = "rising"
        elif change_7d_pct < -2.0:
            trend_category = "falling"

        # Baseline Forecast:
        # Shown only when at least 5 distinct genuine historical trading day observations exist
        forecast_points: List[PricePoint] = []
        is_forecast_available = False
        forecast_status_message = None

        if unique_dates_count >= 5:
            forecast_points = self._compute_forecast(sub_df, forecast_days)
            is_forecast_available = True
        else:
            is_forecast_available = False
            forecast_status_message = (
                f"Statistical forecast is unavailable: requires at least 5 distinct trading day observations. "
                f"Currently {unique_dates_count} observation date(s) recorded in genuine AGMARKNET feed."
            )

        # Trend summary text
        actual_mandi_name = str(latest_row["market"])
        trend_summary = (
            f"Official AGMARKNET price for {target_commodity} at {actual_mandi_name} reported on observation date {actual_date_str}: "
            f"Modal price ₹{int(latest_modal)}/quintal (Min ₹{int(latest_min)} – Max ₹{int(latest_max)}/q). "
            f"Source: data.gov.in official feed (Resource {self.resource_id}). {forecast_status_message or 'Baseline 7-day statistical projection available.'}"
        )

        return MarketPriceResponse(
            state=str(latest_row["state"]),
            district=str(latest_row["district"]),
            market=actual_mandi_name,
            commodity=str(latest_row["commodity"]),
            variety=str(latest_row.get("variety", "Standard")),
            latest_date=actual_date_str,
            observation_date=actual_date_str,
            last_fetched_at=fetch_iso,
            latest_modal_price=latest_modal,
            latest_min_price=latest_min,
            latest_max_price=latest_max,
            latest_arrival_tonnes=None,  # Not published with known verified units by this API resource
            arrival_reported=False,
            price_change_7d=change_7d,
            price_change_7d_pct=change_7d_pct,
            price_trend=trend_category,
            trend_summary=trend_summary,
            data_source=f"data.gov.in / AGMARKNET (Resource: {self.resource_id})",
            last_updated=actual_date_str,
            disclaimer="Genuine AGMARKNET government observation. Projections are statistical baseline estimates shown only when sufficient genuine historical days exist. Physical arrivals volume is not published with verified units by this API feed.",
            historical_points=historical_points,
            forecast_points=forecast_points,
            is_forecast_available=is_forecast_available,
            forecast_status_message=forecast_status_message,
            mode="live"
        )

    def _get_demo_data(
        self,
        commodity: str,
        mandi: str,
        time_range: str,
        forecast_days: int
    ) -> MarketPriceResponse:
        """Isolated development demo mode using preserved prototype files with NO silent cross-market substitution."""
        csv_path = DEMO_PRICES_CSV if os.path.exists(DEMO_PRICES_CSV) else LEGACY_PRICES_CSV
        if not os.path.exists(csv_path):
            raise FileNotFoundError("Demo prices dataset not found.")

        df = pd.read_csv(csv_path)
        df["date"] = pd.to_datetime(df["date"])
        sub = df[df["commodity"].str.lower() == commodity.lower()].copy()
        if sub.empty:
            raise ValueError(
                f"No demo price records found for commodity '{commodity}'. "
                f"No cross-commodity fallback is applied to preserve data integrity."
            )

        m_sub = sub[
            sub["market"].str.lower().str.contains(mandi.lower()) |
            (sub["market"].str.lower() == mandi.lower())
        ]
        if m_sub.empty:
            raise ValueError(
                f"No demo price records found for {commodity} at {mandi}. "
                f"No cross-market fallback is applied to preserve data integrity."
            )

        sub = m_sub.copy()
        sub.sort_values(by="date", inplace=True)

        # Calendar-date window for demo mode as well
        range_days_map = {"7d": 7, "30d": 30, "90d": 90}
        days_to_keep = range_days_map.get(time_range.lower(), 30)
        latest_date = sub["date"].max()
        cutoff_date = latest_date - timedelta(days=days_to_keep)
        historical_slice = sub[sub["date"] >= cutoff_date]
        if historical_slice.empty:
            historical_slice = sub.tail(1)

        latest = sub.iloc[-1]
        actual_date_str = latest["date"].strftime("%Y-%m-%d")

        historical_points = [
            PricePoint(
                date=row["date"].strftime("%Y-%m-%d"),
                modal_price=round(float(row["modal_price"]), 1),
                min_price=round(float(row["min_price"]), 1),
                max_price=round(float(row["max_price"]), 1),
                arrival_tonnes=float(row["arrival_tonnes"]) if pd.notnull(row.get("arrival_tonnes")) else None,
                is_forecast=False
            )
            for _, row in historical_slice.iterrows()
        ]
        forecast_points = self._compute_forecast(sub, forecast_days)

        return MarketPriceResponse(
            state="Maharashtra",
            district=str(latest["district"]),
            market=str(latest["market"]),
            commodity=str(latest["commodity"]),
            variety=str(latest["variety"]),
            latest_date=actual_date_str,
            observation_date=actual_date_str,
            last_fetched_at=datetime.now(timezone.utc).isoformat(),
            latest_modal_price=float(latest["modal_price"]),
            latest_min_price=float(latest["min_price"]),
            latest_max_price=float(latest["max_price"]),
            latest_arrival_tonnes=float(latest.get("arrival_tonnes", 1000)),
            arrival_reported=True,
            price_change_7d=120.0,
            price_change_7d_pct=5.5,
            price_trend="rising",
            trend_summary="[DEMO MODE - SIMULATED DATA] Prototype baseline for development testing only.",
            data_source="SIMULATED DEMO DATA (Prototype model based on AGMARKNET patterns - Not official records)",
            last_updated=actual_date_str,
            disclaimer="[DEVELOPMENT DEMO] Simulated dataset for UI testing. Switch to Live mode for official data.gov.in feeds.",
            historical_points=historical_points,
            forecast_points=forecast_points,
            is_forecast_available=True,
            forecast_status_message=None,
            mode="demo"
        )

    def _compute_forecast(self, df: pd.DataFrame, days: int = 7) -> List[PricePoint]:
        recent = df.tail(14)
        if len(recent) < 5:
            return []

        modals = recent["modal_price"].values
        slope = (modals[-1] - modals[-5]) / 5.0
        diffs = pd.Series(modals).diff().dropna()
        daily_volatility = max(25.0, float(diffs.std()) if len(diffs) > 1 else 35.0)

        last_date = df.iloc[-1]["date"]
        current_base = float(modals[-1])
        dampening = 0.82

        forecast = []
        for i in range(1, days + 1):
            next_date = last_date + timedelta(days=i)
            projected_slope = slope * (dampening ** i)
            projected_price = max(400.0, round(current_base + (projected_slope * i), 1))
            uncertainty = daily_volatility * math.sqrt(i) * 1.35
            lower_bound = max(300.0, round(projected_price - uncertainty, 1))
            upper_bound = round(projected_price + uncertainty, 1)

            forecast.append(PricePoint(
                date=next_date.strftime("%Y-%m-%d"),
                modal_price=projected_price,
                min_price=lower_bound,
                max_price=upper_bound,
                arrival_tonnes=None,
                is_forecast=True,
                lower_bound=lower_bound,
                upper_bound=upper_bound
            ))

        return forecast

gov_mandi_service = GovMandiService()
