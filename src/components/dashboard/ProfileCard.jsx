import { Orbit } from 'lucide-react'
import Panel from '../ui/Panel'
import { formatWhen } from '../../data/format'

export default function ProfileCard({ user, sessionDay = 0, sessionStartedAt }) {
  return (
    <Panel className="profile-card">
      <div className="profile-card__avatar-wrap">
        <div className="avatar avatar--large profile-avatar-glow" aria-hidden="true" />
      </div>

      <div className="profile-card__body">
        <h2>{user?.name || 'Maria Torres'}</h2>
        <p className="profile-card__email">{user?.email || 'maria@gmail.com'}</p>
        <div className="profile-card__status">
          <span className="status-dot-green" />
          <span>Último acceso: {sessionStartedAt ? formatWhen(sessionStartedAt) : 'ahora'}</span>
        </div>
      </div>

      <div className="profile-card__badge-day">
        <Orbit size={18} className="orbit-icon" />
        <span>Día {sessionDay}</span>
      </div>
    </Panel>
  )
}
