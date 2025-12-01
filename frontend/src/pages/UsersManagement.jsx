
import React from 'react'
import api from '../services/api'
import { formatPST } from '../utils/format'

export default function UsersManagement(){
  const [users,setUsers]=React.useState([])
  const [loading,setLoading]=React.useState(true)
  const [error,setError]=React.useState(null)
  const [showCreateModal,setShowCreateModal]=React.useState(false)
  const [editingUser,setEditingUser]=React.useState(null)
  
  // Form states
  const [formData,setFormData]=React.useState({
    email: '',
    password: '',
    first_name: '',
    last_name: '',
    role: 'house_owner',
    tenant_id: 1
  })
  const [formLoading,setFormLoading]=React.useState(false)
  const [formError,setFormError]=React.useState('')

  const load=async()=>{
    try {
      setLoading(true)
      setError(null)
      const res = await api.auth.listUsers()
      setUsers(res.users || [])
      setLoading(false)
    } catch (err) {
      console.error('Error loading users:', err)
      setError(err.message)
      setLoading(false)
    }
  }

  React.useEffect(()=>{ load() },[])

  const resetForm = () => {
    setFormData({
      email: '',
      password: '',
      first_name: '',
      last_name: '',
      role: 'house_owner',
      tenant_id: 1
    })
    setFormError('')
    setEditingUser(null)
  }

  const handleCreate = async (e) => {
    e.preventDefault()
    setFormLoading(true)
    setFormError('')

    try {
      await api.auth.createUser(formData)
      await load()
      setShowCreateModal(false)
      resetForm()
    } catch (err) {
      console.error('Create user error:', err)
      setFormError(err.message || 'Failed to create user')
    } finally {
      setFormLoading(false)
    }
  }

  const handleUpdate = async (e) => {
    e.preventDefault()
    setFormLoading(true)
    setFormError('')

    try {
      const updateData = {
        first_name: formData.first_name,
        last_name: formData.last_name,
        role: formData.role,
        is_active: formData.is_active
      }
      
      // Only include password if it's been changed
      if (formData.password) {
        updateData.password = formData.password
      }

      await api.auth.updateUser(editingUser.user_id, updateData)
      await load()
      setEditingUser(null)
      resetForm()
    } catch (err) {
      console.error('Update user error:', err)
      setFormError(err.message || 'Failed to update user')
    } finally {
      setFormLoading(false)
    }
  }

  const openEditModal = (user) => {
    setEditingUser(user)
    setFormData({
      email: user.email,
      password: '', // Don't pre-fill password
      first_name: user.first_name || '',
      last_name: user.last_name || '',
      role: user.role,
      tenant_id: user.tenant_id,
      is_active: user.is_active
    })
    setFormError('')
  }

  const getRoleBadge = (role) => {
    if (role === 'admin') return 'chip chip-red'
    if (role === 'iot_team') return 'chip chip-blue'
    return 'chip chip-green'
  }

  if(loading) return <div className="max-w-6xl mx-auto p-4">Loading users...</div>
  if(error) return <div className="max-w-6xl mx-auto p-4 text-red-600">Error: {error}</div>

  return (<div className="max-w-6xl mx-auto p-4">
    <div className="card">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-xl font-bold">Users Management</h2>
          <p className="text-sm text-gray-500">Manage user accounts and assign roles</p>
        </div>
        <button 
          onClick={() => {
            resetForm()
            setShowCreateModal(true)
          }}
          className="btn btn-primary"
        >
          + Create User
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Email</th>
              <th>Name</th>
              <th>Role</th>
              <th>Tenant</th>
              <th>Status</th>
              <th>Created</th>
              <th>Last Login</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.user_id} className="hover:bg-gray-50">
                <td>{u.user_id}</td>
                <td>{u.email}</td>
                <td>{u.first_name} {u.last_name}</td>
                <td>
                  <span className={getRoleBadge(u.role)}>
                    {u.role}
                  </span>
                </td>
                <td>{u.tenant_id}</td>
                <td>
                  <span className={`chip ${u.is_active ? 'chip-green' : 'chip-red'}`}>
                    {u.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="text-xs text-gray-500">{formatPST(u.created_at)}</td>
                <td className="text-xs text-gray-500">{u.last_login ? formatPST(u.last_login) : 'Never'}</td>
                <td>
                  <button 
                    onClick={() => openEditModal(u)}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    Edit
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>

    {/* Create User Modal */}
    {showCreateModal && (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl p-6 max-w-md w-full">
          <h3 className="text-lg font-bold mb-4">Create New User</h3>
          
          {formError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
              {formError}
            </div>
          )}

          <form onSubmit={handleCreate} className="space-y-3">
            <div>
              <label className="text-sm font-medium text-gray-700">Email</label>
              <input 
                type="email"
                required
                className="w-full border rounded-lg px-3 py-2 text-sm"
                value={formData.email}
                onChange={e => setFormData({...formData, email: e.target.value})}
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">Password</label>
              <input 
                type="password"
                required
                minLength={6}
                className="w-full border rounded-lg px-3 py-2 text-sm"
                value={formData.password}
                onChange={e => setFormData({...formData, password: e.target.value})}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium text-gray-700">First Name</label>
                <input 
                  type="text"
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                  value={formData.first_name}
                  onChange={e => setFormData({...formData, first_name: e.target.value})}
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">Last Name</label>
                <input 
                  type="text"
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                  value={formData.last_name}
                  onChange={e => setFormData({...formData, last_name: e.target.value})}
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">Role</label>
              <select 
                className="w-full border rounded-lg px-3 py-2 text-sm"
                value={formData.role}
                onChange={e => setFormData({...formData, role: e.target.value})}
              >
                <option value="house_owner">House Owner</option>
                <option value="iot_team">IoT Team</option>
                <option value="admin">Administrator</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">Tenant ID</label>
              <input 
                type="number"
                required
                className="w-full border rounded-lg px-3 py-2 text-sm"
                value={formData.tenant_id}
                onChange={e => setFormData({...formData, tenant_id: parseInt(e.target.value)})}
              />
            </div>

            <div className="flex gap-2 pt-4">
              <button 
                type="submit" 
                disabled={formLoading}
                className="btn btn-primary flex-1 disabled:opacity-50"
              >
                {formLoading ? 'Creating...' : 'Create User'}
              </button>
              <button 
                type="button"
                onClick={() => {
                  setShowCreateModal(false)
                  resetForm()
                }}
                className="btn flex-1"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    )}

    {/* Edit User Modal */}
    {editingUser && (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl p-6 max-w-md w-full">
          <h3 className="text-lg font-bold mb-4">Edit User: {editingUser.email}</h3>
          
          {formError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
              {formError}
            </div>
          )}

          <form onSubmit={handleUpdate} className="space-y-3">
            <div>
              <label className="text-sm font-medium text-gray-700">Email</label>
              <input 
                type="email"
                disabled
                className="w-full border rounded-lg px-3 py-2 text-sm bg-gray-100"
                value={formData.email}
              />
              <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">New Password (optional)</label>
              <input 
                type="password"
                minLength={6}
                className="w-full border rounded-lg px-3 py-2 text-sm"
                value={formData.password}
                onChange={e => setFormData({...formData, password: e.target.value})}
                placeholder="Leave blank to keep current password"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium text-gray-700">First Name</label>
                <input 
                  type="text"
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                  value={formData.first_name}
                  onChange={e => setFormData({...formData, first_name: e.target.value})}
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">Last Name</label>
                <input 
                  type="text"
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                  value={formData.last_name}
                  onChange={e => setFormData({...formData, last_name: e.target.value})}
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">Role</label>
              <select 
                className="w-full border rounded-lg px-3 py-2 text-sm"
                value={formData.role}
                onChange={e => setFormData({...formData, role: e.target.value})}
              >
                <option value="house_owner">House Owner</option>
                <option value="iot_team">IoT Team</option>
                <option value="admin">Administrator</option>
              </select>
            </div>

            <div>
              <label className="flex items-center gap-2">
                <input 
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={e => setFormData({...formData, is_active: e.target.checked})}
                  className="rounded"
                />
                <span className="text-sm font-medium text-gray-700">Active</span>
              </label>
            </div>

            <div className="flex gap-2 pt-4">
              <button 
                type="submit" 
                disabled={formLoading}
                className="btn btn-primary flex-1 disabled:opacity-50"
              >
                {formLoading ? 'Updating...' : 'Update User'}
              </button>
              <button 
                type="button"
                onClick={() => {
                  setEditingUser(null)
                  resetForm()
                }}
                className="btn flex-1"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    )}
  </div>)
}
