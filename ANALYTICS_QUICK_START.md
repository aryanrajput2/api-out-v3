# Analytics Quick Start Guide

## 🚀 What's New

Your hotel booking application now has a complete analytics dashboard that tracks:

✅ **API Performance** - Response times, success rates, endpoint statistics
✅ **Error Monitoring** - Real-time error tracking with full details  
✅ **Search Analytics** - Track all hotel searches and patterns
✅ **Booking Metrics** - Monitor booking attempts and success rates
✅ **Real-time Dashboard** - Beautiful UI with auto-refresh every 30 seconds

## 📊 Access the Dashboard

1. **Open your browser:** `http://localhost:8000/ui/dashboard`
2. **Click "Analytics"** in the left sidebar
3. **View real-time stats** - Auto-refreshes every 30 seconds

## 🎯 What You'll See

### Main Stats (4 Large Cards)
- **Success Rate** - Overall API success percentage
- **Successful Calls** - Count of successful API calls  
- **Failed Calls** - Count of failed calls + errors
- **Avg Response Time** - Average API response time

### Mini Stats (4 Small Cards)
- **Searches** - Total hotel searches
- **Bookings** - Total booking attempts
- **Booking Success** - Booking success rate %
- **Page Views** - Total page views

### Detailed Sections
1. **Endpoint Performance** - Stats for each API endpoint
2. **Recent Errors** - Last 10 errors with full details
3. **Recent API Calls** - Last 20 API calls with status

## 🧪 Test the Analytics

Run the test script to generate sample data:

```bash
./test_analytics.sh
```

This will:
- Make 2 test searches
- Track a custom event
- Display the analytics stats
- Show you the dashboard URL

## 📈 How It Works

### Automatic Tracking
Every API call is automatically tracked:
- Endpoint name
- Response time (milliseconds)
- Success/failure status
- Error messages (if any)
- Timestamp

### Data Storage
- All data stored in `analytics_data.json`
- Automatic cleanup after 7 days
- No external services needed
- Privacy-focused (self-hosted)

### Real-time Updates
- Dashboard auto-refreshes every 30 seconds
- Click "Refresh" button for manual update
- Color-coded indicators (green=success, red=error)
- Smooth animations

## 🎨 Dashboard Features

### Visual Indicators
- 🟢 **Green** - Successful operations
- 🔴 **Red** - Failed operations / Errors
- 🔵 **Blue** - Information / Metrics
- 🟣 **Purple** - Special stats

### Interactive Elements
- Hover over cards for effects
- Click "Refresh" to update manually
- Auto-scroll for long lists
- Responsive design (works on mobile)

## 📝 What Gets Tracked

### Currently Tracked:
✅ `/search` endpoint - Full tracking enabled
✅ Custom events via API
✅ Error tracking (automatic)
✅ Response times (automatic)

### Ready to Track (add when needed):
- `/review` endpoint
- `/book` endpoint  
- `/booking-detail` endpoint
- `/cancel` endpoint
- `/dynamic-detail` endpoint
- Page views from frontend
- Button clicks
- User interactions

## 🔧 API Endpoints

### Get Statistics
```bash
GET /api/analytics/stats?hours=24
```

### Get Real-time Stats (last 5 min)
```bash
GET /api/analytics/realtime
```

### Track Custom Event
```bash
POST /api/analytics/track
{
  "type": "custom_event",
  "data": {"key": "value"}
}
```

### Clear Old Data
```bash
POST /api/analytics/clear?days=7
```

## 💡 Use Cases

### 1. Monitor API Health
Check success rates and response times to ensure APIs are performing well.

### 2. Debug Errors
View recent errors with full details to quickly identify and fix issues.

### 3. Optimize Performance
Identify slow endpoints and optimize them based on average response times.

### 4. Track User Behavior
See which locations are searched most, booking patterns, etc.

### 5. Business Metrics
Monitor booking success rates, conversion rates, and revenue metrics.

## 🎯 Next Steps

### 1. Add More Tracking
Edit `api/main.py` to add tracking to other endpoints:

```python
@app.post("/review")
def review(request: Request, data: dict):
    start_time = time.time()
    result = review_hotel(data)
    response_time_ms = int((time.time() - start_time) * 1000)
    
    analytics.track_api_call("/review", "POST", 200, 
                             response_time_ms, result.get("ok", False))
    return result
```

### 2. Track Frontend Events
Add to `hotel-ui/app.js`:

```javascript
// Track page views
fetch(`${API_BASE}/api/analytics/track`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    type: 'page_view',
    data: { page: 'search' }
  })
});
```

### 3. Add Charts (Optional)
Install Chart.js and create visual charts for trends over time.

### 4. Export Reports
Add functionality to export analytics data as CSV or PDF.

## 📚 Documentation

- **Full Setup Guide:** `UMAMI_ANALYTICS_SETUP.md`
- **API Configuration:** `API_CONFIG_DASHBOARD.md`
- **Dashboard Features:** `DASHBOARD_WHITELIST_FEATURE.md`

## 🎉 Summary

You now have a complete, self-hosted analytics system that:
- Tracks all API calls automatically
- Monitors errors in real-time
- Displays beautiful statistics
- Auto-refreshes every 30 seconds
- Requires no external services
- Respects user privacy

**Dashboard URL:** `http://localhost:8000/ui/dashboard`

Enjoy your new analytics dashboard! 🚀
