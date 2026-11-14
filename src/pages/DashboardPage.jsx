import { useState } from 'react'
import Sidebar from '../components/layout/Sidebar'
import DashboardHeader from '../components/layout/DashboardHeader'
import ProfileCard from '../components/dashboard/ProfileCard'
import MetricCard from '../components/dashboard/MetricCard'
import TasksPanel from '../components/dashboard/TasksPanel'
import HumanVisualizer from '../components/dashboard/HumanVisualizer'
import StatusPanel from '../components/dashboard/StatusPanel'
import TrendsPanel from '../components/dashboard/TrendsPanel'
import VitalsModal from '../components/modals/VitalsModal'
import useHealthData from '../hooks/useHealthData'
import { METRIC_LABELS } from '../data/format'

const CARDS = ['heart_rate', 'sleep', 'blood_pressure', 'oxygen_saturation']

export default function DashboardPage({ onNotify }) {
  const [modalOpen, setModalOpen] = useState(false)
  const { latest, count, entries, history, error, reload } = useHealthData()

  const saved = async () => {
    await reload()
    onNotify('Registro confirmado y guardado en SQLite.')
  }

  return (
    <main className="app-shell">
      <div className="space-vignette" />
      <Sidebar onNotify={onNotify} />
      <div className="dashboard-content">
        <DashboardHeader onNotify={onNotify} />
        <div className="dashboard-grid">
          <div className="dashboard-column dashboard-column--left">
            <ProfileCard lastEntry={entries[0]} />
            <div className="metrics-grid">
              {CARDS.map((code) => <MetricCard key={code} label={METRIC_LABELS[code]} entry={latest[code]} />)}
            </div>
            <TasksPanel onOpenVitals={() => setModalOpen(true)} latest={latest} />
          </div>
          <HumanVisualizer latest={latest} />
          <div className="dashboard-column dashboard-column--right">
            <StatusPanel latest={latest} count={count} error={error} />
            <TrendsPanel history={history} />
          </div>
        </div>
      </div>
      <VitalsModal open={modalOpen} onClose={() => setModalOpen(false)} onSaved={saved} />
    </main>
  )
}
