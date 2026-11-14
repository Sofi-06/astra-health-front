import { useState } from 'react'
import Sidebar from '../components/layout/Sidebar'
import DashboardHeader from '../components/layout/DashboardHeader'
import HealthMonitorPage from './HealthMonitorPage'
import MindTrackerPage from './MindTrackerPage'
import BodyExplorerPage from './BodyExplorerPage'
import ProfileCard from '../components/dashboard/ProfileCard'
import MetricCard from '../components/dashboard/MetricCard'
import TasksPanel from '../components/dashboard/TasksPanel'
import HumanVisualizer from '../components/dashboard/HumanVisualizer'
import StatusPanel from '../components/dashboard/StatusPanel'
import TrendsPanel from '../components/dashboard/TrendsPanel'
import SleepAnalysisPanel from '../components/dashboard/SleepAnalysisPanel'
import VitalsModal from '../components/modals/VitalsModal'
import useHealthData from '../hooks/useHealthData'
import { METRIC_LABELS } from '../data/format'

const CARDS = ['heart_rate', 'sleep', 'blood_pressure', 'oxygen_saturation']

export default function DashboardPage({ onNotify }) {
  const [activePage, setActivePage] = useState('Dashboard')
  const [reviewed, setReviewed] = useState([])
  const [modalOpen, setModalOpen] = useState(false)
  const { latest, count, entries, history, sleep, error, reload } = useHealthData()

  const saved = async () => {
    await reload()
    onNotify('Registro confirmado y guardado en SQLite.')
  }

  const renderPage = () => {
    if (activePage === 'Health Monitor') return <HealthMonitorPage onNotify={onNotify} />
    if (activePage === 'Mind Tracker') return <MindTrackerPage onNotify={onNotify} />
    if (activePage === 'Body Explorer') return <BodyExplorerPage onNotify={onNotify} />

    return <div className="dashboard-grid">
      <div className="dashboard-column dashboard-column--left">
        <ProfileCard />
        <div className="metrics-grid">
          {metrics.map((metric) => <MetricCard key={metric.id} metric={metric} reviewed={reviewed.includes(metric.id)} onReview={() => reviewMetric(metric.id)} />)}
        </div>
        <TasksPanel onOpenVitals={() => setModalOpen(true)} onNotify={onNotify} />
      </div>
      <HumanVisualizer />
      <div className="dashboard-column dashboard-column--right">
        <StatusPanel />
        <TrendsPanel />
      </div>
    </div>
  }

  return (
    <main className="app-shell">
      <div className="space-vignette" />
      <Sidebar activeItem={activePage} onSelect={setActivePage} onNotify={onNotify} />
      <div className="dashboard-content">
        <DashboardHeader page={activePage} onNotify={onNotify} />
        {renderPage()}
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
            <SleepAnalysisPanel analysis={sleep} onReload={reload} onNotify={onNotify} />
          </div>
        </div>
      </div>
      <VitalsModal open={modalOpen} onClose={() => setModalOpen(false)} onSaved={saved} />
    </main>
  )
}
