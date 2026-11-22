import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/index.css'
import App from './App.tsx'

// Apply theme class before React renders
const stored = localStorage.getItem('signbridge-theme')
const isDark = stored === 'dark'
document.documentElement.classList.toggle('dark', isDark)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    void navigator.serviceWorker.register('/sw.js').catch(() => {
      // The conversation still works online when offline storage is unavailable.
    })
  })
}
