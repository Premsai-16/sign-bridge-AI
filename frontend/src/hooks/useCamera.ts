import { useCallback, useRef, useState, useEffect } from 'react'

export interface CameraState {
  isActive: boolean
  isLoading: boolean
  error: string | null
  stream: MediaStream | null
}

export function useCamera() {
  const [state, setState] = useState<CameraState>({
    isActive: false,
    isLoading: false,
    error: null,
    stream: null,
  })
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  useEffect(() => {
    const video = videoRef.current
    const stream = state.stream
    if (!video || !stream) return
    video.srcObject = stream
    void video.play().catch(() => {
      setState(current => ({
        ...current,
        isActive: false,
        error: 'The camera opened, but the video preview could not start. Check browser permissions and try again.',
      }))
    })
  }, [state.stream])

  const start = useCallback(async (): Promise<boolean> => {
    setState(s => ({ ...s, isLoading: true, error: null }))

    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error('Camera access is unavailable. Open this site on localhost or use HTTPS in a supported browser.')
      }

      const quality = localStorage.getItem('signbridge-camera-quality') || '720p'
      const dimensions = quality === '1080p' ? [1920, 1080] : quality === '480p' ? [854, 480] : [1280, 720]
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: dimensions[0] },
          height: { ideal: dimensions[1] },
          facingMode: 'user',
        },
        audio: false,
      })

      streamRef.current = stream

      setState({
        isActive: true,
        isLoading: false,
        error: null,
        stream,
      })
      return true
    } catch (err) {
      setState({
        isActive: false,
        isLoading: false,
        error: err instanceof DOMException && err.name === 'NotAllowedError'
          ? 'Camera permission was denied. Allow camera access in your browser settings and try again.'
          : err instanceof DOMException && err.name === 'NotFoundError'
            ? 'No camera was found. Connect a camera and try again.'
            : err instanceof Error ? err.message : 'Camera access failed. Please try again.',
        stream: null,
      })
      return false
    }
  }, [])

  const stop = useCallback(() => {
    streamRef.current?.getTracks().forEach(track => track.stop())
    streamRef.current = null
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
    setState({
      isActive: false,
      isLoading: false,
      error: null,
      stream: null,
    })
  }, [])

  useEffect(() => {
    return () => {
      stop()
    }
  }, [stop])

  return {
    ...state,
    videoRef,
    start,
    stop,
  }
}
