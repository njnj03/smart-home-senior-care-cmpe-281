
import React from 'react'
import { MapContainer, TileLayer, Marker, Popup, CircleMarker } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import { api } from '../services/mockApi'

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
        api.getHouses(),
        api.getAlerts({ status: 'open' })
      ])
      setHouses(housesRes.data.houses || [])
      setAlerts(alertsRes.data.alerts || [])
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
    <div className="card"><h3 className="font-bold mb-2">Alert Live Map</h3>
      <MapContainer center={center} zoom={9} style={{height:'520px', width:'100%', borderRadius:'14px'}}>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        {houses.map(h=> <Marker key={h.id} position={[h.lat,h.lng]}><Popup><div className="font-semibold">{h.name}</div><div className="text-xs text-gray-500">ID {h.id}</div></Popup></Marker>)}
        {alerts.slice(0,30).map(a=>{ const house=houses.find(h=>h.id===a.houseId); if(!house) return null; return (
          <CircleMarker key={a.id} center={[house.lat,house.lng]} radius={10} pathOptions={{color: colorBySeverity(a.severity)}}>
            <Popup><div className="font-semibold">Alert {a.id}</div><div className="text-xs">Severity: {a.severity} • Status: {a.status}</div><div className="text-xs text-gray-500">{new Date(a.createdAt).toLocaleString()}</div></Popup>
          </CircleMarker>)})}
      </MapContainer>
    </div></div>)
}
