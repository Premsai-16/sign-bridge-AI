import { useState, useRef, useEffect, useMemo } from 'react'
import {
  Camera,
  CheckCircle2,
  Trash2,
  Plus,
  Play,
  Layers,
  Zap,
} from 'lucide-react'
import { useCamera } from '../hooks/useCamera'
import { useMediaPipe } from '../hooks/useMediaPipe'
import HandOverlay from '../components/HandOverlay'
import {
  loadSignExamples,
  saveSignSequence,
  deleteSignExampleById,
  deleteSignExamples,
  exampleCounts,
  getExamplesForLabel,
  predictPersonalSign,
  type SignExample,
} from '../lib/personalized-signs'
import { speakText } from '../lib/speech'

const PRESET_SIGNS = [
  { name: 'Water', hindi: 'पानी', desc: 'Thirst or asking for water' },
  { name: 'Help', hindi: 'मदद', desc: 'Emergency assistance' },
  { name: 'Thank You', hindi: 'धन्यवाद', desc: 'Polite appreciation' },
  { name: 'Doctor', hindi: 'डॉक्टर', desc: 'Medical attention' },
  { name: 'Hello', hindi: 'नमस्ते', desc: 'Greeting wave' },
  { name: 'Hungry', hindi: 'भूख', desc: 'Food or meals' },
  { name: 'Medicine', hindi: 'दवा', desc: 'Prescription needed' },
  { name: 'Home', hindi: 'घर', desc: 'Going home or residence' },
]

export default function SignTrainingStudio() {
  const [examples, setExamples] = useState<SignExample[]>(loadSignExamples)
  const [activeLabel, setActiveLabel] = useState('Water')
  const [mode, setMode] = useState<'train' | 'test'>('train')
  const [isCapturing, setIsCapturing] = useState(false)
  const [captureProgress, setCaptureProgress] = useState(0) // 0 to 100%
  const [notice, setNotice] = useState('')
  const [justCapturedId, setJustCapturedId] = useState<string | null>(null)

  const { isActive, start, stop, videoRef } = useCamera()
  const detector = useMediaPipe(videoRef, isActive)

  const captureFramesRef = useRef<number[][]>([])
  const captureTimerRef = useRef<number | null>(null)
  const captureActionRef = useRef<() => void>(() => {})

  // Filter examples for current label
  const labelExamples = useMemo(
    () => getExamplesForLabel(examples, activeLabel),
    [examples, activeLabel]
  )

  const counts = useMemo(() => exampleCounts(examples), [examples])
  const currentCount = labelExamples.length
  const TARGET_COUNT = 10
  const isFullyTrained = currentCount >= TARGET_COUNT

  // Real-time prediction when in "Test Mode"
  const testPrediction = useMemo(() => {
    if (!isActive || !detector.hands || mode !== 'test' || examples.length === 0) return null
    return predictPersonalSign(examples, detector.sequence.length ? detector.sequence : [detector.features])
  }, [detector.features, detector.hands, detector.sequence, examples, isActive, mode])

  // Collect frames during active 1-second capture
  useEffect(() => {
    if (isCapturing && detector.hands > 0 && detector.features.length === 126) {
      captureFramesRef.current.push([...detector.features])
    }
  }, [isCapturing, detector.features, detector.hands])

  // Trigger 1-Second Fast Capture
  const handleFastCapture = () => {
    if (!activeLabel.trim()) {
      setNotice('Please enter or select a sign label first.')
      return
    }
    if (!isActive) {
      void start('user')
      setNotice('Camera starting... Position your hand in frame.')
      return
    }
    if (detector.hands === 0) {
      setNotice('⚠️ No hand detected. Hold your hand up in front of the camera.')
      return
    }

    captureFramesRef.current = []
    setIsCapturing(true)
    setCaptureProgress(0)
    setNotice('⚡ Capturing 1-second motion burst...')

    const startTime = performance.now()
    const DURATION = 1000 // Exact 1-second timer

    const progressInterval = window.setInterval(() => {
      const elapsed = performance.now() - startTime
      const pct = Math.min(100, Math.round((elapsed / DURATION) * 100))
      setCaptureProgress(pct)

      if (elapsed >= DURATION) {
        window.clearInterval(progressInterval)
        setIsCapturing(false)

        const captured = captureFramesRef.current
        captureFramesRef.current = []

        // If frames were captured, save immediately
        const framesToSave = captured.length > 0 ? captured : [detector.features]
        try {
          const updated = saveSignSequence(activeLabel, framesToSave)
          setExamples(updated)

          const newExamples = getExamplesForLabel(updated, activeLabel)
          const latest = newExamples[newExamples.length - 1]
          setJustCapturedId(latest?.id || null)

          speakText(`${activeLabel} sample ${newExamples.length}`, 'en-IN', 1.2)
          setNotice(`✓ Sample #${newExamples.length} saved successfully! (${framesToSave.length} frames recorded)`)

          setTimeout(() => setJustCapturedId(null), 2500)
        } catch (err) {
          setNotice(err instanceof Error ? err.message : 'Error saving sample.')
        }
      }
    }, 50)

    captureTimerRef.current = progressInterval
  }

  useEffect(() => { captureActionRef.current = handleFastCapture })

  // Keyboard shortcut: Spacebar captures sample
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && (e.target as HTMLElement).tagName !== 'INPUT' && (e.target as HTMLElement).tagName !== 'TEXTAREA') {
        e.preventDefault()
        if (!isCapturing && mode === 'train') {
          captureActionRef.current()
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isCapturing, mode])

  // Delete an individual sample
  const handleDeleteSample = (id?: string) => {
    if (!id) return
    const updated = deleteSignExampleById(id)
    setExamples(updated)
    setNotice('Sample removed.')
  }

  // Reset/Delete entire sign
  const handleResetSign = () => {
    if (confirm(`Delete all ${currentCount} samples for "${activeLabel}"?`)) {
      const updated = deleteSignExamples(activeLabel)
      setExamples(updated)
      setNotice(`All samples for "${activeLabel}" cleared.`)
    }
  }

  return (
    <div className="container max-w-7xl py-8">
      {/* Studio Header */}
      <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-violet-500/30 bg-violet-500/10 px-4 py-1.5 text-xs font-bold text-violet-400 mb-3 shadow-sm">
            <Zap className="h-3.5 w-3.5" />
            <span>High-Speed 1-Second AI Sample Recorder</span>
          </div>
          <h1 className="font-display text-3xl sm:text-5xl font-extrabold tracking-tight text-white">
            Sign Training Studio
          </h1>
          <p className="mt-1 text-sm sm:text-base text-slate-400 max-w-2xl">
            Train any custom gesture with rapid 1-second burst captures. Save up to 10 verified samples
            per sign with real-time on-device classification.
          </p>
        </div>

        {/* Mode Switcher: Train vs Test */}
        <div className="flex rounded-2xl bg-slate-900/80 p-1.5 border border-white/10 shadow-lg backdrop-blur-xl">
          <button
            onClick={() => setMode('train')}
            className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-xs font-bold transition ${
              mode === 'train'
                ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Plus className="h-4 w-4" />
            Train Samples ({currentCount}/10)
          </button>
          <button
            onClick={() => setMode('test')}
            className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-xs font-bold transition ${
              mode === 'test'
                ? 'bg-gradient-to-r from-emerald-600 to-teal-500 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Play className="h-4 w-4" />
            Test Live Model
          </button>
        </div>
      </div>

      {/* Main Studio Console */}
      <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        {/* Left Column: Vision Feed & Capture Controls */}
        <div className="flex flex-col rounded-3xl border border-white/10 bg-slate-900/60 backdrop-blur-2xl shadow-2xl overflow-hidden">
          {/* Camera Header Bar */}
          <div className="flex items-center justify-between border-b border-white/10 bg-slate-950/40 px-6 py-4">
            <div className="flex items-center gap-3">
              <span className="flex h-3 w-3 relative">
                <span
                  className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                    isActive ? 'bg-cyan-400' : 'bg-rose-400'
                  }`}
                />
                <span
                  className={`relative inline-flex rounded-full h-3 w-3 ${
                    isActive ? 'bg-cyan-500' : 'bg-rose-500'
                  }`}
                />
              </span>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  Target: <span className="text-white text-sm font-extrabold">{activeLabel}</span>
                </p>
                <p className="text-[11px] text-slate-400">
                  {detector.hands > 0 ? `Tracking ${detector.hands} Hand(s)` : 'Awaiting Hand in Frame'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {isActive ? (
                <button
                  onClick={stop}
                  className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-1.5 text-xs font-semibold text-rose-400 hover:bg-rose-500/20 transition"
                >
                  Turn Off
                </button>
              ) : (
                <button
                  onClick={() => start('user')}
                  className="rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-md hover:opacity-90 transition"
                >
                  Start Camera
                </button>
              )}
            </div>
          </div>

          {/* Camera Stage */}
          <div className="relative aspect-video w-full bg-slate-950 flex items-center justify-center overflow-hidden">
            <video
              ref={videoRef}
              playsInline
              muted
              autoPlay
              className={`h-full w-full object-cover transform -scale-x-100 ${
                isActive ? '' : 'hidden'
              }`}
            />

            {isActive && (
              <HandOverlay
                hands={detector.rawHands}
                prediction={detector.geometricPrediction}
                activeSign={mode === 'test' ? testPrediction?.label : activeLabel}
                confidence={mode === 'test' ? testPrediction?.confidence : 0.95}
                mirrored={true}
              />
            )}

            {/* Offline / Turn On Prompt */}
            {!isActive && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/90 p-6 text-center z-10">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-500/20 text-indigo-400 mb-4 shadow-inner">
                  <Camera className="h-8 w-8" />
                </div>
                <h3 className="font-display text-xl font-bold text-white mb-2">Camera Off</h3>
                <p className="text-xs text-slate-400 max-w-sm mb-6">
                  Position your webcam to capture your hand gestures. Video is processed locally in your
                  browser.
                </p>
                <button
                  onClick={() => start('user')}
                  className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 px-6 py-3 text-sm font-bold text-white shadow-xl shadow-indigo-600/30 hover:scale-105 transition"
                >
                  <Camera className="h-4 w-4" />
                  Enable Webcam & Begin
                </button>
              </div>
            )}

            {/* High-Tech 1-Second Capture Sweep Overlay */}
            {isCapturing && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/70 backdrop-blur-xs z-30 animate-in fade-in duration-100">
                <div className="relative flex h-28 w-28 items-center justify-center">
                  <svg className="h-full w-full -rotate-90 transform" viewBox="0 0 100 100">
                    <circle
                      cx="50"
                      cy="50"
                      r="42"
                      className="stroke-white/20"
                      strokeWidth="8"
                      fill="transparent"
                    />
                    <circle
                      cx="50"
                      cy="50"
                      r="42"
                      className="stroke-cyan-400 transition-all duration-75"
                      strokeWidth="8"
                      strokeDasharray="264"
                      strokeDashoffset={264 - (264 * captureProgress) / 100}
                      strokeLinecap="round"
                      fill="transparent"
                    />
                  </svg>
                  <span className="absolute font-display text-2xl font-black text-cyan-400">
                    {Math.max(1, Math.round(((100 - captureProgress) / 100) * 10)) / 10}s
                  </span>
                </div>
                <p className="mt-3 text-sm font-bold text-white uppercase tracking-wider animate-pulse">
                  Recording Sample #{currentCount + 1}...
                </p>
              </div>
            )}

            {/* Test Mode Recognition Badge */}
            {mode === 'test' && isActive && (
              <div className="absolute inset-x-4 bottom-4 z-20 rounded-2xl border border-cyan-500/40 bg-slate-950/90 backdrop-blur-md p-4 shadow-2xl">
                <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                  <span>AI Model Classification</span>
                  <span className="text-cyan-400 font-bold">
                    {testPrediction ? `${Math.round(testPrediction.confidence * 100)}% Match` : 'Detecting...'}
                  </span>
                </div>
                <p className="font-display text-2xl font-extrabold capitalize text-white">
                  {testPrediction?.label || 'Hold your sign in frame...'}
                </p>
              </div>
            )}
          </div>

          {/* Rapid Capture Action Bar */}
          <div className="border-t border-white/10 bg-slate-950/30 p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Active Sign Label
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <input
                    type="text"
                    value={activeLabel}
                    onChange={e => setActiveLabel(e.target.value)}
                    placeholder="e.g. Water, Doctor, Family"
                    className="rounded-xl border border-white/15 bg-slate-900 px-4 py-2 text-sm font-bold text-white focus:outline-none focus:ring-2 focus:ring-violet-500 shadow-inner"
                  />
                  {currentCount > 0 && (
                    <button
                      onClick={handleResetSign}
                      className="rounded-xl border border-white/10 p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition"
                      title="Clear all samples for this sign"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Progress indicator */}
              <div className="text-right">
                <span className="text-xs text-slate-400 block font-medium">Dataset Completeness</span>
                <span
                  className={`font-display text-xl font-extrabold ${
                    isFullyTrained ? 'text-emerald-400' : 'text-violet-400'
                  }`}
                >
                  {currentCount} / {TARGET_COUNT} Samples
                </span>
              </div>
            </div>

            {/* Big 1-Second Capture Button */}
            {mode === 'train' && (
              <button
                type="button"
                onClick={handleFastCapture}
                disabled={isCapturing}
                className="group relative flex w-full items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-violet-600 via-indigo-600 to-cyan-500 p-4 text-base font-extrabold text-white shadow-xl shadow-indigo-600/30 hover:opacity-95 hover:shadow-cyan-500/20 transition active:scale-[0.98] disabled:opacity-50"
              >
                <Zap className="h-5 w-5 text-yellow-300 animate-pulse" />
                <span>
                  {isCapturing
                    ? 'Capturing 1s Motion...'
                    : `Capture Sample #${currentCount + 1} (1-Second Burst)`}
                </span>
                <span className="rounded-lg bg-black/25 px-2 py-0.5 text-xs font-semibold text-white/80">
                  Spacebar ␣
                </span>
              </button>
            )}

            {notice && (
              <p className="rounded-xl bg-violet-500/10 border border-violet-500/20 px-4 py-2.5 text-xs font-bold text-violet-300 animate-in fade-in">
                {notice}
              </p>
            )}
          </div>
        </div>

        {/* Right Column: Verified Saved Sample Deck */}
        <div className="flex flex-col gap-6">
          {/* Sample Reel Container */}
          <div className="flex flex-col rounded-3xl border border-white/10 bg-slate-900/60 backdrop-blur-2xl p-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-4">
              <div>
                <h3 className="font-display text-xl font-extrabold text-white flex items-center gap-2">
                  <Layers className="h-5 w-5 text-violet-400" />
                  Saved Samples Reel
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Every recorded sample is saved directly and shown below.
                </p>
              </div>

              <span
                className={`rounded-full px-3 py-1 text-xs font-extrabold uppercase tracking-wider ${
                  isFullyTrained
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'bg-violet-500/20 text-violet-400 border border-violet-500/30'
                }`}
              >
                {isFullyTrained ? 'Ready for Deployment' : `${TARGET_COUNT - currentCount} More Needed`}
              </span>
            </div>

            {/* List of saved samples */}
            <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
              {labelExamples.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-white/15 bg-white/5 p-8 text-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-slate-300 mx-auto mb-3">
                    <Plus className="h-6 w-6" />
                  </div>
                  <p className="font-bold text-white text-sm">No samples saved for "{activeLabel}" yet</p>
                  <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                    Click "Capture Sample" above or hit Spacebar. Each 1-second burst will be saved and
                    stored right here.
                  </p>
                </div>
              ) : (
                labelExamples.map((ex, index) => {
                  const isJustCaptured = justCapturedId === ex.id

                  return (
                    <div
                      key={ex.id || index}
                      className={`flex items-center justify-between rounded-2xl p-3.5 border transition duration-200 ${
                        isJustCaptured
                          ? 'border-cyan-400 bg-cyan-500/20 shadow-lg shadow-cyan-500/20 scale-[1.02]'
                          : 'border-white/10 bg-slate-950/60 hover:border-violet-500/40'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-violet-600/30 text-violet-300 font-extrabold text-xs border border-violet-500/30">
                          #{index + 1}
                        </span>
                        <div>
                          <p className="text-sm font-bold text-white flex items-center gap-2">
                            {ex.label}
                            <span className="inline-flex items-center text-[10px] text-emerald-400 font-semibold gap-0.5">
                              <CheckCircle2 className="h-3 w-3" /> Saved
                            </span>
                          </p>
                          <p className="text-[11px] text-slate-400">
                            {new Date(ex.createdAt).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                              second: '2-digit',
                            })}{' '}
                            · {ex.frames?.length || 12} landmark frames
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={() => handleDeleteSample(ex.id)}
                        className="rounded-xl p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition"
                        title="Delete this sample"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  )
                })
              )}
            </div>
          </div>

          {/* Sign Preset Quick Chooser */}
          <div className="rounded-3xl border border-white/10 bg-slate-900/60 backdrop-blur-2xl p-6 shadow-xl">
            <h4 className="font-display font-bold text-white text-sm mb-3">
              Quick Preset Signs to Train
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {PRESET_SIGNS.map(preset => {
                const sampleCount = counts[preset.name.toLowerCase()] || 0
                const isSelected = activeLabel.toLowerCase() === preset.name.toLowerCase()

                return (
                  <button
                    key={preset.name}
                    onClick={() => {
                      setActiveLabel(preset.name)
                      setNotice(`Selected "${preset.name}". Press Capture to record sample.`)
                    }}
                    className={`flex flex-col text-left rounded-xl p-2.5 border transition ${
                      isSelected
                        ? 'border-violet-500 bg-violet-500/20 text-white font-bold'
                        : 'border-white/10 bg-slate-950/40 text-slate-300 hover:bg-white/5'
                    }`}
                  >
                    <span className="text-xs font-bold">{preset.name}</span>
                    <span className="text-[10px] text-slate-400">
                      {sampleCount >= 10 ? '✓ 10/10 Trained' : `${sampleCount}/10 Samples`}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
