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
      for (let i = 0; i < 50; i++) {
        snowflakes.push({
          id: i,
          left: Math.random() * 100,
          delay: Math.random() * 2,
          duration: 8 + Math.random() * 4,
          size: 4 + Math.random() * 6,
          opacity: 0.4 + Math.random() * 0.6,
        })
      }
      return snowflakes
    }

    snowflakesRef.current = generateSnowflakes()

    // Cleanup function
    return () => {
      if (container) {
        container.innerHTML = ""
      }
    }
  }, [])

  return (
    <div ref={containerRef} className="fixed inset-0 pointer-events-none z-10 overflow-hidden">
      <style jsx>{`
        @keyframes snowfall {
          to {
            transform: translateY(100vh) translateX(0);
            opacity: 0;
          }
        }

        .snowflake {
          position: absolute;
          top: -10px;
          width: 10px;
          height: 10px;
          background: white;
          border-radius: 50%;
          box-shadow: 0 0 5px rgba(255, 255, 255, 0.8);
          animation: snowfall linear forwards;
        }
      `}</style>

      {snowflakesRef.current.map((flake) => (
        <div
          key={flake.id}
          className="snowflake"
          style={{
            left: `${flake.left}%`,
            width: `${flake.size}px`,
            height: `${flake.size}px`,
            opacity: flake.opacity,
            animationDuration: `${flake.duration}s`,
            animationDelay: `${flake.delay}s`,
            boxShadow: `0 0 ${flake.size}px rgba(255, 255, 255, ${flake.opacity})`,
          }}
        />
      ))}
    </div>
  )
}
