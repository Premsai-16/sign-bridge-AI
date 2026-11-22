import { useEffect, useRef, useState, useMemo } from 'react'

export interface AvatarPose {
  headTilt: number
  headNod: number
  leftArm: {
    shoulderAngle: number
    elbowAngle: number
    wristAngle: number
    fingers: [number, number, number, number, number] // 0 (closed) to 1 (extended)
  }
  rightArm: {
    shoulderAngle: number
    elbowAngle: number
    wristAngle: number
    fingers: [number, number, number, number, number]
  }
  expression: 'neutral' | 'smile' | 'focused' | 'talking'
}

const DEFAULT_REST_POSE: AvatarPose = {
  headTilt: 0,
  headNod: 0,
  leftArm: {
    shoulderAngle: 1.1,
    elbowAngle: 0.3,
    wristAngle: 0,
    fingers: [0.2, 0.2, 0.2, 0.2, 0.2],
  },
  rightArm: {
    shoulderAngle: 1.1,
    elbowAngle: 0.3,
    wristAngle: 0,
    fingers: [0.2, 0.2, 0.2, 0.2, 0.2],
  },
  expression: 'neutral',
}

// Letter finger configurations: [thumb, index, middle, ring, pinky]
const LETTER_FINGERS: Record<string, [number, number, number, number, number]> = {
  A: [0.2, 0, 0, 0, 0],
  B: [0, 1, 1, 1, 1],
  C: [0.5, 0.5, 0.5, 0.5, 0.5],
  D: [0, 1, 0, 0, 0],
  E: [0, 0.1, 0.1, 0.1, 0.1],
  F: [0, 0, 1, 1, 1],
  G: [1, 1, 0, 0, 0],
  H: [0.2, 1, 1, 0, 0],
  I: [0, 0, 0, 0, 1],
  J: [0, 0, 0, 0, 1],
  K: [0.8, 1, 0.8, 0, 0],
  L: [1, 1, 0, 0, 0],
  M: [0.3, 0.2, 0.2, 0.2, 0],
  N: [0.3, 0.2, 0.2, 0, 0],
  O: [0.3, 0.3, 0.3, 0.3, 0.3],
  P: [0.8, 1, 0.8, 0, 0],
  Q: [1, 1, 0, 0, 0],
  R: [0, 1, 1, 0, 0],
  S: [0.2, 0, 0, 0, 0],
  T: [0.5, 0, 0, 0, 0],
  U: [0, 1, 1, 0, 0],
  V: [0, 1, 1, 0, 0],
  W: [0, 1, 1, 1, 0],
  X: [0, 0.4, 0, 0, 0],
  Y: [1, 0, 0, 0, 1],
  Z: [0, 1, 0, 0, 0],
}

// Named phrases and their keyframe poses
export const PRESET_SIGNS: Record<
  string,
  { label: string; hindi: string; description: string; poses: AvatarPose[] }
> = {
  hello: {
    label: 'Hello / Welcome',
    hindi: 'नमस्ते / स्वागत है',
    description: 'Friendly open hand wave at head level with a warm welcoming smile',
    poses: [
      {
        headTilt: 0.05,
        headNod: 0.05,
        leftArm: { shoulderAngle: 1.1, elbowAngle: 0.3, wristAngle: 0, fingers: [0.2, 0.2, 0.2, 0.2, 0.2] },
        rightArm: { shoulderAngle: -0.6, elbowAngle: -1.7, wristAngle: -0.3, fingers: [1, 1, 1, 1, 1] },
        expression: 'smile',
      },
      {
        headTilt: -0.05,
        headNod: 0.02,
        leftArm: { shoulderAngle: 1.1, elbowAngle: 0.3, wristAngle: 0, fingers: [0.2, 0.2, 0.2, 0.2, 0.2] },
        rightArm: { shoulderAngle: -0.5, elbowAngle: -1.5, wristAngle: 0.3, fingers: [1, 1, 1, 1, 1] },
        expression: 'smile',
      },
      {
        headTilt: 0.05,
        headNod: 0.05,
        leftArm: { shoulderAngle: 1.1, elbowAngle: 0.3, wristAngle: 0, fingers: [0.2, 0.2, 0.2, 0.2, 0.2] },
        rightArm: { shoulderAngle: -0.6, elbowAngle: -1.7, wristAngle: -0.2, fingers: [1, 1, 1, 1, 1] },
        expression: 'smile',
      },
    ],
  },
  thankyou: {
    label: 'Thank You',
    hindi: 'धन्यवाद',
    description: 'Flat hand touching chin, then gracefully moving forward towards the viewer',
    poses: [
      {
        headTilt: 0,
        headNod: 0.1,
        leftArm: { shoulderAngle: 1.0, elbowAngle: 0.4, wristAngle: 0, fingers: [0.2, 0.2, 0.2, 0.2, 0.2] },
        rightArm: { shoulderAngle: -0.2, elbowAngle: -2.1, wristAngle: -0.1, fingers: [1, 1, 1, 1, 1] },
        expression: 'smile',
      },
      {
        headTilt: 0,
        headNod: 0.2,
        leftArm: { shoulderAngle: 1.0, elbowAngle: 0.4, wristAngle: 0, fingers: [0.2, 0.2, 0.2, 0.2, 0.2] },
        rightArm: { shoulderAngle: 0.4, elbowAngle: -1.1, wristAngle: 0.3, fingers: [1, 1, 1, 1, 1] },
        expression: 'smile',
      },
    ],
  },
  namaste: {
    label: 'Namaste',
    hindi: 'नमस्ते',
    description: 'Traditional two-handed joined palms gesture in front of chest',
    poses: [
      {
        headTilt: 0,
        headNod: 0.25,
        leftArm: { shoulderAngle: 0.2, elbowAngle: -1.5, wristAngle: -0.4, fingers: [1, 1, 1, 1, 1] },
        rightArm: { shoulderAngle: 0.2, elbowAngle: -1.5, wristAngle: -0.4, fingers: [1, 1, 1, 1, 1] },
        expression: 'smile',
      },
      {
        headTilt: 0,
        headNod: 0.35,
        leftArm: { shoulderAngle: 0.2, elbowAngle: -1.6, wristAngle: -0.4, fingers: [1, 1, 1, 1, 1] },
        rightArm: { shoulderAngle: 0.2, elbowAngle: -1.6, wristAngle: -0.4, fingers: [1, 1, 1, 1, 1] },
        expression: 'smile',
      },
    ],
  },
  love: {
    label: 'I Love You',
    hindi: 'आई लव यू',
    description: 'Hand raised displaying universal I Love You sign (thumb, index, pinky extended)',
    poses: [
      {
        headTilt: 0.1,
        headNod: 0.1,
        leftArm: { shoulderAngle: 1.1, elbowAngle: 0.3, wristAngle: 0, fingers: [0.2, 0.2, 0.2, 0.2, 0.2] },
        rightArm: { shoulderAngle: -0.4, elbowAngle: -1.8, wristAngle: 0, fingers: [1, 1, 0, 0, 1] },
        expression: 'smile',
      },
    ],
  },
  good: {
    label: 'Good / Yes',
    hindi: 'बहुत अच्छा / हाँ',
    description: 'Assertive thumbs-up gesture with supportive head nod',
    poses: [
      {
        headTilt: 0,
        headNod: 0.2,
        leftArm: { shoulderAngle: 1.1, elbowAngle: 0.3, wristAngle: 0, fingers: [0.2, 0.2, 0.2, 0.2, 0.2] },
        rightArm: { shoulderAngle: 0.1, elbowAngle: -1.4, wristAngle: -0.2, fingers: [1, 0, 0, 0, 0] },
        expression: 'smile',
      },
      {
        headTilt: 0,
        headNod: 0.3,
        leftArm: { shoulderAngle: 1.1, elbowAngle: 0.3, wristAngle: 0, fingers: [0.2, 0.2, 0.2, 0.2, 0.2] },
        rightArm: { shoulderAngle: 0.1, elbowAngle: -1.5, wristAngle: -0.2, fingers: [1, 0, 0, 0, 0] },
        expression: 'smile',
      },
    ],
  },
  help: {
    label: 'Help / Emergency',
    hindi: 'मदद चाहिए',
    description: 'Left palm flat facing up, right hand fist placed firmly on top',
    poses: [
      {
        headTilt: 0,
        headNod: 0.15,
        leftArm: { shoulderAngle: 0.3, elbowAngle: -1.3, wristAngle: 0.3, fingers: [1, 1, 1, 1, 1] },
        rightArm: { shoulderAngle: 0.2, elbowAngle: -1.5, wristAngle: -0.2, fingers: [0, 0, 0, 0, 0] },
        expression: 'focused',
      },
      {
        headTilt: 0,
        headNod: 0.25,
        leftArm: { shoulderAngle: 0.3, elbowAngle: -1.4, wristAngle: 0.3, fingers: [1, 1, 1, 1, 1] },
        rightArm: { shoulderAngle: 0.3, elbowAngle: -1.3, wristAngle: -0.2, fingers: [0, 0, 0, 0, 0] },
        expression: 'focused',
      },
    ],
  },
  water: {
    label: 'Water',
    hindi: 'पानी (Water)',
    description: 'Three fingers in W shape touching near mouth/chin',
    poses: [
      {
        headTilt: 0,
        headNod: 0.1,
        leftArm: { shoulderAngle: 1.1, elbowAngle: 0.3, wristAngle: 0, fingers: [0.2, 0.2, 0.2, 0.2, 0.2] },
        rightArm: { shoulderAngle: -0.1, elbowAngle: -2.0, wristAngle: 0.2, fingers: [0, 1, 1, 1, 0] },
        expression: 'focused',
      },
      {
        headTilt: 0,
        headNod: 0.15,
        leftArm: { shoulderAngle: 1.1, elbowAngle: 0.3, wristAngle: 0, fingers: [0.2, 0.2, 0.2, 0.2, 0.2] },
        rightArm: { shoulderAngle: -0.1, elbowAngle: -2.1, wristAngle: 0.2, fingers: [0, 1, 1, 1, 0] },
        expression: 'focused',
      },
    ],
  },
  peace: {
    label: 'Peace / Victory',
    hindi: 'शांति / विजय',
    description: 'V sign held steadily with smiling expression',
    poses: [
      {
        headTilt: 0.08,
        headNod: 0.1,
        leftArm: { shoulderAngle: 1.1, elbowAngle: 0.3, wristAngle: 0, fingers: [0.2, 0.2, 0.2, 0.2, 0.2] },
        rightArm: { shoulderAngle: -0.3, elbowAngle: -1.7, wristAngle: 0, fingers: [0, 1, 1, 0, 0] },
        expression: 'smile',
      },
    ],
  },
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}

function lerpPose(p1: AvatarPose, p2: AvatarPose, t: number): AvatarPose {
  return {
    headTilt: lerp(p1.headTilt, p2.headTilt, t),
    headNod: lerp(p1.headNod, p2.headNod, t),
    leftArm: {
      shoulderAngle: lerp(p1.leftArm.shoulderAngle, p2.leftArm.shoulderAngle, t),
      elbowAngle: lerp(p1.leftArm.elbowAngle, p2.leftArm.elbowAngle, t),
      wristAngle: lerp(p1.leftArm.wristAngle, p2.leftArm.wristAngle, t),
      fingers: p1.leftArm.fingers.map((f, i) => lerp(f, p2.leftArm.fingers[i], t)) as [number, number, number, number, number],
    },
    rightArm: {
      shoulderAngle: lerp(p1.rightArm.shoulderAngle, p2.rightArm.shoulderAngle, t),
      elbowAngle: lerp(p1.rightArm.elbowAngle, p2.rightArm.elbowAngle, t),
      wristAngle: lerp(p1.rightArm.wristAngle, p2.rightArm.wristAngle, t),
      fingers: p1.rightArm.fingers.map((f, i) => lerp(f, p2.rightArm.fingers[i], t)) as [number, number, number, number, number],
    },
    expression: t > 0.5 ? p2.expression : p1.expression,
  }
}

interface SignAvatarCanvasProps {
  activeSignKey?: string
  fingerspellText?: string
  speed?: number
  theme?: 'cyber' | 'saffron' | 'contrast' | 'pastel'
  onWordFinished?: () => void
  className?: string
}

export default function SignAvatarCanvas({
  activeSignKey = 'hello',
  fingerspellText = '',
  speed = 1.0,
  theme = 'saffron',
  onWordFinished,
  className = '',
}: SignAvatarCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const handCanvasRef = useRef<HTMLCanvasElement>(null)
  const [focusHand, setFocusHand] = useState<'left' | 'right'>('right')
  const currentPoseRef = useRef<AvatarPose>(DEFAULT_REST_POSE)
  const targetPoseRef = useRef<AvatarPose>(DEFAULT_REST_POSE)
  const animationFrameRef = useRef<number>(0)
  const keyframeIndexRef = useRef(0)
  const lastKeyframeTimeRef = useRef(0)
  const [currentLetter, setCurrentLetter] = useState('')
  const [isPlaying, setIsPlaying] = useState(true)
  const [zoom, setZoom] = useState(1)

  const [frame, setFrame] = useState(0)
  const [showJoints, setShowJoints] = useState(true)
  const cleanLetters = fingerspellText.toUpperCase().replace(/[^A-Z]/g, '')
  const frameCount = cleanLetters.length || PRESET_SIGNS[activeSignKey]?.poses.length || 1
  const selectFrame = (index: number) => {
    const next = (index + frameCount) % frameCount
    setIsPlaying(false)
    setFrame(next)
    keyframeIndexRef.current = next
    lastKeyframeTimeRef.current = performance.now()
    let pose: AvatarPose | undefined
    if (cleanLetters) {
      const letter = cleanLetters[next]
      setCurrentLetter(letter)
      pose = { ...DEFAULT_REST_POSE, rightArm: { shoulderAngle: -0.3, elbowAngle: -1.7, wristAngle: 0, fingers: LETTER_FINGERS[letter] }, expression: 'focused' }
    } else pose = PRESET_SIGNS[activeSignKey]?.poses[next]
    if (pose) { targetPoseRef.current = pose; currentPoseRef.current = pose }
  }

  // Color schemes for avatar
  const colors = useMemo(() => ({
    saffron: {
      bg: '#0f172a',
      body: '#4f46e5', // Indigo
      accent: '#f59e0b', // Saffron
      skin: '#fcd34d',
      hair: '#312e81',
      glow: 'rgba(245, 158, 11, 0.4)',
    },
    cyber: {
      bg: '#050b14',
      body: '#0284c7', // Sky
      accent: '#06b6d4', // Cyan
      skin: '#38bdf8',
      hair: '#082f49',
      glow: 'rgba(6, 182, 212, 0.6)',
    },
    contrast: {
      bg: '#000000',
      body: '#ffffff',
      accent: '#facc15', // Yellow
      skin: '#ffffff',
      hair: '#94a3b8',
      glow: 'rgba(255, 255, 255, 0.8)',
    },
    pastel: {
      bg: '#f8fafc',
      body: '#6366f1',
      accent: '#ec4899',
      skin: '#fed7aa',
      hair: '#475569',
      glow: 'rgba(99, 102, 241, 0.2)',
    },
  }[theme]), [theme])

  // Sequence player
  useEffect(() => {
    keyframeIndexRef.current = 0
    lastKeyframeTimeRef.current = performance.now()
  }, [activeSignKey, fingerspellText])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let lastTime = performance.now()

    const animate = (time: number) => {
      const dt = Math.min((time - lastTime) / 1000, 0.1)
      lastTime = time

      // Width and Height
      const w = canvas.width / 2
      const h = canvas.height / 2
      ctx.setTransform(2, 0, 0, 2, 0, 0)

      // Handle sequence progression
      const keyframeDuration = (fingerspellText ? 800 : 1200) / speed
      if (isPlaying && time - lastKeyframeTimeRef.current > keyframeDuration) {
        lastKeyframeTimeRef.current = time
        setFrame(keyframeIndexRef.current)

        if (fingerspellText) {
          const clean = fingerspellText.toUpperCase().replace(/[^A-Z]/g, '')
          if (clean.length > 0) {
            const letter = clean[keyframeIndexRef.current % clean.length]
            setCurrentLetter(letter)
            const fingerVals = LETTER_FINGERS[letter] || [0.5, 0.5, 0.5, 0.5, 0.5]

            targetPoseRef.current = {
              headTilt: 0.05,
              headNod: 0.1,
              leftArm: { shoulderAngle: 1.1, elbowAngle: 0.3, wristAngle: 0, fingers: [0.2, 0.2, 0.2, 0.2, 0.2] },
              rightArm: {
                shoulderAngle: -0.3,
                elbowAngle: -1.7,
                wristAngle: 0,
                fingers: fingerVals,
              },
              expression: 'focused',
            }

            keyframeIndexRef.current = (keyframeIndexRef.current + 1) % clean.length
            if (keyframeIndexRef.current === 0 && onWordFinished) {
              onWordFinished()
            }
          }
        } else if (PRESET_SIGNS[activeSignKey]) {
          const poses = PRESET_SIGNS[activeSignKey].poses
          targetPoseRef.current = poses[keyframeIndexRef.current % poses.length]
          keyframeIndexRef.current = (keyframeIndexRef.current + 1) % poses.length
          setCurrentLetter('')
        }
      }

      // Smooth interpolation towards target pose
      currentPoseRef.current = lerpPose(currentPoseRef.current, targetPoseRef.current, isPlaying ? Math.min(1, dt * 6 * speed) : 0)

      // Subtle breathing motion
      const breath = Math.sin(time * 0.002) * 4

      // Clear Canvas
      ctx.clearRect(0, 0, w, h)

      ctx.save()
      ctx.translate(w / 2, h * 0.45)
      ctx.scale(zoom, zoom)
      ctx.translate(-w / 2, -h * 0.45)
      // Draw background glow
      const cx = w / 2
      const cy = h * 0.45

      const gradient = ctx.createRadialGradient(cx, cy, 30, cx, cy, w * 0.45)
      gradient.addColorStop(0, colors.glow)
      gradient.addColorStop(1, 'transparent')
      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, w, h)

      // Avatar Origin Coordinates
      const shoulderY = cy + 50 + breath
      const headCenterY = cy - 45 + breath * 0.6
      const headCenterX = cx + currentPoseRef.current.headTilt * 20

      // 1. Draw Torso / Shoulders
      ctx.save()
      ctx.fillStyle = colors.body
      ctx.shadowColor = colors.glow
      ctx.shadowBlur = 15
      ctx.beginPath()
      ctx.moveTo(cx - 75, shoulderY)
      ctx.bezierCurveTo(cx - 60, shoulderY - 30, cx + 60, shoulderY - 30, cx + 75, shoulderY)
      ctx.lineTo(cx + 90, h)
      ctx.lineTo(cx - 90, h)
      ctx.closePath()
      ctx.fill()

      // Collar accent
      ctx.strokeStyle = colors.accent
      ctx.lineWidth = 4
      ctx.beginPath()
      ctx.moveTo(cx - 30, shoulderY - 10)
      ctx.lineTo(cx, shoulderY + 25)
      ctx.lineTo(cx + 30, shoulderY - 10)
      ctx.stroke()
      ctx.restore()

      // 2. Neck
      ctx.fillStyle = colors.skin
      ctx.fillRect(cx - 16, headCenterY + 30, 32, 28)

      // 3. Head & Face
      ctx.save()
      ctx.translate(headCenterX, headCenterY)
      ctx.rotate(currentPoseRef.current.headTilt)

      // Head shape
      ctx.fillStyle = colors.skin
      ctx.beginPath()
      ctx.ellipse(0, 0, 42, 52, 0, 0, Math.PI * 2)
      ctx.fill()

      // Hair
      ctx.fillStyle = colors.hair
      ctx.beginPath()
      ctx.arc(0, -18, 44, Math.PI * 0.9, Math.PI * 2.1)
      ctx.bezierCurveTo(20, -5, 0, -25, -20, -5)
      ctx.fill()

      // Eyes (with periodic blink)
      const blink = Math.sin(time * 0.003) > 0.98
      ctx.fillStyle = colors.hair
      if (blink) {
        ctx.fillRect(-22, -4, 14, 2.5)
        ctx.fillRect(8, -4, 14, 2.5)
      } else {
        ctx.beginPath()
        ctx.arc(-15, -4, 4.5, 0, Math.PI * 2)
        ctx.arc(15, -4, 4.5, 0, Math.PI * 2)
        ctx.fill()

        // Eye highlights
        ctx.fillStyle = '#ffffff'
        ctx.beginPath()
        ctx.arc(-13.5, -5.5, 1.8, 0, Math.PI * 2)
        ctx.arc(16.5, -5.5, 1.8, 0, Math.PI * 2)
        ctx.fill()
      }

      // Eyebrows
      ctx.strokeStyle = colors.hair
      ctx.lineWidth = 2.5
      ctx.beginPath()
      ctx.moveTo(-24, -14)
      ctx.lineTo(-8, -13)
      ctx.moveTo(8, -13)
      ctx.lineTo(24, -14)
      ctx.stroke()

      // Smile / Mouth
      ctx.strokeStyle = '#e11d48'
      ctx.lineWidth = 3
      ctx.beginPath()
      if (currentPoseRef.current.expression === 'smile') {
        ctx.arc(0, 14, 12, 0.1 * Math.PI, 0.9 * Math.PI)
      } else {
        ctx.moveTo(-10, 18)
        ctx.lineTo(10, 18)
      }
      ctx.stroke()
      ctx.restore()

      const handPositions: Record<string, DOMPoint> = {}
      // Helper function to draw an articulated arm and 5-finger hand
      const drawArm = (
        isRight: boolean,
        shoulderX: number,
        sY: number,
        shoulderAngle: number,
        elbowAngle: number,
        wristAngle: number,
        fingers: [number, number, number, number, number]
      ) => {
        ctx.save()
        const upperArmLen = 70
        const forearmLen = 65

        // Shoulder joint
        ctx.translate(shoulderX, sY)
        const sDir = isRight ? 1 : -1
        ctx.rotate(shoulderAngle * sDir)

        // Upper arm
        ctx.strokeStyle = colors.body
        ctx.lineWidth = 22
        ctx.lineCap = 'round'
        ctx.beginPath()
        ctx.moveTo(0, 0)
        ctx.lineTo(0, upperArmLen)
        ctx.stroke()

        // Elbow joint
        ctx.translate(0, upperArmLen)
        ctx.rotate(elbowAngle)

        // Forearm
        ctx.strokeStyle = colors.body
        ctx.lineWidth = 18
        ctx.beginPath()
        ctx.moveTo(0, 0)
        ctx.lineTo(0, forearmLen)
        ctx.stroke()

        // Wrist & Hand
        ctx.translate(0, forearmLen)
        ctx.rotate(wristAngle)

        handPositions[isRight ? 'right' : 'left'] = ctx.getTransform().transformPoint(new DOMPoint(0, 10))
        // Palm
        ctx.fillStyle = colors.skin
        ctx.beginPath()
        ctx.arc(0, 10, 14, 0, Math.PI * 2)
        ctx.fill()

        // Separated fingers with three visible segments and articulated joints.
        const fingerAngles = [-0.85, -0.22, 0, 0.2, 0.38]
        const fingerLengths = [17, 24, 27, 24, 19]
        fingers.forEach((extension, index) => {
          const ext = Math.min(1, Math.max(0, extension))
          ctx.save()
          ctx.translate((index - 2) * 5.4 * (isRight ? 1 : -1), index === 0 ? 7 : 18)
          ctx.rotate(fingerAngles[index] * (isRight ? 1 : -1))
          for (let joint = 0; joint < 3; joint += 1) {
            const length = fingerLengths[index] * [0.45, 0.32, 0.23][joint]
            ctx.rotate((1 - ext) * (joint === 0 ? 0.35 : 1.05) * (isRight ? 1 : -1))
            ctx.strokeStyle = '#172554'
            ctx.lineWidth = 6.2 - joint * 0.6
            ctx.lineCap = 'round'
            ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, length); ctx.stroke()
            ctx.strokeStyle = colors.skin
            ctx.lineWidth = 4.6 - joint * 0.6
            ctx.stroke()
            if (showJoints) {
              ctx.fillStyle = colors.accent
              ctx.beginPath(); ctx.arc(0, 0, 1.4, 0, Math.PI * 2); ctx.fill()
            }
            ctx.translate(0, length)
          }
          ctx.fillStyle = 'rgba(255,255,255,.65)'
          ctx.beginPath(); ctx.ellipse(0, -2, 1.3, 2, 0, 0, Math.PI * 2); ctx.fill()
          ctx.restore()
        })

        ctx.restore()
      }

      // 4. Draw Left Arm
      drawArm(
        false,
        cx - 65,
        shoulderY,
        currentPoseRef.current.leftArm.shoulderAngle,
        currentPoseRef.current.leftArm.elbowAngle,
        currentPoseRef.current.leftArm.wristAngle,
        currentPoseRef.current.leftArm.fingers
      )

      // 5. Draw Right Arm (Primary signing arm)
      drawArm(
        true,
        cx + 65,
        shoulderY,
        currentPoseRef.current.rightArm.shoulderAngle,
        currentPoseRef.current.rightArm.elbowAngle,
        currentPoseRef.current.rightArm.wristAngle,
        currentPoseRef.current.rightArm.fingers
      )

      // 6. Draw floating letter badge if fingerspelling
      if (currentLetter) {
        ctx.save()
        ctx.fillStyle = 'rgba(15, 23, 42, 0.9)'
        ctx.strokeStyle = colors.accent
        ctx.lineWidth = 2
        ctx.shadowColor = colors.glow
        ctx.shadowBlur = 12
        ctx.beginPath()
        ctx.roundRect(w - 70, 20, 50, 50, 12)
        ctx.fill()
        ctx.stroke()

        ctx.font = '700 24px "Space Grotesk", sans-serif'
        ctx.fillStyle = '#ffffff'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(currentLetter, w - 45, 45)
        ctx.restore()
      }

      ctx.restore()
      const handCanvas = handCanvasRef.current
      const detail = handCanvas?.getContext('2d')
      const position = handPositions[focusHand]
      if (handCanvas && detail && position) {
        detail.clearRect(0, 0, handCanvas.width, handCanvas.height)
        detail.fillStyle = '#0f172a'
        detail.fillRect(0, 0, handCanvas.width, handCanvas.height)
        const radius = 96 * zoom
        detail.drawImage(canvas, position.x - radius, position.y - radius, radius * 2, radius * 2, 0, 0, handCanvas.width, handCanvas.height)
      }
      animationFrameRef.current = requestAnimationFrame(animate)
    }

    animationFrameRef.current = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(animationFrameRef.current)
  }, [showJoints, focusHand, zoom, colors, speed, isPlaying, fingerspellText, activeSignKey, onWordFinished, currentLetter])

  return (
    <div className={`relative flex flex-col items-center justify-center overflow-hidden rounded-2xl ${className}`}>
      <div className="z-10 w-full rounded-xl border border-border bg-card p-4"><div className="flex flex-wrap items-center gap-4"><button onClick={() => selectFrame(frame - 1)}>Previous pose</button><button onClick={() => selectFrame(frame + 1)}>Next pose</button><button onClick={() => selectFrame(0)}>Restart</button><label className="flex items-center gap-2"><input type="checkbox" checked={showJoints} onChange={event => setShowJoints(event.target.checked)} /> Show finger joints</label><span className="text-sm text-muted-foreground">Pose {Math.min(frame + 1, frameCount)} of {frameCount}</span></div><input aria-label="Pose timeline" type="range" min="0" max={Math.max(0, frameCount - 1)} value={Math.min(frame, frameCount - 1)} onChange={event => selectFrame(Number(event.target.value))} className="mt-3 w-full accent-teal-600" /></div>
      <div className="z-10 flex flex-wrap gap-3 rounded-xl bg-card p-3 text-sm"><button onClick={() => setIsPlaying(!isPlaying)}>{isPlaying ? 'Pause motion' : 'Play motion'}</button><label>Magnification <input aria-label="Avatar magnification" type="range" min="1" max="2.5" step="0.1" value={zoom} onChange={event => setZoom(Number(event.target.value))} /></label><button onClick={() => setZoom(1)}>Reset view</button></div>
      <div className="z-10 w-full rounded-xl border border-border bg-card p-3"><label className="text-sm font-semibold">Hand detail <select value={focusHand} onChange={event => setFocusHand(event.target.value as 'left' | 'right')} className="ml-2 rounded-lg bg-muted p-2"><option value="right">Right hand</option><option value="left">Left hand</option></select></label><canvas ref={handCanvasRef} width={480} height={480} aria-label={`${focusHand} hand magnified illustration`} className="mx-auto mt-2 h-64 w-64 max-w-full rounded-xl" /></div>
      <p className="z-10 px-3 text-xs text-muted-foreground">Illustrative animation. Movements have not been validated for ISL instruction.</p>
      <canvas
        ref={canvasRef}
        width={960}
        height={720}
        className="h-full w-full max-h-[420px] object-contain"
      />
    </div>
  )
}
