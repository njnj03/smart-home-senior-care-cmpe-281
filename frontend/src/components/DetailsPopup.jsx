
import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { api } from '../services/mockApi'
export default function DetailsPopup({open,onClose,alert,onUpdate}){
  if(!open||!alert) return null
  const act=async(type)=>{ if(type==='ack') await api.ackAlert(alert.id); if(type==='res') await api.resolveAlert(alert.id); onUpdate&&onUpdate(); onClose() }
  return (<AnimatePresence>
    <motion.div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}>
      <motion.div className="bg-white rounded-2xl p-4 max-w-lg w-full border border-gray-200" initial={{y:20,opacity:0}} animate={{y:0,opacity:1}} exit={{y:20,opacity:0}}>
        <div className="flex justify-between items-center mb-2"><h3 className="font-bold">Alert {alert.id}</h3><button className="btn" onClick={onClose}>Close</button></div>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div><span className="text-gray-500">Type:</span> {alert.type}</div>
          <div><span className="text-gray-500">Severity:</span> {alert.severity}</div>
          <div><span className="text-gray-500">House:</span> {alert.houseId}</div>
          <div><span className="text-gray-500">Location:</span> {alert.location}</div>
          <div><span className="text-gray-500">Created:</span> {new Date(alert.createdAt).toLocaleString()}</div>
          <div><span className="text-gray-500">Confidence:</span> {(alert.confidence*100).toFixed(0)}%</div>
        </div>
        <div className="flex gap-2 mt-4">
          {alert.status==='active'&&<button className="btn" onClick={()=>act('ack')}>Acknowledge</button>}
          {alert.status!=='resolved'&&<button className="btn btn-primary" onClick={()=>act('res')}>Resolve</button>}
        </div>
      </motion.div>
    </motion.div>
  </AnimatePresence>)
}
