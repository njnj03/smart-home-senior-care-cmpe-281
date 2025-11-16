
export const ageMinutes=(ts)=> Math.floor((Date.now()-new Date(ts).getTime())/60000)
export const chipByStatus=(s)=> s==='online'?'chip-green': s==='degraded'?'chip-yellow': s==='offline'?'chip-red':'chip-purple'

export const formatPST = (timestamp) => {
  if (!timestamp) return 'N/A'
  const options = {
    timeZone: 'America/Los_Angeles',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  }
  const pstDate = new Date(timestamp).toLocaleString('en-US', options)
  return `${pstDate} PST`
}

export const formatPSTDate = (timestamp) => {
  if (!timestamp) return 'N/A'
  const options = {
    timeZone: 'America/Los_Angeles',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }
  return new Date(timestamp).toLocaleDateString('en-US', options)
}

export function slaBadge(severity, createdAt){
  const age=ageMinutes(createdAt)
  if(severity==='high'&&age>=15) return {label:'Aging', className:'chip-red'}
  if(severity==='medium'&&age>=30) return {label:'Aging', className:'chip-yellow'}
  if(severity==='low'&&age>=60) return {label:'Stale', className:'chip-yellow'}
  return null
}
