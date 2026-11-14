import { Activity, Droplet, Gauge, HeartPulse, Moon, Thermometer } from 'lucide-react'
import Panel from '../ui/Panel'
import { formatValue, formatWhen } from '../../data/format'

const ICONS = {
  heart_rate: HeartPulse,
  sleep: Moon,
  blood_pressure: Activity,
  oxygen_saturation: Gauge,
  temperature: Thermometer,
  glucose: Droplet,
}

export default function MetricCard({ code, label, entry }) {
  const candidate = entry?.candidate
  const Icon = ICONS[code]
  return (
    <Panel className={`metric-card ${candidate ? 'metric-card--recorded' : ''}`}>
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
      <div
        className="radial-indicator"
        style={{ '--progress': candidate ? '100%' : '0%' }}
        role="img"
        aria-label={candidate ? `${label}: dato registrado` : `${label}: sin registro`}
      >
        <Icon aria-hidden="true" />
      </div>
    </Panel>
  )
}
