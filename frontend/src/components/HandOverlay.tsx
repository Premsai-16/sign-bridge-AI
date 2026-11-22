import { useEffect, useRef } from 'react'
import type { DetectedHandInfo, GeometricSignPrediction } from '../lib/gesture-classifier'

interface HandOverlayProps {
  hands: DetectedHandInfo[]
  prediction?: GeometricSignPrediction | null
  activeSign?: string | null
  confidence?: number
  mirrored?: boolean
  className?: string
}

const CONNECTIONS = [
  // Thumb
  [0, 1], [1, 2], [2, 3], [3, 4],
  // Index
  [0, 5], [5, 6], [6, 7], [7, 8],
  // Middle
  [5, 9], [9, 10], [10, 11], [11, 12],
  // Ring
  [9, 13], [13, 14], [14, 15], [15, 16],
  // Pinky
  [0, 17], [13, 17], [17, 18], [18, 19], [19, 20],
]

const FINGERTIPS = [4, 8, 12, 16, 20]

export default function HandOverlay({
  hands,
  prediction,
  activeSign,
  confidence,
  mirrored = true,
  className = '',
}: HandOverlayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Auto-sync canvas internal dimensions with display dimensions
    const width = canvas.clientWidth || 640
    const height = canvas.clientHeight || 480
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width
      canvas.height = height
    }

    ctx.clearRect(0, 0, width, height)

    if (!hands || hands.length === 0) return

    hands.forEach((hand, handIndex) => {
      const landmarks = hand.landmarks
      if (!landmarks || landmarks.length < 21) return

      const coords = landmarks.map(lm => {
        const x = mirrored ? (1 - lm.x) * width : lm.x * width
        const y = lm.y * height
        return { x, y }
      })

      // Calculate hand bounding box
      let minX = width
      let minY = height
      let maxX = 0
      let maxY = 0
      coords.forEach(pt => {
        if (pt.x < minX) minX = pt.x
        if (pt.x > maxX) maxX = pt.x
        if (pt.y < minY) minY = pt.y
        if (pt.y > maxY) maxY = pt.y
      })

      // Add padding
      const pad = 24
      minX = Math.max(0, minX - pad)
      minY = Math.max(0, minY - pad)
      maxX = Math.min(width, maxX + pad)
      maxY = Math.min(height, maxY + pad)

      const isRightHand = hand.label.toLowerCase().includes('right')
      const themeColor = isRightHand ? '#6366f1' : '#06b6d4' // Indigo vs Cyan
      const glowColor = isRightHand ? 'rgba(99, 102, 241, 0.4)' : 'rgba(6, 182, 212, 0.4)'

      // 1. Draw glowing skeleton connection lines
      ctx.save()
      ctx.lineWidth = 3.5
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      ctx.strokeStyle = themeColor
      ctx.shadowColor = glowColor
      ctx.shadowBlur = 12

      CONNECTIONS.forEach(([start, end]) => {
        const p1 = coords[start]
        const p2 = coords[end]
        if (p1 && p2) {
          ctx.beginPath()
          ctx.moveTo(p1.x, p1.y)
          ctx.lineTo(p2.x, p2.y)
          ctx.stroke()
        }
      })
      ctx.restore()

      // 2. Draw joints
      coords.forEach((pt, index) => {
        const isTip = FINGERTIPS.includes(index)
        const isWrist = index === 0

        ctx.save()
        if (isTip) {
          // Large pulse on fingertips
          ctx.beginPath()
          ctx.arc(pt.x, pt.y, 6.5, 0, Math.PI * 2)
          ctx.fillStyle = '#f59e0b' // Saffron amber tip
          ctx.shadowColor = 'rgba(245, 158, 11, 0.8)'
          ctx.shadowBlur = 14
          ctx.fill()

          ctx.beginPath()
          ctx.arc(pt.x, pt.y, 3, 0, Math.PI * 2)
          ctx.fillStyle = '#ffffff'
          ctx.fill()
        } else if (isWrist) {
          // Wrist anchor
          ctx.beginPath()
          ctx.arc(pt.x, pt.y, 5.5, 0, Math.PI * 2)
          ctx.fillStyle = themeColor
          ctx.shadowColor = glowColor
          ctx.shadowBlur = 10
          ctx.fill()
        } else {
          // Normal joints
          ctx.beginPath()
          ctx.arc(pt.x, pt.y, 3.8, 0, Math.PI * 2)
          ctx.fillStyle = '#ffffff'
          ctx.shadowColor = glowColor
          ctx.shadowBlur = 8
          ctx.fill()
        }
        ctx.restore()
      })

      // 3. Draw Cyber Bounding Box Corners
      const cornerLen = Math.min(22, (maxX - minX) * 0.25)
      ctx.save()
      ctx.strokeStyle = themeColor
      ctx.lineWidth = 2.5
      ctx.shadowColor = glowColor
      ctx.shadowBlur = 8

      // Top-Left
      ctx.beginPath()
      ctx.moveTo(minX, minY + cornerLen)
      ctx.lineTo(minX, minY)
      ctx.lineTo(minX + cornerLen, minY)
      ctx.stroke()

      // Top-Right
      ctx.beginPath()
      ctx.moveTo(maxX - cornerLen, minY)
      ctx.lineTo(maxX, minY)
      ctx.lineTo(maxX, minY + cornerLen)
      ctx.stroke()

      // Bottom-Left
      ctx.beginPath()
      ctx.moveTo(minX, maxY - cornerLen)
      ctx.lineTo(minX, maxY)
      ctx.lineTo(minX + cornerLen, maxY)
      ctx.stroke()

      // Bottom-Right
      ctx.beginPath()
      ctx.moveTo(maxX - cornerLen, maxY)
      ctx.lineTo(maxX, maxY)
      ctx.lineTo(maxX, maxY - cornerLen)
      ctx.stroke()

      // 4. Floating Tag above the hand
      const tagText = `${hand.label} (${Math.round(hand.score * 100)}%)`
      ctx.font = '600 11px system-ui, sans-serif'
      const tagWidth = ctx.measureText(tagText).width + 16
      const tagX = Math.max(8, minX)
      const tagY = Math.max(20, minY - 8)

      ctx.fillStyle = 'rgba(15, 23, 42, 0.85)'
      ctx.beginPath()
      ctx.roundRect(tagX, tagY - 16, tagWidth, 20, 6)
      ctx.fill()
      ctx.strokeStyle = themeColor
      ctx.lineWidth = 1
      ctx.stroke()

      ctx.fillStyle = '#38bdf8'
      ctx.fillText(tagText, tagX + 8, tagY - 2)

      // 5. If this is the primary hand and a sign is actively detected, draw a holographic banner
      const activeLabel = activeSign || prediction?.label
      if (handIndex === 0 && activeLabel) {
        const confPercent = Math.round((confidence || prediction?.confidence || 0.85) * 100)
        const signText = `⚡ ${activeLabel}`
        const subText = `${confPercent}% match`

        ctx.font = '700 14px "Space Grotesk", system-ui, sans-serif'
        const signWidth = Math.max(ctx.measureText(signText).width, 100) + 24
        const bannerX = Math.min(width - signWidth - 10, Math.max(10, minX + (maxX - minX) / 2 - signWidth / 2))
        const bannerY = Math.min(height - 40, maxY + 24)

        // Backdrop
        ctx.fillStyle = 'rgba(15, 23, 42, 0.92)'
        ctx.shadowColor = 'rgba(99, 102, 241, 0.6)'
        ctx.shadowBlur = 16
        ctx.beginPath()
        ctx.roundRect(bannerX, bannerY - 22, signWidth, 34, 8)
        ctx.fill()

        ctx.strokeStyle = '#6366f1'
        ctx.lineWidth = 1.5
        ctx.stroke()

        // Text
        ctx.fillStyle = '#ffffff'
        ctx.fillText(signText, bannerX + 10, bannerY - 3)

        ctx.font = '600 10px system-ui, sans-serif'
        ctx.fillStyle = '#34d399' // Emerald confidence
        ctx.fillText(subText, bannerX + signWidth - 54, bannerY - 4)
      }

      ctx.restore()
    })
  }, [hands, prediction, activeSign, confidence, mirrored])

  return (
    <canvas
      ref={canvasRef}
      className={`pointer-events-none absolute inset-0 h-full w-full object-cover z-20 ${className}`}
    />
  )
}
