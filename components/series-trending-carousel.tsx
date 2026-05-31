"use client"

import { useState, useEffect, useRef } from "react"
import { movies } from "@/lib/movie-data"

const trendingIds = [2509, 2513, 2514, 2515, 2516, 2517, 2518, 2519, 2520]

interface SeriesTrendingCarouselProps {
  onMovieClick: (movie: (typeof movies)[0]) => void
}

export default function SeriesTrendingCarousel({ onMovieClick }: SeriesTrendingCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [touchStart, setTouchStart] = useState(0)
  const [touchEnd, setTouchEnd] = useState(0)
  const carouselRef = useRef<HTMLDivElement>(null)
  
  // Get trending series (movies with "season" in title)
  const trendingSeries = movies
    .filter((m) => m.title.toLowerCase().includes("season") && trendingIds.includes(m.id))
    .slice(0, 9)

  const totalSeriesCount = movies.filter((m) => m.title.toLowerCase().includes("season")).length

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX)
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    setTouchEnd(e.changedTouches[0].clientX)
    handleSwipe()
  }

  const handleSwipe = () => {
    if (!touchStart || !touchEnd) return
    const distance = touchStart - touchEnd
    const isLeftSwipe = distance > 50
    const isRightSwipe = distance < -50

    if (isLeftSwipe) {
      setCurrentIndex((prev) => (prev + 1) % trendingSeries.length)
    } else if (isRightSwipe) {
      setCurrentIndex((prev) => (prev - 1 + trendingSeries.length) % trendingSeries.length)
    }
  }

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % trendingSeries.length)
    }, 4000)
    return () => clearInterval(interval)
  }, [trendingSeries.length])

  const extendedSeries = [...trendingSeries, ...trendingSeries, ...trendingSeries]
  const offset = -currentIndex * (100 / 3)

  return (
    <section className="px-4 py-2">
      <div className="relative flex justify-center -mt-4 mb-0">
        <div
          className="absolute inset-0 -top-20 flex justify-center"
          style={{
            backgroundImage: "url('https://i.postimg.cc/tRMc5ZNM/198b2f01e73b905772279616eccc7c65.jpg')",
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
          }}
        >
          <div className="w-full h-96 bg-gradient-to-b from-black/50 via-black/80 to-black rounded-b-3xl" />
        </div>
        <img
          src="https://i.postimg.cc/xkNsB3Xn/Screenshot-2026-01-25-085543-removebg-preview.png"
          alt="MoviesVerseBD Series"
          className="relative z-20 w-72 h-72 object-contain"
        />
      </div>

      <div className="relative z-20 -mt-4 mb-1 flex flex-col items-center justify-center">
        <h2
          className="text-xl font-bold text-center tracking-wider animate-pulse"
          style={{
            fontFamily: "'Times New Roman', serif",
            letterSpacing: "0.2em",
            background: "linear-gradient(to right, #7c3aed, #d946ef, #7c3aed)",
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
            color: "transparent",
            textShadow: "0 0 10px rgba(124, 58, 237, 0.7), 0 0 15px rgba(217, 70, 239, 0.5)",
            animation: "purpleGlow 2s ease-in-out infinite alternate",
          }}
        >
          Trending Series
        </h2>
        <style jsx>{`
          @keyframes purpleGlow {
            0% {
              text-shadow: 0 0 8px rgba(124, 58, 237, 0.7), 0 0 15px rgba(217, 70, 239, 0.5);
              background: linear-gradient(to right, #7c3aed, #d946ef, #7c3aed);
              -webkit-background-clip: text;
              background-clip: text;
            }
            100% {
              text-shadow: 0 0 15px rgba(124, 58, 237, 0.9), 0 0 25px rgba(217, 70, 239, 0.7), 0 0 35px rgba(168, 85, 247, 0.6);
              background: linear-gradient(to right, #a855f7, #7c3aed, #a855f7);
              -webkit-background-clip: text;
              background-clip: text;
            }
          }
        `}</style>
      </div>

      <p className="text-center text-purple-400 text-sm mb-3 font-medium relative z-20">{totalSeriesCount} Series Uploaded</p>

      <div 
        ref={carouselRef}
        className="relative overflow-x-auto overflow-y-hidden scrollbar-hide md:overflow-hidden"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        style={{ touchAction: "pan-x" }}
      >
        <div
          className="flex gap-4 transition-transform duration-1000 ease-in-out md:transition-transform"
          style={{
            transform: `translateX(${offset}%)`,
          }}
        >
          {extendedSeries.map((series, idx) => (
            <div
              key={`${series.id}-${idx}`}
              className="flex-shrink-0 w-1/3 aspect-[2/3] rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-all duration-500 transform hover:scale-105 cursor-pointer relative"
              onClick={() => onMovieClick(series)}
            >
              <img src={series.poster || "/placeholder.svg"} alt={series.title} className="w-full h-full object-cover" />

              {series.language && (
                <span className="absolute top-1 right-1 bg-black/70 text-white text-[8px] px-1 py-0.5 rounded uppercase font-semibold">
                  {series.language}
                </span>
              )}

              {series.year && (
                <span className="absolute bottom-1 left-1 bg-black/60 text-white text-[8px] px-1 py-0.5 rounded font-medium">
                  {series.year}
                </span>
              )}

              {series.rating && series.rating !== "not available" && (
                <span className="absolute bottom-1 right-1 bg-yellow-500/90 text-black text-[8px] px-1 py-0.5 rounded font-bold flex items-center gap-0.5">
                  ⭐ {series.rating}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      <style jsx>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }

        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </section>
  )
}
