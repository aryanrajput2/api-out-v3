#!/bin/bash

# Start Slim tunnel for hotelapi
echo "Starting Slim tunnel..."
echo "Your public URL will be: https://hotelapi.slim.show"
echo ""
echo "Keep this terminal open while the tunnel is running."
echo "Press Ctrl+C to stop the tunnel."
echo ""

slim share --port 8000 --subdomain hotelapi
