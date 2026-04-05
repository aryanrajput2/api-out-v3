import requests
from requests import JSONDecodeError

from config import API_KEY, BASE_URL


def dynamic_detail(data: dict):
    env = data.get("env", BASE_URL).rstrip("/")
    api_key = data.get("apiKey", API_KEY)
    url = f"{env}/hms/v3/hotel/pricing"

    headers = {
        "Content-Type": "application/json",
        "apikey": api_key,
    }

    payload = {
        "correlationId": data.get("correlationId"),
        "hid": data.get("hid"),
        "checkIn": data.get("checkIn"),
        "checkOut": data.get("checkOut"),
        "rooms": data.get("rooms"),
        "currency": data.get("currency", "INR"),
        "nationality": data.get("nationality", "106"),
        "timeoutMs": data.get("timeoutMs", 30000)
    }

    response = requests.post(url, headers=headers, json=payload)

    try:
        return response.json()
    except JSONDecodeError:
        return {
            "ok": False,
            "message": "Upstream Tripjack /hotel/pricing did not return valid JSON",
            "status_code": response.status_code,
            "reason": response.reason,
            "url": response.url,
            "headers": dict(response.headers),
            "text": response.text,
        }