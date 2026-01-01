"use client"

import { useEffect, useRef } from "react"

interface Snowflake {
  id: number
  left: number
  delay: number
  duration: number
  size: number
  opacity: number
  sway: number
}

export default function Snowfall() {
  const containerRef = useRef<HTMLDivElement>(null)
  const snowflakesRef = useRef<Snowflake[]>([])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    // Generate snowflakes that will be on top of everything
    const generateSnowflakes = () => {
      const snowflakes: Snowflake[] = []
      // More flakes for better coverage
      for (let i = 0; i < 70; i++) {
        snowflakes.push({
          id: i,
          left: Math.random() * 100,
          delay: Math.random() * 5,
          duration: 8 + Math.random() * 10, // Varied speed
          size: 1 + Math.random() * 4, // Very small flakes
          opacity: 0.1 + Math.random() * 0.4, // Very transparent
          sway: 10 + Math.random() * 40, // More sway
        })
      }
      return snowflakes
    }

    snowflakesRef.current = generateSnowflakes()
  }, [])

  return (
    <div ref={containerRef} className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      <style jsx>{`
        @keyframes snowfall {
          0% {
            transform: translateY(-20px) translateX(0);
            opacity: 0;
          }
          5% {
            opacity: var(--flake-opacity);
          }
          95% {
            opacity: calc(var(--flake-opacity) * 0.5);
          }
          100% {
            transform: translateY(100vh) translateX(var(--sway));
            opacity: 0;
          }
        }

        .snowflake {
          position: absolute;
          top: -20px;
          width: 10px;
          height: 10px;
          border-radius: 50%;
          animation: snowfall linear forwards;
          animation-iteration-count: infinite;
          filter: blur(0.2px);
          pointer-events: none;
        }
      `}</style>

      {snowflakesRef.current.map((flake) => (
        <div
          key={flake.id}
          className="snowflake"
          style={{
            '--flake-opacity': `${flake.opacity}`,
            '--sway': `${flake.sway}px`,
            left: `${flake.left}%`,
            width: `${flake.size}px`,
            height: `${flake.size}px`,
            animationDuration: `${flake.duration}s`,
            animationDelay: `${flake.delay}s`,
            background: `rgba(255, 255, 255, ${flake.opacity})`,
            boxShadow: `
              0 0 ${flake.size}px rgba(255, 255, 255, ${flake.opacity}),
              0 0 ${flake.size * 2}px rgba(255, 255, 255, ${flake.opacity * 0.3})
            `,
          } as React.CSSProperties}
        />
      ))}
    </div>
  )
}
