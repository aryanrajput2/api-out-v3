#!/bin/bash
echo "Starting Tripjack Hotel API Server..."

# Kill any existing process on port 8000 to avoid "Address already in use"
echo "Cleaning up port 8000..."
lsof -t -i:8000 | xargs kill -9 2>/dev/null || true

# Activate the virtual environment
source .venv/bin/activate

# Kill any old tunnel instances
pkill -f cloudflared 2>/dev/null || true
pkill -f "ssh -R" 2>/dev/null || true
pkill -f "slim share" 2>/dev/null || true

# Prompt user for tunnel preference
echo ""
echo "Choose tunnel service:"
echo "  1) Serveo Tunnel (instant public URL, no signup needed) [default]"
echo "  2) Local only (no tunnel)"
echo ""
read -p "Enter choice (1 or 2) [default: 1]: " TUNNEL_CHOICE
TUNNEL_CHOICE=${TUNNEL_CHOICE:-1}

TUNNEL_URL=""

if [ "$TUNNEL_CHOICE" = "1" ]; then
    echo ""
    echo "Starting Serveo Tunnel..."
    echo "Connecting to serveo.net with your custom domain..."
    
    # Start Serveo tunnel in background with custom domain
    nohup ssh -R apiv3.hotel.serveousercontent.com:80:localhost:8000 serveo.net > serveo.log 2>&1 &
    TUNNEL_PID=$!
    echo "Serveo tunnel started (PID: $TUNNEL_PID)"
    sleep 3
    
    TUNNEL_URL="https://apiv3.hotel.serveousercontent.com"
fi

# Display tunnel info
echo ""
echo "=========================================="
if [ -n "$TUNNEL_URL" ]; then
    echo "  ✅ PUBLIC URL: $TUNNEL_URL"
    echo "  🌐 UI: $TUNNEL_URL/ui"
    echo "  📡 API: $TUNNEL_URL"
else
    echo "  🏠 LOCAL DEVELOPMENT MODE"
    echo "  🌐 UI: http://localhost:8000/ui"
    echo "  📡 API: http://localhost:8000"
fi
echo "=========================================="
echo ""

# Start the uvicorn server
echo "Starting uvicorn server..."
uvicorn api.main:app --host 0.0.0.0 --port 8000 --reload
