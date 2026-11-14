import Panel from '../ui/Panel'
import MiniChart from './MiniChart'

function seriesOf(history) {
  // Las unidades nunca se mezclan: se grafica solo la serie con más puntos.
  const series = [...(history?.series ?? [])].sort((a, b) => b.points.length - a.points.length)[0]
  return series ? { unit: series.unit, points: series.points } : { unit: '', points: [] }
}

export default function TrendsPanel({ history }) {
  const sleep = seriesOf(history.sleep)
  const heart = seriesOf(history.heart_rate)
  return (
    <Panel className="trends-panel">
      <span className="section-title">TENDENCIAS</span>
      <MiniChart title="Sueño declarado · 30 días" unit={sleep.unit} records={sleep.points} color="#86a9ff" />
      <MiniChart title="Pulso · 30 días" unit={heart.unit} records={heart.points} color="#35efff" />
    </Panel>
  )
}
