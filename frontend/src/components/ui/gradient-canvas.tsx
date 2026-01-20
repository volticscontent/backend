"use client"

import { useEffect, useRef } from "react"

interface GradientCanvasProps {
  className?: string
}

export function GradientCanvas({ className }: GradientCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    let animationFrameId: number
    let width = canvas.width
    let height = canvas.height

    // Cores inspiradas na Stripe (Mesh Gradient)
    const colors = [
      { r: 64, g: 93, b: 250 },   // Azul forte
      { r: 107, g: 226, b: 235 }, // Ciano vibrante
      { r: 242, g: 209, b: 209 }, // Rosa claro
      { r: 251, g: 252, b: 219 }, // Amarelo claro
    ]

    // Partículas (Blobs)
    const particles = colors.map((color) => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.5, // Velocidade lenta
      vy: (Math.random() - 0.5) * 0.5,
      radius: Math.max(width, height) * 0.9, // Grandes raios para mistura suave
      color: `rgb(${color.r}, ${color.g}, ${color.b})`,
    }))

    const resize = () => {
      if (!canvas) return
      const parent = canvas.parentElement
      if (parent) {
        canvas.width = parent.clientWidth
        canvas.height = parent.clientHeight
        width = canvas.width
        height = canvas.height
        
        // Atualizar raios baseado no novo tamanho
        particles.forEach(p => {
            p.radius = Math.max(width, height) * 0.6
        })
      }
    }

    const animate = () => {
      ctx.clearRect(0, 0, width, height)
      
      // Remover o fundo branco opaco para permitir transparência se desejado
      // ou usar um fundo muito leve se necessário.
      // Vamos manter transparente e deixar o container pai definir a cor base se necessário.
      // Mas para o efeito mesh funcionar bem, um fundo base ajuda na mistura.
      // Vamos usar um fundo branco com leve transparência.
      ctx.fillStyle = "rgba(255, 255, 255, 0.8)"
      ctx.fillRect(0, 0, width, height)

      particles.forEach((p) => {
        p.x += p.vx
        p.y += p.vy

        // Rebater nas bordas (com margem grande para não sumir totalmente)
        if (p.x < -p.radius / 2 || p.x > width + p.radius / 2) p.vx *= -1
        if (p.y < -p.radius / 2 || p.y > height + p.radius / 2) p.vy *= -1

        // Desenhar gradiente radial para cada partícula
        const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.radius)
        
        // Usar alpha para mistura
        const colorWithAlpha = p.color.replace("rgb", "rgba").replace(")", ", 0.7)")
        const colorTransparent = p.color.replace("rgb", "rgba").replace(")", ", 0)")
        
        gradient.addColorStop(0, colorWithAlpha)
        gradient.addColorStop(1, colorTransparent)

        ctx.fillStyle = gradient
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2)
        ctx.fill()
      })

      animationFrameId = requestAnimationFrame(animate)
    }

    window.addEventListener("resize", resize)
    resize()
    animate()

    return () => {
      window.removeEventListener("resize", resize)
      cancelAnimationFrame(animationFrameId)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{ filter: "blur(10px)", opacity: 0.1 }} // Blur pesado para o efeito mesh
    />
  )
}
