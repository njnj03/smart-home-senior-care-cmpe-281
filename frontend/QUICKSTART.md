# Quick Start Guide - Frontend Development

## 1. Install Dependencies
```bash
cd frontend
npm install
```

## 2. Configure Backend API (Optional)
Create `.env.local` in the frontend directory:
```env
VITE_API_BASE_URL=http://localhost:8000
```

If not set, defaults to `http://localhost:8000`

## 3. Start Development Server
```bash
npm run dev
```

The frontend will be available at: **http://localhost:5173**

## 4. Verify Backend is Running
- Backend should be running on http://localhost:8000
- Check API docs at http://localhost:8000/docs
- Backend should have a database configured with sample data

## 5. Test the Integration
1. **Dashboard** (http://localhost:5173) - Shows live metrics
2. **Alert History** (http://localhost:5173/history) - Lists all alerts
3. **Live Map** (http://localhost:5173/map) - Geographic alert view
4. **Device Manager** (http://localhost:5173/devices) - Device status
5. **ML Status** (http://localhost:5173/ml) - Model management

## Key Points

✅ All pages use real API endpoints
✅ Error messages show in the UI
✅ Auto-refreshing data (10-second intervals)
✅ Full error handling and loading states
✅ Responsive design with Tailwind CSS

## Troubleshooting

### API Errors
1. Verify backend is running: `http://localhost:8000/docs`
2. Check CORS configuration in backend `.env`
3. Check `VITE_API_BASE_URL` environment variable
4. Look at browser console for detailed errors

### Build Issues
```bash
# Clear node_modules and reinstall
rm -r node_modules package-lock.json
npm install
npm run dev
```

### PowerShell Issue
```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
```

## File Structure

```
frontend/
├── src/
│   ├── services/
│   │   └── api.js              ← Real API client (NEW)
│   ├── pages/
│   │   ├── HomeOwnerDashboard.jsx   (Updated)
│   │   ├── AlertHistory.jsx         (Updated)
│   │   ├── AlertLiveMap.jsx         (Updated)
│   │   ├── IoTDeviceManager.jsx     (Updated)
│   │   ├── MachineLearningStatus.jsx (Updated)
│   │   ├── SettingsPage.jsx
│   │   └── SignInPage.jsx
│   ├── components/
│   │   └── DetailsPopup.jsx    (Updated)
│   └── utils/
│       └── format.js
├── .env.example          ← Environment variables
├── API_INTEGRATION.md    ← API documentation
└── README.md             ← Updated README
```

## API Response Examples

### Metrics
```json
{
  "active_houses": 2,
  "total_devices": 4,
  "online_devices": 3,
  "active_alerts": 1,
  "system_health": {
    "api_latency": 45,
    "queue_depth": 2
  }
}
```

### Alerts
```json
{
  "alerts": [
    {
      "alert_id": 1,
      "house_id": 1,
      "device_id": 1,
      "severity": "high",
      "status": "active",
      "created_at": "2025-11-15T10:30:00Z",
      "confidence_score": 0.92,
      "notes": null
    }
  ],
  "total": 5
}
```

## Next Steps

1. Start backend: See `/backend/README.md`
2. Add sample data to database
3. Test API endpoints at http://localhost:8000/docs
4. Run frontend: `npm run dev`
5. Verify all pages load correctly

## Support

- Backend API docs: http://localhost:8000/docs
- Frontend code: `src/services/api.js`
- See `API_INTEGRATION.md` for detailed endpoint info
