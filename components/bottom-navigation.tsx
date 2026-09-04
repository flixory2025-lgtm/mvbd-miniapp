"use client"

import { Home, Star, User } from "lucide-react"
import React, {
  useEffect,
  useRef,
  useState,
} from "react"

interface BottomNavigationProps {
  activeTab: string
  onTabChange: (tab: string) => void
}

export default function BottomNavigation({
  activeTab,
  onTabChange,
}: BottomNavigationProps) {

  const navRef = useRef<HTMLDivElement>(null)

  const buttonRefs =
    useRef<Record<string, HTMLButtonElement | null>>({})

  const indicatorRef =
    useRef<HTMLDivElement>(null)

  const previousTabRef =
    useRef(activeTab)

  const [clickedTab, setClickedTab] =
    useState<string | null>(null)

  const [bubbles, setBubbles] =
    useState<
      Array<{
        id: number
        tabId: string
        x: number
        y: number
      }>
    >([])

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
          alt="Anime Logo"
          className={`w-6 h-6 object-contain ${
            className || ""
          }`}
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


  /* =========================================================
     LIQUID INDICATOR POSITION
     ========================================================= */

  const moveIndicator = (
    tabId: string,
    animate = true
  ) => {

    const nav =
      navRef.current

    const indicator =
      indicatorRef.current

    const target =
      buttonRefs.current[tabId]

    if (
      !nav ||
      !indicator ||
      !target
    ) {
      return
    }

    const navRect =
      nav.getBoundingClientRect()

    const targetRect =
      target.getBoundingClientRect()

    const targetLeft =
      targetRect.left -
      navRect.left

    const targetWidth =
      targetRect.width


    if (!animate) {

      indicator.style.left =
        `${targetLeft}px`

      indicator.style.width =
        `${targetWidth}px`

      indicator.style.transform =
        "translateZ(0) scaleX(1) scaleY(1)"

      return
    }


    const previousTab =
      previousTabRef.current

    const previous =
      buttonRefs.current[previousTab]

    const previousRect =
      previous?.getBoundingClientRect()


    const startLeft =
      previousRect
        ? previousRect.left -
          navRect.left
        : targetLeft

    const startWidth =
      previousRect
        ? previousRect.width
        : targetWidth


    const distance =
      Math.abs(
        targetLeft - startLeft
      )


    /*
     * Longer distance = slightly longer
     * liquid travel.
     */

    const duration =
      Math.min(
        1050,
        Math.max(
          680,
          650 + distance * 1.2
        )
      )


    /*
     * Cancel previous animation.
     */

    try {
      indicator
        .getAnimations()
        .forEach(animation =>
          animation.cancel()
        )
    } catch {}


    /*
     * REALISTIC LIQUID MOVEMENT
     *
     * Start
     * ↓
     * Stretch
     * ↓
     * Flow
     * ↓
     * Blob
     * ↓
     * Contract
     * ↓
     * Settle
     */

    indicator.animate(
      [
        {
          left:
            `${startLeft}px`,

          width:
            `${startWidth}px`,

          borderRadius:
            "24px",

          transform:
            "translateZ(0) scaleX(1) scaleY(1)",
        },

        {
          left:
            `${startLeft +
              (targetLeft -
                startLeft) *
                0.18}px`,

          width:
            `${Math.max(
              startWidth,
              targetWidth
            ) * 1.25}px`,

          borderRadius:
            "30px",

          transform:
            "translateZ(0) scaleX(1.08) scaleY(1.05)",

          offset: 0.20,
        },

        {
          left:
            `${startLeft +
              (targetLeft -
                startLeft) *
                0.48}px`,

          width:
            `${Math.max(
              startWidth,
              targetWidth
            ) * 1.55}px`,

          borderRadius:
            "36px",

          transform:
            "translateZ(0) scaleX(1.04) scaleY(.94)",

          offset: 0.48,
        },

        {
          left:
            `${startLeft +
              (targetLeft -
                startLeft) *
                0.78}px`,

          width:
            `${Math.max(
              startWidth,
              targetWidth
            ) * 1.30}px`,

          borderRadius:
            "31px",

          transform:
            "translateZ(0) scaleX(1.02) scaleY(1.04)",

          offset: 0.76,
        },

        {
          left:
            `${targetLeft}px`,

          width:
            `${targetWidth}px`,

          borderRadius:
            "24px",

          transform:
            "translateZ(0) scaleX(1) scaleY(1)",
        },
      ],
      {
        duration,
        easing:
          "cubic-bezier(.16, 1, .3, 1)",

        fill: "forwards",
      }
    )


    /*
     * Moving liquid highlight
     */

    const highlight =
      document.createElement("span")

    highlight.className =
      "mvbd-liquid-moving-highlight"

    indicator.appendChild(
      highlight
    )


    highlight.animate(
      [
        {
          left: "5%",
          opacity: 0.2,
          transform:
            "translateX(0) scale(.7)",
        },

        {
          left: "45%",
          opacity: 0.9,
          transform:
            "translateX(0) scale(1.15)",
        },

        {
          left: "88%",
          opacity: 0.15,
          transform:
            "translateX(0) scale(.7)",
        },
      ],
      {
        duration,
        easing:
          "cubic-bezier(.16, 1, .3, 1)",
      }
    )


    window.setTimeout(() => {
      highlight.remove()
    }, duration + 100)


    previousTabRef.current =
      tabId
  }


  /* =========================================================
     INITIAL POSITION
     ========================================================= */

  useEffect(() => {

    requestAnimationFrame(() => {

      moveIndicator(
        activeTab,
        false
      )

    })

  }, [])


  /* =========================================================
     EXTERNAL activeTab CHANGE
     ========================================================= */

  useEffect(() => {

    if (
      previousTabRef.current !==
      activeTab
    ) {

      moveIndicator(
        activeTab,
        true
      )

      setClickedTab(
        activeTab
      )
    }

  }, [activeTab])


  /* =========================================================
     RESPONSIVE POSITION
     ========================================================= */

  useEffect(() => {

    const handleResize =
      () => {

        moveIndicator(
          activeTab,
          false
        )
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

  }, [activeTab])


  /* =========================================================
     LIQUID TOUCH EFFECT
     ========================================================= */

  const createLiquidTouch =
    (
      event:
        React.PointerEvent<HTMLButtonElement>
    ) => {

      const nav =
        navRef.current

      if (!nav) return

      const rect =
        nav.getBoundingClientRect()

      const x =
        event.clientX -
        rect.left

      const y =
        event.clientY -
        rect.top


      const id =
        Date.now() +
        Math.random()


      setBubbles(
        previous => [
          ...previous,
          {
            id,
            tabId: activeTab,
            x,
            y,
          },
        ]
      )


      window.setTimeout(() => {

        setBubbles(
          previous =>
            previous.filter(
              bubble =>
                bubble.id !== id
            )
        )

      }, 950)
    }


  /* =========================================================
     TAB CLICK
     ========================================================= */

  const handleTabClick = (
    tabId: string,
    event:
      React.PointerEvent<HTMLButtonElement>
  ) => {

    createLiquidTouch(
      event
    )


    setClickedTab(
      tabId
    )


    /*
     * Let parent update activeTab.
     */

    onTabChange(
      tabId
    )


    /*
     * Small cleanup.
     */

    window.setTimeout(() => {

      setClickedTab(
        null
      )

    }, 900)
  }


  return (
    <nav
      className="
        fixed
        bottom-0
        left-0
        right-0
        z-50
        safe-area-bottom
        flex
        items-end
        justify-center
        pb-3
        px-4
        pointer-events-none
      "
    >

      <div
        ref={navRef}
        className="
          mvbd-liquid-nav
          relative
          pointer-events-auto
          w-full
          max-w-[390px]
          h-[70px]
          px-2
          sm:max-w-[430px]
        "
      >

        {/* =================================================
            MOVING LIQUID GLASS
            ================================================= */}

        <div
          ref={indicatorRef}
          className="
            mvbd-liquid-indicator
          "
          aria-hidden="true"
        />


        {/* =================================================
            TOUCH LIQUID EFFECTS
            ================================================= */}

        {bubbles.map(
          bubble => (
            <React.Fragment
              key={bubble.id}
            >

              <span
                className="
                  mvbd-liquid-ripple
                "
                style={{
                  left:
                    `${bubble.x}px`,
                  top:
                    `${bubble.y}px`,
                }}
              />

              <span
                className="
                  mvbd-liquid-pressure
                "
                style={{
                  left:
                    `${bubble.x}px`,
                  top:
                    `${bubble.y}px`,
                }}
              />

            </React.Fragment>
          )
        )}


        {/* =================================================
            NAVIGATION ITEMS
            ================================================= */}

        <div
          className="
            relative
            z-10
            h-full
            grid
            grid-cols-4
            items-center
          "
        >

          {tabs.map(
            tab => {

              const Icon =
                tab.icon

              const isActive =
                activeTab ===
                tab.id

              const isClicked =
                clickedTab ===
                tab.id


              return (
                <button
                  key={tab.id}
                  ref={element => {

                    buttonRefs.current[
                      tab.id
                    ] = element

                  }}

                  type="button"

                  onPointerDown={event =>
                    handleTabClick(
                      tab.id,
                      event
                    )
                  }

                  className={`
                    mvbd-liquid-nav-item
                    relative
                    h-full
                    w-full
                    flex
                    flex-col
                    items-center
                    justify-center
                    gap-[3px]
                    select-none
                    outline-none
                    ${
                      isActive
                        ? "active"
                        : ""
                    }
                  `}
                  title={tab.label}
                >

                  {/* ICON */}

                  <span
                    className={`
                      mvbd-liquid-nav-icon
                      ${
                        isActive ||
                        isClicked
                          ? "mvbd-liquid-icon-zoom"
                          : ""
                      }
                    `}
                  >
                    <Icon
                      className="
                        w-6
                        h-6
                      "
                    />
                  </span>


                  {/* LABEL */}

                  <span
                    className={`
                      mvbd-liquid-nav-label
                      text-[10px]
                      font-semibold
                      leading-none
                      ${
                        isActive ||
                        isClicked
                          ? "mvbd-liquid-text-zoom"
                          : ""
                      }
                    `}
                  >
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
