
import React from 'react'
import { NavLink, Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import SignInPage from './pages/SignInPage'
import HomeOwnerDashboard from './pages/HomeOwnerDashboard'
import AlertLiveMap from './pages/AlertLiveMap'
import IoTDeviceManager from './pages/IoTDeviceManager'
import AlertHistory from './pages/AlertHistory'
import SettingsPage from './pages/SettingsPage'
import MachineLearningStatus from './pages/MachineLearningStatus'

export default function App(){
  const [user, setUser] = React.useState(null)
  const [showProfile, setShowProfile] = React.useState(false)
  
  const handleSignIn = (userData) => {
    setUser(userData)
  }
  
  const handleSignOut = () => {
    setUser(null)
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
          <NavLink to="/devices" className={({isActive})=>`px-3 py-2 rounded-xl ${isActive?'bg-primary text-white':'hover:bg-gray-100'}`}>Devices</NavLink>
          <NavLink to="/history" className={({isActive})=>`px-3 py-2 rounded-xl ${isActive?'bg-primary text-white':'hover:bg-gray-100'}`}>History</NavLink>
          <NavLink to="/ml" className={({isActive})=>`px-3 py-2 rounded-xl ${isActive?'bg-primary text-white':'hover:bg-gray-100'}`}>ML</NavLink>
          <NavLink to="/settings" className={({isActive})=>`px-3 py-2 rounded-xl ${isActive?'bg-primary text-white':'hover:bg-gray-100'}`}>Settings</NavLink>
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
                  <div className="text-xs text-gray-500">{user.role || 'Homeowner'}</div>
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
      <Route path="/devices" element={<IoTDeviceManager/>}/>
      <Route path="/history" element={<AlertHistory/>}/>
      <Route path="/settings" element={<SettingsPage/>}/>
      <Route path="/ml" element={<MachineLearningStatus/>}/>
      <Route path="*" element={<Navigate to="/" replace />}/>
    </Routes>
    <footer className="text-center text-gray-500 py-10 text-sm">Demo UI • Dummy data + simulated realtime</footer>
  </div>)
}
