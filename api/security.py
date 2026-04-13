"""
Security Module - Comprehensive security features for the API
"""

import hashlib
import secrets
import json
import os
from datetime import datetime, timedelta
from typing import Dict, List, Optional
from functools import wraps
import logging

logger = logging.getLogger(__name__)

# ============================================
# 1. RATE LIMITING
# ============================================

class RateLimiter:
    """Rate limiting to prevent abuse"""
    
    def __init__(self, max_requests: int = 100, window_seconds: int = 60):
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        self.requests: Dict[str, List[datetime]] = {}
    
    def is_allowed(self, identifier: str) -> bool:
        """Check if request is allowed for identifier (IP, user, etc)"""
        now = datetime.now()
        
        if identifier not in self.requests:
            self.requests[identifier] = []
        
        # Remove old requests outside the window
        self.requests[identifier] = [
            req_time for req_time in self.requests[identifier]
            if (now - req_time).total_seconds() < self.window_seconds
        ]
        
        # Check if limit exceeded
        if len(self.requests[identifier]) >= self.max_requests:
            return False
        
        # Add current request
        self.requests[identifier].append(now)
        return True
    
    def get_remaining(self, identifier: str) -> int:
        """Get remaining requests for identifier"""
        now = datetime.now()
        
        if identifier not in self.requests:
            return self.max_requests
        
        # Remove old requests
        self.requests[identifier] = [
            req_time for req_time in self.requests[identifier]
            if (now - req_time).total_seconds() < self.window_seconds
        ]
        
        return max(0, self.max_requests - len(self.requests[identifier]))


# ============================================
# 2. REQUEST VALIDATION & SANITIZATION
# ============================================

class RequestValidator:
    """Validate and sanitize incoming requests"""
    
    @staticmethod
    def sanitize_string(value: str, max_length: int = 1000) -> str:
        """Remove potentially dangerous characters"""
        if not isinstance(value, str):
            return ""
        
        # Limit length
        value = value[:max_length]
        
        # Remove null bytes
        value = value.replace('\x00', '')
        
        # Remove control characters
        value = ''.join(char for char in value if ord(char) >= 32 or char in '\n\r\t')
        
        return value.strip()
    
    @staticmethod
    def validate_ip(ip: str) -> bool:
        """Validate IP address format"""
        parts = ip.split('.')
        if len(parts) != 4:
            return False
        
        try:
            for part in parts:
                num = int(part)
                if num < 0 or num > 255:
                    return False
            return True
        except ValueError:
            return False
    
    @staticmethod
    def validate_email(email: str) -> bool:
        """Basic email validation"""
        if not isinstance(email, str) or len(email) > 254:
            return False
        
        if '@' not in email or '.' not in email.split('@')[1]:
            return False
        
        return True
    
    @staticmethod
    def validate_api_key(api_key: str) -> bool:
        """Validate API key format"""
        if not isinstance(api_key, str):
            return False
        
        # API keys should be alphanumeric with hyphens, 30-50 chars
        if len(api_key) < 30 or len(api_key) > 100:
            return False
        
        # Check for valid characters
        valid_chars = set('abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-_')
        return all(c in valid_chars for c in api_key)


# ============================================
# 3. AUDIT LOGGING
# ============================================

class AuditLogger:
    """Log security-relevant events"""
    
    def __init__(self, log_file: str = "audit_log.json"):
        self.log_file = log_file
        self._ensure_file_exists()
    
    def _ensure_file_exists(self):
        """Create log file if it doesn't exist"""
        if not os.path.exists(self.log_file):
            with open(self.log_file, 'w') as f:
                json.dump([], f)
    
    def log_event(self, event_type: str, details: Dict, severity: str = "INFO"):
        """Log a security event"""
        try:
            event = {
                "timestamp": datetime.now().isoformat(),
                "type": event_type,
                "severity": severity,
                "details": details
            }
            
            # Read existing logs
            with open(self.log_file, 'r') as f:
                logs = json.load(f)
            
            # Add new event
            logs.append(event)
            
            # Keep only last 10000 events
            logs = logs[-10000:]
            
            # Write back
            with open(self.log_file, 'w') as f:
                json.dump(logs, f, indent=2)
            
            logger.info(f"[{severity}] {event_type}: {details}")
        except Exception as e:
            logger.error(f"Failed to log audit event: {e}")
    
    def log_failed_auth(self, ip: str, reason: str):
        """Log failed authentication attempt"""
        self.log_event(
            "FAILED_AUTH",
            {"ip": ip, "reason": reason},
            severity="WARNING"
        )
    
    def log_suspicious_activity(self, ip: str, activity: str):
        """Log suspicious activity"""
        self.log_event(
            "SUSPICIOUS_ACTIVITY",
            {"ip": ip, "activity": activity},
            severity="WARNING"
        )
    
    def log_api_key_access(self, ip: str, endpoint: str, success: bool):
        """Log API key access attempts"""
        self.log_event(
            "API_KEY_ACCESS",
            {"ip": ip, "endpoint": endpoint, "success": success},
            severity="INFO"
        )
    
    def get_recent_events(self, limit: int = 100, severity: Optional[str] = None):
        """Get recent audit events"""
        try:
            with open(self.log_file, 'r') as f:
                logs = json.load(f)
            
            if severity:
                logs = [log for log in logs if log.get("severity") == severity]
            
            return logs[-limit:]
        except Exception as e:
            logger.error(f"Failed to read audit logs: {e}")
            return []


# ============================================
# 4. CSRF PROTECTION
# ============================================

class CSRFProtection:
    """CSRF token generation and validation"""
    
    def __init__(self):
        self.tokens: Dict[str, Dict] = {}
    
    def generate_token(self, session_id: str) -> str:
        """Generate a CSRF token for a session"""
        token = secrets.token_urlsafe(32)
        self.tokens[session_id] = {
            "token": token,
            "created": datetime.now(),
            "used": False
        }
        return token
    
    def validate_token(self, session_id: str, token: str) -> bool:
        """Validate a CSRF token"""
        if session_id not in self.tokens:
            return False
        
        stored = self.tokens[session_id]
        
        # Check if token matches
        if stored["token"] != token:
            return False
        
        # Check if token is expired (1 hour)
        if (datetime.now() - stored["created"]).total_seconds() > 3600:
            del self.tokens[session_id]
            return False
        
        # Token is valid, mark as used and generate new one
        stored["used"] = True
        return True
    
    def cleanup_old_tokens(self):
        """Remove expired tokens"""
        now = datetime.now()
        expired = [
            sid for sid, data in self.tokens.items()
            if (now - data["created"]).total_seconds() > 3600
        ]
        for sid in expired:
            del self.tokens[sid]


# ============================================
# 5. BRUTE FORCE PROTECTION
# ============================================

class BruteForceProtector:
    """Protect against brute force attacks"""
    
    def __init__(self, max_attempts: int = 5, lockout_minutes: int = 15):
        self.max_attempts = max_attempts
        self.lockout_minutes = lockout_minutes
        self.attempts: Dict[str, List[datetime]] = {}
        self.lockouts: Dict[str, datetime] = {}
    
    def record_attempt(self, identifier: str):
        """Record a failed attempt"""
        if identifier not in self.attempts:
            self.attempts[identifier] = []
        
        self.attempts[identifier].append(datetime.now())
    
    def is_locked_out(self, identifier: str) -> bool:
        """Check if identifier is locked out"""
        # Check if in lockout period
        if identifier in self.lockouts:
            if (datetime.now() - self.lockouts[identifier]).total_seconds() < self.lockout_minutes * 60:
                return True
            else:
                del self.lockouts[identifier]
        
        # Check attempt count
        if identifier in self.attempts:
            now = datetime.now()
            # Remove attempts older than lockout window
            self.attempts[identifier] = [
                attempt for attempt in self.attempts[identifier]
                if (now - attempt).total_seconds() < self.lockout_minutes * 60
            ]
            
            if len(self.attempts[identifier]) >= self.max_attempts:
                self.lockouts[identifier] = datetime.now()
                return True
        
        return False
    
    def reset_attempts(self, identifier: str):
        """Reset attempts for identifier"""
        if identifier in self.attempts:
            del self.attempts[identifier]
        if identifier in self.lockouts:
            del self.lockouts[identifier]


# ============================================
# 6. SECURE HEADERS
# ============================================

def get_security_headers() -> Dict[str, str]:
    """Get security headers for responses"""
    return {
        "X-Content-Type-Options": "nosniff",
        "X-Frame-Options": "DENY",
        "X-XSS-Protection": "1; mode=block",
        "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
        "Content-Security-Policy": "default-src 'self'; script-src 'self' 'unsafe-inline' https://unpkg.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self'",
        "Referrer-Policy": "strict-origin-when-cross-origin",
        "Permissions-Policy": "geolocation=(), microphone=(), camera=()"
    }


# ============================================
# 7. PASSWORD HASHING (for future auth)
# ============================================

class PasswordHasher:
    """Secure password hashing"""
    
    @staticmethod
    def hash_password(password: str, salt: Optional[str] = None) -> tuple:
        """Hash password with salt"""
        if salt is None:
            salt = secrets.token_hex(32)
        
        # Use PBKDF2 with SHA-256
        hash_obj = hashlib.pbkdf2_hmac(
            'sha256',
            password.encode('utf-8'),
            salt.encode('utf-8'),
            100000  # iterations
        )
        
        return hash_obj.hex(), salt
    
    @staticmethod
    def verify_password(password: str, hash_value: str, salt: str) -> bool:
        """Verify password against hash"""
        computed_hash, _ = PasswordHasher.hash_password(password, salt)
        return computed_hash == hash_value


# ============================================
# 8. SESSION MANAGEMENT
# ============================================

class SessionManager:
    """Manage user sessions securely"""
    
    def __init__(self, session_timeout_minutes: int = 30):
        self.session_timeout_minutes = session_timeout_minutes
        self.sessions: Dict[str, Dict] = {}
    
    def create_session(self, user_id: str, ip: str) -> str:
        """Create a new session"""
        session_id = secrets.token_urlsafe(32)
        self.sessions[session_id] = {
            "user_id": user_id,
            "ip": ip,
            "created": datetime.now(),
            "last_activity": datetime.now()
        }
        return session_id
    
    def validate_session(self, session_id: str, ip: str) -> bool:
        """Validate session"""
        if session_id not in self.sessions:
            return False
        
        session = self.sessions[session_id]
        
        # Check IP hasn't changed
        if session["ip"] != ip:
            return False
        
        # Check timeout
        if (datetime.now() - session["last_activity"]).total_seconds() > self.session_timeout_minutes * 60:
            del self.sessions[session_id]
            return False
        
        # Update last activity
        session["last_activity"] = datetime.now()
        return True
    
    def destroy_session(self, session_id: str):
        """Destroy a session"""
        if session_id in self.sessions:
            del self.sessions[session_id]


# ============================================
# GLOBAL INSTANCES
# ============================================

rate_limiter = RateLimiter(max_requests=100, window_seconds=60)
audit_logger = AuditLogger("audit_log.json")
csrf_protection = CSRFProtection()
brute_force_protector = BruteForceProtector(max_attempts=5, lockout_minutes=15)
session_manager = SessionManager(session_timeout_minutes=30)
