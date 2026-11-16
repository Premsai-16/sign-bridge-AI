import { useEffect, useMemo, useRef, useState } from 'react'
import { AlertTriangle, Camera, Check, Copy, LoaderCircle, Save, ShieldCheck, Square, Trash2, Volume2 } from 'lucide-react'
import { useCamera } from '../hooks/useCamera'
import { useMediaPipe } from '../hooks/useMediaPipe'
import { clearSignExamples, deleteSignExamples, exampleCounts, loadSignExamples, MIN_EXAMPLES_PER_SIGN, predictPersonalSign, saveSignExample, type SignExample } from '../lib/personalized-signs'
import { saveSession } from '../lib/sessions'
import { loadIsolatedSignModel, predictIsolatedSign, type IsolatedSignModel, type SignPrediction } from '../lib/isl-model'
import { speakText } from '../lib/speech'

function averageVectors(vectors: number[][]): number[] {
  return Array.from({ length: 126 }, (_, index) => vectors.reduce((sum, vector) => sum + vector[index], 0) / vectors.length)
}

export default function LiveTranslate() {
  const { isActive: cameraActive, isLoading: cameraLoading, error: cameraError, start: startCamera, stop: stopCamera, videoRef } = useCamera()
  const detector = useMediaPipe(videoRef, cameraActive)
  const [examples, setExamples] = useState<SignExample[]>(loadSignExamples)
  const [label, setLabel] = useState('')
  const [consent, setConsent] = useState(false)
  const [recording, setRecording] = useState(false)
  const [statusMessage, setStatusMessage] = useState('')
  const [transcript, setTranscript] = useState<string[]>([])
  const [speechEnabled, setSpeechEnabled] = useState(() => localStorage.getItem('signbridge-auto-speak') !== 'false')
  const [speechStatus, setSpeechStatus] = useState('Speech is ready when enabled.')
  const [recognitionMode, setRecognitionMode] = useState<'published' | 'personal'>(() => loadSignExamples().length ? 'personal' : 'published')
  const [islModel, setIslModel] = useState<IsolatedSignModel | null>(null)
  const [modelError, setModelError] = useState<string | null>(null)
  const [publishedPrediction, setPublishedPrediction] = useState<SignPrediction | null>(null)
  const recentPredictionsRef = useRef<Array<SignPrediction | null>>([])
  const captureFramesRef = useRef<number[][]>([])
  const lastLabelRef = useRef<string | null>(null)
  const stableCountRef = useRef(0)
  const emittedLabelRef = useRef<string | null>(null)
  const counts = useMemo(() => exampleCounts(examples), [examples])
  const eligibleLabels = Object.entries(counts).filter(([, count]) => count >= MIN_EXAMPLES_PER_SIGN)
  const modelReady = eligibleLabels.length >= 1
  const labelKey = label.normalize('NFKC').trim().replace(/\s+/g, ' ').toLocaleLowerCase()
  const samplesForCurrentLabel = counts[labelKey] || 0
  const trainingHint = modelReady
    ? labelKey && samplesForCurrentLabel >= MIN_EXAMPLES_PER_SIGN
      ? `“${label.trim()}” is trained. Your model recognizes ${eligibleLabels.map(([name]) => name).join(', ')}.`
      : `Your model recognizes ${eligibleLabels.map(([name]) => name).join(', ')}. Add another label to expand it.`
    : samplesForCurrentLabel >= MIN_EXAMPLES_PER_SIGN
      ? 'This sign has enough examples. It will be recognized when you choose My vocabulary.'
      : 'Capture five examples for this label. One completed label is enough to start recognition.'
  const personalPrediction = useMemo(() => cameraActive && modelReady && detector.hands > 0
    ? predictPersonalSign(examples, detector.features)
    : null, [cameraActive, detector.features, detector.hands, examples, modelReady])
  const framePrediction = useMemo(() => cameraActive && detector.hands > 0 && islModel
    ? predictIsolatedSign(islModel, detector.modelFeatures)
    : null, [cameraActive, detector.hands, detector.modelFeatures, islModel])
  const prediction = recognitionMode === 'personal' ? personalPrediction : publishedPrediction
  const currentSign = prediction?.label || null
  const confidence = prediction?.confidence || 0

  useEffect(() => {
    let active = true
    void loadIsolatedSignModel().then(setIslModel).catch(error => {
      if (active) setModelError(error instanceof Error ? error.message : 'The bundled ISL sign model could not be loaded.')
    })
    return () => { active = false }
  }, [])

  useEffect(() => {
    if (recognitionMode !== 'published') return
    recentPredictionsRef.current = [...recentPredictionsRef.current, framePrediction].slice(-5)
    const votes = new Map<string, SignPrediction[]>()
    recentPredictionsRef.current.forEach(item => {
      if (item) votes.set(item.label, [...(votes.get(item.label) || []), item])
    })
    const winner = [...votes.values()].sort((a, b) => b.length - a.length)[0]
    const nextPrediction = winner?.length >= 3
      ? { label: winner[0].label, confidence: winner.reduce((sum, item) => sum + item.confidence, 0) / winner.length, margin: winner.reduce((sum, item) => sum + item.margin, 0) / winner.length }
      : null
    const frame = window.requestAnimationFrame(() => setPublishedPrediction(nextPrediction))
    return () => window.cancelAnimationFrame(frame)
  }, [framePrediction, recognitionMode])

  useEffect(() => {
    stableCountRef.current = 0
    lastLabelRef.current = null
    emittedLabelRef.current = null
  }, [recognitionMode])

  useEffect(() => {
    if (!recording || detector.hands === 0 || detector.features.length !== 126) return
    captureFramesRef.current.push(detector.features)
  }, [recording, detector.features, detector.hands])

  useEffect(() => {
    if (!recording) return
    const timer = window.setTimeout(() => {
      setRecording(false)
      const frames = captureFramesRef.current
      captureFramesRef.current = []
      if (frames.length < 5) {
        setStatusMessage('Could not capture enough clear hand frames. Keep your hand visible and try again.')
        return
      }
      try {
        const next = saveSignExample(label, averageVectors(frames))
        setExamples(next)
        const nextCounts = exampleCounts(next)
        const trainedLabels = Object.values(nextCounts).filter(count => count >= MIN_EXAMPLES_PER_SIGN).length
        if (trainedLabels >= 1) {
          setRecognitionMode('personal')
          setStatusMessage(`Personal vocabulary ready with ${trainedLabels} trained sign${trainedLabels === 1 ? '' : 's'}. Switched to My vocabulary.`)
        } else {
          const savedForLabel = nextCounts[label.normalize('NFKC').trim().replace(/\s+/g, ' ').toLocaleLowerCase()] || 0
          setStatusMessage(`Sample ${savedForLabel}/${MIN_EXAMPLES_PER_SIGN} saved for “${label.trim()}”. Add ${MIN_EXAMPLES_PER_SIGN - Math.min(savedForLabel, MIN_EXAMPLES_PER_SIGN)} more to train this sign.`)
        }
      } catch (error) {
        setStatusMessage(error instanceof Error ? error.message : 'Could not save the sample. Try again.')
      }
    }, 1800)
    return () => window.clearTimeout(timer)
  }, [recording, label])

  useEffect(() => {
    if (!prediction) {
      stableCountRef.current = 0
      lastLabelRef.current = null
      if (detector.hands === 0) emittedLabelRef.current = null
      return
    }
    if (lastLabelRef.current === prediction.label) stableCountRef.current += 1
    else { lastLabelRef.current = prediction.label; stableCountRef.current = 1 }
    if (stableCountRef.current >= 4 && emittedLabelRef.current !== prediction.label) {
      emittedLabelRef.current = prediction.label
      setTranscript(current => [...current, prediction.label])
      if (speechEnabled) {
        const started = speakText(prediction.label, localStorage.getItem('signbridge-voice') || 'en-IN', Number(localStorage.getItem('signbridge-speech-rate') || '1'), {
          onStart: () => setSpeechStatus(`Speaking “${prediction.label}”.`),
          onEnd: () => setSpeechStatus('Speech finished.'),
          onError: message => setSpeechStatus(message),
        })
        if (!started) window.setTimeout(() => setSpeechStatus('Speech output is unavailable in this browser; recognized text is still shown.'), 0)
      }
    }
  }, [detector.hands, prediction, speechEnabled])

  const handleCapture = () => {
    if (!consent) { setStatusMessage('Confirm consent before storing any landmark examples.'); return }
    if (!label.trim()) { setStatusMessage('Enter the word you want to associate with this sign.'); return }
    if (!cameraActive) { setStatusMessage('Open the camera before recording a sample.'); return }
    if (!detector.ready) { setStatusMessage(detector.error || 'Hand detector is still loading.'); return }
    if (detector.hands === 0) { setStatusMessage('No hand is visible yet. Center one hand in the camera frame and try again.'); return }
    captureFramesRef.current = []
    setStatusMessage('Hold the sign steady in view for a moment…')
    setRecording(true)
  }

  const handleStopCamera = () => {
    if (recording) {
      setRecording(false)
      captureFramesRef.current = []
      setStatusMessage('Capture cancelled. No sample was saved.')
    }
    stopCamera()
  }

  const handleConsentChange = (checked: boolean) => {
    setConsent(checked)
    if (!checked && recording) {
      setRecording(false)
      captureFramesRef.current = []
      setStatusMessage('Capture cancelled because consent was turned off.')
    }
  }

  const speakTranscript = () => {
    if (!transcript.length) return
    const started = speakText(transcript.join(' '), localStorage.getItem('signbridge-voice') || 'en-IN', Number(localStorage.getItem('signbridge-speech-rate') || '1'), {
      onStart: () => setSpeechStatus('Speaking transcript.'),
      onEnd: () => setSpeechStatus('Speech finished.'),
      onError: message => setSpeechStatus(message),
    })
    if (!started) setSpeechStatus('Speech output is unavailable in this browser.')
  }

  const resetPersonalModel = () => {
    if (!window.confirm('Delete all personalized sign examples saved in this browser?')) return
    clearSignExamples()
    setExamples([])
    setTranscript([])
    setStatusMessage('Personalized examples deleted from this browser.')
  }

  const deleteOneSign = (sign: string) => {
    if (!window.confirm(`Delete all saved examples for “${sign}”? Other trained signs will be kept.`)) return
    try {
      const next = deleteSignExamples(sign)
      setExamples(next)
      setLabel(sign)
      setStatusMessage(`Deleted “${sign}”. You can retrain it by capturing five new examples.`)
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : `Could not delete “${sign}”. Try again.`)
    }
  }

  const changeRecognitionMode = (mode: 'published' | 'personal') => {
    setRecognitionMode(mode)
    recentPredictionsRef.current = []
    setPublishedPrediction(null)
    setStatusMessage(mode === 'published' ? 'Using the bundled 11 sign isolated vocabulary.' : 'Using only the personal labels you enrolled.')
  }

  const toggleSpeech = (enabled: boolean) => {
    setSpeechEnabled(enabled)
    localStorage.setItem('signbridge-auto-speak', String(enabled))
    if (!enabled) { window.speechSynthesis?.cancel(); setSpeechStatus('Automatic speech is off.') }
    else setSpeechStatus('Automatic speech is on. Use Test voice if playback is blocked.')
  }

  const testSpeech = () => {
    const started = speakText('Voice output is working.', localStorage.getItem('signbridge-voice') || 'en-IN', Number(localStorage.getItem('signbridge-speech-rate') || '1'), {
      onStart: () => setSpeechStatus('Voice test is playing.'),
      onEnd: () => setSpeechStatus('Voice test finished.'),
      onError: message => setSpeechStatus(message),
    })
    if (!started) setSpeechStatus('Speech output is unavailable in this browser.')
  }

  return (
    <div className="container max-w-7xl py-10">
      <div className="mb-8 flex flex-col gap-3">
        <span className="text-sm font-semibold uppercase tracking-[0.16em] text-primary">Personalized sign workspace</span>
        <h1 className="font-display text-4xl font-bold tracking-tight">Live sign recognition</h1>
        <p className="max-w-3xl text-muted-foreground">Recognize an experimental 11 sign ISL vocabulary or teach personal held signs. A personal sign starts matching after five saved examples. Detection and recognition run in your browser; video and landmarks are not uploaded.</p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <section className="space-y-4">
          <div className="relative aspect-video overflow-hidden rounded-3xl border border-border bg-slate-950 shadow-sm">
            <video ref={videoRef} className={`absolute inset-0 h-full w-full object-cover ${cameraActive ? 'block' : 'hidden'}`} playsInline muted autoPlay />
            {!cameraActive && <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center text-white"><div className="mb-4 rounded-2xl bg-white/10 p-4"><Camera className="h-8 w-8" /></div><h2 className="font-display text-xl font-semibold">Camera preview</h2><p className="mt-2 max-w-sm text-sm text-white/70">Allow camera access to recognize supported signs or teach your personal vocabulary.</p><button onClick={() => void startCamera()} className="mt-5 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-slate-900">Open camera</button></div>}
            {cameraActive && <div className="absolute left-4 top-4 flex items-center gap-2 rounded-full bg-black/70 px-3 py-2 text-xs font-medium text-white"><span className="h-2 w-2 rounded-full bg-emerald-400" />Camera on · {detector.hands} hand{detector.hands === 1 ? '' : 's'}</div>}
            {cameraActive && detector.ready && detector.hands === 0 && <div className="absolute inset-x-4 bottom-4 rounded-xl bg-black/75 px-4 py-3 text-center text-sm text-white">Move one hand into the frame. Keep it visible and well lit.</div>}
            {cameraActive && detector.hands > 0 && !currentSign && <div className="absolute inset-x-4 bottom-4 rounded-xl bg-black/75 px-4 py-3 text-center text-sm text-white">{recognitionMode === 'personal' && modelReady ? 'No close match yet · hold the trained sign steady or add a few more examples.' : recognitionMode === 'personal' ? 'Hand detected · hold this sign steady while capturing examples.' : 'Hand detected · hold a supported sign steady.'}</div>}
            {currentSign && <div className="absolute bottom-4 left-4 rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-white backdrop-blur"><p className="font-display text-2xl font-semibold">{currentSign}</p><p className="mt-1 text-xs text-white/70">{recognitionMode === 'published' ? 'Experimental 11 sign model' : 'Personalized match'} · model score {Math.round(confidence * 100)}%</p></div>}
            {cameraLoading && <div className="absolute inset-0 flex items-center justify-center bg-black/60 text-white"><LoaderCircle className="mr-2 h-5 w-5 animate-spin" />Starting camera…</div>}
            {cameraError && <div className="absolute inset-0 flex items-center justify-center bg-black/80 p-6 text-center text-white"><div><AlertTriangle className="mx-auto mb-3 h-7 w-7 text-amber-400" /><p>{cameraError}</p><button onClick={() => void startCamera()} className="mt-4 rounded-lg border border-white/30 px-4 py-2">Try again</button></div></div>}
          </div>
          <div className="flex gap-3">{cameraActive ? <button onClick={handleStopCamera} className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-border px-4 py-3 text-sm font-semibold hover:bg-muted"><Square className="h-4 w-4" />Stop camera</button> : <button onClick={() => void startCamera()} className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground"><Camera className="h-4 w-4" />Open camera</button>}{cameraActive && <span className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-3 text-sm text-muted-foreground">{detector.ready ? <><Check className="h-4 w-4 text-success" />Detector ready</> : <><LoaderCircle className="h-4 w-4 animate-spin" />Loading detector</>}</span>}</div>

          <div className="rounded-2xl border border-border bg-card p-6">
            <div className="mb-4 flex items-center justify-between gap-3"><div><h2 className="font-display text-xl font-semibold">Session transcript</h2><p className="mt-1 text-sm text-muted-foreground">Recognized labels from the selected vocabulary</p></div><span className="rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">{transcript.length} signs</span></div>
            <div className="min-h-28 rounded-xl bg-muted/50 p-4 text-sm leading-7">{transcript.length ? transcript.join(' ') : <span className="text-muted-foreground">Your recognized signs will appear here.</span>}</div>
            <div className="mt-4 flex flex-wrap gap-2"><button onClick={speakTranscript} disabled={!transcript.length} className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm hover:bg-muted disabled:opacity-40"><Volume2 className="h-4 w-4" />Speak</button><button onClick={() => { void navigator.clipboard?.writeText(transcript.join(' ')).then(() => setStatusMessage('Transcript copied.')).catch(() => setStatusMessage('Clipboard access is unavailable in this browser.')) }} disabled={!transcript.length} className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm hover:bg-muted disabled:opacity-40"><Copy className="h-4 w-4" />Copy</button><button onClick={() => { if (transcript.length) { saveSession(transcript.join(' ')); setStatusMessage('Transcript saved to local history.') } }} disabled={!transcript.length} className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm hover:bg-muted disabled:opacity-40"><Save className="h-4 w-4" />Save</button><button onClick={() => { setTranscript([]); emittedLabelRef.current = null }} disabled={!transcript.length} className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-muted disabled:opacity-40"><Trash2 className="h-4 w-4" />Clear</button></div>
          </div>
        </section>

        <aside className="space-y-5">
          <section className="rounded-2xl border border-border bg-card p-6">
            <div className="mb-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-primary">Recognition source</p>
              <div className="mt-3 grid grid-cols-2 gap-2 rounded-xl bg-muted p-1">
                <button type="button" onClick={() => changeRecognitionMode('published')} aria-pressed={recognitionMode === 'published'} className={`rounded-lg px-3 py-2 text-sm font-medium ${recognitionMode === 'published' ? 'bg-card shadow-sm' : 'text-muted-foreground'}`}>11 sign model</button>
                <button type="button" onClick={() => changeRecognitionMode('personal')} aria-pressed={recognitionMode === 'personal'} className={`rounded-lg px-3 py-2 text-sm font-medium ${recognitionMode === 'personal' ? 'bg-card shadow-sm' : 'text-muted-foreground'}`}>My vocabulary</button>
              </div>
              {recognitionMode === 'published' && <p className="mt-3 text-xs leading-5 text-muted-foreground">Supported labels: cellphone, good, hello, house, I, loud, quiet, red, shoes, teacher, time. Unknown signs should be rejected, but results still need signer testing.</p>}
              {recognitionMode === 'published' && modelError && <p role="alert" className="mt-3 text-xs text-destructive">{modelError}</p>}
              {recognitionMode === 'published' && !modelError && <p className="mt-3 text-xs text-muted-foreground">{islModel ? 'On-device model ready.' : 'Loading bundled sign model…'}</p>}
              <label className="mt-4 flex items-center gap-3 text-sm"><input type="checkbox" checked={speechEnabled} onChange={event => toggleSpeech(event.target.checked)} className="h-4 w-4 accent-indigo-600" /><Volume2 className="h-4 w-4 text-primary" /><span>Speak each recognized sign aloud</span></label>
              <div className="mt-3 flex items-center gap-3"><button type="button" onClick={testSpeech} className="rounded-lg border border-border px-3 py-2 text-xs font-semibold hover:bg-muted">Test voice</button><p role="status" aria-live="polite" className="text-xs text-muted-foreground">{speechStatus}</p></div>
            </div>
          </section>

          <section className="rounded-2xl border border-border bg-card p-6">
            <div className="mb-4 flex items-start justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-wider text-primary">On-device enrollment</p><h2 className="mt-1 font-display text-xl font-semibold">Teach a sign</h2></div><ShieldCheck className="h-6 w-6 text-primary" /></div>
            <p className="text-sm leading-6 text-muted-foreground">Teach one sign at a time. Enter its label, hold the sign in frame, and press Capture example five times. Each recording takes about two seconds. The app starts recognizing that sign once the fifth sample is saved; additional labels are optional.</p>
            <label htmlFor="sign-label" className="mb-2 mt-5 block text-sm font-medium">Label for this sign</label>
            <input id="sign-label" value={label} disabled={recording} onChange={event => setLabel(event.target.value.slice(0, 40))} placeholder="Example: hello" maxLength={40} className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary disabled:opacity-60" />
            <div className="mt-3 rounded-xl bg-muted/60 p-3"><div className="flex items-center justify-between gap-3 text-xs"><span>{label.trim() ? `Examples for “${label.trim()}”` : 'Examples for this sign'}</span><span className="font-semibold">{Math.min(samplesForCurrentLabel, MIN_EXAMPLES_PER_SIGN)}/{MIN_EXAMPLES_PER_SIGN}</span></div><div className="mt-2 h-1.5 overflow-hidden rounded-full bg-background"><div className="h-full rounded-full bg-primary transition-all" style={{ width: `${Math.min(100, samplesForCurrentLabel / MIN_EXAMPLES_PER_SIGN * 100)}%` }} /></div><p className="mt-2 text-xs font-medium text-foreground">{trainingHint}</p><p className="mt-1 text-xs text-muted-foreground">{modelReady ? `${eligibleLabels.length} sign${eligibleLabels.length === 1 ? '' : 's'} ready.` : 'Five recordings are needed before matching starts.'}</p></div>
            <label className="mt-4 flex cursor-pointer items-start gap-3 rounded-xl border border-border p-3 text-sm"><input type="checkbox" checked={consent} onChange={event => handleConsentChange(event.target.checked)} className="mt-0.5 h-4 w-4 accent-indigo-600" /><span>I consent to saving derived hand landmarks in this browser for personal recognition. Camera video is never saved.</span></label>
            <button onClick={handleCapture} disabled={recording} className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50">{recording ? <><LoaderCircle className="h-4 w-4 animate-spin" />Capturing · hold still…</> : <><Camera className="h-4 w-4" />Capture example</>}</button>
            <p className="mt-3 min-h-5 text-xs text-muted-foreground">{!cameraActive ? 'Open the camera to begin training.' : detector.error || (!detector.ready ? 'Loading local hand detection model…' : detector.hands === 0 ? 'Show one hand in the camera preview before capturing.' : !consent ? 'Turn on consent to save a sample on this device.' : !label.trim() ? 'Enter a word label before capturing.' : 'Ready to capture this sign.')}</p>
            {statusMessage && <p role="status" aria-live="polite" className="mt-2 rounded-lg bg-primary/5 px-3 py-2 text-xs text-foreground">{statusMessage}</p>}
          </section>

          <section className="rounded-2xl border border-border bg-card p-6">
            <div className="flex items-center justify-between gap-3"><div><h2 className="font-display text-lg font-semibold">Your vocabulary</h2><p className="mt-1 text-sm text-muted-foreground">{eligibleLabels.length} trained label{eligibleLabels.length === 1 ? '' : 's'} · {examples.length} saved examples</p></div><button onClick={resetPersonalModel} disabled={!examples.length} className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-border px-3 py-2 text-xs font-semibold text-muted-foreground hover:border-destructive/30 hover:bg-destructive/10 hover:text-destructive disabled:opacity-40" aria-label="Delete all personal sign data" title="Delete all personal sign data"><Trash2 className="h-3.5 w-3.5" />Clear all</button></div>
            {Object.keys(counts).length ? <ul className="mt-4 space-y-3">{Object.entries(counts).map(([name, count]) => <li key={name} className="flex items-center justify-between gap-3 rounded-xl bg-muted/50 px-3 py-2.5 text-sm"><div className="min-w-0"><span className="font-medium">{name}</span><p className={count >= MIN_EXAMPLES_PER_SIGN ? 'mt-0.5 text-xs text-success' : 'mt-0.5 text-xs text-muted-foreground'}>{count}/{MIN_EXAMPLES_PER_SIGN} examples{count >= MIN_EXAMPLES_PER_SIGN ? ' · ready' : ' · needs more'}</p></div><button type="button" onClick={() => deleteOneSign(name)} aria-label={`Delete trained sign ${name}`} title={`Delete ${name} and retrain it`} className="shrink-0 rounded-lg border border-border p-2 text-muted-foreground transition hover:border-destructive/30 hover:bg-destructive/10 hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"><Trash2 className="h-4 w-4" /></button></li>)}</ul> : <p className="mt-4 rounded-xl bg-muted/50 p-4 text-sm text-muted-foreground">No personal signs saved yet.</p>}
            <p className="mt-4 text-xs leading-5 text-muted-foreground">This classifier recognizes only the labels you teach. It does not understand ISL grammar, moving signs, facial expression, or conversation context.</p>
          </section>
        </aside>
      </div>
    </div>
  )
}
