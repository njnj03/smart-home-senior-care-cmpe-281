
import React from 'react'
import api from '../services/api'

export default function SettingsPage({ user }){
  const [profile, setProfile] = React.useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    role: user?.role || '',
  })
  const [loading, setLoading] = React.useState(true)
  const [saved, setSaved] = React.useState(false)
  const [saving, setSaving] = React.useState(false)
  const [error, setError] = React.useState('')
  
  // Load user profile from API
  React.useEffect(() => {
    const loadProfile = async () => {
      try {
        setLoading(true)
        const userData = await api.auth.getCurrentUser()
        setProfile({
          firstName: userData.first_name || '',
          lastName: userData.last_name || '',
          email: userData.email || '',
          role: userData.role || '',
        })
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
  
  if (loading) return <div className="max-w-4xl mx-auto p-4">Loading...</div>
  
  return (<div className="max-w-4xl mx-auto p-4 space-y-4">
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
  </div>)
}
