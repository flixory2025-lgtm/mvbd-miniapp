"use client"

import { X, Play, Eye } from "lucide-react"
import { useState, useEffect } from "react"
import { movies } from "@/lib/movie-data"
import { incrementMovieView } from "@/lib/firebase"
import TelegramJoinPopup from "./telegram-join-popup"

interface MovieModalProps {
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
  onClose: () => void
  onMovieClick?: (movie: (typeof movies)[0]) => void
}

export default function MovieModal({ movie, onClose, onMovieClick }: MovieModalProps) {
  const [showTrailer, setShowTrailer] = useState(false)
  const [showJoinPopup, setShowJoinPopup] = useState(false)
  const [isAddedToWatchLater, setIsAddedToWatchLater] = useState(false)
  const [viewCount, setViewCount] = useState(0)

  const movieGenres = movie.genre.split(" | ").map((g) => g.trim())

  const relatedMovies = movies
    .filter((m) => {
      const mGenres = m.genre.split(" | ").map((g) => g.trim())
      return m.id !== movie.id && mGenres.some((genre) => movieGenres.includes(genre))
    })
    .slice(0, 6)

  useEffect(() => {
    const trackView = async () => {
      const views = await incrementMovieView(movie.id)
      setViewCount(views)
    }
    trackView()
  }, [movie.id])

  const handleWatchNow = () => {
    setShowJoinPopup(true)
  }

  const handleWatchTrailer = () => {
    setShowTrailer(true)
  }

  const handleWatchLater = () => {
    setIsAddedToWatchLater(!isAddedToWatchLater)
  }

  return (
    <>
      <div className="fixed inset-0 bg-black flex items-center justify-center z-50 p-4" onClick={onClose}>
        {/* Background poster with dark overlay */}
        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage: `url(${movie.poster})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundAttachment: "fixed",
          }}
        />
        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose}></div>

        <div
          className="bg-black/90 border border-slate-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto relative z-10"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 bg-red-600 hover:bg-red-700 text-white p-2 rounded-full transition animate-pulse hover:animate-none z-20"
          >
            <X className="w-6 h-6" />
          </button>

          <div className="flex justify-center pt-6 px-6">
            <div className="relative w-40 aspect-[2/3] overflow-hidden rounded-lg shadow-lg">
              <img src={movie.poster || "/placeholder.svg"} alt={movie.title} className="w-full h-full object-cover" />

              {movie.language && (
                <span className="absolute top-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded uppercase font-semibold">
                  {movie.language}
                </span>
              )}
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            <h2 className="text-3xl font-bold text-white mb-2">{movie.title}</h2>

            <div className="flex gap-4 mb-4 text-sm text-slate-300 flex-wrap items-center">
              <span>{movie.year}</span>
              <span>⭐ {typeof movie.rating === "number" ? movie.rating.toFixed(1) : movie.rating}</span>
              {movie.language && <span className="uppercase">{movie.language}</span>}
              <span className="flex items-center gap-1 text-green-400">
                <Eye className="w-4 h-4" />
                {viewCount.toLocaleString()} views
              </span>
            </div>

            <div className="mb-6">
              <p className="text-slate-300 leading-relaxed">{movie.description}</p>
            </div>

            <div className="flex gap-2 flex-col sm:flex-row mb-8">
              {movie.trailer && (
                <button
                  onClick={handleWatchTrailer}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition animate-pulse hover:animate-none shadow-lg shadow-blue-500/50"
                >
                  <Play className="w-5 h-5" />
                  ট্রেইলার দেখুন
                </button>
              )}
              <button
                onClick={handleWatchNow}
                className="flex-1 bg-green-500 hover:bg-green-600 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition animate-bounce hover:animate-none shadow-lg shadow-green-500/50"
              >
                <Play className="w-5 h-5" />
                এখনই দেখুন
              </button>
              <button
                onClick={handleWatchLater}
                className={`flex-1 font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition shadow-lg ${
                  isAddedToWatchLater
                    ? "bg-purple-600 hover:bg-purple-700 text-white animate-pulse shadow-purple-500/50"
                    : "bg-slate-700 hover:bg-slate-600 text-white hover:animate-pulse shadow-slate-500/50"
                }`}
              >
                {isAddedToWatchLater ? "পরে দেখা হয়েছে" : "পরে দেখুন"}
              </button>
            </div>

            {relatedMovies.length > 0 && (
              <div className="border-t border-slate-700 pt-6">
                <h3 className="text-xl font-bold text-white mb-4">সম্পর্কিত মুভি</h3>
                <div className="grid grid-cols-3 sm:grid-cols-3 gap-3">
                  {relatedMovies.map((relatedMovie) => (
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
                          className="w-full h-full object-cover"
                        />

                        {relatedMovie.language && (
                          <span className="absolute top-1 right-1 bg-black/70 text-white text-[8px] px-1 py-0.5 rounded uppercase font-semibold">
                            {relatedMovie.language}
                          </span>
                        )}

                        {relatedMovie.year && (
                          <span className="absolute bottom-1 left-1 bg-black/60 text-white text-[8px] px-1 py-0.5 rounded font-medium">
                            {relatedMovie.year}
                          </span>
                        )}

                        {relatedMovie.rating && relatedMovie.rating !== "not available" && (
                          <span className="absolute bottom-1 right-1 bg-yellow-500/90 text-black text-[8px] px-1 py-0.5 rounded font-bold">
                            ⭐ {relatedMovie.rating}
                          </span>
                        )}
                      </div>
                      <p className="mt-2 text-xs text-slate-300 line-clamp-2 group-hover:text-white transition">
                        {relatedMovie.title}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

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
              <X className="w-6 h-6" />
            </button>
            <iframe
              width="100%"
              height="100%"
              src={movie.trailer}
              title={`${movie.title} Trailer`}
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="rounded-lg"
            ></iframe>
          </div>
        </div>
      )}

      {showJoinPopup && (
        <TelegramJoinPopup
          movieTitle={movie.title}
          telegramLink={movie.telegramLink}
          onClose={() => setShowJoinPopup(false)}
        />
      )}
    </>
  )
}
