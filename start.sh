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
echo "  1) ngrok Tunnel (secure public URL, requires ngrok account) [default]"
echo "  2) Local only (no tunnel)"
echo ""
read -p "Enter choice (1 or 2) [default: 1]: " TUNNEL_CHOICE
TUNNEL_CHOICE=${TUNNEL_CHOICE:-1}

TUNNEL_URL=""

if [ "$TUNNEL_CHOICE" = "1" ]; then
    echo ""
    echo "Starting ngrok Tunnel..."
    echo "Make sure you have ngrok installed and authenticated..."
    
    # Check if ngrok is installed
    if ! command -v ngrok &> /dev/null; then
        echo "❌ ngrok is not installed. Please install it first:"
        echo "   brew install ngrok  (macOS)"
        echo "   choco install ngrok (Windows)"
        echo "   Or download from: https://ngrok.com/download"
        exit 1
    fi
    
    # Start ngrok tunnel in background
    nohup ngrok http 8000 > ngrok.log 2>&1 &
    TUNNEL_PID=$!
    echo "ngrok tunnel started (PID: $TUNNEL_PID)"
    sleep 3
    
    # Extract the ngrok URL from the API
    TUNNEL_URL=$(curl -s http://localhost:4040/api/tunnels | grep -o '"public_url":"[^"]*' | cut -d'"' -f4 | head -1)
    
    if [ -z "$TUNNEL_URL" ]; then
        echo "⚠️  Could not retrieve ngrok URL. Check ngrok.log for details."
        TUNNEL_URL="http://localhost:8000 (ngrok may not be running)"
    fi
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
