
import React from 'react'
import { api } from '../services/mockApi'
import { chipByStatus } from '../utils/format'

export default function IoTDeviceManager(){
  const [list,setList]=React.useState([])
  const [loading,setLoading]=React.useState(true)
  const [error,setError]=React.useState(null)

  React.useEffect(()=>{ 
    (async()=>{
      try {
        setLoading(true)
        setError(null)
        const res = await api.getDevices()
        setList(res.data.devices || [])
        setLoading(false)
      } catch (err) {
        console.error('Error loading devices:', err)
        setError(err.message)
        setLoading(false)
      }
    })() 
  },[])

  if(loading) return <div className="max-w-6xl mx-auto p-4">Loading…</div>
  if(error) return <div className="max-w-6xl mx-auto p-4 text-red-600">Error: {error}</div>

  return (<div className="max-w-6xl mx-auto p-4">
    <div className="card"><div className="flex justify-between items-center"><h3 className="font-bold">IoT Device Management</h3></div>
      <table className="table mt-2"><thead><tr><th>ID</th><th>House</th><th>Name</th><th>Room</th><th>Status</th><th>Last Heartbeat</th></tr></thead>
        <tbody>{list.map(d=>(<tr key={d.id}><td>{d.id}</td><td>{d.houseId}</td><td>{d.name}</td><td>{d.room}</td><td><span className={`chip ${chipByStatus(d.status)}`}>{d.status}</span></td><td>{d.lastHeartbeat}s ago</td></tr>))}</tbody>
      </table></div></div>)
}
