import requests
from requests import JSONDecodeError

from config import OMS_BASE, DEFAULT_API_KEY, resolve_env


def fetch_booking_detail(data: dict):
    booking_id = data.get("bookingId", "")
    env = data.get("env", "https://apitest.tripjack.com/").rstrip("/")
    raw_api_key = data.get("apiKey")
    
    # 1. Try to load from saved bookings first
    saved_key = None
    try:
        from api.booking_storage import get_booking
        saved = get_booking(booking_id)
        if saved and saved.get("usedApiKey"):
            saved_key = saved.get("usedApiKey").strip()
    except Exception:
        pass

    # 2. Determine environment. The `env` field is the source of truth (a "TJ"
    #    prefix is NOT reliable — sandbox/test bookings also get TJ... ids).
    #    Fall back to the bookingId prefix only when env is ambiguous.
    env_lower = env.lower()
    if "apitest" in env_lower or "admin" in env_lower or "tripjack.com" in env_lower:
        environment = resolve_env(env_lower)
    elif booking_id.startswith("TGP"):
        environment = "sandbox"
    elif booking_id.startswith("TJ"):
        environment = "prod"
    else:
        environment = "sandbox"

    # 3. Assign URL and Key from the central config (config.py)
    BOOKING_DETAIL_URL = f"{OMS_BASE[environment]}/oms/v3/hotel/booking-details"
    if raw_api_key and raw_api_key.strip():
        BOOKING_DETAIL_APIKEY = raw_api_key.strip()
    elif saved_key:
        BOOKING_DETAIL_APIKEY = saved_key
    else:
        BOOKING_DETAIL_APIKEY = DEFAULT_API_KEY[environment]
    
    headers = {
        "Content-Type": "application/json",
        "apikey": BOOKING_DETAIL_APIKEY,
        "Authorization": "Basic YXNodS5ndXB0YUB0ZWNobm9ncmFtc29sdXRpb25zLmNvbTpUZXN0QHAhQFRHUw==",
    }

    payload = {
        "bookingId": data.get("bookingId"),
        "requireHosis": True,
    }

    response = requests.post(BOOKING_DETAIL_URL, headers=headers, json=payload)

    try:
        return response.json()
    except JSONDecodeError:
        return {
            "ok": False,
            "message": "Upstream Tripjack /hotel/booking-details did not return valid JSON",
            "status_code": response.status_code,
            "reason": response.reason,
            "url": response.url,
            "headers": dict(response.headers),
            "text": response.text,
        }
