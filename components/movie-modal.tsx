"use client"

import { X, Play } from "lucide-react"

interface MovieModalProps {
  movie: {
    id: number
    title: string
    poster: string
    year: number
    rating: number
    description: string
    genres: string[]
    duration: number
    director: string
    cast: string[]
  }
  onClose: () => void
}

export default function MovieModal({ movie, onClose }: MovieModalProps) {
  const handleWatchNow = () => {
    // Open in Telegram
    const telegramUrl = `https://t.me/moviesversebdreq?start=movie_${movie.id}`
    window.open(telegramUrl, "_blank")
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="bg-slate-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 bg-slate-700 hover:bg-slate-600 text-white p-2 rounded-full transition z-10"
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
            <span>⭐ {movie.rating.toFixed(1)}</span>
            <span>{movie.duration} মিনিট</span>
          </div>

          <div className="mb-4">
            <p className="text-slate-300 mb-2">
              <span className="font-semibold text-white">পরিচালক:</span> {movie.director}
            </p>
            <p className="text-slate-300 mb-4">
              <span className="font-semibold text-white">অভিনেতা:</span> {movie.cast.join(", ")}
            </p>
          </div>

          <div className="mb-6">
            <p className="text-slate-300 leading-relaxed">{movie.description}</p>
          </div>

          <div className="flex gap-2 mb-4 flex-wrap">
            {movie.genres.map((genre) => (
              <span key={genre} className="px-3 py-1 bg-slate-700 text-slate-300 rounded-full text-sm">
                {genre}
              </span>
            ))}
          </div>

          {/* Watch Now Button */}
          <button
            onClick={handleWatchNow}
            className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition"
          >
            <Play className="w-5 h-5" />
            এখনই দেখুন
          </button>
        </div>
      </div>
    </div>
  )
}
