
import React from 'react'
import api from '../services/api'
import { chipByStatus, formatPST } from '../utils/format'

export default function IoTDeviceManager({ userRole }){
  const [list,setList]=React.useState([])
  const [houses,setHouses]=React.useState([])
  const [tenants,setTenants]=React.useState([])
  const [loading,setLoading]=React.useState(true)
  const [error,setError]=React.useState(null)
  const [showAddDialog, setShowAddDialog] = React.useState(false)
  const [showCreateHouseDialog, setShowCreateHouseDialog] = React.useState(false)
  const [selectedDevices, setSelectedDevices] = React.useState(new Set())
  const [newDevice, setNewDevice] = React.useState({
    name: '',
    houseId: '',
    room: '',
    macAddress: '',
    deviceType: 'sensor',
    status: 'offline'
  })
  const [newHouse, setNewHouse] = React.useState({
    house_name: '',
    tenant_id: null,
    address: '',
    city: '',
    state: '',
    zip_code: '',
    latitude: '',
    longitude: ''
  })
  const [houseFormError, setHouseFormError] = React.useState('')

  // Check if user can manage devices (admin or iot_team)
  const canManageDevices = userRole === 'admin' || userRole === 'iot_team'
  // Check if user is admin (for house creation)
  const isAdmin = userRole === 'admin'

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

  const loadTenants = async () => {
    try {
      const res = await api.tenants.list()
      setTenants(res.tenants || [])
      // Set default tenant_id to first tenant if available
      if (res.tenants && res.tenants.length > 0 && !newHouse.tenant_id) {
        setNewHouse(prev => ({ ...prev, tenant_id: res.tenants[0].tenant_id }))
      }
    } catch (err) {
      console.error('Error loading tenants:', err)
    }
  }

  React.useEffect(()=>{ 
    loadDevices()
    if (isAdmin) {
      loadTenants()
    }
  },[])

  const handleAddDevice = async () => {
    if (!newDevice.name || !newDevice.houseId) {
      alert('Please fill in required fields (Name and House)')
      return
    }
    
    try {
      await api.devices.create({
        house_id: parseInt(newDevice.houseId),
        device_type_id: 1, // Default device type - you can make this dynamic
        device_name: newDevice.name,
        location: newDevice.room || 'Unknown',
        mac_address: newDevice.macAddress || null,
        firmware_version: null,
        status: newDevice.status,
        is_enabled: true
      })
      
      await loadDevices()
      setShowAddDialog(false)
      setNewDevice({ name: '', houseId: '', room: '', macAddress: '', deviceType: 'sensor', status: 'offline' })
      alert('Device added successfully!')
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
      await Promise.all(
        Array.from(selectedDevices).map(id => api.devices.delete(id))
      )
      await loadDevices()
      setSelectedDevices(new Set())
      alert('Devices deleted successfully!')
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

  const handleCreateHouse = async () => {
    if (!newHouse.house_name || !newHouse.tenant_id) {
      setHouseFormError('Please fill in required fields (House Name and Tenant)')
      return
    }

    setHouseFormError('')
    try {
      const houseData = {
        tenant_id: parseInt(newHouse.tenant_id),
        house_name: newHouse.house_name,
        address: newHouse.address || null,
        city: newHouse.city || null,
        state: newHouse.state || null,
        zip_code: newHouse.zip_code || null,
        latitude: newHouse.latitude ? parseFloat(newHouse.latitude) : null,
        longitude: newHouse.longitude ? parseFloat(newHouse.longitude) : null,
        is_active: true
      }

      const createdHouse = await api.houses.create(houseData)
      
      // Refresh houses list
      const housesRes = await api.houses.list()
      setHouses(housesRes.houses || [])
      
      // Auto-select the newly created house in the device form
      setNewDevice(prev => ({ ...prev, houseId: createdHouse.house_id.toString() }))
      
      // Close the create house modal
      setShowCreateHouseDialog(false)
      
      // Reset house form
      setNewHouse({
        house_name: '',
        tenant_id: tenants.length > 0 ? tenants[0].tenant_id : null,
        address: '',
        city: '',
        state: '',
        zip_code: '',
        latitude: '',
        longitude: ''
      })
    } catch (err) {
      console.error('Error creating house:', err)
      setHouseFormError(err.message || 'Failed to create house')
    }
  }

  if(loading) return <div className="max-w-6xl mx-auto p-4">Loading…</div>
  if(error) return <div className="max-w-6xl mx-auto p-4 text-red-600">Error: {error}</div>

  return (<div className="max-w-6xl mx-auto p-4">
    <div className="card">
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-bold">IoT Device Management</h3>
        {canManageDevices && (
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
        )}
      </div>
      <table className="table mt-2">
        <thead>
          <tr>
            {canManageDevices && (
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
            )}
            <th>House</th><th>Name</th><th>Location</th><th>Status</th><th>Last Heartbeat</th>
          </tr>
        </thead>
        <tbody>
          {list.map(d=>{ const house=houses.find(h=>h.house_id===d.house_id); return (
            <tr key={d.device_id}>
              {canManageDevices && (
                <td>
                  <input 
                    type="checkbox"
                    checked={selectedDevices.has(d.device_id)}
                    onChange={() => toggleSelection(d.device_id)}
                  />
                </td>
              )}
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
              <div className="flex items-center justify-between mb-1">
                <label className="text-sm font-medium text-gray-700">House *</label>
                {isAdmin && (
                  <button
                    type="button"
                    onClick={() => {
                      loadTenants()
                      setShowCreateHouseDialog(true)
                    }}
                    className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                  >
                    + Create New House
                  </button>
                )}
              </div>
              <select
                className="w-full border rounded-xl px-3 py-2 mt-1"
                value={newDevice.houseId}
                onChange={(e) => setNewDevice({...newDevice, houseId: e.target.value})}
              >
                <option value="">Select House</option>
                {houses.map(h => <option key={h.house_id} value={h.house_id}>{h.house_name}</option>)}
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

    {/* Create House Modal */}
    {showCreateHouseDialog && (
      <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50" onClick={() => setShowCreateHouseDialog(false)}>
        <div className="bg-white rounded-2xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
          <h3 className="text-xl font-bold mb-4">Create New House</h3>
          
          {houseFormError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
              {houseFormError}
            </div>
          )}

          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium text-gray-700">House Name *</label>
              <input 
                type="text"
                required
                className="w-full border rounded-xl px-3 py-2 mt-1"
                value={newHouse.house_name}
                onChange={(e) => setNewHouse({...newHouse, house_name: e.target.value})}
                placeholder="123 Main Street"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">Tenant *</label>
              <select
                required
                className="w-full border rounded-xl px-3 py-2 mt-1"
                value={newHouse.tenant_id || ''}
                onChange={(e) => setNewHouse({...newHouse, tenant_id: parseInt(e.target.value)})}
              >
                <option value="">Select Tenant</option>
                {tenants.map(t => (
                  <option key={t.tenant_id} value={t.tenant_id}>{t.tenant_name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">Address</label>
              <input 
                type="text"
                className="w-full border rounded-xl px-3 py-2 mt-1"
                value={newHouse.address}
                onChange={(e) => setNewHouse({...newHouse, address: e.target.value})}
                placeholder="123 Main Street"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
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
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">Zip Code</label>
              <input 
                type="text"
                className="w-full border rounded-xl px-3 py-2 mt-1"
                value={newHouse.zip_code}
                onChange={(e) => setNewHouse({...newHouse, zip_code: e.target.value})}
                placeholder="95112"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium text-gray-700">Latitude</label>
                <input 
                  type="number"
                  step="any"
                  className="w-full border rounded-xl px-3 py-2 mt-1"
                  value={newHouse.latitude}
                  onChange={(e) => setNewHouse({...newHouse, latitude: e.target.value})}
                  placeholder="37.3382"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Longitude</label>
                <input 
                  type="number"
                  step="any"
                  className="w-full border rounded-xl px-3 py-2 mt-1"
                  value={newHouse.longitude}
                  onChange={(e) => setNewHouse({...newHouse, longitude: e.target.value})}
                  placeholder="-121.8863"
                />
              </div>
            </div>
          </div>

          <div className="flex gap-2 mt-6">
            <button 
              onClick={handleCreateHouse}
              className="flex-1 btn bg-blue-500 text-white py-2 rounded-xl hover:bg-blue-600"
            >
              Create House
            </button>
            <button 
              onClick={() => {
                setShowCreateHouseDialog(false)
                setHouseFormError('')
              }}
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
