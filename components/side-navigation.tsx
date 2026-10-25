"use client"

import { useEffect, useId, useState } from "react"
import type { CSSProperties, ReactNode } from "react"
import { createPortal } from "react-dom"
import {
  X,
  MoreHorizontal,
  Settings as SettingsIcon,
  Info,
  ChevronRight,
} from "lucide-react"

/* Global events — header, floating button ba onno jekono jayga theke menu khola jay */
export const OPEN_MENU_EVENT = "mvbd:open-menu"
export const OPEN_PAGE_EVENT = "mvbd:open-page"

export type SidePageId = "settings" | "about" | "modex"

export function openSideMenu() {
  window.dispatchEvent(new Event(OPEN_MENU_EVENT))
}

export function openSidePage(page: SidePageId) {
  window.dispatchEvent(new CustomEvent(OPEN_PAGE_EVENT, { detail: page }))
}

/* =========================================================
   MODEX X MARK
   Notun X: ekta bold diagonal solid, onno diagonal majhkhane kata (notch),
   flat cut end, green gradient. Modex page er logo r side menu — duto jaygay-i ekoi X.
   (MODEX_X_URL export ta rakha hoyeche jeno onno file import korle na bhange)
========================================================= */
export const MODEX_X_URL = "https://i.postimg.cc/YqKw8FTB/24592-removebg-preview.png"

export function ModexXMark({ className, style }: { className?: string; style?: CSSProperties }) {
  const id = useId().replace(/:/g, "")
  return (
    <svg viewBox="0 0 24 24" className={className} style={style} aria-hidden="true">
      <defs>
        <linearGradient id={`${id}g`} gradientUnits="userSpaceOnUse" x1="2" y1="2" x2="22" y2="22">
          <stop offset="0" stopColor="#86efac" />
          <stop offset="0.5" stopColor="#22c55e" />
          <stop offset="1" stopColor="#059669" />
        </linearGradient>
        <mask id={`${id}m`} maskUnits="userSpaceOnUse" x="0" y="0" width="24" height="24">
          <rect width="24" height="24" fill="#fff" />
          <polygon points="2,2 8.6,2 22,22 15.4,22" fill="#000" stroke="#000" strokeWidth="2.6" />
        </mask>
      </defs>
      <polygon points="2,2 8.6,2 22,22 15.4,22" fill={`url(#${id}g)`} />
      <polygon points="15.4,2 22,2 8.6,22 2,22" fill={`url(#${id}g)`} mask={`url(#${id}m)`} />
    </svg>
  )
}

/* =========================================================
   FLOATING 3-DOTS BUTTON
   Jei page e Header nei (profile, series etc.) shei page e dan corner e dekhabe.
   Header thakle (body[data-mvbd-header]) nijei lukiye jabe.
========================================================= */
export function FloatingMenuButton() {
  return (
    <>
      <style>{`body[data-mvbd-header] .mvbd-fab { display: none; }`}</style>
      <button
        type="button"
        onClick={openSideMenu}
        aria-label="Open menu"
        className="mvbd-fab fixed right-4 top-4 z-[60] flex h-11 w-11 items-center justify-center rounded-2xl border border-white/20 bg-black/50 text-slate-200 backdrop-blur-xl transition-all duration-200 hover:bg-white/10 hover:text-white active:scale-90"
      >
        <MoreHorizontal className="h-5 w-5" />
      </button>
    </>
  )
}

/* =========================================================
   SIDE NAVIGATION PANEL — liquid glass + calligraphy watermark
========================================================= */
export default function SideNavigation({ current }: { current?: SidePageId }) {
  const [mounted, setMounted] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => setMounted(true), [])

  useEffect(() => {
    const onOpen = () => setOpen(true)
    window.addEventListener(OPEN_MENU_EVENT, onOpen)
    return () => window.removeEventListener(OPEN_MENU_EVENT, onOpen)
  }, [])

  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = "hidden"
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false)
    window.addEventListener("keydown", onKey)
    return () => {
      document.body.style.overflow = prev
      window.removeEventListener("keydown", onKey)
    }
  }, [open])

  const go = (page: SidePageId) => {
    setOpen(false)
    openSidePage(page)
  }

  const anim = (delay: number) => ({
    style: { transitionDelay: open ? `${delay}ms` : "0ms" } as CSSProperties,
    cls: open ? "opacity-100 translate-x-0" : "opacity-0 translate-x-8",
  })

  const items: {
    id: SidePageId
    title: string
    sub: string
    hover: string
    chev: string
    tile: ReactNode
  }[] = [
    {
      id: "modex",
      title: "Modex",
      sub: "প্রিমিয়াম APK স্টোর",
      hover: "hover:border-emerald-300/50",
      chev: "group-hover:text-emerald-300",
      tile: <ModexTile />,
    },
    {
      id: "settings",
      title: "Settings",
      sub: "সাইটের সেটিংস",
      hover: "hover:border-cyan-300/50",
      chev: "group-hover:text-cyan-300",
      tile: (
        <div className="sn-tile bg-gradient-to-br from-emerald-400/90 to-cyan-500/90 group-hover:rotate-45">
          <SettingsIcon className="h-[18px] w-[18px] text-white" />
        </div>
      ),
    },
    {
      id: "about",
      title: "About Us",
      sub: "আমাদের সম্পর্কে জানুন",
      hover: "hover:border-purple-300/50",
      chev: "group-hover:text-purple-300",
      tile: (
        <div className="sn-tile bg-gradient-to-br from-purple-400/90 to-pink-500/90">
          <Info className="h-[18px] w-[18px] text-white" />
        </div>
      ),
    },
  ]

  if (!mounted) return null

  return createPortal(
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Great+Vibes&family=Pinyon+Script&display=swap');

        .sn-panel {
          background:
            linear-gradient(160deg, rgba(255,255,255,.20) 0%, rgba(255,255,255,.06) 38%, rgba(255,255,255,.10) 100%),
            rgba(14,16,26,.42);
          backdrop-filter: blur(38px) saturate(190%);
          -webkit-backdrop-filter: blur(38px) saturate(190%);
          border-left: 1px solid rgba(255,255,255,.28);
          box-shadow:
            inset 1px 0 0 rgba(255,255,255,.35),
            inset 0 1px 0 rgba(255,255,255,.25),
            inset 0 -1px 0 rgba(255,255,255,.06);
        }
        .sn-shine {
          background: linear-gradient(115deg, transparent 30%, rgba(255,255,255,.10) 46%, transparent 60%);
          background-size: 260% 100%;
          animation: snShine 7s ease-in-out infinite;
        }
        @keyframes snShine { 0%,100% { background-position: 140% 0; } 50% { background-position: -40% 0; } }

        .sn-item {
          background: linear-gradient(135deg, rgba(255,255,255,.16), rgba(255,255,255,.05) 55%, rgba(255,255,255,.10));
          border: 1px solid rgba(255,255,255,.18);
          backdrop-filter: blur(18px) saturate(170%);
          -webkit-backdrop-filter: blur(18px) saturate(170%);
          box-shadow: inset 0 1px 0 rgba(255,255,255,.35), inset 0 -1px 0 rgba(255,255,255,.04), 0 8px 20px rgba(0,0,0,.22);
        }
        .sn-item:hover { background: linear-gradient(135deg, rgba(255,255,255,.24), rgba(255,255,255,.08) 55%, rgba(255,255,255,.14)); }
        .sn-item:active { transform: scale(.97); }
        /* choto tile: 56px → 40px */
        .sn-tile {
          display: flex; height: 40px; width: 40px; flex-shrink: 0; align-items: center; justify-content: center;
          border-radius: 12px; transition: transform .5s ease;
          box-shadow: inset 0 1px 0 rgba(255,255,255,.45), 0 6px 14px rgba(0,0,0,.3);
        }
        .group:hover .sn-tile { transform: scale(1.06); }
        .group:hover .sn-tile.group-hover\\:rotate-45 { transform: rotate(45deg) scale(1.06); }

        /* English calligraphy watermark */
        .sn-wm {
          position: absolute; pointer-events: none; user-select: none; white-space: nowrap;
          font-family: 'Great Vibes', 'Pinyon Script', cursive;
          color: rgba(255,255,255,.085);
          text-shadow: 0 0 22px rgba(255,255,255,.05);
        }
        .sn-wm-1 { font-size: 92px; line-height: 1; top: 26%; left: -26px; transform: rotate(-16deg); }
        .sn-wm-2 { font-size: 64px; line-height: 1; top: 52%; left: 30px; transform: rotate(-16deg); font-family: 'Pinyon Script','Great Vibes',cursive; color: rgba(255,255,255,.07); }
        .sn-wm-3 { font-size: 56px; line-height: 1; bottom: 11%; left: 10px; transform: rotate(-16deg); color: rgba(110,231,183,.10); }
      `}</style>

      {/* Backdrop */}
      <div
        onClick={() => setOpen(false)}
        aria-hidden="true"
        className={`fixed inset-0 z-[100] bg-black/55 backdrop-blur-[3px] transition-opacity duration-500 ease-out ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />

      {/* Panel */}
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Navigation menu"
        aria-hidden={!open}
        className={`sn-panel fixed bottom-0 right-0 top-0 z-[110] flex w-[84%] max-w-[340px] flex-col overflow-hidden transition-[transform,box-shadow] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
          open
            ? "translate-x-0 shadow-[-24px_0_70px_rgba(0,0,0,0.55)]"
            : "pointer-events-none translate-x-full shadow-none"
        }`}
      >
        <div className="sn-shine pointer-events-none absolute inset-0" />
        <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-cyan-400/20 blur-[70px]" />
        <div className="pointer-events-none absolute -bottom-24 -left-16 h-64 w-64 rounded-full bg-emerald-400/20 blur-[70px]" />

        {/* Calligraphy watermark */}
        <span className="sn-wm sn-wm-1" aria-hidden="true">Movies Verse</span>
        <span className="sn-wm sn-wm-2" aria-hidden="true">Bangladesh</span>
        <span className="sn-wm sn-wm-3" aria-hidden="true">Modex</span>

        <div className="relative flex items-center justify-between border-b border-white/15 px-5 py-5">
          <div className="flex items-center gap-3">
            <img
              src="https://i.postimg.cc/0yqFXMFW/photo-2025-12-11-09-45-29-removebg-preview.png"
              alt="MVBD Logo"
              className="h-9 w-auto object-contain"
            />
            <span className="text-lg font-bold text-white">Menu</span>
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Close menu"
            className="sn-item flex h-10 w-10 items-center justify-center rounded-full text-slate-200 transition-all duration-300 hover:rotate-90 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="relative flex-1 space-y-2 overflow-y-auto px-4 py-5">
          {items.map((it, i) => {
            const a = anim(120 + i * 80)
            const here = current === it.id
            return (
              <button
                key={it.id}
                type="button"
                onClick={() => (here ? setOpen(false) : go(it.id))}
                style={a.style}
                className={`sn-item group flex w-full items-center gap-3 rounded-xl px-2.5 py-2 text-left transition-all duration-500 ease-out ${
                  here ? "border-emerald-300/60" : it.hover
                } ${a.cls}`}
              >
                {it.tile}
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold leading-tight text-white">{it.title}</p>
                  <p className={`mt-0.5 text-[11px] leading-tight ${here ? "text-emerald-300" : "text-slate-300/80"}`}>
                    {here ? "আপনি এখন এই পেজে আছেন" : it.sub}
                  </p>
                </div>
                {!here && (
                  <ChevronRight
                    className={`h-3.5 w-3.5 text-slate-400 transition-all group-hover:translate-x-1 ${it.chev}`}
                  />
                )}
              </button>
            )
          })}
        </nav>

        <div className="relative border-t border-white/15 px-5 py-4 text-center">
          <p className="text-xs text-slate-300/80">Movies Verse Bangladesh</p>
        </div>
      </aside>
    </>,
    document.body
  )
}

function ModexTile() {
  return (
    <div className="sn-tile border border-white/15 bg-black/35">
      <ModexXMark style={{ height: 24, width: 24 }} />
    </div>
  )
}
