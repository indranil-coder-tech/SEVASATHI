import os

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware

from app.calculator import evaluate_sell_or_store
from app.market import market_service
from app.models import (
    CalculatorRequest,
    CalculatorResponse,
    CropOption,
    DataSourceRecord,
    MandiOption,
    MarketHierarchyResponse,
    MarketPriceResponse,
    MidhStagingResponse,
    MidhStagingSummary,
    StateAggregateResponse,
    StorageSearchResponse,
)
from app.storage import storage_service

app = FastAPI(
    title="SevaSathi API",
    description="Backend API for SevaSathi — Agricultural Decision Support Platform",
    version="1.1.0",
)

# Configure allowed CORS origins from environment (prevent wildcard with credentials)
allowed_origins_env = os.getenv("ALLOWED_ORIGINS", "").strip()
if allowed_origins_env == "*":
    allowed_origins = ["*"]
    allow_credentials = False
elif allowed_origins_env:
    allowed_origins = [o.strip() for o in allowed_origins_env.split(",") if o.strip()]
    allow_credentials = True
else:
    allowed_origins = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:4173",
        "http://127.0.0.1:4173",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
    ]
    allow_credentials = True

# Also allow cloud staging/preview origins (Vercel, Render, Railway, Netlify) when in default dev/preview mode
allow_origin_regex = (
    os.getenv(
        "ALLOWED_ORIGIN_REGEX",
        r"https://.*(vercel\.app|netlify\.app|onrender\.com|railway\.app)",
    )
    if not allowed_origins_env
    else None
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_origin_regex=allow_origin_regex,
    allow_credentials=allow_credentials,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/", tags=["Health"])
def root():
    return {
        "status": "online",
        "service": "SevaSathi Agricultural Decision Engine API",
        "version": "1.1.0",
        "docs": "/docs",
        "health": "/api/health",
    }


@app.get("/api/health", tags=["Health"])
def health_check():
    return {
        "status": "healthy",
        "service": "SevaSathi Agricultural Decision Engine",
        "pilot_region": "Maharashtra, India",
        "benchmark_mandi": "Lasalgaon (Nashik)",
        "data_source": "Official data.gov.in AGMARKNET feed",
    }


@app.get(
    "/api/market/crops", response_model=list[CropOption], tags=["Market Intelligence"]
)
def get_crops():
    return market_service.get_crops()


@app.get(
    "/api/market/mandis", response_model=list[MandiOption], tags=["Market Intelligence"]
)
def get_mandis():
    return market_service.get_mandis()


@app.get(
    "/api/market/hierarchy",
    response_model=MarketHierarchyResponse,
    tags=["Market Intelligence"],
)
@app.get(
    "/api/market/filters",
    response_model=MarketHierarchyResponse,
    tags=["Market Intelligence"],
)
def get_market_hierarchy(
    state: str | None = Query("Maharashtra", description="State name"),
    district: str | None = Query(None, description="District name"),
    market: str | None = Query(None, description="Mandi/APMC name"),
    commodity: str | None = Query(None, description="Commodity name"),
):
    try:
        return market_service.get_filter_hierarchy(
            state=state, district=district, market=market, commodity=commodity
        )
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to load market hierarchy: {e!s}"
        )


@app.get(
    "/api/market/prices",
    response_model=MarketPriceResponse,
    tags=["Market Intelligence"],
)
def get_market_prices(
    crop: str | None = Query(None, description="Crop identifier (legacy), e.g. onion"),
    mandi: str | None = Query(
        None, description="Mandi identifier (legacy), e.g. lasalgaon"
    ),
    state: str | None = Query(None, description="State filter e.g. Maharashtra"),
    district: str | None = Query(None, description="District filter e.g. Nashik"),
    market: str | None = Query(None, description="Mandi name e.g. Lasalgaon(Vinchur)"),
    commodity: str | None = Query(None, description="Commodity filter e.g. Onion"),
    variety: str | None = Query(None, description="Variety filter"),
    range: str = Query("30d", description="Historical range: 7d, 30d, 90d"),
    forecast_days: int = Query(7, ge=3, le=14, description="Forecast horizon in days"),
    mode: str = Query(
        "live", description="Data path: 'live' (official AGMARKNET) or 'demo'"
    ),
):
    try:
        return market_service.get_market_data(
            crop=crop,
            mandi_id=mandi,
            state=state,
            district=district,
            market=market,
            commodity=commodity,
            variety=variety,
            time_range=range,
            forecast_days=forecast_days,
            mode=mode,
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.get(
    "/api/storage/facilities",
    response_model=StorageSearchResponse,
    tags=["Storage Finder"],
)
def search_facilities(
    mode: str = Query(
        "auto",
        description="Location resolution mode: 'text', 'coordinates', 'auto', or 'demo'",
    ),
    lat: float | None = Query(None, ge=-90.0, le=90.0, description="Latitude from GPS"),
    lng: float | None = Query(
        None, ge=-180.0, le=180.0, description="Longitude from GPS"
    ),
    query: str | None = Query(
        None, description="Village, town, PIN code, or district name"
    ),
    crop: str | None = Query(None, description="Crop filter e.g. onion"),
    type: str | None = Query(None, description="Facility type filter"),
    radius_km: float | None = Query(
        25.0, gt=0, le=2000.0, description="Search radius in kilometers"
    ),
    max_results: int = Query(15, ge=1, le=50),
):
    if mode == "coordinates":
        if lat is None or lng is None:
            raise HTTPException(
                status_code=422,
                detail="Both 'lat' and 'lng' query parameters are required when mode='coordinates'",
            )
    try:
        return storage_service.search_facilities(
            mode=mode,
            lat=lat,
            lng=lng,
            query=query,
            crop_filter=crop,
            type_filter=type,
            radius_km=radius_km,
            max_results=max_results,
        )
    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Storage query error: {e!s}")


@app.get(
    "/api/storage/state-aggregate",
    response_model=StateAggregateResponse,
    tags=["Storage Intelligence"],
)
def get_statewise_aggregates():
    try:
        return storage_service.get_statewise_aggregates()
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to load state aggregates: {e!s}"
        )


@app.get(
    "/api/data-sources",
    response_model=list[DataSourceRecord],
    tags=["Provenance & Transparency"],
)
def get_data_sources():
    try:
        return storage_service.get_data_sources()
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to load data sources: {e!s}"
        )


@app.get(
    "/api/storage/staging/summary",
    response_model=MidhStagingSummary,
    tags=["MIDH Historical Staging"],
)
def get_midh_staging_summary():
    try:
        return storage_service.get_midh_staging_summary()
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to load MIDH staging summary: {e!s}"
        )


@app.get(
    "/api/storage/staging/midh-projects",
    response_model=MidhStagingResponse,
    tags=["MIDH Historical Staging"],
)
def get_midh_staging_projects(
    district: str | None = Query(
        None, description="Filter by normalized district name"
    ),
    financial_year: str | None = Query(
        None, description="Filter by financial year e.g. 2012-13"
    ),
    query: str | None = Query(
        None, description="Search by beneficiary name, taluka, or PIN"
    ),
    flag_filter: str | None = Query(
        None, description="'clean', 'flagged', or 'duplicate'"
    ),
    limit: int = Query(200, ge=1, le=500),
    offset: int = Query(0, ge=0),
):
    try:
        return storage_service.get_midh_staging_projects(
            district=district,
            financial_year=financial_year,
            query=query,
            flag_filter=flag_filter,
            limit=limit,
            offset=offset,
        )
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to query MIDH staging projects: {e!s}"
        )


@app.post(
    "/api/calculator/evaluate",
    response_model=CalculatorResponse,
    tags=["Sell-or-Store Calculator"],
)
def calculate_strategies(payload: CalculatorRequest):
    try:
        return evaluate_sell_or_store(payload)
    except Exception as e:
        raise HTTPException(status_code=422, detail=f"Calculation error: {e!s}")


if __name__ == "__main__":
    import uvicorn

    host = os.getenv("HOST", "0.0.0.0")
    port = int(os.getenv("PORT", "8000"))
    uvicorn.run("app.main:app", host=host, port=port, reload=False)
