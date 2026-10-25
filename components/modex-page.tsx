"use client"

import { createContext, useCallback, useContext, useEffect, useId, useMemo, useRef, useState } from "react"
import type { CSSProperties, ReactNode } from "react"
import {
  ArrowLeft,
  Bookmark,
  ChevronRight,
  Download,
  Film,
  HardDrive,
  Home,
  LayoutGrid,
  Megaphone,
  MoreHorizontal,
  Package,
  Search,
  Share2,
  Star,
  Tag,
  Wrench,
  X,
} from "lucide-react"
import SideNavigation, { openSideMenu } from "@/components/side-navigation"
import { db } from "@/lib/firebase"
import { collection, doc, increment, onSnapshot, updateDoc } from "firebase/firestore"

/* =========================================================
   LOGO — "Mod" white, "e" + Terabox-style X green gradient
   (admin panel e logo link dile oita dekhabe)
========================================================= */

function ModexMark({ className, style }: { className?: string; style?: CSSProperties }) {
  const id = useId().replace(/:/g, "")
  return (
    <svg viewBox="0 0 24 24" className={className} style={style} aria-hidden="true">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#86efac" />
          <stop offset="0.5" stopColor="#22c55e" />
          <stop offset="1" stopColor="#059669" />
        </linearGradient>
      </defs>
      <path d="M4.2 4.2 L19.8 19.8" stroke={`url(#${id})`} strokeWidth="5.4" strokeLinecap="round" fill="none" />
      <path
        d="M19.8 4.2 L13.9 10.1 M10.1 13.9 L4.2 19.8"
        stroke={`url(#${id})`}
        strokeWidth="4.6"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  )
}

function ModexLogo({ size = 28, logoUrl = "" }: { size?: number; logoUrl?: string }) {
  const [bad, setBad] = useState(false)
  useEffect(() => setBad(false), [logoUrl])

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
      <span className="bg-gradient-to-r from-emerald-300 via-green-400 to-emerald-500 bg-clip-text text-transparent">e</span>
      <ModexMark style={{ height: "0.8em", width: "0.8em", marginLeft: "0.03em" }} />
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
  developer: string
  category: string
  description: string
  whatsNew: string
  version: string
  size: string
  downloads: string
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
    categoriesTitle: string
    trendingTitle: string
    newTitle: string
    getLabel: string
    seeAll: string
    emptyText: string
    searchHint: string
  }
  sections: {
    showBanners: boolean
    showCategories: boolean
    showTrending: boolean
    showNew: boolean
    trendingCount: number
    newCount: number
  }
  nav: { showCategories: boolean; showSaved: boolean; showSite: boolean }
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
  theme: { accent: "#7b6cff", accent2: "#5b4bf0", bg: "#0e0d27", chip: "#3b34a0" },
  texts: {
    welcome: "Welcome to",
    categoriesTitle: "Categories",
    trendingTitle: "Trending Apps",
    newTitle: "New Apps",
    getLabel: "Get",
    seeAll: "See all",
    emptyText: "এখনো কোনো app যোগ করা হয়নি।",
    searchHint: "App er naam, developer ba category likhe khujun",
  },
  sections: { showBanners: true, showCategories: true, showTrending: true, showNew: true, trendingCount: 10, newCount: 8 },
  nav: { showCategories: true, showSaved: true, showSite: true },
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
    developer: String(d.developer || "Unknown"),
    category: String(d.category || "Tools"),
    description: String(d.description || ""),
    whatsNew: String(d.whatsNew || ""),
    version: String(d.version || ""),
    size: String(d.size || ""),
    downloads: String(d.downloads || ""),
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

type View =
  | { t: "home" }
  | { t: "search" }
  | { t: "categories" }
  | { t: "saved" }
  | { t: "list"; title: string; kind: "trending" | "new" | "cat"; cat?: string }
  | { t: "detail"; id: string }
  | { t: "dev"; name: string }

const SAVED_KEY = "modex_saved_apps"
const ANN_KEY = "modex_ann_dismissed"
const GLASS = "mx-glass"

function hueOf(s: string) {
  let h = 0
  for (const c of s) h = (h * 31 + c.charCodeAt(0)) % 360
  return h
}

function fallbackBg(name: string) {
  const h = hueOf(name)
  return `linear-gradient(135deg, hsl(${h} 75% 55%), hsl(${(h + 50) % 360} 70% 28%))`
}

function fmtDate(ms: number) {
  if (!ms) return "—"
  return new Date(ms).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
}

/* =========================================================
   SMALL UI PARTS
========================================================= */

function AppIcon({ app, size }: { app: ModexApp; size: number }) {
  const [bad, setBad] = useState(false)
  useEffect(() => setBad(false), [app.iconUrl])
  return (
    <div
      className="flex flex-shrink-0 items-center justify-center overflow-hidden font-extrabold text-white shadow-lg"
      style={{ width: size, height: size, borderRadius: size * 0.26, background: fallbackBg(app.name) }}
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

function Cover({ app, className = "" }: { app: ModexApp; className?: string }) {
  const src = app.bannerUrl || app.screenshots[0] || ""
  const [bad, setBad] = useState(false)
  useEffect(() => setBad(false), [src])
  return (
    <div className={`overflow-hidden ${className}`} style={{ background: fallbackBg(app.name) }}>
      {src && !bad && (
        <img
          src={src}
          alt=""
          loading="lazy"
          onError={() => setBad(true)}
          className="h-full w-full object-cover"
        />
      )}
    </div>
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
      className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full text-slate-100 transition active:scale-90 ${GLASS} ${className}`}
    >
      {children}
    </button>
  )
}

function GetButton({ app, big }: { app: ModexApp; big?: boolean }) {
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
      className={`mx-grad mx-glow flex-shrink-0 rounded-full font-bold text-white transition active:scale-95 disabled:opacity-40 ${
        big ? "px-10 py-3 text-base" : "px-5 py-1.5 text-sm"
      }`}
    >
      {ok ? cfg.texts.getLabel : "Soon"}
    </button>
  )
}

function AppRow({ app, onOpen }: { app: ModexApp; onOpen: () => void }) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onOpen}
      className="flex cursor-pointer items-center gap-4 rounded-2xl p-2 transition-colors hover:bg-white/5"
    >
      <AppIcon app={app} size={64} />
      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold text-white">{app.name}</p>
        <p className="truncate text-xs text-slate-400">
          {app.category} • {app.developer}
        </p>
        <div className="mt-1 flex items-center gap-3">
          <Rating value={app.rating} />
          {app.size && <span className="text-xs text-slate-500">{app.size}</span>}
        </div>
      </div>
      <GetButton app={app} />
    </div>
  )
}

function SectionHead({ title, onSeeAll }: { title: string; onSeeAll?: () => void }) {
  const { cfg } = useContext(Ctx)
  return (
    <div className="mb-3 flex items-center justify-between px-5">
      <h2 className="text-lg font-bold text-white">{title}</h2>
      {onSeeAll && (
        <button type="button" onClick={onSeeAll} className="text-xs text-slate-400 transition hover:text-white">
          {cfg.texts.seeAll}
        </button>
      )}
    </div>
  )
}

function TopBar({ title, onBack }: { title: string; onBack: () => void }) {
  return (
    <div className="mx-bar sticky top-0 z-30 flex items-center gap-3 px-4 py-3">
      <IconBtn onClick={onBack} label="Back">
        <ArrowLeft className="h-5 w-5" />
      </IconBtn>
      <h1 className="min-w-0 flex-1 truncate text-lg font-bold">{title}</h1>
    </div>
  )
}

function Empty({ text }: { text: string }) {
  return (
    <div className={`mx-4 rounded-3xl p-8 text-center ${GLASS}`}>
      <Package className="mx-auto mb-3 h-8 w-8 text-slate-500" />
      <p className="text-sm text-slate-400">{text}</p>
    </div>
  )
}

/* =========================================================
   HERO BANNER SLIDER (admin panel theke banner add/remove)
========================================================= */

function BannerSlider({ banners, onPick }: { banners: Banner[]; onPick: (b: Banner) => void }) {
  const ref = useRef<HTMLDivElement>(null)
  const hold = useRef(false)
  const [idx, setIdx] = useState(0)

  useEffect(() => {
    if (banners.length < 2) return
    const t = setInterval(() => {
      const el = ref.current
      if (!el || hold.current) return
      const next = (Math.round(el.scrollLeft / el.clientWidth) + 1) % banners.length
      el.scrollTo({ left: next * el.clientWidth, behavior: "smooth" })
    }, 4500)
    return () => clearInterval(t)
  }, [banners.length])

  return (
    <div className="mb-6 px-5">
      <div
        ref={ref}
        onScroll={(e) => {
          const el = e.currentTarget
          setIdx(Math.round(el.scrollLeft / (el.clientWidth || 1)))
        }}
        onTouchStart={() => (hold.current = true)}
        onTouchEnd={() => window.setTimeout(() => (hold.current = false), 3000)}
        className="modex-noscroll flex snap-x snap-mandatory overflow-x-auto rounded-3xl shadow-xl"
      >
        {banners.map((b, i) => (
          <button
            key={i}
            type="button"
            onClick={() => onPick(b)}
            className="relative h-44 w-full flex-shrink-0 snap-center overflow-hidden text-left"
            style={{ background: fallbackBg(b.title || String(i)) }}
          >
            <img
              src={b.imageUrl}
              alt=""
              loading="lazy"
              onError={(e) => (e.currentTarget.style.display = "none")}
              className="absolute inset-0 h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
            <div className="absolute inset-x-5 bottom-4">
              {b.title && <p className="text-xl font-extrabold leading-tight drop-shadow">{b.title}</p>}
              {b.subtitle && <p className="mt-0.5 line-clamp-1 text-sm text-white/80">{b.subtitle}</p>}
            </div>
          </button>
        ))}
      </div>
      {banners.length > 1 && (
        <div className="mt-3 flex justify-center gap-1.5">
          {banners.map((_, i) => (
            <span
              key={i}
              className={`h-1.5 rounded-full transition-all duration-300 ${i === idx ? "mx-grad w-6" : "w-1.5 bg-white/25"}`}
            />
          ))}
        </div>
      )}
    </div>
  )
}

/* =========================================================
   SEARCH VIEW
========================================================= */

function SearchView({
  apps,
  query,
  setQuery,
  onBack,
  onOpen,
}: {
  apps: ModexApp[]
  query: string
  setQuery: (q: string) => void
  onBack: () => void
  onOpen: (a: ModexApp) => void
}) {
  const { cfg } = useContext(Ctx)
  const placeholders = cfg.placeholders
  const [ph, setPh] = useState(0)
  const [focused, setFocused] = useState(false)

  useEffect(() => {
    if (focused || query) return
    const t = setInterval(() => setPh((i) => (i + 1) % placeholders.length), 2600)
    return () => clearInterval(t)
  }, [focused, query, placeholders.length])

  const q = query.trim().toLowerCase()
  const results = useMemo(() => {
    if (!q) return []
    const words = q.split(/\s+/).filter(Boolean)
    return apps.filter((a) => {
      const hay = `${a.name} ${a.developer} ${a.category}`.toLowerCase()
      return words.every((w) => hay.includes(w))
    })
  }, [q, apps])

  return (
    <div>
      <div className="mx-bar sticky top-0 z-30 flex items-center gap-3 px-4 py-3">
        <IconBtn onClick={onBack} label="Back">
          <ArrowLeft className="h-5 w-5" />
        </IconBtn>
        <div className={`mx-focus relative flex min-w-0 flex-1 items-center gap-3 rounded-2xl px-4 py-3 ${GLASS}`}>
          <Search className="h-5 w-5 flex-shrink-0 text-slate-300" />
          <div className="relative h-5 min-w-0 flex-1">
            {!query && !focused && (
              <span
                key={ph}
                className="modex-ph pointer-events-none absolute inset-0 flex items-center truncate text-[14px] text-white/50"
              >
                {placeholders[ph % placeholders.length]}
              </span>
            )}
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              autoComplete="off"
              spellCheck={false}
              style={{ caretColor: "var(--mx-soft)" }}
              className="absolute inset-0 h-full w-full bg-transparent text-[14px] text-white outline-none"
            />
          </div>
          {query && (
            <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => setQuery("")} aria-label="Clear">
              <X className="h-4 w-4 text-slate-400" />
            </button>
          )}
        </div>
      </div>

      <div className="px-4 pt-2">
        {!q ? (
          <p className="px-1 pt-6 text-center text-sm text-slate-500">{cfg.texts.searchHint}</p>
        ) : results.length ? (
          <>
            <p className="mb-2 px-1 text-sm text-slate-400">
              &ldquo;{query.trim()}&rdquo; er jonno {results.length}টি app
            </p>
            {results.map((a) => (
              <AppRow key={a.id} app={a} onOpen={() => onOpen(a)} />
            ))}
          </>
        ) : (
          <div className={`rounded-3xl p-8 text-center ${GLASS}`}>
            <p className="font-semibold">কোনো app পাওয়া যায়নি</p>
            <p className="mt-1 text-sm text-slate-400">অন্য নাম লিখে আবার খুঁজুন।</p>
          </div>
        )}
      </div>
    </div>
  )
}

/* =========================================================
   DETAIL VIEW
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
  const D = cfg.detail
  const [more, setMore] = useState(false)
  const sameDev = apps.filter((a) => a.developer === app.developer && a.id !== app.id)
  const similar = apps.filter((a) => a.category === app.category && a.id !== app.id).slice(0, 10)

  const share = async () => {
    try {
      if (navigator.share) await navigator.share({ title: app.name, text: app.description.slice(0, 100), url: window.location.href })
      else await navigator.clipboard.writeText(window.location.href)
    } catch {}
  }

  const stats = [
    { icon: Download, value: app.downloads || "—", label: "Downloads" },
    { icon: HardDrive, value: app.size || "—", label: "Size" },
    { icon: Tag, value: app.version || "—", label: "Version" },
  ]

  return (
    <div>
      {/* Hero */}
      <div className="relative h-[340px]">
        <Cover app={app} className="absolute inset-0 rounded-b-[40px]" />
        <div className="mx-fade absolute inset-0 rounded-b-[40px]" />
        <div className="absolute inset-x-4 top-4 flex items-center justify-between">
          <IconBtn onClick={onBack} label="Back" className="!bg-black/40">
            <ArrowLeft className="h-5 w-5" />
          </IconBtn>
          <IconBtn onClick={share} label="Share" className="!bg-black/40">
            <Share2 className="h-5 w-5" />
          </IconBtn>
        </div>
        <div className="absolute inset-x-5 bottom-4 flex items-end gap-4">
          <AppIcon app={app} size={84} />
          <div className="min-w-0 flex-1 pb-1">
            <h1 className="text-3xl font-extrabold leading-tight drop-shadow">{app.name}</h1>
            <button type="button" onClick={() => onDev(app.developer)} className="truncate text-sm text-slate-300 hover:text-white">
              {app.developer}
            </button>
          </div>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-3 px-5">
        <span className={`rounded-full px-5 py-2 text-sm font-semibold text-slate-200 ${GLASS}`}>{app.category}</span>
        <Rating value={app.rating} />
        <div className="flex-1" />
        <button
          type="button"
          onClick={onToggleSave}
          aria-label="Save"
          className={`flex h-10 w-10 items-center justify-center rounded-full transition active:scale-90 ${GLASS}`}
        >
          <Bookmark className={`h-5 w-5 ${saved ? "mx-soft-fill" : "text-slate-300"}`} />
        </button>
        <GetButton app={app} big />
      </div>

      {/* Stats card */}
      <div className={`mx-4 mt-5 grid grid-cols-3 gap-2 rounded-3xl p-4 ${GLASS}`}>
        {stats.map((s) => (
          <div key={s.label} className="flex flex-col items-center gap-1 text-center">
            <s.icon className="mx-soft h-5 w-5" />
            <p className="text-sm font-bold text-white">{s.value}</p>
            <p className="text-[11px] text-slate-400">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Description */}
      {app.description && (
        <div className="mt-5 px-5">
          <p
            className="whitespace-pre-line text-sm leading-relaxed text-slate-300"
            style={
              more
                ? undefined
                : { display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }
            }
          >
            {app.description}
          </p>
          {app.description.length > 120 && (
            <button type="button" onClick={() => setMore((m) => !m)} className="mx-soft mt-1 text-sm font-semibold">
              {more ? "Show less" : "Read more"}
            </button>
          )}
        </div>
      )}

      {/* Screenshots */}
      {D.showScreenshots && app.screenshots.length > 0 && (
        <section className="mt-6">
          <SectionHead title="Screenshots" onSeeAll={() => onShot(app.screenshots, 0)} />
          <div className="modex-noscroll flex snap-x gap-3 overflow-x-auto px-5">
            {app.screenshots.map((s, i) => (
              <button key={i} type="button" onClick={() => onShot(app.screenshots, i)} className="flex-shrink-0 snap-start overflow-hidden rounded-2xl border border-white/10">
                <img src={s} alt="" loading="lazy" className="h-56 w-auto object-cover" onError={(e) => ((e.currentTarget.parentElement as HTMLElement).style.display = "none")} />
              </button>
            ))}
          </div>
        </section>
      )}

      {/* What's new */}
      {D.showWhatsNew && app.whatsNew && (
        <section className="mt-6 px-4">
          <h2 className="mb-3 px-1 text-lg font-bold">What&apos;s new</h2>
          <div className={`whitespace-pre-line rounded-3xl p-4 text-sm leading-relaxed text-slate-300 ${GLASS}`}>{app.whatsNew}</div>
        </section>
      )}

      {/* Info */}
      {D.showInfo && (
        <section className="mt-6 px-4">
          <h2 className="mb-3 px-1 text-lg font-bold">Information</h2>
          <div className={`divide-y divide-white/10 rounded-3xl px-4 ${GLASS}`}>
            {[
              ["Developer", app.developer],
              ["Category", app.category],
              ["Requires", app.requires || "—"],
              ["Updated", fmtDate(app.updatedAt)],
            ].map(([k, v]) => (
              <div key={k} className="flex items-center justify-between py-3 text-sm">
                <span className="text-slate-400">{k}</span>
                <span className="font-medium text-white">{v}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {D.showMoreFromDev && sameDev.length > 0 && (
        <section className="mt-6">
          <SectionHead title={`More from ${app.developer}`} onSeeAll={() => onDev(app.developer)} />
          <HRow items={sameDev} onOpen={onOpen} />
        </section>
      )}

      {D.showSimilar && similar.length > 0 && (
        <section className="mt-6">
          <SectionHead title="Similar apps" />
          <HRow items={similar} onOpen={onOpen} />
        </section>
      )}
    </div>
  )
}

function HRow({ items, onOpen }: { items: ModexApp[]; onOpen: (a: ModexApp) => void }) {
  return (
    <div className="modex-noscroll flex gap-4 overflow-x-auto px-5">
      {items.map((a) => (
        <button key={a.id} type="button" onClick={() => onOpen(a)} className="w-[92px] flex-shrink-0 text-left">
          <AppIcon app={a} size={92} />
          <p className="mt-2 truncate text-sm font-semibold">{a.name}</p>
          <Rating value={a.rating} />
        </button>
      ))}
    </div>
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
  const [tab, setTab] = useState<"apps" | "about">("apps")
  const list = apps.filter((a) => a.developer === name)
  const first = list[0]
  const avg = list.length ? list.reduce((s, a) => s + a.rating, 0) / list.length : 0
  const cats = Array.from(new Set(list.map((a) => a.category)))
  const tagColors = ["bg-fuchsia-600/80", "bg-indigo-600/80", "bg-yellow-500/90 text-black"]

  return (
    <div>
      <div className="relative h-44 overflow-hidden rounded-b-[40px]">
        {first ? (
          <Cover app={first} className="absolute inset-0 scale-125 blur-md" />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-fuchsia-600 to-indigo-800" />
        )}
        <div className="mx-fade absolute inset-0" />
        <div className="absolute left-4 top-4">
          <IconBtn onClick={onBack} label="Back" className="!bg-black/40">
            <ArrowLeft className="h-5 w-5" />
          </IconBtn>
        </div>
      </div>

      <div className="-mt-14 flex flex-col items-center px-4">
        <div className="mx-ring rounded-full p-1">
          <div className="mx-bgc rounded-full p-1">
            {first ? <AppIcon app={first} size={92} /> : <div className="h-[92px] w-[92px] rounded-full bg-white/10" />}
          </div>
        </div>
        <h1 className="mt-3 text-xl font-extrabold">{name}</h1>
        <p className="text-xs text-slate-400">Developer on Modex</p>

        <div className="mt-3 flex flex-wrap justify-center gap-2">
          {cats.slice(0, 3).map((c, i) => (
            <span key={c} className={`rounded-full px-4 py-1 text-xs font-bold text-white ${tagColors[i % 3]}`}>
              {c}
            </span>
          ))}
        </div>

        <div className="mt-5 grid w-full grid-cols-3 text-center">
          <div>
            <p className="text-xs text-slate-400">Apps</p>
            <p className="text-lg font-extrabold">{list.length}</p>
          </div>
          <div>
            <p className="text-xs text-slate-400">Avg rating</p>
            <p className="text-lg font-extrabold">{avg.toFixed(1)}</p>
          </div>
          <div>
            <p className="text-xs text-slate-400">Categories</p>
            <p className="text-lg font-extrabold">{cats.length}</p>
          </div>
        </div>

        <div className="mt-5 flex w-full justify-around border-b border-white/10 text-sm">
          {(["apps", "about"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`border-b-2 px-4 pb-2 font-semibold capitalize transition ${
                tab === t ? "mx-tab-on text-white" : "border-transparent text-slate-500"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 pt-3">
        {tab === "apps" ? (
          list.map((a) => <AppRow key={a.id} app={a} onOpen={() => onOpen(a)} />)
        ) : (
          <div className={`rounded-3xl p-4 text-sm leading-relaxed text-slate-300 ${GLASS}`}>
            {name} Modex e {list.length}টি app publish koreche. Shob app premium version e, ek jayga theke download korun.
          </div>
        )}
      </div>
    </div>
  )
}

/* =========================================================
   MAIN PAGE
========================================================= */

interface ModexPageProps {
  // "Site" icon e click korle main site er tab e niye jabe
  onNavigate?: (tab: string) => void
}

export default function ModexPage({ onNavigate }: ModexPageProps = {}) {
  const { apps, cfg, loading, error } = useModexData()

  const [stack, setStack] = useState<View[]>([{ t: "home" }])
  const stackRef = useRef(stack)
  stackRef.current = stack
  const scrolls = useRef<number[]>([])
  const exitingRef = useRef(false)
  const viewedRef = useRef<Set<string>>(new Set())

  const [cat, setCat] = useState("All")
  const [query, setQuery] = useState("")
  const [saved, setSaved] = useState<string[]>([])
  const [viewer, setViewer] = useState<{ list: string[]; i: number } | null>(null)
  const [isScrolled, setIsScrolled] = useState(false)
  const [annHidden, setAnnHidden] = useState(true)

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

  /* tracking (views / Get clicks) */
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

  /* navigation: push = browser history entry, tai mobile back button kaj kore */
  const push = useCallback((v: View) => {
    scrolls.current.push(window.scrollY)
    window.history.pushState(null, "", "")
    setStack((s) => [...s, v])
    window.scrollTo({ top: 0, behavior: "instant" })
  }, [])

  const back = () => window.history.back()

  // page.tsx er popstate handler eta call kore — true mane Modex nijei back handle korlo
  useEffect(() => {
    ;(window as any).__modexBack = () => {
      if (exitingRef.current) return true
      if (stackRef.current.length > 1) {
        const y = scrolls.current.pop() ?? 0
        setStack((s) => s.slice(0, -1))
        requestAnimationFrame(() =>
          requestAnimationFrame(() => window.scrollTo({ top: y, behavior: "instant" }))
        )
        return true
      }
      return false
    }
    return () => {
      delete (window as any).__modexBack
    }
  }, [])

  const exitToSite = () => {
    const n = stackRef.current.length - 1
    if (n <= 0) {
      onNavigate ? onNavigate("home") : (window.location.href = "/")
      return
    }
    exitingRef.current = true
    window.history.go(-n)
    window.setTimeout(() => {
      onNavigate ? onNavigate("home") : (window.location.href = "/")
    }, 120)
  }

  const goTab = (t: "home" | "search" | "categories" | "saved") => {
    if (top.t === t) {
      window.scrollTo({ top: 0, behavior: "smooth" })
      return
    }
    push({ t } as View)
  }

  const openApp = (a: ModexApp) => {
    track(a.id, "views")
    push({ t: "detail", id: a.id })
  }
  const openDev = (name: string) => push({ t: "dev", name })

  const pickBanner = (b: Banner) => {
    if (b.target === "app") {
      const a = apps.find((x) => x.id === b.appId)
      if (a) openApp(a)
    } else if (b.link) {
      window.open(b.link, "_blank", "noopener,noreferrer")
    }
  }

  const activeTab =
    top.t === "search" ? "search" : top.t === "categories" ? "categories" : top.t === "saved" ? "saved" : "home"

  /* derived lists */
  const sortedNew = useMemo(() => [...apps].sort((a, b) => b.createdAt - a.createdAt), [apps])
  const trendingAll = useMemo(() => {
    const t = apps.filter((a) => a.trending || a.featured)
    return t.length ? t : [...apps].sort((a, b) => b.rating - a.rating)
  }, [apps])

  const pool = cat === "All" ? apps : apps.filter((a) => a.category === cat)
  const homeTrending = (cat === "All" ? trendingAll : trendingAll.filter((a) => a.category === cat)).slice(0, S.trendingCount)
  const homeNew = (cat === "All" ? sortedNew : sortedNew.filter((a) => a.category === cat)).slice(0, S.newCount)

  /* ---------- screens ---------- */

  const annClass = `mx-ann-${cfg.announcement.style}`

  const renderHome = () => (
    <div className="pt-[76px]">
      {/* Announcement */}
      {cfg.announcement.enabled && cfg.announcement.text && !annHidden && (
        <div className={`mx-4 mb-4 flex items-center gap-3 rounded-2xl border px-4 py-3 text-sm ${annClass}`}>
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
      {S.showBanners && cfg.banners.length > 0 && <BannerSlider banners={cfg.banners} onPick={pickBanner} />}

      {/* Categories */}
      {S.showCategories && (
        <>
          <h2 className="mb-3 px-5 text-lg font-bold">{T.categoriesTitle}</h2>
          <div className="modex-noscroll flex gap-2 overflow-x-auto px-5 pb-5">
            {categories.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setCat(c)}
                className={`flex-shrink-0 rounded-full px-5 py-1.5 text-sm font-semibold transition-all duration-300 ${
                  cat === c ? "mx-grad mx-glow text-white" : "mx-chip text-slate-200"
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </>
      )}

      {error && (
        <div className="mx-5 mb-4 rounded-2xl border border-red-400/30 bg-red-500/10 p-3 text-xs text-red-200">
          Data load hoyni: {error}
        </div>
      )}

      {loading && apps.length === 0 ? (
        <div className="px-5">
          <div className="modex-noscroll flex gap-4 overflow-hidden">
            {[0, 1, 2].map((i) => (
              <div key={i} className="modex-shimmer h-[200px] w-[150px] flex-shrink-0 rounded-3xl" />
            ))}
          </div>
          <div className="mt-8 space-y-4">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="modex-shimmer h-16 rounded-2xl" />
            ))}
          </div>
        </div>
      ) : pool.length === 0 ? (
        <Empty text={apps.length === 0 ? T.emptyText : "এই category তে কোনো app নেই।"} />
      ) : (
        <>
          {/* Trending */}
          {S.showTrending && homeTrending.length > 0 && (
            <section className="mb-7">
              <SectionHead title={T.trendingTitle} onSeeAll={() => push({ t: "list", title: T.trendingTitle, kind: "trending" })} />
              <div className="modex-noscroll flex snap-x snap-mandatory gap-4 overflow-x-auto px-5">
                {homeTrending.map((a) => (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => openApp(a)}
                    className="relative h-[200px] w-[150px] flex-shrink-0 snap-start overflow-hidden rounded-3xl text-left shadow-xl transition active:scale-[.97]"
                  >
                    <Cover app={a} className="absolute inset-0" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-transparent" />
                    <div className="absolute inset-x-3 bottom-3">
                      <p className="truncate text-[15px] font-extrabold leading-tight">{a.name}</p>
                      <Rating value={a.rating} />
                    </div>
                  </button>
                ))}
              </div>
            </section>
          )}

          {/* New apps */}
          {S.showNew && (
            <section className="px-5">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-lg font-bold">{T.newTitle}</h2>
                <button type="button" onClick={() => push({ t: "list", title: T.newTitle, kind: "new" })} className="text-xs text-slate-400 hover:text-white">
                  {T.seeAll}
                </button>
              </div>
              {homeNew.map((a) => (
                <AppRow key={a.id} app={a} onOpen={() => openApp(a)} />
              ))}
            </section>
          )}
        </>
      )}
    </div>
  )

  const renderList = (v: Extract<View, { t: "list" }>) => {
    const list = v.kind === "trending" ? trendingAll : v.kind === "new" ? sortedNew : apps.filter((a) => a.category === v.cat)
    return (
      <div>
        <TopBar title={v.title} onBack={back} />
        <div className="px-4">
          {list.length ? list.map((a) => <AppRow key={a.id} app={a} onOpen={() => openApp(a)} />) : <Empty text="কোনো app নেই।" />}
        </div>
      </div>
    )
  }

  const renderCategories = () => (
    <div>
      <TopBar title={T.categoriesTitle} onBack={back} />
      <div className="grid grid-cols-2 gap-3 px-4">
        {cfg.categories.map((c) => {
          const n = apps.filter((a) => a.category === c).length
          const h = hueOf(c)
          return (
            <button
              key={c}
              type="button"
              onClick={() => push({ t: "list", title: c, kind: "cat", cat: c })}
              className="relative h-28 overflow-hidden rounded-3xl p-4 text-left transition active:scale-95"
              style={{ background: `linear-gradient(135deg, hsl(${h} 70% 45%), hsl(${(h + 60) % 360} 70% 25%))` }}
            >
              <LayoutGrid className="absolute -bottom-3 -right-3 h-20 w-20 text-white/15" />
              <p className="text-lg font-extrabold">{c}</p>
              <p className="text-xs text-white/70">{n} apps</p>
            </button>
          )
        })}
      </div>
    </div>
  )

  const renderSaved = () => {
    const list = apps.filter((a) => saved.includes(a.id))
    return (
      <div>
        <TopBar title="Saved apps" onBack={back} />
        <div className="px-4">
          {list.length ? (
            list.map((a) => <AppRow key={a.id} app={a} onOpen={() => openApp(a)} />)
          ) : (
            <Empty text="কোনো app save করা নেই। Detail page এর bookmark icon চাপুন।" />
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
        return <SearchView apps={apps} query={query} setQuery={setQuery} onBack={back} onOpen={openApp} />
      case "categories":
        return renderCategories()
      case "saved":
        return renderSaved()
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

  const navItems = [
    { id: "home", icon: Home, show: true, onClick: () => goTab("home") },
    { id: "search", icon: Search, show: true, onClick: () => goTab("search") },
    { id: "categories", icon: LayoutGrid, show: cfg.nav.showCategories, onClick: () => goTab("categories") },
    { id: "saved", icon: Bookmark, show: cfg.nav.showSaved, onClick: () => goTab("saved") },
    { id: "site", icon: Film, show: cfg.nav.showSite, onClick: exitToSite },
  ].filter((n) => n.show)

  const styleTag = (
    <style>{`
      .mx-glass {
        background: linear-gradient(135deg, rgba(255,255,255,.12), rgba(255,255,255,.04) 55%, rgba(255,255,255,.08));
        border: 1px solid rgba(255,255,255,.14);
        backdrop-filter: blur(22px) saturate(170%);
        -webkit-backdrop-filter: blur(22px) saturate(170%);
        box-shadow: inset 0 1px 0 rgba(255,255,255,.28), inset 0 -1px 0 rgba(255,255,255,.04), 0 10px 30px rgba(0,0,0,.25);
      }
      .mx-focus:focus-within { border-color: color-mix(in srgb, var(--mx-a) 65%, transparent); }
      .mx-grad { background-image: linear-gradient(90deg, var(--mx-a), var(--mx-b)); }
      .mx-glow { box-shadow: 0 6px 20px color-mix(in srgb, var(--mx-a) 45%, transparent); }
      .mx-soft { color: var(--mx-soft); }
      .mx-soft-fill { color: var(--mx-soft); fill: var(--mx-soft); }
      .mx-bgc { background: var(--mx-bg); }
      .mx-ring { background-image: linear-gradient(135deg, var(--mx-a), #22d3ee); box-shadow: 0 0 30px color-mix(in srgb, var(--mx-a) 50%, transparent); }
      .mx-tab-on { border-color: var(--mx-soft); }
      .mx-chip { background: color-mix(in srgb, var(--mx-chip) 65%, transparent); }
      .mx-chip:hover { background: var(--mx-chip); }
      .mx-bar { background: color-mix(in srgb, var(--mx-bg) 72%, transparent); backdrop-filter: blur(20px) saturate(160%); -webkit-backdrop-filter: blur(20px) saturate(160%); }
      .mx-navbar {
        background: linear-gradient(135deg, rgba(255,255,255,.14), rgba(255,255,255,.05));
        background-color: color-mix(in srgb, var(--mx-bg) 60%, transparent);
        border: 1px solid rgba(255,255,255,.14);
        backdrop-filter: blur(26px) saturate(180%);
        -webkit-backdrop-filter: blur(26px) saturate(180%);
        box-shadow: inset 0 1px 0 rgba(255,255,255,.3), 0 14px 40px rgba(0,0,0,.5);
      }
      .mx-navact { background: color-mix(in srgb, var(--mx-a) 28%, transparent); color: var(--mx-soft); box-shadow: inset 0 1px 0 rgba(255,255,255,.2); }
      .mx-fade { background: linear-gradient(to top, var(--mx-bg) 0%, color-mix(in srgb, var(--mx-bg) 30%, transparent) 55%, rgba(0,0,0,.3) 100%); }
      .mx-ann-info { background: color-mix(in srgb, var(--mx-a) 20%, transparent); border-color: color-mix(in srgb, var(--mx-a) 45%, transparent); color: #fff; }
      .mx-ann-success { background: rgba(34,197,94,.16); border-color: rgba(34,197,94,.45); color: #bbf7d0; }
      .mx-ann-warning { background: rgba(245,158,11,.16); border-color: rgba(245,158,11,.5); color: #fde68a; }
      .modex-noscroll { scrollbar-width: none; }
      .modex-noscroll::-webkit-scrollbar { display: none; }
      @keyframes modexIn { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: translateY(0); } }
      .modex-in { animation: modexIn .38s cubic-bezier(.22,1,.36,1); }
      @keyframes modexPh { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
      .modex-ph { animation: modexPh .45s ease-out; }
      @keyframes modexShimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
      .modex-shimmer { background: linear-gradient(90deg, rgba(255,255,255,.04) 25%, rgba(255,255,255,.1) 50%, rgba(255,255,255,.04) 75%); background-size: 200% 100%; animation: modexShimmer 1.4s linear infinite; }
      @media (prefers-reduced-motion: reduce) { .modex-in, .modex-ph, .modex-shimmer { animation: none; } }
    `}</style>
  )

  /* ---------- maintenance mode (admin panel theke on/off) ---------- */
  if (cfg.maintenance.enabled) {
    return (
      <div className="relative flex min-h-screen items-center justify-center px-6 text-white" style={themeVars}>
        {styleTag}
        <div className={`modex-in relative w-full max-w-sm rounded-[32px] p-8 text-center ${GLASS}`}>
          <div className="mx-grad mx-glow mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-3xl">
            <Wrench className="h-8 w-8 text-white" />
          </div>
          <ModexLogo size={30} logoUrl={cfg.brand.logoUrl} />
          <p className="mt-4 text-sm leading-relaxed text-slate-300">{cfg.maintenance.message}</p>
          <button type="button" onClick={exitToSite} className="mx-grad mx-glow mt-6 rounded-full px-8 py-2.5 text-sm font-bold text-white active:scale-95">
            Back to site
          </button>
        </div>
        <SideNavigation current="modex" />
      </div>
    )
  }

  return (
    <Ctx.Provider value={{ cfg, track }}>
      <div className="relative min-h-screen overflow-x-clip text-white" style={themeVars}>
        {styleTag}

        {/* background glow */}
        <div className="pointer-events-none fixed inset-0">
          <div className="absolute -left-24 -top-24 h-80 w-80 rounded-full opacity-25 blur-[100px]" style={{ background: "var(--mx-a)" }} />
          <div className="absolute -right-24 top-1/3 h-72 w-72 rounded-full bg-fuchsia-600/15 blur-[100px]" />
          <div className="absolute -bottom-24 left-1/4 h-72 w-72 rounded-full bg-cyan-500/10 blur-[100px]" />
        </div>

        {/* HOME HEADER (shudhu home e) */}
        {top.t === "home" && (
          <header
            className={`fixed inset-x-0 top-0 z-40 transition-all duration-300 ${
              isScrolled ? "mx-bar border-b border-white/10" : "border-b border-transparent"
            }`}
          >
            <div className="mx-auto flex max-w-xl items-center gap-3 px-4 py-3">
              <IconBtn onClick={() => push({ t: "search" })} label="Search">
                <Search className="h-5 w-5" />
              </IconBtn>
              <div className="min-w-0 flex-1 text-center leading-tight">
                <p className="text-[11px] text-slate-400">{T.welcome}</p>
                <ModexLogo size={24} logoUrl={cfg.brand.logoUrl} />
              </div>
              <IconBtn onClick={openSideMenu} label="Open menu">
                <MoreHorizontal className="h-5 w-5" />
              </IconBtn>
            </div>
          </header>
        )}

        <main className="relative mx-auto max-w-xl pb-32">
          <div key={`${stack.length}-${top.t}`} className="modex-in">
            {renderView()}
          </div>
        </main>

        {/* BOTTOM NAV (liquid glass floating bar) */}
        <nav className="fixed inset-x-4 bottom-4 z-50 mx-auto max-w-md">
          <div className="mx-navbar flex items-center justify-around rounded-[28px] px-3 py-3">
            {navItems.map((n) => {
              const active = n.id === activeTab
              return (
                <button
                  key={n.id}
                  type="button"
                  onClick={n.onClick}
                  aria-label={n.id}
                  className={`flex h-11 w-11 items-center justify-center rounded-2xl transition-all active:scale-90 ${
                    active ? "mx-navact" : "text-slate-400 hover:text-white"
                  }`}
                >
                  <n.icon className="h-[22px] w-[22px]" />
                </button>
              )
            })}
          </div>
        </nav>

        {/* SCREENSHOT VIEWER */}
        {viewer && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/90 p-4" onClick={() => setViewer(null)}>
            <button type="button" onClick={() => setViewer(null)} aria-label="Close" className="absolute right-4 top-4 flex h-11 w-11 items-center justify-center rounded-full bg-white/10">
              <X className="h-5 w-5" />
            </button>
            {viewer.i > 0 && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  setViewer({ ...viewer, i: viewer.i - 1 })
                }}
                className="absolute left-3 flex h-11 w-11 rotate-180 items-center justify-center rounded-full bg-white/10"
                aria-label="Previous"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            )}
            <img src={viewer.list[viewer.i]} alt="" className="modex-in max-h-[85vh] max-w-full rounded-2xl object-contain" onClick={(e) => e.stopPropagation()} />
            {viewer.i < viewer.list.length - 1 && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  setViewer({ ...viewer, i: viewer.i + 1 })
                }}
                className="absolute right-3 flex h-11 w-11 items-center justify-center rounded-full bg-white/10"
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

        <SideNavigation current="modex" />
      </div>
    </Ctx.Provider>
  )
                                }
