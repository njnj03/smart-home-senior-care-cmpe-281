
import React from 'react'
export default function SignInPage({ onSignIn }){
  const [email,setEmail]=React.useState('care@seniorhome.org')
  const [pass,setPass]=React.useState('')
  const [loading,setLoading]=React.useState(false)
  
  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 800))
    
    // Mock authentication
    onSignIn({ 
      email, 
      role: email.includes('admin') ? 'Administrator' : 'Homeowner',
      name: email.split('@')[0]
    })
    
    setLoading(false)
  }
  
  return (<div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
    <div className="card max-w-md w-full">
      <h2 className="text-2xl font-extrabold mb-2">Sign In</h2>
      <p className="text-sm text-gray-500 mb-6">Welcome to Smart Home Cloud</p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <div className="text-sm text-gray-700 mb-1 font-medium">Email</div>
          <input 
            type="email"
            required
            className="w-full border rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" 
            value={email} 
            onChange={e=>setEmail(e.target.value)} 
          />
        </div>
        <div>
          <div className="text-sm text-gray-700 mb-1 font-medium">Password</div>
          <input 
            type="password"
            required
            className="w-full border rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" 
            value={pass} 
            onChange={e=>setPass(e.target.value)} 
          />
        </div>
        <button 
          type="submit"
          disabled={loading}
          className="btn btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Signing In...' : 'Sign In'}
        </button>
      </form>
    </div></div>)
}
