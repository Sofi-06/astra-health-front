import { useState } from 'react'
import {
  Calendar,
  Globe,
  LogOut,
  Menu,
  Rocket,
  X,
} from 'lucide-react'
import { navItems } from '../../data/dashboardData'
import { formatWhen } from '../../data/format'

function Brand() {
  return (
    <div className="brand">
      <img src="/assets/logo3.png" alt="ASTRA HEALTH Logo" className="brand__logo-img" />
      <div className="brand__text">
        <strong>ASTRA</strong>
        <small>HEALTH</small>
      </div>
    </div>
  )
}

export default function Sidebar({
  activeItem = 'Dashboard',
  onSelect,
  onNotify,
  sessionDay = 145,
  sessionStartedAt,
  onLogout,
}) {
  const [open, setOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(false)

  const selectItem = (label) => {
    setOpen(false)
    const available = [
      'Dashboard',
      'Health Monitor',
      'Mind Tracker',
      'Body Explorer',
      'Space Health Insights',
      'Smart Alerts',
      'Mission Challenges',
      'Health Analytics',
    ]
    if (available.includes(label)) {
      onSelect?.(label)
      return
    }
    onNotify?.(`${label} estará disponible en la próxima misión.`)
  }

  return (
    <>
      <button className="mobile-menu" onClick={() => setOpen(true)} aria-label="Abrir navegación">
        <Menu size={21} />
      </button>

      <button
        className={`sidebar-backdrop ${open ? 'is-visible' : ''}`}
        onClick={() => setOpen(false)}
        aria-label="Cerrar navegación"
      />

      <aside id="main-sidebar" className={`sidebar glass-panel ${open ? 'is-open' : ''} ${collapsed ? 'is-collapsed' : ''}`}>
        <button
          className="sidebar__close"
          onClick={() => setOpen(false)}
          aria-label="Cerrar navegación"
          type="button"
        >
          <X size={18} />
        </button>

        <button
          className="sidebar__collapse"
          onClick={() => setCollapsed((current) => !current)}
          aria-label={collapsed ? 'Expandir navegación' : 'Reducir navegación'}
          aria-expanded={!collapsed}
          aria-controls="main-sidebar"
          title={collapsed ? 'Expandir menú' : 'Reducir menú'}
          type="button"
        >
          <Menu size={18} />
        </button>

        <Brand />

        <nav className="sidebar__nav" aria-label="Navegación principal">
          {navItems.map(({ label, icon: Icon }) => (
            <button
              key={label}
              className={`nav-item ${activeItem === label ? 'nav-item--active' : ''}`}
              onClick={() => selectItem(label)}
              title={collapsed ? label : undefined}
              aria-label={label}
              type="button"
            >
              <Icon size={16} strokeWidth={1.6} />
              <span>{label}</span>
            </button>
          ))}
        </nav>

        <div className="mission-card" title={collapsed ? `Día ${sessionDay} de misión` : undefined}>
          <div className="mission-card__badge">
            <Rocket size={13} className="mission-card__rocket-icon" />
            <span className="eyebrow">MISSION CONTEXT</span>
          </div>

          <strong className="mission-card__day">Día {sessionDay}</strong>

          <div className="mission-card__lines">
            <p>
              <Calendar size={12} />
              <span>Inicio: {sessionStartedAt ? formatWhen(sessionStartedAt) : '14/11/26, 2:08 p.m.'}</span>
            </p>
            <p>
              <Globe size={12} />
              <span>Misión orbital · Microgravedad</span>
            </p>
          </div>

          <p className="mission-card__demo">Ambientación ficticia · solo decorativa</p>
        </div>

        {onLogout && (
          <button
            className="sidebar__logout-btn"
            onClick={onLogout}
            title="Cerrar sesión"
            aria-label="Cerrar sesión"
            type="button"
          >
            <LogOut size={14} />
            <span>Cerrar sesión</span>
          </button>
        )}
      </aside>
    </>
  )
}
