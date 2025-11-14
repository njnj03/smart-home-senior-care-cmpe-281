
export const ageMinutes=(ts)=> Math.floor((Date.now()-new Date(ts).getTime())/60000)
export const chipByStatus=(s)=> s==='online'?'chip-green': s==='degraded'?'chip-yellow': s==='offline'?'chip-red':'chip-purple'
export function slaBadge(severity, createdAt){
  const age=ageMinutes(createdAt)
  if(severity==='high'&&age>=15) return {label:'Aging', className:'chip-red'}
  if(severity==='medium'&&age>=30) return {label:'Aging', className:'chip-yellow'}
  if(severity==='low'&&age>=60) return {label:'Stale', className:'chip-yellow'}
  return null
}
