/**
 * Real API service for connecting to the FastAPI backend
 * Base URL can be configured via environment variable VITE_API_BASE_URL
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

const api = {
  /**
   * Make API requests with error handling
   */
  async request(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const defaultHeaders = {
      'Content-Type': 'application/json',
    };

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          ...defaultHeaders,
          ...options.headers,
        },
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.detail || `HTTP ${response.status}`);
      }

      // Handle 204 No Content responses (e.g., DELETE requests)
      if (response.status === 204) {
        return null;
      }

      return await response.json();
    } catch (error) {
      console.error(`API Error [${endpoint}]:`, error);
      throw error;
    }
  },

  /**
   * ALERTS API
   */
  alerts: {
    /**
     * List all alerts with optional filtering
     */
    async list(params = {}) {
      const queryParams = new URLSearchParams();
      if (params.severity) queryParams.append('severity', params.severity);
      if (params.status) queryParams.append('status', params.status);
      if (params.houseId) queryParams.append('house_id', params.houseId);
      if (params.limit) queryParams.append('limit', params.limit);
      if (params.offset) queryParams.append('offset', params.offset);

      const queryString = queryParams.toString();
      const endpoint = `/api/v1/alerts${queryString ? `?${queryString}` : ''}`;
      return api.request(endpoint);
    },

    /**
     * Get alert details by ID
     */
    async get(alertId) {
      return api.request(`/api/v1/alerts/${alertId}`);
    },

    /**
     * Acknowledge an alert
     */
    async acknowledge(alertId, notes = '') {
      return api.request(`/api/v1/alerts/${alertId}/acknowledge`, {
        method: 'POST',
        body: JSON.stringify({ notes }),
      });
    },

    /**
     * Resolve an alert
     */
    async resolve(alertId, notes = '') {
      return api.request(`/api/v1/alerts/${alertId}/resolve`, {
        method: 'POST',
        body: JSON.stringify({ notes }),
      });
    },

    /**
     * Dismiss an alert (mark as false positive)
     */
    async dismiss(alertId, notes = '') {
      return api.request(`/api/v1/alerts/${alertId}/dismiss`, {
        method: 'POST',
        body: JSON.stringify({ notes }),
      });
    },
  },

  /**
   * DEVICES API
   */
  devices: {
    /**
     * List all devices, optionally filtered by house ID
     */
    async list(houseId = null) {
      const endpoint = houseId
        ? `/api/v1/devices?house_id=${houseId}`
        : '/api/v1/devices';
      return api.request(endpoint);
    },

    /**
     * Get device details by ID
     */
    async get(deviceId) {
      return api.request(`/api/v1/devices/${deviceId}`);
    },
  },

  /**
   * HOUSES API
   */
  houses: {
    /**
     * List all houses
     */
    async list() {
      return api.request('/api/v1/houses');
    },

    /**
     * Get house details by ID
     */
    async get(houseId) {
      return api.request(`/api/v1/houses/${houseId}`);
    },
  },

  /**
   * METRICS API
   */
  metrics: {
    /**
     * Get dashboard metrics
     */
    async get() {
      return api.request('/api/v1/metrics');
    },
  },

  /**
   * ML MODELS API
   */
  models: {
    /**
     * List all ML models
     */
    async list() {
      return api.request('/api/v1/models');
    },

    /**
     * Get active model
     */
    async getActive() {
      return api.request('/api/v1/models/active');
    },

    /**
     * Get model by ID
     */
    async get(modelId) {
      return api.request(`/api/v1/models/${modelId}`);
    },

    /**
     * Create a new model record
     */
    async create(modelData) {
      return api.request('/api/v1/models', {
        method: 'POST',
        body: JSON.stringify(modelData),
      });
    },

    /**
     * Update model metadata
     */
    async update(modelId, modelData) {
      return api.request(`/api/v1/models/${modelId}`, {
        method: 'PUT',
        body: JSON.stringify(modelData),
      });
    },

    /**
     * Activate a model
     */
    async activate(modelId) {
      return api.request(`/api/v1/models/${modelId}/activate`, {
        method: 'POST',
      });
    },

    /**
     * Delete a model
     */
    async delete(modelId) {
      return api.request(`/api/v1/models/${modelId}`, {
        method: 'DELETE',
      });
    },
  },

  /**
   * INFERENCE API
   */
  inference: {
    /**
     * Run inference on an audio file
     */
    async predict(audioFile) {
      const formData = new FormData();
      formData.append('audio_file', audioFile);

      return api.request('/api/v1/predict', {
        method: 'POST',
        headers: {}, // Don't set Content-Type, let browser set it
        body: formData,
      });
    },
  },

  /**
   * INGESTION API
   */
  ingestion: {
    /**
     * Ingest an IoT event with audio file
     */
    async ingestEvent(houseId, deviceId, timestamp, audioFile) {
      const formData = new FormData();
      formData.append('house_id', houseId);
      formData.append('device_id', deviceId);
      formData.append('timestamp', timestamp);
      formData.append('audio_file', audioFile);

      return api.request('/api/v1/ingest/event', {
        method: 'POST',
        headers: {}, // Don't set Content-Type, let browser set it
        body: formData,
      });
    },
  },
};

export default api;
