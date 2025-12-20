"use client"

import { Home, Star, User } from "lucide-react"
import { useState } from "react"

interface BottomNavigationProps {
  activeTab: string
  onTabChange: (tab: string) => void
}

export default function BottomNavigation({ activeTab, onTabChange }: BottomNavigationProps) {
  const [clickedTab, setClickedTab] = useState<string | null>(null)

  const tabs = [
    { id: "home", label: "Home", icon: Home },
    {
      id: "shorts",
      label: "Shorts",
      icon: () => (
        <svg viewBox="0 0 24 24" className="w-6 h-6" fill="currentColor">
          <path d="M17.77 10.32l-1.2-.5L18 9.06c1.84-.96 2.53-3.23 1.56-5.06s-3.24-2.53-5.07-1.56L6 6.94c-1.29.68-2.07 2.04-2 3.49.07 1.42.93 2.67 2.22 3.25.03.01 1.2.5 1.2.5L6 14.93c-1.83.97-2.53 3.24-1.56 5.07.97 1.83 3.24 2.53 5.07 1.56l8.5-4.5c1.29-.68 2.06-2.04 1.99-3.49-.07-1.42-.94-2.68-2.23-3.25zM10 14.65v-5.3L15 12l-5 2.65z" />
        </svg>
      ),
    },
    { id: "exclusive", label: "Exclusive", icon: Star },
    { id: "profile", label: "Profile", icon: User },
  ]

  const handleTabClick = (tabId: string) => {
    setClickedTab(tabId)
    onTabChange(tabId)
    setTimeout(() => setClickedTab(null), 600)
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-black border-t border-slate-900 z-50 safe-area-bottom">
      <div className="flex items-center justify-around py-2">
        {tabs.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          const isClicked = clickedTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => handleTabClick(tab.id)}
              className={`relative flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition-all ${
                isActive ? "text-green-500" : "text-slate-400 hover:text-slate-200"
              } ${isClicked ? "fire-animation" : ""}`}
            >
              <Icon className={`w-6 h-6 ${isActive ? "fill-green-500/20" : ""}`} />
              <span className="text-xs font-medium">{tab.label}</span>
              {isClicked && (
                <div className="absolute inset-0 pointer-events-none">
                  <div className="fire-particle fire-1" />
                  <div className="fire-particle fire-2" />
                  <div className="fire-particle fire-3" />
                  <div className="fire-particle fire-4" />
                  <div className="fire-particle fire-5" />
                </div>
              )}
            </button>
          )
        })}
      </div>
    </nav>
  )
}
