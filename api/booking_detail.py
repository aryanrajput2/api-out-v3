import requests
from requests import JSONDecodeError


def fetch_booking_detail(data: dict):
    # Get environment from request data, default to apitest
    env = data.get("env", "https://apitest.tripjack.com/").rstrip("/")
    
    # Determine the correct booking detail URL and API key based on environment
    if "admin" in env.lower() or "hmsbk-admin" in env.lower():
        # Admin TJ environment - use Prod Tripjack endpoint
        BOOKING_DETAIL_URL = "https://tripjack.com/oms/v3/hotel/booking-details"
        BOOKING_DETAIL_APIKEY = data.get("apiKey", "6116982da6b759-28f8-4cdf-b210-04cb98116165")
    else:
        # API Test Server (Sandbox) - use v3
        BOOKING_DETAIL_URL = "https://apitest.tripjack.com/oms/v3/hotel/booking-details"
        BOOKING_DETAIL_APIKEY = "6116982da6b759-28f8-4cdf-b210-04cb98116165"
    
    headers = {
        "Content-Type": "application/json",
        "apikey": BOOKING_DETAIL_APIKEY,
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
