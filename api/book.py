import requests
from requests import JSONDecodeError

from config import API_KEY, BASE_URL
from api.request_logger import log_api_call


def book_hotel(data: dict):
    booking_type = data.get("bookingType", "VOUCHER")  # "VOUCHER" or "HOLD"
    
    # Get environment from request data
    env = data.get("env", "").lower().rstrip("/")
    
    # Determine the correct book URL and API key based on environment
    raw_api_key = data.get("apiKey")
    
    # Check if it's Admin TJ environment
    if "hmsbk-admin" in env or "admin.tripjack" in env or "tj-hotel-admin" in env:
        # Admin TJ environment
        BOOK_URL = "https://hotel-booker.tripjack.com/oms/v3/hotel/book"
        BOOK_APIKEY = raw_api_key.strip() if (raw_api_key and raw_api_key.strip()) else "751045f64b362c-7462-4f82-ad59-0a9c2b9b9fc9"
        BOOK_AUTH = "Basic YXNodS5ndXB0YUB0ZWNobm9ncmFtc29sdXRpb25zLmNvbTpUZXN0QHAhQFRHUw=="
    elif "tripjack.com" in env and "apitest" not in env:
        # Prod Tripjack environment
        BOOK_URL = "https://hotel-booker.tripjack.com/oms/v3/hotel/book"
        BOOK_APIKEY = raw_api_key.strip() if (raw_api_key and raw_api_key.strip()) else "751045f64b362c-7462-4f82-ad59-0a9c2b9b9fc9"
        BOOK_AUTH = "Basic YXNodS5ndXB0YUB0ZWNobm9ncmFtc29sdXRpb25zLmNvbTpUZXN0QHAhQFRHUw=="
    else:
        # API Test Server (Sandbox) (default for all other envs)
        BOOK_URL = "https://apitest-hotel-booker.tripjack.com/oms/v3/hotel/book"
        BOOK_APIKEY = raw_api_key.strip() if (raw_api_key and raw_api_key.strip()) else "6116982da6b759-28f8-4cdf-b210-04cb98116165"
        BOOK_AUTH = "Basic YXNodS5ndXB0YUB0ZWNobm9ncmFtc29sdXRpb25zLmNvbTpUZXN0QHAhQFRHUw=="
    
    url = BOOK_URL

    headers = {
        "Content-Type": "application/json",
        "apikey": BOOK_APIKEY,
        "Authorization": BOOK_AUTH,
    }

    # Build roomTravellerInfo from the travellers array passed by frontend
    travellers = data.get("travellers", [])
    room_traveller_info = []
    # Group travellers by room index
    rooms_map = {}
    for t in travellers:
        room_idx = t.get("roomIndex", 0)
        if room_idx not in rooms_map:
            rooms_map[room_idx] = []
        # Enforce child title: must be Master or Miss only (Tripjack API requirement)
        pax_type = t.get("paxType", "ADULT")
        title = t.get("title", "Mr")
        if pax_type == "CHILD" and title not in ("Master", "Miss"):
            title = "Master"

        traveller_entry = {
            "ti": title,
            "pt": pax_type,
            "fN": t.get("firstName", ""),
            "lN": t.get("lastName", ""),
        }
        if t.get("pan"):
            traveller_entry["pan"] = t["pan"]
        if t.get("passportNumber"):
            traveller_entry["pNum"] = t["passportNumber"]
        rooms_map[room_idx].append(traveller_entry)

    for room_idx in sorted(rooms_map.keys()):
        room_traveller_info.append({"travellerInfo": rooms_map[room_idx]})

    delivery_info = data.get("deliveryInfo", {})

    payload = {
        "bookingId": data.get("bookingId"),
        "roomTravellerInfo": room_traveller_info,
        "deliveryInfo": {
            "emails": delivery_info.get("emails", []),
            "contacts": delivery_info.get("contacts", []),
            "code": delivery_info.get("codes", ["+91"]),
        },
        "type": "HOTEL",
    }
    
    # Add correlationId if provided
    if data.get("correlationId"):
        payload["correlationId"] = data.get("correlationId")

    # Add gstInfo if provided
    gst_info = data.get("gstInfo")
    if gst_info:
        payload["gstInfo"] = {
            "gstNumber": gst_info.get("gstNumber", "").strip(),
            "registeredName": gst_info.get("registeredName", "").strip()
        }

    # Only include paymentInfos for Voucher (confirmed) booking
    if booking_type == "VOUCHER":
        amount = data.get("amount")
        if amount is not None:
            payload["paymentInfos"] = [{"amount": amount}]
    
    response = requests.post(url, headers=headers, json=payload)

    try:
        result = response.json()
        
        # If booking was successful, save it to persistent storage
        # V3 Response structure check
        is_success = result.get("ok") or (result.get("status", {}).get("success") is True)
        booking_id = result.get("bookingId") or result.get("order", {}).get("bookingId")
        
        if is_success and booking_id:
            result["usedApiKey"] = BOOK_APIKEY
            from api.booking_storage import add_booking
            add_booking(booking_id, result)
        
        return result
    except JSONDecodeError:
        return {
            "ok": False,
            "message": "Upstream Tripjack /hotel/book did not return valid JSON",
            "status_code": response.status_code,
            "reason": response.reason,
            "url": response.url,
            "headers": dict(response.headers),
            "text": response.text,
        }
