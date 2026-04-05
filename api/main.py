from fastapi import FastAPI, Request
from fastapi.responses import RedirectResponse, Response, FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from api.search import search_hotels
from api.review import review_hotel
from api.book import book_hotel
from api.booking_detail import fetch_booking_detail
from api.cancel import cancel_booking
from api.hotel_detail import fetch_hotel_detail
from api.hotel_static_detail import fetch_hotel_static_detail
from api.detail_dynamic import dynamic_detail
from api.batch_search import search_hotels_batch
from api.booking_storage import add_booking, get_recent_bookings, get_booking, delete_booking
from api.logger import log_request, log_response
from api.whitelist_manager import (
    get_whitelist_status, toggle_whitelist, get_whitelist_ips,
    add_ip_to_whitelist, remove_ip_from_whitelist,
    get_allowed_ips, is_whitelist_enabled
)
from api.analytics import analytics
import asyncio
import os
import time

# IP Whitelist - dynamically managed
ENFORCE_IP_WHITELIST = is_whitelist_enabled()
ALLOWED_IPS = get_allowed_ips()

app = FastAPI()

@app.middleware("http")
async def ip_whitelist_middleware(request: Request, call_next):
    # Skip IP check for dashboard and whitelist API endpoints
    if request.url.path.startswith("/ui/dashboard") or request.url.path.startswith("/api/whitelist"):
        response = await call_next(request)
        return response
    
    # Skip IP check if not enforced
    if not is_whitelist_enabled():
        response = await call_next(request)
        return response
    
    # Depending on proxy setup, the real IP might be in headers
    client_ip = request.client.host if request.client else "127.0.0.1"
    forwarded_for = request.headers.get("X-Forwarded-For")
    
    if forwarded_for:
        # Get the original client IP
        client_ip = forwarded_for.split(",")[0].strip()
        
    # Check if IP is from a local network (Wi-Fi/LAN)
    is_local_network = client_ip.startswith("192.168.") or client_ip.startswith("10.") or client_ip.startswith("172.")
    
    # Get current allowed IPs
    allowed_ips = get_allowed_ips()
    
    # Check against whitelist or local network
    if client_ip not in allowed_ips and not is_local_network:
        return JSONResponse(
            status_code=403,
            content={
                "error": "Forbidden", 
                "message": f"Access denied. Your IP ({client_ip}) is not whitelisted by the server administrators."
            }
        )
        
    response = await call_next(request)
    return response

# Explicit SPA routes for direct linking/refreshes
@app.get("/ui/search")
@app.get("/ui/results")
@app.get("/ui/detail")
@app.get("/ui/review")
@app.get("/ui/booking-detail")
def serve_spa():
    return FileResponse("hotel-ui/index.html")

@app.get("/ui/dashboard")
def serve_dashboard():
    return FileResponse("hotel-ui/dashboard.html")

# Serve the demo UI at /ui (keeps API routes untouched)
app.mount("/ui", StaticFiles(directory="hotel-ui", html=True), name="ui")

@app.get("/")
def root():
    return RedirectResponse(url="/ui/")


@app.get("/api")
def api_info():
    return {"ok": True, "endpoints": ["/search", "/review", "/book", "/booking-detail", "/cancel", "/dynamic-detail"]}


@app.get("/health")
def health():
    return {"ok": True}


@app.get("/favicon.ico")
def favicon():
    return Response(status_code=204)


@app.get("/.well-known/appspecific/com.chrome.devtools.json")
def chrome_devtools_probe():
    return Response(status_code=204)


@app.post("/search")
def search(request: Request, data: dict):
    log_request(request, "/search", data)
    start_time = time.time()
    
    try:
        result = search_hotels(data)
        response_time_ms = int((time.time() - start_time) * 1000)
        log_response(request, "/search", 200, result)
        
        # Track analytics
        try:
            success = result.get("ok", False)
            analytics.track_api_call("/search", "POST", 200, response_time_ms, success, 
                                     None if success else result.get("error"))
            if success:
                analytics.track_search(
                    location=data.get("location", "unknown"),
                    checkin=data.get("checkIn", ""),
                    checkout=data.get("checkOut", ""),
                    rooms=len(data.get("rooms", [])),
                    guests=sum(r.get("adults", 0) + r.get("children", 0) for r in data.get("rooms", [])),
                    results_count=len(result.get("hotels", [])),
                    response_time_ms=response_time_ms
                )
        except Exception as e:
            print(f"Analytics tracking error: {e}")
        
        return result
    except Exception as e:
        response_time_ms = int((time.time() - start_time) * 1000)
        error_msg = str(e)
        
        # Track failed request
        try:
            analytics.track_api_call("/search", "POST", 500, response_time_ms, False, error_msg)
            analytics.track_error("/search", error_msg, "api_error")
        except:
            pass
        
        return {"ok": False, "error": error_msg}

@app.post("/review")
def review(request: Request, data: dict):
    log_request(request, "/review", data)
    start_time = time.time()
    try:
        result = review_hotel(data)
        response_time_ms = int((time.time() - start_time) * 1000)
        log_response(request, "/review", 200, result)
        try:
            analytics.track_api_call("/review", "POST", 200, response_time_ms, result.get("ok", False))
        except:
            pass
        return result
    except Exception as e:
        response_time_ms = int((time.time() - start_time) * 1000)
        try:
            analytics.track_api_call("/review", "POST", 500, response_time_ms, False, str(e))
        except:
            pass
        return {"ok": False, "error": str(e)}

@app.post("/book")
def book(request: Request, data: dict):
    log_request(request, "/book", data)
    start_time = time.time()
    try:
        result = book_hotel(data)
        response_time_ms = int((time.time() - start_time) * 1000)
        log_response(request, "/book", 200, result)
        try:
            success = result.get("ok", False)
            analytics.track_api_call("/book", "POST", 200, response_time_ms, success)
            if success:
                analytics.track_booking(
                    booking_id=result.get("bookingId", ""),
                    hotel_id=data.get("hotelId", ""),
                    amount=result.get("totalAmount", 0),
                    currency=data.get("currency", "INR"),
                    success=True,
                    total_time_ms=response_time_ms
                )
        except:
            pass
        return result
    except Exception as e:
        response_time_ms = int((time.time() - start_time) * 1000)
        try:
            analytics.track_api_call("/book", "POST", 500, response_time_ms, False, str(e))
        except:
            pass
        return {"ok": False, "error": str(e)}

@app.post("/booking-detail")
def booking(request: Request, data: dict):
    log_request(request, "/booking-detail", data)
    start_time = time.time()
    try:
        result = fetch_booking_detail(data)
        response_time_ms = int((time.time() - start_time) * 1000)
        log_response(request, "/booking-detail", 200, result)
        try:
            analytics.track_api_call("/booking-detail", "POST", 200, response_time_ms, result.get("ok", False))
        except:
            pass
        return result
    except Exception as e:
        response_time_ms = int((time.time() - start_time) * 1000)
        try:
            analytics.track_api_call("/booking-detail", "POST", 500, response_time_ms, False, str(e))
        except:
            pass
        return {"ok": False, "error": str(e)}

@app.post("/cancel")
def cancel(request: Request, data: dict):
    log_request(request, "/cancel", data)
    start_time = time.time()
    try:
        result = cancel_booking(data)
        response_time_ms = int((time.time() - start_time) * 1000)
        log_response(request, "/cancel", 200, result)
        try:
            analytics.track_api_call("/cancel", "POST", 200, response_time_ms, result.get("ok", False))
        except:
            pass
        return result
    except Exception as e:
        response_time_ms = int((time.time() - start_time) * 1000)
        try:
            analytics.track_api_call("/cancel", "POST", 500, response_time_ms, False, str(e))
        except:
            pass
        return {"ok": False, "error": str(e)}

@app.post("/dynamic-detail")
def hotel_dynamic_detail(request: Request, data: dict):
    log_request(request, "/dynamic-detail", data)
    start_time = time.time()
    try:
        result = dynamic_detail(data)
        response_time_ms = int((time.time() - start_time) * 1000)
        log_response(request, "/dynamic-detail", 200, result)
        try:
            analytics.track_api_call("/dynamic-detail", "POST", 200, response_time_ms, result.get("ok", True))
        except:
            pass
        return result
    except Exception as e:
        response_time_ms = int((time.time() - start_time) * 1000)
        try:
            analytics.track_api_call("/dynamic-detail", "POST", 500, response_time_ms, False, str(e))
        except:
            pass
        return {"ok": False, "error": str(e)}

@app.post("/static-detail")
def hotel_static_detail(request: Request, data: dict):
    log_request(request, "/static-detail", data)
    start_time = time.time()
    try:
        result = fetch_hotel_static_detail(data)
        response_time_ms = int((time.time() - start_time) * 1000)
        log_response(request, "/static-detail", 200, result)
        try:
            analytics.track_api_call("/static-detail", "POST", 200, response_time_ms, result.get("ok", True))
        except:
            pass
        return result
    except Exception as e:
        response_time_ms = int((time.time() - start_time) * 1000)
        try:
            analytics.track_api_call("/static-detail", "POST", 500, response_time_ms, False, str(e))
        except:
            pass
        return {"ok": False, "error": str(e)}

@app.get("/hotel-codes/{location}")
def get_hotel_codes(request: Request, location: str):
    """Load hotel codes from a file for a specific location"""
    log_request(request, f"/hotel-codes/{location}")
    
    file_path = f"hotel_codes/{location}_hotel_codes"
    
    if not os.path.exists(file_path):
        result = {
            "ok": False,
            "message": f"Hotel codes file not found for location: {location}",
            "available_locations": get_available_locations()
        }
        log_response(request, f"/hotel-codes/{location}", 404, result)
        return result
    
    try:
        with open(file_path, 'r') as f:
            codes = [line.strip() for line in f if line.strip()]
        
        result = {
            "ok": True,
            "location": location,
            "hotel_codes": codes,
            "total_count": len(codes)
        }
        log_response(request, f"/hotel-codes/{location}", 200, result)
        return result
    except Exception as e:
        result = {
            "ok": False,
            "message": f"Error reading hotel codes: {str(e)}"
        }
        log_response(request, f"/hotel-codes/{location}", 500, result)
        return result

def get_available_locations():
    """Get list of available hotel code files"""
    hotel_codes_dir = "hotel_codes"
    if not os.path.exists(hotel_codes_dir):
        return []
    
    locations = []
    for file in os.listdir(hotel_codes_dir):
        if file.endswith("_hotel_codes"):
            location = file.replace("_hotel_codes", "")
            locations.append(location)
    
    return locations

@app.post("/batch-search")
async def batch_search(request: Request, data: dict):
    """Search hotels using batched requests (max 100 per batch)"""
    log_request(request, "/batch-search", data)
    result = await search_hotels_batch(data)
    log_response(request, "/batch-search", 200, result)
    return result


# =========================================
# Booking Storage Endpoints
# =========================================

@app.post("/save-booking")
def save_booking_endpoint(request: Request, data: dict):
    """Save a booking to persistent text file storage"""
    log_request(request, "/save-booking", data)
    
    booking_id = data.get("bookingId") or data.get("id")
    booking_data = data.get("data", {})
    
    if not booking_id:
        result = {"ok": False, "message": "Missing booking ID"}
        log_response(request, "/save-booking", 400, result)
        return result
    
    success = add_booking(booking_id, booking_data)
    result = {
        "ok": success,
        "message": "Booking saved successfully" if success else "Failed to save booking",
        "bookingId": booking_id
    }
    log_response(request, "/save-booking", 200 if success else 500, result)
    return result

@app.get("/recent-bookings")
def get_recent_bookings_endpoint(request: Request, limit: int = 10):
    """Get recent bookings from persistent text file storage"""
    log_request(request, "/recent-bookings")
    
    bookings = get_recent_bookings(limit)
    result = {
        "ok": True,
        "bookings": bookings,
        "total": len(bookings)
    }
    log_response(request, "/recent-bookings", 200, result)
    return result

@app.get("/booking/{booking_id}")
def get_booking_endpoint(request: Request, booking_id: str):
    """Get a specific booking from persistent text file storage"""
    log_request(request, f"/booking/{booking_id}")
    
    booking = get_booking(booking_id)
    if not booking:
        result = {"ok": False, "message": "Booking not found"}
        log_response(request, f"/booking/{booking_id}", 404, result)
        return result
    
    result = {"ok": True, "booking": booking}
    log_response(request, f"/booking/{booking_id}", 200, result)
    return result

@app.delete("/booking/{booking_id}")
def delete_booking_endpoint(request: Request, booking_id: str):
    """Delete a booking from persistent text file storage"""
    log_request(request, f"/booking/{booking_id}")
    
    success = delete_booking(booking_id)
    result = {
        "ok": success,
        "message": "Booking deleted successfully" if success else "Failed to delete booking"
    }
    log_response(request, f"/booking/{booking_id}", 200 if success else 500, result)
    return result


# =========================================
# Frontend Logging Endpoint
# =========================================

@app.post("/log")
def frontend_log(request: Request, data: dict):
    """Receive and save frontend logs to a file"""
    try:
        timestamp = data.get("timestamp", "")
        message = data.get("message", "")
        log_data = data.get("data", {})
        
        # Create logs directory if it doesn't exist
        os.makedirs("frontend_logs", exist_ok=True)
        
        # Get current date for log file name
        from datetime import datetime
        current_date = datetime.now().strftime("%Y-%m-%d")
        log_file = f"frontend_logs/{current_date}.log"
        
        # Format log entry
        log_entry = f"[{timestamp}] {message}"
        if log_data:
            import json
            log_entry += f" | {json.dumps(log_data)}"
        log_entry += "\n"
        
        # Append to log file
        with open(log_file, "a") as f:
            f.write(log_entry)
        
        return {"ok": True, "message": "Log saved"}
    except Exception as e:
        return {"ok": False, "message": str(e)}


# ============================================
# IP Whitelist Management API Endpoints
# ============================================

@app.get("/api/whitelist/status")
def whitelist_status(request: Request):
    """Get whitelist enabled/disabled status"""
    log_request(request, "/api/whitelist/status", {})
    result = get_whitelist_status()
    log_response(request, "/api/whitelist/status", 200, result)
    return result

@app.post("/api/whitelist/toggle")
def whitelist_toggle(request: Request):
    """Toggle whitelist on/off"""
    log_request(request, "/api/whitelist/toggle", {})
    result = toggle_whitelist()
    log_response(request, "/api/whitelist/toggle", 200, result)
    return result

@app.get("/api/whitelist/ips")
def whitelist_ips(request: Request):
    """Get list of whitelisted IPs"""
    log_request(request, "/api/whitelist/ips", {})
    result = get_whitelist_ips()
    log_response(request, "/api/whitelist/ips", 200, result)
    return result

@app.post("/api/whitelist/add")
def whitelist_add(request: Request, data: dict):
    """Add IP to whitelist"""
    log_request(request, "/api/whitelist/add", data)
    ip = data.get("ip", "")
    label = data.get("label", "")
    result = add_ip_to_whitelist(ip, label)
    log_response(request, "/api/whitelist/add", 200, result)
    return result

@app.post("/api/whitelist/remove")
def whitelist_remove(request: Request, data: dict):
    """Remove IP from whitelist"""
    log_request(request, "/api/whitelist/remove", data)
    ip = data.get("ip", "")
    result = remove_ip_from_whitelist(ip)
    log_response(request, "/api/whitelist/remove", 200, result)
    return result


# ============================================
#  ANALYTICS ENDPOINTS
# ============================================

@app.get("/api/analytics/stats")
def get_analytics_stats(request: Request, hours: int = 24):
    """Get analytics statistics for last N hours"""
    try:
        # Reload data from file to get latest
        analytics._load_data()
        analytics.data = analytics._load_data()
        stats = analytics.get_stats(hours)
        return {"ok": True, "stats": stats}
    except Exception as e:
        return {"ok": False, "error": str(e)}

@app.get("/api/analytics/realtime")
def get_realtime_analytics(request: Request):
    """Get real-time analytics (last 5 minutes)"""
    try:
        stats = analytics.get_realtime_stats()
        return {"ok": True, "stats": stats}
    except Exception as e:
        return {"ok": False, "error": str(e)}

@app.post("/api/analytics/track")
def track_custom_event(request: Request, data: dict):
    """Track custom analytics event"""
    try:
        event_type = data.get("type", "custom")
        event_data = data.get("data", {})
        analytics.track_event(event_type, event_data)
        return {"ok": True}
    except Exception as e:
        return {"ok": False, "error": str(e)}

@app.post("/api/analytics/clear")
def clear_old_analytics(request: Request, days: int = 7):
    """Clear analytics data older than N days"""
    try:
        analytics.clear_old_data(days)
        return {"ok": True, "message": f"Cleared data older than {days} days"}
    except Exception as e:
        return {"ok": False, "error": str(e)}
