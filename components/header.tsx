"use client"

import type React from "react"
import { useState, useRef, useMemo, useEffect } from "react"
import { Search, X } from "lucide-react"
import { movies } from "@/lib/movie-data"

interface HeaderProps {
  onSearch: (query: string) => void
}

const searchSuggestions = [
  "search movie...",
  "search web series...",
  "bachelor point...",
  "money heist",
  "all of us are dead",
  "alice in borderland",
  "avengers infinity war",
  "if wishes could kill",
  "the wonderfall",
]

export default function Header({ onSearch }: HeaderProps) {
  const [searchInput, setSearchInput] = useState("")
  const [isFocused, setIsFocused] = useState(false)
  const [bubbles, setBubbles] = useState<Array<{ id: number; x: number; y: number }>>([])
  const [displayedText, setDisplayedText] = useState("")
  const [currentSuggestionIndex, setCurrentSuggestionIndex] = useState(0)
  const [isTyping, setIsTyping] = useState(true)
  const [charIndex, setCharIndex] = useState(0)
  const bubbleIdRef = useRef(0)
  const timeoutRef = useRef<NodeJS.Timeout>()

  const currentSuggestion = searchSuggestions[currentSuggestionIndex]

  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    if (isTyping && charIndex < currentSuggestion.length) {
      timeoutRef.current = setTimeout(() => {
        setDisplayedText((prev) => prev + currentSuggestion[charIndex])
        setCharIndex((prev) => prev + 1)
      }, 80)
    } else if (isTyping && charIndex === currentSuggestion.length) {
      timeoutRef.current = setTimeout(() => {
        setIsTyping(false)
      }, 2000)
    } else if (!isTyping) {
      timeoutRef.current = setTimeout(() => {
        setDisplayedText("")
        setCharIndex(0)
        setCurrentSuggestionIndex((prev) => (prev + 1) % searchSuggestions.length)
        setIsTyping(true)
      }, 1000)
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [isTyping, charIndex, currentSuggestion])

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchInput(e.target.value)
    onSearch(e.target.value)
  }

  const handleFocus = () => {
    setIsFocused(true)
  }

  const handleClearSearch = () => {
    setSearchInput("")
    onSearch("")
  }

  const handleCreateBubble = (e: React.MouseEvent<HTMLInputElement>) => {
    if (!searchInput.trim()) return
    const rect = (e.currentTarget as HTMLInputElement).getBoundingClientRect()
    const x = Math.random() * (rect.width - 20) + 10
    const y = Math.random() * (rect.height - 20) + 10
    const newBubble = { id: bubbleIdRef.current++, x, y }
    setBubbles([...bubbles, newBubble])
    setTimeout(() => {
      setBubbles((prev) => prev.filter((b) => b.id !== newBubble.id))
    }, 2000)
  }

  const allSearchSuggestions = useMemo(() => {
    if (!searchInput.trim()) return []
    const query = searchInput.toLowerCase()
    return movies
      .filter((m) => m.title.toLowerCase().includes(query))
      .map((m) => m.title)
      .slice(0, 5)
  }, [searchInput])

  return (
    <header className="sticky top-0 z-50 backdrop-blur-2xl bg-black/40 border-b border-white/10 shadow-xl">
      <style>{`
        @keyframes liquidGlassGlow {
          0%, 100% {
            box-shadow: 0 0 20px rgba(34, 197, 94, 0.3), inset 0 0 20px rgba(255, 255, 255, 0.1);
            border-color: rgba(34, 197, 94, 0.3);
          }
          50% {
            box-shadow: 0 0 40px rgba(34, 197, 94, 0.5), inset 0 0 30px rgba(255, 255, 255, 0.15);
            border-color: rgba(34, 197, 94, 0.5);
          }
        }

        .liquid-glass-search {
          background: rgba(15, 23, 42, 0.4);
          backdrop-filter: blur(30px);
          border: 1px solid rgba(34, 197, 94, 0.3);
          animation: liquidGlassGlow 2s ease-in-out infinite;
          transition: all 0.3s ease;
        }

        .liquid-glass-search:focus-within {
          background: rgba(15, 23, 42, 0.6);
          border-color: rgba(34, 197, 94, 0.6);
          box-shadow: 0 0 40px rgba(34, 197, 94, 0.4), inset 0 0 30px rgba(255, 255, 255, 0.2);
        }

        .search-input-liquid {
          background: transparent;
          color: white;
        }

        .search-input-liquid::placeholder {
          color: rgba(148, 163, 184, 0.6);
          font-style: italic;
        }

        @keyframes float {
          0% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
          100% {
            opacity: 0;
            transform: translateY(-30px) scale(0.5);
          }
        }

        .bubble {
          animation: float 2s ease-out forwards;
        }
      `}</style>

      <div className="px-4 py-4">
        <div className="max-w-6xl mx-auto">
          <div className="liquid-glass-search rounded-2xl px-4 py-3 flex items-center gap-3">
            <Search className="w-5 h-5 text-slate-300 flex-shrink-0" />
            <div className="relative flex-1">
              <input
                type="text"
                placeholder={displayedText || "search movie..."}
                value={searchInput}
                onChange={handleSearch}
                onClick={handleCreateBubble}
                onFocus={handleFocus}
                onBlur={() => setTimeout(() => setIsFocused(false), 200)}
                className="search-input-liquid w-full text-white text-sm outline-none transition-all duration-300"
              />
              {bubbles.map((bubble) => (
                <span
                  key={bubble.id}
                  className="bubble absolute text-green-400 text-xs font-semibold pointer-events-none"
                  style={{
                    left: `${bubble.x}px`,
                    top: `${bubble.y}px`,
                  }}
                >
                  +1
                </span>
              ))}
            </div>
            {searchInput && (
              <button onClick={handleClearSearch} className="text-slate-300 hover:text-white transition">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Search Suggestions Dropdown */}
          {isFocused && allSearchSuggestions.length > 0 && (
            <div className="absolute left-4 right-4 top-16 bg-slate-900/95 border border-white/10 rounded-2xl backdrop-blur-xl max-h-48 overflow-y-auto z-40">
              {allSearchSuggestions.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setSearchInput(suggestion)
                    onSearch(suggestion)
                    setIsFocused(false)
                  }}
                  className="w-full text-left px-4 py-3 text-white hover:bg-white/10 transition flex items-center gap-2 border-b border-white/5 last:border-b-0"
                >
                  <Search className="w-4 h-4 text-slate-400" />
                  {suggestion}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
