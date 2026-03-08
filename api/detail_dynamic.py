import requests
from requests import JSONDecodeError

from config import API_KEY, BASE_URL


def dynamic_detail(option_id: str):
    url = f"{BASE_URL}hms/v3/hotel/option/detail"

    headers = {
        "Content-Type": "application/json",
        "apikey": API_KEY,
    }

    payload = {"optionId": option_id}

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