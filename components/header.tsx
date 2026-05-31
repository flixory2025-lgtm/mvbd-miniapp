"use client"

import type React from "react"

import { useState, useRef, useMemo, useEffect } from "react"
import { Search, X } from "lucide-react"
import { movies } from "@/lib/movie-data"
import { animes } from "@/lib/anime-data"

interface HeaderProps {
  onSearch: (query: string) => void
  pageType?: "home" | "anime" | "series"
  searchData?: Array<{ title: string }>
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

const TYPING_SPEED = 50 // ms per character
const DELETE_SPEED = 30 // ms per character
const PAUSE_DURATION = 2500 // ms to show complete text

export default function Header({ onSearch, pageType = "home", searchData }: HeaderProps) {
  const [searchInput, setSearchInput] = useState("")
  const [isFocused, setIsFocused] = useState(false)
  const [bubbles, setBubbles] = useState<Array<{ id: number; x: number; y: number }>>([])
  const [displayedPlaceholder, setDisplayedPlaceholder] = useState("")
  const [currentSuggestionIndex, setCurrentSuggestionIndex] = useState(0)
  const [isTyping, setIsTyping] = useState(true)
  const placeholderIndexRef = useRef(0)
  const placeholderTimeoutRef = useRef<NodeJS.Timeout>()
  const bubbleIdRef = useRef(0)

  // Select typing suggestions based on page type
  const TYPING_SUGGESTIONS =
    pageType === "anime" ? TYPING_SUGGESTIONS_ANIME :
    pageType === "series" ? TYPING_SUGGESTIONS_SERIES :
    TYPING_SUGGESTIONS_HOME

  // Select data source based on page type
  const dataSource = useMemo(() => {
    if (searchData) return searchData
    if (pageType === "anime") return animes
    if (pageType === "series") {
      return movies.filter((m) => m.title.toLowerCase().includes("season"))
    }
    return movies
  }, [pageType, searchData])

  const allSearchSuggestions = useMemo(() => {
    if (!searchInput.trim()) return []
    const query = searchInput.toLowerCase()
    return dataSource
      .filter((item) => item.title.toLowerCase().includes(query))
      .map((item) => item.title)
  }, [searchInput, dataSource])

  const searchSuggestions = allSearchSuggestions.slice(0, 5)

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setSearchInput(value)
    onSearch(value)
  }

  const createBubbles = () => {
    if (!isFocused) return
    const newBubbles = []
    for (let i = 0; i < 3; i++) {
      const id = bubbleIdRef.current++
      const x = Math.random() * 20 - 10
      newBubbles.push({ id, x, y: Math.random() * 10 })
      setTimeout(() => {
        setBubbles((prev) => prev.filter((b) => b.id !== id))
      }, 800)
    }
    setBubbles((prev) => [...prev, ...newBubbles])
  }

  const currentSuggestion = TYPING_SUGGESTIONS[currentSuggestionIndex]

  useEffect(() => {
    if (placeholderTimeoutRef.current) {
      clearTimeout(placeholderTimeoutRef.current)
    }

    if (isTyping) {
      if (displayedPlaceholder.length < currentSuggestion.length) {
        // Typing phase - add one character
        placeholderTimeoutRef.current = setTimeout(() => {
          setDisplayedPlaceholder(currentSuggestion.slice(0, displayedPlaceholder.length + 1))
        }, TYPING_SPEED)
      } else {
        // Typed complete - pause before deleting
        placeholderTimeoutRef.current = setTimeout(() => {
          setIsTyping(false)
        }, PAUSE_DURATION)
      }
    } else {
      if (displayedPlaceholder.length > 0) {
        // Deleting phase - remove one character
        placeholderTimeoutRef.current = setTimeout(() => {
          setDisplayedPlaceholder(displayedPlaceholder.slice(0, -1))
        }, DELETE_SPEED)
      } else {
        // Done deleting - move to next suggestion and reset
        placeholderTimeoutRef.current = setTimeout(() => {
          setCurrentSuggestionIndex((prev) => (prev + 1) % TYPING_SUGGESTIONS.length)
          setDisplayedPlaceholder("")
          setIsTyping(true)
        }, 300)
      }
    }

    return () => {
      if (placeholderTimeoutRef.current) {
        clearTimeout(placeholderTimeoutRef.current)
      }
    }
  }, [isTyping, displayedPlaceholder, currentSuggestion])

  const handleFocus = () => {
    setIsFocused(true)
    createBubbles()
  }

  return (
    <header className="sticky top-0 z-40 bg-black/40 backdrop-blur-xl border-b border-white/10 shadow-lg">
      <style>{`
        @keyframes liquidGlassZoom {
          0% {
            transform: scale(1);
            background: rgba(255, 255, 255, 0.05);
            backdrop-filter: blur(20px);
          }
          50% {
            transform: scale(1.03);
            background: rgba(255, 255, 255, 0.08);
            backdrop-filter: blur(25px);
          }
          100% {
            transform: scale(1.06);
            background: rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(30px);
          }
        }

        @keyframes liquidGlassGlow {
          0% {
            box-shadow: 0 0 0 0 rgba(100, 200, 255, 0.3), inset 0 0 20px rgba(255, 255, 255, 0.1);
          }
          50% {
            box-shadow: 0 0 15px 5px rgba(100, 200, 255, 0.2), inset 0 0 30px rgba(255, 255, 255, 0.15);
          }
          100% {
            box-shadow: 0 0 25px 10px rgba(100, 200, 255, 0.1), inset 0 0 40px rgba(255, 255, 255, 0.2);
          }
        }

        .liquid-glass-search {
          background: rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.2);
          transition: all 0.3s ease;
        }

        .liquid-glass-search:focus-within {
          background: rgba(255, 255, 255, 0.08);
          backdrop-filter: blur(30px);
          border: 1px solid rgba(100, 200, 255, 0.4);
          animation: liquidGlassZoom 0.6s ease-out forwards, liquidGlassGlow 0.6s ease-out;
        }

        .search-input-liquid {
          background: transparent;
          border: none;
        }

        .search-input-liquid::placeholder {
          color: rgba(255, 255, 255, 0.5);
        }

        .search-suggestions {
          position: absolute;
          top: 100%;
          left: 0;
          right: 0;
          background: rgba(20, 20, 30, 0.95);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(100, 200, 255, 0.3);
          border-radius: 12px;
          margin-top: 8px;
          max-height: 280px;
          overflow-y: auto;
          z-index: 50;
          scrollbar-width: thin;
          scrollbar-color: rgba(100, 200, 255, 0.5) transparent;
        }

        .search-suggestions::-webkit-scrollbar {
          width: 6px;
        }

        .search-suggestions::-webkit-scrollbar-track {
          background: transparent;
        }

        .search-suggestions::-webkit-scrollbar-thumb {
          background: rgba(100, 200, 255, 0.5);
          border-radius: 3px;
        }

        .search-suggestions::-webkit-scrollbar-thumb:hover {
          background: rgba(100, 200, 255, 0.7);
        }

        .search-suggestion-item {
          padding: 12px 16px;
          cursor: pointer;
          transition: all 0.2s ease;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        }

        .search-suggestion-item:hover {
          background: rgba(100, 200, 255, 0.1);
        }

        .search-suggestion-item:last-child {
          border-bottom: none;
        }

        @keyframes liquidBubbleRise {
          0% {
            opacity: 1;
            transform: scale(1) translateY(0);
            filter: blur(0);
          }
          100% {
            opacity: 0;
            transform: scale(0.2) translateY(-50px);
            filter: blur(2px);
          }
        }

        .liquid-bubble {
          animation: liquidBubbleRise 0.8s ease-out forwards;
        }
      `}</style>
      <div className="px-4 py-4 flex items-center gap-4">
        <div className="flex-shrink-0">
          <img
            src="https://i.postimg.cc/0yqFXMFW/photo-2025-12-11-09-45-29-removebg-preview.png"
            alt="MVBD Logo"
            className="h-10 w-auto object-contain"
          />
        </div>

        <div className="flex-1 relative">
          <div className="liquid-glass-search rounded-2xl px-4 py-3 flex items-center gap-3">
            <Search className="w-5 h-5 text-slate-300 flex-shrink-0" />
            <input
              type="text"
              placeholder={displayedPlaceholder || TYPING_SUGGESTIONS[0]}
              value={searchInput}
              onChange={handleSearch}
              onFocus={handleFocus}
              onBlur={() => setTimeout(() => setIsFocused(false), 200)}
              className="search-input-liquid w-full text-white text-sm outline-none"
            />
            {searchInput && (
              <button
                onClick={() => {
                  setSearchInput("")
                  onSearch("")
                }}
                className="text-slate-400 hover:text-white transition"
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
                  background: "radial-gradient(circle at 30% 30%, rgba(100, 200, 255, 0.8), rgba(59, 130, 246, 0.3))",
                  border: "1px solid rgba(100, 200, 255, 0.5)",
                  boxShadow: "0 0 8px rgba(100, 200, 255, 0.4), inset -2px -2px 4px rgba(0, 0, 0, 0.2)",
                }}
              />
            ))}
          </div>

          {isFocused && allSearchSuggestions.length > 0 && (
            <div className="search-suggestions">
              {allSearchSuggestions.map((suggestion, idx) => (
                <div
                  key={idx}
                  className="search-suggestion-item text-slate-200"
                  onMouseDown={() => {
                    setSearchInput(suggestion)
                    onSearch(suggestion)
                    setIsFocused(false)
                  }}
                >
                  <Search className="w-4 h-4 inline mr-2 text-slate-500" />
                  {suggestion}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
