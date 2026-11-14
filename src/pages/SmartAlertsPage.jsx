import { useState } from 'react'
import {
  AlertCircle,
  AlertTriangle,
  Check,
  CheckCircle2,
  Clock,
  Info,
  MessageSquare,
  ShieldAlert,
} from 'lucide-react'
import Panel from '../components/ui/Panel'

const ALERTS_DATA = [
  {
    id: 1,
    title: 'Sueño',
    time: 'Hoy 07:42',
    level: 'Preventivo',
    detailTitle: 'Sueño por debajo de su historial',
    status: 'Pendiente',
    metricValue: '4.6 h',
    metricSubtitle: 'promedio de 7 días: 5.7 h',
    reason: 'Cuatro noches seguidas con menos horas que su registro habitual, junto con más fatiga.',
    actions: ['Revisar la rutina de descanso', 'Registrar la calidad del sueño'],
    timeline: [
      { time: '07:42', text: 'Alerta generada' },
      { time: '07:45', text: 'Vinculada a tendencia combinada' },
      { time: 'Pendiente', text: 'Revisión del astronauta' },
    ],
  },
  {
    id: 2,
    title: 'Tendencia combinada',
    time: 'Hoy 07:45',
    level: 'Preventivo',
    detailTitle: 'Combinación de fatiga y sueño reducido',
    status: 'Pendiente',
    metricValue: '4/5 fatiga',
    metricSubtitle: 'correlación con 4.6 h de sueño',
    reason: 'La disminución de horas de descanso coincide con el aumento en la escala subjetiva de fatiga.',
    actions: ['Ajustar ciclo circadiano', 'Pausas activas programadas'],
    timeline: [
      { time: '07:45', text: 'Alerta generada' },
      { time: 'Pendiente', text: 'Revisión del astronauta' },
    ],
  },
  {
    id: 3,
    title: 'Evaluación emocional pendiente',
    time: 'Hoy 08:00',
    level: 'Info',
    detailTitle: 'Check-in psicológico diario no completado',
    status: 'Pendiente',
    metricValue: 'Mind Tracker',
    metricSubtitle: 'registro matutino',
    reason: 'Han pasado más de 2 horas desde el inicio de la jornada sin registro de estado anímico.',
    actions: ['Completar el cuestionario breve de 3 preguntas en Mind Tracker'],
    timeline: [
      { time: '08:00', text: 'Recordatorio programado' },
    ],
  },
  {
    id: 4,
    title: 'Presión arterial sin registro',
    time: 'Ayer 18:00',
    level: 'Info',
    detailTitle: 'Medición vespertina de tensión arterial no confirmada',
    status: 'Pendiente',
    metricValue: 'PA',
    metricSubtitle: 'tarde / noche',
    reason: 'No se recibió la confirmación de la toma vespertina en el horario habitual.',
    actions: ['Tomar presión arterial con el brazalete telemétrico'],
    timeline: [
      { time: '18:00', text: 'Alerta generada' },
    ],
  },
]

const RESOLVED_DATA = [
  { id: 101, title: 'Frecuencia cardíaca · Día 141', status: 'Atendida' },
  { id: 102, title: 'Hidratación baja · Día 139', status: 'Atendida' },
]

export default function SmartAlertsPage({ onNotify }) {
  const [selectedId, setSelectedId] = useState(1)
  const [reviewedIds, setReviewedIds] = useState([])

  const currentAlert = ALERTS_DATA.find((a) => a.id === selectedId) || ALERTS_DATA[0]
  const isReviewed = reviewedIds.includes(currentAlert.id)

  const handleMarkReviewed = () => {
    if (!isReviewed) {
      setReviewedIds([...reviewedIds, currentAlert.id])
      onNotify?.(`Alerta "${currentAlert.title}" marcada como revisada.`)
    } else {
      onNotify?.(`Esta alerta ya fue revisada.`)
    }
  }

  const handleContactMedical = () => {
    onNotify?.('Enlace médico abierto: Solicitud de teleconsulta enviada a Tierra.')
  }

  return (
    <div className="smart-alerts-page" aria-label="Alertas preventivas">
      {/* Header específico de la página */}
      <header className="page-header-pro">
        <div>
          <h1>Alertas preventivas</h1>
          <p>SMART ALERTS · POR QUÉ SE GENERÓ · QUÉ HACER</p>
        </div>
      </header>

      {/* 4 Tarjetas de resumen de alertas arriba */}
      <div className="alerts-summary-cards-row">
        {/* Informativo */}
        <Panel className="alert-stat-card card--info">
          <div className="stat-card-top">
            <span className="stat-label">Informativo</span>
            <button className="stat-action-btn" type="button" onClick={() => onNotify?.('Filtrando alertas informativas.')}>
              Consultar
            </button>
          </div>
          <strong className="stat-number">2</strong>
        </Panel>

        {/* Preventivo */}
        <Panel className="alert-stat-card card--warning">
          <div className="stat-card-top">
            <span className="stat-label">Preventivo</span>
            <button className="stat-action-btn" type="button" onClick={() => onNotify?.('Filtrando alertas preventivas.')}>
              Registrar y revisar
            </button>
          </div>
          <strong className="stat-number">2</strong>
        </Panel>

        {/* Atención */}
        <Panel className="alert-stat-card card--attention">
          <div className="stat-card-top">
            <span className="stat-label">Atención</span>
            <button className="stat-action-btn" type="button" onClick={() => onNotify?.('No hay alertas de atención activas.')}>
              Seguir protocolo
            </button>
          </div>
          <strong className="stat-number">0</strong>
        </Panel>

        {/* Crítico */}
        <Panel className="alert-stat-card card--critical">
          <div className="stat-card-top">
            <span className="stat-label">Crítico</span>
            <button className="stat-action-btn" type="button" onClick={() => onNotify?.('Sin emergencias críticas en la estación.')}>
              Emergencia
            </button>
          </div>
          <strong className="stat-number">0</strong>
        </Panel>
      </div>

      {/* Grid Principal: Lista a la izquierda + Detalle a la derecha */}
      <div className="alerts-main-grid">
        {/* Columna Izquierda: Lista de Alertas */}
        <div className="alerts-list-column">
          <Panel className="alerts-feed-panel">
            <span className="section-title">ALERTAS</span>
            <div className="alerts-items-feed">
              {ALERTS_DATA.map((alert) => {
                const isActive = alert.id === selectedId
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
                      {isItemReviewed ? 'Revisada' : alert.level}
                    </span>
                  </button>
                )
              })}
            </div>

            <span className="section-title section-title--resolved">RESUELTAS</span>
            <div className="resolved-items-feed">
              {RESOLVED_DATA.map((item) => (
                <div key={item.id} className="resolved-row">
                  <span>{item.title}</span>
                  <span className="alert-badge badge--resolved">{item.status}</span>
                </div>
              ))}
            </div>
          </Panel>
        </div>

        {/* Columna Derecha: Detalle de la Alerta Seleccionada */}
        <div className="alerts-detail-column">
          <Panel className="alert-detail-panel">
            <div className="detail-header-row">
              <div>
                <span className={`alert-badge badge--${currentAlert.level.toLowerCase()}`}>
                  {isReviewed ? 'Revisada' : currentAlert.level}
                </span>
                <h2>{currentAlert.detailTitle}</h2>
                <p className="detail-meta">
                  {currentAlert.time} · {isReviewed ? 'Atendida' : currentAlert.status}
                </p>
              </div>

              <div className="detail-stat-bubble">
                <strong>{currentAlert.metricValue}</strong>
                <small>{currentAlert.metricSubtitle}</small>
              </div>
            </div>

            {/* Gráfico de tendencia de la alerta */}
            <div className="alert-detail-chart-wrap">
              <div className="chart-y-axis">
                <span>9.0</span>
                <span>7.5</span>
                <span>6.0</span>
                <span>4.5</span>
                <span>3.0</span>
              </div>
              <div className="chart-canvas-wrap">
                <svg viewBox="0 0 400 90" className="alert-trend-svg" preserveAspectRatio="none">
                  {/* Línea horizontal límite / normalidad */}
                  <line x1="0" y1="30" x2="400" y2="30" stroke="rgba(34, 197, 94, 0.25)" strokeWidth="1" strokeDasharray="4 4" />
                  <line x1="0" y1="50" x2="400" y2="50" stroke="rgba(255, 255, 255, 0.05)" strokeDasharray="3 3" />
                  <line x1="0" y1="70" x2="400" y2="70" stroke="rgba(255, 255, 255, 0.05)" strokeDasharray="3 3" />

                  {/* Curva de descenso */}
                  <path
                    d="M 5 28 Q 70 28, 120 38 T 240 58 T 330 70 T 395 76"
                    fill="none"
                    stroke="#38bdf8"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />
                  <circle cx="395" cy="76" r="4.5" fill="#ffffff" stroke="#00b4f0" strokeWidth="2" />
                </svg>

                <div className="chart-x-axis">
                  <span>D137</span>
                  <span>D139</span>
                  <span>D141</span>
                  <span>D143</span>
                  <span>D145</span>
                </div>
              </div>
            </div>

            {/* Dos bloques explicativos: Por qué se generó + Qué hacer */}
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

            {/* Línea de tiempo / Tracking */}
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
                <span>{isReviewed ? '✓ Alerta revisada' : 'Marcar como revisada'}</span>
              </button>

              <button
                className="secondary-pill-btn"
                onClick={handleContactMedical}
                type="button"
              >
                <span>Contactar al equipo médico</span>
              </button>

              <span className="example-rule-hint">Regla de ejemplo</span>
            </div>
          </Panel>
        </div>
      </div>
    </div>
  )
}

