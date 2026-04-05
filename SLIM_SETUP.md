# Slim Tunnel Setup

Replace Cloudflare with Slim for a permanent public URL.

## Quick Start

### Option 1: Automatic Setup (Recommended)
```bash
chmod +x slim-setup.sh
./slim-setup.sh
```

### Option 2: Manual Setup
```bash
# Install Slim
curl -sL https://slim.sh/install.sh | sh

# Login
slim login

# Start tunnel
slim share --port 8000 --subdomain hotelapi
```

## Your Public URL
```
https://hotelapi.slim.show
```

Share this URL with anyone to access your API!

## Useful Commands

**View active tunnels:**
```bash
slim list
```

**View access logs:**
```bash
slim logs -f hotelapi
```

**Stop the tunnel:**
```bash
slim stop hotelapi
```

**Stop all tunnels:**
```bash
slim stop
```

## Using .slim.yaml (Optional)

If you want to manage multiple services, use the `.slim.yaml` file:

```bash
slim up
```

This will start all services defined in `.slim.yaml`.

To stop all services:
```bash
slim down
```

## Features

- ✓ Permanent public URL (no expiry)
- ✓ HTTPS with trusted certificates
- ✓ No password protection (as requested)
- ✓ Real-time access logs
- ✓ Health monitoring
- ✓ Works with WebSockets and HMR
