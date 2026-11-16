import { useEffect, useCallback } from 'react'
import { Camera, Volume2, Pause } from 'lucide-react'
import { useCamera } from '../hooks/useCamera'
import { useSignRecognition } from '../hooks/useSignRecognition'

export default function SignIntelligence() {
  const { isActive: cameraActive, isLoading: cameraLoading, error, start: startCamera, stop: stopCamera, videoRef } = useCamera()
  const {
    isActive: recognitionActive,
    transcript,
    confidence,
    start: startRecognition,
    stop: stopRecognition,
    clearTranscript,
    speak,
  } = useSignRecognition()

  const isActive = cameraActive && recognitionActive && !cameraLoading

  useEffect(() => {
    if (!isActive) {
      clearTranscript()
    }
  }, [isActive, cameraActive, recognitionActive, clearTranscript])

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
      <div className="flex flex-col gap-4 mb-6">
        <h1 className="font-display text-3xl font-bold tracking-tight">Sign Intelligence</h1>
        <p className="text-muted-foreground max-w-2xl">
          Hands-free ISL recognition with continuous sign-to-text and automatic speech output.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card overflow-hidden">
          <div className="relative aspect-video bg-background">
            {!isActive ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
                <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-2xl mb-4 flex-shrink-0">
                  <Camera className="h-8 w-8" />
                </div>
                <h3 className="font-display text-xl font-semibold mb-2">Camera Preview</h3>
                <p className="text-sm text-muted-foreground mb-4 max-w-xs">
                  Request camera permission to begin live sign language translation.
                </p>
                <button
                  onClick={async () => {
                    await startCamera()
                    if (!error) startRecognition()
                  }}
                  className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-primary to-secondary px-4 py-2 text-white font-medium"
                >
                  Start Recognition
                </button>
              </div>
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <video
                  ref={videoRef}
                  className="w-full h-full object-cover"
                  playsInline
                  muted
                />
                {transcript.length > 0 && (
                  <div className="absolute top-4 left-4 bg-black/70 backdrop-blur px-3 py-2 rounded-xl text-white">
                    <div className="font-medium text-sm">Speaking</div>
                  </div>
                )}
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

          <div className="p-4 border-t border-border">
            <div className="flex gap-3">
              {!isActive ? (
                <button
                  onClick={async () => {
                    await startCamera()
                    if (!error) startRecognition()
                  }}
                  className="flex-1 inline-flex items-center justify-center rounded-xl border border-border px-4 py-2 text-sm font-medium hover:bg-muted transition"
                >
                  <Camera className="h-4 w-4 mr-2" />
                  Start Recognition
                </button>
              ) : (
                <>
                  <button
                    onClick={handleStop}
                    className="flex-1 inline-flex items-center justify-center rounded-xl border border-destructive px-4 py-2 text-sm font-medium text-destructive hover:bg-destructive/10 transition"
                  >
                    <Pause className="h-4 w-4 mr-2" />
                    Pause
                  </button>
                  <button
                    onClick={handleSpeak}
                    disabled={transcript.length === 0}
                    className="flex-1 inline-flex items-center justify-center rounded-xl border border-border px-4 py-2 text-sm font-medium hover:bg-muted transition disabled:opacity-50 disabled:cursor-not-allowed"
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
          <div className="rounded-2xl border border-border bg-card p-6">
            <h2 className="font-display text-xl font-semibold mb-3">Live Transcript</h2>
            <div className="min-h-[150px] bg-muted/50 rounded-xl p-4 font-mono text-sm break-words">
              {transcript.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {transcript.map((word, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center px-2 py-1 bg-primary/10 text-primary rounded-lg text-xs font-medium"
                    >
                      {word}
                    </span>
                  ))}
                </div>
              ) : (
                <span className="text-muted-foreground">Transcript appears here as signs are recognized</span>
              )}
            </div>
            {confidence > 0 && (
              <div className="mt-3 text-xs text-muted-foreground">
                Confidence: {Math.round(confidence * 100)}%
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-border bg-card p-6">
            <h3 className="font-display text-lg font-semibold mb-3">Model Status</h3>
            <div className="grid gap-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Language</span>
                <span className="font-medium">Indian Sign Language (ISL)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Mode</span>
                <span className="font-medium">Personalized Enrollment</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status</span>
                <span className={`font-medium ${isActive ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'}`}>
                  {isActive ? 'Active' : 'Ready'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}