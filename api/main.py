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
from api.batch_search import search_hotels_batch
from api.logger import log_request, log_response
import asyncio
import os

# IP Whitelist - only enforced in development (set ENFORCE_IP_WHITELIST=true to enable)
ENFORCE_IP_WHITELIST = os.getenv("ENFORCE_IP_WHITELIST", "false").lower() == "true"

ALLOWED_IPS = {
    "127.0.0.1",        # Localhost (always allow)
    "65.2.62.247",      # Office IP 1
    "157.49.118.218",   # Office IP 2
    "160.22.60.16",     # Office IP 3
    "3.108.106.208",     # janmejay ip
    "13.204.135.18",     # janmejay ip second
}

app = FastAPI()

@app.middleware("http")
async def ip_whitelist_middleware(request: Request, call_next):
    # Skip IP check if not enforced (useful for Render/cloud deployments)
    if not ENFORCE_IP_WHITELIST:
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
    
    # Check against whitelist or local network
    if client_ip not in ALLOWED_IPS and not is_local_network:
        # Print the blocked IP out to your terminal running `start.sh` so you can see it
        print(f"\n🚨 [BLOCKED] Someone tried to access from IP: {client_ip}🚨\n")
        
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
    result = search_hotels(data)
    log_response(request, "/search", 200, result)
    return result

@app.post("/review")
def review(request: Request, data: dict):
    log_request(request, "/review", data)
    result = review_hotel(data)
    log_response(request, "/review", 200, result)
    return result

@app.post("/book")
def book(request: Request, data: dict):
    log_request(request, "/book", data)
    result = book_hotel(data)
    log_response(request, "/book", 200, result)
    return result

@app.post("/booking-detail")
def booking(request: Request, data: dict):
    log_request(request, "/booking-detail", data)
    result = fetch_booking_detail(data)
    log_response(request, "/booking-detail", 200, result)
    return result

@app.post("/cancel")
def cancel(request: Request, data: dict):
    log_request(request, "/cancel", data)
    result = cancel_booking(data)
    log_response(request, "/cancel", 200, result)
    return result

@app.post("/dynamic-detail")
def hotel_dynamic_detail(request: Request, data: dict):
    log_request(request, "/dynamic-detail", data)
    result = fetch_hotel_detail(data)
    log_response(request, "/dynamic-detail", 200, result)
    return result

@app.post("/static-detail")
def hotel_static_detail(request: Request, data: dict):
    log_request(request, "/static-detail", data)
    result = fetch_hotel_static_detail(data)
    log_response(request, "/static-detail", 200, result)
    return result

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