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

    // Generate snowflakes for header background
    const generateSnowflakes = () => {
      const snowflakes: Snowflake[] = []
      for (let i = 0; i < 40; i++) {
        snowflakes.push({
          id: i,
          left: Math.random() * 100,
          delay: Math.random() * 3,
          duration: 12 + Math.random() * 8, // Slower falling for dramatic effect
          size: 2 + Math.random() * 4, // Small flakes
          opacity: 0.2 + Math.random() * 0.3, // More transparent
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
            transform: translateY(-20px) translateX(0);
            opacity: 0;
          }
          5% {
            opacity: var(--flake-opacity);
          }
          95% {
            opacity: calc(var(--flake-opacity) * 0.8);
          }
          100% {
            transform: translateY(300px) translateX(calc(var(--left) * 0.1px));
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
          filter: blur(0.3px);
        }
      `}</style>

      {snowflakesRef.current.map((flake) => (
        <div
          key={flake.id}
          className="snowflake"
          style={{
            '--flake-opacity': `${flake.opacity}`,
            '--left': `${flake.left}`,
            left: `${flake.left}%`,
            width: `${flake.size}px`,
            height: `${flake.size}px`,
            animationDuration: `${flake.duration}s`,
            animationDelay: `${flake.delay}s`,
            background: `rgba(255, 255, 255, ${flake.opacity})`,
            boxShadow: `
              0 0 ${flake.size}px rgba(255, 255, 255, ${flake.opacity}),
              0 0 ${flake.size * 1.5}px rgba(255, 255, 255, ${flake.opacity * 0.5})
            `,
          } as React.CSSProperties}
        />
      ))}
    </div>
  )
}
