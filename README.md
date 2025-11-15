# Smart Home Senior Care Platform

A comprehensive IoT-based monitoring platform for senior care, featuring real-time alert management, ML-powered audio analysis, and a modern web dashboard.

## 🏗️ Architecture

This project consists of two main components:

- **Backend API** (`/backend`): FastAPI-based REST API with PostgreSQL, ML inference, and policy engine
- **Frontend Dashboard** (`/frontend`): React + Vite dashboard with real-time monitoring and alert management

## 🚀 Quick Start

### Prerequisites

- **Backend**: Python 3.10+, PostgreSQL (Supabase recommended)
- **Frontend**: Node.js 16+, npm or yarn

### Backend Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env  # Edit with your database URL
uvicorn app.main:app --reload
```

See [backend/README.md](backend/README.md) for detailed setup instructions.

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

See [frontend/README.md](frontend/README.md) for more details.

## 📁 Project Structure

```
smart-home-senior-care-cmpe-281/
├── backend/                 # FastAPI backend API
│   ├── app/                 # Application code
│   │   ├── models/          # SQLAlchemy database models
│   │   ├── routers/         # API route handlers
│   │   ├── schemas/         # Pydantic request/response schemas
│   │   └── services/        # Business logic (inference, policy, storage)
│   ├── models/              # ML model files (gitignored)
│   ├── scripts/             # Utility scripts
│   ├── storage/             # File storage (audio files)
│   └── README.md            # Backend documentation
├── frontend/                # React dashboard
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── pages/           # Page components
│   │   └── services/        # API client services
│   └── README.md            # Frontend documentation
└── README.md                # This file
```

## 🔑 Key Features

### Backend
- **IoT Event Ingestion**: Accept audio files and metadata from devices
- **ML Inference**: Keras-based audio analysis with model management
- **Policy Engine**: Threshold and aggregation-based alert creation
- **Alert Lifecycle**: Create, acknowledge, resolve, and dismiss alerts
- **Database**: Async PostgreSQL with SQLAlchemy and Alembic migrations

### Frontend
- **Real-time Dashboard**: Live monitoring of alerts and devices
- **Interactive Map**: Visualize alerts on a map using React-Leaflet
- **Device Management**: Manage IoT devices and their status
- **Alert History**: View and filter alert history
- **ML Status**: Monitor ML model status and performance

## 🔧 Configuration

### Backend Environment Variables

Copy `backend/.env.example` to `backend/.env` and configure:

- `DATABASE_URL`: PostgreSQL connection string (Supabase)
- `CORS_ORIGINS_STR`: Comma-separated frontend URLs
- `STORAGE_PATH`: Path for storing uploaded audio files
- `POLICY_THRESHOLD`: Score threshold for alert creation
- `ML_MODEL_PATH`: Path to ML model file (optional)

See `backend/.env.example` for all available options.

## 📚 Documentation

- [Backend API Documentation](backend/README.md) - Backend setup, API endpoints, and development guide
- [ML Model Management](backend/README_MODELS.md) - How to manage and switch ML models
- [Frontend Documentation](frontend/README.md) - Frontend setup and component guide

## 🧪 Development

### Backend Development

```bash
cd backend
source venv/bin/activate
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

API Documentation available at:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

### Frontend Development

```bash
cd frontend
npm run dev
```

Frontend runs on http://localhost:5173 (default Vite port)

## 🗄️ Database

The project uses PostgreSQL (Supabase recommended). The backend includes:

- SQLAlchemy models matching your Supabase schema
- Alembic for database migrations
- Async database operations with asyncpg

See `backend/app/models/` for schema definitions.

## 🤖 ML Model Management

The system supports multiple ML models with hot-reloading:

- Store models in `backend/models/` directory
- Register models via API or `scripts/register_model.py`
- Switch active models without server restart
- Track model versions and performance

See [backend/README_MODELS.md](backend/README_MODELS.md) for details.

## 📝 License

[Your License Here]

## 👥 Contributors

[Your Team/Contributors]

---

For detailed setup instructions, see the README files in `backend/` and `frontend/` directories.

