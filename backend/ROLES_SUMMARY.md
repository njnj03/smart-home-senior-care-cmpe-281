# Role-Based Access Control Summary

## Three User Groups

### 1. Cloud Staff (Admin)
**Role**: `admin`

**Permissions**:
- ✅ Full access to all endpoints
- ✅ Create/manage users
- ✅ Create/manage tenants
- ✅ Manage ML models (register, activate, update, delete)
- ✅ Manage devices (create, update, delete)
- ✅ Manage alerts (acknowledge, resolve, dismiss)
- ✅ View all data

**Use Case**: Cloud service staff who manage the entire platform

---

### 2. House Owners
**Role**: `house_owner`

**Permissions**:
- ✅ View alerts, devices, houses, metrics, models
- ✅ Manage alerts (acknowledge, resolve, dismiss)
- ❌ Cannot manage devices
- ❌ Cannot manage users or tenants
- ❌ Cannot manage ML models

**Use Case**: Family members who monitor their house and respond to alerts

---

### 3. IoT Team
**Role**: `iot_team`

**Permissions**:
- ✅ View alerts, devices, houses, metrics, models
- ✅ Manage devices (create, update, delete)
- ✅ Test ML inference
- ❌ Cannot manage alerts
- ❌ Cannot manage users or tenants
- ❌ Cannot manage ML models

**Use Case**: IoT devices team who configure and manage devices

---

## Endpoint Access Matrix

| Endpoint | Admin | House Owner | IoT Team |
|----------|-------|-------------|----------|
| **Authentication** |
| POST /auth/login | ✅ | ✅ | ✅ |
| POST /auth/register | ✅ | ✅ | ✅ |
| GET /auth/me | ✅ | ✅ | ✅ |
| **User Management** |
| POST /auth/users | ✅ | ❌ | ❌ |
| GET /auth/users | ✅ | ❌ | ❌ |
| PUT /auth/users/{id} | ✅ | ❌ | ❌ |
| **Tenant Management** |
| POST /tenants | ✅ | ❌ | ❌ |
| GET /tenants | ✅ | ❌ | ❌ |
| PUT /tenants/{id} | ✅ | ❌ | ❌ |
| DELETE /tenants/{id} | ✅ | ❌ | ❌ |
| **Alerts** |
| GET /alerts | ✅ | ✅ | ✅ |
| GET /alerts/{id} | ✅ | ✅ | ✅ |
| POST /alerts/{id}/acknowledge | ✅ | ✅ | ❌ |
| POST /alerts/{id}/resolve | ✅ | ✅ | ❌ |
| POST /alerts/{id}/dismiss | ✅ | ✅ | ❌ |
| **Devices** |
| GET /devices | ✅ | ✅ | ✅ |
| GET /devices/{id} | ✅ | ✅ | ✅ |
| POST /devices | ✅ | ❌ | ✅ |
| PUT /devices/{id} | ✅ | ❌ | ✅ |
| DELETE /devices/{id} | ✅ | ❌ | ✅ |
| POST /devices/{id}/heartbeat | ✅ | ✅ | ✅ (Public) |
| **Houses** |
| GET /houses | ✅ | ✅ | ✅ |
| GET /houses/{id} | ✅ | ✅ | ✅ |
| **Metrics** |
| GET /metrics | ✅ | ✅ | ✅ |
| **ML Models** |
| GET /models | ✅ | ✅ | ✅ |
| GET /models/active | ✅ | ✅ | ✅ |
| GET /models/{id} | ✅ | ✅ | ✅ |
| POST /models | ✅ | ❌ | ❌ |
| PUT /models/{id} | ✅ | ❌ | ❌ |
| POST /models/{id}/activate | ✅ | ❌ | ❌ |
| DELETE /models/{id} | ✅ | ❌ | ❌ |
| **Inference** |
| POST /predict | ✅ | ❌ | ✅ |
| **Ingestion** |
| POST /ingest/event | ✅ | ✅ | ✅ (Public) |

---

## Key Points

1. **House Owners** focus on **alert management** - they respond to alerts for their houses
2. **IoT Team** focuses on **device management** - they configure and maintain IoT devices
3. **Cloud Staff** has **full access** - they manage the entire platform
4. All groups can **view** data (alerts, devices, houses, metrics)
5. **Public endpoints** (device heartbeat, event ingestion) are accessible without authentication

---

## Creating Users

When creating users, assign the appropriate role:

```python
# Cloud Staff
User(role="admin", ...)

# House Owner
User(role="house_owner", ...)

# IoT Team
User(role="iot_team", ...)
```

