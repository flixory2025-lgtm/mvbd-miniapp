"use client"

import { useState, useEffect, useRef } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { movies } from "@/lib/movie-data"

const trendingIds = [3360, 3361, 3362, 3363, 3364, 3365, 3366, 3367, 3368, 3369, 3370, 3371, 3373, 3375, 3376, 3377, 3379, 3380, 3382, 3383, 3386, 3387, 3355, 3354, 3352, 3351, 3350, 3349, 3348, 3347, 3346, 3345, 3344, 3342, 3341, 3340, 3339, 3338, 3337, 3335, 3389, 3388,]

interface TrendingCarouselProps {
  onMovieClick: (movie: (typeof movies)[0]) => void
}

export default function TrendingCarousel({ onMovieClick }: TrendingCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [touchStart, setTouchStart] = useState(0)
  const [touchEnd, setTouchEnd] = useState(0)
  const [bgImage, setBgImage] = useState("")
  const [bgOpacity, setBgOpacity] = useState(1)
  const carouselRef = useRef<HTMLDivElement>(null)
  const trendingMovies = movies.filter((m) => trendingIds.includes(m.id))

  const totalMovieCount = movies.length

  // ✅ ৫ সেকেন্ড পর পর অটো স্লাইড
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % trendingMovies.length)
    }, 5000)
    return () => clearInterval(interval)
  }, [trendingMovies.length])

  // ✅ মুভি পোস্টার ব্যাকগ্রাউন্ড স্মুথলি পরিবর্তন
  useEffect(() => {
    const currentMovie = trendingMovies[currentIndex]
    if (currentMovie && currentMovie.poster) {
      setBgOpacity(0)
      const timer = setTimeout(() => {
        setBgImage(currentMovie.poster || "")
        setBgOpacity(1)
      }, 200)
      return () => clearTimeout(timer)
    }
  }, [currentIndex, trendingMovies])

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + trendingMovies.length) % trendingMovies.length)
  }

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % trendingMovies.length)
  }

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
      handleNext()
    } else if (isRightSwipe) {
      handlePrev()
    }
  }

  const handleMouseWheel = (e: React.WheelEvent) => {
    e.preventDefault()
    if (e.deltaY > 0) {
      handleNext()
    } else {
      handlePrev()
    }
  }

  const extendedMovies = [...trendingMovies, ...trendingMovies, ...trendingMovies]
  const offset = -currentIndex * (100 / 3)

  return (
    <section className="relative px-4 py-2 overflow-hidden">
      
      {/* ✅✅✅ UPORER BACKGROUND (আগের মতোই) ✅✅✅ */}
      {/* এই লেয়ারটি শুধু উপরের অংশে থাকবে, নিচের মুভি পোস্টারের সাথে মিশবে না */}
      <div
        className="absolute top-0 left-0 w-full h-[400px] z-0 pointer-events-none"
        style={{
          backgroundImage: "url('https://i.postimg.cc/tRMc5ZNM/198b2f01e73b905772279616eccc7c65.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      >
        {/* ✅ উপরের দিকের ডার্ক গ্রেডিয়েন্ট */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/80 to-transparent" />
      </div>

      {/* ✅ Logo (আগের মতোই) */}
      <div className="relative z-10 flex justify-center -mt-4 mb-0">
        <img
          src="https://i.postimg.cc/Bn4cPRwz/20288-removebg-preview.png"
          alt="MoviesVerseBD Logo"
          className="relative z-20 w-72 h-72 object-contain"
        />
      </div>

      {/* ✅ Trending Now Title (আগের মতোই) */}
      <div className="relative z-10 -mt-4 mb-1 flex flex-col items-center justify-center">
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

      {/* ✅ Counter Text (আগের মতোই) */}
      <p className="text-center text-green-400 text-sm mb-3 font-medium relative z-10">{totalMovieCount} Movie & Series Uploaded</p>

      {/* ✅✅✅ NICHER BACKGROUND: MOVIE POSTER ✅✅✅ */}
      {/* এই লেয়ারটি কার্ডের পেছনে থাকবে এবং নিচের দিকে নামবে */}
      <div
        className="absolute left-0 w-full z-0 pointer-events-none"
        style={{
          top: "55%", // ✅ এখানে নিচে নামানো হয়েছে (আগে 40% বা তার কম ছিল)
          height: "60%", // উচ্চতা বাড়ানো হয়েছে
          backgroundImage: bgImage ? `url('${bgImage}')` : 'none',
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          opacity: bgOpacity,
          transition: "opacity 1s ease-in-out",
          filter: "blur(10px) brightness(0.5)",
          transform: "scale(1.1)",
        }}
      >
        {/* ✅ উপরে ওঠার সাথে সাথে কালো হওয়ার গ্রেডিয়েন্ট */}
        <div className="absolute top-0 left-0 w-full h-40 bg-gradient-to-b from-black via-black/80 to-transparent" />
        {/* ✅ নিচে নামার সাথে সাথে কালো হওয়ার গ্রেডিয়েন্ট */}
        <div className="absolute bottom-0 left-0 w-full h-40 bg-gradient-to-t from-black via-black/80 to-transparent" />
      </div>

      {/* ✅ কার্ড ক্যারোসেল (আগের মতোই) */}
      <div
        ref={carouselRef}
        className="relative z-10 overflow-x-auto overflow-y-hidden md:overflow-hidden scrollbar-hide"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onWheel={handleMouseWheel}
        style={{ touchAction: "pan-x" }}
      >
        <div
          className="flex gap-4 transition-transform duration-1000 ease-in-out md:transition-transform"
          style={{
            transform: `translateX(${offset}%)`,
          }}
        >
          {extendedMovies.map((movie, idx) => (
            <div
              key={`${movie.id}-${idx}`}
              className="flex-shrink-0 w-1/3 md:w-1/5 lg:w-[18%] xl:w-[15%] 2xl:w-[13%] aspect-[2/3] rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-all duration-500 transform hover:scale-105 cursor-pointer relative"
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
        <style>{`
          @keyframes carouselNavGlow {
            0%, 100% {
              box-shadow: 0 0 15px rgba(34, 197, 94, 0.6), inset 0 0 20px rgba(255, 255, 255, 0.1);
            }
            50% {
              box-shadow: 0 0 25px rgba(34, 197, 94, 0.8), inset 0 0 30px rgba(255, 255, 255, 0.15);
            }
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

          .scrollbar-hide::-webkit-scrollbar {
            display: none;
          }

          .scrollbar-hide {
            -ms-overflow-style: none;
            scrollbar-width: none;
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
    </section>
  )
}
