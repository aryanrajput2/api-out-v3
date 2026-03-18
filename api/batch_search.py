import asyncio
import requests
from requests import JSONDecodeError
from config import API_KEY, BASE_URL

async def search_hotels_batch(data: dict):
    """
    Search hotels using hotel codes from a file.
    Splits codes into batches of 100 and sends parallel requests.
    Each batch gets a unique correlation ID: search_{location}_{batch_number}
    """
    env = data.get("env", BASE_URL).rstrip("/")
    api_key = data.get("apiKey", API_KEY)
    url = f"{env}/hms/v3/hotel/listing"
    
    # Get hotel codes from the request
    hotel_codes = data.get("hotelCodes", [])
    location = data.get("location", "unknown").lower()
    
    if not hotel_codes:
        return {
            "ok": False,
            "message": "No hotel codes provided",
        }
    
    # Split into batches of 100
    batch_size = 100
    batches = [hotel_codes[i:i + batch_size] for i in range(0, len(hotel_codes), batch_size)]
    
    # Prepare headers
    headers = {
        "Content-Type": "application/json",
        "apikey": api_key,
        "Accept": "*/*",
        "User-Agent": "PostmanRuntime/7.39.1",
        "Accept-Encoding": "gzip, deflate, br",
        "Connection": "keep-alive",
    }
    
    # Create tasks for parallel requests
    async def fetch_batch(batch_hids, batch_number):
        # Generate correlation ID: search_{location}_{batch_number}
        correlation_id = f"search_{location}_{batch_number}"
        
        # Convert hotel IDs to strings if they're integers
        hids = [str(h) if isinstance(h, int) else h for h in batch_hids]
        
        payload = {
            "checkIn": data["checkIn"],
            "checkOut": data["checkOut"],
            "rooms": data["rooms"],
            "currency": data.get("currency", "INR"),
            "correlationId": correlation_id,
            "hids": hids,
        }
        
        # Add optional nationality if provided
        if data.get("nationality"):
            payload["nationality"] = data["nationality"]
            print(f"✓ Batch {batch_number}: Nationality added: {data['nationality']}")
        
        # Add optional timeoutMs if provided
        if data.get("timeoutMs"):
            payload["timeoutMs"] = data["timeoutMs"]
            print(f"✓ Batch {batch_number}: TimeoutMs added: {data['timeoutMs']}")
        
        print(f"📤 Batch {batch_number}: Sending to {url}")
        print(f"📦 Batch {batch_number} Payload: {payload}")
        
        try:
            response = requests.post(url, headers=headers, json=payload, timeout=60)
            
            # Try to parse JSON regardless of status code
            # The API might return JSON error messages even with 403
            try:
                result = response.json()
                result["_batch_info"] = {
                    "batch_number": batch_number,
                    "correlation_id": correlation_id,
                    "hotel_count": len(batch_hids)
                }
                return result
            except JSONDecodeError:
                # If JSON parsing fails, return error with status code
                return {
                    "ok": False,
                    "message": f"API returned status {response.status_code} for batch {batch_number}",
                    "status_code": response.status_code,
                    "reason": response.reason,
                    "response_text": response.text[:200],
                    "_batch_info": {
                        "batch_number": batch_number,
                        "correlation_id": correlation_id,
                        "hotel_count": len(batch_hids)
                    }
                }
        except requests.exceptions.Timeout:
            return {
                "ok": False,
                "message": f"Request timeout for batch {batch_number}. API server is slow.",
                "status_code": 504,
                "_batch_info": {
                    "batch_number": batch_number,
                    "correlation_id": correlation_id,
                    "hotel_count": len(batch_hids)
                }
            }
        except Exception as e:
            return {
                "ok": False,
                "message": f"Error processing batch {batch_number}: {str(e)}",
                "_batch_info": {
                    "batch_number": batch_number,
                    "correlation_id": correlation_id,
                    "hotel_count": len(batch_hids)
                }
            }
    
    # Execute all batch requests in parallel
    tasks = [fetch_batch(batch, idx + 1) for idx, batch in enumerate(batches)]
    results = await asyncio.gather(*tasks)
    
    # Merge results
    merged_result = {
        "ok": True,
        "hotels": [],
        "batches_processed": len(batches),
        "total_hotels_searched": len(hotel_codes),
        "batch_details": []
    }
    
    for result in results:
        batch_info = result.pop("_batch_info", {})
        merged_result["batch_details"].append(batch_info)
        
        # Check if this is a successful response from the API
        # API returns status.success: true even when hotels array is empty
        is_api_success = result.get("status", {}).get("success", False) or result.get("ok", False)
        http_status = result.get("status", {}).get("httpStatus", 200)
        
        # Merge hotels from this batch
        # The API returns hotels in the "hotels" key
        if "hotels" in result and isinstance(result["hotels"], list):
            merged_result["hotels"].extend(result["hotels"])
        
        # Only add to errors if it's an actual error (not just empty results)
        # If httpStatus is 200 and success is true, it's not an error even if no hotels
        if http_status != 200 or (not is_api_success and http_status == 200):
            merged_result["ok"] = False
            if "errors" not in merged_result:
                merged_result["errors"] = []
            merged_result["errors"].append(result)
    
    return merged_result
