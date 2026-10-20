"use client"

import { createPortal } from "react-dom"
import { useEffect, useState, useMemo, useRef } from "react"
import { ChevronDown } from "lucide-react"
import { movies } from "@/lib/movie-data"

interface GenreCategoriesProps {
  genres: string[]
  selectedGenre: string | null
  onGenreSelect: (genre: string | null) => void
  showAdultContent?: boolean
  selectedYear: string
  selectedRating: string
  selectedLanguage: string
  selectedType: string
  onFilterChange: (filters: {
    year?: string
    rating?: string
    language?: string
    type?: string
  }) => void
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

const tutorialVideoId = "fs9yrwNbvZs"
const apkDownloadUrl = "https://github.com/flixory2025-lgtm/mvbd-miniapp/releases/download/2.0.5v/MVBD.MINI.APP.apk"

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
    url: "https://youtube.com/@mvbdstudio?si=G0ZfaJ0N7Hr7fVzk",
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

export default function GenreCategories({
  genres,
  selectedGenre,
  onGenreSelect,
  showAdultContent = false,
  selectedYear,
  selectedRating,
  selectedLanguage,
  selectedType,
  onFilterChange,
}: GenreCategoriesProps) {
  const [activeModal, setActiveModal] = useState<AppModal>(null)
  const [openFilter, setOpenFilter] = useState<FilterType>(null)
  const filterBarRef = useRef<HTMLDivElement>(null)

  const availableYears = useMemo(() => {
    const years = new Set<string>()
    movies.forEach((m) => {
      if (m.year && /^\d{4}$/.test(m.year.trim())) {
        years.add(m.year.trim())
      }
    })
    return Array.from(years).sort((a, b) => parseInt(b) - parseInt(a))
  }, [])

  const availableLanguages = useMemo(() => {
    const langs = new Set<string>()
    movies.forEach((m) => {
      if (m.language) {
        langs.add(normalizeLanguage(m.language))
      }
    })
    return Array.from(langs).sort()
  }, [])

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

    movies.forEach((m) => {
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
  }, [genres])

  const availableRatings = ["2.0", "3.0", "4.0", "5.0", "6.0", "7.0", "8.0", "9.0"]
  const availableTypes = ["All", "Movie", "Series"]

  useEffect(() => {
    if (!openFilter) return

    const handleClickOutside = (e: MouseEvent) => {
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
    document.addEventListener("touchstart", handleClickOutside as any)
    document.addEventListener("keydown", handleEsc)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
      document.removeEventListener("touchstart", handleClickOutside as any)
      document.removeEventListener("keydown", handleEsc)
    }
  }, [openFilter])

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
      onFilterChange({ [type]: value })
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

  // Categories এর button গুলোর common class — সব একই সাইজ
  const categoryBase =
    "liquid-glass-category category-btn relative overflow-hidden font-medium transition"

  return (
    <div className="bg-black/30 backdrop-blur-lg border-b border-white/10 px-4 py-6">
      <style>{`
        @keyframes liquidGlassButtonZoom {
          0% { transform: scale(1); background: rgba(255, 255, 255, 0.05); backdrop-filter: blur(20px); }
          50% { transform: scale(1.05); background: rgba(255, 255, 255, 0.08); backdrop-filter: blur(25px); }
          100% { transform: scale(1.08); background: rgba(100, 200, 255, 0.1); backdrop-filter: blur(30px); }
        }
        .liquid-glass-category {
          background: rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.15);
          border-radius: 16px;
          transition: all 0.3s ease;
        }
        .liquid-glass-category:hover {
          background: rgba(255, 255, 255, 0.08);
          backdrop-filter: blur(25px);
          border: 1px solid rgba(255, 255, 255, 0.25);
          transform: scale(1.02);
        }
        .liquid-glass-category.active {
          background: rgba(100, 200, 255, 0.12);
          backdrop-filter: blur(30px);
          border: 1px solid rgba(100, 200, 255, 0.4);
          animation: liquidGlassButtonZoom 0.5s ease-out;
        }

        /* =========================================================
           ✅ Category buttons — সব সমান সাইজ
           Mobile / Mini App: সুন্দর grid (সব বাটন একই width + height)
           Desktop: মাঝখানে (center) সাজানো
           ========================================================= */
        .category-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          grid-auto-rows: 1fr;
          gap: 10px;
        }
        .category-btn {
          width: 100%;
          min-height: 48px;
          padding: 6px 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          text-align: center;
          font-size: 13px;
          line-height: 1.2;
          text-transform: none;
          word-break: break-word;
        }
        @media (min-width: 400px) {
          .category-btn { font-size: 14px; }
        }
        @media (min-width: 640px) {
          .category-grid {
            grid-template-columns: repeat(3, minmax(0, 1fr));
          }
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
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.15);
          border-radius: 12px;
          transition: all 0.3s ease;
          color: #cbd5e1;
        }
        .filter-selector-btn:hover {
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(100, 200, 255, 0.3);
          color: white;
        }
        .filter-selector-btn.active {
          background: rgba(100, 200, 255, 0.15);
          border: 1px solid rgba(100, 200, 255, 0.5);
          color: #93c5fd;
        }
        .filter-selector-btn.has-value {
          background: rgba(34, 197, 94, 0.12);
          border: 1px solid rgba(34, 197, 94, 0.4);
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
      `}</style>

      <div className="max-w-7xl mx-auto">
        <h2 className="text-white font-bold text-lg mb-4 md:text-center">
          Categories
        </h2>

        <div className="category-grid">
          <button
            onClick={() => onGenreSelect(null)}
            className={`${categoryBase} ${
              selectedGenre === null ? "active text-blue-200" : "text-slate-300"
            }`}
          >
            All
            {selectedGenre === null && <CategoryHighlight />}
          </button>
          {genres
            .filter((g) => g !== "All")
            .map((genre) => (
              <button
                key={genre}
                onClick={() => onGenreSelect(genre)}
                className={`${categoryBase} ${
                  selectedGenre === genre ? "active text-blue-200" : "text-slate-300"
                }`}
              >
                {genre}
                {selectedGenre === genre && <CategoryHighlight />}
              </button>
            ))}
          <button
            type="button"
            onClick={() => setActiveModal("tutorial")}
            className={`${categoryBase} text-cyan-200 hover:text-cyan-100`}
          >
            mvbd mini app tutorial
          </button>
          <button
            type="button"
            onClick={() => setActiveModal("download")}
            className={`${categoryBase} text-emerald-200 hover:text-emerald-100`}
          >
            download app for better experience
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
                    className={`filter-dropdown absolute bottom-full mb-2 w-48 md:w-56 max-h-72 overflow-y-auto rounded-xl border border-white/20 bg-slate-950/95 backdrop-blur-2xl shadow-2xl z-[100] ${alignClass}`}
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
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 p-4 backdrop-blur-xl"
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

function CategoryHighlight() {
  return (
    <div className="absolute inset-0 pointer-events-none">
      <div className="fire-continuous fire-continuous-1" />
      <div className="fire-continuous fire-continuous-2" />
      <div className="fire-continuous fire-continuous-3" />
      <div className="fire-continuous fire-continuous-4" />
      <div className="fire-continuous fire-continuous-5" />
    </div>
  )
                        }
