
import React from 'react'
import { api } from '../services/mockApi'
import DetailsPopup from '../components/DetailsPopup'
import { slaBadge } from '../utils/format'

export default function HomeOwnerDashboard(){
  const [metrics,setMetrics]=React.useState(null)
  const [alerts,setAlerts]=React.useState([])
  const [devices,setDevices]=React.useState([])
  const [selected,setSelected]=React.useState(null)
  const [loading,setLoading]=React.useState(true)
  const [error,setError]=React.useState(null)

  const refresh=async()=>{
    try {
      setError(null)
      const [metricsRes, alertsRes, devicesRes] = await Promise.all([
        api.getMetrics(),
        api.getAlerts({ status: 'active' }),
        api.getDevices()
      ])
      
      setMetrics(metricsRes.data)
      setAlerts(alertsRes.data.alerts || [])
      setDevices(devicesRes.data.devices || [])
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
  return (<div className="max-w-6xl mx-auto p-4 space-y-4">
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      <div className="card"><div className="text-xs text-gray-500">Active Houses</div><div className="kpi">{metrics.activeHouses}</div></div>
      <div className="card"><div className="text-xs text-gray-500">Total Devices</div><div className="kpi">{metrics.totalDevices}</div></div>
      <div className="card"><div className="text-xs text-gray-500">Online Devices</div><div className="kpi">{metrics.onlineDevices}</div></div>
      <div className="card"><div className="text-xs text-gray-500">Active Alerts</div><div className="kpi">{metrics.activeAlerts}</div></div>
    </div>
    <div className="card">
      <div className="flex justify-between items-center"><h3 className="font-bold">Active Alerts</h3></div>
      <table className="table mt-2"><thead><tr><th>ID</th><th>House</th><th>Type</th><th>Severity</th><th>Status</th><th>Created</th><th>Location</th></tr></thead>
        <tbody>{alerts.map(a=>(<tr key={a.id} className="hover:bg-gray-50 cursor-pointer" onClick={()=>setSelected(a)}>
          <td>{a.id}</td><td>{a.houseId}</td><td>{a.type}</td><td><span className={`chip ${chip(a.severity)}`}>{a.severity}</span></td><td>{a.status}</td>
          <td>{new Date(a.createdAt).toLocaleString()}</td><td>{a.location}</td>
        </tr>))}</tbody></table></div>
    <div className="card"><h3 className="font-bold mb-2">Devices</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">{devices.map(d=>(<div key={d.id} className="flex items-center justify-between border border-gray-100 rounded-xl p-3">
        <div><div className="font-semibold">{d.name} <span className="text-xs text-gray-500">({d.room})</span></div><div className="text-xs text-gray-500">House {d.houseId}</div></div>
        <div className={`chip ${d.status==='online'?'chip-green':d.status==='offline'?'chip-red':'chip-yellow'}`}>{d.status}</div></div>))}
      </div></div>
    <DetailsPopup open={!!selected} alert={selected} onClose={()=>setSelected(null)} onUpdate={refresh}/>
  </div>)
}
