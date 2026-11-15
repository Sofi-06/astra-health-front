import { useEffect, useState } from 'react'
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
import { getAnalysis, listEntries } from '../api/client'
import { localDateKey } from '../data/format'

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
  const [weekly, setWeekly] = useState(null)

  // Conteos reales de la semana calculados desde los registros confirmados.
  useEffect(() => {
    let cancelled = false
    const weekAgo = Date.now() - 7 * 86400000
    Promise.all([listEntries().catch(() => ({ entries: [] })), getAnalysis('sleep', 7).catch(() => null)])
      .then(([list, sleep]) => {
        if (cancelled) return
        const week = (list.entries || []).filter((e) => new Date(e.measured_at).getTime() >= weekAgo)
        const days = new Set(week.map((e) => localDateKey(e.measured_at))).size
        const metrics = new Set(week.filter((e) => e.candidate?.kind === 'measurement').map((e) => e.candidate.metric)).size
        const nights = sleep?.personal_calculation?.nights_recorded ?? 0
        setWeekly({ days, metrics, nights, total: list.count ?? (list.entries || []).length })
      })
    return () => { cancelled = true }
  }, [])

  const weeklyMetrics = weekly
    ? [
        { label: 'Días con registros esta semana', value: weekly.days, target: 7 },
        { label: 'Noches de sueño registradas', value: weekly.nights, target: 7 },
        { label: 'Indicadores distintos registrados', value: weekly.metrics, target: 6 },
        { label: 'Registros totales en la misión', value: weekly.total, target: Math.max(weekly.total, 1) },
      ]
    : []

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
          {weeklyMetrics.map(({ label, value, target }) => (
            <div className="weekly-metric-item" key={label}>
              <div className="metric-header-row">
                <span>{label}</span>
                <strong>{value}/{target}</strong>
              </div>
              <div className="metric-track">
                <div className="metric-bar-fill" style={{ width: `${Math.min(100, (value / target) * 100)}%` }} />
              </div>
            </div>
          ))}
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
            <p>{weekly ? `Llevas ${weekly.nights} registros de sueño en los últimos 7 días` : 'Contando tus registros de sueño…'}</p>
          </div>

          <button className="primary-pill-btn register-sleep-btn" onClick={handleRegisterSleep} type="button">
            <span>Registrar sueño</span>
          </button>
        </div>
      </Panel>
    </div>
  )
}
