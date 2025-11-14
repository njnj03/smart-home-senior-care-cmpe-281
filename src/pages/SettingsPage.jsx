
import React from 'react'
export default function SettingsPage(){
  const [profile,setProfile]=React.useState({ first:'Alex', last:'Lee', phone:'+1-555-123-4567', notify:{emergency:true, indoor:true, outdoor:false} })
  const toggle=(k)=> setProfile(p=>({...p, notify:{...p.notify, [k]: !p.notify[k]}}))
  return (<div className="max-w-4xl mx-auto p-4 space-y-4">
    <div className="card"><h3 className="font-bold mb-2">Profile</h3>
      <div className="grid md:grid-cols-3 gap-3">
        <input className="border rounded-xl px-3 py-2" value={profile.first} onChange={e=>setProfile({...profile, first:e.target.value})} />
        <input className="border rounded-xl px-3 py-2" value={profile.last} onChange={e=>setProfile({...profile, last:e.target.value})} />
        <input className="border rounded-xl px-3 py-2" value={profile.phone} onChange={e=>setProfile({...profile, phone:e.target.value})} />
      </div></div>
    <div className="card"><h3 className="font-bold mb-2">Notification Preferences</h3>
      <div className="flex flex-col gap-2">
        <label className="flex items-center gap-2"><input type="checkbox" checked={profile.notify.emergency} onChange={()=>toggle('emergency')}/> Emergency</label>
        <label className="flex items-center gap-2"><input type="checkbox" checked={profile.notify.indoor} onChange={()=>toggle('indoor')}/> Indoor</label>
        <label className="flex items-center gap-2"><input type="checkbox" checked={profile.notify.outdoor} onChange={()=>toggle('outdoor')}/> Outdoor</label>
      </div>
      <div className="text-xs text-gray-500 mt-2">Demo only. No persistence.</div>
    </div></div>)
}
