"use client"

import { createContext, useCallback, useContext, useEffect, useId, useMemo, useRef, useState } from "react"
import type { CSSProperties, ReactNode } from "react"
import {
  ArrowLeft,
  Bookmark,
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  Megaphone,
  MoreHorizontal,
  Package,
  Search,
  Share2,
  Star,
  TrendingUp,
  Wrench,
  X,
} from "lucide-react"
import { openSideMenu } from "@/components/side-navigation"
import { db } from "@/lib/firebase"
import { collection, doc, increment, onSnapshot, updateDoc } from "firebase/firestore"

/* =========================================================
   LOGO — "Mod" white + "e" green gradient + notun X (green gradient)
   X: ekta bold diagonal solid, onno diagonal majhkhane kata (notch), flat cut end.
   (admin panel e custom logo link dile oita dekhabe)
========================================================= */

function ModexX({ size = "0.85em", className = "", style }: { size?: number | string; className?: string; style?: CSSProperties }) {
  const uid = useId().replace(/:/g, "")
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} className={className} style={style} aria-hidden="true">
      <defs>
        <linearGradient id={`${uid}g`} gradientUnits="userSpaceOnUse" x1="2" y1="2" x2="22" y2="22">
          <stop offset="0" stopColor="#86efac" />
          <stop offset=".5" stopColor="#22c55e" />
          <stop offset="1" stopColor="#059669" />
        </linearGradient>
        <mask id={`${uid}m`} maskUnits="userSpaceOnUse" x="0" y="0" width="24" height="24">
          <rect width="24" height="24" fill="#fff" />
          <polygon points="2,2 8.6,2 22,22 15.4,22" fill="#000" stroke="#000" strokeWidth="2.6" />
        </mask>
      </defs>
      <polygon points="2,2 8.6,2 22,22 15.4,22" fill={`url(#${uid}g)`} />
      <polygon points="15.4,2 22,2 8.6,22 2,22" fill={`url(#${uid}g)`} mask={`url(#${uid}m)`} />
    </svg>
  )
}

function ModexLogo({ size = 28, logoUrl = "" }: { size?: number; logoUrl?: string }) {
  const [bad, setBad] = useState(false)
  useEffect(() => {
    setBad(false)
  }, [logoUrl])

  if (logoUrl && !bad) {
    return (
      <img
        src={logoUrl}
        alt="Modex"
        onError={() => setBad(true)}
        style={{ height: size * 1.2 }}
        className="inline-block w-auto object-contain"
      />
    )
  }

  return (
    <span className="inline-flex items-center font-extrabold leading-none tracking-tight" style={{ fontSize: size }}>
      <span className="text-white">Mod</span>
      <span className="bg-gradient-to-r from-emerald-200 via-green-400 to-emerald-600 bg-clip-text text-transparent">e</span>
      <ModexX size="0.82em" style={{ marginLeft: "0.05em", flexShrink: 0 }} />
    </span>
  )
}

/* =========================================================
   TYPES + CONFIG (admin panel theke control hoy)
   Firestore: modex_apps (collection), modex_config/main (doc)
========================================================= */

interface ModexApp {
  id: string
  name: string
  tagline: string
  developer: string
  category: string
  description: string
  whatsNew: string
  version: string
  size: string
  downloads: string
  reviews: string
  rating: number
  requires: string
  iconUrl: string
  bannerUrl: string
  screenshots: string[]
  downloadUrl: string
  featured: boolean
  trending: boolean
  published: boolean
  createdAt: number
  updatedAt: number
  getClicks: number
  views: number
}

interface Banner {
  title: string
  subtitle: string
  imageUrl: string
  target: "app" | "link"
  appId: string
  link: string
}

interface ModexConfig {
  brand: { logoUrl: string }
  theme: { accent: string; accent2: string; bg: string; chip: string }
  texts: {
    welcome: string
    forYouLabel: string
    topChartsLabel: string
    savedLabel: string
    categoriesTitle: string
    suggestedTitle: string
    trendingTitle: string
    newTitle: string
    getLabel: string
    seeAll: string
    emptyText: string
    searchHint: string
    aboutTitle: string
    whatsNewTitle: string
    similarTitle: string
  }
  sections: {
    showBanners: boolean
    showCategories: boolean
    showTrending: boolean
    showNew: boolean
    trendingCount: number
    newCount: number
    topCount: number
  }
  nav: { showTopCharts: boolean; showCategories: boolean; showSaved: boolean; showSite: boolean }
  search: { useAppNames: boolean; prefix: string }
  detail: {
    showScreenshots: boolean
    showWhatsNew: boolean
    showInfo: boolean
    showMoreFromDev: boolean
    showSimilar: boolean
  }
  announcement: { enabled: boolean; text: string; link: string; style: "info" | "success" | "warning" }
  maintenance: { enabled: boolean; message: string }
  banners: Banner[]
  categories: string[]
  placeholders: string[]
}

const DEFAULT_CONFIG: ModexConfig = {
  brand: { logoUrl: "" },
  theme: { accent: "#22c55e", accent2: "#10b981", bg: "#0f1311", chip: "#2b322e" },
  texts: {
    welcome: "Welcome to",
    forYouLabel: "For you",
    topChartsLabel: "Top charts",
    savedLabel: "Saved",
    categoriesTitle: "Categories",
    suggestedTitle: "Suggested for you",
    trendingTitle: "Trending Apps",
    newTitle: "New Apps",
    getLabel: "Install",
    seeAll: "See all",
    emptyText: "এখনো কোনো app যোগ করা হয়নি।",
    searchHint: "App er naam, developer ba category likhe khujun",
    aboutTitle: "About this app",
    whatsNewTitle: "What's new",
    similarTitle: "Similar apps",
  },
  sections: {
    showBanners: true,
    showCategories: true,
    showTrending: true,
    showNew: true,
    trendingCount: 10,
    newCount: 8,
    topCount: 20,
  },
  nav: { showTopCharts: true, showCategories: true, showSaved: true, showSite: true },
  search: { useAppNames: true, prefix: "Search " },
  detail: { showScreenshots: true, showWhatsNew: true, showInfo: true, showMoreFromDev: true, showSimilar: true },
  announcement: { enabled: false, text: "", link: "", style: "info" },
  maintenance: { enabled: false, message: "Modex ekhon maintenance e ache. Kichukkhon pore abar ashun." },
  banners: [],
  categories: ["Editing", "Entertainment", "Tools", "Games", "Music", "Social", "Education"],
  placeholders: ["Search premium apps...", "Find editing apps...", "Find games & tools...", "Search music apps..."],
}

const obj = (v: any) => (v && typeof v === "object" && !Array.isArray(v) ? v : {})

function mergeConfig(raw: any): ModexConfig {
  const d = obj(raw)
  const D = DEFAULT_CONFIG
  const cfg: ModexConfig = {
    brand: { ...D.brand, ...obj(d.brand) },
    theme: { ...D.theme, ...obj(d.theme) },
    texts: { ...D.texts, ...(d.welcomeText ? { welcome: String(d.welcomeText) } : {}), ...obj(d.texts) },
    sections: { ...D.sections, ...obj(d.sections) },
    nav: { ...D.nav, ...obj(d.nav) },
    search: { ...D.search, ...obj(d.search) },
    detail: { ...D.detail, ...obj(d.detail) },
    announcement: { ...D.announcement, ...obj(d.announcement) },
    maintenance: { ...D.maintenance, ...obj(d.maintenance) },
    banners: Array.isArray(d.banners)
      ? d.banners
          .filter((b: any) => b && b.imageUrl)
          .map((b: any) => ({
            title: String(b.title || ""),
            subtitle: String(b.subtitle || ""),
            imageUrl: String(b.imageUrl || ""),
            target: b.target === "link" ? "link" : "app",
            appId: String(b.appId || ""),
            link: String(b.link || ""),
          }))
      : [],
    categories: Array.isArray(d.categories) && d.categories.length ? d.categories.map(String) : D.categories,
    placeholders: Array.isArray(d.placeholders) && d.placeholders.length ? d.placeholders.map(String) : D.placeholders,
  }
  cfg.sections.trendingCount = Number(cfg.sections.trendingCount) || 10
  cfg.sections.newCount = Number(cfg.sections.newCount) || 8
  cfg.sections.topCount = Number(cfg.sections.topCount) || 20
  return cfg
}

function toMs(v: any): number {
  if (!v) return 0
  if (typeof v === "number") return v
  if (typeof v.toMillis === "function") return v.toMillis()
  return 0
}

function normalizeApp(id: string, d: any): ModexApp {
  return {
    id,
    name: String(d.name || "Untitled"),
    tagline: String(d.tagline || ""),
    developer: String(d.developer || "Unknown"),
    category: String(d.category || "Tools"),
    description: String(d.description || ""),
    whatsNew: String(d.whatsNew || ""),
    version: String(d.version || ""),
    size: String(d.size || ""),
    downloads: String(d.downloads || ""),
    reviews: String(d.reviews || ""),
    rating: Number(d.rating) || 0,
    requires: String(d.requires || ""),
    iconUrl: String(d.iconUrl || ""),
    bannerUrl: String(d.bannerUrl || ""),
    screenshots: Array.isArray(d.screenshots) ? d.screenshots.filter(Boolean).map(String) : [],
    downloadUrl: String(d.downloadUrl || ""),
    featured: !!d.featured,
    trending: !!d.trending,
    published: d.published !== false,
    createdAt: toMs(d.createdAt),
    updatedAt: toMs(d.updatedAt) || toMs(d.createdAt),
    getClicks: Number(d.getClicks) || 0,
    views: Number(d.views) || 0,
  }
}

/* Real-time: admin panel e kichu change korle ekhane sathe sathe update hoy */
function useModexData() {
  const [apps, setApps] = useState<ModexApp[]>([])
  const [cfg, setCfg] = useState<ModexConfig>(DEFAULT_CONFIG)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const unsubApps = onSnapshot(
      collection(db, "modex_apps"),
      (snap) => {
        setApps(
          snap.docs
            .map((d) => normalizeApp(d.id, d.data()))
            .filter((a) => a.published)
            .sort((a, b) => b.createdAt - a.createdAt)
        )
        setLoading(false)
        setError(null)
      },
      (err) => {
        setError(err.message)
        setLoading(false)
      }
    )

    const unsubCfg = onSnapshot(
      doc(db, "modex_config", "main"),
      (snap) => setCfg(mergeConfig(snap.exists() ? snap.data() : {})),
      () => {}
    )

    return () => {
      unsubApps()
      unsubCfg()
    }
  }, [])

  return { apps, cfg, loading, error }
}

/* Mobile vs desktop — mobile e mobile er moto, desktop e desktop er moto */
function useDesktop() {
  const [d, setD] = useState(false)
  useEffect(() => {
    const m = window.matchMedia("(min-width: 1024px)")
    const f = () => setD(m.matches)
    f()
    m.addEventListener("change", f)
    return () => m.removeEventListener("change", f)
  }, [])
  return d
}

/* =========================================================
   CONTEXT (config + tracking shob component e pouchaye dey)
========================================================= */

type TrackKind = "views" | "clicks"
const Ctx = createContext<{ cfg: ModexConfig; track: (id: string, kind: TrackKind) => void }>({
  cfg: DEFAULT_CONFIG,
  track: () => {},
})

/* =========================================================
   TYPES / HELPERS
========================================================= */

type HomeTab = "foryou" | "top" | "categories" | "saved"

type View =
  | { t: "home" }
  | { t: "search" }
  | { t: "list"; title: string; kind: "trending" | "new" | "cat"; cat?: string }
  | { t: "detail"; id: string }
  | { t: "dev"; name: string }

const SAVED_KEY = "modex_saved_apps"
const ANN_KEY = "modex_ann_dismissed"

function hueOf(s: string) {
  let h = 0
  for (const c of s) h = (h * 31 + c.charCodeAt(0)) % 360
  return h
}

function fallbackBg(name: string) {
  const h = hueOf(name)
  return `linear-gradient(135deg, hsl(${h} 70% 50%), hsl(${(h + 50) % 360} 65% 28%))`
}

function fmtDate(ms: number) {
  if (!ms) return "—"
  return new Date(ms).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
}

function matchApps(apps: ModexApp[], query: string) {
  const q = query.trim().toLowerCase()
  if (!q) return []
  const words = q.split(/\s+/).filter(Boolean)
  return apps.filter((a) => {
    const hay = `${a.name} ${a.developer} ${a.category}`.toLowerCase()
    return words.every((w) => hay.includes(w))
  })
}

/* =========================================================
   SMALL UI PARTS
========================================================= */

/* iOS squircle-er kachakachi radius (22.4%) */
function AppIcon({ app, size }: { app: ModexApp; size: number }) {
  const [bad, setBad] = useState(false)
  useEffect(() => {
    setBad(false)
  }, [app.iconUrl])
  return (
    <div
      className="flex flex-shrink-0 items-center justify-center overflow-hidden font-extrabold text-white shadow-lg ring-1 ring-white/15"
      style={{ width: size, height: size, borderRadius: size * 0.2237, background: fallbackBg(app.name) }}
    >
      {app.iconUrl && !bad ? (
        <img
          src={app.iconUrl}
          alt={app.name}
          loading="lazy"
          onError={() => setBad(true)}
          className="h-full w-full object-cover"
        />
      ) : (
        <span style={{ fontSize: size * 0.42 }}>{app.name.charAt(0).toUpperCase()}</span>
      )}
    </div>
  )
}

function Rating({ value, className = "" }: { value: number; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-1 text-xs text-slate-300 ${className}`}>
      {value.toFixed(1)}
      <Star className="h-3 w-3 fill-slate-300 text-slate-300" />
    </span>
  )
}

function IconBtn({
  onClick,
  label,
  children,
  className = "",
}: {
  onClick: () => void
  label: string
  children: ReactNode
  className?: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={`mx-circle flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-slate-100 transition hover:bg-white/15 active:scale-90 ${className}`}
    >
      {children}
    </button>
  )
}

function InstallBtn({ app, big }: { app: ModexApp; big?: boolean }) {
  const { cfg, track } = useContext(Ctx)
  const ok = !!app.downloadUrl
  return (
    <button
      type="button"
      disabled={!ok}
      onClick={(e) => {
        e.stopPropagation()
        if (!ok) return
        track(app.id, "clicks")
        window.open(app.downloadUrl, "_blank", "noopener,noreferrer")
      }}
      className={
        big
          ? "mx-grad w-full rounded-full py-3.5 text-[15px] font-bold text-white transition active:scale-[.97] disabled:opacity-40 lg:w-auto lg:px-14"
          : "mx-outline flex-shrink-0 rounded-full px-5 py-1.5 text-sm font-bold transition active:scale-90 disabled:opacity-40"
      }
    >
      {ok ? cfg.texts.getLabel : "Soon"}
    </button>
  )
}

function AppRow({ app, onOpen, rank }: { app: ModexApp; onOpen: () => void; rank?: number }) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(e) => e.key === "Enter" && onOpen()}
      className="flex cursor-pointer items-center gap-3 rounded-3xl px-2 py-2.5 transition duration-200 hover:bg-white/[0.06] active:scale-[.985] active:bg-white/10"
    >
      {rank !== undefined && (
        <span className="w-6 flex-shrink-0 text-center text-sm font-semibold text-slate-400">{rank}</span>
      )}
      <AppIcon app={app} size={60} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-[15px] font-semibold text-white">{app.name}</p>
        <p className="truncate text-xs text-slate-400">
          {app.category}
          {app.size ? ` • ${app.size}` : ""}
        </p>
        <div className="mt-0.5 flex items-center gap-2">
          <Rating value={app.rating} />
          {app.downloads && <span className="text-xs text-slate-500">{app.downloads}</span>}
        </div>
      </div>
      <InstallBtn app={app} />
    </div>
  )
}

function SectionHead({ title, onSeeAll }: { title: string; onSeeAll?: () => void }) {
  const { cfg } = useContext(Ctx)
  return (
    <div className="mb-3 flex items-end justify-between px-5">
      <h2 className="text-[22px] font-bold tracking-tight text-white">{title}</h2>
      {onSeeAll && (
        <button
          type="button"
          onClick={onSeeAll}
          className="mx-soft flex items-center gap-0.5 rounded-full px-2 py-1 text-[15px] font-medium transition hover:bg-white/10 active:scale-95"
        >
          {cfg.texts.seeAll}
          <ChevronRight className="h-4 w-4" />
        </button>
      )}
    </div>
  )
}

function TopBar({ title, onBack, children }: { title: string; onBack: () => void; children?: ReactNode }) {
  return (
    <div className="mx-bar sticky top-0 z-30 flex items-center gap-2 px-3 py-3">
      <IconBtn onClick={onBack} label="Back">
        <ArrowLeft className="h-5 w-5" />
      </IconBtn>
      <h1 className="min-w-0 flex-1 truncate text-lg font-semibold">{title}</h1>
      {children}
    </div>
  )
}

function Empty({ text }: { text: string }) {
  return (
    <div className="mx-glass mx-4 rounded-[28px] p-8 text-center">
      <Package className="mx-auto mb-3 h-8 w-8 text-slate-400" />
      <p className="text-sm text-slate-400">{text}</p>
    </div>
  )
}

/* Horizontal row — mobile e swipe, desktop e left/right arrow button */
function ScrollRow({ children, className = "" }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const [can, setCan] = useState({ l: false, r: false })

  const upd = useCallback(() => {
    const el = ref.current
    if (!el) return
    const l = el.scrollLeft > 8
    const r = el.scrollLeft + el.clientWidth < el.scrollWidth - 8
    setCan((p) => (p.l === l && p.r === r ? p : { l, r }))
  }, [])

  useEffect(() => {
    upd()
    window.addEventListener("resize", upd)
    return () => window.removeEventListener("resize", upd)
  })

  const scroll = (dir: number) => {
    const el = ref.current
    if (el) el.scrollBy({ left: dir * el.clientWidth * 0.8, behavior: "smooth" })
  }

  return (
    <div className="relative">
      <div ref={ref} onScroll={upd} className={`modex-noscroll flex snap-x gap-4 overflow-x-auto px-5 ${className}`}>
        {children}
      </div>
      {can.l && (
        <button type="button" aria-label="Previous" onClick={() => scroll(-1)} className="mx-arrow left-2 hidden lg:flex">
          <ChevronLeft className="h-5 w-5" />
        </button>
      )}
      {can.r && (
        <button type="button" aria-label="Next" onClick={() => scroll(1)} className="mx-arrow right-2 hidden lg:flex">
          <ChevronRight className="h-5 w-5" />
        </button>
      )}
    </div>
  )
}

/* =========================================================
   HERO BANNER SLIDER (admin panel theke banner add/remove)
========================================================= */

interface HeroItem {
  title: string
  subtitle: string
  imageUrl: string
  onClick: () => void
}

function BannerSlider({ items }: { items: HeroItem[] }) {
  const ref = useRef<HTMLDivElement>(null)
  const hold = useRef(false)
  const [idx, setIdx] = useState(0)

  useEffect(() => {
    if (items.length < 2) return
    const t = setInterval(() => {
      const el = ref.current
      if (!el || hold.current) return
      const next = (Math.round(el.scrollLeft / el.clientWidth) + 1) % items.length
      el.scrollTo({ left: next * el.clientWidth, behavior: "smooth" })
    }, 4500)
    return () => clearInterval(t)
  }, [items.length])

  const goTo = (i: number) => {
    const el = ref.current
    if (el) el.scrollTo({ left: i * el.clientWidth, behavior: "smooth" })
  }

  return (
    <div className="mb-6 px-4">
      <div
        ref={ref}
        onScroll={(e) => {
          const el = e.currentTarget
          setIdx(Math.round(el.scrollLeft / (el.clientWidth || 1)))
        }}
        onTouchStart={() => (hold.current = true)}
        onTouchEnd={() => window.setTimeout(() => (hold.current = false), 3000)}
        onMouseEnter={() => (hold.current = true)}
        onMouseLeave={() => (hold.current = false)}
        className="modex-noscroll mx-banner flex snap-x snap-mandatory overflow-x-auto rounded-[28px] shadow-2xl"
      >
        {items.map((b, i) => (
          <button
            key={i}
            type="button"
            onClick={b.onClick}
            className="relative aspect-[16/8] w-full flex-shrink-0 snap-center overflow-hidden text-left lg:aspect-[16/6]"
            style={{ background: fallbackBg(b.title || String(i)) }}
          >
            <img
              src={b.imageUrl}
              alt=""
              loading="lazy"
              onError={(e) => (e.currentTarget.style.display = "none")}
              className="absolute inset-0 h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/15 to-transparent" />
            <div className="absolute inset-x-5 bottom-4">
              {b.title && <p className="text-xl font-bold leading-tight drop-shadow lg:text-3xl">{b.title}</p>}
              {b.subtitle && <p className="mt-0.5 line-clamp-1 text-xs text-white/80 lg:text-sm">{b.subtitle}</p>}
            </div>
          </button>
        ))}
      </div>
      {items.length > 1 && (
        <div className="mt-3 flex justify-center gap-1.5">
          {items.map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Banner ${i + 1}`}
              onClick={() => goTo(i)}
              className={`h-1.5 rounded-full transition-all duration-300 ${i === idx ? "mx-grad w-5" : "w-1.5 bg-white/25"}`}
            />
          ))}
        </div>
      )}
    </div>
  )
}

/* =========================================================
   SEARCH BAR — liquid glass + 3D cube te app er naam slideshow + suggestions dropdown
========================================================= */

function SearchBar({
  apps,
  popular,
  value,
  onChange,
  onSubmit,
  onPick,
  onFocusChange,
  className = "",
}: {
  apps: ModexApp[]
  popular: ModexApp[]
  value: string
  onChange: (v: string) => void
  onSubmit: (v: string) => void
  onPick: (a: ModexApp) => void
  onFocusChange?: (f: boolean) => void
  className?: string
}) {
  const { cfg } = useContext(Ctx)
  const [focused, setFocused] = useState(false)
  const [offset, setOffset] = useState(0)
  const [bubbles, setBubbles] = useState<Array<{ id: number; x: number; y: number }>>([])
  const bubbleId = useRef(0)
  const wrapRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const setFocus = (f: boolean) => {
    setFocused(f)
    onFocusChange?.(f)
  }

  /* cube er 4 ta face e app er naam — 25s por por notun 4 ta naam ashe */
  const pool = useMemo(() => {
    if (cfg.search.useAppNames && apps.length) return apps.map((a) => `${cfg.search.prefix}${a.name}`)
    return cfg.placeholders.length ? cfg.placeholders : ["Search apps..."]
  }, [apps, cfg.search.useAppNames, cfg.search.prefix, cfg.placeholders])

  useEffect(() => {
    if (pool.length <= 4) return
    const t = setInterval(() => setOffset((o) => (o + 4) % pool.length), 25000)
    return () => clearInterval(t)
  }, [pool.length])

  const faces = [0, 1, 2, 3].map((i) => pool[(offset + i) % pool.length])

  /* bahire click/touch korle dropdown bondho (mouse + touch dutoi) */
  useEffect(() => {
    const onDown = (e: Event) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setFocus(false)
    }
    document.addEventListener("mousedown", onDown)
    document.addEventListener("touchstart", onDown, { passive: true })
    return () => {
      document.removeEventListener("mousedown", onDown)
      document.removeEventListener("touchstart", onDown)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const hasQuery = value.trim().length > 0
  const suggestions = useMemo(
    () => (hasQuery ? matchApps(apps, value).slice(0, 8) : popular.slice(0, 5)),
    [apps, popular, value, hasQuery]
  )
  const showCube = !focused && !hasQuery
  const showDrop = focused

  const makeBubbles = () => {
    const nb: Array<{ id: number; x: number; y: number }> = []
    for (let i = 0; i < 3; i++) {
      const id = bubbleId.current++
      nb.push({ id, x: Math.random() * 20 - 10, y: Math.random() * 10 })
      setTimeout(() => setBubbles((p) => p.filter((b) => b.id !== id)), 800)
    }
    setBubbles((p) => [...p, ...nb])
  }

  return (
    <div ref={wrapRef} className={`relative min-w-0 flex-1 ${className}`}>
      <div
        onClick={() => inputRef.current?.focus()}
        className="mxs-glass relative flex items-center gap-3 rounded-full px-4 py-3"
      >
        <Search className="pointer-events-none h-5 w-5 flex-shrink-0 text-slate-300" />

        <div className="mxs-cube-container">
          {showCube && (
            <div className="mxs-cube-wrapper">
              <div className="mxs-cube">
                {faces.map((t, i) => (
                  <div key={i} className={`mxs-face mxs-face-${i + 1}`}>
                    {t}
                  </div>
                ))}
              </div>
            </div>
          )}

          <input
            ref={inputRef}
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onFocus={() => {
              setFocus(true)
              makeBubbles()
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && hasQuery) {
                onSubmit(value.trim())
                setFocus(false)
                inputRef.current?.blur()
              }
              if (e.key === "Escape") setFocus(false)
            }}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
            aria-label="Search apps"
            className="mxs-input"
          />
        </div>

        {value && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onChange("")
              inputRef.current?.focus()
            }}
            className="relative z-40 text-slate-400 transition hover:text-white"
            aria-label="Clear search"
          >
            <X className="h-4 w-4" />
          </button>
        )}

        {bubbles.map((b) => (
          <div key={b.id} className="mxs-bubble" style={{ left: `calc(50% + ${b.x}px)`, top: `${b.y}px` }} />
        ))}
      </div>

      {showDrop && (suggestions.length > 0 || hasQuery) && (
        <div className="mxs-drop">
          {suggestions.length > 0 ? (
            <>
              <div className="mxs-drop-head">
                <TrendingUp className="h-3 w-3" />
                <span>{hasQuery ? "সাজেশন" : "ট্রেন্ডিং"}</span>
              </div>
              {suggestions.map((a) => (
                <div
                  key={a.id}
                  className="mxs-drop-item flex items-center gap-3 text-slate-200"
                  onMouseDown={(e) => {
                    e.preventDefault()
                    setFocus(false)
                    inputRef.current?.blur()
                    onPick(a)
                  }}
                >
                  <AppIcon app={a} size={40} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm text-white">{a.name}</p>
                    <p className="truncate text-[11px] text-slate-400">
                      {a.category} • {a.developer}
                    </p>
                  </div>
                </div>
              ))}
            </>
          ) : (
            <div className="mxs-drop-item text-sm text-slate-500">কোনো ফলাফল নেই</div>
          )}
        </div>
      )}
    </div>
  )
}

/* =========================================================
   SEARCH RESULTS VIEW
========================================================= */

function SearchView({
  apps,
  popular,
  query,
  setQuery,
  onBack,
  onOpen,
}: {
  apps: ModexApp[]
  popular: ModexApp[]
  query: string
  setQuery: (q: string) => void
  onBack: () => void
  onOpen: (a: ModexApp) => void
}) {
  const { cfg } = useContext(Ctx)
  const results = useMemo(() => matchApps(apps, query), [apps, query])
  const hasQuery = query.trim().length > 0

  return (
    <div>
      <div className="mx-bar sticky top-0 z-30 flex items-center gap-2 px-3 py-3">
        <IconBtn onClick={onBack} label="Back">
          <ArrowLeft className="h-5 w-5" />
        </IconBtn>
        <SearchBar apps={apps} popular={popular} value={query} onChange={setQuery} onSubmit={() => {}} onPick={onOpen} />
      </div>

      <div className="px-4 pt-2">
        {!hasQuery ? (
          <p className="px-1 pt-6 text-center text-sm text-slate-500">{cfg.texts.searchHint}</p>
        ) : results.length ? (
          <>
            <p className="mb-2 px-1 text-sm text-slate-400">
              &ldquo;{query.trim()}&rdquo; er jonno {results.length}টি app
            </p>
            <div className="modex-stagger grid lg:grid-cols-2 lg:gap-x-6">
              {results.map((a) => (
                <AppRow key={a.id} app={a} onOpen={() => onOpen(a)} />
              ))}
            </div>
          </>
        ) : (
          <div className="mx-glass rounded-[28px] p-8 text-center">
            <p className="font-semibold">কোনো app পাওয়া যায়নি</p>
            <p className="mt-1 text-sm text-slate-400">অন্য নাম লিখে আবার খুঁজুন।</p>
          </div>
        )}
      </div>
    </div>
  )
}

/* =========================================================
   DETAIL VIEW (App Store style)
========================================================= */

function DetailView({
  app,
  apps,
  saved,
  onToggleSave,
  onBack,
  onOpen,
  onDev,
  onShot,
}: {
  app: ModexApp
  apps: ModexApp[]
  saved: boolean
  onToggleSave: () => void
  onBack: () => void
  onOpen: (a: ModexApp) => void
  onDev: (name: string) => void
  onShot: (list: string[], i: number) => void
}) {
  const { cfg } = useContext(Ctx)
  const desktop = useDesktop()
  const D = cfg.detail
  const T = cfg.texts
  const [more, setMore] = useState(false)
  const sameDev = apps.filter((a) => a.developer === app.developer && a.id !== app.id)
  const similar = apps.filter((a) => a.category === app.category && a.id !== app.id).slice(0, 10)
  const media = [app.bannerUrl, ...app.screenshots].filter(Boolean)

  const share = async () => {
    try {
      if (navigator.share) await navigator.share({ title: app.name, text: app.description.slice(0, 100), url: window.location.href })
      else await navigator.clipboard.writeText(window.location.href)
    } catch {}
  }

  const stats = [
    {
      top: (
        <span className="inline-flex items-center gap-1">
          {app.rating.toFixed(1)}
          <Star className="h-3 w-3 fill-white text-white" />
        </span>
      ),
      label: app.reviews || "Rating",
    },
    { top: app.size || "—", label: "Size" },
    { top: app.downloads || "—", label: "Downloads" },
    { top: app.version || "—", label: "Version" },
  ]

  return (
    <div>
      <TopBar title="" onBack={onBack}>
        <IconBtn onClick={onToggleSave} label="Save">
          <Bookmark className={`h-5 w-5 ${saved ? "mx-soft-fill" : ""}`} />
        </IconBtn>
        <IconBtn onClick={share} label="Share">
          <Share2 className="h-5 w-5" />
        </IconBtn>
      </TopBar>

      {/* Header */}
      <div className="flex items-start gap-4 px-5 pt-2 lg:items-center lg:gap-6">
        <AppIcon app={app} size={desktop ? 132 : 92} />
        <div className="min-w-0 flex-1">
          <h1 className="text-[24px] font-bold leading-tight tracking-tight lg:text-[34px]">{app.name}</h1>
          <button
            type="button"
            onClick={() => onDev(app.developer)}
            className="mx-soft mt-0.5 block max-w-full truncate text-sm font-semibold lg:text-base"
          >
            {app.developer}
          </button>
          <p className="mt-1 truncate text-xs text-slate-400 lg:text-sm">{app.tagline || app.category}</p>
          {/* desktop e install button header er pashe */}
          <div className="mt-4 hidden lg:block">
            <InstallBtn app={app} big />
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="mx-glass mx-4 mt-5 grid grid-cols-4 rounded-[26px] py-3.5">
        {stats.map((s, i) => (
          <div key={i} className={`px-1 text-center ${i > 0 ? "border-l border-white/10" : ""}`}>
            <p className="truncate text-[15px] font-semibold text-white">{s.top}</p>
            <p className="mt-0.5 truncate text-[11px] text-slate-400">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Install (mobile) */}
      <div className="mt-5 px-5 lg:hidden">
        <InstallBtn app={app} big />
      </div>

      {/* Media */}
      {D.showScreenshots && media.length > 0 && (
        <section className="mt-6">
          <ScrollRow className="gap-3">
            {media.map((s, i) => (
              <button
                key={i}
                type="button"
                onClick={() => onShot(media, i)}
                className="flex-shrink-0 snap-start overflow-hidden rounded-[24px] border border-white/10 bg-white/5 transition active:scale-[.97]"
              >
                <img
                  src={s}
                  alt=""
                  loading="lazy"
                  className="h-[260px] w-auto object-cover lg:h-[360px]"
                  onError={(e) => ((e.currentTarget.parentElement as HTMLElement).style.display = "none")}
                />
              </button>
            ))}
          </ScrollRow>
        </section>
      )}

      {/* About */}
      {app.description && (
        <section className="mt-6">
          <button type="button" onClick={() => setMore((m) => !m)} className="mb-2 flex w-full items-center justify-between px-5 text-left">
            <h2 className="text-[22px] font-bold tracking-tight">{T.aboutTitle}</h2>
            <ChevronRight className={`h-5 w-5 text-slate-300 transition-transform ${more ? "rotate-90" : ""}`} />
          </button>
          <p
            className="whitespace-pre-line px-5 text-sm leading-relaxed text-slate-300"
            style={
              more
                ? undefined
                : { display: "-webkit-box", WebkitLineClamp: 4, WebkitBoxOrient: "vertical", overflow: "hidden" }
            }
          >
            {app.description}
          </p>
          <div className="mt-3 flex flex-wrap gap-2 px-5">
            <span className="mx-glass rounded-full px-4 py-1.5 text-xs font-medium text-slate-200">{app.category}</span>
          </div>
        </section>
      )}

      {/* What's new */}
      {D.showWhatsNew && app.whatsNew && (
        <section className="mt-7 px-5">
          <h2 className="mb-1 text-[22px] font-bold tracking-tight">{T.whatsNewTitle}</h2>
          <p className="mb-2 text-xs text-slate-500">{fmtDate(app.updatedAt)}</p>
          <p className="whitespace-pre-line text-sm leading-relaxed text-slate-300">{app.whatsNew}</p>
        </section>
      )}

      {/* Info */}
      {D.showInfo && (
        <section className="mt-7 px-5">
          <h2 className="mb-2 text-[22px] font-bold tracking-tight">App info</h2>
          <div className="mx-glass divide-y divide-white/10 rounded-[26px] px-4">
            {[
              ["Version", app.version || "—"],
              ["Requires", app.requires || "—"],
              ["Updated", fmtDate(app.updatedAt)],
              ["Size", app.size || "—"],
              ["Developer", app.developer],
              ["Category", app.category],
            ].map(([k, v]) => (
              <div key={k} className="flex items-center justify-between py-3 text-sm">
                <span className="text-slate-400">{k}</span>
                <span className="max-w-[60%] truncate font-medium text-white">{v}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {D.showMoreFromDev && sameDev.length > 0 && (
        <section className="mt-7">
          <SectionHead title={`More from ${app.developer}`} onSeeAll={() => onDev(app.developer)} />
          <HRow items={sameDev} onOpen={onOpen} />
        </section>
      )}

      {D.showSimilar && similar.length > 0 && (
        <section className="mt-7">
          <SectionHead title={T.similarTitle} />
          <HRow items={similar} onOpen={onOpen} />
        </section>
      )}
    </div>
  )
}

function HRow({ items, onOpen }: { items: ModexApp[]; onOpen: (a: ModexApp) => void }) {
  return (
    <ScrollRow>
      {items.map((a) => (
        <button key={a.id} type="button" onClick={() => onOpen(a)} className="w-[100px] flex-shrink-0 snap-start text-left transition active:scale-95">
          <AppIcon app={a} size={100} />
          <p className="mt-2 line-clamp-2 text-[13px] font-medium leading-snug">{a.name}</p>
          <Rating value={a.rating} />
        </button>
      ))}
    </ScrollRow>
  )
}

/* =========================================================
   DEVELOPER VIEW
========================================================= */

function DevView({
  name,
  apps,
  onBack,
  onOpen,
}: {
  name: string
  apps: ModexApp[]
  onBack: () => void
  onOpen: (a: ModexApp) => void
}) {
  const list = apps.filter((a) => a.developer === name)
  const first = list[0]
  const avg = list.length ? list.reduce((s, a) => s + a.rating, 0) / list.length : 0

  return (
    <div>
      <TopBar title="" onBack={onBack} />
      <div className="flex items-center gap-4 px-5 pb-4 pt-1">
        {first ? <AppIcon app={first} size={76} /> : <div className="h-[76px] w-[76px] rounded-[22%] bg-white/10" />}
        <div className="min-w-0">
          <h1 className="truncate text-xl font-bold lg:text-2xl">{name}</h1>
          <p className="text-xs text-slate-400">
            {list.length} apps • {avg.toFixed(1)} avg rating
          </p>
        </div>
      </div>
      <div className="modex-stagger grid px-4 lg:grid-cols-2 lg:gap-x-6">
        {list.map((a) => (
          <AppRow key={a.id} app={a} onOpen={() => onOpen(a)} />
        ))}
      </div>
    </div>
  )
}

/* =========================================================
   MAIN PAGE
   Site er Settings / About Us er moto native side-page hishebe khole.
   Bottom navigation main site er-tai thake (page.tsx theke).
========================================================= */

export default function ModexPage() {
  const { apps, cfg, loading, error } = useModexData()

  const [stack, setStack] = useState<View[]>([{ t: "home" }])
  const stackRef = useRef(stack)
  stackRef.current = stack
  const scrolls = useRef<number[]>([])
  const exitingRef = useRef(false)
  const viewedRef = useRef<Set<string>>(new Set())

  const [homeTab, setHomeTab] = useState<HomeTab>("foryou")
  const [cat, setCat] = useState("All")
  const [query, setQuery] = useState("")
  const [saved, setSaved] = useState<string[]>([])
  const [viewer, setViewer] = useState<{ list: string[]; i: number } | null>(null)
  const [isScrolled, setIsScrolled] = useState(false)
  const [annHidden, setAnnHidden] = useState(true)
  const [searchFocused, setSearchFocused] = useState(false)

  const T = cfg.texts
  const S = cfg.sections
  const categories = useMemo(() => ["All", ...cfg.categories], [cfg.categories])
  const top = stack[stack.length - 1]

  /* theme (admin panel theke) */
  const themeVars = {
    "--mx-a": cfg.theme.accent,
    "--mx-b": cfg.theme.accent2,
    "--mx-bg": cfg.theme.bg,
    "--mx-chip": cfg.theme.chip,
    "--mx-soft": `color-mix(in srgb, ${cfg.theme.accent} 62%, white)`,
    background: cfg.theme.bg,
  } as CSSProperties

  /* Header ache — floating 3-dots button lukiye felbe */
  useEffect(() => {
    const b = document.body
    b.dataset.mvbdHeader = String(Number(b.dataset.mvbdHeader || 0) + 1)
    return () => {
      const n = Number(b.dataset.mvbdHeader || 1) - 1
      if (n <= 0) delete b.dataset.mvbdHeader
      else b.dataset.mvbdHeader = String(n)
    }
  }, [])

  /* tracking (views / Install clicks) */
  const track = useCallback((id: string, kind: TrackKind) => {
    if (kind === "views") {
      if (viewedRef.current.has(id)) return
      viewedRef.current.add(id)
    }
    updateDoc(doc(db, "modex_apps", id), { [kind === "clicks" ? "getClicks" : "views"]: increment(1) }).catch(() => {})
  }, [])

  /* saved apps */
  useEffect(() => {
    try {
      const raw = localStorage.getItem(SAVED_KEY)
      if (raw) setSaved(JSON.parse(raw))
    } catch {}
  }, [])

  const toggleSave = (id: string) => {
    setSaved((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
      try {
        localStorage.setItem(SAVED_KEY, JSON.stringify(next))
      } catch {}
      return next
    })
  }

  /* announcement dismiss */
  useEffect(() => {
    try {
      setAnnHidden(localStorage.getItem(ANN_KEY) === cfg.announcement.text)
    } catch {
      setAnnHidden(false)
    }
  }, [cfg.announcement.text])

  const dismissAnn = () => {
    setAnnHidden(true)
    try {
      localStorage.setItem(ANN_KEY, cfg.announcement.text)
    } catch {}
  }

  /* header scroll */
  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 10)
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  /* screenshot viewer: keyboard (desktop) + background scroll lock */
  useEffect(() => {
    if (!viewer) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setViewer(null)
      else if (e.key === "ArrowRight") setViewer((v) => (v && v.i < v.list.length - 1 ? { ...v, i: v.i + 1 } : v))
      else if (e.key === "ArrowLeft") setViewer((v) => (v && v.i > 0 ? { ...v, i: v.i - 1 } : v))
    }
    const prev = document.body.style.overflow
    document.body.style.overflow = "hidden"
    window.addEventListener("keydown", onKey)
    return () => {
      document.body.style.overflow = prev
      window.removeEventListener("keydown", onKey)
    }
  }, [viewer])

  /* navigation: push = browser history entry, tai mobile back button kaj kore */
  const push = useCallback((v: View) => {
    scrolls.current.push(window.scrollY)
    window.history.pushState(null, "", "")
    setStack((s) => [...s, v])
    window.scrollTo({ top: 0, behavior: "instant" })
  }, [])

  const back = () => window.history.back()

  /* page.tsx er popstate handler eta use kore:
     __modexBack()  — true mane Modex nijei back handle korlo (detail → home)
                      false mane Modex er home e achi, tai page.tsx Modex bondho kore
     __modexDepth() — Modex er vitore koyta extra history entry ache
     __modexUnwind() — bottom nav theke onno tab e jawar age history unwind korar signal */
  useEffect(() => {
    const w = window as any
    w.__modexBack = () => {
      if (exitingRef.current) {
        exitingRef.current = false
        scrolls.current = []
        setStack([{ t: "home" }])
        return true
      }
      if (stackRef.current.length > 1) {
        const y = scrolls.current.pop() ?? 0
        setStack((s) => s.slice(0, -1))
        requestAnimationFrame(() => requestAnimationFrame(() => window.scrollTo({ top: y, behavior: "instant" })))
        return true
      }
      return false
    }
    w.__modexDepth = () => stackRef.current.length - 1
    w.__modexUnwind = () => {
      exitingRef.current = true
    }
    return () => {
      delete w.__modexBack
      delete w.__modexDepth
      delete w.__modexUnwind
    }
  }, [])

  const openApp = (a: ModexApp) => {
    track(a.id, "views")
    push({ t: "detail", id: a.id })
  }
  const openDev = (name: string) => push({ t: "dev", name })

  const submitSearch = () => {
    if (top.t !== "search") push({ t: "search" })
  }

  const changeHomeTab = (t: HomeTab) => {
    setHomeTab(t)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  /* derived lists */
  const sortedNew = useMemo(() => [...apps].sort((a, b) => b.createdAt - a.createdAt), [apps])
  const trendingAll = useMemo(() => {
    const t = apps.filter((a) => a.trending || a.featured)
    return t.length ? t : [...apps].sort((a, b) => b.rating - a.rating)
  }, [apps])
  const topAll = useMemo(
    () => [...apps].sort((a, b) => b.getClicks - a.getClicks || b.views - a.views || b.rating - a.rating),
    [apps]
  )

  const pool = cat === "All" ? apps : apps.filter((a) => a.category === cat)
  const homeTrending = (cat === "All" ? trendingAll : trendingAll.filter((a) => a.category === cat)).slice(0, S.trendingCount)
  const homeNew = (cat === "All" ? sortedNew : sortedNew.filter((a) => a.category === cat)).slice(0, S.newCount)

  /* hero items: admin er banner, na thakle featured app gulo */
  const heroItems: HeroItem[] = useMemo(() => {
    if (cfg.banners.length) {
      return cfg.banners.map((b) => ({
        title: b.title,
        subtitle: b.subtitle,
        imageUrl: b.imageUrl,
        onClick: () => {
          if (b.target === "app") {
            const a = apps.find((x) => x.id === b.appId)
            if (a) openApp(a)
          } else if (b.link) {
            window.open(b.link, "_blank", "noopener,noreferrer")
          }
        },
      }))
    }
    return apps
      .filter((a) => a.featured && (a.bannerUrl || a.screenshots[0]))
      .slice(0, 5)
      .map((a) => ({
        title: a.name,
        subtitle: a.tagline || a.category,
        imageUrl: a.bannerUrl || a.screenshots[0],
        onClick: () => openApp(a),
      }))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cfg.banners, apps])

  /* ---------- screens ---------- */

  const annClass = `mx-ann-${cfg.announcement.style}`

  const homeTabs: { id: HomeTab; label: string; show: boolean }[] = [
    { id: "foryou", label: T.forYouLabel, show: true },
    { id: "top", label: T.topChartsLabel, show: cfg.nav.showTopCharts },
    { id: "categories", label: T.categoriesTitle, show: cfg.nav.showCategories },
    { id: "saved", label: T.savedLabel, show: cfg.nav.showSaved },
  ]
  const visibleTabs = homeTabs.filter((t) => t.show)
  const activeHomeTab: HomeTab = visibleTabs.some((t) => t.id === homeTab) ? homeTab : "foryou"

  const renderForYou = () => (
    <>
      {/* Announcement */}
      {cfg.announcement.enabled && cfg.announcement.text && !annHidden && (
        <div className={`mx-4 mb-4 flex items-center gap-3 rounded-3xl border px-4 py-3 text-sm backdrop-blur-xl ${annClass}`}>
          <Megaphone className="h-4 w-4 flex-shrink-0" />
          {cfg.announcement.link ? (
            <a href={cfg.announcement.link} target="_blank" rel="noopener noreferrer" className="min-w-0 flex-1 underline-offset-2 hover:underline">
              {cfg.announcement.text}
            </a>
          ) : (
            <span className="min-w-0 flex-1">{cfg.announcement.text}</span>
          )}
          <button type="button" onClick={dismissAnn} aria-label="Dismiss" className="flex-shrink-0 opacity-70 hover:opacity-100">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Hero banners */}
      {S.showBanners && heroItems.length > 0 && <BannerSlider items={heroItems} />}

      {/* Category chips */}
      {S.showCategories && (
        <div className="modex-noscroll flex gap-2 overflow-x-auto px-4 pb-5">
          {categories.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCat(c)}
              className={`flex-shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-all duration-300 active:scale-95 ${
                cat === c ? "mx-chip-on" : "mx-chip text-slate-200"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      )}

      {error && (
        <div className="mx-5 mb-4 rounded-2xl border border-red-400/30 bg-red-500/10 p-3 text-xs text-red-200">
          Data load hoyni: {error}
        </div>
      )}

      {loading && apps.length === 0 ? (
        <div className="px-5">
          <div className="modex-noscroll flex gap-4 overflow-hidden">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="modex-shimmer h-[130px] w-[100px] flex-shrink-0 rounded-[24px]" />
            ))}
          </div>
          <div className="mt-8 space-y-4">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="modex-shimmer h-16 rounded-3xl" />
            ))}
          </div>
        </div>
      ) : pool.length === 0 ? (
        <Empty text={apps.length === 0 ? T.emptyText : "এই category তে কোনো app নেই।"} />
      ) : (
        <>
          {/* Suggested / Trending */}
          {S.showTrending && homeTrending.length > 0 && (
            <section className="mb-7">
              <SectionHead
                title={T.suggestedTitle || T.trendingTitle}
                onSeeAll={() => push({ t: "list", title: T.trendingTitle, kind: "trending" })}
              />
              <ScrollRow>
                {homeTrending.map((a) => (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => openApp(a)}
                    className="w-[104px] flex-shrink-0 snap-start text-left transition active:scale-95 lg:w-[120px]"
                  >
                    <AppIcon app={a} size={104} />
                    <p className="mt-2 line-clamp-2 text-[13px] font-medium leading-snug">{a.name}</p>
                    <div className="mt-0.5 flex items-center gap-2">
                      <Rating value={a.rating} />
                      {a.size && <span className="text-[11px] text-slate-500">{a.size}</span>}
                    </div>
                  </button>
                ))}
              </ScrollRow>
            </section>
          )}

          {/* New apps */}
          {S.showNew && homeNew.length > 0 && (
            <section>
              <SectionHead title={T.newTitle} onSeeAll={() => push({ t: "list", title: T.newTitle, kind: "new" })} />
              <div className="modex-stagger grid px-4 lg:grid-cols-2 lg:gap-x-6">
                {homeNew.map((a) => (
                  <AppRow key={a.id} app={a} onOpen={() => openApp(a)} />
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </>
  )

  const renderTop = () => (
    <div className="modex-stagger grid px-4 lg:grid-cols-2 lg:gap-x-6">
      {topAll.length ? (
        topAll.slice(0, S.topCount).map((a, i) => <AppRow key={a.id} app={a} rank={i + 1} onOpen={() => openApp(a)} />)
      ) : (
        <div className="lg:col-span-2">
          <Empty text={T.emptyText} />
        </div>
      )}
    </div>
  )

  const renderCategories = () => (
    <div className="modex-stagger grid grid-cols-2 gap-3 px-4 sm:grid-cols-3 lg:grid-cols-4">
      {cfg.categories.map((c) => {
        const n = apps.filter((a) => a.category === c).length
        const h = hueOf(c)
        return (
          <button
            key={c}
            type="button"
            onClick={() => push({ t: "list", title: c, kind: "cat", cat: c })}
            className="relative h-24 overflow-hidden rounded-[26px] p-4 text-left shadow-lg ring-1 ring-white/10 transition duration-300 hover:-translate-y-0.5 active:scale-95 lg:h-28"
            style={{ background: `linear-gradient(135deg, hsl(${h} 60% 38%), hsl(${(h + 60) % 360} 60% 22%))` }}
          >
            <LayoutGrid className="absolute -bottom-3 -right-3 h-16 w-16 text-white/15" />
            <p className="text-base font-bold">{c}</p>
            <p className="text-xs text-white/70">{n} apps</p>
          </button>
        )
      })}
    </div>
  )

  const renderSaved = () => {
    const list = apps.filter((a) => saved.includes(a.id))
    return (
      <div className="modex-stagger grid px-4 lg:grid-cols-2 lg:gap-x-6">
        {list.length ? (
          list.map((a) => <AppRow key={a.id} app={a} onOpen={() => openApp(a)} />)
        ) : (
          <div className="lg:col-span-2">
            <Empty text="কোনো app save করা নেই। Detail page এর bookmark icon চাপুন।" />
          </div>
        )}
      </div>
    )
  }

  const renderHome = () => (
    <div className="pt-[84px]">
      {/* Welcome + logo */}
      <div className="px-5 pb-3 pt-2">
        <p className="text-xs text-slate-400">{T.welcome}</p>
        <ModexLogo size={32} logoUrl={cfg.brand.logoUrl} />
      </div>

      {/* App Store style segmented tabs (liquid glass) */}
      <div className="px-4 pb-4">
        <div className="mx-seg modex-noscroll flex gap-1 overflow-x-auto rounded-full p-1">
          {visibleTabs.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => changeHomeTab(t.id)}
              className={`flex-1 flex-shrink-0 whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold transition-all duration-300 active:scale-95 ${
                activeHomeTab === t.id ? "mx-seg-on text-white" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div key={activeHomeTab} className="modex-in">
        {activeHomeTab === "foryou" && renderForYou()}
        {activeHomeTab === "top" && renderTop()}
        {activeHomeTab === "categories" && renderCategories()}
        {activeHomeTab === "saved" && renderSaved()}
      </div>
    </div>
  )

  const renderList = (v: Extract<View, { t: "list" }>) => {
    const list = v.kind === "trending" ? trendingAll : v.kind === "new" ? sortedNew : apps.filter((a) => a.category === v.cat)
    return (
      <div>
        <TopBar title={v.title} onBack={back} />
        <div className="modex-stagger grid px-4 lg:grid-cols-2 lg:gap-x-6">
          {list.length ? (
            list.map((a) => <AppRow key={a.id} app={a} onOpen={() => openApp(a)} />)
          ) : (
            <div className="lg:col-span-2">
              <Empty text="কোনো app নেই।" />
            </div>
          )}
        </div>
      </div>
    )
  }

  const renderView = () => {
    switch (top.t) {
      case "home":
        return renderHome()
      case "search":
        return <SearchView apps={apps} popular={trendingAll} query={query} setQuery={setQuery} onBack={back} onOpen={openApp} />
      case "list":
        return renderList(top)
      case "detail": {
        const app = apps.find((a) => a.id === top.id)
        if (!app) {
          return (
            <div>
              <TopBar title="App" onBack={back} />
              <Empty text="App ta paoa jayni." />
            </div>
          )
        }
        return (
          <DetailView
            app={app}
            apps={apps}
            saved={saved.includes(app.id)}
            onToggleSave={() => toggleSave(app.id)}
            onBack={back}
            onOpen={openApp}
            onDev={openDev}
            onShot={(list, i) => setViewer({ list, i })}
          />
        )
      }
      case "dev":
        return <DevView name={top.name} apps={apps} onBack={back} onOpen={openApp} />
    }
  }

  const styleTag = (
    <style>{`
      /* ===== iOS liquid glass ===== */
      .mx-glass {
        position: relative;
        background: linear-gradient(135deg, rgba(255,255,255,.14), rgba(255,255,255,.04) 55%, rgba(255,255,255,.09));
        border: 1px solid rgba(255,255,255,.14);
        backdrop-filter: blur(26px) saturate(190%);
        -webkit-backdrop-filter: blur(26px) saturate(190%);
        box-shadow: inset 0 1px 0 rgba(255,255,255,.32), inset 0 -1px 0 rgba(255,255,255,.05), 0 12px 34px rgba(0,0,0,.28);
      }
      .mx-circle {
        background: rgba(255,255,255,.08);
        border: 1px solid rgba(255,255,255,.12);
        backdrop-filter: blur(16px) saturate(180%);
        -webkit-backdrop-filter: blur(16px) saturate(180%);
        box-shadow: inset 0 1px 0 rgba(255,255,255,.25);
      }
      .mx-arrow {
        position: absolute; top: 38%; z-index: 5; width: 40px; height: 40px; align-items: center; justify-content: center;
        border-radius: 999px; color: #fff; cursor: pointer;
        background: rgba(30,30,40,.55); border: 1px solid rgba(255,255,255,.2);
        backdrop-filter: blur(18px) saturate(180%); -webkit-backdrop-filter: blur(18px) saturate(180%);
        box-shadow: inset 0 1px 0 rgba(255,255,255,.3), 0 8px 24px rgba(0,0,0,.4);
        transition: transform .25s cubic-bezier(.34,1.56,.64,1), background .2s;
      }
      .mx-arrow:hover { background: rgba(60,60,80,.7); transform: scale(1.1); }
      .mx-arrow:active { transform: scale(.9); }
      .mx-grad {
        background-image: linear-gradient(90deg, var(--mx-a), var(--mx-b));
        box-shadow: inset 0 1px 0 rgba(255,255,255,.4), 0 10px 26px color-mix(in srgb, var(--mx-a) 40%, transparent);
      }
      .mx-soft { color: var(--mx-soft); }
      .mx-soft-fill { color: var(--mx-soft); fill: var(--mx-soft); }
      /* App Store "GET" pill */
      .mx-outline {
        color: var(--mx-soft);
        background: color-mix(in srgb, var(--mx-a) 20%, rgba(255,255,255,.08));
        border: 1px solid color-mix(in srgb, var(--mx-a) 45%, transparent);
        box-shadow: inset 0 1px 0 rgba(255,255,255,.25);
        backdrop-filter: blur(14px); -webkit-backdrop-filter: blur(14px);
        letter-spacing: .01em;
      }
      .mx-outline:hover { background: color-mix(in srgb, var(--mx-a) 34%, rgba(255,255,255,.08)); }
      .mx-chip { background: color-mix(in srgb, var(--mx-chip) 65%, transparent); border: 1px solid rgba(255,255,255,.08); backdrop-filter: blur(14px); -webkit-backdrop-filter: blur(14px); box-shadow: inset 0 1px 0 rgba(255,255,255,.12); }
      .mx-chip:hover { background: var(--mx-chip); }
      .mx-chip-on { background: color-mix(in srgb, var(--mx-a) 32%, transparent); border: 1px solid color-mix(in srgb, var(--mx-a) 70%, transparent); color: #fff; box-shadow: inset 0 1px 0 rgba(255,255,255,.3), 0 6px 18px color-mix(in srgb, var(--mx-a) 25%, transparent); }
      .mx-seg {
        background: rgba(255,255,255,.07); border: 1px solid rgba(255,255,255,.12);
        backdrop-filter: blur(24px) saturate(190%); -webkit-backdrop-filter: blur(24px) saturate(190%);
        box-shadow: inset 0 1px 0 rgba(255,255,255,.2);
      }
      .mx-seg-on { background: linear-gradient(135deg, rgba(255,255,255,.28), rgba(255,255,255,.12)); box-shadow: inset 0 1px 0 rgba(255,255,255,.45), 0 4px 14px rgba(0,0,0,.3); }
      .mx-bar {
        background: color-mix(in srgb, var(--mx-bg) 55%, transparent);
        backdrop-filter: blur(30px) saturate(200%); -webkit-backdrop-filter: blur(30px) saturate(200%);
        border-bottom: 1px solid rgba(255,255,255,.08);
      }
      .mx-banner { box-shadow: inset 0 1px 0 rgba(255,255,255,.2), 0 24px 50px rgba(0,0,0,.45); }
      .mx-ann-info { background: color-mix(in srgb, var(--mx-a) 20%, transparent); border-color: color-mix(in srgb, var(--mx-a) 45%, transparent); color: #fff; }
      .mx-ann-success { background: rgba(34,197,94,.16); border-color: rgba(34,197,94,.45); color: #bbf7d0; }
      .mx-ann-warning { background: rgba(245,158,11,.16); border-color: rgba(245,158,11,.5); color: #fde68a; }
      .modex-noscroll { scrollbar-width: none; }
      .modex-noscroll::-webkit-scrollbar { display: none; }

      /* ===== animations ===== */
      @keyframes modexIn { from { opacity: 0; transform: translateY(16px) scale(.985); } to { opacity: 1; transform: none; } }
      .modex-in { animation: modexIn .45s cubic-bezier(.22,1,.36,1); }
      .modex-stagger > * { animation: modexIn .5s cubic-bezier(.22,1,.36,1) both; }
      .modex-stagger > *:nth-child(2) { animation-delay: .04s; }
      .modex-stagger > *:nth-child(3) { animation-delay: .08s; }
      .modex-stagger > *:nth-child(4) { animation-delay: .12s; }
      .modex-stagger > *:nth-child(5) { animation-delay: .16s; }
      .modex-stagger > *:nth-child(6) { animation-delay: .2s; }
      .modex-stagger > *:nth-child(7) { animation-delay: .24s; }
      .modex-stagger > *:nth-child(n+8) { animation-delay: .28s; }
      @keyframes modexShimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
      .modex-shimmer { background: linear-gradient(90deg, rgba(255,255,255,.04) 25%, rgba(255,255,255,.1) 50%, rgba(255,255,255,.04) 75%); background-size: 200% 100%; animation: modexShimmer 1.4s linear infinite; }

      /* ===== SEARCH BAR (liquid glass) ===== */
      @keyframes mxsZoom {
        0% { transform: scale(1); background: rgba(255,255,255,.05); }
        50% { transform: scale(1.03); background: rgba(255,255,255,.08); }
        100% { transform: scale(1.05); background: rgba(255,255,255,.1); }
      }
      @keyframes mxsGlow {
        0% { box-shadow: 0 0 0 0 rgba(100,200,255,.3), inset 0 0 20px rgba(255,255,255,.1); }
        50% { box-shadow: 0 0 15px 5px rgba(100,200,255,.2), inset 0 0 30px rgba(255,255,255,.15); }
        100% { box-shadow: 0 0 25px 10px rgba(100,200,255,.1), inset 0 0 40px rgba(255,255,255,.2); }
      }
      .mxs-glass {
        background: rgba(255,255,255,.06);
        backdrop-filter: blur(22px) saturate(180%);
        -webkit-backdrop-filter: blur(22px) saturate(180%);
        border: 1px solid rgba(255,255,255,.2);
        box-shadow: inset 0 1px 0 rgba(255,255,255,.28);
        transition: all .3s ease;
        cursor: text;
      }
      .mxs-glass:focus-within {
        background: rgba(255,255,255,.08);
        border: 1px solid rgba(100,200,255,.4);
        animation: mxsZoom .6s ease-out forwards, mxsGlow .6s ease-out;
      }
      .mxs-btn {
        background: rgba(255,255,255,.06);
        backdrop-filter: blur(22px) saturate(180%);
        -webkit-backdrop-filter: blur(22px) saturate(180%);
        border: 1px solid rgba(255,255,255,.2);
        box-shadow: inset 0 1px 0 rgba(255,255,255,.28);
      }
      .mxs-btn:hover { background: rgba(255,255,255,.12); border-color: rgba(100,200,255,.4); }
      .mxs-input {
        position: absolute; inset: 0; width: 100%; height: 100%;
        background: transparent !important; border: none !important; outline: none !important;
        color: #fff !important; caret-color: #64c8ff; font-size: 16px; line-height: 20px;
        padding: 0; margin: 0; z-index: 30;
      }
      .mxs-drop {
        position: absolute; top: 100%; left: 0; right: 0; margin-top: 8px; max-height: 400px; overflow-y: auto; z-index: 50;
        background: rgba(20,20,30,.92); backdrop-filter: blur(30px) saturate(180%); -webkit-backdrop-filter: blur(30px) saturate(180%);
        border: 1px solid rgba(100,200,255,.3); border-radius: 24px;
        box-shadow: inset 0 1px 0 rgba(255,255,255,.2), 0 20px 50px rgba(0,0,0,.5);
        scrollbar-width: thin; scrollbar-color: rgba(100,200,255,.5) transparent;
        animation: modexIn .3s cubic-bezier(.22,1,.36,1);
      }
      .mxs-drop-head {
        display: flex; align-items: center; gap: 6px; padding: 10px 16px 8px; border-bottom: 1px solid rgba(255,255,255,.08);
        font-size: 11px; text-transform: uppercase; letter-spacing: .05em; color: rgba(148,163,184,.9); font-weight: 600;
      }
      .mxs-drop-item { padding: 10px 16px; cursor: pointer; transition: all .2s ease; border-bottom: 1px solid rgba(255,255,255,.05); }
      .mxs-drop-item:hover { background: rgba(100,200,255,.1); }
      .mxs-drop-item:last-child { border-bottom: none; }
      @keyframes mxsBubble {
        0% { opacity: 1; transform: scale(1) translateY(0); filter: blur(0); }
        100% { opacity: 0; transform: scale(.2) translateY(-50px); filter: blur(2px); }
      }
      .mxs-bubble {
        position: absolute; width: 8px; height: 8px; border-radius: 50%; pointer-events: none;
        animation: mxsBubble .8s ease-out forwards;
        background: radial-gradient(circle at 30% 30%, rgba(100,200,255,.8), rgba(59,130,246,.3));
        border: 1px solid rgba(100,200,255,.5);
        box-shadow: 0 0 8px rgba(100,200,255,.4), inset -2px -2px 4px rgba(0,0,0,.2);
      }
      .mxs-cube-container { position: relative; flex: 1; height: 20px; min-width: 0; }
      .mxs-cube-wrapper { position: absolute; inset: 0; perspective: 800px; pointer-events: none; }
      .mxs-cube { position: absolute; width: 100%; height: 20px; transform-style: preserve-3d; animation: mxsRotate 25s infinite cubic-bezier(0.4, 0, 0.2, 1); }
      .mxs-face {
        position: absolute; width: 100%; height: 100%; display: flex; align-items: center;
        color: rgba(255,255,255,.5); font-size: 14px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        backface-visibility: hidden; transform-origin: center center;
      }
      .mxs-face-1 { transform: rotateX(0deg) translateZ(10px); }
      .mxs-face-2 { transform: rotateX(90deg) translateZ(10px); }
      .mxs-face-3 { transform: rotateX(180deg) translateZ(10px); }
      .mxs-face-4 { transform: rotateX(270deg) translateZ(10px); }
      @keyframes mxsRotate {
        0%, 20% { transform: translateZ(-10px) rotateX(0deg); }
        25%, 45% { transform: translateZ(-10px) rotateX(90deg); }
        50%, 70% { transform: translateZ(-10px) rotateX(180deg); }
        75%, 95% { transform: translateZ(-10px) rotateX(270deg); }
        100% { transform: translateZ(-10px) rotateX(360deg); }
      }
      @media (prefers-reduced-motion: reduce) { .modex-in, .modex-stagger > *, .modex-shimmer, .mxs-cube { animation: none; } }
    `}</style>
  )

  /* ---------- maintenance mode (admin panel theke on/off) ---------- */
  if (cfg.maintenance.enabled) {
    return (
      <div className="relative flex min-h-[80vh] items-center justify-center px-6 pb-24 text-white" style={themeVars}>
        {styleTag}
        <div className="mx-glass modex-in relative w-full max-w-sm rounded-[34px] p-8 text-center">
          <div className="mx-grad mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-[22%]">
            <Wrench className="h-8 w-8 text-white" />
          </div>
          <ModexLogo size={30} logoUrl={cfg.brand.logoUrl} />
          <p className="mt-4 text-sm leading-relaxed text-slate-300">{cfg.maintenance.message}</p>
          <button type="button" onClick={back} className="mx-grad mt-6 rounded-full px-8 py-2.5 text-sm font-bold text-white active:scale-95">
            Back
          </button>
        </div>
      </div>
    )
  }

  return (
    <Ctx.Provider value={{ cfg, track }}>
      <div className="relative min-h-screen overflow-x-clip text-white" style={themeVars}>
        {styleTag}

        {/* soft background glow */}
        <div className="pointer-events-none fixed inset-0">
          <div className="absolute -left-24 -top-24 h-72 w-72 rounded-full opacity-25 blur-[100px]" style={{ background: "var(--mx-a)" }} />
          <div className="absolute -right-24 top-1/3 h-72 w-72 rounded-full opacity-10 blur-[110px]" style={{ background: "var(--mx-b)" }} />
        </div>

        {/* HOME HEADER (shudhu home e) — search bar + 3 dots */}
        {top.t === "home" && (
          <header
            className={`fixed left-0 right-0 top-0 z-50 transition-all duration-300 ease-in-out lg:left-[220px] ${
              isScrolled ? "mx-bar shadow-lg" : "border-b border-transparent"
            }`}
          >
            <div className="mx-auto flex max-w-2xl items-center gap-4 px-4 py-4 lg:max-w-5xl">
              <div className="flex-shrink-0 lg:hidden">
                <ModexX size={36} />
              </div>

              <SearchBar
                apps={apps}
                popular={trendingAll}
                value={query}
                onChange={setQuery}
                onSubmit={submitSearch}
                onPick={openApp}
                onFocusChange={setSearchFocused}
                className="lg:mx-auto lg:max-w-xl"
              />

              <div
                className={`flex-shrink-0 overflow-hidden transition-all duration-300 ease-in-out ${
                  searchFocused ? "-ml-4 w-0 pointer-events-none opacity-0" : "w-11 opacity-100"
                }`}
              >
                <button
                  type="button"
                  onClick={openSideMenu}
                  aria-label="Open menu"
                  tabIndex={searchFocused ? -1 : 0}
                  className="mxs-btn flex h-11 w-11 items-center justify-center rounded-full text-slate-200 transition-all duration-200 hover:text-white active:scale-90"
                >
                  <MoreHorizontal className="h-5 w-5" />
                </button>
              </div>
            </div>
          </header>
        )}

        <main className="relative mx-auto max-w-2xl pb-28 lg:max-w-5xl lg:pb-12">
          <div key={`${stack.length}-${top.t}`} className="modex-in">
            {renderView()}
          </div>
        </main>

        {/* SCREENSHOT VIEWER */}
        {viewer && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/85 p-4 backdrop-blur-xl" onClick={() => setViewer(null)}>
            <button type="button" onClick={() => setViewer(null)} aria-label="Close" className="mx-circle absolute right-4 top-4 flex h-11 w-11 items-center justify-center rounded-full">
              <X className="h-5 w-5" />
            </button>
            {viewer.i > 0 && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  setViewer({ ...viewer, i: viewer.i - 1 })
                }}
                className="mx-circle absolute left-3 flex h-11 w-11 items-center justify-center rounded-full"
                aria-label="Previous"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
            )}
            <img src={viewer.list[viewer.i]} alt="" className="modex-in max-h-[85vh] max-w-full rounded-[24px] object-contain" onClick={(e) => e.stopPropagation()} />
            {viewer.i < viewer.list.length - 1 && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  setViewer({ ...viewer, i: viewer.i + 1 })
                }}
                className="mx-circle absolute right-3 flex h-11 w-11 items-center justify-center rounded-full"
                aria-label="Next"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            )}
            <p className="absolute bottom-6 text-xs text-slate-400">
              {viewer.i + 1} / {viewer.list.length}
            </p>
          </div>
        )}
      </div>
    </Ctx.Provider>
  )
      }
