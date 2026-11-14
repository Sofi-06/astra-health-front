import { Bell, ChevronDown } from 'lucide-react'

const headerCopy = {
  Dashboard: { title: 'Centro de control', subtitle: 'DASHBOARD · ¿CÓMO ESTOY HOY? ¿QUÉ DEBO HACER?' },
  'Health Monitor': { title: 'Monitoreo físico', subtitle: 'HEALTH MONITOR · SIGNOS VITALES · METABOLISMO · SUEÑO · SÍNTOMAS' },
  'Mind Tracker': { title: 'Bienestar psicológico', subtitle: 'MIND TRACKER · CHECK-IN · DIARIO · EVOLUCIÓN' },
  'Body Explorer': { title: 'Cuerpo humano', subtitle: 'BODY EXPLORER · EXPLORA CADA SISTEMA.' },
}

export default function DashboardHeader({ page = 'Dashboard', onNotify }) {
  const copy = headerCopy[page] ?? headerCopy.Dashboard

  return (
    <header className="dashboard-header">
      <div><h1>{copy.title}</h1><p>{copy.subtitle}</p></div>
      <div className="dashboard-header__actions">
        <span className="prototype-pill">PROTOTIPO · DATOS SIMULADOS</span>
        {page === 'Dashboard' && <button className="icon-button" onClick={() => onNotify('No tienes alertas críticas nuevas.')} aria-label="Notificaciones"><Bell size={16} /><i /></button>}
        <button className="user-pill" onClick={() => onNotify('Perfil de la comandante Rivera.')}>Cdte. A. Rivera <ChevronDown size={13} /></button>
        <div className="avatar avatar--small" aria-hidden="true" />
      </div>
    </header>
  )
}
