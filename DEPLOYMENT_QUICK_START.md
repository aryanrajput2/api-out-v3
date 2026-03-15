# Quick Start: Deploy to Render in 5 Minutes

## What's Ready

✅ `render.yaml` - Render deployment config  
✅ `requirements.txt` - Python dependencies  
✅ `.gitignore` - Git ignore rules  
✅ `api/main.py` - Updated for cloud deployment  
✅ `RENDER_DEPLOYMENT.md` - Full deployment guide  

## 5-Minute Setup

### 1. Commit & Push to GitHub
```bash
git add .
git commit -m "Ready for Render deployment"
git push origin main
```

### 2. Go to Render
- Visit https://render.com
- Sign up (free account, no credit card)
- Click **"New +"** → **"Web Service"**

### 3. Connect GitHub
- Select **"Deploy an existing Git repository"**
- Connect your GitHub account
- Select your repository

### 4. Configure
- **Name**: `tripjack-hotel-api`
- **Runtime**: `Python 3`
- **Build Command**: `pip install -r requirements.txt`
- **Start Command**: `uvicorn api.main:app --host 0.0.0.0 --port 8000`
- **Plan**: **Free**

### 5. Deploy
- Click **"Create Web Service"**
- Wait 2-3 minutes for build
- Get your URL: `https://tripjack-hotel-api.onrender.com`

## Your URLs

- **API**: `https://tripjack-hotel-api.onrender.com/api`
- **UI**: `https://tripjack-hotel-api.onrender.com/ui`
- **Health**: `https://tripjack-hotel-api.onrender.com/health`

## Free Tier Details

- **750 hours/month** (1 service running continuously)
- **Spins down after 15 min** of inactivity (wakes on request)
- **100 GB/month bandwidth**
- **No credit card needed**
- **Auto-deploy on push** to main branch

## Important: IP Whitelist

Your app has IP whitelist disabled by default for Render. To enable it:

Set environment variable in Render dashboard:
```
ENFORCE_IP_WHITELIST=true
```

## Next Steps

1. Push code to GitHub
2. Connect to Render
3. Deploy
4. Share your public URL!

For detailed guide, see `RENDER_DEPLOYMENT.md`
