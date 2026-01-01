"use client"

import { useEffect, useRef, useState } from "react"

interface Snowflake {
  id: number
  left: number
  delay: number
  duration: number
  size: number
  opacity: number
  sway: number
  swayDuration: number
}

export default function Snowfall() {
  const containerRef = useRef<HTMLDivElement>(null)
  const [snowflakes, setSnowflakes] = useState<Snowflake[]>([])

  useEffect(() => {
    // Generate 150 snowflakes with varied properties
    const generateSnowflakes = () => {
      const flakes: Snowflake[] = []
      for (let i = 0; i < 150; i++) {
        flakes.push({
          id: i,
          left: Math.random() * 100, // Spread across full width
          delay: Math.random() * 5, // Staggered start times
          duration: 10 + Math.random() * 20, // Slower, longer falling
          size: 2 + Math.random() * 8, // Varied sizes (2-10px)
          opacity: 0.3 + Math.random() * 0.7, // More varied opacity
          sway: Math.random() * 50 - 25, // Horizontal sway amount (-25px to 25px)
          swayDuration: 2 + Math.random() * 3, // Sway animation speed
        })
      }
      return flakes
    }

    setSnowflakes(generateSnowflakes())

    // Create continuous snowfall effect
    const interval = setInterval(() => {
      // Every 2 seconds, regenerate some snowflakes to keep continuous flow
      setSnowflakes(prev => {
        const newFlakes = [...prev]
        // Replace 10 random snowflakes that have finished falling
        for (let i = 0; i < 10; i++) {
          const randomIndex = Math.floor(Math.random() * newFlakes.length)
          newFlakes[randomIndex] = {
            id: Date.now() + i, // New ID
            left: Math.random() * 100,
            delay: 0, // Start immediately
            duration: 10 + Math.random() * 20,
            size: 2 + Math.random() * 8,
            opacity: 0.3 + Math.random() * 0.7,
            sway: Math.random() * 50 - 25,
            swayDuration: 2 + Math.random() * 3,
          }
        }
        return newFlakes
      })
    }, 2000)

    return () => {
      clearInterval(interval)
    }
  }, [])

  return (
    <div ref={containerRef} className="fixed inset-0 pointer-events-none z-10 overflow-hidden">
      <style jsx>{`
        @keyframes snowfall {
          0% {
            transform: translateY(-20px) translateX(0);
            opacity: 0;
          }
          10% {
            opacity: var(--flake-opacity);
          }
          90% {
            opacity: var(--flake-opacity);
          }
          100% {
            transform: translateY(100vh) translateX(var(--end-sway));
            opacity: 0;
          }
        }

        @keyframes sway {
          0%, 100% {
            transform: translateX(0);
          }
          50% {
            transform: translateX(var(--sway-amount));
          }
        }

        .snowflake {
          position: absolute;
          top: -20px;
          border-radius: 50%;
          background: radial-gradient(circle at 30% 30%, white, rgba(255, 255, 255, 0.8));
          filter: blur(0.5px);
          animation: snowfall linear forwards, sway ease-in-out infinite;
        }
      `}</style>

      {snowflakes.map((flake) => {
        const endSway = flake.sway * 2; // Increase sway at the end
        return (
          <div
            key={flake.id}
            className="snowflake"
            style={{
              '--flake-opacity': `${flake.opacity}`,
              '--sway-amount': `${flake.sway}px`,
              '--end-sway': `${endSway}px`,
              left: `${flake.left}%`,
              width: `${flake.size}px`,
              height: `${flake.size}px`,
              animation: `snowfall ${flake.duration}s linear ${flake.delay}s forwards, 
                         sway ${flake.swayDuration}s ease-in-out ${flake.delay}s infinite`,
            } as React.CSSProperties}
          />
        )
      })}
    </div>
  )
}
