import { useState } from 'react'
import { Check, Plus } from 'lucide-react'
import Panel from '../ui/Panel'
import { tasks } from '../../data/dashboardData'
import { METRIC_LABELS, formatValue } from '../../data/format'

export default function TasksPanel({ onOpenVitals, latest }) {
  const [done, setDone] = useState([])

  const toggle = (index) => {
    setDone((current) => current.includes(index) ? current.filter((item) => item !== index) : [...current, index])
  }

  return (
    <Panel className="tasks-panel">
      <span className="section-title">PENDIENTES DE HOY</span>
      <div className="task-list">
        {tasks.map((task, index) => (
          <button key={task} className={done.includes(index) ? 'is-done' : ''} onClick={() => toggle(index)}>
            <span className="task-bullet">{done.includes(index) && <Check size={10} />}</span>
            {task}
          </button>
        ))}
      </div>
      <div className="tasks-panel__actions">
        <button className="primary-button" onClick={onOpenVitals}><Plus size={15} /> Registrar signos</button>
      </div>
      <div className="quick-stats">
        {['temperature', 'glucose'].map((code) => {
          const c = latest[code]?.candidate
          return <div key={code}><span>{METRIC_LABELS[code]}</span><strong>{c ? `${formatValue(c)} ${c.unit}` : '—'}</strong></div>
        })}
      </div>
    </Panel>
  )
}
