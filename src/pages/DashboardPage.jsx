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
import { metrics } from '../data/dashboardData'

export default function DashboardPage({ onNotify }) {
  const [reviewed, setReviewed] = useState([])
  const [modalOpen, setModalOpen] = useState(false)

  const reviewMetric = (id) => {
    setReviewed((current) => current.includes(id) ? current : [...current, id])
    onNotify('Indicador marcado como revisado.')
  }

  return (
    <main className="app-shell">
      <div className="space-vignette" />
      <Sidebar onNotify={onNotify} />
      <div className="dashboard-content">
        <DashboardHeader onNotify={onNotify} />
        <div className="dashboard-grid">
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
      </div>
      <VitalsModal open={modalOpen} onClose={() => setModalOpen(false)} onSave={() => onNotify('Signos vitales guardados y sincronizados.')} />
    </main>
  )
}
