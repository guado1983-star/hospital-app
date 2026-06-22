import { useEffect, useState } from 'react'
import { api } from '../api/client'

export default function MyChart() {
  const [chart, setChart] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    api.get('/patients/me')
      .then(setChart)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="loading-fullscreen">Loading your chart…</div>
  if (error) return (
    <div className="page">
      <div className="page-header"><h2>My Chart</h2></div>
      <p>Your chart has not been set up yet. Please contact hospital staff.</p>
    </div>
  )

  return (
    <div className="page">
      <div className="page-header">
        <h2>My Chart</h2>
      </div>

      <div className="card" style={{ maxWidth: '600px' }}>
        <table className="detail-table">
          <tbody>
            <tr><th>Name</th><td>{chart.full_name}</td></tr>
            <tr><th>Date of Birth</th><td>{chart.date_of_birth || '—'}</td></tr>
            <tr><th>Gender</th><td>{chart.gender || '—'}</td></tr>
            <tr><th>Status</th><td><span className={`badge badge-${chart.status}`}>{chart.status}</span></td></tr>
            <tr><th>Diagnosis</th><td>{chart.diagnosis || '—'}</td></tr>
            <tr><th>Room</th><td>{chart.room ? `Room ${chart.room.room_number}` : 'Not assigned'}</td></tr>
            <tr><th>Admitted</th><td>{new Date(chart.admitted_date).toLocaleDateString()}</td></tr>
            {chart.discharged_date && (
              <tr><th>Discharged</th><td>{new Date(chart.discharged_date).toLocaleDateString()}</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
