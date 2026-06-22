import { useEffect, useState } from 'react'
import { appointmentsApi } from '../api/appointments'
import { useAuth } from '../context/AuthContext'

const STATUS_COLORS = { pending: 'orange', confirmed: 'green', cancelled: 'red' }

export default function Appointments() {
  const { user } = useAuth()
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(true)

  const isDoctor = user?.role === 'doctor'

  function load() {
    setLoading(true)
    appointmentsApi.mine()
      .then(setAppointments)
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  async function handleStatus(id, status) {
    await appointmentsApi.update(id, status)
    load()
  }

  if (loading) return <div className="loading">Loading…</div>

  return (
    <div className="page">
      <div className="page-header">
        <h2>{isDoctor ? 'My Schedule' : 'My Appointments'}</h2>
      </div>

      {appointments.length === 0 ? (
        <p>No appointments yet.</p>
      ) : (
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Time</th>
                {isDoctor ? <th>Patient</th> : <th>Doctor</th>}
                <th>Notes</th>
                <th>Status</th>
                {isDoctor && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {appointments.map((appt) => (
                <tr key={appt.id}>
                  <td>{appt.date}</td>
                  <td>{appt.time_slot}</td>
                  <td>{isDoctor ? appt.patient.full_name : `Dr. ${appt.doctor.full_name}`}</td>
                  <td>{appt.notes || '—'}</td>
                  <td>
                    <span className={`badge badge-${STATUS_COLORS[appt.status]}`}>
                      {appt.status}
                    </span>
                  </td>
                  {isDoctor && (
                    <td>
                      {appt.status === 'pending' && (
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button
                            className="btn btn-primary"
                            style={{ padding: '4px 10px', fontSize: 13 }}
                            onClick={() => handleStatus(appt.id, 'confirmed')}
                          >
                            Confirm
                          </button>
                          <button
                            className="btn btn-secondary"
                            style={{ padding: '4px 10px', fontSize: 13 }}
                            onClick={() => handleStatus(appt.id, 'cancelled')}
                          >
                            Cancel
                          </button>
                        </div>
                      )}
                      {appt.status === 'confirmed' && (
                        <button
                          className="btn btn-secondary"
                          style={{ padding: '4px 10px', fontSize: 13 }}
                          onClick={() => handleStatus(appt.id, 'cancelled')}
                        >
                          Cancel
                        </button>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
