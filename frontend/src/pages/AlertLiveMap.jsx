
import React from 'react'
import { MapContainer, TileLayer, Marker, Popup, CircleMarker } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import api from '../services/api'
import { formatPST } from '../utils/format'

export default function AlertLiveMap(){
  const [houses,setHouses]=React.useState([])
  const [alerts,setAlerts]=React.useState([])
  const [loading,setLoading]=React.useState(true)
  const [error,setError]=React.useState(null)

  const load=async()=>{
    try {
      setLoading(true)
      setError(null)
      
      const [housesRes, alertsRes] = await Promise.all([
        api.houses.list(),
        api.alerts.list({ status: 'active', limit: 100 })
      ])
      
      setHouses(housesRes.houses || [])
      setAlerts(alertsRes.alerts || [])
      setLoading(false)
    } catch (err) {
      console.error('Error loading map data:', err)
      setError(err.message)
      setLoading(false)
    }
  }

  React.useEffect(()=>{ load() },[])

  if(loading) return <div className="max-w-6xl mx-auto p-4">Loading…</div>
  if(error) return <div className="max-w-6xl mx-auto p-4 text-red-600">Error: {error}</div>

  const center=[37.6,-122.1]
  const colorBySeverity=(s)=> s==='high'?'red': s==='medium'?'orange':'green'
  
  return (<div className="max-w-6xl mx-auto p-4">
    <div className="card"><h3 className="font-bold mb-2">Smart Home Cloud Dashboard</h3>
      <MapContainer center={center} zoom={9} scrollWheelZoom={true} style={{height:'520px', width:'100%', borderRadius:'14px'}}>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        {houses.map(h=> h.latitude && h.longitude ? <Marker key={h.house_id} position={[h.latitude,h.longitude]}><Popup><div className="font-semibold">{h.house_name}</div><div className="text-xs text-gray-500">ID {h.house_id}</div></Popup></Marker> : null)}
        {alerts.slice(0,30).map(a=>{ const house=houses.find(h=>h.house_id===a.house_id); if(!house || !house.latitude || !house.longitude) return null; return (
          <CircleMarker key={a.alert_id} center={[house.latitude,house.longitude]} radius={10} pathOptions={{color: colorBySeverity(a.severity)}}>
            <Popup><div className="font-semibold">Alert {a.alert_id}</div><div className="text-xs">Severity: {a.severity} • Status: {a.status}</div><div className="text-xs text-gray-500">{formatPST(a.created_at)}</div></Popup>
          </CircleMarker>)})}
      </MapContainer>
    </div></div>)
}
