import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Volume2, Pause, Play, MessageCircle, AlertTriangle, Mic } from 'lucide-react'
import { speakText } from '../lib/speech'

export default function AISignAvatar() {
  const [text, setText] = useState('Hello, how are you?')
  const [playing, setPlaying] = useState(false)
  const [status, setStatus] = useState('Ready to speak')

  const speak = () => {
    if (!text.trim()) { setStatus('Enter a message first.'); return }
    const started = speakText(text, localStorage.getItem('signbridge-voice') || 'en-IN', Number(localStorage.getItem('signbridge-speech-rate') || '1'), {
      onStart: () => { setPlaying(true); setStatus('Speaking') },
      onEnd: () => { setPlaying(false); setStatus('Playback complete') },
      onError: message => { setPlaying(false); setStatus(message) },
    })
    if (!started) { setPlaying(false); setStatus('Speech output is not supported in this browser.') }
  }

  const togglePlayback = () => {
    if (!('speechSynthesis' in window)) { setStatus('Speech output is not supported in this browser.'); return }
    if (playing) {
      window.speechSynthesis.pause()
      setPlaying(false)
      setStatus('Paused')
    } else if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume()
      setPlaying(true)
      setStatus('Speaking')
    } else speak()
  }

  return (
    <div className="container max-w-7xl py-10">
      <div className="mb-8 flex flex-col gap-3">
        <span className="text-sm font-semibold uppercase tracking-[0.16em] text-primary">Speech output</span>
        <h1 className="font-display text-4xl font-bold tracking-tight">AI Sign Avatar</h1>
        <p className="max-w-2xl text-muted-foreground">Prepare a message and have your device read it aloud. An animated ISL avatar requires a validated sign clip or motion library that is not included here.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_0.8fr]">
        <section className="overflow-hidden rounded-3xl border border-border bg-card">
          <div className="border-b border-border p-5"><h2 className="font-display text-xl font-semibold">Message playback</h2><p className="mt-1 text-sm text-muted-foreground">Uses the speech voices installed in your browser or operating system.</p></div>
          <div className="flex min-h-72 flex-col items-center justify-center bg-gradient-to-br from-primary/[0.08] via-transparent to-secondary/[0.1] p-8 text-center">
            <div className="mb-4 rounded-3xl bg-primary/10 p-5 text-primary"><MessageCircle className="h-9 w-9" /></div>
            <p className="max-w-lg font-display text-2xl font-semibold leading-relaxed">{text.trim() || 'Your message will appear here'}</p>
            <p role="status" className="mt-3 text-sm text-muted-foreground">{status}</p>
          </div>
          <div className="flex gap-3 border-t border-border p-4">
            <button onClick={togglePlayback} className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground">{playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}{playing ? 'Pause' : 'Play speech'}</button>
            <button onClick={speak} className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-border px-4 py-3 text-sm font-semibold hover:bg-muted"><Volume2 className="h-4 w-4" />Start again</button>
          </div>
        </section>

        <aside className="space-y-5">
          <div className="rounded-3xl border border-border bg-card p-6">
            <h2 className="font-display text-xl font-semibold">Compose</h2>
            <label htmlFor="avatar-text" className="mb-2 mt-4 block text-sm font-medium">Message to speak</label>
            <textarea id="avatar-text" value={text} onChange={event => setText(event.target.value)} maxLength={1000} className="min-h-40 w-full resize-y rounded-xl border border-border bg-background p-4 text-sm leading-6 outline-none focus:ring-2 focus:ring-primary" placeholder="Type a message…" />
            <p className="mt-2 text-right text-xs text-muted-foreground">{text.length}/1000</p>
            <button onClick={speak} className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground"><Volume2 className="h-4 w-4" />Speak message</button>
          </div>
          <div className="rounded-3xl border border-amber-500/30 bg-amber-500/5 p-5">
            <div className="flex gap-3"><AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" /><div><h3 className="font-semibold">ISL avatar is not available yet</h3><p className="mt-1 text-sm leading-6 text-muted-foreground">This build has no verified ISL avatar animation or phrase library. It will not present English text as sign language.</p></div></div>
            <Link to="/conversation" className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"><Mic className="h-4 w-4" />Use speech-to-text conversation</Link>
          </div>
        </aside>
      </div>
    </div>
  )
}
