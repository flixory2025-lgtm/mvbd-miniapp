"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { movies } from "@/lib/movie-data"

const trendingIds = [3360, 3361, 3362, 3363, 3364, 3365, 3366, 3367, 3368, 3369, 3370, 3371, 3373, 3375, 3376, 3377, 3379, 3380, 3382, 3383, 3386, 3387, 3355, 3354, 3352, 3351, 3350, 3349, 3348, 3347, 3346, 3345, 3344, 3342, 3341, 3340, 3339, 3338, 3337, 3335, 3389, 3388]

interface TrendingCarouselProps {
  onMovieClick: (movie: (typeof movies)[0]) => void
}

export default function TrendingCarousel({ onMovieClick }: TrendingCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [dragDistance, setDragDistance] = useState(0)
  const [bgImage, setBgImage] = useState("")
  const [bgOpacity, setBgOpacity] = useState(1)
  
  const startXRef = useRef(0)
  const maxDragRef = useRef(0)
  const autoSlideRef = useRef<NodeJS.Timeout | null>(null)
  
  const trendingMovies = movies.filter((m) => trendingIds.includes(m.id))
  const totalMovieCount = movies.length

  // ✅ বর্তমান কার্ডের পোস্টার ব্যাকগ্রাউন্ডে সেট করা
  useEffect(() => {
    const currentMovie = trendingMovies[currentIndex]
    if (currentMovie && currentMovie.poster) {
      setBgOpacity(0.8)
      const timer = setTimeout(() => {
        setBgImage(currentMovie.poster || "")
        setBgOpacity(1)
      }, 200)
      return () => clearTimeout(timer)
    }
  }, [currentIndex, trendingMovies])

  // ✅ ৩ সেকেন্ড পর পর অটো স্লাইড
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

  // ✅ Tab Visibility
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) stopAutoSlide()
      else startAutoSlide()
    }
    document.addEventListener("visibilitychange", handleVisibilityChange)
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange)
  }, [startAutoSlide, stopAutoSlide])

  // ✅ কীবোর্ড কন্ট্রোল
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") setCurrentIndex((prev) => (prev + 1) % trendingMovies.length)
      else if (e.key === "ArrowLeft") setCurrentIndex((prev) => (prev - 1 + trendingMovies.length) % trendingMovies.length)
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [trendingMovies.length])

  const handlePrev = () => setCurrentIndex((prev) => (prev - 1 + trendingMovies.length) % trendingMovies.length)
  const handleNext = () => setCurrentIndex((prev) => (prev + 1) % trendingMovies.length)

  // ✅ Touch Swipe
  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true)
    startXRef.current = e.touches[0].clientX
    maxDragRef.current = 200
    stopAutoSlide()
  }
  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return
    setDragDistance(e.touches[0].clientX - startXRef.current)
  }
  const handleTouchEnd = () => {
    if (!isDragging) return
    setIsDragging(false)
    if (dragDistance < -50) handleNext()
    else if (dragDistance > 50) handlePrev()
    setDragDistance(0)
    startAutoSlide()
  }

  // ✅ Mouse Swipe
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true)
    startXRef.current = e.clientX
    maxDragRef.current = 200
    stopAutoSlide()
  }
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return
    setDragDistance(e.clientX - startXRef.current)
  }
  const handleMouseUp = () => {
    if (!isDragging) return
    setIsDragging(false)
    if (dragDistance < -50) handleNext()
    else if (dragDistance > 50) handlePrev()
    setDragDistance(0)
    startAutoSlide()
  }

  const handleMouseWheel = (e: React.WheelEvent) => {
    if (isDragging) return
    if (e.deltaY > 0) handleNext()
    else handlePrev()
  }

  // ✅ 3D কার্ড পজিশন
  const getCardStyle = (index: number) => {
    const total = trendingMovies.length
    let offset = (index - currentIndex + total) % total
    if (offset > total / 2) offset -= total

    const progress = maxDragRef.current > 0 ? dragDistance / maxDragRef.current : 0
    const adjustedOffset = offset + progress

    if (adjustedOffset < -2.5 || adjustedOffset > 2.5) {
      return { opacity: 0, transform: 'scale(0)', pointerEvents: 'none' as const, zIndex: 0 }
    }

    let x = 0, z = 0, scale = 1, opacity = 1, shadow = '', rotateY = 0

    if (adjustedOffset >= 0 && adjustedOffset <= 1) {
      const p = adjustedOffset
      x = 130 * p; z = -80 * p; scale = 1 - (0.15 * p); opacity = 1 - (0.3 * p)
      shadow = p > 0.5 ? '0 15px 30px rgba(0,0,0,0.5)' : '0 30px 60px rgba(0,0,0,0.9)'
      rotateY = 5 * p
    } else if (adjustedOffset > 1 && adjustedOffset <= 2) {
      const p = adjustedOffset - 1
      x = 130 + (80 * p); z = -80 - (60 * p); scale = 0.85 - (0.15 * p); opacity = 0.7 - (0.3 * p)
      shadow = '0 10px 20px rgba(0,0,0,0.4)'; rotateY = 5 + (3 * p)
    } else if (adjustedOffset < 0 && adjustedOffset >= -1) {
      const p = Math.abs(adjustedOffset)
      x = -130 * p; z = -80 * p; scale = 1 - (0.15 * p); opacity = 1 - (0.3 * p)
      shadow = p > 0.5 ? '0 15px 30px rgba(0,0,0,0.5)' : '0 30px 60px rgba(0,0,0,0.9)'
      rotateY = -5 * p
    } else if (adjustedOffset < -1 && adjustedOffset >= -2) {
      const p = Math.abs(adjustedOffset) - 1
      x = -130 - (80 * p); z = -80 - (60 * p); scale = 0.85 - (0.15 * p); opacity = 0.7 - (0.3 * p)
      shadow = '0 10px 20px rgba(0,0,0,0.4)'; rotateY = -5 - (3 * p)
    } else {
      x = adjustedOffset > 0 ? 300 : -300; z = -250; scale = 0.5; opacity = 0; shadow = 'none'; rotateY = 0
    }

    if (offset === 0 && Math.abs(progress) < 0.05) {
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
    <section className="relative px-4 py-2 overflow-hidden">
      
      {/* ✅✅✅ ১. উপরের ব্যাকগ্রাউন্ড (লোগোর পর থেকে ডার্ক) ✅✅✅ */}
      <div
        className="absolute top-0 left-0 w-full h-[500px] z-0 pointer-events-none"
        style={{
          backgroundImage: "url('https://i.postimg.cc/tRMc5ZNM/198b2f01e73b905772279616eccc7c65.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      >
        {/* ✅ লোগোর পর থেকে নিচে নামার সাথে সাথে একদম কালো হয়ে যাওয়ার গ্রেডিয়েন্ট */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/70 to-black" />
      </div>

      {/* ✅ কনটেন্ট এরিয়া */}
      <div className="relative z-10">
        
        {/* Logo */}
        <div className="relative flex justify-center -mt-4 mb-0">
          <img
            src="https://i.postimg.cc/Bn4cPRwz/20288-removebg-preview.png"
            alt="MoviesVerseBD Logo"
            className="relative z-20 w-72 h-72 object-contain"
          />
        </div>

        {/* Trending Now Title */}
        <div className="relative z-20 -mt-4 mb-1 flex flex-col items-center justify-center">
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
        <p className="text-center text-green-400 text-sm mb-3 font-medium relative z-20">{totalMovieCount} Movie & Series Uploaded</p>

        {/* ✅✅✅ ২. নিচের ব্যাকগ্রাউন্ড: মুভি পোস্টার (ব্লার ছাড়া, ক্লিন) ✅✅✅ */}
        <div
          className="absolute left-0 w-full z-0 pointer-events-none"
          style={{
            top: "55%",
            height: "45%",
            backgroundImage: bgImage ? `url('${bgImage}')` : 'none',
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
            opacity: bgOpacity,
            transition: "opacity 1s ease-in-out",
            // ✅ ব্লার সরিয়ে শুধু হালকা ডার্ক থিম রাখা হয়েছে
            filter: "brightness(0.6) contrast(1.1)",
          }}
        >
          {/* ✅ উপর থেকে নিচে কালো হওয়ার গ্রেডিয়েন্ট */}
          <div className="absolute top-0 left-0 w-full h-40 bg-gradient-to-b from-black/80 via-black/40 to-transparent" />
          {/* ✅ নিচ থেকে উপরে কালো হওয়ার গ্রেডিয়েন্ট */}
          <div className="absolute bottom-0 left-0 w-full h-40 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
        </div>

        {/* 3D Card Carousel */}
        <div
          className="relative z-20 flex justify-center items-center h-[280px] md:h-[340px] w-full cursor-grab active:cursor-grabbing select-none"
          style={{ touchAction: "pan-y", perspective: "1200px" }}
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
              className="absolute w-[160px] h-[220px] md:w-[220px] md:h-[300px] rounded-2xl overflow-hidden transition-all duration-500 ease-out hover:scale-105 cursor-pointer"
              style={getCardStyle(idx)}
              onClick={() => onMovieClick(movie)}
            >
              <img
                src={movie.poster || "/placeholder.svg"}
                alt={movie.title}
                className="w-full h-full object-cover pointer-events-none"
              />

              {movie.rating && movie.rating !== "not available" && (
                <span className="absolute top-2 right-2 bg-black/70 text-white text-[10px] px-2 py-0.5 rounded-full font-semibold border border-white/20">
                  ⭐ {movie.rating}
                </span>
              )}

              <div className="absolute bottom-0 left-0 w-full p-3 bg-gradient-to-t from-black/90 to-transparent">
                <h3 className="text-white text-sm font-bold truncate">{movie.title}</h3>
                {movie.year && <p className="text-gray-300 text-[10px]">{movie.year}</p>}
              </div>
            </div>
          ))}
        </div>

        {/* Navigation Buttons */}
        <button
          onClick={handlePrev}
          className="absolute left-4 md:left-10 top-[60%] transform -translate-y-1/2 z-30 hidden md:flex items-center justify-center w-12 h-12 rounded-full carousel-nav-button text-white"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        <button
          onClick={handleNext}
          className="absolute right-4 md:right-10 top-[60%] transform -translate-y-1/2 z-30 hidden md:flex items-center justify-center w-12 h-12 rounded-full carousel-nav-button text-white"
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
