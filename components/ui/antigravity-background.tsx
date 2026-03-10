"use client"

import React, { useEffect, useRef } from 'react'

export const AntigravityBackground: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null)

    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return

        const ctx = canvas.getContext('2d')
        if (!ctx) return

        let width: number, height: number
        let particles: Particle[] = []
        const particleCount = 60

        class Particle {
            x: number = 0
            y: number = 0
            size: number = 0
            speedX: number = 0
            speedY: number = 0
            opacity: number = 0
            pulse: number = 0

            constructor() {
                this.init()
            }

            init() {
                this.x = Math.random() * width
                this.y = Math.random() * height
                this.size = Math.random() * 2 + 0.5
                this.speedX = (Math.random() - 0.5) * 0.3
                this.speedY = (Math.random() - 0.5) * 0.3
                this.opacity = Math.random() * 0.4 + 0.1
                this.pulse = Math.random() * 0.01 + 0.005
            }

            update() {
                this.x += this.speedX
                this.y += this.speedY

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
                ctx.fillStyle = `rgba(129, 140, 248, ${this.opacity})` // Primary-light color
                ctx.fill()
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

            // Draw connections
            for (let i = 0; i < particles.length; i++) {
                for (let j = i + 1; j < particles.length; j++) {
                    const dx = particles[i].x - particles[j].x
                    const dy = particles[i].y - particles[j].y
                    const distance = Math.sqrt(dx * dx + dy * dy)

                    if (distance < 150) {
                        ctx.beginPath()
                        ctx.strokeStyle = `rgba(79, 70, 229, ${0.15 * (1 - distance / 150)})`
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

        window.addEventListener('resize', resize)
        resize()
        animate()

        return () => window.removeEventListener('resize', resize)
    }, [])

    return (
        <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden bg-background">
            <canvas
                ref={canvasRef}
                className="absolute inset-0 w-full h-full"
            />

            {/* Ambient Floating Shapes */}
            <div className="absolute top-1/4 -left-20 w-80 h-80 bg-primary/10 rounded-full blur-[120px] animate-float shadow-2xl" />
            <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-accent/10 rounded-full blur-[120px] animate-float shadow-2xl" style={{ animationDelay: '-3s' }} />

            {/* Depth dots */}
            <div className="absolute inset-0 opacity-[0.15]"
                style={{
                    backgroundImage: 'radial-gradient(circle, var(--primary) 1px, transparent 1px)',
                    backgroundSize: '40px 40px'
                }}
            />
        </div>
    )
}
