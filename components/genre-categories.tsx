"use client"

import { createPortal } from "react-dom"
import {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react"
import { ChevronDown, Film, Info, Smartphone, X, Zap } from "lucide-react"
import { movies } from "@/lib/movie-data"

interface GenreCategoriesProps {
  genres: string[]
  selectedGenre: string | null
  onGenreSelect: (genre: string | null) => void
  showAdultContent?: boolean
  selectedYear?: string
  selectedRating?: string
  selectedLanguage?: string
  selectedType?: string
  onFilterChange?: (filters: {
    year?: string
    rating?: string
    language?: string
    type?: string
  }) => void
  /* ✅ Selector (Year / Language / Genre) er data source.
     Home page e dewar dorkar nai (default = movies), Anime page e animes pass korbe */
  items?: any[]
}

type AppModal = "tutorial" | "download" | null
type SelectorType =
  | "year"
  | "rating"
  | "language"
  | "type"
  | "genre"
  | "platform"
type FilterType = SelectorType | null

const tutorialVideoId = "deuVIRqrscs"
const apkDownloadUrl = "https://github.com/flixory2025-lgtm/mvbd-miniapp/releases/download/2.0.5v/MVBD.MINI.APP.apk"
const requestGroupUrl = "https://t.me/mvbdreq"
const youtubeChannelUrl = "https://youtube.com/@moviesversebd26?si=HwJWqaqEkTx_I-ve"

/* 👉 MVBDS er official logo er image link ekhane boshao (png/webp).
   Khali rakhle ekta "M" icon dekhabe. */
const MVBD_LOGO_URL = ""

/* =========================================================
   CATEGORY TILE BACKGROUNDS
   ---------------------------------------------------------
   Category button er bhitorer image. Key = genre er normalised
   naam (choto hater, special character chhara).
========================================================= */

const CATEGORY_IMAGES: Record<string, string> = {
  all: "https://i.postimg.cc/Y95sTCrL/619306-bg-full-netflix-grid-v2-desktop.jpg",
  action: "https://i.postimg.cc/D03xBp6N/AAAABcs-As-Enrg-NK9ZKkqf-At4IA0Dy-O4Mw4Jjeuu-Q4z-Hnm-Zgf-LWKk-Zd-ZHTGw-PHvao-O5x-Ebo-YXICk-XRg-ECNBt.jpg",
  comedy: "https://i.postimg.cc/P5VKB5K1/laughing-couple-in-velvet-tracksuits-throwing-cereal-and-milk-in-a-colorful-retro-kitchen-joyful-ene.jpg",
  drama: "https://i.postimg.cc/x8P3gfcH/new-k-dramas-on-netflix-in-november-2026.jpg",
  horror: "https://i.postimg.cc/3R5jT4GJ/netflix-hill-house.png",
  zombie: "https://i.postimg.cc/qMb87ZKm/oobvkdpinjyf1.jpg",
  romance: "https://i.postimg.cc/k4mSZrr1/ai-generated-a-couple-embracing-under-a-neon-sign-their-love-illuminated-by-the-warm-glow-of-the-lig.jpg",
  scifi: "https://i.postimg.cc/Hshym8DJ/Spectral-Netflix.jpg",
  thriller: "https://i.postimg.cc/Xqh7RFZh/264688-war-of-the-worlds-adventure-thriller-sci-fi.jpg",
  kdrama: "https://i.postimg.cc/nhqcWXn7/images.jpg",
  bangla: "https://i.postimg.cc/vZGHpQTp/sddefault.jpg",
  marvel: "https://i.postimg.cc/brQpBMh1/dkeyw04-bf3937b4-2209-4a39-90c5-720db3bf42b1.jpg",
  natok: "https://i.postimg.cc/1zfPQ4SR/Screenshot-20261020-233758-Chrome.jpg",
  dc: "https://i.postimg.cc/vZmwrDc1/wallpapersden-com-77206-3840x2560.jpg",
  kukutv: "https://i.postimg.cc/mDCvLH6V/unnamed.webp",
  netflix: "https://i.postimg.cc/vZTC1jNx/netflix-background-gs7hjuwvv2g0e9fj.jpg",
  sports: "https://i.postimg.cc/XqnznD5y/male-soccer-player-action-sequence-multiple-balls-dark-background-male-soccer-player-action-sequence.jpg",
  adult: "https://i.postimg.cc/fTTrFpZp/76ba643b11f07959540ab89fdbedd43c2d4cb519e83c3d635baf1331e702caf4-SX1080-FMjpg.jpg",
}

/* genre নামের বানান আলাদা হলে এখান থেকে মিলিয়ে নেওয়া হয় */
const ALIASES: Record<string, string> = {
  sciencefiction: "scifi",
  koreandrama: "kdrama",
  kdramas: "kdrama",
  bengali: "bangla",
  horor: "horror",
  kuku: "kukutv",
  adults: "adult",
  "18": "adult",
  sport: "sports",
  dccomics: "dc",
  marvelcomics: "marvel",
  recentlyuploaded: "all",
}

const normKey = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "")

const getCategoryImage = (name: string | null): string | undefined => {
  if (!name) return CATEGORY_IMAGES.all
  const k0 = normKey(name)
  const key = ALIASES[k0] || k0
  return Object.prototype.hasOwnProperty.call(CATEGORY_IMAGES, key)
    ? CATEGORY_IMAGES[key]
    : undefined
}

/* ---------------------------------------------------------
   ⚡ Image gulo onek boro (kono kono ta 3840px). Mobile e decode +
   memory te lag hoy. true korle wsrv.nl diye 480px webp version load hobe.
--------------------------------------------------------- */
const RESIZE_TILE_IMAGES = false

const tileSrc = (url: string): string =>
  RESIZE_TILE_IMAGES
    ? `https://wsrv.nl/?url=${encodeURIComponent(url)}&w=480&q=70&output=webp`
    : url

/* =========================================================
   OFFICIAL SOCIAL PLATFORMS (same links as footer)
========================================================= */

type SocialPlatform =
  | "facebook"
  | "instagram"
  | "telegram"
  | "whatsapp"
  | "youtube"
  | "tiktok"
  | "threads"

interface PlatformItem {
  platform: SocialPlatform
  label: string
  url: string
  color: string // official brand colour
}

const platformItems: PlatformItem[] = [
  {
    platform: "facebook",
    label: "Facebook",
    url: "https://www.facebook.com/share/19eVKBFqiV/",
    color: "#1877F2",
  },
  {
    platform: "instagram",
    label: "Instagram",
    url: "https://www.instagram.com/mvbdstudio?stkn=aGFyY2UwNXVibGVq",
    color: "#E4405F",
  },
  {
    platform: "telegram",
    label: "Telegram",
    url: "https://t.me/addlist/G-AjTDjHEW0yYTJl",
    color: "#26A5E4",
  },
  {
    platform: "whatsapp",
    label: "WhatsApp",
    url: "https://wa.me/qr/D2BVBPREHG4LH1",
    color: "#25D366",
  },
  {
    platform: "youtube",
    label: "YouTube",
    url: "https://youtube.com/@moviesversebd26?si=gKTfFLJDC4dGc7KW",
    color: "#FF0000",
  },
  {
    platform: "tiktok",
    label: "TikTok",
    url: "https://www.tiktok.com/@moviesversebd?_r=1&_t=ZS-99dip5TzHyy",
    color: "#FFFFFF",
  },
  {
    platform: "threads",
    label: "Threads",
    url: "https://www.threads.com/@mvbdstudio",
    color: "#FFFFFF",
  },
]

function PlatformIcon({ platform }: { platform: SocialPlatform }) {
  const common = {
    viewBox: "0 0 24 24",
    className: "w-full h-full block",
    "aria-hidden": true,
  } as const

  switch (platform) {
    case "facebook":
      return (
        <svg {...common}>
          <path
            fill="currentColor"
            d="M13.5 21v-8h2.7l.4-3h-3.1V8.08c0-.87.24-1.46 1.5-1.46h1.7V3.94c-.29-.04-1.29-.12-2.46-.12-2.44 0-4.11 1.49-4.11 4.23V10H7.5v3h2.63v8h3.37Z"
          />
        </svg>
      )
    case "instagram":
      return (
        <svg {...common}>
          <rect
            x="3.2"
            y="3.2"
            width="17.6"
            height="17.6"
            rx="5"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          />
          <circle
            cx="12"
            cy="12"
            r="4.1"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          />
          <circle cx="17.45" cy="6.65" r="1.2" fill="currentColor" />
        </svg>
      )
    case "telegram":
      return (
        <svg {...common}>
          <path
            fill="currentColor"
            d="M21.9 4.1 18.7 19c-.24 1.05-.86 1.31-1.74.82l-4.77-3.52-2.3 2.21c-.25.25-.46.46-.94.46l.34-4.86 8.85-8c.39-.34-.09-.53-.6-.19L6.6 12.96l-4.69-1.47c-1.02-.32-1.04-1.02.21-1.51L20.45 3.3c.86-.31 1.62.2 1.45.8Z"
          />
        </svg>
      )
    case "whatsapp":
      return (
        <svg {...common}>
          <path
            fill="currentColor"
            d="M20.52 3.48A11.83 11.83 0 0 0 12.07 0C5.52 0 .19 5.32.19 11.88c0 2.09.55 4.13 1.59 5.92L.1 24l6.34-1.66a11.87 11.87 0 0 0 5.63 1.43h.01c6.55 0 11.88-5.33 11.88-11.89 0-3.17-1.23-6.15-3.44-8.4ZM12.08 21.75h-.01a9.85 9.85 0 0 1-5.02-1.37l-.36-.21-3.76.99 1-3.67-.23-.38a9.87 9.87 0 0 1-1.51-5.23C2.19 6.44 6.62 2 12.07 2c2.64 0 5.12 1.03 6.98 2.9a9.82 9.82 0 0 1 2.89 6.99c0 5.45-4.43 9.86-9.86 9.86Zm5.41-7.39c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.47-.89-.79-1.49-1.77-1.66-2.07-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.07-.15-.67-1.61-.92-2.2-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.49s1.07 2.89 1.22 3.09c.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.69.63.71.23 1.35.2 1.86.12.57-.09 1.76-.72 2.01-1.42.25-.7.25-1.3.17-1.42-.07-.12-.27-.2-.57-.35Z"
          />
        </svg>
      )
    case "youtube":
      return (
        <svg {...common}>
          <path
            fill="currentColor"
            d="M23.5 6.2a3 3 0 0 0-2.12-2.12C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.38.58A3 3 0 0 0 .5 6.2 31.2 31.2 0 0 0 0 12a31.2 31.2 0 0 0 .5 5.8 3 3 0 0 0 2.12 2.12C4.5 20.5 12 20.5 12 20.5s7.5 0 9.38-.58a3 3 0 0 0 2.12-2.12A31.2 31.2 0 0 0 24 12a31.2 31.2 0 0 0-.5-5.8ZM9.6 15.85v-7.7L16 12l-6.4 3.85Z"
          />
        </svg>
      )
    case "tiktok":
      return (
        <svg {...common}>
          <path
            fill="currentColor"
            d="M16.55 2h-3.16v13.07a3.48 3.48 0 1 1-2.42-3.32V8.53a6.78 6.78 0 1 0 5.58 6.65V8.1a8.33 8.33 0 0 0 4.87 1.57V6.5c-2.55-.11-4.55-1.84-4.87-4.5Z"
          />
        </svg>
      )
    case "threads":
      return (
        <svg {...common}>
          <path
            fill="none"
            stroke="currentColor"
            strokeWidth="1.9"
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M17.9 11.35c-.25-3.13-2.08-5.1-5.25-5.1-2.92 0-4.94 1.56-4.94 4.03 0 2.25 1.72 3.61 4.31 3.61 2.44 0 4.06-1.22 4.06-3.05 0-1.55-1.2-2.5-3.17-2.5-2.19 0-3.8 1.17-3.8 3.09 0 2.22 1.88 3.73 4.66 3.73 3.3 0 5.42-2.02 5.42-5.31 0-4.58-3.02-7.31-7.3-7.31-4.22 0-6.95 2.45-6.95 6.34"
          />
        </svg>
      )
    default:
      return null
  }
}

/* ✅ YouTube + Android official-style logos */
function YouTubeLogo() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="1" y="4.5" width="22" height="15" rx="4.2" fill="#FF0000" />
      <path d="M9.8 8.7v6.6l5.7-3.3z" fill="#fff" />
    </svg>
  )
}

function AndroidLogo() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M3.5 17.5a8.5 8.5 0 0 1 17 0z" fill="#3DDC84" />
      <path
        d="M7.2 9.8 5.4 6.4M16.8 9.8l1.8-3.4"
        stroke="#3DDC84"
        strokeWidth="1.4"
        strokeLinecap="round"
        fill="none"
      />
      <circle cx="9" cy="14" r=".95" fill="#07130c" />
      <circle cx="15" cy="14" r=".95" fill="#07130c" />
    </svg>
  )
}

/* MVBDS icon — MVBD_LOGO_URL dile oi logo, na dile "M" icon */
function MvbdIcon() {
  if (MVBD_LOGO_URL) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={MVBD_LOGO_URL}
        alt=""
        aria-hidden="true"
        draggable={false}
        className="gc-mvbd-img"
      />
    )
  }
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <defs>
        <linearGradient id="gcMv" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#B7FF00" />
          <stop offset="1" stopColor="#20E000" />
        </linearGradient>
      </defs>
      <circle cx="12" cy="12" r="11" fill="#07090d" />
      <circle cx="12" cy="12" r="10.2" fill="none" stroke="url(#gcMv)" strokeWidth="1.4" />
      <path
        d="M6.8 16.5V7.5l5.2 5.6 5.2-5.6v9"
        fill="none"
        stroke="url(#gcMv)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

/* =========================================================
   HELPERS
========================================================= */

const normalizeLanguage = (lang: string): string => {
  if (!lang) return "Others"
  const l = lang.toLowerCase().trim()

  if (l.includes("hindi") || l === "dual audio" || l.includes("हिंदी")) return "Hindi"
  if (l.includes("bangla") || l.includes("bengali") || l.includes("বাংলা")) return "Bangla"
  if (l.includes("korean") || l.includes("kurean")) return "Korean"
  if (l.includes("english") || l === "eng") return "English"
  if (l.includes("telugu")) return "Telugu"
  if (l.includes("malayalam")) return "Malayalam"
  if (l.includes("japanese")) return "Japanese"
  if (l.includes("tamil")) return "Tamil"
  if (l.includes("indonesian")) return "Indonesian"
  if (l.includes("filipino") || l.includes("tagalog")) return "Filipino"
  if (l.includes("thai")) return "Thai"

  return "Others"
}

const isSeries = (title: string): boolean => {
  return /season|সিজন|season \d|part \d/i.test(title)
}

const selectorTypes: SelectorType[] = [
  "year",
  "rating",
  "language",
  "type",
  "genre",
  "platform",
]

/* Selector er fixed list — component er baire, tai render e notun array banay na */
const availableRatings = ["2.0", "3.0", "4.0", "5.0", "6.0", "7.0", "8.0", "9.0"]
const availableTypes = ["All", "Movie", "Series"]

/* Category button er common class — shob same size */
const CATEGORY_BASE =
  "liquid-glass-category category-btn relative overflow-hidden font-medium"

/* Category button er bhitorer image (ek pash theke onno pashe dark hoye jay) */
const TileBg = memo(function TileBg({ url }: { url?: string }) {
  const [loaded, setLoaded] = useState(false)
  const imgRef = useRef<HTMLImageElement>(null)

  // image age thekei cache e thakle onLoad fire nao hote pare (SSR/hydration)
  useEffect(() => {
    const el = imgRef.current
    if (el && el.complete && el.naturalWidth > 0) setLoaded(true)
  }, [])

  if (!url) return null
  return (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        ref={imgRef}
        src={tileSrc(url)}
        alt=""
        aria-hidden="true"
        loading="lazy"
        decoding="async"
        referrerPolicy="no-referrer"
        draggable={false}
        onLoad={() => setLoaded(true)}
        className={`gc-tb ${loaded ? "ld" : ""}`}
      />
      <span className="gc-tg" />
    </>
  )
})

/* Selected category: border er chardike ghurte thaka choto green light */
function CategoryHighlight() {
  return <span className="gc-orbit" aria-hidden="true" />
}

/* Ekta category button — memo kora */
const CategoryButton = memo(function CategoryButton({
  genre,
  image,
  active,
  onSelect,
}: {
  genre: string | null
  image?: string
  active: boolean
  onSelect: (genre: string | null) => void
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(genre)}
      className={`${CATEGORY_BASE} ${
        active ? "active text-blue-200" : "text-slate-300"
      }`}
    >
      <TileBg url={image} />
      <span className="gc-bl">{genre ?? "All"}</span>
      {active && <CategoryHighlight />}
    </button>
  )
})

/* =========================================================
   BOTTOM SHEET (iPhone / Facebook style)
   - niche theke smooth uthe ashe
   - X e click korle / backdrop e click korle / Esc dile smooth neme jay
   - upor theke (grabber / header) tene niche namiye dile-o close hoy
========================================================= */
function BottomSheet({
  kicker,
  title,
  onClosed,
  children,
}: {
  kicker: string
  title: string
  onClosed: () => void
  children: React.ReactNode
}) {
  const [show, setShow] = useState(false)
  const sheetRef = useRef<HTMLElement>(null)
  const backdropRef = useRef<HTMLDivElement>(null)
  const closingRef = useRef(false)
  const onClosedRef = useRef(onClosed)
  const drag = useRef({
    active: false,
    startY: 0,
    lastY: 0,
    lastT: 0,
    v: 0,
    dy: 0,
  })

  useEffect(() => {
    onClosedRef.current = onClosed
  }, [onClosed])

  // mount howar por ektu pore "in" class — tahole niche theke slide-up animation hoy
  useEffect(() => {
    const t = window.setTimeout(() => setShow(true), 30)
    return () => window.clearTimeout(t)
  }, [])

  const close = useCallback(() => {
    if (closingRef.current) return
    closingRef.current = true
    setShow(false)
    window.setTimeout(() => onClosedRef.current(), 450)
  }, [])

  // Esc + page scroll lock
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close()
    }
    document.addEventListener("keydown", onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.removeEventListener("keydown", onKey)
      document.body.style.overflow = prev
    }
  }, [close])

  const onDragStart = (e: React.PointerEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest("button,a")) return
    const d = drag.current
    d.active = true
    d.startY = e.clientY
    d.lastY = e.clientY
    d.lastT = performance.now()
    d.v = 0
    d.dy = 0
    e.currentTarget.setPointerCapture(e.pointerId)
    if (sheetRef.current) sheetRef.current.style.transition = "none"
  }

  const onDragMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const d = drag.current
    if (!d.active) return
    const sheet = sheetRef.current
    const dy = Math.max(0, e.clientY - d.startY)
    const now = performance.now()
    d.v = (e.clientY - d.lastY) / Math.max(1, now - d.lastT)
    d.lastY = e.clientY
    d.lastT = now
    d.dy = dy
    if (sheet) sheet.style.transform = `translateY(${dy}px)`
    if (backdropRef.current && sheet) {
      backdropRef.current.style.opacity = String(
        Math.max(0, 1 - dy / (sheet.offsetHeight || 600)),
      )
    }
  }

  const onDragEnd = () => {
    const d = drag.current
    if (!d.active) return
    d.active = false
    const shouldClose = d.dy > 110 || (d.v > 0.6 && d.dy > 20)
    if (sheetRef.current) {
      sheetRef.current.style.transition = ""
      sheetRef.current.style.transform = ""
    }
    if (backdropRef.current) backdropRef.current.style.opacity = ""
    if (shouldClose) close()
  }

  return (
    <div
      ref={backdropRef}
      className={`gc-sheet-bd${show ? " in" : ""}`}
      onClick={(e) => {
        if (e.target === e.currentTarget) close()
      }}
    >
      <section
        ref={sheetRef}
        className={`gc-sheet${show ? " in" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div
          className="gc-zone"
          onPointerDown={onDragStart}
          onPointerMove={onDragMove}
          onPointerUp={onDragEnd}
          onPointerCancel={onDragEnd}
        >
          <div className="gc-grab" aria-hidden="true" />
          <div className="gc-sh-head">
            <div className="min-w-0">
              <p>{kicker}</p>
              <h2>{title}</h2>
            </div>
            <button
              type="button"
              className="gc-circle"
              aria-label="Close"
              onClick={close}
            >
              <X />
            </button>
          </div>
        </div>

        <div className="gc-sheet-body">{children}</div>
      </section>
    </div>
  )
}

/* =========================================================
   STYLES — component er baire, tai ekbar-i toiri hoy
========================================================= */
const STYLES = `
        @import url("https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap");

        @keyframes liquidGlassButtonZoom {
          0% { transform: scale(1); }
          50% { transform: scale(1.06); }
          100% { transform: scale(1); }
        }
        .liquid-glass-category {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.15);
          border-radius: 16px;
          transition: transform 0.3s ease, background-color 0.3s ease, border-color 0.3s ease;
        }
        @media (hover: hover) {
          .liquid-glass-category:hover {
            background: rgba(255, 255, 255, 0.08);
            border-color: rgba(255, 255, 255, 0.25);
            transform: scale(1.02);
          }
        }
        .liquid-glass-category.active {
          background: rgba(100, 200, 255, 0.12);
          border-color: rgba(100, 200, 255, 0.4);
          animation: liquidGlassButtonZoom 0.5s ease-out;
        }

        /* =========================================================
           ✅ Categories: side by side, dane-bame smooth scroll
           ========================================================= */
        .category-scroller {
          position: relative;
          display: flex;
          flex-wrap: nowrap;
          gap: 10px;
          padding: 8px 14px;
          overflow-x: auto;
          overflow-y: hidden;
          overscroll-behavior-x: contain;
          -webkit-overflow-scrolling: touch;
          scrollbar-width: none;
          cursor: grab;
          -webkit-mask-image: linear-gradient(90deg, transparent 0, #000 14px, #000 calc(100% - 14px), transparent 100%);
          mask-image: linear-gradient(90deg, transparent 0, #000 14px, #000 calc(100% - 14px), transparent 100%);
        }
        .category-scroller::-webkit-scrollbar { display: none; }
        .category-scroller.dragging { cursor: grabbing; user-select: none; }
        .category-btn {
          flex: none;
          width: 120px;
          min-height: 54px;
          padding: 6px 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          text-align: center;
          font-size: 12.5px;
          line-height: 1.25;
          text-transform: none;
          overflow-wrap: anywhere;
        }
        @media (min-width: 768px) {
          .category-btn { width: 150px; min-height: 58px; font-size: 14px; }
          .category-scroller { gap: 12px; }
        }

        /* ✅ Category button er bhitorer image */
        .gc-tb {
          position: absolute; inset: 0; width: 100%; height: 100%; max-width: none;
          object-fit: cover; object-position: center;
          opacity: 0; transform: scale(1.12);
          pointer-events: none; user-select: none;
          transition: opacity .9s, transform 1.4s cubic-bezier(.2,.7,.2,1);
        }
        .gc-tb.ld { opacity: .85; }
        .gc-tg {
          position: absolute; inset: 0;
          background: linear-gradient(90deg, #0000 0%, #0006 38%, #000e 100%);
          transition: opacity .6s;
        }
        .gc-bl { position: relative; z-index: 1; font-weight: 600; text-shadow: 0 1px 8px #000, 0 0 3px #000; }
        .category-btn.active .gc-tb.ld {
          opacity: 1; transform: scale(1); filter: saturate(1.2);
          animation: gc-tbk 9s ease-in-out 1.4s infinite alternate;
        }
        .category-btn.active .gc-tg { opacity: .75; }
        @media (hover: hover) {
          .category-btn:hover .gc-tb.ld { opacity: 1; transform: scale(1.06); }
        }
        @keyframes gc-tbk { to { transform: scale(1.14) translateX(-3%); } }

        /* =========================================================
           ✅ 3D buttons (shared)
           ========================================================= */
        .gc-3d {
          position: relative;
          display: inline-flex; align-items: center; justify-content: center; gap: .5rem;
          overflow: hidden; margin-bottom: 4px;
          border: 1px solid rgba(255,255,255,.28);
          font-family: Inter, system-ui, -apple-system, "Segoe UI", sans-serif;
          font-weight: 700; text-decoration: none; cursor: pointer;
          -webkit-tap-highlight-color: transparent;
          box-shadow:
            0 4px 0 var(--d),
            0 9px 16px -5px var(--gl),
            inset 0 1px 0 rgba(255,255,255,.5),
            inset 0 -2px 3px rgba(0,0,0,.22);
          transition: transform .12s ease, box-shadow .12s ease;
        }
        .gc-3d::before {
          content: ""; position: absolute; left: 0; right: 0; top: 0; height: 50%;
          background: linear-gradient(180deg, rgba(255,255,255,.3), rgba(255,255,255,0));
          pointer-events: none;
        }
        .gc-3d > * { position: relative; z-index: 1; }
        .gc-3d:active {
          transform: translateY(3px);
          box-shadow:
            0 1px 0 var(--d),
            0 3px 8px -4px var(--gl),
            inset 0 1px 0 rgba(255,255,255,.4),
            inset 0 -2px 3px rgba(0,0,0,.22);
        }
        .gc-red {
          --d: #6f0000; --gl: rgba(255,40,40,.55);
          background: linear-gradient(180deg, #ff5a5a 0%, #ee1111 50%, #c20000 100%);
          color: #fff;
        }
        .gc-green {
          --d: #0b5a30; --gl: rgba(61,220,132,.55);
          background: linear-gradient(180deg, #5cf5a6 0%, #2bc673 50%, #1a9a58 100%);
          color: #04140b;
        }
        .gc-blue {
          --d: #0b4a73; --gl: rgba(42,171,238,.55);
          background: linear-gradient(180deg, #5cc8f7 0%, #2aabee 50%, #1b86c4 100%);
          color: #fff;
        }
        .gc-chip {
          flex: none; display: grid; place-items: center;
          width: 1.7rem; height: 1.7rem; border-radius: .55rem; background: #fff;
          box-shadow: inset 0 -1px 2px rgba(0,0,0,.22), 0 1px 3px rgba(0,0,0,.3);
        }
        .gc-chip svg, .gc-chip .gc-mvbd-img { width: 1.3rem; height: 1.3rem; display: block; }
        .gc-chip .gc-mvbd-img { object-fit: contain; border-radius: .3rem; }
        .gc-chip.dk { background: #07130c; }
        .gc-chip.mv { background: #07090d; }

        /* ✅ Choto CTA buttons (category er moto size) */
        .gc-cta-row {
          display: grid; grid-template-columns: 1fr 1fr; gap: 10px;
          margin-top: 6px; padding: 0 14px;
        }
        .gc-mini {
          width: 100%; height: 46px; padding: 0 10px; border-radius: 14px;
          justify-content: flex-start; text-align: left;
          font-size: 11.5px; line-height: 1.2;
        }
        .gc-mini span.gc-ct {
          display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;
          overflow: hidden; text-transform: none;
        }
        @media (min-width: 768px) {
          .gc-cta-row { display: flex; justify-content: center; gap: 12px; }
          .gc-mini { width: 240px; font-size: 12.5px; }
        }

        /* ✅ Selected category: border er chardike ghurte thaka choto green light */
        @property --gc-a {
          syntax: "<angle>";
          initial-value: 0deg;
          inherits: false;
        }
        .gc-orbit {
          position: absolute; inset: 0; z-index: 3; pointer-events: none;
          border-radius: inherit; padding: 2px;
          background: conic-gradient(
            from var(--gc-a),
            transparent 0deg,
            transparent 116deg,
            rgba(34, 197, 94, 0.15) 126deg,
            rgba(34, 197, 94, 0.7) 156deg,
            #bbf7d0 180deg,
            transparent 180deg,
            transparent 296deg,
            rgba(34, 197, 94, 0.15) 306deg,
            rgba(34, 197, 94, 0.7) 336deg,
            #bbf7d0 360deg
          );
          -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
          -webkit-mask-composite: xor;
          mask: linear-gradient(#000 0 0) content-box exclude, linear-gradient(#000 0 0);
          filter: drop-shadow(0 0 4px rgba(34, 197, 94, 0.9));
          animation: gc-orbit-spin 6s linear infinite;
        }
        @keyframes gc-orbit-spin { to { --gc-a: 360deg; } }

        @keyframes filterDropdownOpenUp {
          from {
            opacity: 0;
            transform: translateY(8px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        .filter-dropdown {
          animation: filterDropdownOpenUp 0.25s cubic-bezier(0.25, 1, 0.5, 1);
        }
        @keyframes filterItemSlide {
          from { opacity: 0; transform: translateX(-10px); }
          to { opacity: 1; transform: translateX(0); }
        }
        .filter-item-anim {
          animation: filterItemSlide 0.3s ease-out backwards;
        }
        .filter-selector-btn {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.15);
          border-radius: 12px;
          transition: background-color 0.3s ease, border-color 0.3s ease, color 0.3s ease;
          color: #cbd5e1;
        }
        .filter-selector-btn:hover {
          background: rgba(255, 255, 255, 0.08);
          border-color: rgba(100, 200, 255, 0.3);
          color: white;
        }
        .filter-selector-btn.active {
          background: rgba(100, 200, 255, 0.15);
          border-color: rgba(100, 200, 255, 0.5);
          color: #93c5fd;
        }
        .filter-selector-btn.has-value {
          background: rgba(34, 197, 94, 0.12);
          border-color: rgba(34, 197, 94, 0.4);
          color: #86efac;
        }

        /* ✅ Selector গুলো: mobile এ 3 কলাম grid, desktop এ মাঝখানে */
        .filter-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 8px;
        }
        @media (min-width: 768px) {
          .filter-grid {
            display: flex;
            flex-wrap: wrap;
            justify-content: center;
            gap: 12px;
          }
        }

        /* ✅ Platforms dropdown item */
        .platform-item {
          display: flex;
          align-items: center;
          gap: 12px;
          width: 100%;
          padding: 8px 14px;
          transition: background 0.2s ease, transform 0.2s ease;
        }
        .platform-item:hover {
          background: rgba(255, 255, 255, 0.08);
        }
        .platform-icon-box {
          width: 32px;
          height: 32px;
          padding: 7px;
          border-radius: 10px;
          flex-shrink: 0;
          background: color-mix(in srgb, currentColor 14%, transparent);
          border: 1px solid color-mix(in srgb, currentColor 35%, transparent);
        }
        .platform-item:hover .platform-icon-box {
          box-shadow: 0 0 14px color-mix(in srgb, currentColor 45%, transparent);
        }
        .platform-tiktok .platform-icon-box svg {
          filter: drop-shadow(1px 1px 0 #fe2c55) drop-shadow(-1px -1px 0 #25f4ee);
        }

        /* =========================================================
           ✅ BOTTOM SHEET (iPhone style)
           ========================================================= */
        .gc-sheet-bd {
          position: fixed; inset: 0; z-index: 9999;
          display: flex; align-items: flex-end; justify-content: center;
          background: rgba(0,0,0,.62);
          -webkit-backdrop-filter: blur(6px); backdrop-filter: blur(6px);
          opacity: 0; transition: opacity .45s ease;
        }
        .gc-sheet-bd.in { opacity: 1; }
        .gc-sheet {
          position: relative; width: 100%; max-width: 30rem;
          max-height: 92vh; max-height: 92dvh;
          display: flex; flex-direction: column; overflow: hidden;
          color: #fff;
          font-family: Inter, system-ui, -apple-system, "Segoe UI", sans-serif;
          -webkit-text-size-adjust: 100%; text-size-adjust: 100%;
          border-radius: 1.5rem 1.5rem 0 0;
          border: 1px solid rgba(255,255,255,.1); border-bottom: 0;
          background:
            radial-gradient(100% 45% at 100% 0%, rgba(61,220,132,.12), transparent 60%),
            linear-gradient(160deg, #1d1f19, #0c0d0a);
          box-shadow: inset 0 1px 0 rgba(255,255,255,.12), 0 -20px 60px -20px rgba(0,0,0,.9);
          transform: translateY(100%);
          transition: transform .5s cubic-bezier(.32,.72,0,1);
          will-change: transform;
          padding-bottom: env(safe-area-inset-bottom);
        }
        .gc-sheet.in { transform: translateY(0); }
        .gc-sheet *, .gc-sheet *::before, .gc-sheet *::after { box-sizing: border-box; }

        .gc-zone { flex: none; touch-action: none; cursor: grab; user-select: none; -webkit-user-select: none; }
        .gc-zone:active { cursor: grabbing; }
        .gc-grab {
          width: 2.4rem; height: .28rem; border-radius: 99px;
          background: rgba(255,255,255,.28); margin: .55rem auto .1rem;
        }
        .gc-sh-head {
          display: flex; align-items: center; justify-content: space-between; gap: .75rem;
          padding: .4rem .9rem .7rem 1.1rem;
        }
        .gc-sh-head p { margin: 0; font-size: 10px; color: rgba(255,255,255,.5); }
        .gc-sh-head h2 { margin: 2px 0 0; font-size: 15px; font-weight: 600; text-transform: none; }
        .gc-circle {
          display: grid; place-items: center; flex: none; width: 2rem; height: 2rem; border-radius: 50%;
          color: rgba(255,255,255,.88);
          background: linear-gradient(145deg, rgba(255,255,255,.1), rgba(255,255,255,.03));
          border: 1px solid rgba(255,255,255,.12);
          box-shadow: inset 0 1px 0 rgba(255,255,255,.12);
          transition: transform .2s ease, background .2s ease;
        }
        .gc-circle:active { transform: scale(.92); }
        .gc-circle svg { width: 14px; height: 14px; }
        .gc-sheet-body {
          flex: 1; min-height: 0; overflow-y: auto; overscroll-behavior: contain;
          -webkit-overflow-scrolling: touch;
        }

        /* download sheet */
        .gc-dl { display: flex; flex-direction: column; gap: .55rem; padding: 0 1rem 1rem; }
        .gc-hero {
          display: flex; align-items: center; gap: .75rem; padding: .8rem;
          border-radius: 1.1rem;
          background:
            radial-gradient(90% 120% at 100% 100%, rgba(61,220,132,.16), transparent 62%),
            linear-gradient(135deg, rgba(255,255,255,.075), rgba(255,255,255,.02));
          border: 1px solid rgba(61,220,132,.16);
          box-shadow: inset 0 1px 0 rgba(255,255,255,.1);
        }
        .gc-hero-ic {
          flex: none; display: grid; place-items: center; width: 2.8rem; height: 2.8rem; border-radius: .9rem;
          background: #07130c; border: 1px solid rgba(61,220,132,.35);
          box-shadow: 0 0 0 3px rgba(61,220,132,.08), 0 8px 18px -8px rgba(61,220,132,.6);
        }
        .gc-hero-ic svg { width: 1.8rem; height: 1.8rem; }
        .gc-hero b { display: block; font-size: 13px; font-weight: 600; }
        .gc-hero p { margin: .2rem 0 0; font-size: 10.5px; line-height: 1.5; color: rgba(255,255,255,.58); }
        .gc-row {
          display: flex; align-items: center; gap: .65rem; min-height: 2.6rem;
          padding: .28rem .85rem .28rem .35rem; border-radius: 999px;
          font-size: 11.5px; font-weight: 500; line-height: 1.35; color: rgba(255,255,255,.9);
          background: linear-gradient(145deg, rgba(255,255,255,.065), rgba(255,255,255,.025));
          border: 1px solid rgba(255,255,255,.075);
          box-shadow: inset 0 1px 0 rgba(255,255,255,.07);
        }
        .gc-ri {
          flex: none; display: grid; place-items: center; width: 1.95rem; height: 1.95rem; border-radius: 50%;
          color: #86efac; background: rgba(61,220,132,.08); border: 1px solid rgba(61,220,132,.25);
        }
        .gc-ri svg { width: 14px; height: 14px; }
        .gc-note {
          padding: .65rem .85rem; border-radius: 1rem;
          background: rgba(255,255,255,.05); border: 1px solid rgba(255,255,255,.08);
        }
        .gc-note b { display: flex; align-items: center; gap: .4rem; font-size: 11px; font-weight: 600; }
        .gc-note b svg { width: 13px; height: 13px; color: #86efac; }
        .gc-note ol { margin: .4rem 0 0; padding-left: 1.1rem; font-size: 10.5px; line-height: 1.6; color: rgba(255,255,255,.62); }
        .gc-note ol li::marker { color: #86efac; font-weight: 700; }
        .gc-note ol em { font-style: normal; font-weight: 600; color: #fff; }
        .gc-btn-lg { width: 100%; height: 2.9rem; border-radius: 1rem; font-size: 13px; margin-top: .25rem; }

        /* tutorial sheet */
        .gc-amb { position: relative; overflow: hidden; isolation: isolate; padding-bottom: 1rem; }
        .gc-amb-bg { position: absolute; inset: 0; z-index: -1; background: #0c0d0a; overflow: hidden; }
        .gc-amb-bg::after {
          content: ""; position: absolute; inset: 0;
          background: linear-gradient(180deg, rgba(12,13,10,.1) 0%, rgba(12,13,10,.5) 55%, rgba(12,13,10,.88) 100%);
        }
        .gc-amb-l {
          position: absolute; inset: -30%;
          background-size: cover; background-position: center;
          filter: blur(22px) saturate(1.9) brightness(.9);
          opacity: 0;
          animation:
            gc-amb-fade 12s linear var(--d, 0s) infinite,
            gc-amb-drift 9s ease-in-out infinite alternate;
        }
        @keyframes gc-amb-fade {
          0% { opacity: 0; }
          12% { opacity: .85; }
          33% { opacity: .85; }
          45% { opacity: 0; }
          100% { opacity: 0; }
        }
        @keyframes gc-amb-drift {
          from { transform: translate3d(-4%, -3%, 0) scale(1.15); }
          to { transform: translate3d(4%, 3%, 0) scale(1.35); }
        }
        .gc-vid {
          width: 100%; aspect-ratio: 16 / 9; background: #000;
          box-shadow: 0 12px 40px -10px rgba(0,0,0,.85);
        }
        .gc-vid iframe { display: block; width: 100%; height: 100%; border: 0; }
        .gc-info { padding: .85rem 1rem 0; }
        .gc-vt { margin: 0; font-size: 14px; font-weight: 700; line-height: 1.3; text-transform: none; }
        .gc-ch { display: flex; align-items: center; gap: .5rem; margin: .5rem 0; font-size: 11px; color: rgba(255,255,255,.75); }
        .gc-ch .gc-chip { width: 1.5rem; height: 1.5rem; border-radius: 50%; background: #07090d; }
        .gc-ch .gc-chip svg, .gc-ch .gc-chip .gc-mvbd-img { width: 1.5rem; height: 1.5rem; }
        .gc-desc {
          margin: 0; padding: .6rem .75rem; border-radius: .85rem;
          font-size: 11px; line-height: 1.55; color: rgba(255,255,255,.78);
          background: rgba(255,255,255,.1); border: 1px solid rgba(255,255,255,.08);
        }
        .gc-acts { display: grid; grid-template-columns: 1fr 1fr; gap: .6rem; padding: .8rem 1rem 0; }
        .gc-act { height: 2.7rem; border-radius: .95rem; font-size: 12px; width: 100%; }

        @media (prefers-reduced-motion: reduce) {
          .gc-orbit { animation: none; }
          .category-btn.active .gc-tb.ld,
          .liquid-glass-category.active { animation: none !important; }
          .gc-amb-l { animation: none; }
          .gc-amb-l:first-child { opacity: .6; }
          .gc-sheet, .gc-sheet-bd { transition-duration: .01ms; }
        }
`

export { normalizeLanguage, isSeries }

export default function GenreCategories({
  genres,
  selectedGenre,
  onGenreSelect,
  showAdultContent = false,
  selectedYear = "All",
  selectedRating = "All",
  selectedLanguage = "All",
  selectedType = "All",
  onFilterChange,
  items = movies,
}: GenreCategoriesProps) {
  const [activeModal, setActiveModal] = useState<AppModal>(null)
  const [openFilter, setOpenFilter] = useState<FilterType>(null)
  const filterBarRef = useRef<HTMLDivElement>(null)
  const scrollerRef = useRef<HTMLDivElement>(null)
  const mouseDrag = useRef({ down: false, startX: 0, left: 0, moved: false })
  const [dragging, setDragging] = useState(false)

  const closeModal = useCallback(() => setActiveModal(null), [])

  /* Parent er onGenreSelect function protibar notun hole-o category button
     gulo abar render hobe na — tai ref diye stable callback */
  const onGenreSelectRef = useRef(onGenreSelect)
  useEffect(() => {
    onGenreSelectRef.current = onGenreSelect
  }, [onGenreSelect])
  const handleCategorySelect = useCallback((genre: string | null) => {
    onGenreSelectRef.current(genre)
  }, [])

  /* Selected category ta scroll kore majhkhane niye ashe */
  useEffect(() => {
    const sc = scrollerRef.current
    if (!sc) return
    const el = sc.querySelector<HTMLElement>(".category-btn.active")
    if (!el) return
    sc.scrollTo({
      left: el.offsetLeft - (sc.clientWidth - el.offsetWidth) / 2,
      behavior: "smooth",
    })
  }, [selectedGenre])

  /* Desktop e mouse diye drag kore scroll */
  const onScrollerPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== "mouse" || !scrollerRef.current) return
    const d = mouseDrag.current
    d.down = true
    d.moved = false
    d.startX = e.clientX
    d.left = scrollerRef.current.scrollLeft
  }
  const onScrollerPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const d = mouseDrag.current
    if (!d.down || !scrollerRef.current) return
    const dx = e.clientX - d.startX
    if (!d.moved && Math.abs(dx) > 5) {
      d.moved = true
      setDragging(true)
    }
    if (d.moved) scrollerRef.current.scrollLeft = d.left - dx
  }
  const endScrollerDrag = () => {
    mouseDrag.current.down = false
    if (dragging) setDragging(false)
  }

  const availableYears = useMemo(() => {
    const years = new Set<string>()
    items.forEach((m) => {
      const y = m.year != null ? String(m.year).trim() : ""
      if (/^\d{4}$/.test(y)) years.add(y)
    })
    return Array.from(years).sort((a, b) => parseInt(b) - parseInt(a))
  }, [items])

  const availableLanguages = useMemo(() => {
    const langs = new Set<string>()
    items.forEach((m) => {
      if (m.language) {
        langs.add(normalizeLanguage(String(m.language)))
      }
    })
    return Array.from(langs).sort()
  }, [items])

  /* ✅ Genre selector: movie-data এর সব movie থেকে unique genre বের করা হয় */
  const availableGenres = useMemo(() => {
    const variants = new Map<string, Map<string, number>>()

    const add = (name: string, weight: number) => {
      const key = name.toLowerCase()
      if (!variants.has(key)) variants.set(key, new Map())
      const m = variants.get(key)!
      m.set(name, (m.get(name) || 0) + weight)
    }

    genres.filter((g) => g !== "All").forEach((g) => add(g, 100000))

    items.forEach((m) => {
      if (!m.genre) return
      String(m.genre)
        .split("|")
        .forEach((raw) => {
          const g = raw.trim()
          if (g) add(g, 1)
        })
    })

    const result: string[] = []
    variants.forEach((m) => {
      let best = ""
      let bestCount = -1
      m.forEach((count, name) => {
        if (count > bestCount) {
          best = name
          bestCount = count
        }
      })
      result.push(best)
    })

    return result.sort((a, b) =>
      a.toLowerCase().localeCompare(b.toLowerCase())
    )
  }, [genres, items])

  /* Dropdown khola thakle: baire click / Esc dile bondho */
  useEffect(() => {
    if (!openFilter) return

    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (
        filterBarRef.current &&
        !filterBarRef.current.contains(e.target as Node)
      ) {
        setOpenFilter(null)
      }
    }

    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpenFilter(null)
    }

    document.addEventListener("mousedown", handleClickOutside)
    document.addEventListener("touchstart", handleClickOutside, { passive: true })
    document.addEventListener("keydown", handleEsc)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
      document.removeEventListener("touchstart", handleClickOutside)
      document.removeEventListener("keydown", handleEsc)
    }
  }, [openFilter])

  const handleFilterSelect = (type: SelectorType, value: string) => {
    if (type === "genre") {
      onGenreSelect(value === "All" ? null : value)
    } else if (type !== "platform") {
      onFilterChange?.({ [type]: value })
    }
    setOpenFilter(null)
  }

  const getFilterLabel = (type: SelectorType, value: string) => {
    if (type === "year") return value === "All" ? "Year" : value
    if (type === "rating") return value === "All" ? "Rating" : `${value}+`
    if (type === "language") return value === "All" ? "Language" : value
    if (type === "type") return value === "All" ? "Type" : value
    if (type === "genre") return value === "All" ? "Genre" : value
    if (type === "platform") return "Platforms"
    return value
  }

  const getOptions = (type: SelectorType) => {
    if (type === "year") return ["All", ...availableYears]
    if (type === "rating") return ["All", ...availableRatings]
    if (type === "language") return ["All", ...availableLanguages]
    if (type === "type") return availableTypes
    if (type === "genre") return ["All", ...availableGenres]
    return []
  }

  const getSelectedValue = (type: SelectorType) => {
    if (type === "year") return selectedYear
    if (type === "rating") return selectedRating
    if (type === "language") return selectedLanguage
    if (type === "type") return selectedType
    if (type === "genre") return selectedGenre ?? "All"
    return "All"
  }

  const categoryList = useMemo(
    () => genres.filter((g) => g !== "All"),
    [genres]
  )

  const categoryImages = useMemo(
    () => categoryList.map((g) => getCategoryImage(g)),
    [categoryList]
  )

  return (
    <div className="gc-root bg-black/30 backdrop-blur-lg border-b border-white/10 px-4 py-6">
      <style>{STYLES}</style>

      <div className="max-w-7xl mx-auto">
        <h2 className="gc-h2 text-white font-bold text-lg mb-2 md:text-center">
          Categories
        </h2>

        {/* ✅ Side by side categories — dane/bame freely scroll */}
        <div
          ref={scrollerRef}
          className={`category-scroller${dragging ? " dragging" : ""}`}
          onPointerDown={onScrollerPointerDown}
          onPointerMove={onScrollerPointerMove}
          onPointerUp={endScrollerDrag}
          onPointerLeave={endScrollerDrag}
          onClickCapture={(e) => {
            if (mouseDrag.current.moved) {
              e.preventDefault()
              e.stopPropagation()
              mouseDrag.current.moved = false
            }
          }}
        >
          <CategoryButton
            genre={null}
            image={CATEGORY_IMAGES.all}
            active={selectedGenre === null}
            onSelect={handleCategorySelect}
          />
          {categoryList.map((genre, idx) => (
            <CategoryButton
              key={genre}
              genre={genre}
              image={categoryImages[idx]}
              active={selectedGenre === genre}
              onSelect={handleCategorySelect}
            />
          ))}
        </div>

        {/* ✅ 3D CTA buttons (choto) */}
        <div className="gc-cta-row">
          <button
            type="button"
            onClick={() => setActiveModal("tutorial")}
            className="gc-3d gc-red gc-mini"
          >
            <span className="gc-chip">
              <YouTubeLogo />
            </span>
            <span className="gc-ct">mvbd mini app tutorial</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveModal("download")}
            className="gc-3d gc-green gc-mini"
          >
            <span className="gc-chip dk">
              <AndroidLogo />
            </span>
            <span className="gc-ct">download app for better experience</span>
          </button>
        </div>

        {/* ========================================================= */}
        {/* ✅ Selectors: Year, Rating, Language, Type + Genre, Platforms */}
        {/* ========================================================= */}
        <div ref={filterBarRef} className="mt-5 filter-grid">
          {selectorTypes.map((type, idx) => {
            const selectedValue = getSelectedValue(type)
            const hasValue = type !== "platform" && selectedValue !== "All"
            const isOpen = openFilter === type

            // dropdown কোন দিকে খুলবে: বাম কলাম → বাম, ডান কলাম → ডান, মাঝের → center
            const col = idx % 3
            const alignClass =
              col === 0
                ? "left-0"
                : col === 2
                  ? "right-0"
                  : "left-0 right-0 mx-auto"

            return (
              <div key={type} className="relative">
                <button
                  type="button"
                  onClick={() => setOpenFilter(isOpen ? null : type)}
                  className={`filter-selector-btn w-full px-3 py-2 md:px-4 md:py-2.5 text-xs md:text-sm font-semibold flex items-center gap-1.5 md:gap-2 md:min-w-[130px] justify-between ${
                    isOpen ? "active" : hasValue ? "has-value" : ""
                  }`}
                >
                  <span className="truncate capitalize">
                    {getFilterLabel(type, selectedValue)}
                  </span>
                  <ChevronDown
                    className={`w-3.5 h-3.5 md:w-4 md:h-4 flex-shrink-0 transition-transform duration-300 ${
                      isOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {isOpen && (
                  <div
                    className={`filter-dropdown absolute bottom-full mb-2 w-48 md:w-56 max-h-72 overflow-y-auto rounded-xl border border-white/20 bg-slate-950/95 shadow-2xl z-[100] ${alignClass}`}
                    style={{
                      scrollbarWidth: "thin",
                      scrollbarColor: "rgba(100,200,255,0.4) transparent",
                    }}
                  >
                    {type === "platform" ? (
                      <div className="py-1.5">
                        {platformItems.map((item, i) => (
                          <a
                            key={item.platform}
                            href={item.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={() => setOpenFilter(null)}
                            aria-label={`Visit MVBD on ${item.label}`}
                            className={`filter-item-anim platform-item platform-${item.platform}`}
                            style={{ animationDelay: `${i * 30}ms` }}
                          >
                            <span
                              className="platform-icon-box"
                              style={{ color: item.color }}
                            >
                              <PlatformIcon platform={item.platform} />
                            </span>
                            <span
                              className="text-sm font-semibold"
                              style={{ color: item.color }}
                            >
                              {item.label}
                            </span>
                          </a>
                        ))}
                      </div>
                    ) : (
                      <div className="py-1.5">
                        {getOptions(type).map((option, i) => {
                          const isSelected = selectedValue === option
                          return (
                            <button
                              key={option}
                              type="button"
                              onClick={() => handleFilterSelect(type, option)}
                              className={`filter-item-anim w-full text-left px-4 py-2.5 text-sm font-medium transition-colors ${
                                type === "genre" ? "capitalize" : ""
                              } ${
                                isSelected
                                  ? "bg-cyan-500/20 text-cyan-200"
                                  : "text-slate-300 hover:bg-white/10 hover:text-white"
                              }`}
                              style={{
                                animationDelay: `${Math.min(i, 15) * 20}ms`,
                              }}
                            >
                              {option === "All"
                                ? "All"
                                : type === "rating"
                                  ? `${option}+`
                                  : option}
                              {isSelected && (
                                <span className="ml-2 text-cyan-400">✓</span>
                              )}
                            </button>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* ========================================================= */}
      {/* ✅ Tutorial / Download — niche theke uthbe (iPhone style)   */}
      {/* ========================================================= */}
      {activeModal && typeof document !== "undefined" &&
        createPortal(
          activeModal === "tutorial" ? (
            <BottomSheet
              key="tutorial"
              kicker="Watch & learn"
              title="Tutorial"
              onClosed={closeModal}
            >
              <div className="gc-amb">
                {/* YouTube ambient mode er moto — video onujay rong bodlay */}
                <div className="gc-amb-bg" aria-hidden="true">
                  {[1, 2, 3].map((n) => (
                    <span
                      key={n}
                      className="gc-amb-l"
                      style={
                        {
                          backgroundImage: `url(https://i.ytimg.com/vi/${tutorialVideoId}/${n}.jpg)`,
                          "--d": `${(n - 1) * 4}s`,
                        } as React.CSSProperties
                      }
                    />
                  ))}
                </div>

                <div className="gc-vid">
                  <iframe
                    src={`https://www.youtube.com/embed/${tutorialVideoId}?autoplay=1&rel=0&playsinline=1&modestbranding=1`}
                    title="MVBD Mini App tutorial"
                    allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
                    allowFullScreen
                  />
                </div>

                <div className="gc-info">
                  <h3 className="gc-vt">mvbd mini app tutorial</h3>
                  <div className="gc-ch">
                    <span className="gc-chip mv">
                      <MvbdIcon />
                    </span>
                    <span>Movies Verse BD</span>
                  </div>
                  <p className="gc-desc">
                    ভিডিওটি দেখে অ্যাপটি আরও সহজে ব্যবহার করুন।
                  </p>
                </div>

                <div className="gc-acts">
                  <a
                    href={requestGroupUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="gc-3d gc-blue gc-act"
                  >
                    <span className="gc-chip mv">
                      <MvbdIcon />
                    </span>
                    <span>Request Group</span>
                  </a>
                  <a
                    href={youtubeChannelUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="gc-3d gc-red gc-act"
                  >
                    <span className="gc-chip">
                      <YouTubeLogo />
                    </span>
                    <span>YouTube</span>
                  </a>
                </div>
              </div>
            </BottomSheet>
          ) : (
            <BottomSheet
              key="download"
              kicker="Android app"
              title="Download app"
              onClosed={closeModal}
            >
              <div className="gc-dl">
                <div className="gc-hero">
                  <span className="gc-hero-ic">
                    <AndroidLogo />
                  </span>
                  <div className="min-w-0">
                    <b>MVBD Mini App</b>
                    <p>
                      অ্যাপ ব্যবহার করলে মুভি ব্রাউজিং হবে আরও দ্রুত ও সুবিধাজনক।
                    </p>
                  </div>
                </div>

                <div className="gc-row">
                  <span className="gc-ri">
                    <Film />
                  </span>
                  <span>দ্রুত ও সহজে মুভি এবং সিরিজ খুঁজে দেখুন</span>
                </div>
                <div className="gc-row">
                  <span className="gc-ri">
                    <Smartphone />
                  </span>
                  <span>মোবাইলের জন্য তৈরি স্মুথ অ্যাপ অভিজ্ঞতা</span>
                </div>
                <div className="gc-row">
                  <span className="gc-ri">
                    <Zap />
                  </span>
                  <span>স্মুথ নেভিগেশন ও আরও ভালো অভিজ্ঞতা</span>
                </div>

                <div className="gc-note">
                  <b>
                    <Info />
                    কীভাবে ডাউনলোড করবেন
                  </b>
                  <ol>
                    <li>
                      <em>Chrome browser</em> এ যান
                    </li>
                    <li>
                      <em>mvbds.xyz</em> থেকে আমাদের সাইটে প্রবেশ করুন
                    </li>
                    <li>
                      <em>Download</em> বাটনে ক্লিক করলেই ডিরেক্ট ডাউনলোড হবে
                    </li>
                  </ol>
                </div>

                <a
                  href={apkDownloadUrl}
                  download
                  className="gc-3d gc-green gc-btn-lg"
                >
                  <span className="gc-chip dk">
                    <AndroidLogo />
                  </span>
                  <span>Download Now</span>
                </a>
              </div>
            </BottomSheet>
          ),
          document.body,
        )}
    </div>
  )
}
