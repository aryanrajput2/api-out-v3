import requests
from requests import JSONDecodeError

from config import API_KEY, BASE_URL


def cancel_booking(data: dict):
    env = data.get("env", BASE_URL).rstrip("/")
    api_key = data.get("apiKey", API_KEY)
    url = f"{env}/hms/v3/booking/cancel"

    headers = {
        "Content-Type": "application/json",
        "apikey": api_key,
    }
    
    if "apitest-hms" in env:
        headers["Authorization"] = f"Bearer {api_key}"

    response = requests.post(url, headers=headers, json=data)

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