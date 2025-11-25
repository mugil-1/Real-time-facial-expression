"use client"

import { useEffect, useRef, useState } from "react"

interface Expression {
  label: string
  confidence: number
}

interface DetectorProps {
  onError: (error: string) => void
  onLoaded: () => void
}

const EXPRESSION_COLORS: Record<string, string> = {
  neutral: "bg-blue-500",
  happy: "bg-yellow-500",
  sad: "bg-purple-500",
  angry: "bg-red-500",
  fearful: "bg-orange-500",
  disgusted: "bg-green-500",
  surprised: "bg-pink-500",
}

const loadFaceApiLibrary = (): Promise<any> => {
  return new Promise((resolve, reject) => {
    if (window.faceapi) {
      resolve(window.faceapi)
      return
    }

    const script = document.createElement("script")
    script.src = "https://cdn.jsdelivr.net/npm/@vladmandic/face-api@1.7.15/dist/face-api.min.js"
    script.async = true
    script.crossOrigin = "anonymous"

    script.onload = () => {
      resolve(window.faceapi)
    }

    script.onerror = () => {
      reject(new Error("Failed to load face-api library"))
    }

    document.head.appendChild(script)
  })
}

export default function FacialExpressionDetector({ onError, onLoaded }: DetectorProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [expressions, setExpressions] = useState<Expression[]>([])
  const [dominantExpression, setDominantExpression] = useState<string>("neutral")
  const [isInitialized, setIsInitialized] = useState(false)
  const animationFrameRef = useRef<number>()
  const modelsLoadedRef = useRef(false)

  useEffect(() => {
    let isMounted = true

    const initializeDetection = async () => {
      try {
        // Load face-api library
        console.log("[v0] Loading face-api library...")
        const faceapi = await loadFaceApiLibrary()
        console.log("[v0] Face-api library loaded")

        if (!isMounted) return

        const MODEL_URL = "https://cdn.jsdelivr.net/npm/@vladmandic/face-api@1.7.15/model/"
        console.log("[v0] Loading models from:", MODEL_URL)

        try {
          await Promise.all([
            faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
            faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL),
          ])
          console.log("[v0] Models loaded successfully")
          modelsLoadedRef.current = true
        } catch (modelErr) {
          console.error("[v0] Model loading error:", modelErr)
          throw new Error("Failed to load face detection models")
        }

        // Request camera access
        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } },
            audio: false,
          })

          if (videoRef.current && isMounted) {
            videoRef.current.srcObject = stream
            videoRef.current.onloadedmetadata = () => {
              videoRef.current?.play().catch((err) => {
                console.error("[v0] Play error:", err)
              })
              setIsInitialized(true)
              onLoaded()
            }
          }
        } catch (err) {
          if (isMounted) {
            console.error("[v0] Camera access error:", err)
            onError("Unable to access camera. Please check permissions.")
          }
        }
      } catch (err) {
        if (isMounted) {
          console.error("[v0] Initialization error:", err)
          onError(err instanceof Error ? err.message : "Failed to initialize detector")
        }
      }
    }

    initializeDetection()

    return () => {
      isMounted = false
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
      if (videoRef.current?.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream
        stream.getTracks().forEach((track) => track.stop())
      }
    }
  }, [onError, onLoaded])

  useEffect(() => {
    if (!isInitialized || !modelsLoadedRef.current) return

    const detectFaces = async () => {
      const video = videoRef.current
      const canvas = canvasRef.current

      if (!video || !canvas) return

      const ctx = canvas.getContext("2d")
      if (!ctx) return

      const detect = async () => {
        try {
          canvas.width = video.videoWidth
          canvas.height = video.videoHeight

          // Draw video frame
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

          if (window.faceapi && modelsLoadedRef.current) {
            const detections = await window.faceapi
              .detectAllFaces(canvas, new window.faceapi.TinyFaceDetectorOptions())
              .withFaceExpressions()

            console.log("[v0] Detections found:", detections.length)

            if (detections.length > 0) {
              const detection = detections[0]
              const exp = detection.expressions

              console.log("[v0] Expressions:", exp)

              // Get all expressions with confidence scores
              const expressionArray: Expression[] = [
                { label: "neutral", confidence: exp.neutral || 0 },
                { label: "happy", confidence: exp.happy || 0 },
                { label: "sad", confidence: exp.sad || 0 },
                { label: "angry", confidence: exp.angry || 0 },
                { label: "fearful", confidence: exp.fearful || 0 },
                { label: "disgusted", confidence: exp.disgusted || 0 },
                { label: "surprised", confidence: exp.surprised || 0 },
              ]

              // Sort by confidence
              expressionArray.sort((a, b) => b.confidence - a.confidence)
              setExpressions(expressionArray)
              setDominantExpression(expressionArray[0].label)

              // Draw detection box
              const box = detection.detection.box
              ctx.strokeStyle = "#0ea5e9"
              ctx.lineWidth = 3
              ctx.strokeRect(box.x, box.y, box.width, box.height)

              // Draw confidence text
              ctx.fillStyle = "#0ea5e9"
              ctx.font = "16px Arial"
              ctx.fillText(
                `${expressionArray[0].label}: ${(expressionArray[0].confidence * 100).toFixed(1)}%`,
                box.x,
                box.y - 10,
              )
            } else {
              console.log("[v0] No faces detected in this frame")
            }
          }
        } catch (err) {
          console.error("[v0] Detection error:", err)
        }

        animationFrameRef.current = requestAnimationFrame(detect)
      }

      detect()
    }

    detectFaces()

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [isInitialized])

  return (
    <div className="space-y-6">
      {/* Canvas and Video */}
      <div className="relative rounded-lg overflow-hidden bg-black aspect-video">
        <video ref={videoRef} className="w-full h-full object-cover" playsInline muted />
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
      </div>

      {/* Expression Display */}
      <div className="space-y-4">
        {/* Dominant Expression */}
        <div className="flex items-center justify-between p-4 bg-primary/10 rounded-lg border border-primary/20">
          <div>
            <p className="text-sm text-muted-foreground">Detected Expression</p>
            <p className="text-2xl font-bold capitalize text-primary">{dominantExpression}</p>
          </div>
          <div className={`w-16 h-16 rounded-full ${EXPRESSION_COLORS[dominantExpression] || "bg-gray-500"}`} />
        </div>

        {/* Expression Bars */}
        <div className="space-y-3">
          <p className="text-sm font-semibold text-muted-foreground">Confidence Scores</p>
          {expressions.map((expr) => (
            <div key={expr.label} className="space-y-1">
              <div className="flex justify-between items-center">
                <span className="text-sm capitalize font-medium">{expr.label}</span>
                <span className="text-xs text-muted-foreground">{(expr.confidence * 100).toFixed(1)}%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                <div
                  className={`h-full ${EXPRESSION_COLORS[expr.label] || "bg-gray-500"} transition-all duration-200`}
                  style={{ width: `${expr.confidence * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// Type declaration for face-api
declare global {
  interface Window {
    faceapi: any
  }
}
