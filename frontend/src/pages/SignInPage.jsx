
import React from 'react'
import api from '../services/api'

export default function SignInPage({ onSignIn }){
  const [email,setEmail]=React.useState('care@seniorhome.org')
  const [pass,setPass]=React.useState('')
  const [loading,setLoading]=React.useState(false)
  const [error,setError]=React.useState('')
  
  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    
    try {
      // Real API authentication
      const loginResponse = await api.auth.login(email, pass)
      
      // Get user details
      const userDetails = await api.auth.getCurrentUser()
      
      // Pass user data to parent component
      onSignIn({ 
        email: userDetails.email,
        role: userDetails.role,
        firstName: userDetails.first_name,
        lastName: userDetails.last_name,
        userId: userDetails.user_id,
        tenantId: userDetails.tenant_id,
        token: loginResponse.access_token
      })
    } catch (err) {
      console.error('Login error:', err)
      setError(err.message || 'Login failed. Please check your credentials.')
    } finally {
      setLoading(false)
    }
  }
  
  return (<div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
    <div className="card max-w-md w-full">
      <h2 className="text-2xl font-extrabold mb-2">Sign In</h2>
      <p className="text-sm text-gray-500 mb-6">Welcome to Smart Home Cloud</p>
      
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
          {error}
        </div>
      )}
      
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
