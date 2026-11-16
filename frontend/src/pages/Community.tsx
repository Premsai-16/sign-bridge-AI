import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Users, BookOpen, CheckCircle, ExternalLink, Info } from 'lucide-react'

const interests = [
  { name: 'ISL learning', topics: 'Study plans, vocabulary, and learning resources' },
  { name: 'Accessible communication', topics: 'Tools and ideas for inclusive communication' },
  { name: 'Deaf culture and advocacy', topics: 'Community resources and accessibility' },
]

export default function Community() {
  const [following, setFollowing] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem('signbridge-community-interests') || '[]') as string[] } catch { return [] }
  })
  const toggleFollowing = (name: string) => {
    const next = following.includes(name) ? following.filter(item => item !== name) : [...following, name]
    setFollowing(next)
    localStorage.setItem('signbridge-community-interests', JSON.stringify(next))
  }

  return (
    <div className="container max-w-7xl py-10">
      <div className="mb-8 flex flex-col gap-3">
        <span className="text-sm font-semibold uppercase tracking-[0.16em] text-primary">Learning together</span>
        <h1 className="font-display text-4xl font-bold tracking-tight">Community</h1>
        <p className="max-w-2xl text-muted-foreground">Save the topics you want to follow in this browser and jump into the learning tools available in this build.</p>
      </div>

      <div className="mb-6 flex gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/5 p-4 text-sm"><Info className="h-5 w-5 shrink-0 text-amber-600" /><p className="text-muted-foreground">Shared groups, member counts, discussion boards, and contributor submissions require a community service. They are not connected in this build.</p></div>

      <div className="grid gap-5 md:grid-cols-3">
        {interests.map(interest => {
          const active = following.includes(interest.name)
          return <article key={interest.name} className="rounded-2xl border border-border bg-card p-6">
            <div className="mb-5 inline-flex rounded-xl bg-primary/10 p-3 text-primary"><Users className="h-6 w-6" /></div>
            <h2 className="font-display text-lg font-semibold">{interest.name}</h2>
            <p className="mt-2 min-h-12 text-sm text-muted-foreground">{interest.topics}</p>
            <button onClick={() => toggleFollowing(interest.name)} aria-pressed={active} className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-border px-4 py-2.5 text-sm font-semibold hover:bg-muted">{active ? <><CheckCircle className="h-4 w-4 text-success" />Following</> : 'Follow interest'}</button>
          </article>
        })}
      </div>

      <section className="mt-8 rounded-3xl border border-border bg-card p-6 sm:p-8">
        <h2 className="font-display text-2xl font-bold">Available resources</h2>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <Link to="/learn" className="group rounded-2xl border border-border p-5 hover:border-primary/40 hover:bg-primary/[0.03]"><BookOpen className="h-6 w-6 text-primary" /><h3 className="mt-3 font-semibold">Learning tools</h3><p className="mt-1 text-sm text-muted-foreground">Open the practice planner and track study sessions locally.</p><span className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-primary">Open lessons <ExternalLink className="h-4 w-4" /></span></Link>
          <Link to="/research" className="group rounded-2xl border border-border p-5 hover:border-primary/40 hover:bg-primary/[0.03]"><CheckCircle className="h-6 w-6 text-primary" /><h3 className="mt-3 font-semibold">Model transparency</h3><p className="mt-1 text-sm text-muted-foreground">Review what is and is not connected in this build.</p><span className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-primary">View model status <ExternalLink className="h-4 w-4" /></span></Link>
        </div>
      </section>
    </div>
  )
}
