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

  onTabChange: (
    tab: string
  ) => void

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
     INDICATOR UPDATE
  ========================================================= */

  useEffect(() => {
    const nav =
      navRef.current

    const indicator =
      indicatorRef.current

    if (!nav || !indicator) {
      return
    }

    const navWidth =
      nav.clientWidth

    if (navWidth <= 0) {
      return
    }

    /*
     * VERY IMPORTANT:
     *
     * Swipe চলার সময়:
     *    swipePosition ব্যবহার হবে
     *
     * Swipe শেষ হলে:
     *    activeIndex ব্যবহার হবে
     *
     * এতে পুরোনো fractional position
     * আর আটকে থাকবে না।
     */

    const position = isSwiping
      ? Math.max(
          0,
          Math.min(
            tabs.length - 1,
            typeof swipePosition === "number"
              ? swipePosition
              : activeIndex
          )
        )
      : activeIndex

    const itemWidth =
      navWidth / tabs.length

    const center =
      itemWidth * position +
      itemWidth / 2

    /*
     * Liquid stretch শুধুমাত্র
     * finger drag করার সময়।
     */

    const fractional =
      isSwiping
        ? Math.abs(
            position -
              Math.round(position)
          )
        : 0

    const stretch =
      isSwiping
        ? Math.min(
            0.18,
            fractional * 0.5
          )
        : 0

    const indicatorWidth =
      itemWidth *
      (1 - stretch)

    const left =
      center -
      indicatorWidth / 2

    /*
     * Swipe চললে:
     * একদম immediate movement
     *
     * Swipe শেষ হলে:
     * smooth transition
     */

    indicator.style.transition =
      isSwiping
        ? "none"
        : "left 380ms cubic-bezier(0.22, 1, 0.36, 1), width 380ms cubic-bezier(0.22, 1, 0.36, 1), transform 380ms cubic-bezier(0.22, 1, 0.36, 1)"

    indicator.style.left =
      `${left}px`

    indicator.style.width =
      `${indicatorWidth}px`

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
  }, [
    activeTab,
    activeIndex,
    swipePosition,
    isSwiping,
  ])

  /* =========================================================
     RESIZE
  ========================================================= */

  useEffect(() => {
    const handleResize = () => {
      const nav =
        navRef.current

      const indicator =
        indicatorRef.current

      if (!nav || !indicator) {
        return
      }

      const navWidth =
        nav.clientWidth

      if (navWidth <= 0) {
        return
      }

      /*
       * Resize-এর সময়ও stale swipePosition
       * ব্যবহার করব না যদি swipe না চলে।
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
        itemWidth * position +
        itemWidth / 2

      indicator.style.left =
        `${center - itemWidth / 2}px`

      indicator.style.width =
        `${itemWidth}px`
    }

    window.addEventListener(
      "resize",
      handleResize
    )

    return () => {
      window.removeEventListener(
        "resize",
        handleResize
      )
    }
  }, [
    activeIndex,
    swipePosition,
    isSwiping,
  ])

  /* =========================================================
     FORCE SYNC AFTER SWIPE
  ========================================================= */

  useEffect(() => {
    /*
     * Swipe শেষ হওয়ার পর এক frame পরে
     * indicator-কে activeTab-এর exact
     * position-এ force করে দিচ্ছি।
     *
     * এতে:
     * Home -> Anime
     * Anime -> Series
     * Series -> Profile
     *
     * কোনো অবস্থাতেই bubble আগের page-এ
     * আটকে থাকবে না।
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

    const sync = () => {
      const itemWidth =
        nav.clientWidth /
        tabs.length

      const left =
        itemWidth *
          activeIndex

      indicator.style.left =
        `${left}px`

      indicator.style.width =
        `${itemWidth}px`

      indicator.style.transform =
        "translate3d(0, 0, 0) scaleX(1) scaleY(1)"
    }

    const frame =
      window.requestAnimationFrame(
        sync
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
        pb-[calc(7px+env(safe-area-inset-bottom))]
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
          h-[54px]
        "
      >
        {/* LIQUID INDICATOR */}

        <div
          ref={indicatorRef}
          className="mvbd-liquid-indicator"
          aria-hidden="true"
        />

        {/* GLASS LIGHT */}

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
                  <span className="mvbd-liquid-nav-icon">
                    {tab.icon ===
                    "anime" ? (
                      <img
                        src="https://i.postimg.cc/qMRsY9Zh/360-F-616340820-puy-Fuujd-Aam-JVt-Ct9sr-V1dc-PVrku-Kg-Z6-removebg-preview.png"
                        alt="Anime"
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
            }
          )}
        </div>
      </div>
    </nav>
  )
}
