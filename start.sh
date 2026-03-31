#!/bin/bash
echo "Starting Tripjack Hotel API Server..."

# Kill any existing process on port 8000 to avoid "Address already in use"
echo "Cleaning up port 8000..."
lsof -t -i:8000 | xargs kill -9 2>/dev/null || true

# Activate the virtual environment
source .venv/bin/activate

# Kill any old tunnel instances
pkill -f cloudflared 2>/dev/null || true
pkill -f serveo 2>/dev/null || true

# Prompt user for tunnel preference
echo ""
echo "Choose tunnel service:"
echo "  1) Cloudflare Tunnel (stable, free, persistent URL with account)"
echo "  2) Local only (no tunnel) [default]"
echo ""
read -p "Enter choice (1 or 2) [default: 2]: " TUNNEL_CHOICE
TUNNEL_CHOICE=${TUNNEL_CHOICE:-2}

TUNNEL_URL=""

if [ "$TUNNEL_CHOICE" = "1" ]; then
    echo ""
    echo "Starting Cloudflare Tunnel..."

    # Check if user is logged in to Cloudflare
    if [ ! -f "$HOME/.cloudflared/cert.pem" ]; then
        echo ""
        echo "⚠️  You are not logged in to Cloudflare."
        echo "   Running: cloudflared tunnel login"
        echo "   A browser window will open — sign in with your Cloudflare account."
        echo ""
        cloudflared tunnel login
    fi

    # Check if named tunnel 'tripjack-api' already exists
    TUNNEL_NAME="tripjack-api"
    TUNNEL_EXISTS=$(cloudflared tunnel list 2>/dev/null | grep "$TUNNEL_NAME" | wc -l | tr -d ' ')

    if [ "$TUNNEL_EXISTS" = "0" ]; then
        echo "Creating Cloudflare tunnel: $TUNNEL_NAME ..."
        cloudflared tunnel create $TUNNEL_NAME

        echo ""
        echo "==========================================="
        echo "  ✅ Tunnel created!"
        echo "  Next step: assign a hostname to it."
        echo "  Run this command (replace with your domain):"
        echo "    cloudflared tunnel route dns $TUNNEL_NAME <your-subdomain.yourdomain.com>"
        echo "  Then restart this script."
        echo "==========================================="
        echo ""
        echo "  If you don't have a domain, use the quick URL mode below instead."
        echo "  Falling back to Cloudflare quick URL (random, changes on restart)..."
        echo ""

        # Quick URL fallback (no login needed, random URL each time)
        nohup cloudflared tunnel --url http://localhost:8000 > cloudflare.log 2>&1 &
        TUNNEL_PID=$!
        echo "Cloudflare quick tunnel started (PID: $TUNNEL_PID)"
        sleep 6

        TUNNEL_URL=$(grep -o 'https://[a-z0-9\-]*\.trycloudflare\.com' cloudflare.log | head -n1)
    else
        echo "Starting existing tunnel: $TUNNEL_NAME ..."
        nohup cloudflared tunnel run $TUNNEL_NAME > cloudflare.log 2>&1 &
        TUNNEL_PID=$!
        echo "Cloudflare tunnel started (PID: $TUNNEL_PID)"
        sleep 5

        TUNNEL_URL=$(cloudflared tunnel list 2>/dev/null | grep "$TUNNEL_NAME" | awk '{print $3}' || true)
        if [ -z "$TUNNEL_URL" ]; then
            TUNNEL_URL="<check Cloudflare dashboard for your domain>"
        fi
    fi
fi

# Display tunnel info
echo ""
echo "=========================================="
if [ -n "$TUNNEL_URL" ]; then
    echo "  ✅ PUBLIC URL: $TUNNEL_URL"
    echo "  🌐 UI: $TUNNEL_URL/ui"
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
