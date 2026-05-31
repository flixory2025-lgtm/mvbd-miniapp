"use client"

import { useState, useEffect } from "react"
import { Play, Eye, ArrowLeft } from "lucide-react"
import { movies } from "@/lib/movie-data"
import TelegramJoinPopup from "./telegram-join-popup"

interface MovieDetailPageProps {
  movie: {
    id: number
    title: string
    poster: string
    year: number | string
    rating: number | string
    description: string
    genre: string
    trailer?: string
    telegramLink?: string
    language?: string
  }
  onBack: () => void
  onMovieClick?: (movie: (typeof movies)[0]) => void
  showAdultContent?: boolean
}

export default function MovieDetailPage({ movie, onBack, onMovieClick, showAdultContent = false }: MovieDetailPageProps) {
  const [showTrailer, setShowTrailer] = useState(false)
  const [viewCount, setViewCount] = useState(Math.floor(Math.random() * 1000) + 1)
  const [isAddedToWatchLater, setIsAddedToWatchLater] = useState(false)
  const [showTelegramPopup, setShowTelegramPopup] = useState(false)

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [movie.id])

  const isAdultMovie = (genre: string): boolean => {
    const adultGenres = ["Adult", "18+"]
    return adultGenres.some((g) => genre.toLowerCase().includes(g.toLowerCase()))
  }

  const handleWatchTrailer = () => {
    setShowTrailer(true)
  }

  const handleWatchNow = () => {
    setShowTelegramPopup(true)
  }

  const handleWatchLater = () => {
    setIsAddedToWatchLater(!isAddedToWatchLater)
  }

  const isAdult = isAdultMovie(movie.genre)
  const movieGenres = movie.genre.split(" | ").map((g) => g.trim().toLowerCase())

  const relatedMovies = movies
    .filter((m) => {
      if (m.id === movie.id) return false
      const mGenres = m.genre.split(" | ").map((g) => g.trim().toLowerCase())
      const normalizedMovieGenres = movieGenres.map((g) => g.toLowerCase())
      const genreMatch = mGenres.some((genre) => normalizedMovieGenres.includes(genre))
      const titleMatch = m.title.toLowerCase().includes(movie.title.split("(")[0].toLowerCase().trim()) ||
        movie.title.split("(")[0].toLowerCase().trim().includes(m.title.split("(")[0].toLowerCase().trim())
      return genreMatch || titleMatch
    })
    .sort((a, b) => {
      const aGenres = a.genre.split(" | ").map((g) => g.trim().toLowerCase())
      const bGenres = b.genre.split(" | ").map((g) => g.trim().toLowerCase())
      const normalizedMovieGenres = movieGenres.map((g) => g.toLowerCase())
      const aMatches = aGenres.filter((g) => normalizedMovieGenres.includes(g)).length
      const bMatches = bGenres.filter((g) => normalizedMovieGenres.includes(g)).length
      return bMatches - aMatches
    })
    .slice(0, 10)

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-black/70 backdrop-blur-lg border-b border-white/10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center gap-4">
          <button
            onClick={onBack}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold transition border border-white/20 hover:border-white/40"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to home
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div
        className="relative"
        style={{
          backgroundImage: `url(${movie.poster})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundAttachment: "fixed",
        }}
      >
        {/* Background Overlay */}
        <div className="absolute inset-0 bg-black/75 backdrop-blur-md" />

        {/* Movie Details Section */}
        <div className="relative z-10 px-4 py-12">
          <div className="max-w-5xl mx-auto">
            {/* Main Layout - Poster + Details */}
            <div className="flex flex-col md:flex-row gap-8 items-start">
              {/* Left - Poster */}
              <div className="w-32 md:w-48 flex-shrink-0">
                <div className="relative w-full aspect-[2/3] overflow-hidden rounded-xl shadow-2xl">
                  <img
                    src={movie.poster || "/placeholder.svg"}
                    alt={movie.title}
                    className="w-full h-full object-cover"
                  />

                  {isAdult && (
                    <span className="absolute top-3 right-3 bg-gradient-to-r from-pink-500 to-red-500 text-white text-xs px-3 py-1 rounded-full font-bold animate-pulse border border-white z-10">
                      18+
                    </span>
                  )}

                  {movie.language && (
                    <span className="absolute top-3 left-3 bg-black/70 text-white text-xs px-3 py-1 rounded uppercase font-semibold z-10">
                      {movie.language}
                    </span>
                  )}
                </div>
              </div>

              {/* Middle - Details */}
              <div className="flex-1 space-y-6 text-white">
                {/* Title */}
                <div>
                  <h1 className="text-4xl md:text-5xl font-bold mb-4 text-balance">{movie.title}</h1>

                  {/* Meta Info */}
                  <div className="flex flex-wrap gap-6 text-base md:text-lg text-slate-200">
                    <div>
                      <span className="font-semibold text-slate-300">Year:</span> {movie.year}
                    </div>
                    <div>
                      <span className="font-semibold text-slate-300">Rating:</span> ⭐ {typeof movie.rating === "number" ? movie.rating.toFixed(1) : movie.rating}
                    </div>
                    {movie.language && (
                      <div>
                        <span className="font-semibold text-slate-300">Language:</span> {movie.language}
                      </div>
                    )}
                  </div>

                  {/* Views */}
                  <div className="flex items-center gap-2 text-green-400 text-base mt-4 font-semibold">
                    <Eye className="w-5 h-5" />
                    {viewCount.toLocaleString()} views
                  </div>
                </div>

                {/* Description */}
                <div className="border-t border-white/20 pt-6">
                  <p className="text-base leading-relaxed text-slate-200">{movie.description}</p>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col md:flex-row gap-3 pt-6">
                  <style>{`
                    @keyframes fireGlassAnimation {
                      0%, 100% {
                        box-shadow: 0 0 10px rgba(34, 197, 94, 0.5), inset 0 0 20px rgba(255, 255, 255, 0.1);
                      }
                      50% {
                        box-shadow: 0 0 20px rgba(34, 197, 94, 0.7), inset 0 0 30px rgba(255, 255, 255, 0.15);
                      }
                    }

                    .modal-liquid-glass-button {
                      background: rgba(255, 255, 255, 0.08);
                      backdrop-filter: blur(20px);
                      border: 1px solid rgba(255, 255, 255, 0.2);
                      border-radius: 12px;
                      transition: all 0.3s ease;
                    }

                    .modal-liquid-glass-button:hover {
                      background: rgba(100, 200, 255, 0.1);
                      backdrop-filter: blur(25px);
                      border: 1px solid rgba(100, 200, 255, 0.4);
                      transform: scale(1.03);
                    }

                    .modal-liquid-glass-button.fire {
                      animation: fireGlassAnimation 0.8s ease-in-out infinite;
                    }
                  `}</style>
                  {movie.trailer && (
                    <button
                      onClick={handleWatchTrailer}
                      className="flex-1 modal-liquid-glass-button bg-blue-500/20 border border-blue-400/40 hover:bg-blue-500/30 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition shadow-lg shadow-blue-500/30"
                    >
                      <Play className="w-5 h-5" />
                      ট্রেইলার দেখুন
                    </button>
                  )}
                  <button
                    onClick={handleWatchNow}
                    className="flex-1 modal-liquid-glass-button fire bg-green-500/20 border border-green-400/40 hover:bg-green-500/30 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-green-500/30"
                  >
                    <Play className="w-5 h-5" />
                    এখনই দেখুন
                  </button>
                  <button
                    onClick={handleWatchLater}
                    className={`flex-1 modal-liquid-glass-button font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition shadow-lg ${
                      isAddedToWatchLater
                        ? "fire bg-purple-500/20 border border-purple-400/40 hover:bg-purple-500/30 text-white shadow-purple-500/30"
                        : "bg-slate-500/20 border border-slate-400/40 hover:bg-slate-500/30 text-white shadow-slate-500/30"
                    }`}
                  >
                    {isAddedToWatchLater ? "পরে দেখা হয়েছে" : "পরে দেখুন"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Related Movies Section */}
      {relatedMovies.length > 0 && (
        <div className="bg-black relative z-10">
          <div className="max-w-6xl mx-auto px-4 py-12 border-t border-white/20">
            <h3 className="text-3xl font-bold text-white mb-8">সম্পর্কিত মুভি</h3>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-4">
              {relatedMovies.map((relatedMovie) => {
                const isRelatedAdult = isAdultMovie(relatedMovie.genre)
                const shouldBlurRelated = isRelatedAdult && !showAdultContent
                return (
                  <div
                    key={relatedMovie.id}
                    onClick={() => {
                      onMovieClick?.(relatedMovie)
                    }}
                    className="cursor-pointer group"
                  >
                    <div className="aspect-[2/3] rounded-lg overflow-hidden shadow-lg hover:shadow-2xl transition transform hover:scale-105 relative">
                      <img
                        src={relatedMovie.poster || "/placeholder.svg"}
                        alt={relatedMovie.title}
                        className={`w-full h-full object-cover ${shouldBlurRelated ? "blur-lg" : ""}`}
                      />

                      {isRelatedAdult && (
                        <span className="absolute top-1 right-8 bg-gradient-to-r from-pink-500 to-red-500 text-white text-[8px] px-1.5 py-0.5 rounded font-bold animate-pulse border border-white z-10">
                          18+
                        </span>
                      )}

                      {relatedMovie.language && (
                        <span className="absolute top-1 right-1 bg-black/70 text-white text-[8px] px-1 py-0.5 rounded uppercase font-semibold z-10">
                          {relatedMovie.language}
                        </span>
                      )}

                      {relatedMovie.year && (
                        <span className="absolute bottom-1 left-1 bg-black/60 text-white text-[8px] px-1 py-0.5 rounded font-medium z-10">
                          {relatedMovie.year}
                        </span>
                      )}

                      {relatedMovie.rating && relatedMovie.rating !== "not available" && (
                        <span className="absolute bottom-1 right-1 bg-yellow-500/90 text-black text-[8px] px-1 py-0.5 rounded font-bold z-10">
                          ⭐ {relatedMovie.rating}
                        </span>
                      )}
                    </div>
                    <p className="mt-2 text-xs text-slate-300 line-clamp-2 group-hover:text-white transition">
                      {relatedMovie.title}
                    </p>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="relative z-10 bg-black/70 backdrop-blur-xl border-t border-white/10 mt-12">
        <div className="px-4 py-8 max-w-6xl mx-auto">
          <div className="flex justify-center items-center gap-4">
            <p className="text-slate-500 text-xs text-center">© 2025 MoviesVerse. সর্বাধিকার সংরক্ষিত। All rights reserved.</p>
          </div>
        </div>
      </div>

      {/* Trailer Modal */}
      {showTrailer && movie.trailer && (
        <div
          className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-[60] p-4"
          onClick={() => setShowTrailer(false)}
        >
          <div className="relative w-full max-w-4xl aspect-video" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setShowTrailer(false)}
              className="absolute -top-10 right-0 bg-slate-700 hover:bg-slate-600 text-white p-2 rounded-full transition"
            >
              ✕
            </button>
            <iframe
              src={movie.trailer}
              title="Trailer"
              allowFullScreen
              className="w-full h-full rounded-lg"
            />
          </div>
        </div>
      )}

      {/* Telegram Popup */}
      {showTelegramPopup && <TelegramJoinPopup onClose={() => setShowTelegramPopup(false)} movieTitle={movie.title} />}
    </div>
  )
}
