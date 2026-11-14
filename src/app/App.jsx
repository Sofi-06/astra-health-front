import { useState } from 'react'
import DashboardPage from '../pages/DashboardPage'
import LoginPage from '../pages/LoginPage'

export default function App() {
  const [notice, setNotice] = useState('')
  const [isAuthenticated, setIsAuthenticated] = useState(false)

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
