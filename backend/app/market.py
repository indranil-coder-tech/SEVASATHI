from app.gov_mandi_service import gov_mandi_service
from app.models import (
    CropOption,
    MandiOption,
    MarketHierarchyResponse,
    MarketPriceResponse,
)


class MarketService:
    """
    MarketService orchestrates genuine government AGMARKNET market intelligence
    via GovMandiService. Ensures no silent cross-market fallbacks and uses genuine
    observations from data.gov.in.
    """

    def __init__(self):
        self.gov_service = gov_mandi_service

    def get_crops(self) -> list[CropOption]:
        return self.gov_service.get_crops()

    def get_mandis(self) -> list[MandiOption]:
        return self.gov_service.get_mandis()

    def get_filter_hierarchy(
        self,
        state: str | None = "Maharashtra",
        district: str | None = None,
        market: str | None = None,
        commodity: str | None = None,
    ) -> MarketHierarchyResponse:
        return self.gov_service.get_filter_hierarchy(
            state=state, district=district, market=market, commodity=commodity
        )

    def get_market_data(
        self,
        crop: str | None = None,
        mandi_id: str | None = None,
        state: str | None = None,
        district: str | None = None,
        market: str | None = None,
        commodity: str | None = None,
        variety: str | None = None,
        time_range: str = "30d",
        forecast_days: int = 7,
        mode: str = "live",
    ) -> MarketPriceResponse:
        return self.gov_service.get_market_data(
            crop=crop,
            mandi_id=mandi_id,
            state=state,
            district=district,
            market=market,
            commodity=commodity,
            variety=variety,
            time_range=time_range,
            forecast_days=forecast_days,
            mode=mode,
        )


market_service = MarketService()
