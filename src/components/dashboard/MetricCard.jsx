import { Check, Eye } from 'lucide-react'
import Panel from '../ui/Panel'

export default function MetricCard({ metric, reviewed, onReview }) {
  return (
    <Panel className={`metric-card metric-card--${metric.tone}`}>
      <div className="metric-card__copy">
        <p>{metric.label}</p>
        <div className="metric-card__value">{metric.value}<small>{metric.unit}</small></div>
        <button className="status-chip" onClick={onReview}>
          {reviewed ? <Check size={12} /> : <Eye size={12} />}
          {reviewed ? 'Visto' : metric.tone === 'good' ? 'Estable' : 'Revisar'}
        </button>
      </div>
      <div className="radial-indicator" style={{ '--progress': `${metric.progress * 3.6}deg` }}>
        <span />
      </div>
    </Panel>
  )
}
