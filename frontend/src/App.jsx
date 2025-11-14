
import React from 'react'
import { NavLink, Routes, Route } from 'react-router-dom'
import SignInPage from './pages/SignInPage'
import HomeOwnerDashboard from './pages/HomeOwnerDashboard'
import AlertLiveMap from './pages/AlertLiveMap'
import IoTDeviceManager from './pages/IoTDeviceManager'
import AlertHistory from './pages/AlertHistory'
import SettingsPage from './pages/SettingsPage'
import MachineLearningStatus from './pages/MachineLearningStatus'
export default function App(){
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
          <NavLink to="/signin" className={({isActive})=>`px-3 py-2 rounded-xl ${isActive?'bg-primary text-white':'hover:bg-gray-100'}`}>Sign In</NavLink>
        </div></div></nav>
    <Routes>
      <Route path="/" element={<HomeOwnerDashboard/>}/>
      <Route path="/map" element={<AlertLiveMap/>}/>
      <Route path="/devices" element={<IoTDeviceManager/>}/>
      <Route path="/history" element={<AlertHistory/>}/>
      <Route path="/settings" element={<SettingsPage/>}/>
      <Route path="/ml" element={<MachineLearningStatus/>}/>
      <Route path="/signin" element={<SignInPage/>}/>
    </Routes>
    <footer className="text-center text-gray-500 py-10 text-sm">Demo UI • Dummy data + simulated realtime</footer>
  </div>)
}
