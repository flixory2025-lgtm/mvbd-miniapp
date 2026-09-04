"use client"

import { Home, Star, User, Film, Tv, Play } from "lucide-react"
import type { CSSProperties } from "react"
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
    id: "anime",
    label: "Anime",
    icon: Play,
  },
  {
    id: "series",
    label: "Series",
    icon: Tv,
  },
  {
    id: "exclusive",
    label: "Exclusive",
    icon: Star,
  },
  {
    id: "shorts",
    label: "Shorts",
    icon: Film,
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
  const [pressedTab, setPressedTab] = useState<string | null>(null)
  const [liquidX, setLiquidX] = useState(0)

  useEffect(() => {
    const index = tabs.findIndex((tab) => tab.id === activeTab)

    if (index >= 0) {
      setLiquidX(index)
    }
  }, [activeTab])

  const handleClick = (tabId: string) => {
    if (tabId === activeTab) return

    setPressedTab(tabId)
    onTabChange(tabId)

    setTimeout(() => {
      setPressedTab(null)
    }, 450)
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-[100] px-3 pb-3 safe-area-bottom pointer-events-none">
      <div className="mx-auto w-full max-w-xl pointer-events-auto">
        <div className="relative overflow-hidden rounded-[32px] border border-white/10 bg-black/60 p-1.5 shadow-[0_10px_40px_rgba(0,0,0,0.5)] backdrop-blur-2xl">

          {/* Moving liquid glass */}
          <div
            className="pointer-events-none absolute inset-y-1.5 rounded-[26px] transition-all duration-500 ease-[cubic-bezier(.22,1,.36,1)]"
            style={{
              width: `calc((100% - 12px) / ${tabs.length})`,
              left: `calc(6px + ${liquidX} * ((100% - 12px) / ${tabs.length}))`,
            }}
          >
            <div className="absolute inset-0 rounded-[26px] bg-white/[0.10] backdrop-blur-xl" />

            <div className="absolute inset-0 rounded-[26px] border border-white/15" />

            <div className="absolute -inset-3 rounded-full bg-emerald-400/10 blur-xl" />

            <div className="absolute left-[15%] right-[15%] top-0 h-[1px] rounded-full bg-white/30" />
          </div>

          <div className="relative flex items-center justify-between gap-0.5">
            {tabs.map((tab) => {
              const Icon = tab.icon
              const active = activeTab === tab.id
              const pressed = pressedTab === tab.id

              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => handleClick(tab.id)}
                  className={`
                    relative z-10 flex min-w-0 flex-1
                    flex-col items-center justify-center
                    rounded-[26px] py-2
                    transition-all duration-500
                    ease-[cubic-bezier(.22,1,.36,1)]
                    select-none
                    active:scale-90
                    ${active ? "text-white" : "text-white/45"}
                    ${pressed ? "scale-95" : ""}
                  `}
                  aria-label={tab.label}
                >
                  <span
                    className={`
                      relative flex h-7 w-7 items-center justify-center
                      transition-all duration-500
                      ease-[cubic-bezier(.22,1,.36,1)]
                      ${active ? "scale-110" : "scale-100"}
                    `}
                  >
                    <Icon
                      size={21}
                      strokeWidth={active ? 2.4 : 1.8}
                    />

                    {active && (
                      <span className="pointer-events-none absolute inset-[-8px] rounded-full bg-emerald-400/10 blur-md" />
                    )}
                  </span>

                  <span
                    className={`
                      mt-0.5 text-[9px] font-medium
                      transition-all duration-500
                      ${active ? "opacity-100" : "opacity-70"}
                    `}
                  >
                    {tab.label}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </nav>
  )
}
