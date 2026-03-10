"use client"

import React, { useEffect, useRef } from 'react'

export const AntigravityBackground: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const mouseRef = useRef<{ x: number, y: number }>({ x: -1000, y: -1000 })

    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return

        const ctx = canvas.getContext('2d')
        if (!ctx) return

        let width: number, height: number
        let particles: Particle[] = []
        const particleCount = 80

        class Particle {
            x: number = 0
            y: number = 0
            originX: number = 0
            originY: number = 0
            size: number = 0
            vx: number = 0
            vy: number = 0
            density: number = 0
            opacity: number = 0
            color: string = ''

            constructor() {
                this.init()
            }

            init() {
                this.x = Math.random() * width
                this.y = Math.random() * height
                this.originX = this.x
                this.originY = this.y
                // Bubble-like varying sizes
                this.size = Math.random() * 3 + 1
                this.vx = (Math.random() - 0.5) * 0.5
                this.vy = (Math.random() - 0.5) * 0.5
                this.density = (Math.random() * 30) + 1
                this.opacity = Math.random() * 0.5 + 0.1

                // Varied blue/indigo shades for depth
                const colors = ['#818cf8', '#6366f1', '#4f46e5']
                this.color = colors[Math.floor(Math.random() * colors.length)]
            }

            update() {
                // Autonomous floating
                this.x += this.vx
                this.y += this.vy

                // Mouse interaction physics (Repulsion)
                const dx = mouseRef.current.x - this.x
                const dy = mouseRef.current.y - this.y
                const distance = Math.sqrt(dx * dx + dy * dy)
                const forceDirectionX = dx / distance
                const forceDirectionY = dy / distance
                const maxDistance = 150
                const force = (maxDistance - distance) / maxDistance

                if (distance < maxDistance) {
                    this.x -= forceDirectionX * force * this.density * 0.6
                    this.y -= forceDirectionY * force * this.density * 0.6
                }

                // Bounds checking
                if (this.x < 0) this.x = width
                if (this.x > width) this.x = 0
                if (this.y < 0) this.y = height
                if (this.y > height) this.y = 0
            }

            draw() {
                if (!ctx) return
                ctx.beginPath()
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2)
                ctx.fillStyle = this.color
                ctx.globalAlpha = this.opacity
                ctx.fill()
                // Extra soft glow for bubbles
                ctx.shadowBlur = 5
                ctx.shadowColor = this.color
                ctx.globalAlpha = 1
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

            // Draw faint connections for "network" feel
            ctx.shadowBlur = 0
            for (let i = 0; i < particles.length; i++) {
                for (let j = i + 1; j < particles.length; j++) {
                    const dx = particles[i].x - particles[j].x
                    const dy = particles[i].y - particles[j].y
                    const distance = Math.sqrt(dx * dx + dy * dy)

                    if (distance < 120) {
                        ctx.beginPath()
                        ctx.strokeStyle = `rgba(129, 140, 248, ${0.1 * (1 - distance / 120)})`
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
            mouseRef.current.x = e.x
            mouseRef.current.y = e.y
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
                className="absolute inset-0 w-full h-full opacity-70"
            />

            {/* Soft Ambient Blobs */}
            <div className="absolute top-[10%] -left-[10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[100px] animate-float" />
            <div className="absolute bottom-[10%] -right-[10%] w-[50%] h-[50%] bg-accent/5 rounded-full blur-[120px] animate-float" style={{ animationDelay: '-4s' }} />
        </div>
    )
}
