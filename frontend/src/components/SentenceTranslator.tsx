import { useEffect, useRef, useState } from 'react'
import { api } from '../lib/api'
import { OUTPUT_LANGUAGES } from '../lib/languages'
import { speakText } from '../lib/speech'

export default function SentenceTranslator({ latest = '' }: { latest?: string }) {
  const [text, setText] = useState('')
  const [source, setSource] = useState('en-IN')
  const [target, setTarget] = useState('kn-IN')
  const [result, setResult] = useState('')
  const [resultLanguage, setResultLanguage] = useState('kn-IN')
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState('')
  const byteCount = new TextEncoder().encode(text.trim()).length
  const request = useRef<AbortController | null>(null)
  useEffect(() => () => request.current?.abort(), [])
  return <details className="my-5 rounded-2xl border border-border bg-card p-5"><summary className="cursor-pointer font-display text-lg font-bold">Translate a complete message</summary><p className="my-3 text-sm text-muted-foreground">Pressing Translate sends this message to MyMemory, an external machine-translation provider. Its service limits and language quality vary. Review the result before using it.</p>
    <div className="flex flex-wrap gap-4">{([{ label: 'From', value: source, change: setSource }, { label: 'To', value: target, change: setTarget }]).map(item => <label key={item.label} className="text-sm">{item.label}<select className="ml-2 rounded-lg border border-border bg-background p-2" value={item.value} onChange={event => item.change(event.target.value)}>{OUTPUT_LANGUAGES.map(language => <option key={language.code} value={language.code}>{language.name}</option>)}</select></label>)}</div>
    <button className="mt-3 text-sm font-semibold text-primary" disabled={busy} onClick={() => { setSource(target); setTarget(source); if (result) { setText(result); setResult('') } }}>Swap languages</button>
    <textarea aria-label="Message to translate" className="my-3 block w-full rounded-xl border border-border bg-background p-3" value={text} maxLength={500} onChange={event => setText(event.target.value)} placeholder="Type or paste a complete message…" />
    <p className={`mb-3 text-sm ${byteCount > 500 ? 'text-red-600' : 'text-muted-foreground'}`}>{byteCount}/500 bytes · Indic scripts can use several bytes per character</p>
    {busy && <button className="mb-3 text-sm underline" onClick={() => { request.current?.abort(); setBusy(false); setNotice('Translation cancelled.') }}>Cancel translation</button>}
    <div className="flex flex-wrap gap-4"><button disabled={!latest || busy} onClick={() => setText(latest)} className="disabled:opacity-50">Use latest conversation message</button><button disabled={!text.trim() || byteCount > 500 || busy} className="rounded-xl bg-primary px-4 py-2 font-semibold text-primary-foreground disabled:opacity-50" onClick={async () => { request.current?.abort(); const controller = new AbortController(); request.current = controller; setBusy(true); setNotice(''); setResult(''); try { const response = await api.translate(text, source.split('-')[0], target.split('-')[0], controller.signal); if (!controller.signal.aborted) { setResult(response.text); setResultLanguage(target) } } catch (error) { if (!controller.signal.aborted) setNotice(error instanceof Error ? error.message : 'Translation failed.') } finally { if (!controller.signal.aborted) setBusy(false) } }}>{busy ? 'Translating…' : 'Translate online'}</button></div>
    {result && <div className="mt-4 rounded-xl bg-muted/50 p-4"><label className="text-sm">Review or correct translation<textarea className="my-2 block w-full rounded-lg border border-border bg-background p-3 text-lg" value={result} onChange={event => setResult(event.target.value)} /></label><button onClick={() => speakText(result, resultLanguage, 1, { translate: false, onError: setNotice })}>Speak reviewed translation</button><button className="ml-4" onClick={async () => { try { await navigator.clipboard.writeText(result); setNotice('Translation copied.') } catch { setNotice('Copy is unavailable. Select the translated text and copy it manually.') } }}>Copy translation</button></div>}<p role="status" className="mt-3 text-sm">{notice}</p>
  </details>
}
