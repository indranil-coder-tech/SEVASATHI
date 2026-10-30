import json
import math
import os
import re
import time
import urllib.parse
import urllib.request

import pandas as pd

from app.models import (
    DataSourceRecord,
    MidhProjectRecord,
    MidhStagingResponse,
    MidhStagingSummary,
    StateAggregateRecord,
    StateAggregateResponse,
    StorageFacility,
    StorageSearchResponse,
)

DATA_DIR = os.path.join(os.path.dirname(__file__), "..", "data")
STORAGE_CSV = os.path.join(DATA_DIR, "storage_facilities_maharashtra.csv")
STATE_AGGREGATE_CSV = os.path.join(
    DATA_DIR, "cold_storage_statewise_aggregate_asof_2026-01-31.csv"
)
DATA_SOURCE_REGISTER_CSV = os.path.join(DATA_DIR, "data_source_register.csv")
MIDH_STAGING_CSV = os.path.join(DATA_DIR, "midh_cold_chain_projects_staging.csv")

# ---------------------------------------------------------------------------
# Comprehensive Indian Admin-Place & Alias Gazetteer for Maharashtra
# Centroids represent genuine geographic/administrative centers, NOT facility pins.
# Supports English, Marathi (देवनागरी), and common transliterations.
# ---------------------------------------------------------------------------
MAHARASHTRA_GAZETTEER: dict[str, tuple[float, float, str]] = {
    # District Centroids
    "pune": (18.5204, 73.8567, "Pune District Centroid"),
    "पुणे": (18.5204, 73.8567, "पुणे (Pune)"),
    "poona": (18.5204, 73.8567, "Pune (Poona)"),
    "nashik": (19.9975, 73.7898, "Nashik District Centroid"),
    "नाशिक": (19.9975, 73.7898, "नाशिक (Nashik)"),
    "nasik": (19.9975, 73.7898, "Nashik"),
    "ahmednagar": (19.0952, 74.7496, "Ahmednagar District Centroid"),
    "अहमदनगर": (19.0952, 74.7496, "अहमदनगर (Ahmednagar)"),
    "ahilyanagar": (19.0952, 74.7496, "Ahilyanagar / Ahmednagar"),
    "अहिल्यानगर": (19.0952, 74.7496, "अहिल्यानगर (Ahilyanagar)"),
    "solapur": (17.6599, 75.9064, "Solapur District Centroid"),
    "सोलापूर": (17.6599, 75.9064, "सोलापूर (Solapur)"),
    "sholapur": (17.6599, 75.9064, "Solapur"),
    "chhatrapati sambhajinagar": (
        19.8762,
        75.3433,
        "Chhatrapati Sambhajinagar District Centroid",
    ),
    "छत्रपती संभाजीनगर": (
        19.8762,
        75.3433,
        "छत्रपती संभाजीनगर (Chhatrapati Sambhajinagar)",
    ),
    "aurangabad": (19.8762, 75.3433, "Aurangabad / Chhatrapati Sambhajinagar"),
    "औरंगाबाद": (19.8762, 75.3433, "औरंगाबाद (Aurangabad)"),
    "jalgaon": (21.0077, 75.5626, "Jalgaon District Centroid"),
    "जळगाव": (21.0077, 75.5626, "जळगाव (Jalgaon)"),
    "latur": (18.4088, 76.5604, "Latur District Centroid"),
    "लातूर": (18.4088, 76.5604, "लातूर (Latur)"),
    "satara": (17.6805, 73.9997, "Satara District Centroid"),
    "सातारा": (17.6805, 73.9997, "सातारा (Satara)"),
    "sangli": (16.8524, 74.5815, "Sangli District Centroid"),
    "सांगली": (16.8524, 74.5815, "सांगली (Sangli)"),
    "kolhapur": (16.7050, 74.2433, "Kolhapur District Centroid"),
    "कोल्हापूर": (16.7050, 74.2433, "कोल्हापूर (Kolhapur)"),
    "mumbai": (19.0760, 72.8777, "Mumbai Centroid"),
    "मुंबई": (19.0760, 72.8777, "मुंबई (Mumbai)"),
    "bombay": (19.0760, 72.8777, "Mumbai"),
    "thane": (19.2183, 72.9781, "Thane District Centroid"),
    "ठाणे": (19.2183, 72.9781, "ठाणे (Thane)"),
    "dhule": (20.9042, 74.7749, "Dhule District Centroid"),
    "धुळे": (20.9042, 74.7749, "धुळे (Dhule)"),
    "nagpur": (21.1458, 79.0882, "Nagpur District Centroid"),
    "नागपूर": (21.1458, 79.0882, "नागपूर (Nagpur)"),
    # Taluka, APMC Hub & Major Agricultural Centers
    "lasalgaon": (20.1472, 74.2281, "Lasalgaon APMC, Niphad"),
    "लासलगाव": (20.1472, 74.2281, "लासलगाव (Lasalgaon)"),
    "pimpalgaon": (20.1741, 73.9856, "Pimpalgaon Baswant, Niphad"),
    "pimpalgaon baswant": (20.1741, 73.9856, "Pimpalgaon Baswant, Niphad"),
    "पिंपळगाव": (20.1741, 73.9856, "पिंपळगाव बसवंत (Pimpalgaon)"),
    "पिंपळगाव बसवंत": (20.1741, 73.9856, "पिंपळगाव बसवंत (Pimpalgaon)"),
    "niphad": (20.0872, 74.1085, "Niphad Taluka, Nashik"),
    "निफाड": (20.0872, 74.1085, "निफाड (Niphad)"),
    "yeola": (20.0435, 74.4842, "Yeola Taluka, Nashik"),
    "येवला": (20.0435, 74.4842, "येवला (Yeola)"),
    "sinnar": (19.8510, 73.9984, "Sinnar Taluka, Nashik"),
    "सिन्नर": (19.8510, 73.9984, "सिन्नर (Sinnar)"),
    "kalwan": (20.4891, 73.9922, "Kalwan Taluka, Nashik"),
    "कळवण": (20.4891, 73.9922, "कळवण (Kalwan)"),
    "dindori": (20.2036, 73.8340, "Dindori Taluka, Nashik"),
    "दिंडोरी": (20.2036, 73.8340, "दिंडोरी (Dindori)"),
    "mohadi": (20.0894, 73.9211, "Mohadi, Dindori, Nashik"),
    "मोहाडी": (20.0894, 73.9211, "मोहाडी (Mohadi)"),
    "malegaon": (20.5579, 74.5287, "Malegaon Taluka, Nashik"),
    "मालेगाव": (20.5579, 74.5287, "मालेगाव (Malegaon)"),
    "satana": (20.5910, 74.2046, "Satana / Baglan, Nashik"),
    "सटाणा": (20.5910, 74.2046, "सटाणा (Satana)"),
    "baglan": (20.5910, 74.2046, "Baglan Taluka, Nashik"),
    "बागलाण": (20.5910, 74.2046, "बागलाण (Baglan)"),
    "chandwad": (20.3298, 74.2409, "Chandwad Taluka, Nashik"),
    "चांदवड": (20.3298, 74.2409, "चांदवड (Chandwad)"),
    "junnar": (19.2069, 73.8764, "Junnar Taluka, Pune"),
    "जुन्नर": (19.2069, 73.8764, "जुन्नर (Junnar)"),
    "narayangaon": (19.1232, 73.9781, "Narayangaon, Junnar, Pune"),
    "नारायणगाव": (19.1232, 73.9781, "नारायणगाव (Narayangaon)"),
    "ambegaon": (19.0300, 73.9200, "Ambegaon Taluka, Pune"),
    "आंबेगाव": (19.0300, 73.9200, "आंबेगाव (Ambegaon)"),
    "manchar": (19.0068, 73.9392, "Manchar, Ambegaon, Pune"),
    "मंचर": (19.0068, 73.9392, "मंचर (Manchar)"),
    "khed": (18.8549, 73.8997, "Khed / Rajgurunagar, Pune"),
    "rajgurunagar": (18.8549, 73.8997, "Rajgurunagar (Khed), Pune"),
    "खेड": (18.8549, 73.8997, "खेड / राजगुरुनगर (Khed)"),
    "राजगुरुनगर": (18.8549, 73.8997, "राजगुरुनगर (Rajgurunagar)"),
    "baramati": (18.1528, 74.5771, "Baramati Taluka, Pune"),
    "बारामती": (18.1528, 74.5771, "बारामती (Baramati)"),
    "gultekdi": (18.4965, 73.8647, "Gultekdi Market Yard, Pune"),
    "गुलटेकडी": (18.4965, 73.8647, "गुलटेकडी (Gultekdi)"),
    "sangamner": (19.5762, 74.2081, "Sangamner Taluka, Ahmednagar"),
    "संगमनेर": (19.5762, 74.2081, "संगमनेर (Sangamner)"),
    "shirdi": (19.7667, 74.4764, "Shirdi / Rahata, Ahmednagar"),
    "शिर्डी": (19.7667, 74.4764, "शिर्डी (Shirdi)"),
    "rahata": (19.7118, 74.4893, "Rahata Taluka, Ahmednagar"),
    "राहाता": (19.7118, 74.4893, "राहाता (Rahata)"),
    "kopargaon": (19.8887, 74.4776, "Kopargaon Taluka, Ahmednagar"),
    "कोपरगाव": (19.8887, 74.4776, "कोपरगाव (Kopargaon)"),
    "rahuri": (19.3908, 74.6508, "Rahuri Taluka, Ahmednagar"),
    "राहुरी": (19.3908, 74.6508, "राहुरी (Rahuri)"),
    "pandharpur": (17.6781, 75.3262, "Pandharpur Taluka, Solapur"),
    "पंढरपूर": (17.6781, 75.3262, "पंढरपूर (Pandharpur)"),
    "barshi": (18.2323, 75.6946, "Barshi Taluka, Solapur"),
    "बार्शी": (18.2323, 75.6946, "बार्शी (Barshi)"),
    # PIN Codes
    "422306": (20.1472, 74.2281, "Lasalgaon (PIN 422306)"),
    "422209": (20.1741, 73.9856, "Pimpalgaon Baswant (PIN 422209)"),
    "422001": (19.9975, 73.7898, "Nashik City (PIN 422001)"),
    "422303": (20.0872, 74.1085, "Niphad (PIN 422303)"),
    "423401": (20.0435, 74.4842, "Yeola (PIN 423401)"),
    "422113": (19.8510, 73.9984, "Sinnar (PIN 422113)"),
    "423501": (20.4891, 73.9922, "Kalwan (PIN 423501)"),
    "422207": (20.2036, 73.8340, "Dindori (PIN 422207)"),
    "411037": (18.4965, 73.8647, "Gultekdi, Pune (PIN 411037)"),
    "411001": (18.5204, 73.8567, "Pune City (PIN 411001)"),
    "410504": (19.1232, 73.9781, "Narayangaon (PIN 410504)"),
    "410503": (19.0068, 73.9392, "Manchar, Ambegaon (PIN 410503)"),
    "414001": (19.0952, 74.7496, "Ahmednagar City (PIN 414001)"),
    "422605": (19.5762, 74.2081, "Sangamner (PIN 422605)"),
    "413255": (17.6599, 75.9064, "Solapur MIDC (PIN 413255)"),
    "413001": (17.6599, 75.9064, "Solapur City (PIN 413001)"),
    "413304": (17.6781, 75.3262, "Pandharpur (PIN 413304)"),
    "413133": (18.1528, 74.5771, "Baramati MIDC (PIN 413133)"),
    "425001": (21.0077, 75.5626, "Jalgaon City (PIN 425001)"),
    "425003": (21.0077, 75.5626, "Jalgaon MIDC (PIN 425003)"),
    "413512": (18.4088, 76.5604, "Latur City (PIN 413512)"),
    "431001": (19.8762, 75.3433, "Chhatrapati Sambhajinagar (PIN 431001)"),
    "431007": (19.8762, 75.3433, "Shendra MIDC (PIN 431007)"),
}

# ---------------------------------------------------------------------------
# Geocoding In-Memory Cache & Nominatim Rate Limiter (Policy Compliant)
# ---------------------------------------------------------------------------
_GEOCODE_CACHE: dict[str, tuple[float, float, str] | None] = {}
_LAST_EXTERNAL_CALL_TIME: float = 0.0


def normalize_query_text(q: str) -> str:
    """Normalizes query text by removing diacritics/punctuation, trimming, and lowercasing."""
    if not q:
        return ""
    q_clean = q.strip().lower()
    # Remove common punctuation
    q_clean = re.sub(r"[,/.\-_()]+", " ", q_clean)
    q_clean = re.sub(r"\s+", " ", q_clean).strip()
    return q_clean


def resolve_via_gazetteer(query: str) -> tuple[float, float, str] | None:
    """
    Exact and whole-token matching against the normalized gazetteer.
    Rejects short accidental substring matches.
    """
    norm = normalize_query_text(query)
    if not norm:
        return None

    # 1. Exact match in gazetteer
    if norm in MAHARASHTRA_GAZETTEER:
        return MAHARASHTRA_GAZETTEER[norm]

    # 2. Token boundary check (e.g. "pune district", "lasalgaon apmc", "district nashik")
    tokens = [t for t in norm.split() if len(t) >= 3]
    for token in tokens:
        if token in MAHARASHTRA_GAZETTEER:
            return MAHARASHTRA_GAZETTEER[token]

    return None


def resolve_via_nominatim(query: str) -> tuple[float, float, str] | None:
    """
    Resolves location via public Nominatim with strict adherence to OSM usage policies:
    - Identifying custom User-Agent
    - Rate-limiting (min 1.0s between calls)
    - India/Maharashtra country and viewbox hint
    - In-memory caching for hits and misses
    """
    global _LAST_EXTERNAL_CALL_TIME
    norm = normalize_query_text(query)
    if not norm:
        return None

    if norm in _GEOCODE_CACHE:
        return _GEOCODE_CACHE[norm]

    # Enforce 1 request per second
    now = time.time()
    elapsed = now - _LAST_EXTERNAL_CALL_TIME
    if elapsed < 1.05:
        time.sleep(1.05 - elapsed)

    is_pin = bool(re.match(r"^\d{6}$", norm))
    if is_pin:
        params = {
            "postalcode": norm,
            "country": "India",
            "format": "json",
            "addressdetails": "1",
            "limit": "1",
        }
    else:
        params = {
            "q": f"{norm}, Maharashtra, India",
            "format": "json",
            "addressdetails": "1",
            "limit": "1",
            "countrycodes": "in",
        }
    url = f"https://nominatim.openstreetmap.org/search?{urllib.parse.urlencode(params)}"
    req = urllib.request.Request(
        url,
        headers={
            "User-Agent": "SevaSathi-AgriPlatform/1.0 (contact: admin@sevasathi.local)",
            "Referer": "https://sevasathi.local",
        },
    )

    try:
        _LAST_EXTERNAL_CALL_TIME = time.time()
        with urllib.request.urlopen(req, timeout=5) as resp:
            if resp.status == 200:
                data = json.loads(resp.read().decode("utf-8"))
                if data and isinstance(data, list) and len(data) > 0:
                    item = data[0]
                    # If this is a PIN query, ensure the returned item actually has or matches that postal code
                    if is_pin:
                        addr = item.get("address", {})
                        ret_postcode = addr.get("postcode", "")
                        if norm not in ret_postcode and ret_postcode != norm:
                            _GEOCODE_CACHE[norm] = None
                            return None

                    # If this is a text query, ensure Nominatim didn't just match generic 'Maharashtra'
                    if not is_pin:
                        display_lower = item.get("display_name", "").lower()
                        norm_tokens = [
                            t
                            for t in norm.split()
                            if len(t) >= 3
                            and t not in ["taluka", "district", "village", "city"]
                        ]
                        if norm_tokens and not any(
                            t in display_lower for t in norm_tokens
                        ):
                            _GEOCODE_CACHE[norm] = None
                            return None

                    lat = float(item["lat"])
                    lng = float(item["lon"])
                    display_name = item.get("display_name", norm.title())
                    result = (lat, lng, display_name)
                    _GEOCODE_CACHE[norm] = result
                    return result
    except Exception:
        pass

    # Record miss in cache to avoid repeat hits
    _GEOCODE_CACHE[norm] = None
    return None


def calculate_haversine_distance(
    lat1: float, lon1: float, lat2: float, lon2: float
) -> float:
    """Computes great-circle distance between two coordinate pairs in kilometers."""
    R = 6371.0
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)

    a = (
        math.sin(delta_phi / 2.0) ** 2
        + math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda / 2.0) ** 2
    )
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    return round(R * c, 1)


class StorageService:
    def __init__(self):
        self._df: pd.DataFrame | None = None
        self._state_df: pd.DataFrame | None = None
        self._source_df: pd.DataFrame | None = None
        self._midh_staging_df: pd.DataFrame | None = None
        self._load_data()

    def _load_data(self):
        if not os.path.exists(STORAGE_CSV):
            raise FileNotFoundError(
                f"Storage facilities CSV not found at {STORAGE_CSV}"
            )
        self._df = pd.read_csv(STORAGE_CSV)

        if os.path.exists(STATE_AGGREGATE_CSV):
            self._state_df = pd.read_csv(STATE_AGGREGATE_CSV)
        if os.path.exists(DATA_SOURCE_REGISTER_CSV):
            self._source_df = pd.read_csv(DATA_SOURCE_REGISTER_CSV)
        if os.path.exists(MIDH_STAGING_CSV):
            self._midh_staging_df = pd.read_csv(MIDH_STAGING_CSV)

    def get_statewise_aggregates(self) -> StateAggregateResponse:
        if self._state_df is None or self._state_df.empty:
            self._load_data()

        records: list[StateAggregateRecord] = []
        total_count = 0
        total_cap = 0

        if self._state_df is not None:
            for _, row in self._state_df.iterrows():
                cnt = (
                    int(row["reported_cold_storage_count"])
                    if pd.notnull(row["reported_cold_storage_count"])
                    else 0
                )
                cap = (
                    int(row["reported_capacity_mt"])
                    if pd.notnull(row["reported_capacity_mt"])
                    else 0
                )
                total_count += cnt
                total_cap += cap
                records.append(
                    StateAggregateRecord(
                        state_ut_as_published=str(row["state_ut_as_published"]),
                        reported_cold_storage_count=cnt,
                        reported_capacity_mt=cap,
                        as_of_date=str(row["as_of_date"]),
                        source_url=str(row["source_url"]),
                        source_type=str(row["source_type"]),
                        data_quality_note=str(row["data_quality_note"])
                        if pd.notnull(row["data_quality_note"])
                        and str(row["data_quality_note"]).strip()
                        else None,
                    )
                )

        return StateAggregateResponse(
            national_total_storages=total_count,
            national_total_capacity_mt=total_cap,
            as_of_date="2026-01-31",
            source_url="https://sansad.in/getFile/annex/270/AU815_HfzzSL.pdf?source=pqars",
            data_quality_disclaimer=(
                "Official Rajya Sabha annexure snapshot dated 31-01-2026. "
                "Aggregated state/UT cold storage distribution only; not a nearby facility directory. "
                "Preserves published rows including combined Andhra Pradesh & Telangana."
            ),
            records=records,
        )

    def get_data_sources(self) -> list[DataSourceRecord]:
        if self._source_df is None or self._source_df.empty:
            self._load_data()

        sources: list[DataSourceRecord] = []
        if self._source_df is not None:
            for _, row in self._source_df.iterrows():
                sources.append(
                    DataSourceRecord(
                        source_name=str(row["source_name"]),
                        source_type=str(row["source_type"]),
                        coverage=str(row["coverage"]),
                        granularity=str(row["granularity"]),
                        use_in_sevasathi=str(row["use_in_sevasathi"]),
                        important_fields_or_capabilities=str(
                            row["important_fields_or_capabilities"]
                        ),
                        limitations=str(row["limitations"]),
                        last_seen_or_reference_date=str(row["last_seen_or_reference_date"]),
                        url=str(row["url"]),
                    )
                )
        return sources

    def get_midh_staging_summary(self) -> MidhStagingSummary:
        if self._midh_staging_df is None or self._midh_staging_df.empty:
            self._load_data()

        if self._midh_staging_df is None or self._midh_staging_df.empty:
            return MidhStagingSummary(
                total_projects=0,
                total_capacity_mt=0.0,
                total_subsidy_lakh_inr=0.0,
                review_flags_count=0,
                districts_count=0,
                years_covered="2005-06 to 2022-23",
                data_integrity_notice="No staging data loaded.",
            )

        df = self._midh_staging_df
        total_projects = len(df)
        total_capacity = round(float(df["capacity_mt"].sum()), 2)
        total_subsidy = round(float(df["subsidy_disbursed_lakh_inr"].sum()), 2)
        review_flags_count = int((df["review_flags"] != "Clean").sum())
        districts_count = int(df["district_normalized"].nunique())

        return MidhStagingSummary(
            total_projects=total_projects,
            total_capacity_mt=total_capacity,
            total_subsidy_lakh_inr=total_subsidy,
            review_flags_count=review_flags_count,
            districts_count=districts_count,
            years_covered="2005-06 to 2022-23",
            data_integrity_notice=(
                "Historical MIDH government subsidy list (सन २००५-०६ ते २०२२-२३). "
                "Kept strictly in staging as unverified historical projects. "
                "Not an active facility registry; does not contain real-time vacancy or exact verified coordinates."
            ),
        )

    def get_midh_staging_projects(
        self,
        district: str | None = None,
        financial_year: str | None = None,
        query: str | None = None,
        flag_filter: str | None = None,
        limit: int = 200,
        offset: int = 0,
    ) -> MidhStagingResponse:
        if self._midh_staging_df is None or self._midh_staging_df.empty:
            self._load_data()

        if self._midh_staging_df is None or self._midh_staging_df.empty:
            return MidhStagingResponse(
                summary=self.get_midh_staging_summary(), total_filtered=0, projects=[]
            )

        df = self._midh_staging_df.copy()

        if district and district.strip():
            dist_clean = district.strip().lower()
            df = df[df["district_normalized"].str.lower() == dist_clean]

        if financial_year and financial_year.strip():
            fy_clean = financial_year.strip()
            df = df[df["financial_year"] == fy_clean]

        if flag_filter and flag_filter.strip():
            ff = flag_filter.strip().lower()
            if ff == "clean":
                df = df[df["review_flags"] == "Clean"]
            elif ff == "flagged":
                df = df[df["review_flags"] != "Clean"]
            elif ff == "duplicate":
                df = df[
                    df["review_flags"].str.contains(
                        "Duplicate|expansion|same", case=False, na=False
                    )
                ]

        if query and query.strip():
            q = query.strip().lower()
            mask = (
                df["beneficiary_name_raw"]
                .astype(str)
                .str.lower()
                .str.contains(q, na=False)
                | df["address_raw"].astype(str).str.lower().str.contains(q, na=False)
                | df["taluka_normalized"]
                .astype(str)
                .str.lower()
                .str.contains(q, na=False)
                | df["district_normalized"]
                .astype(str)
                .str.lower()
                .str.contains(q, na=False)
                | df["pincode"].astype(str).str.contains(q, na=False)
            )
            df = df[mask]

        total_filtered = len(df)
        sliced = df.iloc[offset : offset + limit]

        records: list[MidhProjectRecord] = []
        for _, row in sliced.iterrows():
            pin_val = None
            if pd.notnull(row["pincode"]):
                pin_str = str(row["pincode"]).strip()
                pin_str = pin_str.removesuffix(".0")
                if pin_str:
                    pin_val = pin_str

            records.append(
                MidhProjectRecord(
                    project_id=str(row["project_id"]),
                    sr_no=int(row["sr_no"]),
                    district_raw=str(row["district_raw"]),
                    district_normalized=str(row["district_normalized"]),
                    financial_year=str(row["financial_year"]),
                    beneficiary_name_raw=str(row["beneficiary_name_raw"]),
                    address_raw=str(row["address_raw"]),
                    taluka_normalized=str(row["taluka_normalized"])
                    if pd.notnull(row["taluka_normalized"])
                    and str(row["taluka_normalized"]).strip()
                    else None,
                    pincode=pin_val,
                    subsidy_disbursed_lakh_inr=float(row["subsidy_disbursed_lakh_inr"]),
                    capacity_mt=float(row["capacity_mt"]),
                    source_document=str(row["source_document"]),
                    source_page=int(row["source_page"]),
                    record_type=str(row["record_type"])
                    if pd.notnull(row["record_type"])
                    else "Government Subsidy Project",
                    operational_status=str(row["operational_status"])
                    if pd.notnull(row["operational_status"])
                    else "unverified_historical_project",
                    verification_status=str(row["verification_status"])
                    if pd.notnull(row["verification_status"])
                    else "government_listed_project",
                    review_flags=str(row["review_flags"])
                    if pd.notnull(row["review_flags"])
                    else "Clean",
                    notes=str(row["notes"]) if pd.notnull(row["notes"]) else "",
                )
            )

        return MidhStagingResponse(
            summary=self.get_midh_staging_summary(),
            total_filtered=total_filtered,
            projects=records,
        )

    def search_facilities(
        self,
        mode: str = "auto",
        lat: float | None = None,
        lng: float | None = None,
        query: str | None = None,
        crop_filter: str | None = None,
        type_filter: str | None = None,
        radius_km: float | None = 25.0,
        max_results: int = 15,
    ) -> StorageSearchResponse:
        if self._df is None or self._df.empty:
            self._load_data()

        resolved_lat: float | None = None
        resolved_lng: float | None = None
        resolved_location_name: str | None = None
        resolution_source = "none"
        location_resolved = False
        warning: str | None = None

        has_query = bool(query and query.strip())
        has_coords = lat is not None and lng is not None

        # Determine search strategy based on mode and parameters
        if mode == "text" or (has_query and mode != "coordinates"):
            # Text query takes priority over any stale coordinates
            clean_q = query.strip() if query else ""

            # Step 1: Check normalized Maharashtra Gazetteer & Place Aliases
            match = resolve_via_gazetteer(clean_q)
            if match:
                resolved_lat, resolved_lng, resolved_location_name = match
                resolution_source = "gazetteer"
                location_resolved = True
            else:
                # Step 2: Try compliant Nominatim geocoder
                geo_match = resolve_via_nominatim(clean_q)
                if geo_match:
                    resolved_lat, resolved_lng, resolved_location_name = geo_match
                    resolution_source = "geocoder"
                    location_resolved = True
                else:
                    # Location could NOT be resolved — DO NOT FALLBACK TO LASALGAON!
                    return StorageSearchResponse(
                        total_found=0,
                        query_location=clean_q,
                        query_coords=None,
                        distance_type="Geodesic straight-line approximation",
                        facilities=[],
                        location_resolved=False,
                        resolution_source="none",
                        search_radius_km=radius_km,
                        warning=(
                            f"स्थान '{clean_q}' ओळखता आले नाही. कृपया जिल्ह्याचे किंवा तालुक्याचे अचूक नाव तपासा, "
                            f"किंवा 'GPS स्थान वापरा' निवडा. (Location '{clean_q}' was not recognized. "
                            f"Please verify spelling, specify a district/taluka, or use GPS.)"
                        ),
                    )

        elif mode == "coordinates" or (has_coords and not has_query):
            if lat is None or lng is None:
                raise ValueError(
                    "Both 'lat' and 'lng' query parameters are required when mode='coordinates'."
                )
            resolved_lat = float(lat)
            resolved_lng = float(lng)
            if not (-90.0 <= resolved_lat <= 90.0 and -180.0 <= resolved_lng <= 180.0):
                raise ValueError(
                    f"Coordinates ({resolved_lat}, {resolved_lng}) out of valid range [-90, 90], [-180, 180]."
                )

            resolved_location_name = (
                f"Coordinates ({round(resolved_lat, 4)}, {round(resolved_lng, 4)})"
            )
            resolution_source = "gps"
            location_resolved = True

            if (
                resolved_lat < 6.0
                or resolved_lat > 38.0
                or resolved_lng < 68.0
                or resolved_lng > 98.0
            ):
                warning = (
                    "स्थान भारताच्या भौगोलिक सीमेबाहेर आहे. सेवासामग्री सध्या केवळ महाराष्ट्रातील साठवणूक सुविधा दाखवते. "
                    "(Location coordinates are outside India bounding box. SevaSathi currently indexes facilities in Maharashtra.)"
                )

        else:
            # Neither query nor coordinates provided: explicit demo default
            resolved_lat = 20.1472
            resolved_lng = 74.2281
            resolved_location_name = "Lasalgaon (Default Pilot Center)"
            resolution_source = "demo"
            location_resolved = True
            warning = (
                "डेमो मोड: लासलगाव मुख्य केंद्र दर्शविले आहे. "
                "स्थानिक केंद्रे पाहण्यासाठी वर ठिकाण शोधा किंवा GPS वापरा. "
                "(Demo mode: Showing Lasalgaon pilot center. Search a place or use GPS for local results.)"
            )

        # -------------------------------------------------------------------
        # Filtering & Distance Calculation
        # -------------------------------------------------------------------
        filtered = self._df.copy() if self._df is not None else pd.DataFrame()

        # Crop compatibility filter
        if crop_filter and crop_filter.lower() != "all":
            c_term = crop_filter.strip().lower()

            # If searching for onion or garlic
            if "onion" in c_term or "कांदा" in c_term:
                filtered = filtered[
                    filtered["accepted_commodities"]
                    .str.lower()
                    .str.contains("onion", na=False)
                ]
            elif "potato" in c_term or "बटाटा" in c_term:
                filtered = filtered[
                    filtered["accepted_commodities"]
                    .str.lower()
                    .str.contains("potato", na=False)
                ]
            elif "grape" in c_term or "द्राक्ष" in c_term:
                filtered = filtered[
                    filtered["accepted_commodities"]
                    .str.lower()
                    .str.contains("grape|fruit|pomegranate", na=False)
                ]
            elif (
                "grain" in c_term
                or "धान्य" in c_term
                or "soya" in c_term
                or "cotton" in c_term
            ):
                # Grains / cotton / soyabean are compatible with general warehouses or dry storage, not ventilated chawls
                filtered = filtered[
                    filtered["accepted_commodities"]
                    .str.lower()
                    .str.contains("grain|soyabean|cotton|wheat|pulses", na=False)
                ]
            else:
                filtered = filtered[
                    filtered["accepted_commodities"]
                    .str.lower()
                    .str.contains(c_term, na=False)
                ]

        # Facility type filter
        if type_filter and type_filter.lower() != "all":
            t_term = type_filter.strip().lower()
            if "ventilated" in t_term or "chawl" in t_term or "चाळ" in t_term:
                filtered = filtered[
                    filtered["facility_category"]
                    .str.lower()
                    .str.contains("ventilated|chawl", na=False)
                ]
            elif "cold" in t_term or "शीतगृह" in t_term:
                filtered = filtered[
                    filtered["facility_category"]
                    .str.lower()
                    .str.contains("cold|refrigerated", na=False)
                ]
            elif "warehouse" in t_term or "godown" in t_term or "गोदाम" in t_term:
                filtered = filtered[
                    filtered["facility_category"]
                    .str.lower()
                    .str.contains("warehouse|godown", na=False)
                ]
            else:
                filtered = filtered[
                    filtered["facility_category"]
                    .str.lower()
                    .str.contains(t_term, na=False)
                ]

        facility_list: list[StorageFacility] = []
        nearest_facility: StorageFacility | None = None
        min_overall_dist: float | None = None

        for _, row in filtered.iterrows():
            # Validate coordinates
            f_lat = float(row["latitude"]) if pd.notnull(row["latitude"]) else None
            f_lng = float(row["longitude"]) if pd.notnull(row["longitude"]) else None

            dist: float | None = None
            if (
                resolved_lat is not None
                and resolved_lng is not None
                and f_lat is not None
                and f_lng is not None
            ):
                dist = calculate_haversine_distance(
                    resolved_lat, resolved_lng, f_lat, f_lng
                )

            # Safely parse numeric/null fields
            fee = (
                float(row["fee_per_quintal_month_inr"])
                if pd.notnull(row["fee_per_quintal_month_inr"])
                and str(row["fee_per_quintal_month_inr"]).strip() != ""
                else None
            )
            cap_tot = (
                float(row["capacity_total_mt"])
                if pd.notnull(row["capacity_total_mt"])
                and str(row["capacity_total_mt"]).strip() != ""
                else None
            )
            cap_avail = (
                float(row["capacity_available_mt"])
                if pd.notnull(row["capacity_available_mt"])
                and str(row["capacity_available_mt"]).strip() != ""
                else None
            )
            phone = (
                str(row["contact_phone"]).strip()
                if pd.notnull(row["contact_phone"])
                and str(row["contact_phone"]).strip() != ""
                else None
            )
            email = (
                str(row["contact_email"]).strip()
                if pd.notnull(row["contact_email"])
                and str(row["contact_email"]).strip() != ""
                else None
            )

            fac_type = str(row["facility_category"])
            is_chawl = "chawl" in fac_type.lower() or "ventilated" in fac_type.lower()
            is_cold = "cold" in fac_type.lower() or "refrigerated" in fac_type.lower()

            fac_obj = StorageFacility(
                id=str(row["facility_id"]),
                facility_id=str(row["facility_id"]),
                name=str(row["facility_name"]),
                facility_name=str(row["facility_name"]),
                facility_type=fac_type,
                facility_category=fac_type,
                state=str(row["state"]),
                district=str(row["district"]),
                subdistrict_tehsil=str(row["subdistrict_tehsil"])
                if pd.notnull(row["subdistrict_tehsil"])
                else str(row["district"]),
                taluka=str(row["subdistrict_tehsil"])
                if pd.notnull(row["subdistrict_tehsil"])
                else str(row["district"]),
                village_town=str(row["village_town"])
                if pd.notnull(row["village_town"])
                else None,
                address=str(row["address"]),
                pincode=str(row["pincode"]),
                latitude=f_lat,
                longitude=f_lng,
                accepted_crops=str(row["accepted_commodities"]),
                accepted_commodities=str(row["accepted_commodities"]),
                storage_method=str(row["storage_method"])
                if pd.notnull(row["storage_method"])
                else None,
                capacity_metric_tonnes=cap_tot,
                capacity_total_mt=cap_tot,
                capacity_available_mt=cap_avail,
                storage_price_per_quintal_month=fee,
                fee_per_quintal_month_inr=fee,
                contact_phone=phone,
                contact_email=email,
                registration_authority=str(row["registration_authority"])
                if pd.notnull(row["registration_authority"])
                else None,
                registration_id=str(row["registration_id"])
                if pd.notnull(row["registration_id"])
                else None,
                verification_status=str(row["verification_status"])
                if pd.notnull(row["verification_status"])
                else "unverified",
                verified_by=str(row["registration_authority"])
                if pd.notnull(row["registration_authority"])
                else "Unverified",
                verification_date=str(row["last_verified_at"])
                if pd.notnull(row["last_verified_at"])
                else "Not verified",
                availability_status=str(row["availability_status"])
                if pd.notnull(row["availability_status"])
                else "unknown",
                status=str(row["availability_status"]).capitalize()
                if pd.notnull(row["availability_status"])
                else "Unknown",
                source_name=str(row["source_name"])
                if pd.notnull(row["source_name"])
                else None,
                source_url=str(row["source_url"])
                if pd.notnull(row["source_url"])
                else None,
                source_record_date=str(row["source_record_date"])
                if pd.notnull(row["source_record_date"])
                else None,
                last_verified_at=str(row["last_verified_at"])
                if pd.notnull(row["last_verified_at"])
                else None,
                location_precision=str(row["location_precision"])
                if pd.notnull(row["location_precision"])
                else "exact_pin",
                booking_required=bool(row["booking_required"])
                if pd.notnull(row["booking_required"])
                else None,
                humidity_control=is_cold,
                aeration_system=is_chawl,
                notes=str(row["notes"]) if pd.notnull(row["notes"]) else "",
                distance_km=dist,
            )

            # Track nearest facility regardless of search radius
            if dist is not None:
                if min_overall_dist is None or dist < min_overall_dist:
                    min_overall_dist = dist
                    nearest_facility = fac_obj

            # Apply configurable radius threshold if set
            if radius_km is not None and radius_km > 0 and dist is not None:
                if dist > radius_km:
                    continue

            facility_list.append(fac_obj)

        # Sort by Haversine distance ascending
        facility_list.sort(
            key=lambda x: x.distance_km if x.distance_km is not None else 999999.0
        )

        # Empty state warning with nearest facility advisory if facilities exist elsewhere but none within chosen radius
        if len(facility_list) == 0 and radius_km is not None and radius_km > 0:
            nearest_text = (
                f" सर्वात जवळची साठवणूक सुविधा '{nearest_facility.name}' सुमारे {round(min_overall_dist, 1)} किमी अंतरावर आहे."
                if nearest_facility and min_overall_dist
                else ""
            )
            nearest_text_en = (
                f" Nearest facility '{nearest_facility.name}' is approx {round(min_overall_dist, 1)} km away."
                if nearest_facility and min_overall_dist
                else ""
            )
            empty_msg = (
                f"{radius_km} किमी अंतराच्या आत कोणतीही साठवणूक सुविधा आढळली नाही.{nearest_text} "
                f"कृपया शोध परिघ (Radius) 50 किंवा 100 किमी पर्यंत वाढवा, किंवा 'सर्व' (All) निवडा. "
                f"(No facilities found within {radius_km} km.{nearest_text_en} Try expanding the search radius or choosing 'All'.)"
            )
            warning = f"{warning} | {empty_msg}" if warning else empty_msg

        coords_dict = (
            {"latitude": resolved_lat, "longitude": resolved_lng}
            if resolved_lat is not None and resolved_lng is not None
            else None
        )

        return StorageSearchResponse(
            total_found=len(facility_list),
            query_location=resolved_location_name or query or "Selected Coordinates",
            query_coords=coords_dict,
            distance_type="Geodesic straight-line approximation",
            facilities=facility_list[:max_results],
            nearest_facility=nearest_facility,
            nearest_facility_distance_km=round(min_overall_dist, 2)
            if min_overall_dist is not None
            else None,
            location_resolved=location_resolved,
            resolution_source=resolution_source,
            search_radius_km=radius_km,
            warning=warning,
        )


storage_service = StorageService()
