
import React from 'react'
export default function SignInPage(){
  const [email,setEmail]=React.useState('care@seniorhome.org')
  const [pass,setPass]=React.useState('••••••••')
  return (<div className="max-w-md mx-auto p-6">
    <div className="card"><h2 className="text-xl font-extrabold mb-2">Sign In</h2>
      <p className="text-sm text-gray-500 mb-4">Role-based access (mock).</p>
      <div className="space-y-3">
        <div><div className="text-xs text-gray-500">Email</div><input className="w-full border rounded-xl px-3 py-2" value={email} onChange={e=>setEmail(e.target.value)} /></div>
        <div><div className="text-xs text-gray-500">Password</div><input type="password" className="w-full border rounded-xl px-3 py-2" value={pass} onChange={e=>setPass(e.target.value)} /></div>
        <button className="btn btn-primary w-full">Sign In</button>
      </div></div></div>)
}
