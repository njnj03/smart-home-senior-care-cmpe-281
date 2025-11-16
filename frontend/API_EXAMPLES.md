# API Usage Examples

## Import the API Service

```javascript
import api from '../services/api'
```

## Alert Management

### List Active Alerts
```javascript
const response = await api.alerts.list({ status: 'active', limit: 50 })
console.log(response.alerts)  // Array of alerts
console.log(response.total)   // Total count
```

### Get Single Alert
```javascript
const alert = await api.alerts.get(1)
console.log(alert)  // Alert object
```

### Acknowledge Alert
```javascript
await api.alerts.acknowledge(alertId, 'User acknowledged')
// Returns updated alert
```

### Resolve Alert
```javascript
await api.alerts.resolve(alertId, 'Issue resolved')
// Returns updated alert
```

### Dismiss Alert
```javascript
await api.alerts.dismiss(alertId, 'False positive')
// Returns updated alert marked as false_positive
```

## Device Management

### List All Devices
```javascript
const response = await api.devices.list()
console.log(response.devices)  // Array of devices
```

### List Devices in Specific House
```javascript
const response = await api.devices.list(houseId)
console.log(response.devices)
```

### Get Single Device
```javascript
const device = await api.devices.get(deviceId)
console.log(device)
```

## House Management

### List All Houses
```javascript
const response = await api.houses.list()
console.log(response.houses)
```

### Get Single House
```javascript
const house = await api.houses.get(houseId)
console.log(house)
```

## Metrics

### Get Dashboard Metrics
```javascript
const metrics = await api.metrics.get()
console.log(metrics.active_houses)
console.log(metrics.total_devices)
console.log(metrics.online_devices)
console.log(metrics.active_alerts)
console.log(metrics.system_health)  // { api_latency, queue_depth }
```

## ML Models

### List All Models
```javascript
const response = await api.models.list()
console.log(response.models)        // All models
console.log(response.active_model)  // Currently active model
```

### Get Active Model
```javascript
const model = await api.models.getActive()
console.log(model)
```

### Get Single Model
```javascript
const model = await api.models.get(modelId)
console.log(model)
```

### Activate Model
```javascript
await api.models.activate(modelId)
// Returns updated model marked as active
// Other models are deactivated
```

### Create Model
```javascript
const newModel = await api.models.create({
  model_name: 'My Model',
  version: '1.0',
  file_path: 'models/my_model.keras',
  description: 'Custom audio detection model',
  model_type: 'audio_classification',
  accuracy: 0.95
})
console.log(newModel)
```

### Update Model
```javascript
const updated = await api.models.update(modelId, {
  model_name: 'Updated Name',
  accuracy: 0.96
})
```

### Delete Model
```javascript
await api.models.delete(modelId)
// No response body, check HTTP 204
```

## Inference

### Run Prediction on Audio File
```javascript
const audioFile = document.getElementById('audioInput').files[0]
const result = await api.inference.predict(audioFile)
console.log(result.label)        // Prediction label
console.log(result.score)        // Confidence score
```

## Ingestion

### Ingest IoT Event
```javascript
const audioFile = fileInput.files[0]
const event = await api.ingestion.ingestEvent(
  houseId,           // Number
  deviceId,          // Number
  new Date().toISOString(),  // Timestamp
  audioFile          // File object
)
console.log(event.event_id)
console.log(event.is_processed)
```

## Error Handling Example

```javascript
try {
  const alerts = await api.alerts.list({ status: 'active' })
  setAlerts(alerts.alerts)
} catch (error) {
  console.error('Failed to load alerts:', error.message)
  setError('Unable to fetch alerts: ' + error.message)
}
```

## In React Component

```javascript
import React from 'react'
import api from '../services/api'

export default function MyComponent() {
  const [data, setData] = React.useState(null)
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState(null)

  React.useEffect(() => {
    (async () => {
      try {
        setLoading(true)
        setError(null)
        const response = await api.alerts.list({ limit: 100 })
        setData(response.alerts)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  if (loading) return <div>Loading...</div>
  if (error) return <div className="text-red-600">{error}</div>
  if (!data) return <div>No data</div>

  return (
    <div>
      {data.map(item => (
        <div key={item.alert_id}>{item.alert_id}</div>
      ))}
    </div>
  )
}
```

## Filter Examples

### Get High Severity Alerts
```javascript
const alerts = await api.alerts.list({
  severity: 'high',
  limit: 50
})
```

### Get Acknowledged Alerts
```javascript
const alerts = await api.alerts.list({
  status: 'acknowledged',
  limit: 100
})
```

### Get Alerts for Specific House
```javascript
const alerts = await api.alerts.list({
  house_id: 1,
  status: 'active'
})
```

### Combine Multiple Filters
```javascript
const alerts = await api.alerts.list({
  severity: 'high',
  status: 'active',
  house_id: 1,
  limit: 50,
  offset: 0
})
```

## Response Structure

### Alert Response
```javascript
{
  alert_id: 1,
  house_id: 1,
  device_id: 1,
  event_id: 1,
  alert_type_id: 1,
  rule_id: null,
  severity: 'high',           // 'critical', 'high', 'medium', 'low'
  status: 'active',           // 'active', 'acknowledged', 'resolved', 'false_positive'
  confidence_score: 0.92,
  created_at: '2025-11-15T10:30:00Z',
  acknowledged_at: null,
  resolved_at: null,
  notes: null
}
```

### Device Response
```javascript
{
  device_id: 1,
  house_id: 1,
  device_name: 'Living Mic',
  device_type_id: 1,
  status: 'online',           // 'online', 'offline', 'degraded'
  location: 'Living Room',
  created_at: '2025-11-01T08:00:00Z',
  last_heartbeat: '2025-11-15T10:35:00Z'
}
```

### House Response
```javascript
{
  house_id: 1,
  house_name: 'Sunset Home',
  latitude: 37.7749,
  longitude: -122.4194,
  created_at: '2025-10-01T00:00:00Z'
}
```

### Model Response
```javascript
{
  model_id: 1,
  model_name: 'YAMNet Audio',
  version: '1.0',
  file_path: 'models/my_yamnet_human_model.keras',
  description: 'Audio event detection',
  model_type: 'audio_classification',
  accuracy: 0.92,
  is_active: true,
  created_at: '2025-11-01T00:00:00Z'
}
```

## Pagination

All list endpoints support pagination:

```javascript
const alerts = await api.alerts.list({
  limit: 20,    // Items per page
  offset: 0     // Skip this many items
})

// Get next page
const nextPage = await api.alerts.list({
  limit: 20,
  offset: 20
})
```

## Tips

✅ Always use try-catch for API calls
✅ Check response.alerts or response.devices - not just response
✅ Use environment variable for backend URL in production
✅ Add loading states to prevent duplicate requests
✅ Log errors to console for debugging
✅ Use snake_case field names (alert_id, not id)
