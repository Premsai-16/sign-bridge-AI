import LocalizedNavLabel from './LocalizedNavLabel'
import { accountStorage, signOut, saveStatus, flushAccountSaves } from '../lib/account'
import { Link, Outlet, useLocation } from 'react-router-dom'
import { useState, useCallback, useEffect } from 'react'
import BridgeMark from './BridgeMark'
import ThemeToggle from './ui/ThemeToggle'
import { Download, Menu, X } from 'lucide-react'

interface InstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

const navItems = [
  { path: '/', label: 'Home' },
  { path: '/conversation', label: 'Live Studio' },
  { path: '/learn', label: 'Learn ISL' },
  { path: '/hub', label: 'Text & speech' },
  { path: '/accessibility', label: 'Emergency words' },
]

export default function Layout() {
  const [syncStatus, setSyncStatus] = useState(saveStatus)
  useEffect(() => { const update = () => setSyncStatus(saveStatus); window.addEventListener('account-save-status',update); return () => window.removeEventListener('account-save-status',update) }, [])
  const [mobileMenuPath, setMobileMenuPath] = useState<string | null>(null)
  const [installPrompt, setInstallPrompt] = useState<InstallPromptEvent | null>(null)
  const location = useLocation()
  const mobileOpen = mobileMenuPath === location.pathname
  const setMobileOpen = (open: boolean) => setMobileMenuPath(open ? location.pathname : null)

  useEffect(() => {
    const offerInstall = (event: Event) => {
      event.preventDefault()
      setInstallPrompt(event as InstallPromptEvent)
    }
    const installed = () => setInstallPrompt(null)
    window.addEventListener('beforeinstallprompt', offerInstall)
    window.addEventListener('appinstalled', installed)
    return () => {
      window.removeEventListener('beforeinstallprompt', offerInstall)
      window.removeEventListener('appinstalled', installed)
    }
  }, [])

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [location.pathname])

  useEffect(() => {
    const close = (event: KeyboardEvent) => { if (event.key === 'Escape') setMobileMenuPath(null) }
    window.addEventListener('keydown', close)
    return () => window.removeEventListener('keydown', close)
  }, [])

  const installApp = async () => {
    if (!installPrompt) return
    await installPrompt.prompt()
    await installPrompt.userChoice
    setInstallPrompt(null)
  }

  const getNavClass = useCallback(
    (path: string) => {
      const isActive = location.pathname === path
      return `text-sm font-semibold px-3 py-2 rounded-xl transition duration-150 ${
        isActive
          ? 'text-primary bg-primary/10 font-bold shadow-xs'
          : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
      }`
    },
    [location.pathname]
  )

  const getMobileNavClass = useCallback(
    (path: string) => {
      const isActive = location.pathname === path
      return `text-sm font-semibold transition-colors px-4 py-2.5 rounded-xl flex items-center justify-between ${
        isActive
          ? 'text-primary bg-primary/10 font-bold'
          : 'text-muted-foreground hover:text-foreground hover:bg-muted'
      }`
    },
    [location.pathname]
  )

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col selection:bg-primary/20 selection:text-primary">
      {/* Sticky Header */}
      <a href="#main-content" className="skip-link">Skip to content</a>
      <header className="site-header sticky top-0 z-50 w-full border-b border-border bg-background/90 backdrop-blur-md supports-[backdrop-filter]:bg-background/70 shadow-xs">
        <div className="container max-w-7xl flex h-20 items-center justify-between mx-auto px-4">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <BridgeMark className="brand-mark" />
            <div className="flex flex-col">
              <span className="font-display font-extrabold text-xl tracking-tight text-foreground flex items-center gap-1.5">
                SignBridge <span className="text-primary text-xs font-bold px-1.5 py-0.5 rounded-full bg-primary/10">AI</span>
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav aria-label="Main navigation" className="hidden xl:flex items-center gap-1">
            {navItems.map(item => (
              <Link key={item.path} to={item.path} aria-current={location.pathname === item.path ? 'page' : undefined} className={getNavClass(item.path)}>
                <LocalizedNavLabel label={item.label}/>
              </Link>
            ))}
          </nav>

          {/* Right Header Utilities */}
          <div className="flex items-center gap-2">
            {installPrompt && (
              <button
                type="button"
                onClick={() => void installApp()}
                className="inline-flex items-center gap-1.5 rounded-xl border border-border px-3 py-1.5 text-xs font-semibold hover:bg-muted transition"
              >
                <Download className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Install</span>
              </button>
            )}
            <ThemeToggle />
            <button
              className="xl:hidden rounded-xl p-2 text-muted-foreground hover:text-foreground hover:bg-muted"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={mobileOpen}
              aria-controls="mobile-navigation"
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileOpen && (
          <div id="mobile-navigation" className="xl:hidden border-b border-border bg-card/95 backdrop-blur-xl px-4 py-4 space-y-1 animate-in slide-in-from-top-4 duration-200">
            {navItems.map(item => (
              <Link
                key={item.path}
                to={item.path}
                aria-current={location.pathname === item.path ? 'page' : undefined}
                onClick={() => setMobileOpen(false)}
                className={getMobileNavClass(item.path)}
              >
                <span><LocalizedNavLabel label={item.label}/></span>
                {location.pathname === item.path && <span className="h-1.5 w-1.5 rounded-full bg-primary" />}
              </Link>
            ))}
          </div>
        )}
      </header>

      <div className="account-strip"><span>{accountStorage.getItem('signbridge-name') || 'Your account'} · <span role="status">{syncStatus}</span></span><div><Link to="/profile"><LocalizedNavLabel label="My preferences"/></Link><button onClick={() => void flushAccountSaves()}><LocalizedNavLabel label="Save now"/></button><button onClick={() => void signOut().catch(error => setSyncStatus(error.message))}><LocalizedNavLabel label="Sign out"/></button></div></div>
      {/* Page Content */}
      <main id="main-content" tabIndex={-1} className={`flex-1 app-canvas route-${location.pathname.split('/')[1] || 'home'}`}>
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-card/50 backdrop-blur py-8 mt-16 text-sm text-muted-foreground">
        <div className="container max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-primary">SignBridge</span>
            <span>More ways to understand each other.</span>
          </div>
          <div className="flex flex-wrap justify-center items-center gap-4">
            <Link to="/history" className="hover:text-foreground transition">History</Link>
            <Link to="/research" className="hover:text-foreground transition">
              Model Governance
            </Link>
            <Link to="/accessibility" className="hover:text-foreground transition">
              Emergency Boards
            </Link>
            <Link to="/settings" className="hover:text-foreground transition">
              Settings
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
