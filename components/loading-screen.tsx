"use client"

import { useEffect, useState } from "react"

export default function LoadingScreen({ onComplete }: { onComplete: () => void }) {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(timer)
          setTimeout(onComplete, 800)
          return 100
        }
        return prev + Math.random() * 20
      })
    }, 400)

    return () => clearInterval(timer)
  }, [onComplete])

  return (
    <div className="fixed inset-0 bg-black flex items-center justify-center z-50 overflow-hidden">
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIj48ZmlsdGVyIGlkPSJhIj48ZmVUdXJidWxlbmNlIGJhc2VGcmVxdWVuY3k9Ii43NSIgc3RpdGNoVGlsZXM9InN0aXRjaCIgdHlwZT0iZnJhY3RhbE5vaXNlIi8+PGZlQ29sb3JNYXRyaXggdHlwZT0ic2F0dXJhdGUiIHZhbHVlcz0iMCIvPjwvZmlsdGVyPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbHRlcj0idXJsKCNhKSIvPjwvc3ZnPg==')]" />

      <div className="absolute top-0 left-0 right-0 h-16 md:h-24 bg-black animate-letterbox-top" />
      <div className="absolute bottom-0 left-0 right-0 h-16 md:h-24 bg-black animate-letterbox-bottom" />

      <div className="flex flex-col items-center justify-center space-y-12 animate-aperture-reveal">
        <div className="text-center space-y-6">
          <h1
            className="text-5xl md:text-7xl font-light tracking-[0.2em] text-white uppercase"
            style={{
              fontFamily: "var(--font-geist-sans)",
              animation: "cinematicFadeIn 1.8s ease-out 0.5s both",
            }}
          >
            HRIDAY BAJAJ
          </h1>
        </div>

        <div
          className="w-48 md:w-64 relative"
          style={{
            animation: "cinematicFadeIn 1.8s ease-out 1.5s both",
          }}
        >
          <div className="h-[1px] bg-white/20 overflow-hidden">
            <div
              className="h-full bg-white/60 transition-all duration-500 ease-out"
              style={{
                width: `${progress}%`,
              }}
            />
          </div>
        </div>
      </div>

      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "radial-gradient(circle at center, rgba(255,255,255,0.03) 0%, transparent 70%)",
          animation: "lightFlare 3s ease-in-out infinite",
        }}
      />
    </div>
  )
}
