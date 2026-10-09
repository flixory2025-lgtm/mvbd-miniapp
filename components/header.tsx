"use client"

import type React from "react"

import { useState, useRef, useMemo, useEffect } from "react"
import { Search, X, Clock, TrendingUp } from "lucide-react"
import { movies } from "@/lib/movie-data"
import { animes } from "@/lib/anime-data"
import { useAuth } from "@/components/auth-provider"
import {
  addToLocalHistory,
  cleanupExpiredHistory,
  getLocalHistory,
  removeFromLocalHistory,
  getTimeAgo,
  saveHistoryToFirestore,
  loadHistoryFromFirestore,
  type SearchHistoryItem,
  type HistoryScope,
} from "@/lib/search-history"

interface HeaderProps {
  onSearch: (query: string) => void
  searchQuery?: string
  pageType?: "home" | "anime" | "series"
  searchData?: Array<{
    title: string
    poster?: string
    id?: number
  }>
}

const TYPING_SUGGESTIONS_HOME = [
  "Search movies...",
  "Find web series...",
  "Trending now...",
  "Action movies...",
  "Drama series...",
  "Comedy shows...",
  "Sci-fi films...",
  "Horror movies...",
  "Romance dramas...",
  "Thriller series...",
]

const TYPING_SUGGESTIONS_ANIME = [
  "Search anime...",
  "Find manga...",
  "Action anime...",
  "Romance anime...",
  "Thriller anime...",
  "Comedy anime...",
  "School anime...",
  "Supernatural anime...",
  "Adventure anime...",
  "Fantasy anime...",
]

const TYPING_SUGGESTIONS_SERIES = [
  "Search series...",
  "Find seasons...",
  "Crime series...",
  "Drama series...",
  "Thriller series...",
  "Comedy series...",
  "Action series...",
  "Mystery series...",
  "Horror series...",
  "Romance series...",
]

export default function Header({
  onSearch,
  searchQuery = "",
  pageType = "home",
  searchData,
}: HeaderProps) {
  const [isFocused, setIsFocused] = useState(false)

  // ✅ Scroll ট্র্যাক করার জন্য স্টেট
  const [isScrolled, setIsScrolled] = useState(false)

  const [bubbles, setBubbles] = useState<
    Array<{ id: number; x: number; y: number }>
  >([])

  // Search history state
  const [history, setHistory] = useState<SearchHistoryItem[]>([])

  const bubbleIdRef = useRef(0)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const { user } = useAuth()

  // History scope based on pageType (separate history for anime/home)
  const historyScope: HistoryScope = pageType === "anime" ? "anime" : "home"

  // Search data - anime page e shudhu anime, home page e movies + series
  const dataSource = useMemo(() => {
    if (searchData) return searchData
    if (pageType === "anime") return animes
    if (pageType === "series") {
      return movies.filter((m) => m.title.toLowerCase().includes("season"))
    }
    // Home page: movies + series একসাথে
    const seriesMovies = movies.filter((m) =>
      m.title.toLowerCase().includes("season")
    )
    const combined = [...movies]
    seriesMovies.forEach((s) => {
      if (!combined.find((m) => m.title === s.title)) {
        combined.push(s)
      }
    })
    return combined
  }, [pageType, searchData])

  // Smart search suggestions — word by word match, latest (highest id) upore
  const allSearchSuggestions = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    if (!query) return []

    const queryWords = query.split(/\s+/).filter(Boolean)

    const matches = dataSource.filter((item) => {
      const title = String(item.title || "").toLowerCase()
      return queryWords.every((word) => title.includes(word))
    })

    return [...matches].sort((a, b) => {
      const idA = typeof a.id === "number" ? a.id : 0
      const idB = typeof b.id === "number" ? b.id : 0
      return idB - idA
    })
  }, [searchQuery, dataSource])

  // Load history on mount (scope onujayi separate)
  useEffect(() => {
    cleanupExpiredHistory(historyScope)
    setHistory(getLocalHistory(historyScope))
  }, [historyScope])

  // Auto cleanup — every 1 hour
  useEffect(() => {
    const interval = setInterval(() => {
      cleanupExpiredHistory(historyScope)
      setHistory(getLocalHistory(historyScope))
    }, 60 * 60 * 1000)

    return () => clearInterval(interval)
  }, [historyScope])

  // ✅ Scroll ট্র্যাক করার জন্য (Header Transparent ↔ Solid)
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setIsScrolled(true)
      } else {
        setIsScrolled(false)
      }
    }

    handleScroll() // পেজ লোড হওয়ার সময় একবার চেক
    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  // When user logs in, sync Firestore history
  useEffect(() => {
    if (!user?.uid) return

    let cancelled = false

    async function syncFirestore() {
      try {
        const remoteHistory = await loadHistoryFromFirestore(
          user!.uid,
          historyScope
        )
        if (cancelled) return

        const local = getLocalHistory(historyScope)
        const combined = [...remoteHistory, ...local]

        const seen = new Set<string>()
        const merged: SearchHistoryItem[] = []

        for (const item of combined) {
          const key = item.query.toLowerCase()
          if (seen.has(key)) continue
          seen.add(key)
          merged.push(item)
          if (merged.length >= 8) break
        }

        merged.sort((a, b) => b.timestamp - a.timestamp)

        setHistory(merged)

        await saveHistoryToFirestore(
          user!.uid,
          merged,
          (user as any)?.displayName || undefined,
          historyScope
        )
      } catch (err) {
        console.error("Firestore sync failed:", err)
      }
    }

    syncFirestore()

    return () => {
      cancelled = true
    }
  }, [user?.uid, historyScope])

  // Click outside → close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node)
      ) {
        setIsFocused(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  // Save history (scope onujayi separate)
  const saveSearchToHistory = async (query: string) => {
    const trimmed = query.trim()
    if (!trimmed) return

    const updated = addToLocalHistory(trimmed, historyScope)
    setHistory(updated)

    if (user?.uid) {
      try {
        await saveHistoryToFirestore(
          user.uid,
          updated,
          (user as any)?.displayName || undefined,
          historyScope
        )
      } catch (err) {
        console.error("Firestore save failed:", err)
      }
    }
  }

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    onSearch(e.target.value)
  }

  const handleClearSearch = () => {
    onSearch("")
    setIsFocused(false)
    inputRef.current?.focus()
  }

  const handleSubmitSearch = (query: string) => {
    const trimmed = query.trim()
    if (!trimmed) return

    saveSearchToHistory(trimmed)
    onSearch(trimmed)
    setIsFocused(false)
  }

  const handleRemoveHistory = async (
    item: SearchHistoryItem,
    e: React.MouseEvent
  ) => {
    e.stopPropagation()
    e.preventDefault()

    const updated = removeFromLocalHistory(item.query, historyScope)
    setHistory(updated)

    if (user?.uid) {
      try {
        await saveHistoryToFirestore(
          user.uid,
          updated,
          (user as any)?.displayName || undefined,
          historyScope
        )
      } catch {}
    }
  }

  const createBubbles = () => {
    if (!isFocused) return

    const newBubbles = []

    for (let i = 0; i < 3; i++) {
      const id = bubbleIdRef.current++
      const x = Math.random() * 20 - 10
      const y = Math.random() * 10

      newBubbles.push({ id, x, y })

      setTimeout(() => {
        setBubbles((prev) => prev.filter((b) => b.id !== id))
      }, 800)
    }

    setBubbles((prev) => [...prev, ...newBubbles])
  }

  // Determine current suggestions array based on pageType
  const TYPING_SUGGESTIONS =
    pageType === "anime"
      ? TYPING_SUGGESTIONS_ANIME
      : pageType === "series"
        ? TYPING_SUGGESTIONS_SERIES
        : TYPING_SUGGESTIONS_HOME

  // Extract first 4 items for the cube faces
  const cubeTexts = TYPING_SUGGESTIONS.slice(0, 4)

  const hasQuery = searchQuery.trim().length > 0
  const showHistoryDropdown = isFocused && !hasQuery && history.length > 0
  const showSuggestionsDropdown = isFocused && hasQuery
  const showCube = !isFocused && !hasQuery

  return (
    // ✅ FIXED HEADER — Transparent at top, Solid on scroll
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ease-in-out ${
        isScrolled
          ? "bg-black/60 backdrop-blur-xl border-b border-white/10 shadow-lg"
          : "bg-transparent border-b border-transparent shadow-none"
      }`}
    >
      <style>{`
        @keyframes liquidGlassZoom {
          0% { transform: scale(1); background: rgba(255,255,255,.05); backdrop-filter: blur(20px); }
          50% { transform: scale(1.03); background: rgba(255,255,255,.08); backdrop-filter: blur(25px); }
          100% { transform: scale(1.06); background: rgba(255,255,255,.1); backdrop-filter: blur(30px); }
        }
        @keyframes liquidGlassGlow {
          0% { box-shadow: 0 0 0 0 rgba(100,200,255,.3), inset 0 0 20px rgba(255,255,255,.1); }
          50% { box-shadow: 0 0 15px 5px rgba(100,200,255,.2), inset 0 0 30px rgba(255,255,255,.15); }
          100% { box-shadow: 0 0 25px 10px rgba(100,200,255,.1), inset 0 0 40px rgba(255,255,255,.2); }
        }
        .liquid-glass-search {
          background: rgba(255,255,255,.05);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255,255,255,.2);
          transition: all .3s ease;
          cursor: text;
        }
        .liquid-glass-search:focus-within {
          background: rgba(255,255,255,.08);
          backdrop-filter: blur(30px);
          border: 1px solid rgba(100,200,255,.4);
          animation: liquidGlassZoom .6s ease-out forwards, liquidGlassGlow .6s ease-out;
        }
        .search-input-liquid {
          background: transparent !important;
          border: none !important;
          outline: none !important;
          width: 100%;
          height: 100%;
          color: #ffffff !important;
          caret-color: #64c8ff;
          font-size: 14px;
          line-height: 20px;
          padding: 0;
          margin: 0;
          position: relative;
          z-index: 30;
        }
        .search-input-liquid::placeholder { color: rgba(255,255,255,.5); }
        .search-input-liquid:-webkit-autofill,
        .search-input-liquid:-webkit-autofill:hover,
        .search-input-liquid:-webkit-autofill:focus {
          -webkit-text-fill-color: #ffffff;
          -webkit-box-shadow: 0 0 0px 1000px rgba(20,20,30,.98) inset;
          transition: background-color 5000s ease-in-out 0s;
        }
        .search-suggestions {
          position: absolute;
          top: 100%;
          left: 0;
          right: 0;
          background: rgba(20,20,30,.98);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(100,200,255,.3);
          border-radius: 12px;
          margin-top: 8px;
          max-height: 400px;
          overflow-y: auto;
          z-index: 50;
          scrollbar-width: thin;
          scrollbar-color: rgba(100,200,255,.5) transparent;
        }
        .search-suggestions::-webkit-scrollbar { width: 6px; }
        .search-suggestions::-webkit-scrollbar-track { background: transparent; }
        .search-suggestions::-webkit-scrollbar-thumb { background: rgba(100,200,255,.5); border-radius: 3px; }
        .search-suggestion-item {
          padding: 10px 16px;
          cursor: pointer;
          transition: all .2s ease;
          border-bottom: 1px solid rgba(255,255,255,.05);
        }
        .search-suggestion-item:hover { background: rgba(100,200,255,.1); }
        .search-suggestion-item:last-child { border-bottom: none; }
        .dropdown-header {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 16px;
          border-bottom: 1px solid rgba(255,255,255,.08);
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: .05em;
          color: rgba(148,163,184,.9);
          font-weight: 600;
        }
        @keyframes liquidBubbleRise {
          0% { opacity: 1; transform: scale(1) translateY(0); filter: blur(0); }
          100% { opacity: 0; transform: scale(.2) translateY(-50px); filter: blur(2px); }
        }
        .liquid-bubble {
          animation: liquidBubbleRise .8s ease-out forwards;
          pointer-events: none;
        }

        /* ---- 3D CUBE ANIMATION CSS ---- */
        .cube-container {
          position: relative;
          flex: 1;
          height: 20px;
          min-width: 0;
        }
        .cube-wrapper {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          perspective: 800px;
          pointer-events: none;
        }
        .cube {
          position: absolute;
          width: 100%;
          height: 20px;
          transform-style: preserve-3d;
          animation: rotateCubeUp 25s infinite cubic-bezier(0.4, 0.0, 0.2, 1);
        }
        .cube-face {
          position: absolute;
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          color: rgba(255,255,255,.5);
          font-size: 14px;
          white-space: nowrap;
          backface-visibility: hidden;
          transform-origin: center center;
        }
        .face-1 { transform: rotateX(0deg) translateZ(10px); }
        .face-2 { transform: rotateX(90deg) translateZ(10px); }
        .face-3 { transform: rotateX(180deg) translateZ(10px); }
        .face-4 { transform: rotateX(270deg) translateZ(10px); }

        @keyframes rotateCubeUp {
          0%, 20% { transform: translateZ(-10px) rotateX(0deg); }
          25%, 45% { transform: translateZ(-10px) rotateX(90deg); }
          50%, 70% { transform: translateZ(-10px) rotateX(180deg); }
          75%, 95% { transform: translateZ(-10px) rotateX(270deg); }
          100% { transform: translateZ(-10px) rotateX(360deg); }
        }
      `}</style>

      <div className="px-4 py-4 flex items-center gap-4">
        {/* MVBD Logo */}
        <div className="flex-shrink-0">
          <img
            src="https://i.postimg.cc/0yqFXMFW/photo-2025-12-11-09-45-29-removebg-preview.png"
            alt="MVBD Logo"
            className="h-10 w-auto object-contain"
          />
        </div>

        {/* Search */}
        <div ref={wrapperRef} className="flex-1 relative">
          <div
            onClick={() => inputRef.current?.focus()}
            className={`liquid-glass-search rounded-2xl px-4 py-3 flex items-center gap-3 relative ${
              isFocused ? "search-focused" : ""
            } ${hasQuery ? "search-has-query" : ""}`}
          >
            <Search className="w-5 h-5 text-slate-300 flex-shrink-0 pointer-events-none" />

            {/* Input + Cube container */}
            <div className="cube-container">
              {/* Cube (only visible when not focused and no query) */}
              {showCube && (
                <div className="cube-wrapper">
                  <div className="cube">
                    {cubeTexts.map((text, index) => (
                      <div
                        key={index}
                        className={`cube-face face-${index + 1}`}
                      >
                        {text}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Input field — always visible, fully clickable */}
              <input
                ref={inputRef}
                type="text"
                placeholder=""
                value={searchQuery}
                onChange={handleSearch}
                onFocus={() => {
                  setIsFocused(true)
                  createBubbles()
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSubmitSearch(searchQuery)
                  if (e.key === "Escape") setIsFocused(false)
                }}
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck={false}
                className="search-input-liquid"
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  width: "100%",
                  height: "100%",
                  background: "transparent",
                  border: "none",
                  outline: "none",
                  color: "#ffffff",
                  caretColor: "#64c8ff",
                  fontSize: "14px",
                  lineHeight: "20px",
                  padding: 0,
                  margin: 0,
                  zIndex: 30,
                  pointerEvents: "auto",
                }}
              />
            </div>

            {searchQuery && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  handleClearSearch()
                }}
                className="text-slate-400 hover:text-white transition relative z-40"
                aria-label="Clear search"
              >
                <X className="w-4 h-4" />
              </button>
            )}

            {bubbles.map((bubble) => (
              <div
                key={bubble.id}
                className="liquid-bubble"
                style={{
                  width: "8px",
                  height: "8px",
                  left: `calc(50% + ${bubble.x}px)`,
                  top: `${bubble.y}px`,
                  position: "absolute",
                  borderRadius: "50%",
                  background:
                    "radial-gradient(circle at 30% 30%, rgba(100,200,255,.8), rgba(59,130,246,.3))",
                  border: "1px solid rgba(100,200,255,.5)",
                  boxShadow:
                    "0 0 8px rgba(100,200,255,.4), inset -2px -2px 4px rgba(0,0,0,.2)",
                }}
              />
            ))}
          </div>

          {/* HISTORY DROPDOWN */}
          {showHistoryDropdown && (
            <div className="search-suggestions">
              <div className="dropdown-header">
                <Clock className="w-3 h-3" />
                <span>সাম্প্রতিক সার্চ</span>
              </div>

              {history.map((item, idx) => (
                <div
                  key={`${item.query}-${item.timestamp}-${idx}`}
                  className="search-suggestion-item flex items-center gap-3 text-slate-200 group"
                  onMouseDown={(e) => {
                    e.preventDefault()
                    handleSubmitSearch(item.query)
                  }}
                >
                  <Clock className="w-4 h-4 flex-shrink-0 text-slate-500" />

                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white truncate">{item.query}</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">
                      {getTimeAgo(item.timestamp)}
                    </p>
                  </div>

                  <button
                    type="button"
                    onMouseDown={(e) => handleRemoveHistory(item, e)}
                    className="w-6 h-6 rounded-full hover:bg-white/10 text-slate-500 hover:text-white flex items-center justify-center transition opacity-0 group-hover:opacity-100"
                    aria-label="Remove"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* SUGGESTIONS DROPDOWN */}
          {showSuggestionsDropdown && (
            <div className="search-suggestions">
              {allSearchSuggestions.length > 0 ? (
                <>
                  <div className="dropdown-header">
                    <TrendingUp className="w-3 h-3" />
                    <span>সাজেশন</span>
                  </div>

                  {allSearchSuggestions.map((suggestion, idx) => (
                    <div
                      key={`${suggestion.title}-${suggestion.id ?? idx}`}
                      className="search-suggestion-item flex items-center gap-3 text-slate-200"
                      onMouseDown={(e) => {
                        e.preventDefault()
                        handleSubmitSearch(suggestion.title)
                      }}
                    >
                      {suggestion.poster ? (
                        <img
                          src={suggestion.poster}
                          alt=""
                          className="h-12 w-8 flex-shrink-0 rounded object-cover"
                        />
                      ) : (
                        <Search className="h-4 w-4 flex-shrink-0 text-slate-500" />
                      )}

                      <span className="text-sm">{suggestion.title}</span>
                    </div>
                  ))}
                </>
              ) : (
                <div className="search-suggestion-item text-slate-500 text-sm">
                  কোনো ফলাফল নেই
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
