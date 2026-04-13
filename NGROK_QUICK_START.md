# ngrok Quick Start

## 🎉 Your Public URL

```
https://dipsacaceous-exie-unconglutinated.ngrok-free.dev
```

## 📱 Access Your App

**Dashboard:**
```
https://dipsacaceous-exie-unconglutinated.ngrok-free.dev/ui/dashboard
```

**Search App:**
```
https://dipsacaceous-exie-unconglutinated.ngrok-free.dev/ui/search
```

**API:**
```
https://dipsacaceous-exie-unconglutinated.ngrok-free.dev
```

## ✅ What's Working

- ✅ Dashboard with golden theme
- ✅ Crown logo (👑 V3)
- ✅ Analytics tracking
- ✅ Bookings management
- ✅ IP whitelist
- ✅ API configuration
- ✅ All endpoints
- ✅ HTTPS secure

## 🔧 Commands

### Start ngrok (if stopped)
```bash
nohup ngrok http 8000 > /tmp/ngrok.log 2>&1 &
```

### Stop ngrok
```bash
pkill -f ngrok
```

### Check status
```bash
curl http://localhost:4040/api/tunnels
```

### View dashboard
```
http://localhost:4040
```

## 📊 Local Access

- **API**: http://localhost:8000
- **Dashboard**: http://localhost:8000/ui/dashboard
- **Search**: http://localhost:8000/ui/search

## 🚀 Status

🟢 **RUNNING** - All systems operational

---

**Note**: URL changes on ngrok restart. Check `http://localhost:4040` for current URL.
