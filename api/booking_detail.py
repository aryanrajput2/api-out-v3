import requests
from requests import JSONDecodeError


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

    # 2. Determine environment based on bookingId prefix or env string
    is_sandbox = True
    if booking_id.startswith("TGP"):
        is_sandbox = True
    elif booking_id.startswith("TJ") or "admin" in env.lower() or "hmsbk-admin" in env.lower() or ("tripjack.com" in env.lower() and "apitest" not in env.lower()):
        is_sandbox = False

    # 3. Assign URL and Key
    if is_sandbox:
        BOOKING_DETAIL_URL = "https://apitest-hotel-booker.tripjack.com/oms/v3/hotel/booking-details"
        if raw_api_key and raw_api_key.strip():
            BOOKING_DETAIL_APIKEY = raw_api_key.strip()
        elif saved_key:
            BOOKING_DETAIL_APIKEY = saved_key
        else:
            BOOKING_DETAIL_APIKEY = "6116982da6b759-28f8-4cdf-b210-04cb98116165"
    else:
        BOOKING_DETAIL_URL = "https://hotel-booker.tripjack.com/oms/v3/hotel/booking-details"
        if raw_api_key and raw_api_key.strip():
            BOOKING_DETAIL_APIKEY = raw_api_key.strip()
        elif saved_key:
            BOOKING_DETAIL_APIKEY = saved_key
        else:
            BOOKING_DETAIL_APIKEY = "751045f64b362c-7462-4f82-ad59-0a9c2b9b9fc9"
    
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
