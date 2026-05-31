"use client"

import { useState, useEffect, useRef } from "react"
import { animes } from "@/lib/anime-data"
import type { Anime } from "@/lib/anime-data"

const trendingIds = [173, 174, 176, 177, 178, 179, 180, 181, 182, 183, 184, 157, 158, 162, 161]

interface AnimeTrendingCarouselProps {
  onAnimeClick: (anime: Anime) => void
}

export default function AnimeTrendingCarousel({ onAnimeClick }: AnimeTrendingCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [startX, setStartX] = useState(0)
  const [scrollLeft, setScrollLeft] = useState(0)
  const [isAutoPlaying, setIsAutoPlaying] = useState(true)
  const carouselRef = useRef<HTMLDivElement>(null)
  const timeoutRef = useRef<NodeJS.Timeout>()
  
  const trendingAnimes = animes.filter((a) => trendingIds.includes(a.id))
  const totalAnimeCount = animes.length

  // Auto-scroll functionality
  useEffect(() => {
    if (!isAutoPlaying) return
    
    const interval = setInterval(() => {
      if (carouselRef.current && !isDragging) {
        const scrollAmount = carouselRef.current.clientWidth / 3
        const maxScroll = carouselRef.current.scrollWidth - carouselRef.current.clientWidth
        
        if (carouselRef.current.scrollLeft + scrollAmount >= maxScroll) {
          carouselRef.current.scrollTo({ left: 0, behavior: 'smooth' })
        } else {
          carouselRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' })
        }
        
        const newIndex = Math.round(carouselRef.current.scrollLeft / scrollAmount)
        setCurrentIndex(newIndex % trendingAnimes.length)
      }
    }, 3000)
    
    return () => clearInterval(interval)
  }, [isAutoPlaying, isDragging, trendingAnimes.length])

  // Handle manual scroll
  const handleScroll = () => {
    if (carouselRef.current && !isDragging) {
      const scrollAmount = carouselRef.current.clientWidth / 3
      const newIndex = Math.round(carouselRef.current.scrollLeft / scrollAmount)
      setCurrentIndex(newIndex % trendingAnimes.length)
    }
  }

  // Mouse/Touch drag handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true)
    setIsAutoPlaying(false)
    setStartX(e.pageX - (carouselRef.current?.offsetLeft || 0))
    setScrollLeft(carouselRef.current?.scrollLeft || 0)
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !carouselRef.current) return
    e.preventDefault()
    const x = e.pageX - (carouselRef.current.offsetLeft || 0)
    const walk = (x - startX) * 1.5
    carouselRef.current.scrollLeft = scrollLeft - walk
  }

  const handleMouseUp = () => {
    setIsDragging(false)
    timeoutRef.current = setTimeout(() => {
      setIsAutoPlaying(true)
    }, 5000)
  }

  const handleMouseLeave = () => {
    if (isDragging) {
      setIsDragging(false)
      timeoutRef.current = setTimeout(() => {
        setIsAutoPlaying(true)
      }, 5000)
    }
  }

  // Touch events for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true)
    setIsAutoPlaying(false)
    setStartX(e.touches[0].pageX - (carouselRef.current?.offsetLeft || 0))
    setScrollLeft(carouselRef.current?.scrollLeft || 0)
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || !carouselRef.current) return
    const x = e.touches[0].pageX - (carouselRef.current.offsetLeft || 0)
    const walk = (x - startX) * 1.5
    carouselRef.current.scrollLeft = scrollLeft - walk
  }

  const handleTouchEnd = () => {
    setIsDragging(false)
    timeoutRef.current = setTimeout(() => {
      setIsAutoPlaying(true)
    }, 5000)
  }

  // Manual navigation with buttons
  const scrollLeftManual = () => {
    if (carouselRef.current) {
      setIsAutoPlaying(false)
      const scrollAmount = carouselRef.current.clientWidth / 3
      carouselRef.current.scrollBy({ left: -scrollAmount, behavior: 'smooth' })
      
      timeoutRef.current = setTimeout(() => {
        setIsAutoPlaying(true)
      }, 5000)
    }
  }

  const scrollRightManual = () => {
    if (carouselRef.current) {
      setIsAutoPlaying(false)
      const scrollAmount = carouselRef.current.clientWidth / 3
      carouselRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' })
      
      timeoutRef.current = setTimeout(() => {
        setIsAutoPlaying(true)
      }, 5000)
    }
  }

  // Indicator dot click
  const goToSlide = (index: number) => {
    if (carouselRef.current) {
      setIsAutoPlaying(false)
      const scrollAmount = carouselRef.current.clientWidth / 3
      carouselRef.current.scrollTo({ left: index * scrollAmount, behavior: 'smooth' })
      setCurrentIndex(index)
      
      timeoutRef.current = setTimeout(() => {
        setIsAutoPlaying(true)
      }, 5000)
    }
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

      {/* Navigation Buttons */}
      <div className="relative z-20 flex justify-between items-center mb-4">
        <button
          onClick={scrollLeftManual}
          className="bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-all duration-300 backdrop-blur-sm"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <button
          onClick={scrollRightManual}
          className="bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-all duration-300 backdrop-blur-sm"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Carousel Container - Free Scrolling */}
      <div 
        ref={carouselRef}
        className="relative z-10 overflow-x-auto scroll-smooth hide-scrollbar cursor-grab active:cursor-grabbing"
        style={{
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          WebkitOverflowScrolling: 'touch'
        }}
        onScroll={handleScroll}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div className="flex gap-4" style={{ width: 'max-content' }}>
          {[...trendingAnimes, ...trendingAnimes, ...trendingAnimes].map((anime, index) => (
            <div
              key={`${anime.id}-${index}`}
              className="flex-shrink-0 w-64 md:w-72 lg:w-80 aspect-[2/3] rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-all duration-500 transform hover:scale-105 cursor-pointer relative"
              onClick={() => onAnimeClick(anime)}
            >
              <img
                src={anime.poster || "/placeholder.svg"}
                alt={anime.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                <p className="text-white text-sm font-semibold truncate">{anime.title}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Indicator Dots */}
      <div className="flex justify-center gap-2 mt-4 mb-4">
        {trendingAnimes.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`transition-all duration-300 ${
              index === currentIndex 
                ? "bg-green-500 w-6 h-2" 
                : "bg-slate-600 w-2 h-2 hover:bg-slate-500"
            } rounded-full`}
          />
        ))}
      </div>

      {/* Fixed: CSS with proper dot and curly braces */}
      <style jsx>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </section>
  )
}
