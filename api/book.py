import requests
from requests import JSONDecodeError

from config import API_KEY, BASE_URL


def book_hotel(data: dict):
    booking_type = data.get("bookingType", "VOUCHER")  # "VOUCHER" or "HOLD"
    
    # Get environment from request data
    env = data.get("env", "").lower().rstrip("/")
    
    # Determine the correct book URL and API key based on environment
    # Check if it's Admin TJ environment
    if "hmsbk-admin" in env or "admin.tripjack" in env or "tj-hotel-admin" in env:
        # Admin TJ environment
        BOOK_URL = "https://hmsbk-admin.tripjack.com/oms/v3/hotel/book"
        BOOK_APIKEY = data.get("apiKey", "7510455af381d5-d315-41e2-8e5e-e94cc0a960fe")
        BOOK_AUTH = "Basic YXNodS5ndXB0YUB0ZWNobm9ncmFtc29sdXRpb25zLmNvbTpUZXN0QHAhQFRHUw=="
        print(f"📤 Using Admin TJ Book URL: {BOOK_URL}")
    else:
        # API Test Server (Sandbox) - HARDCODED (default for all other envs)
        BOOK_URL = "https://apitest.tripjack.com/oms/v3/hotel/book"
        BOOK_APIKEY = "6116982da6b759-28f8-4cdf-b210-04cb98116165"
        BOOK_AUTH = "Basic YXNodS5ndXB0YUB0ZWNobm9ncmFtc29sdXRpb25zLmNvbTpUZXN0QHAhQFRHUw=="
        print(f"📤 Using API Test Server Book URL: {BOOK_URL}")
        print(f"   (Env was: {env})")
    
    url = BOOK_URL

    headers = {
        "Content-Type": "application/json",
        "apikey": BOOK_APIKEY,
        "Authorization": BOOK_AUTH,
    }
    
    print(f"📦 Booking Request - Type: {booking_type}, URL: {url}")

    # Build roomTravellerInfo from the travellers array passed by frontend
    travellers = data.get("travellers", [])
    room_traveller_info = []
    # Group travellers by room index
    rooms_map = {}
    for t in travellers:
        room_idx = t.get("roomIndex", 0)
        if room_idx not in rooms_map:
            rooms_map[room_idx] = []
        traveller_entry = {
            "ti": t.get("title", "Mr"),
            "pt": t.get("paxType", "ADULT"),
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
        print(f"✓ Correlation ID added: {data.get('correlationId')}")

    # Only include paymentInfos for Voucher (confirmed) booking
    if booking_type == "VOUCHER":
        amount = data.get("amount")
        if amount is not None:
            payload["paymentInfos"] = [{"amount": amount}]

    print(f"📤 Final Payload Sent to Book API:")
    print(f"📦 {payload}")
    
    response = requests.post(url, headers=headers, json=payload)

    try:
        return response.json()
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
