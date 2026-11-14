import { useState } from 'react'
import {
  Activity,
  Award,
  CheckCircle2,
  ChevronRight,
  Flame,
  Heart,
  Hexagon,
  Moon,
  Shield,
  Sparkles,
  Sun,
  Target,
  Trophy,
  Zap,
} from 'lucide-react'
import Panel from '../components/ui/Panel'

const BADGES = [
  { id: 1, name: 'Primer contacto', icon: 'helmet', unlocked: true, color: 'gold', progress: 100 },
  { id: 2, name: 'Corazón en órbita', icon: 'heart', unlocked: true, color: 'gold', progress: 100 },
  { id: 3, name: 'Guardián del descanso', icon: 'moon', unlocked: false, color: 'blue', progress: 60 },
  { id: 4, name: 'Mente estelar', icon: 'sparkle', unlocked: false, color: 'blue', progress: 40 },
  { id: 5, name: 'Fuerza gravitacional', icon: 'hex', unlocked: false, color: 'blue', progress: 30 },
  { id: 6, name: 'Escudo protector', icon: 'shield', unlocked: false, color: 'blue', progress: 20 },
  { id: 7, name: 'Constancia orbital', icon: 'target', unlocked: false, color: 'blue', progress: 15 },
  { id: 8, name: 'Explorador integral', icon: 'sun', unlocked: false, color: 'blue', progress: 10 },
]

export default function MissionChallengesPage({ onNotify, onOpenVitals }) {
  const [selectedBadge, setSelectedBadge] = useState(BADGES[2])

  const handleRegisterSleep = () => {
    onOpenVitals?.()
  }

  const renderBadgeIcon = (icon) => {
    switch (icon) {
      case 'helmet':
        return <span className="custom-badge-icon">⛑</span>
      case 'heart':
        return <Heart size={20} className="badge-svg-icon" />
      case 'moon':
        return <Moon size={20} className="badge-svg-icon" />
      case 'sparkle':
        return <Sparkles size={20} className="badge-svg-icon" />
      case 'hex':
        return <Hexagon size={20} className="badge-svg-icon" />
      case 'shield':
        return <Shield size={20} className="badge-svg-icon" />
      case 'target':
        return <Target size={20} className="badge-svg-icon" />
      case 'sun':
        return <Sun size={20} className="badge-svg-icon" />
      default:
        return <Award size={20} />
    }
  }

  return (
    <div className="challenges-page-pro" aria-label="Misiones e insignias">
      {/* Header específico de la página */}
      <header className="page-header-pro">
        <div>
          <h1>Misiones e insignias</h1>
          <p>MISSION CHALLENGES · CONSTANCIA Y AUTOCUIDADO</p>
        </div>
      </header>

      {/* Tarjeta Superior: Hero Especialista */}
      <Panel className="challenges-hero-card">
        <div className="hero-astronaut-avatar-wrap">
          <img src="/assets/astronauta.png" alt="Astronauta" className="hero-astronaut-img" />
        </div>

        <div className="hero-level-info">
          <span className="hero-kicker">NIVEL 03</span>
          <h2>Especialista</h2>
          <p className="hero-desc">Mantiene sus rutinas de autocuidado</p>

          <div className="hero-progress-container">
            <div className="hero-xp-track">
              <div className="hero-xp-bar-fill" style={{ width: '73.5%' }} />
            </div>
            <div className="hero-xp-meta">
              <span>735 XP</span>
              <span>Comandante · 1,000 XP</span>
            </div>
          </div>
        </div>

        {/* Ring circular de XP dorado */}
        <div className="hero-xp-ring-wrap">
          <svg viewBox="0 0 100 100" className="hero-ring-svg">
            <circle
              cx="50"
              cy="50"
              r="40"
              fill="none"
              stroke="rgba(255, 214, 90, 0.15)"
              strokeWidth="7"
            />
            <circle
              cx="50"
              cy="50"
              r="40"
              fill="none"
              stroke="#ffd25a"
              strokeWidth="7"
              strokeDasharray="251.2"
              strokeDashoffset={251.2 * (1 - 0.735)}
              strokeLinecap="round"
              transform="rotate(-90 50 50)"
              className="gold-ring-glow"
            />
          </svg>
          <div className="hero-ring-inner">
            <strong>735</strong>
            <small>XP</small>
          </div>
        </div>
      </Panel>

      {/* Tarjeta Intermedia: Misión Semanal */}
      <Panel className="challenges-weekly-card">
        <div className="weekly-card-header">
          <div>
            <span className="section-title">MISIÓN SEMANAL</span>
            <h3>Operación Bienestar</h3>
            <span className="weekly-xp-badge">+150 XP</span>
          </div>
        </div>

        <div className="weekly-metrics-grid">
          {/* Métrica 1 */}
          <div className="weekly-metric-item">
            <div className="metric-header-row">
              <span>Evaluaciones emocionales</span>
              <strong>3/5</strong>
            </div>
            <div className="metric-track">
              <div className="metric-bar-fill" style={{ width: '60%' }} />
            </div>
          </div>

          {/* Métrica 2 */}
          <div className="weekly-metric-item">
            <div className="metric-header-row">
              <span>Sueño registrado</span>
              <strong>4/5</strong>
            </div>
            <div className="metric-track">
              <div className="metric-bar-fill" style={{ width: '80%' }} />
            </div>
          </div>

          {/* Métrica 3 */}
          <div className="weekly-metric-item">
            <div className="metric-header-row">
              <span>Ejercicio programado</span>
              <strong>2/3</strong>
            </div>
            <div className="metric-track">
              <div className="metric-bar-fill" style={{ width: '66%' }} />
            </div>
          </div>

          {/* Métrica 4 */}
          <div className="weekly-metric-item">
            <div className="metric-header-row">
              <span>Informe semanal</span>
              <strong>0/1</strong>
            </div>
            <div className="metric-track">
              <div className="metric-bar-fill" style={{ width: '0%' }} />
            </div>
          </div>
        </div>
      </Panel>

      {/* Tarjeta Inferior Grande: Colección de Insignias */}
      <Panel className="challenges-badges-collection-card">
        <span className="section-title">COLECCIÓN DE INSIGNIAS</span>

        <div className="badges-hex-row">
          {BADGES.map((b) => {
            const isGold = b.color === 'gold'
            return (
              <div
                key={b.id}
                className={`badge-item-wrap ${isGold ? 'badge--gold' : 'badge--blue'} ${selectedBadge.id === b.id ? 'is-selected' : ''}`}
                onClick={() => setSelectedBadge(b)}
              >
                <div className="badge-hexagon">
                  <div className="badge-hexagon-inner">
                    {renderBadgeIcon(b.icon)}
                  </div>
                </div>

                <span className="badge-label">{b.name}</span>

                {!isGold && (
                  <div className="badge-mini-track">
                    <div className="badge-mini-fill" style={{ width: `${b.progress}%` }} />
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Barra inferior: Próxima Insignia */}
        <div className="next-badge-footer-bar">
          <div className="next-badge-info">
            <span className="next-badge-kicker">PRÓXIMA INSIGNIA</span>
            <strong>{selectedBadge.name}</strong>
            <p>Te faltan 2 registros de sueño programados</p>
          </div>

          <button className="primary-pill-btn register-sleep-btn" onClick={handleRegisterSleep} type="button">
            <span>Registrar sueño</span>
          </button>
        </div>
      </Panel>
    </div>
  )
}
