import Panel from '../ui/Panel'
import { formatValue, formatWhen } from '../../data/format'

export default function MetricCard({ label, entry }) {
  const candidate = entry?.candidate
  return (
    <Panel className="metric-card">
      <div className="metric-card__copy">
        <p>{label}</p>
        <div className="metric-card__value">
          {candidate ? formatValue(candidate) : '—'}
          {candidate && <small>{candidate.unit}</small>}
        </div>
        <span className="metric-card__when">
          {entry ? `${formatWhen(entry.measured_at)} · ${entry.origin}` : 'Sin registros'}
        </span>
      </div>
    </Panel>
  )
}
