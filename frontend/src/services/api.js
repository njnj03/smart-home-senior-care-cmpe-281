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
    
    // Get auth token from localStorage
    const token = localStorage.getItem('authToken');
    
    // Check if body is FormData - if so, don't set Content-Type (browser will set it with boundary)
    const isFormData = options.body instanceof FormData;
    
    const defaultHeaders = {
      ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
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
   * AUTHENTICATION API
   */
  auth: {
    /**
     * Login user and get JWT token
     */
    async login(email, password) {
      const response = await api.request('/api/v1/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      
      // Store token in localStorage
      if (response.access_token) {
        localStorage.setItem('authToken', response.access_token);
      }
      
      return response;
    },

    /**
     * Register a new user
     */
    async register(userData) {
      return api.request('/api/v1/auth/register', {
        method: 'POST',
        body: JSON.stringify(userData),
      });
    },

    /**
     * Get current authenticated user's information
     */
    async getCurrentUser() {
      return api.request('/api/v1/auth/me');
    },

    /**
     * List all users (Admin only)
     */
    async listUsers() {
      return api.request('/api/v1/auth/users');
    },

    /**
     * Create a new user (Admin only)
     */
    async createUser(userData) {
      return api.request('/api/v1/auth/users', {
        method: 'POST',
        body: JSON.stringify(userData),
      });
    },

    /**
     * Update user (Admin only)
     */
    async updateUser(userId, userData) {
      return api.request(`/api/v1/auth/users/${userId}`, {
        method: 'PUT',
        body: JSON.stringify(userData),
      });
    },

    /**
     * Logout user (clear tokens)
     */
    logout() {
      localStorage.removeItem('authToken');
      localStorage.removeItem('smartHomeUser');
    },
  },

  /**
   * TENANTS API
   */
  tenants: {
    /**
     * List all active tenants (Public endpoint for registration)
     */
    async listPublic() {
      return api.request('/api/v1/tenants/public');
    },

    /**
     * List all tenants (Admin only)
     */
    async list() {
      return api.request('/api/v1/tenants');
    },

    /**
     * Get tenant by ID (Admin only)
     */
    async get(tenantId) {
      return api.request(`/api/v1/tenants/${tenantId}`);
    },

    /**
     * Create a new tenant (Admin only)
     */
    async create(tenantData) {
      return api.request('/api/v1/tenants', {
        method: 'POST',
        body: JSON.stringify(tenantData),
      });
    },

    /**
     * Update tenant (Admin only)
     */
    async update(tenantId, tenantData) {
      return api.request(`/api/v1/tenants/${tenantId}`, {
        method: 'PUT',
        body: JSON.stringify(tenantData),
      });
    },

    /**
     * Delete tenant (Admin only)
     */
    async delete(tenantId) {
      return api.request(`/api/v1/tenants/${tenantId}`, {
        method: 'DELETE',
      });
    },
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

    /**
     * Create a new device
     */
    async create(deviceData) {
      return api.request('/api/v1/devices', {
        method: 'POST',
        body: JSON.stringify(deviceData),
      });
    },

    /**
     * Update device details
     */
    async update(deviceId, deviceData) {
      return api.request(`/api/v1/devices/${deviceId}`, {
        method: 'PUT',
        body: JSON.stringify(deviceData),
      });
    },

    /**
     * Delete a device
     */
    async delete(deviceId) {
      return api.request(`/api/v1/devices/${deviceId}`, {
        method: 'DELETE',
      });
    },
  },

  /**
   * HOUSES API
   */
  houses: {
    /**
     * List all houses
     */
    async list(params = {}) {
      const queryParams = new URLSearchParams();
      if (params.userId)   queryParams.append('user_id', params.userId);
      if (params.tenantId) queryParams.append('tenant_id', params.tenantId);

      const queryString = queryParams.toString();
      const endpoint = `/api/v1/houses${queryString ? `?${queryString}` : ''}`;
      return api.request(endpoint);
    },

    /**
     * Get house details by ID
     */
    async get(houseId) {
      return api.request(`/api/v1/houses/${houseId}`);
    },

    /**
     * Create a new house
     */
    async create(houseData) {
      return api.request('/api/v1/houses', {
        method: 'POST',
        body: JSON.stringify(houseData),
      });
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
     * Create a new model record with file upload
     */
    async create(modelFile, modelData) {
      const formData = new FormData();
      formData.append('model_file', modelFile);
      formData.append('model_name', modelData.model_name);
      if (modelData.version) formData.append('version', modelData.version);
      if (modelData.description) formData.append('description', modelData.description);
      if (modelData.model_type) formData.append('model_type', modelData.model_type);
      if (modelData.accuracy !== null && modelData.accuracy !== undefined) {
        formData.append('accuracy', modelData.accuracy.toString());
      }
      
      return api.request('/api/v1/models', {
        method: 'POST',
        body: formData,
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
