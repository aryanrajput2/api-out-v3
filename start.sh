#!/bin/bash
echo "Starting Tripjack Hotel API Server..."
# Activate the virtual environment where your Python packages are installed
source .venv/bin/activate

# Start the uvicorn server, exposing it to the local network (0.0.0.0) on port 8000
uvicorn api.main:app --host 0.0.0.0 --port 8000 --reload
