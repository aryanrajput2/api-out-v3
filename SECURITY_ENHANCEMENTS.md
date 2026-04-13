# Security Enhancements Guide

## Overview
This guide covers security features you can add to your API to protect against common attacks and vulnerabilities.

---

## 1. RATE LIMITING ⚡

**What it does**: Prevents abuse by limiting requests per IP/user

**Implementation**:
```python
from api.security import rate_limiter

# In your endpoint
@app.get("/api/search")
async def search(request: Request):
    client_ip = request.client.host
    
    if not rate_limiter.is_allowed(client_ip):
        return JSONResponse(
            status_code=429,
            content={"error": "Too many requests. Please try again later."}
        )
    
    remaining = rate_limiter.get_remaining(client_ip)
    # ... rest of endpoint
```

**Benefits**:
- Prevents DDoS attacks
- Protects against brute force
- Ensures fair resource usage

**Configuration**:
```python
# Adjust limits as needed
rate_limiter = RateLimiter(
    max_requests=100,      # requests per window
    window_seconds=60      # time window
)
```

---

## 2. REQUEST VALIDATION & SANITIZATION 🛡️

**What it does**: Validates and cleans user input to prevent injection attacks

**Implementation**:
```python
from api.security import RequestValidator

# Sanitize string input
clean_input = RequestValidator.sanitize_string(user_input)

# Validate IP address
if RequestValidator.validate_ip(ip_address):
    # IP is valid
    pass

# Validate email
if RequestValidator.validate_email(email):
    # Email is valid
    pass

# Validate API key
if RequestValidator.validate_api_key(api_key):
    # API key is valid
    pass
```

**Benefits**:
- Prevents SQL injection
- Prevents XSS attacks
- Prevents command injection
- Ensures data integrity

---

## 3. AUDIT LOGGING 📋

**What it does**: Logs all security-relevant events for monitoring and investigation

**Implementation**:
```python
from api.security import audit_logger

# Log failed authentication
audit_logger.log_failed_auth(
    ip="192.168.1.100",
    reason="Invalid API key"
)

# Log suspicious activity
audit_logger.log_suspicious_activity(
    ip="192.168.1.100",
    activity="Multiple failed login attempts"
)

# Log API key access
audit_logger.log_api_key_access(
    ip="192.168.1.100",
    endpoint="/api/search",
    success=True
)

# Get recent events
events = audit_logger.get_recent_events(limit=100)
warning_events = audit_logger.get_recent_events(severity="WARNING")
```

**Benefits**:
- Detect security incidents
- Investigate breaches
- Compliance requirements
- Forensic analysis

**View logs**: Check `audit_log.json` for all events

---

## 4. CSRF PROTECTION 🔐

**What it does**: Prevents Cross-Site Request Forgery attacks

**Implementation**:
```python
from api.security import csrf_protection

# Generate token for user session
@app.get("/api/csrf-token")
async def get_csrf_token(request: Request):
    session_id = request.cookies.get("session_id")
    token = csrf_protection.generate_token(session_id)
    return {"token": token}

# Validate token on state-changing requests
@app.post("/api/booking")
async def create_booking(request: Request):
    session_id = request.cookies.get("session_id")
    token = request.headers.get("X-CSRF-Token")
    
    if not csrf_protection.validate_token(session_id, token):
        return JSONResponse(
            status_code=403,
            content={"error": "Invalid CSRF token"}
        )
    
    # Process booking
    pass
```

**Frontend Implementation**:
```javascript
// Get CSRF token
const response = await fetch('/api/csrf-token');
const { token } = await response.json();

// Include in requests
fetch('/api/booking', {
    method: 'POST',
    headers: {
        'X-CSRF-Token': token,
        'Content-Type': 'application/json'
    },
    body: JSON.stringify(bookingData)
});
```

**Benefits**:
- Prevents unauthorized state changes
- Protects against malicious websites
- Industry standard protection

---

## 5. BRUTE FORCE PROTECTION 🔒

**What it does**: Locks out accounts after multiple failed attempts

**Implementation**:
```python
from api.security import brute_force_protector

@app.post("/api/login")
async def login(request: Request, credentials: dict):
    client_ip = request.client.host
    
    # Check if locked out
    if brute_force_protector.is_locked_out(client_ip):
        return JSONResponse(
            status_code=429,
            content={"error": "Too many failed attempts. Try again in 15 minutes."}
        )
    
    # Verify credentials
    if not verify_credentials(credentials):
        brute_force_protector.record_attempt(client_ip)
        return JSONResponse(
            status_code=401,
            content={"error": "Invalid credentials"}
        )
    
    # Success - reset attempts
    brute_force_protector.reset_attempts(client_ip)
    return {"success": True}
```

**Configuration**:
```python
brute_force_protector = BruteForceProtector(
    max_attempts=5,        # attempts before lockout
    lockout_minutes=15     # lockout duration
)
```

**Benefits**:
- Prevents password guessing
- Protects against credential stuffing
- Automatic recovery after timeout

---

## 6. SECURE HEADERS 📡

**What it does**: Adds HTTP security headers to all responses

**Implementation**:
```python
from api.security import get_security_headers
from fastapi.middleware.cors import CORSMiddleware

# Add security headers middleware
@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    response = await call_next(request)
    headers = get_security_headers()
    for header, value in headers.items():
        response.headers[header] = value
    return response

# Also configure CORS properly
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:8000", "https://yourdomain.com"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["*"],
)
```

**Headers Added**:
- `X-Content-Type-Options: nosniff` - Prevents MIME type sniffing
- `X-Frame-Options: DENY` - Prevents clickjacking
- `X-XSS-Protection: 1; mode=block` - XSS protection
- `Strict-Transport-Security` - Forces HTTPS
- `Content-Security-Policy` - Controls resource loading
- `Referrer-Policy` - Controls referrer information
- `Permissions-Policy` - Restricts browser features

**Benefits**:
- Prevents common attacks
- Browser-level protection
- Industry best practices

---

## 7. PASSWORD HASHING 🔑

**What it does**: Securely hashes passwords using PBKDF2

**Implementation**:
```python
from api.security import PasswordHasher

# Hash password on registration
password = "user_password"
hash_value, salt = PasswordHasher.hash_password(password)

# Store both hash_value and salt in database
# database.save_user(username, hash_value, salt)

# Verify password on login
stored_hash = database.get_user_hash(username)
stored_salt = database.get_user_salt(username)

if PasswordHasher.verify_password(password, stored_hash, stored_salt):
    # Password is correct
    pass
else:
    # Password is incorrect
    pass
```

**Benefits**:
- Protects against rainbow tables
- Uses strong hashing algorithm
- Salted hashes prevent collisions

---

## 8. SESSION MANAGEMENT 👤

**What it does**: Manages user sessions securely with timeout and IP binding

**Implementation**:
```python
from api.security import session_manager

# Create session on login
@app.post("/api/login")
async def login(request: Request, credentials: dict):
    # Verify credentials
    user_id = verify_credentials(credentials)
    client_ip = request.client.host
    
    # Create session
    session_id = session_manager.create_session(user_id, client_ip)
    
    response = JSONResponse({"success": True})
    response.set_cookie("session_id", session_id, httponly=True, secure=True)
    return response

# Validate session on protected endpoints
@app.get("/api/protected")
async def protected_endpoint(request: Request):
    session_id = request.cookies.get("session_id")
    client_ip = request.client.host
    
    if not session_manager.validate_session(session_id, client_ip):
        return JSONResponse(
            status_code=401,
            content={"error": "Unauthorized"}
        )
    
    # Process request
    pass

# Logout
@app.post("/api/logout")
async def logout(request: Request):
    session_id = request.cookies.get("session_id")
    session_manager.destroy_session(session_id)
    return {"success": True}
```

**Configuration**:
```python
session_manager = SessionManager(
    session_timeout_minutes=30  # auto-logout after 30 min
)
```

**Benefits**:
- Prevents session hijacking
- Auto-logout on timeout
- IP binding prevents token theft

---

## 9. ENVIRONMENT VARIABLES 🔐

**What it does**: Keeps sensitive data out of code

**Current .env**:
```env
API_KEY=6116982da6b759-28f8-4cdf-b210-04cb98116165
BASE_URL=https://apitest-hms.tripjack.com/
```

**Recommended additions**:
```env
# API Configuration
API_KEY=your_api_key_here
BASE_URL=https://apitest-hms.tripjack.com/

# Security
SECRET_KEY=your_secret_key_here
JWT_SECRET=your_jwt_secret_here
CORS_ORIGINS=http://localhost:8000,https://yourdomain.com

# Database (if using)
DATABASE_URL=postgresql://user:password@localhost/dbname

# Logging
LOG_LEVEL=INFO
AUDIT_LOG_FILE=audit_log.json

# Rate Limiting
RATE_LIMIT_REQUESTS=100
RATE_LIMIT_WINDOW=60

# Session
SESSION_TIMEOUT_MINUTES=30
```

**Usage in code**:
```python
import os
from dotenv import load_dotenv

load_dotenv()

SECRET_KEY = os.getenv("SECRET_KEY")
JWT_SECRET = os.getenv("JWT_SECRET")
CORS_ORIGINS = os.getenv("CORS_ORIGINS", "").split(",")
```

**Benefits**:
- Secrets not in version control
- Easy environment switching
- Secure deployment

---

## 10. HTTPS/TLS 🔒

**What it does**: Encrypts all communication between client and server

**Implementation**:
```python
# In production, use HTTPS
# For development with self-signed cert:
# openssl req -x509 -newkey rsa:4096 -nodes -out cert.pem -keyout key.pem -days 365

# Run with SSL
# uvicorn api.main:app --ssl-keyfile=key.pem --ssl-certfile=cert.pem
```

**Production Setup**:
- Use Let's Encrypt for free SSL certificates
- Configure in Nginx/Apache reverse proxy
- Enable HSTS header (already in security headers)

**Benefits**:
- Encrypts data in transit
- Prevents man-in-the-middle attacks
- Required for sensitive data

---

## 11. INPUT VALIDATION ON FRONTEND 📝

**What it does**: Validates data before sending to server

**Implementation**:
```javascript
// Validate booking data
function validateBookingData(data) {
    const errors = [];
    
    // Check required fields
    if (!data.hotelId || typeof data.hotelId !== 'string') {
        errors.push("Invalid hotel ID");
    }
    
    // Validate dates
    const checkIn = new Date(data.checkIn);
    const checkOut = new Date(data.checkOut);
    
    if (checkIn >= checkOut) {
        errors.push("Check-out must be after check-in");
    }
    
    // Validate email
    if (!data.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
        errors.push("Invalid email address");
    }
    
    // Validate phone
    if (!data.phone.match(/^\d{10,}$/)) {
        errors.push("Invalid phone number");
    }
    
    return errors;
}

// Use validation
const errors = validateBookingData(bookingData);
if (errors.length > 0) {
    showErrors(errors);
    return;
}

// Send to server
fetch('/api/booking', {
    method: 'POST',
    body: JSON.stringify(bookingData)
});
```

**Benefits**:
- Better user experience
- Reduces server load
- First line of defense

---

## 12. API KEY ROTATION 🔄

**What it does**: Regularly changes API keys to limit exposure

**Implementation**:
```python
# Store multiple API keys with expiration
API_KEYS = {
    "current": {
        "key": "6116982da6b759-28f8-4cdf-b210-04cb98116165",
        "created": "2024-01-01",
        "expires": "2024-04-01"
    },
    "previous": {
        "key": "old_key_here",
        "created": "2023-10-01",
        "expires": "2024-01-01"
    }
}

# Validate API key
def validate_api_key(api_key: str) -> bool:
    for key_type, key_data in API_KEYS.items():
        if key_data["key"] == api_key:
            expiry = datetime.fromisoformat(key_data["expires"])
            if datetime.now() < expiry:
                return True
    return False
```

**Rotation Schedule**:
- Rotate every 90 days
- Keep previous key for 30 days
- Alert on key expiration

**Benefits**:
- Limits damage from key compromise
- Enforces security practices
- Audit trail of key changes

---

## Implementation Checklist

- [ ] Add rate limiting to all endpoints
- [ ] Implement request validation
- [ ] Enable audit logging
- [ ] Add CSRF protection
- [ ] Implement brute force protection
- [ ] Add security headers
- [ ] Use password hashing for auth
- [ ] Implement session management
- [ ] Add all environment variables
- [ ] Enable HTTPS in production
- [ ] Add frontend input validation
- [ ] Set up API key rotation
- [ ] Configure CORS properly
- [ ] Enable IP whitelisting (already done)
- [ ] Set up monitoring/alerting

---

## Quick Start

1. **Import security module**:
```python
from api.security import (
    rate_limiter,
    audit_logger,
    csrf_protection,
    brute_force_protector,
    session_manager,
    get_security_headers,
    RequestValidator,
    PasswordHasher
)
```

2. **Add security headers middleware**:
```python
@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    response = await call_next(request)
    headers = get_security_headers()
    for header, value in headers.items():
        response.headers[header] = value
    return response
```

3. **Add rate limiting to endpoints**:
```python
if not rate_limiter.is_allowed(client_ip):
    return JSONResponse(status_code=429, content={"error": "Too many requests"})
```

4. **Enable audit logging**:
```python
audit_logger.log_api_key_access(client_ip, endpoint, success)
```

---

## Monitoring & Alerts

**Check audit logs regularly**:
```bash
# View recent warnings
cat audit_log.json | grep "WARNING"

# Count failed auth attempts
cat audit_log.json | grep "FAILED_AUTH" | wc -l
```

**Set up alerts for**:
- Multiple failed auth attempts
- Rate limit violations
- Suspicious IP addresses
- API key access patterns

---

## Additional Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [FastAPI Security](https://fastapi.tiangolo.com/tutorial/security/)
- [NIST Cybersecurity Framework](https://www.nist.gov/cyberframework)
- [CWE Top 25](https://cwe.mitre.org/top25/)

---

## Status: ✅ READY TO IMPLEMENT

All security features are available in `api/security.py`. Choose which ones to implement based on your needs.
