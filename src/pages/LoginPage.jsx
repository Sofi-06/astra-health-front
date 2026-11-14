import { useState } from 'react'
import { Activity, ArrowRight, Eye, EyeOff, LockKeyhole, Mail, ShieldCheck } from 'lucide-react'
import LoginAstronaut from '../components/login/LoginAstronaut'

export default function LoginPage({ onLogin }) {
  const [showPassword, setShowPassword] = useState(false)

  const submit = (event) => {
    event.preventDefault()
    onLogin()
  }

  return (
    <main className="login-page">
      <div className="login-page__nebula" />
      <div className="login-page__frame" aria-hidden="true">
        <i className="hud-corner hud-corner--tl" />
        <i className="hud-corner hud-corner--tr" />
        <i className="hud-corner hud-corner--bl" />
        <i className="hud-corner hud-corner--br" />
      </div>

      <header className="login-header">
        <div className="login-brand">
          <img src="/assets/logo3.png" alt="" />
          <div><strong>ASTRA</strong><span>HEALTH</span></div>
        </div>
        <div className="system-status"><i /> SISTEMA OPERATIVO</div>
      </header>

      <section className="login-copy" aria-labelledby="login-heading">
        <p className="login-kicker">ASTRONAUT HEALTH INTELLIGENCE</p>
        <h1 id="login-heading">Tu salud,<br /><em>bajo control.</em></h1>
        <p className="login-lead">Monitoreo inteligente para<br />misiones espaciales.</p>
        <div className="login-motto"><span /><Activity size={31} /><span /></div>
        <p className="login-motto__text">MONITOREAR · ANTICIPAR · ACTUAR</p>
      </section>

      <section className="login-astronaut" aria-label="Astronauta 3D animado">
        <LoginAstronaut />
      </section>

      <form className="access-card" onSubmit={submit}>
        <div className="access-card__edge access-card__edge--top" />
        <div className="access-card__edge access-card__edge--bottom" />
        <div className="access-card__title"><span />CENTRO DE ACCESO<span /></div>
        <h2>Bienvenido, astronauta</h2>
        <p>Accede al sistema de monitoreo de salud.</p>

        <label className="access-input">
          <Mail size={24} />
          <input type="email" name="email" placeholder="Correo institucional" defaultValue="a.rivera@astra.demo" autoComplete="username" required />
        </label>

        <label className="access-input">
          <LockKeyhole size={24} />
          <input type={showPassword ? 'text' : 'password'} name="password" placeholder="Contraseña" defaultValue="astronauta" autoComplete="current-password" required />
          <button type="button" onClick={() => setShowPassword((visible) => !visible)} aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}>
            {showPassword ? <EyeOff size={22} /> : <Eye size={22} />}
          </button>
        </label>

        <button className="access-submit" type="submit">INGRESAR AL CENTRO DE CONTROL <ArrowRight size={20} /></button>
        <div className="access-secure"><ShieldCheck size={18} /> Conexión segura</div>
      </form>

      <footer className="login-footer">ASTRA HEALTH · SPACE MEDICAL INTELLIGENCE</footer>
      <div className="login-footer__bars" aria-hidden="true"><i /><i /><i /><i /></div>
    </main>
  )
}
