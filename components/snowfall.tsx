"use client"

import { useEffect, useState } from "react"

interface Snowflake {
  id: number
  x: number
  y: number
  size: number
  speed: number
  opacity: number
}

export default function Snowfall() {
  const [snowflakes, setSnowflakes] = useState<Snowflake[]>([])

  useEffect(() => {
    // Initialize snowflakes - 150 টি snowflake
    const initialSnowflakes: Snowflake[] = []
    for (let i = 0; i < 150; i++) {
      initialSnowflakes.push({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: 1 + Math.random() * 5, // 1-6px সাইজ
        speed: 0.5 + Math.random() * 2, // বিভিন্ন গতি
        opacity: 0.2 + Math.random() * 0.5, // 0.2-0.7 opacity
      })
    }
    setSnowflakes(initialSnowflakes)

    // Animation loop
    let animationId: number
    let lastTime = 0
    const updateSnowflakes = (timestamp: number) => {
      if (!lastTime) lastTime = timestamp
      const deltaTime = timestamp - lastTime
      lastTime = timestamp

      setSnowflakes(prev => 
        prev.map(flake => {
          let newY = flake.y + (flake.speed * deltaTime * 0.05)
          let newX = flake.x + Math.sin(timestamp * 0.001 + flake.id) * 0.2
          
          // Reset if goes below screen
          if (newY > 100) {
            newY = -5
            newX = Math.random() * 100
          }
          
          // Keep X within bounds
          if (newX > 100) newX = 100
          if (newX < 0) newX = 0

          return {
            ...flake,
            y: newY,
            x: newX,
          }
        })
      )
      animationId = requestAnimationFrame(updateSnowflakes)
    }

    animationId = requestAnimationFrame(updateSnowflakes)

    return () => {
      cancelAnimationFrame(animationId)
    }
  }, [])

  return (
    <div 
      className="fixed inset-0 pointer-events-none z-50 overflow-hidden"
      style={{
        background: 'transparent',
      }}
    >
      {snowflakes.map(flake => (
        <div
          key={flake.id}
          className="absolute rounded-full"
          style={{
            left: `${flake.x}%`,
            top: `${flake.y}%`,
            width: `${flake.size}px`,
            height: `${flake.size}px`,
            opacity: flake.opacity,
            filter: 'blur(0.8px)',
            background: `radial-gradient(circle at 30% 30%, rgba(255, 255, 255, ${flake.opacity}) 0%, rgba(255, 255, 255, ${flake.opacity * 0.3}) 70%, transparent 100%)`,
            boxShadow: `
              0 0 ${flake.size}px rgba(255, 255, 255, ${flake.opacity}),
              0 0 ${flake.size * 2}px rgba(255, 255, 255, ${flake.opacity * 0.3})
            `,
            transform: `translate(-50%, -50%)`,
            willChange: 'transform, opacity',
          }}
        />
      ))}
    </div>
  )
}
