import { Bell, ChevronDown } from 'lucide-react'

export default function DashboardHeader({ onNotify }) {
  return (
    <header className="dashboard-header">
      <div>
        <h1>Centro de control</h1>
        <p>DASHBOARD · ¿CÓMO ESTOY HOY? ¿QUÉ DEBO HACER?</p>
      </div>
      <div className="dashboard-header__actions">
        <span className="prototype-pill">PROTOTIPO · DATOS SIMULADOS</span>
        <button className="icon-button" onClick={() => onNotify('Este prototipo no genera alertas clínicas.')} aria-label="Notificaciones">
          <Bell size={16} />
          <i />
        </button>
        <button className="user-pill" onClick={() => onNotify('Perfil de la comandante Rivera.')}>
          Cdte. A. Rivera <ChevronDown size={13} />
        </button>
        <div className="avatar avatar--small" aria-hidden="true" />
      </div>
    </header>
  )
}
