"use client"

import { useEffect, useState } from "react"

interface Snowflake {
  id: number
  x: number
  y: number
  size: number
  speed: number
  opacity: number
  sway: number
  rotation: number
  rotationSpeed: number
}

export default function Snowfall() {
  const [snowflakes, setSnowflakes] = useState<Snowflake[]>([])

  useEffect(() => {
    // Initialize 150 snowflakes for dense snowfall
    const initialSnowflakes: Snowflake[] = []
    for (let i = 0; i < 150; i++) {
      const size = Math.random() > 0.7 
        ? 1 + Math.random() * 2  // 30% খুব ছোট flakes
        : 2 + Math.random() * 4  // 70% সাধারণ flakes
        
      initialSnowflakes.push({
        id: i,
        x: Math.random() * 100, // Random horizontal position
        y: Math.random() * 100, // Random vertical starting point
        size: size,
        speed: 0.1 + Math.random() * 0.4, // খুব slow speed (0.1-0.5)
        opacity: 0.15 + Math.random() * 0.3, // Light and transparent (0.15-0.45)
        sway: 0.2 + Math.random() * 0.4, // সামান্য side movement
        rotation: Math.random() * 360, // Random starting rotation
        rotationSpeed: (Math.random() - 0.5) * 0.5, // Slow rotation speed
      })
    }
    setSnowflakes(initialSnowflakes)

    // Animation loop for smooth movement
    let animationId: number
    let lastTime = 0
    
    const updateSnowflakes = (timestamp: number) => {
      if (!lastTime) lastTime = timestamp
      const deltaTime = Math.min(timestamp - lastTime, 32) // Cap at 32ms for smoothness
      lastTime = timestamp

      setSnowflakes(prev => 
        prev.map(flake => {
          // খুব ধীরে ধীরে নিচে পড়া
          let newY = flake.y + (flake.speed * deltaTime * 0.05)
          
          // সামান্য side-to-side sway (sin wave motion)
          const timeOffset = timestamp * 0.001
          let newX = flake.x + Math.sin(timeOffset * 0.5 + flake.id * 0.1) * flake.sway
          
          // Slow rotation
          let newRotation = flake.rotation + flake.rotationSpeed * deltaTime * 0.05
          
          // Reset if goes below screen
          if (newY > 100) {
            newY = -5
            newX = Math.random() * 100
            newRotation = Math.random() * 360
          }
          
          // Keep X within bounds
          if (newX > 100) newX = 100
          if (newX < 0) newX = 0

          return {
            ...flake,
            y: newY,
            x: newX,
            rotation: newRotation,
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
        mixBlendMode: 'screen', // এটা snowfall কে আরও natural look দেবে
      }}
    >
      {snowflakes.map(flake => (
        <div
          key={flake.id}
          className="absolute"
          style={{
            left: `${flake.x}%`,
            top: `${flake.y}%`,
            width: `${flake.size}px`,
            height: `${flake.size}px`,
            opacity: flake.opacity,
            filter: `
              blur(${0.3 + flake.size * 0.1}px)
              drop-shadow(0 0 ${flake.size * 0.3}px rgba(255, 255, 255, ${flake.opacity * 0.7}))
            `,
            background: `
              radial-gradient(
                circle at 40% 40%,
                rgba(255, 255, 255, ${flake.opacity}) 0%,
                rgba(255, 255, 255, ${flake.opacity * 0.4}) 50%,
                transparent 80%
              )
            `,
            borderRadius: '50%',
            transform: `
              translate(-50%, -50%)
              rotate(${flake.rotation}deg)
              scale(${0.8 + Math.sin(Date.now() * 0.001 + flake.id) * 0.2})
            `,
            willChange: 'transform, opacity',
            transition: 'transform 0.3s ease-out, opacity 0.3s ease-out',
            boxShadow: `
              inset 0 0 ${flake.size * 0.5}px rgba(255, 255, 255, ${flake.opacity * 0.3}),
              0 0 ${flake.size}px rgba(255, 255, 255, ${flake.opacity * 0.5}),
              0 0 ${flake.size * 2}px rgba(255, 255, 255, ${flake.opacity * 0.2})
            `,
          }}
        />
      ))}
      
      {/* Additional CSS for extra effects */}
      <style jsx global>{`
        @keyframes gentle-float {
          0%, 100% { transform: translateX(0) translateY(0); }
          50% { transform: translateX(calc(var(--sway) * 1px)) translateY(calc(var(--bob) * 1px)); }
        }
        
        @keyframes gentle-spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
