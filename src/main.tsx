import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { App } from './ui/App'
import { registriereGlobaleFehlererfassung } from './ui/globale-fehlererfassung'

registriereGlobaleFehlererfassung()

const rootElement = document.getElementById('root')
if (!rootElement) {
  throw new Error('Root-Element "#root" nicht gefunden.')
}

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
