
import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { api } from '../services/mockApi'

export default function DetailsPopup({open,onClose,alert,onUpdate}){
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState(null)

  if(!open||!alert) return null

  const act = async(type) => {
    try {
      setLoading(true)
      setError(null)
      if(type==='ack') await api.ackAlert(alert.id)
      if(type==='res') await api.resolveAlert(alert.id)
      if(type==='dismiss') await api.dismissAlert(alert.id)
      onUpdate && onUpdate()
      onClose()
    } catch (err) {
      console.error('Error:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (<AnimatePresence>
    <motion.div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}>
      <motion.div className="bg-white rounded-2xl p-4 max-w-lg w-full border border-gray-200" initial={{y:20,opacity:0}} animate={{y:0,opacity:1}} exit={{y:20,opacity:0}}>
        <div className="flex justify-between items-center mb-2"><h3 className="font-bold">Alert {alert.id}</h3><button className="btn" onClick={onClose}>Close</button></div>
        {error && <div className="text-red-600 text-sm mb-2">{error}</div>}
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div><span className="text-gray-500">House:</span> {alert.houseId}</div>
          <div><span className="text-gray-500">Type:</span> {alert.type}</div>
          <div><span className="text-gray-500">Severity:</span> {alert.severity}</div>
          <div><span className="text-gray-500">Status:</span> {alert.status}</div>
          <div><span className="text-gray-500">Created:</span> {new Date(alert.createdAt).toLocaleString()}</div>
          {alert.confidence && <div><span className="text-gray-500">Confidence:</span> {(alert.confidence*100).toFixed(0)}%</div>}
        </div>
        {alert.notes && <div className="mt-2 p-2 bg-gray-50 rounded text-sm"><span className="text-gray-500">Notes:</span> {alert.notes}</div>}
        <div className="flex gap-2 mt-4">
          {alert.status==='open'&&<button disabled={loading} className="btn bg-yellow-500 text-white hover:bg-yellow-600 px-4 py-2 rounded-xl" onClick={()=>act('ack')}>Acknowledge</button>}
          {(alert.status==='open'||alert.status==='acknowledged')&&<button disabled={loading} className="btn bg-green-500 text-white hover:bg-green-600 px-4 py-2 rounded-xl" onClick={()=>act('res')}>Resolve</button>}
          {(alert.status==='open'||alert.status==='acknowledged')&&<button disabled={loading} className="btn bg-gray-500 text-white hover:bg-gray-600 px-4 py-2 rounded-xl" onClick={()=>act('dismiss')}>Dismiss</button>}
        </div>
      </motion.div>
    </motion.div>
  </AnimatePresence>)
}
