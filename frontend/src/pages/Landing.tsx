import { Link } from 'react-router-dom'
import { Camera, MessageCircle, BookOpen, Shield, Sparkles } from 'lucide-react'

export default function Landing() {

  const features = [
    {
      icon: Camera,
      title: 'Live Translation',
      desc: 'Open a camera workspace for accessible, private communication sessions.',
      href: '/live-translate',
      highlight: true,
    },
    {
      icon: MessageCircle,
      title: 'Conversation Studio',
      desc: 'Combine typed messages, speech input, and spoken output in one workspace.',
      href: '/conversation',
      highlight: true,
    },
    {
      icon: BookOpen,
      title: 'Learn ISL',
      desc: 'Explore a growing set of ISL learning and practice tools.',
      href: '/learn',
    },
    {
      icon: Shield,
      title: 'Research Lab',
      desc: 'Transparent model cards, evaluation metrics, and data governance.',
      href: '/research',
    },
  ]

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Hero */}
      <section className="relative isolate bridge-bg pt-20 sm:pt-32 pb-16 sm:pb-32 flex flex-col items-center">
        <div className="absolute -top-40 -left-40 w-80 h-80 rounded-full bg-primary opacity-10 blur-3xl"></div>
        <div className="absolute -bottom-40 -right-40 w-80 h-80 rounded-full bg-secondary opacity-10 blur-3xl"></div>

        <div className="mx-auto max-w-4xl px-4 text-center transition-all duration-700">
          <div className="inline-flex items-center gap-2 rounded-full bg-saffron/10 px-4 py-2 mb-6">
            <Sparkles className="h-4 w-4 text-saffron" />
            <span className="text-sm font-medium text-saffron">Accessibility • Community • Open Source</span>
          </div>

          <h1 className="font-display text-5xl sm:text-6xl md:text-7xl font-bold text-foreground mb-6">
            <span className="block">Communication Without</span>
            <span className="block text-primary mt-2">Barriers</span>
          </h1>

          <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
            Communication tools designed around Indian Sign Language, accessible speech, and privacy-first sessions.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/live-translate"
              className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-primary to-secondary px-8 py-4 text-lg font-medium text-primary-foreground
                hover:from-primary/90 hover:to-secondary/90 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              Start Translating
            </Link>
            <Link
              to="/learn"
              className="inline-flex items-center justify-center rounded-xl border-2 border-border px-8 py-4 text-lg font-medium
                hover:bg-muted transition-all duration-200"
            >
              Learn ISL
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-background">
        <div className="container">
          <div className="text-center mb-16">
            <h2 className="font-display text-4xl font-bold mb-4">Everything you need</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              One workspace for camera sessions, conversations, learning tools, and privacy controls.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature) => (
              <Link
                key={feature.title}
                to={feature.href}
                className={`group rounded-2xl p-6 border transition-all duration-300 ${
                  feature.highlight
                    ? 'border-primary bg-primary/5 shadow-lg hover:shadow-xl hover:-translate-y-2'
                    : 'border-border bg-card hover:shadow-md'
                }`}
              >
                <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl mb-4 transition-all duration-300 ${
                  feature.highlight
                    ? 'bg-gradient-to-br from-primary to-secondary text-primary-foreground'
                    : 'bg-muted text-muted-foreground group-hover:bg-primary/10'
                }`}>
                  <feature.icon className="h-6 w-6" />
                </div>
                <h3 className="font-display text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.desc}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Privacy */}
      <section className="py-20">
        <div className="container">
          <div className="relative rounded-3xl p-8 sm:p-12 bg-gradient-to-r from-primary/5 to-secondary/5 border border-border">
            <div className="absolute -inset-4 rounded-3xl border-2 border-dashed border-primary/30"></div>
            <div className="relative max-w-3xl mx-auto">
              <h2 className="font-display text-3xl font-bold mb-4 text-center">Privacy & Consent First</h2>
              <p className="text-muted-foreground text-center mb-6">
                Your communication stays private. No raw video or audio stored. Landmark data only saved with explicit consent.
              </p>
              <div className="grid md:grid-cols-3 gap-6 text-center">
                <div>
                  <p className="font-medium text-primary">✓ Local Processing</p>
                  <p className="text-sm text-muted-foreground">Video never leaves your device</p>
                </div>
                <div>
                  <p className="font-medium text-primary">✓ Informed Consent</p>
                  <p className="text-sm text-muted-foreground">You control your data</p>
                </div>
                <div>
                  <p className="font-medium text-primary">✓ Export & Delete</p>
                  <p className="text-sm text-muted-foreground">Take your data with you</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Platform status */}
      <section className="py-20 border-t border-border">
        <div className="container">
          <div className="mb-8 text-center">
            <h2 className="font-display text-2xl font-bold">Built for useful, honest communication</h2>
            <p className="mt-2 text-sm text-muted-foreground">Clear capability status, accessible controls, and local-first session history.</p>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-border bg-card p-5"><p className="font-semibold text-primary">Camera preview</p><p className="mt-1 text-sm text-muted-foreground">Live camera access with browser permission and on-device preview.</p></div>
            <div className="rounded-2xl border border-border bg-card p-5"><p className="font-semibold text-primary">Speech tools</p><p className="mt-1 text-sm text-muted-foreground">Browser speech-to-text and text-to-speech where supported.</p></div>
            <div className="rounded-2xl border border-border bg-card p-5"><p className="font-semibold text-amber-700">Recognition scope</p><p className="mt-1 text-sm text-muted-foreground">An experimental 11-sign vocabulary and personal held-sign matching are available. Continuous ISL translation is not.</p></div>
          </div>
        </div>
      </section>
    </div>
  )
}
