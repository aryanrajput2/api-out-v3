import requests
from requests import JSONDecodeError

from config import API_KEY, BASE_URL


def cancel_booking(data: dict):
    # Get environment from request data
    env = data.get("env", "").lower().rstrip("/")
    booking_id = data.get("bookingId")
    
    # Determine the correct cancel URL and API key based on environment
    raw_api_key = data.get("apiKey")
    
    if "hmsbk-admin" in env or "admin.tripjack" in env or "tj-hotel-admin" in env:
        # Admin TJ environment
        CANCEL_URL = f"https://hotel-booker.tripjack.com/oms/v3/hotel/cancel-booking/{booking_id}"
        CANCEL_APIKEY = raw_api_key.strip() if (raw_api_key and raw_api_key.strip()) else "751045f64b362c-7462-4f82-ad59-0a9c2b9b9fc9"
    elif "tripjack.com" in env and "apitest" not in env:
        # Prod Tripjack environment
        CANCEL_URL = f"https://hotel-booker.tripjack.com/oms/v3/hotel/cancel-booking/{booking_id}"
        CANCEL_APIKEY = raw_api_key.strip() if (raw_api_key and raw_api_key.strip()) else "751045f64b362c-7462-4f82-ad59-0a9c2b9b9fc9"
    else:
        # API Test Server (Sandbox)
        CANCEL_URL = f"https://apitest-hotel-booker.tripjack.com/oms/v3/hotel/cancel-booking/{booking_id}"
        CANCEL_APIKEY = raw_api_key.strip() if (raw_api_key and raw_api_key.strip()) else "6116982da6b759-28f8-4cdf-b210-04cb98116165"
    
    headers = {
        "Content-Type": "application/json",
        "apikey": CANCEL_APIKEY,
        "Authorization": "Basic YXNodS5ndXB0YUB0ZWNobm9ncmFtc29sdXRpb25zLmNvbTpUZXN0QHAhQFRHUw==",
    }

    # The documentation shows an empty POST request or minimal payload
    response = requests.post(CANCEL_URL, headers=headers, json={})

    try:
        return response.json()
    except JSONDecodeError:
        return {
            "ok": False,
            "message": "Upstream Tripjack /booking/cancel did not return valid JSON",
            "status_code": response.status_code,
            "reason": response.reason,
            "url": response.url,
            "headers": dict(response.headers),
            "text": response.text,
        }