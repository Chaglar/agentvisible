'use client'

import { useState, useEffect, useRef } from 'react'

interface ScanResultPanelProps {
  url: string
  modules: {
    structured_data: number
    ai_crawlability: number
    content_parseability: number
    commerce_protocols: number
    agent_discovery: number
  }
  score: number
  status: string // "STRONG · top 25%" | "MODERATE · top 50%" | etc
  topFix: string // "Top fix: enable MCP endpoints (+18 points)"
  animate?: boolean // true for hero demo (loops), false for real results (plays once)
  isLive?: boolean // true shows "● LIVE" indicator (hero only)
}

export default function ScanResultPanel({
  url,
  modules,
  score,
  status,
  topFix,
  animate = false,
  isLive = false
}: ScanResultPanelProps) {
  const moduleNames = [
    'Structured data',
    'AI crawlability',
    'Content parseability',
    'Commerce protocols',
    'Agent discovery'
  ]

  const moduleValues = [
    modules.structured_data,
    modules.ai_crawlability,
    modules.content_parseability,
    modules.commerce_protocols,
    modules.agent_discovery
  ]

  const [isPaused, setIsPaused] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)

  // Animated values - these count up from 0 to target
  const [currentModuleValues, setCurrentModuleValues] = useState([0, 0, 0, 0, 0])
  const [currentScore, setCurrentScore] = useState(0)
  const [showStatus, setShowStatus] = useState(!animate) // For non-animated, show immediately
  const [showTopFix, setShowTopFix] = useState(!animate) // For non-animated, show immediately

  const timeoutRefs = useRef<NodeJS.Timeout[]>([])

  // Count-up animation helper
  const animateCountUp = (
    setValue: (value: number) => void,
    targetValue: number,
    duration: number,
    delay: number = 0
  ) => {
    const timeoutId = setTimeout(() => {
      const steps = 30
      const increment = targetValue / steps
      let step = 0

      const interval = setInterval(() => {
        step++
        const newValue = Math.min(Math.round(increment * step), targetValue)
        setValue(newValue)

        if (step >= steps) {
          clearInterval(interval)
        }
      }, duration / steps)
    }, delay)

    timeoutRefs.current.push(timeoutId)
  }

  // Get status icon based on value
  const getStatusIcon = (value: number) => {
    if (value >= 75) return '✓'
    if (value >= 50) return '⚠'
    if (value > 0) return '✗'
    return ''
  }

  // Get status color based on value
  const getStatusColor = (value: number) => {
    if (value >= 75) return 'text-green-400'
    if (value >= 50) return 'text-yellow-400'
    if (value > 0) return 'text-red-400'
    return 'text-slate-400'
  }

  // Animation sequence for animated version
  const startAnimation = () => {
    if (isPaused || !animate) return

    // Clear any existing timeouts
    timeoutRefs.current.forEach(timeout => clearTimeout(timeout))
    timeoutRefs.current = []

    // Reset to zero state
    setIsAnimating(true)
    setCurrentModuleValues([0, 0, 0, 0, 0])
    setCurrentScore(0)
    setShowStatus(false)
    setShowTopFix(false)

    // Animate modules sequentially (0.5s delay between each)
    moduleValues.forEach((targetValue, index) => {
      animateCountUp(
        (value) => setCurrentModuleValues(prev => {
          const newValues = [...prev]
          newValues[index] = value
          return newValues
        }),
        targetValue,
        1000, // 1 second duration
        500 + index * 500 // Start at 0.5s, then 1s, 1.5s, 2s, 2.5s
      )
    })

    // Animate gauge (starts at 5.5s)
    animateCountUp(
      (value) => setCurrentScore(value),
      score,
      1500,
      5500
    )

    // Show status at 7s
    const statusTimeout = setTimeout(() => {
      setShowStatus(true)
    }, 7000)
    timeoutRefs.current.push(statusTimeout)

    // Show top fix at 7.5s
    const topFixTimeout = setTimeout(() => {
      setShowTopFix(true)
    }, 7500)
    timeoutRefs.current.push(topFixTimeout)
  }

  // Setup initial values and animation
  useEffect(() => {
    if (animate) {
      // Animated version - start with zeros and animate up
      startAnimation()
    } else {
      // Non-animated version - show final values immediately
      setCurrentModuleValues(moduleValues)
      setCurrentScore(score)
      setShowStatus(true)
      setShowTopFix(true)
    }

    return () => {
      timeoutRefs.current.forEach(timeout => clearTimeout(timeout))
    }
  }, [animate, score, JSON.stringify(moduleValues)])

  // Handle pause/resume for animated version
  useEffect(() => {
    if (!animate) return

    if (isPaused) {
      timeoutRefs.current.forEach(timeout => clearTimeout(timeout))
    } else {
      startAnimation()
    }
  }, [isPaused, animate])

  // Calculate gauge stroke offset
  const circumference = 2 * Math.PI * 32
  const gaugeOffset = circumference - (currentScore / 100) * circumference

  return (
    <div
      className="bg-dark-3 border border-dark-5 rounded-xl p-6 max-w-lg mx-auto lg:mx-0"
      onMouseEnter={() => animate && setIsPaused(true)}
      onMouseLeave={() => animate && setIsPaused(false)}
    >
      <div className="space-y-4">
        {/* Browser Chrome */}
        <div className="bg-dark-4 rounded-t-lg p-3 mb-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="flex gap-1">
              <div className="w-3 h-3 rounded-full bg-red-400"></div>
              <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
              <div className="w-3 h-3 rounded-full bg-green-400"></div>
            </div>
            {isLive && (
              <div className="flex items-center gap-2 ml-4">
                <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse-slow"></div>
                <span className="text-xs text-green-400 font-mono">LIVE</span>
              </div>
            )}
          </div>
          <div className="text-xs text-slate-400 font-mono bg-dark-5 px-3 py-1 rounded">
            agentvisible.ai/scan/{url.replace('https://', '')}
          </div>
        </div>

        {/* Terminal */}
        <div className="bg-black rounded-lg p-4 mb-4 font-mono text-sm">
          <div className="text-green-400 mb-2">$ agentvisible scan {url.replace('https://', '')}<span className="animate-pulse">_</span></div>

          {/* Module rows - Always visible, values animate from 0 */}
          <div className="space-y-2">
            {moduleNames.map((name, index) => (
              <div key={index} className="flex justify-between items-center">
                <span className="text-slate-300">{name}</span>
                <div className="flex items-center gap-2">
                  {/* Progress bar track - always visible */}
                  <div className="w-16 bg-slate-700 rounded-full h-1.5 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-1000 ease-out ${
                        currentModuleValues[index] >= 75 ? 'bg-green-400' :
                        currentModuleValues[index] >= 50 ? 'bg-yellow-400' : 'bg-red-400'
                      }`}
                      style={{ width: `${currentModuleValues[index]}%` }}
                    />
                  </div>
                  {/* Status icon */}
                  <span className={`text-sm ${getStatusColor(currentModuleValues[index])}`}>
                    {getStatusIcon(currentModuleValues[index])}
                  </span>
                  {/* Score value */}
                  <span className="text-slate-400 text-xs w-12">{currentModuleValues[index]}/100</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Score Gauge */}
        <div className="flex items-center gap-6">
          <div className="relative w-18 h-18">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 72 72">
              {/* Background circle - always visible */}
              <circle
                cx="36"
                cy="36"
                r="32"
                stroke="currentColor"
                strokeWidth="6"
                fill="none"
                className="text-slate-700"
              />
              {/* Progress arc - animates from 0 to score */}
              <circle
                cx="36"
                cy="36"
                r="32"
                stroke={currentScore >= 75 ? '#10b981' : currentScore >= 50 ? '#f59e0b' : '#ef4444'}
                strokeWidth="6"
                fill="none"
                strokeDasharray="201"
                strokeDashoffset={201 - (currentScore / 100) * 201}
                strokeLinecap="round"
                style={{
                  transition: 'stroke-dashoffset 1500ms ease-out, stroke 300ms ease-out'
                }}
              />
            </svg>
            {/* Score text - always visible */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className={`text-lg font-bold font-mono transition-colors duration-300 ${
                  currentScore >= 75 ? 'text-green-400' :
                  currentScore >= 50 ? 'text-yellow-400' : 'text-red-400'
                }`}>
                  {currentScore}
                </div>
                <div className="text-xs text-slate-400">score</div>
              </div>
            </div>
          </div>

          {/* Results - Always visible but content fades in for animated version */}
          <div className="flex-1">
            <div className={`text-lg font-bold transition-all duration-300 ${
              showStatus ? 'opacity-100' : 'opacity-0'
            } ${
              currentScore >= 75 ? 'text-green-400' :
              currentScore >= 50 ? 'text-yellow-400' : 'text-red-400'
            }`}>
              {currentScore}/100 {showStatus ? status : 'SCANNING...'}
            </div>
            <div className={`text-xs text-slate-400 mt-1 transition-all duration-300 ${
              showTopFix ? 'opacity-100' : 'opacity-0'
            }`}>
              {showTopFix ? topFix : ''}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}