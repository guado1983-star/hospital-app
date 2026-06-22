import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const allNavItems = [
  { to: '/', label: 'Dashboard', icon: '⊞', roles: ['admin', 'staff', 'doctor'] },
  { to: '/patients', label: 'Patients', icon: '👤', roles: ['admin', 'staff', 'doctor'] },
  { to: '/rooms', label: 'Rooms', icon: '🏥', roles: ['admin', 'staff'] },
  { to: '/assets', label: 'Assets', icon: '🔧', roles: ['admin', 'staff'] },
  { to: '/appointments', label: 'My Schedule', icon: '📅', roles: ['doctor'] },
  { to: '/my-chart', label: 'My Chart', icon: '📋', roles: ['patient'] },
  { to: '/doctors', label: 'Book Appointment', icon: '📅', roles: ['patient'] },
  { to: '/appointments', label: 'My Appointments', icon: '🗓', roles: ['patient'] },
  { to: '/users', label: 'Users', icon: '👥', roles: ['admin'] },
  { to: '/audit-logs', label: 'Audit Log', icon: '📋', roles: ['admin'] },
]

export default function Layout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const navItems = allNavItems.filter((item) => item.roles.includes(user?.role))

  function handleLogout() {
    logout()
    navigate('/login')
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <span className="brand-icon">+</span>
          <span className="brand-name">HospitalTracker</span>
        </div>
        <nav className="sidebar-nav">
          {navItems.map(({ to, label, icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              <span className="nav-icon">{icon}</span>
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-footer">
          <div className="user-info">
            <div className="user-avatar">{user?.full_name?.[0]?.toUpperCase()}</div>
            <div className="user-details">
              <div className="user-name">{user?.full_name}</div>
              <div className="user-role">{user?.role}</div>
            </div>
          </div>
          <button className="btn-logout" onClick={handleLogout}>Logout</button>
        </div>
      </aside>
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  )
}
