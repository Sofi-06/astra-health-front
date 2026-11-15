import { useEffect, useMemo, useState } from 'react'
import Panel from '../components/ui/Panel'
import { getAnalysis, getCapabilities, listEntries } from '../api/client'
import { METRIC_LABELS, formatDay, formatValue, formatWhen } from '../data/format'

const TRACKED_METRICS = ['heart_rate', 'blood_pressure', 'temperature', 'oxygen_saturation', 'glucose', 'sleep']

const round1 = (n) => Math.round(n * 10) / 10

// Reglas técnicas y descriptivas sobre los registros reales. No clasifican
// severidad médica ni explican causas: solo describen qué hay (o falta) en SQLite.

// Etiquetas visibles: descriptivas, sin niveles clínicos (no hay clasificador).
const LEVEL_LABELS = {
  Info: 'Informativo',
  Preventivo: 'Cambio observado',
}
function buildAlerts(entries, analyses) {
  const alerts = []
  const now = Date.now()
  const weekAgo = now - 7 * 86400000

  const latestByMetric = {}
  for (const entry of entries) {
    const code = entry.candidate?.metric
    if (entry.candidate?.kind !== 'measurement' || !code) continue
    if (!latestByMetric[code] || entry.measured_at > latestByMetric[code].measured_at) latestByMetric[code] = entry
  }

  for (const code of TRACKED_METRICS) {
    const label = METRIC_LABELS[code] || code
    const recent = entries.filter(
      (e) => e.candidate?.kind === 'measurement' && e.candidate?.metric === code
        && new Date(e.measured_at).getTime() >= weekAgo
    )
    if (recent.length === 0) {
      const last = latestByMetric[code]
      alerts.push({
        id: `missing-${code}`,
        metric: code,
        title: label,
        time: 'Ahora',
        level: 'Info',
        detailTitle: `Sin registros de ${label.toLowerCase()} en los últimos 7 días`,
        status: 'Pendiente',
        metricValue: '0',
        metricSubtitle: last ? `último registro: ${formatWhen(last.measured_at)}` : 'sin registros en la misión',
        reason: `Regla visible: se muestra cuando un indicador no tiene registros confirmados en los últimos 7 días. ${last ? `El último registro es del ${formatWhen(last.measured_at)}.` : 'No hay ningún registro de este indicador en la sesión.'}`,
        actions: [`Registrar ${label.toLowerCase()} con el flujo de revisión y confirmación`],
        timeline: [
          { time: 'Ahora', text: 'Aviso generado al revisar los registros' },
          { time: last ? formatDay(last.measured_at) : '—', text: last ? 'Último registro confirmado' : 'Sin registros' },
        ],
      })
    }
  }

  // Sueño: cambio entre el primer y el último registro de la ventana (cálculo del backend).
  const sleepStats = analyses.sleep?.personal_calculation?.stats
  if (sleepStats?.change_last_minus_first_hours != null && sleepStats.change_last_minus_first_hours !== 0) {
    const change = sleepStats.change_last_minus_first_hours
    alerts.push({
      id: 'sleep-change',
      metric: 'sleep',
      title: 'Sueño',
      time: 'Ahora',
      level: 'Preventivo',
      detailTitle: `El último registro de sueño es ${change > 0 ? 'mayor' : 'menor'} que el primero de la ventana`,
      status: 'Pendiente',
      metricValue: `${round1(sleepStats.last.hours)} h`,
      metricSubtitle: `promedio de la ventana: ${round1(sleepStats.mean_hours)} h`,
      reason: `Regla visible: con al menos 3 noches registradas, se compara el primer registro (${round1(sleepStats.first.hours)} h) con el último (${round1(sleepStats.last.hours)} h): ${change > 0 ? '+' : ''}${round1(change)} h. Es una descripción de los datos, no una evaluación clínica.`,
      actions: ['Revisar los registros de sueño en Health Analytics', 'Registrar las horas que falten'],
      timeline: [
        { time: 'Ahora', text: 'Aviso generado al revisar los registros' },
        { time: formatDay(sleepStats.first.date), text: 'Primer registro de la ventana' },
        { time: formatDay(sleepStats.last.date), text: 'Último registro de la ventana' },
      ],
    })
  }

  // Signos vitales: misma regla descriptiva por indicador.
  for (const code of TRACKED_METRICS) {
    if (code === 'sleep') continue
    const series = analyses[code]?.personal_calculation?.series?.[0]
    const stats = series?.stats
    const change = stats?.change_last_minus_first
    if (!change || change.every((d) => d === 0)) continue
    const label = METRIC_LABELS[code] || code
    const firstText = stats.first.values.join('/')
    const lastText = stats.last.values.join('/')
    const changeText = change.map((d) => `${d > 0 ? '+' : ''}${round1(d)}`).join('/')
    alerts.push({
      id: `change-${code}`,
      metric: code,
      title: label,
      time: 'Ahora',
      level: 'Preventivo',
      detailTitle: `${label}: cambio entre el primer y el último registro de la ventana`,
      status: 'Pendiente',
      metricValue: `${lastText} ${series.unit}`,
      metricSubtitle: `promedio: ${stats.mean.map(round1).join('/')} ${series.unit}`,
      reason: `Regla visible: con al menos 3 registros, se compara el primero (${firstText} ${series.unit}) con el último (${lastText} ${series.unit}): ${changeText} ${series.unit}. Es una descripción de los datos, no una evaluación clínica.`,
      actions: [`Revisar la evolución de ${label.toLowerCase()} en Health Analytics`],
      timeline: [
        { time: 'Ahora', text: 'Aviso generado al revisar los registros' },
        { time: formatDay(stats.first.date), text: 'Primer registro de la ventana' },
        { time: formatDay(stats.last.date), text: 'Último registro de la ventana' },
      ],
    })
  }

  return alerts
}

function AlertChart({ alert, analyses }) {
  let points = []
  let unit = ''
  if (alert.metric === 'sleep') {
    const nights = analyses.sleep?.personal_calculation?.nights ?? []
    points = nights.map((n) => ({ t: n.date, value: n.hours }))
    unit = 'h'
  } else {
    const series = analyses[alert.metric]?.personal_calculation?.series?.[0]
    points = (series?.points ?? []).map((p) => ({ t: p.t, value: p.values[0] }))
    unit = series?.unit || ''
  }

  if (points.length < 2) {
    return <p className="chart-empty">Sin registros suficientes en la ventana para dibujar la tendencia.</p>
  }

  const width = 400
  const height = 90
  const pad = 5
  const values = points.map((p) => p.value)
  let min = Math.min(...values)
  let max = Math.max(...values)
  if (min === max) { min -= 1; max += 1 }
  const coords = values.map((v, i) => [
    pad + (i / (values.length - 1)) * (width - pad * 2),
    pad + (1 - (v - min) / (max - min)) * (height - pad * 2 - 12),
  ])
  const path = coords.map(([x, y], i) => `${i ? 'L' : 'M'} ${x.toFixed(1)} ${y.toFixed(1)}`).join(' ')
  const last = coords.at(-1)

  return (
    <div className="alert-detail-chart-wrap">
      <div className="chart-y-axis">
        <span>{round1(max)}</span>
        <span>{round1((max + min) / 2)}</span>
        <span>{round1(min)}</span>
      </div>
      <div className="chart-canvas-wrap">
        <svg viewBox={`0 0 ${width} ${height}`} className="alert-trend-svg" preserveAspectRatio="none">
          <line x1="0" y1="30" x2={width} y2="30" stroke="rgba(255, 255, 255, 0.05)" strokeDasharray="3 3" />
          <line x1="0" y1="60" x2={width} y2="60" stroke="rgba(255, 255, 255, 0.05)" strokeDasharray="3 3" />
          <path d={path} fill="none" stroke="#38bdf8" strokeWidth="2.5" strokeLinecap="round" />
          <circle cx={last[0]} cy={last[1]} r="4.5" fill="#ffffff" stroke="#00b4f0" strokeWidth="2" />
        </svg>
        <div className="chart-x-axis">
          <span>{formatDay(points[0].t)}</span>
          <span>{formatDay(points[Math.floor((points.length - 1) / 2)].t)}</span>
          <span>{formatDay(points.at(-1).t)}</span>
        </div>
      </div>
      <span className="axis-vertical-hint">Unidad: {unit}</span>
    </div>
  )
}

export default function SmartAlertsPage({ onNotify, onOpenVitals }) {
  const [entries, setEntries] = useState([])
  const [analyses, setAnalyses] = useState({})
  const [loaded, setLoaded] = useState(false)
  const [selectedId, setSelectedId] = useState(null)
  const [reviewedIds, setReviewedIds] = useState([])

  useEffect(() => {
    let cancelled = false
    Promise.all([
      listEntries().catch(() => ({ entries: [] })),
      ...TRACKED_METRICS.map((code) => getAnalysis(code, 7).catch(() => null)),
    ]).then(([list, ...results]) => {
      if (cancelled) return
      setEntries(list.entries || [])
      setAnalyses(Object.fromEntries(TRACKED_METRICS.map((code, i) => [code, results[i]])))
      setLoaded(true)
    })
    return () => { cancelled = true }
  }, [])

  const alerts = useMemo(() => buildAlerts(entries, analyses), [entries, analyses])
  const currentAlert = alerts.find((a) => a.id === selectedId) || alerts[0]
  const isReviewed = currentAlert ? reviewedIds.includes(currentAlert.id) : false
  const infoCount = alerts.filter((a) => a.level === 'Info').length
  const preventiveCount = alerts.filter((a) => a.level === 'Preventivo').length
  const resolved = alerts.filter((a) => reviewedIds.includes(a.id))

  const handleMarkReviewed = () => {
    if (!currentAlert) return
    if (!isReviewed) {
      setReviewedIds([...reviewedIds, currentAlert.id])
      onNotify?.(`Aviso "${currentAlert.title}" marcado como revisado.`)
    } else {
      onNotify?.('Este aviso ya fue revisado.')
    }
  }

  const handleContactMedical = async () => {
    try {
      const caps = await getCapabilities()
      onNotify?.(caps?.emergency_protocol?.communication_connected
        ? 'Canal con el equipo médico disponible.'
        : 'Este prototipo no tiene comunicación con un equipo médico conectada. Nada se envió.')
    } catch {
      onNotify?.('Este prototipo no tiene comunicación con un equipo médico conectada. Nada se envió.')
    }
  }

  return (
    <div className="smart-alerts-page" aria-label="Alertas preventivas">
      {/* Header específico de la página */}
      <header className="page-header-pro">
        <div>
          <h1>Avisos y cambios observados</h1>
          <p>SMART ALERTS · REGLAS VISIBLES SOBRE TUS REGISTROS</p>
        </div>
      </header>

      {/* 4 Tarjetas de resumen */}
      <div className="alerts-summary-cards-row">
        <Panel className="alert-stat-card card--info">
          <div className="stat-card-top">
            <span className="stat-label">Informativo</span>
            <span className="stat-note">sin registros recientes</span>
          </div>
          <strong className="stat-number">{loaded ? infoCount : '…'}</strong>
        </Panel>

        <Panel className="alert-stat-card card--warning">
          <div className="stat-card-top">
            <span className="stat-label">Cambio observado</span>
            <span className="stat-note">descriptivo, no clínico</span>
          </div>
          <strong className="stat-number">{loaded ? preventiveCount : '…'}</strong>
        </Panel>

        <Panel className="alert-stat-card card--attention">
          <div className="stat-card-top">
            <span className="stat-label">Atención</span>
            <span className="stat-note">sin clasificador clínico</span>
          </div>
          <strong className="stat-number stat-number--na">No evaluado</strong>
        </Panel>

        <Panel className="alert-stat-card card--critical">
          <div className="stat-card-top">
            <span className="stat-label">Crítico</span>
            <span className="stat-note">sin clasificador clínico</span>
          </div>
          <strong className="stat-number stat-number--na">No evaluado</strong>
        </Panel>
      </div>

      {/* Grid Principal: Lista a la izquierda + Detalle a la derecha */}
      <div className="alerts-main-grid">
        {/* Columna Izquierda: Lista de Alertas */}
        <div className="alerts-list-column">
          <Panel className="alerts-feed-panel">
            <span className="section-title">ALERTAS</span>
            <div className="alerts-items-feed">
              {loaded && alerts.length === 0 && (
                <p className="chart-empty">Todos los indicadores tienen registros recientes y sin cambios en la ventana.</p>
              )}
              {alerts.map((alert) => {
                const isActive = alert.id === currentAlert?.id
                const isItemReviewed = reviewedIds.includes(alert.id)
                return (
                  <button
                    key={alert.id}
                    className={`alert-feed-item ${isActive ? 'is-active' : ''} item--${alert.level.toLowerCase()}`}
                    onClick={() => setSelectedId(alert.id)}
                    type="button"
                  >
                    <div className="item-bar-indicator" />
                    <div className="item-info">
                      <strong>{alert.title}</strong>
                      <small>{alert.time}</small>
                    </div>
                    <span className={`alert-badge badge--${alert.level.toLowerCase()}`}>
                      {isItemReviewed ? 'Revisada' : (LEVEL_LABELS[alert.level] || alert.level)}
                    </span>
                  </button>
                )
              })}
            </div>

            <span className="section-title section-title--resolved">RESUELTAS</span>
            <div className="resolved-items-feed">
              {resolved.length === 0 && <p className="chart-empty">Ninguna avisada como revisada todavía.</p>}
              {resolved.map((item) => (
                <div key={item.id} className="resolved-row">
                  <span>{item.title}</span>
                  <span className="alert-badge badge--resolved">Revisada</span>
                </div>
              ))}
            </div>
          </Panel>
        </div>

        {/* Columna Derecha: Detalle de la Alerta Seleccionada */}
        <div className="alerts-detail-column">
          <Panel className="alert-detail-panel">
            {!currentAlert && <p className="chart-empty">Cargando los registros…</p>}
            {currentAlert && (
              <>
                <div className="detail-header-row">
                  <div>
                    <span className={`alert-badge badge--${currentAlert.level.toLowerCase()}`}>
                      {isReviewed ? 'Revisada' : (LEVEL_LABELS[currentAlert.level] || currentAlert.level)}
                    </span>
                    <h2>{currentAlert.detailTitle}</h2>
                    <p className="detail-meta">
                      {currentAlert.time} · {isReviewed ? 'Revisada' : currentAlert.status}
                    </p>
                  </div>

                  <div className="detail-stat-bubble">
                    <strong>{currentAlert.metricValue}</strong>
                    <small>{currentAlert.metricSubtitle}</small>
                  </div>
                </div>

                <AlertChart alert={currentAlert} analyses={analyses} />

                {/* Dos bloques explicativos: regla visible + qué hacer */}
                <div className="alert-explanation-grid">
                  <div className="explanation-block">
                    <h3>POR QUÉ SE GENERÓ</h3>
                    <p>{currentAlert.reason}</p>
                  </div>

                  <div className="explanation-block">
                    <h3>QUÉ HACER</h3>
                    <ul className="alert-actions-list">
                      {currentAlert.actions.map((act) => (
                        <li key={act}>
                          <span className="action-bullet" />
                          <span>{act}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Línea de tiempo */}
                <div className="alert-timeline-row">
                  {currentAlert.timeline.map((item, idx) => (
                    <div key={idx} className="timeline-step">
                      <div className="timeline-node" />
                      <div>
                        <strong>{item.time}</strong>
                        <span>{item.text}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Acciones finales */}
                <div className="alert-footer-actions">
                  <button
                    className="primary-pill-btn"
                    onClick={handleMarkReviewed}
                    type="button"
                  >
                    <span>{isReviewed ? '✓ Aviso revisado' : 'Marcar como revisada'}</span>
                  </button>

                  <button
                    className="secondary-pill-btn"
                    onClick={() => onOpenVitals?.()}
                    type="button"
                  >
                    <span>Registrar datos</span>
                  </button>

                  <button
                    className="secondary-pill-btn"
                    onClick={handleContactMedical}
                    type="button"
                  >
                    <span>Contactar al equipo médico</span>
                  </button>

                  <span className="example-rule-hint">Derivada de tus registros, con regla visible</span>
                </div>
              </>
            )}
          </Panel>
        </div>
      </div>
    </div>
  )
}
