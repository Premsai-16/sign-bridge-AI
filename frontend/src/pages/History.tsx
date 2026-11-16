import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Copy, Download, Trash2, Calendar, Search, History as HistoryIcon } from 'lucide-react'
import { getSavedSessions, removeSession, type SavedSession } from '../lib/sessions'

export default function History() {
  const [sessions, setSessions] = useState<SavedSession[]>(getSavedSessions)
  const [query, setQuery] = useState('')
  const visible = useMemo(() => sessions.filter(item => item.content.toLowerCase().includes(query.toLowerCase())), [sessions, query])

  const copy = async (content: string) => navigator.clipboard?.writeText(content)
  const download = (item: SavedSession) => {
    const blob = new Blob([item.content], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `signbridge-session-${item.createdAt.slice(0, 10)}.txt`
    anchor.click()
    URL.revokeObjectURL(url)
  }
  const remove = (id: string) => {
    removeSession(id)
    setSessions(getSavedSessions())
  }

  return (
    <div className="container max-w-7xl py-10">
      <div className="mb-8 flex flex-col gap-3">
        <span className="text-sm font-semibold uppercase tracking-[0.16em] text-primary">Your workspace</span>
        <h1 className="font-display text-4xl font-bold tracking-tight">Conversation history</h1>
        <p className="max-w-2xl text-muted-foreground">Saved sessions stay in this browser unless you choose to export them.</p>
      </div>

      <div className="mb-6 flex items-center gap-3 rounded-2xl border border-border bg-card p-3">
        <Search className="ml-2 h-5 w-5 text-muted-foreground" />
        <input value={query} onChange={event => setQuery(event.target.value)} type="search" placeholder="Search saved conversations" className="min-w-0 flex-1 bg-transparent px-2 py-2 text-sm outline-none" />
        <span className="hidden rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground sm:inline">{visible.length} saved</span>
      </div>

      {visible.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-border bg-card/60 px-6 py-16 text-center">
          {sessions.length === 0 ? <HistoryIcon className="mx-auto mb-4 h-10 w-10 text-primary" /> : <Calendar className="mx-auto mb-4 h-10 w-10 text-primary" />}
          <h2 className="font-display text-xl font-semibold">{sessions.length ? 'No matching sessions' : 'Your history starts here'}</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">{sessions.length ? 'Try a different search.' : 'Save a transcript from a communication session and it will appear here.'}</p>
          {!sessions.length && <Link to="/conversation" className="mt-6 inline-flex rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground">Open Conversation Studio</Link>}
        </div>
      ) : (
        <div className="space-y-4">
          {visible.map(item => (
            <article key={item.id} className="rounded-2xl border border-border bg-card p-5 sm:p-6">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-primary">{item.language}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{new Date(item.createdAt).toLocaleString()}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => void copy(item.content)} aria-label="Copy session" title="Copy" className="rounded-lg border border-border p-2 text-muted-foreground hover:bg-muted hover:text-foreground"><Copy className="h-4 w-4" /></button>
                  <button onClick={() => download(item)} aria-label="Download session" title="Download" className="rounded-lg border border-border p-2 text-muted-foreground hover:bg-muted hover:text-foreground"><Download className="h-4 w-4" /></button>
                  <button onClick={() => remove(item.id)} aria-label="Delete session" title="Delete" className="rounded-lg border border-border p-2 text-destructive hover:bg-destructive/10"><Trash2 className="h-4 w-4" /></button>
                </div>
              </div>
              <p className="whitespace-pre-wrap break-words rounded-xl bg-muted/60 p-4 text-sm leading-7">{item.content}</p>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}
