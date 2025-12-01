# ML Model Management Component - Design Document

**Project:** Smart Home Senior Care Platform  
**Component:** ML Model Management Module  
**Version:** 1.0  
**Date:** November 29, 2025  
**Course:** CMPE 281

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [High-Level Component View](#2-high-level-component-view)
3. [API Design](#3-api-design)
4. [Built-in Machine Learning Models](#4-built-in-machine-learning-models)
5. [GUI Design](#5-gui-design)
6. [Technical Architecture](#6-technical-architecture)
7. [Data Flow & Integration](#7-data-flow--integration)
8. [Security & Performance](#8-security--performance)

---

## 1. Executive Summary

The **ML Model Management Component** is a framework-agnostic machine learning orchestration system designed for the Smart Home Senior Care Platform. This component provides a unified interface for managing, deploying, and monitoring multiple machine learning models without dependency on specific ML frameworks (TensorFlow, PyTorch, scikit-learn, etc.).

### Key Capabilities

- **Framework-Agnostic Design**: Supports models from any ML framework through a standardized adapter pattern
- **Hot-Swapping**: Switch between models at runtime without service interruption
- **Version Control**: Track and manage multiple model versions with metadata
- **Performance Monitoring**: Real-time tracking of model accuracy and inference latency
- **RESTful API**: Complete CRUD operations for model lifecycle management
- **Web-Based GUI**: Intuitive interface for non-technical stakeholders

### Design Principles

1. **Decoupling**: Separation between model storage, metadata management, and inference execution
2. **Extensibility**: Easy addition of new model types and inference strategies
3. **Reliability**: Graceful degradation and fallback mechanisms
4. **Observability**: Comprehensive logging and monitoring capabilities

---

## 2. High-Level Component View

### 2.1 Black-Box Overview

```
┌─────────────────────────────────────────────────────────────┐
│         ML Model Management Component                       │
│                                                              │
│  Input:                                      Output:         │
│  • Model files (.keras, .pkl, .onnx, etc.) →  • Predictions│
│  • Audio/sensor data                        →  • Labels     │
│  • Management commands (CRUD)               →  • Confidence │
│  • Configuration parameters                 →  • Metadata   │
│                                                              │
│  Core Functions:                                             │
│  ✓ Register new models                                       │
│  ✓ Activate/deactivate models                                │
│  ✓ Run inference                                             │
│  ✓ Track model performance                                   │
│  ✓ Version management                                        │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 Component Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                     Frontend Layer (React)                        │
│  ┌────────────────┐  ┌──────────────┐  ┌─────────────────┐      │
│  │  Model Manager │  │ Inference UI │  │ Performance     │      │
│  │  Dashboard     │  │              │  │ Metrics Display │      │
│  └────────────────┘  └──────────────┘  └─────────────────┘      │
└──────────────────────────────────────────────────────────────────┘
                              ▲
                              │ REST API
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│                      API Layer (FastAPI)                          │
│  ┌─────────────────────────────────────────────────────────┐     │
│  │  /api/v1/models/*    - Model Management Endpoints       │     │
│  │  /api/v1/predict     - Inference Endpoint               │     │
│  └─────────────────────────────────────────────────────────┘     │
└──────────────────────────────────────────────────────────────────┘
                              ▲
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│                   Service Layer (Business Logic)                  │
│  ┌────────────────┐  ┌──────────────┐  ┌─────────────────┐      │
│  │  Model         │  │  Inference   │  │  Validation     │      │
│  │  Registry      │  │  Service     │  │  Service        │      │
│  │  Service       │  │              │  │                 │      │
│  └────────────────┘  └──────────────┘  └─────────────────┘      │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  Model Adapter Pattern (Framework-Agnostic Interface)   │    │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐   │    │
│  │  │ Keras    │ │ PyTorch  │ │ ONNX     │ │ Scikit   │   │    │
│  │  │ Adapter  │ │ Adapter  │ │ Adapter  │ │ Adapter  │   │    │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘   │    │
│  └─────────────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────────────┘
                              ▲
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│                     Data Layer                                    │
│  ┌────────────────┐              ┌──────────────────┐           │
│  │  PostgreSQL    │              │  File System     │           │
│  │  (ml_models)   │              │  (Model Files)   │           │
│  │  - Metadata    │              │  - .keras        │           │
│  │  - Status      │              │  - .pkl          │           │
│  │  - Performance │              │  - .onnx         │           │
│  └────────────────┘              └──────────────────┘           │
└──────────────────────────────────────────────────────────────────┘
```

### 2.3 Core Components

| Component | Responsibility | Technology |
|-----------|---------------|------------|
| **Model Registry** | Store and retrieve model metadata | PostgreSQL + SQLAlchemy |
| **Inference Service** | Load models and execute predictions | Python + Adapters |
| **Model Adapters** | Framework-specific model loading | Plugin architecture |
| **Validation Service** | Verify model integrity and compatibility | Custom validators |
| **API Router** | Expose HTTP endpoints | FastAPI |
| **Frontend Dashboard** | User interface for management | React + Vite |

---

## 3. API Design

### 3.1 API Overview

The ML Model Management API follows RESTful principles and provides complete CRUD operations.

**Base URL:** `http://localhost:8000/api/v1`

**Authentication:** Bearer token (future implementation)

**Content-Type:** `application/json` (except file uploads: `multipart/form-data`)

### 3.2 API Endpoints

#### 3.2.1 Model Management Endpoints

##### GET /models
List all registered models with their metadata.

**Request:**
```http
GET /api/v1/models
```

**Response:** `200 OK`
```json
{
  "models": [
    {
      "model_id": 1,
      "model_name": "YAMNet Human Detection v1",
      "version": "v1.0",
      "file_path": "models/my_yamnet_human_model.keras",
      "description": "Audio event detection for senior care monitoring",
      "model_type": "yamnet",
      "accuracy": 0.8750,
      "created_at": "2024-01-15T10:30:00Z",
      "updated_at": "2024-01-15T10:30:00Z",
      "is_active": true,
      "created_by_user_id": null,
      "file_exists": true
    },
    {
      "model_id": 2,
      "model_name": "Custom CNN Audio Classifier",
      "version": "v2.1",
      "file_path": "models/custom_cnn_v2.keras",
      "description": "Custom CNN for fall detection",
      "model_type": "custom",
      "accuracy": 0.9100,
      "created_at": "2024-02-01T14:20:00Z",
      "updated_at": "2024-02-01T14:20:00Z",
      "is_active": false,
      "created_by_user_id": null,
      "file_exists": true
    }
  ],
  "active_model": {
    "model_id": 1,
    "model_name": "YAMNet Human Detection v1",
    "version": "v1.0",
    ...
  }
}
```

---

##### GET /models/active
Get the currently active model.

**Request:**
```http
GET /api/v1/models/active
```

**Response:** `200 OK`
```json
{
  "model_id": 1,
  "model_name": "YAMNet Human Detection v1",
  "version": "v1.0",
  "file_path": "models/my_yamnet_human_model.keras",
  "description": "Audio event detection for senior care monitoring",
  "model_type": "yamnet",
  "accuracy": 0.8750,
  "created_at": "2024-01-15T10:30:00Z",
  "updated_at": "2024-01-15T10:30:00Z",
  "is_active": true,
  "created_by_user_id": null,
  "file_exists": true
}
```

**Error Response:** `404 Not Found`
```json
{
  "detail": "No active model found"
}
```

---

##### GET /models/{model_id}
Get details for a specific model.

**Request:**
```http
GET /api/v1/models/1
```

**Response:** `200 OK`
```json
{
  "model_id": 1,
  "model_name": "YAMNet Human Detection v1",
  "version": "v1.0",
  ...
}
```

**Error Response:** `404 Not Found`
```json
{
  "detail": "Model 1 not found"
}
```

---

##### POST /models
Register a new model in the system.

**Request:**
```http
POST /api/v1/models
Content-Type: application/json

{
  "model_name": "YAMNet Human Detection v1",
  "version": "v1.0",
  "file_path": "models/my_yamnet_human_model.keras",
  "description": "Audio event detection for senior care monitoring",
  "model_type": "yamnet",
  "accuracy": 0.8750
}
```

**Response:** `201 Created`
```json
{
  "model_id": 1,
  "model_name": "YAMNet Human Detection v1",
  "version": "v1.0",
  "file_path": "models/my_yamnet_human_model.keras",
  "description": "Audio event detection for senior care monitoring",
  "model_type": "yamnet",
  "accuracy": 0.8750,
  "created_at": "2024-01-15T10:30:00Z",
  "updated_at": "2024-01-15T10:30:00Z",
  "is_active": false,
  "created_by_user_id": null,
  "file_exists": true
}
```

**Error Response:** `400 Bad Request`
```json
{
  "detail": "Model with name 'YAMNet Human Detection v1' already exists"
}
```

---

##### PUT /models/{model_id}
Update model metadata.

**Request:**
```http
PUT /api/v1/models/1
Content-Type: application/json

{
  "description": "Updated description",
  "accuracy": 0.9000
}
```

**Response:** `200 OK`
```json
{
  "model_id": 1,
  "model_name": "YAMNet Human Detection v1",
  "version": "v1.0",
  "file_path": "models/my_yamnet_human_model.keras",
  "description": "Updated description",
  "model_type": "yamnet",
  "accuracy": 0.9000,
  "created_at": "2024-01-15T10:30:00Z",
  "updated_at": "2024-01-15T10:35:00Z",
  "is_active": true,
  "created_by_user_id": null,
  "file_exists": true
}
```

---

##### POST /models/{model_id}/activate
Activate a model (deactivates the current active model).

**Request:**
```http
POST /api/v1/models/2/activate
```

**Response:** `200 OK`
```json
{
  "model_id": 2,
  "model_name": "Custom CNN Audio Classifier",
  "version": "v2.1",
  "file_path": "models/custom_cnn_v2.keras",
  "description": "Custom CNN for fall detection",
  "model_type": "custom",
  "accuracy": 0.9100,
  "created_at": "2024-02-01T14:20:00Z",
  "updated_at": "2024-02-01T14:20:00Z",
  "is_active": true,
  "created_by_user_id": null,
  "file_exists": true
}
```

**Error Responses:**

`404 Not Found`
```json
{
  "detail": "Model 2 not found"
}
```

`400 Bad Request`
```json
{
  "detail": "Model file not found at path: models/custom_cnn_v2.keras"
}
```

`400 Bad Request` (load failure)
```json
{
  "detail": "Failed to load model: Invalid model format"
}
```

---

##### DELETE /models/{model_id}
Delete a model record (does not delete the physical file).

**Request:**
```http
DELETE /api/v1/models/2
```

**Response:** `204 No Content`

**Error Responses:**

`404 Not Found`
```json
{
  "detail": "Model 2 not found"
}
```

`400 Bad Request` (active model)
```json
{
  "detail": "Cannot delete the active model. Please activate another model first."
}
```

`400 Bad Request` (only model)
```json
{
  "detail": "Cannot delete the only model. Please add another model first."
}
```

---

#### 3.2.2 Inference Endpoint

##### POST /predict
Run inference on an audio file using the active model.

**Request:**
```http
POST /api/v1/predict
Content-Type: multipart/form-data

audio_file: <binary file data>
```

**Response:** `200 OK`
```json
{
  "label": "distress",
  "score": 0.8500
}
```

**Possible Labels:**
- `normal` - No unusual activity detected
- `distress` - Distress sounds (crying, shouting, pain)
- `inactivity` - Prolonged silence or inactivity
- `alarm` - Alarm sounds (smoke detector, medical alert)
- `fall` - Fall detection sounds

**Error Response:** `400 Bad Request`
```json
{
  "detail": "Audio file is empty"
}
```

**Error Response:** `500 Internal Server Error`
```json
{
  "detail": "Internal server error: Model not loaded"
}
```

---

### 3.3 Data Schemas

#### MLModelCreate
```json
{
  "model_name": "string (required, unique)",
  "version": "string (optional)",
  "file_path": "string (required, relative path from backend/)",
  "description": "string (optional)",
  "model_type": "string (optional, e.g., 'yamnet', 'custom', 'pytorch')",
  "accuracy": "decimal (optional, 0.0-1.0, up to 4 decimal places)"
}
```

#### MLModelUpdate
```json
{
  "model_name": "string (optional)",
  "version": "string (optional)",
  "file_path": "string (optional)",
  "description": "string (optional)",
  "model_type": "string (optional)",
  "accuracy": "decimal (optional, 0.0-1.0)"
}
```

#### MLModelResponse
```json
{
  "model_id": "integer",
  "model_name": "string",
  "version": "string | null",
  "file_path": "string",
  "description": "string | null",
  "model_type": "string | null",
  "accuracy": "decimal | null",
  "created_at": "datetime (ISO 8601)",
  "updated_at": "datetime (ISO 8601)",
  "is_active": "boolean",
  "created_by_user_id": "integer | null",
  "file_exists": "boolean | null"
}
```

#### InferenceResponse
```json
{
  "label": "string (e.g., 'distress', 'normal', 'fall')",
  "score": "float (0.0-1.0, confidence score)"
}
```

---

### 3.4 Error Handling

All API errors follow this format:

```json
{
  "detail": "Human-readable error message"
}
```

**HTTP Status Codes:**
- `200 OK` - Successful request
- `201 Created` - Resource created successfully
- `204 No Content` - Successful deletion
- `400 Bad Request` - Validation error or invalid operation
- `404 Not Found` - Resource not found
- `500 Internal Server Error` - Server-side error

---

## 4. Built-in Machine Learning Models

### 4.1 Model Categories

The ML Model Management Component supports three categories of built-in models:

#### 4.1.1 Audio Event Detection Models
**Purpose:** Detect acoustic events relevant to senior care

**Supported Models:**

1. **YAMNet-based Human Detection**
   - **Type:** Transfer Learning (YAMNet + Custom Classifier)
   - **Framework:** TensorFlow/Keras
   - **Input:** 16kHz mono audio, 1-second clips
   - **Output:** 5 classes (normal, distress, inactivity, alarm, fall)
   - **Accuracy:** ~87.5%
   - **Use Case:** General-purpose audio monitoring
   - **File Format:** `.keras`

2. **Custom CNN Audio Classifier**
   - **Type:** Convolutional Neural Network
   - **Framework:** TensorFlow/Keras or PyTorch
   - **Input:** Mel-spectrogram features
   - **Output:** Multi-class probabilities
   - **Accuracy:** ~91.0%
   - **Use Case:** Fine-tuned for specific environments
   - **File Format:** `.keras`, `.pth`

#### 4.1.2 Anomaly Detection Models
**Purpose:** Detect unusual patterns in sensor data

**Supported Models:**

3. **Autoencoder-based Anomaly Detector**
   - **Type:** Unsupervised Learning
   - **Framework:** TensorFlow/Keras or scikit-learn
   - **Input:** Time-series sensor data
   - **Output:** Anomaly score (0.0-1.0)
   - **Use Case:** Detect irregular activity patterns
   - **File Format:** `.keras`, `.pkl`

4. **Isolation Forest Classifier**
   - **Type:** Ensemble Method
   - **Framework:** scikit-learn
   - **Input:** Feature vectors from multiple sensors
   - **Output:** Binary (normal/anomaly) + confidence
   - **Use Case:** Real-time outlier detection
   - **File Format:** `.pkl`

#### 4.1.3 Time-Series Prediction Models
**Purpose:** Predict future events based on historical data

**Supported Models:**

5. **LSTM Activity Predictor**
   - **Type:** Recurrent Neural Network
   - **Framework:** TensorFlow/Keras or PyTorch
   - **Input:** Sequential sensor readings
   - **Output:** Predicted next activity
   - **Use Case:** Anticipate needs (e.g., bathroom visits)
   - **File Format:** `.keras`, `.pth`

### 4.2 Model Adapter Pattern

The component uses a **Model Adapter Pattern** to support multiple frameworks:

```python
# Base Adapter Interface
class BaseModelAdapter:
    def load_model(self, file_path: str) -> Any:
        """Load model from file"""
        raise NotImplementedError
    
    def preprocess(self, input_data: Any) -> Any:
        """Preprocess input for this model type"""
        raise NotImplementedError
    
    def predict(self, input_data: Any) -> Tuple[str, float]:
        """Run inference and return (label, confidence)"""
        raise NotImplementedError
    
    def validate(self, file_path: str) -> bool:
        """Validate model file integrity"""
        raise NotImplementedError

# Example: Keras Adapter
class KerasModelAdapter(BaseModelAdapter):
    def load_model(self, file_path: str):
        import tensorflow as tf
        return tf.keras.models.load_model(file_path, compile=False)
    
    def preprocess(self, audio_file: str):
        # Specific preprocessing for Keras models
        ...
    
    def predict(self, input_data):
        # Run Keras model inference
        ...

# Example: PyTorch Adapter
class PyTorchModelAdapter(BaseModelAdapter):
    def load_model(self, file_path: str):
        import torch
        return torch.load(file_path)
    
    def preprocess(self, audio_file: str):
        # Specific preprocessing for PyTorch models
        ...
    
    def predict(self, input_data):
        # Run PyTorch model inference
        ...

# Example: Scikit-learn Adapter
class SklearnModelAdapter(BaseModelAdapter):
    def load_model(self, file_path: str):
        import joblib
        return joblib.load(file_path)
    
    def preprocess(self, sensor_data: dict):
        # Feature extraction for sklearn models
        ...
    
    def predict(self, input_data):
        # Run sklearn model inference
        ...
```

### 4.3 Model File Organization

```
backend/
└── models/
    ├── audio_detection/
    │   ├── my_yamnet_human_model.keras
    │   ├── custom_cnn_v2.keras
    │   └── pytorch_audio_v1.pth
    ├── anomaly_detection/
    │   ├── autoencoder_anomaly.keras
    │   └── isolation_forest.pkl
    └── time_series/
        ├── lstm_activity_predictor.keras
        └── transformer_predictor.pth
```

### 4.4 Model Registration

Models can be registered using:

1. **REST API** (see Section 3.2.1)
2. **Python Script:**

```bash
python scripts/register_model.py \
  --name "YAMNet Human Detection v1" \
  --path "models/audio_detection/my_yamnet_human_model.keras" \
  --version "v1.0" \
  --type "yamnet" \
  --description "Audio event detection for senior care monitoring" \
  --accuracy 0.8750 \
  --activate
```

### 4.5 Model Selection Criteria

| Criterion | Weight | Description |
|-----------|--------|-------------|
| **Accuracy** | 35% | Validation accuracy on test dataset |
| **Latency** | 25% | Inference time per prediction |
| **Resource Usage** | 20% | CPU/memory footprint |
| **Robustness** | 20% | Performance across diverse inputs |

### 4.6 Supported File Formats

| Format | Framework | Extension | Notes |
|--------|-----------|-----------|-------|
| Keras/TensorFlow | TensorFlow 2.x | `.keras`, `.h5` | Recommended format |
| PyTorch | PyTorch | `.pth`, `.pt` | State dict or full model |
| ONNX | Cross-platform | `.onnx` | Framework-agnostic |
| Scikit-learn | scikit-learn | `.pkl`, `.joblib` | Pickle or joblib |
| Custom | Any | `.bin`, `.model` | With custom adapter |

---

## 5. GUI Design

### 5.1 Machine Learning Status Page

The ML Model Management GUI is implemented as a React component at `/ml-status`.

#### 5.1.1 Layout Overview

```
┌────────────────────────────────────────────────────────────────┐
│  Smart Home Senior Care Platform                   [User Menu] │
├────────────────────────────────────────────────────────────────┤
│  [Dashboard] [Alerts] [Devices] [ML Status] [Settings]         │
├────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │  Machine Learning Models                   [+ Add Model] │ │
│  ├──────────────────────────────────────────────────────────┤ │
│  │  ✓ Model activated successfully!                         │ │
│  │                                                           │ │
│  │  [Active Model]                                           │ │
│  │  YAMNet Human Detection v1 (v1.0)                         │ │
│  │  Accuracy: 87.5%                                          │ │
│  └──────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │  YAMNet Human Detection v1                               │ │
│  │  v1.0 • Created Jan 15, 2024, 10:30 AM PST               │ │
│  │  Accuracy: 87.5%                                          │ │
│  │                      [Active] [Edit] [Delete]            │ │
│  └──────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │  Custom CNN Audio Classifier                             │ │
│  │  v2.1 • Created Feb 01, 2024, 2:20 PM PST                │ │
│  │  Accuracy: 91.0%                                          │ │
│  │                    [Activate] [Edit] [Delete]            │ │
│  └──────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │  LSTM Activity Predictor                                 │ │
│  │  v1.5 • Created Mar 10, 2024, 9:15 AM PST                │ │
│  │  Accuracy: 84.2%                                          │ │
│  │  ⚠️ File not found at path: models/lstm_v1.keras         │ │
│  │                    [Activate] [Edit] [Delete]            │ │
│  └──────────────────────────────────────────────────────────┘ │
│                                                                 │
└────────────────────────────────────────────────────────────────┘
```

#### 5.1.2 Model Card Design

Each model is displayed as a card with the following information:

**Active Model (Green Border):**
```
┌────────────────────────────────────────────────────────────┐
│ ✓ [Green Background]                                       │
│ Active Model                                               │
│ YAMNet Human Detection v1 (v1.0)                           │
│ Accuracy: 87.5%                                            │
└────────────────────────────────────────────────────────────┘
```

**Inactive Model:**
```
┌────────────────────────────────────────────────────────────┐
│ Custom CNN Audio Classifier                   [Activate]   │
│ v2.1 • Created Feb 01, 2024, 2:20 PM PST    [Edit]       │
│ Accuracy: 91.0%                              [Delete]      │
└────────────────────────────────────────────────────────────┘
```

**Model with Error (Red Warning):**
```
┌────────────────────────────────────────────────────────────┐
│ LSTM Activity Predictor                      [Activate]    │
│ v1.5 • Created Mar 10, 2024, 9:15 AM PST    [Edit]       │
│ Accuracy: 84.2%                             [Delete]       │
│ ⚠️ File not found at path: models/lstm_v1.keras           │
└────────────────────────────────────────────────────────────┘
```

#### 5.1.3 Add Model Dialog

```
┌──────────────────────────────────────────────┐
│  Add New Model                         [×]   │
├──────────────────────────────────────────────┤
│                                              │
│  Model Name *                                │
│  ┌────────────────────────────────────────┐ │
│  │ YAMNet Human Detection v1              │ │
│  └────────────────────────────────────────┘ │
│                                              │
│  Version                                     │
│  ┌────────────────────────────────────────┐ │
│  │ v1.0                                    │ │
│  └────────────────────────────────────────┘ │
│                                              │
│  File Path *                                 │
│  ┌────────────────────────────────────────┐ │
│  │ models/my_yamnet_human_model.keras     │ │
│  └────────────────────────────────────────┘ │
│  e.g., models/my_model.keras                │
│                                              │
│  Description                                 │
│  ┌────────────────────────────────────────┐ │
│  │ Audio event detection for senior care  │ │
│  │ monitoring                              │ │
│  │                                         │ │
│  └────────────────────────────────────────┘ │
│                                              │
│  Model Type                                  │
│  ┌────────────────────────────────────────┐ │
│  │ yamnet                                  │ │
│  └────────────────────────────────────────┘ │
│  e.g., yamnet, custom                       │
│                                              │
│  Accuracy                                    │
│  ┌────────────────────────────────────────┐ │
│  │ 0.8750                                  │ │
│  └────────────────────────────────────────┘ │
│  0.0 - 1.0                                  │
│                                              │
│  [ Create ]              [ Cancel ]         │
│                                              │
└──────────────────────────────────────────────┘
```

#### 5.1.4 Edit Model Dialog

Similar to "Add Model" but with:
- Pre-filled form fields with current model data
- "Update" button instead of "Create"
- All fields optional (partial updates supported)

#### 5.1.5 Delete Confirmation Dialog

```
┌──────────────────────────────────────────────┐
│  Delete Model                          [×]   │
├──────────────────────────────────────────────┤
│                                              │
│  Are you sure you want to delete this       │
│  model? This action cannot be undone.       │
│                                              │
│  Note: The model file will not be deleted   │
│  from the filesystem.                       │
│                                              │
│  [ Delete ]              [ Cancel ]         │
│                                              │
└──────────────────────────────────────────────┘
```

### 5.2 User Interactions

#### 5.2.1 Viewing Models
1. Navigate to "ML Status" page
2. See list of all registered models
3. Active model highlighted in green at the top
4. Each model shows: name, version, accuracy, creation date
5. Red warning icon if model file is missing

#### 5.2.2 Adding a Model
1. Click "+ Add Model" button
2. Fill in required fields (name, file path)
3. Optional: Fill in version, description, type, accuracy
4. Click "Create"
5. Success: Modal closes, model appears in list
6. Error: Alert message shows error details

#### 5.2.3 Activating a Model
1. Click "Activate" button on an inactive model
2. Button shows "Activating..." with spinner
3. Success: 
   - Green success message: "Model activated successfully!"
   - Model moves to active section
   - Previous active model becomes inactive
4. Error:
   - Red error message: "Failed to activate model: [reason]"
   - Model remains inactive

**Constraints:**
- Cannot activate if file doesn't exist (button disabled)
- Cannot activate already active model (button shows "Active" and disabled)

#### 5.2.4 Editing a Model
1. Click "Edit" button on any model
2. Edit Model dialog opens with pre-filled data
3. Modify desired fields
4. Click "Update"
5. Success: Modal closes, changes reflected in list
6. Error: Alert message shows error details

#### 5.2.5 Deleting a Model
1. Click "Delete" button on an inactive model
2. Confirmation dialog appears
3. Click "Delete" to confirm or "Cancel" to abort
4. Success: Model removed from list
5. Error: Alert message shows error details

**Constraints:**
- Cannot delete active model (must activate another first)
- Cannot delete the only model in the system
- Deletion only removes database record, not the physical file

### 5.3 Visual Design Specifications

#### 5.3.1 Color Palette

| Element | Color | Hex Code | Usage |
|---------|-------|----------|-------|
| Primary | Blue | `#3B82F6` | Activate button |
| Success | Green | `#10B981` | Active model, success messages |
| Warning | Yellow | `#F59E0B` | Edit button |
| Danger | Red | `#EF4444` | Delete button, error messages |
| Neutral | Gray | `#6B7280` | Inactive text |
| Background | Light Gray | `#F9FAFB` | Page background |
| Card | White | `#FFFFFF` | Model cards |

#### 5.3.2 Typography

| Element | Font Size | Font Weight | Usage |
|---------|-----------|-------------|-------|
| Page Title | 24px | Bold (700) | "Machine Learning Models" |
| Model Name | 16px | Semibold (600) | Primary text in card |
| Model Details | 14px | Regular (400) | Version, date, accuracy |
| Button Text | 14px | Medium (500) | All buttons |
| Error Message | 14px | Regular (400) | Error/warning text |

#### 5.3.3 Responsive Design

**Desktop (>1024px):**
- Full-width layout with max-width: 1024px
- Model cards stack vertically with 8px spacing
- Buttons aligned to the right of each card

**Tablet (768px - 1024px):**
- Full-width layout with padding
- Model cards stack vertically
- Buttons wrap to second line if needed

**Mobile (<768px):**
- Full-width layout with minimal padding
- Model cards stack vertically
- Buttons stack vertically within cards
- Dialogs full-screen with scroll

### 5.4 Accessibility Features

- **Keyboard Navigation:** All interactive elements accessible via Tab/Shift+Tab
- **Screen Reader Support:** ARIA labels on all buttons and inputs
- **Focus Indicators:** Visible focus outlines on all interactive elements
- **Color Contrast:** WCAG AA compliance (4.5:1 minimum contrast ratio)
- **Error Announcements:** Screen readers announce success/error messages

---

## 6. Technical Architecture

### 6.1 Database Schema

```sql
CREATE TABLE ml_models (
    model_id SERIAL PRIMARY KEY,
    model_name VARCHAR(255) NOT NULL UNIQUE,
    version VARCHAR(50),
    file_path VARCHAR(500) NOT NULL,
    description TEXT,
    model_type VARCHAR(100),
    accuracy DECIMAL(5,4),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    is_active BOOLEAN DEFAULT FALSE NOT NULL,
    created_by_user_id INTEGER,
    
    -- Constraints
    CONSTRAINT unique_active_model UNIQUE (is_active) WHERE (is_active = TRUE),
    CONSTRAINT accuracy_range CHECK (accuracy >= 0 AND accuracy <= 1)
);

-- Indexes
CREATE INDEX idx_ml_models_is_active ON ml_models (is_active);
CREATE INDEX idx_ml_models_model_name ON ml_models (model_name);
```

### 6.2 Service Architecture

#### 6.2.1 InferenceService

```python
class InferenceService:
    """
    Framework-agnostic inference service with hot-reloading support.
    """
    
    def __init__(self):
        self.model = None
        self.model_path = None
        self.current_model_id = None
        self.adapter = None  # Model adapter for current framework
    
    async def load_active_model_from_db(self, db_session):
        """Load the active model from database"""
        ...
    
    def load_model(self, model_path: str):
        """Hot-reload model from file path"""
        ...
    
    async def predict(self, audio_file_path: str) -> InferenceResponse:
        """Run inference on audio file"""
        ...
    
    def _select_adapter(self, model_path: str) -> BaseModelAdapter:
        """Select appropriate adapter based on file extension"""
        ...
```

#### 6.2.2 Model Registry Service

```python
class ModelRegistryService:
    """
    Service for managing model metadata and lifecycle.
    """
    
    async def list_models(self, db: AsyncSession) -> List[MLModel]:
        """List all registered models"""
        ...
    
    async def get_active_model(self, db: AsyncSession) -> Optional[MLModel]:
        """Get the currently active model"""
        ...
    
    async def register_model(
        self, db: AsyncSession, model_data: MLModelCreate
    ) -> MLModel:
        """Register a new model"""
        ...
    
    async def activate_model(
        self, db: AsyncSession, model_id: int
    ) -> MLModel:
        """Activate a model and deactivate others"""
        ...
    
    async def delete_model(self, db: AsyncSession, model_id: int):
        """Delete a model record"""
        ...
```

### 6.3 Adapter Factory Pattern

```python
class ModelAdapterFactory:
    """
    Factory for creating framework-specific model adapters.
    """
    
    _adapters = {
        '.keras': KerasModelAdapter,
        '.h5': KerasModelAdapter,
        '.pth': PyTorchModelAdapter,
        '.pt': PyTorchModelAdapter,
        '.onnx': ONNXModelAdapter,
        '.pkl': SklearnModelAdapter,
        '.joblib': SklearnModelAdapter,
    }
    
    @classmethod
    def create_adapter(cls, file_path: str) -> BaseModelAdapter:
        """Create adapter based on file extension"""
        extension = Path(file_path).suffix.lower()
        
        adapter_class = cls._adapters.get(extension)
        if adapter_class is None:
            raise ValueError(f"Unsupported model format: {extension}")
        
        return adapter_class()
    
    @classmethod
    def register_adapter(cls, extension: str, adapter_class: Type[BaseModelAdapter]):
        """Register a custom adapter for a file extension"""
        cls._adapters[extension] = adapter_class
```

### 6.4 Validation Service

```python
class ModelValidationService:
    """
    Service for validating model files and metadata.
    """
    
    def validate_file_exists(self, file_path: str) -> bool:
        """Check if model file exists"""
        ...
    
    def validate_model_format(self, file_path: str) -> bool:
        """Validate model file format"""
        ...
    
    def validate_model_metadata(self, model_data: MLModelCreate) -> bool:
        """Validate model metadata"""
        ...
    
    def validate_model_loadable(self, file_path: str) -> bool:
        """Test if model can be loaded"""
        ...
```

---

## 7. Data Flow & Integration

### 7.1 Model Activation Flow

```
┌─────────────┐
│   Frontend  │
│  [Activate] │
└──────┬──────┘
       │ POST /models/{id}/activate
       ▼
┌──────────────────┐
│   API Router     │
│  activate_model()│
└──────┬───────────┘
       │
       ▼
┌────────────────────────────────────────────┐
│  Model Registry Service                    │
│  1. Get model record from DB               │
│  2. Validate model exists                  │
│  3. Check file exists                      │
│  4. Deactivate current active model        │
│  5. Activate new model in DB               │
└────────────┬───────────────────────────────┘
             │
             ▼
┌────────────────────────────────────────────┐
│  Inference Service                         │
│  1. Load model file using adapter          │
│  2. Validate model loads successfully      │
│  3. Update current_model_id                │
└────────────┬───────────────────────────────┘
             │
             ▼ (Success)
┌────────────────────────────────────────────┐
│  Database                                  │
│  Commit transaction                        │
│  - Old model: is_active = false            │
│  - New model: is_active = true             │
└────────────┬───────────────────────────────┘
             │
             ▼
┌─────────────────┐
│   Frontend      │
│  Show success   │
│  Update UI      │
└─────────────────┘
```

### 7.2 Inference Flow

```
┌─────────────┐
│ IoT Device  │
│ Audio File  │
└──────┬──────┘
       │ POST /ingest/event
       ▼
┌──────────────────┐
│  Ingestion API   │
│  1. Store file   │
│  2. Create event │
└──────┬───────────┘
       │
       ▼
┌────────────────────────────────────────────┐
│  Inference Service                         │
│  1. Load audio file                        │
│  2. Get active model adapter               │
│  3. Preprocess audio (adapter-specific)    │
│  4. Run inference                          │
│  5. Postprocess result                     │
└────────────┬───────────────────────────────┘
             │ InferenceResponse{label, score}
             ▼
┌────────────────────────────────────────────┐
│  Policy Engine                             │
│  1. Evaluate score vs threshold            │
│  2. Check aggregation rules                │
│  3. Create alert if needed                 │
└────────────┬───────────────────────────────┘
             │
             ▼
┌────────────────────────────────────────────┐
│  Database                                  │
│  1. Store event with prediction            │
│  2. Create alert (if triggered)            │
└────────────────────────────────────────────┘
```

### 7.3 Integration Points

#### 7.3.1 With IoT Ingestion Module
- **Input:** Audio files from IoT devices
- **Output:** Inference results (label + confidence score)
- **Protocol:** Synchronous function call within backend

#### 7.3.2 With Policy Engine
- **Input:** Inference results
- **Output:** Alert decisions
- **Protocol:** Synchronous function call within backend

#### 7.3.3 With Alert Management Module
- **Input:** Alert triggers from policy engine
- **Output:** Alert records created in database
- **Protocol:** Database write operations

#### 7.3.4 With Frontend Dashboard
- **Input:** User management actions (CRUD operations)
- **Output:** Model status, metadata, active model info
- **Protocol:** REST API over HTTP

---

## 8. Security & Performance

### 8.1 Security Considerations

#### 8.1.1 File System Security
- **Model File Storage:** Models stored in `backend/models/` directory (outside web root)
- **Path Validation:** All file paths validated to prevent directory traversal
- **File Permissions:** Model files read-only for application user
- **Uploaded Files:** Future model upload feature will include virus scanning

#### 8.1.2 API Security
- **Authentication:** Bearer token authentication (future implementation)
- **Authorization:** Role-based access control (RBAC) for model management
  - `admin` - Full CRUD access
  - `operator` - Activate/view only
  - `viewer` - View only
- **Input Validation:** All API inputs validated using Pydantic schemas
- **Rate Limiting:** API rate limits to prevent abuse

#### 8.1.3 Model Integrity
- **Checksum Verification:** SHA-256 checksum validation on model files
- **Digital Signatures:** Code signing for verified models (future)
- **Sandboxing:** Model loading in isolated process (future)

### 8.2 Performance Optimizations

#### 8.2.1 Model Loading
- **Lazy Loading:** Models loaded only when activated
- **Caching:** Active model cached in memory
- **Precompilation:** Models precompiled for faster inference

#### 8.2.2 Inference Optimization
- **Batch Processing:** Support for batch inference (future)
- **Model Quantization:** INT8 quantization for faster inference
- **GPU Acceleration:** CUDA support for TensorFlow/PyTorch models
- **Thread Pool:** Async inference with thread pool executor

#### 8.2.3 Database Optimization
- **Indexing:** Indexes on `is_active`, `model_name`
- **Connection Pooling:** Async connection pool (SQLAlchemy)
- **Query Optimization:** Selective field loading

### 8.3 Monitoring & Logging

#### 8.3.1 Application Logging
```python
logger.info(f"Model activated: {model.model_name} (ID: {model_id})")
logger.warning(f"Model file not found: {model_file_path}")
logger.error(f"Failed to load model: {e}", exc_info=True)
```

**Log Levels:**
- `INFO` - Normal operations (model activation, registration)
- `WARNING` - Non-critical issues (file not found, deprecated features)
- `ERROR` - Critical failures (model load failure, database errors)

#### 8.3.2 Performance Metrics
- **Inference Latency:** Time from request to response
- **Model Load Time:** Time to load model into memory
- **Throughput:** Inferences per second
- **Resource Usage:** CPU/memory utilization

#### 8.3.3 Health Monitoring
- **Model Availability:** Active model loaded and functional
- **File System:** Model files accessible
- **Database Connectivity:** ml_models table accessible
- **Adapter Status:** All adapters functional

### 8.4 Scalability Considerations

#### 8.4.1 Horizontal Scaling
- **Stateless Design:** Inference service can run on multiple instances
- **Shared Storage:** Model files on shared network storage (NFS, S3)
- **Database Replication:** PostgreSQL read replicas for model metadata

#### 8.4.2 Vertical Scaling
- **Multi-Threading:** Thread pool for concurrent inferences
- **GPU Support:** CUDA/Metal acceleration for larger models
- **Memory Management:** Model unloading for unused models

---

## Appendix A: Technology Stack

| Layer | Technology | Version | Purpose |
|-------|------------|---------|---------|
| **Frontend** | React | 18.x | UI framework |
| | Vite | 4.x | Build tool |
| | Tailwind CSS | 3.x | Styling |
| **Backend** | Python | 3.10+ | Runtime |
| | FastAPI | 0.100+ | Web framework |
| | SQLAlchemy | 2.0+ | ORM |
| | Pydantic | 2.0+ | Schema validation |
| **Database** | PostgreSQL | 14+ | Relational database |
| **ML Frameworks** | TensorFlow | 2.x | Keras models |
| | PyTorch | 2.x | PyTorch models |
| | scikit-learn | 1.x | Traditional ML |
| | ONNX Runtime | 1.x | ONNX models |
| **Infrastructure** | Docker | (optional) | Containerization |
| | uvicorn | 0.20+ | ASGI server |

---

## Appendix B: Future Enhancements

### Phase 2 Enhancements
1. **Model Upload via GUI:** Upload model files directly from browser
2. **A/B Testing:** Run multiple models simultaneously and compare results
3. **Model Versioning:** Git-style versioning for model files
4. **Performance Dashboard:** Real-time metrics and visualizations
5. **Auto-Retraining:** Automatic model retraining based on new data
6. **Model Marketplace:** Share and download community models

### Phase 3 Enhancements
7. **Federated Learning:** Distributed model training across multiple houses
8. **Explainable AI:** Visualize model decisions (SHAP, LIME)
9. **Model Compression:** Automatic model pruning and quantization
10. **Edge Deployment:** Deploy models to IoT devices
11. **MLOps Integration:** CI/CD pipelines for model deployment
12. **Custom Training UI:** Train models from GUI without code

---

## Appendix C: Glossary

| Term | Definition |
|------|------------|
| **Adapter Pattern** | Design pattern that allows incompatible interfaces to work together |
| **Framework-Agnostic** | Not dependent on any specific ML framework |
| **Hot-Reloading** | Ability to reload components without restarting the service |
| **Inference** | Process of using a trained model to make predictions |
| **Model Activation** | Making a model the active/default model for predictions |
| **Model Registry** | Database of registered ML models with metadata |
| **ONNX** | Open Neural Network Exchange - framework-agnostic model format |
| **Policy Engine** | Component that decides when to create alerts based on rules |

---

## Document Control

**Document Version:** 1.0  
**Last Updated:** November 29, 2025  
**Author:** [Your Team Name]  
**Reviewers:** [List reviewers]  
**Approval Status:** Draft / Under Review / Approved

---

**End of Document**
