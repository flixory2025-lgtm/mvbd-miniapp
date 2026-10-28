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
import { ChevronDown } from "lucide-react"
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

/* =========================================================
   CATEGORY TILE BACKGROUNDS
   ---------------------------------------------------------
   Category button er bhitorer image. Key = genre er normalised
   naam (choto hater, special character chhara).
   (নিচের animated stage ta puro bad — tai shudhu image ta rakha holo)
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
   (Prothome false e ache — test kore dekho, thik thakle true koro)
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

/* ✅ YouTube + Android official-style logos (CTA button background) */
function YouTubeLogo() {
  return (
    <svg viewBox="0 0 24 24" className="gc-bgi" aria-hidden="true">
      <rect x="1" y="4.5" width="22" height="15" rx="4.2" fill="#FF0000" />
      <path d="M9.8 8.7v6.6l5.7-3.3z" fill="#fff" />
    </svg>
  )
}

function AndroidLogo() {
  return (
    <svg viewBox="0 0 24 24" className="gc-bgi" aria-hidden="true">
      <path d="M4.6 15.2a7.4 7.4 0 0 1 14.8 0z" fill="#3DDC84" />
      <path
        d="M4.6 16.2h14.8v3.2a1.6 1.6 0 0 1-1.6 1.6H6.2a1.6 1.6 0 0 1-1.6-1.6z"
        fill="#3DDC84"
      />
      <path
        d="M8.2 6.2 6.6 3.6M15.8 6.2l1.6-2.6"
        stroke="#3DDC84"
        strokeWidth="1.3"
        strokeLinecap="round"
        fill="none"
      />
      <circle cx="9.4" cy="11.6" r=".95" fill="#04110a" />
      <circle cx="14.6" cy="11.6" r=".95" fill="#04110a" />
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

/* Ekta category button — memo kora, tai dropdown khulle/bondho hole
   (ba onno kono state bodlale) category gulo abar render hoy na */
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
   STYLES — component er baire, tai ekbar-i toiri hoy
========================================================= */
const STYLES = `
        @keyframes liquidGlassButtonZoom {
          0% { transform: scale(1); }
          50% { transform: scale(1.06); }
          100% { transform: scale(1); }
        }
        /* ⚡ backdrop-filter / transition:all soriye deya hoyeche (GPU lag er karon) */
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
           ✅ Category buttons grid
           Mobile: 6 কলামের grid → category = 2 কলাম (৩টা এক লাইনে),
                   CTA button (tutorial / download) = 3 কলাম (২টা এক লাইনে)
           Desktop: মাঝখানে (center) সাজানো
           ========================================================= */
        .category-grid {
          display: grid;
          grid-template-columns: repeat(6, minmax(0, 1fr));
          grid-auto-rows: auto;
          gap: 8px;
        }
        .category-grid > .category-btn { grid-column: span 2; }
        .category-grid > .category-btn.gc-cta { grid-column: span 3; }
        .gc-br { display: none; }
        .category-btn {
          width: 100%;
          min-height: 54px;
          padding: 6px 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          text-align: center;
          font-size: 12px;
          line-height: 1.25;
          text-transform: none;
          overflow-wrap: anywhere;
        }
        @media (min-width: 400px) {
          .category-btn { font-size: 13px; padding: 6px 8px; }
        }
        @media (min-width: 640px) {
          .category-grid { gap: 10px; }
          .category-btn { font-size: 14px; min-height: 52px; }
        }
        @media (min-width: 768px) {
          .category-grid {
            display: flex;
            flex-wrap: wrap;
            justify-content: center;
            gap: 12px;
          }
          .category-btn {
            width: auto;
            min-height: 0;
            padding: 8px 16px;
            font-size: 16px;
            line-height: 1.5;
          }
          .gc-br { display: block; flex-basis: 100%; height: 0; }
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

        /* ✅ CTA buttons: tutorial (YouTube) + download (Android) */
        .category-btn.gc-cta {
          min-height: 76px; justify-content: flex-start; text-align: left;
          padding: 10px 74px 10px 14px; font-size: 13px; font-weight: 600;
          line-height: 1.25; color: #fff; border-radius: 16px;
        }
        @media (min-width: 768px) {
          .category-btn.gc-cta { flex: 1 1 280px; max-width: 420px; width: auto; font-size: 15px; }
        }
        .gc-ct { position: relative; z-index: 1; text-shadow: 0 1px 6px #000; }
        .gc-cta .gc-bgi {
          position: absolute; right: -10px; top: 50%; width: 84px; height: 84px;
          transform: translateY(-50%) rotate(-8deg);
          filter: drop-shadow(0 0 14px var(--g));
          animation: gc-f 4s ease-in-out infinite;
        }
        .gc-cta::after {
          content: ""; position: absolute; inset: 0; pointer-events: none;
          background: linear-gradient(110deg, transparent 35%, #ffffff22 50%, transparent 65%);
          transform: translateX(-100%); animation: gc-s 4.2s infinite;
        }
        .category-btn.gc-yt, .category-btn.gc-yt:hover {
          --g: #ff0000aa; border-color: rgba(255,60,60,.4);
          background: radial-gradient(circle at 92% 50%, rgba(255,0,0,.42), transparent 58%), linear-gradient(135deg, #1f0608, #09090b 75%);
        }
        .category-btn.gc-an, .category-btn.gc-an:hover {
          --g: #3ddc84aa; border-color: rgba(61,220,132,.4);
          background: radial-gradient(circle at 92% 50%, rgba(61,220,132,.38), transparent 58%), linear-gradient(135deg, #04170d, #09090b 75%);
        }
        @keyframes gc-f { 50% { transform: translateY(-57%) rotate(-4deg); } }
        @keyframes gc-s { 60%, 100% { transform: translateX(100%); } }

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
        @media (prefers-reduced-motion: reduce) {
          .gc-orbit { animation: none; }
        }

        @media (prefers-reduced-motion: reduce) {
          .category-btn.active .gc-tb.ld, .gc-cta::after, .gc-cta .gc-bgi,
          .liquid-glass-category.active { animation: none !important; }
        }

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

  /* Parent er onGenreSelect function protibar notun hole-o category button
     gulo abar render hobe na — tai ref diye stable callback */
  const onGenreSelectRef = useRef(onGenreSelect)
  useEffect(() => {
    onGenreSelectRef.current = onGenreSelect
  }, [onGenreSelect])
  const handleCategorySelect = useCallback((genre: string | null) => {
    onGenreSelectRef.current(genre)
  }, [])

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

  /* ✅ Genre selector: movie-data এর সব movie থেকে unique genre বের করা হয়
     (genre গুলো "Action | Drama | bangla" এই format এ থাকে)
     - বড়/ছোট হাতের একই genre (Bangla / bangla) একবারই দেখাবে
     - উপরের Categories চিপে যে নামে আছে সেই নামটাই ব্যবহার হবে */
  const availableGenres = useMemo(() => {
    const variants = new Map<string, Map<string, number>>()

    const add = (name: string, weight: number) => {
      const key = name.toLowerCase()
      if (!variants.has(key)) variants.set(key, new Map())
      const m = variants.get(key)!
      m.set(name, (m.get(name) || 0) + weight)
    }

    // Categories এর নামগুলোকে বেশি গুরুত্ব দেওয়া হলো যেন নামের বানান একই থাকে
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

  /* Modal khola thakle: Esc dile bondho + page scroll lock */
  useEffect(() => {
    if (!activeModal) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setActiveModal(null)
    }

    document.addEventListener("keydown", handleKeyDown)
    document.body.style.overflow = "hidden"
    return () => {
      document.removeEventListener("keydown", handleKeyDown)
      document.body.style.overflow = ""
    }
  }, [activeModal])

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
        <h2 className="gc-h2 text-white font-bold text-lg mb-4 md:text-center">
          Categories
        </h2>

        <div className="category-grid">
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
          <span className="gc-br" aria-hidden="true" />
          <button
            type="button"
            onClick={() => setActiveModal("tutorial")}
            className={`${CATEGORY_BASE} gc-cta gc-yt`}
          >
            <YouTubeLogo />
            <span className="gc-ct">mvbd mini app tutorial</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveModal("download")}
            className={`${CATEGORY_BASE} gc-cta gc-an`}
          >
            <AndroidLogo />
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

      {/* Tutorial / Download Modal */}
      {activeModal && typeof document !== "undefined" &&
        createPortal(
          <div
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 p-4"
            role="presentation"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) setActiveModal(null)
            }}
          >
            <section
              role="dialog"
              aria-modal="true"
              aria-labelledby="app-feature-title"
              className="relative z-[10000] w-full max-w-2xl overflow-hidden rounded-2xl border border-white/20 bg-slate-950 text-white shadow-2xl ring-1 ring-black/40"
            >
              <button
                type="button"
                aria-label="Close popup"
                onClick={() => setActiveModal(null)}
                className="absolute right-3 top-3 z-10 rounded-full bg-black/60 px-3 py-1 text-2xl leading-none text-slate-200 transition hover:bg-white/15 hover:text-white"
              >
                ×
              </button>
              {activeModal === "tutorial" ? (
                <>
                  <div className="px-6 pb-4 pt-6 pr-14">
                    <h3 id="app-feature-title" className="text-xl font-bold text-balance">mvbd mini app tutorial</h3>
                    <p className="mt-1 text-sm text-slate-400">ভিডিওটি দেখে অ্যাপটি আরও সহজে ব্যবহার করুন।</p>
                  </div>
                  <div className="aspect-video w-full bg-black">
                    <iframe
                      className="h-full w-full"
                      src={`https://www.youtube.com/embed/${tutorialVideoId}?autoplay=1&rel=0`}
                      title="MVBD Mini App tutorial"
                      allow="autoplay; encrypted-media; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                </>
              ) : (
                <div className="px-6 pb-7 pt-8 pr-14">
                  <h3 id="app-feature-title" className="text-xl font-bold text-balance">Download app for better experience</h3>
                  <p className="mt-3 leading-6 text-slate-300">
                    MVBD Mini App ব্যবহার করলে মুভি ব্রাউজিং হবে আরও দ্রুত ও সুবিধাজনক। অ্যাপ থেকে সহজে মুভি খুঁজে পাবেন, স্মুথ নেভিগেশন উপভোগ করবেন এবং মোবাইলে আরও ভালো অভিজ্ঞতা পাবেন।
                  </p>
                  <ul className="mt-4 list-disc space-y-2 pl-5 leading-6 text-slate-400">
                    <li>দ্রুত ও সহজে মুভি এবং সিরিজ খুঁজে দেখুন</li>
                    <li>মোবাইলের জন্য তৈরি স্মুথ অ্যাপ অভিজ্ঞতা</li>
                    <li>অবশ্যই মিনি অ্যাপ টি ডাউনলোড করতে হলে আপনাকে chrome browser এ গিয়ে mvbds.xyz ওখান থেকে আমাদের সাইট এ প্রবেশ করে এরপর ডাউনলোড বাটন এ ক্লিক করলে ডিরেক্ট ডাউনলোড হবে।</li>
                  </ul>
                  <a
                    href={apkDownloadUrl}
                    download
                    className="mt-6 inline-flex rounded-lg bg-emerald-500 px-5 py-3 font-semibold text-slate-950 transition hover:bg-emerald-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300"
                  >
                    Download Now
                  </a>
                </div>
              )}
            </section>
          </div>,
          document.body,
        )}
    </div>
  )
      }
