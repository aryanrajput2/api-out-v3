import requests
from requests import JSONDecodeError

from config import API_KEY, BASE_URL

def search_hotels(data: dict):
    env = data.get("env", BASE_URL).rstrip("/")
    api_key = data.get("apiKey", API_KEY)
    url = f"{env}/hms/v3/hotel/listing"

    # Body matches your working curl payload shape
    payload = {
        "checkIn": data["checkIn"],
        "checkOut": data["checkOut"],
        "rooms": data["rooms"],
        "currency": "INR",
        "correlationId": data["correlationId"],
        "hids": data["hids"],
    }

    # Headers as in curl/Postman
    headers = {
        "Content-Type": "application/json",
        "apikey": api_key,
        "Accept": "*/*",
        "User-Agent": "PostmanRuntime/7.39.1",
        "Accept-Encoding": "gzip, deflate, br",
        "Connection": "keep-alive",
    }
    
    # API Test Server frequently requires Authorization instead of/alongside apikey
    if "apitest-hms" in env:
        headers["Authorization"] = f"Bearer {api_key}"

    response = requests.post(url, headers=headers, json=payload)

    try:
        return response.json()
    except JSONDecodeError:
        # Surface the *actual* upstream response so you can see it in DevTools
        return {
            "ok": False,
            "message": "Upstream Tripjack /hotel/listing did not return valid JSON",
            "status_code": response.status_code,
            "reason": response.reason,
            "url": response.url,
            "headers": dict(response.headers),
            "text": response.text,
        }