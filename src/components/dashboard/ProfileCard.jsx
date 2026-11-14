import Panel from '../ui/Panel'

export default function ProfileCard() {
  return (
    <Panel className="profile-card">
      <div className="avatar avatar--large" aria-hidden="true" />
      <div className="profile-card__body">
        <h2>Cdte. A. Rivera</h2>
        <p>ASTRA-SIM-014 · Estación espacial</p>
        <p>Última evaluación: hoy 07:42 UTC</p>
        <div className="mission-progress"><span /></div>
        <div className="mission-progress__labels"><span>Día 145 de 240</span><span>95 restantes</span></div>
      </div>
    </Panel>
  )
}
