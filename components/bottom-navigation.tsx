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
  Settings,
  Info,
} from "lucide-react"
import { openSidePage, type SidePageId, ModexXMark } from "@/components/side-navigation"

interface BottomNavigationProps {
  activeTab: string
  onTabChange: (tab: string) => void
  swipePosition?: number
  isSwiping?: boolean
}

/* =============================================================
   Liquid glass bottom bar styles (self-contained)
   Accent: set --mvbd-lg-accent on any parent to change the colour
   (default emerald, matching the MoviesVerseBD logo).
============================================================= */
const LIQUID_GLASS_CSS = `
.mvbd-lg-bar {
  --lg-a: #2d2e33;
  --lg-b: #232428;
  --lg-pill: #0b0b0d;
  border-radius: 999px;
  background: linear-gradient(180deg, var(--lg-a), var(--lg-b));
  box-shadow:
    inset 0 0 0 1px rgba(255,255,255,.1),
    inset 0 1px 0 rgba(255,255,255,.14),
    0 8px 24px rgba(0,0,0,.6);
  touch-action: none;
  user-select: none;
  -webkit-user-select: none;
  -webkit-tap-highlight-color: transparent;
  cursor: grab;
  will-change: transform;
}
.mvbd-lg-bar:active { cursor: grabbing; }

.mvbd-lg-item {
  all: unset;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 3px;
  min-width: 0;
  color: #fff;
  cursor: inherit;
  border-radius: 999px;
}
.mvbd-lg-item:focus-visible { outline: 2px solid var(--mvbd-lg-accent, #34d399); outline-offset: -2px; }
.mvbd-lg-icon { display: flex; align-items: center; justify-content: center; height: 19px; }
.mvbd-lg-label {
  font: 600 9.5px/1 -apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, Arial, sans-serif;
  letter-spacing: -.01em;
  white-space: nowrap;
}

/* lens: opaque in the bar's own colour, no blur, no tint */
.mvbd-lg-lens {
  --m: 0;
  position: absolute;
  left: 0;
  top: 0;
  z-index: 20;
  border-radius: 999px;
  pointer-events: none;
  will-change: transform, width, height;
}
.mvbd-lg-lens.off { opacity: 0; transition: opacity .2s; }
.mvbd-lg-lens-body {
  position: absolute;
  inset: 0;
  border-radius: inherit;
  overflow: hidden;
  background: linear-gradient(180deg, var(--lg-a), var(--lg-b));
}
.mvbd-lg-rest { position: absolute; inset: 0; background: var(--lg-pill); opacity: calc(1 - var(--m)); }
.mvbd-lg-layer { position: absolute; inset: 0; }
.mvbd-lg-clone { position: absolute; color: var(--mvbd-lg-accent, #34d399); }
.mvbd-lg-ghost { height: 100%; color: inherit; }
.mvbd-lg-edge {
  -webkit-mask:
    linear-gradient(90deg,#000,transparent 20px,transparent calc(100% - 20px),#000),
    linear-gradient(180deg,#000,transparent 12px,transparent calc(100% - 12px),#000);
  mask:
    linear-gradient(90deg,#000,transparent 20px,transparent calc(100% - 20px),#000),
    linear-gradient(180deg,#000,transparent 12px,transparent calc(100% - 12px),#000);
  filter: blur(.7px);
  opacity: var(--m);
}
.mvbd-lg-rim {
  position: absolute;
  inset: 0;
  border-radius: inherit;
  opacity: var(--m);
  box-shadow:
    inset 0 0 0 1px rgba(255,255,255,.22),
    inset 0 1.5px 1px rgba(255,255,255,.35),
    inset 0 -2px 3px rgba(255,255,255,.08),
    0 7px 10px -2px rgba(0,0,0,.75);
}
@media (prefers-reduced-motion: reduce) {
  .mvbd-lg-bar { transition: none; }
}
`

export default function BottomNavigation({
  activeTab,
  onTabChange,
  swipePosition,
  isSwiping = false,
}: BottomNavigationProps) {
  const navRef =
    useRef<HTMLDivElement>(null)

  const lensRef =
    useRef<HTMLDivElement>(null)

  const cloneRef =
    useRef<HTMLDivElement>(null)

  const clone2Ref =
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
     LIQUID GLASS LENS (spring driven)
     - lens position is a fractional tab index
     - press / swipe / tab change => bubble swells and the
       content inside it magnifies, corners smear like iOS
  ========================================================= */

  const PAD = 3
  const COUNT = tabs.length
  const isKnownTab = tabs.some(
    (t) => t.id === activeTab
  )

  const st = useRef({
    pos: activeIndex,
    vel: 0,
    target: activeIndex,
    p: 0,
    vp: 0,
    pressed: 0,
    last: 0,
    raf: 0,
    navW: 0,
    navH: 0,
    itemW: 0,
    dragging: false,
    swiping: false,
    timer: 0 as number,
  })

  const kickRef = useRef<() => void>(() => {})

  // mount: animation loop + measuring
  useEffect(() => {
    const nav = navRef.current
    const lens = lensRef.current
    const c1 = cloneRef.current
    const c2 = clone2Ref.current

    if (!nav || !lens || !c1 || !c2) {
      return
    }

    const s = st.current

    const measure = () => {
      s.navW = nav.clientWidth
      s.navH = nav.clientHeight
      s.itemW = (s.navW - PAD * 2) / COUNT

      for (const c of [c1, c2]) {
        c.style.width = `${s.navW}px`
        c.style.height = `${s.navH}px`
      }
    }

    const frame = (now: number) => {
      const dt = Math.min(
        (now - s.last) / 1000 || 0.016,
        1 / 30
      )
      s.last = now

      s.vel +=
        (260 * (s.target - s.pos) - 25 * s.vel) * dt
      s.pos += s.vel * dt

      s.vp += (340 * (s.pressed - s.p) - 24 * s.vp) * dt
      s.p += s.vp * dt

      if (s.itemW > 0) {
        const velPx = s.vel * s.itemW
        const m = Math.max(
          0,
          Math.min(1, s.p + Math.abs(velPx) / 260)
        )

        const stretch = Math.min(
          Math.abs(velPx) * 0.014,
          28
        )

        const lw = s.itemW + 26 * m + stretch
        const lh = s.navH - PAD * 2 + 12 * m
        const lx =
          PAD + s.pos * s.itemW - (lw - s.itemW) / 2
        const ly = (s.navH - lh) / 2

        lens.style.setProperty("--m", m.toFixed(3))
        lens.style.width = `${lw}px`
        lens.style.height = `${lh}px`
        lens.style.transform = `translate3d(${lx}px, ${ly}px, 0)`

        const origin = `${lx + lw / 2}px ${ly + lh / 2}px`

        c1.style.left = `${-lx}px`
        c1.style.top = `${-ly}px`
        c1.style.transformOrigin = origin
        c1.style.transform = `scale(${1 + 0.2 * m})`

        c2.style.left = `${-lx}px`
        c2.style.top = `${-ly}px`
        c2.style.transformOrigin = origin
        c2.style.transform = `scale(${1 + 0.75 * m})`

        // the whole bar swells a little while the bubble is held
        nav.style.transform = `scale(${1 + 0.035 * m})`
      }

      const settled =
        Math.abs(s.target - s.pos) * s.itemW < 0.05 &&
        Math.abs(s.vel * s.itemW) < 0.05 &&
        Math.abs(s.pressed - s.p) < 0.002 &&
        Math.abs(s.vp) < 0.01

      s.raf = settled
        ? 0
        : window.requestAnimationFrame(frame)
    }

    const kick = () => {
      if (!s.raf) {
        s.last = performance.now()
        s.raf = window.requestAnimationFrame(frame)
      }
    }

    kickRef.current = kick

    measure()
    s.pos = s.target
    kick()

    const resizeObserver = new ResizeObserver(() => {
      measure()
      kick()
    })
    resizeObserver.observe(nav)

    return () => {
      resizeObserver.disconnect()
      window.cancelAnimationFrame(s.raf)
      window.clearTimeout(s.timer)
      s.raf = 0
    }
  }, [COUNT])

  // props: active tab / swipe position changed
  useEffect(() => {
    const s = st.current

    const hold = (ms: number) => {
      s.pressed = 1
      window.clearTimeout(s.timer)
      s.timer = window.setTimeout(() => {
        if (!s.dragging && !s.swiping) {
          s.pressed = 0
          kickRef.current()
        }
      }, ms)
    }

    if (isSwiping && typeof swipePosition === "number") {
      s.swiping = true
      s.pressed = 1
      s.target = Math.max(
        0,
        Math.min(COUNT - 1, swipePosition)
      )
    } else {
      if (s.swiping) {
        s.swiping = false
        s.pressed = 0
      }

      if (!s.dragging) {
        const moved =
          Math.abs(s.target - activeIndex) > 0.5

        s.target = activeIndex

        if (moved) {
          hold(300)
        }
      }
    }

    kickRef.current()
  }, [
    activeTab,
    activeIndex,
    swipePosition,
    isSwiping,
    COUNT,
  ])

  /* ---------- pointer: press, drag the bubble, release ---------- */

  const indexFromEvent = (
    e: React.PointerEvent<HTMLDivElement>
  ) => {
    const nav = navRef.current

    if (!nav) {
      return 0
    }

    const rect = nav.getBoundingClientRect()
    const k = rect.width ? nav.clientWidth / rect.width : 1
    const px = (e.clientX - rect.left) * k
    const itemW = (nav.clientWidth - PAD * 2) / COUNT

    return Math.max(
      0,
      Math.min(COUNT - 1, (px - PAD) / itemW - 0.5)
    )
  }

  const handlePointerDown = (
    e: React.PointerEvent<HTMLDivElement>
  ) => {
    if (e.pointerType === "mouse" && e.button !== 0) {
      return
    }

    const s = st.current

    s.dragging = true
    window.clearTimeout(s.timer)
    e.currentTarget.setPointerCapture(e.pointerId)
    s.pressed = 1
    s.target = indexFromEvent(e)
    kickRef.current()
  }

  const handlePointerMove = (
    e: React.PointerEvent<HTMLDivElement>
  ) => {
    const s = st.current

    if (!s.dragging) {
      return
    }

    s.target = indexFromEvent(e)
    kickRef.current()
  }

  const handlePointerUp = () => {
    const s = st.current

    if (!s.dragging) {
      return
    }

    s.dragging = false

    const i = Math.max(
      0,
      Math.min(COUNT - 1, Math.round(s.target))
    )

    s.target = i

    // keep the bubble swollen while it lands
    window.clearTimeout(s.timer)
    s.timer = window.setTimeout(() => {
      if (!s.dragging && !s.swiping) {
        s.pressed = 0
        kickRef.current()
      }
    }, 280)

    if (tabs[i].id !== activeTab) {
      onTabChange(tabs[i].id)
    }

    kickRef.current()
  }
  const renderNavItem = (
    tab: (typeof tabs)[number]
  ) => (
    <>
      <span className="mvbd-lg-icon">
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
          React.createElement(tab.icon, {
            size: 19,
            strokeWidth: 2.1,
          })
        )}
      </span>

      <span className="mvbd-lg-label">
        {tab.label}
      </span>
    </>
  )

  // same row, drawn inside the lens in the accent colour
  const ghostRow = (
    <div
      className="grid h-full w-full grid-cols-5 items-stretch"
      style={{ padding: PAD }}
    >
      {tabs.map((tab) => (
        <div key={tab.id} className="mvbd-lg-item mvbd-lg-ghost">
          {renderNavItem(tab)}
        </div>
      ))}
    </div>
  )

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

      <div className="mt-2 border-t border-white/10 pt-3">
        <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
          More
        </p>
        {(
          [
            { id: "modex" as SidePageId, label: "Modex", icon: "modex" },
            { id: "settings" as SidePageId, label: "Settings", icon: Settings },
            { id: "about" as SidePageId, label: "About Us", icon: Info },
          ] as const
        ).map((page) => (
          <button
            key={page.id}
            type="button"
            onClick={() => openSidePage(page.id)}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-400 transition hover:bg-white/5 hover:text-white"
          >
            {page.icon === "modex" ? (
              <ModexXMark className="h-5 w-5" />
            ) : (
              React.createElement(page.icon, { size: 20, strokeWidth: 2.1 })
            )}
            <span>{page.label}</span>
          </button>
        ))}
      </div>
    </aside>

    {/* ========== MOBILE BOTTOM NAV (lg:hidden) ========== */}
    <style>{LIQUID_GLASS_CSS}</style>

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
          mvbd-lg-bar
          pointer-events-auto
          relative
          w-[calc(100vw-34px)]
          max-w-[360px]
          h-[52px]
        "
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        {/* NAV ITEMS — 5 columns */}
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
          style={{ padding: PAD }}
        >
          {tabs.map((tab) => {
            const isActive =
              activeTab === tab.id

            return (
              <button
                key={tab.id}
                type="button"
                onClick={(e) => {
                  // pointer taps are handled on pointer-up;
                  // this keeps keyboard / assistive tech working
                  if (e.detail === 0) {
                    onTabChange(tab.id)
                  }
                }}
                className={`mvbd-lg-item ${isActive ? "active" : ""}`}
                aria-label={tab.label}
                aria-current={
                  isActive ? "page" : undefined
                }
              >
                {renderNavItem(tab)}
              </button>
            )
          })}
        </div>

        {/* LIQUID GLASS LENS */}
        <div
          ref={lensRef}
          className={`mvbd-lg-lens ${isKnownTab ? "" : "off"}`}
          aria-hidden="true"
        >
          <div className="mvbd-lg-lens-body">
            <div className="mvbd-lg-rest" />

            <div className="mvbd-lg-layer">
              <div ref={cloneRef} className="mvbd-lg-clone">
                {ghostRow}
              </div>
            </div>

            <div className="mvbd-lg-layer mvbd-lg-edge">
              <div ref={clone2Ref} className="mvbd-lg-clone">
                {ghostRow}
              </div>
            </div>
          </div>

          <div className="mvbd-lg-rim" />
        </div>
      </div>
    </nav>
    </>
  )
}
