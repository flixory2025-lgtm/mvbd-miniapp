"use client"

import { createPortal } from "react-dom"
import { useEffect, useState, useMemo, useRef } from "react"
import { ChevronDown, X } from "lucide-react"
import { movies } from "@/lib/movie-data"

interface GenreCategoriesProps {
  genres: string[]
  selectedGenre: string | null
  onGenreSelect: (genre: string | null) => void
  showAdultContent?: boolean
  // ✅ NEW: Filter props
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
type FilterType = "year" | "rating" | "language" | "type" | null

const tutorialVideoId = "fs9yrwNbvZs"
const apkDownloadUrl = "https://github.com/flixory2025-lgtm/mvbd-miniapp/releases/download/2.0.5v/MVBD.MINI.APP.apk"

// ✅ Language normalize function
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

// ✅ Type check: title এ "season" থাকলে Series
const isSeries = (title: string): boolean => {
  return /season|সিজন|season \d|part \d/i.test(title)
}

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

  // ✅ Years — data থেকে unique years, descending
  const availableYears = useMemo(() => {
    const years = new Set<string>()
    movies.forEach((m) => {
      if (m.year && /^\d{4}$/.test(m.year.trim())) {
        years.add(m.year.trim())
      }
    })
    return Array.from(years).sort((a, b) => parseInt(b) - parseInt(a))
  }, [])

  // ✅ Languages — normalize করে unique
  const availableLanguages = useMemo(() => {
    const langs = new Set<string>()
    movies.forEach((m) => {
      if (m.language) {
        langs.add(normalizeLanguage(m.language))
      }
    })
    return Array.from(langs).sort()
  }, [])

  // ✅ Rating options
  const availableRatings = ["2.0", "3.0", "4.0", "5.0", "6.0", "7.0", "8.0", "9.0"]

  // ✅ Type options
  const availableTypes = ["All", "Movie", "Series"]

  // ✅ Outside click এ popup close
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
    document.addEventListener("keydown", handleEsc)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
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

  // ✅ Filter select handler
  const handleFilterSelect = (
    type: "year" | "rating" | "language" | "type",
    value: string
  ) => {
    onFilterChange({ [type]: value })
    setOpenFilter(null)
  }

  // ✅ Filter label (button এ দেখানোর জন্য)
  const getFilterLabel = (
    type: "year" | "rating" | "language" | "type",
    value: string
  ) => {
    if (type === "year") return value === "All" ? "Year" : value
    if (type === "rating") return value === "All" ? "Rating" : `${value}+`
    if (type === "language") return value === "All" ? "Language" : value
    if (type === "type") return value === "All" ? "Type" : value
    return value
  }

  // ✅ Dropdown এর জন্য options
  const getOptions = (type: "year" | "rating" | "language" | "type") => {
    if (type === "year") return ["All", ...availableYears]
    if (type === "rating") return ["All", ...availableRatings]
    if (type === "language") return ["All", ...availableLanguages]
    if (type === "type") return availableTypes
    return []
  }

  // ✅ Selected value
  const getSelectedValue = (type: "year" | "rating" | "language" | "type") => {
    if (type === "year") return selectedYear
    if (type === "rating") return selectedRating
    if (type === "language") return selectedLanguage
    if (type === "type") return selectedType
    return "All"
  }

  const filterTypes: Array<"year" | "rating" | "language" | "type"> = [
    "year",
    "rating",
    "language",
    "type",
  ]

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

        /* ✅ Filter selector animations - NOW OPENS UPWARD */
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
      `}</style>

      <div className="max-w-7xl mx-auto">
        <h2 className="text-white font-bold text-lg mb-4">Categories</h2>
        <div className="flex gap-3 flex-wrap">
          <button
            onClick={() => onGenreSelect(null)}
            className={`liquid-glass-category px-4 py-2 font-medium transition relative overflow-hidden ${
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
                className={`liquid-glass-category px-4 py-2 font-medium transition relative overflow-hidden ${
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
            className="liquid-glass-category px-4 py-2 font-medium text-cyan-200 hover:text-cyan-100"
          >
            mvbd mini app tutorial
          </button>
          <button
            type="button"
            onClick={() => setActiveModal("download")}
            className="liquid-glass-category px-4 py-2 font-medium text-emerald-200 hover:text-emerald-100"
          >
            download app for better experience
          </button>
        </div>

        {/* ========================================================= */}
        {/* ✅ ৪টা Filter Selector — ডান corner থেকে বাম corner */}
        {/* ✅ Dropdown এখন উপরে open হবে (poster এর উপর পড়বে না) */}
        {/* ========================================================= */}
        <div
          ref={filterBarRef}
          className="mt-5 flex flex-wrap justify-end gap-2 md:gap-3"
        >
          {filterTypes.map((type) => {
            const selectedValue = getSelectedValue(type)
            const hasValue = selectedValue !== "All"
            const isOpen = openFilter === type

            return (
              <div key={type} className="relative">
                <button
                  type="button"
                  onClick={() => setOpenFilter(isOpen ? null : type)}
                  className={`filter-selector-btn px-3 py-2 md:px-4 md:py-2.5 text-xs md:text-sm font-semibold flex items-center gap-1.5 md:gap-2 min-w-[110px] md:min-w-[130px] justify-between ${
                    isOpen ? "active" : hasValue ? "has-value" : ""
                  }`}
                >
                  <span className="truncate">
                    {getFilterLabel(type, selectedValue)}
                  </span>
                  <ChevronDown
                    className={`w-3.5 h-3.5 md:w-4 md:h-4 flex-shrink-0 transition-transform duration-300 ${
                      isOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {/* ✅ Dropdown Popup — এখন bottom-full (উপরে open) */}
                {isOpen && (
                  <div
                    className="filter-dropdown absolute bottom-full right-0 mb-2 w-44 md:w-52 max-h-72 overflow-y-auto rounded-xl border border-white/20 bg-slate-950/95 backdrop-blur-2xl shadow-2xl z-[100]"
                    style={{
                      scrollbarWidth: "thin",
                      scrollbarColor: "rgba(100,200,255,0.4) transparent",
                    }}
                  >
                    <div className="py-1.5">
                      {getOptions(type).map((option, idx) => {
                        const isSelected = selectedValue === option
                        return (
                          <button
                            key={option}
                            type="button"
                            onClick={() =>
                              handleFilterSelect(type, option)
                            }
                            className={`filter-item-anim w-full text-left px-4 py-2.5 text-sm font-medium transition-colors ${
                              isSelected
                                ? "bg-cyan-500/20 text-cyan-200"
                                : "text-slate-300 hover:bg-white/10 hover:text-white"
                            }`}
                            style={{
                              animationDelay: `${idx * 20}ms`,
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
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* ========================================================= */}
      {/* Tutorial / Download Modal (unchanged) */}
      {/* ========================================================= */}
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
