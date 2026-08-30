"use client"

import { useState, useCallback } from "react"
import LoadingScreen from "@/components/loading-screen"
import HomePage from "@/components/home-page"

export default function Page() {
  const [isLoading, setIsLoading] = useState(true)

  const handleComplete = useCallback(() => {
    setIsLoading(false)
  }, [])

  return (
    <>
      <HomePage />
      {isLoading && <LoadingScreen onComplete={handleComplete} />}
    </>
  )
}

