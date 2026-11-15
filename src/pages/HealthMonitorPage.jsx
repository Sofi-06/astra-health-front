import { useId, useMemo, useState } from 'react'
import { Bone, CirclePlus, Heart, Moon, Waves } from 'lucide-react'
import Panel from '../components/ui/Panel'
import Skeleton, { SkeletonGroup } from '../components/ui/Skeleton'
import useHealthData from '../hooks/useHealthData'
import { formatDay, formatValue, formatWhen } from '../data/format'

const tabs = [
  { label: 'Signos vitales', icon: Heart },
  { label: 'Metabólica', icon: Waves },
  { label: 'Muscular y ósea', icon: Bone },
  { label: 'Sueño', icon: Moon },
  { label: 'Síntomas', icon: CirclePlus },
]

// Tarjetas de la vista, alimentadas con el último registro real de cada indicador.
const VITAL_CARDS = [
  { code: 'blood_pressure', label: 'Presión arterial', fallbackUnit: 'mmHg' },
  { code: 'temperature', label: 'Temperatura', fallbackUnit: '°C' },
  { code: 'oxygen_saturation', label: 'Saturación O₂', fallbackUnit: '%' },
  { code: 'glucose', label: 'Glucosa', fallbackUnit: 'mg/dL' },
]

function HeartbeatGraph() {
  const pulse = 'M 0 70 H 40 C 45 70, 48 58, 52 58 C 56 58, 59 70, 64 70 H 72 L 77 82 L 85 8 L 94 104 L 101 70 H 108 C 114 70, 120 50, 125 50 C 130 50, 136 70, 142 70 H 160 H 200 C 205 70, 208 58, 212 58 C 216 58, 219 70, 224 70 H 232 L 237 82 L 245 8 L 254 104 L 261 70 H 268 C 274 70, 280 50, 285 50 C 290 50, 296 70, 302 70 H 320 H 360 C 365 70, 368 58, 372 58 C 376 58, 379 70, 384 70 H 392 L 397 82 L 405 8 L 414 104 L 421 70 H 428 C 434 70, 440 50, 445 50 C 450 50, 456 70, 462 70 H 480 H 520 C 525 70, 528 58, 532 58 C 536 58, 539 70, 544 70 H 552 L 557 82 L 565 8 L 574 104 L 581 70 H 588 C 594 70, 600 50, 605 50 C 610 50, 616 70, 622 70 H 640 H 680 C 685 70, 688 58, 692 58 C 696 58, 699 70, 704 70 H 712 L 717 82 L 725 8 L 734 104 L 741 70 H 748 C 754 70, 760 50, 765 50 C 770 50, 776 70, 782 70 H 800'

  return (
    <div className="hm-heartbeat" aria-label="Animación decorativa de electrocardiograma; no es una medición en vivo">
      {/* Grilla médica milimétrica de osciloscopio */}
      <div className="hm-heartbeat__grid" />

      {/* Línea de barrido de osciloscopio */}
      <div className="hm-heartbeat__sweep" />

      {/* Pista animada continua en bucle infinito */}
      <div className="hm-heartbeat__track">
        <svg viewBox="0 0 800 130" className="hm-heartbeat__svg" preserveAspectRatio="none" role="img">
          <defs>
            <filter id="hm-neon">
              <feGaussianBlur stdDeviation="3.5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          <path className="hm-heartbeat__line hm-heartbeat__line--glow" d={pulse} />
          <path className="hm-heartbeat__line" d={pulse} />
        </svg>

        <svg viewBox="0 0 800 130" className="hm-heartbeat__svg" preserveAspectRatio="none" role="img" aria-hidden="true">
          <path className="hm-heartbeat__line hm-heartbeat__line--glow" d={pulse} />
          <path className="hm-heartbeat__line" d={pulse} />
        </svg>
      </div>

      {/* Viñeta de desvanecimiento suave en bordes */}
      <div className="hm-heartbeat__vignette" />
    </div>
  )
}

function VitalCard({ label, entry, fallbackUnit, loading }) {
  const candidate = entry?.candidate
  if (loading) {
    return (
      <Panel className="hm-vital-card">
        <SkeletonGroup label={`Cargando ${label}…`}>
          <span>{label}</span>
          <Skeleton w={90} h={26} />
          <Skeleton w={120} h={11} />
        </SkeletonGroup>
      </Panel>
    )
  }
  return (
    <Panel className="hm-vital-card">
      <div>
        <span>{label}</span>
        <strong>
          {candidate ? formatValue(candidate) : '—'}
          <small>{candidate ? candidate.unit : fallbackUnit}</small>
        </strong>
        <small className="hm-vital-card__when">{entry ? formatWhen(entry.measured_at) : 'sin registros'}</small>
      </div>
    </Panel>
  )
}

function TrendChart({ title, data, dates, unit, color, loading }) {
  const gradientId = useId().replace(/:/g, '')
  const width = 520
  const height = 170
  const left = 34
  const right = 8
  const top = 8
  const bottom = 22

  const { min, max } = useMemo(() => {
    if (!data.length) return { min: 0, max: 1 }
    let lo = Math.min(...data)
    let hi = Math.max(...data)
    if (lo === hi) { lo -= 1; hi += 1 }
    const pad = (hi - lo) * 0.15
    return { min: lo - pad, max: hi + pad }
  }, [data])

  if (loading) {
    return (
      <Panel className="hm-trend-card">
        <span className="hm-card-kicker">{title}</span>
        <SkeletonGroup label={`Cargando ${title}…`}>
          <Skeleton w="100%" h={130} />
          <Skeleton w="55%" h={11} />
        </SkeletonGroup>
      </Panel>
    )
  }

  if (data.length < 2) {
    return (
      <Panel className="hm-trend-card">
        <span className="hm-card-kicker">{title}</span>
        <p className="chart-empty">Se necesitan al menos 2 registros reales para dibujar esta tendencia.</p>
      </Panel>
    )
  }

  const points = data.map((value, index) => {
    const x = left + (index / (data.length - 1)) * (width - left - right)
    const y = top + (1 - (value - min) / (max - min)) * (height - top - bottom)
    return [x, y]
  })
  const path = points.map(([x, y], index) => `${index ? 'L' : 'M'} ${x.toFixed(1)} ${y.toFixed(1)}`).join(' ')
  const area = `${path} L ${points.at(-1)[0]} ${height - bottom} L ${points[0][0]} ${height - bottom} Z`
  const last = points.at(-1)
  const yTicks = [max, (max + min) / 2, min]
  const labelIndexes = [0, Math.floor((dates.length - 1) / 2), dates.length - 1]
  const labels = labelIndexes.map((i) => ({ index: i, text: dates[i] }))

  return (
    <Panel className="hm-trend-card">
      <span className="hm-card-kicker">{title}</span>
      <div className="hm-chart">
        <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label={`${title} con datos reales registrados`}>
          <defs><linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={color} stopOpacity=".46" /><stop offset="1" stopColor={color} stopOpacity=".04" /></linearGradient></defs>
          {yTicks.map((tick, index) => {
            const y = top + index * ((height - top - bottom) / 2)
            return <g key={tick}><line x1={left} x2={width - right} y1={y} y2={y} className="hm-chart__grid" /><text x="1" y={y + 4} className="hm-chart__tick">{tick.toFixed(1)}</text></g>
          })}
          <path d={area} fill={`url(#${gradientId})`} />
          <path d={path} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx={last[0]} cy={last[1]} r="8" fill={color} opacity=".22" />
          <circle cx={last[0]} cy={last[1]} r="4" fill="#f2ffff" stroke={color} strokeWidth="2.5" />
          {labels.map(({ index, text }) => <text key={`${text}-${index}`} x={left + index * ((width - left - right) / Math.max(1, data.length - 1))} y={height - 2} textAnchor="middle" className="hm-chart__tick">{text}</text>)}
        </svg>
        <span className="axis-vertical-hint">Unidad: {unit}</span>
      </div>
    </Panel>
  )
}

function seriesPoints(historyItem) {
  const series = [...(historyItem?.series ?? [])].sort((a, b) => b.points.length - a.points.length)[0]
  if (!series) return { unit: '', values: [], dates: [] }
  return {
    unit: series.unit,
    values: series.points.map((p) => p.values[0]),
    dates: series.points.map((p) => formatDay(p.t)),
  }
}

export default function HealthMonitorPage({ onNotify, onOpenVitals }) {
  const [activeTab, setActiveTab] = useState('Signos vitales')
  const { latest, history, loading, error } = useHealthData()

  const hr = latest?.heart_rate
  const hrSeries = seriesPoints(history?.heart_rate)
  const sleepSeries = seriesPoints(history?.sleep)

  const hrMean = hrSeries.values.length
    ? hrSeries.values.reduce((sum, v) => sum + v, 0) / hrSeries.values.length
    : null
  const hrDiff = hr && hrMean != null ? Math.round((hr.candidate.values[0] - hrMean) * 10) / 10 : null

  const selectTab = (label) => {
    setActiveTab(label)
    if (label !== 'Signos vitales') onNotify(`${label}: vista preparada para la próxima iteración.`)
  }

  return (
    <section className="health-monitor" aria-label="Monitoreo físico">
      <Panel className="hm-live-card">
        <div className="hm-live-copy">
          <span className="hm-card-kicker">ÚLTIMO PULSO REGISTRADO</span>
          {loading ? (
            <SkeletonGroup label="Cargando último pulso…">
              <Skeleton w={150} h={44} />
              <Skeleton w={240} h={12} />
              <Skeleton w={200} h={22} radius="14px" />
            </SkeletonGroup>
          ) : (
            <>
              <div className="hm-live-value">{hr ? formatValue(hr.candidate) : '—'} <small>{hr?.candidate?.unit || 'lpm'}</small></div>
              <p>{hr ? `Frecuencia cardíaca · registro del ${formatWhen(hr.measured_at)}` : 'Aún no hay registros de pulso confirmados.'}</p>
              <span className="hm-history-chip">
                {hrDiff != null
                  ? `${hrDiff > 0 ? '+' : ''}${hrDiff} ${hr.candidate.unit} vs. su promedio registrado`
                  : 'Sin promedio todavía'}
              </span>
            </>
          )}
        </div>
        <HeartbeatGraph />
      </Panel>

      <nav className="hm-tabs" aria-label="Categorías de salud">
        {tabs.map(({ label, icon: Icon }) => <button key={label} className={activeTab === label ? 'is-active' : ''} onClick={() => selectTab(label)}><Icon size={22} strokeWidth={1.45} /><span>{label}</span></button>)}
      </nav>

      {error && <p className="chart-empty" role="alert">{error}</p>}

      <div className="hm-detail-grid">
        <div className="hm-vitals-list">
          {VITAL_CARDS.map(({ code, label, fallbackUnit }) => (
            <VitalCard key={code} label={label} entry={latest?.[code]} fallbackUnit={fallbackUnit} loading={loading} />
          ))}
        </div>
        <div className="hm-charts-column">
          <TrendChart title="SUEÑO (HORAS)" data={sleepSeries.values} dates={sleepSeries.dates} unit={sleepSeries.unit || 'h'} color="#7fa8ff" loading={loading} />
          <TrendChart title="FRECUENCIA CARDÍACA (BPM)" data={hrSeries.values} dates={hrSeries.dates} unit={hrSeries.unit || 'lpm'} color="#43e9ff" loading={loading} />
        </div>

        <Panel className="hm-record-card">
          <span className="hm-card-kicker">NUEVO REGISTRO</span>
          <p className="hm-record-copy">
            Registra lecturas reales de tus instrumentos, síntomas o contexto. Puedes
            escribir, dictar en vivo o enviar una nota de voz: todo se revisa y se
            confirma antes de guardarse en SQLite.
          </p>
          <button className="primary-button hm-save-button" type="button" onClick={() => onOpenVitals?.()}>
            Abrir registro
          </button>
          <p className="hm-record-hint">Nada se guarda sin tu confirmación. No evaluamos si una cifra es normal.</p>
        </Panel>
      </div>
    </section>
  )
}
