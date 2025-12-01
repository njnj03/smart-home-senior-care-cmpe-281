
import React from 'react'
import { NavLink, Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import api from './services/api'
import SignInPage from './pages/SignInPage'
import HomeOwnerDashboard from './pages/HomeOwnerDashboard'
import AlertLiveMap from './pages/AlertLiveMap'
import IoTDeviceManager from './pages/IoTDeviceManager'
import AlertHistory from './pages/AlertHistory'
import SettingsPage from './pages/SettingsPage'
import MachineLearningStatus from './pages/MachineLearningStatus'
import UsersManagement from './pages/UsersManagement'

export default function App(){
  const [user, setUser] = React.useState(() => {
    // Initialize from localStorage
    const savedUser = localStorage.getItem('smartHomeUser')
    return savedUser ? JSON.parse(savedUser) : null
  })
  const [showProfile, setShowProfile] = React.useState(false)
  
  const handleSignIn = (userData) => {
    setUser(userData)
    localStorage.setItem('smartHomeUser', JSON.stringify(userData))
  }
  
  const handleSignOut = () => {
    api.auth.logout()
    setUser(null)
    setShowProfile(false)
  }
  
  // Helper function to check if user has a specific role
  const hasRole = (...roles) => {
    if (!user) return false
    return roles.includes(user.role)
  }
  
  // Role display names
  const getRoleDisplay = (role) => {
    const roleMap = {
      'admin': 'Administrator',
      'house_owner': 'House Owner',
      'iot_team': 'IoT Team'
    }
    return roleMap[role] || role
  }
  
  if (!user) {
    return <SignInPage onSignIn={handleSignIn} />
  }
  
  return (<div>
    <nav className="sticky top-0 z-10 bg-white/80 backdrop-blur border-b border-gray-200">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="font-extrabold text-gray-900">Smart Home Cloud</div>
        <div className="flex gap-2 text-sm">
          <NavLink to="/" end className={({isActive})=>`px-3 py-2 rounded-xl ${isActive?'bg-primary text-white':'hover:bg-gray-100'}`}>Overview</NavLink>
          <NavLink to="/map" className={({isActive})=>`px-3 py-2 rounded-xl ${isActive?'bg-primary text-white':'hover:bg-gray-100'}`}>Live Map</NavLink>
          
          {/* Devices - visible to admin and iot_team */}
          {hasRole('admin', 'iot_team') && (
            <NavLink to="/devices" className={({isActive})=>`px-3 py-2 rounded-xl ${isActive?'bg-primary text-white':'hover:bg-gray-100'}`}>Devices</NavLink>
          )}
          
          <NavLink to="/history" className={({isActive})=>`px-3 py-2 rounded-xl ${isActive?'bg-primary text-white':'hover:bg-gray-100'}`}>Alerts</NavLink>
          
          {/* Users Management - visible to admin only */}
          {hasRole('admin') && (
            <NavLink to="/users" className={({isActive})=>`px-3 py-2 rounded-xl ${isActive?'bg-primary text-white':'hover:bg-gray-100'}`}>Users</NavLink>
          )}
          
          {/* ML Models - visible to admin only */}
          {hasRole('admin') && (
            <NavLink to="/ml" className={({isActive})=>`px-3 py-2 rounded-xl ${isActive?'bg-primary text-white':'hover:bg-gray-100'}`}>Models</NavLink>
          )}
          
          <NavLink to="/settings" className={({isActive})=>`px-3 py-2 rounded-xl ${isActive?'bg-primary text-white':'hover:bg-gray-100'}`}>Profile</NavLink>
          <div className="relative">
            <button 
              onClick={() => setShowProfile(!showProfile)}
              className="px-3 py-2 rounded-xl hover:bg-gray-100 flex items-center gap-2"
            >
              <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                {user.email[0].toUpperCase()}
              </div>
              <span>{user.email}</span>
            </button>
            {showProfile && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-200 p-2">
                <div className="px-3 py-2 text-sm border-b border-gray-100">
                  <div className="font-semibold">{user.email}</div>
                  <div className="text-xs text-gray-500">{getRoleDisplay(user.role)}</div>
                </div>
                <button 
                  onClick={handleSignOut}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 rounded-lg text-red-600 font-medium"
                >
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </div></div></nav>
    <Routes>
      <Route path="/" element={<HomeOwnerDashboard/>}/>
      <Route path="/map" element={<AlertLiveMap/>}/>
      
      {/* Devices - protected route for admin and iot_team */}
      {hasRole('admin', 'iot_team') ? (
        <Route path="/devices" element={<IoTDeviceManager userRole={user.role} />}/>
      ) : (
        <Route path="/devices" element={<Navigate to="/" replace />}/>
      )}
      
      <Route path="/history" element={<AlertHistory/>}/>
      <Route path="/settings" element={<SettingsPage user={user} />}/>
      
      {/* Users Management - protected route for admin only */}
      {hasRole('admin') ? (
        <Route path="/users" element={<UsersManagement/>}/>
      ) : (
        <Route path="/users" element={<Navigate to="/" replace />}/>
      )}
      
      {/* ML Models - protected route for admin only */}
      {hasRole('admin') ? (
        <Route path="/ml" element={<MachineLearningStatus/>}/>
      ) : (
        <Route path="/ml" element={<Navigate to="/" replace />}/>
      )}
      
      <Route path="*" element={<Navigate to="/" replace />}/>
    </Routes>
  </div>)
}
