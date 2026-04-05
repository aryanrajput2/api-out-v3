#!/bin/bash

# Start both the API and Slim tunnel together

echo "Starting Hotel API and Slim tunnel..."
echo ""

# Start the API in the background
echo "1. Starting Flask API on port 8000..."
python main.py &
API_PID=$!

# Wait for API to start
sleep 3

# Start Slim tunnel
echo "2. Starting Slim tunnel..."
echo "Your public URL: https://hotelapi.slim.show"
echo ""

slim share --port 8000 --subdomain hotelapi

# Cleanup on exit
trap "kill $API_PID" EXIT
