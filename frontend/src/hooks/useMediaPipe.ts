import { useEffect, useRef, useState } from 'react'
import type { HandLandmarker as HandLandmarkerInstance } from '@mediapipe/tasks-vision'

export interface HandDetection {
  features: number[]
  modelFeatures: number[]
  hands: number
  ready: boolean
  error: string | null
}

function normalizeHand(points: Array<{ x: number; y: number; z: number }>): number[] {
  const wrist = points[0]
  const centered = points.map(point => [point.x - wrist.x, point.y - wrist.y, point.z - wrist.z])
  const scale = Math.max(...centered.map(point => Math.hypot(point[0], point[1], point[2])), 1e-6)
  return centered.flatMap(point => point.map(value => value / scale))
}

export function useMediaPipe(videoRef: React.RefObject<HTMLVideoElement | null>, enabled: boolean): HandDetection {
  const detectorRef = useRef<HandLandmarkerInstance | null>(null)
  const lastDetectionRef = useRef(0)
  const animationFrameRef = useRef(0)
  const [state, setState] = useState<HandDetection>({ features: [], modelFeatures: [], hands: 0, ready: false, error: null })

  useEffect(() => {
    const controller = new AbortController()
    const load = async () => {
      try {
        const { FilesetResolver, HandLandmarker } = await import('@mediapipe/tasks-vision')
        const fileset = await FilesetResolver.forVisionTasks('/mediapipe/wasm')
        const options = {
          runningMode: 'VIDEO',
          numHands: 2,
          minHandDetectionConfidence: 0.55,
          minHandPresenceConfidence: 0.55,
          minTrackingConfidence: 0.55,
        } as const
        const create = (delegate: 'GPU' | 'CPU') => HandLandmarker.createFromOptions(fileset, { ...options, baseOptions: { modelAssetPath: '/models/hand_landmarker.task', delegate } })
        const created = await create('GPU').catch(() => create('CPU'))
        if (controller.signal.aborted) { created.close(); return }
        detectorRef.current = created
        setState(current => ({ ...current, ready: true, error: null }))
      } catch {
        if (!controller.signal.aborted) setState(current => ({ ...current, ready: false, error: 'Hand detection could not initialize. Check that the model assets loaded, then reload the page.' }))
      }
    }
    void load()
    return () => {
      controller.abort()
      detectorRef.current?.close()
      detectorRef.current = null
    }
  }, [])

  useEffect(() => {
    if (!enabled || !state.ready) return
    const detect = (time: number) => {
      const video = videoRef.current
      const detector = detectorRef.current
      if (video && detector && video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA && time - lastDetectionRef.current >= 100) {
        lastDetectionRef.current = time
        try {
          const result = detector.detectForVideo(video, time)
          const personalHands = result.worldLandmarks.map((points, index) => ({
            label: result.handedness[index]?.[0]?.categoryName || `hand-${index}`,
            features: normalizeHand(points),
          })).sort((a, b) => a.label.localeCompare(b.label))
          const modelHands = result.landmarks.map((points, index) => ({
            label: result.handedness[index]?.[0]?.categoryName || `hand-${index}`,
            features: normalizeHand(points),
          }))
          const personalByLabel = new Map(personalHands.map(item => [item.label, item.features]))
          const modelByLabel = new Map(modelHands.map(item => [item.label, item.features]))
          const leftFirst = [...(personalByLabel.get('Left') || Array(63).fill(0)), ...(personalByLabel.get('Right') || Array(63).fill(0))]
          const rightFirst = [...(modelByLabel.get('Right') || Array(63).fill(0)), ...(modelByLabel.get('Left') || Array(63).fill(0))]
          setState(current => ({ ...current, features: personalHands.length ? leftFirst : [], modelFeatures: modelHands.length ? rightFirst : [], hands: personalHands.length }))
        } catch {
          setState(current => ({ ...current, features: [], modelFeatures: [], hands: 0, error: 'Could not process the camera frame.' }))
        }
      }
      animationFrameRef.current = requestAnimationFrame(detect)
    }
    animationFrameRef.current = requestAnimationFrame(detect)
    return () => cancelAnimationFrame(animationFrameRef.current)
  }, [enabled, state.ready, videoRef])

  return state
}
