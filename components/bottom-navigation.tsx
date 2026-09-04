"use client"

import { Home, Star, User } from "lucide-react"
import { useEffect, useState } from "react"

interface BottomNavigationProps {
  activeTab: string
  onTabChange: (tab: string) => void
}

const tabs = [
  {
    id: "home",
    label: "Home",
    icon: Home,
  },
  {
    id: "shorts",
    label: "Anime",
    icon: null,
  },
  {
    id: "exclusive",
    label: "Series",
    icon: Star,
  },
  {
    id: "profile",
    label: "Profile",
    icon: User,
  },
]

export default function BottomNavigation({
  activeTab,
  onTabChange,
}: BottomNavigationProps) {
  const [activeIndex, setActiveIndex] = useState(0)
  const [pressed, setPressed] = useState(false)

  useEffect(() => {
    const index = tabs.findIndex((tab) => tab.id === activeTab)

    if (index !== -1) {
      setActiveIndex(index)
    }
  }, [activeTab])

  const handleClick = (tabId: string) => {
    if (tabId === activeTab) return

    setPressed(true)
    onTabChange(tabId)

    window.setTimeout(() => {
      setPressed(false)
    }, 450)
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-[100] px-3 pb-3 pointer-events-none safe-area-bottom">
      <div className="mx-auto w-full max-w-md pointer-events-auto">

        <div className="mvbd-nav-shell">

          {/* Moving Liquid Glass */}
          <div
            className="mvbd-liquid-indicator"
            style={{
              width: "calc((100% - 12px) / 4)",
              transform: `translateX(calc(${activeIndex} * 100%))`,
            }}
          >
            <div className="mvbd-liquid-inner" />

            <div className="mvbd-liquid-shine" />

            <div className="mvbd-liquid-glow" />
          </div>

          {/* Navigation buttons */}
          <div className="relative z-10 flex w-full items-center">

            {tabs.map((tab) => {
              const isActive = activeTab === tab.id
              const Icon = tab.icon

              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => handleClick(tab.id)}
                  className={`
                    mvbd-nav-button
                    ${isActive ? "mvbd-nav-active" : ""}
                    ${pressed && isActive ? "mvbd-nav-pressed" : ""}
                  `}
                >

                  {/* Anime Logo */}
                  {tab.id === "shorts" ? (
                    <span className="mvbd-anime-icon">
                      <img
                        src="https://i.postimg.cc/qMRsY9Zh/360-F-616340820-puy-Fuujd-Aam-JVt-Ct9sr-V1dc-PVrku-Kg-Z6-removebg-preview.png"
                        alt="Anime"
                      />
                    </span>
                  ) : (
                    Icon && (
                      <Icon
                        size={22}
                        strokeWidth={isActive ? 2.5 : 1.8}
                      />
                    )
                  )}

                  <span>{tab.label}</span>

                  {/* Active glow */}
                  {isActive && (
                    <span className="mvbd-active-dot" />
                  )}

                </button>
              )
            })}

          </div>
        </div>
      </div>
    </nav>
  )
}
