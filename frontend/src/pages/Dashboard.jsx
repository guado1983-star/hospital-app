import { useState, useEffect } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { patientsApi } from '../api/patients'
import { roomsApi } from '../api/rooms'
import { assetsApi } from '../api/assets'
import { useAuth } from '../context/AuthContext'

function StatCard({ label, value, color, to }) {
  const inner = (
    <div className={`stat-card stat-${color}`}>
      <div className="stat-value">{value ?? '—'}</div>
      <div className="stat-label">{label}</div>
    </div>
  )
  return to ? <Link to={to} className="stat-card-link">{inner}</Link> : inner
}

export default function Dashboard() {
  const { user } = useAuth()
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user?.role === 'patient') return
    Promise.all([
      patientsApi.list(1, 1),
      roomsApi.list(1, 100),
      assetsApi.list(1, 1),
    ]).then(([patients, rooms, assets]) => {
      const available = rooms.items.filter((r) => r.status === 'available').length
      const occupied = rooms.items.filter((r) => r.status === 'occupied').length
      const maintenance = rooms.items.filter((r) => r.status === 'maintenance').length
      setStats({
        patients: patients.total,
        rooms: rooms.total,
        assets: assets.total,
        roomsAvailable: available,
        roomsOccupied: occupied,
        roomsMaintenance: maintenance,
      })
    }).catch(() => setStats({})).finally(() => setLoading(false))
  }, [user])

  if (user?.role === 'patient') return <Navigate to="/my-chart" replace />

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Dashboard</h1>
          <p className="page-subtitle">Welcome back, {user?.full_name}</p>
        </div>
      </div>

      {loading ? (
        <div className="loading">Loading…</div>
      ) : !stats || Object.keys(stats).length === 0 ? (
        <div className="alert alert-error">Could not load stats — make sure the backend is running.</div>
      ) : (
        <>
          <div className="stats-grid">
            <StatCard label="Total Patients" value={stats.patients} color="blue" to="/patients" />
            <StatCard label="Total Rooms" value={stats.rooms} color="green" to="/rooms" />
            <StatCard label="Total Assets" value={stats.assets} color="purple" to="/assets" />
          </div>
          <h2 className="section-title">Room Availability</h2>
          <div className="stats-grid">
            <StatCard label="Available" value={stats.roomsAvailable} color="green" />
            <StatCard label="Occupied" value={stats.roomsOccupied} color="orange" />
            <StatCard label="Maintenance" value={stats.roomsMaintenance} color="red" />
          </div>
        </>
      )}
    </div>
  )
}
