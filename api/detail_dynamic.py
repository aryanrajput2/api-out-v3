import requests
from requests import JSONDecodeError

from config import API_KEY, BASE_URL


def dynamic_detail(data: dict):
    env = data.get("env", BASE_URL).rstrip("/")
    api_key = data.get("apiKey", API_KEY)
    url = f"{env}/hms/v3/hotel/option/detail"

    headers = {
        "Content-Type": "application/json",
        "apikey": api_key,
    }

    payload = {
        "optionId": data.get("optionId")
    }
    
    # Add optional nationality if provided
    if data.get("nationality"):
        payload["nationality"] = data["nationality"]

    response = requests.post(url, headers=headers, json=payload)

    try:
        return response.json()
    except JSONDecodeError:
        return {
            "ok": False,
            "message": "Upstream Tripjack /hotel/option/detail did not return valid JSON",
            "status_code": response.status_code,
            "reason": response.reason,
            "url": response.url,
            "headers": dict(response.headers),
            "text": response.text,
        }