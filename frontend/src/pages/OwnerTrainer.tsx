import { sampleTrainingFrames } from '../lib/training-frames'
import { Navigate } from 'react-router-dom'
import { signOut } from '../lib/account'
import BridgeMark from '../components/BridgeMark'
import OwnerQualityTools from '../components/OwnerQualityTools'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Camera, CheckCircle2, Circle, LogOut, LoaderCircle, Trash2, Video } from 'lucide-react'
import { useCamera } from '../hooks/useCamera'
import { useMediaPipe } from '../hooks/useMediaPipe'
import { ownerApi, type ModelVersion, type OwnerExample } from '../lib/api'

const TOKEN_KEY = 'signbridge-owner-session'

interface LabelStats { train: number; validation: number; trainSigners: Set<string>; validationSigners: Set<string> }

export default function OwnerTrainer() {
  const [token, setToken] = useState(() => sessionStorage.getItem(TOKEN_KEY) || '')
  const [examples, setExamples] = useState<OwnerExample[]>([])
  const [label, setLabel] = useState('')
  const [participantCode, setParticipantCode] = useState('')
  const [datasetSplit, setDatasetSplit] = useState<'train' | 'validation'>('train')
  const [consent, setConsent] = useState(false)
  const [notice, setNotice] = useState('')
  const [working, setWorking] = useState(false)
  const [publishedVersion, setPublishedVersion] = useState('')
  const [versions, setVersions] = useState<ModelVersion[]>([])
  const [captureStage, setCaptureStage] = useState<'idle' | 'countdown' | 'recording' | 'uploading'>('idle')
  const [captureCountdown, setCaptureCountdown] = useState(1)
  const [samplePreviewUrl, setSamplePreviewUrl] = useState('')
  const [savedVideoUrls, setSavedVideoUrls] = useState<Record<number, string>>({})
  const [recordedFrameCount, setRecordedFrameCount] = useState(0)
  const pendingUploadRef = useRef<Parameters<typeof ownerApi.addExample> | null>(null)
  const [hasPendingUpload, setHasPendingUpload] = useState(false)
  const captureFramesRef = useRef<number[][]>([])
  const videoChunksRef = useRef<BlobPart[]>([])
  const recorderRef = useRef<MediaRecorder | null>(null)
  const countdownTimerRef = useRef<number | null>(null)
  const recordingTimerRef = useRef<number | null>(null)
  const { isActive, isLoading, error, start, stop, videoRef } = useCamera()
  const detector = useMediaPipe(videoRef, isActive)
  const stats = useMemo(() => {
    const result: Record<string, LabelStats> = {}
    for (const example of examples) {
      const key = example.label.trim().toLocaleLowerCase()
      result[key] ||= { train: 0, validation: 0, trainSigners: new Set(), validationSigners: new Set() }
      if (!example.consented) continue
      result[key][example.dataset_split] += 1
      result[key][example.dataset_split === 'train' ? 'trainSigners' : 'validationSigners'].add(example.participant_code)
    }
    return result
  }, [examples])
  const labels = Object.keys(stats).sort()

  useEffect(() => {
    if (!token) return
    let active = true
    void Promise.all([ownerApi.examples(token), ownerApi.model(), ownerApi.versions(token)]).then(([list, model, history]) => {
      if (!active) return
      setExamples(list)
      setPublishedVersion(model.published ? model.version || 'Published' : '')
      setVersions(history)
    }).catch(cause => {
      if (!active) return
      sessionStorage.removeItem(TOKEN_KEY)
      setToken('')
      setNotice(cause instanceof Error ? cause.message : 'Owner session expired. Sign in again.')
    })
    return () => { active = false }
  }, [token])

  useEffect(() => {
    if (captureStage === 'recording' && detector.hands > 0 && detector.features.length === 126 && captureFramesRef.current.length < 240) {
      captureFramesRef.current.push([...detector.features])
      setRecordedFrameCount(captureFramesRef.current.length)
    }
  }, [captureStage, detector.features, detector.hands])

  useEffect(() => () => {
    if (countdownTimerRef.current !== null) window.clearTimeout(countdownTimerRef.current)
    if (recordingTimerRef.current !== null) window.clearInterval(recordingTimerRef.current)
    if (recorderRef.current?.state === 'recording') { recorderRef.current.onstop = null; recorderRef.current.stop() }
  }, [])

  useEffect(() => () => { if (samplePreviewUrl) URL.revokeObjectURL(samplePreviewUrl) }, [samplePreviewUrl])

  const uploadPendingSample = async () => {
    const payload = pendingUploadRef.current
    if (!payload) return
    setWorking(true)
    setCaptureStage('uploading')
    try {
      const entry = await ownerApi.addExample(...payload)
      setExamples(current => current.some(item => item.id === entry.id) ? current : [...current, entry])
      const url = URL.createObjectURL(payload[3])
      setSamplePreviewUrl(current => { if (current) URL.revokeObjectURL(current); return url })
      pendingUploadRef.current = null
      setHasPendingUpload(false)
      setNotice(`Saved video sample and ${payload[2].length} motion frames for “${payload[1]}” (${Math.round(payload[3].size / 1024)} KB).`)
    } catch (cause) {
      setNotice(`${cause instanceof Error ? cause.message : 'Could not save this video sample.'} Your recording is retained in this tab. Retry saving before leaving this page.`)
    } finally { setWorking(false); setCaptureStage('idle') }
  }

  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => {
      if (pendingUploadRef.current) { event.preventDefault(); event.returnValue = '' }
    }
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [])

  const saveRecordedSample = async (videoBlob: Blob) => {
    const frames = sampleTrainingFrames(captureFramesRef.current)
    if (frames.length < 12 || videoBlob.size < 1024) {
      setNotice(`The sample was not saved: got ${frames.length} hand frames and ${Math.round(videoBlob.size / 1024)} KB video. Keep your hands in view for the full recording and try again.`)
      setCaptureStage('idle')
      return
    }
    pendingUploadRef.current = [token, label.trim().replace(/\s+/g, ' '), frames, videoBlob, datasetSplit, participantCode.trim(), crypto.randomUUID()]
    setHasPendingUpload(true)
    await uploadPendingSample()
  }

  const capture = () => {
    if (captureStage !== 'idle' || working || pendingUploadRef.current) return
    const cleaned = label.trim().replace(/\s+/g, ' ')
    const signer = participantCode.trim()
    if (!cleaned || !token) return
    if (!/^[A-Za-z0-9_-]{2,24}$/.test(signer)) { setNotice('Use a short anonymous signer code such as S01. Do not enter the signer’s name.'); return }
    if (!consent) { setNotice('Confirm the signer has agreed to contribute this hand-landmark example.'); return }
    if (!isActive || !detector.ready) { setNotice('Start the camera and wait for the hand detector before recording.'); return }
    captureFramesRef.current = []
    videoChunksRef.current = []
    setRecordedFrameCount(0)
    setNotice('Recording will begin after a 1-second countdown.')
    setCaptureStage('countdown')
    setCaptureCountdown(1)
    countdownTimerRef.current = window.setTimeout(() => {
      countdownTimerRef.current = null
      const stream = videoRef.current?.srcObject as MediaStream | null
      if (!stream) { setCaptureStage('idle'); setNotice('The camera disconnected before recording. Start it and try again.'); return }
      try {
        const mimeType = ['video/webm;codecs=vp8', 'video/webm', 'video/mp4'].find(type => MediaRecorder.isTypeSupported(type))
        const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined)
        recorderRef.current = recorder
        recorder.ondataavailable = event => { if (event.data.size) videoChunksRef.current.push(event.data) }
        recorder.onerror = () => {
          recorder.onstop = null
          if (recordingTimerRef.current !== null) window.clearInterval(recordingTimerRef.current)
          if (recorder.state !== 'inactive') recorder.stop()
          setCaptureStage('idle')
          setNotice('Recording was interrupted. Check the camera and record this sample again.')
        }
        recorder.onstop = () => { void saveRecordedSample(new Blob(videoChunksRef.current, { type: recorder.mimeType || 'video/webm' })) }
        recorder.start(200)
        setCaptureCountdown(5)
        setCaptureStage('recording')
        setNotice('Recording a 5-second silent clip. Perform the full movement and keep your hand visible.')
        let seconds = 5
        recordingTimerRef.current = window.setInterval(() => {
          seconds -= 1
          setCaptureCountdown(Math.max(seconds, 0))
          if (seconds <= 0) {
            if (recordingTimerRef.current !== null) window.clearInterval(recordingTimerRef.current)
            recordingTimerRef.current = null
            if (recorder.state === 'recording') recorder.stop()
          }
        }, 1000)
      } catch {
        setCaptureStage('idle')
        setNotice('Video recording is unavailable in this browser. Try the latest Chrome, Firefox, Edge, or Safari.')
      }
    }, 1000)
  }

  const deleteSample = async (example: OwnerExample) => {
    if (!window.confirm(`Delete this training recording for “${example.label}”?`)) return
    setWorking(true)
    try {
      await ownerApi.deleteExample(token, example.id)
      setExamples(current => current.filter(item => item.id !== example.id))
      setSavedVideoUrls(current => {
        if (current[example.id]) URL.revokeObjectURL(current[example.id])
        const next = { ...current }
        delete next[example.id]
        return next
      })
      setNotice('Training example deleted.')
    } catch (cause) { setNotice(cause instanceof Error ? cause.message : 'Could not delete the training example.') }
    finally { setWorking(false) }
  }

  const deleteLabel = async (word: string) => {
    if (!window.confirm(`Delete every training example for “${word}”? Publish again to remove the class from the public model.`)) return
    setWorking(true)
    try {
      await ownerApi.deleteLabel(token, word)
      setExamples(current => current.filter(item => item.label.trim().toLocaleLowerCase() !== word))
      setSavedVideoUrls(current => {
        const next = { ...current }
        for (const example of examples.filter(item => item.label.trim().toLocaleLowerCase() === word)) {
          if (next[example.id]) URL.revokeObjectURL(next[example.id])
          delete next[example.id]
        }
        return next
      })
      setNotice(`Deleted “${word}” examples. Publish the updated vocabulary to change the public model.`)
    } catch (cause) { setNotice(cause instanceof Error ? cause.message : 'Could not delete the vocabulary label.') }
    finally { setWorking(false) }
  }

  const renameLabel = async (word: string) => {
    const requested = window.prompt(`Rename “${word}” to:`, word)
    if (!requested?.trim() || requested.trim().toLocaleLowerCase() === word) return
    setWorking(true)
    try {
      const result = await ownerApi.renameLabel(token, word, requested.trim())
      setExamples(current => current.map(item => item.label.toLocaleLowerCase() === word ? { ...item, label: result.label } : item))
      setNotice(`Renamed the training class to “${result.label}”. Publish again to apply it to visitors.`)
    } catch (cause) { setNotice(cause instanceof Error ? cause.message : 'Could not rename this label.') }
    finally { setWorking(false) }
  }

  const publish = async () => {
    setWorking(true)
    try {
      const result = await ownerApi.publish(token)
      setPublishedVersion(result.version)
      setVersions(await ownerApi.versions(token))
      const metrics = result.validation_metrics
      setNotice(metrics?.validation_examples
        ? `Published model ${result.version}. Held-out accuracy: ${((metrics.accuracy || 0) * 100).toFixed(1)}%; coverage: ${((metrics.coverage || 0) * 100).toFixed(1)}%. These prototype metrics do not guarantee real-world accuracy.`
        : `Published model ${result.version}. No held-out validation clips were added, so accuracy has not been measured. Add separate validation clips before wider use.`)
    } catch (cause) { setNotice(cause instanceof Error ? cause.message : 'Could not publish the model.') }
    finally { setWorking(false) }
  }

  const activateVersion = async (version: string) => {
    if (!window.confirm(`Make model ${version} active for visitors?`)) return
    setWorking(true)
    try {
      await ownerApi.activateVersion(token, version)
      setVersions(await ownerApi.versions(token))
      setPublishedVersion(version)
      setNotice(`Restored model ${version}. Visitors already using the site will receive it within about one minute.`)
    } catch (cause) { setNotice(cause instanceof Error ? cause.message : 'Could not restore this model version.') }
    finally { setWorking(false) }
  }

  const showSavedVideo = async (example: OwnerExample) => {
    if (savedVideoUrls[example.id]) {
      setSavedVideoUrls(current => {
        URL.revokeObjectURL(current[example.id])
        const next = { ...current }
        delete next[example.id]
        return next
      })
      return
    }
    try {
      const url = await ownerApi.exampleVideo(token, example.id)
      setSavedVideoUrls(current => ({ ...current, [example.id]: url }))
    } catch (cause) { setNotice(cause instanceof Error ? cause.message : 'Could not load this saved video.') }
  }

  if (!token) return <Navigate to="/login" replace />

  const publishReady = labels.length > 0 && labels.every(word => stats[word].train >= 10)
  return <main className="owner-workspace min-h-screen bg-background">
    <header className="sticky top-0 z-20 border-b border-border bg-background/90 backdrop-blur"><div className="container flex h-16 items-center justify-between"><div><a href="/" className="flex items-center gap-2 text-sm font-semibold text-primary"><BridgeMark className="h-8 w-8"/>SignBridge · private</a><h1 className="font-display text-lg font-bold">Owner trainer</h1></div><button type="button" onClick={() => { if (isActive) stop(); void signOut().catch(cause => setNotice(cause.message)) }} className="inline-flex items-center gap-2 rounded-xl border border-border px-3 py-2 text-sm"><LogOut className="h-4 w-4"/>Sign out</button></div></header>
    <div className="prism-page container max-w-7xl py-6 sm:py-9">
      <nav className="mb-5 flex flex-wrap gap-3"><a href="#owner-capture" className="rounded-xl bg-primary px-5 py-3 font-semibold text-primary-foreground">Record training video</a><a href="#owner-quality" className="rounded-xl border border-border px-5 py-3 font-semibold">Translations & evaluation</a></nav>
      <div id="owner-quality"><OwnerQualityTools token={token} labels={labels} /></div>
      <section className="mb-6 rounded-3xl border border-border bg-card p-5"><h2 className="font-display text-xl font-bold">Vocabulary readiness</h2><p className="mt-2 text-sm text-muted-foreground">Ten clips unlock publishing. Multiple signers and separate validation clips provide stronger evidence of quality.</p><div className="mt-4 grid gap-3 sm:grid-cols-3">{labels.map(name => <div key={name} className="rounded-xl bg-muted/50 p-4"><strong>{name}</strong><p className="mt-1 text-sm">{stats[name].train}/10 training clips · {stats[name].trainSigners.size} signers</p><progress aria-label={`${name} training progress`} className="mt-2 w-full accent-teal-600" max={10} value={Math.min(10, stats[name].train)} /><p className="mt-1 text-xs text-muted-foreground">{stats[name].validation ? `${stats[name].validation} validation clips` : 'No held-out validation yet'}{stats[name].trainSigners.size < 3 ? ' · Add signer variety' : ''}</p></div>)}</div></section>
      <div className="mb-6 rounded-3xl border border-cyan-300/20 bg-gradient-to-br from-slate-950 via-indigo-950 to-sky-950 p-5 text-white shadow-xl shadow-indigo-950/10 sm:p-7"><div className="flex flex-col justify-between gap-4 md:flex-row md:items-center"><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-300">Shared vocabulary operations</p><h2 className="mt-1 font-display text-2xl font-bold sm:text-3xl">Collect motion. Validate. Publish.</h2><p className="mt-2 max-w-3xl text-sm leading-6 text-indigo-100/75">After a 1-second countdown, record a silent 5-second video sample. The video is stored privately for owner review; only its hand-landmark sequence trains the visitor recognizer. Ten training clips per sign unlock publishing. Held-out validation clips are optional and recommended.</p></div><div className="rounded-2xl border border-white/15 bg-white/10 px-4 py-3 backdrop-blur"><span className="block text-xs text-indigo-100/70">Public model</span><strong className="text-sm">{publishedVersion ? `v${publishedVersion}` : 'Not published'}</strong></div></div></div>

      <div className="grid gap-5 xl:grid-cols-[1.05fr_0.95fr]">
        <section id="owner-capture" className="scroll-mt-24 overflow-hidden rounded-3xl border border-slate-800 bg-slate-950 shadow-2xl shadow-slate-950/15"><div className="relative aspect-[3/4] sm:aspect-video bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900"><video ref={videoRef} playsInline muted autoPlay className={`absolute inset-0 h-full w-full object-contain ${isActive ? '' : 'hidden'}`}/>{!isActive && <div className="absolute inset-0 flex flex-col items-center justify-center text-white"><Camera className="mb-3 h-9 w-9 text-cyan-300"/><p className="text-sm text-white/75">Owner capture studio</p></div>}{isActive && detector.hands > 0 && <span className="absolute left-4 top-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-slate-950/75 px-3 py-2 text-xs text-white backdrop-blur"><span className="h-2 w-2 rounded-full bg-emerald-400"/>{detector.hands} hand{detector.hands === 1 ? '' : 's'} tracked</span>}{(captureStage === 'countdown' || captureStage === 'recording') && <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/35 text-center text-white backdrop-blur-[2px]"><span className={`mb-3 inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-bold uppercase tracking-wider ${captureStage === 'recording' ? 'bg-rose-500 text-white' : 'bg-cyan-400 text-slate-950'}`}>{captureStage === 'recording' ? <><Circle className="h-3 w-3 fill-current animate-pulse"/>Recording silent video</> : 'Get ready'}</span><strong className="font-display text-7xl font-bold tabular-nums">{captureCountdown}</strong><span className="mt-2 text-sm text-white/80">{captureStage === 'recording' ? `${recordedFrameCount} hand frames captured` : 'Recording starts in…'}</span></div>}{captureStage === 'uploading' && <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/75 text-center text-white"><LoaderCircle className="mb-3 h-8 w-8 animate-spin text-cyan-300"/><strong>Saving private video and motion sample</strong><span className="mt-1 text-sm text-white/70">The clip is only available in the owner workspace</span></div>}{isLoading && <span className="absolute inset-0 flex items-center justify-center bg-black/50 text-white">Starting camera…</span>}{error && <span className="absolute bottom-3 left-3 right-3 rounded-lg bg-black/75 p-3 text-center text-xs text-white">{error}</span>}</div>
          <div className="space-y-4 p-5 text-white"><div className="flex gap-2"><button type="button" disabled={captureStage !== 'idle'} onClick={() => isActive ? stop() : void start()} className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm font-semibold transition hover:bg-white/10 disabled:opacity-50">{isActive ? 'Stop camera' : 'Start camera'}</button><span className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 text-xs text-indigo-100/75">{detector.ready ? <CheckCircle2 className="h-4 w-4 text-emerald-400"/> : <LoaderCircle className="h-4 w-4 animate-spin"/>}{detector.ready ? 'Hand tracking ready' : 'Loading tracker'}</span></div>
            <label className="block text-sm font-medium">Sign label<input disabled={captureStage !== 'idle' || hasPendingUpload} maxLength={40} value={label} onChange={event => setLabel(event.target.value)} placeholder="For example: hello" className="mt-2 w-full rounded-xl border border-white/15 bg-white px-4 py-3 text-slate-950 placeholder:text-slate-400"/></label>
            <label className="block text-sm font-medium">Anonymous signer code<input disabled={captureStage !== 'idle' || hasPendingUpload} maxLength={24} value={participantCode} onChange={event => setParticipantCode(event.target.value.replace(/[^A-Za-z0-9_-]/g, '').slice(0, 24))} placeholder="For example: S01" className="mt-2 w-full rounded-xl border border-white/15 bg-white px-4 py-3 text-slate-950 placeholder:text-slate-400"/><span className="mt-1 block text-xs text-indigo-100/65">Use the same code for the same signer. Do not enter a name.</span></label>
            <label className="block text-sm font-medium">Sample type<select disabled={captureStage !== 'idle' || hasPendingUpload} value={datasetSplit} onChange={event => setDatasetSplit(event.target.value as 'train' | 'validation')} className="mt-2 w-full rounded-xl border border-white/15 bg-white px-4 py-3 text-slate-950"><option value="train">Training sample</option><option value="validation">Held-out validation sample</option></select></label>
            <label className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/5 p-3 text-xs leading-5 text-indigo-100/80"><input type="checkbox" checked={consent} onChange={event => setConsent(event.target.checked)} className="mt-1 accent-cyan-400"/>The signer agrees to save this silent video clip privately on the server for owner review and use its derived hand-motion frames for shared recognition training. No audio is recorded.</label>
            <button type="button" onClick={capture} disabled={working || hasPendingUpload || captureStage !== 'idle' || !label.trim()} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-400 to-sky-400 px-4 py-3 font-bold text-slate-950 shadow-lg shadow-cyan-950/20 transition hover:brightness-105 disabled:opacity-50">{working || captureStage === 'uploading' ? <LoaderCircle className="h-4 w-4 animate-spin"/> : <Video className="h-4 w-4"/>}{captureStage === 'countdown' ? 'Get ready…' : captureStage === 'recording' ? 'Recording clip…' : captureStage === 'uploading' ? 'Saving motion sample…' : `Record ${datasetSplit} video sample`}</button>
            <p className="text-xs leading-5 text-indigo-100/65">A 1-second countdown starts a 5-second silent video. Perform the complete motion with one hand in frame. At least 12 clear hand frames are required or the sample will be rejected.</p>
            {hasPendingUpload && captureStage === 'idle' && <div className="rounded-xl border border-amber-300/30 bg-amber-300/10 p-4"><p className="text-sm">A recording is waiting to be saved. Keep this tab open.</p><div className="mt-3 flex flex-wrap gap-3"><button type="button" className="action-primary" disabled={working} onClick={() => void uploadPendingSample()}>Retry saving recording</button><button type="button" className="action-secondary" disabled={working} onClick={() => { if (!window.confirm('Discard the unsaved recording? You will need to record it again.')) return; pendingUploadRef.current = null; setHasPendingUpload(false); setNotice('Unsaved recording discarded.') }}>Discard recording</button></div></div>}
            {samplePreviewUrl && <div className="rounded-2xl border border-white/10 bg-black/20 p-3"><p className="mb-2 flex items-center gap-2 text-xs font-semibold text-cyan-200"><Video className="h-4 w-4"/>Latest saved video · private owner storage</p><video src={samplePreviewUrl} controls playsInline className="max-h-56 w-full rounded-xl bg-black"/></div>}
          </div>
        </section>

        <section className="rounded-3xl border border-border bg-card p-5 sm:p-6"><div className="flex items-center justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-wider text-primary">Dataset review</p><h2 className="mt-1 font-display text-xl font-semibold">Shared labels</h2></div><span className="rounded-full bg-muted px-3 py-1 text-xs">{examples.length} examples</span></div>
          {labels.length ? <ul className="mt-4 max-h-[480px] space-y-2 overflow-y-auto">{labels.map(word => <li key={word} className="rounded-xl bg-muted/50 p-3"><div className="flex items-center justify-between gap-2"><div><p className="font-medium capitalize">{word}</p><p className={`text-xs ${stats[word].train >= 10 ? 'text-success' : 'text-muted-foreground'}`}>{stats[word].train}/10 training clips · {stats[word].validation} validation clips</p><p className="text-[11px] text-muted-foreground">{stats[word].trainSigners.size} training signers · {stats[word].validationSigners.size} validation signers</p></div><button type="button" onClick={() => void renameLabel(word)} className="rounded-lg px-2 py-2 text-xs text-muted-foreground hover:bg-card">Rename</button><button type="button" onClick={() => void deleteLabel(word)} className="rounded-lg p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive" aria-label={`Delete all ${word} examples`}><Trash2 className="h-4 w-4"/></button></div>{examples.filter(item => item.label.trim().toLocaleLowerCase() === word).map(item => <div key={item.id} className="mt-2 border-t border-border/60 pt-2 text-xs text-muted-foreground"><div className="flex items-center justify-between gap-2"><span>#{item.id} · {item.dataset_split} · {item.num_frames || 1} frames · signer {item.participant_code} · {new Date(item.created_at).toLocaleDateString()}</span><div className="flex items-center gap-1">{item.has_video && <button type="button" onClick={() => void showSavedVideo(item)} className="rounded px-2 py-1 font-semibold text-primary hover:bg-card">{savedVideoUrls[item.id] ? 'Hide clip' : 'View clip'}</button>}<button type="button" onClick={() => void deleteSample(item)} aria-label={`Delete example ${item.id}`} className="rounded p-1.5 hover:bg-destructive/10 hover:text-destructive"><Trash2 className="h-3.5 w-3.5"/></button></div></div>{savedVideoUrls[item.id] && <video src={savedVideoUrls[item.id]} controls playsInline className="mt-2 max-h-48 w-full rounded-xl bg-black"/>}</div>)}</li>)}</ul> : <p className="mt-4 rounded-xl bg-muted/50 p-4 text-sm text-muted-foreground">No shared examples have been collected yet.</p>}
          <button type="button" onClick={() => void publish()} disabled={working || !publishReady} className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary to-cyan-500 px-4 py-3 font-semibold text-white shadow-lg shadow-primary/20 transition hover:brightness-110 disabled:opacity-50"><CheckCircle2 className="h-4 w-4"/>Publish vocabulary{!publishReady ? ' · 10 clips per label required' : ''}</button><p className="mt-3 text-xs leading-5 text-muted-foreground">Each label can be published after 10 training clips. Add separate validation signers to review performance before wider use; they are recommended but do not block publishing.</p>
        </section>
      </div>

      <section className="mt-5 rounded-3xl border border-border bg-card p-5 sm:p-6"><div><p className="text-xs font-semibold uppercase tracking-wider text-primary">Model history</p><h2 className="mt-1 font-display text-xl font-semibold">Published versions and rollback</h2></div>{versions.length ? <ul className="mt-4 grid gap-3 md:grid-cols-2">{versions.map(version => <li key={version.version} className="rounded-2xl border border-border bg-muted/30 p-4"><div className="flex items-center justify-between gap-2"><strong className="break-all text-sm">v{version.version}</strong>{version.is_active && <span className="rounded-full bg-success/10 px-2.5 py-1 text-xs font-semibold text-success">Active</span>}</div><p className="mt-2 text-xs text-muted-foreground">{version.labels.join(', ')}</p>{version.validation_metrics && <p className="mt-2 text-xs text-muted-foreground">Held-out accuracy {(version.validation_metrics.accuracy * 100).toFixed(1)}% · coverage {(version.validation_metrics.coverage * 100).toFixed(1)}% · {version.validation_metrics.validation_signers} validation signers</p>}{!version.is_active && <button type="button" onClick={() => void activateVersion(version.version)} disabled={working} className="mt-3 rounded-lg border border-border px-3 py-2 text-xs font-semibold hover:bg-card disabled:opacity-50">Restore this version</button>}</li>)}</ul> : <p className="mt-3 rounded-xl bg-muted/50 p-4 text-sm text-muted-foreground">No model versions published yet.</p>}</section>
      {notice && <p role="status" aria-live="polite" className="mt-5 rounded-xl border border-primary/20 bg-primary/5 p-4 text-sm">{notice}</p>}
    </div>
  </main>
}
