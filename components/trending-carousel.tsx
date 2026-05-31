"use client"

import { useState, useEffect, useRef } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { movies } from "@/lib/movie-data"

const trendingIds = [2509, 2513, 2514, 2515, 2516, 2517, 2518, 2519, 2520, 2521, 2523, 2524, 2474, 2476, 2477, 2478, 2480, 2481, 2485, 2487, 2488, 2535, 2534, 2533, 2530, 2529, 2528, 2526, 2525]

interface TrendingCarouselProps {
  onMovieClick: (movie: (typeof movies)[0]) => void
}

export default function TrendingCarousel({ onMovieClick }: TrendingCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [touchStart, setTouchStart] = useState(0)
  const [touchEnd, setTouchEnd] = useState(0)
  const [isHovered, setIsHovered] = useState(false)
  const carouselRef = useRef<HTMLDivElement>(null)

  const trendingMovies = movies.filter((m) => trendingIds.includes(m.id))
  const totalMovieCount = movies.length

  // 5 সেকেন্ড অটো স্ক্রোল
  useEffect(() => {
    if (isHovered) return
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % trendingMovies.length)
    }, 5000)
    return () => clearInterval(interval)
  }, [isHovered, trendingMovies.length])

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + trendingMovies.length) % trendingMovies.length)
  }

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % trendingMovies.length)
  }

  // মোবাইলে সুইপ
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX)
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    setTouchEnd(e.changedTouches[0].clientX)
    const distance = touchStart - touchEnd
    if (Math.abs(distance) > 50) {
      if (distance > 0) handleNext()
      else handlePrev()
    }
    setTouchStart(0)
    setTouchEnd(0)
  }

  const extendedMovies = [...trendingMovies, ...trendingMovies, ...trendingMovies]
  const offset = -currentIndex * (100 / 3)

  return (
    <section className="px-4 py-2">
      {/* ========== 3D ফায়ার ব্যাকগ্রাউন্ড (PRINCE পোস্টার স্টাইলে) ========== */}
      <div className="relative -mt-4 mb-0 rounded-b-3xl overflow-hidden">
        {/* অ্যানিমেটেড ফায়ার ব্যাকগ্রাউন্ড */}
        <div 
          className="absolute inset-0 -top-20"
          style={{
            background: "radial-gradient(circle at center, #ff4500 0%, #ff0000 30%, #8b0000 70%, #2d0000 100%)",
            animation: "firePulse 3s ease-in-out infinite alternate"
          }}
        />
        {/* লাভা টেক্সচার ওভারলে */}
        <div 
          className="absolute inset-0 -top-20 opacity-40"
          style={{
            backgroundImage: "repeating-linear-gradient(45deg, #ff8c00 0px, #ff8c00 2px, #ff4500 2px, #ff4500 8px)",
            animation: "lavaMove 20s linear infinite"
          }}
        />
        {/* ভিগনেট ইফেক্ট */}
        <div className="absolute inset-0 -top-20 bg-gradient-to-t from-black via-black/60 to-transparent" />
        
        {/* লোগো */}
        <div className="relative z-20 flex justify-center">
          <img
            src="https://i.postimg.cc/LXBMvk6B/photo-2025-12-11-09-16-17-removebg-preview.png"
            alt="MoviesVerseBD Logo"
            className="w-72 h-72 object-contain drop-shadow-[0_0_30px_rgba(255,69,0,0.8)]"
          />
        </div>
      </div>

      {/* হেডার টেক্সট (3D এম্বসড) */}
      <div className="relative z-20 -mt-4 mb-1 flex flex-col items-center justify-center">
        <h2
          className="text-2xl font-black text-center tracking-[0.3em]"
          style={{
            fontFamily: "'Impact', 'Times New Roman', serif",
            background: "linear-gradient(135deg, #ffd700 0%, #ff8c00 30%, #ff4500 60%, #ffd700 100%)",
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
            color: "transparent",
            textShadow: "0 2px 5px rgba(0,0,0,0.5), 0 0 20px rgba(255,69,0,0.6), 0 0 40px rgba(255,140,0,0.4)",
            letterSpacing: "4px",
          }}
        >
          TRENDING NOW
        </h2>
        {/* আন্ডারলাইন ফায়ার */}
        <div className="w-32 h-0.5 bg-gradient-to-r from-transparent via-orange-500 to-transparent mt-1 rounded-full animate-pulse" />
      </div>

      <p className="text-center text-orange-400 text-sm mb-4 font-bold relative z-20 drop-shadow-lg">
        🔥 {totalMovieCount} Movie & Series Uploaded 🔥
      </p>

      {/* ========== 3D ক্যারোসেল (PRINCE পোস্টার স্টাইল) ========== */}
      <div 
        ref={carouselRef}
        className="relative overflow-visible py-8"
        style={{ perspective: "1200px" }}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div
          className="flex gap-4 transition-transform duration-1000 ease-out"
          style={{
            transform: `translateX(${offset}%)`,
            transformStyle: "preserve-3d",
          }}
        >
          {extendedMovies.map((movie, idx) => (
            <div
              key={`${movie.id}-${idx}`}
              className="flex-shrink-0 w-1/3 cursor-pointer group"
              style={{
                transformStyle: "preserve-3d",
                transform: "translateZ(20px)",
              }}
              onClick={() => onMovieClick(movie)}
            >
              {/* 3D পোস্টার কার্ড */}
              <div
                className="relative rounded-xl overflow-hidden transition-all duration-500"
                style={{
                  aspectRatio: "2/3",
                  boxShadow: "0 25px 40px -15px rgba(0,0,0,0.6), 0 0 0 2px rgba(255,140,0,0.3), 0 0 0 5px rgba(0,0,0,0.5)",
                  transform: "rotateY(0deg) rotateX(0deg)",
                  transformStyle: "preserve-3d",
                }}
                onMouseMove={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect()
                  const x = (e.clientX - rect.left) / rect.width - 0.5
                  const y = (e.clientY - rect.top) / rect.height - 0.5
                  // 3D রোটেশন - আপনার ছবির মতো করে
                  const rotateY = x * 25
                  const rotateX = -y * 15
                  e.currentTarget.style.transform = `perspective(1000px) rotateY(${rotateY}deg) rotateX(${rotateX}deg) translateZ(10px)`
                  e.currentTarget.style.boxShadow = `0 30px 50px -20px rgba(0,0,0,0.8), 0 0 0 2px rgba(255,215,0,0.6), 0 0 0 6px rgba(0,0,0,0.7)`
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "perspective(1000px) rotateY(0deg) rotateX(0deg) translateZ(0px)"
                  e.currentTarget.style.boxShadow = "0 25px 40px -15px rgba(0,0,0,0.6), 0 0 0 2px rgba(255,140,0,0.3), 0 0 0 5px rgba(0,0,0,0.5)"
                }}
              >
                <img 
                  src={movie.poster || "/placeholder.svg"} 
                  alt={movie.title} 
                  className="w-full h-full object-cover"
                />
                
                {/* 3D গ্লোস ওভারলে - আপনার ছবির মতো কমলা আভা */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-orange-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                
                {/* সোনালী বর্ডার গ্লো */}
                <div className="absolute inset-0 rounded-xl border-2 border-transparent group-hover:border-orange-400/60 transition-all duration-300 pointer-events-none" />

                {/* ল্যাঙ্গুয়েজ ব্যাজ */}
                {movie.language && (
                  <span className="absolute top-2 right-2 bg-black/80 text-orange-400 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase backdrop-blur-sm border border-orange-500/50 z-10">
                    {movie.language}
                  </span>
                )}

                {/* ইয়ার ব্যাজ */}
                {movie.year && (
                  <span className="absolute bottom-2 left-2 bg-black/70 text-yellow-400 text-[10px] px-2 py-0.5 rounded-full font-bold backdrop-blur-sm border border-yellow-500/50 z-10">
                    📅 {movie.year}
                  </span>
                )}

                {/* রেটিং ব্যাজ */}
                {movie.rating && movie.rating !== "not available" && (
                  <span className="absolute bottom-2 right-2 bg-gradient-to-r from-yellow-600 to-orange-600 text-white text-[10px] px-2 py-0.5 rounded-full font-bold flex items-center gap-1 backdrop-blur-sm shadow-lg z-10">
                    ⭐ {movie.rating}
                  </span>
                )}
              </div>
              
              {/* 3D শ্যাডো আন্ডার পোস্টার (PRINCE পোস্টারের মতো) */}
              <div 
                className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-4/5 h-6 bg-gradient-to-t from-orange-900/50 to-transparent blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                style={{ transform: "translateX(-50%) translateZ(-20px)" }}
              />
            </div>
          ))}
        </div>

        {/* নেভিগেশন বাটন (PRINCE স্টাইলে) */}
        <style>{`
          @keyframes firePulse {
            0% { opacity: 0.8; filter: brightness(1); }
            100% { opacity: 1; filter: brightness(1.3); }
          }
          @keyframes lavaMove {
            0% { background-position: 0 0; }
            100% { background-position: 100px 100px; }
          }
          .prince-nav-button {
            background: linear-gradient(135deg, rgba(255,69,0,0.3), rgba(255,140,0,0.2));
            backdrop-filter: blur(12px);
            border: 1px solid rgba(255,215,0,0.5);
            transition: all 0.3s ease;
            box-shadow: 0 0 15px rgba(255,69,0,0.4);
          }
          .prince-nav-button:hover {
            background: linear-gradient(135deg, rgba(255,69,0,0.5), rgba(255,140,0,0.4));
            border: 1px solid rgba(255,215,0,0.8);
            transform: scale(1.15);
            box-shadow: 0 0 25px rgba(255,69,0,0.7);
          }
        `}</style>
        
        <button
          onClick={handlePrev}
          className="prince-nav-button absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-3 text-white p-2 rounded-full z-30 hidden md:block"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        <button
          onClick={handleNext}
          className="prince-nav-button absolute right-0 top-1/2 transform -translate-y-1/2 translate-x-3 text-white p-2 rounded-full z-30 hidden md:block"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      </div>

      {/* মোবাইলের জন্য ডট ইন্ডিকেটর */}
      <div className="flex justify-center gap-2 mt-6 md:hidden">
        {trendingMovies.slice(0, 5).map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrentIndex(i)}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              currentIndex % trendingMovies.length === i 
                ? "w-8 bg-gradient-to-r from-orange-500 to-yellow-500" 
                : "w-2 bg-gray-600"
            }`}
          />
        ))}
      </div>
    </section>
  )
}
