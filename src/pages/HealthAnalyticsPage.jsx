import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, Download, FileText } from 'lucide-react'
import Panel from '../components/ui/Panel'
import { getAnalysis, getCheckIns, getHistory, listEntries } from '../api/client'
import { formatDay, formatValue, formatWhen, localDateKey, METRIC_LABELS } from '../data/format'
import { useLanguage } from '../app/LanguageContext'

const ANALYTICS_METRIC_EN = { heart_rate: 'HEART RATE', sleep: 'SLEEP', blood_pressure: 'BLOOD PRESSURE (SYSTOLIC)', glucose: 'GLUCOSE', temperature: 'Temperature', oxygen_saturation: 'Oxygen saturation' }
const RANGE_EN = { '24 h': '24 h', '7 días': '7 days', '30 días': '30 days', '3 meses': '3 months', 'Toda la misión': 'Entire mission' }

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
  const { language, tr } = useLanguage()
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
          <span className="card-kicker">{language === 'en' ? ANALYTICS_METRIC_EN[meta.code] : meta.kicker}</span>
          <div className="card-val-row">
            {loading ? <Skeleton w={110} h={26} /> : (
              <>
                <strong>{latest ? `${formatValue({ metric: meta.code, values: latest.values })} ${series?.unit || ''}` : '—'}</strong>
                <span className={`card-comparison ${compClass}`}>{comparison}</span>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="metric-chart-canvas-wrap">
        {loading ? (
          <SkeletonGroup label={`Cargando ${meta.kicker}…`}>
            <Skeleton w="100%" h={80} />
            <Skeleton w="60%" h={11} />
          </SkeletonGroup>
        ) : values.length >= 2 ? (
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
                <span>{formatDay(points[0].t, language)}</span>
                <span>{formatDay(points[Math.floor((points.length - 1) / 2)].t, language)}</span>
                <span>{formatDay(points.at(-1).t, language)}</span>
              </div>
            </div>
          </>
        ) : (
          <p className="chart-empty">{tr('Sin registros suficientes en este periodo. Registra datos reales para ver la evolución.', 'Not enough records in this period. Record real data to see a trend.')}</p>
        )}
      </div>
      <span className="axis-vertical-hint">{tr('Eje vertical', 'Vertical axis')}: {series?.unit || meta.unitHint}</span>
    </Panel>
  )
}

function HealthReportView({ activeRange, days, entries, checkIns, onChangeRange, onBack }) {
  const { language, tr } = useLanguage()
  const report = useMemo(() => {
    const now = Date.now()
    const cutoff = days >= 3650 ? Number.NEGATIVE_INFINITY : now - days * 86400000
    const physical = entries
      .filter((entry) => new Date(entry.measured_at).getTime() >= cutoff)
      .filter((entry) => entry.candidate?.kind === 'measurement')
      .sort((a, b) => new Date(b.measured_at) - new Date(a.measured_at))
    const wellbeing = checkIns
      .filter((entry) => new Date(`${entry.date}T12:00:00`).getTime() >= cutoff)
      .sort((a, b) => b.date.localeCompare(a.date))
    const recordedDays = new Set([
      ...physical.map((entry) => localDateKey(entry.measured_at)),
      ...wellbeing.map((entry) => entry.date),
    ])
    let totalDays = days
    if (days >= 3650) {
      const dates = [...physical.map((entry) => entry.measured_at), ...wellbeing.map((entry) => `${entry.date}T12:00:00`)]
      const oldest = dates.sort((a, b) => new Date(a) - new Date(b))[0]
      totalDays = oldest
        ? Math.max(1, Math.floor((now - new Date(oldest).getTime()) / 86400000) + 1)
        : 0
    }
    return { physical, wellbeing, recordedDays: recordedDays.size, totalDays, total: physical.length + wellbeing.length }
  }, [checkIns, days, entries])

  return (
    <div className="health-report-screen" aria-label={tr('Resumen de registros de salud', 'Health records summary')}>
      <header className="report-screen-header">
        <button className="report-back-button" onClick={onBack} type="button">
          <ArrowLeft size={17} />
          <span>{tr('Volver al historial', 'Back to history')}</span>
        </button>
        <button className="secondary-pill-btn report-download-button" onClick={() => window.print()} type="button">
          <Download size={16} />
          <span>{tr('Guardar como PDF', 'Save as PDF')}</span>
        </button>
      </header>

      <div className="report-title-block">
        <div className="report-title-icon"><FileText size={23} /></div>
        <div>
          <span className="section-title">{tr('INFORME PERSONAL', 'PERSONAL REPORT')}</span>
          <h1>{tr('Resumen de registros', 'Records summary')}</h1>
          <p>{tr('Información confirmada por la persona. Generado el', 'Information confirmed by the user. Generated on')} {formatWhen(new Date().toISOString(), language)}.</p>
        </div>
      </div>

      <div className="time-filters-row report-period-filters" aria-label={tr('Periodo del informe', 'Report period')}>
        {TIME_FILTERS.map((filter) => (
          <button
            key={filter.label}
            className={`time-filter-pill ${activeRange === filter.label ? 'is-active' : ''}`}
            onClick={() => onChangeRange(filter.label)}
            type="button"
          >
            {language === 'en' ? RANGE_EN[filter.label] : filter.label}
          </button>
        ))}
      </div>

      <Panel className="report-coverage-panel">
        <div>
          <span>{tr('Periodo seleccionado', 'Selected period')}</span>
          <strong>{language === 'en' ? RANGE_EN[activeRange] : activeRange}</strong>
        </div>
        <div>
          <span>{tr('Días con registros', 'Days with records')}</span>
          <strong>{report.recordedDays} {tr('de', 'of')} {report.totalDays}</strong>
        </div>
        <div>
          <span>{tr('Datos incluidos', 'Included records')}</span>
          <strong>{report.total}</strong>
        </div>
        <p>
          {report.recordedDays === report.totalDays && report.totalDays > 0
            ? tr('Hay información registrada para todos los días del periodo.', 'Information is recorded for every day in this period.')
            : tr(`Solo se muestran los ${report.recordedDays} días con información. Los días faltantes no se completan ni se estiman.`, `Only the ${report.recordedDays} days with information are shown. Missing days are not filled in or estimated.`)}
        </p>
      </Panel>

      <div className="report-sections-grid">
        <Panel className="report-records-panel">
          <div className="report-section-heading">
            <span className="section-title">{tr('INDICADORES FÍSICOS', 'PHYSICAL METRICS')}</span>
            <small>{report.physical.length} {tr('registros', 'records')}</small>
          </div>
          {report.physical.length ? (
            <div className="report-record-list">
              {report.physical.map((entry) => (
                <article className="report-record-row" key={entry.id}>
                  <div>
                    <strong>{language === 'en' ? ANALYTICS_METRIC_EN[entry.candidate.metric] || entry.candidate.metric : METRIC_LABELS[entry.candidate.metric] || entry.candidate.metric}</strong>
                    <time dateTime={entry.measured_at}>{formatWhen(entry.measured_at, language)}</time>
                  </div>
                  <span>{formatValue(entry.candidate)} {entry.candidate.unit}</span>
                </article>
              ))}
            </div>
          ) : <p className="report-empty-state">{tr('No hay indicadores físicos registrados en este periodo.', 'No physical metrics recorded in this period.')}</p>}
        </Panel>

        <Panel className="report-records-panel">
          <div className="report-section-heading">
            <span className="section-title">{tr('CÓMO DIJISTE SENTIRTE', 'HOW YOU SAID YOU FELT')}</span>
            <small>{report.wellbeing.length} {tr('registros', 'records')}</small>
          </div>
          {report.wellbeing.length ? (
            <div className="report-record-list">
              {report.wellbeing.map((entry) => (
                <article className="report-record-row report-feeling-row" key={entry.id}>
                  <p>{language === 'en' ? ({ Cansado: 'Tired', Tranquilo: 'Calm', Tenso: 'Tense', 'Con energía': 'Energetic', Nostálgico: 'Nostalgic' }[entry.mood_word] || entry.mood_word) : entry.mood_word} · {tr('ánimo', 'mood')} {entry.mood_score}/5</p>
                  <time dateTime={entry.date}>{new Date(`${entry.date}T12:00:00`).toLocaleDateString(language === 'en' ? 'en-US' : 'es-CO')}</time>
                </article>
              ))}
            </div>
          ) : <p className="report-empty-state">{tr('No hay registros sobre cómo te sentiste en este periodo.', 'No mood records in this period.')}</p>}
        </Panel>
      </div>

      <Panel className="report-limits-panel">
        <strong>{tr('Alcance de este resumen', 'Scope of this summary')}</strong>
        <ul>
          <li>{tr('No incluye el diario emocional.', 'It does not include the emotional journal.')}</li>
          <li>{tr('No completa ni inventa días sin registros.', 'It does not fill in or invent missing days.')}</li>
          <li>{tr('No realiza diagnósticos ni evaluaciones clínicas.', 'It does not provide diagnoses or clinical assessments.')}</li>
          <li>{tr('No se envía automáticamente a ninguna persona o institución.', 'It is not sent automatically to any person or institution.')}</li>
        </ul>
      </Panel>
    </div>
  )
}

export default function HealthAnalyticsPage({ onNotify }) {
  const { language, tr } = useLanguage()
  const [activeRange, setActiveRange] = useState('7 días')
  const [data, setData] = useState({}) // code -> { history, analysis }
  const [heatmapHistories, setHeatmapHistories] = useState({})
  const [entries, setEntries] = useState([])
  const [loadedDays, setLoadedDays] = useState(null) // rango cuyos gráficos ya se cargaron
  const [heatmapLoaded, setHeatmapLoaded] = useState(false)
  const [entriesLoaded, setEntriesLoaded] = useState(false)
  const [reportCheckIns, setReportCheckIns] = useState([])
  const [busyReport, setBusyReport] = useState(false)
  const [reportOpen, setReportOpen] = useState(false)

  const days = TIME_FILTERS.find((f) => f.label === activeRange)?.days ?? 7
  const chartsLoading = loadedDays !== days

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
      if (!cancelled) { setData(result); setLoadedDays(days) }
    }
    load()
    return () => { cancelled = true }
  }, [days])

  // El mapa de sistemas siempre mira los últimos 7 días, con fuentes reales.
  useEffect(() => {
    let cancelled = false
    const codes = [...new Set(HEATMAP_SYSTEMS.flatMap((s) => s.metrics))]
    Promise.all(codes.map((code) => getHistory(code, 7).catch(() => null))).then((histories) => {
      if (!cancelled) {
        setHeatmapHistories(Object.fromEntries(codes.map((code, i) => [code, histories[i]])))
        setHeatmapLoaded(true)
      }
    })
    listEntries()
      .then((list) => { if (!cancelled) setEntries(list.entries || []) })
      .catch(() => {})
      .finally(() => { if (!cancelled) setEntriesLoaded(true) })
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
      const [list, mind] = await Promise.all([listEntries(), getCheckIns(3650)])
      setEntries(list.entries || [])
      setReportCheckIns(mind.check_ins || [])
      setReportOpen(true)
    } catch (error) {
      onNotify?.(error.message)
    } finally {
      setBusyReport(false)
    }
  }

  if (reportOpen) {
    return (
      <HealthReportView
        activeRange={activeRange}
        days={days}
        entries={entries}
        checkIns={reportCheckIns}
        onChangeRange={setActiveRange}
        onBack={() => setReportOpen(false)}
      />
    )
  }

  return (
    <div className="analytics-history-page" aria-label={tr('Historial y evolución', 'History and trends')}>
      {/* Header específico de la página */}
      <header className="page-header-pro">
        <div>
          <h1>{tr('Historial y evolución', 'History and trends')}</h1>
          <p>{tr('ANÁLISIS DE SALUD · ¿CÓMO ESTÁ CAMBIANDO MI SALUD?', 'HEALTH ANALYTICS · HOW IS MY HEALTH CHANGING?')}</p>
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
            {language === 'en' ? RANGE_EN[f.label] : f.label}
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
              loading={chartsLoading}
            />
          ))}
        </div>

        {/* Columna Derecha: Heatmap de Sistemas + Informe + Comparaciones */}
        <div className="analytics-sidebar-stack">
          {/* Panel 1: SISTEMAS · ÚLTIMOS 7 DÍAS (días con al menos un registro real) */}
          <Panel className="systems-heatmap-panel">
            <div className="heatmap-header">
              <span className="section-title">{tr('SISTEMAS · ÚLTIMOS 7 DÍAS', 'SYSTEMS · LAST 7 DAYS')}</span>
              <div className="heatmap-days-labels">
                {heatmapDays.map((day) => <span key={day}>{formatDay(day, language)}</span>)}
              </div>
            </div>

            <div className="heatmap-rows-list">
              {HEATMAP_SYSTEMS.map((sys) => (
                <div key={sys.name} className="heatmap-system-row">
                  <span className="system-row-name">
                    {language === 'en' ? ({ Cardiovascular: 'Cardiovascular', Metabólica: 'Metabolic', Descanso: 'Rest', 'Músculo y hueso': 'Muscle and bone', Psicológica: 'Psychological' }[sys.name]) : sys.name}
                    {sys.metrics.length === 0 && <small className="system-row-note">{tr('sin fuente de datos', 'no data source')}</small>}
                  </span>
                  <div className="heatmap-blocks-row">
                    {heatmapDays.map((day) => {
                      if (!heatmapLoaded) return <Skeleton key={day} w={22} h={22} radius="6px" />
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
                <span className="chip-square square--stable" /> {tr('con registro', 'recorded')}
              </span>
              <span className="legend-chip">
                <span className="chip-square square--empty" /> {tr('sin registro', 'no record')}
              </span>
            </div>
          </Panel>

          {/* Panel 2: vista previa del informe */}
          <Panel className="weekly-report-panel">
            <span className="section-title">{tr('INFORME', 'REPORT')}</span>
            <ul className="report-bullet-list">
              <li>
                <span className="bullet-cyan" />
                <span>{tr('Vista previa antes de descargar', 'Preview before downloading')}</span>
              </li>
              <li>
                <span className="bullet-cyan" />
                <span>{tr('Solo datos confirmados del periodo', 'Only confirmed data from this period')}</span>
              </li>
              <li>
                <span className="bullet-cyan" />
                <span>{tr('Sin diagnóstico ni envío automático', 'No diagnosis or automatic sharing')}</span>
              </li>
            </ul>

            <div className="report-buttons-group">
              <button className="primary-pill-btn report-btn" onClick={handleGenerateReport} disabled={busyReport} type="button">
                <span>{busyReport ? tr('Preparando…', 'Preparing…') : tr('Ver informe', 'View report')}</span>
              </button>
            </div>
          </Panel>

          {/* Panel 3: COMPARACIONES */}
          <Panel className="comparisons-panel">
            <span className="section-title">{tr('COMPARACIONES', 'COMPARISONS')}</span>
            <div className="comparisons-list">
              <div className="comparison-row">
                <span>{tr('Registros de hoy', "Today's records")}</span>
                <span className="comp-tag tag--stable">{comparisons.today}</span>
              </div>
              <div className="comparison-row">
                <span>{tr('Últimos 7 días', 'Last 7 days')}</span>
                <span className="comp-tag tag--stable">{comparisons.week}</span>
              </div>
              <div className="comparison-row">
                <span>{tr('Toda la misión', 'Entire mission')}</span>
                <span className="comp-tag tag--stable">{comparisons.total}</span>
              </div>
            </div>
          </Panel>
        </div>
      </div>
    </div>
  )
}
