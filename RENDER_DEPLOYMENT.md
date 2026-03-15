# Deploying to Render

This guide explains how to deploy your Tripjack Hotel API to Render for free hosting.

## Prerequisites

1. **GitHub Account** - Push your code to GitHub
2. **Render Account** - Sign up at [render.com](https://render.com)

## Step 1: Push Code to GitHub

```bash
# Initialize git (if not already done)
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit - ready for Render deployment"

# Add remote (replace with your repo URL)
git remote add origin https://github.com/YOUR_USERNAME/tripjack-hotel-api.git

# Push to main branch
git branch -M main
git push -u origin main
```

## Step 2: Connect to Render

1. Go to [render.com](https://render.com) and sign up
2. Click **"New +"** → **"Web Service"**
3. Select **"Deploy an existing Git repository"**
4. Connect your GitHub account and select your repository
5. Fill in the deployment settings:
   - **Name**: `tripjack-hotel-api`
   - **Runtime**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn api.main:app --host 0.0.0.0 --port 8000`
   - **Plan**: Select **Free** tier

## Step 3: Configure Environment (Optional)

If you need environment variables:

1. Go to your service dashboard
2. Click **"Environment"**
3. Add any required variables (e.g., API keys)

## Step 4: Deploy

1. Click **"Create Web Service"**
2. Render will automatically build and deploy your app
3. Once deployed, you'll get a URL like: `https://tripjack-hotel-api.onrender.com`

## Important Notes

### Free Tier Limitations

- **750 hours/month** of compute (enough for 1 service running continuously)
- **Spin-down after 15 minutes** of inactivity (wakes up on first request)
- **Shared resources** (not dedicated)
- **100 GB/month bandwidth**
- **No credit card required**

### Cold Start Behavior

When your service spins down after 15 minutes of inactivity:
- First request after spin-down takes 30-60 seconds
- Subsequent requests are fast
- This is normal for free tier

### Accessing Your App

- **API**: `https://tripjack-hotel-api.onrender.com/api`
- **UI**: `https://tripjack-hotel-api.onrender.com/ui`
- **Health Check**: `https://tripjack-hotel-api.onrender.com/health`

## Automatic Deployments

With `render.yaml` configured:
- Every push to `main` branch automatically deploys
- Render builds and restarts your service
- No manual intervention needed

## Troubleshooting

### Build Fails
- Check **Logs** tab in Render dashboard
- Ensure `requirements.txt` has all dependencies
- Verify Python version compatibility

### Service Won't Start
- Check **Logs** for error messages
- Ensure port is set to `8000`
- Verify `api/main.py` exists and is valid

### IP Whitelist Issues

Your app has IP whitelist middleware. For Render:
- Remove or modify the `ALLOWED_IPS` check in `api/main.py`
- Or add Render's IP ranges to whitelist
- Consider using environment variables for this

**Recommended**: Update `api/main.py` to disable IP check in production:

```python
import os

# Only enforce IP whitelist in development
ENFORCE_IP_WHITELIST = os.getenv("ENFORCE_IP_WHITELIST", "false").lower() == "true"

@app.middleware("http")
async def ip_whitelist_middleware(request: Request, call_next):
    if not ENFORCE_IP_WHITELIST:
        return await call_next(request)
    
    # ... rest of IP check code
```

Then set `ENFORCE_IP_WHITELIST=false` in Render environment variables.

## Upgrading to Paid Plan

When you need more resources:
- Click **"Settings"** → **"Plan"**
- Choose a paid plan starting at $7/month
- No downtime during upgrade

## Support

- Render Docs: https://render.com/docs
- Community: https://community.render.com
