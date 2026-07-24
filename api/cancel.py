import time
import requests
from requests import JSONDecodeError

from config import oms_base, default_key, is_transient_auth_failure

# Tripjack's sandbox intermittently rejects the first cancel with a transient
# 401 "Invalid API key", then accepts an identical retry seconds later. A 401
# is rejected at auth (no cancellation happens upstream), so retrying is safe.
_MAX_ATTEMPTS = 3
_RETRY_DELAY_S = 1.5


def cancel_booking(data: dict):
    # Get environment from request data
    env = data.get("env", "").lower().rstrip("/")
    booking_id = data.get("bookingId")
    raw_api_key = data.get("apiKey")

    # URL + key resolved from the central config (config.py)
    CANCEL_URL = f"{oms_base(env)}/oms/v3/hotel/cancel-booking/{booking_id}"
    CANCEL_APIKEY = raw_api_key.strip() if (raw_api_key and raw_api_key.strip()) else default_key(env)

    # apikey-only auth (see book.py). No hardcoded Authorization: Basic.
    headers = {
        "Content-Type": "application/json",
        "apikey": CANCEL_APIKEY,
    }

    last_result = None
    for attempt in range(1, _MAX_ATTEMPTS + 1):
        # The documentation shows an empty POST request or minimal payload
        response = requests.post(CANCEL_URL, headers=headers, json={})

        try:
            result = response.json()
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

        # Retry only the transient first-attempt 401; return anything else as-is.
        if attempt < _MAX_ATTEMPTS and is_transient_auth_failure(result):
            last_result = result
            time.sleep(_RETRY_DELAY_S)
            continue

        return result

    return last_result