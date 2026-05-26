import requests
from config import API_KEY, BASE_URL

def confirm_booking(data: dict):
    env = data.get("env", "").lower().rstrip("/")
    raw_api_key = data.get("apiKey")
    
    # Determine the correct confirm URL and API key based on environment
    if "hmsbk-admin" in env or "admin.tripjack" in env or "tj-hotel-admin" in env:
        # Admin TJ environment
        CONFIRM_URL = "https://hotel-booker.tripjack.com/oms/v3/hotel/confirm-book"
        CONFIRM_APIKEY = raw_api_key.strip() if (raw_api_key and raw_api_key.strip()) else "751045f64b362c-7462-4f82-ad59-0a9c2b9b9fc9"
    elif "tripjack.com" in env and "apitest" not in env:
        # Prod Tripjack environment
        CONFIRM_URL = "https://hotel-booker.tripjack.com/oms/v3/hotel/confirm-book"
        CONFIRM_APIKEY = raw_api_key.strip() if (raw_api_key and raw_api_key.strip()) else "751045f64b362c-7462-4f82-ad59-0a9c2b9b9fc9"
    else:
        # API Test Server (Sandbox) (default for all other envs)
        CONFIRM_URL = "https://apitest-hotel-booker.tripjack.com/oms/v3/hotel/confirm-book"
        CONFIRM_APIKEY = raw_api_key.strip() if (raw_api_key and raw_api_key.strip()) else "6116982da6b759-28f8-4cdf-b210-04cb98116165"
    
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
