# Server Logs Documentation

## Overview
All API requests and responses are automatically logged to the `Server_logs/` folder with timestamps and client IP addresses.

## Log Format

Each log entry is stored as JSON with the following structure:

### REQUEST Log
```json
{
  "timestamp": "2026-03-14 11:41:23.227",
  "type": "REQUEST",
  "ip": "192.168.1.100",
  "endpoint": "/search",
  "method": "POST",
  "body": { ... }
}
```

### RESPONSE Log
```json
{
  "timestamp": "2026-03-14 11:41:23.228",
  "type": "RESPONSE",
  "ip": "192.168.1.100",
  "endpoint": "/search",
  "status_code": 200,
  "response": { ... }
}
```

## Log Files

- **Location**: `Server_logs/`
- **Naming**: `YYYY-MM-DD.log` (one file per day)
- **Format**: JSON Lines (one JSON object per line)

## Viewing Logs

### Option 1: Using the Log Viewer Script
```bash
# View all logs for a specific date
python3 view_logs.py 2026-03-14

# View logs for a specific endpoint
python3 view_logs.py 2026-03-14 /search

# View all logs
python3 view_logs.py
```

### Option 2: Direct File Access
```bash
# View raw logs
cat Server_logs/2026-03-14.log

# Pretty print logs
cat Server_logs/2026-03-14.log | python3 -m json.tool
```

## Logged Endpoints

The following endpoints are logged:
- `/search` - Hotel search
- `/review` - Hotel review
- `/book` - Hotel booking
- `/booking-detail` - Booking details
- `/cancel` - Cancel booking
- `/dynamic-detail` - Dynamic hotel details
- `/static-detail` - Static hotel details
- `/hotel-codes/{location}` - Load hotel codes
- `/batch-search` - Batch hotel search

## Information Captured

### Request Logs Include:
- Timestamp (millisecond precision)
- Client IP address
- HTTP method (GET, POST, etc.)
- Endpoint path
- Request body/parameters

### Response Logs Include:
- Timestamp (millisecond precision)
- Client IP address
- Endpoint path
- HTTP status code
- Response data

## IP Address Detection

The system automatically detects the client IP from:
1. Direct connection IP (`request.client.host`)
2. X-Forwarded-For header (for proxied requests)
3. Falls back to `127.0.0.1` if unavailable

## Log Retention

Logs are organized by date. Old logs can be archived or deleted as needed:
```bash
# Archive logs older than 30 days
find Server_logs/ -name "*.log" -mtime +30 -exec gzip {} \;

# Delete logs older than 90 days
find Server_logs/ -name "*.log" -mtime +90 -delete
```
