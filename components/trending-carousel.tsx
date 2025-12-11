"use client"

import { useState, useEffect } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { movies } from "@/lib/movie-data"

const trendingIds = [1334, 1336, 1341, 1342, 1343, 1344, 1345, 1346, 1359, 1360, 1361, 1366, 1368, 1369]

interface TrendingCarouselProps {
  onMovieClick: (movie: (typeof movies)[0]) => void
}

export default function TrendingCarousel({ onMovieClick }: TrendingCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const trendingMovies = movies.filter((m) => trendingIds.includes(m.id))

  const totalMovieCount = movies.length

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % trendingMovies.length)
    }, 5000)
    return () => clearInterval(interval)
  }, [trendingMovies.length])

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + trendingMovies.length) % trendingMovies.length)
  }

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % trendingMovies.length)
  }

  const extendedMovies = [...trendingMovies, ...trendingMovies, ...trendingMovies]
  const offset = -currentIndex * (100 / 3)

  return (
    <section className="px-4 py-2">
      <div className="flex justify-center -mt-4 mb-0">
        <img
          src="https://i.postimg.cc/LXBMvk6B/photo-2025-12-11-09-16-17-removebg-preview.png"
          alt="MoviesVerseBD Logo"
          className="w-72 h-72 object-contain"
        />
      </div>

      <h2 className="text-2xl font-bold text-white mb-1 text-center -mt-6">Trending Now</h2>

      <p className="text-center text-green-400 text-sm mb-3 font-medium">{totalMovieCount} Movie & Series Uploaded</p>

      <div className="relative overflow-hidden">
        <div
          className="flex gap-4 transition-transform duration-1000 ease-in-out"
          style={{
            transform: `translateX(${offset}%)`,
          }}
        >
          {extendedMovies.map((movie, idx) => (
            <div
              key={`${movie.id}-${idx}`}
              className="flex-shrink-0 w-1/3 aspect-[2/3] rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-all duration-500 transform hover:scale-105 cursor-pointer relative"
              onClick={() => onMovieClick(movie)}
            >
              <img src={movie.poster || "/placeholder.svg"} alt={movie.title} className="w-full h-full object-cover" />

              {movie.language && (
                <span className="absolute top-1 right-1 bg-black/70 text-white text-[8px] px-1 py-0.5 rounded uppercase font-semibold">
                  {movie.language}
                </span>
              )}

              {movie.year && (
                <span className="absolute bottom-1 left-1 bg-black/60 text-white text-[8px] px-1 py-0.5 rounded font-medium">
                  {movie.year}
                </span>
              )}

              {movie.rating && movie.rating !== "not available" && (
                <span className="absolute bottom-1 right-1 bg-yellow-500/90 text-black text-[8px] px-1 py-0.5 rounded font-bold flex items-center gap-0.5">
                  ⭐ {movie.rating}
                </span>
              )}
            </div>
          ))}
        </div>

        {/* Navigation Buttons */}
        <button
          onClick={handlePrev}
          className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-4 bg-green-500 hover:bg-green-600 text-white p-2 rounded-full transition z-10"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        <button
          onClick={handleNext}
          className="absolute right-0 top-1/2 transform -translate-y-1/2 translate-x-4 bg-green-500 hover:bg-green-600 text-white p-2 rounded-full transition z-10"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      </div>
    </section>
  )
}
