# Railway Deployment Guide

## Prerequisites
- Node.js installed (for Railway CLI)
- Railway account (https://railway.app)
- Git repository initialized

## Step-by-Step Deployment

### 1. Install Railway CLI
```bash
npm install -g @railway/cli
```

### 2. Login to Railway
```bash
railway login
```
This will open your browser to authenticate.

### 3. Create a New Project (First Time Only)
```bash
railway init
```
Follow the prompts:
- Enter project name: `tripjack-hotel-api`
- Select environment: `production`

### 4. Link to Existing Project (If Already Created)
```bash
railway link
```
Select your existing project from the list.

### 5. Set Environment Variables
```bash
railway env set API_KEY=6116982da6b759-28f8-4cdf-b210-04cb98116165
railway env set BASE_URL=https://apitest-hms.tripjack.com/
```

### 6. Deploy Your Application
```bash
railway up
```

### 7. View Deployment Status
```bash
railway status
```

### 8. View Live Logs
```bash
railway logs -f
```

### 9. Get Your Public URL
```bash
railway open
```

## Useful Commands

### View Environment Variables
```bash
railway env
```

### Update Environment Variables
```bash
railway env set KEY=VALUE
```

### View Project Info
```bash
railway info
```

### Redeploy Latest Code
```bash
railway up
```

### View Deployment History
```bash
railway deployments
```

### Stop/Start Service
```bash
railway stop
railway start
```

## Troubleshooting

### Build Fails
- Check logs: `railway logs -f`
- Verify `requirements.txt` has all dependencies
- Ensure `main.py` exists in root directory

### App Won't Start
- Check if PORT environment variable is set
- Verify `uvicorn` is in requirements.txt
- Check logs for specific errors

### Connection Issues
- Verify environment variables are set correctly
- Check if API endpoints are accessible
- Review firewall/network settings

## Project Structure
```
.
├── main.py                 # Entry point
├── api/
│   ├── main.py            # FastAPI app
│   ├── search.py
│   ├── book.py
│   └── ...
├── hotel-ui/              # Frontend files
├── requirements.txt       # Python dependencies
├── Procfile              # Process file
├── railway.toml          # Railway config
├── .railway/config.json  # Railway build config
└── .env                  # Local environment (not committed)
```

## After Deployment

1. **Test Your API**
   ```bash
   curl https://your-app.railway.app/health
   ```

2. **Access Your UI**
   ```
   https://your-app.railway.app/ui
   ```

3. **Monitor Logs**
   ```bash
   railway logs -f
   ```

4. **Update Code**
   - Make changes locally
   - Commit to git
   - Run `railway up` to redeploy

## Notes
- Railway automatically detects Python and installs dependencies
- The app runs on the PORT assigned by Railway
- Environment variables are stored securely
- Logs are available in real-time
