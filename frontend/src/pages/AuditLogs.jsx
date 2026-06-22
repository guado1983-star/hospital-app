import { useEffect, useState } from 'react'
import { adminApi } from '../api/admin'

function formatTimestamp(ts) {
  return new Date(ts).toLocaleString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: true,
  })
}

export default function AuditLogs() {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    adminApi.getAuditLogs()
      .then(setLogs)
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="loading-fullscreen">Loading…</div>

  return (
    <div>
      <div className="page-header">
        <h1>Audit Log</h1>
        <p style={{ color: 'var(--text-muted)', marginTop: 4 }}>{logs.length} entries</p>
      </div>

      <div className="card" style={{ padding: 0 }}>
        {logs.length === 0 ? (
          <p style={{ padding: '24px', color: 'var(--text-muted)' }}>No activity recorded yet.</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Role</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {logs.map(log => (
                <tr key={log.id}>
                  <td style={{ whiteSpace: 'nowrap', color: 'var(--text-muted)', fontSize: '13px' }}>
                    {formatTimestamp(log.timestamp)}
                  </td>
                  <td>
                    <span className={`badge badge-${log.role}`}>{log.role}</span>
                  </td>
                  <td>{log.detail}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
