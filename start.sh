#!/bin/bash
echo "Starting Tripjack Hotel API Server..."

# Kill any existing process on port 8000 to avoid "Address already in use"
echo "Cleaning up port 8000..."
lsof -t -i:8000 | xargs kill -9 2>/dev/null || true

# Activate the virtual environment
source .venv/bin/activate

# Kill any old tunnel instances
pkill -f ngrok 2>/dev/null || true
pkill -f itcyou 2>/dev/null || true

# Prompt user for tunnel preference
echo ""
echo "Choose tunnel service:"
echo "  1) ngrok"
echo "  2) it.cyou"
echo "  3) Local only (no tunnel) [default]"
echo ""
read -p "Enter choice (1, 2, or 3) [default: 3]: " TUNNEL_CHOICE
TUNNEL_CHOICE=${TUNNEL_CHOICE:-3}

TUNNEL_URL=""

if [ "$TUNNEL_CHOICE" = "1" ]; then
    # Use ngrok
    echo ""
    echo "Starting ngrok tunnel..."
    
    # Use direct path to ngrok
    NGROK_CMD="/opt/homebrew/bin/ngrok"
    
    if [ -x "$NGROK_CMD" ]; then
        echo "Found ngrok at: $NGROK_CMD"
        nohup $NGROK_CMD http 8000 --log=stdout > ngrok.log 2>&1 &
        NGROK_PID=$!
        echo "ngrok started (PID: $NGROK_PID)"
        
        # Wait for tunnel to establish
        echo "  Waiting for ngrok tunnel to establish..."
        sleep 10
        
        # Try multiple times to get the URL from ngrok API
        for i in {1..15}; do
            TUNNEL_URL=$(curl -s localhost:4040/api/tunnels 2>/dev/null | python3 -c "import sys, json; data=sys.stdin.read(); print(json.loads(data)['tunnels'][0]['public_url'] if data else '')" 2>/dev/null)
            if [ -n "$TUNNEL_URL" ]; then
                echo "✅ ngrok tunnel established!"
                break
            fi
            echo "  Retrying... ($i/15)"
            sleep 1
        done
        
        if [ -z "$TUNNEL_URL" ]; then
            echo "  ⚠️  ngrok URL not ready yet — check ngrok.log for details."
            sleep 2
        fi
    else
        echo "  ❌ ngrok not found at $NGROK_CMD"
        echo "  Falling back to local development..."
    fi
    
elif [ "$TUNNEL_CHOICE" = "2" ]; then
    # Use it.cyou
    echo ""
    echo "Starting it.cyou tunnel..."
    
    # Check if itcyou is installed
    if ! command -v itcyou &> /dev/null; then
        echo "  Installing itcyou..."
        curl -fsSL https://it.cyou/install.sh | sh
    fi
    
    # Start it.cyou tunnel with a subdomain
    SUBDOMAIN="tripjack-hotel-$(date +%s | tail -c 5)"
    nohup itcyou 8000 -s "$SUBDOMAIN" > itcyou.log 2>&1 &
    ITCYOU_PID=$!
    echo "it.cyou started (PID: $ITCYOU_PID)"
    
    # Wait for tunnel to establish
    echo "  Waiting for it.cyou tunnel to establish..."
    sleep 5
    
    # Extract URL from log
    for i in {1..15}; do
        if grep -q "Tunnel URL" itcyou.log 2>/dev/null; then
            TUNNEL_URL=$(grep "Tunnel URL" itcyou.log | head -1 | awk '{print $NF}')
            break
        fi
        sleep 1
    done
    
    if [ -z "$TUNNEL_URL" ]; then
        TUNNEL_URL="https://${SUBDOMAIN}.it.cyou"
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
