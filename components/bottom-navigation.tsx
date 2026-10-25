"use client"

import React, {
  useEffect,
  useRef,
} from "react"

import {
  Home,
  Star,
  User,
  BookOpen, // ← নতুন MeBook পেজের আইকন
} from "lucide-react"

interface BottomNavigationProps {
  activeTab: string
  onTabChange: (tab: string) => void
  swipePosition?: number
  isSwiping?: boolean
}

export default function BottomNavigation({
  activeTab,
  onTabChange,
  swipePosition,
  isSwiping = false,
}: BottomNavigationProps) {
  const navRef =
    useRef<HTMLDivElement>(null)

  const indicatorRef =
    useRef<HTMLDivElement>(null)

  // ============================================
  // TABS — এখন ৫টা, মাঝখানে MeBook
  // ============================================
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
      id: "mebook",          // ← নতুন পেজ
      label: "MeBook",       // ← নাম
      icon: BookOpen,        // ← Lucide আইকন
    },
    {
      id: "exclusive",
      label: "Subscriptions",
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
    tabs.findIndex(
      (tab) => tab.id === activeTab
    )
  )

  /* =========================================================
     INDICATOR POSITION
  ========================================================= */

  useEffect(() => {
    const nav = navRef.current
    const indicator = indicatorRef.current

    if (!nav || !indicator) {
      return
    }

    const updateIndicator = () => {
      const navWidth = nav.clientWidth

      if (navWidth <= 0) {
        return
      }

      const position =
        isSwiping &&
        typeof swipePosition === "number"
          ? Math.max(
              0,
              Math.min(
                tabs.length - 1,
                swipePosition
              )
            )
          : activeIndex

      const itemWidth =
        navWidth / tabs.length

      const center =
        itemWidth * position + itemWidth / 2

      /* Liquid stretch */
      const fractional =
        isSwiping
          ? Math.abs(
              position - Math.round(position)
            )
          : 0

      const stretch =
        isSwiping
          ? Math.min(
              0.18,
              fractional * 0.55
            )
          : 0

      const indicatorWidth =
        itemWidth * (1 - stretch)

      const left =
        center - indicatorWidth / 2

      indicator.style.transition =
        isSwiping
          ? "none"
          : "left 360ms cubic-bezier(0.22, 1, 0.36, 1), width 360ms cubic-bezier(0.22, 1, 0.36, 1)"

      indicator.style.left = `${left}px`
      indicator.style.width = `${indicatorWidth}px`

      // Kono tab active na hole (jemon Modex page) indicator lukiye jabe
      indicator.style.opacity = tabs.some((t) => t.id === activeTab)
        ? "1"
        : "0"

      const scaleX =
        isSwiping
          ? 1 + fractional * 0.10
          : 1

      const scaleY =
        isSwiping
          ? 1 - fractional * 0.035
          : 1

      indicator.style.transform = `
        translate3d(0, 0, 0)
        scaleX(${scaleX})
        scaleY(${scaleY})
      `
    }

    updateIndicator()

    const resizeObserver =
      new ResizeObserver(updateIndicator)

    resizeObserver.observe(nav)

    return () => {
      resizeObserver.disconnect()
    }
  }, [
    activeTab,
    activeIndex,
    swipePosition,
    isSwiping,
    tabs.length, // ← length dependency যোগ করা ভালো
  ])

  /* =========================================================
     FORCE FINAL POSITION + LIQUID BOUNCE
  ========================================================= */

  useEffect(() => {
    if (isSwiping) {
      return
    }

    const nav = navRef.current
    const indicator = indicatorRef.current

    if (!nav || !indicator) {
      return
    }

    const syncFinalPosition = () => {
      const navWidth = nav.clientWidth

      if (navWidth <= 0) {
        return
      }

      const itemWidth =
        navWidth / tabs.length

      const left =
        itemWidth * activeIndex

      indicator.style.transition =
        "left 360ms cubic-bezier(0.22, 1, 0.36, 1), width 360ms cubic-bezier(0.22, 1, 0.36, 1)"

      indicator.style.left = `${left}px`
      indicator.style.width = `${itemWidth}px`
      indicator.style.opacity = tabs.some((t) => t.id === activeTab)
        ? "1"
        : "0"

      indicator.classList.remove(
        "mvbd-indicator-settle"
      )

      void indicator.offsetWidth

      indicator.classList.add(
        "mvbd-indicator-settle"
      )
    }

    const frame =
      window.requestAnimationFrame(
        syncFinalPosition
      )

    return () => {
      window.cancelAnimationFrame(frame)
    }
  }, [
    activeTab,
    activeIndex,
    isSwiping,
    tabs.length,
  ])

  /* =========================================================
     RENDER
  ========================================================= */

  return (
    <>
    {/* ========== DESKTOP SIDEBAR (lg and up) ========== */}
    <aside
      className="hidden lg:flex fixed top-0 left-0 bottom-0 z-[100] w-[220px] flex-col gap-6 bg-[#0b0b0f] border-r border-white/10 px-3 pt-5 pb-4"
      aria-label="Sidebar navigation"
    >
      <div className="flex items-center gap-2 px-2" aria-label="MoviesVerseBD">
        <img
          src="https://i.postimg.cc/0yqFXMFW/photo-2025-12-11-09-45-29-removebg-preview.png"
          alt="MVBD Logo"
          className="h-10 w-auto object-contain"
        />
        <span className="whitespace-nowrap text-lg font-bold tracking-tight">
          <span className="text-white">MoviesVerse</span>
          <span className="bg-gradient-to-r from-emerald-400 via-green-400 to-lime-300 bg-clip-text text-transparent">BD</span>
        </span>
      </div>

      <div className="flex flex-col gap-1">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onTabChange(tab.id)}
              aria-current={isActive ? "page" : undefined}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                isActive
                  ? "bg-white/10 text-white"
                  : "text-slate-400 hover:bg-white/5 hover:text-white"
              }`}
            >
              {tab.icon === "anime" ? (
                <img
                  src="https://i.postimg.cc/qMRsY9Zh/360-F-616340820-puy-Fuujd-Aam-JVt-Ct9sr-V1dc-PVrku-Kg-Z6-removebg-preview.png"
                  alt="Anime"
                  width={20}
                  height={20}
                  draggable={false}
                />
              ) : (
                React.createElement(tab.icon, {
                  size: 20,
                  strokeWidth: 2.1,
                })
              )}
              <span>{tab.label}</span>
            </button>
          )
        })}
      </div>
    </aside>

    {/* ========== MOBILE BOTTOM NAV (lg:hidden) ========== */}
    <nav
      className="
        lg:hidden
        fixed
        bottom-0
        left-0
        right-0
        z-[100]
        flex
        justify-center
        px-3
        pb-[calc(6px+env(safe-area-inset-bottom))]
        pointer-events-none
      "
      aria-label="Main navigation"
    >
      <div
        ref={navRef}
        className="
          mvbd-liquid-nav
          pointer-events-auto
          relative
          w-[calc(100vw-34px)]
          max-w-[360px]
          h-[52px]
        "
      >
        {/* LIQUID INDICATOR */}
        <div
          ref={indicatorRef}
          className="mvbd-liquid-indicator"
          aria-hidden="true"
        />

        {/* GLASS LIGHT / BLUR LAYER */}
        <div
          className="mvbd-nav-glass-light"
          aria-hidden="true"
        />

        {/* NAV ITEMS — এখন 5 কলাম */}
        <div
          className="
            relative
            z-10
            grid
            h-full
            w-full
            grid-cols-5
            items-stretch
          "
        >
          {tabs.map((tab) => {
            const isActive =
              activeTab === tab.id

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() =>
                  onTabChange(tab.id)
                }
                className={`
                  mvbd-liquid-nav-item
                  ${isActive ? "active" : ""}
                `}
                aria-label={tab.label}
                aria-current={
                  isActive ? "page" : undefined
                }
              >
                <span className="mvbd-liquid-nav-icon">
                  {tab.icon === "anime" ? (
                    <img
                      src="https://i.postimg.cc/qMRsY9Zh/360-F-616340820-puy-Fuujd-Aam-JVt-Ct9sr-V1dc-PVrku-Kg-Z6-removebg-preview.png"
                      alt="Anime"
                      width={19}
                      height={19}
                      draggable={false}
                      className="mvbd-anime-nav-image"
                    />
                  ) : (
                    React.createElement(
                      tab.icon,
                      {
                        size: 19,
                        strokeWidth: 2.1,
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
    </>
  )
}
