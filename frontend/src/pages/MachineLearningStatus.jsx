
import React from 'react'
import api from '../services/api'
import { formatPSTDate } from '../utils/format'

export default function MachineLearningStatus(){
  const [models, setModels] = React.useState([])
  const [activeModel, setActiveModel] = React.useState(null)
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState(null)
  const [activating, setActivating] = React.useState(null)
  const [showModal, setShowModal] = React.useState(false)
  const [modalMode, setModalMode] = React.useState('add') // 'add', 'edit', or 'delete'
  const [deleteModelId, setDeleteModelId] = React.useState(null)
  const [editModelId, setEditModelId] = React.useState(null)
  const [activationMessage, setActivationMessage] = React.useState(null)
  const [activationSuccess, setActivationSuccess] = React.useState(false)
  
  // Form state for adding/editing models
  const [formData, setFormData] = React.useState({
    model_name: '',
    version: '',
    file_path: '',
    description: '',
    model_type: '',
    accuracy: ''
  })

  const loadModels = React.useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await api.models.list()
      setModels(res.models || [])
      setActiveModel(res.active_model)
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
    const previousActiveModel = activeModel
    try {
      setActivating(modelId)
      setActivationMessage(null)
      await api.models.activate(modelId)
      // Refresh models
      await loadModels()
      setActivating(null)
      setActivationSuccess(true)
      setActivationMessage('Model activated successfully!')
      setTimeout(() => {
        setActivationMessage(null)
      }, 3000)
    } catch (err) {
      console.error('Error activating model:', err)
      setActivating(null)
      setActivationSuccess(false)
      setActivationMessage(err.message || 'Failed to activate model')
      // Restore previous active model in UI
      setActiveModel(previousActiveModel)
      // Refresh to get actual state from backend
      await loadModels()
      setTimeout(() => {
        setActivationMessage(null)
      }, 3000)
    }
  }

  const handleAddModel = async (e) => {
    e.preventDefault()
    try {
      const modelData = {
        model_name: formData.model_name,
        version: formData.version || null,
        file_path: formData.file_path,
        description: formData.description || null,
        model_type: formData.model_type || null,
        accuracy: formData.accuracy ? parseFloat(formData.accuracy) : null
      }
      await api.models.create(modelData)
      setShowModal(false)
      setFormData({
        model_name: '',
        version: '',
        file_path: '',
        description: '',
        model_type: '',
        accuracy: ''
      })
      await loadModels()
    } catch (err) {
      console.error('Error creating model:', err)
      alert(err.message || 'Failed to create model')
    }
  }

  const handleEditModel = async (e) => {
    e.preventDefault()
    if (!editModelId) return
    try {
      const modelData = {
        model_name: formData.model_name,
        version: formData.version || null,
        file_path: formData.file_path,
        description: formData.description || null,
        model_type: formData.model_type || null,
        accuracy: formData.accuracy ? parseFloat(formData.accuracy) : null
      }
      await api.models.update(editModelId, modelData)
      setShowModal(false)
      setEditModelId(null)
      setFormData({
        model_name: '',
        version: '',
        file_path: '',
        description: '',
        model_type: '',
        accuracy: ''
      })
      await loadModels()
    } catch (err) {
      console.error('Error updating model:', err)
      alert(err.message || 'Failed to update model')
    }
  }

  const handleDeleteModel = async () => {
    if (!deleteModelId) return
    
    // Check if this is the only model
    if (models.length <= 1) {
      alert('Cannot delete the only model. Please add another model first.')
      return
    }

    try {
      await api.models.delete(deleteModelId)
      setShowModal(false)
      setDeleteModelId(null)
      await loadModels()
    } catch (err) {
      console.error('Error deleting model:', err)
      alert(err.message || 'Failed to delete model')
    }
  }

  const openAddModal = () => {
    setModalMode('add')
    setEditModelId(null)
    setFormData({
      model_name: '',
      version: '',
      file_path: '',
      description: '',
      model_type: '',
      accuracy: ''
    })
    setShowModal(true)
  }

  const openEditModal = (model) => {
    setModalMode('edit')
    setEditModelId(model.model_id)
    setFormData({
      model_name: model.model_name || '',
      version: model.version || '',
      file_path: model.file_path || '',
      description: model.description || '',
      model_type: model.model_type || '',
      accuracy: model.accuracy ? String(model.accuracy) : ''
    })
    setShowModal(true)
  }

  const openDeleteModal = (modelId) => {
    if (models.length <= 1) {
      alert('Cannot delete the only model. Please add another model first.')
      return
    }
    setModalMode('delete')
    setDeleteModelId(modelId)
    setShowModal(true)
  }

  if(loading) return <div className="max-w-4xl mx-auto p-4">Loading…</div>
  if(error) return <div className="max-w-4xl mx-auto p-4 text-red-600">Error: {error}</div>

  return (<div className="max-w-4xl mx-auto p-4">
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold">Machine Learning Models</h3>
        <button
          onClick={openAddModal}
          className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
        >
          + Add Model
        </button>
      </div>

      {activationMessage && (
        <div className={`mb-4 p-3 rounded-lg ${
          activationSuccess 
            ? 'bg-green-50 border border-green-200 text-green-800' 
            : 'bg-red-50 border border-red-200 text-red-800'
        }`}>
          {activationMessage}
        </div>
      )}

      {activeModel && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
          <div className="text-sm font-semibold text-green-900">Active Model</div>
          <div className="text-sm text-green-800">{activeModel.model_name} (v{activeModel.version})</div>
          {activeModel.accuracy && <div className="text-sm text-green-800">Accuracy: {(activeModel.accuracy * 100).toFixed(1)}%</div>}
        </div>
      )}
      <div className="space-y-2">
        {models.map(m => (
          <div key={m.model_id} className="flex items-center justify-between border rounded-lg p-3">
            <div className="flex-1">
              <div className="font-semibold">{m.model_name}</div>
              <div className="text-sm text-gray-500">v{m.version} • Created {formatPSTDate(m.created_at)}</div>
              {m.accuracy && <div className="text-sm text-gray-600">Accuracy: {(m.accuracy * 100).toFixed(1)}%</div>}
              {m.file_exists === false && (
                <div className="text-sm text-red-600 font-medium mt-1">⚠️ File not found at path: {m.file_path}</div>
              )}
            </div>
            <div className="flex gap-2">
              <button 
                onClick={() => handleActivate(m.model_id)}
                disabled={m.is_active || activating === m.model_id || m.file_exists === false}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  m.is_active
                    ? 'bg-gray-100 text-gray-500 cursor-default' 
                    : activating === m.model_id
                    ? 'bg-blue-400 text-white cursor-wait'
                    : m.file_exists === false
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-blue-500 text-white hover:bg-blue-600'
                }`}
              >
                {m.is_active ? 'Active' : activating === m.model_id ? 'Activating...' : 'Activate'}
              </button>
              <button
                onClick={() => openEditModal(m)}
                className="px-3 py-2 rounded-lg text-sm font-medium transition-colors bg-blue-500 text-white hover:bg-blue-600"
              >
                Edit
              </button>
              <button
                onClick={() => openDeleteModal(m.model_id)}
                disabled={models.length <= 1}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  models.length <= 1
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-red-500 text-white hover:bg-red-600'
                }`}
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>

    {/* Modal */}
    {showModal && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
          {modalMode === 'add' ? (
            <>
              <h3 className="text-xl font-bold mb-4">Add New Model</h3>
              <form onSubmit={handleAddModel}>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium mb-1">Model Name *</label>
                    <input
                      type="text"
                      required
                      value={formData.model_name}
                      onChange={(e) => setFormData({...formData, model_name: e.target.value})}
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Version</label>
                    <input
                      type="text"
                      value={formData.version}
                      onChange={(e) => setFormData({...formData, version: e.target.value})}
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">File Path *</label>
                    <input
                      type="text"
                      required
                      value={formData.file_path}
                      onChange={(e) => setFormData({...formData, file_path: e.target.value})}
                      className="w-full px-3 py-2 border rounded-lg"
                      placeholder="e.g., models/my_model.keras"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Description</label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                      className="w-full px-3 py-2 border rounded-lg"
                      rows="3"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Model Type</label>
                    <input
                      type="text"
                      value={formData.model_type}
                      onChange={(e) => setFormData({...formData, model_type: e.target.value})}
                      className="w-full px-3 py-2 border rounded-lg"
                      placeholder="e.g., yamnet, custom"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Accuracy</label>
                    <input
                      type="number"
                      step="0.0001"
                      min="0"
                      max="1"
                      value={formData.accuracy}
                      onChange={(e) => setFormData({...formData, accuracy: e.target.value})}
                      className="w-full px-3 py-2 border rounded-lg"
                      placeholder="0.0 - 1.0"
                    />
                  </div>
                </div>
                <div className="flex gap-2 mt-4">
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
                  >
                    Create
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false)
                      setFormData({
                        model_name: '',
                        version: '',
                        file_path: '',
                        description: '',
                        model_type: '',
                        accuracy: ''
                      })
                    }}
                    className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </>
          ) : modalMode === 'edit' ? (
            <>
              <h3 className="text-xl font-bold mb-4">Edit Model</h3>
              <form onSubmit={handleEditModel}>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium mb-1">Model Name *</label>
                    <input
                      type="text"
                      required
                      value={formData.model_name}
                      onChange={(e) => setFormData({...formData, model_name: e.target.value})}
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Version</label>
                    <input
                      type="text"
                      value={formData.version}
                      onChange={(e) => setFormData({...formData, version: e.target.value})}
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">File Path *</label>
                    <input
                      type="text"
                      required
                      value={formData.file_path}
                      onChange={(e) => setFormData({...formData, file_path: e.target.value})}
                      className="w-full px-3 py-2 border rounded-lg"
                      placeholder="e.g., models/my_model.keras"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Description</label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                      className="w-full px-3 py-2 border rounded-lg"
                      rows="3"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Model Type</label>
                    <input
                      type="text"
                      value={formData.model_type}
                      onChange={(e) => setFormData({...formData, model_type: e.target.value})}
                      className="w-full px-3 py-2 border rounded-lg"
                      placeholder="e.g., yamnet, custom"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Accuracy</label>
                    <input
                      type="number"
                      step="0.0001"
                      min="0"
                      max="1"
                      value={formData.accuracy}
                      onChange={(e) => setFormData({...formData, accuracy: e.target.value})}
                      className="w-full px-3 py-2 border rounded-lg"
                      placeholder="0.0 - 1.0"
                    />
                  </div>
                </div>
                <div className="flex gap-2 mt-4">
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600"
                  >
                    Update
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false)
                      setEditModelId(null)
                      setFormData({
                        model_name: '',
                        version: '',
                        file_path: '',
                        description: '',
                        model_type: '',
                        accuracy: ''
                      })
                    }}
                    className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </>
          ) : (
            <>
              <h3 className="text-xl font-bold mb-4">Delete Model</h3>
              <p className="mb-4">Are you sure you want to delete this model? This action cannot be undone.</p>
              <div className="flex gap-2">
                <button
                  onClick={handleDeleteModel}
                  className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                >
                  Delete
                </button>
                <button
                  onClick={() => {
                    setShowModal(false)
                    setDeleteModelId(null)
                  }}
                  className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    )}
  </div>)
}
