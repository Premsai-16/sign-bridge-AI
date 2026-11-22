import { useEffect, useCallback } from 'react'
import { Camera, Volume2, Pause, Sparkles } from 'lucide-react'
import { useCamera } from '../hooks/useCamera'
import { useSignRecognition } from '../hooks/useSignRecognition'
import { useMediaPipe } from '../hooks/useMediaPipe'
import HandOverlay from '../components/HandOverlay'

export default function SignIntelligence() {
  const { isActive: cameraActive, isLoading: cameraLoading, error, start: startCamera, stop: stopCamera, videoRef } = useCamera()
  const detector = useMediaPipe(videoRef, cameraActive)
  const {
    isActive: recognitionActive,
    transcript,
    confidence,
    start: startRecognition,
    stop: stopRecognition,
    clearTranscript,
    speak,
    processFrame,
  } = useSignRecognition()

  const isActive = cameraActive && recognitionActive && !cameraLoading

  useEffect(() => {
    if (!isActive) {
      clearTranscript()
    }
  }, [isActive, clearTranscript])

  // Process detected hand frames into recognition
  useEffect(() => {
    if (!isActive || !detector.geometricPrediction) return
    processFrame(detector.geometricPrediction.label.split('/')[0].trim(), detector.geometricPrediction.confidence)
  }, [detector.geometricPrediction, isActive, processFrame])

  const handleStop = useCallback(() => {
    stopRecognition()
    stopCamera()
  }, [stopRecognition, stopCamera])

  const handleSpeak = useCallback(() => {
    if (transcript.length > 0) {
      speak(transcript.join(', '))
    }
  }, [transcript, speak])

  return (
    <div className="container py-8 max-w-7xl">
      <div className="flex flex-col gap-3 mb-6">
        <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3.5 py-1.5 text-xs font-semibold text-primary w-fit">
          <Sparkles className="h-3.5 w-3.5" />
          <span>Computer Vision Sign Telemetry</span>
        </div>
        <h1 className="font-display text-3xl font-bold tracking-tight">Sign Intelligence</h1>
        <p className="text-muted-foreground max-w-2xl text-sm sm:text-base">
          Hands-free Indian Sign Language recognition with continuous landmark tracking, sign-to-text assembly, and automated speech synthesis.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border border-border bg-card overflow-hidden shadow-lg flex flex-col">
          <div className="relative aspect-video bg-black overflow-hidden flex items-center justify-center">
            {!isActive ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-slate-950 text-white">
                <div className="w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center text-primary mb-4 shadow-inner">
                  <Camera className="h-8 w-8" />
                </div>
                <h3 className="font-display text-xl font-bold mb-2">Camera Feed Inactive</h3>
                <p className="text-xs text-white/70 mb-4 max-w-xs">
                  Request camera permission to begin live sign language translation.
                </p>
                <button
                  onClick={async () => {
                    await startCamera()
                    if (!error) startRecognition()
                  }}
                  className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-primary to-secondary px-5 py-2.5 text-white font-semibold text-sm shadow-md"
                >
                  Start Recognition
                </button>
              </div>
            ) : (
              <div className="relative w-full h-full">
                <video
                  ref={videoRef}
                  className="w-full h-full object-cover transform -scale-x-100"
                  playsInline
                  muted
                />
                <HandOverlay
                  hands={detector.rawHands}
                  prediction={detector.geometricPrediction}
                  activeSign={detector.geometricPrediction?.label}
                  confidence={detector.geometricPrediction?.confidence}
                  mirrored={true}
                />
              </div>
            )}

            {cameraLoading && (
              <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
                <div className="text-center">
                  <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">Initializing camera...</p>
                </div>
              </div>
            )}

            {error && (
              <div className="absolute inset-0 bg-destructive/10 flex items-center justify-center p-4">
                <div className="text-center max-w-sm">
                  <h3 className="font-semibold mb-2 text-destructive">Camera Error</h3>
                  <p className="text-sm text-destructive/80">{error}</p>
                </div>
              </div>
            )}
          </div>

          <div className="p-4 border-t border-border bg-card">
            <div className="flex gap-3">
              {!isActive ? (
                <button
                  onClick={async () => {
                    await startCamera()
                    if (!error) startRecognition()
                  }}
                  className="flex-1 inline-flex items-center justify-center rounded-xl bg-primary text-primary-foreground px-4 py-2.5 text-sm font-semibold hover:bg-primary/90 transition shadow-sm"
                >
                  <Camera className="h-4 w-4 mr-2" />
                  Start Recognition
                </button>
              ) : (
                <>
                  <button
                    onClick={handleStop}
                    className="flex-1 inline-flex items-center justify-center rounded-xl border border-destructive px-4 py-2.5 text-sm font-semibold text-destructive hover:bg-destructive/10 transition"
                  >
                    <Pause className="h-4 w-4 mr-2" />
                    Pause
                  </button>
                  <button
                    onClick={handleSpeak}
                    disabled={transcript.length === 0}
                    className="flex-1 inline-flex items-center justify-center rounded-xl bg-secondary text-secondary-foreground px-4 py-2.5 text-sm font-semibold hover:bg-secondary/90 transition disabled:opacity-40"
                  >
                    <Volume2 className="h-4 w-4 mr-2" />
                    Speak
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
            <h2 className="font-display text-xl font-bold mb-3">Live Transcript</h2>
            <div className="min-h-[140px] bg-muted/40 rounded-2xl p-4 font-mono text-sm break-words border border-border">
              {transcript.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {transcript.map((word, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center px-3 py-1 bg-primary/10 text-primary border border-primary/20 rounded-xl text-xs font-semibold"
                    >
                      {word}
                    </span>
                  ))}
                </div>
              ) : (
                <span className="text-muted-foreground text-xs sm:text-sm">
                  Recognized signs will appear here automatically...
                </span>
              )}
            </div>
            {confidence > 0 && (
              <div className="mt-3 text-xs font-semibold text-primary">
                Confidence: {Math.round(confidence * 100)}%
              </div>
            )}
          </div>

          <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
            <h3 className="font-display text-lg font-bold mb-3">Model Telemetry</h3>
            <div className="grid gap-3 text-xs sm:text-sm">
              <div className="flex justify-between border-b border-border pb-2">
                <span className="text-muted-foreground">Language Focus</span>
                <span className="font-bold">Indian Sign Language (ISL)</span>
              </div>
              <div className="flex justify-between border-b border-border pb-2">
                <span className="text-muted-foreground">Tracking Mode</span>
                <span className="font-bold">MediaPipe Tasks Vision + Geometric Engine</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Engine Status</span>
                <span
                  className={`font-bold ${
                    isActive ? 'text-emerald-500' : 'text-muted-foreground'
                  }`}
                >
                  {isActive ? '● Live Inferencing' : '○ Standby'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
