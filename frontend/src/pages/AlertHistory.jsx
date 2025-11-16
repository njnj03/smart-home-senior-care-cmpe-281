
import React from 'react'
import { api } from '../services/mockApi'
import { slaBadge } from '../utils/format'

export default function AlertHistory(){
  const [alerts,setAlerts]=React.useState([])
  const [q,setQ]=React.useState('')
  const [range,setRange]=React.useState(24)
  const [loading,setLoading]=React.useState(true)
  const [error,setError]=React.useState(null)

  const load=async()=>{
    try {
      setLoading(true)
      setError(null)
      const res = await api.getAlerts()
      const items = (res.data.alerts || []).filter(a => {
        const alertTime = new Date(a.createdAt).getTime()
        const rangeMs = range * 3600 * 1000
        return (Date.now() - alertTime) < rangeMs
      })
      setAlerts(items)
      setLoading(false)
    } catch (err) {
      console.error('Error loading alerts:', err)
      setError(err.message)
      setLoading(false)
    }
  }

  React.useEffect(()=>{ load() },[range])

  const filtered=alerts.filter(a=> 
    [a.id, a.type, a.houseId].join(' ').toLowerCase().includes(q.toLowerCase())
  )

  if(loading) return <div className="max-w-6xl mx-auto p-4">Loading…</div>
  if(error) return <div className="max-w-6xl mx-auto p-4 text-red-600">Error: {error}</div>
  return (<div className="max-w-6xl mx-auto p-4">
    <div className="card space-y-3">
      <div className="flex flex-wrap gap-2 items-center justify-between"><h3 className="font-bold">Alert History</h3>
        <div className="flex gap-2"><input className="border rounded-xl px-3 py-2" placeholder="Search…" value={q} onChange={e=>setQ(e.target.value)} />
          <select className="border rounded-xl px-3 py-2" value={range} onChange={e=>setRange(Number(e.target.value))}><option value={6}>Last 6h</option><option value={24}>Last 24h</option><option value={72}>Last 72h</option></select>
        </div></div>
      <table className="table"><thead><tr><th>ID</th><th>House</th><th>Type</th><th>Severity</th><th>Status</th><th>Created</th><th>Location</th></tr></thead>
        <tbody>{filtered.map(a=>(<tr key={a.id}><td>{a.id}</td><td>{a.houseId}</td><td>{a.type}</td><td>{a.severity}</td><td>{a.status}</td><td>{new Date(a.createdAt).toLocaleString()}</td><td>{a.location}</td></tr>))}</tbody>
      </table></div></div>)
}
