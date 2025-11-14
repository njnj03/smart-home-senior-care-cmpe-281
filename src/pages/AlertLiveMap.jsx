
import React from 'react'
import { MapContainer, TileLayer, Marker, Popup, CircleMarker } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import { api, ws } from '../services/mockApi'
export default function AlertLiveMap(){
  const [houses,setHouses]=React.useState([]); const [alerts,setAlerts]=React.useState([])
  const load=async()=>{ const h=await api.getHouses(); const a=await api.getAlerts(); setHouses(h.data.houses); setAlerts(a.data.alerts) }
  React.useEffect(()=>{ load() },[])
  React.useEffect(()=>{ const u=ws.subscribe(e=>{ if(e.type==='alert_created') setAlerts(x=>[e.payload,...x]) }); return ()=>u() },[])
  const center=[37.6,-122.1]; const colorBySeverity=(s)=> s==='high'?'red': s==='medium'?'orange':'green'
  return (<div className="max-w-6xl mx-auto p-4">
    <div className="card"><h3 className="font-bold mb-2">Alert Live Map</h3>
      <MapContainer center={center} zoom={9} style={{height:'520px', width:'100%', borderRadius:'14px'}}>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        {houses.map(h=> <Marker key={h.id} position={[h.lat,h.lng]}><Popup><div className="font-semibold">{h.name}</div><div className="text-xs text-gray-500">ID {h.id}</div></Popup></Marker>)}
        {alerts.slice(0,30).map(a=>{ const house=houses.find(h=>h.id===a.houseId); if(!house) return null; return (
          <CircleMarker key={a.id} center={[house.lat,house.lng]} radius={10} pathOptions={{color: colorBySeverity(a.severity)}}>
            <Popup><div className="font-semibold">Alert {a.id}</div><div className="text-xs">Type: {a.type} • Severity: {a.severity}</div><div className="text-xs text-gray-500">{new Date(a.createdAt).toLocaleString()}</div></Popup>
          </CircleMarker>)})}
      </MapContainer>
    </div></div>)
}
