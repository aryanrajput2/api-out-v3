from fastapi import HTTPException
import httpx
import logging

logger = logging.getLogger(__name__)

def fetch_hotel_static_detail(data: dict):
    env = data.get("env", "https://tj-hotel-admin.tripjack.com/")
    api_key = data.get("apiKey", "")
    tripjack_id = data.get("TripjackID")

    if not tripjack_id:
        raise HTTPException(status_code=400, detail="TripjackID is required")

    headers = {
        "Content-Type": "application/json",
        "apikey": api_key,
    }

    url = f"{env}hms/v3/hotel/static-detail"
    
    payload = {
        "TripjackID": tripjack_id
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
