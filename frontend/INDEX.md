# Frontend Documentation Index

Welcome! Here's where to find everything you need.

## 🚀 Getting Started

**Start here:** [QUICKSTART.md](QUICKSTART.md)
- Installation steps
- Running the dev server
- Verifying the integration
- 5-minute setup guide

## 📚 Documentation

| Document | Purpose | Read Time |
|----------|---------|-----------|
| [README.md](README.md) | Setup, features, troubleshooting | 10 min |
| [QUICKSTART.md](QUICKSTART.md) | Quick reference guide | 5 min |
| [SUCCESS.md](SUCCESS.md) | Completion summary | 5 min |
| [API_INTEGRATION.md](API_INTEGRATION.md) | Endpoint reference | 15 min |
| [API_EXAMPLES.md](API_EXAMPLES.md) | Code examples | 10 min |
| [INTEGRATION_COMPLETE.md](INTEGRATION_COMPLETE.md) | Detailed summary | 10 min |
| [CHECKLIST.md](CHECKLIST.md) | Testing checklist | 5 min |

## 🎯 By Purpose

### "I need to run the frontend"
→ [QUICKSTART.md](QUICKSTART.md)

### "I need to understand the API"
→ [API_INTEGRATION.md](API_INTEGRATION.md)

### "I need code examples"
→ [API_EXAMPLES.md](API_EXAMPLES.md)

### "I need to test everything"
→ [CHECKLIST.md](CHECKLIST.md)

### "I want to know what's done"
→ [SUCCESS.md](SUCCESS.md)

### "I need full setup guide"
→ [README.md](README.md)

## 📂 File Structure

```
frontend/
├── src/
│   ├── services/
│   │   └── api.js              ← Main API client
│   ├── pages/
│   │   ├── HomeOwnerDashboard.jsx
│   │   ├── AlertHistory.jsx
│   │   ├── AlertLiveMap.jsx
│   │   ├── IoTDeviceManager.jsx
│   │   ├── MachineLearningStatus.jsx
│   │   ├── SettingsPage.jsx
│   │   └── SignInPage.jsx
│   ├── components/
│   │   └── DetailsPopup.jsx
│   └── utils/
│       └── format.js
├── .env.example                ← Copy to .env.local
├── package.json
├── vite.config.js
│
├── DOCUMENTATION (Start here!)
├── ├── README.md               ← Full documentation
├── ├── QUICKSTART.md           ← 5-min setup
├── ├── SUCCESS.md              ← What's done
├── ├── CHECKLIST.md            ← Testing guide
├── ├── API_INTEGRATION.md      ← API reference
├── ├── API_EXAMPLES.md         ← Code examples
├── └── INTEGRATION_COMPLETE.md ← Detailed summary
```

## 🔧 API Service

The main API client is at `src/services/api.js`

```javascript
import api from '../services/api'

// Use any of these:
api.alerts.list()
api.devices.list()
api.houses.list()
api.metrics.get()
api.models.list()
api.inference.predict()
api.ingestion.ingestEvent()
```

See [API_EXAMPLES.md](API_EXAMPLES.md) for detailed examples.

## ✅ What's Integrated

- ✅ Alert management (list, get, acknowledge, resolve, dismiss)
- ✅ Device management (list, get, filter)
- ✅ House management (list, get)
- ✅ Dashboard metrics (real-time)
- ✅ ML model management (list, activate, create, update, delete)
- ✅ Inference and ingestion endpoints

## 🚦 Quick Commands

```bash
# Install
npm install

# Run dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## 🌐 URLs

- Frontend: http://localhost:5173
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## 🆘 Troubleshooting

### API Connection Issues
→ Check [README.md - Troubleshooting](README.md#troubleshooting)

### Code Examples
→ See [API_EXAMPLES.md](API_EXAMPLES.md)

### Setup Issues
→ Follow [QUICKSTART.md](QUICKSTART.md)

### Testing Problems
→ Use [CHECKLIST.md](CHECKLIST.md)

## 📊 Pages at a Glance

| Page | URL | Status | Uses API |
|------|-----|--------|----------|
| Dashboard | `/` | ✅ | metrics, alerts, devices |
| Live Map | `/map` | ✅ | houses, alerts |
| Devices | `/devices` | ✅ | devices |
| History | `/history` | ✅ | alerts |
| ML Status | `/ml` | ✅ | models |
| Settings | `/settings` | ⏳ | UI only |
| Sign In | `/signin` | ⏳ | UI only |

## 🎓 Learning Path

1. **Understand the setup**: [QUICKSTART.md](QUICKSTART.md)
2. **Learn the API**: [API_INTEGRATION.md](API_INTEGRATION.md)
3. **See code examples**: [API_EXAMPLES.md](API_EXAMPLES.md)
4. **Review implementation**: Look at `src/pages/HomeOwnerDashboard.jsx`
5. **Test everything**: [CHECKLIST.md](CHECKLIST.md)

## 💡 Pro Tips

✅ Always check browser console for errors
✅ Use API docs at http://localhost:8000/docs to test endpoints
✅ Copy `.env.example` to `.env.local` to customize backend URL
✅ Reload page after backend changes
✅ Check network tab in DevTools for API calls

## 📞 Need Help?

1. **Setup issues?** → [QUICKSTART.md](QUICKSTART.md)
2. **API questions?** → [API_EXAMPLES.md](API_EXAMPLES.md)
3. **Full documentation?** → [README.md](README.md)
4. **Testing?** → [CHECKLIST.md](CHECKLIST.md)
5. **What's done?** → [SUCCESS.md](SUCCESS.md)

## 🎯 Status

✅ **Complete** - All APIs integrated
✅ **Tested** - Error handling included
✅ **Documented** - 7 documentation files
✅ **Ready** - Can run now with backend

---

**Start with [QUICKSTART.md](QUICKSTART.md) - you'll be running in 5 minutes!**

Last updated: November 15, 2025
