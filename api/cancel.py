import requests
from requests import JSONDecodeError

from config import oms_base, default_key


def cancel_booking(data: dict):
    # Get environment from request data
    env = data.get("env", "").lower().rstrip("/")
    booking_id = data.get("bookingId")
    raw_api_key = data.get("apiKey")

    # URL + key resolved from the central config (config.py)
    CANCEL_URL = f"{oms_base(env)}/oms/v3/hotel/cancel-booking/{booking_id}"
    CANCEL_APIKEY = raw_api_key.strip() if (raw_api_key and raw_api_key.strip()) else default_key(env)
    
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