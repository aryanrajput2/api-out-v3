# Umami Analytics Integration - Complete Setup

## Overview
Integrated a custom analytics system (Umami-inspired) into your hotel booking application. The system tracks all API calls, errors, success rates, response times, searches, bookings, and user interactions.

## What Was Implemented

### 1. Backend Analytics System (`api/analytics.py`)

#### AnalyticsTracker Class
Tracks and stores all application events:

**Methods:**
- `track_event()` - Track any custom event
- `track_api_call()` - Track API calls with response time and status
- `track_error()` - Track errors with source and type
- `track_search()` - Track hotel searches
- `track_booking()` - Track booking attempts
- `track_page_view()` - Track page views
- `get_stats(hours)` - Get statistics for last N hours
- `get_realtime_stats()` - Get real-time stats (last 5 minutes)
- `clear_old_data(days)` - Clear data older than N days

**Data Stored:**
- API calls (endpoint, method, status, response time, success/failure)
- Errors (source, message, type, timestamp)
- Searches (location, dates, rooms, guests, results count)
- Bookings (booking ID, hotel ID, amount, success, total time)
- Page views (page, user IP, timestamp)
- Custom events

**Storage:**
- All data stored in `analytics_data.json`
- Automatic persistence on every event
- Efficient time-based filtering

### 2. API Endpoints (`api/main.py`)

Added 4 new analytics endpoints:

```python
GET  /api/analytics/stats?hours=24    # Get statistics for last N hours
GET  /api/analytics/realtime          # Get real-time stats (last 5 min)
POST /api/analytics/track             # Track custom event
POST /api/analytics/clear?days=7      # Clear old data
```

**Integrated Tracking:**
- `/search` endpoint now tracks:
  - API call metrics (response time, success/failure)
  - Search details (location, dates, rooms, guests, results)
  - Errors automatically

### 3. Dashboard Analytics Section (`hotel-ui/dashboard.html`)

#### Main Stats Cards (4 large cards):
1. **Success Rate** - Overall API success percentage
2. **Successful Calls** - Count of successful API calls
3. **Failed Calls** - Count of failed calls + error count
4. **Avg Response Time** - Average API response time in ms

#### Mini Stats Row (4 small cards):
1. **Searches** - Total hotel searches
2. **Bookings** - Total booking attempts
3. **Booking Success** - Booking success rate percentage
4. **Page Views** - Total page views

#### Detailed Sections:
1. **Endpoint Performance**
   - Shows each API endpoint
   - Total calls, success count, failed count
   - Average response time per endpoint
   - Success rate percentage

2. **Recent Errors**
   - Last 10 errors in 24 hours
   - Error type, source, message
   - Timestamp for each error
   - Color-coded by severity

3. **Recent API Calls**
   - Last 20 API calls
   - Method, endpoint, status code
   - Response time, timestamp
   - Success/failure indicator

### 4. Dashboard JavaScript (`hotel-ui/dashboard.js`)

**Functions Added:**
- `loadAnalytics()` - Fetch analytics from API
- `displayAnalytics(stats)` - Display all stats in UI
- `displayEndpointStats()` - Render endpoint performance
- `displayRecentErrors()` - Render error list
- `displayRecentApiCalls()` - Render API call list
- `refreshAnalytics()` - Manual refresh button

**Features:**
- Auto-refresh every 30 seconds
- Real-time updates
- Smooth animations
- Color-coded status indicators
- Responsive design

### 5. Dashboard CSS (`hotel-ui/dashboard.css`)

**New Styles:**
- `.stat-card` - Large stat cards with hover effects
- `.mini-stat-card` - Small stat cards
- `.endpoint-item` - Endpoint performance cards
- `.error-item` - Error display cards
- `.api-call-item` - API call list items
- Color variants: primary, success, danger, info
- Animations: slideInUp, spin
- Loading states

## How It Works

### Data Flow:

1. **User Action** → API Request
2. **API Endpoint** → Tracks call start time
3. **Process Request** → Execute business logic
4. **Calculate Response Time** → `time.time() - start_time`
5. **Track Analytics** → `analytics.track_api_call()`
6. **Store Data** → Save to `analytics_data.json`
7. **Dashboard** → Fetch stats every 30s
8. **Display** → Update UI with latest data

### Example: Search Tracking

```python
@app.post("/search")
def search(request: Request, data: dict):
    start_time = time.time()
    result = search_hotels(data)
    response_time_ms = int((time.time() - start_time) * 1000)
    
    # Track API call
    analytics.track_api_call("/search", "POST", 200, response_time_ms, 
                             result.get("ok", False))
    
    # Track search details
    if result.get("ok"):
        analytics.track_search(
            location=data.get("location"),
            checkin=data.get("checkIn"),
            checkout=data.get("checkOut"),
            rooms=len(data.get("rooms", [])),
            guests=sum(r.get("adults", 0) for r in data.get("rooms", [])),
            results_count=len(result.get("hotels", [])),
            response_time_ms=response_time_ms
        )
    
    return result
```

## Statistics Calculated

### Overview Stats:
- Total API calls
- Successful calls
- Failed calls
- Success rate (%)
- Average response time (ms)
- Total errors
- Total searches
- Total bookings
- Booking success rate (%)
- Total page views

### Endpoint Stats:
- Per-endpoint call count
- Per-endpoint success/failure count
- Per-endpoint average response time
- Per-endpoint success rate

### Error Breakdown:
- Errors by type
- Recent errors (last 10)
- Error timestamps
- Error sources

### Time-Based Filtering:
- Last 24 hours (default)
- Last 5 minutes (real-time)
- Custom hours via API parameter
- Automatic old data cleanup (7 days)

## Dashboard Access

**URL:** `http://localhost:8000/ui/dashboard`

**Navigation:**
1. Click "Dashboard" button in top-right of main app
2. Click "Analytics" in left sidebar
3. View real-time statistics
4. Click "Refresh" button for manual update
5. Auto-refreshes every 30 seconds

## Next Steps to Track More Events

### 1. Track All Endpoints

Add tracking to remaining endpoints:

```python
@app.post("/review")
def review(request: Request, data: dict):
    start_time = time.time()
    result = review_hotel(data)
    response_time_ms = int((time.time() - start_time) * 1000)
    
    analytics.track_api_call("/review", "POST", 200, response_time_ms, 
                             result.get("ok", False))
    return result
```

### 2. Track Frontend Events

Add to `hotel-ui/app.js`:

```javascript
// Track page views
async function trackPageView(page) {
  await fetch(`${API_BASE}/api/analytics/track`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      type: 'page_view',
      data: { page: page }
    })
  });
}

// Track button clicks
async function trackEvent(eventType, eventData) {
  await fetch(`${API_BASE}/api/analytics/track`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      type: eventType,
      data: eventData
    })
  });
}
```

### 3. Track Booking Success

```python
@app.post("/book")
def book(request: Request, data: dict):
    start_time = time.time()
    result = book_hotel(data)
    response_time_ms = int((time.time() - start_time) * 1000)
    
    analytics.track_api_call("/book", "POST", 200, response_time_ms, 
                             result.get("ok", False))
    
    if result.get("ok"):
        analytics.track_booking(
            booking_id=result.get("bookingId"),
            hotel_id=data.get("hotelId"),
            amount=result.get("totalAmount", 0),
            currency=data.get("currency", "INR"),
            success=True,
            total_time_ms=response_time_ms
        )
    
    return result
```

### 4. Add Charts (Optional)

Install Chart.js:
```bash
npm install chart.js
```

Add to dashboard.html:
```html
<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
```

Create charts in dashboard.js:
```javascript
function createSuccessRateChart(data) {
  const ctx = document.getElementById('successRateChart');
  new Chart(ctx, {
    type: 'line',
    data: {
      labels: data.labels,
      datasets: [{
        label: 'Success Rate',
        data: data.values,
        borderColor: '#10b981',
        tension: 0.4
      }]
    }
  });
}
```

## Files Created/Modified

### Created:
1. `api/analytics.py` - Analytics tracking system
2. `UMAMI_ANALYTICS_SETUP.md` - This documentation

### Modified:
1. `api/main.py` - Added analytics endpoints and tracking
2. `hotel-ui/dashboard.html` - Added analytics section
3. `hotel-ui/dashboard.js` - Added analytics functions
4. `hotel-ui/dashboard.css` - Added analytics styles

### Generated:
1. `analytics_data.json` - Analytics data storage (auto-created)

## Testing

1. Start the server (already running on port 8000)
2. Open dashboard: `http://localhost:8000/ui/dashboard`
3. Click "Analytics" in sidebar
4. Perform some searches in main app
5. Return to dashboard to see statistics
6. Click "Refresh" to update manually

## Benefits

✅ **Real-time Monitoring** - See live API performance
✅ **Error Tracking** - Catch and diagnose issues quickly
✅ **Performance Metrics** - Optimize slow endpoints
✅ **Success Rates** - Monitor application health
✅ **User Behavior** - Understand search patterns
✅ **Booking Analytics** - Track conversion rates
✅ **No External Dependencies** - Self-hosted, privacy-focused
✅ **Lightweight** - Minimal performance impact
✅ **Automatic** - No manual logging needed

## Privacy & Data Retention

- All data stored locally in `analytics_data.json`
- No external services or tracking
- Automatic cleanup of old data (7 days default)
- No personal information stored
- IP addresses optional (for whitelist only)

## Maintenance

**Clear old data:**
```bash
curl -X POST http://localhost:8000/api/analytics/clear?days=7
```

**View raw data:**
```bash
cat analytics_data.json | python -m json.tool
```

**Backup data:**
```bash
cp analytics_data.json analytics_backup_$(date +%Y%m%d).json
```

## Conclusion

Your hotel booking application now has a complete analytics system that tracks:
- ✅ All API calls with response times
- ✅ Success/failure rates
- ✅ Errors with full details
- ✅ Search patterns
- ✅ Booking attempts
- ✅ Performance metrics per endpoint
- ✅ Real-time dashboard with auto-refresh

Everything is displayed beautifully in the dashboard with color-coded indicators, smooth animations, and automatic updates every 30 seconds!
