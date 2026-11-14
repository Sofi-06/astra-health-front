import { useEffect, useState } from 'react'
import { closeSession, hasSession, openSession } from '../api/client'
import DashboardPage from '../pages/DashboardPage'
import LoginPage from '../pages/LoginPage'

export default function App() {
  const [notice, setNotice] = useState('')
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [session, setSession] = useState(null)
  const [checkingSession, setCheckingSession] = useState(true)

  // Si la pestaña ya tenía sesión, se reanuda sin pasar por el login.
  useEffect(() => {
    if (!hasSession()) {
      setCheckingSession(false)
      return
    }
    openSession().then((data) => {
      if (data) {
        setSession(data)
        setIsAuthenticated(true)
      }
    }).catch(() => {}).finally(() => setCheckingSession(false))
  }, [])

  const logout = async () => {
    try { await closeSession() } catch { /* el token local se elimina de todos modos */ }
    setSession(null)
    setIsAuthenticated(false)
  }

  const notify = (message) => {
    setNotice(message)
    window.clearTimeout(notify.timer)
    notify.timer = window.setTimeout(() => setNotice(''), 2600)
  }

  return (
    <>
      {!checkingSession && (isAuthenticated
        ? <DashboardPage
            onNotify={notify}
            session={session}
            onLogout={logout}
            onUserUpdated={(user) => setSession((current) => ({ ...current, user }))}
          />
        : <LoginPage onLogin={(data) => { setSession(data); setIsAuthenticated(true) }} />)}
      <div className={`toast ${notice ? 'toast--visible' : ''}`} role="status" aria-live="polite">
        <span className="toast__pulse" />
        {notice}
      </div>
    </>
  )
}
