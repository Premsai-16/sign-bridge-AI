import { emptyRecognitionGate, advanceRecognitionGate } from '../lib/recognition-gate'
import LocalizedNavLabel from '../components/LocalizedNavLabel'
import { appendConversation, conversationStorageKey, type ConversationMessage } from '../lib/conversation'
import CameraReadiness from '../components/CameraReadiness'
import { accountStorage, getAccount } from '../lib/account'
import { translateAutomatically } from '../lib/auto-translate'
import VoiceDesk from '../components/VoiceDesk'
import { OUTPUT_LANGUAGES } from '../lib/languages'
import { useEffect, useMemo, useRef, useState } from 'react'
import {
  AlertTriangle,
  Camera,
  CameraOff,
  Check,
  Copy,
  Download,
  LoaderCircle,
  Mic,
  MicOff,
  Minus,
  Pencil,
  Plus,
  Send,
  Save,
  Trash2,
  Video,
  Volume2,
  X,
} from 'lucide-react'
import { useCamera } from '../hooks/useCamera'
import { useMediaPipe } from '../hooks/useMediaPipe'
import CommunicationToolkit from '../components/CommunicationToolkit'
import HandOverlay from '../components/HandOverlay'
import { speakText, stopSpeech } from '../lib/speech'
import { ownerApi, predictSharedSequence, predictSharedSign, type SharedModel } from '../lib/api'
import { saveSession } from '../lib/sessions'
import {
  deleteSignExamples,
  exampleCounts,
  loadSignExamples,
  MAX_PERSONAL_SIGNS,
  MIN_EXAMPLES_PER_SIGN,
  predictPersonalSign,
  saveSignSequence,
  type SignExample,
} from '../lib/personalized-signs'

type Message = ConversationMessage
interface SpeechResult extends ArrayLike<{ transcript: string }> {
  isFinal: boolean
}
interface SpeechResultEvent extends Event {
  results: ArrayLike<SpeechResult>
  resultIndex: number
}
interface SpeechRecognitionLike {
  lang: string
  continuous: boolean
  interimResults: boolean
  onresult: ((event: SpeechResultEvent) => void) | null
  onerror: ((event: Event) => void) | null
  onend: (() => void) | null
  start(): void
  stop(): void
}
interface SpeechWindow extends Window {
  SpeechRecognition?: new () => SpeechRecognitionLike
  webkitSpeechRecognition?: new () => SpeechRecognitionLike
}
const timeNow = () =>
  new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
const chatKey = () => conversationStorageKey(getAccount()?.username || 'signed-out')

function loadActiveConversation(): Message[] {
  try {
    const saved: unknown = JSON.parse(sessionStorage.getItem(chatKey()) || '[]')
    return Array.isArray(saved)
      ? saved
          .filter(
            (message): message is Message =>
              message &&
              typeof message.id === 'string' &&
              (message.role === 'signer' || message.role === 'partner') &&
              typeof message.content === 'string' &&
              typeof message.at === 'string'
          )
          .slice(-200)
      : []
  } catch {
    return []
  }
}

const QUICK_SIGNS = [
  'Namaste',
  'Hello',
  'Thank You',
  'Good',
  'Yes',
  'No',
  'I Love You',
  'Help',
  'Water',
  'Please',
  'Peace',
]

export default function ConversationStudio() {
  const { isActive, isLoading, error, start, stop, videoRef } = useCamera()
  const detector = useMediaPipe(videoRef, isActive)
  const [sharedModel, setSharedModel] = useState<SharedModel | null>(null)
  const [modelError, setModelError] = useState('')
  const [personalExamples, setPersonalExamples] = useState<SignExample[]>(loadSignExamples)
  const [personalLabel, setPersonalLabel] = useState('')
  const [personalConsent, setPersonalConsent] = useState(false)
  const [personalCaptureStage, setPersonalCaptureStage] = useState<'idle' | 'countdown' | 'recording'>('idle')
  const [personalCaptureCountdown, setPersonalCaptureCountdown] = useState(3)
  const [personalFrameCount, setPersonalFrameCount] = useState(0)
  const [personalVideoUrl, setPersonalVideoUrl] = useState('')
  const [personalNotice, setPersonalNotice] = useState('')
  const [videoSize, setVideoSize] = useState({width:1280,height:720})
  const [messages, setMessages] = useState<Message[]>(loadActiveConversation)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingText, setEditingText] = useState('')
  const [draft, setDraft] = useState('')
  const [signDraft, setSignDraft] = useState('')
  const [listening, setListening] = useState(false)
  const [language, setLanguage] = useState(() => accountStorage.getItem('signbridge-caption-language') || 'en-IN')
  const [speechError, setSpeechError] = useState('')
  const [liveCaption, setLiveCaption] = useState('')
  const [speechEnabled, setSpeechEnabled] = useState(() => accountStorage.getItem('signbridge-auto-speak') !== 'false')
  const [captionSize, setCaptionSize] = useState(() => {
    const stored = Number(accountStorage.getItem('signbridge-caption-size'))
    return [16, 18, 20].includes(stored) ? stored : 16
  })
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user')
  const [conversationNotice, setConversationNotice] = useState('')
  const [online, setOnline] = useState(() => navigator.onLine)
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null)
  const recognitionGateRef = useRef(emptyRecognitionGate())
  const lastSpokenRef = useRef<string | null>(null)
  const signDraftRef = useRef('')
  const signMessageTimerRef = useRef<number | null>(null)
  const pendingAutoMessageRef = useRef(false)
  const manualSignDraftRef = useRef(false)
  const liveRef = useRef<HTMLDivElement>(null)
  const captureFramesRef = useRef<number[][]>([])
  const personalRecorderRef = useRef<MediaRecorder | null>(null)
  const personalVideoChunksRef = useRef<BlobPart[]>([])
  const personalCountdownTimerRef = useRef<number | null>(null)
  const personalRecordingTimerRef = useRef<number | null>(null)
  const cancelPersonalCaptureRef = useRef(false)
  const [autoTranslate, setAutoTranslate] = useState(() => accountStorage.getItem('signbridge-auto-translate') !== 'false')
  const [translatedMessage, setTranslatedMessage] = useState<{text:string;language:string}|null>(null)
  useEffect(() => { const update = (event: Event) => { const detail = (event as CustomEvent).detail; if (detail.state === 'translated') setTranslatedMessage({text:detail.text,language:detail.language}) }; window.addEventListener('signbridge-speech', update); return () => window.removeEventListener('signbridge-speech', update) }, [])
  const [outputLanguage, setOutputLanguage] = useState(() => accountStorage.getItem('signbridge-output-language') || 'en-IN')
  useEffect(() => { const update = () => setOutputLanguage(accountStorage.getItem('signbridge-output-language') || 'en-IN'); window.addEventListener('signbridge-language', update); return () => window.removeEventListener('signbridge-language', update) }, [])
  const [darkTheme, setDarkTheme] = useState(() => document.documentElement.classList.contains('dark'))
  const [voiceMode, setVoiceMode] = useState(() => accountStorage.getItem('signbridge-voice-mode') || 'instant')
  const personalCounts = exampleCounts(personalExamples)
  const personalNames = Object.keys(personalCounts)

  // 1. Personal sign prediction
  const personalPrediction = useMemo(
    () => (isActive && detector.hands ? predictPersonalSign(personalExamples, detector.sequence) : null),
    [detector.hands, detector.sequence, isActive, personalExamples]
  )

  // 2. Owner shared model prediction
  const sharedPrediction = useMemo(() => {
    if (!isActive || !detector.hands || !sharedModel?.published) return null
    return (
      predictSharedSequence(sharedModel, detector.sequence) ||
      (!sharedModel.templates ? predictSharedSign(sharedModel, detector.features) : null)
    )
  }, [detector.features, detector.hands, detector.sequence, isActive, sharedModel])

  // Shared labels are authoritative. Private signs are used only when there is no clear shared match.
  const framePrediction = useMemo(() => {
    if (!isActive || !detector.hands) return null
    if (sharedPrediction) {
      if (personalPrediction && personalPrediction.confidence >= 0.92 && sharedPrediction.confidence < 0.45) return personalPrediction
      return sharedPrediction
    }
    return personalPrediction && personalPrediction.confidence >= 0.72 ? personalPrediction : null
  }, [
    detector.hands,
    isActive,
    personalPrediction,
    sharedPrediction,
  ])

  useEffect(() => {
    let active = true
    const refresh = () => {
      void ownerApi
        .model()
        .then(value => {
          if (active) {
            setSharedModel(value)
            setModelError('')
          }
        })
        .catch(() => {
          if (active) {
            setSharedModel(null)
            setModelError('Shared vocabulary is unavailable. Check the server connection.')
          }
        })
    }
    refresh()
    const timer = window.setInterval(refresh, 60_000)
    return () => {
      active = false
      window.clearInterval(timer)
    }
  }, [])

  useEffect(() => {
    try {
      if (messages.length) sessionStorage.setItem(chatKey(), JSON.stringify(messages.slice(-200)))
      else sessionStorage.removeItem(chatKey())
    } catch {
      // Keep session
    }
  }, [messages])

  useEffect(() => {
    signDraftRef.current = signDraft
  }, [signDraft])

  useEffect(
    () => () => {
      if (signMessageTimerRef.current !== null) window.clearTimeout(signMessageTimerRef.current)
    },
    []
  )

  useEffect(() => {
    const frame = window.requestAnimationFrame(() =>
      liveRef.current?.scrollTo({ top: liveRef.current.scrollHeight, behavior: 'smooth' })
    )
    return () => window.cancelAnimationFrame(frame)
  }, [messages, liveCaption])

  useEffect(
    () => () => {
      recognitionRef.current?.stop()
      stopSpeech()
    },
    []
  )

  useEffect(() => {
    const update = () => setOnline(navigator.onLine)
    window.addEventListener('online', update)
    window.addEventListener('offline', update)
    return () => {
      window.removeEventListener('online', update)
      window.removeEventListener('offline', update)
    }
  }, [])

  useEffect(() => {
    if (
      personalCaptureStage === 'recording' &&
      detector.hands > 0 &&
      detector.features.length === 126 &&
      captureFramesRef.current.length < 60
    ) {
      captureFramesRef.current.push([...detector.features])
      setPersonalFrameCount(captureFramesRef.current.length)
    }
  }, [detector.features, detector.hands, personalCaptureStage])

  useEffect(
    () => () => {
      if (personalCountdownTimerRef.current !== null)
        window.clearInterval(personalCountdownTimerRef.current)
      if (personalRecordingTimerRef.current !== null)
        window.clearInterval(personalRecordingTimerRef.current)
      cancelPersonalCaptureRef.current = true
      if (personalRecorderRef.current?.state === 'recording') personalRecorderRef.current.stop()
      if (personalVideoUrl) URL.revokeObjectURL(personalVideoUrl)
    },
    [personalVideoUrl]
  )

  useEffect(() => {
    if (!isActive || personalCaptureStage !== 'idle') {
      recognitionGateRef.current = emptyRecognitionGate()
      lastSpokenRef.current = null
      if (signMessageTimerRef.current !== null) window.clearTimeout(signMessageTimerRef.current)
      return
    }
    // Explicit clear/replay actions may reset the last accepted word.
    if (lastSpokenRef.current === null) recognitionGateRef.current.lastAccepted = null
    const gated = advanceRecognitionGate(recognitionGateRef.current, framePrediction?.label || null, performance.now())
    recognitionGateRef.current = gated.state
    if (!gated.accepted || !framePrediction) return
    lastSpokenRef.current = gated.accepted
    pendingAutoMessageRef.current = true
    setSignDraft(current => (current ? `${current} ${framePrediction.label}` : framePrediction.label))
    setLiveCaption('')
    if (manualSignDraftRef.current) return
    if (!speechEnabled) { const targetLanguage = accountStorage.getItem('signbridge-output-language') || 'en-IN'; void translateAutomatically(framePrediction.label, targetLanguage).then(text => { if ((accountStorage.getItem('signbridge-output-language') || 'en-IN') === targetLanguage) setTranslatedMessage({text,language:targetLanguage}) }).catch(cause => setSpeechError(cause instanceof Error ? cause.message : 'Translation unavailable.')) }
    if (voiceMode === 'instant' && speechEnabled) {
      speakText(framePrediction.label, accountStorage.getItem('signbridge-voice') || 'en-IN', Number(accountStorage.getItem('signbridge-speech-rate') || '1'), { onError: setSpeechError, queue: true })
    }
    if (signMessageTimerRef.current !== null) window.clearTimeout(signMessageTimerRef.current)
    signMessageTimerRef.current = window.setTimeout(() => {
      if (!pendingAutoMessageRef.current) return
      const text = signDraftRef.current.trim()
      if (!text) return
      pendingAutoMessageRef.current = false
      setMessages(current => appendConversation(current, { id: `${Date.now()}-${Math.random()}`, role: 'signer', content: text, at: timeNow() }))
      setSignDraft('')
      if (voiceMode === 'phrase' && accountStorage.getItem('signbridge-auto-speak') !== 'false') {
        speakText(
          text,
          accountStorage.getItem('signbridge-voice') || 'en-IN',
          Number(accountStorage.getItem('signbridge-speech-rate') || '1'),
          { onError: setSpeechError }
        )
      }
    }, 900)
  }, [detector.hands, framePrediction, isActive, voiceMode, speechEnabled, personalCaptureStage])

  const addMessage = (content: string, role: Message['role']) => {
    const text = content.trim()
    if (!text) return
    setMessages(current => appendConversation(current, { id: `${Date.now()}-${Math.random()}`, role, content: text, at: timeNow() }))
    setDraft('')
    setLiveCaption('')
  }

  const sendSignMessage = () => {
    const text = signDraft.trim()
    if (!text) return
    manualSignDraftRef.current = false
    pendingAutoMessageRef.current = false
    if (signMessageTimerRef.current !== null) window.clearTimeout(signMessageTimerRef.current)
    addMessage(text, 'signer')
    setSignDraft('')
    if (speechEnabled)
      speakText(
        text,
        accountStorage.getItem('signbridge-voice') || 'en-IN',
        Number(accountStorage.getItem('signbridge-speech-rate') || '1'),
        { onError: setSpeechError }
      )
  }

  const correctMessage = (id: string) => {
    const correction = editingText.trim()
    if (!correction) return
    setMessages(current =>
      current.map(message =>
        message.id === id ? { ...message, content: correction, corrected: true } : message
      )
    )
    setEditingId(null)
    setEditingText('')
    setConversationNotice('Caption corrected. Use its speaker button to say the corrected words aloud.')
  }

  const savePersonalClip = (videoBlob: Blob) => {
    if (cancelPersonalCaptureRef.current) {
      cancelPersonalCaptureRef.current = false
      return
    }
    if (videoBlob.size) {
      const url = URL.createObjectURL(videoBlob)
      setPersonalVideoUrl(current => {
        if (current) URL.revokeObjectURL(current)
        return url
      })
    }
    let frames = captureFramesRef.current
    captureFramesRef.current = []
    if (frames.length === 0 && detector.features.length === 126) {
      frames = [detector.features]
    }
    if (frames.length === 0) {
      setPersonalNotice('No hand landmarks detected. Hold your hand in frame and try again.')
      setPersonalCaptureStage('idle')
      return
    }
    try {
      const next = saveSignSequence(personalLabel, frames)
      setPersonalExamples(next)
      const count =
        exampleCounts(next)[personalLabel.trim().replace(/\s+/g, ' ').toLocaleLowerCase()] || 0
      setPersonalNotice(
        `✓ Saved 1-second sample #${count} for “${personalLabel.trim()}”. ${Math.max(
          0,
          MIN_EXAMPLES_PER_SIGN - count
        )} more sample${MIN_EXAMPLES_PER_SIGN - count === 1 ? '' : 's'} to complete 10 verified samples.`
      )
    } catch (cause) {
      setPersonalNotice(cause instanceof Error ? cause.message : 'Could not save this family sign sample.')
    } finally {
      setPersonalCaptureStage('idle')
    }
  }

  const capturePersonal = () => {
    if (!personalConsent) {
      setPersonalNotice('Confirm that you want to store derived hand landmarks on this device.')
      return
    }
    if (!personalLabel.trim()) {
      setPersonalNotice('Enter the name or short phrase for this personal sign.')
      return
    }
    if (!isActive || !detector.ready) {
      setPersonalNotice('Start the camera and wait for hand tracking before recording.')
      return
    }
    captureFramesRef.current = []
    personalVideoChunksRef.current = []
    setPersonalFrameCount(0)
    cancelPersonalCaptureRef.current = false
    setPersonalNotice('⚡ Recording 1-second burst sample...')
    setPersonalCaptureCountdown(1)
    setPersonalCaptureStage('recording')

    const stream = videoRef.current?.srcObject as MediaStream | null
    if (!stream) {
      setPersonalCaptureStage('idle')
      setPersonalNotice('The camera disconnected. Start it and try again.')
      return
    }

    try {
      const mimeType = ['video/webm;codecs=vp8', 'video/webm', 'video/mp4'].find(type =>
        MediaRecorder.isTypeSupported(type)
      )
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined)
      personalRecorderRef.current = recorder
      recorder.ondataavailable = event => {
        if (event.data.size) personalVideoChunksRef.current.push(event.data)
      }
      recorder.onstop = () =>
        savePersonalClip(
          new Blob(personalVideoChunksRef.current, { type: recorder.mimeType || 'video/webm' })
        )
      recorder.start(100)

      // 1.0 second fast burst capture
      window.setTimeout(() => {
        if (recorder.state === 'recording') recorder.stop()
      }, 1000)
    } catch {
      window.setTimeout(() => {
        savePersonalClip(new Blob([], { type: 'video/webm' }))
      }, 1000)
    }
  }

  const toggleCamera = () => {
    if (isActive) {
      if (personalCaptureStage !== 'idle') {
        cancelPersonalCaptureRef.current = true
        if (personalCountdownTimerRef.current !== null)
          window.clearInterval(personalCountdownTimerRef.current)
        if (personalRecordingTimerRef.current !== null)
          window.clearInterval(personalRecordingTimerRef.current)
        if (personalRecorderRef.current?.state === 'recording') personalRecorderRef.current.stop()
        setPersonalCaptureStage('idle')
        captureFramesRef.current = []
        setPersonalNotice('Video capture cancelled. No sample was saved.')
      }
      stop()
    } else {
      void start(facingMode)
    }
  }

  const flipCamera = async () => {
    if (!isActive) return
    const nextFacing = facingMode === 'user' ? 'environment' : 'user'
    stop()
    setFacingMode(nextFacing)
    const opened = await start(nextFacing)
    if (!opened)
      setConversationNotice('Could not switch cameras. Check whether your device provides another camera.')
  }

  const transcriptText = () =>
    messages.map(message => `${message.role === 'signer' ? 'Signed' : 'Heard'}: ${message.content}`).join('\n')
  const saveTranscript = () => {
    try {
      saveSession(transcriptText(), 'Conversation')
      setConversationNotice('Conversation saved in local history on this device.')
    } catch {
      setConversationNotice('Could not save this conversation in browser storage.')
    }
  }
  const copyTranscript = async () => {
    try {
      await navigator.clipboard.writeText(transcriptText())
      setConversationNotice('Conversation copied.')
    } catch {
      setConversationNotice('Clipboard access is unavailable in this browser.')
    }
  }
  const downloadTranscript = () => {
    const url = URL.createObjectURL(new Blob([transcriptText()], { type: 'text/plain;charset=utf-8' }))
    const link = document.createElement('a')
    link.href = url
    link.download = 'signbridge-conversation.txt'
    link.click()
    URL.revokeObjectURL(url)
    setConversationNotice('Conversation downloaded as a text file.')
  }

  const changeCaptionSize = (direction: -1 | 1) => {
    const sizes = [16, 18, 20]
    const next = sizes[Math.min(sizes.length - 1, Math.max(0, sizes.indexOf(captionSize) + direction))]
    setCaptionSize(next)
    accountStorage.setItem('signbridge-caption-size', String(next))
  }

  const removePersonal = (name: string) => {
    if (!window.confirm(`Delete all private examples for “${name}” from this device?`)) return
    const next = deleteSignExamples(name)
    setPersonalExamples(next)
    setPersonalNotice(`Removed “${name}”. It can be retrained with new examples.`)
  }

  const stopListening = () => {
    recognitionRef.current?.stop()
    setListening(false)
    setLiveCaption('')
  }
  const toggleListening = () => {
    if (listening) {
      stopListening()
      return
    }
    const browser = window as SpeechWindow
    const SpeechRecognition = browser.SpeechRecognition || browser.webkitSpeechRecognition
    if (!SpeechRecognition) {
      setSpeechError(
        'Live captions are not supported in this browser. Try Chrome or Edge, or type the spoken words.'
      )
      return
    }
    setSpeechError('')
    const recognition = new SpeechRecognition()
    recognition.lang = language
    recognition.continuous = true
    recognition.interimResults = true
    recognition.onresult = event => {
      let interim = ''
      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        const result = event.results[index]
        const phrase = result?.[0]?.transcript?.trim()
        if (!phrase) continue
        if (result.isFinal) addMessage(phrase, 'partner')
        else interim += `${phrase} `
      }
      setLiveCaption(interim.trim())
    }
    recognition.onerror = () => {
      setSpeechError('Microphone captions stopped. Check microphone permission and try again.')
      setListening(false)
    }
    recognition.onend = () => setListening(false)
    recognitionRef.current = recognition
    try {
      recognition.start()
      setListening(true)
    } catch {
      setSpeechError('Could not start the microphone. Check permission and try again.')
    }
  }

  const speak = (text: string) => {
    const ok = speakText(
      text,
      accountStorage.getItem('signbridge-voice') || 'en-IN',
      Number(accountStorage.getItem('signbridge-speech-rate') || '1'),
      { onError: setSpeechError }
    )
    if (!ok) setSpeechError('Speech playback is not available in this browser.')
  }

  return (
    <div className="prism-page conversation-workspace container max-w-7xl py-6 pb-10 sm:py-10">
      <header className="mb-4 flex flex-wrap items-center justify-between gap-3"><h1 className="font-display text-2xl font-bold"><LocalizedNavLabel label="Live Studio"/></h1>        <label className="text-sm font-medium"><LocalizedNavLabel label="Speak in"/> <select aria-label="Spoken output language" className="ml-2 rounded-xl border border-border bg-background px-3 py-2" value={outputLanguage} onChange={event => { setOutputLanguage(event.target.value); accountStorage.setItem('signbridge-output-language', event.target.value); window.dispatchEvent(new Event('signbridge-language')); stopSpeech() }}>{OUTPUT_LANGUAGES.map(item => <option key={item.code} value={item.code}>{item.name}</option>)}</select></label></header>
      {!online && (
        <div
          role="status"
          className="mb-5 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm"
        >
          <strong>Offline mode.</strong> Camera recognition uses cached on-device models. Speech
          captions may need an internet connection.
        </div>
      )}

      {/* Main Studio Grid */}
      <div className="grid gap-6 lg:grid-cols-[1fr_0.9fr]">
        {/* Left Column: Camera + Sign Recognition Panel */}
        <section className="overflow-hidden rounded-3xl border border-border bg-card shadow-xl flex flex-col">
          <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-4 bg-muted/20">
            <div>
              <h2 className="font-display text-lg font-bold"><LocalizedNavLabel label="Sign to Voice Camera"/></h2>
              <p className="text-xs text-muted-foreground">Video stays on this device</p>
            </div>
            <span
              className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${
                isActive ? 'bg-success/10 text-success' : 'bg-muted text-muted-foreground'
              }`}
            >
              <span
                className={`h-2 w-2 rounded-full ${
                  isActive ? 'bg-success animate-pulse' : 'bg-muted-foreground/50'
                }`}
              />
              {isActive ? 'Tracking Active' : 'Camera Off'}
            </span>
          </div>

          <button type="button" className="action-secondary m-3" onClick={async event => {
            const camera = event.currentTarget.parentElement?.querySelector('.mobile-camera-stage') as HTMLElement | null
            if (!camera) return
            try { if (document.fullscreenElement) await document.exitFullscreen(); else if (camera.requestFullscreen) await camera.requestFullscreen(); else window.alert('Fullscreen is unavailable in this browser. Rotate your phone for a larger preview.') }
            catch { window.alert('Fullscreen is unavailable in this browser. You can still use the camera preview.') }
          }}><LocalizedNavLabel label="Expand camera"/></button>
          {/* Video Container with Hand Landmark Overlay */}
          <div className="mobile-camera-stage relative aspect-video min-h-60 shrink-0 bg-slate-950 sm:min-h-72 overflow-hidden">
            <video
              ref={videoRef}
              onLoadedMetadata={event => setVideoSize({width:event.currentTarget.videoWidth,height:event.currentTarget.videoHeight})}
              playsInline
              muted
              autoPlay
              className={`absolute inset-0 h-full w-full object-contain transform ${facingMode === 'user' ? '-scale-x-100' : ''} ${
                isActive ? '' : 'hidden'
              }`}
            />

            {/* Glowing Hand Skeleton & Holographic Overlay */}
            {isActive && (
              <HandOverlay
                showLabel={false}
                hands={detector.rawHands}
                prediction={detector.geometricPrediction}
                activeSign={framePrediction?.label}
                confidence={framePrediction?.confidence}
                mirrored={facingMode === 'user'}
                sourceWidth={videoSize.width}
                sourceHeight={videoSize.height}
              />
            )}

            {/* Camera Off State */}
            {!isActive && (
              <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center text-white bg-slate-950">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/20 text-primary mb-3">
                  <Camera className="h-8 w-8 text-primary" />
                </div>
                <h3 className="font-display text-lg font-bold"><LocalizedNavLabel label="Camera is Off"/></h3>
                <p className="text-xs text-white/70 max-w-xs mt-1">
                  Start the camera to check for signs in the trained vocabulary. Recognition is experimental and runs on this device.
                </p>
              </div>
            )}

            {/* Recording / Countdown Stage */}
            {(personalCaptureStage === 'countdown' || personalCaptureStage === 'recording') && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/70 text-center text-white backdrop-blur-sm z-30">
                <span
                  className={`mb-2 rounded-full px-4 py-2 text-xs font-bold uppercase tracking-wider ${
                    personalCaptureStage === 'recording'
                      ? 'bg-rose-500'
                      : 'bg-cyan-300 text-slate-950'
                  }`}
                >
                  {personalCaptureStage === 'recording' ? 'Recording silent video' : 'Get ready'}
                </span>
                <strong className="font-display text-7xl font-bold tabular-nums">
                  {personalCaptureCountdown}
                </strong>
                <span className="mt-2 text-sm text-white/80">
                  {personalCaptureStage === 'recording'
                    ? `${personalFrameCount} hand frames captured`
                    : 'Recording starts in…'}
                </span>
              </div>
            )}

            {/* Detected Sign Hologram Banner */}
            {isActive && detector.hands > 0 && framePrediction && personalCaptureStage === 'idle' && (
              <div className="absolute inset-x-4 bottom-4 rounded-2xl border border-primary/40 bg-black/85 p-4 text-white backdrop-blur z-20 shadow-xl">
                <div className="flex items-center justify-between text-xs text-white/70">
                  <span>Recognized ISL Sign</span>
                  <span className="text-emerald-400 font-bold">
                    {Math.round(framePrediction.confidence * 100)}% Confidence
                  </span>
                </div>
                <p className="mt-1 text-2xl font-display font-bold capitalize text-primary-foreground">
                  {framePrediction.label}
                </p>
              </div>
            )}

            {isActive && detector.hands === 0 && personalCaptureStage === 'idle' && (
              <div className="absolute inset-x-4 bottom-4 rounded-xl bg-black/75 px-4 py-2.5 text-center text-xs text-white/80 z-20">
                Move one or both hands into camera view to detect ISL signs.
              </div>
            )}

            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/60 text-white z-20">
                <LoaderCircle className="h-6 w-6 animate-spin mr-2" />
                Starting camera…
              </div>
            )}

            {error && (
              <div
                role="alert"
                className="absolute inset-x-4 bottom-4 rounded-xl bg-red-950/90 border border-red-500/40 p-3 text-center text-xs text-red-200 z-20"
              >
                {error}
              </div>
            )}
          </div>

          <CameraReadiness video={videoRef} active={isActive} hands={detector.hands} />
          {/* Quick Toolbar */}
          <div className="flex flex-wrap gap-2 p-4 sm:p-5 border-b border-border bg-card">
            <button
              type="button"
              onClick={toggleCamera}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition shadow-sm"
            >
              {isActive ? <CameraOff className="h-4 w-4" /> : <Camera className="h-4 w-4" />}
              <LocalizedNavLabel label={isActive ? 'Turn camera off' : 'Start signing'}/>
            </button>
            <button
              type="button"
              onClick={() => void flipCamera()}
              disabled={!isActive}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-border px-4 py-3 text-sm font-semibold hover:bg-muted disabled:opacity-40 transition"
            >
              Flip camera
            </button>
            <button
              type="button"
              onClick={() =>
                setSpeechEnabled(current => {
                  accountStorage.setItem('signbridge-auto-speak', String(!current))
                  return !current
                })
              }
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-border px-4 py-3 text-sm font-semibold hover:bg-muted transition"
            >
              <Volume2 className="h-4 w-4" />
              {speechEnabled ? 'Auto-Voice On' : 'Voice Off'}
            </button>
          </div>

          <details className="border-b border-border"><summary className="cursor-pointer px-5 py-3 text-sm font-semibold">Quick words & model details</summary>
          {/* Quick Sign Taps */}
          <div className="px-5 py-4 border-b border-border bg-muted/10">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
                Quick Sign Insert
              </span>
              <span className="text-[11px] text-muted-foreground">
                {sharedModel?.published ? `Shared Model v${sharedModel.version}` : (modelError ? 'On-device vision active' : 'Waiting for owner vocabulary')}
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {QUICK_SIGNS.map(sign => (
                <button
                  key={sign}
                  onClick={() => {
                    setSignDraft(curr => (curr ? `${curr} ${sign}` : sign))
                  }}
                  className="rounded-lg border border-border bg-background px-2.5 py-1 text-xs font-medium hover:border-primary/50 hover:bg-primary/5 hover:text-primary transition"
                >
                  +{sign}
                </button>
              ))}
            </div>
          </div>

          </details>
          {/* Sign Message Composer */}
          <div className="p-5 flex-1 flex flex-col justify-between">
            <div>
              <label htmlFor="sign-message" className="block text-sm font-semibold">
                Assembled Sign Message
              </label>
              <p className="mt-1 text-xs text-muted-foreground">
                Recognized signs collect into this draft. Pausing sends it automatically and reads it
                aloud if voice is enabled.
              </p>
              <textarea
                id="sign-message"
                rows={3}
                value={signDraft}
                onChange={event => {
                  manualSignDraftRef.current = true
                  pendingAutoMessageRef.current = false
                  if (signMessageTimerRef.current !== null)
                    window.clearTimeout(signMessageTimerRef.current)
                  setSignDraft(event.target.value)
                }}
                placeholder="Hold a sign in view, or type directly here…"
                className="mt-3 w-full resize-y rounded-xl border border-border bg-background px-4 py-3 text-sm leading-6 shadow-inner focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div className="mt-3 flex gap-2">
              <button
                type="button"
                onClick={sendSignMessage}
                disabled={!signDraft.trim()}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground disabled:opacity-40 hover:bg-primary/90 transition shadow-sm"
              >
                <Send className="h-4 w-4" />
                Send {speechEnabled ? '& speak' : 'message'}
              </button>
              <button
                type="button"
                onClick={() => {
                  manualSignDraftRef.current = false
                  pendingAutoMessageRef.current = false
                  if (signMessageTimerRef.current !== null)
                    window.clearTimeout(signMessageTimerRef.current)
                  setSignDraft('')
                  lastSpokenRef.current = null
                }}
                disabled={!signDraft}
                className="rounded-xl border border-border px-4 py-3 text-sm font-semibold hover:bg-muted disabled:opacity-40 transition"
              >
                <LocalizedNavLabel label="Clear"/>
              </button>
            </div>
          </div>
        </section>

        {/* Right Column: Two-Way Conversation Captions */}
        <section className="flex min-h-[520px] flex-col overflow-hidden rounded-3xl border border-border bg-card shadow-xl sm:min-h-[620px]">
          <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-4 bg-muted/20">
            <div>
              <h2 className="font-display text-lg font-bold"><LocalizedNavLabel label="Conversation Captions"/></h2>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Signed messages & spoken captions in one live thread
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setMessages([])
                setEditingId(null)
                stopSpeech()
                lastSpokenRef.current = null
              }}
              disabled={!messages.length}
              className="rounded-lg p-2 text-muted-foreground hover:bg-muted disabled:opacity-40 transition"
              aria-label="Clear conversation"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>

          {/* Message List */}
          <div
            ref={liveRef}
            aria-live="polite"
            className="conversation-scroll flex-1 space-y-3 overflow-y-auto bg-gradient-to-b from-primary/[0.02] to-transparent p-5"
          >
            {!messages.length && (
              <div className="flex h-full min-h-56 flex-col items-center justify-center text-center">
                <div className="mb-3 rounded-2xl bg-primary/10 p-4 text-primary">
                  <Check className="h-7 w-7" />
                </div>
                <p className="font-display font-semibold text-base">Conversation Thread Ready</p>
                <p className="mt-1 max-w-xs text-xs text-muted-foreground">
                  Start signing with your camera or tap "Caption speech" while your partner replies.
                </p>
              </div>
            )}

            {messages.map(message => (
              <div
                key={message.id}
                className={`flex ${message.role === 'signer' ? 'justify-end' : 'justify-start'}`}
              >
                <article
                  className={`max-w-[88%] rounded-2xl px-4 py-3 shadow-sm ${
                    message.role === 'signer'
                      ? 'rounded-br-sm bg-primary text-primary-foreground'
                      : 'rounded-bl-sm bg-muted text-foreground border border-border'
                  }`}
                >
                  <p className="mb-1 text-[11px] font-bold opacity-75 uppercase tracking-wider">
                    {message.role === 'signer' ? 'Signed (You)' : 'Heard (Partner)'}
                  </p>
                  <p
                    className="conversation-caption break-words leading-relaxed"
                    style={{ fontSize: captionSize }}
                  >
                    {message.content}
                  </p>
                  {message.corrected && <p className="mt-1 text-[10px] opacity-70">Corrected</p>}
                  {editingId === message.id && (
                    <form
                      onSubmit={event => {
                        event.preventDefault()
                        correctMessage(message.id)
                      }}
                      className="mt-2 flex gap-1"
                    >
                      <input
                        autoFocus
                        aria-label="Corrected caption"
                        value={editingText}
                        onChange={event => setEditingText(event.target.value)}
                        className="min-w-0 flex-1 rounded-md bg-background px-2 py-1 text-sm text-foreground"
                      />
                      <button
                        type="submit"
                        aria-label="Save caption correction"
                        className="rounded-md bg-primary p-1.5 text-primary-foreground"
                      >
                        <Check className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        aria-label="Cancel caption correction"
                        onClick={() => setEditingId(null)}
                        className="rounded-md bg-background p-1.5 text-foreground"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </form>
                  )}
                  <p className="mt-1 text-right text-[10px] opacity-60">{message.at}</p>
                </article>

                {message.role === 'signer' && (
                  <button
                    type="button"
                    onClick={() => speak(message.content)}
                    title="Repeat aloud"
                    className="ml-1 self-end rounded-lg p-2 text-muted-foreground hover:bg-muted"
                  >
                    <Volume2 className="h-4 w-4" />
                  </button>
                )}
                {message.role === 'signer' && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingId(message.id)
                      setEditingText(message.content)
                    }}
                    title="Correct caption"
                    className="ml-1 self-end rounded-lg p-2 text-muted-foreground hover:bg-muted"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}

            {liveCaption && (
              <div className="rounded-2xl border border-primary/20 bg-primary/5 p-3 text-sm animate-pulse">
                <span className="mr-2 text-xs font-semibold text-primary">Listening…</span>
                {liveCaption}
              </div>
            )}
          </div>

          {/* Bottom Caption & Mic Bar */}
          <div className="border-t border-border p-4 sm:p-5 bg-card">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-1">
                <span className="mr-1 text-xs text-muted-foreground font-medium">Text size</span>
                <button
                  type="button"
                  aria-label="Decrease caption text size"
                  onClick={() => changeCaptionSize(-1)}
                  disabled={captionSize <= 16}
                  className="rounded-lg border border-border p-1.5 disabled:opacity-40 hover:bg-muted transition"
                >
                  <Minus className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  aria-label="Increase caption text size"
                  onClick={() => changeCaptionSize(1)}
                  disabled={captionSize >= 20}
                  className="rounded-lg border border-border p-1.5 disabled:opacity-40 hover:bg-muted transition"
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={saveTranscript}
                  disabled={!messages.length}
                  title="Save locally"
                  className="rounded-lg border border-border p-2 disabled:opacity-40 hover:bg-muted transition"
                >
                  <Save className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => void copyTranscript()}
                  disabled={!messages.length}
                  title="Copy conversation"
                  className="rounded-lg border border-border p-2 disabled:opacity-40 hover:bg-muted transition"
                >
                  <Copy className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={downloadTranscript}
                  disabled={!messages.length}
                  title="Download transcript"
                  className="rounded-lg border border-border p-2 disabled:opacity-40 hover:bg-muted transition"
                >
                  <Download className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Microphone & Language Bar */}
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={toggleListening}
                className={`inline-flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition ${
                  listening
                    ? 'bg-red-500 text-white animate-pulse'
                    : 'border border-border hover:bg-muted'
                }`}
              >
                {listening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                {listening ? 'Stop live captions' : 'Caption speech'}
              </button>

              <select
                id="caption-language"
                aria-label="Speech caption language"
                value={language}
                onChange={event => {
                  setLanguage(event.target.value)
                  accountStorage.setItem('signbridge-caption-language', event.target.value)
                  if (listening) stopListening()
                }}
                className="rounded-xl border border-border bg-background px-3 py-3 text-xs font-semibold"
              >
                <option value="en-IN">English (India)</option>
                <option value="hi-IN">Hindi</option>
                <option value="bn-IN">Bengali</option>
                <option value="gu-IN">Gujarati</option>
                <option value="kn-IN">Kannada</option>
                <option value="ml-IN">Malayalam</option>
                <option value="mr-IN">Marathi</option>
                <option value="ta-IN">Tamil</option>
                <option value="te-IN">Telugu</option>
                <option value="en-US">English (US)</option>
              </select>
            </div>

            {/* Partner Reply Input */}
            <form
              onSubmit={event => {
                event.preventDefault()
                addMessage(draft, 'partner')
              }}
              className="flex gap-2"
            >
              <input
                value={draft}
                onChange={event => setDraft(event.target.value)}
                aria-label="Partner reply"
                placeholder="Type a partner reply or correction…"
                className="min-w-0 flex-1 rounded-xl border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary shadow-inner"
              />
              <button
                type="submit"
                aria-label="Send partner reply"
                disabled={!draft.trim()}
                className="rounded-xl bg-primary px-5 text-primary-foreground font-semibold disabled:opacity-40 hover:bg-primary/90 transition shadow-sm"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>

            {conversationNotice && (
              <p role="status" className="mt-3 rounded-lg bg-primary/5 p-2.5 text-xs text-primary font-medium">
                {conversationNotice}
              </p>
            )}
            {speechError && (
              <p
                role="status"
                className="mt-3 flex gap-2 rounded-lg bg-amber-500/10 p-2.5 text-xs text-amber-900 dark:text-amber-100"
              >
                <AlertTriangle className="h-4 w-4 shrink-0" />
                {speechError}
              </p>
            )}
          </div>
        </section>
      </div>

      <details className="mt-6 rounded-2xl border border-border bg-card p-4"><summary className="cursor-pointer font-semibold">Voice, translation & tools</summary><div className="mt-4 space-y-4">        <button type="button" aria-pressed={darkTheme} className="rounded-xl border border-border px-3 py-2 text-sm font-medium" onClick={() => { const next = !darkTheme; setDarkTheme(next); document.documentElement.classList.toggle('dark', next); accountStorage.setItem('signbridge-theme', next ? 'dark' : 'light') }}>{darkTheme ? 'Switch to daylight' : 'Switch to night'}</button>

        <label className="text-sm font-medium">Voice timing <select aria-label="Voice timing" className="ml-2 rounded-xl border border-border bg-background px-3 py-2" value={voiceMode} onChange={event => { setVoiceMode(event.target.value); accountStorage.setItem('signbridge-voice-mode', event.target.value) }}><option value="instant">Immediate</option><option value="phrase">Complete phrase</option></select></label>
        <span role="status" className="rounded-full bg-emerald-500/10 px-3 py-2 text-xs font-medium text-success">{isActive ? detector.ready ? detector.hands ? 'Hands tracked' : 'Show your hands' : 'Preparing tracker' : 'Camera paused'}</span>
      {isActive && detector.ready && <p className="mb-3 text-sm text-muted-foreground">Hand tracking: {Math.round(detector.inferenceMs)} ms per processed frame. This measures tracker processing, not total recognition or speech delay.</p>}
      <div className="mb-4 rounded-xl border border-border bg-card px-4 py-3"><label className="flex items-center gap-3 text-sm font-semibold"><input type="checkbox" checked={autoTranslate} onChange={event => { setAutoTranslate(event.target.checked); accountStorage.setItem('signbridge-auto-translate', String(event.target.checked)); stopSpeech() }} />Automatic translation to {OUTPUT_LANGUAGES.find(item => item.code === outputLanguage)?.name}</label><p className="mt-2 text-sm text-muted-foreground">Built-in phrases stay on this device. Other recognized words are sent to MyMemory when this is on, then cached for this session. Machine translations may need correction.</p></div>
      {translatedMessage?.language === outputLanguage && <div aria-live="polite" className="mb-5 rounded-2xl bg-primary/10 p-5"><p className="text-sm font-semibold text-primary">Translated message</p><p className="mt-2 text-3xl font-bold">{translatedMessage.text}</p></div>}
      <VoiceDesk />
      <CommunicationToolkit vocabulary={sharedModel?.labels || []} liveText={signDraft || messages.at(-1)?.content || ''} />
</div></details>
      {/* Private Family Signs Accordion */}
      <details
        id="private-family-signs"
        className="group mt-6 overflow-hidden rounded-3xl border border-border bg-card shadow-sm"
      >
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-5 sm:p-6 bg-muted/10 hover:bg-muted/20 transition">
          <div>
            <p className="text-base font-bold flex items-center gap-2">
              Your Personal & Family Signs
              <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
                {personalNames.length}/{MAX_PERSONAL_SIGNS} Enrolled
              </span>
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Add your own custom gestures, names, or emergency phrases recorded directly on this
              device.
            </p>
          </div>
          <span className="text-base text-primary transition-transform group-open:rotate-180 font-bold">
            ⌄
          </span>
        </summary>

        <div className="grid gap-6 border-t border-border p-5 sm:grid-cols-[1fr_1fr] sm:p-6">
          <section>
            <p className="text-xs sm:text-sm leading-relaxed text-muted-foreground">
              Add a family name, nickname, or short phrase. Record five separate 3-second silent video
              samples per sign. Derived landmark coordinates stay encrypted in this browser.
            </p>

            <label htmlFor="private-sign-label" className="mb-1.5 mt-4 block text-xs font-bold uppercase tracking-wider">
              Private Sign Label
            </label>
            <input
              id="private-sign-label"
              maxLength={40}
              value={personalLabel}
              onChange={event => setPersonalLabel(event.target.value)}
              placeholder="e.g. Grandma, Home, Medicine"
              className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm"
            />

            <div className="mt-3 flex items-center justify-between text-xs font-medium">
              <span>Samples for this label:</span>
              <strong className="text-primary font-bold">
                {personalCounts[
                  personalLabel.trim().replace(/\s+/g, ' ').toLocaleLowerCase()
                ] || 0}
                /{MIN_EXAMPLES_PER_SIGN}
              </strong>
            </div>

            <label className="mt-4 flex items-start gap-2.5 rounded-xl border border-border p-3 text-xs leading-5">
              <input
                type="checkbox"
                checked={personalConsent}
                onChange={event => setPersonalConsent(event.target.checked)}
                className="mt-0.5 rounded text-primary"
              />
              <span>
                I agree to store derived motion landmarks on this device. The camera records a silent
                preview, but the raw video is never uploaded.
              </span>
            </label>

            <button
              type="button"
              onClick={capturePersonal}
              disabled={personalCaptureStage !== 'idle'}
              className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary to-cyan-500 px-4 py-3 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/15 disabled:opacity-50"
            >
              {personalCaptureStage !== 'idle' ? (
                <>
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                  {personalCaptureStage === 'countdown'
                    ? `Starting in ${personalCaptureCountdown}…`
                    : 'Recording silent clip…'}
                </>
              ) : (
                <>
                  <Video className="h-4 w-4" />
                  Record 3-Second Sign Sample
                </>
              )}
            </button>

            {personalNotice && (
              <p role="status" className="mt-3 rounded-lg bg-primary/5 p-3 text-xs text-primary font-medium">
                {personalNotice}
              </p>
            )}
            {personalVideoUrl && (
              <div className="mt-3 rounded-xl border border-border bg-muted/30 p-3">
                <p className="mb-2 text-xs font-semibold">Latest silent sample (preview)</p>
                <video src={personalVideoUrl} controls playsInline className="max-h-44 w-full rounded-lg bg-black" />
              </div>
            )}
          </section>

          <section>
            <h3 className="text-sm font-bold uppercase tracking-wider mb-3">Enrolled Custom Signs</h3>
            {personalNames.length ? (
              <ul className="space-y-2">
                {personalNames.map(name => (
                  <li
                    key={name}
                    className="flex items-center justify-between gap-3 rounded-xl border border-border bg-background p-3.5"
                  >
                    <div>
                      <p className="font-bold text-sm capitalize">{name}</p>
                      <p
                        className={`text-xs ${
                          personalCounts[name] >= MIN_EXAMPLES_PER_SIGN
                            ? 'text-emerald-500 font-semibold'
                            : 'text-muted-foreground'
                        }`}
                      >
                        {personalCounts[name]}/{MIN_EXAMPLES_PER_SIGN} samples ·{' '}
                        {personalCounts[name] >= MIN_EXAMPLES_PER_SIGN ? 'Ready for Live Use' : 'Collecting'}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => removePersonal(name)}
                      className="rounded-lg p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition"
                      aria-label={`Delete private sign ${name}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="rounded-xl border border-dashed border-border bg-muted/30 p-6 text-center text-xs text-muted-foreground">
                No personal signs saved yet. Enter a label above and record 5 quick samples!
              </p>
            )}
          </section>
        </div>
      </details>
    </div>
  )
}
