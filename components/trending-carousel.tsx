"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { ChevronLeft, ChevronRight, Play, Film, Star } from "lucide-react"
import { movies } from "@/lib/movie-data"
import UpcomingSection from "@/components/UpcomingSection"

const topSeriesIds = [
  3411, 3412, 3416, 3422, 3426, 3429, 3430, 3432,
  3433, 3435, 3438, 3439, 3445, 3447, 3452,
]

const trendingIds = [
  3394, 3396, 3397, 3399, 3400, 3401, 3402, 3403,
  3405, 3452, 3451, 3448, 3447, 3446, 3445, 3444,
  3443, 3442, 3441, 3439, 3438, 3436, 3435, 3433,
  3432, 3430, 3429, 3428, 3427, 3426, 3424, 3423,
  3422, 3420, 3417, 3416, 3415, 3414, 3413, 3412,
  3411, 3410,
]

interface TrendingCarouselProps {
  onMovieClick: (movie: (typeof movies)[0]) => void
}

export default function TrendingCarousel({
  onMovieClick,
}: TrendingCarouselProps) {
  const topSeriesMovies = movies.filter((m) => topSeriesIds.includes(m.id))
  const trendingMovies = movies.filter((m) => trendingIds.includes(m.id))
  const trendingCount = trendingMovies.length
  const totalMovieCount = movies.length

  // Top hero state
  const [topIndex, setTopIndex] = useState(0)
  const [topDragDistance, setTopDragDistance] = useState(0)
  const [topIsDragging, setTopIsDragging] = useState(false)
  const [topIsTransitioning, setTopIsTransitioning] = useState(true)
  const [containerWidth, setContainerWidth] = useState(0)

  // Mobile 3D carousel state
  const [currentIndex, setCurrentIndex] = useState(0)
  const [dragDistance, setDragDistance] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [isTransitioning, setIsTransitioning] = useState(true)
  const [isMobile, setIsMobile] = useState(false)

  const topStartXRef = useRef(0)
  const topDidDragRef = useRef(false)
  const startXRef = useRef(0)
  const autoSlideRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const topAutoSlideRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const topContainerRef = useRef<HTMLDivElement>(null)

  // ✅ Native scroll refs
  const deskScrollRef = useRef<HTMLDivElement>(null)
  const isUserInteractingRef = useRef(false)
  const interactionTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Restore saved positions
  useEffect(() => {
    try {
      const savedTopIndex = sessionStorage.getItem("topSeriesIndex")
      const savedTrendingIndex = sessionStorage.getItem("trendingIndex")
      if (savedTopIndex && topSeriesMovies.length > 0) {
        const parsed = parseInt(savedTopIndex, 10)
        if (!isNaN(parsed) && parsed >= 0 && parsed < topSeriesMovies.length) {
          setTopIndex(parsed)
        }
      }
      if (savedTrendingIndex && trendingMovies.length > 0) {
        const parsed = parseInt(savedTrendingIndex, 10)
        if (!isNaN(parsed) && parsed >= 0 && parsed < trendingMovies.length) {
          setCurrentIndex(parsed)
        }
      }
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    try {
      sessionStorage.setItem("topSeriesIndex", topIndex.toString())
    } catch {}
  }, [topIndex])

  useEffect(() => {
    try {
      sessionStorage.setItem("trendingIndex", currentIndex.toString())
    } catch {}
  }, [currentIndex])

  // Detect screen size
  useEffect(() => {
    const updateSize = () => {
      setIsMobile(window.innerWidth < 768)
      if (topContainerRef.current) {
        setContainerWidth(topContainerRef.current.offsetWidth)
      }
    }
    updateSize()
    window.addEventListener("resize", updateSize)
    const t = setTimeout(updateSize, 100)
    return () => {
      window.removeEventListener("resize", updateSize)
      clearTimeout(t)
    }
  }, [])

  // Top hero auto-slide: 4s
  useEffect(() => {
    if (topSeriesMovies.length === 0 || topIsDragging) return
    if (topAutoSlideRef.current) clearInterval(topAutoSlideRef.current)
    topAutoSlideRef.current = setInterval(() => {
      setTopIndex((prev) => (prev + 1) % topSeriesMovies.length)
    }, 4000)
    return () => {
      if (topAutoSlideRef.current) clearInterval(topAutoSlideRef.current)
    }
  }, [topSeriesMovies.length, topIsDragging])

  // ✅ Desktop auto-slide — শুধু তখনই চলে যখন ইউজার interact করছে না
  useEffect(() => {
    if (isMobile || trendingCount === 0) return
    if (autoSlideRef.current) clearInterval(autoSlideRef.current)

    autoSlideRef.current = setInterval(() => {
      if (isUserInteractingRef.current) return
      const el = deskScrollRef.current
      if (!el) return
      const firstCard = el.querySelector(
        "[data-trend-card]"
      ) as HTMLElement | null
      if (!firstCard) return
      const gap = 16
      const step = firstCard.offsetWidth + gap
      const maxScroll = el.scrollWidth - el.clientWidth
      if (el.scrollLeft >= maxScroll - 5) {
        el.scrollTo({ left: 0, behavior: "smooth" })
        return
      }
      el.scrollTo({ left: el.scrollLeft + step, behavior: "smooth" })
    }, 3000)

    return () => {
      if (autoSlideRef.current) clearInterval(autoSlideRef.current)
    }
  }, [isMobile, trendingCount])

  // ✅ Mobile 3D auto-slide: 3s
  const advanceMobile = useCallback(() => {
    if (trendingCount === 0) return
    setIsTransitioning(true)
    setCurrentIndex((prev) => (prev + 1) % trendingCount)
  }, [trendingCount])

  useEffect(() => {
    if (!isMobile || trendingCount === 0) return
    if (autoSlideRef.current) clearInterval(autoSlideRef.current)
    autoSlideRef.current = setInterval(() => {
      if (isUserInteractingRef.current) return
      advanceMobile()
    }, 3000)
    return () => {
      if (autoSlideRef.current) clearInterval(autoSlideRef.current)
    }
  }, [isMobile, trendingCount, advanceMobile])

  /* =========================================================
     ✅ User interaction চিহ্নিত করা
     যেকোনো swipe / drag / hover শুরু হলে 3 সেকেন্ডের জন্য auto-slide বন্ধ
  ========================================================= */
  const markUserInteracting = () => {
    isUserInteractingRef.current = true
    if (interactionTimeoutRef.current) {
      clearTimeout(interactionTimeoutRef.current)
    }
    interactionTimeoutRef.current = setTimeout(() => {
      isUserInteractingRef.current = false
    }, 3000)
  }

  /* =========================================================
     Keyboard
  ========================================================= */
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") {
        markUserInteracting()
        if (isMobile) advanceMobile()
        else {
          const el = deskScrollRef.current
          if (!el) return
          const fc = el.querySelector("[data-trend-card]") as HTMLElement | null
          if (!fc) return
          el.scrollBy({ left: fc.offsetWidth + 16, behavior: "smooth" })
        }
      } else if (e.key === "ArrowLeft") {
        markUserInteracting()
        if (isMobile) {
          setIsTransitioning(true)
          setCurrentIndex((prev) => (prev - 1 + trendingCount) % trendingCount)
        } else {
          const el = deskScrollRef.current
          if (!el) return
          const fc = el.querySelector("[data-trend-card]") as HTMLElement | null
          if (!fc) return
          el.scrollBy({ left: -(fc.offsetWidth + 16), behavior: "smooth" })
        }
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [isMobile, trendingCount, advanceMobile])

  const handlePrev = () => {
    markUserInteracting()
    if (isMobile) {
      setIsTransitioning(true)
      setCurrentIndex((prev) => (prev - 1 + trendingCount) % trendingCount)
    } else {
      const el = deskScrollRef.current
      if (!el) return
      const fc = el.querySelector("[data-trend-card]") as HTMLElement | null
      if (!fc) return
      el.scrollBy({ left: -(fc.offsetWidth + 16), behavior: "smooth" })
    }
  }

  const handleNext = () => {
    markUserInteracting()
    if (isMobile) advanceMobile()
    else {
      const el = deskScrollRef.current
      if (!el) return
      const fc = el.querySelector("[data-trend-card]") as HTMLElement | null
      if (!fc) return
      el.scrollBy({ left: fc.offsetWidth + 16, behavior: "smooth" })
    }
  }

  /* =========================================================
     Top hero swipe handlers
  ========================================================= */
  const handleTopDragStart = (clientX: number) => {
    setTopIsDragging(true)
    setTopIsTransitioning(false)
    topStartXRef.current = clientX
    topDidDragRef.current = false
    if (topAutoSlideRef.current) clearInterval(topAutoSlideRef.current)
  }
  const handleTopDragMove = (clientX: number) => {
    if (!topIsDragging) return
    const dx = clientX - topStartXRef.current
    if (Math.abs(dx) > 5) topDidDragRef.current = true
    setTopDragDistance(dx)
  }
  const handleTopDragEnd = () => {
    if (!topIsDragging) return
    setTopIsDragging(false)
    setTopIsTransitioning(true)
    const threshold = containerWidth * 0.15
    if (topDragDistance < -threshold) {
      setTopIndex((prev) => (prev + 1) % topSeriesMovies.length)
    } else if (topDragDistance > threshold) {
      setTopIndex(
        (prev) => (prev - 1 + topSeriesMovies.length) % topSeriesMovies.length
      )
    }
    setTopDragDistance(0)
  }
  const handleTopTouchStart = (e: React.TouchEvent) =>
    handleTopDragStart(e.touches[0].clientX)
  const handleTopTouchMove = (e: React.TouchEvent) =>
    handleTopDragMove(e.touches[0].clientX)
  const handleTopTouchEnd = handleTopDragEnd
  const handleTopMouseDown = (e: React.MouseEvent) =>
    handleTopDragStart(e.clientX)
  const handleTopMouseMove = (e: React.MouseEvent) =>
    handleTopDragMove(e.clientX)
  const handleTopMouseUp = handleTopDragEnd

  /* =========================================================
     ✅ Mobile 3D swipe handlers (free)
  ========================================================= */
  const handleDragStart = (clientX: number) => {
    setIsDragging(true)
    setIsTransitioning(false)
    startXRef.current = clientX
    markUserInteracting()
  }
  const handleDragMove = (clientX: number) => {
    if (!isDragging) return
    setDragDistance(clientX - startXRef.current)
    markUserInteracting()
  }
  const handleDragEnd = () => {
    if (!isDragging) return
    setIsDragging(false)
    setIsTransitioning(true)
    const cardWidth = isMobile ? 140 : 240
    const threshold = cardWidth * 0.2
    if (dragDistance < -threshold) {
      setCurrentIndex((prev) => (prev + 1) % trendingCount)
    } else if (dragDistance > threshold) {
      setCurrentIndex((prev) => (prev - 1 + trendingCount) % trendingCount)
    }
    setDragDistance(0)
    markUserInteracting()
  }
  const handleTouchStart = (e: React.TouchEvent) =>
    handleDragStart(e.touches[0].clientX)
  const handleTouchMove = (e: React.TouchEvent) =>
    handleDragMove(e.touches[0].clientX)
  const handleTouchEnd = handleDragEnd
  const handleMouseDown = (e: React.MouseEvent) => handleDragStart(e.clientX)
  const handleMouseMove = (e: React.MouseEvent) => handleDragMove(e.clientX)
  const handleMouseUp = handleDragEnd

  const handleMouseWheel = (e: React.WheelEvent) => {
    if (isDragging) return
    markUserInteracting()
    if (e.deltaY > 0) handleNext()
    else handlePrev()
  }

  const topTranslateX = -(topIndex * containerWidth) + topDragDistance

  /* =========================================================
     Mobile 3D card style
  ========================================================= */
  const getCardStyle = (index: number) => {
    const total = trendingMovies.length
    let offset = (index - currentIndex + total) % total
    if (offset > total / 2) offset -= total

    const cardWidth = isMobile ? 140 : 240
    const dragProgress = dragDistance / cardWidth
    const adjustedOffset = offset + dragProgress

    if (adjustedOffset < -4 || adjustedOffset > 4) {
      return {
        opacity: 0,
        transform: "scale(0)",
        pointerEvents: "none" as const,
        zIndex: 0,
      }
    }

    let x = 0
    let z = 0
    let scale = 1
    let opacity = 1
    let shadow = ""
    let rotateY = 0

    const xSpacing = isMobile ? 110 : 130
    const zSpacing = -70

    if (adjustedOffset >= 0 && adjustedOffset <= 1) {
      const p = adjustedOffset
      x = xSpacing * p
      z = zSpacing * p
      scale = 1 - 0.15 * p
      opacity = 1 - 0.3 * p
      shadow =
        p > 0.5 ? "0 15px 30px rgba(0,0,0,0.5)" : "0 30px 60px rgba(0,0,0,0.9)"
      rotateY = 5 * p
    } else if (adjustedOffset > 1 && adjustedOffset <= 4) {
      const p = adjustedOffset - 1
      x = xSpacing + xSpacing * 0.75 * p
      z = zSpacing - zSpacing * 0.6 * p
      scale = 0.85 - 0.12 * p
      opacity = 0.7 - 0.2 * p
      shadow = "0 10px 20px rgba(0,0,0,0.4)"
      rotateY = 5 + 2 * p
    } else if (adjustedOffset < 0 && adjustedOffset >= -1) {
      const p = Math.abs(adjustedOffset)
      x = -xSpacing * p
      z = zSpacing * p
      scale = 1 - 0.15 * p
      opacity = 1 - 0.3 * p
      shadow =
        p > 0.5 ? "0 15px 30px rgba(0,0,0,0.5)" : "0 30px 60px rgba(0,0,0,0.9)"
      rotateY = -5 * p
    } else if (adjustedOffset < -1 && adjustedOffset >= -4) {
      const p = Math.abs(adjustedOffset) - 1
      x = -xSpacing - xSpacing * 0.75 * p
      z = zSpacing - zSpacing * 0.6 * p
      scale = 0.85 - 0.12 * p
      opacity = 0.7 - 0.2 * p
      shadow = "0 10px 20px rgba(0,0,0,0.4)"
      rotateY = -5 - 2 * p
    } else {
      x = adjustedOffset > 0 ? 600 : -600
      z = -400
      scale = 0.4
      opacity = 0
      shadow = "none"
      rotateY = 0
    }

    if (offset === 0 && Math.abs(dragProgress) < 0.05) {
      x = 0
      z = 0
      scale = 1
      opacity = 1
      rotateY = 0
      shadow = "0 30px 60px rgba(0,0,0,0.9), 0 0 30px rgba(255,255,255,0.05)"
    }

    return {
      transform: `translateX(${x}px) translateZ(${z}px) scale(${scale}) rotateY(${rotateY}deg)`,
      opacity,
      boxShadow: shadow,
      zIndex: Math.round(100 - Math.abs(adjustedOffset) * 10),
      transition: isTransitioning
        ? "all 0.5s cubic-bezier(0.25, 1, 0.5, 1)"
        : "none",
    }
  }

  const currentTopMovie = topSeriesMovies[topIndex] || topSeriesMovies[0]
  const deskStrip = [...trendingMovies, ...trendingMovies, ...trendingMovies]

  return (
    <section className="relative pb-4 overflow-hidden bg-black">
      {/* ====================================================== */}
      {/* TOP SERIES HERO */}
      {/* ====================================================== */}
      <div
        ref={topContainerRef}
        className={`relative w-full overflow-hidden select-none bg-gray-900 ${
          isMobile
            ? "h-[420px] pt-[72px] cursor-grab active:cursor-grabbing"
            : "h-[520px] lg:h-[620px] cursor-grab active:cursor-grabbing"
        }`}
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
            <div
              className="absolute inset-0 flex"
              style={{
                width: `${topSeriesMovies.length * 100}%`,
                transform: `translateX(${topTranslateX}px)`,
                transition: topIsTransitioning
                  ? "transform 0.5s cubic-bezier(0.25, 1, 0.5, 1)"
                  : "none",
              }}
            >
              {topSeriesMovies.map((movie) => (
                <div
                  key={movie.id}
                  className="relative h-full flex-shrink-0 overflow-hidden"
                  style={{ width: `${100 / topSeriesMovies.length}%` }}
                >
                  {isMobile ? (
                    <img
                      src={movie.poster || "/placeholder.svg"}
                      alt={movie.title}
                      className="w-full h-full object-cover pointer-events-none"
                      style={{ objectPosition: "top" }}
                    />
                  ) : (
                    <>
                      <img
                        src={movie.poster || "/placeholder.svg"}
                        alt=""
                        aria-hidden="true"
                        className="absolute inset-0 w-full h-full object-cover pointer-events-none"
                        style={{
                          filter: "blur(28px) brightness(0.55) saturate(1.1)",
                          transform: "scale(1.25)",
                        }}
                      />
                      <div className="absolute inset-y-0 right-0 w-[52%] flex items-center justify-center pt-[84px] pb-8 pr-6 lg:pr-14">
                        <img
                          src={movie.poster || "/placeholder.svg"}
                          alt={movie.title}
                          className="h-full max-w-full object-contain rounded-xl pointer-events-none"
                          style={{
                            boxShadow:
                              "0 25px 60px rgba(0,0,0,0.85), 0 0 40px rgba(0,0,0,0.5)",
                          }}
                        />
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>

            <div
              className="absolute inset-0 z-[5] pointer-events-none"
              style={{
                background: isMobile
                  ? "linear-gradient(to right, rgba(0,0,0,0.18), transparent 75%)"
                  : "linear-gradient(90deg, rgba(3,8,12,0.98) 0%, rgba(3,8,12,0.92) 28%, rgba(3,8,12,0.70) 46%, rgba(3,8,12,0.15) 70%, rgba(3,8,12,0.05) 100%), linear-gradient(0deg, rgba(0,0,0,0.95) 0%, transparent 36%)",
              }}
            />

            {!isMobile && (
              <div
                className="absolute inset-y-0 left-0 w-[55%] z-[5] pointer-events-none"
                style={{
                  backdropFilter: "blur(14px)",
                  WebkitBackdropFilter: "blur(14px)",
                  maskImage:
                    "linear-gradient(to right, black 35%, transparent 100%)",
                  WebkitMaskImage:
                    "linear-gradient(to right, black 35%, transparent 100%)",
                }}
              />
            )}

            <div
              className="absolute top-0 left-0 w-full pointer-events-none z-[6]"
              style={
                isMobile
                  ? {
                      height: "140px",
                      background:
                        "linear-gradient(to bottom, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.65) 35%, rgba(0,0,0,0.3) 65%, rgba(0,0,0,0) 100%)",
                      backdropFilter: "blur(12px)",
                      WebkitBackdropFilter: "blur(12px)",
                      maskImage:
                        "linear-gradient(to bottom, black 0%, black 45%, rgba(0,0,0,0.4) 70%, transparent 100%)",
                      WebkitMaskImage:
                        "linear-gradient(to bottom, black 0%, black 45%, rgba(0,0,0,0.4) 70%, transparent 100%)",
                    }
                  : {
                      height: "90px",
                      background:
                        "linear-gradient(to bottom, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.45) 55%, transparent 100%)",
                      backdropFilter: "blur(5px)",
                      WebkitBackdropFilter: "blur(5px)",
                    }
              }
            />

            <div
              className={`absolute bottom-0 left-0 w-full pointer-events-none z-[6] ${
                isMobile ? "h-[45%]" : "h-[32%]"
              }`}
              style={{
                background: isMobile
                  ? "linear-gradient(to top, #000 0%, rgba(0,0,0,0.6) 55%, transparent 100%)"
                  : "linear-gradient(to top, #000 0%, rgba(0,0,0,0.45) 45%, transparent 100%)",
              }}
            />

            <div
              className="absolute inset-0 z-10"
              onClick={() => {
                if (!topDidDragRef.current) onMovieClick(currentTopMovie)
              }}
              style={{ cursor: "pointer" }}
            />

            {isMobile ? (
              <div className="absolute bottom-0 left-0 w-full p-4 z-20 pointer-events-none flex items-end gap-4">
                <div className="w-16 h-24 rounded-lg overflow-hidden border-2 border-white/20 shadow-lg flex-shrink-0">
                  <img
                    src={currentTopMovie.poster || "/placeholder.svg"}
                    alt={currentTopMovie.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0 pb-1">
                  <h2 className="text-white text-lg font-bold mb-1 truncate drop-shadow-lg">
                    {currentTopMovie.title}
                  </h2>
                  <div className="flex items-center gap-3 text-xs text-gray-300">
                    {currentTopMovie.year && (
                      <span className="flex items-center gap-1">
                        <Film className="w-3 h-3" />
                        {currentTopMovie.year}
                      </span>
                    )}
                    {currentTopMovie.rating &&
                      currentTopMovie.rating !== "not available" && (
                        <span className="flex items-center gap-1 text-yellow-400">
                          <Star className="w-3 h-3 fill-yellow-400" />
                          {currentTopMovie.rating}
                        </span>
                      )}
                    {currentTopMovie.genre && (
                      <span className="truncate">{currentTopMovie.genre}</span>
                    )}
                  </div>
                </div>
                <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0 shadow-lg">
                  <Play className="w-5 h-5 text-white fill-white ml-0.5" />
                </div>
              </div>
            ) : (
              <div className="absolute inset-y-0 left-0 z-20 flex items-center w-full md:w-[50%] lg:w-[46%] px-8 lg:px-12 xl:px-16 pointer-events-none">
                <div className="w-full max-w-2xl pt-6">
                  <div className="text-cyan-300 text-sm lg:text-base font-bold tracking-wide mb-3">
                    TOP SERIES
                  </div>
                  <div className="text-white/70 text-xs lg:text-sm font-semibold tracking-[0.3em] uppercase mb-4">
                    Featured Series
                  </div>
                  <h1 className="text-white text-4xl lg:text-5xl xl:text-6xl font-extrabold leading-tight mb-5 drop-shadow-2xl line-clamp-2">
                    {currentTopMovie.title}
                  </h1>
                  <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-gray-200 text-sm lg:text-base mb-5">
                    {currentTopMovie.year && (
                      <span className="flex items-center gap-2">
                        <Film className="w-4 h-4" />
                        {currentTopMovie.year}
                      </span>
                    )}
                    {currentTopMovie.rating &&
                      currentTopMovie.rating !== "not available" && (
                        <span className="flex items-center gap-2 text-yellow-400">
                          <Star className="w-4 h-4 fill-yellow-400" />
                          {currentTopMovie.rating}
                        </span>
                      )}
                    {currentTopMovie.genre && (
                      <span className="text-gray-300">
                        {currentTopMovie.genre}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 lg:w-16 lg:h-16 rounded-full bg-white text-black flex items-center justify-center shadow-xl">
                      <Play className="w-7 h-7 lg:w-8 lg:h-8 fill-current ml-1" />
                    </div>
                    <div>
                      <div className="text-white font-bold text-base lg:text-lg">
                        Explore Series
                      </div>
                      <div className="text-gray-300 text-sm">
                        Discover your next favorite
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-8">
                    {topSeriesMovies.slice(0, 8).map((movie, index) => (
                      <div
                        key={movie.id}
                        className={`h-1 rounded-full transition-all duration-300 ${
                          index === topIndex % 8
                            ? "w-8 bg-white"
                            : "w-3 bg-white/40"
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* ====================================================== */}
      {/* TRENDING MOVIES */}
      {/* ====================================================== */}
      <div
        className={`relative z-10 ${
          isMobile ? "px-4 mt-2" : "px-6 lg:px-10 mt-5"
        }`}
      >
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
              textShadow:
                "0 0 10px rgba(255,107,0,0.7), 0 0 15px rgba(255,165,0,0.5)",
              animation: "fireGlow 2s ease-in-out infinite alternate",
            }}
          >
            Trending Now
          </h2>

          <style jsx>{`
            @keyframes fireGlow {
              0% {
                text-shadow: 0 0 8px rgba(255, 107, 0, 0.7),
                  0 0 15px rgba(255, 165, 0, 0.5);
                background: linear-gradient(to right, #ff6b00, #ffa500, #ff6b00);
                -webkit-background-clip: text;
                background-clip: text;
              }
              100% {
                text-shadow: 0 0 15px rgba(255, 107, 0, 0.9),
                  0 0 25px rgba(255, 165, 0, 0.7),
                  0 0 35px rgba(255, 69, 0, 0.6);
                background: linear-gradient(to right, #ff4500, #ff8c00, #ff4500);
                -webkit-background-clip: text;
                background-clip: text;
              }
            }
          `}</style>
        </div>

        <p className="uploaded-text text-center text-sm md:text-base mb-3 relative z-20">
          {totalMovieCount} Movie &amp; Series Uploaded
        </p>

        {/* ✅ DESKTOP: Native horizontal scroll — TRUE FREE SWIPE */}
        {!isMobile && (
          <div className="relative z-20 group">
            <button
              onClick={handlePrev}
              aria-label="Previous trending movies"
              className="absolute left-0 top-1/2 -translate-y-1/2 z-30 hidden md:flex items-center justify-center w-11 h-11 rounded-full carousel-nav-button text-white"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>

            <div
              ref={deskScrollRef}
              className="trending-scroll pb-4"
              style={{
                overflowX: "auto",
                overflowY: "hidden",
                scrollbarWidth: "none",
                msOverflowStyle: "none",
                WebkitOverflowScrolling: "touch",
                scrollSnapType: "none",
                cursor: "grab",
              }}
              onMouseDown={markUserInteracting}
              onMouseMove={markUserInteracting}
              onWheel={markUserInteracting}
              onTouchStart={markUserInteracting}
              onTouchMove={markUserInteracting}
              onScroll={markUserInteracting}
            >
              <div
                className="flex items-start gap-4 pt-4"
                style={{ width: "max-content" }}
              >
                {deskStrip.map((movie, i) => (
                  <div
                    key={`${i}-${movie.id}`}
                    data-trend-card
                    className="relative w-[180px] lg:w-[196px] flex-shrink-0 cursor-pointer group/card"
                    onClick={() => onMovieClick(movie)}
                  >
                    <div className="relative aspect-[2/3] overflow-hidden rounded-lg bg-gray-900 shadow-lg transition-transform duration-300 group-hover/card:scale-[1.04]">
                      <img
                        src={movie.poster || "/placeholder.svg"}
                        alt={movie.title}
                        loading="lazy"
                        className="w-full h-full object-cover transition-transform duration-500 group-hover/card:scale-105"
                        draggable={false}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-transparent to-transparent opacity-90" />
                      {movie.rating && movie.rating !== "not available" && (
                        <span className="absolute top-2 right-2 bg-black/75 text-white text-xs px-2 py-1 rounded-md font-semibold border border-white/20">
                          ⭐ {movie.rating}
                        </span>
                      )}
                      <div className="absolute inset-x-0 bottom-0 p-3">
                        <h3 className="text-white text-sm lg:text-base font-bold leading-snug line-clamp-2">
                          {movie.title}
                        </h3>
                        {movie.year && (
                          <p className="text-gray-300 text-xs mt-1">
                            {movie.year}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={handleNext}
              aria-label="Next trending movies"
              className="absolute right-0 top-1/2 -translate-y-1/2 z-30 hidden md:flex items-center justify-center w-11 h-11 rounded-full carousel-nav-button text-white"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>
        )}

        {/* ✅ MOBILE: 3D carousel */}
        {isMobile && (
          <div
            className="relative z-20 flex justify-center items-center h-[280px] w-full cursor-grab active:cursor-grabbing select-none"
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
                className="absolute w-[140px] h-[190px] rounded-2xl overflow-hidden hover:scale-105 cursor-pointer"
                style={getCardStyle(idx)}
                onClick={() => onMovieClick(movie)}
              >
                <img
                  src={movie.poster || "/placeholder.svg"}
                  alt={movie.title}
                  className="w-full h-full object-cover pointer-events-none"
                />
                {movie.rating && movie.rating !== "not available" && (
                  <span className="absolute top-1.5 right-1.5 bg-black/70 text-white text-[9px] px-1.5 py-0.5 rounded-full font-semibold border border-white/20">
                    ⭐ {movie.rating}
                  </span>
                )}
                <div className="absolute bottom-0 left-0 w-full p-2 bg-gradient-to-t from-black/90 to-transparent">
                  <h3 className="text-white text-[10px] font-bold truncate">
                    {movie.title}
                  </h3>
                  {movie.year && (
                    <p className="text-gray-300 text-[8px]">{movie.year}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Roboto:wght@700&display=swap');

          @keyframes carouselNavGlow {
            0%, 100% {
              box-shadow: 0 0 15px rgba(34,197,94,0.6),
                inset 0 0 20px rgba(255,255,255,0.1);
            }
            50% {
              box-shadow: 0 0 25px rgba(34,197,94,0.8),
                inset 0 0 30px rgba(255,255,255,0.15);
            }
          }

          .carousel-nav-button {
            background: rgba(34,197,94,0.15);
            backdrop-filter: blur(20px);
            border: 1px solid rgba(34,197,94,0.4);
            transition: all 0.3s ease;
            animation: carouselNavGlow 0.8s ease-in-out infinite;
          }

          .carousel-nav-button:hover {
            background: rgba(34,197,94,0.25);
            backdrop-filter: blur(25px);
            border: 1px solid rgba(34,197,94,0.6);
          }

          /* ✅ Swipe scroll bar সম্পূর্ণ লুকানো */
          .trending-scroll::-webkit-scrollbar {
            display: none;
            width: 0;
            height: 0;
          }
          .trending-scroll {
            scrollbar-width: none;
            -ms-overflow-style: none;
          }

          @keyframes uploadedGreenFlow {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
          }

          .uploaded-text {
            font-family: 'Roboto', sans-serif;
            font-weight: 700;
            letter-spacing: 0.02em;
            background: linear-gradient(
              90deg,
              #15803d,
              #22c55e,
              #86efac,
              #22c55e,
              #15803d
            );
            background-size: 300% 100%;
            -webkit-background-clip: text;
            background-clip: text;
            color: transparent;
            -webkit-text-fill-color: transparent;
            filter: drop-shadow(0 0 6px rgba(34,197,94,0.45));
            animation: uploadedGreenFlow 8s ease-in-out infinite;
          }

          @media (prefers-reduced-motion: reduce) {
            .uploaded-text,
            .carousel-nav-button {
              animation: none;
            }
          }
        `}</style>
      </div>

      {/* ====================================================== */}
      {/* UPCOMING / RELEASE SOON */}
      {/* ====================================================== */}
      <UpcomingSection onMovieClick={onMovieClick} />
    </section>
  )
      }
