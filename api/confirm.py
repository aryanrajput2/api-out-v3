import requests
from config import oms_base, default_key

def confirm_booking(data: dict):
    env = data.get("env", "").lower().rstrip("/")
    raw_api_key = data.get("apiKey")

    # URL + key resolved from the central config (config.py)
    CONFIRM_URL = f"{oms_base(env)}/oms/v3/hotel/confirm-book"
    CONFIRM_APIKEY = raw_api_key.strip() if (raw_api_key and raw_api_key.strip()) else default_key(env)
    
    # Optional authorization header, often used alongside apikey in Tripjack V3
    BOOK_AUTH = "Basic YXNodS5ndXB0YUB0ZWNobm9ncmFtc29sdXRpb25zLmNvbTpUZXN0QHAhQFRHUw=="

    headers = {
        "Content-Type": "application/json",
        "apikey": CONFIRM_APIKEY,
        "Authorization": BOOK_AUTH,
    }

    amount = data.get("amount")
    
    payload = {
        "bookingId": data.get("bookingId"),
        "paymentInfos": [
            {
                "amount": float(amount) if amount is not None else 0.0
            }
        ]
    }
    
    try:
        response = requests.post(CONFIRM_URL, headers=headers, json=payload)
        return response.json()
    except requests.JSONDecodeError:
        return {"error": "Failed to decode response from Tripjack Confirm API", "status_code": response.status_code, "raw_response": response.text}
    except Exception as e:
        return {"error": str(e), "message": "An error occurred during the confirm-book request"}
