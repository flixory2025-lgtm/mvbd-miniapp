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
  --lg-pill: rgba(0,0,0,.38);
  border-radius: 999px;
  /* clear glass: you see the page through it */
  background: rgba(34,35,40,.34);
  -webkit-backdrop-filter: blur(18px) saturate(1.8) brightness(1.05);
  backdrop-filter: blur(18px) saturate(1.8) brightness(1.05);
  box-shadow:
    inset 0 0 0 1px rgba(255,255,255,.14),
    inset 0 1px 0 rgba(255,255,255,.24),
    inset 0 -1px 0 rgba(255,255,255,.05),
    0 10px 30px rgba(0,0,0,.45);
  touch-action: none;
  user-select: none;
  -webkit-user-select: none;
  -webkit-tap-highlight-color: transparent;
  cursor: grab;
}
.mvbd-lg-bar::before {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: inherit;
  pointer-events: none;
  background: linear-gradient(180deg, rgba(255,255,255,.12), rgba(255,255,255,0) 45%);
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
  transition: opacity .16s ease;
}
.mvbd-lg-item:focus-visible { outline: 2px solid var(--mvbd-lg-accent, #34d399); outline-offset: -2px; }
.mvbd-lg-icon { display: flex; align-items: center; justify-content: center; height: 19px; }
.mvbd-lg-label {
  font: 600 9.5px/1 -apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, Arial, sans-serif;
  letter-spacing: -.01em;
  white-space: nowrap;
}

/* lens: moved only with transform (GPU), never with layout props */
.mvbd-lg-lens {
  position: absolute;
  left: 0;
  top: 0;
  z-index: 20;
  border-radius: 999px;
  pointer-events: none;
  transform-origin: 50% 50%;
  will-change: transform;
  contain: layout style;
}
.mvbd-lg-lens.off { opacity: 0; transition: opacity .2s; }
.mvbd-lg-lens-body {
  position: absolute;
  inset: 0;
  border-radius: inherit;
  overflow: hidden;
  background: rgba(16,17,21,.5);
  -webkit-backdrop-filter: blur(8px);
  backdrop-filter: blur(8px);
}
.mvbd-lg-rest { position: absolute; inset: 0; background: var(--lg-pill); opacity: 1; transition: opacity .25s ease; }
.mvbd-lg-layer { position: absolute; inset: 0; }
.mvbd-lg-clone { position: absolute; left: 0; top: 0; transform-origin: 0 0; color: var(--mvbd-lg-accent, #34d399); will-change: transform; }
.mvbd-lg-ghost { height: 100%; color: inherit; transition: none; }
.mvbd-lg-edge {
  -webkit-mask:
    linear-gradient(90deg,#000,transparent 20px,transparent calc(100% - 20px),#000),
    linear-gradient(180deg,#000,transparent 12px,transparent calc(100% - 12px),#000);
  mask:
    linear-gradient(90deg,#000,transparent 20px,transparent calc(100% - 20px),#000),
    linear-gradient(180deg,#000,transparent 12px,transparent calc(100% - 12px),#000);
  opacity: 0;
  transition: opacity .25s ease;
}
.mvbd-lg-rim {
  position: absolute;
  inset: 0;
  border-radius: inherit;
  opacity: 0;
  transition: opacity .25s ease;
  box-shadow:
    inset 0 0 0 1px rgba(255,255,255,.26),
    inset 0 1.5px 1px rgba(255,255,255,.4),
    inset 0 -2px 3px rgba(255,255,255,.1),
    0 7px 10px -2px rgba(0,0,0,.6);
}
.mvbd-lg-lens.pressed .mvbd-lg-rest { opacity: 0; }
.mvbd-lg-lens.pressed .mvbd-lg-edge,
.mvbd-lg-lens.pressed .mvbd-lg-rim { opacity: 1; }
@media (prefers-reduced-motion: reduce) {
  .mvbd-lg-lens, .mvbd-lg-clone { transition: none !important; }
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
     LIQUID GLASS LENS

     Performance notes
     - No per-frame JavaScript. The lens is moved with CSS
       transitions on `transform` only, which run on the GPU
       compositor, so the animation keeps going even while
       React is busy rendering the next page.
     - Nothing here changes layout (no width/height/left).
     - The page change (onTabChange) is deferred by a frame and
       wrapped in startTransition so it never competes with the
       first frames of the animation.
  ========================================================= */

  const PAD = 3
  const LENS_EXTRA = 8 // lens is a little wider than one tab
  const COUNT = tabs.length
  const isKnownTab = tabs.some(
    (t) => t.id === activeTab
  )

  const itemRefs = useRef<
    (HTMLButtonElement | null)[]
  >([])

  const st = useRef({
    itemW: 0,
    navW: 0,
    navH: 0,
    pos: activeIndex,
    pressed: false,
    dragging: false,
    swiping: false,
    known: true,
    timer: 0 as number,
  })

  type PlaceMode = "travel" | "follow" | "snap"

  const placeRef = useRef<
    (pos: number, mode: PlaceMode, press: boolean) => void
  >(() => {})

  const releaseRef = useRef<(ms: number) => void>(
    () => {}
  )

  // mount: measure + define place()
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

      lens.style.width = `${s.itemW + LENS_EXTRA}px`
      lens.style.height = `${s.navH - PAD * 2}px`

      for (const c of [c1, c2]) {
        c.style.width = `${s.navW}px`
        c.style.height = `${s.navH}px`
      }
    }

    const place = (
      pos: number,
      mode: PlaceMode,
      press: boolean
    ) => {
      if (s.itemW <= 0) {
        return
      }

      s.pos = pos
      s.pressed = press

      const W = s.itemW + LENS_EXTRA
      const H = s.navH - PAD * 2
      const lx = PAD + pos * s.itemW - LENS_EXTRA / 2
      const ly = PAD

      const transition =
        mode === "travel"
          ? "transform 480ms cubic-bezier(0.22, 1.18, 0.36, 1)"
          : mode === "follow"
          ? "transform 90ms linear"
          : "none"

      lens.style.transition = transition
      c1.style.transition = transition
      c2.style.transition = transition

      // lens swells; everything inside it swells with it
      lens.style.transform = `translate3d(${lx}px, ${ly}px, 0) scale(${
        press ? 1.22 : 1
      })`

      // content inside is drawn in bar coordinates, then
      // zoomed a bit more around the lens centre
      const inner = (zoom: number) =>
        `translate3d(${W / 2}px, ${H / 2}px, 0) scale(${zoom}) translate3d(${
          -W / 2 - lx
        }px, ${-H / 2 - ly}px, 0)`

      c1.style.transform = inner(press ? 1.06 : 1)
      c2.style.transform = inner(press ? 1.7 : 1)

      lens.classList.toggle("pressed", press)

      // the item under the lens is replaced by the lens copy
      const nearest = Math.round(pos)

      itemRefs.current.forEach((el, i) => {
        if (el) {
          el.style.opacity =
            s.known && i === nearest ? "0" : "1"
        }
      })
    }

    placeRef.current = place

    releaseRef.current = (ms: number) => {
      window.clearTimeout(s.timer)
      s.timer = window.setTimeout(() => {
        if (!s.dragging && !s.swiping) {
          place(s.pos, "travel", false)
        }
      }, ms)
    }

    measure()
    place(s.pos, "snap", false)

    const resizeObserver = new ResizeObserver(() => {
      measure()
      place(s.pos, "snap", s.pressed)
    })
    resizeObserver.observe(nav)

    return () => {
      resizeObserver.disconnect()
      window.clearTimeout(s.timer)
    }
  }, [COUNT])

  // props: active tab / swipe position changed
  useEffect(() => {
    const s = st.current
    const place = placeRef.current
    const release = releaseRef.current

    s.known = isKnownTab

    if (
      isSwiping &&
      typeof swipePosition === "number"
    ) {
      s.swiping = true
      window.clearTimeout(s.timer)
      place(
        Math.max(0, Math.min(COUNT - 1, swipePosition)),
        "follow",
        true
      )

      return
    }

    const wasSwiping = s.swiping
    s.swiping = false

    if (s.dragging) {
      return
    }

    const moved = Math.abs(s.pos - activeIndex) > 0.5

    if (moved || wasSwiping) {
      place(activeIndex, "travel", true)
      release(wasSwiping ? 220 : 300)
    } else {
      place(activeIndex, "travel", s.pressed)
    }
  }, [
    activeTab,
    activeIndex,
    isKnownTab,
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
    const px = e.clientX - rect.left
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
    placeRef.current(indexFromEvent(e), "travel", true)
  }

  const handlePointerMove = (
    e: React.PointerEvent<HTMLDivElement>
  ) => {
    const s = st.current

    if (!s.dragging) {
      return
    }

    placeRef.current(indexFromEvent(e), "follow", true)
  }

  const handlePointerUp = () => {
    const s = st.current

    if (!s.dragging) {
      return
    }

    s.dragging = false

    const i = Math.max(
      0,
      Math.min(COUNT - 1, Math.round(s.pos))
    )

    // 1) start the lens animation first
    placeRef.current(i, "travel", true)
    releaseRef.current(300)

    // 2) then switch the page, one frame later and at low
    //    priority, so rendering never stutters the lens
    if (tabs[i].id !== activeTab) {
      const id = tabs[i].id

      window.requestAnimationFrame(() => {
        React.startTransition(() => {
          onTabChange(id)
        })
      })
    }
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
          {tabs.map((tab, tabIndex) => {
            const isActive =
              activeTab === tab.id

            return (
              <button
                key={tab.id}
                ref={(el) => {
                  itemRefs.current[tabIndex] = el
                }}
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
