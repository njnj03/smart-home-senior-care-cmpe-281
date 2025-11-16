
import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import api from '../services/api'

// Helper function to map backend model format to component format
const mapBackendModel = (backendModel) => ({
  id: backendModel.model_id,
  name: backendModel.model_name,
  version: backendModel.version,
  status: backendModel.is_active ? 'active' : 'inactive',
  accuracy: backendModel.accuracy,
  createdAt: backendModel.created_at
})

// Model Management Modal Component
function ModelManagementModal({ open, onClose, models, onUpdate }) {
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState(null)
  const [activeTab, setActiveTab] = React.useState('create') // 'create' or 'delete'
  
  // Create form state
  const [createForm, setCreateForm] = React.useState({
    model_name: '',
    file_path: '',
    version: '',
    description: '',
    model_type: '',
    accuracy: ''
  })
  
  // Delete form state
  const [deleteModelId, setDeleteModelId] = React.useState('')
  
  if (!open) return null
  
  const handleCreate = async (e) => {
    e.preventDefault()
    try {
      setLoading(true)
      setError(null)
      
      // Validate required fields
      if (!createForm.model_name.trim()) {
        throw new Error('Model name is required')
      }
      if (!createForm.file_path.trim()) {
        throw new Error('File path is required')
      }
      
      // Prepare data
      const modelData = {
        model_name: createForm.model_name.trim(),
        file_path: createForm.file_path.trim(),
        version: createForm.version.trim() || null,
        description: createForm.description.trim() || null,
        model_type: createForm.model_type.trim() || null,
        accuracy: createForm.accuracy ? parseFloat(createForm.accuracy) : null
      }
      
      // Validate accuracy if provided
      if (modelData.accuracy !== null) {
        if (isNaN(modelData.accuracy) || modelData.accuracy < 0 || modelData.accuracy > 1) {
          throw new Error('Accuracy must be a number between 0 and 1')
        }
      }
      
      await api.models.create(modelData)
      
      // Reset form
      setCreateForm({
        model_name: '',
        file_path: '',
        version: '',
        description: '',
        model_type: '',
        accuracy: ''
      })
      
      // Refresh and close
      onUpdate && onUpdate()
      onClose()
    } catch (err) {
      console.error('Error creating model:', err)
      setError(err.message || 'Failed to create model')
    } finally {
      setLoading(false)
    }
  }
  
  const handleDelete = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Check if this is the only model
      if (models.length <= 1) {
        throw new Error('Cannot delete the only remaining model. Please add another model first.')
      }
      
      if (!deleteModelId) {
        throw new Error('Please select a model to delete')
      }
      
      const modelId = parseInt(deleteModelId)
      if (isNaN(modelId)) {
        throw new Error('Invalid model ID')
      }
      
      // Check if it's the active model
      const modelToDelete = models.find(m => m.id === modelId)
      if (modelToDelete && modelToDelete.status === 'active') {
        throw new Error('Cannot delete the active model. Please activate another model first.')
      }
      
      await api.models.delete(modelId)
      
      // Reset and refresh
      setDeleteModelId('')
      onUpdate && onUpdate()
      onClose()
    } catch (err) {
      console.error('Error deleting model:', err)
      setError(err.message || 'Failed to delete model')
    } finally {
      setLoading(false)
    }
  }
  
  return (
    <AnimatePresence>
      <motion.div 
        className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50" 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div 
          className="bg-white rounded-2xl p-6 max-w-2xl w-full border border-gray-200 max-h-[90vh] overflow-y-auto"
          initial={{ y: 20, opacity: 0 }} 
          animate={{ y: 0, opacity: 1 }} 
          exit={{ y: 20, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold">Manage ML Models</h3>
            <button 
              className="text-gray-500 hover:text-gray-700 text-2xl leading-none"
              onClick={onClose}
            >
              ×
            </button>
          </div>
          
          {/* Tabs */}
          <div className="flex gap-2 mb-4 border-b">
            <button
              className={`px-4 py-2 font-medium ${activeTab === 'create' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-600'}`}
              onClick={() => {
                setActiveTab('create')
                setError(null)
              }}
            >
              Create Model
            </button>
            <button
              className={`px-4 py-2 font-medium ${activeTab === 'delete' ? 'border-b-2 border-red-500 text-red-600' : 'text-gray-600'}`}
              onClick={() => {
                setActiveTab('delete')
                setError(null)
              }}
            >
              Delete Model
            </button>
          </div>
          
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
              {error}
            </div>
          )}
          
          {/* Create Tab */}
          {activeTab === 'create' && (
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Model Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={createForm.model_name}
                  onChange={(e) => setCreateForm({ ...createForm, model_name: e.target.value })}
                  placeholder="e.g., YAMNet Human Detection v1"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  File Path <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={createForm.file_path}
                  onChange={(e) => setCreateForm({ ...createForm, file_path: e.target.value })}
                  placeholder="e.g., models/my_model.keras"
                />
                <p className="text-xs text-gray-500 mt-1">Relative path from backend root. File must exist.</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Version
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={createForm.version}
                    onChange={(e) => setCreateForm({ ...createForm, version: e.target.value })}
                    placeholder="e.g., v1.0"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Model Type
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={createForm.model_type}
                    onChange={(e) => setCreateForm({ ...createForm, model_type: e.target.value })}
                    placeholder="e.g., yamnet, custom"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Accuracy
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={createForm.accuracy}
                  onChange={(e) => setCreateForm({ ...createForm, accuracy: e.target.value })}
                  placeholder="0.00 - 1.00"
                />
                <p className="text-xs text-gray-500 mt-1">Decimal between 0 and 1 (e.g., 0.92 for 92%)</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  rows="3"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={createForm.description}
                  onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                  placeholder="Optional description of the model"
                />
              </div>
              
              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Creating...' : 'Create Model'}
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
          
          {/* Delete Tab */}
          {activeTab === 'delete' && (
            <div className="space-y-4">
              {models.length <= 1 && (
                <div className="p-3 bg-yellow-50 border border-yellow-300 rounded-lg text-yellow-800 text-sm">
                  ⚠️ Cannot delete the only remaining model. Please add another model first before deleting this one.
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Model to Delete
                </label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  value={deleteModelId}
                  onChange={(e) => setDeleteModelId(e.target.value)}
                  disabled={models.length <= 1}
                >
                  <option value="">-- Select a model --</option>
                  {models.map(model => (
                    <option key={model.id} value={model.id}>
                      ID: {model.id} - {model.name} {model.status === 'active' ? '(ACTIVE - Cannot Delete)' : ''}
                    </option>
                  ))}
                </select>
                {models.length === 0 && (
                  <p className="text-sm text-gray-500 mt-2">No models available to delete</p>
                )}
              </div>
              
              {deleteModelId && (() => {
                const selectedModel = models.find(m => m.id === parseInt(deleteModelId))
                return selectedModel ? (
                  <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                    <div className="text-sm">
                      <div><span className="font-medium">ID:</span> {selectedModel.id}</div>
                      <div><span className="font-medium">Name:</span> {selectedModel.name}</div>
                      <div><span className="font-medium">Version:</span> {selectedModel.version || 'N/A'}</div>
                      {selectedModel.status === 'active' && (
                        <div className="mt-2 p-2 bg-red-100 border border-red-300 rounded text-red-700 text-xs">
                          ⚠️ This is the active model. You cannot delete it. Please activate another model first.
                        </div>
                      )}
                    </div>
                  </div>
                ) : null
              })()}
              
              <div className="flex gap-2 pt-2">
                <button
                  onClick={handleDelete}
                  disabled={loading || !deleteModelId || models.length <= 1 || models.find(m => m.id === parseInt(deleteModelId))?.status === 'active'}
                  className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Deleting...' : 'Delete Model'}
                </button>
                <button
                  onClick={onClose}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

export default function MachineLearningStatus(){
  const [models, setModels] = React.useState([])
  const [activeModel, setActiveModel] = React.useState(null)
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState(null)
  const [showModal, setShowModal] = React.useState(false)

  const loadModels = React.useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await api.models.list()
      // Backend returns { models: [...], active_model: {...} }
      // Map backend field names to component expectations
      const mappedModels = (res.models || []).map(mapBackendModel)
      setModels(mappedModels)
      
      // Map active model if present
      const mappedActiveModel = res.active_model ? mapBackendModel(res.active_model) : null
      setActiveModel(mappedActiveModel)
      setLoading(false)
    } catch (err) {
      console.error('Error loading models:', err)
      setError(err.message)
      setLoading(false)
    }
  }, [])

  React.useEffect(()=>{ 
    loadModels()
  }, [loadModels])

  const handleActivate = async (modelId) => {
    try {
      await api.models.activate(modelId)
      // Refresh models
      await loadModels()
    } catch (err) {
      console.error('Error activating model:', err)
      setError(err.message)
    }
  }

  if(loading) return <div className="max-w-4xl mx-auto p-4">Loading…</div>
  if(error) return <div className="max-w-4xl mx-auto p-4 text-red-600">Error: {error}</div>

  return (
    <>
      <div className="max-w-4xl mx-auto p-4">
        <div className="card">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold">Machine Learning Models</h3>
            <button
              onClick={() => setShowModal(true)}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium"
            >
              Manage Models
            </button>
          </div>
          
          {activeModel && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="text-sm font-semibold text-green-900">Active Model</div>
              <div className="text-sm text-green-800">
                ID: {activeModel.id} • {activeModel.name} (v{activeModel.version})
              </div>
              {activeModel.accuracy && <div className="text-sm text-green-800">Accuracy: {(activeModel.accuracy * 100).toFixed(1)}%</div>}
            </div>
          )}
          
          <div className="space-y-2">
            {models.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No models found. Click "Manage Models" to add a new model.
              </div>
            ) : (
              models.map(m => (
                <div key={m.id} className="flex items-center justify-between border rounded-lg p-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{m.name}</span>
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">ID: {m.id}</span>
                    </div>
                    <div className="text-sm text-gray-500">v{m.version} • Created {new Date(m.createdAt).toLocaleDateString()}</div>
                    {m.accuracy && <div className="text-sm text-gray-600">Accuracy: {(m.accuracy * 100).toFixed(1)}%</div>}
                  </div>
                  <button 
                    onClick={() => handleActivate(m.id)}
                    disabled={m.status === 'active'}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      m.status === 'active'
                        ? 'bg-gray-100 text-gray-500 cursor-default' 
                        : 'bg-blue-500 text-white hover:bg-blue-600'
                    }`}
                  >
                    {m.status === 'active' ? 'Active' : 'Activate'}
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
      
      <ModelManagementModal
        open={showModal}
        onClose={() => setShowModal(false)}
        models={models}
        onUpdate={loadModels}
      />
    </>
  )
}
