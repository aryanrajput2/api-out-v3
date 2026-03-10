import requests
from requests import JSONDecodeError

from config import API_KEY, BASE_URL


def review_hotel(data: dict):
    env = data.get("env", BASE_URL).rstrip("/")
    api_key = data.get("apiKey", API_KEY)
    url = f"{env}/hms/v3/hotel/review"

    headers = {
        "Content-Type": "application/json",
        "apikey": api_key,
    }
    
    if "apitest-hms" in env:
        headers["Authorization"] = f"Bearer {api_key}"

    payload = {
        "optionId": data["optionId"],
        "correlationId": data["correlationId"],
    }
    if "hotelId" in data and data["hotelId"]:
        payload["hotelId"] = data["hotelId"]
        
    if "reviewHash" in data and data["reviewHash"]:
        payload["reviewHash"] = data["reviewHash"]
        
    if "currency" in data:
        payload["currency"] = data["currency"]

    response = requests.post(url, headers=headers, json=payload)

    try:
        return response.json()
    except JSONDecodeError:
        return {
            "ok": False,
            "message": "Upstream Tripjack /hotel/review did not return valid JSON",
            "status_code": response.status_code,
            "reason": response.reason,
            "url": response.url,
            "headers": dict(response.headers),
            "text": response.text,
        }