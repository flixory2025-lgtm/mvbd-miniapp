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
  blur: number
}

export default function Snowfall() {
  const containerRef = useRef<HTMLDivElement>(null)
  const snowflakesRef = useRef<Snowflake[]>([])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    // Generate 120 snowflakes for dense snowfall
    const generateSnowflakes = () => {
      const snowflakes: Snowflake[] = []
      for (let i = 0; i < 120; i++) { // 120 snowflakes
        const size = Math.random() > 0.7 ? 
          2 + Math.random() * 3 : // 70% small flakes
          1 + Math.random() * 2   // 30% tiny flakes
          
        snowflakes.push({
          id: i,
          left: Math.random() * 100,
          delay: Math.random() * 8, // More varied delays
          duration: 10 + Math.random() * 15, // Slower, more varied
          size: size,
          opacity: 0.08 + Math.random() * 0.25, // Very light and transparent
          sway: 20 + Math.random() * 60, // More sway movement
          blur: 0.1 + Math.random() * 0.4, // Blur effect
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
            transform: translateY(-30px) translateX(0) rotate(0deg);
            opacity: 0;
          }
          5% {
            opacity: var(--flake-opacity);
          }
          95% {
            opacity: calc(var(--flake-opacity) * 0.3);
          }
          100% {
            transform: translateY(100vh) translateX(var(--sway)) rotate(var(--rotate));
            opacity: 0;
          }
        }

        @keyframes float {
          0%, 100% {
            transform: translateX(0);
          }
          50% {
            transform: translateX(var(--float-distance));
          }
        }

        .snowflake {
          position: absolute;
          top: -30px;
          border-radius: 50%;
          animation: snowfall linear forwards, float ease-in-out infinite;
          animation-iteration-count: infinite;
          filter: blur(var(--blur));
          pointer-events: none;
          background: radial-gradient(
            circle at 30% 30%,
            rgba(255, 255, 255, var(--flake-opacity)) 0%,
            rgba(255, 255, 255, calc(var(--flake-opacity) * 0.3)) 70%,
            transparent 100%
          );
        }
      `}</style>

      {snowflakesRef.current.map((flake) => (
        <div
          key={flake.id}
          className="snowflake"
          style={{
            '--flake-opacity': `${flake.opacity}`,
            '--sway': `${flake.sway}px`,
            '--blur': `${flake.blur}px`,
            '--rotate': `${Math.random() * 360}deg`,
            '--float-distance': `${(Math.random() * 20) - 10}px`,
            left: `${flake.left}%`,
            width: `${flake.size}px`,
            height: `${flake.size}px`,
            animationDuration: `${flake.duration}s`,
            animationDelay: `${flake.delay}s`,
            animationTimingFunction: 'linear',
          } as React.CSSProperties}
        />
      ))}
    </div>
  )
}
