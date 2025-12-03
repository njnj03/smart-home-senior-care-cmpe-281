
import React from 'react'
import api from '../services/api'

export default function SignInPage({ onSignIn }){
  const [isRegister,setIsRegister]=React.useState(false)
  const [email,setEmail]=React.useState('care@seniorhome.org')
  const [pass,setPass]=React.useState('')
  const [firstName,setFirstName]=React.useState('')
  const [lastName,setLastName]=React.useState('')
  const [confirmPass,setConfirmPass]=React.useState('')
  const [tenantId,setTenantId]=React.useState('')
  const [tenants,setTenants]=React.useState([])
  const [tenantsLoading,setTenantsLoading]=React.useState(false)
  const [loading,setLoading]=React.useState(false)
  const [error,setError]=React.useState('')
  const [success,setSuccess]=React.useState('')
  
  // Load tenants when registration form is shown
  React.useEffect(() => {
    if (isRegister) {
      loadTenants()
    }
  }, [isRegister])
  
  const loadTenants = async () => {
    try {
      setTenantsLoading(true)
      const res = await api.tenants.listPublic()
      setTenants(res.tenants || [])
      // Set default to first tenant if available
      if (res.tenants && res.tenants.length > 0 && !tenantId) {
        setTenantId(res.tenants[0].tenant_id.toString())
      }
    } catch (err) {
      console.error('Error loading tenants:', err)
      setError('Failed to load tenants. Please refresh the page.')
    } finally {
      setTenantsLoading(false)
    }
  }
  
  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')
    
    if (isRegister) {
      // Registration flow
      if (pass !== confirmPass) {
        setError('Passwords do not match')
        setLoading(false)
        return
      }
      
      if (pass.length < 6) {
        setError('Password must be at least 6 characters')
        setLoading(false)
        return
      }
      
      if (!tenantId) {
        setError('Please select a tenant')
        setLoading(false)
        return
      }
      
      try {
        await api.auth.register({
          email,
          password: pass,
          first_name: firstName,
          last_name: lastName,
          role: 'house_owner',
          tenant_id: parseInt(tenantId)
        })
        
        setSuccess('Registration successful! Please sign in.')
        setIsRegister(false)
        setPass('')
        setConfirmPass('')
        setFirstName('')
        setLastName('')
        setTenantId('')
      } catch (err) {
        console.error('Registration error:', err)
        setError(err.message || 'Registration failed. Please try again.')
      } finally {
        setLoading(false)
      }
    } else {
      // Login flow
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
  }
  
  return (<div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
    <div className="card max-w-md w-full">
      <h2 className="text-2xl font-extrabold mb-2">{isRegister ? 'Create Account' : 'Sign In'}</h2>
      <p className="text-sm text-gray-500 mb-6">Welcome to Smart Home Cloud</p>
      
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
          {error}
        </div>
      )}
      
      {success && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-800 text-sm">
          {success}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-4">
        {isRegister && (
          <>
            <div>
              <div className="text-sm text-gray-700 mb-1 font-medium">First Name</div>
              <input 
                type="text"
                required
                className="w-full border rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" 
                value={firstName} 
                onChange={e=>setFirstName(e.target.value)} 
              />
            </div>
            <div>
              <div className="text-sm text-gray-700 mb-1 font-medium">Last Name</div>
              <input 
                type="text"
                required
                className="w-full border rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" 
                value={lastName} 
                onChange={e=>setLastName(e.target.value)} 
              />
            </div>
          </>
        )}
        
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
        
        {isRegister && (
          <>
            <div>
              <div className="text-sm text-gray-700 mb-1 font-medium">Tenant</div>
              {tenantsLoading ? (
                <div className="w-full border rounded-xl px-3 py-2 text-gray-500 text-sm">
                  Loading tenants...
                </div>
              ) : (
                <select
                  required
                  className="w-full border rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={tenantId}
                  onChange={e => setTenantId(e.target.value)}
                >
                  <option value="">Select a tenant</option>
                  {tenants.map(tenant => (
                    <option key={tenant.tenant_id} value={tenant.tenant_id}>
                      {tenant.tenant_name}
                    </option>
                  ))}
                </select>
              )}
            </div>
            <div>
              <div className="text-sm text-gray-700 mb-1 font-medium">Confirm Password</div>
              <input 
                type="password"
                required
                className="w-full border rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" 
                value={confirmPass} 
                onChange={e=>setConfirmPass(e.target.value)} 
              />
            </div>
          </>
        )}
        
        <button 
          type="submit"
          disabled={loading}
          className="btn btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (isRegister ? 'Creating Account...' : 'Signing In...') : (isRegister ? 'Create Account' : 'Sign In')}
        </button>
        
        <div className="text-center mt-4">
          <button
            type="button"
            onClick={() => {
              setIsRegister(!isRegister)
              setError('')
              setSuccess('')
              setTenantId('')
            }}
            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            {isRegister ? 'Already have an account? Sign In' : "Don't have an account? Register"}
          </button>
        </div>
      </form>
    </div></div>)
}
