import { useRef, useEffect } from 'react'
import { Button } from './ui/Button'

interface SignCameraProps {
  videoRef: React.RefObject<HTMLVideoElement | null>
  isActive: boolean
  onStart: () => void
  onStop: () => void
  error?: string | null
  isLoading?: boolean
  currentLabel?: string | null
  confidence?: number
}

export function SignCamera({
  videoRef,
  isActive,
  onStart,
  onStop,
  error,
  isLoading,
  currentLabel,
  confidence,
}: SignCameraProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (!isActive || !videoRef.current || !canvasRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const draw = () => {
      const video = videoRef.current
      if (!video || video.paused || video.ended) return

      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      ctx.drawImage(video, 0, 0)

      requestAnimationFrame(draw)
    }

    const animationId = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(animationId)
  }, [isActive, videoRef])

  return (
    <div className="relative bg-black rounded-xl overflow-hidden aspect-video">
      <video
        ref={videoRef}
        className="w-full h-full object-cover"
        playsInline
        muted
      />

      {!isActive && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80">
          <div className="text-center text-white p-8">
            <div className="w-20 h-20 mx-auto mb-4 bg-gray-700 rounded-full flex items-center justify-center text-3xl">
              📷
            </div>
            <h3 className="text-xl font-semibold mb-2">Camera Preview</h3>
            <p className="text-sm text-gray-300 mb-6 max-w-sm">
              Request camera permission when you start recognition. Your video never leaves your device.
            </p>
            <Button onClick={onStart} size="lg" className="w-full">
              Start Recognition
            </Button>
          </div>
        </div>
      )}

      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/60">
          <div className="text-center text-white">
            <div className="animate-spin w-8 h-8 border-2 border-white border-t-transparent rounded-full mx-auto mb-3" />
            <p className="text-sm">Loading model...</p>
          </div>
        </div>
      )}

      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-red-950/90 p-8">
          <div className="text-center text-white max-w-sm">
            <p className="text-lg font-semibold mb-2">Camera Error</p>
            <p className="text-sm text-red-200 mb-4">{error}</p>
            <Button onClick={onStart} variant="outline" className="text-white border-white">
              Try Again
            </Button>
          </div>
        </div>
      )}

      {isActive && currentLabel && (
        <div className="absolute top-4 left-4 bg-black/70 backdrop-blur px-4 py-2 rounded-lg">
          <p className="text-white text-sm font-medium">{currentLabel}</p>
          <p className="text-white/70 text-xs">{Math.round((confidence || 0) * 100)}% confidence</p>
        </div>
      )}

      {isActive && (
        <div className="absolute bottom-4 right-4 flex gap-2">
          <Button onClick={onStop} variant="secondary" size="sm">
            Stop
          </Button>
        </div>
      )}

      <canvas ref={canvasRef} className="hidden" />
    </div>
  )
}
