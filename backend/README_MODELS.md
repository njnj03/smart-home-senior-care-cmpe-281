# ML Model Management

This document explains how to manage ML models in the system.

## Overview

The system uses a hybrid approach:
- **Model files**: Stored in the filesystem (e.g., `backend/models/` or `backend/`)
- **Model metadata**: Stored in the `ml_models` database table

This allows you to:
- List all available models via API
- Switch active models from the UI
- Track model versions and performance
- Hot-reload models without restarting the server

## Database Setup

### 1. Ensure the `ml_models` table exists

The `ml_models` table should already exist in your Supabase database. If it doesn't, you can create it using the schema defined in `app/models/ml_model.py`:

- `model_id` (SERIAL PRIMARY KEY)
- `model_name` (VARCHAR(255) NOT NULL UNIQUE)
- `version` (VARCHAR(50))
- `file_path` (VARCHAR(500) NOT NULL)
- `description` (TEXT)
- `model_type` (VARCHAR(100))
- `accuracy` (DECIMAL(5, 4))
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)
- `is_active` (BOOLEAN DEFAULT FALSE)
- `created_by_user_id` (INT, nullable)

**Important**: Create a unique index on `is_active` where `is_active = TRUE` to ensure only one active model at a time.

### 2. Register Your First Model

After creating the table, register your existing model:

```bash
# From backend directory
# First, move your model to the models/ folder (if not already there)
# Then register it:

# On Windows (Command Prompt or PowerShell - single line):
python scripts\register_model.py --name "YAMNet Human Detection v1" --path "models\my_yamnet_human_model.keras" --version "v1.0" --description "YAMNet-based model for human distress detection" --type "yamnet" --activate

# On Linux/Mac (multi-line with backslashes):
python scripts/register_model.py \
  --name "YAMNet Human Detection v1" \
  --path "models/my_yamnet_human_model.keras" \
  --version "v1.0" \
  --description "YAMNet-based model for human distress detection" \
  --type "yamnet" \
  --activate
```

This will:
- Register the model in the database
- Mark it as the active model
- The server will load it on next startup (or you can activate it via API)

## API Endpoints

### List All Models
```bash
GET /api/v1/models
```

Returns all models with the active model highlighted.

### Get Active Model
```bash
GET /api/v1/models/active
```

Returns the currently active model.

### Get Model Details
```bash
GET /api/v1/models/{model_id}
```

### Register New Model
```bash
POST /api/v1/models
Content-Type: application/json

{
  "model_name": "YAMNet Human v2",
  "version": "v2.0",
  "file_path": "models/yamnet_human_v2.keras",
  "description": "Improved version",
  "model_type": "yamnet",
  "accuracy": 0.92
}
```

**Note**: The model file must already exist in the filesystem before registering.

### Update Model Metadata
```bash
PUT /api/v1/models/{model_id}
Content-Type: application/json

{
  "description": "Updated description",
  "accuracy": 0.95
}
```

### Activate a Model
```bash
POST /api/v1/models/{model_id}/activate
```

This will:
- Deactivate the current active model
- Activate the specified model
- Hot-reload the model in the inference service (no server restart needed)

### Delete Model Record
```bash
DELETE /api/v1/models/{model_id}
```

**Note**: This only deletes the database record, not the model file.

## Directory Structure

**Recommended structure** (models in dedicated folder):

```
backend/
├── models/              # Store all model files here
│   ├── yamnet_human_v1.keras
│   ├── yamnet_human_v2.keras
│   └── distress_detector_v1.keras
├── app/
├── scripts/
└── ...
```

**Benefits:**
- Better organization
- Easier to manage multiple models
- Cleaner backend root directory
- Easier to add `.gitignore` rules for models

## Model File Paths

When registering models, use **relative paths from the backend directory**:

- `models/yamnet_human_v1.keras` (recommended - in models/ folder)
- `models/my_yamnet_human_model.keras` (if moved to models/)
- `my_yamnet_human_model.keras` (if still in backend root - legacy)

## Workflow

### Adding a New Model

1. **Place model file** in `backend/models/` (recommended)
2. **Register via API or script**:
   
   **Windows (single line):**
   ```cmd
   python scripts\register_model.py --name "New Model Name" --path "models\new_model.keras" --version "v1.0" --activate
   ```
   
   **Linux/Mac (multi-line):**
   ```bash
   python scripts/register_model.py \
     --name "New Model Name" \
     --path "models/new_model.keras" \
     --version "v1.0" \
     --activate
   ```
3. **Model is automatically loaded** and ready to use

### Switching Models

1. **Via UI**: Call `POST /api/v1/models/{model_id}/activate`
2. **Model hot-reloads** without server restart
3. **All new inference requests** use the new model

### Updating Model Metadata

Update accuracy, description, etc. via:
```bash
PUT /api/v1/models/{model_id}
```

## Best Practices

1. **Version your models**: Include version numbers in filenames and model names
2. **Document models**: Use the `description` field to document what each model does
3. **Track performance**: Update `accuracy` field as you test models
4. **Test before activating**: Test a model via `/api/v1/predict` before making it active
5. **Backup model files**: Keep model files in version control or backup storage

## Troubleshooting

### Model not loading on startup

- Check that an active model exists in the database
- Verify the `file_path` is correct and file exists
- Check server logs for error messages

### Hot-reload fails

- Ensure model file exists at the specified path
- Check file permissions
- Review server logs for specific errors

### Multiple active models

The database constraint ensures only one model can be active. If you see multiple active models, there's a database issue. Fix by:

```sql
-- Deactivate all
UPDATE ml_models SET is_active = FALSE;

-- Activate one
UPDATE ml_models SET is_active = TRUE WHERE model_id = 1;
```

