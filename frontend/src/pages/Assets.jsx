import { useState, useEffect, useCallback } from 'react'
import { assetsApi } from '../api/assets'
import { roomsApi } from '../api/rooms'
import { patientsApi } from '../api/patients'
import Modal from '../components/Modal'
import ConfirmModal from '../components/ConfirmModal'
import { toast } from '../components/Toast'

const STATUS_COLORS = {
  available: 'badge-green',
  in_use: 'badge-orange',
  maintenance: 'badge-red',
  retired: 'badge-gray',
}

const EMPTY_FORM = {
  name: '', asset_type: '', serial_number: '',
  room_id: '', patient_id: '', status: 'available', notes: '',
}

export default function Assets() {
  const [data, setData] = useState({ items: [], total: 0, pages: 1 })
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [rooms, setRooms] = useState([])
  const [patients, setPatients] = useState([])
  const [modal, setModal] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(null)

  const load = useCallback(() => {
    setLoading(true)
    assetsApi.list(page).then(setData).catch(() => setError('Failed to load assets')).finally(() => setLoading(false))
  }, [page])

  useEffect(() => { load() }, [load])
  useEffect(() => {
    roomsApi.list().then((d) => setRooms(d.items))
    patientsApi.list(1, 100).then((d) => setPatients(d.items))
  }, [])

  function openAdd() { setForm(EMPTY_FORM); setModal('add') }
  function openEdit(a) {
    setForm({
      name: a.name, asset_type: a.asset_type, serial_number: a.serial_number || '',
      room_id: a.room_id || '', patient_id: a.patient_id || '',
      status: a.status, notes: a.notes || '',
    })
    setModal(a)
  }
  function closeModal() { setModal(null); setError('') }

  async function handleSave(e) {
    e.preventDefault()
    setSaving(true)
    try {
      const payload = {
        ...form,
        room_id: form.room_id ? Number(form.room_id) : null,
        patient_id: form.patient_id ? Number(form.patient_id) : null,
      }
      if (modal === 'add') {
        await assetsApi.create(payload)
        toast('Asset added successfully')
      } else {
        await assetsApi.update(modal.id, payload)
        toast('Asset updated successfully')
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
    await assetsApi.remove(confirmDelete.id)
    setConfirmDelete(null)
    toast('Asset deleted', 'info')
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
          <h1>Assets</h1>
          <p className="page-subtitle">{data.total} total assets</p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>+ Add Asset</button>
      </div>

      {loading ? <div className="loading">Loading…</div> : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Name</th><th>Type</th><th>Serial #</th>
                <th>Room</th><th>Patient</th><th>Status</th><th></th>
              </tr>
            </thead>
            <tbody>
              {data.items.length === 0 && (
                <tr><td colSpan={7} className="empty-row">No assets found</td></tr>
              )}
              {data.items.map((a) => (
                <tr key={a.id}>
                  <td className="td-bold">{a.name}</td>
                  <td>{a.asset_type}</td>
                  <td className="td-muted">{a.serial_number || '—'}</td>
                  <td>{a.room ? a.room.room_number : '—'}</td>
                  <td>{a.patient ? a.patient.full_name : '—'}</td>
                  <td><span className={`badge ${STATUS_COLORS[a.status]}`}>{a.status.replace('_', ' ')}</span></td>
                  <td className="td-actions">
                    <button className="btn btn-sm btn-outline" onClick={() => openEdit(a)}>Edit</button>
                    <button className="btn btn-sm btn-danger" onClick={() => setConfirmDelete(a)}>Delete</button>
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
          message={`Are you sure you want to delete "${confirmDelete.name}"? This cannot be undone.`}
          onConfirm={handleDelete}
          onCancel={() => setConfirmDelete(null)}
        />
      )}

      {modal && (
        <Modal title={modal === 'add' ? 'Add Asset' : 'Edit Asset'} onClose={closeModal}>
          <form onSubmit={handleSave}>
            {error && <div className="alert alert-error">{error}</div>}
            {field('name', 'Name')}
            {field('asset_type', 'Asset Type')}
            {field('serial_number', 'Serial Number')}
            <div className="form-group">
              <label>Room</label>
              <select value={form.room_id} onChange={(e) => setForm({ ...form, room_id: e.target.value })}>
                <option value="">— None —</option>
                {rooms.map((r) => <option key={r.id} value={r.id}>{r.room_number}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Patient</label>
              <select value={form.patient_id} onChange={(e) => setForm({ ...form, patient_id: e.target.value })}>
                <option value="">— None —</option>
                {patients.map((p) => <option key={p.id} value={p.id}>{p.full_name}</option>)}
              </select>
            </div>
            {field('status', 'Status', 'text', [
              ['available', 'Available'], ['in_use', 'In Use'],
              ['maintenance', 'Maintenance'], ['retired', 'Retired'],
            ])}
            <div className="form-group">
              <label>Notes</label>
              <textarea value={form.notes} rows={3}
                onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            </div>
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
