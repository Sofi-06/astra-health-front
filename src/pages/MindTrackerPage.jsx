import { useId, useMemo, useState } from 'react'
import { LockKeyhole } from 'lucide-react'
import Panel from '../components/ui/Panel'

const moodOptions = {
  Agotado: { mood: 'Cansado', score: 2 },
  Tenso: { mood: 'Tenso', score: 2 },
  'Extraño casa': { mood: 'Nostálgico', score: 3 },
}

const dailyScales = [
  { label: 'Estrés', value: 4, warm: true },
  { label: 'Aislamiento', value: 3 },
  { label: 'Concentración', value: 2 },
  { label: 'Energía', value: 2 },
  { label: 'Sueño difícil', value: 4, warm: true },
]

const weeklyCharts = [
  { title: 'Ánimo (1-5)', data: [4, 4, 3.5, 3, 3, 2, 2], color: '#a28cff' },
  { title: 'Estrés (1-5)', data: [2, 2, 3, 3, 4, 4, 4], color: '#ff9b78' },
  { title: 'Aislamiento (1-5)', data: [2, 2, 2, 3, 3, 3, 3], color: '#5cecff' },
]

function smoothPath(points) {
  return points.reduce((path, point, index) => {
    if (index === 0) return `M ${point[0]} ${point[1]}`
    const previous = points[index - 1]
    const beforePrevious = points[index - 2] ?? previous
    const next = points[index + 1] ?? point
    const controlOneX = previous[0] + (point[0] - beforePrevious[0]) / 6
    const controlOneY = previous[1] + (point[1] - beforePrevious[1]) / 6
    const controlTwoX = point[0] - (next[0] - previous[0]) / 6
    const controlTwoY = point[1] - (next[1] - previous[1]) / 6
    return `${path} C ${controlOneX} ${controlOneY}, ${controlTwoX} ${controlTwoY}, ${point[0]} ${point[1]}`
  }, '')
}

function MoodOrb({ mood, score }) {
  return (
    <div className="mind-orb" role="img" aria-label={`${mood}, ánimo ${score} de 5`}>
      <strong>{mood}</strong>
      <span>ánimo {score} de 5</span>
    </div>
  )
}

function ScaleRow({ item }) {
  return (
    <div className="mind-scale-row">
      <div><span>{item.label}</span><small>{item.value}/5</small></div>
      <div className="mind-scale-track"><i className={item.warm ? 'is-warm' : ''} style={{ width: `${item.value * 20}%` }} /></div>
    </div>
  )
}

function WeeklyChart({ chart }) {
  const gradientId = useId().replace(/:/g, '')
  const width = 250
  const height = 235
  const left = 25
  const right = 8
  const top = 12
  const bottom = 27
  const points = useMemo(() => chart.data.map((value, index) => [
    left + (index / (chart.data.length - 1)) * (width - left - right),
    top + (1 - (value - 1) / 4) * (height - top - bottom),
  ]), [chart.data])
  const line = smoothPath(points)
  const area = `${line} L ${points.at(-1)[0]} ${height - bottom} L ${points[0][0]} ${height - bottom} Z`
  const last = points.at(-1)

  return (
    <div className="mind-weekly-chart">
      <span>{chart.title}</span>
      <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label={chart.title}>
        <defs><linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={chart.color} stopOpacity=".35" /><stop offset="1" stopColor={chart.color} stopOpacity=".04" /></linearGradient></defs>
        {[1, 2, 3, 4, 5].map((tick) => {
          const y = top + (1 - (tick - 1) / 4) * (height - top - bottom)
          return <g key={tick}><line x1={left} x2={width - right} y1={y} y2={y} className="mind-chart-grid" /><text x="0" y={y + 3} className="mind-chart-label">{tick.toFixed(1)}</text></g>
        })}
        <path d={area} fill={`url(#${gradientId})`} />
        <path d={line} fill="none" stroke={chart.color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx={last[0]} cy={last[1]} r="8" fill={chart.color} opacity=".22" /><circle cx={last[0]} cy={last[1]} r="4" fill="#efffff" stroke={chart.color} strokeWidth="2.5" />
        {['Lun', 'Mié', 'Vie', 'Dom'].map((label, index) => <text key={label} x={left + index * ((width - left - right) / 3)} y={height - 6} textAnchor="middle" className="mind-chart-label">{label}</text>)}
      </svg>
    </div>
  )
}

export default function MindTrackerPage({ onNotify }) {
  const [selectedMood, setSelectedMood] = useState('Agotado')
  const [breathing, setBreathing] = useState(false)
  const mood = moodOptions[selectedMood]

  const chooseMood = (option) => {
    setSelectedMood(option)
    onNotify(`Check-in actualizado: ${option}.`)
  }

  return (
    <section className="mind-tracker" aria-label="Bienestar psicológico">
      <div className="mind-top-grid">
        <Panel className="mind-checkin-card">
          <span className="mind-kicker">CHECK-IN DE HOY</span>
          <MoodOrb mood={mood.mood} score={mood.score} />
          <p>¿Cómo te sientes hoy, Rivera?</p>
          <div className="mind-mood-options">
            {Object.keys(moodOptions).map((option) => <button key={option} className={selectedMood === option ? 'is-selected' : ''} onClick={() => chooseMood(option)}>{option}</button>)}
          </div>
        </Panel>

        <Panel className="mind-scales-card">
          <span className="mind-kicker">ESCALA DEL DÍA</span>
          <div className="mind-scales">{dailyScales.map((item) => <ScaleRow key={item.label} item={item} />)}</div>
        </Panel>

        <Panel className="mind-journal-card">
          <span className="mind-kicker">DIARIO EMOCIONAL</span>
          <blockquote>«Hoy me sentí más cansado de lo habitual.<br />Extrañé a mi familia y me costó concentrarme.»</blockquote>
          <small>AYER</small>
          <p>«Buena sesión de ejercicio. Hablé con mi hermana por video y dormí mejor.»</p>
          <div className="mind-journal-privacy">
            <button onClick={() => onNotify('Tu diario permanece privado.')}><LockKeyhole size={11} /> Privada</button>
            <span>Tú decides si la compartes con el equipo de apoyo.</span>
          </div>
        </Panel>
      </div>

      <div className="mind-bottom-grid">
        <Panel className="mind-weekly-card">
          <span className="mind-kicker">CÓMO HAS CAMBIADO ESTA SEMANA</span>
          <div className="mind-weekly-charts">{weeklyCharts.map((chart) => <WeeklyChart key={chart.title} chart={chart} />)}</div>
        </Panel>

        <Panel className="mind-wellness-card">
          <span className="mind-kicker">BIENESTAR</span>
          <button className={`mind-breath ${breathing ? 'is-active' : ''}`} onClick={() => setBreathing((active) => !active)}>
            <span>{breathing ? 'Exhala' : 'Inhala'}<strong>4 s</strong></span>
          </button>
          <p>Respiración guiada · 5 min</p>
          <div className="mind-wellness-task"><span>Pausa de relajación</span><small>10 min</small></div>
          <div className="mind-wellness-task"><span>Llamada a familia</span><small>18:30</small></div>
          <button className="primary-button mind-support-button" onClick={() => onNotify('Solicitud enviada al equipo de apoyo.')}>Hablar con el equipo de apoyo</button>
        </Panel>
      </div>
    </section>
  )
}
