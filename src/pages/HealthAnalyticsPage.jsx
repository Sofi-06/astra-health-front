import { useEffect, useMemo, useState } from 'react'
import Panel from '../components/ui/Panel'
import { exportData, getAnalysis, getCapabilities, getHistory, listEntries } from '../api/client'
import { formatDay, formatValue, localDateKey } from '../data/format'

const TIME_FILTERS = [
  { label: '24 h', days: 1 },
  { label: '7 días', days: 7 },
  { label: '30 días', days: 30 },
  { label: '3 meses', days: 90 },
  { label: 'Toda la misión', days: 3650 },
]

// Solo indicadores que el backend registra y analiza de verdad.
const CHART_METRICS = [
  { code: 'heart_rate', kicker: 'FRECUENCIA CARDÍACA', unitHint: 'lpm', color: '#22d3ee' },
  { code: 'sleep', kicker: 'SUEÑO', unitHint: 'horas', color: '#38bdf8' },
  { code: 'blood_pressure', kicker: 'PRESIÓN ARTERIAL (SISTÓLICA)', unitHint: 'mmHg', color: '#fb923c' },
  { code: 'glucose', kicker: 'GLUCOSA', unitHint: 'mg/dL', color: '#c084fc' },
]

// Mapa de sistemas a indicadores reales. Los sistemas sin indicador conectado se
// muestran como "sin fuente de datos" en vez de simular un estado.
const HEATMAP_SYSTEMS = [
  { name: 'Cardiovascular', metrics: ['heart_rate', 'blood_pressure'] },
  { name: 'Metabólica', metrics: ['glucose'] },
  { name: 'Descanso', metrics: ['sleep'] },
  { name: 'Músculo y hueso', metrics: [] },
  { name: 'Psicológica', metrics: [] },
]

const round1 = (n) => Math.round(n * 10) / 10

function last7Days() {
  const days = []
  const today = new Date()
  for (let i = 6; i >= 0; i -= 1) {
    const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() - i)
    days.push(localDateKey(d.toISOString()))
  }
  return days
}

function MetricChartCard({ meta, historyData, analysis }) {
  const series = [...(historyData?.series ?? [])].sort((a, b) => b.points.length - a.points.length)[0]
  const points = series?.points ?? []
  const values = points.map((p) => p.values[0])
  const latest = points.at(-1)

  // Cambio entre el primer y el último registro de la ventana (cálculo del backend).
  let comparison = 'pocos registros para comparar'
  let compClass = ''
  if (analysis) {
    let change = null
    let unit = series?.unit || meta.unitHint
    if (meta.code === 'sleep') {
      change = analysis.personal_calculation?.stats?.change_last_minus_first_hours
    } else {
      const s = analysis.personal_calculation?.series?.[0]
      change = s?.stats?.change_last_minus_first?.[0]
      unit = s?.unit || unit
    }
    if (change != null) {
      compClass = change > 0 ? 'comp--up' : change < 0 ? 'comp--down' : ''
      comparison = change === 0
        ? 'sin cambio entre el primer y el último registro'
        : `${change > 0 ? '+' : ''}${round1(change)} ${unit} entre el primer y el último registro`
    }
  }

  const width = 280
  const height = 80
  const pad = 5
  let path = ''
  let lastPoint = null
  let yLabels = []
  if (values.length >= 2) {
    let min = Math.min(...values)
    let max = Math.max(...values)
    if (min === max) { min -= 1; max += 1 }
    yLabels = [max, round1((max + min) / 2), min]
    const coords = values.map((v, i) => [
      pad + (i / (values.length - 1)) * (width - pad * 2),
      pad + (1 - (v - min) / (max - min)) * (height - pad * 2 - 8),
    ])
    path = coords.map(([x, y], i) => `${i ? 'L' : 'M'} ${x.toFixed(1)} ${y.toFixed(1)}`).join(' ')
    lastPoint = coords.at(-1)
  }

  return (
    <Panel className="analytics-metric-chart-card">
      <div className="metric-chart-top">
        <div>
          <span className="card-kicker">{meta.kicker}</span>
          <div className="card-val-row">
            <strong>{latest ? `${formatValue({ metric: meta.code, values: latest.values })} ${series?.unit || ''}` : '—'}</strong>
            <span className={`card-comparison ${compClass}`}>{comparison}</span>
          </div>
        </div>
      </div>

      <div className="metric-chart-canvas-wrap">
        {values.length >= 2 ? (
          <>
            <div className="axis-y-labels">
              {yLabels.map((v, i) => <span key={i}>{v}</span>)}
            </div>
            <div className="svg-box">
              <svg viewBox={`0 0 ${width} ${height}`} className="history-chart-svg" preserveAspectRatio="none">
                <line x1="0" y1="10" x2={width} y2="10" stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" />
                <line x1="0" y1="40" x2={width} y2="40" stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" />
                <line x1="0" y1="70" x2={width} y2="70" stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" />
                <path d={path} fill="none" stroke={meta.color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                {lastPoint && <circle cx={lastPoint[0]} cy={lastPoint[1]} r="4" fill="#ffffff" stroke={meta.color} strokeWidth="2" />}
              </svg>
              <div className="axis-x-labels">
                <span>{formatDay(points[0].t)}</span>
                <span>{formatDay(points[Math.floor((points.length - 1) / 2)].t)}</span>
                <span>{formatDay(points.at(-1).t)}</span>
              </div>
            </div>
          </>
        ) : (
          <p className="chart-empty">Sin registros suficientes en este periodo. Registra datos reales para ver la evolución.</p>
        )}
      </div>
      <span className="axis-vertical-hint">Eje vertical: {series?.unit || meta.unitHint}</span>
    </Panel>
  )
}

export default function HealthAnalyticsPage({ onNotify }) {
  const [activeRange, setActiveRange] = useState('7 días')
  const [data, setData] = useState({}) // code -> { history, analysis }
  const [heatmapHistories, setHeatmapHistories] = useState({})
  const [entries, setEntries] = useState([])
  const [busyReport, setBusyReport] = useState(false)

  const days = TIME_FILTERS.find((f) => f.label === activeRange)?.days ?? 7

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      const result = {}
      await Promise.all(CHART_METRICS.map(async ({ code }) => {
        const [history, analysis] = await Promise.all([
          getHistory(code, days).catch(() => null),
          getAnalysis(code, Math.min(days, 90)).catch(() => null),
        ])
        result[code] = { history, analysis }
      }))
      if (!cancelled) setData(result)
    }
    load()
    return () => { cancelled = true }
  }, [days])

  // El mapa de sistemas siempre mira los últimos 7 días, con fuentes reales.
  useEffect(() => {
    let cancelled = false
    const codes = [...new Set(HEATMAP_SYSTEMS.flatMap((s) => s.metrics))]
    Promise.all(codes.map((code) => getHistory(code, 7).catch(() => null))).then((histories) => {
      if (!cancelled) setHeatmapHistories(Object.fromEntries(codes.map((code, i) => [code, histories[i]])))
    })
    listEntries().then((list) => { if (!cancelled) setEntries(list.entries || []) }).catch(() => {})
    return () => { cancelled = true }
  }, [])

  const heatmapDays = useMemo(() => last7Days(), [])
  const recordedDatesByMetric = useMemo(() => {
    const map = {}
    for (const [code, history] of Object.entries(heatmapHistories)) {
      const dates = new Set()
      for (const series of history?.series ?? []) {
        for (const p of series.points) dates.add(localDateKey(p.t))
      }
      map[code] = dates
    }
    return map
  }, [heatmapHistories])

  const comparisons = useMemo(() => {
    const todayKey = localDateKey(new Date().toISOString())
    const weekAgo = Date.now() - 7 * 86400000
    const today = entries.filter((e) => localDateKey(e.measured_at) === todayKey).length
    const week = entries.filter((e) => new Date(e.measured_at).getTime() >= weekAgo).length
    return { today, week, total: entries.length }
  }, [entries])

  const handleGenerateReport = async () => {
    setBusyReport(true)
    try {
      const report = await exportData()
      const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `astra-health-export-${new Date().toISOString().slice(0, 10)}.json`
      link.click()
      URL.revokeObjectURL(url)
      onNotify?.('Informe JSON descargado: registros confirmados, fuentes y límites del prototipo.')
    } catch (error) {
      onNotify?.(error.message)
    } finally {
      setBusyReport(false)
    }
  }

  const handleShareMedical = async () => {
    try {
      const caps = await getCapabilities()
      const connected = caps?.emergency_protocol?.communication_connected
      onNotify?.(connected
        ? 'Canal con el equipo médico disponible.'
        : 'Este prototipo no tiene comunicación con un equipo médico conectada. Nada se envió.')
    } catch {
      onNotify?.('Este prototipo no tiene comunicación con un equipo médico conectada. Nada se envió.')
    }
  }

  return (
    <div className="analytics-history-page" aria-label="Historial y evolución">
      {/* Header específico de la página */}
      <header className="page-header-pro">
        <div>
          <h1>Historial y evolución</h1>
          <p>HEALTH ANALYTICS · ¿CÓMO ESTÁ CAMBIANDO MI SALUD?</p>
        </div>
      </header>

      {/* Selector de periodo de tiempo */}
      <div className="time-filters-row">
        {TIME_FILTERS.map((f) => (
          <button
            key={f.label}
            className={`time-filter-pill ${activeRange === f.label ? 'is-active' : ''}`}
            onClick={() => setActiveRange(f.label)}
            type="button"
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Grid Principal: 4 gráficos 2x2 a la izquierda + Paneles a la derecha */}
      <div className="analytics-layout-grid">
        {/* Columna Izquierda: 4 Cards de Gráficos */}
        <div className="analytics-cards-2x2">
          {CHART_METRICS.map((meta) => (
            <MetricChartCard
              key={meta.code}
              meta={meta}
              historyData={data[meta.code]?.history}
              analysis={data[meta.code]?.analysis}
            />
          ))}
        </div>

        {/* Columna Derecha: Heatmap de Sistemas + Informe + Comparaciones */}
        <div className="analytics-sidebar-stack">
          {/* Panel 1: SISTEMAS · ÚLTIMOS 7 DÍAS (días con al menos un registro real) */}
          <Panel className="systems-heatmap-panel">
            <div className="heatmap-header">
              <span className="section-title">SISTEMAS · ÚLTIMOS 7 DÍAS</span>
              <div className="heatmap-days-labels">
                {heatmapDays.map((day) => <span key={day}>{formatDay(day)}</span>)}
              </div>
            </div>

            <div className="heatmap-rows-list">
              {HEATMAP_SYSTEMS.map((sys) => (
                <div key={sys.name} className="heatmap-system-row">
                  <span className="system-row-name">
                    {sys.name}
                    {sys.metrics.length === 0 && <small className="system-row-note">sin fuente de datos</small>}
                  </span>
                  <div className="heatmap-blocks-row">
                    {heatmapDays.map((day) => {
                      const hasRecord = sys.metrics.some((code) => recordedDatesByMetric[code]?.has(day))
                      return <span key={day} className={`heatmap-cell ${hasRecord ? 'cell--stable' : 'cell--empty'}`} />
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* Leyenda del heatmap */}
            <div className="heatmap-legend">
              <span className="legend-chip">
                <span className="chip-square square--stable" /> con registro
              </span>
              <span className="legend-chip">
                <span className="chip-square square--empty" /> sin registro
              </span>
            </div>
          </Panel>

          {/* Panel 2: INFORME SEMANAL */}
          <Panel className="weekly-report-panel">
            <span className="section-title">INFORME</span>
            <ul className="report-bullet-list">
              <li>
                <span className="bullet-cyan" />
                <span>Registros confirmados de la sesión</span>
              </li>
              <li>
                <span className="bullet-cyan" />
                <span>Fuentes y límites del prototipo</span>
              </li>
              <li>
                <span className="bullet-cyan" />
                <span>Formato JSON descargable</span>
              </li>
            </ul>

            <div className="report-buttons-group">
              <button className="primary-pill-btn report-btn" onClick={handleGenerateReport} disabled={busyReport} type="button">
                <span>{busyReport ? 'Generando…' : 'Generar informe'}</span>
              </button>
              <button className="secondary-pill-btn report-btn" onClick={handleShareMedical} type="button">
                <span>Compartir con equipo médico</span>
              </button>
            </div>
          </Panel>

          {/* Panel 3: COMPARACIONES */}
          <Panel className="comparisons-panel">
            <span className="section-title">COMPARACIONES</span>
            <div className="comparisons-list">
              <div className="comparison-row">
                <span>Registros de hoy</span>
                <span className="comp-tag tag--stable">{comparisons.today}</span>
              </div>
              <div className="comparison-row">
                <span>Últimos 7 días</span>
                <span className="comp-tag tag--stable">{comparisons.week}</span>
              </div>
              <div className="comparison-row">
                <span>Toda la misión</span>
                <span className="comp-tag tag--stable">{comparisons.total}</span>
              </div>
            </div>
          </Panel>
        </div>
      </div>
    </div>
  )
}
