import { useState, useEffect } from 'react'
import { adminApi } from '../api/admin'
import { toast } from '../components/Toast'
import ConfirmModal from '../components/ConfirmModal'

const ROLE_COLORS = {
  admin: 'badge-red',
  staff: 'badge-blue',
  doctor: 'badge-green',
  patient: 'badge-gray',
}

export default function Users() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(null)

  function load() {
    setLoading(true)
    adminApi.listUsers()
      .then(setUsers)
      .catch(() => setError('Failed to load users'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  async function handleRoleChange(user, newRole) {
    try {
      await adminApi.updateUserRole(user.id, newRole)
      toast(`${user.full_name}'s role updated to ${newRole}`)
      load()
    } catch (err) {
      toast(err.message, 'error')
    }
  }

  async function handleDelete() {
    try {
      await adminApi.deleteUser(confirmDelete.id)
      setConfirmDelete(null)
      toast('User deleted', 'info')
      load()
    } catch (err) {
      toast(err.message, 'error')
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Users</h1>
          <p className="page-subtitle">{users.length} total users</p>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {loading ? <div className="loading">Loading…</div> : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Created</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 && (
                <tr><td colSpan={5} className="empty-row">No users found</td></tr>
              )}
              {users.map((u) => (
                <tr key={u.id}>
                  <td className="td-bold">{u.full_name}</td>
                  <td className="td-muted">{u.email}</td>
                  <td>
                    <span className={`badge ${ROLE_COLORS[u.role]}`}>{u.role}</span>
                  </td>
                  <td className="td-muted">{new Date(u.created_at).toLocaleDateString()}</td>
                  <td className="td-actions">
                    <select
                      value={u.role}
                      onChange={(e) => handleRoleChange(u, e.target.value)}
                      className="select-sm"
                    >
                      <option value="admin">admin</option>
                      <option value="staff">staff</option>
                      <option value="doctor">doctor</option>
                      <option value="patient">patient</option>
                    </select>
                    <button
                      className="btn btn-sm btn-danger"
                      onClick={() => setConfirmDelete(u)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {confirmDelete && (
        <ConfirmModal
          message={`Delete ${confirmDelete.full_name}? This cannot be undone.`}
          onConfirm={handleDelete}
          onCancel={() => setConfirmDelete(null)}
        />
      )}
    </div>
  )
}
