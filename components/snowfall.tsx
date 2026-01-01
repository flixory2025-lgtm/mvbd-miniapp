"use client"

import { useEffect, useRef } from "react"

interface Snowflake {
  id: number
  left: number
  delay: number
  duration: number
  size: number
  opacity: number
}

export default function Snowfall() {
  const containerRef = useRef<HTMLDivElement>(null)
  const snowflakesRef = useRef<Snowflake[]>([])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    // Generate snowflakes
    const generateSnowflakes = () => {
      const snowflakes: Snowflake[] = []
      for (let i = 0; i < 35; i++) {
        snowflakes.push({
          id: i,
          left: Math.random() * 100,
          delay: Math.random() * 2,
          duration: 6 + Math.random() * 4,
          size: 2 + Math.random() * 3, // Very small flakes
          opacity: 0.1 + Math.random() * 0.2, // Very transparent
        })
      }
      return snowflakes
    }

    snowflakesRef.current = generateSnowflakes()
  }, [])

  return (
    <div ref={containerRef} className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
      <style jsx>{`
        @keyframes snowfall {
          0% {
            transform: translateY(-10px) translateX(0);
            opacity: 0;
          }
          10% {
            opacity: var(--flake-opacity);
          }
          90% {
            opacity: var(--flake-opacity);
          }
          100% {
            transform: translateY(100vh) translateX(0);
            opacity: 0;
          }
        }

        .snowflake {
          position: absolute;
          top: -10px;
          width: 10px;
          height: 10px;
          border-radius: 50%;
          animation: snowfall linear forwards;
          animation-iteration-count: infinite;
        }
      `}</style>

      {snowflakesRef.current.map((flake) => (
        <div
          key={flake.id}
          className="snowflake"
          style={{
            '--flake-opacity': `${flake.opacity}`,
            left: `${flake.left}%`,
            width: `${flake.size}px`,
            height: `${flake.size}px`,
            animationDuration: `${flake.duration}s`,
            animationDelay: `${flake.delay}s`,
            background: `rgba(255, 255, 255, ${flake.opacity})`,
            boxShadow: `0 0 ${flake.size}px rgba(255, 255, 255, ${flake.opacity})`,
          } as React.CSSProperties}
        />
      ))}
    </div>
  )
}
