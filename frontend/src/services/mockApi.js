
const rand = (arr)=> arr[Math.floor(Math.random()*arr.length)]
const nowISO = ()=> new Date().toISOString()
export const db = {
  houses:[{id:'H002',name:'House 2',lat:37.7749,lng:-122.4194},{id:'H003',name:'House 3',lat:37.8044,lng:-122.2711}],
  devices:[
    {id:'dev-001',houseId:'H001',name:'Living Mic',room:'Living',status:'online',lastHeartbeat:12,errorRate:0},
    {id:'dev-002',houseId:'H001',name:'Kitchen Cam',room:'Kitchen',status:'degraded',lastHeartbeat:35,errorRate:5},
    {id:'dev-003',houseId:'H002',name:'Bedroom Mic',room:'Bedroom',status:'offline',lastHeartbeat:780,errorRate:0},
    {id:'dev-004',houseId:'H003',name:'Hall Cam',room:'Hallway',status:'online',lastHeartbeat:5,errorRate:1},
  ],
  alerts:[
    {id:'alert-1001',houseId:'H001',type:'distress',severity:'high',status:'active',createdAt:new Date(Date.now()-18*60*1000).toISOString(),location:'Living Room',confidence:0.92},,
  ],
  models:[
    {id:'model-1',name:'YAMNet Human v1.0',version:'1.0',status:'active',accuracy:0.92,createdAt:new Date(Date.now()-30*24*60*60*1000).toISOString()},
    {id:'model-2',name:'YAMNet Human v1.1',version:'1.1',status:'inactive',accuracy:0.94,createdAt:new Date(Date.now()-15*24*60*60*1000).toISOString()},
    {id:'model-3',name:'Custom Audio Classifier',version:'2.0',status:'inactive',accuracy:0.89,createdAt:new Date(Date.now()-7*24*60*60*1000).toISOString()},
  ],
  metrics(){ const activeAlerts=this.alerts.filter(a=>a.status==='active').length; return{
    activeHouses:new Set(this.alerts.map(a=>a.houseId)).size, totalDevices:this.devices.length,
    onlineDevices:this.devices.filter(d=>d.status==='online').length, activeAlerts,
    systemHealth:{apiLatency:40+Math.round(Math.random()*30), queueDepth:Math.round(Math.random()*10)} } }
}
export const api={
  async getMetrics(){ return {status:'success', data: db.metrics()} },
  async getAlerts(params={}){ let list=[...db.alerts]; const {severity,status,houseId}=params;
    if(severity) list=list.filter(a=>a.severity===severity); if(status) list=list.filter(a=>a.status===status); if(houseId) list=list.filter(a=>a.houseId===houseId);
    list.sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt)); return {status:'success', data:{alerts:list}} },
  async getDevices(){ return {status:'success', data:{devices: db.devices}} },
  async getHouses(){ return {status:'success', data:{houses: db.houses}} },
  async getModels(){ return {status:'success', data:{models: db.models, active_model: db.models.find(m=>m.status==='active')}} },
  async activateModel(id){ db.models.forEach(m=>m.status='inactive'); const m=db.models.find(x=>x.id===id); if(m) m.status='active'; return {status:'success'} },
  async ackAlert(id){ const a=db.alerts.find(x=>x.id===id); if(!a) return{status:'error'}; a.status='acknowledged'; a.acknowledgedAt=nowISO(); ws.broadcast({type:'alert_updated',payload:{id,status:'acknowledged'}}); return {status:'success', data:a} },
  async resolveAlert(id){ const a=db.alerts.find(x=>x.id===id); if(!a) return{status:'error'}; a.status='resolved'; a.resolvedAt=nowISO(); ws.broadcast({type:'alert_updated',payload:{id,status:'resolved'}}); return {status:'success', data:a} },
  async dismissAlert(id){ const a=db.alerts.find(x=>x.id===id); if(!a) return{status:'error'}; a.status='dismissed'; a.dismissedAt=nowISO(); ws.broadcast({type:'alert_updated',payload:{id,status:'dismissed'}}); return {status:'success', data:a} },
}
const listeners = new Set()
export const ws = { subscribe(cb){ listeners.add(cb); return ()=>listeners.delete(cb) }, broadcast(evt){ for(const cb of listeners) cb(evt) } }
const types=['distress','inactivity','alarm','fall']; const severities=['high','medium','low']
setInterval(()=>{ if(Math.random()<0.45){ const house=rand(db.houses); const alert={id:'alert-'+Math.floor(Math.random()*99999),houseId:house.id,type:rand(types),severity:rand(severities),status:'active',createdAt:nowISO(),location:rand(['Living','Kitchen','Bedroom','Garage']),confidence:Math.round((0.6+Math.random()*0.4)*100)/100}; db.alerts.unshift(alert); ws.broadcast({type:'alert_created',payload:alert}); } },6000)
