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
  const [isDragging, setIsDragging] = useState(false)
  const carouselRef = useRef<HTMLDivElement>(null)
  const autoScrollRef = useRef<NodeJS.Timeout | null>(null)

  const trendingMovies = movies.filter((m) => trendingIds.includes(m.id))
  const totalMovieCount = movies.length

  // 5 সেকেন্ড পর পর অটো স্ক্রোল (হোভার না করলে)
  useEffect(() => {
    if (isHovered || isDragging) {
      if (autoScrollRef.current) clearInterval(autoScrollRef.current)
      return
    }

    autoScrollRef.current = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % trendingMovies.length)
    }, 5000)

    return () => {
      if (autoScrollRef.current) clearInterval(autoScrollRef.current)
    }
  }, [isHovered, isDragging, trendingMovies.length])

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + trendingMovies.length) % trendingMovies.length)
  }

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % trendingMovies.length)
  }

  // টাচ/মাউস ড্র্যাগ স্বীপ
  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true)
    setTouchStart(e.targetTouches[0].clientX)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStart) return
    setTouchEnd(e.targetTouches[0].clientX)
  }

  const handleTouchEnd = () => {
    setIsDragging(false)
    if (!touchStart || !touchEnd) {
      setTouchStart(0)
      setTouchEnd(0)
      return
    }
    const distance = touchStart - touchEnd
    const isLeftSwipe = distance > 50
    const isRightSwipe = distance < -50

    if (isLeftSwipe) handleNext()
    else if (isRightSwipe) handlePrev()

    setTouchStart(0)
    setTouchEnd(0)
  }

  // মাউস হুইল (মোবাইলেও কাজ করবে)
  const handleMouseWheel = (e: React.WheelEvent) => {
    e.preventDefault()
    if (e.deltaY > 0) handleNext()
    else handlePrev()
  }

  const extendedMovies = [...trendingMovies, ...trendingMovies, ...trendingMovies]
  const offset = -currentIndex * (100 / 3)

  return (
    <section className="px-4 py-2">
      {/* হেডার ইমেজ */}
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
          src="https://i.postimg.cc/LXBMvk6B/photo-2025-12-11-09-16-17-removebg-preview.png"
          alt="MoviesVerseBD Logo"
          className="relative z-20 w-72 h-72 object-contain"
        />
      </div>

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
          }}
        >
          Trending Now
        </h2>
      </div>

      <p className="text-center text-green-400 text-sm mb-3 font-medium relative z-20">
        {totalMovieCount} Movie & Series Uploaded
      </p>

      {/* 3D ক্যারোসেল */}
      <div
        ref={carouselRef}
        className="relative overflow-hidden"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onWheel={handleMouseWheel}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        style={{ touchAction: "pan-y" }}
      >
        <div
          className="flex gap-4 transition-transform duration-1000 ease-in-out"
          style={{
            transform: `translateX(${offset}%)`,
          }}
        >
          {extendedMovies.map((movie, idx) => (
            <div
              key={`${movie.id}-${idx}`}
              className="flex-shrink-0 w-1/3 aspect-[2/3] rounded-lg overflow-hidden shadow-2xl cursor-pointer transform-gpu transition-all duration-500 hover:z-10"
              style={{
                transformStyle: "preserve-3d",
              }}
              onClick={() => onMovieClick(movie)}
            >
              {/* 3D টিল্ট ইফেক্টের জন্য ইনার ডিভ */}
              <div
                className="relative w-full h-full group"
                style={{
                  transition: "transform 0.3s ease-out",
                  transform: "rotateX(0deg) rotateY(0deg)",
                }}
                onMouseMove={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect()
                  const x = e.clientX - rect.left // মাউসের এক্স পজিশন (0 থেকে width)
                  const y = e.clientY - rect.top // মাউসের ওয়াই পজিশন
                  const centerX = rect.width / 2
                  const centerY = rect.height / 2
                  // 3D টিল্ট অ্যাঙ্গেল ক্যালকুলেশন (-10 ডিগ্রি থেকে +10 ডিগ্রি)
                  const rotateY = ((x - centerX) / centerX) * 10
                  const rotateX = ((centerY - y) / centerY) * 10
                  e.currentTarget.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "perspective(1000px) rotateX(0deg) rotateY(0deg)"
                }}
              >
                <img
                  src={movie.poster || "/placeholder.svg"}
                  alt={movie.title}
                  className="w-full h-full object-cover rounded-lg shadow-xl transition-all duration-300"
                />
                {/* 3D গ্লোস ইফেক্ট */}
                <div className="absolute inset-0 rounded-lg bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

                {movie.language && (
                  <span className="absolute top-2 right-2 bg-black/70 text-white text-[10px] px-1.5 py-0.5 rounded uppercase font-semibold backdrop-blur-sm z-10">
                    {movie.language}
                  </span>
                )}
                {movie.year && (
                  <span className="absolute bottom-2 left-2 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded font-medium backdrop-blur-sm z-10">
                    {movie.year}
                  </span>
                )}
                {movie.rating && movie.rating !== "not available" && (
                  <span className="absolute bottom-2 right-2 bg-yellow-500/90 text-black text-[10px] px-1.5 py-0.5 rounded font-bold flex items-center gap-0.5 backdrop-blur-sm z-10">
                    ⭐ {movie.rating}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* নেভিগেশন বাটন (ডেস্কটপ) */}
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
            transform: scale(1.1);
          }
        `}</style>
        <button
          onClick={handlePrev}
          className="carousel-nav-button absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-4 text-white p-2 rounded-full z-30 hidden md:block"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        <button
          onClick={handleNext}
          className="carousel-nav-button absolute right-0 top-1/2 transform -translate-y-1/2 translate-x-4 text-white p-2 rounded-full z-30 hidden md:block"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      </div>

      {/* স্ক্রল ইনডিকেটর (মোবাইলে বুঝতে সুবিধা) */}
      <div className="flex justify-center gap-2 mt-4 md:hidden">
        {trendingMovies.slice(0, 5).map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrentIndex(i)}
            className={`h-1 rounded-full transition-all duration-300 ${
              currentIndex % trendingMovies.length === i ? "w-6 bg-green-500" : "w-3 bg-gray-600"
            }`}
          />
        ))}
      </div>
    </section>
  )
}
