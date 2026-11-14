import { useState } from 'react'
import {
  Activity,
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  Brain,
  Download,
  Eye,
  FileText,
  Gauge,
  Moon,
  Radio,
  Shield,
  Smile,
  Zap,
} from 'lucide-react'
import Panel from '../components/ui/Panel'

export default function SpaceHealthInsightsPage({ onNotify, sessionDay = 145 }) {
  const [selectedNode, setSelectedNode] = useState('pattern')

  const handleExport = () => {
    onNotify?.('Generando informe médico espacial de ASTRA en PDF…')
  }

  return (
    <div className="space-insights-page" aria-label="El cerebro de ASTRA">
      {/* Header específico de la página */}
      <header className="page-header-pro">
        <div>
          <h1>El cerebro de ASTRA</h1>
          <p>SPACE HEALTH INSIGHTS · MISSION CONTEXT</p>
        </div>
      </header>

      {/* Tarjeta Superior: Red de Patrón Detectado */}
      <Panel className="insights-pattern-card">
        <span className="insights-kicker">
          SPACE HEALTH INSIGHTS · PATRÓN DETECTADO EN LOS ÚLTIMOS 7 DÍAS
        </span>

        {/* Constelación del patrón */}
        <div className="pattern-constellation">
          <svg className="constellation-lines-svg" viewBox="0 0 700 240" preserveAspectRatio="none">
            {/* Líneas conectadas desde el centro hacia cada nodo */}
            <line x1="350" y1="120" x2="270" y2="40" stroke="rgba(49, 220, 255, 0.45)" strokeWidth="1.5" strokeDasharray="4 3" />
            <line x1="350" y1="120" x2="480" y2="40" stroke="rgba(255, 122, 142, 0.45)" strokeWidth="1.5" strokeDasharray="4 3" />
            <line x1="350" y1="120" x2="520" y2="180" stroke="rgba(192, 132, 252, 0.45)" strokeWidth="1.5" strokeDasharray="4 3" />
            <line x1="350" y1="120" x2="410" y2="210" stroke="rgba(255, 214, 90, 0.55)" strokeWidth="1.5" strokeDasharray="4 3" />
            <line x1="350" y1="120" x2="210" y2="180" stroke="rgba(49, 220, 255, 0.45)" strokeWidth="1.5" strokeDasharray="4 3" />
          </svg>

          {/* Nodo central: PATRÓN a revisar */}
          <div className="pattern-center-node">
            <div className="center-node-pulse" />
            <strong>PATRÓN</strong>
            <small>a revisar</small>
          </div>

          {/* Nodo 1: SUEÑO */}
          <div className="pattern-satellite-node node--sleep">
            <span className="node-title">SUEÑO</span>
            <div className="node-value val--down">
              <ArrowDown size={12} />
              <span>4.6 h</span>
            </div>
          </div>

          {/* Nodo 2: FATIGA */}
          <div className="pattern-satellite-node node--fatigue">
            <span className="node-title">FATIGA</span>
            <div className="node-value val--up-warn">
              <ArrowUp size={12} />
              <span>4/5</span>
            </div>
          </div>

          {/* Nodo 3: ESTRÉS */}
          <div className="pattern-satellite-node node--stress">
            <span className="node-title">ESTRÉS</span>
            <div className="node-value val--up-warn">
              <ArrowUp size={12} />
              <span>4/5</span>
            </div>
          </div>

          {/* Nodo 4: ACTIVIDAD */}
          <div className="pattern-satellite-node node--activity">
            <span className="node-title">ACTIVIDAD</span>
            <div className="node-value val--down-gold">
              <ArrowDown size={12} />
              <span>25 min</span>
            </div>
          </div>

          {/* Nodo 5: ÁNIMO */}
          <div className="pattern-satellite-node node--mood">
            <span className="node-title">ÁNIMO</span>
            <div className="node-value val--down">
              <ArrowDown size={12} />
              <span>2/5</span>
            </div>
          </div>
        </div>

        {/* Fila de metadatos de contexto de la misión */}
        <div className="insights-mission-meta-row">
          <div>
            <span>TIPO DE MISIÓN</span>
            <strong>Orbital</strong>
          </div>
          <div>
            <span>DÍA DE MISIÓN</span>
            <strong>{sessionDay}</strong>
          </div>
          <div>
            <span>GRAVEDAD</span>
            <strong>Microgravedad</strong>
          </div>
          <div>
            <span>RADIACIÓN</span>
            <strong>Dosímetro 0.52 mSv/d</strong>
          </div>
          <div>
            <span>COMUNICACIÓN</span>
            <strong>Enlace estable</strong>
          </div>
        </div>
      </Panel>

      {/* Fila Inferior: 3 Paneles */}
      <div className="insights-bottom-grid">
        {/* Panel 1: SUEÑO (HORAS) */}
        <Panel className="insights-chart-panel">
          <span className="section-title">SUEÑO (HORAS)</span>
          <div className="sleep-curve-container">
            <div className="sleep-curve-y">
              <span>8.0</span>
              <span>6.8</span>
              <span>5.5</span>
              <span>4.2</span>
              <span>3.0</span>
            </div>
            <div className="sleep-curve-svg-wrap">
              <svg viewBox="0 0 320 100" className="sleep-trend-svg" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="sleepCurveFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#31dcff" stopOpacity="0.35" />
                    <stop offset="100%" stopColor="#31dcff" stopOpacity="0.0" />
                  </linearGradient>
                </defs>
                {/* Líneas guía horizontales */}
                <line x1="0" y1="10" x2="320" y2="10" stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" />
                <line x1="0" y1="35" x2="320" y2="35" stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" />
                <line x1="0" y1="60" x2="320" y2="60" stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" />
                <line x1="0" y1="85" x2="320" y2="85" stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" />

                {/* Área bajo la curva */}
                <path
                  d="M 5 22 Q 40 22, 60 32 T 140 48 T 220 62 T 315 78 L 315 100 L 5 100 Z"
                  fill="url(#sleepCurveFill)"
                />
                {/* Línea principal con degradado */}
                <path
                  d="M 5 22 Q 40 22, 60 32 T 140 48 T 220 62 T 315 78"
                  fill="none"
                  stroke="#38bdf8"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
                <circle cx="315" cy="78" r="4.5" fill="#ffffff" stroke="#00b4f0" strokeWidth="2" />
              </svg>

              <div className="sleep-curve-x">
                <span>D139</span>
                <span>D141</span>
                <span>D143</span>
                <span>D145</span>
              </div>
            </div>
          </div>
          <p className="sleep-trend-footnote">
            Los cambios coinciden en el tiempo y justifican una revisión del descanso, la carga de trabajo y el bienestar.
          </p>
        </Panel>

        {/* Panel 2: ORIENTACIÓN PREVENTIVA */}
        <Panel className="insights-actions-panel">
          <span className="section-title">ORIENTACIÓN PREVENTIVA</span>
          <h3>Qué recomendamos</h3>
          <ul className="recommendations-list">
            <li>
              <span className="rec-bullet" />
              <span>Revisar la rutina de descanso</span>
            </li>
            <li>
              <span className="rec-bullet" />
              <span>Registrar de nuevo la calidad del sueño</span>
            </li>
            <li>
              <span className="rec-bullet" />
              <span>Revisar carga de trabajo y actividad</span>
            </li>
            <li>
              <span className="rec-bullet" />
              <span>Pedir evaluación médica si persiste</span>
            </li>
          </ul>

          <button className="primary-pill-btn export-report-btn" onClick={handleExport} type="button">
            <span>Exportar informe</span>
          </button>
        </Panel>

        {/* Panel 3: PELIGROS DEL ENTORNO ESPACIAL */}
        <Panel className="insights-hazards-panel">
          <span className="section-title">PELIGROS DEL ENTORNO ESPACIAL</span>
          <div className="hazards-list">
            <div className="hazard-row">
              <div className="hazard-name">
                <span className="hazard-icon">☢</span>
                <span>Radiación</span>
              </div>
              <span className="status-badge badge--stable">Estable</span>
            </div>

            <div className="hazard-row">
              <div className="hazard-name">
                <span className="hazard-icon">⭕</span>
                <span>Aislamiento</span>
              </div>
              <span className="status-badge badge--followup">Seguimiento</span>
            </div>

            <div className="hazard-row">
              <div className="hazard-name">
                <span className="hazard-icon">↗</span>
                <span>Distancia</span>
              </div>
              <span className="status-badge badge--stable">Estable</span>
            </div>

            <div className="hazard-row">
              <div className="hazard-name">
                <span className="hazard-icon">⬇</span>
                <span>Gravedad</span>
              </div>
              <span className="status-badge badge--followup">Seguimiento</span>
            </div>

            <div className="hazard-row">
              <div className="hazard-name">
                <span className="hazard-icon">⏹</span>
                <span>Entorno</span>
              </div>
              <span className="status-badge badge--stable">Estable</span>
            </div>
          </div>
        </Panel>
      </div>
    </div>
  )
}

