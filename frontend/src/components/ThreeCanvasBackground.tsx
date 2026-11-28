import { useEffect, useRef } from 'react'

export default function ThreeCanvasBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const frame = { id: 0 }
    const viewport = { width: (canvas.width = window.innerWidth), height: (canvas.height = window.innerHeight) }

    const handleResize = () => {
      if (!canvas) return
      viewport.width = canvas.width = window.innerWidth
      viewport.height = canvas.height = window.innerHeight
    }
    window.addEventListener('resize', handleResize)

    // Generate 3D spatial particles
    const PARTICLE_COUNT = 75
    const particles = Array.from({ length: PARTICLE_COUNT }, () => ({
      x: (Math.random() - 0.5) * viewport.width * 1.5,
      y: (Math.random() - 0.5) * viewport.height * 1.5,
      z: Math.random() * 800 + 200,
      radius: Math.random() * 2.2 + 0.8,
      speedX: (Math.random() - 0.5) * 0.4,
      speedY: (Math.random() - 0.5) * 0.4,
      speedZ: -0.6 - Math.random() * 0.8,
      color: Math.random() > 0.6 ? '#6366f1' : Math.random() > 0.3 ? '#06b6d4' : '#f59e0b',
    }))

    const targetMouse = { x: 0, y: 0 }

    const handleMouseMove = (e: MouseEvent) => {
      targetMouse.x = (e.clientX - viewport.width / 2) * 0.08
      targetMouse.y = (e.clientY - viewport.height / 2) * 0.08
    }
    window.addEventListener('mousemove', handleMouseMove)

    const motion = window.matchMedia('(prefers-reduced-motion: reduce)')
    const animation = { time: 0, mouseX: 0, mouseY: 0 }
    const canAnimate = () => !motion.matches && !document.hidden && !document.documentElement.classList.contains('reduce-motion')

    const render = () => {
      animation.time += 0.015
      animation.mouseX += (targetMouse.x - animation.mouseX) * 0.05
      animation.mouseY += (targetMouse.y - animation.mouseY) * 0.05

      ctx.clearRect(0, 0, viewport.width, viewport.height)

      const fov = 400
      const cx = viewport.width / 2 + animation.mouseX
      const cy = viewport.height / 2 + animation.mouseY

      // 1. Draw flowing 3D wave ribbons in the background
      ctx.save()
      for (let wave = 0; wave < 3; wave++) {
        ctx.beginPath()
        const waveOffset = wave * 1.8
        const waveColor =
          wave === 0
            ? 'rgba(99, 102, 241, 0.07)'
            : wave === 1
            ? 'rgba(6, 182, 212, 0.05)'
            : 'rgba(245, 158, 11, 0.04)'

        ctx.strokeStyle = waveColor
        ctx.lineWidth = 2.5

        for (let x = 0; x <= viewport.width; x += 15) {
          const y =
            cy +
            Math.sin(x * 0.003 + animation.time + waveOffset) * 90 +
            Math.cos(x * 0.006 - animation.time * 0.8) * 45
          if (x === 0) ctx.moveTo(x, y)
          else ctx.lineTo(x, y)
        }
        ctx.stroke()
      }
      ctx.restore()

      // 2. Render and project 3D particles with depth perspective
      const projected: { x: number; y: number; size: number; alpha: number; color: string }[] = []

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i]
        p.x += p.speedX
        p.y += p.speedY
        p.z += p.speedZ

        // Recycle particles that travel past camera
        if (p.z < 10) {
          p.z = 1000
          p.x = (Math.random() - 0.5) * viewport.width * 1.5
          p.y = (Math.random() - 0.5) * viewport.height * 1.5
        }

        const scale = fov / p.z
        const px = cx + p.x * scale
        const py = cy + p.y * scale
        const size = Math.max(0.6, p.radius * scale)
        const alpha = Math.min(1, Math.max(0.1, (1000 - p.z) / 900))

        if (px >= -50 && px <= viewport.width + 50 && py >= -50 && py <= viewport.height + 50) {
          projected.push({ x: px, y: py, size, alpha, color: p.color })
        }
      }

      // 3. Draw inter-particle neural connection lines
      ctx.save()
      ctx.lineWidth = 1
      for (let i = 0; i < projected.length; i++) {
        const p1 = projected[i]
        for (let j = i + 1; j < projected.length; j++) {
          const p2 = projected[j]
          const dx = p1.x - p2.x
          const dy = p1.y - p2.y
          const d2 = dx * dx + dy * dy
          if (d2 < 11000) {
            const lineAlpha = (1 - d2 / 11000) * 0.18 * Math.min(p1.alpha, p2.alpha)
            ctx.strokeStyle = `rgba(99, 102, 241, ${lineAlpha})`
            ctx.beginPath()
            ctx.moveTo(p1.x, p1.y)
            ctx.lineTo(p2.x, p2.y)
            ctx.stroke()
          }
        }
      }
      ctx.restore()

      // 4. Draw glowing nodes
      ctx.save()
      for (let i = 0; i < projected.length; i++) {
        const p = projected[i]
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
        ctx.fillStyle = p.color
        ctx.globalAlpha = p.alpha * 0.85
        ctx.shadowColor = p.color
        ctx.shadowBlur = p.size * 5
        ctx.fill()
      }
      ctx.restore()

      if (canAnimate()) frame.id = requestAnimationFrame(render)
    }

    const refresh = () => {
      cancelAnimationFrame(frame.id)
      if (!document.hidden) render()
    }
    const observer = new MutationObserver(refresh)
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
    motion.addEventListener('change', refresh)
    document.addEventListener('visibilitychange', refresh)
    refresh()

    return () => {
      observer.disconnect()
      motion.removeEventListener('change', refresh)
      document.removeEventListener('visibilitychange', refresh)
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('mousemove', handleMouseMove)
      cancelAnimationFrame(frame.id)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 h-full w-full -z-10 opacity-75"
    />
  )
}
