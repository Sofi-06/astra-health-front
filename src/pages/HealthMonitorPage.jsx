import { useId, useMemo, useState } from 'react'
import { Bone, ChevronDown, CirclePlus, Heart, Moon, Waves } from 'lucide-react'
import Panel from '../components/ui/Panel'

const tabs = [
  { label: 'Signos vitales', icon: Heart },
  { label: 'Metabólica', icon: Waves },
  { label: 'Muscular y ósea', icon: Bone },
  { label: 'Sueño', icon: Moon },
  { label: 'Síntomas', icon: CirclePlus },
]

const vitalMetrics = [
  { label: 'Presión arterial', value: '124/80', unit: 'mmHg', progress: 84 },
  { label: 'Temperatura', value: '36.8', unit: '°C', progress: 88 },
  { label: 'Saturación O₂', value: '97', unit: '%', progress: 97 },
  { label: 'Glucosa', value: '94', unit: 'mg/dL', progress: 82 },
]

const sleepData = [7.4, 7.25, 7.18, 7.02, 6.9, 6.82, 6.55, 6.08, 5.98, 5.68, 5.57, 5.22, 5.08, 4.86, 4.78, 4.55]
const heartData = [72, 72.8, 73.1, 74, 74.3, 73.4, 73.2, 74.5, 75.2, 79.1, 80.5, 83, 83.8, 86.4, 87.5, 88.2]

function HeartbeatGraph() {
  const pulse = 'M0 72 H95 L105 48 L115 104 L126 8 L139 95 L151 72 H255 L265 50 L275 101 L286 14 L298 92 L311 72 H415 L425 49 L436 104 L447 12 L459 94 L472 72 H575 L585 49 L596 103 L608 9 L620 96 L633 72 H737 L747 48 L758 103 L770 7 L782 96 L795 72 H895 L905 50 L916 102 L927 12 L940 93'
  return (
    <div className="hm-heartbeat" aria-label="Electrocardiograma en vivo">
      <svg viewBox="0 0 940 130" preserveAspectRatio="none" role="img">
        <defs><filter id="hm-neon"><feGaussianBlur stdDeviation="4" result="blur" /><feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge></filter></defs>
        <path className="hm-heartbeat__line hm-heartbeat__line--glow" d={pulse} />
        <path className="hm-heartbeat__line" d={pulse} />
      </svg>
    </div>
  )
}

function VitalCard({ metric }) {
  return (
    <Panel className="hm-vital-card">
      <div><span>{metric.label}</span><strong>{metric.value}<small>{metric.unit}</small></strong></div>
      <div className="hm-vital-ring" style={{ '--metric-progress': `${metric.progress}%` }} aria-label={`${metric.progress}%`} />
    </Panel>
  )
}

function TrendChart({ title, data, min, max, color, labels }) {
  const gradientId = useId().replace(/:/g, '')
  const width = 520
  const height = 170
  const left = 28
  const right = 8
  const top = 8
  const bottom = 22
  const points = useMemo(() => data.map((value, index) => {
    const x = left + (index / (data.length - 1)) * (width - left - right)
    const y = top + (1 - (value - min) / (max - min)) * (height - top - bottom)
    return [x, y]
  }), [data, min, max])
  const path = points.map(([x, y], index) => `${index ? 'L' : 'M'} ${x.toFixed(1)} ${y.toFixed(1)}`).join(' ')
  const area = `${path} L ${points.at(-1)[0]} ${height - bottom} L ${points[0][0]} ${height - bottom} Z`
  const last = points.at(-1)
  const yTicks = [max, (max + min) / 2, min]

  return (
    <Panel className="hm-trend-card">
      <span className="hm-card-kicker">{title}</span>
      <div className="hm-chart">
        <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label={title}>
          <defs><linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={color} stopOpacity=".46" /><stop offset="1" stopColor={color} stopOpacity=".04" /></linearGradient></defs>
          {yTicks.map((tick, index) => {
            const y = top + index * ((height - top - bottom) / 2)
            return <g key={tick}><line x1={left} x2={width - right} y1={y} y2={y} className="hm-chart__grid" /><text x="1" y={y + 4} className="hm-chart__tick">{Number.isInteger(tick) ? tick : tick.toFixed(1)}</text></g>
          })}
          <path d={area} fill={`url(#${gradientId})`} />
          <path d={path} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx={last[0]} cy={last[1]} r="8" fill={color} opacity=".22" />
          <circle cx={last[0]} cy={last[1]} r="4" fill="#f2ffff" stroke={color} strokeWidth="2.5" />
          {labels.map((label, index) => <text key={label} x={left + index * ((width - left - right) / (labels.length - 1))} y={height - 2} textAnchor="middle" className="hm-chart__tick">{label}</text>)}
        </svg>
      </div>
    </Panel>
  )
}

function SelectField({ label, value, options, onChange }) {
  return (
    <label className="hm-form-row">
      <span>{label}</span>
      <span className="hm-select-wrap">
        <select value={value} onChange={(event) => onChange(event.target.value)}>{options.map((option) => <option key={option}>{option}</option>)}</select>
        <ChevronDown size={12} aria-hidden="true" />
      </span>
    </label>
  )
}

export default function HealthMonitorPage({ onNotify }) {
  const [activeTab, setActiveTab] = useState('Signos vitales')
  const [method, setMethod] = useState('Manual')
  const [frequency, setFrequency] = useState('92 bpm')
  const [device, setDevice] = useState('Brazalete B-02')
  const [symptom, setSymptom] = useState('Fatiga')
  const [intensity, setIntensity] = useState(3)
  const [notes, setNotes] = useState('Cansancio después de la sesión de ejercicio de resistencia.')

  const selectTab = (label) => {
    setActiveTab(label)
    if (label !== 'Signos vitales') onNotify(`${label}: vista preparada para la próxima iteración.`)
  }

  const submit = (event) => {
    event.preventDefault()
    onNotify(`Registro guardado: ${symptom}, intensidad ${intensity}.`)
  }

  return (
    <section className="health-monitor" aria-label="Monitoreo físico">
      <Panel className="hm-live-card">
        <div className="hm-live-copy">
          <span className="hm-card-kicker">MONITOR EN VIVO</span>
          <div className="hm-live-value">88 <small>bpm</small></div>
          <p>Frecuencia cardíaca · registro de las 07:42</p>
          <span className="hm-history-chip">+16 bpm vs. su historial</span>
        </div>
        <HeartbeatGraph />
      </Panel>

      <nav className="hm-tabs" aria-label="Categorías de salud">
        {tabs.map(({ label, icon: Icon }) => <button key={label} className={activeTab === label ? 'is-active' : ''} onClick={() => selectTab(label)}><Icon size={22} strokeWidth={1.45} /><span>{label}</span></button>)}
      </nav>

      <div className="hm-detail-grid">
        <div className="hm-vitals-list">{vitalMetrics.map((metric) => <VitalCard key={metric.label} metric={metric} />)}</div>
        <div className="hm-charts-column">
          <TrendChart title="SUEÑO (HORAS)" data={sleepData} min={3} max={9} color="#7fa8ff" labels={['D137', 'D139', 'D141', 'D143', 'D145']} />
          <TrendChart title="FRECUENCIA CARDÍACA (BPM)" data={heartData} min={60} max={100} color="#43e9ff" labels={['D137', 'D139', 'D141', 'D143', 'D145']} />
        </div>

        <Panel as="form" className="hm-record-card" onSubmit={submit}>
          <span className="hm-card-kicker">NUEVO REGISTRO</span>
          <div className="hm-record-fields">
            <SelectField label="Método" value={method} onChange={setMethod} options={['Manual', 'Automático']} />
            <SelectField label="Frecuencia" value={frequency} onChange={setFrequency} options={['92 bpm', '88 bpm', '76 bpm']} />
            <SelectField label="Dispositivo" value={device} onChange={setDevice} options={['Brazalete B-02', 'Sensor A-14']} />
            <SelectField label="Síntoma" value={symptom} onChange={setSymptom} options={['Fatiga', 'Dolor muscular', 'Mareo', 'Ninguno']} />
          </div>
          <fieldset className="hm-intensity">
            <legend>Intensidad</legend>
            <div>{[1, 2, 3, 4, 5].map((level) => <button type="button" key={level} className={intensity === level ? 'is-selected' : ''} onClick={() => setIntensity(level)}>{level}</button>)}</div>
          </fieldset>
          <label className="hm-notes"><span>Observaciones</span><textarea value={notes} onChange={(event) => setNotes(event.target.value)} /></label>
          <button className="primary-button hm-save-button" type="submit">Guardar registro</button>
        </Panel>
      </div>
    </section>
  )
}
