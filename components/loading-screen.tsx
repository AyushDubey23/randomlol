"use client"

import { useEffect, useState } from "react"

export default function LoadingScreen({ onComplete }: { onComplete: () => void }) {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(timer)
          setTimeout(onComplete, 500)
          return 100
        }
        return prev + 2
      })
    }, 50)

    return () => clearInterval(timer)
  }, [onComplete])

  return (
    <div className="fixed inset-0 bg-background flex items-center justify-center z-50">
      <div className="text-center space-y-8">
        <div className="fade-in-up">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-foreground">HRIDAY BAJAJ</h1>
        </div>

        <div className="w-64 mx-auto">
          <div className="h-0.5 bg-border rounded-full overflow-hidden">
            <div className="h-full bg-primary transition-all duration-300 ease-out" style={{ width: `${progress}%` }} />
          </div>
          {/* removed status text */}
        </div>
      </div>
    </div>
  )
}
