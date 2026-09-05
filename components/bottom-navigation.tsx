"use client"

import React, {
  useEffect,
  useRef,
} from "react"

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

  const activeIndex = Math.max(
    0,
    tabs.findIndex(
      (tab) =>
        tab.id === activeTab
    )
  )

  /* =========================================================
     INDICATOR POSITION
  ========================================================= */

  useEffect(() => {
    const nav =
      navRef.current

    const indicator =
      indicatorRef.current

    if (!nav || !indicator) {
      return
    }

    const updateIndicator =
      () => {
        const navWidth =
          nav.clientWidth

        if (navWidth <= 0) {
          return
        }

        /*
         * Swipe চলার সময়:
         * fractional swipePosition
         *
         * Swipe শেষ হলে:
         * exact activeIndex
         *
         * এতে stale position থাকবে না।
         */

        const position =
          isSwiping &&
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

        const itemWidth =
          navWidth / tabs.length

        const center =
          itemWidth *
            position +
          itemWidth / 2

        /*
         * Liquid stretch
         */

        const fractional =
          isSwiping
            ? Math.abs(
                position -
                  Math.round(
                    position
                  )
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
          itemWidth *
          (1 - stretch)

        const left =
          center -
          indicatorWidth / 2

        /*
         * Finger movement:
         * instant
         *
         * Final movement:
         * smooth
         */

        indicator.style.transition =
          isSwiping
            ? "none"
            : "left 360ms cubic-bezier(0.22, 1, 0.36, 1), width 360ms cubic-bezier(0.22, 1, 0.36, 1)"

        indicator.style.left =
          `${left}px`

        indicator.style.width =
          `${indicatorWidth}px`

        /*
         * Finger drag liquid scaling
         */

        const scaleX =
          isSwiping
            ? 1 +
              fractional * 0.10
            : 1

        const scaleY =
          isSwiping
            ? 1 -
              fractional * 0.035
            : 1

        indicator.style.transform = `
          translate3d(0, 0, 0)
          scaleX(${scaleX})
          scaleY(${scaleY})
        `
      }

    /*
     * Run immediately.
     */

    updateIndicator()

    /*
     * Resize observer makes the indicator
     * reliable when nav dimensions change.
     */

    const resizeObserver =
      new ResizeObserver(
        updateIndicator
      )

    resizeObserver.observe(nav)

    return () => {
      resizeObserver.disconnect()
    }
  }, [
    activeTab,
    activeIndex,
    swipePosition,
    isSwiping,
  ])

  /* =========================================================
     FORCE FINAL POSITION + LIQUID BOUNCE
  ========================================================= */

  useEffect(() => {
    /*
     * While finger is dragging,
     * don't trigger settle animation.
     */

    if (isSwiping) {
      return
    }

    const nav =
      navRef.current

    const indicator =
      indicatorRef.current

    if (!nav || !indicator) {
      return
    }

    const syncFinalPosition =
      () => {
        const navWidth =
          nav.clientWidth

        if (navWidth <= 0) {
          return
        }

        const itemWidth =
          navWidth / tabs.length

        /*
         * ALWAYS use activeIndex
         * after swipe finishes.
         */

        const left =
          itemWidth *
          activeIndex

        indicator.style.transition =
          "left 360ms cubic-bezier(0.22, 1, 0.36, 1), width 360ms cubic-bezier(0.22, 1, 0.36, 1)"

        indicator.style.left =
          `${left}px`

        indicator.style.width =
          `${itemWidth}px`

        /*
         * Remove previous animation.
         */

        indicator.classList.remove(
          "mvbd-indicator-settle"
        )

        /*
         * Force browser reflow.
         * This allows the animation to
         * restart every single time.
         */

        void indicator.offsetWidth

        /*
         * Start iOS-like liquid animation.
         */

        indicator.classList.add(
          "mvbd-indicator-settle"
        )
      }

    /*
     * Wait one frame so activeTab and
     * swipe position are fully synchronized.
     */

    const frame =
      window.requestAnimationFrame(
        syncFinalPosition
      )

    return () => {
      window.cancelAnimationFrame(
        frame
      )
    }
  }, [
    activeTab,
    activeIndex,
    isSwiping,
  ])

  /* =========================================================
     RENDER
  ========================================================= */

  return (
    <nav
      className="
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
          max-w-[320px]
          h-[52px]
        "
      >
        {/* =====================================================
            LIQUID INDICATOR
        ===================================================== */}

        <div
          ref={indicatorRef}
          className="
            mvbd-liquid-indicator
          "
          aria-hidden="true"
        />

        {/* =====================================================
            GLASS LIGHT / BLUR LAYER
        ===================================================== */}

        <div
          className="
            mvbd-nav-glass-light
          "
          aria-hidden="true"
        />

        {/* =====================================================
            NAV ITEMS
        ===================================================== */}

        <div
          className="
            relative
            z-10
            grid
            h-full
            w-full
            grid-cols-4
            items-stretch
          "
        >
          {tabs.map(
            (tab) => {
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
                  <span
                    className="
                      mvbd-liquid-nav-icon
                    "
                  >
                    {tab.icon ===
                    "anime" ? (
                      <img
                        src="https://i.postimg.cc/qMRsY9Zh/360-F-616340820-puy-Fuujd-Aam-JVt-Ct9sr-V1dc-PVrku-Kg-Z6-removebg-preview.png"
                        alt="Anime"
                        width={19}
                        height={19}
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
                          size: 19,
                          strokeWidth: 2.1,
                        }
                      )
                    )}
                  </span>

                  <span
                    className="
                      mvbd-liquid-nav-label
                    "
                  >
                    {
                      tab.label
                    }
                  </span>
                </button>
              )
            }
          )}
        </div>
      </div>
    </nav>
  )
}
