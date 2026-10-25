"use client"

import { useEffect, useState } from "react"
import { createPortal } from "react-dom"
import {
  X,
  MoreHorizontal,
  Settings as SettingsIcon,
  Info,
  ChevronRight,
  ExternalLink,
} from "lucide-react"

/* Global events — header, floating button ba onno jekono jayga theke menu khola jay */
export const OPEN_MENU_EVENT = "mvbd:open-menu"
export const OPEN_PAGE_EVENT = "mvbd:open-page"

export function openSideMenu() {
  window.dispatchEvent(new Event(OPEN_MENU_EVENT))
}

function openPage(page: "settings" | "about") {
  window.dispatchEvent(new CustomEvent(OPEN_PAGE_EVENT, { detail: page }))
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
   SIDE NAVIGATION PANEL
========================================================= */
export default function SideNavigation({ current }: { current?: "modex" }) {
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

  const go = (page: "settings" | "about") => {
    setOpen(false)
    openPage(page)
  }

  const itemBase =
    "group w-full flex items-center gap-4 rounded-2xl bg-white/5 hover:bg-white/10 border p-3 text-left transition-all duration-500 ease-out"
  const anim = (delay: number) => ({
    style: { transitionDelay: open ? `${delay}ms` : "0ms" },
    cls: open ? "opacity-100 translate-x-0" : "opacity-0 translate-x-8",
  })

  if (!mounted) return null

  return createPortal(
    <>
      {/* Backdrop */}
      <div
        onClick={() => setOpen(false)}
        aria-hidden="true"
        className={`fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm transition-opacity duration-500 ease-out ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />

      {/* Panel */}
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Navigation menu"
        aria-hidden={!open}
        className={`fixed bottom-0 right-0 top-0 z-[110] flex w-[84%] max-w-[340px] flex-col border-l border-white/10 bg-[#0b0b12]/95 backdrop-blur-2xl transition-[transform,box-shadow] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
          open
            ? "translate-x-0 shadow-[-20px_0_60px_rgba(0,0,0,0.6)]"
            : "pointer-events-none translate-x-full shadow-none"
        }`}
      >
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-cyan-500/10 via-transparent to-emerald-500/10" />

        <div className="relative flex items-center justify-between border-b border-white/10 px-5 py-5">
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
            className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-300 transition-all duration-300 hover:rotate-90 hover:bg-white/15 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="relative flex-1 space-y-3 overflow-y-auto px-4 py-5">
          {/* 1. Modex */}
          {current === "modex" ? (
            <button
              type="button"
              onClick={() => setOpen(false)}
              style={anim(120).style}
              className={`${itemBase} border-cyan-400/50 ${anim(120).cls}`}
            >
              <ModexTile />
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-white">Modex</p>
                <p className="text-xs text-cyan-300">আপনি এখন এই পেজে আছেন</p>
              </div>
            </button>
          ) : (
            <a
              href="/?page=modex"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setOpen(false)}
              style={anim(120).style}
              className={`${itemBase} border-white/10 hover:border-cyan-400/40 ${anim(120).cls}`}
            >
              <ModexTile />
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-white">Modex</p>
                <p className="text-xs text-slate-400">নতুন ট্যাবে খুলবে</p>
              </div>
              <ExternalLink className="h-4 w-4 text-slate-500 transition-colors group-hover:text-cyan-300" />
            </a>
          )}

          {/* 2. Settings */}
          <button
            type="button"
            onClick={() => go("settings")}
            style={anim(200).style}
            className={`${itemBase} border-white/10 hover:border-emerald-400/40 ${anim(200).cls}`}
          >
            <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-cyan-500 transition-transform duration-500 group-hover:rotate-45 group-hover:scale-105">
              <SettingsIcon className="h-6 w-6 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-white">Settings</p>
              <p className="text-xs text-slate-400">সাইটের সেটিংস</p>
            </div>
            <ChevronRight className="h-4 w-4 text-slate-500 transition-all group-hover:translate-x-1 group-hover:text-emerald-300" />
          </button>

          {/* 3. About Us */}
          <button
            type="button"
            onClick={() => go("about")}
            style={anim(280).style}
            className={`${itemBase} border-white/10 hover:border-purple-400/40 ${anim(280).cls}`}
          >
            <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 transition-transform duration-300 group-hover:scale-105">
              <Info className="h-6 w-6 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-white">About Us</p>
              <p className="text-xs text-slate-400">আমাদের সম্পর্কে জানুন</p>
            </div>
            <ChevronRight className="h-4 w-4 text-slate-500 transition-all group-hover:translate-x-1 group-hover:text-purple-300" />
          </button>
        </nav>

        <div className="relative border-t border-white/10 px-5 py-4 text-center">
          <p className="text-xs text-slate-400">Movies Verse Bangladesh</p>
        </div>
      </aside>
    </>,
    document.body
  )
}

function ModexTile() {
  return (
    <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center overflow-hidden rounded-xl border border-white/10 bg-black/40 transition-transform duration-300 group-hover:scale-105">
      <img
        src="https://i.postimg.cc/YqKw8FTB/24592-removebg-preview.png"
        alt="Modex"
        className="h-11 w-11 object-contain"
      />
    </div>
  )
}
