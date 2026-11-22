import { accountStorage } from '../lib/account'
import SentenceTranslator from './SentenceTranslator'
import { useEffect, useState } from 'react'
import { ownerApi } from '../lib/api'
import { setSharedTranslations, OUTPUT_LANGUAGES, PHRASE_KEYS, translatePhrase } from '../lib/languages'
import { speakText } from '../lib/speech'

export default function CommunicationToolkit({ vocabulary = [], liveText = '' }: { vocabulary?: string[]; liveText?: string }) {
  const [, setTranslationRevision] = useState(0)
  useEffect(() => { let active = true; const refresh = () => { void ownerApi.translations().then(value => { if (active) { setSharedTranslations(value); setTranslationRevision(current => current + 1) } }).catch(() => {}) }; refresh(); const timer = window.setInterval(refresh, 60000); return () => { active = false; window.clearInterval(timer) } }, [])
  const [language, setLanguage] = useState(() => accountStorage.getItem('signbridge-output-language') || 'en-IN')
  useEffect(() => { const update = () => setLanguage(accountStorage.getItem('signbridge-output-language') || 'en-IN'); window.addEventListener('signbridge-language', update); return () => window.removeEventListener('signbridge-language', update) }, [])
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState('hello')
  const [large, setLarge] = useState(false)
  const [rotated, setRotated] = useState(false)
  const [notice, setNotice] = useState('')
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([])
  const [favorites, setFavorites] = useState<string[]>(() => { try { return JSON.parse(accountStorage.getItem('signbridge-favorite-phrases') || '[]') } catch { return [] } })
  useEffect(() => { const update = () => setVoices(window.speechSynthesis?.getVoices() || []); update(); window.speechSynthesis?.addEventListener('voiceschanged', update); return () => window.speechSynthesis?.removeEventListener('voiceschanged', update) }, [])
  const translated = translatePhrase(selected, language)
  const supported = voices.some(voice => voice.lang.toLowerCase().split('-')[0] === language.split('-')[0])
  const speak = () => { setNotice(''); speakText(selected, language, Number(accountStorage.getItem('signbridge-speech-rate') || '1'), { onError: setNotice }) }
  return <details className="my-6 rounded-3xl border border-border bg-card p-6 shadow-sm"><summary className="cursor-pointer font-display text-lg font-bold">Language, phrase cards & vocabulary</summary><div className="mt-5">
    <div className="flex flex-wrap items-center justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-widest text-primary">Everyday connection</p><h2 className="font-display text-2xl font-bold">Words that travel with you</h2></div><label className="text-sm">Spoken output <select className="ml-2 rounded-xl border border-border bg-background p-3" value={language} onChange={event => { setLanguage(event.target.value); accountStorage.setItem('signbridge-output-language', event.target.value); window.dispatchEvent(new Event('signbridge-language')) }}>{OUTPUT_LANGUAGES.map(item => <option key={item.code} value={item.code}>{item.name}</option>)}</select></label></div>
    <p className="my-3 text-sm text-muted-foreground">Recognized signs translate automatically when online translation is on. Built-in phrases work locally; owner-reviewed translations are optional overrides.</p>
    {liveText && <div aria-live="polite" className="mb-4 rounded-2xl border border-primary/20 bg-primary/5 p-4"><p className="text-xs font-semibold uppercase tracking-wider text-primary">Latest message</p><p className="mt-1 text-sm text-muted-foreground">{liveText}</p><p className="mt-2 text-2xl font-semibold">{translatePhrase(liveText, language).text}</p>{!translatePhrase(liveText, language).translated && <p className="mt-1 text-xs text-muted-foreground">Original text shown here. Automatic translation appears in the translated-message panel.</p>}</div>}
    <div className="flex flex-wrap gap-2">{[...new Set([...favorites, ...PHRASE_KEYS])].map(phrase => <button key={phrase} onClick={() => setSelected(phrase)} className={`rounded-full border px-4 py-2 text-sm ${selected === phrase ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-background'}`}>{phrase}</button>)}</div>
    <div role={large ? 'dialog' : undefined} aria-modal={large || undefined} aria-label="Conversation card" className={large ? 'fixed inset-0 z-50 flex flex-col items-center justify-center gap-6 bg-background p-8' : 'mt-5 rounded-2xl bg-muted/50 p-6'}>
      <div style={{ transform: rotated ? 'rotate(180deg)' : undefined }} className="text-center"><p className="text-sm text-muted-foreground">{selected}</p><p className="mt-3 font-display text-4xl font-bold sm:text-5xl">{translated.text}</p></div>
      <div className="mt-5 flex flex-wrap justify-center gap-3"><button className="btn-primary" onClick={speak}>Speak / replay</button><button onClick={() => setLarge(!large)}>{large ? 'Close large card' : 'Show large card'}</button><button onClick={() => setRotated(!rotated)}>Rotate for partner</button><button onClick={() => { const next = favorites.includes(selected) ? favorites.filter(item => item !== selected) : [...favorites, selected]; setFavorites(next); accountStorage.setItem('signbridge-favorite-phrases', JSON.stringify(next)) }}>{favorites.includes(selected) ? '★ Saved' : '☆ Save favourite'}</button></div>
    </div>
    <p role="status" className="mt-3 text-sm text-muted-foreground">{notice || (supported ? 'A matching device voice is available.' : 'Common phrases use local audio. Custom text needs a matching device voice.')}</p>
    <label className="mt-5 block text-sm font-semibold">Search published vocabulary<input className="mt-2 block w-full rounded-xl border border-border bg-background p-3" placeholder="Find a sign this model supports…" value={query} onChange={event => setQuery(event.target.value)} /></label>
    <div className="mt-3 flex flex-wrap gap-2">{vocabulary.filter(label => label.toLowerCase().includes(query.toLowerCase())).map(label => <button className="rounded-lg bg-muted px-3 py-2 text-sm" key={label} onClick={() => setSelected(label)}>{label}</button>)}</div>{!vocabulary.length && <p className="mt-2 text-sm text-muted-foreground">Publish owner vocabulary to populate this list.</p>}
    <SentenceTranslator latest={liveText} />
  </div></details>
}
