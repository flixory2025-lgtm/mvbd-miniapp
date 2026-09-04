""use client"

import React, { useEffect, useRef } from "react"
import { Home, Star, User } from "lucide-react"

interface BottomNavigationProps {
  activeTab: string
  onTabChange: (tab: string) => void

  // Swipe-এর সময় 0 → 1 → 2 → 3 এর মতো fractional position
  swipePosition?: number

  // Finger screen-এ থাকা অবস্থায় true
  isSwiping?: boolean
}

export default function BottomNavigation({
  activeTab,
  onTabChange,
  swipePosition,
  isSwiping = false,
}: BottomNavigationProps) {
  const navRef = useRef<HTMLDivElement>(null)
  const indicatorRef = useRef<HTMLDivElement>(null)

  const tabs = [
    {
      id: "home",
      label: "Home",
      icon: Home,
    },
    {
      id: "shorts",
      label: "Anime",
      icon: ({
        className,
      }: {
        className?: string
      }) => (
        <img
          src="https://i.postimg.cc/qMRsY9Zh/360-F-616340820-puy-Fuujd-Aam-JVt-Ct9sr-V1dc-PVrku-Kg-Z6-removebg-preview.png"
          alt="Anime"
          className={`w-6 h-6 object-contain ${className || ""}`}
          draggable={false}
        />
      ),
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

  const activeIndex = Math.max(
    0,
    tabs.findIndex((tab) => tab.id === activeTab)
  )

  /*
   * ---------------------------------------------------------
   * LIQUID INDICATOR
   * ---------------------------------------------------------
   */

  useEffect(() => {
    const nav = navRef.current
    const indicator = indicatorRef.current

    if (!nav || !indicator) return

    const position =
      typeof swipePosition === "number"
        ? swipePosition
        : activeIndex

    const clampedPosition = Math.max(
      0,
      Math.min(tabs.length - 1, position)
    )

    const navWidth = nav.clientWidth
    const itemWidth = navWidth / tabs.length

    /*
     * Finger movement অনুযায়ী indicator-এর position
     */
    const center =
      itemWidth * clampedPosition + itemWidth / 2

    /*
     * Swipe-এর সময় liquid একটু stretch করবে।
     */
    const fractional =
      Math.abs(clampedPosition - Math.round(clampedPosition))

    const stretch =
      isSwiping
        ? Math.min(0.28, fractional * 0.75)
        : 0

    const width =
      itemWidth * (1 - stretch)

    const left =
      center - width / 2

    indicator.style.left = `${left}px`
    indicator.style.width = `${width}px`

    /*
     * Swipe চলার সময় কোনো transition নয়।
     * ফলে finger-এর সাথে একদম live movement হবে।
     */
    if (isSwiping) {
      indicator.style.transition = "none"
    } else {
      indicator.style.transition =
        "left 520ms cubic-bezier(.16,1,.3,1), width 520ms cubic-bezier(.16,1,.3,1), transform 520ms cubic-bezier(.16,1,.3,1)"
    }

    /*
     * Liquid stretching
     */
    const scaleX =
      isSwiping
        ? 1 + fractional * 0.16
        : 1

    const scaleY =
      isSwiping
        ? 1 - fractional * 0.05
        : 1

    indicator.style.transform = `
      translateZ(0)
      scaleX(${scaleX})
      scaleY(${scaleY})
    `
  }, [swipePosition, activeIndex, isSwiping, tabs.length])

  /*
   * Window resize হলে indicator আবার ঠিক জায়গায় যাবে
   */
  useEffect(() => {
    const handleResize = () => {
      const nav = navRef.current
      const indicator = indicatorRef.current

      if (!nav || !indicator) return

      const position =
        typeof swipePosition === "number"
          ? swipePosition
          : activeIndex

      const itemWidth =
        nav.clientWidth / tabs.length

      const center =
        itemWidth * position + itemWidth / 2

      indicator.style.left =
        `${center - itemWidth / 2}px`

      indicator.style.width =
        `${itemWidth}px`
    }

    window.addEventListener("resize", handleResize)

    return () => {
      window.removeEventListener("resize", handleResize)
    }
  }, [activeIndex, swipePosition, tabs.length])

  return (
    <nav
      className="
        fixed
        bottom-0
        left-0
        right-0
        z-50
        flex
        justify-center
        px-3
        pb-[calc(8px+env(safe-area-inset-bottom))]
        pointer-events-none
      "
    >
      <div
        ref={navRef}
        className="
          mvbd-liquid-nav
          pointer-events-auto
          relative
          w-[calc(100%-24px)]
          max-w-[350px]
          h-[60px]
        "
      >
        {/* LIQUID INDICATOR */}
        <div
          ref={indicatorRef}
          className="mvbd-liquid-indicator"
          aria-hidden="true"
        />

        {/* TOP GLASS LIGHT */}
        <div
          className="mvbd-nav-glass-light"
          aria-hidden="true"
        />

        {/* NAV ITEMS */}
        <div
          className="
            relative
            z-10
            grid
            h-full
            grid-cols-4
            items-center
          "
        >
          {tabs.map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onTabChange(tab.id)}
                className={`
                  mvbd-liquid-nav-item
                  ${isActive ? "active" : ""}
                `}
                aria-label={tab.label}
              >
                <span className="mvbd-liquid-nav-icon">
                  <Icon className="w-[22px] h-[22px]" />
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
