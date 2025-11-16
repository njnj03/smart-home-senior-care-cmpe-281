
import React from 'react'
import api from '../services/api'

export default function MachineLearningStatus(){
  const [models, setModels] = React.useState([])
  const [activeModel, setActiveModel] = React.useState(null)
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState(null)

  React.useEffect(()=>{ 
    (async()=>{
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
    })() 
  },[])

  const handleActivate = async (modelId) => {
    try {
      await api.models.activate(modelId)
      // Refresh models
      const res = await api.models.list()
      setModels(res.models || [])
      setActiveModel(res.active_model)
    } catch (err) {
      console.error('Error activating model:', err)
      setError(err.message)
    }
  }

  if(loading) return <div className="max-w-4xl mx-auto p-4">Loading…</div>
  if(error) return <div className="max-w-4xl mx-auto p-4 text-red-600">Error: {error}</div>

  return (<div className="max-w-4xl mx-auto p-4">
    <div className="card">
      <h3 className="font-bold mb-4">Machine Learning Models</h3>
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
            <div>
              <div className="font-semibold">{m.model_name}</div>
              <div className="text-sm text-gray-500">v{m.version} • Created {new Date(m.created_at).toLocaleDateString('en-US', {timeZone: 'America/Los_Angeles'})}</div>
              {m.accuracy && <div className="text-sm text-gray-600">Accuracy: {(m.accuracy * 100).toFixed(1)}%</div>}
            </div>
            <button 
              onClick={() => handleActivate(m.model_id)}
              disabled={m.is_active}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                m.is_active
                  ? 'bg-gray-100 text-gray-500 cursor-default' 
                  : 'bg-blue-500 text-white hover:bg-blue-600'
              }`}
            >
              {m.is_active ? 'Active' : 'Activate'}
            </button>
          </div>
        ))}
      </div>
    </div>
  </div>)
}
