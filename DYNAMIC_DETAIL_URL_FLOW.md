# Dynamic Detail API - URL Flow Documentation

## Complete Request Flow

### 1️⃣ Frontend → Your Backend

**Frontend Request:**
```javascript
// URL: http://localhost:8000/dynamic-detail
fetch(`${API_BASE}/dynamic-detail`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    // From globalSearchBody (search criteria)
    checkIn: "2026-04-03",
    checkOut: "2026-04-04",
    rooms: [{adults: 2}],
    currency: "INR",
    correlationId: "ui-...",
    nationality: "106",
    timeoutMs: 13000,
    
    // Added for detail request
    hid: "100000000059",           // Hotel ID
    optionId: "d4002359-75da-...", // Option ID from search results
    
    // Configuration
    env: "https://tj-hotel-admin.tripjack.com/",
    apiKey: "7510455af381d5-..."
  })
})
```

**Your Backend Endpoint:**
- **URL**: `http://localhost:8000/dynamic-detail`
- **Method**: POST
- **Handler**: `hotel_dynamic_detail()` in `api/main.py`
- **Function Called**: `dynamic_detail(data)` from `api/detail_dynamic.py`

---

### 2️⃣ Your Backend → Tripjack API

**Backend Request:**
```python
# URL: {env}/hms/v3/hotel/pricing
url = f"{env}/hms/v3/hotel/pricing"

# Example: https://tj-hotel-admin.tripjack.com/hms/v3/hotel/pricing

requests.post(url, 
  headers={
    "Content-Type": "application/json",
    "apikey": api_key
  },
  json={
    "correlationId": "ui-lxyz123",
    "hid": "100000000059",
    "checkIn": "2026-04-03",
    "checkOut": "2026-04-04",
    "rooms": [{"adults": 2}],
    "currency": "INR",
    "nationality": "106",
    "timeoutMs": 30000
  }
)
```

**Tripjack API Endpoint:**
- **Full URL**: `https://tj-hotel-admin.tripjack.com/hms/v3/hotel/pricing`
- **Method**: POST
- **Headers**: 
  - `Content-Type: application/json`
  - `apikey: {your-api-key}`
- **Payload**: Full search context with hotel ID

---

### 3️⃣ Tripjack API → Your Backend → Frontend

**Response Flow:**
```
Tripjack API Response
    ↓
Your Backend (detail_dynamic.py)
    ↓
Frontend (app.js)
    ↓
Rendered on Page
```

---

## URL Breakdown by Environment

### Admin TJ (Default)
```
Frontend:  http://localhost:8000/dynamic-detail
Backend:   https://tj-hotel-admin.tripjack.com/hms/v3/hotel/pricing
```

### API Test Server (Sandbox)
```
Frontend:  http://localhost:8000/dynamic-detail
Backend:   https://apitest-hms.tripjack.com/hms/v3/hotel/pricing
```

### Prod Tripjack
```
Frontend:  http://localhost:8000/dynamic-detail
Backend:   https://tripjack.com/hms/v3/hotel/pricing
```

---

## Key Points

### ✅ What Your Backend Does:
1. Receives request from frontend with full search context
2. **Passes full search context to Tripjack** (correlationId, hid, checkIn, checkOut, rooms, currency, nationality, timeoutMs)
3. Returns Tripjack response to frontend

### ✅ What Frontend Sends:
- **Full search context** (checkIn, checkOut, rooms, etc.)
- **Hotel ID** (hid)
- **Option ID** (optionId) - Not used by backend, kept for frontend reference
- **Environment & API Key**

### ✅ What Backend Sends to Tripjack:
- **correlationId** (required)
- **hid** (required) - Hotel ID
- **checkIn** (required)
- **checkOut** (required)
- **rooms** (required) - Array of room configurations
- **currency** (required)
- **nationality** (required)
- **timeoutMs** (required)

### ⚠️ Important Notes:
1. **Endpoint is `/hotel/pricing`** NOT `/hotel/option/detail`
2. **Requires full search context** - Not just optionId
3. **Returns all available room options** for the hotel with current pricing

---

## Example Request/Response

### Frontend → Backend
```json
POST http://localhost:8000/dynamic-detail
{
  "checkIn": "2026-05-25",
  "checkOut": "2026-05-26",
  "rooms": [{"adults": 2, "children": 1}, {"adults": 1}],
  "currency": "INR",
  "correlationId": "1p6IYhwDQ9NGwiZ8FaigQz",
  "hid": "100000001897",
  "nationality": "106",
  "timeoutMs": 30000,
  "env": "https://apitest-hms.tripjack.com/",
  "apiKey": "5129111cbd230d-7b23-44fb-aa0d-e27c643f6102"
}
```

### Backend → Tripjack
```json
POST https://apitest-hms.tripjack.com/hms/v3/hotel/pricing
Headers: {
  "Content-Type": "application/json",
  "apikey": "5129111cbd230d-7b23-44fb-aa0d-e27c643f6102"
}
Body: {
  "correlationId": "1p6IYhwDQ9NGwiZ8FaigQz",
  "hid": "100000001897",
  "checkIn": "2026-05-25",
  "checkOut": "2026-05-26",
  "rooms": [{"adults": 2, "children": 1}, {"adults": 1}],
  "currency": "INR",
  "nationality": "106",
  "timeoutMs": 30000
}
```

### Tripjack → Backend → Frontend
```json
{
  "ok": true,
  "data": {
    "hotel": {
      "hotelId": "100000001897",
      "name": "Hotel Name",
      "options": [
        {
          "optionId": "...",
          "rooms": [...],
          "pricing": {...},
          "cancellation": {...}
        }
      ]
    }
  }
}
```

---

## Correct cURL Example

```bash
curl --location 'https://apitest-hms.tripjack.com/hms/v3/hotel/pricing' \
--header 'Content-Type: application/json' \
--header 'apikey: 5129111cbd230d-7b23-44fb-aa0d-e27c643f6102' \
--data '{
  "correlationId": "1p6IYhwDQ9NGwiZ8FaigQz",
  "hid": "100000001897",
  "checkIn": "2026-05-25",
  "checkOut": "2026-05-26",
  "rooms": [{"adults": 2, "children": 1}, {"adults": 1}],
  "currency": "INR",
  "nationality": "106",
  "timeoutMs": 30000
}'
```

---

## Debugging Tips

### Check Frontend Request:
```javascript
console.log('About to fetch dynamic details with body:', dynamicBody);
```

### Check Backend Request:
```python
# In detail_dynamic.py, add:
print(f"Calling Tripjack: {url}")
print(f"Payload: {payload}")
```

### Check Response:
```javascript
console.log('Dynamic detail data parsed:', dynamicData);
```

---

**Last Updated**: April 2, 2026  
**Corrected**: Changed from `/hotel/option/detail` to `/hotel/pricing`
