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

    // Generate snowflakes with more realistic parameters
    const generateSnowflakes = () => {
      const snowflakes: Snowflake[] = []
      for (let i = 0; i < 60; i++) { // Increased number of flakes
        snowflakes.push({
          id: i,
          left: Math.random() * 100,
          delay: Math.random() * 3,
          duration: 10 + Math.random() * 8, // Slower falling
          size: 3 + Math.random() * 5, // Smaller flakes
          opacity: 0.2 + Math.random() * 0.4, // More transparent
          sway: 10 + Math.random() * 20, // Sideways movement
        })
      }
      return snowflakes
    }

    snowflakesRef.current = generateSnowflakes()
  }, [])

  return (
    <div ref={containerRef} className="absolute top-16 inset-x-0 h-[calc(100vh-4rem)] pointer-events-none z-10 overflow-hidden">
      <style jsx>{`
        @keyframes snowfall {
          0% {
            transform: translateY(-20px) translateX(0);
            opacity: 0;
          }
          10% {
            opacity: 1;
          }
          90% {
            opacity: 0.8;
          }
          100% {
            transform: translateY(calc(100vh - 4rem)) translateX(var(--sway));
            opacity: 0;
          }
        }

        .snowflake {
          position: absolute;
          top: -20px;
          width: 10px;
          height: 10px;
          background: white;
          border-radius: 50%;
          filter: blur(0.5px);
          animation: snowfall linear forwards;
          animation-iteration-count: infinite;
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
            '--sway': `${Math.random() > 0.5 ? '+' : '-'}${flake.sway}px`,
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
