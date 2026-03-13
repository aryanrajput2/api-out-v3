from fastapi import HTTPException
import httpx
import logging

logger = logging.getLogger(__name__)

def fetch_hotel_static_detail(data: dict):
    env = data.get("env", "https://tj-hotel-admin.tripjack.com/")
    api_key = data.get("apiKey", "")
    hid = data.get("hid") or data.get("TripjackID")

    if not hid:
        raise HTTPException(status_code=400, detail="hid is required")

    headers = {
        "Content-Type": "application/json",
        "apikey": api_key,
    }

    url = f"{env}hms/v3/hotel/static-detail"
    
    payload = {
        "hid": hid
    }

    try:
        response = httpx.post(url, json=payload, headers=headers, timeout=20.0)
        return response.json()
    except httpx.HTTPError as e:
        logger.error(f"HTTP Exception for static detail: {e}")
        return {"ok": False, "error": str(e), "message": "Failed to connect to Tripjack API"}
    except Exception as e:
        logger.error(f"General Exception for static detail: {e}")
        return {"ok": False, "error": str(e), "message": "An unexpected error occurred"}
