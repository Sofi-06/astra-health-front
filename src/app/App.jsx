import { useEffect, useState } from 'react'
import { hasSession, openSession } from '../api/client'
import DashboardPage from '../pages/DashboardPage'
import LoginPage from '../pages/LoginPage'

export default function App() {
  const [notice, setNotice] = useState('')
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  // Si la pestaña ya tenía sesión, se reanuda sin pasar por el login.
  useEffect(() => {
    if (hasSession()) openSession().then(() => setIsAuthenticated(true)).catch(() => {})
  }, [])

  const notify = (message) => {
    setNotice(message)
    window.clearTimeout(notify.timer)
    notify.timer = window.setTimeout(() => setNotice(''), 2600)
  }

  return (
    <>
      {isAuthenticated
        ? <DashboardPage onNotify={notify} />
        : <LoginPage onLogin={() => setIsAuthenticated(true)} />}
      <div className={`toast ${notice ? 'toast--visible' : ''}`} role="status" aria-live="polite">
        <span className="toast__pulse" />
        {notice}
      </div>
    </>
  )
}
