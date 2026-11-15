import { Activity, Check, Plus } from 'lucide-react'
import Panel from '../ui/Panel'
import { tasks } from '../../data/dashboardData'
import { localDateKey } from '../../data/format'

export default function TasksPanel({ onOpenVitals, latest }) {
  // Marcado solo con datos: el indicador tiene un registro confirmado de hoy.
  const todayKey = localDateKey(new Date().toISOString())
  const recordedToday = (metric) => {
    const entry = latest?.[metric]
    const measuredAt = entry?.measured_at || entry?.candidate?.measured_at
    if (!measuredAt) return false
    return localDateKey(measuredAt) === todayKey
  }

  return (
    <Panel className="tasks-panel-pro">
      <div className="tasks-panel-pro__header">
        <Activity size={17} className="tasks-icon" />
        <span className="section-title">PENDIENTES DE HOY</span>
      </div>

      <div className="task-list-pro">
        {tasks.map((task) => {
          const isDone = recordedToday(task.metric)
          return (
            <button
              key={task.label}
              className={`task-row-pro ${isDone ? 'is-done' : ''}`}
              onClick={isDone ? undefined : onOpenVitals}
              title={isDone ? 'Registrado hoy' : 'Abrir registro de datos'}
              type="button"
            >
              <span className={`task-checkbox-circle ${isDone ? 'checked' : ''}`}>
                {isDone && <Check size={11} strokeWidth={3} />}
              </span>
              <span className="task-row-text">{task.label}</span>
            </button>
          )
        })}
      </div>

      <div className="tasks-panel-pro__actions">
        <button className="primary-pill-btn" onClick={onOpenVitals} type="button">
          <Plus size={15} strokeWidth={2.5} />
          <span>Registrar datos</span>
        </button>
      </div>

      {/* Ilustración de órbitas holográficas de fondo */}
      <div className="tasks-panel-pro__orbits" aria-hidden="true">
        <svg viewBox="0 0 240 140" fill="none">
          <ellipse cx="160" cy="90" rx="90" ry="40" stroke="rgba(49, 220, 255, 0.45)" strokeWidth="1.2" transform="rotate(-15 160 90)" />
          <ellipse cx="150" cy="95" rx="120" ry="50" stroke="rgba(24, 140, 255, 0.3)" strokeWidth="1" transform="rotate(10 150 95)" />
          <ellipse cx="140" cy="85" rx="70" ry="30" stroke="rgba(49, 220, 255, 0.2)" strokeWidth="0.8" transform="rotate(-30 140 85)" />
        </svg>
      </div>
    </Panel>
  )
}
