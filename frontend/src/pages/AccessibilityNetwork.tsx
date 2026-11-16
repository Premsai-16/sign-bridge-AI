import { Hospital, Bus, BookOpen, Shield, Plus } from 'lucide-react'

export default function AccessibilityNetwork() {
  const scenarios = [
    { name: 'Healthcare', desc: 'Medical communication boards', icon: Hospital },
    { name: 'Transport', desc: 'Travel and navigation phrases', icon: Bus },
    { name: 'Education', desc: 'Classroom communication tools', icon: BookOpen },
    { name: 'Emergency', desc: 'Critical phrases with interpreter pathway', icon: Shield },
  ]

  return (
    <div className="container py-8 max-w-7xl">
      <div className="flex flex-col gap-4 mb-6">
        <h1 className="font-display text-3xl font-bold tracking-tight">Accessibility Network</h1>
        <p className="text-muted-foreground max-w-2xl">
          Practical communication boards for real-world scenarios. Prepared phrases for critical situations.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
        {scenarios.map((scenario) => {
          const Icon = scenario.icon
          return (
            <div key={scenario.name} className="rounded-2xl border border-border bg-card p-6 hover:shadow-lg transition-all duration-300">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-secondary/10 text-secondary mb-4">
                <Icon className="h-6 w-6" />
              </div>
              <h3 className="font-display text-lg font-semibold mb-2">{scenario.name}</h3>
              <p className="text-sm text-muted-foreground mb-4">{scenario.desc}</p>
              <a href="#" className="inline-flex items-center text-primary font-medium text-sm hover:underline">
                Open Board <Plus className="h-4 w-4 ml-1" />
              </a>
            </div>
          )
        })}
      </div>

      <div className="rounded-2xl border border-border bg-card">
        <div className="border-b border-border p-4">
          <h2 className="font-display text-xl font-semibold">Quick Phrases</h2>
          <p className="text-sm text-muted-foreground mt-1">Common emergency and daily phrases</p>
        </div>
        <div className="p-4">
          <div className="flex flex-wrap gap-2">
            {['Help', 'Water', 'Toilet', 'Food', 'Doctor', 'Thank you', 'Please slow down'].map(phrase => (
              <button
                key={phrase}
                className="px-3 py-1 text-sm rounded-full border border-border text-muted-foreground hover:bg-muted hover:text-foreground transition"
              >
                {phrase}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}