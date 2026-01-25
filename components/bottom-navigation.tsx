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
              <Icon className={isActive ? "fill-green-500/20" : ""} />
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
