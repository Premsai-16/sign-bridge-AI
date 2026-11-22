import { useEffect, useRef, useState } from 'react'
import type { HandLandmarker as HandLandmarkerInstance } from '@mediapipe/tasks-vision'
import { classifyHandGesture, type DetectedHandInfo, type GeometricSignPrediction } from '../lib/gesture-classifier'

export interface HandDetection {
  inferenceMs: number
  features: number[]
  sequence: number[][]
  modelFeatures: number[]
  hands: number
  rawHands: DetectedHandInfo[]
  geometricPrediction: GeometricSignPrediction | null
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
  const lastVideoTimeRef = useRef(-1)
  const animationFrameRef = useRef(0)
  const resetSequenceRef = useRef(true)
  const [state, setState] = useState<HandDetection>({
    inferenceMs: 0,
    features: [],
    sequence: [],
    modelFeatures: [],
    hands: 0,
    rawHands: [],
    geometricPrediction: null,
    ready: false,
    error: null,
  })

  useEffect(() => {
    const controller = new AbortController()
    const load = async () => {
      try {
        const { FilesetResolver, HandLandmarker } = await import('@mediapipe/tasks-vision')
        let fileset
        try {
          fileset = await FilesetResolver.forVisionTasks('/mediapipe/wasm')
        } catch {
          // Keep the fallback on the same version as the installed JS bundle.
          fileset = await FilesetResolver.forVisionTasks('https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.2.3/wasm')
        }

        const options = {
          runningMode: 'VIDEO',
          numHands: 2,
          minHandDetectionConfidence: 0.55,
          minHandPresenceConfidence: 0.55,
          minTrackingConfidence: 0.55,
        } as const
        const create = (delegate: 'GPU' | 'CPU') =>
          HandLandmarker.createFromOptions(fileset, {
            ...options,
            baseOptions: { modelAssetPath: '/models/hand_landmarker.task', delegate },
          })
        const created = await create('GPU').catch(() => create('CPU'))
        if (controller.signal.aborted) {
          created.close()
          return
        }
        detectorRef.current = created
        setState(current => ({ ...current, ready: true, error: null }))
      } catch (err) {
        if (!controller.signal.aborted) {
          setState(current => ({
            ...current,
            ready: false,
            error: err instanceof Error ? err.message : 'Hand detection could not initialize.',
          }))
        }
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
    if (!enabled || !state.ready) {
      if (!enabled) resetSequenceRef.current = true
      return
    }
    const detect = (time: number) => {
      const video = videoRef.current
      const detector = detectorRef.current
      if (video && detector && video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA && video.currentTime !== lastVideoTimeRef.current && time - lastDetectionRef.current >= 45) {
        lastDetectionRef.current = time
        lastVideoTimeRef.current = video.currentTime
        try {
          const startedAt = performance.now()
          const result = detector.detectForVideo(video, time)
          const inferenceMs = performance.now() - startedAt
          const detectedHandsList: DetectedHandInfo[] = result.landmarks.map((points, index) => ({
            label: result.handedness[index]?.[0]?.categoryName || `Hand ${index + 1}`,
            score: result.handedness[index]?.[0]?.score || 0.8,
            landmarks: points,
          }))

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

          const geomPred = classifyHandGesture(detectedHandsList)
          const resetSequence = resetSequenceRef.current
          resetSequenceRef.current = false

          setState(current => ({
            ...current,
            inferenceMs,
            error: null,
            features: personalHands.length ? leftFirst : [],
            sequence: personalHands.length ? [...(resetSequence ? [] : current.sequence), leftFirst].slice(-40) : [],
            modelFeatures: modelHands.length ? rightFirst : [],
            hands: detectedHandsList.length,
            rawHands: detectedHandsList,
            geometricPrediction: geomPred,
          }))
        } catch {
          setState(current => ({
            ...current,
            features: [],
            sequence: [],
            modelFeatures: [],
            hands: 0,
            rawHands: [],
            geometricPrediction: null,
            error: 'Could not process the camera frame.',
          }))
        }
      }
      animationFrameRef.current = requestAnimationFrame(detect)
    }
    animationFrameRef.current = requestAnimationFrame(detect)
    return () => cancelAnimationFrame(animationFrameRef.current)
  }, [enabled, state.ready, videoRef])

  return state
}
