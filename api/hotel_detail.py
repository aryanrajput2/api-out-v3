import requests
from requests import JSONDecodeError

from config import API_KEY, BASE_URL

def fetch_hotel_detail(data: dict):
    env = data.get("env", BASE_URL).rstrip("/")
    api_key = data.get("apiKey", API_KEY)
    url = f"{env}/hms/v3/hotel/pricing"

    # Body matches the curl payload shape for single hotel detail
    payload = {
        "checkIn": data["checkIn"],
        "checkOut": data["checkOut"],
        "rooms": data["rooms"],
        "currency": "INR",
        "correlationId": data["correlationId"],
        "hid": data["hid"],
    }
    
    # Add optional nationality if provided
    if data.get("nationality"):
        payload["nationality"] = data["nationality"]
    
    # Add optional timeoutMs if provided
    if data.get("timeoutMs"):
        payload["timeoutMs"] = data["timeoutMs"]

    headers = {
        "Content-Type": "application/json",
        "apikey": api_key,
        "Accept": "*/*",
        "User-Agent": "PostmanRuntime/7.39.1",
        "Accept-Encoding": "gzip, deflate, br",
        "Connection": "keep-alive",
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
