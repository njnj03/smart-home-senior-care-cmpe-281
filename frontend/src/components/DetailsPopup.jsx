
import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MapContainer, TileLayer, Marker, CircleMarker, Popup } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import api from '../services/api'
import { formatPST } from '../utils/format'

export default function DetailsPopup({open,onClose,alert,onUpdate,house,device}){
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState(null)
  const [showMap, setShowMap] = React.useState(false)

  if(!open||!alert) return null

  const severityChip=(severity)=> severity==='high'?'bg-red-100 text-red-800': severity==='medium'?'bg-orange-100 text-orange-800':'bg-green-100 text-green-800'
  const colorBySeverity=(s)=> s==='high'?'red': s==='medium'?'orange':'green'
  const hasLocation = house && house.latitude && house.longitude

  const act = async(type) => {
    try {
      setLoading(true)
      setError(null)
      // Support both mock (id) and real API (alert_id) field names
      const alertId = alert.alert_id || alert.id
      if(type==='ack') await api.alerts.acknowledge(alertId)
      if(type==='res') await api.alerts.resolve(alertId)
      if(type==='dismiss') await api.alerts.dismiss(alertId)
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
      <motion.div className="bg-white rounded-2xl p-4 max-w-2xl w-full border border-gray-200 max-h-[90vh] overflow-y-auto" initial={{y:20,opacity:0}} animate={{y:0,opacity:1}} exit={{y:20,opacity:0}}>
        <div className="flex justify-between items-center mb-2">
          <h3 className="font-bold">Alert Details</h3>
          <div className="flex gap-2">
            {hasLocation && !showMap && (
              <button className="btn bg-blue-500 text-white hover:bg-blue-600 px-3 py-1 rounded-xl text-sm" onClick={() => setShowMap(true)}>📍 Show Map</button>
            )}
            {showMap && (
              <button className="btn bg-gray-500 text-white hover:bg-gray-600 px-3 py-1 rounded-xl text-sm" onClick={() => setShowMap(false)}>Hide Map</button>
            )}
            <button className="btn" onClick={onClose}>Close</button>
          </div>
        </div>
        {error && <div className="text-red-600 text-sm mb-2">{error}</div>}
        
        {showMap && hasLocation && (
          <div className="mb-4 rounded-xl overflow-hidden border border-gray-200">
            <MapContainer center={[house.latitude, house.longitude]} zoom={13} scrollWheelZoom={true} style={{height:'300px', width:'100%'}}>
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              <Marker position={[house.latitude, house.longitude]}>
                <Popup>
                  <div className="font-semibold">{house.house_name || house.house_id}</div>
                  <div className="text-xs text-gray-500">{house.address || 'No address'}</div>
                </Popup>
              </Marker>
              <CircleMarker center={[house.latitude, house.longitude]} radius={12} pathOptions={{color: colorBySeverity(alert.severity), fillOpacity: 0.6}}>
                <Popup>
                  <div className="font-semibold">{house?.house_name || 'Alert'}</div>
                  <div className="text-xs">Severity: {alert.severity}</div>
                  <div className="text-xs">Status: {alert.status}</div>
                </Popup>
              </CircleMarker>
            </MapContainer>
          </div>
        )}
        
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div><span className="text-gray-500">House:</span> {house?.house_name || alert.house_id || alert.houseId || 'N/A'}</div>
          <div><span className="text-gray-500">Device:</span> {device?.device_name || 'N/A'}</div>
          <div><span className="text-gray-500">Location:</span> {device?.location || 'N/A'}</div>
          <div><span className="text-gray-500">Alert Type:</span> {alert.alert_type_name || alert.alert_type_id || 'Unknown'}</div>
          <div><span className="text-gray-500">Severity:</span> <span className={`chip ${severityChip(alert.severity)}`}>{alert.severity}</span></div>
          <div><span className="text-gray-500">Status:</span> {alert.status}</div>
          <div><span className="text-gray-500">Created:</span> {formatPST(alert.created_at || alert.createdAt)}</div>
          {(alert.confidence_score || alert.confidence) && <div><span className="text-gray-500">Confidence:</span> {((alert.confidence_score || alert.confidence)*100).toFixed(0)}%</div>}
        </div>
        {alert.notes && <div className="mt-2 p-2 bg-gray-50 rounded text-sm"><span className="text-gray-500">Notes:</span> {alert.notes}</div>}
        <div className="flex gap-2 mt-4">
          {alert.status==='active'&&<button disabled={loading} className="btn bg-yellow-500 text-white hover:bg-yellow-600 px-4 py-2 rounded-xl" onClick={()=>act('ack')}>Acknowledge</button>}
          {(alert.status==='active'||alert.status==='acknowledged')&&<button disabled={loading} className="btn bg-green-500 text-white hover:bg-green-600 px-4 py-2 rounded-xl" onClick={()=>act('res')}>Resolve</button>}
          {(alert.status==='active'||alert.status==='acknowledged')&&<button disabled={loading} className="btn bg-gray-500 text-white hover:bg-gray-600 px-4 py-2 rounded-xl" onClick={()=>act('dismiss')}>Dismiss</button>}
        </div>
      </motion.div>
    </motion.div>
  </AnimatePresence>)
}
