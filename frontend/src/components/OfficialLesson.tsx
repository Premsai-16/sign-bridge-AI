import { useState } from 'react'

const references = {
  alphabet: 'https://cdnbbsr.s3waas.gov.in/s3f7e2b2b75b04175610e5a00c1e221ebb/uploads/2024/07/20240710317807802.pdf',
  numbers: 'https://cdnbbsr.s3waas.gov.in/s3f7e2b2b75b04175610e5a00c1e221ebb/uploads/2024/07/202407101943173279.pdf',
}
export default function OfficialLesson({ kind }: { kind: 'alphabet' | 'numbers' }) {
  const [showVideo, setShowVideo] = useState(false)
  const [selected, setSelected] = useState(kind === 'alphabet' ? 'A' : '0')
  const symbols = kind === 'alphabet' ? 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('') : '0123456789'.split('')
  return <section className="learning-workbench rounded-3xl border border-border bg-card p-5 sm:p-8"><div className="mb-6"><p className="text-sm font-semibold uppercase tracking-widest text-primary">Learn with a clear reference</p><h2 className="mt-2 font-display text-3xl font-bold">{kind === 'alphabet' ? 'The ISL alphabet' : 'ISL numbers 0–9'}</h2><p className="mt-3 max-w-2xl text-muted-foreground">Choose a symbol to open its enlarged reference from the official ISLRTC chart. Enlarge the chart to inspect both hands, finger positions, and palm direction.</p></div>
  <div className="mb-5 flex flex-wrap gap-2">{symbols.map(symbol => <button key={symbol} aria-pressed={selected === symbol} onClick={() => setSelected(symbol)} className={`h-12 w-12 rounded-xl border text-lg font-bold transition hover:-translate-y-1 ${selected === symbol ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-background'}`}>{symbol}</button>)}</div>
  <div className="mb-4 flex flex-wrap items-center justify-between gap-3"><strong className="text-xl">Practising {selected}</strong><a className="rounded-xl bg-primary px-4 py-3 font-semibold text-primary-foreground" href={references[kind]} target="_blank" rel="noopener noreferrer">Open full-size chart</a></div>
  {kind === 'alphabet' && <figure className="mb-6 rounded-2xl border border-border bg-white p-6 text-center"><img key={selected} src={`/lessons/alphabet/${selected}.png`} alt={`Enlarged official ISLRTC reference for letter ${selected}`} className="mx-auto h-[360px] max-w-full object-contain"/><figcaption className="mt-4 text-slate-800">{selected} · Enlarged from the ISLRTC alphabet chart. For moving signs, also watch the video lesson.</figcaption></figure>}
  <object data={references[kind]} type="application/pdf" className="h-[650px] w-full rounded-2xl bg-white"><p className="p-6 text-slate-900">Your browser cannot display the chart inline. Use “Open full-size chart” above.</p></object>
  {kind === 'alphabet' && <div className="mt-5">{showVideo ? <iframe className="aspect-video w-full rounded-2xl" src="https://www.youtube-nocookie.com/embed/0emXzSDO61U" title="ISLRTC manual alphabet lesson" allow="fullscreen; picture-in-picture" allowFullScreen /> : <button className="rounded-xl border border-primary px-5 py-3 font-semibold text-primary" onClick={() => setShowVideo(true)}>Load ISLRTC alphabet video lesson</button>}<p className="mt-2 text-sm text-muted-foreground">Video is hosted on YouTube. Its player provides pause, speed, and full-screen controls.</p></div>}
  <p className="mt-5 text-sm text-muted-foreground">Source: Indian Sign Language Research and Training Centre. Charts and video remain hosted by their publishers. Enlarged letter references are cropped from the chart with source attribution preserved here.</p>
  </section>
}
