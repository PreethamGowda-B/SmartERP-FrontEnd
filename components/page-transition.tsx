"use client"

import React from 'react'
import { useNavLoading } from './nav-loading-context'

export default function PageTransition() {
  const { loadingId } = useNavLoading()

  return (
    <div
      aria-hidden
      className={`fixed inset-0 pointer-events-none z-50 transition-opacity duration-500 ${loadingId ? 'opacity-100' : 'opacity-0'}`}>
      <div className="flex items-center justify-center h-full">
        <div className="bg-white rounded-lg p-6 shadow-md flex items-center justify-center" style={{ width: 120, height: 80 }}>
          <style>{`
            @keyframes bounceDots { 0%, 80%, 100% { transform: translateY(0); opacity: .85 } 40% { transform: translateY(-12px); opacity: 1 } }
            .dot { width: 12px; height: 12px; border-radius: 9999px; margin: 0 6px; display: inline-block; }
          `}</style>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span className="dot" style={{ background: '#2b2be6', animation: 'bounceDots 0.9s infinite', animationDelay: '0s' }} />
            <span className="dot" style={{ background: '#20c997', animation: 'bounceDots 0.9s infinite', animationDelay: '0.12s' }} />
            <span className="dot" style={{ background: '#66d3ff', animation: 'bounceDots 0.9s infinite', animationDelay: '0.24s' }} />
            <span className="dot" style={{ background: '#ffbe2e', animation: 'bounceDots 0.9s infinite', animationDelay: '0.36s' }} />
          </div>
        </div>
      </div>
    </div>
  )
}
