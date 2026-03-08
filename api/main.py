from fastapi import FastAPI, Request
from fastapi.responses import RedirectResponse, Response, FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from api.search import search_hotels
from api.review import review_hotel
from api.book import book_hotel
from api.booking_detail import fetch_booking_detail
from api.cancel import cancel_booking
from api.hotel_detail import fetch_hotel_detail

ALLOWED_IPS = {
    "127.0.0.1",        # Localhost (always allow)
    "65.2.62.247",      # Office IP 1
    "157.49.118.218",   # Office IP 2
    "160.22.60.16",     # Office IP 3
}

app = FastAPI()

@app.middleware("http")
async def ip_whitelist_middleware(request: Request, call_next):
    # Depending on proxy setup, the real IP might be in headers
    client_ip = request.client.host if request.client else "127.0.0.1"
    forwarded_for = request.headers.get("X-Forwarded-For")
    
    if forwarded_for:
        # Get the original client IP
        client_ip = forwarded_for.split(",")[0].strip()
        
    # Check against whitelist
    if client_ip not in ALLOWED_IPS:
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
def search(data: dict):
    return search_hotels(data)

@app.post("/review")
def review(data: dict):
    return review_hotel(data)

@app.post("/book")
def book(data: dict):
    return book_hotel(data)

@app.post("/booking-detail")
def booking(data: dict):
    return fetch_booking_detail(data)

@app.post("/cancel")
def cancel(data: dict):
    return cancel_booking(data)

@app.post("/dynamic-detail")
def hotel_dynamic_detail(data: dict):
    return fetch_hotel_detail(data)