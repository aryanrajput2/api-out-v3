#!/bin/bash

echo "🚀 Starting Railway Deployment..."
echo ""

# Check if railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo "📦 Installing Railway CLI..."
    npm install -g @railway/cli
fi

echo "🔐 Logging in to Railway..."
railway login

echo ""
echo "🏗️  Initializing Railway project..."
railway init

echo ""
echo "📤 Deploying to Railway..."
railway up

echo ""
echo "✅ Deployment complete!"
echo ""
echo "🌐 Getting your public URL..."
railway open

echo ""
echo "📋 View logs with: railway logs -f"
