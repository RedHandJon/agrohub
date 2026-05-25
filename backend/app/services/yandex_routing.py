"""
Yandex Routing Matrix API integration.
"""

import math
import httpx
import logging
from app.core.config import settings

logger = logging.getLogger(__name__)

YANDEX_MATRIX_URL = "https://api.routing.yandex.net/v2/distancematrix"


def _haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Fallback straight-line distance in km."""
    R = 6371.0
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat / 2) ** 2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2) ** 2
    return R * 2 * math.asin(math.sqrt(a))


async def get_distance_matrix(
    origins: list[tuple[float, float]],
    destinations: list[tuple[float, float]],
) -> list[list[float]]:
    """
    Returns distance matrix in km. Uses Yandex API if key configured,
    otherwise falls back to haversine.
    """
    if not settings.YANDEX_API_KEY:
        # Fallback: straight-line distances
        matrix = []
        for lat1, lon1 in origins:
            row = [_haversine_km(lat1, lon1, lat2, lon2) for lat2, lon2 in destinations]
            matrix.append(row)
        return matrix

    origins_str = "|".join(f"{lat},{lon}" for lat, lon in origins)
    destinations_str = "|".join(f"{lat},{lon}" for lat, lon in destinations)

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(
                YANDEX_MATRIX_URL,
                params={
                    "apikey": settings.YANDEX_API_KEY,
                    "origins": origins_str,
                    "destinations": destinations_str,
                    "mode": "driving",
                },
            )
            resp.raise_for_status()
            data = resp.json()

        rows = data.get("rows", [])
        matrix = []
        for row in rows:
            distances = [elem.get("distance", {}).get("value", 0) / 1000.0 for elem in row.get("elements", [])]
            matrix.append(distances)
        return matrix
    except Exception as e:
        logger.warning(f"Yandex Routing API error: {e}. Falling back to haversine.")
        matrix = []
        for lat1, lon1 in origins:
            row = [_haversine_km(lat1, lon1, lat2, lon2) for lat2, lon2 in destinations]
            matrix.append(row)
        return matrix
