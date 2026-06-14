"use client"

import { useState, useEffect, useRef } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { movies } from "@/lib/movie-data"

const trendingIds = [2587, 2588, 2589, 2590, 2591, 2592, 2593, 2594, 2558, 2559, 2560, 2561, 2562, 2563, 2564, 2565, 2566, 2567, 2568, 2570, 2571, 2572, 2573, 2574, 2530, 2578, 2577, 2576, 2575,]

interface TrendingCarouselProps {
  onMovieClick: (movie: (typeof movies)[0]) => void
}

export default function TrendingCarousel({ onMovieClick }: TrendingCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [touchStart, setTouchStart] = useState(0)
  const [touchEnd, setTouchEnd] = useState(0)
  const carouselRef = useRef<HTMLDivElement>(null)
  const trendingMovies = movies.filter((m) => trendingIds.includes(m.id))

  const totalMovieCount = movies.length

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % trendingMovies.length)
    }, 5000)
    return () => clearInterval(interval)
  }, [trendingMovies.length])

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

        {/* FIFA World Cup 2026 Animated Overlay */}
        <div className="absolute inset-0 -top-20 flex items-center justify-center pointer-events-none z-10">
          <div className="relative w-full max-w-3xl mx-auto">
            {/* Football Field Lines Animation */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-[80%] h-[60%] border-2 border-green-500/30 rounded-lg animate-pulse">
                <div className="absolute top-1/2 left-0 w-full h-0.5 bg-green-500/20 transform -translate-y-1/2"></div>
                <div className="absolute top-1/2 left-1/2 w-16 h-16 border-2 border-green-500/20 rounded-full transform -translate-x-1/2 -translate-y-1/2"></div>
              </div>
            </div>

            {/* Animated Football Player Kicking Ball */}
            <div className="relative flex justify-center items-center min-h-[200px]">
              {/* Player Silhouette with kicking animation */}
              <div className="relative animate-kickPlayer">
                <svg
                  viewBox="0 0 100 100"
                  className="w-32 h-32 md:w-40 md:h-40 drop-shadow-[0_0_15px_rgba(34,197,94,0.7)]"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  {/* Player Body */}
                  <g>
                    {/* Head */}
                    <circle cx="50" cy="20" r="8" fill="#2d3748" stroke="#4a5568" strokeWidth="1.5" />
                    {/* Body */}
                    <path d="M42 30 L58 30 L55 50 L45 50 Z" fill="#2d3748" stroke="#4a5568" strokeWidth="1.5" />
                    {/* Kicking Leg - Animated */}
                    <g className="animate-kickingLeg">
                      <line x1="50" y1="50" x2="35" y2="65" stroke="#2d3748" strokeWidth="4" strokeLinecap="round" />
                      <line x1="35" y1="65" x2="25" y2="60" stroke="#2d3748" strokeWidth="3" strokeLinecap="round" />
                    </g>
                    {/* Standing Leg */}
                    <line x1="50" y1="50" x2="50" y2="70" stroke="#2d3748" strokeWidth="4" strokeLinecap="round" />
                    <line x1="50" y1="70" x2="55" y2="75" stroke="#2d3748" strokeWidth="3" strokeLinecap="round" />
                    {/* Arms */}
                    <line x1="42" y1="35" x2="30" y2="45" stroke="#2d3748" strokeWidth="3" strokeLinecap="round" />
                    <line x1="58" y1="35" x2="68" y2="45" stroke="#2d3748" strokeWidth="3" strokeLinecap="round" />
                  </g>
                </svg>
              </div>

              {/* Football with shooting animation */}
              <div className="absolute left-[45%] top-[55%] animate-shootBall">
                <svg
                  viewBox="0 0 32 32"
                  className="w-8 h-8 md:w-10 md:h-10 drop-shadow-[0_0_20px_rgba(255,255,255,0.8)]"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <circle cx="16" cy="16" r="14" fill="white" stroke="black" strokeWidth="1.5" />
                  <path d="M16 2 L16 30 M2 16 L30 16" stroke="black" strokeWidth="1.2" />
                  <path d="M7 7 L25 25 M7 25 L25 7" stroke="black" strokeWidth="1.2" />
                  <path d="M16 2 L23 9 L23 23 L16 30 L9 23 L9 9 Z" stroke="black" strokeWidth="1" fill="none" />
                  <circle cx="16" cy="16" r="4" fill="none" stroke="black" strokeWidth="0.8" />
                </svg>
              </div>

              {/* Speed Lines */}
              <div className="absolute left-[60%] top-[55%] flex gap-1 animate-speedLines">
                <div className="w-3 h-0.5 bg-yellow-400 rounded-full"></div>
                <div className="w-5 h-0.5 bg-yellow-400 rounded-full"></div>
                <div className="w-4 h-0.5 bg-yellow-400 rounded-full"></div>
                <div className="w-2 h-0.5 bg-yellow-400 rounded-full"></div>
              </div>
            </div>

            {/* Goal Explosion Effect */}
            <div className="absolute right-0 top-1/2 transform -translate-y-1/2 animate-goalFlash">
              <div className="relative">
                <div className="absolute w-8 h-8 bg-yellow-400 rounded-full blur-md animate-ping"></div>
                <div className="absolute w-12 h-12 bg-yellow-500 rounded-full blur-lg animate-pulse opacity-50"></div>
                <span className="relative text-yellow-400 font-bold text-xl md:text-3xl animate-bounce drop-shadow-lg">
                  ⚽ GOAL! 🎉
                </span>
              </div>
            </div>

            {/* FIFA World Cup Text */}
            <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 text-center whitespace-nowrap">
              <div className="text-xs md:text-sm font-bold text-white bg-black/50 px-3 py-1 rounded-full backdrop-blur-sm animate-textGlow">
                FIFA World Cup 2026 🔥
              </div>
            </div>
          </div>
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

      <p className="text-center text-green-400 text-sm mb-3 font-medium relative z-20">{totalMovieCount} Movie & Series Uploaded</p>

      <div 
        ref={carouselRef}
        className="relative overflow-x-auto overflow-y-hidden md:overflow-hidden scrollbar-hide"
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
              className="flex-shrink-0 w-1/3 aspect-[2/3] rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-all duration-500 transform hover:scale-105 cursor-pointer relative"
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

        {/* CSS Animations */}
        <style>{`
          @keyframes carouselNavGlow {
            0%, 100% {
              box-shadow: 0 0 15px rgba(34, 197, 94, 0.6), inset 0 0 20px rgba(255, 255, 255, 0.1);
            }
            50% {
              box-shadow: 0 0 25px rgba(34, 197, 94, 0.8), inset 0 0 30px rgba(255, 255, 255, 0.15);
            }
          }

          @keyframes kickPlayer {
            0%, 100% { transform: translateX(0) rotate(0deg); }
            50% { transform: translateX(-5px) rotate(-5deg); }
          }

          @keyframes kickingLeg {
            0%, 100% { transform: rotate(0deg); transform-origin: 50px 50px; }
            50% { transform: rotate(30deg); transform-origin: 50px 50px; }
          }

          @keyframes shootBall {
            0% { transform: translate(0, 0) scale(1); opacity: 1; }
            20% { transform: translate(15px, -5px) scale(1.1); }
            50% { transform: translate(60px, -15px) scale(0.9); opacity: 0.8; }
            80% { transform: translate(100px, -20px) scale(0.8); opacity: 0.5; }
            100% { transform: translate(140px, -25px) scale(0.6); opacity: 0; }
          }

          @keyframes speedLines {
            0% { opacity: 0; transform: translateX(0); }
            20% { opacity: 1; transform: translateX(15px); }
            80% { opacity: 1; transform: translateX(80px); }
            100% { opacity: 0; transform: translateX(120px); }
          }

          @keyframes goalFlash {
            0%, 100% { opacity: 0; transform: scale(0.8) translateY(-50%); }
            40% { opacity: 0; }
            60% { opacity: 1; transform: scale(1.2) translateY(-50%); }
            80% { opacity: 1; transform: scale(1) translateY(-50%); }
            100% { opacity: 0; transform: scale(0.8) translateY(-50%); }
          }

          @keyframes textGlow {
            0%, 100% { text-shadow: 0 0 5px #22c55e, 0 0 10px #22c55e; }
            50% { text-shadow: 0 0 15px #22c55e, 0 0 25px #22c55e; }
          }

          .animate-kickPlayer {
            animation: kickPlayer 0.8s ease-in-out infinite;
          }

          .animate-kickingLeg {
            animation: kickingLeg 0.8s ease-in-out infinite;
          }

          .animate-shootBall {
            animation: shootBall 1.5s ease-in-out infinite;
          }

          .animate-speedLines {
            animation: speedLines 1.5s ease-in-out infinite;
          }

          .animate-goalFlash {
            animation: goalFlash 1.5s ease-in-out infinite;
          }

          .animate-textGlow {
            animation: textGlow 1.5s ease-in-out infinite;
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
