import requests
from requests import JSONDecodeError

from config import API_KEY, BASE_URL


def book_hotel(data: dict):
    env = data.get("env", BASE_URL).rstrip("/")
    api_key = data.get("apiKey", API_KEY)
    booking_type = data.get("bookingType", "VOUCHER")  # "VOUCHER" or "HOLD"
    url = f"{env}/oms/v3/hotel/book"

    headers = {
        "Content-Type": "application/json",
        "apikey": api_key,
    }

    if "apitest-hms" in env:
        headers["Authorization"] = f"Bearer {api_key}"

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

    # Only include paymentInfos for Voucher (confirmed) booking
    if booking_type == "VOUCHER":
        amount = data.get("amount")
        if amount is not None:
            payload["paymentInfos"] = [{"amount": amount}]

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