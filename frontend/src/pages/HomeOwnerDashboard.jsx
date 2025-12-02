
import React from 'react'
import { MapContainer, TileLayer, Marker, Popup, CircleMarker } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import api from '../services/api'
import DetailsPopup from '../components/DetailsPopup'
import { slaBadge, formatPST } from '../utils/format'

export default function HomeOwnerDashboard(){
  const [metrics,setMetrics]=React.useState(null)
  const [alerts,setAlerts]=React.useState([])
  const [devices,setDevices]=React.useState([])
  const [houses,setHouses]=React.useState([])
  const [selected,setSelected]=React.useState(null)
  const [selectedHouse,setSelectedHouse]=React.useState(null)
  const [selectedDevice,setSelectedDevice]=React.useState(null)
  const [loading,setLoading]=React.useState(true)
  const [error,setError]=React.useState(null)
  const [highlightedAlert,setHighlightedAlert]=React.useState(null)
  const mapRef = React.useRef(null)

  const refresh=async()=>{
    try {
      setError(null)
      const [metricsRes, alertsRes, devicesRes, housesRes] = await Promise.all([
        api.metrics.get(),
        api.alerts.list({ status: 'active' }),
        api.devices.list(),
        api.houses.list()
      ])
      
      setMetrics(metricsRes)
      setAlerts(alertsRes.alerts || [])
      setDevices(devicesRes.devices || [])
      setHouses(housesRes.houses || [])
      setLoading(false)
    } catch (err) {
      console.error('Error refreshing dashboard:', err)
      setError(err.message)
      setLoading(false)
    }
  }

  React.useEffect(()=>{ 
    refresh()
    const t=setInterval(refresh, 10000)
    return ()=>clearInterval(t)
  },[])

  if(loading) return <div className="max-w-6xl mx-auto p-4">Loading…</div>
  if(error) return <div className="max-w-6xl mx-auto p-4 text-red-600">Error: {error}</div>
  if(!metrics) return <div className="max-w-6xl mx-auto p-4">No data available</div>

  const chip=(sev)=> sev==='high'?'chip-red': sev==='medium'?'chip-yellow':'chip-green'
  const statusChip=(status)=> status==='active'?'bg-blue-100 text-blue-800': status==='acknowledged'?'bg-yellow-100 text-yellow-800': status==='resolved'?'bg-green-100 text-green-800': status==='dismissed'?'bg-gray-100 text-gray-800':'bg-gray-100 text-gray-800'
  const colorBySeverity=(s)=> s==='high'?'red': s==='medium'?'orange':'green'
  const center=[37.6,-122.1]
  
  const scrollToMap = (alert) => {
    setHighlightedAlert(alert.alert_id)
    const house = houses.find(h => h.house_id === alert.house_id)
    if (house && house.latitude && house.longitude && mapRef.current) {
      mapRef.current.setView([house.latitude, house.longitude], 13)
    }
    document.getElementById('map-section')?.scrollIntoView({ behavior: 'smooth' })
    setTimeout(() => setHighlightedAlert(null), 3000)
  }
  
  return (<div className="max-w-6xl mx-auto p-4 space-y-4">
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      <div className="card"><div className="text-xs text-gray-500">Active Houses</div><div className="kpi">{metrics.active_houses || 0}</div></div>
      <div className="card"><div className="text-xs text-gray-500">Total Devices</div><div className="kpi">{metrics.total_devices || 0}</div></div>
      <div className="card"><div className="text-xs text-gray-500">Online Devices</div><div className="kpi">{metrics.online_devices || 0}</div></div>
      <div className="card"><div className="text-xs text-gray-500">Active Alerts</div><div className="kpi">{metrics.active_alerts || 0}</div></div>
    </div>
    <div className="card">
      <h3 className="font-bold mb-2">Alert Live Map</h3>
      <div id="map-section">
        <MapContainer center={center} zoom={9} scrollWheelZoom={true} style={{height:'420px', width:'100%', borderRadius:'14px'}} ref={mapRef}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          {houses.map(h=> { 
            if (!h.latitude || !h.longitude) return null;
            const houseDevices = devices.filter(d => d.house_id === h.house_id);
            return (
              <Marker key={h.house_id} position={[h.latitude,h.longitude]}>
                <Popup>
                  <div className="font-semibold text-base mb-1">{h.house_name}</div>
                  <div className="text-xs text-gray-500 mb-2">ID {h.house_id}</div>
                  {houseDevices.length > 0 && (
                    <div>
                      <div className="text-xs font-semibold text-gray-700 mb-1">Devices ({houseDevices.length}):</div>
                      <div className="space-y-1">
                        {houseDevices.map(d => (
                          <div key={d.device_id} className="text-xs flex items-center justify-between gap-2">
                            <span className="truncate">{d.device_name}</span>
                            <span className={`px-1.5 py-0.5 rounded text-[10px] ${d.status==='online'?'bg-green-100 text-green-700':d.status==='offline'?'bg-red-100 text-red-700':'bg-yellow-100 text-yellow-700'}`}>
                              {d.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </Popup>
              </Marker>
            );
          })}
          {alerts.slice(0,30).map(a=>{ const house=houses.find(h=>h.house_id===a.house_id); if(!house || !house.latitude || !house.longitude) return null; return (
            <CircleMarker key={a.alert_id} center={[house.latitude,house.longitude]} radius={highlightedAlert === a.alert_id ? 15 : 10} pathOptions={{color: colorBySeverity(a.severity), fillOpacity: highlightedAlert === a.alert_id ? 0.8 : 0.5}}>
              <Popup><div className="font-semibold">Alert {a.alert_id}</div><div className="text-xs">Severity: {a.severity} • Status: {a.status}</div><div className="text-xs text-gray-500">{formatPST(a.created_at)}</div></Popup>
            </CircleMarker>)})}
        </MapContainer>
      </div>
    </div>
    <div className="card">
      <div className="flex justify-between items-center"><h3 className="font-bold">Active Alerts</h3></div>
      {alerts.length === 0 ? (
        <div className="text-center py-8 text-gray-500">No active alerts</div>
      ) : (
        <table className="table mt-2"><thead><tr><th>House</th><th>Device</th><th>Type</th><th>Severity</th><th>Status</th><th>Created</th><th>Actions</th></tr></thead>
          <tbody>{alerts.map(a=>{ const house=houses.find(h=>h.house_id===a.house_id); const device=devices.find(d=>d.device_id===a.device_id); return (<tr key={a.alert_id} className="hover:bg-gray-50">
            <td>{house?.house_name || a.house_id}</td><td>{device?.device_name || a.device_id || 'N/A'}</td><td>{a.alert_type_name || a.alert_type_id}</td><td><span className={`chip ${chip(a.severity)}`}>{a.severity}</span></td>
            <td><span className={`chip ${statusChip(a.status)}`}>{a.status}</span></td>
            <td>{formatPST(a.created_at)}</td>
            <td className="space-x-2">
              <button onClick={() => scrollToMap(a)} className="text-blue-600 hover:text-blue-800 text-sm font-medium">📍 Map</button>
              <button onClick={() => {
                setSelected(a)
                setSelectedHouse(house)
                setSelectedDevice(device)
              }} className="text-blue-600 hover:text-blue-800 text-sm font-medium">Details</button>
            </td>
          </tr>)})}</tbody></table>
      )}
    </div>
    <div className="card"><h3 className="font-bold mb-2">Devices</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">{devices.map(d=>(<div key={d.device_id} className="flex items-center justify-between border border-gray-100 rounded-xl p-3">
        <div><div className="font-semibold">{d.device_name} <span className="text-xs text-gray-500">({d.location})</span></div><div className="text-xs text-gray-500">House {d.house_id}</div></div>
        <div className={`chip ${d.status==='online'?'chip-green':d.status==='offline'?'chip-red':'chip-yellow'}`}>{d.status}</div></div>))}
      </div>
    </div>
    <DetailsPopup open={!!selected} alert={selected} house={selectedHouse} device={selectedDevice} onClose={()=>{setSelected(null); setSelectedHouse(null); setSelectedDevice(null)}} onUpdate={refresh}/>
  </div>)
}
