"use client"

import React, { useEffect, useRef } from 'react'

export const AntigravityBackground: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const mouseRef = useRef<{ x: number, y: number }>({ x: -2000, y: -2000 })

    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return

        const ctx = canvas.getContext('2d')
        if (!ctx) return

        let width: number, height: number
        let particles: Particle[] = []
        let animationFrameId: number
        const isMobile = typeof window !== 'undefined' && window.innerWidth < 768
        const particleCount = isMobile ? 25 : 80

        class Particle {
            x: number = 0
            y: number = 0
            size: number = 0
            vx: number = 0
            vy: number = 0
            density: number = 0
            opacity: number = 0
            color: string = ''
            pulse: number = 0

            constructor() {
                this.init()
            }

            init() {
                this.x = Math.random() * width
                this.y = Math.random() * height
                this.size = Math.random() * 2.5 + 0.5
                this.vx = (Math.random() - 0.5) * 0.3
                this.vy = (Math.random() - 0.5) * 0.3
                this.density = (Math.random() * 20) + 1
                this.opacity = Math.random() * 0.4 + 0.1
                this.pulse = Math.random() * 0.005 + 0.002

                const colors = ['#6366f1', '#818cf8', '#4f46e5', '#f59e0b']
                this.color = colors[Math.floor(Math.random() * colors.length)]
            }

            update() {
                this.x += this.vx
                this.y += this.vy

                // Mouse interaction physics (desktop only to save mobile main thread)
                if (!isMobile) {
                    const dx = mouseRef.current.x - this.x
                    const dy = mouseRef.current.y - this.y
                    const distance = Math.sqrt(dx * dx + dy * dy)
                    const maxDistance = 150

                    if (distance < maxDistance) {
                        const forceDirectionX = dx / distance
                        const forceDirectionY = dy / distance
                        const force = (maxDistance - distance) / maxDistance
                        const movement = force * this.density * 0.4

                        this.x -= forceDirectionX * movement
                        this.y -= forceDirectionY * movement
                    }
                }

                if (this.x < 0) this.x = width
                if (this.x > width) this.x = 0
                if (this.y < 0) this.y = height
                if (this.y > height) this.y = 0

                this.opacity += this.pulse
                if (this.opacity > 0.6 || this.opacity < 0.1) this.pulse *= -1
            }

            draw() {
                if (!ctx) return
                ctx.beginPath()
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2)
                ctx.fillStyle = this.color
                ctx.globalAlpha = this.opacity
                ctx.fill()

                // Skip expensive canvas shadowBlur on mobile devices
                if (!isMobile) {
                    ctx.shadowBlur = 3
                    ctx.shadowColor = this.color
                    ctx.globalAlpha = 1
                    ctx.shadowBlur = 0
                }
            }
        }

        const resize = () => {
            width = window.innerWidth
            height = window.innerHeight
            canvas.width = width
            canvas.height = height
            initParticles()
        }

        const initParticles = () => {
            particles = []
            for (let i = 0; i < particleCount; i++) {
                particles.push(new Particle())
            }
        }

        const animate = () => {
            ctx.clearRect(0, 0, width, height)

            // Draw network connections only on desktop to save mobile GPU/CPU
            if (!isMobile) {
                for (let i = 0; i < particles.length; i++) {
                    for (let j = i + 1; j < particles.length; j++) {
                        const dx = particles[i].x - particles[j].x
                        const dy = particles[i].y - particles[j].y
                        const distance = Math.sqrt(dx * dx + dy * dy)

                        if (distance < 120) {
                            ctx.beginPath()
                            ctx.strokeStyle = `rgba(99, 102, 241, ${0.08 * (1 - distance / 120)})`
                            ctx.lineWidth = 0.5
                            ctx.moveTo(particles[i].x, particles[i].y)
                            ctx.lineTo(particles[j].x, particles[j].y)
                            ctx.stroke()
                        }
                    }
                }
            }

            particles.forEach(p => {
                p.update()
                p.draw()
            })

            animationFrameId = requestAnimationFrame(animate)
        }

        const handleMouseMove = (e: MouseEvent) => {
            if (isMobile) return
            mouseRef.current.x = e.clientX
            mouseRef.current.y = e.clientY
        }

        window.addEventListener('resize', resize)
        if (!isMobile) {
            window.addEventListener('mousemove', handleMouseMove)
        }

        resize()
        animate()

        return () => {
            cancelAnimationFrame(animationFrameId)
            window.removeEventListener('resize', resize)
            window.removeEventListener('mousemove', handleMouseMove)
        }
    }, [])

    return (
        <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden bg-background">
            <canvas
                ref={canvasRef}
                className="absolute inset-0 w-full h-full opacity-50"
            />

            {/* Aurora Layers: Lightweight on mobile, full depth on desktop */}
            <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary/10 dark:bg-primary/15 rounded-full blur-[60px] md:blur-[140px] animate-aurora" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-accent/10 dark:bg-accent/15 rounded-full blur-[70px] md:blur-[160px] animate-aurora" style={{ animationDelay: '-10s' }} />
            <div className="hidden md:block absolute top-[30%] left-[20%] w-[30%] h-[30%] bg-secondary/10 dark:bg-secondary/20 rounded-full blur-[120px] animate-aurora" style={{ animationDelay: '-5s' }} />

            {/* Grid Texture */}
            <div className="absolute inset-0 opacity-[0.02] pointer-events-none"
                style={{
                    backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
                    backgroundSize: '100px 100px'
                }}
            />
        </div>
    )

}
