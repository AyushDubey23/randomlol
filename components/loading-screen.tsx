"use client"

import { useEffect, useState, useRef } from "react"

export default function LoadingScreen({ onComplete }: { onComplete: () => void }) {
  const [progress, setProgress] = useState(0)
  const [isFadingOut, setIsFadingOut] = useState(false)
  const onCompleteRef = useRef(onComplete)

  useEffect(() => {
    onCompleteRef.current = onComplete
  }, [onComplete])

  useEffect(() => {
    const startTime = Date.now()
    const duration = 1000 // 1 second clean loading progress
    let completed = false

    const timer = setInterval(() => {
      const elapsed = Date.now() - startTime
      const currentProgress = Math.min(Math.floor((elapsed / duration) * 100), 100)

      setProgress(currentProgress)

      if (currentProgress >= 100 && !completed) {
        completed = true
        clearInterval(timer)
        setIsFadingOut(true)
        setTimeout(() => {
          onCompleteRef.current()
        }, 400)
      }
    }, 16)

    return () => clearInterval(timer)
  }, [])

  return (
    <div
      className={`fixed inset-0 z-50 bg-[#fafafa] flex flex-col items-center justify-center transition-opacity duration-400 ease-in-out ${
        isFadingOut ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
    >
      <div className="flex flex-col items-center text-center px-4 space-y-8">
        <div>
          <h1 className="text-3xl md:text-5xl font-light tracking-[0.25em] text-black uppercase select-none">
            HRIDAY BAJAJ
          </h1>
        </div>

        {/* Minimal black loading bar */}
        <div className="w-40 md:w-52">
          <div className="h-[2px] w-full bg-black/10 overflow-hidden rounded-full">
            <div
              className="h-full bg-black transition-all duration-75 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

