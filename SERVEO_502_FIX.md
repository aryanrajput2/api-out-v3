# Serveo 502 Error - Troubleshooting Guide

## Problem
Getting HTTP 502 error when accessing `apiv3.hotel.serveousercontent.com`

## Root Cause
The Serveo tunnel connection may have issues due to:
1. Serveo service intermittent connectivity
2. SSH tunnel not properly established
3. Network connectivity issues
4. Serveo domain reservation issues

## Solutions

### Solution 1: Restart the Tunnel (Quick Fix)
```bash
# Kill existing tunnel
pkill -9 -f "ssh -R"

# Wait a moment
sleep 2

# Restart tunnel with fresh connection
nohup ssh -R apiv3.hotel.serveousercontent.com:80:localhost:8000 serveo.net > /tmp/serveo.log 2>&1 &

# Wait for connection to establish
sleep 5

# Test the connection
curl -I https://apiv3.hotel.serveousercontent.com/health
```

### Solution 2: Use a Different Serveo Domain
If the custom domain isn't working, try a random Serveo domain:
```bash
# Kill existing tunnel
pkill -9 -f "ssh -R"

# Start with random domain (Serveo will assign one)
nohup ssh -R 80:localhost:8000 serveo.net > /tmp/serveo.log 2>&1 &

# Check the log to see your assigned URL
cat /tmp/serveo.log
```

### Solution 3: Use Local Development Mode
If Serveo continues to have issues, use local development:
```bash
# Access locally
http://localhost:8000/ui
http://localhost:8000/ui/dashboard
```

### Solution 4: Check SSH Connection
```bash
# Test SSH connection to Serveo
ssh -v serveo.net

# If this fails, Serveo might be down or your network is blocking SSH
```

## Verification Steps

### Step 1: Check Local Server
```bash
curl http://localhost:8000/health
# Should return: {"ok":true}
```

### Step 2: Check Tunnel Process
```bash
ps aux | grep "ssh -R" | grep -v grep
# Should show the SSH tunnel process
```

### Step 3: Check Tunnel Connection
```bash
curl -I https://apiv3.hotel.serveousercontent.com/health
# Should return: HTTP/2 200 (not 502)
```

## Current Status

✅ **Local API**: Working on `http://localhost:8000`
✅ **Server Process**: Running (uvicorn)
❌ **Serveo Tunnel**: Returning 502 error

## Recommended Action

### For Development
Use local development mode:
- UI: `http://localhost:8000/ui`
- Dashboard: `http://localhost:8000/ui/dashboard`
- API: `http://localhost:8000`

### For Production
Consider alternatives to Serveo:
1. **ngrok** - More reliable, requires signup
2. **Cloudflare Tunnel** - More stable
3. **Railway/Render** - Full deployment platforms
4. **AWS/GCP** - Cloud hosting

## Quick Commands

### Restart Everything
```bash
# Kill all processes
pkill -9 -f "ssh -R"
pkill -9 -f uvicorn

# Restart from start.sh
./start.sh
```

### Check Logs
```bash
# Serveo tunnel log
tail -f /tmp/serveo.log

# API server log (if running in background)
tail -f nohup.out
```

### Test API Endpoints
```bash
# Health check
curl http://localhost:8000/health

# Search endpoint
curl -X POST http://localhost:8000/search \
  -H "Content-Type: application/json" \
  -d '{"checkIn":"2024-04-15","checkOut":"2024-04-16"}'

# Dashboard
curl http://localhost:8000/ui/dashboard
```

## Why 502 Happens

502 Bad Gateway means:
- The tunnel is established
- But the request isn't reaching the backend
- Possible causes:
  - Backend not responding
  - Tunnel misconfiguration
  - Network timeout
  - Serveo service issue

## Prevention

1. **Monitor tunnel**: Check tunnel status regularly
2. **Use health checks**: Periodically test `/health` endpoint
3. **Auto-restart**: Set up a cron job to restart tunnel if it fails
4. **Use alternatives**: Consider more reliable tunneling solutions

## Support

If Serveo continues to fail:
1. Check Serveo status: https://serveo.net
2. Try different domain name
3. Switch to local development
4. Consider alternative tunneling service

---

**Status**: Investigating Serveo tunnel connectivity
**Local API**: ✅ Working
**Tunnel**: ❌ 502 Error
**Recommendation**: Use local development or restart tunnel
