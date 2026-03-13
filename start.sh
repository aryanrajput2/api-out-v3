#!/bin/bash
echo "Starting Tripjack Hotel API Server..."

# Kill any existing process on port 8000 to avoid "Address already in use"
echo "Cleaning up port 8000..."
lsof -t -i:8000 | xargs kill -9 2>/dev/null || true

# Activate the virtual environment
source .venv/bin/activate

# Kill any old ngrok instances
pkill -f ngrok 2>/dev/null || true

# Find ngrok executable
NGROK_CMD="ngrok"
if [ ! -x "$(command -v ngrok)" ]; then
    # Try common Homebrew path as fallback if not in PATH
    if [ -x "/opt/homebrew/bin/ngrok" ]; then
        NGROK_CMD="/opt/homebrew/bin/ngrok"
    else
        echo "  ❌ ngrok not found in PATH or /opt/homebrew/bin/"
        echo "  Please install ngrok or ensure it's in your PATH."
        NGROK_CMD=""
    fi
fi

if [ -n "$NGROK_CMD" ]; then
    echo "Starting ngrok tunnel..."
    nohup $NGROK_CMD http 8000 --log=stdout > ngrok.log 2>&1 &
    NGROK_PID=$!
    echo "ngrok started (PID: $NGROK_PID)"

    # Wait a moment then print the public URL
    echo "  Waiting for ngrok tunnel to establish..."
    sleep 5
    NGROK_URL=""
    # Try multiple times to get the URL
    for i in {1..5}; do
        NGROK_URL=$(curl -s localhost:4040/api/tunnels 2>/dev/null | python3 -c "import sys, json; data=sys.stdin.read(); print(json.loads(data)['tunnels'][0]['public_url'] if data else '')" 2>/dev/null)
        if [ -n "$NGROK_URL" ]; then
            break
        fi
        sleep 2
    done
    
    if [ -n "$NGROK_URL" ]; then
        echo ""
        echo "========================================"
        echo "  ✅ PUBLIC URL: $NGROK_URL"
        echo "  🌐 UI: $NGROK_URL/ui"
        echo "========================================"
        echo ""
    else
        echo "  ⚠️  ngrok URL not ready yet — check ngrok.log for details."
        echo "  You can manually check the URL by running: curl localhost:4040/api/tunnels"
    fi
fi

# Start the uvicorn server
echo "Starting uvicorn server..."
uvicorn api.main:app --host 0.0.0.0 --port 8000 --reload
