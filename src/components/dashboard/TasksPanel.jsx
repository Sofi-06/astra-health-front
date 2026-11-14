import { useState } from 'react'
import { Check, Plus, Stethoscope } from 'lucide-react'
import Panel from '../ui/Panel'
import { quickStats, tasks } from '../../data/dashboardData'

export default function TasksPanel({ onOpenVitals, onNotify }) {
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
        <button className="secondary-button" onClick={() => onNotify('Check-in emocional iniciado.')}><Stethoscope size={15} /> Check-in</button>
      </div>
      <div className="quick-stats">
        {quickStats.map((stat) => <div key={stat.label}><span>{stat.label}</span><strong>{stat.value}</strong></div>)}
      </div>
    </Panel>
  )
}
