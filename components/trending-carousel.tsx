"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { ChevronLeft, ChevronRight, Play, Film, Star } from "lucide-react"
import { movies } from "@/lib/movie-data"

// ✅ ১. উপরের "Top Movie Series" এর জন্য আলাদা আইডি (এখানে আপনার আইডি বসান)
const topSeriesIds = [3323, 3389, 3365, 3364, 3363, 3362, 3361, 3360, 3356, 3355, 3352, 3351, 3326, 3321, 3302]

// ✅ ২. নিচের "Trending Movies" কারোসেলের জন্য আলাদা আইডি (এখানে আপনার আইডি বসান)
const trendingIds = [3360, 3361, 3362, 3363, 3364, 3365, 3366, 3367, 3368, 3369, 3370, 3371, 3373, 3375, 3376, 3377, 3379, 3380, 3382, 3383, 3386, 3387, 3355, 3354, 3352, 3351, 3350, 3349, 3348, 3347, 3346, 3345, 3344, 3342, 3341, 3340, 3339, 3338, 3337, 3335, 3389, 3388]

interface TrendingCarouselProps {
  onMovieClick: (movie: (typeof movies)[0]) => void
}

export default function TrendingCarousel({ onMovieClick }: TrendingCarouselProps) {
  // ✅ স্টেট
  const [topIndex, setTopIndex] = useState(0)
  const [topDragDistance, setTopDragDistance] = useState(0)
  const [topIsDragging, setTopIsDragging] = useState(false)
  const [topIsTransitioning, setTopIsTransitioning] = useState(true)
  const [containerWidth, setContainerWidth] = useState(0)

  const [currentIndex, setCurrentIndex] = useState(0)
  const [dragDistance, setDragDistance] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [isTransitioning, setIsTransitioning] = useState(true)
  const [isMobile, setIsMobile] = useState(false)

  // ✅ রেফারেন্স
  const topStartXRef = useRef(0)
  const startXRef = useRef(0)
  const autoSlideRef = useRef<NodeJS.Timeout | null>(null)
  const topAutoSlideRef = useRef<NodeJS.Timeout | null>(null)
  const topContainerRef = useRef<HTMLDivElement>(null)

  // ✅ ডাটা ফিল্টার
  const topSeriesMovies = movies.filter((m) => topSeriesIds.includes(m.id))
  const trendingMovies = movies.filter((m) => trendingIds.includes(m.id))
  const totalMovieCount = movies.length

  // ✅ মোবাইল এবং কন্টেইনার উইডথ ডিটেক্ট
  useEffect(() => {
    const updateSize = () => {
      setIsMobile(window.innerWidth < 768)
      if (topContainerRef.current) {
        setContainerWidth(topContainerRef.current.offsetWidth)
      }
    }
    updateSize()
    window.addEventListener("resize", updateSize)
    setTimeout(updateSize, 100)
    return () => window.removeEventListener("resize", updateSize)
  }, [])

  // ✅ উপরের স্লাইডারের অটো স্লাইড (৪ সেকেন্ড)
  useEffect(() => {
    if (topSeriesMovies.length === 0) return
    if (topIsDragging) return

    if (topAutoSlideRef.current) clearInterval(topAutoSlideRef.current)
    topAutoSlideRef.current = setInterval(() => {
      setTopIndex((prev) => (prev + 1) % topSeriesMovies.length)
    }, 4000)
    return () => {
      if (topAutoSlideRef.current) clearInterval(topAutoSlideRef.current)
    }
  }, [topSeriesMovies.length, topIsDragging])

  // ✅ নিচের কারোসেলের অটো স্লাইড (৩ সেকেন্ড)
  const startAutoSlide = useCallback(() => {
    if (autoSlideRef.current) clearInterval(autoSlideRef.current)
    autoSlideRef.current = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % trendingMovies.length)
    }, 3000)
  }, [trendingMovies.length])

  const stopAutoSlide = useCallback(() => {
    if (autoSlideRef.current) {
      clearInterval(autoSlideRef.current)
      autoSlideRef.current = null
    }
  }, [])

  useEffect(() => {
    startAutoSlide()
    return () => stopAutoSlide()
  }, [startAutoSlide, stopAutoSlide])

  // ✅ কীবোর্ড কন্ট্রোল (নিচের কারোসেলের জন্য)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") setCurrentIndex((prev) => (prev + 1) % trendingMovies.length)
      else if (e.key === "ArrowLeft") setCurrentIndex((prev) => (prev - 1 + trendingMovies.length) % trendingMovies.length)
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [trendingMovies.length])

  // ✅ নিচের কারোসেলের নেভিগেশন
  const handlePrev = () => {
    setIsTransitioning(true)
    setCurrentIndex((prev) => (prev - 1 + trendingMovies.length) % trendingMovies.length)
  }
  const handleNext = () => {
    setIsTransitioning(true)
    setCurrentIndex((prev) => (prev + 1) % trendingMovies.length)
  }

  // =========================================================
  // ✅ উপরের স্লাইডারের Swipe Handlers (Infinite Loop + Free Swipe)
  // =========================================================
  const handleTopDragStart = (clientX: number) => {
    setTopIsDragging(true)
    setTopIsTransitioning(false)
    topStartXRef.current = clientX
    if (topAutoSlideRef.current) clearInterval(topAutoSlideRef.current)
  }

  const handleTopDragMove = (clientX: number) => {
    if (!topIsDragging) return
    setTopDragDistance(clientX - topStartXRef.current)
  }

  const handleTopDragEnd = () => {
    if (!topIsDragging) return
    setTopIsDragging(false)
    setTopIsTransitioning(true)

    const threshold = containerWidth * 0.15

    if (topDragDistance < -threshold) {
      setTopIndex((prev) => (prev + 1) % topSeriesMovies.length)
    } else if (topDragDistance > threshold) {
      setTopIndex((prev) => (prev - 1 + topSeriesMovies.length) % topSeriesMovies.length)
    }

    setTopDragDistance(0)
  }

  const handleTopTouchStart = (e: React.TouchEvent) => handleTopDragStart(e.touches[0].clientX)
  const handleTopTouchMove = (e: React.TouchEvent) => handleTopDragMove(e.touches[0].clientX)
  const handleTopTouchEnd = handleTopDragEnd

  const handleTopMouseDown = (e: React.MouseEvent) => handleTopDragStart(e.clientX)
  const handleTopMouseMove = (e: React.MouseEvent) => handleTopDragMove(e.clientX)
  const handleTopMouseUp = handleTopDragEnd

  // =========================================================
  // ✅ নিচের কারোসেলের Swipe Handlers (Free Swipe)
  // =========================================================
  const handleDragStart = (clientX: number) => {
    setIsDragging(true)
    setIsTransitioning(false)
    startXRef.current = clientX
    stopAutoSlide()
  }

  const handleDragMove = (clientX: number) => {
    if (!isDragging) return
    setDragDistance(clientX - startXRef.current)
  }

  const handleDragEnd = () => {
    if (!isDragging) return
    setIsDragging(false)
    setIsTransitioning(true)

    const cardWidth = isMobile ? 140 : 240
    const threshold = cardWidth * 0.2

    if (dragDistance < -threshold) {
      setCurrentIndex((prev) => (prev + 1) % trendingMovies.length)
    } else if (dragDistance > threshold) {
      setCurrentIndex((prev) => (prev - 1 + trendingMovies.length) % trendingMovies.length)
    }

    setDragDistance(0)
    startAutoSlide()
  }

  const handleTouchStart = (e: React.TouchEvent) => handleDragStart(e.touches[0].clientX)
  const handleTouchMove = (e: React.TouchEvent) => handleDragMove(e.touches[0].clientX)
  const handleTouchEnd = handleDragEnd

  const handleMouseDown = (e: React.MouseEvent) => handleDragStart(e.clientX)
  const handleMouseMove = (e: React.MouseEvent) => handleDragMove(e.clientX)
  const handleMouseUp = handleDragEnd

  const handleMouseWheel = (e: React.WheelEvent) => {
    if (isDragging) return
    if (e.deltaY > 0) handleNext()
    else handlePrev()
  }

  // =========================================================
  // ✅ উপরের স্লাইডারের পজিশন (ট্রেন্ডিং এর মতো পাশাপাশি পোস্টার)
  // =========================================================
  // ✅ মূল ঠিক: topIndex এবং topDragDistance একসাথে ক্যালকুলেট
  const topTranslateX = -(topIndex * containerWidth) + topDragDistance

  // ✅ নিচের কারোসেলের 3D কার্ড পজিশন (Free Swipe)
  const getCardStyle = (index: number) => {
    const total = trendingMovies.length
    let offset = (index - currentIndex + total) % total
    if (offset > total / 2) offset -= total

    const cardWidth = isMobile ? 140 : 240
    const dragProgress = dragDistance / cardWidth
    const adjustedOffset = offset + dragProgress

    if (adjustedOffset < -4 || adjustedOffset > 4) {
      return { opacity: 0, transform: 'scale(0)', pointerEvents: 'none' as const, zIndex: 0 }
    }

    let x = 0, z = 0, scale = 1, opacity = 1, shadow = '', rotateY = 0

    const xSpacing = isMobile ? 110 : 130
    const zSpacing = -70

    if (adjustedOffset >= 0 && adjustedOffset <= 1) {
      const p = adjustedOffset
      x = xSpacing * p; z = zSpacing * p; scale = 1 - (0.15 * p); opacity = 1 - (0.3 * p)
      shadow = p > 0.5 ? '0 15px 30px rgba(0,0,0,0.5)' : '0 30px 60px rgba(0,0,0,0.9)'
      rotateY = 5 * p
    } else if (adjustedOffset > 1 && adjustedOffset <= 4) {
      const p = adjustedOffset - 1
      const stepX = xSpacing + (xSpacing * 0.75 * p)
      x = stepX; z = zSpacing - (zSpacing * 0.6 * p); scale = 0.85 - (0.12 * p); opacity = 0.7 - (0.2 * p)
      shadow = '0 10px 20px rgba(0,0,0,0.4)'; rotateY = 5 + (2 * p)
    } else if (adjustedOffset < 0 && adjustedOffset >= -1) {
      const p = Math.abs(adjustedOffset)
      x = -xSpacing * p; z = zSpacing * p; scale = 1 - (0.15 * p); opacity = 1 - (0.3 * p)
      shadow = p > 0.5 ? '0 15px 30px rgba(0,0,0,0.5)' : '0 30px 60px rgba(0,0,0,0.9)'
      rotateY = -5 * p
    } else if (adjustedOffset < -1 && adjustedOffset >= -4) {
      const p = Math.abs(adjustedOffset) - 1
      const stepX = -xSpacing - (xSpacing * 0.75 * p)
      x = stepX; z = zSpacing - (zSpacing * 0.6 * p); scale = 0.85 - (0.12 * p); opacity = 0.7 - (0.2 * p)
      shadow = '0 10px 20px rgba(0,0,0,0.4)'; rotateY = -5 - (2 * p)
    } else {
      x = adjustedOffset > 0 ? 600 : -600; z = -400; scale = 0.4; opacity = 0; shadow = 'none'; rotateY = 0
    }

    if (offset === 0 && Math.abs(dragProgress) < 0.05) {
      x = 0; z = 0; scale = 1; opacity = 1; rotateY = 0
      shadow = '0 30px 60px rgba(0, 0, 0, 0.9), 0 0 30px rgba(255, 255, 255, 0.05)'
    }

    return {
      transform: `translateX(${x}px) translateZ(${z}px) scale(${scale}) rotateY(${rotateY}deg)`,
      opacity, boxShadow: shadow,
      zIndex: Math.round(100 - Math.abs(adjustedOffset) * 10),
      transition: isTransitioning ? "all 0.5s cubic-bezier(0.25, 1, 0.5, 1)" : "none",
    }
  }

  // ✅ উপরের স্লাইডারের কারেন্ট মুভি (টেক্সট সেকশনের জন্য)
  const currentTopMovie = topSeriesMovies[topIndex]

  return (
    <section className="relative pb-4 overflow-hidden bg-black">

      {/* ========================================================= */}
      {/* ✅✅✅ ১. উপরের সেকশন: Top Movie Series (স্লাইডিং পোস্টার) ✅✅✅ */}
      {/* ========================================================= */}
      <div
        ref={topContainerRef}
        className="relative w-full h-[350px] md:h-[550px] overflow-hidden cursor-grab active:cursor-grabbing select-none bg-gray-900"
        style={{ touchAction: "pan-y" }}
        onTouchStart={handleTopTouchStart}
        onTouchMove={handleTopTouchMove}
        onTouchEnd={handleTopTouchEnd}
        onMouseDown={handleTopMouseDown}
        onMouseMove={handleTopMouseMove}
        onMouseUp={handleTopMouseUp}
        onMouseLeave={handleTopMouseUp}
      >
        {topSeriesMovies.length > 0 && currentTopMovie && (
          <>
            {/* ✅ ১.১ সব পোস্টার পাশাপাশি (ট্রেন্ডিং এর মতো) */}
            <div
              className="absolute inset-0 flex"
              style={{
                width: `${topSeriesMovies.length * 100}%`,
                transform: `translateX(${topTranslateX}px)`,
                transition: topIsTransitioning ? "transform 0.5s cubic-bezier(0.25, 1, 0.5, 1)" : "none",
              }}
            >
              {topSeriesMovies.map((movie, idx) => (
                <div
                  key={movie.id}
                  className="relative h-full flex-shrink-0"
                  style={{ width: `${100 / topSeriesMovies.length}%` }}
                >
                  <img
                    src={movie.poster || "/placeholder.svg"}
                    alt={movie.title}
                    className="w-full h-full object-cover object-top pointer-events-none"
                  />
                </div>
              ))}
            </div>

            {/* ✅ ১.২ গ্রেডিয়েন্ট ওভারলে (টেক্সট পড়ার জন্য) */}
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent pointer-events-none" />
            <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-transparent to-transparent pointer-events-none" />

            {/* ✅ ১.৩ ক্লিক করার জন্য ট্রান্সপারেন্ট ওভারলে */}
            <div
              className="absolute inset-0 z-10"
              onClick={() => {
                if (Math.abs(topDragDistance) < 5) {
                  onMovieClick(currentTopMovie)
                }
              }}
              style={{ cursor: "pointer" }}
            />

            {/* ✅ ১.৪ নিচের টেক্সট সেকশন (স্ক্রিনশটের মতো) */}
            <div className="absolute bottom-0 left-0 w-full p-4 md:p-6 z-20 pointer-events-none flex items-end gap-4">
              
              {/* ছোট থাম্বনেইল পোস্টার */}
              <div className="w-16 h-24 md:w-20 md:h-28 rounded-lg overflow-hidden border-2 border-white/20 shadow-lg flex-shrink-0">
                <img
                  src={currentTopMovie.poster || "/placeholder.svg"}
                  alt={currentTopMovie.title}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* টাইটেল, ইয়ার, রেটিং, জেনার */}
              <div className="flex-1 min-w-0 pb-1">
                <h2 className="text-white text-lg md:text-2xl font-bold mb-1 truncate drop-shadow-lg">
                  {currentTopMovie.title}
                </h2>
                <div className="flex items-center gap-3 text-xs md:text-sm text-gray-300">
                  {currentTopMovie.year && (
                    <span className="flex items-center gap-1">
                      <Film className="w-3 h-3 md:w-4 md:h-4" /> {currentTopMovie.year}
                    </span>
                  )}
                  {currentTopMovie.rating && currentTopMovie.rating !== "not available" && (
                    <span className="flex items-center gap-1 text-yellow-400">
                      <Star className="w-3 h-3 md:w-4 md:h-4 fill-yellow-400" /> {currentTopMovie.rating}
                    </span>
                  )}
                  {currentTopMovie.genre && (
                    <span className="truncate">{currentTopMovie.genre}</span>
                  )}
                </div>
              </div>

              {/* প্লে বাটন (স্ক্রিনশটের মতো) */}
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0 shadow-lg">
                <Play className="w-5 h-5 md:w-6 md:h-6 text-white fill-white ml-0.5" />
              </div>
            </div>
          </>
        )}
      </div>

      {/* ========================================================= */}
      {/* ✅✅✅ ২. নিচের সেকশন: Trending Movies (3D Carousel) ✅✅✅ */}
      {/* ========================================================= */}
      <div className="relative z-10 px-4 mt-2">

        {/* Trending Now Title */}
        <div className="relative z-20 mb-1 flex flex-col items-center justify-center">
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
          <style jsx>{`
            @keyframes fireGlow {
              0% {
                text-shadow: 0 0 8px rgba(255, 107, 0, 0.7), 0 0 15px rgba(255, 165, 0, 0.5);
                background: linear-gradient(to right, #ff6b00, #ffa500, #ff6b00);
                -webkit-background-clip: text;
                background-clip: text;
              }
              100% {
                text-shadow: 0 0 15px rgba(255, 107, 0, 0.9), 0 0 25px rgba(255, 165, 0, 0.7), 0 0 35px rgba(255, 69, 0, 0.6);
                background: linear-gradient(to right, #ff4500, #ff8c00, #ff4500);
                -webkit-background-clip: text;
                background-clip: text;
              }
            }
          `}</style>
        </div>

        {/* Counter */}
        <p className="text-center text-green-400 text-sm mb-3 font-medium relative z-20">
          {totalMovieCount} Movie & Series Uploaded
        </p>

        {/* ✅ 3D Card Carousel with Free Swipe */}
        <div
          className="relative z-20 flex justify-center items-center h-[280px] md:h-[480px] w-full cursor-grab active:cursor-grabbing select-none"
          style={{ touchAction: "pan-y", perspective: "1400px" }}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onWheel={handleMouseWheel}
        >
          {trendingMovies.map((movie, idx) => (
            <div
              key={movie.id}
              className="absolute w-[140px] h-[190px] md:w-[240px] md:h-[360px] rounded-2xl overflow-hidden hover:scale-105 cursor-pointer"
              style={getCardStyle(idx)}
              onClick={() => onMovieClick(movie)}
            >
              <img
                src={movie.poster || "/placeholder.svg"}
                alt={movie.title}
                className="w-full h-full object-cover pointer-events-none"
              />

              {movie.rating && movie.rating !== "not available" && (
                <span className="absolute top-1.5 right-1.5 md:top-2 md:right-2 bg-black/70 text-white text-[9px] md:text-sm px-1.5 py-0.5 md:px-2.5 md:py-1 rounded-full font-semibold border border-white/20">
                  ⭐ {movie.rating}
                </span>
              )}
              <div className="absolute bottom-0 left-0 w-full p-2 md:p-4 bg-gradient-to-t from-black/90 to-transparent">
                <h3 className="text-white text-[10px] md:text-base font-bold truncate">{movie.title}</h3>
                {movie.year && <p className="text-gray-300 text-[8px] md:text-xs">{movie.year}</p>}
              </div>
            </div>
          ))}
        </div>

        {/* Navigation Buttons */}
        <button
          onClick={handlePrev}
          className="absolute left-2 md:left-6 top-[60%] transform -translate-y-1/2 z-30 hidden md:flex items-center justify-center w-12 h-12 rounded-full carousel-nav-button text-white"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        <button
          onClick={handleNext}
          className="absolute right-2 md:right-6 top-[60%] transform -translate-y-1/2 z-30 hidden md:flex items-center justify-center w-12 h-12 rounded-full carousel-nav-button text-white"
        >
          <ChevronRight className="w-6 h-6" />
        </button>

        <style>{`
          @keyframes carouselNavGlow {
            0%, 100% { box-shadow: 0 0 15px rgba(34, 197, 94, 0.6), inset 0 0 20px rgba(255, 255, 255, 0.1); }
            50% { box-shadow: 0 0 25px rgba(34, 197, 94, 0.8), inset 0 0 30px rgba(255, 255, 255, 0.15); }
          }
          .carousel-nav-button {
            background: rgba(34, 197, 94, 0.15);
            backdrop-filter: blur(20px);
            border: 1px solid rgba(34, 197, 94, 0.4);
            transition: all 0.3s ease;
            animation: carouselNavGlow 0.8s ease-in-out infinite;
          }
          .carousel-nav-button:hover {
            background: rgba(34, 197, 94, 0.25);
            backdrop-filter: blur(25px);
            border: 1px solid rgba(34, 197, 94, 0.6);
            transform: scale(1.1) translateY(-50%);
          }
        `}</style>
      </div>
    </section>
  )
              }
