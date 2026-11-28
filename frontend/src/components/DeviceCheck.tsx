import { useEffect, useState } from 'react'
import { useCamera } from '../hooks/useCamera'
import { OUTPUT_LANGUAGES, translatePhrase } from '../lib/languages'
import { speakText, stopSpeech } from '../lib/speech'

export default function DeviceCheck() {
  const { videoRef, isActive, isLoading, error, start, stop } = useCamera()
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([])
  const [language, setLanguage] = useState('en-IN')
  const [notice, setNotice] = useState('')
  const [server, setServer] = useState('Not checked')
  const [checking, setChecking] = useState(false)
  const [cameraInfo, setCameraInfo] = useState('No preview yet')
  const [audioConfirmed, setAudioConfirmed] = useState(false)
  useEffect(() => {
    const update = () => setVoices(window.speechSynthesis?.getVoices() || [])
    update()
    window.speechSynthesis?.addEventListener('voiceschanged', update)
    return () => window.speechSynthesis?.removeEventListener('voiceschanged', update)
  }, [])
  const hasRecognition = 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window
  const matchingVoices = voices.filter(voice => voice.lang.replaceAll('_','-').split('-')[0] === language.split('-')[0])
  async function checkServer() {
    setChecking(true)
    const controller = new AbortController()
    const timer = window.setTimeout(() => controller.abort(), 5000)
    const started = performance.now()
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || ''}/health`, { signal: controller.signal, cache: 'no-store' })
      const data = await response.json()
      if (!response.ok || data.status !== 'healthy') throw new Error('unhealthy')
      setServer(`Reachable · ${Math.round(performance.now()-started)} ms round trip`)
    } catch { setServer('Not reachable. Check your connection and API server.') }
    finally { clearTimeout(timer); setChecking(false) }
  }
  return <section className="mt-6 rounded-3xl border border-border bg-card p-5 sm:p-7" aria-labelledby="device-check-title">
    <p className="eyebrow">Before your first conversation</p><h2 id="device-check-title" className="mt-2 text-2xl font-bold">Check this device</h2>
    <p className="mt-2 text-sm text-muted-foreground">Run this on each phone or computer. Available browser features do not guarantee recognition accuracy or that audio is audible. Nothing is recorded by this panel.</p>
    <div className="mt-5 grid gap-5 lg:grid-cols-2">
      <div className="rounded-2xl border border-border p-4"><h3 className="font-semibold">Camera preview</h3>
        <p className="my-2 text-sm">{window.isSecureContext ? 'Secure camera context available' : 'Camera needs HTTPS or localhost'}</p>
        <div className="relative aspect-[3/4] max-h-96 overflow-hidden rounded-xl bg-slate-950"><video ref={videoRef} playsInline muted autoPlay className="h-full w-full object-contain" onLoadedMetadata={event => setCameraInfo(`${event.currentTarget.videoWidth} × ${event.currentTarget.videoHeight} preview received`)}/>{!isActive && <p className="absolute inset-0 grid place-items-center text-sm text-white">Camera is off</p>}</div>
        <div className="mt-3 flex flex-wrap gap-2"><button className="action-primary" disabled={isLoading} onClick={() => isActive ? stop() : void start()}>{isLoading ? 'Opening…' : isActive ? 'Stop camera' : 'Test camera'}</button>{isActive && <button className="action-secondary" onClick={() => void start('environment')}>Test rear camera</button>}</div>
        <p role="status" className="mt-2 text-sm">{error || (isActive ? cameraInfo : 'Camera stopped')}</p>
      </div>
      <div className="space-y-4"><div className="rounded-2xl border border-border p-4"><h3 className="font-semibold">Audio and language voices</h3>
        <label className="mt-3 block text-sm">Test language<select className="mt-2 w-full rounded-xl border border-border bg-background p-3" value={language} onChange={event => { stopSpeech(); setLanguage(event.target.value); setAudioConfirmed(false); setNotice('') }}>{OUTPUT_LANGUAGES.map(item => <option key={item.code} value={item.code}>{item.name}</option>)}</select></label>
        <p className="mt-3 text-sm">{matchingVoices.length ? `${matchingVoices.length} device voice(s) available for custom words and names.` : 'No matching device voice detected. The built-in greeting recording can still be tested.'}</p>
        <div className="mt-3 flex flex-wrap gap-2"><button className="action-primary" onClick={() => { setAudioConfirmed(false); speakText(translatePhrase('hello',language).text,language,1,{translate:false,onStart:()=>setNotice('Playback started. Confirm below only if you hear it.'),onError:setNotice}) }}>Play greeting</button><button className="action-secondary" onClick={stopSpeech}>Stop audio</button></div>
        <label className="mt-3 flex min-h-11 items-center gap-3 text-sm"><input type="checkbox" checked={audioConfirmed} onChange={event => setAudioConfirmed(event.target.checked)}/>I heard the greeting on this device</label><p role="status" className="text-sm text-muted-foreground">{notice}</p>
      </div><div className="rounded-2xl border border-border p-4"><h3 className="font-semibold">Speech input and server</h3><p className="mt-2 text-sm">{hasRecognition ? 'Speech-input API detected. Test an actual spoken reply in Text & Speech.' : 'Speech-input API unavailable. Typed replies remain available.'}</p><button className="action-secondary mt-3" disabled={checking} onClick={() => void checkServer()}>{checking ? 'Checking…' : 'Check API connection'}</button><p role="status" className="mt-2 text-sm">{server}</p></div></div>
    </div>
  </section>
}
