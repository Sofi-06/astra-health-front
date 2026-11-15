import { useState } from 'react'
import { LogOut } from 'lucide-react'
import Sidebar from '../components/layout/Sidebar'
import HealthMonitorPage from './HealthMonitorPage'
import MindTrackerPage from './MindTrackerPage'
import BodyExplorerPage from './BodyExplorerPage'
import SpaceHealthInsightsPage from './SpaceHealthInsightsPage'
import SmartAlertsPage from './SmartAlertsPage'
import MissionChallengesPage from './MissionChallengesPage'
import HealthAnalyticsPage from './HealthAnalyticsPage'
import ProfileCard from '../components/dashboard/ProfileCard'
import MetricCard from '../components/dashboard/MetricCard'
import TasksPanel from '../components/dashboard/TasksPanel'
import HumanVisualizer from '../components/dashboard/HumanVisualizer'
import TrendsPanel from '../components/dashboard/TrendsPanel'
import SleepAnalysisPanel from '../components/dashboard/SleepAnalysisPanel'
import VitalsModal from '../components/modals/VitalsModal'
import useHealthData from '../hooks/useHealthData'
import { updateProfileImage } from '../api/client'

const CARD_ORDER = [
  'heart_rate',
  'sleep',
  'blood_pressure',
  'oxygen_saturation',
  'temperature',
  'glucose',
]

export default function DashboardPage({ onNotify, session, onLogout, onUserUpdated }) {
  const [activePage, setActivePage] = useState('Dashboard')
  const [modalOpen, setModalOpen] = useState(false)
  const { latest, entries, history, sleep, reload } = useHealthData()
  const sessionStartedAt = session?.created_at
  const sessionDay = sessionStartedAt
    ? Math.max(0, Math.floor((Date.now() - new Date(sessionStartedAt).getTime()) / 86400000))
    : 0

  const saved = async () => {
    await reload()
    onNotify?.('Registro confirmado y guardado en SQLite.')
  }

  const saveProfileImage = async (url) => {
    const user = await updateProfileImage(url)
    onUserUpdated?.(user)
    onNotify?.(url ? 'Foto de perfil actualizada.' : 'Se restauró la imagen predeterminada.')
  }

  const renderDashboard = () => (
    <div className="dashboard-main-layout">
      {/* Columna Izquierda: Información clínica, métricas y tareas */}
      <div className="dashboard-content-column">
        {/* Profile Card con datos reales */}
        <ProfileCard
          user={session?.user}
          sessionDay={sessionDay}
          sessionStartedAt={sessionStartedAt}
          lastEntry={entries[0]}
          onChangeProfileImage={saveProfileImage}
        />

        {/* 6 Tarjetas de Métricas con datos reales */}
        <div className="metrics-grid-pro">
          {CARD_ORDER.map((code) => (
            <MetricCard
              key={code}
              code={code}
              entry={latest[code]}
              historySeries={history?.[code]?.series?.[0]}
              onOpenRegister={() => setModalOpen(true)}
            />
          ))}
        </div>

        {/* Fila: Pendientes de hoy + Análisis de sueño */}
        <div className="dashboard-tasks-sleep-row">
          <TasksPanel onOpenVitals={() => setModalOpen(true)} />
          <SleepAnalysisPanel
            analysis={sleep}
            onReload={reload}
            onNotify={onNotify}
            onOpenVitals={() => setModalOpen(true)}
          />
        </div>

        {/* Fila Inferior: Tendencias extendida a ancho completo */}
        <div className="dashboard-trends-row">
          <TrendsPanel history={history} onOpenVitals={() => setModalOpen(true)} />
        </div>
      </div>

      {/* Columna Derecha: Humano Holográfico 3D */}
      <div className="dashboard-visualizer-column">
        <HumanVisualizer latest={latest} />
      </div>
    </div>
  )

  const renderPage = () => {
    if (activePage === 'Health Monitor') return <HealthMonitorPage onNotify={onNotify} onOpenVitals={() => setModalOpen(true)} />
    if (activePage === 'Mind Tracker') return <MindTrackerPage onNotify={onNotify} />
    if (activePage === 'Body Explorer') return <BodyExplorerPage onNotify={onNotify} />
    if (activePage === 'Space Health Insights') {
      return <SpaceHealthInsightsPage onNotify={onNotify} sessionDay={sessionDay} />
    }
    if (activePage === 'Smart Alerts') {
      return <SmartAlertsPage onNotify={onNotify} onOpenVitals={() => setModalOpen(true)} />
    }
    if (activePage === 'Mission Challenges') {
      return <MissionChallengesPage onNotify={onNotify} onOpenVitals={() => setModalOpen(true)} sessionDay={sessionDay} />
    }
    if (activePage === 'Health Analytics') {
      return <HealthAnalyticsPage onNotify={onNotify} sessionDay={sessionDay} />
    }
    return renderDashboard()
  }

  return (
    <main className="app-shell-pro">
      <div className="space-vignette" />

      {/* Sidebar fijo a la izquierda */}
      <Sidebar
        activeItem={activePage}
        onSelect={setActivePage}
        onNotify={onNotify}
        sessionDay={sessionDay}
        sessionStartedAt={sessionStartedAt}
        onLogout={onLogout}
      />

      {/* Contenido principal del dashboard */}
      <div className="dashboard-viewport">
        {/* Barra superior con onda ECG y botón de cierre de sesión */}
        <header className="dashboard-top-bar">
          <div className="dashboard-top-bar__status">
            <svg className="ecg-pulse-svg" viewBox="0 0 50 18" fill="none" aria-hidden="true">
              <path
                d="M 0 9 H 14 L 18 2 L 23 16 L 27 6 L 30 11 L 33 9 H 50"
                stroke="#31dcff"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            {onLogout && (
              <button
                className="top-bar-logout-btn"
                onClick={onLogout}
                title="Cerrar sesión"
                type="button"
              >
                <LogOut size={13} />
                <span>Cerrar sesión</span>
              </button>
            )}
          </div>
        </header>

        {renderPage()}
      </div>

      <VitalsModal open={modalOpen} onClose={() => setModalOpen(false)} onSaved={saved} />
    </main>
  )
}
