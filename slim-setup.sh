#!/bin/bash

# Install Slim if not already installed
if ! command -v slim &> /dev/null; then
    echo "Installing Slim..."
    curl -sL https://slim.sh/install.sh | sh
fi

# Login to Slim
echo "Logging in to Slim..."
slim login

# Start the tunnel
echo "Starting Slim tunnel..."
slim share --port 8000 --subdomain hotelapi

echo ""
echo "✓ Your public URL is ready:"
echo "  https://hotelapi.slim.show"
echo ""
echo "Share this URL with anyone to access your API!"
