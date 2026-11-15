import { useEffect, useMemo, useState } from 'react'
import { ArrowDown, ArrowUp } from 'lucide-react'
import Panel from '../components/ui/Panel'
import { exportData, getAnalysis, listEntries, listResearchStudies } from '../api/client'
import { formatDay, formatWhen } from '../data/format'

// Nodos del resumen: solo indicadores con análisis real en el backend.
const NODES = [
  { code: 'sleep', title: 'SUEÑO', className: 'node--sleep', arrowClass: 'val--down' },
  { code: 'heart_rate', title: 'PULSO', className: 'node--fatigue', arrowClass: 'val--up-warn' },
  { code: 'blood_pressure', title: 'PRESIÓN', className: 'node--stress', arrowClass: 'val--up-warn' },
  { code: 'oxygen_saturation', title: 'SATURACIÓN', className: 'node--activity', arrowClass: 'val--down-gold' },
  { code: 'glucose', title: 'GLUCOSA', className: 'node--mood', arrowClass: 'val--down' },
]

const round1 = (n) => Math.round(n * 10) / 10

function nodeData(code, analysis) {
  if (!analysis) return { value: 's/r', change: null, unit: '' }
  if (code === 'sleep') {
    const stats = analysis.personal_calculation?.stats
    if (!stats) return { value: 's/r', change: null, unit: 'h' }
    return {
      value: `${round1(stats.mean_hours)} h`,
      change: stats.change_last_minus_first_hours,
      unit: 'h',
    }
  }
  const series = analysis.personal_calculation?.series?.[0]
  if (!series?.stats) return { value: 's/r', change: null, unit: '' }
  const mean = series.stats.mean
  return {
    value: code === 'blood_pressure' ? `${Math.round(mean[0])}/${Math.round(mean[1])} ${series.unit}` : `${round1(mean[0])} ${series.unit}`,
    change: series.stats.change_last_minus_first?.[0] ?? null,
    unit: series.unit,
  }
}

function SleepCurve({ analysis }) {
  const nights = analysis?.personal_calculation?.nights ?? []
  const message = analysis?.personal_calculation?.message

  if (!nights.length) {
    return (
      <>
        <p className="chart-empty">Sin registros de sueño confirmados en la ventana. Registra tus horas para ver la curva.</p>
        {message && <p className="sleep-trend-footnote">{message}</p>}
      </>
    )
  }

  const width = 320
  const height = 100
  const pad = 5
  const values = nights.map((n) => n.hours)
  let min = Math.min(...values)
  let max = Math.max(...values)
  if (min === max) { min -= 1; max += 1 }
  const coords = values.map((v, i) => [
    pad + (i / Math.max(1, values.length - 1)) * (width - pad * 2),
    pad + (1 - (v - min) / (max - min)) * (height - pad * 2 - 12),
  ])
  const line = coords.map(([x, y], i) => `${i ? 'L' : 'M'} ${x.toFixed(1)} ${y.toFixed(1)}`).join(' ')
  const area = `${line} L ${coords.at(-1)[0]} ${height - 10} L ${coords[0][0]} ${height - 10} Z`
  const last = coords.at(-1)

  return (
    <>
      <div className="sleep-curve-container">
        <div className="sleep-curve-y">
          <span>{round1(max)}</span>
          <span>{round1((max + min) / 2)}</span>
          <span>{round1(min)}</span>
        </div>
        <div className="sleep-curve-svg-wrap">
          <svg viewBox={`0 0 ${width} ${height}`} className="sleep-trend-svg" preserveAspectRatio="none">
            <defs>
              <linearGradient id="sleepCurveFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#31dcff" stopOpacity="0.35" />
                <stop offset="100%" stopColor="#31dcff" stopOpacity="0.0" />
              </linearGradient>
            </defs>
            <line x1="0" y1="10" x2={width} y2="10" stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" />
            <line x1="0" y1="45" x2={width} y2="45" stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" />
            <line x1="0" y1="80" x2={width} y2="80" stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" />
            <path d={area} fill="url(#sleepCurveFill)" />
            <path d={line} fill="none" stroke="#38bdf8" strokeWidth="2.5" strokeLinecap="round" />
            <circle cx={last[0]} cy={last[1]} r="4.5" fill="#ffffff" stroke="#00b4f0" strokeWidth="2" />
          </svg>
          <div className="sleep-curve-x">
            <span>{formatDay(nights[0].date)}</span>
            <span>{formatDay(nights[Math.floor((nights.length - 1) / 2)].date)}</span>
            <span>{formatDay(nights.at(-1).date)}</span>
          </div>
        </div>
      </div>
      {message && <p className="sleep-trend-footnote">{message}</p>}
    </>
  )
}

export default function SpaceHealthInsightsPage({ onNotify, sessionDay = 145 }) {
  const [analyses, setAnalyses] = useState({})
  const [studies, setStudies] = useState([])
  const [entryCount, setEntryCount] = useState(null)
  const [busyExport, setBusyExport] = useState(false)

  useEffect(() => {
    let cancelled = false
    Promise.all(NODES.map(({ code }) => getAnalysis(code, 7).catch(() => null))).then((results) => {
      if (!cancelled) setAnalyses(Object.fromEntries(NODES.map(({ code }, i) => [code, results[i]])))
    })
    listResearchStudies()
      .then((data) => { if (!cancelled) setStudies(data?.studies ?? []) })
      .catch(() => {})
    listEntries()
      .then((data) => { if (!cancelled) setEntryCount(data?.count ?? 0) })
      .catch(() => {})
    return () => { cancelled = true }
  }, [])

  const sleep = analyses.sleep
  const education = sleep?.education
  const cannotConclude = sleep?.cannot_conclude ?? []

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
      onNotify?.('Informe JSON descargado con tus registros reales.')
    } catch (error) {
      onNotify?.(error.message)
    } finally {
      setBusyExport(false)
    }
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
                <div className={`node-value ${change != null && change !== 0 ? arrowClass : ''}`}>
                  {change != null && change !== 0 && (change > 0 ? <ArrowUp size={12} /> : <ArrowDown size={12} />)}
                  <span>{value}</span>
                </div>
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
            <strong>{entryCount == null ? '…' : entryCount}</strong>
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
          <SleepCurve analysis={sleep} />
        </Panel>

        {/* Panel 2: ORIENTACIÓN con fuente y límites explícitos */}
        <Panel className="insights-actions-panel">
          <span className="section-title">ORIENTACIÓN Y LÍMITES</span>
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
            {studies.length === 0 && <p className="chart-empty">No hay estudios en la copia local.</p>}
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
