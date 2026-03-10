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
        // Increased particle count for ultra-premium feel
        const particleCount = 100

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
                // Bubble-like varying sizes for depth
                this.size = Math.random() * 2.5 + 0.5
                this.vx = (Math.random() - 0.5) * 0.4
                this.vy = (Math.random() - 0.5) * 0.4
                this.density = (Math.random() * 30) + 1
                this.opacity = Math.random() * 0.4 + 0.1
                this.pulse = Math.random() * 0.005 + 0.002

                // Varied theme colors
                const colors = ['#6366f1', '#818cf8', '#4f46e5', '#f59e0b']
                this.color = colors[Math.floor(Math.random() * colors.length)]
            }

            update() {
                // Autonomous floating
                this.x += this.vx
                this.y += this.vy

                // Mouse interaction physics (Sophisticated Repulsion)
                const dx = mouseRef.current.x - this.x
                const dy = mouseRef.current.y - this.y
                const distance = Math.sqrt(dx * dx + dy * dy)
                const maxDistance = 180

                if (distance < maxDistance) {
                    const forceDirectionX = dx / distance
                    const forceDirectionY = dy / distance
                    const force = (maxDistance - distance) / maxDistance
                    const movement = force * this.density * 0.5

                    this.x -= forceDirectionX * movement
                    this.y -= forceDirectionY * movement
                }

                // Smooth wrap-around
                if (this.x < 0) this.x = width
                if (this.x > width) this.x = 0
                if (this.y < 0) this.y = height
                if (this.y > height) this.y = 0

                // Subtle breathing effect
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

                // Add minor glow back to premium bubbles
                ctx.shadowBlur = 4
                ctx.shadowColor = this.color
                ctx.globalAlpha = 1
                ctx.shadowBlur = 0
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

            // Draw cinematic network connections (faint)
            for (let i = 0; i < particles.length; i++) {
                for (let j = i + 1; j < particles.length; j++) {
                    const dx = particles[i].x - particles[j].x
                    const dy = particles[i].y - particles[j].y
                    const distance = Math.sqrt(dx * dx + dy * dy)

                    if (distance < 130) {
                        ctx.beginPath()
                        ctx.strokeStyle = `rgba(99, 102, 241, ${0.1 * (1 - distance / 130)})`
                        ctx.lineWidth = 0.5
                        ctx.moveTo(particles[i].x, particles[i].y)
                        ctx.lineTo(particles[j].x, particles[j].y)
                        ctx.stroke()
                    }
                }
            }

            particles.forEach(p => {
                p.update()
                p.draw()
            })

            requestAnimationFrame(animate)
        }

        const handleMouseMove = (e: MouseEvent) => {
            mouseRef.current.x = e.clientX
            mouseRef.current.y = e.clientY
        }

        const handleTouchMove = (e: TouchEvent) => {
            if (e.touches.length > 0) {
                mouseRef.current.x = e.touches[0].clientX
                mouseRef.current.y = e.touches[0].clientY
            }
        }

        window.addEventListener('resize', resize)
        window.addEventListener('mousemove', handleMouseMove)
        window.addEventListener('touchmove', handleTouchMove)

        resize()
        animate()

        return () => {
            window.removeEventListener('resize', resize)
            window.removeEventListener('mousemove', handleMouseMove)
            window.removeEventListener('touchmove', handleTouchMove)
        }
    }, [])

    return (
        <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden bg-background">
            <canvas
                ref={canvasRef}
                className="absolute inset-0 w-full h-full opacity-60"
            />

            {/* Aurora Layers: These create the ₹1L+ depth feel */}
            <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary/20 rounded-full blur-[140px] animate-aurora mix-blend-screen" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-accent/20 rounded-full blur-[160px] animate-aurora mix-blend-screen" style={{ animationDelay: '-10s' }} />
            <div className="absolute top-[30%] left-[20%] w-[30%] h-[30%] bg-secondary/10 rounded-full blur-[120px] animate-aurora mix-blend-screen" style={{ animationDelay: '-5s' }} />

            {/* Subtle Grid Texture for that professional SaaS look */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
                style={{
                    backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
                    backgroundSize: '100px 100px'
                }}
            />
        </div>
    )
}
