import { useEffect, useMemo, useState } from 'react'
import Panel from '../components/ui/Panel'
import Skeleton, { SkeletonGroup } from '../components/ui/Skeleton'
import { exportData, getAnalysis, listEntries, listResearchStudies } from '../api/client'
import { formatDay, formatValue, formatWhen, localDateKey } from '../data/format'
import { useLanguage } from '../app/LanguageContext'

const METRIC_EN = { sleep: 'Sleep', heart_rate: 'Heart rate', glucose: 'Glucose', oxygen_saturation: 'Oxygen saturation', blood_pressure: 'Blood pressure' }

const METRICS = [
  { code: 'sleep', label: 'Sueño', color: '#36d9fa' },
  { code: 'heart_rate', label: 'Pulso', color: '#f287b7' },
  { code: 'glucose', label: 'Glucosa', color: '#46d9bd' },
  { code: 'oxygen_saturation', label: 'Saturación', color: '#f7c76a' },
  { code: 'blood_pressure', label: 'Presión', color: '#ab8af7' },
]

function daysInRange(count) {
  return Array.from({ length: count }, (_, index) => {
    const date = new Date()
    date.setHours(12, 0, 0, 0)
    date.setDate(date.getDate() - count + 1 + index)
    return localDateKey(date.toISOString())
  })
}

function InsightChart({ entries, metric, range }) {
  const { language, tr } = useLanguage()
  const metricName = language === 'en' ? METRIC_EN[metric.code] : metric.label
  const days = useMemo(() => daysInRange(range), [range])
  const byDay = useMemo(() => {
    const results = new Map()
    entries.forEach((entry) => {
      if (entry.candidate?.kind !== 'measurement' || entry.candidate.metric !== metric.code) return
      const day = localDateKey(entry.measured_at)
      if (!results.has(day) || entry.measured_at > results.get(day).measured_at) results.set(day, entry)
    })
    return results
  }, [entries, metric.code])
  const recorded = days.map((day) => byDay.get(day)).filter(Boolean)
  const units = [...new Set(recorded.map((entry) => entry.candidate.unit))]
  const chartEntries = units.length > 1 ? recorded.filter((entry) => entry.candidate.unit === recorded.at(-1)?.candidate.unit) : recorded
  const values = chartEntries.map((entry) => Number(entry.candidate.values?.[0])).filter(Number.isFinite)
  let min = values.length ? Math.min(...values) : 0
  let max = values.length ? Math.max(...values) : 1
  if (min === max) { min -= 1; max += 1 }
  const left = 38
  const right = 965
  const top = 18
  const bottom = 170
  const x = (index) => left + index / Math.max(1, range - 1) * (right - left)
  const y = (value) => bottom - (value - min) / (max - min) * (bottom - top)
  let path = ''
  let previous = false
  const points = []
  days.forEach((day, index) => {
    const entry = byDay.get(day)
    const value = Number(entry?.candidate?.values?.[0])
    if (!entry || !chartEntries.includes(entry) || !Number.isFinite(value)) { previous = false; return }
    const point = { x: x(index), y: y(value), value, day }
    points.push(point)
    path += `${previous ? ' L' : ' M'} ${point.x.toFixed(1)} ${point.y.toFixed(1)}`
    previous = true
  })
  const ticks = days.map((day, index) => ({ day, index })).filter(({ index }) => range === 7 || index === 0 || index === range - 1 || index % Math.ceil(range / 6) === 0)

  return <>
    <div className="shi-plot" role="img" aria-label={tr(`Gráfica de ${metric.label}. ${recorded.length} fechas con registros en ${range} días; las fechas sin datos quedan vacías.`, `${metricName} chart. ${recorded.length} recorded dates in ${range} days; dates without data remain empty.`)}>
      <svg viewBox="0 0 1000 205" preserveAspectRatio="none">
        {[0, .5, 1].map((fraction) => <g key={fraction}><line x1={left} x2={right} y1={bottom - fraction * (bottom - top)} y2={bottom - fraction * (bottom - top)} className="shi-grid-line" /><text x="3" y={bottom - fraction * (bottom - top) + 4} className="shi-axis-label">{(min + fraction * (max - min)).toFixed(max - min < 3 ? 1 : 0)}</text></g>)}
        {ticks.map(({ day, index }) => <text key={day} x={x(index)} y="198" textAnchor={index === 0 ? 'start' : index === range - 1 ? 'end' : 'middle'} className="shi-axis-label">{formatDay(day, language)}</text>)}
        <path d={path.trim()} fill="none" stroke={metric.color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        {points.map((point) => <circle key={point.day} cx={point.x} cy={point.y} r="5" fill={metric.color}><title>{`${point.day}: ${point.value}`}</title></circle>)}
      </svg>
      {points.length === 0 && <p className="shi-empty-plot">{tr(`Sin registros de ${metric.label.toLowerCase()} en este período.`, `No ${metricName.toLowerCase()} records in this period.`)}</p>}
    </div>
    <div className="shi-chart-caption"><span>{tr(`Registraste ${metric.label.toLowerCase()} en ${recorded.length} de los últimos ${range} días.`, `You recorded ${metricName.toLowerCase()} on ${recorded.length} of the last ${range} days.`)}</span><span>{tr(`${range - recorded.length} fechas sin registro; no se estiman.`, `${range - recorded.length} dates without records; no estimates are made.`)}</span></div>
    {units.length > 1 && <p className="shi-unit-note">{tr(`Hay unidades distintas. La gráfica muestra solo ${chartEntries.at(-1)?.candidate.unit}; las tarjetas conservan el valor original.`, `Different units were recorded. The chart shows only ${chartEntries.at(-1)?.candidate.unit}; cards keep the original values.`)}</p>}
    {metric.code === 'blood_pressure' && recorded.length > 0 && <p className="shi-unit-note">{tr('La gráfica muestra el primer valor (sistólica); la tarjeta conserva ambos valores.', 'The chart shows the first value (systolic); the card keeps both values.')}</p>}
  </>
}

export default function SpaceHealthInsightsPage({ onNotify }) {
  const { language, tr } = useLanguage()
  const [entries, setEntries] = useState([])
  const [entriesError, setEntriesError] = useState(false)
  const [entriesLoading, setEntriesLoading] = useState(true)
  const [studies, setStudies] = useState([])
  const [entryCount, setEntryCount] = useState(null)
  const [analysesLoaded, setAnalysesLoaded] = useState(false)
  const [studiesLoaded, setStudiesLoaded] = useState(false)
  const [selectedCode, setSelectedCode] = useState('sleep')
  const [range, setRange] = useState(7)
  const [analysis, setAnalysis] = useState(null)
  const [busyExport, setBusyExport] = useState(false)

  useEffect(() => {
    let cancelled = false
    Promise.all(NODES.map(({ code }) => getAnalysis(code, 7).catch(() => null))).then((results) => {
      if (cancelled) return
      setAnalyses(Object.fromEntries(NODES.map(({ code }, i) => [code, results[i]])))
      setAnalysesLoaded(true)
    })
    listResearchStudies()
      .then((data) => { if (!cancelled) setStudies(data?.studies ?? []) })
      .catch(() => {})
      .finally(() => { if (!cancelled) setStudiesLoaded(true) })
    listEntries()
      .then((data) => { if (!cancelled) setEntryCount(data?.count ?? 0) })
      .catch(() => {})
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    let cancelled = false
    setAnalysis(null)
    getAnalysis(selectedCode, range).then((result) => { if (!cancelled) setAnalysis(result) }).catch(() => {})
    return () => { cancelled = true }
  }, [selectedCode, range])

  const days = useMemo(() => daysInRange(range), [range])
  const visibleEntries = useMemo(() => entries.filter((entry) => entry.candidate?.kind === 'measurement' && days.includes(localDateKey(entry.measured_at))), [entries, days])
  const latestByMetric = useMemo(() => {
    const latest = new Map()
    visibleEntries.forEach((entry) => {
      const code = entry.candidate.metric
      if (!latest.has(code) || entry.measured_at > latest.get(code).measured_at) latest.set(code, entry)
    })
    return latest
  }, [visibleEntries])
  const selectedMetric = METRICS.find((item) => item.code === selectedCode)

  const handleExport = async () => {
    setBusyExport(true)
    try {
      const report = await exportData()
      const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `astra-health-export-${new Date().toISOString().slice(0, 10)}.json`
      link.click()
      URL.revokeObjectURL(url)
      onNotify?.(tr('Datos JSON descargados con tus registros reales.', 'JSON file downloaded with your real records.'))
    } catch (error) { onNotify?.(error.message) }
    finally { setBusyExport(false) }
  }

  return (
    <div className="space-insights-page" aria-label="El cerebro de ASTRA">
      {/* Header específico de la página */}
      <header className="page-header-pro">
        <div>
          <h1>El cerebro de ASTRA</h1>
          <p>SPACE HEALTH INSIGHTS · MISSION CONTEXT</p>
        </div>
      </header>

      {/* Tarjeta Superior: Resumen de los últimos 7 días con datos reales */}
      <Panel className="insights-pattern-card">
        <span className="insights-kicker">
          SPACE HEALTH INSIGHTS · TUS REGISTROS DE LOS ÚLTIMOS 7 DÍAS
        </span>

        {/* Constelación del resumen */}
        <div className="pattern-constellation">
          <svg className="constellation-lines-svg" viewBox="0 0 700 240" preserveAspectRatio="none">
            <line x1="350" y1="120" x2="170" y2="40" stroke="rgba(49, 220, 255, 0.45)" strokeWidth="1.5" strokeDasharray="4 3" />
            <line x1="350" y1="120" x2="540" y2="40" stroke="rgba(255, 122, 142, 0.45)" strokeWidth="1.5" strokeDasharray="4 3" />
            <line x1="350" y1="120" x2="640" y2="120" stroke="rgba(192, 132, 252, 0.45)" strokeWidth="1.5" strokeDasharray="4 3" />
            <line x1="350" y1="120" x2="350" y2="205" stroke="rgba(255, 214, 90, 0.55)" strokeWidth="1.5" strokeDasharray="4 3" />
            <line x1="350" y1="120" x2="70" y2="120" stroke="rgba(49, 220, 255, 0.45)" strokeWidth="1.5" strokeDasharray="4 3" />
          </svg>

          {/* Nodo central */}
          <div className="pattern-center-node">
            <div className="center-node-pulse" />
            <strong>RESUMEN</strong>
            <small>últimos 7 días</small>
          </div>

          {NODES.map(({ code, title, className, arrowClass }) => {
            const { value, change } = nodeData(code, analyses[code])
            return (
              <div key={code} className={`pattern-satellite-node ${className}`}>
                <span className="node-title">{title}</span>
                {analysesLoaded ? (
                  <div className={`node-value ${change != null && change !== 0 ? arrowClass : ''}`}>
                    {change != null && change !== 0 && (change > 0 ? <ArrowUp size={12} /> : <ArrowDown size={12} />)}
                    <span>{value}</span>
                  </div>
                ) : <Skeleton w={54} h={16} />}
              </div>
            )
          })}
        </div>

        {/* Fila de metadatos: solo datos reales de la sesión o del prototipo */}
        <div className="insights-mission-meta-row">
          <div>
            <span>TIPO DE MISIÓN</span>
            <strong>Orbital</strong>
          </div>
          <div>
            <span>DÍA DE MISIÓN</span>
            <strong>{sessionDay}</strong>
          </div>
          <div>
            <span>REGISTROS</span>
            {entryCount == null ? <Skeleton w={32} h={16} /> : <strong>{entryCount}</strong>}
          </div>
          <div>
            <span>ALMACENAMIENTO</span>
            <strong>SQLite local</strong>
          </div>
          <div>
            <span>CANAL MÉDICO</span>
            <strong>No conectado</strong>
          </div>
        </div>
      </Panel>

      {/* Fila Inferior: 3 Paneles */}
      <div className="insights-bottom-grid">
        {/* Panel 1: SUEÑO (HORAS) con registros reales */}
        <Panel className="insights-chart-panel">
          <span className="section-title">SUEÑO (HORAS)</span>
          {analysesLoaded ? <SleepCurve analysis={sleep} /> : (
            <SkeletonGroup label="Cargando curva de sueño…">
              <Skeleton w="100%" h={140} />
              <Skeleton w="60%" h={11} />
            </SkeletonGroup>
          )}
        </Panel>

        {/* Panel 2: ORIENTACIÓN con fuente y límites explícitos */}
        <Panel className="insights-actions-panel">
          <span className="section-title">ORIENTACIÓN Y LÍMITES</span>
          {!analysesLoaded && (
            <SkeletonGroup label="Cargando orientación…">
              <Skeleton w="40%" h={14} />
              <Skeleton w="100%" h={12} />
              <Skeleton w="90%" h={12} />
              <Skeleton w="95%" h={12} />
            </SkeletonGroup>
          )}
          {education && (
            <div className="education-box">
              <h3>Fuente general de la NASA</h3>
              <p>{education.text}</p>
              <small>{education.scope}</small>
            </div>
          )}
          {cannotConclude.length > 0 && (
            <>
              <h3>El análisis no determina</h3>
              <ul className="recommendations-list">
                {cannotConclude.map((item) => (
                  <li key={item}>
                    <span className="rec-bullet" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </>
          )}

          <button className="primary-pill-btn export-report-btn" onClick={handleExport} disabled={busyExport} type="button">
            <span>{busyExport ? 'Generando…' : 'Exportar informe'}</span>
          </button>
        </Panel>

        {/* Panel 3: INVESTIGACIÓN NASA OSDR real */}
        <Panel className="insights-hazards-panel">
          <span className="section-title">INVESTIGACIÓN NASA · OSDR</span>
          <div className="hazards-list">
            {!studiesLoaded && (
              <SkeletonGroup label="Cargando estudios de NASA OSDR…">
                {[0, 1, 2].map((i) => <Skeleton key={i} w="100%" h={44} radius="10px" />)}
              </SkeletonGroup>
            )}
            {studiesLoaded && studies.length === 0 && <p className="chart-empty">No hay estudios en la copia local.</p>}
            {studies.map((study) => (
              <div className="hazard-row" key={study.accession}>
                <div className="hazard-name">
                  <span className="study-title" title={study.title}>{study.title}</span>
                  <small className="study-meta">
                    Copia local del {study.retrieved_at ? formatDay(study.retrieved_at) : '—'}
                    {typeof study.file_count_total === 'number' ? ` · ${study.file_count_total} archivos` : ''}
                    {study.stale ? ' · desactualizada' : ''}
                  </small>
                </div>
                {study.api_url ? (
                  <a className="status-badge badge--stable study-link" href={study.api_url} target="_blank" rel="noreferrer">{study.accession}</a>
                ) : (
                  <span className="status-badge badge--stable">{study.accession}</span>
                )}
              </div>
            ))}
          </div>
          <p className="insights-scope-note">Investigación pública de la NASA, separada de tus registros personales. No es un protocolo clínico.</p>
        </Panel>
      </div>
    </div>
  )
}
