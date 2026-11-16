import { Home, ArrowLeft } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="container flex flex-col items-center justify-center min-h-[70vh] py-8 text-center">
      <div className="max-w-md mx-auto px-4">
        <div className="mb-6">
          <span className="text-8xl font-bold text-primary/20">404</span>
        </div>
        <h1 className="font-display text-3xl font-bold mb-4">Page Not Found</h1>
        <p className="text-muted-foreground mb-8">
          The page you're looking for doesn't exist or has moved. Let's get you back on track.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-primary to-secondary px-6 py-3 text-white font-medium hover:from-primary/90 hover:to-secondary/90 transition"
          >
            <Home className="h-4 w-4 mr-2" />
            Go Home
          </a>
          <a
            href="/live-translate"
            className="inline-flex items-center justify-center rounded-xl border border-border px-6 py-3 text-muted-foreground font-medium hover:bg-muted transition"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Quick Translate
          </a>
        </div>
      </div>
    </div>
  )
}