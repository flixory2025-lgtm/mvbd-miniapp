"use client"

import { useState, useEffect, useRef } from "react"
import { animes } from "@/lib/anime-data"
import type { Anime } from "@/lib/anime-data"

const trendingIds = [173, 174, 176, 177, 178, 179, 180, 181, 182, 183, 184, 157, 158, 162, 161,]

interface AnimeTrendingCarouselProps {
  onAnimeClick: (anime: Anime) => void
}

export default function AnimeTrendingCarousel({ onAnimeClick }: AnimeTrendingCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [startX, setStartX] = useState(0)
  const [scrollLeft, setScrollLeft] = useState(0)
  const carouselRef = useRef<HTMLDivElement>(null)
  
  const trendingAnimes = animes.filter((a) => trendingIds.includes(a.id))
  const totalAnimeCount = animes.length

  // Auto-scroll only when not dragging
  useEffect(() => {
    if (!isDragging) {
      const interval = setInterval(() => {
        if (carouselRef.current) {
          const nextIndex = (currentIndex + 1) % trendingAnimes.length
          setCurrentIndex(nextIndex)
          scrollToIndex(nextIndex)
        }
      }, 3000)
      return () => clearInterval(interval)
    }
  }, [currentIndex, trendingAnimes.length, isDragging])

  const scrollToIndex = (index: number) => {
    if (carouselRef.current) {
      const carousel = carouselRef.current
      const itemWidth = carousel.clientWidth / 3
      const scrollPosition = index * itemWidth
      carousel.scrollTo({
        left: scrollPosition,
        behavior: "smooth"
      })
    }
  }

  // Handle manual scroll
  const handleScroll = () => {
    if (carouselRef.current && !isDragging) {
      const carousel = carouselRef.current
      const itemWidth = carousel.clientWidth / 3
      const newIndex = Math.round(carousel.scrollLeft / itemWidth)
      if (newIndex !== currentIndex && newIndex >= 0 && newIndex < trendingAnimes.length) {
        setCurrentIndex(newIndex)
      }
    }
  }

  // Mouse/Touch drag handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true)
    setStartX(e.pageX - (carouselRef.current?.offsetLeft || 0))
    setScrollLeft(carouselRef.current?.scrollLeft || 0)
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return
    e.preventDefault()
    const x = e.pageX - (carouselRef.current?.offsetLeft || 0)
    const walk = (x - startX) * 1.5
    if (carouselRef.current) {
      carouselRef.current.scrollLeft = scrollLeft - walk
    }
  }

  const handleMouseUp = () => {
    setIsDragging(false)
    handleScroll()
  }

  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true)
    setStartX(e.touches[0].pageX - (carouselRef.current?.offsetLeft || 0))
    setScrollLeft(carouselRef.current?.scrollLeft || 0)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return
    const x = e.touches[0].pageX - (carouselRef.current?.offsetLeft || 0)
    const walk = (x - startX) * 1.5
    if (carouselRef.current) {
      carouselRef.current.scrollLeft = scrollLeft - walk
    }
  }

  const handleTouchEnd = () => {
    setIsDragging(false)
    handleScroll()
  }

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
          src="https://i.postimg.cc/R0Z7mhQq/Screenshot-2026-01-25-085527-removebg-preview.png"
          alt="MoviesVerseBD Logo"
          className="relative z-20 w-72 h-72 object-contain"
        />
      </div>

      <div className="relative z-20 -mt-4 mb-6 flex flex-col items-center justify-center">
        <h2
          className="text-xl font-bold text-center tracking-wider animate-pulse"
          style={{
            fontFamily: "'Times New Roman', serif",
            letterSpacing: "0.2em",
            background: "linear-gradient(to right, #ff6b00, #ffa500, #ff6b00)",
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
            color: "transparent",
            textShadow: "0 0 10px rgba(255, 107, 0, 0.7), 0 0 15px rgba(255, 165, 0, 0.5)",
            animation: "fireGlow 2s ease-in-out infinite alternate",
          }}
        >
          Trending Now
        </h2>
        <p className="text-green-500 text-sm mt-2 font-semibold">{totalAnimeCount} anime & series uploaded</p>
        <style jsx>{`
          @keyframes fireGlow {
            0% {
              text-shadow: 0 0 8px rgba(255, 107, 0, 0.7), 0 0 15px rgba(255, 165, 0, 0.5);
              background: linear-gradient(to right, #ff6b00, #ffa500, #ff6b00);
              -webkit-background-clip: text;
              background-clip: text;
            }
            100% {
              text-shadow: 0 0 12px rgba(255, 107, 0, 0.9), 0 0 20px rgba(255, 165, 0, 0.7);
              background: linear-gradient(to right, #ffa500, #ff6b00, #ffa500);
              -webkit-background-clip: text;
              background-clip: text;
            }
          }
        `}</style>
      </div>

      <div className="relative z-10 overflow-hidden">
        <div
          ref={carouselRef}
          className="flex gap-4 overflow-x-auto scrollbar-hide snap-x snap-mandatory cursor-grab active:cursor-grabbing"
          style={{
            scrollBehavior: "smooth",
            scrollbarWidth: "none",
            msOverflowStyle: "none",
          }}
          onScroll={handleScroll}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {trendingAnimes.map((anime) => (
            <div
              key={anime.id}
              className="flex-shrink-0 w-1/3 aspect-[2/3] rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-all duration-500 transform hover:scale-105 cursor-pointer snap-start"
              onClick={() => onAnimeClick(anime)}
            >
              <img
                src={anime.poster || "/placeholder.svg"}
                alt={anime.title}
                className="w-full h-full object-cover pointer-events-none"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Indicator Dots */}
      <div className="flex justify-center gap-2 mt-4 mb-4">
        {trendingAnimes.map((_, index) => (
          <div
            key={index}
            className={`w-2 h-2 rounded-full transition-all cursor-pointer ${
              index === currentIndex ? "bg-green-500 w-6" : "bg-slate-600 hover:bg-slate-500"
            }`}
            onClick={() => {
              setCurrentIndex(index)
              scrollToIndex(index)
            }}
          />
        ))}
      </div>

      <style jsx global>{`
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
