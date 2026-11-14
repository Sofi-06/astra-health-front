import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './app/App'
import './styles/tokens.css'
import './styles/global.css'
import './styles/login.css'
import './styles/dashboard.css'
import './styles/health-monitor.css'
import './styles/mind-tracker.css'
import './styles/body-explorer.css'
import './styles/space-health-insights.css'
import './styles/smart-alerts.css'
import './styles/mission-challenges.css'
import './styles/health-analytics.css'
import './styles/responsive.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
