"use client"

import { useState, useEffect } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { movies } from "@/lib/movie-data"

const trendingIds = [2, 4, 5, 8, 9]

export default function TrendingCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0)
  const trendingMovies = movies.filter((m) => trendingIds.includes(m.id))

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % trendingMovies.length)
    }, 3000)
    return () => clearInterval(interval)
  }, [trendingMovies.length])

  const getVisibleMovies = () => {
    const visible = []
    for (let i = 0; i < 3; i++) {
      visible.push(trendingMovies[(currentIndex + i) % trendingMovies.length])
    }
    return visible
  }

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + trendingMovies.length) % trendingMovies.length)
  }

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % trendingMovies.length)
  }

  return (
    <section className="px-4 py-8">
      <h2 className="text-2xl font-bold text-white mb-6">ট্রেন্ডিং এখন</h2>

      <div className="relative">
        <div className="flex gap-4 overflow-hidden transition-all duration-500">
          {getVisibleMovies().map((movie, idx) => (
            <div
              key={`${movie.id}-${idx}`}
              className="flex-1 min-w-0 aspect-[2/3] rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
            >
              <img src={movie.poster || "/placeholder.svg"} alt={movie.title} className="w-full h-full object-cover" />
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
