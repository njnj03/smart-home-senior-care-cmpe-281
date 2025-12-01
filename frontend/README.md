
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

## Testing the Application

### Prerequisites for Testing

1. **Start the Backend Server**
   ```bash
   cd backend
   # Activate virtual environment
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```

2. **Start the Frontend**
   ```bash
   cd frontend
   npm run dev
   ```
   Frontend will run on `http://localhost:5173`

### Testing Authentication & Authorization

#### Step 1: Create Test Users

First, you need to create users in the database. Use the backend registration endpoint or create users directly:

**Option A: Using Backend Script** (if available)
```bash
cd backend
python scripts/create_test_users.py
```

**Option B: Using API Registration Endpoint**

1. **Create a Tenant First** (Admin required, or use database directly):
   ```sql
   INSERT INTO tenants (tenant_name, description, is_active)
   VALUES ('Test Tenant', 'For testing', true);
   ```

2. **Register Users** via API:
   ```bash
   # Admin user
   curl -X POST http://localhost:8000/api/v1/auth/register \
     -H "Content-Type: application/json" \
     -d '{
       "email": "admin@test.com",
       "password": "admin123",
       "first_name": "Admin",
       "last_name": "User",
       "role": "admin",
       "tenant_id": 1
     }'

   # House Owner
   curl -X POST http://localhost:8000/api/v1/auth/register \
     -H "Content-Type: application/json" \
     -d '{
       "email": "owner@test.com",
       "password": "owner123",
       "first_name": "House",
       "last_name": "Owner",
       "role": "house_owner",
       "tenant_id": 1
     }'

   # IoT Team
   curl -X POST http://localhost:8000/api/v1/auth/register \
     -H "Content-Type: application/json" \
     -d '{
       "email": "iot@test.com",
       "password": "iot123",
       "first_name": "IoT",
       "last_name": "Team",
       "role": "iot_team",
       "tenant_id": 1
     }'
   ```

#### Step 2: Test Login

1. Open `http://localhost:5173` in your browser
2. You should see the **Sign In** page
3. Try logging in with invalid credentials:
   - Email: `wrong@test.com`
   - Password: `wrongpass`
   - ✅ Should show error message: "Incorrect email or password"

4. Try logging in with valid credentials:
   - Email: `admin@test.com`
   - Password: `admin123`
   - ✅ Should successfully log in and redirect to dashboard
   - ✅ Check browser console - should see successful login
   - ✅ Check Application tab in DevTools → Local Storage → Should see `authToken` and `smartHomeUser`

#### Step 3: Test Role-Based Access (Admin)

While logged in as **admin@test.com**:

1. **Check Navigation Menu:**
   - ✅ Should see: Overview, Live Map, **Devices**, History, **ML**, Settings
   - ✅ "Devices" and "ML" menu items should be visible

2. **Test ML Models Page:**
   - Click on "ML" in the navigation
   - ✅ Should load ML Model Management page
   - ✅ Should see "Add Model" button
   - ✅ Can activate/edit/delete models

3. **Test Device Management:**
   - Click on "Devices" in the navigation
   - ✅ Should load IoT Device Manager page
   - ✅ Should see "+ Add Device" button
   - ✅ Should see "Delete Selected" button
   - ✅ Should see checkboxes for device selection

4. **Test Settings:**
   - Click on "Settings"
   - ✅ Should load real user data (Admin User)
   - ✅ Role should show "Administrator"
   - ✅ Can edit first name and last name
   - ✅ Changes should persist after clicking "Save Settings"

5. **Check Profile Dropdown:**
   - Click on email in top-right corner
   - ✅ Should show "admin@test.com"
   - ✅ Should show role as "Administrator"

#### Step 4: Test Role-Based Access (House Owner)

1. **Sign Out:**
   - Click on email in top-right → Click "Sign Out"
   - ✅ Should redirect to login page
   - ✅ Check Local Storage → Should be cleared

2. **Sign In as House Owner:**
   - Email: `owner@test.com`
   - Password: `owner123`
   - ✅ Should successfully log in

3. **Check Navigation Menu:**
   - ✅ Should see: Overview, Live Map, History, Settings
   - ❌ Should NOT see "Devices" menu item
   - ❌ Should NOT see "ML" menu item

4. **Test Restricted Access:**
   - Try to access `/devices` directly in URL bar: `http://localhost:5173/devices`
   - ✅ Should redirect to home page (/)
   - Try to access `/ml` directly: `http://localhost:5173/ml`
   - ✅ Should redirect to home page (/)

5. **Test Alert Management:**
   - Go to "History" page
   - ✅ Should see alerts
   - ✅ Should see Acknowledge, Resolve, Dismiss buttons
   - ✅ Can manage alerts (this is allowed for house_owner)

6. **Test Settings:**
   - Click on "Settings"
   - ✅ Should show "House Owner" as role
   - ✅ Can edit name fields

#### Step 5: Test Role-Based Access (IoT Team)

1. **Sign Out and Sign In as IoT Team:**
   - Email: `iot@test.com`
   - Password: `iot123`

2. **Check Navigation Menu:**
   - ✅ Should see: Overview, Live Map, **Devices**, History, Settings
   - ✅ Should see "Devices" menu item
   - ❌ Should NOT see "ML" menu item

3. **Test Device Management:**
   - Click on "Devices"
   - ✅ Should load IoT Device Manager page
   - ✅ Should see "+ Add Device" button
   - ✅ Should see "Delete Selected" button
   - ✅ Can create/update/delete devices

4. **Test ML Models Restriction:**
   - Try to access `/ml` directly in URL bar
   - ✅ Should redirect to home page (/)

5. **Check Profile:**
   - ✅ Should show role as "IoT Team"

#### Step 6: Test API Authorization

Open browser DevTools → Network tab and check API requests:

1. **Login Request:**
   - Should see `POST /api/v1/auth/login`
   - Response should include `access_token`

2. **Get Current User:**
   - Should see `GET /api/v1/auth/me`
   - Request should include `Authorization: Bearer <token>` header

3. **All Other Requests:**
   - Check any API request (alerts, devices, metrics, etc.)
   - ✅ All should include `Authorization: Bearer <token>` header
   - ✅ If 401 Unauthorized, token may be expired (re-login)

### Testing Checklist

#### Authentication ✅
- [ ] Login with valid credentials works
- [ ] Login with invalid credentials shows error
- [ ] JWT token stored in localStorage after login
- [ ] User data stored in localStorage after login
- [ ] Logout clears tokens and redirects to login
- [ ] All API requests include Authorization header

#### Authorization - Admin Role ✅
- [ ] Can see "Devices" menu item
- [ ] Can see "ML" menu item
- [ ] Can access /devices page
- [ ] Can access /ml page
- [ ] Can add/edit/delete devices
- [ ] Can add/edit/activate/delete ML models
- [ ] Profile shows "Administrator"

#### Authorization - House Owner Role ✅
- [ ] Cannot see "Devices" menu item
- [ ] Cannot see "ML" menu item
- [ ] Cannot access /devices (redirects to /)
- [ ] Cannot access /ml (redirects to /)
- [ ] Can manage alerts (acknowledge/resolve/dismiss)
- [ ] Profile shows "House Owner"

#### Authorization - IoT Team Role ✅
- [ ] Can see "Devices" menu item
- [ ] Cannot see "ML" menu item
- [ ] Can access /devices page
- [ ] Cannot access /ml (redirects to /)
- [ ] Can add/edit/delete devices
- [ ] Profile shows "IoT Team"

#### Settings Page Integration ✅
- [ ] Loads real user data from API
- [ ] Shows correct role
- [ ] Email is read-only
- [ ] Can edit first name and last name
- [ ] Changes persist to backend
- [ ] Shows success message after save

#### Device Management ✅
- [ ] Admin/IoT Team see management buttons
- [ ] Admin/IoT Team can select devices with checkboxes
- [ ] Admin/IoT Team can add new devices
- [ ] Admin/IoT Team can delete devices

### Common Issues & Solutions

**Issue: 401 Unauthorized errors**
- Solution: Token expired, logout and login again

**Issue: CORS errors**
- Solution: Check backend CORS settings include `http://localhost:5173`

**Issue: Cannot see menu items**
- Solution: Check user role in profile dropdown, ensure correct user logged in

**Issue: Settings page not loading**
- Solution: Check browser console, ensure backend is running, verify token is valid

**Issue: Login shows "Failed to load profile"**
- Solution: User may not exist in database, or backend is not running

### Manual API Testing (cURL)

Test authentication flow manually:

```bash
# 1. Login
TOKEN=$(curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@test.com","password":"admin123"}' \
  | jq -r '.access_token')

echo "Token: $TOKEN"

# 2. Get current user
curl http://localhost:8000/api/v1/auth/me \
  -H "Authorization: Bearer $TOKEN"

# 3. List devices (with auth)
curl http://localhost:8000/api/v1/devices \
  -H "Authorization: Bearer $TOKEN"

# 4. Try admin endpoint as non-admin (should fail)
curl http://localhost:8000/api/v1/models \
  -H "Authorization: Bearer $TOKEN"
```

## API Integration

The frontend is fully integrated with the FastAPI backend. All pages use the real API endpoints:

### Available APIs

#### Authentication & Users
- `api.auth.login(email, password)` - Login and get JWT token
- `api.auth.register(userData)` - Register new user
- `api.auth.getCurrentUser()` - Get current user details
- `api.auth.listUsers()` - List all users (Admin only)
- `api.auth.createUser(userData)` - Create user (Admin only)
- `api.auth.updateUser(userId, userData)` - Update user (Admin only)
- `api.auth.logout()` - Clear tokens and logout

#### Tenants
- `api.tenants.list()` - List all tenants (Admin only)
- `api.tenants.get(tenantId)` - Get tenant details (Admin only)
- `api.tenants.create(tenantData)` - Create tenant (Admin only)
- `api.tenants.update(tenantId, tenantData)` - Update tenant (Admin only)
- `api.tenants.delete(tenantId)` - Delete tenant (Admin only)

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

| Page | File | Description | Access |
|------|------|-------------|--------|
| Sign In | `SignInPage.jsx` | Real JWT authentication with backend | Public |
| Dashboard | `HomeOwnerDashboard.jsx` | Main overview with metrics, active alerts, and device status | All users |
| Alert Map | `AlertLiveMap.jsx` | Geographic visualization of alerts on interactive map | All users |
| Device Manager | `IoTDeviceManager.jsx` | IoT device management and status monitoring | Admin, IoT Team |
| Alert History | `AlertHistory.jsx` | Historical alerts with filtering and search | All users |
| ML Status | `MachineLearningStatus.jsx` | ML model management and activation | Admin only |
| Settings | `SettingsPage.jsx` | User profile management with real API integration | All users |

## User Roles & Permissions

### Admin (`admin`)
- ✅ Full system access
- ✅ Manage ML models (create, update, activate, delete)
- ✅ Manage devices (create, update, delete)
- ✅ Manage users and tenants
- ✅ Manage alerts
- ✅ Access to all pages and features

### House Owner (`house_owner`)
- ✅ View alerts, houses, metrics
- ✅ Manage alerts (acknowledge, resolve, dismiss)
- ❌ Cannot manage devices
- ❌ Cannot manage ML models
- ❌ Cannot manage users/tenants

### IoT Team (`iot_team`)
- ✅ View alerts, devices, houses, metrics
- ✅ Manage devices (create, update, delete)
- ✅ Test ML inference
- ❌ Cannot manage alerts
- ❌ Cannot manage ML models
- ❌ Cannot manage users/tenants

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

