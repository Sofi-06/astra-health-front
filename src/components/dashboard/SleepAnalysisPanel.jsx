import { useState } from 'react'
import Panel from '../ui/Panel'
import { loadSyntheticSleep } from '../../api/client'

const hours = (n) => String(n).replace('.', ',')

export default function SleepAnalysisPanel({ analysis, onReload, onNotify }) {
  const [busy, setBusy] = useState(false)

  const loadExample = async () => {
    setBusy(true)
    try {
      await loadSyntheticSleep()
      await onReload()
      onNotify('Datos sintéticos de sueño cargados (no son de una persona real).')
    } catch (e) {
      onNotify(e.message)
    } finally {
      setBusy(false)
    }
  }

  if (!analysis) return null
  const calc = analysis.personal_calculation

  return (
    <Panel className="sleep-analysis">
      <span className="section-title">ANÁLISIS DE SUEÑO · {analysis.window.days} DÍAS</span>
      <p className="sleep-analysis__message">{calc.message}</p>
      {calc.stats && (
        <div className="quick-stats">
          <div><span>Promedio</span><strong>{hours(calc.stats.mean_hours)} h</strong></div>
          <div><span>Mínimo / máximo</span><strong>{hours(calc.stats.min.hours)} / {hours(calc.stats.max.hours)} h</strong></div>
          <div><span>Cobertura</span><strong>{calc.nights_recorded} de {calc.days_in_window} días</strong></div>
        </div>
      )}
      <button className="secondary-button" onClick={loadExample} disabled={busy}>
        {busy ? 'Cargando…' : 'Cargar datos de ejemplo (sintéticos)'}
      </button>
      <details className="sleep-analysis__more">
        <summary>Qué NO se puede concluir</summary>
        <ul>{analysis.cannot_conclude.map((text) => <li key={text}>{text}</li>)}</ul>
      </details>
      <details className="sleep-analysis__more">
        <summary>Contexto general de NASA (no evalúa tus cifras)</summary>
        <p>{analysis.education.text}</p>
        <p><em>{analysis.education.scope}</em></p>
      </details>
    </Panel>
  )
}
