"use client"

import React from "react"

export default function DotsLoader({ size = 12 }: { size?: number }) {
  const dotStyle = {
    width: size,
    height: size,
    borderRadius: "9999px",
    margin: "0 6px",
    display: "inline-block",
  } as React.CSSProperties

  return (
    <div className="flex items-center justify-center bg-transparent">
      <style>{`
        @keyframes bounceDots { 
          0%, 80%, 100% { transform: translateY(0); opacity: .85 } 
          40% { transform: translateY(-10px); opacity: 1 } 
        }
      `}</style>
      <div className="flex items-center justify-center bg-transparent">
        <span
          className="dot"
          style={{
            ...dotStyle,
            background: "#2b2be6",
            animation: "bounceDots 0.9s infinite",
            animationDelay: "0s",
          }}
        />
        <span
          className="dot"
          style={{
            ...dotStyle,
            background: "#20c997",
            animation: "bounceDots 0.9s infinite",
            animationDelay: "0.12s",
          }}
        />
        <span
          className="dot"
          style={{
            ...dotStyle,
            background: "#66d3ff",
            animation: "bounceDots 0.9s infinite",
            animationDelay: "0.24s",
          }}
        />
        <span
          className="dot"
          style={{
            ...dotStyle,
            background: "#ffbe2e",
            animation: "bounceDots 0.9s infinite",
            animationDelay: "0.36s",
          }}
        />
      </div>
    </div>
  )
}
