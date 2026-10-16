"""
Official OGD / AGMARKNET Market Price Importer for SevaSathi.

Primary Official Source:
  https://www.data.gov.in/resource/variety-wise-daily-market-prices-data-commodity
  Catalog: Current daily price from various commodities/markets (Mandi)
  https://www.data.gov.in/catalog/current-daily-price-various-commodities-various-markets-mandi

This script downloads or parses official AGMARKNET price records, preserves raw fields,
records retrieval timestamps and source provenance, and normalizes records for
SevaSathi's Market Intelligence module.
"""

import os
import sys
import json
import argparse
import urllib.request
import urllib.parse
from datetime import datetime
import pandas as pd

DATA_DIR = os.path.join(os.path.dirname(__file__), "..", "data")
DEFAULT_OUTPUT_CSV = os.path.join(DATA_DIR, "mandi_prices_maharashtra.csv")
RAW_BACKUP_CSV = os.path.join(DATA_DIR, "mandi_prices_ogd_raw_archive.csv")

OGD_RESOURCE_ID = "9ef84268-d588-465a-a308-a864a43d0070"  # Variety-wise daily market prices
OGD_BASE_URL = "https://api.data.gov.in/resource/"

def parse_args():
    parser = argparse.ArgumentParser(description="Import AGMARKNET / OGD daily market prices")
    parser.add_argument("--api-key", help="data.gov.in API key", default=os.getenv("OGD_API_KEY", ""))
    parser.add_argument("--resource-id", help="OGD Resource ID", default=OGD_RESOURCE_ID)
    parser.add_argument("--file", help="Path to local downloaded official CSV or JSON file from data.gov.in")
    parser.add_argument("--output", help="Output path for normalized CSV", default=DEFAULT_OUTPUT_CSV)
    parser.add_argument("--limit", type=int, help="Maximum records to fetch", default=5000)
    parser.add_argument("--state", help="Filter by state", default="Maharashtra")
    return parser.parse_args()

def fetch_from_ogd_api(api_key: str, resource_id: str, limit: int = 5000, state: str = "Maharashtra"):
    if not api_key:
        raise ValueError(
            "OGD API key not provided. An official data.gov.in API key is required to query the live API. "
            "Pass --api-key <key> or set OGD_API_KEY environment variable. "
            "Falling back to simulated demo mode with explicit warning."
        )

    params = {
        "api-key": api_key,
        "format": "json",
        "limit": str(limit),
        "filters[state]": state
    }
    url = f"{OGD_BASE_URL}{resource_id}?{urllib.parse.urlencode(params)}"
    print(f"Connecting to official OGD API: {OGD_BASE_URL}{resource_id} (State: {state})...")
    
    req = urllib.request.Request(
        url,
        headers={"User-Agent": "SevaSathi-AgriPlatform/1.0 (contact: admin@sevasathi.local)"}
    )
    with urllib.request.urlopen(req, timeout=15) as resp:
        if resp.status != 200:
            raise ConnectionError(f"OGD API returned status code {resp.status}")
        data = json.loads(resp.read().decode("utf-8"))
        records = data.get("records", [])
        print(f"Successfully retrieved {len(records)} records from official OGD API.")
        return records, url

def load_from_file(file_path: str):
    print(f"Loading official AGMARKNET export from file: {file_path}")
    if file_path.endswith(".json"):
        with open(file_path, "r", encoding="utf-8") as f:
            data = json.load(f)
            records = data.get("records", data) if isinstance(data, dict) else data
            return records, f"file://{os.path.abspath(file_path)}"
    else:
        df = pd.read_csv(file_path)
        return df.to_dict(orient="records"), f"file://{os.path.abspath(file_path)}"

def normalize_records(raw_records, source_url: str):
    normalized = []
    retrieval_time = datetime.now().strftime("%Y-%m-%dT%H:%M:%SZ")

    for rec in raw_records:
        # data.gov.in field mapping (handles various government header casings)
        state = rec.get("state") or rec.get("State") or "Maharashtra"
        district = rec.get("district") or rec.get("District") or ""
        market = rec.get("market") or rec.get("Market") or ""
        commodity = rec.get("commodity") or rec.get("Commodity") or ""
        variety = rec.get("variety") or rec.get("Variety") or "Other"
        grade = rec.get("grade") or rec.get("Grade") or "FAQ"
        
        # Raw dates can be in DD/MM/YYYY or YYYY-MM-DD
        raw_date = str(rec.get("arrival_date") or rec.get("Arrival_Date") or rec.get("date") or rec.get("Date") or "")
        parsed_date = raw_date
        try:
            if "/" in raw_date:
                parsed_date = datetime.strptime(raw_date, "%d/%m/%Y").strftime("%Y-%m-%d")
            elif "-" in raw_date:
                parsed_date = datetime.strptime(raw_date[:10], "%Y-%m-%d").strftime("%Y-%m-%d")
        except Exception:
            parsed_date = raw_date

        try:
            min_price = float(rec.get("min_price") or rec.get("Min_Price") or 0.0)
            max_price = float(rec.get("max_price") or rec.get("Max_Price") or 0.0)
            modal_price = float(rec.get("modal_price") or rec.get("Modal_Price") or 0.0)
            arrivals = float(rec.get("arrival_tonnes") or rec.get("Arrival_Tonnes") or rec.get("arrivals") or 0.0)
        except (ValueError, TypeError):
            continue

        if modal_price <= 0:
            continue

        normalized.append({
            "date": parsed_date,
            "state": state,
            "district": district,
            "market": market,
            "commodity": commodity,
            "variety": variety,
            "grade": grade,
            "arrival_tonnes": arrivals,
            "min_price": min_price,
            "max_price": max_price,
            "modal_price": modal_price,
            "data_source": f"OGD India / AGMARKNET (Source: {source_url})",
            "source_url": source_url,
            "retrieved_at": retrieval_time
        })

    return pd.DataFrame(normalized)

def main():
    args = parse_args()
    print("=" * 60)
    print("SevaSathi AGMARKNET / OGD Market Price Ingestion Tool")
    print("=" * 60)

    raw_records = []
    source_url = ""

    if args.file and os.path.exists(args.file):
        try:
            raw_records, source_url = load_from_file(args.file)
        except Exception as e:
            print(f"[ERROR] Failed to load from file: {e}")
            sys.exit(1)
    else:
        try:
            raw_records, source_url = fetch_from_ogd_api(
                api_key=args.api_key,
                resource_id=args.resource_id,
                limit=args.limit,
                state=args.state
            )
        except Exception as e:
            print(f"\n[DATA SOURCE WARNING] {e}")
            print("\n[FALLBACK DISCLOSURE] Application remains in simulated prototype mode.")
            print("To import real records when an API key is available, execute:")
            print("  python backend/scripts/import_ogd_prices.py --api-key <YOUR_OGD_KEY>")
            print("Or provide a downloaded data.gov.in CSV:")
            print("  python backend/scripts/import_ogd_prices.py --file path/to/ogd_download.csv")
            return 0

    if not raw_records:
        print("[WARNING] Zero records extracted. Target dataset not modified.")
        return 0

    df_norm = normalize_records(raw_records, source_url)
    if df_norm.empty:
        print("[WARNING] No valid price rows could be parsed. Target dataset not modified.")
        return 0

    df_norm.to_csv(args.output, index=False, encoding="utf-8")
    print(f"[SUCCESS] Wrote {len(df_norm)} verified AGMARKNET price records to {args.output}")

if __name__ == "__main__":
    main()
