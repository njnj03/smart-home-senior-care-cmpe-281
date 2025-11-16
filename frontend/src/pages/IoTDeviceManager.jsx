
import React from 'react'
import { api, db } from '../services/mockApi'
import { chipByStatus } from '../utils/format'

export default function IoTDeviceManager(){
  const [list,setList]=React.useState([])
  const [loading,setLoading]=React.useState(true)
  const [error,setError]=React.useState(null)
  const [showAddDialog, setShowAddDialog] = React.useState(false)
  const [selectedDevices, setSelectedDevices] = React.useState(new Set())
  const [newDevice, setNewDevice] = React.useState({
    name: '',
    houseId: '',
    room: '',
    macAddress: '',
    deviceType: 'sensor',
    status: 'offline'
  })

  const loadDevices = async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await api.getDevices()
      setList(res.data.devices || [])
      setLoading(false)
    } catch (err) {
      console.error('Error loading devices:', err)
      setError(err.message)
      setLoading(false)
    }
  }

  React.useEffect(()=>{ loadDevices() },[])

  const handleAddDevice = async () => {
    if (!newDevice.name || !newDevice.houseId) {
      alert('Please fill in required fields (Name and House ID)')
      return
    }
    
    const device = {
      id: 'dev-' + Math.floor(Math.random() * 10000),
      name: newDevice.name,
      houseId: newDevice.houseId,
      room: newDevice.room || 'Unknown',
      macAddress: newDevice.macAddress || null,
      deviceType: newDevice.deviceType,
      status: newDevice.status,
      lastHeartbeat: 0,
      errorRate: 0
    }
    
    db.devices.push(device)
    await loadDevices()
    setShowAddDialog(false)
    setNewDevice({ name: '', houseId: '', room: '', macAddress: '', deviceType: 'sensor', status: 'offline' })
  }

  const handleDeleteSelected = async () => {
    if (selectedDevices.size === 0) {
      alert('Please select devices to delete')
      return
    }
    
    if (!confirm(`Delete ${selectedDevices.size} device(s)?`)) return
    
    // Remove from db
    db.devices = db.devices.filter(d => !selectedDevices.has(d.id))
    await loadDevices()
    setSelectedDevices(new Set())
  }

  const toggleSelection = (id) => {
    const newSet = new Set(selectedDevices)
    if (newSet.has(id)) {
      newSet.delete(id)
    } else {
      newSet.add(id)
    }
    setSelectedDevices(newSet)
  }

  if(loading) return <div className="max-w-6xl mx-auto p-4">Loading…</div>
  if(error) return <div className="max-w-6xl mx-auto p-4 text-red-600">Error: {error}</div>

  return (<div className="max-w-6xl mx-auto p-4">
    <div className="card">
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-bold">IoT Device Management</h3>
        <div className="flex gap-2">
          <button 
            onClick={() => setShowAddDialog(true)}
            className="btn bg-blue-500 text-white px-4 py-2 rounded-xl hover:bg-blue-600"
          >
            + Add Device
          </button>
          <button 
            onClick={handleDeleteSelected}
            disabled={selectedDevices.size === 0}
            className="btn bg-red-500 text-white px-4 py-2 rounded-xl hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Delete Selected ({selectedDevices.size})
          </button>
        </div>
      </div>
      <table className="table mt-2">
        <thead>
          <tr>
            <th className="w-12">
              <input 
                type="checkbox"
                checked={selectedDevices.size === list.length && list.length > 0}
                onChange={(e) => {
                  if (e.target.checked) {
                    setSelectedDevices(new Set(list.map(d => d.id)))
                  } else {
                    setSelectedDevices(new Set())
                  }
                }}
              />
            </th>
            <th>ID</th><th>House</th><th>Name</th><th>Room</th><th>Status</th><th>Last Heartbeat</th>
          </tr>
        </thead>
        <tbody>
          {list.map(d=>(
            <tr key={d.id}>
              <td>
                <input 
                  type="checkbox"
                  checked={selectedDevices.has(d.id)}
                  onChange={() => toggleSelection(d.id)}
                />
              </td>
              <td>{d.id}</td>
              <td>{d.houseId}</td>
              <td>{d.name}</td>
              <td>{d.room}</td>
              <td><span className={`chip ${chipByStatus(d.status)}`}>{d.status}</span></td>
              <td>{d.lastHeartbeat}s ago</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>

    {showAddDialog && (
      <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50" onClick={() => setShowAddDialog(false)}>
        <div className="bg-white rounded-2xl p-6 max-w-md w-full" onClick={(e) => e.stopPropagation()}>
          <h3 className="text-xl font-bold mb-4">Add New Device</h3>
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium text-gray-700">Device Name *</label>
              <input 
                type="text"
                className="w-full border rounded-xl px-3 py-2 mt-1"
                value={newDevice.name}
                onChange={(e) => setNewDevice({...newDevice, name: e.target.value})}
                placeholder="Living Room Mic"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">House ID *</label>
              <select
                className="w-full border rounded-xl px-3 py-2 mt-1"
                value={newDevice.houseId}
                onChange={(e) => setNewDevice({...newDevice, houseId: e.target.value})}
              >
                <option value="">Select House</option>
                {db.houses.map(h => <option key={h.id} value={h.id}>{h.name} ({h.id})</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Room/Location</label>
              <input 
                type="text"
                className="w-full border rounded-xl px-3 py-2 mt-1"
                value={newDevice.room}
                onChange={(e) => setNewDevice({...newDevice, room: e.target.value})}
                placeholder="Living Room"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">MAC Address</label>
              <input 
                type="text"
                className="w-full border rounded-xl px-3 py-2 mt-1"
                value={newDevice.macAddress}
                onChange={(e) => setNewDevice({...newDevice, macAddress: e.target.value})}
                placeholder="AA:BB:CC:DD:EE:FF"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Device Type</label>
              <select
                className="w-full border rounded-xl px-3 py-2 mt-1"
                value={newDevice.deviceType}
                onChange={(e) => setNewDevice({...newDevice, deviceType: e.target.value})}
              >
                <option value="sensor">Sensor</option>
                <option value="camera">Camera</option>
                <option value="microphone">Microphone</option>
                <option value="speaker">Speaker</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Initial Status</label>
              <select
                className="w-full border rounded-xl px-3 py-2 mt-1"
                value={newDevice.status}
                onChange={(e) => setNewDevice({...newDevice, status: e.target.value})}
              >
                <option value="offline">Offline</option>
                <option value="online">Online</option>
                <option value="degraded">Degraded</option>
              </select>
            </div>
          </div>
          <div className="flex gap-2 mt-6">
            <button 
              onClick={handleAddDevice}
              className="flex-1 btn bg-blue-500 text-white py-2 rounded-xl hover:bg-blue-600"
            >
              Add Device
            </button>
            <button 
              onClick={() => setShowAddDialog(false)}
              className="flex-1 btn bg-gray-200 py-2 rounded-xl hover:bg-gray-300"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    )}
  </div>)
}
