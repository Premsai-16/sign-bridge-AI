import { Link, Outlet, useLocation } from 'react-router-dom'
import { useState, useCallback } from 'react'
import ThemeToggle from './ui/ThemeToggle'

const navItems = [
  { path: '/', label: 'Overview' },
  { path: '/live-translate', label: 'Live Translate' },
  { path: '/conversation', label: 'Conversation Studio' },
  { path: '/avatar', label: 'AI Sign Avatar' },
  { path: '/learn', label: 'Learn ISL' },
  { path: '/research', label: 'AI Research Lab' },
  { path: '/community', label: 'Community' },
  { path: '/history', label: 'History' },
  { path: '/settings', label: 'Settings' },
]

export default function Layout() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const location = useLocation()

  const getNavClass = useCallback((path: string) =>
    `text-sm font-medium transition-colors ${location.pathname === path
      ? 'text-primary'
      : 'text-muted-foreground hover:text-foreground'
    }`
    , [location.pathname])

  const getMobileNavClass = useCallback((path: string) =>
    `text-base font-medium transition-colors px-3 py-2 rounded-lg ${location.pathname === path
      ? 'text-primary bg-primary/10'
      : 'text-muted-foreground hover:text-foreground hover:bg-muted'
    }`
    , [location.pathname])

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <div className="relative">
              <div className="absolute -inset-2 -rotate-6 rounded-full bg-secondary opacity-20"></div>
              <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-secondary text-primary-foreground font-bold text-sm">SB</div>
            </div>
            <span className="font-display font-bold text-2xl text-primary dark:text-primary-foreground">SignBridge AI</span>
          </Link>

          <nav className="hidden lg:flex items-center gap-1">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={getNavClass(item.path)}
              >
                {item.label}
              </Link>
            ))}
            <Link to="/" className="hidden lg:block">
              <div className="bridge-accent-bar ml-2"></div>
            </Link>
          </nav>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            <button
              className="lg:hidden"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={mobileOpen}
            >
              {mobileOpen ? (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="4" y1="12" x2="20" y2="12" />
                  <line x1="4" y1="6" x2="20" y2="6" />
                  <line x1="4" y1="18" x2="20" y2="18" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </header>

      {mobileOpen && (
        <nav className="fixed inset-0 z-40 bg-background/95 backdrop-blur lg:hidden">
          <div className="flex flex-col h-full pt-16 px-4">
            <nav className="flex flex-col gap-2">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileOpen(false)}
                  className={getMobileNavClass(item.path)}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
        </nav>
      )}

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="border-t border-border bg-muted/20">
        <div className="container flex flex-col md:flex-row justify-between items-center gap-4 py-6 lg:h-20">
          <p className="text-sm text-muted-foreground">
            Communication for the Deaf Community • Built with Care
          </p>
          <p className="text-xs text-muted-foreground">
            © 2024 SignBridge AI • A project for accessibility
          </p>
        </div>
      </footer>
    </div>
  )
}

export function Navigation() {
  return null
}
