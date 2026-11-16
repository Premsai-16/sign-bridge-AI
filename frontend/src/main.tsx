import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/index.css'
import App from './App.tsx'

// Apply theme class before React renders
const stored = localStorage.getItem('signbridge-theme')
const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
const isDark = stored ? stored === 'dark' : prefersDark
document.documentElement.classList.toggle('dark', isDark)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)