
import React from 'react'
export default function SettingsPage(){
  const [profile,setProfile]=React.useState({ first:'Alex', last:'Lee', phone:'+1-555-123-4567', notify:{emergency:true, indoor:true, outdoor:false} })
  const [saved,setSaved]=React.useState(false)
  const [saving,setSaving]=React.useState(false)
  
  const toggle=(k)=> setProfile(p=>({...p, notify:{...p.notify, [k]: !p.notify[k]}}))
  
  const handleSave=async()=>{
    setSaving(true)
    setSaved(false)
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 800))
    console.log('Settings saved:', profile)
    setSaving(false)
    setSaved(true)
    setTimeout(()=>setSaved(false), 3000)
  }
  
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
    </div>
    <div className="flex items-center gap-3">
      <button 
        onClick={handleSave} 
        disabled={saving}
        className="btn bg-blue-500 text-white px-6 py-2 rounded-xl font-medium hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {saving ? 'Saving...' : 'Save Settings'}
      </button>
      {saved && <span className="text-green-600 text-sm font-medium">✓ Settings saved successfully!</span>}
    </div>
  </div>)
}
