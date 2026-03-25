#!/bin/bash
echo "Starting Tripjack Hotel API Server..."

# Kill any existing process on port 8000 to avoid "Address already in use"
echo "Cleaning up port 8000..."
lsof -t -i:8000 | xargs kill -9 2>/dev/null || true

# Activate the virtual environment
source .venv/bin/activate

# Kill any old tunnel instances
pkill -f pinggy 2>/dev/null || true
pkill -f localtunnel 2>/dev/null || true
pkill -f serveo 2>/dev/null || true

# Prompt user for tunnel preference
echo ""
echo "Choose tunnel service:"
echo "  1) serveo (constant static URL, opens immediately on all laptops)"
echo "  2) Local only (no tunnel) [default]"
echo ""
read -p "Enter choice (1 or 2) [default: 2]: " TUNNEL_CHOICE
TUNNEL_CHOICE=${TUNNEL_CHOICE:-2}

TUNNEL_URL=""

if [ "$TUNNEL_CHOICE" = "1" ]; then
    # Use serveo for a CONSTANT static URL
    echo ""
    echo "Starting serveo tunnel..."
    
    # We use a unique, hardcoded subdomain so it never changes
    CUSTOM_SUBDOMAIN="tripjack-api-v3-static"
    
    nohup ssh -o StrictHostKeyChecking=no -R ${CUSTOM_SUBDOMAIN}:80:127.0.0.1:8000 serveo.net < /dev/null > serveo.log 2>&1 &
    TUNNEL_PID=$!
    echo "serveo tunnel started (PID: $TUNNEL_PID)"
    
    # Wait for tunnel to establish
    echo "  Waiting for serveo to establish..."
    sleep 5
    
    # Try multiple times to check serveo.log
    for i in {1..12}; do
        if grep -q "Forwarding HTTP traffic" serveo.log 2>/dev/null; then
            TUNNEL_URL=$(grep "Forwarding HTTP traffic from" serveo.log | grep -o 'https://[^ ]*' | tr -d '\r' | sed 's/\x1b\[[0-9;]*m//g')
            echo "✅ serveo established!"
            break
        fi
        echo "  Retrying... ($i/12)"
        sleep 1
    done
    
    if grep -q "To request a particular subdomain" serveo.log 2>/dev/null; then
        AUTH_LINK=$(grep -o 'https://console.serveo.net/ssh/keys?[^ ]*' serveo.log | tr -d '\r' | sed 's/\x1b\[[0-9;]*m//g' | head -n 1)
        echo ""
        echo "⚠️  SERveo requires a quick one-time authentication to give you a CONSTANT URL."
        echo "   Please open this link in your browser and click 'Login with GitHub':"
        echo "   👉 $AUTH_LINK"
        echo "   (Until you do, you have been assigned the random fallback URL above. Restart this script after logging in to get your static URL!)"
    fi
fi

# Display tunnel info
if [ -n "$TUNNEL_URL" ]; then
    echo ""
    echo "========================================"
    echo "  ✅ PUBLIC URL: $TUNNEL_URL"
    echo "  🌐 UI: $TUNNEL_URL/ui"
    echo "========================================"
    echo ""
else
    echo ""
    echo "========================================"
    echo "  🏠 LOCAL DEVELOPMENT MODE"
    echo "  🌐 UI: http://localhost:8000/ui"
    echo "  📡 API: http://localhost:8000"
    echo "========================================"
    echo ""
fi

# Start the uvicorn server
echo "Starting uvicorn server..."
uvicorn api.main:app --host 0.0.0.0 --port 8000 --reload
