"use client"

import { useState } from "react"
import FacialExpressionDetector from "@/components/facial-expression-detector"

export default function Home() {
  const [start, setStart] = useState(false)

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8">
      <h1 className="text-3xl font-bold mb-6">Real-Time Facial Expression Detection</h1>

      {!start ? (
        <button
          onClick={() => setStart(true)}
          className="px-6 py-3 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition"
        >
          Start Detection
        </button>
      ) : (
        <FacialExpressionDetector />
      )}
    </div>
  )
}
