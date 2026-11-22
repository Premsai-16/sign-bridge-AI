import { accountStorage } from '../lib/account'
import { useEffect, useRef, useState } from 'react'

export default function ReferencePractice() {
  const [url, setUrl] = useState('')
  const [name, setName] = useState('')
  const [mirror, setMirror] = useState(false)
  const [rate, setRate] = useState(0.5)
  const [note, setNote] = useState(() => accountStorage.getItem('signbridge-practice-notes') || '')
  const video = useRef<HTMLVideoElement>(null)
  useEffect(() => () => { if (url) URL.revokeObjectURL(url) }, [url])
  useEffect(() => { if (video.current) video.current.playbackRate = rate }, [rate, url])
  return <section className="my-6 rounded-3xl border border-border bg-card p-6 shadow-sm"><p className="text-xs font-semibold uppercase tracking-widest text-primary">Watch · slow down · practise</p><h2 className="mt-2 font-display text-2xl font-bold">Your reference-video workspace</h2><p className="my-3 text-sm text-muted-foreground">Open a demonstration from a qualified signer that you have permission to use. It stays on this device and is not uploaded. This panel does not certify the demonstration.</p>
  <div className="my-4 rounded-xl bg-primary/5 p-4"><h3 className="font-semibold">Learn from official signing resources</h3><p className="my-2 text-sm text-muted-foreground">ISLRTC provides a dictionary, video resources, and self-learning material. Open the official resource to study the sign before practising.</p><a href="https://islrtc.nic.in/isl-dictionary/" target="_blank" rel="noopener noreferrer" className="font-semibold text-primary underline">Open the official ISLRTC dictionary</a></div>
  <label className="block rounded-xl border border-dashed border-primary/40 bg-primary/5 p-4 text-sm font-medium">Choose a demonstration video<input className="mt-2 block max-w-full" type="file" accept="video/*" onChange={event => { const file = event.target.files?.[0]; if (file) { setUrl(URL.createObjectURL(file)); setName(file.name) } }} /></label>
  {url && <div className="mt-4"><p className="mb-2 text-sm">{name}</p><div className="overflow-hidden rounded-2xl bg-slate-950"><video ref={video} src={url} controls playsInline loop className="max-h-[480px] w-full" style={{ transform: mirror ? 'scaleX(-1)' : undefined }} /></div><div className="mt-3 flex flex-wrap items-center gap-4"><label>Playback <select value={rate} onChange={event => setRate(Number(event.target.value))} className="rounded-lg bg-muted p-2">{[0.25, 0.5, 0.75, 1].map(speed => <option key={speed} value={speed}>{speed}×</option>)}</select></label><button onClick={() => setMirror(!mirror)} aria-pressed={mirror}>{mirror ? 'Mirror practice on' : 'Mirror practice off'}</button><button onClick={() => { if (video.current) { video.current.pause(); video.current.currentTime = Math.max(0, video.current.currentTime - 0.1) } }}>Back 0.1 s</button><button onClick={() => { if (video.current) { video.current.pause(); video.current.currentTime = Math.min(video.current.duration || 0, video.current.currentTime + 0.1) } }}>Forward 0.1 s</button></div></div>}
  <div className="mt-5 grid gap-3 sm:grid-cols-3">{['Hand shape: which fingers move?', 'Palm direction: where does it face?', 'Movement: where does it start and end?'].map(item => <div key={item} className="rounded-xl bg-muted/50 p-4 text-sm">{item}</div>)}</div>
  <label className="mt-4 block text-sm font-medium">Private practice notes<textarea className="mt-2 block w-full rounded-xl border border-border bg-background p-3" placeholder="What would you like to practise next?" value={note} onChange={event => { setNote(event.target.value); accountStorage.setItem('signbridge-practice-notes', event.target.value) }} /></label>
  </section>
}
