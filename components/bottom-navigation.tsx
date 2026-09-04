"use client"

import React, { useEffect, useState } from "react"
import { Home, Star, User } from "lucide-react"

interface BottomNavigationProps {
  activeTab: string
  onTabChange: (tab: string) => void
}

type Bubble = {
  id: number
  x: number
  y: number
}

export default function BottomNavigation({
  activeTab,
  onTabChange,
}: BottomNavigationProps) {
  const [bubbles, setBubbles] = useState<Bubble[]>([])
  const [pressedTab, setPressedTab] = useState<string | null>(null)

  const tabs = [
    {
      id: "home",
      label: "Home",
      type: "icon",
      icon: Home,
    },
    {
      id: "shorts",
      label: "Anime",
      type: "image",
      image:
        "https://i.postimg.cc/qMRsY9Zh/360-F-616340820-puy-Fuujd-Aam-JVt-Ct9sr-V1dc-PVrku-Kg-Z6-removebg-preview.png",
    },
    {
      id: "exclusive",
      label: "Series",
      type: "icon",
      icon: Star,
    },
    {
      id: "profile",
      label: "Profile",
      type: "icon",
      icon: User,
    },
  ]

  const createLiquidEffect = () => {
    const newBubbles: Bubble[] = Array.from({ length: 8 }, (_, i) => ({
      id: Date.now() + i,
      x: Math.random() * 60 - 30,
      y: Math.random() * 15,
    }))

    setBubbles(newBubbles)

    setTimeout(() => {
      setBubbles([])
    }, 900)
  }

  const handleTabClick = (tabId: string) => {
    if (tabId === activeTab) {
      createLiquidEffect()
      return
    }

    setPressedTab(tabId)
    createLiquidEffect()

    setTimeout(() => {
      onTabChange(tabId)
    }, 120)

    setTimeout(() => {
      setPressedTab(null)
    }, 550)
  }

  useEffect(() => {
    return () => {
      setBubbles([])
    }
  }, [])

  return (
    <>
      <style jsx>{`
        .mvbd-bottom-nav {
          position: fixed;
          left: 0;
          right: 0;
          bottom: 0;
          z-index: 9999;
          display: flex;
          justify-content: center;
          padding: 0 12px 14px;
          padding-bottom: calc(14px + env(safe-area-inset-bottom));
          pointer-events: none;
        }

        .mvbd-nav-glass {
          position: relative;
          width: min(420px, calc(100vw - 24px));
          min-height: 70px;
          padding: 7px;
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          align-items: center;
          gap: 5px;

          background: rgba(25, 25, 30, 0.72);
          border: 1px solid rgba(255, 255, 255, 0.16);
          border-radius: 32px;

          backdrop-filter: blur(30px) saturate(160%);
          -webkit-backdrop-filter: blur(30px) saturate(160%);

          box-shadow:
            0 12px 35px rgba(0, 0, 0, 0.42),
            inset 0 1px 0 rgba(255, 255, 255, 0.12),
            inset 0 -1px 0 rgba(255, 255, 255, 0.04);

          overflow: visible;
          pointer-events: auto;
        }

        .mvbd-nav-button {
          position: relative;
          width: 100%;
          height: 58px;

          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;

          gap: 3px;
          padding: 0;
          margin: 0;

          border: 1px solid transparent;
          border-radius: 25px;

          background: rgba(255, 255, 255, 0.035);
          color: rgba(255, 255, 255, 0.88);

          cursor: pointer;
          overflow: visible;

          transition:
            transform 0.42s cubic-bezier(0.22, 1, 0.36, 1),
            background 0.42s ease,
            border 0.42s ease,
            box-shadow 0.42s ease;
        }

        .mvbd-nav-button:active {
          transform: scale(0.91);
        }

        .mvbd-nav-button.active {
          background: rgba(45, 190, 95, 0.17);
          border-color: rgba(70, 220, 110, 0.42);

          box-shadow:
            0 0 22px rgba(40, 200, 90, 0.20),
            inset 0 1px 0 rgba(255, 255, 255, 0.12),
            inset 0 -5px 15px rgba(0, 0, 0, 0.12);

          color: #ffffff;
        }

        .mvbd-nav-button.pressed {
          animation: mvbdLiquidPress 0.55s
            cubic-bezier(0.22, 1, 0.36, 1);
        }

        .mvbd-nav-icon {
          width: 24px !important;
          height: 24px !important;
          min-width: 24px !important;
          min-height: 24px !important;
          max-width: 24px !important;
          max-height: 24px !important;

          flex-shrink: 0;
          display: block;

          stroke-width: 1.9;
        }

        .mvbd-anime-logo {
          width: 25px !important;
          height: 25px !important;
          min-width: 25px !important;
          min-height: 25px !important;
          max-width: 25px !important;
          max-height: 25px !important;

          object-fit: contain;
          object-position: center;

          display: block;
          flex-shrink: 0;

          border-radius: 6px;
        }

        .mvbd-nav-label {
          display: block;

          max-width: 100%;
          overflow: hidden;
          white-space: nowrap;
          text-overflow: ellipsis;

          font-size: 10px;
          line-height: 12px;
          font-weight: 600;
          letter-spacing: 0.1px;

          color: rgba(255, 255, 255, 0.82);
        }

        .mvbd-nav-button.active .mvbd-nav-label {
          color: #ffffff;
        }

        .mvbd-liquid-bubble {
          position: absolute;

          width: 7px;
          height: 7px;

          border-radius: 50%;

          background:
            radial-gradient(
              circle at 30% 25%,
              rgba(255, 255, 255, 0.95),
              rgba(110, 255, 160, 0.65) 30%,
              rgba(30, 190, 85, 0.3) 70%,
              transparent 100%
            );

          border: 1px solid rgba(150, 255, 185, 0.5);

          pointer-events: none;

          animation: mvbdBubble 0.85s
            cubic-bezier(0.22, 1, 0.36, 1)
            forwards;
        }

        @keyframes mvbdBubble {
          0% {
            opacity: 0;
            transform:
              translate3d(0, 0, 0)
              scale(0.15);
          }

          15% {
            opacity: 1;
            transform:
              translate3d(0, -3px, 0)
              scale(1);
          }

          60% {
            opacity: 0.75;
          }

          100% {
            opacity: 0;
            transform:
              translate3d(var(--bubble-x), -42px, 0)
              scale(0.25);
          }
        }

        @keyframes mvbdLiquidPress {
          0% {
            transform: scale(1);
          }

          28% {
            transform: scale(0.88);
          }

          55% {
            transform: scale(1.06);
          }

          78% {
            transform: scale(0.98);
          }

          100% {
            transform: scale(1);
          }
        }

        @media (max-width: 380px) {
          .mvbd-bottom-nav {
            padding-left: 8px;
            padding-right: 8px;
          }

          .mvbd-nav-glass {
            width: calc(100vw - 16px);
            min-height: 66px;
            border-radius: 29px;
          }

          .mvbd-nav-button {
            height: 54px;
            border-radius: 22px;
          }

          .mvbd-nav-icon {
            width: 22px !important;
            height: 22px !important;
            min-width: 22px !important;
            min-height: 22px !important;
            max-width: 22px !important;
            max-height: 22px !important;
          }

          .mvbd-anime-logo {
            width: 23px !important;
            height: 23px !important;
            min-width: 23px !important;
            min-height: 23px !important;
            max-width: 23px !important;
            max-height: 23px !important;
          }

          .mvbd-nav-label {
            font-size: 9px;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .mvbd-nav-button,
          .mvbd-liquid-bubble {
            animation: none !important;
            transition: none !important;
          }
        }
      `}</style>

      <div className="mvbd-bottom-nav">
        <nav className="mvbd-nav-glass" aria-label="Main navigation">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id
            const isPressed = pressedTab === tab.id

            return (
              <button
                key={tab.id}
                type="button"
                aria-label={tab.label}
                aria-current={isActive ? "page" : undefined}
                onClick={() => handleTabClick(tab.id)}
                className={[
                  "mvbd-nav-button",
                  isActive ? "active" : "",
                  isPressed ? "pressed" : "",
                ].join(" ")}
              >
                {tab.type === "image" ? (
                  <img
                    src={tab.image}
                    alt=""
                    aria-hidden="true"
                    className="mvbd-anime-logo"
                    width={25}
                    height={25}
                  />
                ) : (
                  (() => {
                    const Icon = tab.icon
                    return <Icon className="mvbd-nav-icon" />
                  })()
                )}

                <span className="mvbd-nav-label">
                  {tab.label}
                </span>

                {isPressed &&
                  bubbles.map((bubble) => (
                    <span
                      key={bubble.id}
                      className="mvbd-liquid-bubble"
                      style={
                        {
                          left: `calc(50% + ${bubble.x}px)`,
                          top: "5px",
                          "--bubble-x": `${bubble.x}px`,
                        } as React.CSSProperties
                      }
                    />
                  ))}
              </button>
            )
          })}
        </nav>
      </div>
    </>
  )
}
