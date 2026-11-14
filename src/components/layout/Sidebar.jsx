import { useState } from 'react'
import { Menu, Radio, X } from 'lucide-react'
import { navItems } from '../../data/dashboardData'

function Brand() {
  return (
    <div className="brand">
      <div className="brand__mark" aria-hidden="true">
        <img src="/assets/logo3.png" alt="" />
      </div>
      <div>
        <strong>ASTRA</strong>
        <small>HEALTH SYSTEM</small>
      </div>
    </div>
  )
}

export default function Sidebar({ onNotify }) {
  const [open, setOpen] = useState(false)

  const selectItem = (label) => {
    setOpen(false)
    if (label !== 'Dashboard') onNotify(`${label} estará disponible en la próxima misión.`)
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
      <aside className={`sidebar glass-panel ${open ? 'is-open' : ''}`}>
        <button className="sidebar__close" onClick={() => setOpen(false)} aria-label="Cerrar navegación"><X /></button>
        <Brand />
        <nav className="sidebar__nav" aria-label="Navegación principal">
          {navItems.map(({ label, icon: Icon }, index) => (
            <button
              key={label}
              className={`nav-item ${index === 0 ? 'nav-item--active' : ''}`}
              onClick={() => selectItem(label)}
            >
              <Icon size={15} strokeWidth={1.5} />
              <span>{label}</span>
            </button>
          ))}
        </nav>
        <div className="mission-card">
          <span className="eyebrow">MISSION CONTEXT</span>
          <strong>Día 145</strong>
          <p>Misión orbital · Microgravedad</p>
          <p>Enlace con la Tierra estable</p>
          <p className="mission-card__signal"><Radio size={12} /> Retraso de señal: 0.4 s</p>
        </div>
      </aside>
    </>
  )
}
