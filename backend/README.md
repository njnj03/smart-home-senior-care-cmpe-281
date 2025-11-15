# Smart Home Senior Care - Backend API

Backend API for the Smart Home Senior Care monitoring platform. Built with FastAPI, async PostgreSQL, and designed for local MVP development.

## Features

- **IoT Event Ingestion**: Accept audio files and metadata from IoT devices
- **ML Inference**: Swappable inference interface (dummy implementation for MVP)
- **Policy Engine**: Threshold-based and aggregation-based alert creation
- **Alert Lifecycle Management**: Create, acknowledge, resolve, and dismiss alerts
- **Device & House Management**: Read-only device and house information
- **Health Monitoring**: Health check endpoint with database connectivity status
- **Dashboard Metrics**: Real-time metrics for the frontend dashboard

## Quick Start

### Prerequisites

- Python 3.10+
- PostgreSQL database (Supabase recommended)
- pip or poetry for dependency management

### Installation

1. **Clone the repository** (if not already done):
   ```bash
   cd backend
   ```

2. **Create a virtual environment**:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

4. **Configure environment variables**:
   
   **On Windows (Command Prompt):**
   ```cmd
   copy .env.example .env
   ```
   
   **On Windows (PowerShell):**
   ```powershell
   Copy-Item .env.example .env
   ```
   
   **On Linux/Mac:**
   ```bash
   cp .env.example .env
   ```
   
   Then edit `.env` with your database connection string and other settings.

5. **Set up database**:
   - Your Supabase database should already have the schema (as per your SQL schema)
   - The backend models match your Supabase schema
   - Ensure the `ml_models` table exists (see `app/models/ml_model.py` for schema)
   - For future schema changes, use Alembic migrations (see "Database Migrations" section below)

6. **Set up ML models** (if using ML inference):
   - Place your model file(s) in `backend/models/` directory
   - Register your model using the script:
     ```bash
     # Windows (single line):
     python scripts\register_model.py --name "YAMNet Human Detection v1" --path "models\my_yamnet_human_model.keras" --version "v1.0" --activate
     
     # Linux/Mac:
     python scripts/register_model.py --name "YAMNet Human Detection v1" --path "models/my_yamnet_human_model.keras" --version "v1.0" --activate
     ```
   - See `README_MODELS.md` for detailed model management instructions

7. **Run the server**:
   ```bash
   uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```

   The API will be available at:
   - API: http://localhost:8000
   - Docs: http://localhost:8000/docs
   - ReDoc: http://localhost:8000/redoc

## Environment Variables

See `.env.example` for all available configuration options. Key variables:

- `DATABASE_URL`: PostgreSQL connection string (required)
- `CORS_ORIGINS_STR`: Comma-separated list of allowed frontend origins
- `STORAGE_PATH`: Path for storing uploaded audio files
- `POLICY_THRESHOLD`: Score threshold for alert creation (default: 0.7)
- `POLICY_AGGREGATION_WINDOW_SECONDS`: Time window for event aggregation (default: 60)
- `POLICY_MIN_EVENTS_FOR_ALERT`: Minimum events in window to trigger alert (default: 1)

## API Endpoints

### Health Check

```bash
# Check service health
curl http://localhost:8000/api/v1/health
```

### Ingestion

```bash
# Ingest an IoT event with audio file
curl -X POST http://localhost:8000/api/v1/ingest/event \
  -F "house_id=H001" \
  -F "device_id=dev-001" \
  -F "timestamp=2024-01-15T10:30:00Z" \
  -F "audio_file=@path/to/audio.wav"
```

### Inference (Testing)

```bash
# Test inference on an audio file
curl -X POST http://localhost:8000/api/v1/predict \
  -F "audio_file=@path/to/audio.wav"
```

### Alerts

```bash
# List alerts (with optional filters)
curl "http://localhost:8000/api/v1/alerts?status=active&severity=high"

# Get alert details
curl http://localhost:8000/api/v1/alerts/alert-12345

# Acknowledge an alert
curl -X POST http://localhost:8000/api/v1/alerts/alert-12345/acknowledge \
  -H "Content-Type: application/json" \
  -d '{"notes": "Investigating..."}'

# Resolve an alert
curl -X POST http://localhost:8000/api/v1/alerts/alert-12345/resolve \
  -H "Content-Type: application/json" \
  -d '{"notes": "Issue resolved"}'

# Dismiss an alert
curl -X POST http://localhost:8000/api/v1/alerts/alert-12345/dismiss \
  -H "Content-Type: application/json" \
  -d '{"notes": "False alarm"}'
```

### Devices

```bash
# List all devices
curl http://localhost:8000/api/v1/devices

# List devices for a specific house
curl "http://localhost:8000/api/v1/devices?house_id=H001"

# Get device details
curl http://localhost:8000/api/v1/devices/dev-001
```

### Houses

```bash
# List all houses
curl http://localhost:8000/api/v1/houses

# Get house details
curl http://localhost:8000/api/v1/houses/H001
```

### Metrics

```bash
# Get dashboard metrics
curl http://localhost:8000/api/v1/metrics
```

## Project Structure

```
backend/
├── app/
│   ├── main.py              # FastAPI application entry point
│   ├── config.py            # Configuration management
│   ├── database.py          # Database connection and session management
│   ├── models/              # SQLAlchemy database models
│   │   ├── event.py
│   │   ├── alert.py
│   │   ├── alert_history.py
│   │   ├── device.py
│   │   ├── house.py
│   │   └── ml_model.py
│   ├── schemas/             # Pydantic request/response schemas
│   │   ├── event.py
│   │   ├── alert.py
│   │   ├── device.py
│   │   ├── house.py
│   │   ├── health.py
│   │   ├── metrics.py
│   │   ├── inference.py
│   │   └── ml_model.py
│   ├── services/            # Business logic services
│   │   ├── inference.py     # ML inference service
│   │   ├── policy.py        # Policy engine
│   │   └── storage.py       # File storage service
│   └── routers/             # API route handlers
│       ├── ingestion.py
│       ├── alerts.py
│       ├── devices.py
│       ├── houses.py
│       ├── health.py
│       ├── metrics.py
│       ├── inference.py
│       └── models.py
├── models/                  # ML model files (gitignored)
├── scripts/                 # Utility scripts
│   └── register_model.py
├── storage/                 # Local file storage (created automatically)
│   └── audio/
├── requirements.txt
├── .env.example
├── README.md
└── README_MODELS.md
```

## System Flow

1. **Ingestion**: IoT device uploads audio file → Event record created → File stored locally
2. **Inference**: Event triggers synchronous inference → Returns label and score
3. **Policy Evaluation**: Policy engine evaluates inference result → Creates alert if conditions met
4. **Alert Lifecycle**: Caregivers view/manage alerts → State transitions (acknowledge/resolve/dismiss)
5. **Audit Trail**: All alert state changes recorded in alert_history table

## Database Schema

The backend expects the following tables (create manually or via migrations):

- `events`: Ingested IoT signals
- `alerts`: System alerts
- `alert_history`: Audit trail for alert lifecycle
- `devices`: IoT device information
- `houses`: House/location information
- `ml_models`: ML model metadata and management

See `app/models/` for detailed schema definitions.

## Development Notes

### Inference Service

The inference service (`app/services/inference.py`) supports:
- Loading Keras models (`.keras` format)
- Model management via database (`ml_models` table)
- Hot-reloading models without server restart
- Fallback to dummy predictions if model fails to load

To use a real ML model:
1. Place your model file in `backend/models/` directory
2. Register the model using `scripts/register_model.py` or via API
3. The model will be automatically loaded on server startup
4. See `README_MODELS.md` for detailed model management instructions

### Policy Engine

The policy engine (`app/services/policy.py`) supports:

- **Threshold-based**: Alerts created when inference score exceeds threshold
- **Aggregation-based**: Alerts created when N events occur within T seconds

Configure via environment variables in `.env`.

### Error Handling

- All endpoints return structured error responses
- Database errors are logged and return 500 status
- Validation errors return 400 status with details
- Not found resources return 404 status

## Testing

For local testing, you can:

1. Use the `/api/v1/predict` endpoint to test inference
2. Use the `/api/v1/ingest/event` endpoint to simulate device uploads
3. Use the `/api/v1/health` endpoint to verify database connectivity

## Troubleshooting

### Database Connection Issues

- Verify `DATABASE_URL` is correct in `.env`
- Ensure PostgreSQL is accessible from your machine
- Check firewall/network settings for Supabase

### CORS Issues

- Add your frontend URL to `CORS_ORIGINS` in `.env`
- Restart the server after changing CORS settings

### File Storage Issues

- Ensure `STORAGE_PATH` directory is writable
- Check disk space availability

## Database Migrations

This project uses Alembic for database migrations. Since your Supabase schema already exists, you don't need to run an initial migration. However, for future schema changes:

### Setup (already done)
- Alembic is configured in `alembic.ini`
- Migration scripts go in `alembic/versions/`

### Creating a Migration

1. **Make changes to models** in `app/models/`

2. **Generate migration**:
   ```bash
   alembic revision --autogenerate -m "Description of changes"
   ```

3. **Review the generated migration** in `alembic/versions/` - Alembic auto-generates SQL but you should verify it

4. **Apply migration to Supabase**:
   ```bash
   alembic upgrade head
   ```

### Important Notes

- **Alert Types**: The policy engine requires alert types to exist in the `alert_types` table. Make sure you have at least these types:
  - `distress`
  - `inactivity`
  - `alarm`
  - `fall`
  - `anomaly`

  You can insert these manually or create a migration to seed them.

- **Current Schema**: The backend models match your existing Supabase schema, so no initial migration is needed.

## License

[Your License Here]

