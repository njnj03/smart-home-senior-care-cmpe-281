
import React from 'react'
import api from '../services/api'
import { chipByStatus, formatPST } from '../utils/format'

export default function IoTDeviceManager(){
  const [list,setList]=React.useState([])
  const [houses,setHouses]=React.useState([])
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
  const [showAddHouse, setShowAddHouse] = React.useState(false)
  const [newHouse, setNewHouse] = React.useState({
    name: '',
    address: '',
    city: '',
    state: '',
    zipCode: ''
  })

  const loadDevices = async () => {
    try {
      setLoading(true)
      setError(null)
      const [devicesRes, housesRes] = await Promise.all([
        api.devices.list(),
        api.houses.list()
      ])
      setList(devicesRes.devices || [])
      setHouses(housesRes.houses || [])
      setLoading(false)
    } catch (err) {
      console.error('Error loading devices:', err)
      setError(err.message)
      setLoading(false)
    }
  }

  React.useEffect(()=>{ loadDevices() },[])

  const handleAddHouse = async () => {
    if (!newHouse.name || !newHouse.address) {
      alert('Please fill in required fields (Name and Address)')
      return
    }
    
    try {
      const result = await api.houses.create({
        house_name: newHouse.name,
        address: newHouse.address,
        city: newHouse.city || 'Unknown',
        state: newHouse.state || 'CA',
        zip_code: newHouse.zipCode || '00000'
      })
      
      await loadDevices() // Reload to get the new house
      setNewDevice({...newDevice, houseId: result.house.house_id})
      setShowAddHouse(false)
      setNewHouse({ name: '', address: '', city: '', state: '', zipCode: '' })
      alert('House added successfully!')
    } catch (err) {
      alert('Error adding house: ' + err.message)
    }
  }

  const handleAddDevice = async () => {
    if (!newDevice.name || !newDevice.houseId) {
      alert('Please fill in required fields (Name and House ID)')
      return
    }
    
    try {
      // TODO: Backend needs POST /devices endpoint
      // For now, show message that this feature needs backend implementation
      alert('Add device functionality requires backend POST /devices endpoint to be implemented')
      
      // When backend is ready, uncomment:
      // await api.devices.create({
      //   device_name: newDevice.name,
      //   house_id: newDevice.houseId,
      //   location: newDevice.room || 'Unknown',
      //   device_type_id: 1, // Default type
      //   status: newDevice.status
      // })
      // await loadDevices()
      
      setShowAddDialog(false)
      setNewDevice({ name: '', houseId: '', room: '', macAddress: '', deviceType: 'sensor', status: 'offline' })
    } catch (err) {
      alert('Error adding device: ' + err.message)
    }
  }

  const handleDeleteSelected = async () => {
    if (selectedDevices.size === 0) {
      alert('Please select devices to delete')
      return
    }
    
    if (!confirm(`Delete ${selectedDevices.size} device(s)?`)) return
    
    try {
      // TODO: Backend needs DELETE /devices/{id} endpoint
      alert('Delete device functionality requires backend DELETE /devices/{id} endpoint to be implemented')
      
      // When backend is ready, uncomment:
      // await Promise.all(
      //   Array.from(selectedDevices).map(id => api.devices.delete(id))
      // )
      // await loadDevices()
      
      setSelectedDevices(new Set())
    } catch (err) {
      alert('Error deleting devices: ' + err.message)
    }
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
                    setSelectedDevices(new Set(list.map(d => d.device_id)))
                  } else {
                    setSelectedDevices(new Set())
                  }
                }}
              />
            </th>
            <th>House</th><th>Name</th><th>Location</th><th>Status</th><th>Last Heartbeat</th>
          </tr>
        </thead>
        <tbody>
          {list.map(d=>{ const house=houses.find(h=>h.house_id===d.house_id); return (
            <tr key={d.device_id}>
              <td>
                <input 
                  type="checkbox"
                  checked={selectedDevices.has(d.device_id)}
                  onChange={() => toggleSelection(d.device_id)}
                />
              </td>
              <td>{house?.house_name || d.house_id}</td>
              <td>{d.device_name}</td>
              <td>{d.location}</td>
              <td><span className={`chip ${chipByStatus(d.status)}`}>{d.status}</span></td>
              <td>{formatPST(d.last_heartbeat) || 'Never'}</td>
            </tr>
          )})}
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
              <div className="flex gap-2 mt-1">
                <select
                  className="flex-1 border rounded-xl px-3 py-2"
                  value={newDevice.houseId}
                  onChange={(e) => setNewDevice({...newDevice, houseId: e.target.value})}
                >
                  <option value="">Select House</option>
                  {houses.map(h => <option key={h.house_id} value={h.house_id}>{h.house_name}</option>)}
                </select>
                <button
                  type="button"
                  onClick={() => setShowAddHouse(true)}
                  className="btn bg-green-500 text-white px-4 py-2 rounded-xl hover:bg-green-600 whitespace-nowrap"
                >
                  + New House
                </button>
              </div>
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

    {showAddHouse && (
      <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50" onClick={() => setShowAddHouse(false)}>
        <div className="bg-white rounded-2xl p-6 max-w-md w-full" onClick={(e) => e.stopPropagation()}>
          <h3 className="text-xl font-bold mb-4">Add New House</h3>
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium text-gray-700">House Name *</label>
              <input 
                type="text"
                className="w-full border rounded-xl px-3 py-2 mt-1"
                value={newHouse.name}
                onChange={(e) => setNewHouse({...newHouse, name: e.target.value})}
                placeholder="Smith Residence"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Address *</label>
              <input 
                type="text"
                className="w-full border rounded-xl px-3 py-2 mt-1"
                value={newHouse.address}
                onChange={(e) => setNewHouse({...newHouse, address: e.target.value})}
                placeholder="123 Main St"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">City</label>
              <input 
                type="text"
                className="w-full border rounded-xl px-3 py-2 mt-1"
                value={newHouse.city}
                onChange={(e) => setNewHouse({...newHouse, city: e.target.value})}
                placeholder="San Jose"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">State</label>
              <input 
                type="text"
                className="w-full border rounded-xl px-3 py-2 mt-1"
                value={newHouse.state}
                onChange={(e) => setNewHouse({...newHouse, state: e.target.value})}
                placeholder="CA"
                maxLength={2}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">ZIP Code</label>
              <input 
                type="text"
                className="w-full border rounded-xl px-3 py-2 mt-1"
                value={newHouse.zipCode}
                onChange={(e) => setNewHouse({...newHouse, zipCode: e.target.value})}
                placeholder="95112"
                maxLength={10}
              />
            </div>
          </div>
          <div className="flex gap-2 mt-6">
            <button 
              onClick={handleAddHouse}
              className="flex-1 btn bg-green-500 text-white py-2 rounded-xl hover:bg-green-600"
            >
              Add House
            </button>
            <button 
              onClick={() => setShowAddHouse(false)}
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
