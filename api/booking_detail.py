import requests
from requests import JSONDecodeError


# Fixed booking detail URL — always use apitest.tripjack.com
BOOKING_DETAIL_URL = "https://apitest.tripjack.com/oms/v1/hotel/booking-details"
BOOKING_DETAIL_APIKEY = "6116982da6b759-28f8-4cdf-b210-04cb98116165"


def fetch_booking_detail(data: dict):
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