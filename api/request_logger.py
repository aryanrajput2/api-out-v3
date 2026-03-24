"""
Request/Response Logger - Logs all API requests and responses to a file
"""
import json
import os
from datetime import datetime

LOG_FILE = "api_requests.log"

def log_request(endpoint, method, payload, headers=None):
    """Log incoming request"""
    timestamp = datetime.now().isoformat()
    log_entry = {
        "timestamp": timestamp,
        "type": "REQUEST",
        "endpoint": endpoint,
        "method": method,
        "payload": payload,
        "headers": headers or {}
    }
    _write_log(log_entry)

def log_response(endpoint, status_code, response_data):
    """Log outgoing response"""
    timestamp = datetime.now().isoformat()
    log_entry = {
        "timestamp": timestamp,
        "type": "RESPONSE",
        "endpoint": endpoint,
        "status_code": status_code,
        "response": response_data
    }
    _write_log(log_entry)

def log_api_call(api_name, url, method, payload, headers, response_status, response_data):
    """Log external API call"""
    timestamp = datetime.now().isoformat()
    log_entry = {
        "timestamp": timestamp,
        "type": "API_CALL",
        "api_name": api_name,
        "url": url,
        "method": method,
        "payload": payload,
        "headers": headers,
        "response_status": response_status,
        "response": response_data
    }
    _write_log(log_entry)

def _write_log(log_entry):
    """Write log entry to file"""
    try:
        with open(LOG_FILE, 'a') as f:
            f.write(json.dumps(log_entry) + "\n")
    except Exception as e:
        pass

def clear_logs():
    """Clear log file"""
    try:
        if os.path.exists(LOG_FILE):
            os.remove(LOG_FILE)
    except Exception as e:
        pass
