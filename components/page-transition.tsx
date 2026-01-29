"use client"
import { useNavLoading } from "./nav-loading-context"
import DotsLoader from "./dots-loader"

export default function PageTransition() {
  const { loadingId } = useNavLoading()

  return (
    <div
      aria-hidden
      className={`fixed inset-0 pointer-events-none z-50 transition-all duration-500 ${
        loadingId ? "opacity-100" : "opacity-0"
      }`}
    >
      <div className="flex items-center justify-center h-full bg-gradient-to-br from-black/30 via-white/5 to-black/20 backdrop-blur-xl">
        <div
          className="backdrop-blur-md rounded-3xl p-12 flex items-center justify-center transition-all duration-500"
          style={{
            width: 200,
            height: 200,
            background: "radial-gradient(circle at 40% 40%, rgba(255, 255, 255, 0.15), rgba(200, 200, 200, 0.05))",
            border: "1.5px solid rgba(255, 255, 255, 0.2)",
            boxShadow: "0 8px 32px rgba(31, 38, 135, 0.15), inset 0 0 20px rgba(255, 255, 255, 0.1)",
          }}
        >
          <DotsLoader size={14} />
        </div>
      </div>
    </div>
  )
}
