"use client"

import { Home, Star, User } from "lucide-react"
import { useState } from "react"

interface BottomNavigationProps {
  activeTab: string
  onTabChange: (tab: string) => void
}

export default function BottomNavigation({ activeTab, onTabChange }: BottomNavigationProps) {
  const [clickedTab, setClickedTab] = useState<string | null>(null)
  const [bubbles, setBubbles] = useState<Array<{ id: number; tabId: string }>>([])

  const tabs = [
    { id: "home", label: "Home", icon: Home },
    {
      id: "shorts",
      label: "Anime",
      icon: ({ className }: { className?: string }) => (
        <img
          src="https://i.postimg.cc/qMRsY9Zh/360-F-616340820-puy-Fuujd-Aam-JVt-Ct9sr-V1dc-PVrku-Kg-Z6-removebg-preview.png"
          alt="Anime Logo"
          className={`w-6 h-6 object-contain ${className || ""}`}
        />
      ),
    },
    { id: "exclusive", label: "Platforms", icon: Star },
    { id: "profile", label: "Profile", icon: User },
  ]

  const handleTabClick = (tabId: string) => {
    setClickedTab(tabId)
    onTabChange(tabId)

    // Create water bubbles
    const newBubbles = Array.from({ length: 6 }).map((_, i) => ({
      id: Date.now() + i,
      tabId,
    }))
    setBubbles([...bubbles, ...newBubbles])

    // Remove bubbles after animation
    setTimeout(() => {
      setBubbles([])
    }, 800)
  }

  return (
    <>
      <style>{`
        @keyframes waterBubbleRise {
          0% {
            opacity: 1;
            transform: translate(0, 0) scale(1);
            filter: blur(0);
          }
          100% {
            opacity: 0;
            transform: translate(var(--tx), -50px) scale(0.3);
            filter: blur(1px);
          }
        }

        @keyframes navPulse {
          0% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.08);
          }
          100% {
            transform: scale(1);
          }
        }

        @keyframes bubbleGlow {
          0% {
            box-shadow: 0 0 4px rgba(59, 130, 246, 0.6), inset -1px -1px 2px rgba(0, 0, 0, 0.2);
          }
          100% {
            box-shadow: 0 0 12px rgba(96, 165, 250, 0.3), inset -1px -1px 2px rgba(0, 0, 0, 0.1);
          }
        }

        .nav-bubble {
          position: absolute;
          width: 10px;
          height: 10px;
          background: radial-gradient(circle at 35% 35%, rgba(96, 165, 250, 0.9), rgba(59, 130, 246, 0.4));
          border-radius: 50%;
          border: 1px solid rgba(96, 165, 250, 0.5);
          pointer-events: none;
          box-shadow: 0 0 6px rgba(59, 130, 246, 0.5), 
                      inset -2px -2px 3px rgba(0, 0, 0, 0.15),
                      inset 1px 1px 2px rgba(255, 255, 255, 0.1);
        }

        .nav-bubble.active {
          animation: waterBubbleRise 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }

        .nav-button.clicked {
          animation: navPulse 0.4s ease-out;
        }
      `}</style>

      <nav className="fixed bottom-0 left-0 right-0 bg-black/40 backdrop-blur-xl z-50 safe-area-bottom flex items-end justify-center pb-4 px-4">
        <style>{`
          @keyframes liquidButtonZoom {
            0% {
              transform: scale(1);
              background: rgba(255, 255, 255, 0.05);
              backdrop-filter: blur(20px);
            }
            50% {
              transform: scale(1.15);
              background: rgba(255, 255, 255, 0.1);
              backdrop-filter: blur(25px);
            }
            100% {
              transform: scale(1.2);
              background: rgba(255, 255, 255, 0.12);
              backdrop-filter: blur(30px);
            }
          }

          .nav-pill-container {
            background: rgba(30, 30, 40, 0.6);
            backdrop-filter: blur(25px);
            border: 1px solid rgba(255, 255, 255, 0.15);
            border-radius: 40px;
            padding: 12px 20px;
            display: flex;
            items-align: center;
            gap: 12px;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
          }

          .liquid-nav-button {
            background: rgba(255, 255, 255, 0.08);
            backdrop-filter: blur(20px);
            border: 1px solid rgba(255, 255, 255, 0.15);
            transition: all 0.3s ease;
            position: relative;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 6px;
            width: 60px;
            height: 60px;
            border-radius: 30px;
            cursor: pointer;
            padding: 0;
          }

          .liquid-nav-button:hover {
            background: rgba(255, 255, 255, 0.12);
            backdrop-filter: blur(25px);
            border: 1px solid rgba(255, 255, 255, 0.3);
            transform: scale(1.05);
          }

          @keyframes greenFirePulse {
            0%, 100% {
              box-shadow: 0 0 15px rgba(34, 197, 94, 0.6), inset 0 0 20px rgba(255, 255, 255, 0.1);
            }
            50% {
              box-shadow: 0 0 25px rgba(34, 197, 94, 0.8), inset 0 0 30px rgba(255, 255, 255, 0.15);
            }
          }

          .liquid-nav-button.active {
            background: rgba(34, 197, 94, 0.2);
            backdrop-filter: blur(30px);
            border: 1px solid rgba(34, 197, 94, 0.5);
            animation: liquidButtonZoom 0.5s ease-out, greenFirePulse 0.8s ease-in-out infinite;
          }
        `}</style>
        <div className="nav-pill-container">
          {tabs.map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            return (
              <div key={tab.id} className="relative">
                <button
                  onClick={() => handleTabClick(tab.id)}
                  className={`liquid-nav-button ${isActive ? "active" : ""} ${clickedTab === tab.id ? "clicked" : ""}`}
                  title={tab.label}
                >
                  <Icon className="w-7 h-7" />
                  <span className="text-xs font-medium">{tab.label}</span>
                </button>

                {/* Liquid Glass Bubbles */}
                {bubbles
                  .filter((b) => b.tabId === tab.id)
                  .map((bubble, idx) => (
                    <div
                      key={bubble.id}
                      className="nav-bubble active"
                      style={{
                        left: `calc(50% + ${(idx - 2.5) * 8}px)`,
                        top: "-20px",
                        "--tx": `${(idx - 2.5) * 15}px`,
                      } as React.CSSProperties & { "--tx": string }}
                    />
                  ))}
              </div>
            )
          })}
        </div>
      </nav>
    </>
  )
}
