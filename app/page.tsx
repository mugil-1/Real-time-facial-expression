"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Camera, AlertCircle } from "lucide-react"
import FacialExpressionDetector from "@/components/facial-expression-detector"

export default function Home() {
  const [isLoading, setIsLoading] = useState(true)
  const [isActive, setIsActive] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleStart = () => {
    setIsActive(true)
    setError(null)
  }

  const handleStop = () => {
    setIsActive(false)
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="max-w-6xl mx-auto px-4 py-8 md:py-12">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-4xl md:text-5xl font-bold mb-3 text-balance">Facial Expression Detector</h1>
          <p className="text-lg text-muted-foreground text-balance">
            Real-time emotion and expression recognition powered by AI
          </p>
        </div>

        {/* Main Card */}
        <Card className="overflow-hidden border-2 border-primary/20 shadow-lg">
          <div className="p-6 md:p-8">
            {/* Camera Feed */}
            <div className="mb-6">
              {error && (
                <div className="mb-4 flex items-center gap-3 p-4 bg-destructive/10 border border-destructive/30 rounded-lg">
                  <AlertCircle className="h-5 w-5 text-destructive" />
                  <p className="text-sm text-destructive">{error}</p>
                </div>
              )}

              {isActive ? (
                <FacialExpressionDetector
                  onError={(err) => {
                    setError(err)
                    setIsActive(false)
                  }}
                  onLoaded={() => setIsLoading(false)}
                />
              ) : (
                <div className="flex flex-col items-center justify-center gap-4 p-12 bg-muted/50 rounded-lg border border-border/50">
                  <Camera className="h-12 w-12 text-muted-foreground" />
                  <p className="text-center text-muted-foreground">Click start to begin facial expression detection</p>
                </div>
              )}
            </div>

            {/* Controls */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              {!isActive ? (
                <Button
                  onClick={handleStart}
                  size="lg"
                  className="bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  <Camera className="mr-2 h-5 w-5" />
                  Start Detection
                </Button>
              ) : (
                <Button onClick={handleStop} size="lg" variant="outline">
                  Stop Detection
                </Button>
              )}
            </div>

            {/* Info Section */}
            <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-card rounded-lg border border-border/50">
                <h3 className="font-semibold mb-2 text-sm">Expressions Detected</h3>
                <p className="text-xs text-muted-foreground">
                  Happy, sad, angry, neutral, fearful, disgusted, surprised
                </p>
              </div>
              <div className="p-4 bg-card rounded-lg border border-border/50">
                <h3 className="font-semibold mb-2 text-sm">Real-Time Processing</h3>
                <p className="text-xs text-muted-foreground">Browser-based detection using TensorFlow.js</p>
              </div>
              <div className="p-4 bg-card rounded-lg border border-border/50">
                <h3 className="font-semibold mb-2 text-sm">Privacy First</h3>
                <p className="text-xs text-muted-foreground">All processing happens locally on your device</p>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </main>
  )
}
