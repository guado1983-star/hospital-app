import { useState, useEffect, useCallback } from 'react'
import { roomsApi } from '../api/rooms'
import Modal from '../components/Modal'
import ConfirmModal from '../components/ConfirmModal'
import { toast } from '../components/Toast'

const STATUS_COLORS = {
  available: 'badge-green',
  occupied: 'badge-orange',
  maintenance: 'badge-red',
  reserved: 'badge-blue',
}

const EMPTY_FORM = { room_number: '', floor: '', capacity: '1', status: 'available' }

export default function Rooms() {
  const [data, setData] = useState({ items: [], total: 0, pages: 1 })
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [modal, setModal] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(null)

  const load = useCallback(() => {
    setLoading(true)
    roomsApi.list(page).then(setData).catch(() => setError('Failed to load rooms')).finally(() => setLoading(false))
  }, [page])

  useEffect(() => { load() }, [load])

  function openAdd() { setForm(EMPTY_FORM); setModal('add') }
  function openEdit(r) {
    setForm({ room_number: r.room_number, floor: String(r.floor), capacity: String(r.capacity), status: r.status })
    setModal(r)
  }
  function closeModal() { setModal(null); setError('') }

  async function handleSave(e) {
    e.preventDefault()
    setSaving(true)
    try {
      const payload = { ...form, floor: Number(form.floor), capacity: Number(form.capacity) }
      if (modal === 'add') {
        await roomsApi.create(payload)
        toast('Room added successfully')
      } else {
        await roomsApi.update(modal.id, payload)
        toast('Room updated successfully')
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
    await roomsApi.remove(confirmDelete.id)
    setConfirmDelete(null)
    toast('Room deleted', 'info')
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
        <input type={type} value={form[name]} required
          onChange={(e) => setForm({ ...form, [name]: e.target.value })} />
      )}
    </div>
  )

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Rooms</h1>
          <p className="page-subtitle">{data.total} total rooms</p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>+ Add Room</button>
      </div>

      {loading ? <div className="loading">Loading…</div> : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr><th>Room #</th><th>Floor</th><th>Capacity</th><th>Status</th><th></th></tr>
            </thead>
            <tbody>
              {data.items.length === 0 && (
                <tr><td colSpan={5} className="empty-row">No rooms found</td></tr>
              )}
              {data.items.map((r) => (
                <tr key={r.id}>
                  <td className="td-bold">{r.room_number}</td>
                  <td>{r.floor}</td>
                  <td>{r.capacity}</td>
                  <td><span className={`badge ${STATUS_COLORS[r.status]}`}>{r.status}</span></td>
                  <td className="td-actions">
                    <button className="btn btn-sm btn-outline" onClick={() => openEdit(r)}>Edit</button>
                    <button className="btn btn-sm btn-danger" onClick={() => setConfirmDelete(r)}>Delete</button>
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
          message={`Are you sure you want to delete Room ${confirmDelete.room_number}? This cannot be undone.`}
          onConfirm={handleDelete}
          onCancel={() => setConfirmDelete(null)}
        />
      )}

      {modal && (
        <Modal title={modal === 'add' ? 'Add Room' : 'Edit Room'} onClose={closeModal}>
          <form onSubmit={handleSave}>
            {error && <div className="alert alert-error">{error}</div>}
            {field('room_number', 'Room Number')}
            {field('floor', 'Floor', 'number')}
            {field('capacity', 'Capacity', 'number')}
            {field('status', 'Status', 'text', [
              ['available', 'Available'], ['occupied', 'Occupied'],
              ['maintenance', 'Maintenance'], ['reserved', 'Reserved'],
            ])}
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
