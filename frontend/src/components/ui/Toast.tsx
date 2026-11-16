import { X } from 'lucide-react'
import { createContext, useState, useEffect, useCallback } from 'react'

type Toast = {
  id: string
  title: string
  description?: string
  variant?: 'default' | 'success' | 'warning' | 'error'
}

const ToastContext = createContext<{
  toasts: Toast[]
  push: (toast: Omit<Toast, 'id'>) => void
  pop: () => void
}>(null!)

let toastId = 0
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const push = (toast: Omit<Toast, 'id'>) => {
    const id = `t-${++toastId}`
    setToasts((t) => [...t, { ...toast, id }])
  }

  const pop = useCallback(() => setToasts((t) => t.slice(1)), [])

  useEffect(() => {
    if (!toasts.length) return
    const timer = window.setTimeout(pop, 5000)
    return () => window.clearTimeout(timer)
  }, [toasts, pop])

  return (
    <ToastContext.Provider value={{ toasts, push, pop }}>
      {children}
      <div id="toast-root">
        {toasts.map((t) => (
          <div
            key={t.id}
            className="flex items-start gap-3 rounded-xl border bg-card p-4 shadow-lg animate-slide-up"
            style={{
              borderLeftColor: t.variant === 'error' ? '#ef4444' :
                t.variant === 'warning' ? '#f59e0b' :
                t.variant === 'success' ? '#0d9488' : '#6366f1',
            }}
          >
            <div className="flex-1">
              <div className="font-medium text-sm">{t.title}</div>
              {t.description && <p className="text-xs text-muted-foreground">{t.description}</p>}
            </div>
            <button
              onClick={pop}
              className="text-muted-foreground hover:text-foreground"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}
