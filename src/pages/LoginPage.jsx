import { useState } from 'react'
import { Activity, ArrowRight, Eye, EyeOff, LockKeyhole, Mail, ShieldCheck, UserRound } from 'lucide-react'
import { loginAccount, registerAccount } from '../api/client'
import LoginAstronaut from '../components/login/LoginAstronaut'

export default function LoginPage({ onLogin }) {
  const [showPassword, setShowPassword] = useState(false)
  const [mode, setMode] = useState('login')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const registering = mode === 'register'

  const changeMode = (nextMode) => {
    setMode(nextMode)
    setError('')
    setShowPassword(false)
  }

  const submit = async (event) => {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const name = String(form.get('name') || '').trim()
    const email = String(form.get('email') || '').trim()
    const password = String(form.get('password') || '')
    const confirmation = String(form.get('confirmation') || '')

    if (registering && password !== confirmation) {
      setError('Las contraseñas no coinciden.')
      return
    }

    setBusy(true)
    setError('')
    try {
      const session = registering
        ? await registerAccount(name, email, password)
        : await loginAccount(email, password)
      onLogin(session)
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setBusy(false)
    }
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

      <form className={`access-card ${registering ? 'access-card--register' : ''}`} onSubmit={submit}>
        <div className="access-card__edge access-card__edge--top" />
        <div className="access-card__edge access-card__edge--bottom" />
        <div className="access-mode" role="tablist" aria-label="Tipo de acceso">
          <button type="button" role="tab" aria-selected={!registering} className={!registering ? 'is-active' : ''} onClick={() => changeMode('login')}>Ingresar</button>
          <button type="button" role="tab" aria-selected={registering} className={registering ? 'is-active' : ''} onClick={() => changeMode('register')}>Crear cuenta</button>
        </div>
        <div className="access-card__title"><span />CENTRO DE ACCESO<span /></div>
        <h2>{registering ? 'Crea tu perfil de misión' : 'Bienvenido, astronauta'}</h2>
        <p>{registering ? 'Tus registros quedarán vinculados a esta cuenta.' : 'Ingresa para continuar con tus registros de salud.'}</p>

        {registering && (
          <label className="access-input">
            <UserRound size={24} />
            <input type="text" name="name" placeholder="Nombre completo" autoComplete="name" minLength="2" maxLength="80" required />
          </label>
        )}

        <label className="access-input">
          <Mail size={24} />
          <input type="email" name="email" placeholder="Correo institucional" autoComplete="username" maxLength="254" required />
        </label>

        <label className="access-input">
          <LockKeyhole size={24} />
          <input type={showPassword ? 'text' : 'password'} name="password" placeholder="Contraseña (mínimo 8 caracteres)" autoComplete={registering ? 'new-password' : 'current-password'} minLength="8" maxLength="128" required />
          <button type="button" onClick={() => setShowPassword((visible) => !visible)} aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}>
            {showPassword ? <EyeOff size={22} /> : <Eye size={22} />}
          </button>
        </label>

        {registering && (
          <label className="access-input">
            <LockKeyhole size={24} />
            <input type={showPassword ? 'text' : 'password'} name="confirmation" placeholder="Confirma la contraseña" autoComplete="new-password" minLength="8" maxLength="128" required />
          </label>
        )}

        <button className="access-submit" type="submit" disabled={busy}>
          {busy ? 'PROCESANDO…' : registering ? 'CREAR CUENTA Y CONTINUAR' : 'INGRESAR AL CENTRO DE CONTROL'} <ArrowRight size={20} />
        </button>
        {error && <p className="access-error" role="alert">{error}</p>}
        <button className="access-alternate" type="button" onClick={() => changeMode(registering ? 'login' : 'register')}>
          {registering ? '¿Ya tienes una cuenta? Ingresa' : '¿Aún no tienes cuenta? Regístrate'}
        </button>
        <div className="access-secure"><ShieldCheck size={18} /> Contraseña protegida · sesión privada</div>
      </form>

      <footer className="login-footer">ASTRA HEALTH · SPACE MEDICAL INTELLIGENCE</footer>
      <div className="login-footer__bars" aria-hidden="true"><i /><i /><i /><i /></div>
    </main>
  )
}
