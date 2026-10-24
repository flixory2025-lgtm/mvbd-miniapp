"use client"

import { useEffect, useMemo, useState } from "react"
import type { ComponentType, ReactNode } from "react"
import {
  Search,
  X,
  Star,
  MoreHorizontal,
  Camera,
  Film,
  Music,
  Shield,
  FileText,
  Activity,
  Gamepad2,
  Smartphone,
  Video,
  Folder,
  Image as ImageIcon,
  Mic,
} from "lucide-react"
import SideNavigation, { openSideMenu } from "@/components/side-navigation"

const LOGO = "https://i.postimg.cc/YqKw8FTB/24592-removebg-preview.png"

const CATEGORIES = ["All", "Editing", "Entertainment", "Tools", "Games", "Music"] as const

const PLACEHOLDERS = [
  "Search premium apps...",
  "Find editing apps...",
  "Find games & tools...",
  "Search music apps...",
]

interface AppItem {
  id: number
  name: string
  dev: string
  category: Exclude<(typeof CATEGORIES)[number], "All">
  rating: number
  size: string
  desc: string
  from: string
  to: string
  icon: ComponentType<{ className?: string }>
  featured?: boolean
}

/* ⚠️ Placeholder data — nijer app gulo diye bodle nin */
const APPS: AppItem[] = [
  { id: 1, name: "Photo Studio Pro", dev: "Modex Labs", category: "Editing", rating: 4.8, size: "86 MB", desc: "Pro tools diye photo edit korun", from: "#f97316", to: "#be123c", icon: Camera, featured: true },
  { id: 2, name: "Video Editor Pro", dev: "Modex Labs", category: "Editing", rating: 4.7, size: "142 MB", desc: "Cinematic video editing, shob feature unlocked", from: "#8b5cf6", to: "#4338ca", icon: Film, featured: true },
  { id: 3, name: "Music Player Plus", dev: "Soundly", category: "Music", rating: 4.6, size: "34 MB", desc: "Ad chhara unlimited gaan", from: "#22d3ee", to: "#0e7490", icon: Music, featured: true },
  { id: 4, name: "VPN Shield", dev: "SafeNet", category: "Tools", rating: 4.5, size: "28 MB", desc: "Fast ar secure browsing", from: "#10b981", to: "#065f46", icon: Shield },
  { id: 5, name: "PDF Master", dev: "DocWorks", category: "Tools", rating: 4.4, size: "41 MB", desc: "PDF edit, merge ar sign", from: "#ef4444", to: "#7f1d1d", icon: FileText },
  { id: 6, name: "Fitness Coach", dev: "FitLab", category: "Tools", rating: 4.3, size: "63 MB", desc: "Daily workout plan ar tracker", from: "#84cc16", to: "#3f6212", icon: Activity },
  { id: 7, name: "Puzzle Quest", dev: "Pixel Forge", category: "Games", rating: 4.7, size: "210 MB", desc: "Hajar level er puzzle adventure", from: "#f59e0b", to: "#92400e", icon: Gamepad2 },
  { id: 8, name: "Racing Legends", dev: "Pixel Forge", category: "Games", rating: 4.5, size: "480 MB", desc: "Realistic racing, unlimited coins", from: "#3b82f6", to: "#1e3a8a", icon: Smartphone },
  { id: 9, name: "Screen Recorder", dev: "CapTool", category: "Entertainment", rating: 4.4, size: "22 MB", desc: "HD screen recording, watermark nei", from: "#ec4899", to: "#831843", icon: Video },
  { id: 10, name: "File Manager X", dev: "DocWorks", category: "Tools", rating: 4.2, size: "18 MB", desc: "Shohoje file organize korun", from: "#eab308", to: "#713f12", icon: Folder },
  { id: 11, name: "Wallpaper Hub", dev: "Artify", category: "Entertainment", rating: 4.1, size: "52 MB", desc: "4K wallpaper er boro collection", from: "#14b8a6", to: "#134e4a", icon: ImageIcon },
  { id: 12, name: "Podcast Player", dev: "Soundly", category: "Music", rating: 4.3, size: "30 MB", desc: "Pochondoer podcast, offline shuno", from: "#a855f7", to: "#581c87", icon: Mic },
]

function AppIcon({ app, size }: { app: AppItem; size: number }) {
  const Icon = app.icon
  return (
    <div
      className="flex flex-shrink-0 items-center justify-center text-white shadow-lg"
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.24,
        background: `linear-gradient(135deg, ${app.from}, ${app.to})`,
      }}
    >
      <Icon className="h-1/2 w-1/2" />
    </div>
  )
}

function GetButton() {
  return (
    <button
      type="button"
      className="flex-shrink-0 rounded-full bg-gradient-to-r from-emerald-500 to-cyan-500 px-5 py-1.5 text-sm font-bold text-white transition-transform hover:brightness-110 active:scale-95"
    >
      Get
    </button>
  )
}

function Rating({ value }: { value: number }) {
  return (
    <span className="inline-flex items-center gap-1 text-xs text-slate-300">
      {value.toFixed(1)}
      <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
    </span>
  )
}

function AppRow({ app }: { app: AppItem }) {
  return (
    <div className="flex items-center gap-4 rounded-2xl p-2 transition-colors hover:bg-white/5">
      <AppIcon app={app} size={64} />
      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold text-white">{app.name}</p>
        <p className="truncate text-xs text-slate-400">
          {app.dev} • {app.category}
        </p>
        <div className="mt-1 flex items-center gap-3">
          <Rating value={app.rating} />
          <span className="text-xs text-slate-500">{app.size}</span>
        </div>
      </div>
      <GetButton />
    </div>
  )
}

function SectionTitle({ children }: { children: ReactNode }) {
  return <h2 className="mb-3 px-4 text-lg font-bold text-white">{children}</h2>
}

export default function ModexPage() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [focused, setFocused] = useState(false)
  const [query, setQuery] = useState("")
  const [cat, setCat] = useState<(typeof CATEGORIES)[number]>("All")
  const [phIndex, setPhIndex] = useState(0)

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 10)
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  // Search box er placeholder ghurte thake
  useEffect(() => {
    if (focused || query) return
    const t = setInterval(() => setPhIndex((i) => (i + 1) % PLACEHOLDERS.length), 2600)
    return () => clearInterval(t)
  }, [focused, query])

  const q = query.trim().toLowerCase()

  const results = useMemo(() => {
    const words = q.split(/\s+/).filter(Boolean)
    return APPS.filter((a) => {
      if (cat !== "All" && a.category !== cat) return false
      const hay = `${a.name} ${a.dev} ${a.category}`.toLowerCase()
      return words.every((w) => hay.includes(w))
    })
  }, [q, cat])

  const featured = APPS.filter((a) => a.featured)
  const topApps = [...APPS].sort((a, b) => b.rating - a.rating).slice(0, 8)

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a12] via-[#050508] to-[#020206] text-white">
      <style>{`
        .modex-glass {
          background: rgba(255,255,255,.05);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255,255,255,.2);
          transition: all .3s ease;
          cursor: text;
        }
        .modex-glass:focus-within {
          background: rgba(255,255,255,.08);
          border-color: rgba(100,200,255,.4);
          box-shadow: 0 0 20px 4px rgba(100,200,255,.15), inset 0 0 20px rgba(255,255,255,.08);
        }
        .modex-btn {
          background: rgba(255,255,255,.05);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255,255,255,.2);
        }
        .modex-btn:hover { background: rgba(255,255,255,.1); border-color: rgba(100,200,255,.4); }
        @keyframes modexPh {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .modex-ph { animation: modexPh .45s ease-out; }
        .modex-noscroll { scrollbar-width: none; }
        .modex-noscroll::-webkit-scrollbar { display: none; }
        @media (prefers-reduced-motion: reduce) { .modex-ph { animation: none; } }
      `}</style>

      {/* ================= HEADER ================= */}
      <header
        className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ease-in-out ${
          isScrolled
            ? "border-b border-white/10 bg-black/60 shadow-lg backdrop-blur-xl"
            : "border-b border-transparent bg-transparent"
        }`}
      >
        <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-3">
          {/* Left corner: Modex logo + name */}
          <button
            type="button"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            aria-label="Modex"
            className="flex flex-shrink-0 items-center gap-2"
          >
            <img src={LOGO} alt="Modex Logo" className="h-10 w-10 object-contain" />
            <span className="bg-gradient-to-r from-white via-cyan-200 to-emerald-300 bg-clip-text text-2xl font-extrabold tracking-tight text-transparent">
              Modex
            </span>
          </button>

          {/* Search */}
          <div className="relative min-w-0 flex-1">
            <div
              className="modex-glass relative flex items-center gap-3 rounded-2xl px-4 py-3"
              onClick={(e) => e.currentTarget.querySelector("input")?.focus()}
            >
              <Search className="pointer-events-none h-5 w-5 flex-shrink-0 text-slate-300" />
              <div className="relative h-5 min-w-0 flex-1">
                {!query && !focused && (
                  <span
                    key={phIndex}
                    className="modex-ph pointer-events-none absolute inset-0 flex items-center truncate text-[14px] text-white/50"
                  >
                    {PLACEHOLDERS[phIndex]}
                  </span>
                )}
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onFocus={() => setFocused(true)}
                  onBlur={() => setFocused(false)}
                  placeholder={focused ? "Search premium apps..." : ""}
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="off"
                  spellCheck={false}
                  className="absolute inset-0 h-full w-full bg-transparent text-[14px] text-white caret-[#64c8ff] outline-none placeholder:text-white/50"
                />
              </div>
              {query && (
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => setQuery("")}
                  aria-label="Clear search"
                  className="text-slate-400 transition hover:text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          {/* Right corner: 3 dots menu */}
          <div
            className={`flex-shrink-0 overflow-hidden transition-all duration-300 ease-in-out ${
              focused ? "-ml-4 w-0 pointer-events-none opacity-0" : "w-11 opacity-100"
            }`}
          >
            <button
              type="button"
              onClick={openSideMenu}
              aria-label="Open menu"
              tabIndex={focused ? -1 : 0}
              className="modex-btn flex h-11 w-11 items-center justify-center rounded-2xl text-slate-200 transition-all duration-200 hover:text-white active:scale-90"
            >
              <MoreHorizontal className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>

      {/* ================= BODY ================= */}
      <main className="mx-auto max-w-6xl pb-12 pt-[84px]">
        {/* Category chips */}
        <div className="modex-noscroll flex gap-2 overflow-x-auto px-4 pb-4">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCat(c)}
              className={`flex-shrink-0 rounded-full border px-4 py-1.5 text-sm font-semibold transition-all duration-300 ${
                cat === c
                  ? "border-transparent bg-gradient-to-r from-emerald-500 to-cyan-500 text-white"
                  : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10"
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        {q ? (
          /* ---------- Search results ---------- */
          <section className="px-4">
            <p className="mb-3 text-sm text-slate-400">
              &ldquo;{query.trim()}&rdquo; er jonno {results.length}টি app
            </p>
            {results.length > 0 ? (
              <div className="grid gap-1 md:grid-cols-2">
                {results.map((a) => (
                  <AppRow key={a.id} app={a} />
                ))}
              </div>
            ) : (
              <div className="rounded-3xl border border-white/10 bg-white/5 p-8 text-center">
                <p className="font-semibold">কোনো app পাওয়া যায়নি</p>
                <p className="mt-1 text-sm text-slate-400">অন্য নাম লিখে আবার খুঁজুন।</p>
              </div>
            )}
          </section>
        ) : (
          <>
            {/* ---------- Featured banners ---------- */}
            {cat === "All" && (
              <section className="mb-8">
                <div className="modex-noscroll flex snap-x snap-mandatory gap-4 overflow-x-auto px-4">
                  {featured.map((a) => {
                    const Icon = a.icon
                    return (
                      <div
                        key={a.id}
                        className="relative h-44 w-[82%] flex-shrink-0 snap-center overflow-hidden rounded-3xl p-5 sm:w-[420px]"
                        style={{ background: `linear-gradient(135deg, ${a.from}, ${a.to})` }}
                      >
                        <Icon className="absolute -bottom-6 -right-4 h-40 w-40 text-white/15" />
                        <div className="relative flex h-full flex-col justify-between">
                          <div>
                            <p className="text-2xl font-extrabold leading-tight">{a.name}</p>
                            <p className="mt-1 max-w-[75%] text-sm text-white/80">{a.desc}</p>
                          </div>
                          <button
                            type="button"
                            className="w-fit rounded-full bg-white px-5 py-1.5 text-sm font-bold text-black transition-transform active:scale-95"
                          >
                            Get
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </section>
            )}

            {/* ---------- Top premium apps ---------- */}
            <section className="mb-8">
              <SectionTitle>Top premium apps</SectionTitle>
              <div className="modex-noscroll flex gap-4 overflow-x-auto px-4">
                {(cat === "All" ? topApps : results).map((a) => (
                  <div key={a.id} className="w-[104px] flex-shrink-0">
                    <AppIcon app={a} size={104} />
                    <p className="mt-2 truncate text-sm font-semibold">{a.name}</p>
                    <Rating value={a.rating} />
                  </div>
                ))}
              </div>
            </section>

            {/* ---------- All apps list ---------- */}
            <section className="px-4">
              <h2 className="mb-3 text-lg font-bold">{cat === "All" ? "Editor's choice" : cat}</h2>
              <div className="grid gap-1 md:grid-cols-2">
                {results.map((a) => (
                  <AppRow key={a.id} app={a} />
                ))}
              </div>
            </section>
          </>
        )}
      </main>

      {/* ================= FOOTER ================= */}
      <footer className="border-t border-white/10 bg-black/40 px-4 py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 text-center">
          <div className="flex items-center gap-2">
            <img src={LOGO} alt="Modex" className="h-9 w-9 object-contain" />
            <span className="bg-gradient-to-r from-white via-cyan-200 to-emerald-300 bg-clip-text text-xl font-extrabold text-transparent">
              Modex
            </span>
          </div>
          <p className="max-w-md text-sm text-slate-400">
            পছন্দের premium app খুঁজুন এক জায়গায়।
          </p>
          <a
            href="/"
            className="rounded-full border border-white/10 bg-white/5 px-5 py-2 text-sm text-slate-200 transition-colors hover:bg-white/10"
          >
            Movies Verse Bangladesh এ ফিরুন
          </a>
          <p className="text-xs text-slate-500">© {new Date().getFullYear()} Modex. All rights reserved.</p>
        </div>
      </footer>

      <SideNavigation current="modex" />
    </div>
  )
            }
