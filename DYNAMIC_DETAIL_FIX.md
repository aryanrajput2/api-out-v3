# Dynamic Detail API Fix

## Problem
The dynamic detail API endpoint was not hitting when users clicked "View Rooms" button on hotel cards.

## Root Cause
In `api/main.py`, the `/dynamic-detail` endpoint was calling the wrong function:
- **Before**: `fetch_hotel_detail(data)` (from `api.hotel_detail`)
- **After**: `dynamic_detail(data)` (from `api.detail_dynamic`)

## Solution

### 1. Added Missing Import
```python
from api.detail_dynamic import dynamic_detail
```

### 2. Fixed Endpoint Function Call
```python
@app.post("/dynamic-detail")
def hotel_dynamic_detail(request: Request, data: dict):
    log_request(request, "/dynamic-detail", data)
    result = dynamic_detail(data)  # Changed from fetch_hotel_detail
    log_response(request, "/dynamic-detail", 200, result)
    return result
```

## Files Modified
- `api/main.py` - Added import and fixed function call

## Verification
✅ Server auto-reloaded with `--reload` flag
✅ Endpoint is listed in `/api` response
✅ Test request to `/dynamic-detail` successfully hits Tripjack API
✅ Proper error handling for invalid requests

## Testing
```bash
# Test endpoint availability
curl http://localhost:8000/api

# Test dynamic-detail endpoint
curl -X POST http://localhost:8000/dynamic-detail \
  -H "Content-Type: application/json" \
  -d '{"optionId": "YOUR_OPTION_ID"}'
```

## Expected Behavior
1. User searches for hotels
2. User clicks "View Rooms" on a hotel card
3. Static details load immediately (hotel info, images, amenities)
4. Dynamic details load (room options with pricing)
5. Both APIs are tracked in performance metrics

## Status
✅ **FIXED** - Dynamic detail API is now properly configured and working

---
**Fixed**: April 2, 2026
**Issue**: Dynamic detail endpoint was calling wrong function
**Impact**: Users couldn't view room options for hotels
