# Frontend API Integration Summary

## Overview

The frontend has been fully integrated with the FastAPI backend. All pages now use real API endpoints instead of mock data.

## Updated Files

### 1. **API Service** (`src/services/api.js`)
   - **New file** providing unified API client for all backend endpoints
   - Handles all HTTP requests with error handling
   - Organized into logical namespaces: alerts, devices, houses, metrics, models, inference, ingestion

### 2. **Pages Updated**

#### HomeOwnerDashboard.jsx
- ✅ Loads real metrics from `/api/v1/metrics`
- ✅ Fetches active alerts from `/api/v1/alerts?status=active`
- ✅ Retrieves device list from `/api/v1/devices`
- ✅ Auto-refreshes every 10 seconds
- ✅ Shows loading and error states

#### AlertHistory.jsx
- ✅ Lists all alerts from `/api/v1/alerts`
- ✅ Filters by time range (6h, 24h, 72h)
- ✅ Supports search and filtering
- ✅ Real-time backend data

#### AlertLiveMap.jsx
- ✅ Loads houses from `/api/v1/houses`
- ✅ Fetches active alerts from `/api/v1/alerts`
- ✅ Displays alert markers on map with severity-based coloring
- ✅ Error handling and loading states

#### IoTDeviceManager.jsx
- ✅ Lists devices from `/api/v1/devices`
- ✅ Shows device status (online/offline)
- ✅ Displays device location and house information

#### MachineLearningStatus.jsx
- ✅ Lists all ML models from `/api/v1/models`
- ✅ Shows active model with green highlight
- ✅ Activate button to switch models via `/api/v1/models/{modelId}/activate`
- ✅ Displays model metadata (version, type, accuracy, description)

### 3. **Components Updated**

#### DetailsPopup.jsx
- ✅ Acknowledge alerts: `POST /api/v1/alerts/{alertId}/acknowledge`
- ✅ Resolve alerts: `POST /api/v1/alerts/{alertId}/resolve`
- ✅ Dismiss alerts: `POST /api/v1/alerts/{alertId}/dismiss`
- ✅ Error handling and loading states

### 4. **Configuration Files**

#### .env.example
- Added `VITE_API_BASE_URL` configuration
- Default value: `http://localhost:8000`

#### README.md
- Updated with complete API documentation
- Added setup and configuration instructions
- Included troubleshooting guide

## API Endpoints Integrated

### Alerts
- `GET /api/v1/alerts` - List alerts with filtering
- `GET /api/v1/alerts/{alertId}` - Get alert details
- `POST /api/v1/alerts/{alertId}/acknowledge` - Acknowledge alert
- `POST /api/v1/alerts/{alertId}/resolve` - Resolve alert
- `POST /api/v1/alerts/{alertId}/dismiss` - Dismiss alert (false positive)

### Devices
- `GET /api/v1/devices` - List devices
- `GET /api/v1/devices` - Filter by house_id
- `GET /api/v1/devices/{deviceId}` - Get device details

### Houses
- `GET /api/v1/houses` - List all houses
- `GET /api/v1/houses/{houseId}` - Get house details

### Metrics
- `GET /api/v1/metrics` - Dashboard metrics

### ML Models
- `GET /api/v1/models` - List all models
- `GET /api/v1/models/active` - Get active model
- `GET /api/v1/models/{modelId}` - Get model details
- `POST /api/v1/models` - Create model
- `PUT /api/v1/models/{modelId}` - Update model
- `POST /api/v1/models/{modelId}/activate` - Activate model
- `DELETE /api/v1/models/{modelId}` - Delete model

### Inference
- `POST /api/v1/predict` - Run inference on audio file

### Ingestion
- `POST /api/v1/ingest/event` - Ingest IoT event with audio

## Database Field Mapping

The API uses snake_case field names. Frontend components updated to use:
- `alert_id` (instead of `id`)
- `house_id` (instead of `houseId`)
- `device_id` (instead of `deviceId`)
- `device_name` (instead of `name`)
- `created_at` (instead of `createdAt`)
- `confidence_score` (instead of `confidence`)
- `device_type_id` (instead of `type`)
- `latitude` / `longitude` (instead of `lat` / `lng`)
- `house_name` (instead of `name`)

## Error Handling

All pages now include:
- ✅ Loading states
- ✅ Error messages displayed to user
- ✅ Console logging for debugging
- ✅ Try-catch blocks for API calls

## Running the Frontend

1. **Set backend API URL** (optional, defaults to localhost:8000):
   ```bash
   # Create .env.local
   VITE_API_BASE_URL=http://your-backend-url:8000
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start development server**:
   ```bash
   npm run dev
   ```

4. **Access UI**:
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:8000
   - API Docs: http://localhost:8000/docs

## Testing the API Integration

### Prerequisites
- Backend running on http://localhost:8000
- Database configured with sample data
- Some houses and devices created
- Some alerts generated

### Steps
1. Navigate to HomeOwnerDashboard - should show live metrics
2. Check AlertHistory - should show all alerts
3. View AlertLiveMap - should show alert markers
4. Test alert acknowledgment in DetailsPopup
5. Check MachineLearningStatus - should list available models

## Next Steps (Optional)

- [ ] Add WebSocket support for real-time updates
- [ ] Implement authentication (currently UI only)
- [ ] Add file upload for audio ingestion testing
- [ ] Add model upload functionality
- [ ] Implement notification system
- [ ] Add more detailed error messages
- [ ] Add request/response logging
