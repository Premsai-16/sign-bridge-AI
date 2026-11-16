import { ArrowRight, Camera, MessageCircle, BookOpen, History as HistoryIcon } from 'lucide-react'

export default function Overview() {
  const stats = [
    { label: 'Signs Recognized', value: '1,247', change: '+156 this week' },
    { label: 'Learning Progress', value: '68%', change: '+12% courses' },
    { label: 'Saved Phrases', value: '24', change: 'Personal vocabulary' },
  ]

  return (
    <div className="container py-8 max-w-7xl">
      <div className="flex flex-col gap-4 mb-8">
        <h1 className="font-display text-4xl font-bold tracking-tight">Your Dashboard</h1>
        <p className="text-muted-foreground max-w-2xl">
          Continue your ISL journey. Start translating, learning, or reviewing your sessions.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <a href="/live-translate" className="group block rounded-2xl p-6 border border-border bg-card hover:shadow-lg transition-all duration-300">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-secondary text-primary-foreground mb-4">
            <Camera className="h-6 w-6" />
          </div>
          <h3 className="font-display text-lg font-semibold mb-2">Start Translating</h3>
          <p className="text-sm text-muted-foreground mb-3">Begin live sign-to-text communication</p>
          <span className="inline-flex items-center text-primary font-medium text-sm">
            Join Session <ArrowRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" />
          </span>
        </a>

        <a href="/conversation" className="group block rounded-2xl p-6 border border-border bg-card hover:shadow-lg transition-all duration-300">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-secondary text-primary-foreground mb-4">
            <MessageCircle className="h-6 w-6" />
          </div>
          <h3 className="font-display text-lg font-semibold mb-2">Conversation Studio</h3>
          <p className="text-sm text-muted-foreground mb-3">Two-way communication with speech support</p>
          <span className="inline-flex items-center text-primary font-medium text-sm">
            Open Studio <ArrowRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" />
          </span>
        </a>

        <a href="/learn" className="group block rounded-2xl p-6 border border-border bg-card hover:shadow-lg transition-all duration-300">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-secondary text-primary-foreground mb-4">
            <BookOpen className="h-6 w-6" />
          </div>
          <h3 className="font-display text-lg font-semibold mb-2">Learn ISL</h3>
          <p className="text-sm text-muted-foreground mb-3">Structured lessons from ISL experts</p>
          <span className="inline-flex items-center text-primary font-medium text-sm">
            Start Learning <ArrowRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" />
          </span>
        </a>

        <a href="/history" className="group block rounded-2xl p-6 border border-border bg-card hover:shadow-lg transition-all duration-300">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-secondary text-primary-foreground mb-4">
            <HistoryIcon className="h-6 w-6" />
          </div>
          <h3 className="font-display text-lg font-semibold mb-2">History</h3>
          <p className="text-sm text-muted-foreground mb-3">Your saved translation sessions</p>
          <span className="inline-flex items-center text-primary font-medium text-sm">
            View History <ArrowRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" />
          </span>
        </a>
      </div>

      <div className="grid gap-4 md:grid-cols-3 mb-8">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-2xl border border-border bg-card p-6 text-center">
            <div className="text-3xl font-bold text-primary mb-1">{stat.value}</div>
            <p className="text-sm text-muted-foreground mb-2">{stat.label}</p>
            <p className="text-xs text-green-600 dark:text-green-400">{stat.change}</p>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-border bg-card">
        <div className="border-b border-border p-6">
          <h2 className="font-display text-2xl font-bold">Recent Activity</h2>
          <p className="text-muted-foreground mt-1">Your latest translation sessions</p>
        </div>
        <div className="p-6">
          <div className="text-center py-8 text-muted-foreground">
            <p>No recent activity. Start a translation session to see history.</p>
          </div>
        </div>
      </div>
    </div>
  )
}