"use client"

import React, { useEffect, useRef, useState } from "react"
import { Home, Star, User } from "lucide-react"

interface BottomNavigationProps {
  activeTab: string
  onTabChange: (tab: string) => void

  // page.tsx থেকে live swipe position আসবে
  swipeProgress?: number
}

export default function BottomNavigation({
  activeTab,
  onTabChange,
  swipeProgress = 0,
}: BottomNavigationProps) {
  const [pressedTab, setPressedTab] = useState<string | null>(null)
  const [isTouching, setIsTouching] = useState(false)

  const navRef = useRef<HTMLDivElement>(null)

  /*
   * IMPORTANT:
   *
   * page.tsx:
   *   - swipe left  => swipeProgress negative
   *   - swipe right => swipeProgress positive
   *
   * So navigation position:
   *   activeIndex - swipeProgress
   */

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
   * Keep liquid position inside the navigation.
   */
  const rawPosition =
    activeIndex - swipeProgress

  const liquidPosition = Math.max(
    0,
    Math.min(tabs.length - 1, rawPosition)
  )

  /*
   * Distance from the nearest button.
   * Used to stretch the liquid while travelling.
   */
  const fractional =
    Math.abs(liquidPosition - Math.round(liquidPosition))

  const liquidStretch =
    1 + fractional * 0.55

  const liquidSquash =
    1 - fractional * 0.08

  const handleClick = (tabId: string) => {
    if (tabId === activeTab) {
      return
    }

    setPressedTab(tabId)

    onTabChange(tabId)

    window.setTimeout(() => {
      setPressedTab(null)
    }, 450)
  }

  /*
   * When active tab changes after swipe,
   * remove temporary touch state.
   */
  useEffect(() => {
    setIsTouching(false)
  }, [activeTab])

  return (
    <nav
      className="mvbd-liquid-nav"
      aria-label="Main navigation"
    >
      <div
        ref={navRef}
        className="mvbd-liquid-nav-inner"
      >
        {/* ==================================================
            MOVING LIQUID GLASS
           ================================================== */}

        <div
          className={`mvbd-liquid-indicator ${
            isTouching ? "is-touching" : ""
          }`}
          style={
            {
              "--liquid-position": liquidPosition,
              "--liquid-stretch": liquidStretch,
              "--liquid-squash": liquidSquash,
            } as React.CSSProperties &
              Record<string, number>
          }
        >
          <div className="mvbd-liquid-highlight" />
          <div className="mvbd-liquid-shine" />
          <div className="mvbd-liquid-glow" />
        </div>

        {/* ==================================================
            NAV BUTTONS
           ================================================== */}

        {tabs.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          const isPressed = pressedTab === tab.id

          return (
            <button
              key={tab.id}
              type="button"
              className={[
                "mvbd-liquid-button",
                isActive
                  ? "mvbd-liquid-button-active"
                  : "",
                isPressed
                  ? "mvbd-liquid-button-pressed"
                  : "",
              ].join(" ")}
              onClick={() => handleClick(tab.id)}
              onPointerDown={() => setIsTouching(true)}
              onPointerUp={() => setIsTouching(false)}
              onPointerCancel={() => setIsTouching(false)}
              aria-label={tab.label}
              aria-current={
                isActive ? "page" : undefined
              }
            >
              <span className="mvbd-nav-icon">
                <Icon />
              </span>

              <span className="mvbd-nav-label">
                {tab.label}
              </span>
            </button>
          )
        )}
      </div>

      <style jsx>{`
        /* ==================================================
           MAIN NAVIGATION
           ================================================== */

        .mvbd-liquid-nav {
          position: fixed;
          left: 0;
          right: 0;
          bottom: 0;

          z-index: 9999;

          display: flex;
          justify-content: center;
          align-items: center;

          padding:
            0
            16px
            calc(12px + env(safe-area-inset-bottom));

          pointer-events: none;
        }

        .mvbd-liquid-nav-inner {
          position: relative;

          width: max-content;
          min-width: 276px;

          display: flex;
          align-items: center;
          justify-content: center;

          gap: 8px;

          padding: 8px 16px;

          border-radius: 34px;

          background:
            linear-gradient(
              135deg,
              rgba(255, 255, 255, 0.13),
              rgba(255, 255, 255, 0.045)
            );

          border: 1px solid
            rgba(255, 255, 255, 0.17);

          box-shadow:
            0 18px 45px rgba(0, 0, 0, 0.45),
            inset 0 1px 1px
              rgba(255, 255, 255, 0.18),
            inset 0 -1px 2px
              rgba(0, 0, 0, 0.25);

          backdrop-filter: blur(32px)
            saturate(160%);

          -webkit-backdrop-filter: blur(32px)
            saturate(160%);

          isolation: isolate;

          pointer-events: auto;
        }

        /* ==================================================
           LIQUID GLASS INDICATOR
           ================================================== */

        .mvbd-liquid-indicator {
          position: absolute;

          left: 16px;
          top: 8px;

          width: 50px;
          height: 50px;

          border-radius: 26px;

          pointer-events: none;

          z-index: 0;

          /*
           * 50px button + 8px gap
           */
          transform:
            translateX(
              calc(
                var(--liquid-position) * 58px
              )
            )
            scaleX(var(--liquid-stretch))
            scaleY(var(--liquid-squash));

          transform-origin: center;

          background:
            linear-gradient(
              145deg,
              rgba(74, 222, 128, 0.40),
              rgba(34, 197, 94, 0.19),
              rgba(16, 185, 129, 0.25)
            );

          border: 1px solid
            rgba(74, 222, 128, 0.48);

          box-shadow:
            0 0 18px
              rgba(34, 197, 94, 0.28),
            0 0 38px
              rgba(34, 197, 94, 0.13),
            inset 0 1px 2px
              rgba(255, 255, 255, 0.35),
            inset 0 -5px 12px
              rgba(0, 0, 0, 0.12);

          backdrop-filter: blur(24px)
            saturate(180%);

          -webkit-backdrop-filter: blur(24px)
            saturate(180%);

          /*
           * Spring-like movement.
           */
          transition:
            transform
              460ms
              cubic-bezier(
                0.22,
                1,
                0.36,
                1
              ),
            border-radius 260ms ease,
            box-shadow 260ms ease;

          overflow: hidden;
        }

        /*
         * When the liquid is travelling,
         * make it wider and softer.
         */
        .mvbd-liquid-indicator.is-touching {
          transition:
            transform 80ms linear,
            border-radius 100ms ease;

          border-radius: 30px;
        }

        /* ==================================================
           LIQUID INTERNAL HIGHLIGHT
           ================================================== */

        .mvbd-liquid-highlight {
          position: absolute;

          width: 70%;
          height: 45%;

          top: 4px;
          left: 15%;

          border-radius: 999px;

          background:
            radial-gradient(
              ellipse,
              rgba(255, 255, 255, 0.32),
              rgba(255, 255, 255, 0)
            );

          filter: blur(2px);

          opacity: 0.8;
        }

        .mvbd-liquid-shine {
          position: absolute;

          width: 100%;
          height: 100%;

          top: 0;
          left: -100%;

          background:
            linear-gradient(
              110deg,
              transparent 25%,
              rgba(255, 255, 255, 0.20) 45%,
              rgba(255, 255, 255, 0.05) 55%,
              transparent 75%
            );

          animation:
            mvbdLiquidShine
            3.2s
            ease-in-out
            infinite;
        }

        .mvbd-liquid-glow {
          position: absolute;

          width: 75%;
          height: 75%;

          left: 12.5%;
          top: 12.5%;

          border-radius: 50%;

          background:
            radial-gradient(
              circle,
              rgba(74, 222, 128, 0.18),
              transparent 70%
            );

          filter: blur(7px);

          animation:
            mvbdLiquidGlow
            2.2s
            ease-in-out
            infinite;
        }

        /* ==================================================
           BUTTON
           ================================================== */

        .mvbd-liquid-button {
          position: relative;

          width: 50px;
          height: 50px;

          flex: 0 0 50px;

          display: flex;
          flex-direction: column;

          align-items: center;
          justify-content: center;

          gap: 3px;

          padding: 0;

          border: 0;
          outline: none;

          border-radius: 25px;

          background: transparent;

          color: rgba(
            255,
            255,
            255,
            0.60
          );

          cursor: pointer;

          z-index: 2;

          -webkit-tap-highlight-color:
            transparent;

          transition:
            color 300ms ease,
            transform 250ms
              cubic-bezier(
                0.34,
                1.56,
                0.64,
                1
              );
        }

        .mvbd-liquid-button:hover {
          color: rgba(
            255,
            255,
            255,
            0.95
          );
        }

        .mvbd-liquid-button:active {
          transform: scale(0.88);
        }

        .mvbd-liquid-button-active {
          color: #ffffff;
        }

        .mvbd-liquid-button-pressed {
          animation:
            mvbdButtonPress
            430ms
            cubic-bezier(
              0.34,
              1.56,
              0.64,
              1
            );
        }

        /* ==================================================
           ICON
           ================================================== */

        .mvbd-nav-icon {
          width: 22px;
          height: 22px;

          display: flex;
          align-items: center;
          justify-content: center;

          position: relative;

          transition:
            transform 420ms
              cubic-bezier(
                0.34,
                1.56,
                0.64,
                1
              ),
            filter 300ms ease;
        }

        .mvbd-nav-icon svg {
          width: 21px;
          height: 21px;

          stroke-width: 2;
        }

        .mvbd-liquid-button-active
          .mvbd-nav-icon {
          transform:
            translateY(-1px)
            scale(1.06);

          filter:
            drop-shadow(
              0 0 7px
              rgba(74, 222, 128, 0.55)
            );
        }

        /* ==================================================
           LABEL
           ================================================== */

        .mvbd-nav-label {
          font-size: 9px;

          line-height: 1;

          font-weight: 600;

          letter-spacing: 0.1px;

          white-space: nowrap;

          opacity: 0.72;

          transition:
            opacity 300ms ease,
            transform 300ms
              cubic-bezier(
                0.34,
                1.56,
                0.64,
                1
              );
        }

        .mvbd-liquid-button-active
          .mvbd-nav-label {
          opacity: 1;

          transform:
            translateY(-0.5px);
        }

        /* ==================================================
           ANIMATIONS
           ================================================== */

        @keyframes mvbdLiquidShine {
          0% {
            transform: translateX(0);
          }

          45%,
          100% {
            transform: translateX(220%);
          }
        }

        @keyframes mvbdLiquidGlow {
          0%,
          100% {
            transform: scale(0.85);
            opacity: 0.45;
          }

          50% {
            transform: scale(1.15);
            opacity: 0.9;
          }
        }

        @keyframes mvbdButtonPress {
          0% {
            transform: scale(1);
          }

          35% {
            transform: scale(0.86);
          }

          70% {
            transform: scale(1.08);
          }

          100% {
            transform: scale(1);
          }
        }

        /* ==================================================
           SMALL MOBILE
           ================================================== */

        @media (max-width: 360px) {
          .mvbd-liquid-nav {
            padding-left: 10px;
            padding-right: 10px;
          }

          .mvbd-liquid-nav-inner {
            min-width: 260px;

            gap: 5px;

            padding-left: 10px;
            padding-right: 10px;
          }

          .mvbd-liquid-indicator {
            left: 10px;
          }

          .mvbd-liquid-button {
            width: 50px;
            flex-basis: 50px;
          }
        }

        /* ==================================================
           REDUCE MOTION
           ================================================== */

        @media (prefers-reduced-motion: reduce) {
          .mvbd-liquid-indicator,
          .mvbd-liquid-button,
          .mvbd-nav-icon,
          .mvbd-nav-label {
            animation: none !important;
            transition: none !important;
          }
        }
      `}</style>
    </nav>
  )
}
