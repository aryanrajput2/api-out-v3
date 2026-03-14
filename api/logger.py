import os
import json
from datetime import datetime
from pathlib import Path

LOGS_DIR = "Server_logs"

# Create logs directory if it doesn't exist
Path(LOGS_DIR).mkdir(exist_ok=True)

def get_client_ip(request):
    """Extract client IP from request"""
    client_ip = request.client.host if request.client else "127.0.0.1"
    forwarded_for = request.headers.get("X-Forwarded-For")
    
    if forwarded_for:
        client_ip = forwarded_for.split(",")[0].strip()
    
    return client_ip

def log_request(request, endpoint: str, body: dict = None):
    """Log incoming request"""
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S.%f")[:-3]
    client_ip = get_client_ip(request)
    
    log_entry = {
        "timestamp": timestamp,
        "type": "REQUEST",
        "ip": client_ip,
        "endpoint": endpoint,
        "method": request.method,
        "body": body
    }
    
    _write_log(log_entry)
    return log_entry

def log_response(request, endpoint: str, status_code: int, response_data: dict = None):
    """Log outgoing response"""
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S.%f")[:-3]
    client_ip = get_client_ip(request)
    
    log_entry = {
        "timestamp": timestamp,
        "type": "RESPONSE",
        "ip": client_ip,
        "endpoint": endpoint,
        "status_code": status_code,
        "response": response_data
    }
    
    _write_log(log_entry)
    return log_entry

def _write_log(log_entry: dict):
    """Write log entry to file"""
    try:
        # Create filename based on date
        date_str = datetime.now().strftime("%Y-%m-%d")
        log_file = os.path.join(LOGS_DIR, f"{date_str}.log")
        
        # Append log entry as JSON line
        with open(log_file, 'a') as f:
            f.write(json.dumps(log_entry) + "\n")
    except Exception as e:
        print(f"Error writing log: {e}")
