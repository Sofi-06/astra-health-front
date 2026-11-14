import { useState } from 'react'
import { Activity, Check, Plus } from 'lucide-react'
import Panel from '../ui/Panel'
import { tasks } from '../../data/dashboardData'

export default function TasksPanel({ onOpenVitals }) {
  // Los dos primeros marcados por defecto como en la imagen
  const [done, setDone] = useState([0, 1])

  const toggle = (index) => {
    setDone((current) =>
      current.includes(index) ? current.filter((item) => item !== index) : [...current, index]
    )
  }

  return (
    <Panel className="tasks-panel-pro">
      <div className="tasks-panel-pro__header">
        <Activity size={17} className="tasks-icon" />
        <span className="section-title">PENDIENTES DE HOY</span>
      </div>

      <div className="task-list-pro">
        {tasks.map((task, index) => {
          const isDone = done.includes(index)
          return (
            <button
              key={task}
              className={`task-row-pro ${isDone ? 'is-done' : ''}`}
              onClick={() => toggle(index)}
              type="button"
            >
              <span className={`task-checkbox-circle ${isDone ? 'checked' : ''}`}>
                {isDone && <Check size={11} strokeWidth={3} />}
              </span>
              <span className="task-row-text">{task}</span>
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
