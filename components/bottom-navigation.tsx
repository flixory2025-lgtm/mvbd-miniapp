"use client"

import React from "react"
import {
  Home,
  Star,
  User,
} from "lucide-react"

interface BottomNavigationProps {
  activeTab: string
  onTabChange: (tab: string) => void
  swipePosition?: number
  isSwiping?: boolean
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
    icon: "anime",
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

const ANIME_ICON =
  "https://i.postimg.cc/qMRsY9Zh/360-F-616340820-puy-Fuujd-Aam-JVt-Ct9sr-V1dc-PVrku-Kg-Z6-removebg-preview.png"

export default function BottomNavigation({
  activeTab,
  onTabChange,
  swipePosition,
  isSwiping = false,
}: BottomNavigationProps) {
  const activeIndex = Math.max(
    0,
    tabs.findIndex(
      (tab) =>
        tab.id === activeTab
    )
  )

  const position =
    typeof swipePosition ===
    "number"
      ? Math.max(
          0,
          Math.min(
            tabs.length - 1,
            swipePosition
          )
        )
      : activeIndex

  /*
   * 25% = one tab
   *
   * Indicator translate:
   * 0   → Home
   * 100% → Anime
   * 200% → Series
   * 300% → Profile
   */

  const indicatorTransform =
    `translate3d(${position * 100}%,0,0)`

  return (
    <nav
      className="
        fixed
        left-0
        right-0
        bottom-0
        z-50
        flex
        justify-center
        px-3
        pb-[calc(7px+env(safe-area-inset-bottom))]
        pointer-events-none
      "
      aria-label="Main navigation"
    >
      <div
        className="
          mvbd-liquid-nav
          pointer-events-auto
          relative
          w-[calc(100%-28px)]
          max-w-[320px]
          h-[54px]
        "
      >
        {/* =================================================
            INDICATOR
            ================================================= */}

        <div
          className={`
            mvbd-liquid-indicator
            ${
              isSwiping
                ? "mvbd-indicator-dragging"
                : ""
            }
          `}
          style={{
            width: "25%",
            transform:
              indicatorTransform,
          }}
          aria-hidden="true"
        />

        {/* =================================================
            GLASS LIGHT
            ================================================= */}

        <div
          className="mvbd-nav-glass-light"
          aria-hidden="true"
        />

        {/* =================================================
            NAV ITEMS
            ================================================= */}

        <div
          className="
            relative
            z-10
            grid
            h-full
            grid-cols-4
          "
        >
          {tabs.map((tab) => {
            const isActive =
              activeTab ===
              tab.id

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() =>
                  onTabChange(
                    tab.id
                  )
                }
                className={`
                  mvbd-liquid-nav-item
                  ${
                    isActive
                      ? "active"
                      : ""
                  }
                `}
                aria-label={
                  tab.label
                }
                aria-current={
                  isActive
                    ? "page"
                    : undefined
                }
              >
                <span className="mvbd-liquid-nav-icon">
                  {tab.icon ===
                  "anime" ? (
                    <img
                      src={
                        ANIME_ICON
                      }
                      alt=""
                      width={20}
                      height={20}
                      draggable={
                        false
                      }
                      className="
                        mvbd-anime-nav-image
                      "
                    />
                  ) : (
                    React.createElement(
                      tab.icon,
                      {
                        size: 20,
                        strokeWidth: 2,
                        "aria-hidden":
                          true,
                      }
                    )
                  )}
                </span>

                <span className="mvbd-liquid-nav-label">
                  {tab.label}
                </span>
              </button>
            )
          })}
        </div>
      </div>
    </nav>
  )
}
