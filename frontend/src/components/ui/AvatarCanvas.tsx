import { useEffect, useRef } from 'react'

export default function AvatarCanvas({ className }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const animationFrameId = { current: 0 }
    const draw = (time: number) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Draw bridge motif - slow wave
      ctx.beginPath()
      ctx.strokeStyle = '#6366f1' // Indigo
      ctx.lineWidth = 4
      for (let i = 0; i < canvas.width; i += 5) {
        const y = canvas.height / 2 + Math.sin(i * 0.01 + time * 0.002) * 20
        if (i === 0) ctx.moveTo(i, y)
        else ctx.lineTo(i, y)
      }
      ctx.stroke()

      animationFrameId.current = requestAnimationFrame(draw)
    }

    animationFrameId.current = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(animationFrameId.current)
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className={className}
      width={400}
      height={200}
    />
  )
}
