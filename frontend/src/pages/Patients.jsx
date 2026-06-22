import { useState, useEffect, useCallback } from 'react'
import DatePicker from 'react-datepicker'
import { parseISO, format, isValid } from 'date-fns'
import 'react-datepicker/dist/react-datepicker.css'
import { toast } from '../components/Toast'
import ConfirmModal from '../components/ConfirmModal'
import { patientsApi } from '../api/patients'
import { roomsApi } from '../api/rooms'
import Modal from '../components/Modal'

const STATUS_COLORS = {
  admitted: 'badge-blue',
  discharged: 'badge-gray',
  critical: 'badge-red',
  stable: 'badge-green',
  observation: 'badge-orange',
}

const EMPTY_FORM = {
  full_name: '', date_of_birth: '', gender: '', room_id: '',
  status: 'admitted', diagnosis: '',
}

export default function Patients() {
  const [data, setData] = useState({ items: [], total: 0, pages: 1 })
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [rooms, setRooms] = useState([])
  const [roomsLoading, setRoomsLoading] = useState(false)
  const [modal, setModal] = useState(null) // null | 'add' | {patient}
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(null)

  const load = useCallback(() => {
    setLoading(true)
    patientsApi.list(page, 20, search, statusFilter).then(setData).catch(() => setError('Failed to load patients')).finally(() => setLoading(false))
  }, [page, search, statusFilter])

  useEffect(() => { setPage(1) }, [search, statusFilter])

  function loadRooms() {
    setRoomsLoading(true)
    roomsApi.list().then((d) => setRooms(d.items)).catch(() => setError('Failed to load rooms — is the server running?')).finally(() => setRoomsLoading(false))
  }

  useEffect(() => { load() }, [load])

  function openAdd() { setForm(EMPTY_FORM); setModal('add'); loadRooms() }
  function openEdit(p) {
    setForm({
      full_name: p.full_name, date_of_birth: p.date_of_birth || '',
      gender: p.gender || '', room_id: p.room_id || '',
      status: p.status, diagnosis: p.diagnosis || '',
    })
    setModal(p)
    loadRooms()
  }
  function closeModal() { setModal(null); setError('') }

  async function handleSave(e) {
    e.preventDefault()
    setSaving(true)
    try {
      const payload = { ...form, room_id: form.room_id ? Number(form.room_id) : null }
      if (modal === 'add') {
        await patientsApi.create(payload)
        toast('Patient added successfully')
      } else {
        await patientsApi.update(modal.id, payload)
        toast('Patient updated successfully')
      }
      closeModal()
      load()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    await patientsApi.remove(confirmDelete.id)
    setConfirmDelete(null)
    toast('Patient deleted', 'info')
    load()
  }

  const field = (name, label, type = 'text', opts) => (
    <div className="form-group">
      <label>{label}</label>
      {opts ? (
        <select value={form[name]} onChange={(e) => setForm({ ...form, [name]: e.target.value })}>
          {opts.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
      ) : (
        <input type={type} value={form[name]}
          onChange={(e) => setForm({ ...form, [name]: e.target.value })} />
      )}
    </div>
  )

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Patients</h1>
          <p className="page-subtitle">{data.total} total patients</p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>+ Add Patient</button>
      </div>

      <div className="search-bar">
        <input
          type="text"
          placeholder="Search by name…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="search-input"
        />
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="search-select">
          <option value="">All Statuses</option>
          <option value="admitted">Admitted</option>
          <option value="stable">Stable</option>
          <option value="critical">Critical</option>
          <option value="observation">Observation</option>
          <option value="discharged">Discharged</option>
        </select>
      </div>

      {loading ? <div className="loading">Loading…</div> : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Name</th><th>DOB</th><th>Gender</th>
                <th>Room</th><th>Status</th><th>Diagnosis</th><th></th>
              </tr>
            </thead>
            <tbody>
              {data.items.length === 0 && (
                <tr><td colSpan={7} className="empty-row">No patients found</td></tr>
              )}
              {data.items.map((p) => (
                <tr key={p.id}>
                  <td className="td-bold">{p.full_name}</td>
                  <td>{p.date_of_birth || '—'}</td>
                  <td>{p.gender || '—'}</td>
                  <td>{p.room ? p.room.room_number : '—'}</td>
                  <td><span className={`badge ${STATUS_COLORS[p.status]}`}>{p.status}</span></td>
                  <td className="td-muted">{p.diagnosis || '—'}</td>
                  <td className="td-actions">
                    <button className="btn btn-sm btn-outline" onClick={() => openEdit(p)}>Edit</button>
                    <button className="btn btn-sm btn-danger" onClick={() => setConfirmDelete(p)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {data.pages > 1 && (
        <div className="pagination">
          <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="btn btn-sm btn-outline">Prev</button>
          <span>Page {page} of {data.pages}</span>
          <button disabled={page === data.pages} onClick={() => setPage(p => p + 1)} className="btn btn-sm btn-outline">Next</button>
        </div>
      )}

      {confirmDelete && (
        <ConfirmModal
          message={`Are you sure you want to delete ${confirmDelete.full_name}? This cannot be undone.`}
          onConfirm={handleDelete}
          onCancel={() => setConfirmDelete(null)}
        />
      )}

      {modal && (
        <Modal title={modal === 'add' ? 'Add Patient' : 'Edit Patient'} onClose={closeModal}>
          <form onSubmit={handleSave}>
            {error && <div className="alert alert-error">{error}</div>}
            {field('full_name', 'Full Name')}
            <div className="form-group">
              <label>Date of Birth</label>
              <DatePicker
                selected={form.date_of_birth && isValid(parseISO(form.date_of_birth)) ? parseISO(form.date_of_birth) : null}
                onChange={(date) => setForm({ ...form, date_of_birth: date ? format(date, 'yyyy-MM-dd') : '' })}
                dateFormat="yyyy-MM-dd"
                placeholderText="YYYY-MM-DD"
                showYearDropdown
                scrollableYearDropdown
                yearDropdownItemNumber={100}
                popperPlacement="top-start"
                className="datepicker-input"
                wrapperClassName="datepicker-wrapper"
                isClearable
              />
            </div>
            {field('gender', 'Gender', 'text', [['', '—'], ['Male', 'Male'], ['Female', 'Female'], ['Other', 'Other']])}
            <div className="form-group">
              <label>Room</label>
              <select value={form.room_id} onChange={(e) => setForm({ ...form, room_id: e.target.value })} disabled={roomsLoading}>
                <option value="">{roomsLoading ? 'Loading rooms…' : rooms.length === 0 ? 'No rooms — add one in the Rooms page' : '— No room —'}</option>
                {rooms.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.room_number} (Floor {r.floor}) — {r.status}
                  </option>
                ))}
              </select>
            </div>
            {field('status', 'Status', 'text', [
              ['admitted', 'Admitted'], ['stable', 'Stable'], ['critical', 'Critical'],
              ['observation', 'Observation'], ['discharged', 'Discharged'],
            ])}
            {field('diagnosis', 'Diagnosis')}
            <div className="modal-actions">
              <button type="button" className="btn btn-outline" onClick={closeModal}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? 'Saving…' : 'Save'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
