"use client"

import { X, Play, Clock } from "lucide-react"
import { useState } from "react"
import { movies } from "@/lib/movie-data"

interface MovieModalProps {
  movie: {
    id: number
    title: string
    poster: string
    year: number
    rating: number
    description: string
    genres: string[]
    duration: string
    director: string
    cast: string | string[]
    trailer?: string
    telegramLink?: string
  }
  onClose: () => void
  onMovieClick?: (movie: (typeof movies)[0]) => void
}

export default function MovieModal({ movie, onClose, onMovieClick }: MovieModalProps) {
  const [showTrailer, setShowTrailer] = useState(false)
  const [isAddedToWatchLater, setIsAddedToWatchLater] = useState(false)

  const relatedMovies = movies
    .filter((m) => m.id !== movie.id && m.genres.some((genre) => movie.genres.includes(genre)))
    .slice(0, 6)

  const handleWatchNow = () => {
    if (movie.telegramLink) {
      window.open(movie.telegramLink, "_blank")
    }
  }

  const handleWatchTrailer = () => {
    setShowTrailer(true)
  }

  const handleWatchLater = () => {
    setIsAddedToWatchLater(!isAddedToWatchLater)
    console.log(`${isAddedToWatchLater ? "Removed from" : "Added to"} Watch Later: ${movie.title}`)
  }

  const castString = Array.isArray(movie.cast) ? movie.cast.join(", ") : movie.cast

  return (
    <>
      <div
        className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4 backdrop-blur-sm"
        onClick={onClose}
        style={{
          backgroundImage: `url(${movie.poster})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        {/* Blur overlay */}
        <div className="absolute inset-0 bg-black bg-opacity-60 backdrop-blur-md" onClick={onClose}></div>

        <div
          className="bg-slate-900 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto relative z-10"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 bg-slate-700 hover:bg-slate-600 text-white p-2 rounded-full transition z-20"
          >
            <X className="w-6 h-6" />
          </button>

          {/* Poster */}
          <div className="relative w-full aspect-[2/3] overflow-hidden">
            <img src={movie.poster || "/placeholder.svg"} alt={movie.title} className="w-full h-full object-cover" />
          </div>

          {/* Content */}
          <div className="p-6">
            <h2 className="text-3xl font-bold text-white mb-2">{movie.title}</h2>

            <div className="flex gap-4 mb-4 text-sm text-slate-300">
              <span>{movie.year}</span>
              <span>⭐ {typeof movie.rating === "number" ? movie.rating.toFixed(1) : movie.rating}</span>
              <span>{movie.duration}</span>
            </div>

            <div className="mb-4">
              <p className="text-slate-300 mb-2">
                <span className="font-semibold text-white">পরিচালক:</span> {movie.director}
              </p>
              <p className="text-slate-300 mb-4">
                <span className="font-semibold text-white">অভিনেতা:</span> {castString}
              </p>
            </div>

            <div className="mb-6">
              <p className="text-slate-300 leading-relaxed">{movie.description}</p>
            </div>

            <div className="flex gap-2 mb-6 flex-wrap">
              {movie.genres.map((genre) => (
                <span key={genre} className="px-3 py-1 bg-slate-700 text-slate-300 rounded-full text-sm">
                  {genre}
                </span>
              ))}
            </div>

            <div className="flex gap-2 flex-col sm:flex-row mb-8">
              {movie.trailer && (
                <button
                  onClick={handleWatchTrailer}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition"
                >
                  <Play className="w-5 h-5" />
                  ট্রেইলার দেখুন
                </button>
              )}
              <button
                onClick={handleWatchNow}
                className="flex-1 bg-green-500 hover:bg-green-600 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition"
              >
                <Play className="w-5 h-5" />
                এখনই দেখুন
              </button>
              <button
                onClick={handleWatchLater}
                className={`flex-1 font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition ${
                  isAddedToWatchLater
                    ? "bg-purple-600 hover:bg-purple-700 text-white"
                    : "bg-slate-700 hover:bg-slate-600 text-white"
                }`}
              >
                <Clock className="w-5 h-5" />
                {isAddedToWatchLater ? "পরে দেখা হয়েছে" : "পরে দেখুন"}
              </button>
            </div>

            {relatedMovies.length > 0 && (
              <div className="border-t border-slate-700 pt-6">
                <h3 className="text-xl font-bold text-white mb-4">সম্পর্কিত মুভি</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {relatedMovies.map((relatedMovie) => (
                    <div
                      key={relatedMovie.id}
                      onClick={() => {
                        onMovieClick?.(relatedMovie)
                      }}
                      className="cursor-pointer group"
                    >
                      <div className="relative aspect-[2/3] overflow-hidden rounded-lg mb-2">
                        <img
                          src={relatedMovie.poster || "/placeholder.svg"}
                          alt={relatedMovie.title}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all duration-300 flex items-center justify-center">
                          <Play className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </div>
                      <p className="text-sm text-slate-300 truncate">{relatedMovie.title}</p>
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
    </>
  )
}
