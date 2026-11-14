import { useState } from 'react'
import {
  Activity,
  ArrowDown,
  ArrowUp,
  BarChart3,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Download,
  Filter,
  Heart,
  Moon,
  Radio,
  Share2,
  TrendingDown,
  TrendingUp,
} from 'lucide-react'
import Panel from '../components/ui/Panel'

const TIME_FILTERS = ['24 h', '7 días', '30 días', '3 meses', 'Toda la misión']

const HEATMAP_SYSTEMS = [
  {
    name: 'Cardiovascular',
    days: ['stable', 'stable', 'stable', 'followup', 'followup', 'stable', 'variation'],
  },
  {
    name: 'Metabólica',
    days: ['stable', 'stable', 'stable', 'stable', 'stable', 'stable', 'stable'],
  },
  {
    name: 'Músculo y hueso',
    days: ['stable', 'stable', 'followup', 'followup', 'followup', 'followup', 'followup'],
  },
  {
    name: 'Psicológica',
    days: ['stable', 'stable', 'stable', 'followup', 'followup', 'variation', 'variation'],
  },
  {
    name: 'Descanso',
    days: ['stable', 'stable', 'followup', 'followup', 'variation', 'variation', 'variation'],
  },
]

export default function HealthAnalyticsPage({ onNotify }) {
  const [activeRange, setActiveRange] = useState('7 días')

  const handleGenerateReport = () => {
    onNotify?.('Generando informe semanal telemétrico en PDF…')
  }

  const handleShareMedical = () => {
    onNotify?.('Informe transmitido al equipo de medicina aeroespacial en Tierra.')
  }

  return (
    <div className="analytics-history-page" aria-label="Historial y evolución">
      {/* Header específico de la página */}
      <header className="page-header-pro">
        <div>
          <h1>Historial y evolución</h1>
          <p>HEALTH ANALYTICS · ¿CÓMO ESTÁ CAMBIANDO MI SALUD?</p>
        </div>
      </header>

      {/* Selector de periodo de tiempo */}
      <div className="time-filters-row">
        {TIME_FILTERS.map((f) => (
          <button
            key={f}
            className={`time-filter-pill ${activeRange === f ? 'is-active' : ''}`}
            onClick={() => setActiveRange(f)}
            type="button"
          >
            {f}
          </button>
        ))}
      </div>

      {/* Grid Principal: 4 gráficos 2x2 a la izquierda + Paneles a la derecha */}
      <div className="analytics-layout-grid">
        {/* Columna Izquierda: 4 Cards de Gráficos */}
        <div className="analytics-cards-2x2">
          {/* Card 1: FRECUENCIA CARDÍACA */}
          <Panel className="analytics-metric-chart-card">
            <div className="metric-chart-top">
              <div>
                <span className="card-kicker">FRECUENCIA CARDÍACA</span>
                <div className="card-val-row">
                  <strong>88 bpm</strong>
                  <span className="card-comparison comp--up">+16 vs. su promedio</span>
                </div>
              </div>
            </div>

            <div className="metric-chart-canvas-wrap">
              <div className="axis-y-labels">
                <span>100</span>
                <span>90</span>
                <span>80</span>
                <span>70</span>
                <span>60</span>
              </div>
              <div className="svg-box">
                <svg viewBox="0 0 280 80" className="history-chart-svg" preserveAspectRatio="none">
                  <line x1="0" y1="10" x2="280" y2="10" stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" />
                  <line x1="0" y1="40" x2="280" y2="40" stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" />
                  <line x1="0" y1="70" x2="280" y2="70" stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" />

                  <path
                    d="M 5 65 Q 40 65, 80 58 T 160 48 T 220 28 T 275 16"
                    fill="none"
                    stroke="#22d3ee"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />
                  <circle cx="275" cy="16" r="4" fill="#ffffff" stroke="#00d2ff" strokeWidth="2" />
                </svg>

                <div className="axis-x-labels">
                  <span>D139</span>
                  <span>D141</span>
                  <span>D143</span>
                  <span>D145</span>
                </div>
              </div>
            </div>
            <span className="axis-vertical-hint">Eje vertical: bpm</span>
          </Panel>

          {/* Card 2: SUEÑO */}
          <Panel className="analytics-metric-chart-card">
            <div className="metric-chart-top">
              <div>
                <span className="card-kicker">SUEÑO</span>
                <div className="card-val-row">
                  <strong>4.6 h</strong>
                  <span className="card-comparison comp--down">-1.1 h vs. semana previa</span>
                </div>
              </div>
            </div>

            <div className="metric-chart-canvas-wrap">
              <div className="axis-y-labels">
                <span>9.0</span>
                <span>7.5</span>
                <span>6.0</span>
                <span>4.5</span>
                <span>3.0</span>
              </div>
              <div className="svg-box">
                <svg viewBox="0 0 280 80" className="history-chart-svg" preserveAspectRatio="none">
                  <line x1="0" y1="10" x2="280" y2="10" stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" />
                  <line x1="0" y1="40" x2="280" y2="40" stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" />
                  <line x1="0" y1="70" x2="280" y2="70" stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" />

                  <path
                    d="M 5 20 Q 50 20, 90 28 T 170 52 T 230 64 T 275 72"
                    fill="none"
                    stroke="#38bdf8"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />
                  <circle cx="275" cy="72" r="4" fill="#ffffff" stroke="#0284c7" strokeWidth="2" />
                </svg>

                <div className="axis-x-labels">
                  <span>D139</span>
                  <span>D141</span>
                  <span>D143</span>
                  <span>D145</span>
                </div>
              </div>
            </div>
            <span className="axis-vertical-hint">Eje vertical: horas</span>
          </Panel>

          {/* Card 3: FATIGA */}
          <Panel className="analytics-metric-chart-card">
            <div className="metric-chart-top">
              <div>
                <span className="card-kicker">FATIGA</span>
                <div className="card-val-row">
                  <strong>4 / 5</strong>
                  <span className="card-comparison comp--up-warn">+1.3 vs. semana previa</span>
                </div>
              </div>
            </div>

            <div className="metric-chart-canvas-wrap">
              <div className="axis-y-labels">
                <span>5.0</span>
                <span>4.0</span>
                <span>3.0</span>
                <span>2.0</span>
                <span>1.0</span>
              </div>
              <div className="svg-box">
                <svg viewBox="0 0 280 80" className="history-chart-svg" preserveAspectRatio="none">
                  <line x1="0" y1="10" x2="280" y2="10" stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" />
                  <line x1="0" y1="40" x2="280" y2="40" stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" />
                  <line x1="0" y1="70" x2="280" y2="70" stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" />

                  {/* Curva escalonada naranja */}
                  <path
                    d="M 5 65 L 50 65 Q 65 65, 75 50 L 130 50 Q 145 50, 155 35 L 275 35"
                    fill="none"
                    stroke="#fb923c"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <circle cx="275" cy="35" r="4" fill="#ffffff" stroke="#ea580c" strokeWidth="2" />
                </svg>

                <div className="axis-x-labels">
                  <span>D139</span>
                  <span>D141</span>
                  <span>D143</span>
                  <span>D145</span>
                </div>
              </div>
            </div>
            <span className="axis-vertical-hint">Eje vertical: escala 1-5</span>
          </Panel>

          {/* Card 4: ESTADO DE ÁNIMO */}
          <Panel className="analytics-metric-chart-card">
            <div className="metric-chart-top">
              <div>
                <span className="card-kicker">ESTADO DE ÁNIMO</span>
                <div className="card-val-row">
                  <strong>2 / 5</strong>
                  <span className="card-comparison comp--down-warn">-0.9 vs. semana previa</span>
                </div>
              </div>
            </div>

            <div className="metric-chart-canvas-wrap">
              <div className="axis-y-labels">
                <span>5.0</span>
                <span>4.0</span>
                <span>3.0</span>
                <span>2.0</span>
                <span>1.0</span>
              </div>
              <div className="svg-box">
                <svg viewBox="0 0 280 80" className="history-chart-svg" preserveAspectRatio="none">
                  <line x1="0" y1="10" x2="280" y2="10" stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" />
                  <line x1="0" y1="40" x2="280" y2="40" stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" />
                  <line x1="0" y1="70" x2="280" y2="70" stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" />

                  {/* Curva escalonada púrpura */}
                  <path
                    d="M 5 28 L 70 28 Q 85 28, 95 48 L 170 48 Q 185 48, 195 65 L 275 65"
                    fill="none"
                    stroke="#c084fc"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <circle cx="275" cy="65" r="4" fill="#ffffff" stroke="#9333ea" strokeWidth="2" />
                </svg>

                <div className="axis-x-labels">
                  <span>D139</span>
                  <span>D141</span>
                  <span>D143</span>
                  <span>D145</span>
                </div>
              </div>
            </div>
            <span className="axis-vertical-hint">Eje vertical: escala 1-5</span>
          </Panel>
        </div>

        {/* Columna Derecha: Heatmap de Sistemas + Informe + Comparaciones */}
        <div className="analytics-sidebar-stack">
          {/* Panel 1: SISTEMAS · ÚLTIMOS 7 DÍAS */}
          <Panel className="systems-heatmap-panel">
            <div className="heatmap-header">
              <span className="section-title">SISTEMAS · ÚLTIMOS 7 DÍAS</span>
              <div className="heatmap-days-labels">
                <span>D139</span>
                <span>D140</span>
                <span>D141</span>
                <span>D142</span>
                <span>D143</span>
                <span>D144</span>
                <span>D145</span>
              </div>
            </div>

            <div className="heatmap-rows-list">
              {HEATMAP_SYSTEMS.map((sys) => (
                <div key={sys.name} className="heatmap-system-row">
                  <span className="system-row-name">{sys.name}</span>
                  <div className="heatmap-blocks-row">
                    {sys.days.map((status, i) => (
                      <span key={i} className={`heatmap-cell cell--${status}`} />
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Leyenda del heatmap */}
            <div className="heatmap-legend">
              <span className="legend-chip">
                <span className="chip-square square--stable" /> estable
              </span>
              <span className="legend-chip">
                <span className="chip-square square--followup" /> seguimiento
              </span>
              <span className="legend-chip">
                <span className="chip-square square--variation" /> variación
              </span>
            </div>
          </Panel>

          {/* Panel 2: INFORME SEMANAL */}
          <Panel className="weekly-report-panel">
            <span className="section-title">INFORME SEMANAL</span>
            <ul className="report-bullet-list">
              <li>
                <span className="bullet-cyan" />
                <span>Resumen de la semana</span>
              </li>
              <li>
                <span className="bullet-cyan" />
                <span>Indicadores con variaciones</span>
              </li>
              <li>
                <span className="bullet-cyan" />
                <span>Alertas y acciones realizadas</span>
              </li>
            </ul>

            <div className="report-buttons-group">
              <button className="primary-pill-btn report-btn" onClick={handleGenerateReport} type="button">
                <span>Generar informe</span>
              </button>
              <button className="secondary-pill-btn report-btn" onClick={handleShareMedical} type="button">
                <span>Compartir con equipo médico</span>
              </button>
            </div>
          </Panel>

          {/* Panel 3: COMPARACIONES */}
          <Panel className="comparisons-panel">
            <span className="section-title">COMPARACIONES</span>
            <div className="comparisons-list">
              <div className="comparison-row">
                <span>Hoy vs. 7 días</span>
                <span className="comp-tag tag--warning">3 cambios</span>
              </div>
              <div className="comparison-row">
                <span>Semana vs. anterior</span>
                <span className="comp-tag tag--warning">4 cambios</span>
              </div>
              <div className="comparison-row">
                <span>Toda la misión</span>
                <span className="comp-tag tag--stable">Estable</span>
              </div>
            </div>
          </Panel>
        </div>
      </div>
    </div>
  )
}
