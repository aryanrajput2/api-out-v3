#!/bin/bash
echo "Starting Tripjack Hotel API Server..."

# Activate the virtual environment where your Python packages are installed
source .venv/bin/activate

# Kill any old ngrok instances
pkill -f ngrok 2>/dev/null || true

# Start ngrok tunnel in background (logs to ngrok.log)
nohup /opt/homebrew/bin/ngrok http 8000 --log=stdout > ngrok.log 2>&1 &
NGROK_PID=$!
echo "ngrok started (PID: $NGROK_PID)"

# Wait a moment then print the public URL
sleep 3
NGROK_URL=$(curl -s localhost:4040/api/tunnels 2>/dev/null | python3 -c "import sys, json; print(json.load(sys.stdin)['tunnels'][0]['public_url'])" 2>/dev/null)
if [ -n "$NGROK_URL" ]; then
    echo ""
    echo "========================================"
    echo "  ✅ PUBLIC URL: $NGROK_URL"
    echo "  🌐 UI: $NGROK_URL/ui"
    echo "========================================"
    echo ""
else
    echo "  ⚠️  ngrok URL not ready yet — check ngrok.log for details."
fi

# Start the uvicorn server, exposing it to the local network (0.0.0.0) on port 8000
uvicorn api.main:app --host 0.0.0.0 --port 8000 --reload
