import Panel from '../ui/Panel'
import { statusRows } from '../../data/dashboardData'

export default function StatusPanel() {
  return (
    <Panel className="status-panel">
      <span className="section-title">ESTADO GENERAL</span>
      <div className="status-summary">
        <div className="score-ring"><strong>4</strong><span>de 8</span></div>
        <div><strong>4 indicadores<br />necesitan seguimiento</strong><p>0 requieren evaluación médica</p></div>
      </div>
      <div className="status-rows">
        {statusRows.map((row) => (
          <div key={row.label}><span>{row.label}</span><em className={`tag tag--${row.tone}`}>{row.tag}</em></div>
        ))}
      </div>
    </Panel>
  )
}
