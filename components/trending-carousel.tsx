"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { movies } from "@/lib/movie-data"

// ✅ ১. উপরের "Top Movie Series" এর জন্য আলাদা আইডি (এখানে আপনার আইডি বসান)
const topSeriesIds = [3323, 3325, 3329, 3336, 3337, 3338] 

// ✅ ২. নিচের "Trending Movies" কারোসেলের জন্য আলাদা আইডি (এখানে আপনার আইডি বসান)
const trendingIds = [3340, 3341, 3342, 3344, 3345, 3346, 3347, 3348] 

interface TrendingCarouselProps {
  onMovieClick: (movie: (typeof movies)[0]) => void
}

export default function TrendingCarousel({ onMovieClick }: TrendingCarouselProps) {
  
  // ✅ টপ স্লাইডারের স্টেট
  const [topIndex, setTopIndex] = useState(0)
  
  // ✅ ট্রেন্ডিং কারোসেলের স্টেট
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [dragDistance, setDragDistance] = useState(0) // এটি পিক্সেলে ড্র্যাগ দূরত্ব
  const [isMobile, setIsMobile] = useState(false)
  const [isTransitioning, setIsTransitioning] = useState(true)
  
  const startXRef = useRef(0)
  const autoSlideRef = useRef<NodeJS.Timeout | null>(null)
  const topAutoSlideRef = useRef<NodeJS.Timeout | null>(null)

  // ✅ ডাটা ফিল্টার
  const topSeriesMovies = movies.filter((m) => topSeriesIds.includes(m.id))
  const trendingMovies = movies.filter((m) => trendingIds.includes(m.id))
  const totalMovieCount = movies.length

  // ✅ মোবাইল ডিটেক্ট
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener("resize", checkMobile)
    return () => window.removeEventListener("resize", checkMobile)
  }, [])

  // ✅ উপরের স্লাইডারের অটো স্লাইড (৪ সেকেন্ড)
  useEffect(() => {
    if (topSeriesMovies.length === 0) return
    topAutoSlideRef.current = setInterval(() => {
      setTopIndex((prev) => (prev + 1) % topSeriesMovies.length)
    }, 4000)
    return () => {
      if (topAutoSlideRef.current) clearInterval(topAutoSlideRef.current)
    }
  }, [topSeriesMovies.length])

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

  // ✅ Tab Visibility (নিচের কারোসেলের জন্য)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) stopAutoSlide()
      else startAutoSlide()
    }
    document.addEventListener("visibilitychange", handleVisibilityChange)
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange)
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

  // ✅ Swipe Handlers (নিচের কারোসেলের জন্য - Free Swipe)
  const handleDragStart = (clientX: number) => {
    setIsDragging(true)
    setIsTransitioning(false) // ড্র্যাগ শুরু হলে ট্রানজিশন বন্ধ (সাথে সাথে সরবে)
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
    setIsTransitioning(true) // ছেড়ে দিলে ট্রানজিশন চালু হবে

    // ✅ কার্ডের প্রস্থ অনুযায়ী কতটুকু টানা হয়েছে তা নির্ণয় (মোবাইলে ১৪০px, ডেস্কটপে ২৪০px)
    const cardWidth = isMobile ? 140 : 240
    const threshold = cardWidth * 0.2 // ২০% টানা হলেই স্লাইড হবে (আপনি চাইলে পরিবর্তন করতে পারেন)

    if (dragDistance < -threshold) {
      // বামে টানা -> পরের মুভি
      setCurrentIndex((prev) => (prev + 1) % trendingMovies.length)
    } else if (dragDistance > threshold) {
      // ডানে টানা -> আগের মুভি
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

  // ✅ 3D কার্ড পজিশন (Free Swipe সহ)
  const getCardStyle = (index: number) => {
    const total = trendingMovies.length
    let offset = (index - currentIndex + total) % total
    if (offset > total / 2) offset -= total

    // ✅ ড্র্যাগের অনুপাত নির্ণয় (কার্ডের প্রস্থের সাপেক্ষে)
    const cardWidth = isMobile ? 140 : 240
    const dragProgress = dragDistance / cardWidth
    const adjustedOffset = offset + dragProgress

    // ✅ কার্ডগুলো ৪টির বেশি দূরে থাকলে হাইড
    if (adjustedOffset < -4 || adjustedOffset > 4) {
      return { opacity: 0, transform: 'scale(0)', pointerEvents: 'none' as const, zIndex: 0 }
    }

    let x = 0, z = 0, scale = 1, opacity = 1, shadow = '', rotateY = 0

    const xSpacing = isMobile ? 110 : 130
    const zSpacing = -70

    // ✅ কার্ডের পজিশন ক্যালকুলেশন (আগের মতোই, তবে adjustedOffset এখন ড্র্যাগের সাথে ১:১)
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

    // ✅ যদি কার্ডটি একদম সেন্টারে থাকে (এবং ড্র্যাগ না করা হয়), তবে এটাকে স্পেশাল শ্যাডো দিন
    if (offset === 0 && Math.abs(dragProgress) < 0.05) {
      x = 0; z = 0; scale = 1; opacity = 1; rotateY = 0
      shadow = '0 30px 60px rgba(0, 0, 0, 0.9), 0 0 30px rgba(255, 255, 255, 0.05)'
    }

    return {
      transform: `translateX(${x}px) translateZ(${z}px) scale(${scale}) rotateY(${rotateY}deg)`,
      opacity, boxShadow: shadow,
      zIndex: Math.round(100 - Math.abs(adjustedOffset) * 10),
    }
  }

  return (
    <section className="relative pb-4 overflow-hidden bg-black">
      
      {/* ========================================================= */}
      {/* ✅✅✅ ১. উপরের সেকশন: Top Movie Series (লোগো ছাড়া) ✅✅✅ */}
      {/* ========================================================= */}
      <div className="relative w-full h-[300px] md:h-[500px] overflow-hidden">
        {topSeriesMovies.length > 0 && (
          <>
            {/* বড় পোস্টার (স্লাইড অ্যানিমেশন) */}
            <div className="absolute inset-0 transition-opacity duration-700 ease-in-out">
              <img
                src={topSeriesMovies[topIndex]?.poster || "/placeholder.svg"}
                alt={topSeriesMovies[topIndex]?.title || "Top Series"}
                className="w-full h-full object-cover object-top"
              />
              {/* টেক্সট পড়ার জন্য গ্রেডিয়েন্ট ওভারলে */}
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
              <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-transparent to-transparent" />
            </div>

            {/* টপ স্লাইডারের টেক্সট এবং নাম */}
            <div className="absolute bottom-0 left-0 w-full p-4 md:p-8 z-10">
              <h2 className="text-white text-2xl md:text-4xl font-bold mb-2 drop-shadow-lg">
                {topSeriesMovies[topIndex]?.title}
              </h2>
              <div className="flex items-center gap-3 text-sm md:text-base text-gray-300">
                {topSeriesMovies[topIndex]?.year && <span>{topSeriesMovies[topIndex]?.year}</span>}
                {topSeriesMovies[topIndex]?.rating && topSeriesMovies[topIndex]?.rating !== "not available" && (
                  <span className="text-yellow-400">⭐ {topSeriesMovies[topIndex]?.rating}</span>
                )}
              </div>
            </div>

            {/* টপ স্লাইডারের ডট ইন্ডিকেটর */}
            <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex gap-2 z-20">
              {topSeriesMovies.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setTopIndex(idx)}
                  className={`w-2 h-2 rounded-full transition-all duration-300 ${
                    idx === topIndex ? "bg-green-500 w-6" : "bg-gray-500 hover:bg-gray-300"
                  }`}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* ========================================================= */}
      {/* ✅✅✅ ২. নিচের সেকশন: Trending Movies (Free Swipe) ✅✅✅ */}
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
              style={{
                ...getCardStyle(idx),
                transition: isTransitioning ? "all 0.5s cubic-bezier(0.25, 1, 0.5, 1)" : "none", // ✅ ড্র্যাগের সময় ট্রানজিশন বন্ধ, ছেড়ে দিলে স্মুথ
              }}
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
