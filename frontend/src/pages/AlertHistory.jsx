
import React from 'react'
import api from '../services/api'
import { slaBadge, formatPST } from '../utils/format'
import DetailsPopup from '../components/DetailsPopup'

export default function AlertHistory(){
  const [alerts,setAlerts]=React.useState([])
  const [houses,setHouses]=React.useState([])
  const [q,setQ]=React.useState('')
  const [range,setRange]=React.useState(24)
  const [statusFilter,setStatusFilter]=React.useState('all')
  const [loading,setLoading]=React.useState(true)
  const [error,setError]=React.useState(null)
  const [actionLoading,setActionLoading]=React.useState(null)
  const [selected,setSelected]=React.useState(null)

  const load=async()=>{
    try {
      setLoading(true)
      setError(null)
      const [alertsRes, housesRes] = await Promise.all([
        api.alerts.list({ limit: 1000 }),
        api.houses.list()
      ])
      const items = (alertsRes.alerts || []).filter(a => {
        const alertTime = new Date(a.created_at).getTime()
        const rangeMs = range * 3600 * 1000
        return (Date.now() - alertTime) < rangeMs
      })
      setAlerts(items)
      setHouses(housesRes.houses || [])
      setLoading(false)
    } catch (err) {
      console.error('Error loading alerts:', err)
      setError(err.message)
      setLoading(false)
    }
  }

  const handleAction = async (alertId, action) => {
    try {
      setActionLoading(alertId + action)
      if(action === 'ack') await api.alerts.acknowledge(alertId)
      if(action === 'resolve') await api.alerts.resolve(alertId)
      if(action === 'dismiss') await api.alerts.dismiss(alertId)
      await load()
    } catch (err) {
      console.error('Error updating alert:', err)
    } finally {
      setActionLoading(null)
    }
  }

  React.useEffect(()=>{ load() },[range])

  const filtered=alerts.filter(a=> {
    const house = houses.find(h=>h.house_id===a.house_id)
    const houseName = house?.house_name || ''
    const matchesSearch = [houseName, a.severity, a.status].join(' ').toLowerCase().includes(q.toLowerCase())
    const matchesStatus = statusFilter === 'all' || a.status === statusFilter
    return matchesSearch && matchesStatus
  })
  
  const statusChip=(status)=> status==='active'?'bg-blue-100 text-blue-800': status==='acknowledged'?'bg-yellow-100 text-yellow-800': status==='resolved'?'bg-green-100 text-green-800': status==='dismissed'?'bg-gray-100 text-gray-800':'bg-gray-100 text-gray-800'
  const severityChip=(severity)=> severity==='high'?'bg-red-100 text-red-800': severity==='medium'?'bg-orange-100 text-orange-800':'bg-green-100 text-green-800'

  if(loading) return <div className="max-w-6xl mx-auto p-4">Loading…</div>
  if(error) return <div className="max-w-6xl mx-auto p-4 text-red-600">Error: {error}</div>
  return (<div className="max-w-6xl mx-auto p-4">
    <div className="card space-y-3">
      <div className="flex flex-wrap gap-2 items-center justify-between"><h3 className="font-bold">Alert History</h3>
        <div className="flex gap-2">
          <input className="border rounded-xl px-3 py-2" placeholder="Search…" value={q} onChange={e=>setQ(e.target.value)} />
          <select className="border rounded-xl px-3 py-2" value={statusFilter} onChange={e=>setStatusFilter(e.target.value)}>
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="acknowledged">Acknowledged</option>
            <option value="resolved">Resolved</option>
            <option value="dismissed">Dismissed</option>
            <option value="false_positive">False Positive</option>
          </select>
          <select className="border rounded-xl px-3 py-2" value={range} onChange={e=>setRange(Number(e.target.value))}>
            <option value={6}>Last 6h</option>
            <option value={24}>Last 24h</option>
            <option value={72}>Last 72h</option>
          </select>
        </div></div>
      <table className="table"><thead><tr><th>House</th><th>Type</th><th>Severity</th><th>Status</th><th>Created</th><th>Location</th><th>Actions</th></tr></thead>
        <tbody>{filtered.map(a=>{ const house=houses.find(h=>h.house_id===a.house_id); return (<tr key={a.alert_id} onClick={()=>setSelected(a)} className="cursor-pointer hover:bg-gray-50">
          <td>{house?.house_name || a.house_id}</td>
          <td>{a.alert_type_id}</td>
          <td><span className={`chip ${severityChip(a.severity)}`}>{a.severity}</span></td>
          <td><span className={`chip ${statusChip(a.status)}`}>{a.status}</span></td>
          <td>{formatPST(a.created_at)}</td>
          <td>D{a.device_id}</td>
          <td onClick={(e)=>e.stopPropagation()}>
            <div className="flex gap-1">
              {a.status==='active' && (
                <button 
                  onClick={() => handleAction(a.alert_id, 'ack')}
                  disabled={actionLoading === a.alert_id + 'ack'}
                  className="text-xs px-2 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600 disabled:opacity-50"
                  title="Acknowledge"
                >
                  Ack
                </button>
              )}
              {(a.status==='active' || a.status==='acknowledged') && (
                <>
                  <button 
                    onClick={() => handleAction(a.alert_id, 'resolve')}
                    disabled={actionLoading === a.alert_id + 'resolve'}
                    className="text-xs px-2 py-1 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
                    title="Resolve"
                  >
                    Resolve
                  </button>
                  <button 
                    onClick={() => handleAction(a.alert_id, 'dismiss')}
                    disabled={actionLoading === a.alert_id + 'dismiss'}
                    className="text-xs px-2 py-1 bg-gray-500 text-white rounded hover:bg-gray-600 disabled:opacity-50"
                    title="Dismiss"
                  >
                    Dismiss
                  </button>
                </>
              )}
              {(a.status==='resolved' || a.status==='dismissed') && (
                <span className="text-xs text-gray-400">-</span>
              )}
            </div>
          </td>
        </tr>)})}</tbody>
      </table></div>
      <DetailsPopup open={!!selected} alert={selected} onClose={()=>setSelected(null)} onUpdate={load} />
    </div>)
}
