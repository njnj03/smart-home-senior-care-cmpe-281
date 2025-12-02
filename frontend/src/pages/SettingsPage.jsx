import React from 'react'
import api from '../services/api'
import floorplanImg from '../assets/floorplan.jpeg'

export default function SettingsPage({ user }){
  const [profile, setProfile] = React.useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    role: user?.role || '',
    tenantId: user?.tenantId || null,
    tenantName: '',
  })
  const [loading, setLoading] = React.useState(true)
  const [saved, setSaved] = React.useState(false)
  const [saving, setSaving] = React.useState(false)
  const [error, setError] = React.useState('')

  const [house, setHouse] = React.useState(null)
  const [devices, setDevices] = React.useState([])
  const [devicesLoading, setDevicesLoading] = React.useState(false)
  const [devicesError, setDevicesError] = React.useState('')

  // location → floorplan
  const getPositionForLocation = (location) => {
    if (!location) return { top: '50%', left: '50%' }
    const loc = location.toLowerCase()

    if (loc.includes('living')) {
      // Living Room 
      return { top: '70%', left: '75%' }
    }
    if (loc.includes('kitchen')) {
      // Kitchen
      return { top: '25%', left: '75%' }
    }
    if (loc.includes('bedroom')) {
      // Bedroom
      return { top: '70%', left: '25%' }
    }
    
    return { top: '50%', left: '50%' }
  }

  const loadHouseAndDevices = async (userData) => {
    try {
      setDevicesLoading(true)
      setDevicesError('')

      const userId = userData.user_id || user?.userId
      if (!userId) return

      // find house for this user
      const housesRes = await api.houses.list({ userId })
      const houses = housesRes.houses || []
      const myHouse = houses[0] || null
      setHouse(myHouse)

      if (!myHouse) {
        setDevices([])
        return
      }

      // get devices for the house
      const houseId = myHouse.house_id || myHouse.id
      const devicesRes = await api.devices.list(houseId)
      const deviceList = devicesRes.devices || devicesRes || []
      setDevices(deviceList)
    } catch (err) {
      console.error('Error loading devices for house owner:', err)
      setDevicesError('Failed to load devices for your house.')
    } finally {
      setDevicesLoading(false)
    }
  }
  
  // Load user profile from API
  React.useEffect(() => {
    const loadProfile = async () => {
      try {
        setLoading(true)
        const userData = await api.auth.getCurrentUser()
        
        // Fetch tenant name if tenant_id exists
        let tenantName = ''
        if (userData.tenant_id) {
          try {
            const tenantData = await api.tenants.get(userData.tenant_id)
            tenantName = tenantData.tenant_name || ''
          } catch (err) {
            console.error('Error loading tenant:', err)
          }
        }
        
        setProfile({
          firstName: userData.first_name || '',
          lastName: userData.last_name || '',
          email: userData.email || '',
          role: userData.role || '',
          tenantId: userData.tenant_id || null,
          tenantName: tenantName,
        })

        if (userData.role === 'house_owner') {
          await loadHouseAndDevices(userData)
        }

        setLoading(false)
      } catch (err) {
        console.error('Error loading profile:', err)
        setError('Failed to load profile')
        setLoading(false)
      }
    }
    loadProfile()
  }, [])
  
  const getRoleDisplay = (role) => {
    const roleMap = {
      'admin': 'Administrator',
      'house_owner': 'House Owner',
      'iot_team': 'IoT Team'
    }
    return roleMap[role] || role
  }
  
  const handleSave = async () => {
    setSaving(true)
    setSaved(false)
    setError('')
    
    try {
      // Update user profile via API
      await api.auth.updateUser(user.userId, {
        first_name: profile.firstName,
        last_name: profile.lastName,
      })
      
      // Update localStorage
      const savedUser = JSON.parse(localStorage.getItem('smartHomeUser'))
      savedUser.firstName = profile.firstName
      savedUser.lastName = profile.lastName
      localStorage.setItem('smartHomeUser', JSON.stringify(savedUser))
      
      setSaving(false)
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (err) {
      console.error('Error saving settings:', err)
      setError(err.message || 'Failed to save settings')
      setSaving(false)
    }
  }

  const isHouseOwner = profile.role === 'house_owner'
  
  if (loading) return <div className="max-w-4xl mx-auto p-4">Loading...</div>
  
  return (
    <div className="max-w-4xl mx-auto p-4 space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-xl">
          {error}
        </div>
      )}
      
      <div className="card">
        <h3 className="font-bold mb-2">Profile</h3>
        <div className="grid md:grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
            <input 
              className="border rounded-xl px-3 py-2 w-full" 
              placeholder="First Name" 
              value={profile.firstName} 
              onChange={e => setProfile({...profile, firstName: e.target.value})} 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
            <input 
              className="border rounded-xl px-3 py-2 w-full" 
              placeholder="Last Name" 
              value={profile.lastName} 
              onChange={e => setProfile({...profile, lastName: e.target.value})} 
            />
          </div>
        </div>
        <div className="mt-3">
          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input 
            className="border rounded-xl px-3 py-2 w-full bg-gray-50 cursor-not-allowed" 
            value={profile.email} 
            disabled 
          />
        </div>
        <div className="mt-3">
          <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
          <input 
            className="border rounded-xl px-3 py-2 w-full bg-gray-50 cursor-not-allowed" 
            value={getRoleDisplay(profile.role)} 
            disabled 
          />
        </div>
        <div className="mt-3">
          <label className="block text-sm font-medium text-gray-700 mb-1">Tenant</label>
          <input 
            className="border rounded-xl px-3 py-2 w-full bg-gray-50 cursor-not-allowed" 
            value={profile.tenantName || `Tenant ID: ${profile.tenantId || 'N/A'}`} 
            disabled 
          />
        </div>
      </div>
      
      <div className="flex items-center gap-3">
        <button 
          onClick={handleSave} 
          disabled={saving}
          className="btn bg-blue-500 text-white px-6 py-2 rounded-xl font-medium hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
        {saved && <span className="text-green-600 text-sm font-medium">✓ Settings saved successfully!</span>}
      </div>

      {isHouseOwner && (
        <section className="mt-8">
          <h2 className="text-xl font-semibold mb-2">
            My Home Floor Plan & Devices
          </h2>
          <p className="text-sm text-gray-600 mb-4">
            This view shows your devices on the floor plan of your house. Each
            dot represents a microphone / audio sensor in a specific room.
          </p>

          {devicesLoading && (
            <p className="text-sm text-gray-500 mb-2">
              Loading your devices...
            </p>
          )}
          {devicesError && (
            <p className="text-sm text-red-600 mb-2">{devicesError}</p>
          )}

          <div className="flex flex-col md:flex-row gap-6">
            <div className="relative w-full max-w-xl border rounded-xl overflow-hidden shadow-sm bg-white">
              <img
                src={floorplanImg}
                alt="House floor plan"
                className="w-full h-auto object-contain"
              />

              {devices.map((device) => {
                const pos = getPositionForLocation(device.location)
                if (!pos) return null

                const name = device.device_name || 'Device'
                const location = device.location || 'Unknown room'
                const type =
                  device.device_type_name || device.type_name || 'Audio device'

                const sameRoomDevices = devices.filter(
                  (d) =>
                    (d.location || '').toLowerCase().trim() ===
                    (device.location || '').toLowerCase().trim()
                )

                const indexInRoom = sameRoomDevices.findIndex(
                  (d) => (d.device_id || d.id) === (device.device_id || device.id)
                )

                const countInRoom = sameRoomDevices.length
                const gap = 20 
                const offsetX = (indexInRoom - (countInRoom - 1) / 2) * gap

                return (
                  <div
                    key={device.device_id || device.id}
                    className="absolute group"
                    style={{
                      top: pos.top,
                      left: pos.left,
                      transform: `translate(${offsetX}px, -100%)`,
                    }}
                  >
                    <div className="absolute -top-13 left-1/2 -translate-x-1/2 whitespace-nowrap px-2 py-1 rounded bg-gray-900 text-white text-[10px] opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-150 shadow">
                      <div className="text-[15px] font-semibold">{name}</div>
                      <div className="text-[15px] text-gray-300">
                        {location} · {type}
                      </div>
                    </div>

                    <div className="flex flex-col items-center">
                      <div className="w-4 h-4 rounded-full bg-sky-500 border-2 border-white shadow-md" />
                    </div>
                  </div>
                )
              })}

            </div>

            <div className="flex-1 space-y-3">
              <div className="bg-white border rounded-xl p-4 shadow-sm">
                <h3 className="text-sm font-semibold mb-2">
                  House Information
                </h3>
                {house ? (
                  <ul className="text-sm text-gray-700 space-y-1">
                    <li>
                      <span className="font-medium">House ID:</span>{' '}
                      {house.house_id || house.id}
                    </li>
                    {house.house_name && (
                      <li>
                        <span className="font-medium">Name:</span>{' '}
                        {house.house_name}
                      </li>
                    )}
                    {house.address && (
                      <li>
                        <span className="font-medium">Address:</span>{' '}
                        {house.address}
                      </li>
                    )}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-500">
                    No house is associated with this account yet.
                  </p>
                )}
              </div>

              <div className="bg-white border rounded-xl p-4 shadow-sm">
                <h3 className="text-sm font-semibold mb-2">
                  Devices in Your Home
                </h3>
                {devices.length === 0 ? (
                  <p className="text-sm text-gray-500">
                    No devices registered for your house.
                  </p>
                ) : (
                  <ul className="text-sm text-gray-700 space-y-1">
                    {devices.map((d) => (
                      <li key={d.device_id || d.id} className="flex gap-2">
                        <span className="font-medium">
                          {d.device_name || `Device ${d.device_id}`}
                        </span>
                        <span className="text-gray-500">
                          · {d.location} ·{' '}
                          {d.device_type_name || d.type_name || 'audio device'}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  )
}
