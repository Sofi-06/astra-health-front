import Panel from '../ui/Panel'
import MiniChart from './MiniChart'
import { heartTrend, sleepTrend } from '../../data/dashboardData'

export default function TrendsPanel() {
  return (
    <Panel className="trends-panel">
      <span className="section-title">TENDENCIAS</span>
      <MiniChart title="Sueño · últimos 7 días" data={sleepTrend} color="#86a9ff" min={3.5} max={8} />
      <MiniChart title="Frecuencia cardiaca · últimos 7 días" data={heartTrend} color="#35efff" min={65} max={95} />
    </Panel>
  )
}
