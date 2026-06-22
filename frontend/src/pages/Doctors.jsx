import { useEffect, useState } from 'react'
import { doctorsApi, appointmentsApi } from '../api/appointments'

export default function Doctors() {
  const [doctors, setDoctors] = useState([])
  const [selected, setSelected] = useState(null)
  const [date, setDate] = useState('')
  const [slots, setSlots] = useState([])
  const [pickedSlot, setPickedSlot] = useState('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(true)
  const [slotsLoading, setSlotsLoading] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    doctorsApi.list()
      .then(setDoctors)
      .finally(() => setLoading(false))
  }, [])

  async function loadSlots(doctorId, chosenDate) {
    if (!doctorId || !chosenDate) return
    setSlotsLoading(true)
    setPickedSlot('')
    try {
      const data = await doctorsApi.slots(doctorId, chosenDate)
      setSlots(data.slots)
    } finally {
      setSlotsLoading(false)
    }
  }

  function selectDoctor(doctor) {
    setSelected(doctor)
    setDate('')
    setSlots([])
    setPickedSlot('')
    setSuccess('')
    setError('')
  }

  async function handleBook(e) {
    e.preventDefault()
    setError('')
    try {
      await appointmentsApi.book({
        doctor_id: selected.id,
        date,
        time_slot: pickedSlot,
        notes: notes || null,
      })
      setSuccess(`Appointment booked with Dr. ${selected.full_name} on ${date} at ${pickedSlot}`)
      setSelected(null)
      setDate('')
      setSlots([])
      setPickedSlot('')
      setNotes('')
    } catch (err) {
      setError(err.message)
    }
  }

  if (loading) return <div className="loading">Loading doctors…</div>

  return (
    <div className="page">
      <div className="page-header">
        <h2>Book an Appointment</h2>
      </div>

      {success && <div className="alert alert-success" style={{ marginBottom: '16px' }}>{success}</div>}

      {!selected ? (
        <div className="stats-grid">
          {doctors.length === 0 && <p>No doctors available yet.</p>}
          {doctors.map((doc) => (
            <div key={doc.id} className="card" style={{ padding: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                <div className="user-avatar" style={{ width: 48, height: 48, fontSize: 20 }}>
                  {doc.full_name[0].toUpperCase()}
                </div>
                <div>
                  <div style={{ fontWeight: 600 }}>Dr. {doc.full_name}</div>
                  <div style={{ fontSize: 13, color: '#6b7280' }}>{doc.email}</div>
                </div>
              </div>
              <button className="btn btn-primary btn-full" onClick={() => selectDoctor(doc)}>
                Book Appointment
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="card" style={{ maxWidth: 480, padding: '24px' }}>
          <h3 style={{ marginBottom: '16px' }}>Dr. {selected.full_name}</h3>

          {error && <div className="alert alert-error" style={{ marginBottom: '12px' }}>{error}</div>}

          <form onSubmit={handleBook}>
            <div className="form-group">
              <label>Select a Date</label>
              <input
                type="date"
                value={date}
                min={new Date().toISOString().split('T')[0]}
                onChange={(e) => {
                  setDate(e.target.value)
                  loadSlots(selected.id, e.target.value)
                }}
                required
              />
            </div>

            {date && (
              <div className="form-group">
                <label>Available Time Slots</label>
                {slotsLoading ? (
                  <p style={{ fontSize: 14 }}>Loading slots…</p>
                ) : slots.length === 0 ? (
                  <p style={{ fontSize: 14, color: '#ef4444' }}>No available slots on this date.</p>
                ) : (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {slots.map((slot) => (
                      <button
                        key={slot}
                        type="button"
                        onClick={() => setPickedSlot(slot)}
                        className={`btn ${pickedSlot === slot ? 'btn-primary' : 'btn-secondary'}`}
                        style={{ minWidth: 80 }}
                      >
                        {slot}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="form-group">
              <label>Notes (optional)</label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Reason for visit…"
              />
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={!pickedSlot}
                style={{ flex: 1 }}
              >
                Confirm Booking
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setSelected(null)}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
