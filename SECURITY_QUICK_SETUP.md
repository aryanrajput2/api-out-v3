# Security Quick Setup - Copy & Paste Implementation

## Step 1: Add Security Headers Middleware

Add this to the top of your `api/main.py` after imports:

```python
from api.security import get_security_headers

# Add after app = FastAPI()
@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    """Add security headers to all responses"""
    response = await call_next(request)
    headers = get_security_headers()
    for header, value in headers.items():
        response.headers[header] = value
    return response
```

---

## Step 2: Add Rate Limiting to Endpoints

Replace your existing endpoints with rate limiting:

```python
from api.security import rate_limiter, audit_logger

@app.get("/api/search")
async def search(request: Request, ...):
    """Search hotels with rate limiting"""
    client_ip = request.client.host
    
    # Check rate limit
    if not rate_limiter.is_allowed(client_ip):
        audit_logger.log_suspicious_activity(client_ip, "Rate limit exceeded")
        return JSONResponse(
            status_code=429,
            content={"error": "Too many requests. Please try again later."}
        )
    
    # Log successful access
    audit_logger.log_api_key_access(client_ip, "/api/search", True)
    
    # ... rest of your code
```

---

## Step 3: Add Request Validation

```python
from api.security import RequestValidator

# Validate API key
@app.post("/api/booking")
async def create_booking(request: Request, booking_data: dict):
    """Create booking with validation"""
    
    # Validate API key format
    api_key = booking_data.get("api_key")
    if not RequestValidator.validate_api_key(api_key):
        audit_logger.log_failed_auth(request.client.host, "Invalid API key format")
        return JSONResponse(
            status_code=400,
            content={"error": "Invalid API key format"}
        )
    
    # Sanitize string inputs
    hotel_name = RequestValidator.sanitize_string(booking_data.get("hotel_name", ""))
    guest_name = RequestValidator.sanitize_string(booking_data.get("guest_name", ""))
    
    # Validate email
    email = booking_data.get("email", "")
    if not RequestValidator.validate_email(email):
        return JSONResponse(
            status_code=400,
            content={"error": "Invalid email address"}
        )
    
    # ... rest of your code
```

---

## Step 4: Add Audit Logging to Key Endpoints

```python
from api.security import audit_logger

@app.post("/api/booking")
async def create_booking(request: Request, ...):
    """Create booking with audit logging"""
    client_ip = request.client.host
    
    try:
        # ... your booking logic
        
        # Log successful booking
        audit_logger.log_event(
            "BOOKING_CREATED",
            {
                "ip": client_ip,
                "booking_id": booking_id,
                "hotel_id": hotel_id
            },
            severity="INFO"
        )
        
        return {"success": True, "booking_id": booking_id}
    
    except Exception as e:
        # Log error
        audit_logger.log_event(
            "BOOKING_ERROR",
            {
                "ip": client_ip,
                "error": str(e)
            },
            severity="ERROR"
        )
        
        return JSONResponse(
            status_code=500,
            content={"error": "Booking failed"}
        )
```

---

## Step 5: Add Brute Force Protection (Optional - for future auth)

```python
from api.security import brute_force_protector

@app.post("/api/login")
async def login(request: Request, credentials: dict):
    """Login with brute force protection"""
    client_ip = request.client.host
    
    # Check if locked out
    if brute_force_protector.is_locked_out(client_ip):
        audit_logger.log_suspicious_activity(
            client_ip,
            "Brute force lockout - too many failed attempts"
        )
        return JSONResponse(
            status_code=429,
            content={"error": "Too many failed attempts. Try again in 15 minutes."}
        )
    
    # Verify credentials
    if not verify_credentials(credentials):
        brute_force_protector.record_attempt(client_ip)
        audit_logger.log_failed_auth(client_ip, "Invalid credentials")
        return JSONResponse(
            status_code=401,
            content={"error": "Invalid credentials"}
        )
    
    # Success - reset attempts
    brute_force_protector.reset_attempts(client_ip)
    audit_logger.log_event(
        "LOGIN_SUCCESS",
        {"ip": client_ip},
        severity="INFO"
    )
    
    return {"success": True}
```

---

## Step 6: Add CORS Configuration

```python
from fastapi.middleware.cors import CORSMiddleware

# Add after app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:8000",
        "http://localhost:3000",
        # Add your production domain here
        # "https://yourdomain.com"
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
    max_age=3600,
)
```

---

## Step 7: Add Audit Log Endpoint (for dashboard)

```python
@app.get("/api/audit-logs")
async def get_audit_logs(request: Request, limit: int = 100, severity: str = None):
    """Get recent audit logs (admin only)"""
    
    # Check if admin/authorized
    # You can add authentication here
    
    logs = audit_logger.get_recent_events(limit=limit, severity=severity)
    return {"ok": True, "logs": logs}
```

---

## Step 8: Update .env File

Add these to your `.env`:

```env
# Existing
API_KEY=6116982da6b759-28f8-4cdf-b210-04cb98116165
BASE_URL=https://apitest-hms.tripjack.com/

# New Security Settings
SECRET_KEY=your_secret_key_change_this_in_production
JWT_SECRET=your_jwt_secret_change_this_in_production
CORS_ORIGINS=http://localhost:8000,http://localhost:3000

# Rate Limiting
RATE_LIMIT_REQUESTS=100
RATE_LIMIT_WINDOW=60

# Session
SESSION_TIMEOUT_MINUTES=30

# Logging
LOG_LEVEL=INFO
AUDIT_LOG_FILE=audit_log.json
```

---

## Step 9: Add Security Dashboard Section

Add this to `hotel-ui/dashboard.html` in the sidebar nav:

```html
<a href="#security" class="nav-item" onclick="showSection('security')">
  <i class="ph ph-shield-check"></i>
  <span>Security</span>
</a>
```

Add this section to the main content:

```html
<!-- Security Section -->
<section id="security-section" class="dashboard-section">
  <div class="section-header">
    <div>
      <h1>Security Monitoring</h1>
      <p>View security events and audit logs</p>
    </div>
    <div class="header-actions">
      <button class="btn-primary" onclick="refreshSecurityLogs()">
        <i class="ph ph-arrows-clockwise"></i>
        <span>Refresh</span>
      </button>
    </div>
  </div>
  
  <!-- Security Stats -->
  <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-bottom: 24px;">
    <div class="mini-stat-card">
      <i class="ph ph-warning" style="color: #ef4444;"></i>
      <div>
        <div class="mini-stat-value" id="failed-auth-count">0</div>
        <div class="mini-stat-label">Failed Auth</div>
      </div>
    </div>
    
    <div class="mini-stat-card">
      <i class="ph ph-shield-warning" style="color: #f59e0b;"></i>
      <div>
        <div class="mini-stat-value" id="suspicious-activity-count">0</div>
        <div class="mini-stat-label">Suspicious</div>
      </div>
    </div>
    
    <div class="mini-stat-card">
      <i class="ph ph-check-circle" style="color: #10b981;"></i>
      <div>
        <div class="mini-stat-value" id="successful-logins">0</div>
        <div class="mini-stat-label">Successful Logins</div>
      </div>
    </div>
  </div>
  
  <!-- Recent Security Events -->
  <div class="glass-panel">
    <div class="panel-header">
      <h3><i class="ph ph-list-bullets"></i> Recent Security Events</h3>
      <span class="badge" id="security-event-count">0 events</span>
    </div>
    <div id="security-logs" class="api-call-list">
      <div class="loading-state">
        <div class="loader"></div>
        <p>Loading security logs...</p>
      </div>
    </div>
  </div>
</section>
```

---

## Step 10: Add Security Functions to dashboard.js

```javascript
// Security Monitoring Functions
async function loadSecurityLogs() {
  try {
    const response = await fetch(`${API_BASE}/api/audit-logs?limit=50`);
    const data = await response.json();
    
    if (data.ok && data.logs) {
      displaySecurityLogs(data.logs);
      updateSecurityStats(data.logs);
    }
  } catch (error) {
    console.error('Error loading security logs:', error);
  }
}

function displaySecurityLogs(logs) {
  const container = document.getElementById('security-logs');
  
  if (logs.length === 0) {
    container.innerHTML = `
      <div class="loading-state">
        <i class="ph ph-check-circle" style="font-size: 3rem; color: var(--success); margin-bottom: 16px;"></i>
        <p>No security events in the last 24 hours</p>
      </div>
    `;
    return;
  }
  
  container.innerHTML = logs.map(log => {
    const severity = log.severity || 'INFO';
    const severityColor = {
      'ERROR': '#ef4444',
      'WARNING': '#f59e0b',
      'INFO': '#3b82f6'
    }[severity] || '#3b82f6';
    
    return `
      <div class="api-call-item" style="border-left: 4px solid ${severityColor};">
        <div class="api-call-info">
          <span class="api-call-method" style="background: rgba(${severityColor}, 0.1); color: ${severityColor};">
            ${log.type}
          </span>
          <span class="api-call-endpoint">${JSON.stringify(log.details).substring(0, 50)}...</span>
        </div>
        <div class="api-call-meta">
          <span class="api-call-timestamp">${new Date(log.timestamp).toLocaleString()}</span>
        </div>
      </div>
    `;
  }).join('');
}

function updateSecurityStats(logs) {
  const failedAuth = logs.filter(l => l.type === 'FAILED_AUTH').length;
  const suspicious = logs.filter(l => l.type === 'SUSPICIOUS_ACTIVITY').length;
  const successful = logs.filter(l => l.type === 'LOGIN_SUCCESS').length;
  
  document.getElementById('failed-auth-count').textContent = failedAuth;
  document.getElementById('suspicious-activity-count').textContent = suspicious;
  document.getElementById('successful-logins').textContent = successful;
  document.getElementById('security-event-count').textContent = `${logs.length} events`;
}

function refreshSecurityLogs() {
  loadSecurityLogs();
}

// Call on dashboard load
document.addEventListener('DOMContentLoaded', () => {
  loadSecurityLogs();
  setInterval(loadSecurityLogs, 30000); // Refresh every 30 seconds
});
```

---

## Testing Security Features

### Test Rate Limiting
```bash
# Make multiple requests quickly
for i in {1..150}; do
  curl http://localhost:8000/api/search
done
# Should get 429 error after 100 requests
```

### Test Request Validation
```bash
# Invalid API key format
curl -X POST http://localhost:8000/api/booking \
  -H "Content-Type: application/json" \
  -d '{"api_key": "invalid"}'
```

### Check Audit Logs
```bash
# View audit logs
cat audit_log.json | jq '.'

# Count events by type
cat audit_log.json | jq 'group_by(.type) | map({type: .[0].type, count: length})'
```

---

## Monitoring Checklist

- [ ] Check audit logs daily
- [ ] Monitor failed auth attempts
- [ ] Track rate limit violations
- [ ] Review suspicious activity
- [ ] Rotate API keys quarterly
- [ ] Update security headers
- [ ] Test CORS configuration
- [ ] Verify HTTPS in production
- [ ] Monitor response times
- [ ] Check for unusual IP patterns

---

## Production Deployment

Before going live:

1. **Update .env with production values**
2. **Enable HTTPS/TLS**
3. **Configure proper CORS origins**
4. **Set up monitoring/alerting**
5. **Enable audit logging**
6. **Configure rate limits appropriately**
7. **Set up log rotation**
8. **Enable security headers**
9. **Test all security features**
10. **Document security procedures**

---

## Support

For issues or questions about security implementation:
- Check `SECURITY_ENHANCEMENTS.md` for detailed documentation
- Review `api/security.py` for available functions
- Check `audit_log.json` for event logs
