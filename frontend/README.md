
# Smart Home Cloud • System Dashboard

React + Vite + TailwindCSS + React-Leaflet + Framer Motion dashboard for senior care monitoring.

## Setup

### Prerequisites
- Node.js 16+
- npm or yarn
- Backend API running on `http://localhost:8000` (or configured via `VITE_API_BASE_URL`)

### Installation

```bash
npm install
npm run dev
```

If PowerShell blocks npm, run: `Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass`

## Configuration

Create a `.env.local` file in the frontend directory to configure the backend API URL:

```env
VITE_API_BASE_URL=http://localhost:8000
```

See `.env.example` for all available environment variables.

## API Integration

The frontend is fully integrated with the FastAPI backend. All pages use the real API endpoints:

### Available APIs

#### Alerts
- `api.alerts.list(params)` - List alerts with filtering (severity, status, houseId)
- `api.alerts.get(alertId)` - Get alert details
- `api.alerts.acknowledge(alertId, notes)` - Acknowledge an alert
- `api.alerts.resolve(alertId, notes)` - Resolve an alert
- `api.alerts.dismiss(alertId, notes)` - Dismiss an alert (false positive)

#### Devices
- `api.devices.list(houseId)` - List all devices, optionally filtered by house
- `api.devices.get(deviceId)` - Get device details

#### Houses
- `api.houses.list()` - List all houses
- `api.houses.get(houseId)` - Get house details

#### Metrics
- `api.metrics.get()` - Get dashboard metrics (active houses, devices, alerts)

#### ML Models
- `api.models.list()` - List all models with active model highlighted
- `api.models.getActive()` - Get the currently active model
- `api.models.get(modelId)` - Get model details
- `api.models.create(modelData)` - Register a new model
- `api.models.update(modelId, modelData)` - Update model metadata
- `api.models.activate(modelId)` - Activate a model (hot-reload)
- `api.models.delete(modelId)` - Delete a model record

#### Inference
- `api.inference.predict(audioFile)` - Run inference on an audio file

#### Ingestion
- `api.ingestion.ingestEvent(houseId, deviceId, timestamp, audioFile)` - Ingest IoT event with audio

## Pages

| Page | File | Description |
|------|------|-------------|
| Dashboard | `HomeOwnerDashboard.jsx` | Main overview with metrics, active alerts, and device status |
| Alert Map | `AlertLiveMap.jsx` | Geographic visualization of alerts on interactive map |
| Device Manager | `IoTDeviceManager.jsx` | IoT device management and status monitoring |
| Alert History | `AlertHistory.jsx` | Historical alerts with filtering and search |
| ML Status | `MachineLearningStatus.jsx` | ML model management and activation |
| Settings | `SettingsPage.jsx` | User profile and notification preferences |
| Sign In | `SignInPage.jsx` | Authentication page (UI ready, backend auth not yet implemented) |

## Features

✅ Real-time alert monitoring
✅ Interactive map with alert markers
✅ Device status tracking
✅ ML model management
✅ Alert acknowledgment and resolution
✅ Responsive design with Tailwind CSS
✅ Smooth animations with Framer Motion
✅ Fully integrated with FastAPI backend

## Development

Backend API documentation:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## Troubleshooting

### CORS Errors
Ensure the backend has the frontend URL in `CORS_ORIGINS_STR`:
```env
# Backend .env
CORS_ORIGINS_STR=http://localhost:5173
```

### API Connection Issues
1. Verify backend is running on the correct port
2. Check `VITE_API_BASE_URL` environment variable
3. Check browser console for detailed error messages

