# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is the **Tripjack Hotel API V3** — a FastAPI backend that proxies the Tripjack HMS V3 hotel booking API and serves a single-page application (SPA) frontend for hotel search, booking, and admin management. The system acts as a middleware layer between the Tripjack upstream API and the browser-based UI.

## Running the Server

```bash
# Activate virtualenv and start with optional ngrok tunnel
./start.sh

# Or run directly (requires .venv activated)
source .venv/bin/activate
uvicorn api.main:app --host 0.0.0.0 --port 8000 --reload
```

The server runs on port 8000. The UI is at `/home/`, the API root is at `/`.

## Install Dependencies

```bash
pip install -r requirements.txt    # Python (FastAPI, uvicorn, httpx, requests, openai, pydantic)
npm install                        # Node (Playwright for testing, Umami analytics)
```

## Architecture

### Backend (`api/`)

FastAPI app defined in `api/main.py`. The app entry point is `main.py` (root) which imports `api.main:app`.

**Core API flow** — each module proxies a Tripjack HMS V3 endpoint:
- `search.py` → `/hms/v3/hotel/listing` (hotel search by hotel IDs)
- `batch_search.py` → same endpoint, but splits hotel codes into batches of 100 and runs them in parallel
- `hotel_detail.py` → `/hms/v3/hotel/pricing` (single hotel pricing/detail)
- `review.py` → `/hms/v3/hotel/review` (review before booking)
- `book.py` → `/oms/v3/hotel/book` (create booking — VOUCHER or HOLD)
- `confirm.py` → `/oms/v3/hotel/confirm-book` (confirm a HOLD booking)
- `cancel.py` → `/oms/v3/hotel/cancel-booking/{id}`
- `booking_detail.py` → booking detail fetch

**Environment routing**: `book.py`, `confirm.py`, and `cancel.py` select between sandbox (`apitest-hotel-booker.tripjack.com`) and production (`hotel-booker.tripjack.com`) based on the `env` field in the request payload. Search/review/detail use the `env` field directly as base URL.

**Config** (`config.py`): Loads `API_KEY` and `BASE_URL` from `.env`. Default base URL is `https://apitest-hms.tripjack.com/`.

**Supporting modules**:
- `analytics.py` — tracks API calls, searches, bookings, errors to `analytics_data.json`
- `booking_storage.py` — persists recent bookings (last 50) to `bookings_data.json`
- `logger.py` — logs requests/responses as JSON lines to `Server_logs/{date}.log`
- `whitelist_manager.py` — IP whitelist management via `whitelist_config.json`
- `security.py` — rate limiter, CSRF, brute force protection, audit logging (classes defined but not all wired into middleware)
- `deployment.py` — environment switching and release management via `deployment_config.json`

### Frontend (`hotel-ui/`)

A vanilla JS single-page application (no build step, no framework). All routing is handled client-side in `app.js`.

- `index.html` — SPA shell, loads `app.js` and `style.css`
- `app.js` — main SPA logic: search form, results, hotel detail, review, booking, booking-detail pages
- `dashboard.html` / `dashboard.js` / `dashboard.css` — admin dashboard (analytics, API logs, bookings, deployment management)
- `style.css` — main app styles
- `particles.js`, `premium-animations.css`, `image-zoom.js` — visual effects

The frontend is served at `/home/` via FastAPI's `StaticFiles` mount. SPA routes (`/home/search`, `/home/results`, `/home/detail`, `/home/review`, `/home/booking-detail`) are explicitly handled to return `index.html` for direct-link/refresh support. Legacy `/ui/*` routes redirect to `/home/*`.

### Hotel Codes (`hotel_codes/`)

Text files containing hotel IDs per city (e.g., `mumbai_hotel_codes`, `delhi_hotel_codes`). Used by the batch search feature. Served via `GET /hotel-codes/{location}`.

## Deployment

Configured for multiple platforms:
- **Railway**: `railway.toml`, `Procfile`, `deploy.sh`
- **Render**: `render.yaml`
- **Vercel**: `vercel.json`
- **Nixpacks**: `nixpacks.toml`

Build command: `pip install -r requirements.txt`
Start command: `uvicorn api.main:app --host 0.0.0.0 --port 8000` (or `uvicorn main:app` for some platforms)

## Key Data Files

- `analytics_data.json` — analytics event store (auto-managed, can grow large)
- `bookings_data.json` — recent booking records
- `whitelist_config.json` — IP whitelist configuration
- `deployment_config.json` — environment/release configuration
- `Server_logs/` — daily JSON-line log files

## Important Patterns

- All API proxy functions accept a `data: dict` body with an `env` field to override the target Tripjack environment and an `apiKey` field to override the API key.
- Every endpoint in `main.py` follows the same pattern: `log_request` → call handler → `log_response` → `analytics.track_*` → return result. Wrap in try/except returning `{"ok": False, "error": ...}`.
- The frontend stores session state (environment, API key, search context) in `sessionStorage` and persists bookings via the `/save-booking` endpoint.
