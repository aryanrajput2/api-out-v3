# Serveo Tunnel Setup

Get a public URL instantly with no signup needed.

## Quick Start

Run this command:
```bash
./start.sh
```

Choose option 1 (Serveo) when prompted, and you'll get a public URL instantly.

## Manual Setup

If you want to run Serveo separately:

```bash
ssh -R 80:localhost:8000 serveo.net
```

This will output something like:
```
Forwarding HTTP traffic from https://abc123.serveo.net
```

Your public URL is: `https://abc123.serveo.net`

## Features

- ✓ No signup needed
- ✓ Instant public URL
- ✓ Random subdomain each time
- ✓ Works with HTTPS
- ✓ No installation required (uses SSH)

## Useful Commands

**View Serveo logs:**
```bash
tail -f serveo.log
```

**Stop the tunnel:**
```bash
pkill -f "ssh -R"
```

**Get a custom subdomain (if available):**
```bash
ssh -R mysubdomain:80:localhost:8000 serveo.net
```

## How It Works

Serveo uses SSH reverse tunneling to expose your local port 8000 to the internet. No signup, no installation, just SSH!
