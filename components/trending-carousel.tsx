"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { ChevronLeft, ChevronRight, Play, Film, Star } from "lucide-react"
import { movies } from "@/lib/movie-data"

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

  // Desktop-only infinite carousel state.
  const [desktopIndex, setDesktopIndex] = useState(0)
  const [desktopTransition, setDesktopTransition] = useState(true)

  const topStartXRef = useRef(0)
  const startXRef = useRef(0)
  const autoSlideRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const topAutoSlideRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const desktopAutoSlideRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const topContainerRef = useRef<HTMLDivElement>(null)
  const desktopTrackRef = useRef<HTMLDivElement>(null)
  const desktopViewportRef = useRef<HTMLDivElement>(null)
  const desktopPausedRef = useRef(false)

  const topSeriesMovies = movies.filter((m) =>
    topSeriesIds.includes(m.id)
  )

  const trendingMovies = movies.filter((m) =>
    trendingIds.includes(m.id)
  )

  // Duplicate the list so the Desktop carousel can loop seamlessly.
  const desktopMovies = [...trendingMovies, ...trendingMovies]

  const totalMovieCount = movies.length

  // Restore existing saved positions.
  useEffect(() => {
    try {
      const savedTopIndex = sessionStorage.getItem("topSeriesIndex")
      const savedTrendingIndex = sessionStorage.getItem("trendingIndex")

      if (savedTopIndex && topSeriesMovies.length > 0) {
        const value = parseInt(savedTopIndex, 10)

        if (!isNaN(value) && value >= 0 && value < topSeriesMovies.length) {
          setTopIndex(value)
        }
      }

      if (savedTrendingIndex && trendingMovies.length > 0) {
        const value = parseInt(savedTrendingIndex, 10)

        if (!isNaN(value) && value >= 0 && value < trendingMovies.length) {
          setCurrentIndex(value)
          setDesktopIndex(value)
        }
      }
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    try {
      sessionStorage.setItem("topSeriesIndex", String(topIndex))
    } catch {}
  }, [topIndex])

  useEffect(() => {
    try {
      sessionStorage.setItem("trendingIndex", String(currentIndex))
    } catch {}
  }, [currentIndex])

  // Screen size and container measurement.
  useEffect(() => {
    const updateSize = () => {
      setIsMobile(window.innerWidth < 768)

      if (topContainerRef.current) {
        setContainerWidth(topContainerRef.current.offsetWidth)
      }
    }

    updateSize()
    window.addEventListener("resize", updateSize)

    const resizeTimeout = setTimeout(updateSize, 100)

    return () => {
      window.removeEventListener("resize", updateSize)
      clearTimeout(resizeTimeout)
    }
  }, [])

  // Top Series auto-slide.
  useEffect(() => {
    if (topSeriesMovies.length === 0 || topIsDragging) return

    if (topAutoSlideRef.current) {
      clearInterval(topAutoSlideRef.current)
    }

    topAutoSlideRef.current = setInterval(() => {
      setTopIndex((prev) => (prev + 1) % topSeriesMovies.length)
    }, 4000)

    return () => {
      if (topAutoSlideRef.current) {
        clearInterval(topAutoSlideRef.current)
      }
    }
  }, [topSeriesMovies.length, topIsDragging])

  // Original Mobile Trending auto-slide.
  const startAutoSlide = useCallback(() => {
    if (autoSlideRef.current) {
      clearInterval(autoSlideRef.current)
    }

    if (trendingMovies.length === 0) return

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

  // Independent Desktop infinite auto-slide.
  useEffect(() => {
    if (isMobile || trendingMovies.length <= 1) return

    desktopAutoSlideRef.current = setInterval(() => {
      if (!desktopPausedRef.current) {
        setDesktopTransition(true)
        setDesktopIndex((prev) => prev + 1)
      }
    }, 3000)

    return () => {
      if (desktopAutoSlideRef.current) {
        clearInterval(desktopAutoSlideRef.current)
      }
    }
  }, [isMobile, trendingMovies.length])

  // Re-enable transitions after resetting the duplicate track.
  useEffect(() => {
    if (desktopTransition) return

    const frame = requestAnimationFrame(() => {
      setDesktopTransition(true)
    })

    return () => cancelAnimationFrame(frame)
  }, [desktopTransition])

  // Keyboard controls.
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (trendingMovies.length === 0) return

      if (e.key === "ArrowRight") {
        setCurrentIndex((prev) => (prev + 1) % trendingMovies.length)
        if (!isMobile) {
          setDesktopTransition(true)
          setDesktopIndex((prev) => prev + 1)
        }
      } else if (e.key === "ArrowLeft") {
        setCurrentIndex(
          (prev) => (prev - 1 + trendingMovies.length) % trendingMovies.length
        )

        if (!isMobile) {
          setDesktopTransition(true)
          setDesktopIndex((prev) => Math.max(0, prev - 1))
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [trendingMovies.length, isMobile])

  const handlePrev = () => {
    if (!trendingMovies.length) return

    setIsTransitioning(true)
    setCurrentIndex(
      (prev) => (prev - 1 + trendingMovies.length) % trendingMovies.length
    )

    if (!isMobile) {
      setDesktopTransition(true)
      setDesktopIndex((prev) => Math.max(0, prev - 1))
    }
  }

  const handleNext = () => {
    if (!trendingMovies.length) return

    setIsTransitioning(true)
    setCurrentIndex((prev) => (prev + 1) % trendingMovies.length)

    if (!isMobile) {
      setDesktopTransition(true)
      setDesktopIndex((prev) => prev + 1)
    }
  }

  // Reset to the original copy after the duplicate's first complete loop.
  const handleDesktopTransitionEnd = () => {
    if (desktopIndex >= trendingMovies.length) {
      setDesktopTransition(false)
      setDesktopIndex(0)
    }
  }

  // Top Series drag handlers.
  const handleTopDragStart = (clientX: number) => {
    setTopIsDragging(true)
    setTopIsTransitioning(false)
    topStartXRef.current = clientX

    if (topAutoSlideRef.current) {
      clearInterval(topAutoSlideRef.current)
    }
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

    if (topDragDistance < -threshold && topSeriesMovies.length) {
      setTopIndex((prev) => (prev + 1) % topSeriesMovies.length)
    } else if (topDragDistance > threshold && topSeriesMovies.length) {
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

  // Original Mobile 3D carousel drag handlers.
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

    const threshold = 140 * 0.2

    if (dragDistance < -threshold && trendingMovies.length) {
      setCurrentIndex((prev) => (prev + 1) % trendingMovies.length)
    } else if (dragDistance > threshold && trendingMovies.length) {
      setCurrentIndex(
        (prev) => (prev - 1 + trendingMovies.length) % trendingMovies.length
      )
    }

    setDragDistance(0)
    startAutoSlide()
  }

  const handleTouchStart = (e: React.TouchEvent) =>
    handleDragStart(e.touches[0].clientX)

  const handleTouchMove = (e: React.TouchEvent) =>
    handleDragMove(e.touches[0].clientX)

  const handleTouchEnd = handleDragEnd

  const handleMouseDown = (e: React.MouseEvent) =>
    handleDragStart(e.clientX)

  const handleMouseMove = (e: React.MouseEvent) =>
    handleDragMove(e.clientX)

  const handleMouseUp = handleDragEnd

  const handleMouseWheel = (e: React.WheelEvent) => {
    if (isDragging) return
    if (e.deltaY > 0) handleNext()
    else handlePrev()
  }

  // Original 3D card positioning.
  const getCardStyle = (index: number) => {
    const total = trendingMovies.length
    if (!total) return {}

    let offset = (index - currentIndex + total) % total
    if (offset > total / 2) offset -= total

    const cardWidth = 140
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

    const xSpacing = 110
    const zSpacing = -70

    if (adjustedOffset >= 0 && adjustedOffset <= 1) {
      const p = adjustedOffset
      x = xSpacing * p
      z = zSpacing * p
      scale = 1 - 0.15 * p
      opacity = 1 - 0.3 * p
      shadow = p > 0.5
        ? "0 15px 30px rgba(0,0,0,0.5)"
        : "0 30px 60px rgba(0,0,0,0.9)"
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
      shadow = p > 0.5
        ? "0 15px 30px rgba(0,0,0,0.5)"
        : "0 30px 60px rgba(0,0,0,0.9)"
      rotateY = -5 * p
    } else if (adjustedOffset < -1 && adjustedOffset >= -4) {
      const p = Math.abs(adjustedOffset) - 1
      x = -xSpacing - xSpacing * 0.75 * p
      z = zSpacing - zSpacing * 0.6 * p
      scale = 0.85 - 0.12 * p
      opacity = 0.7 - 0.2 * p
      shadow = "0 10px 20px rgba(0,0,0,0.4)"
      rotateY = -5 - 2 * p
    }

    if (offset === 0 && Math.abs(dragProgress) < 0.05) {
      x = 0
      z = 0
      scale = 1
      opacity = 1
      rotateY = 0
      shadow =
        "0 30px 60px rgba(0,0,0,0.9), 0 0 30px rgba(255,255,255,0.05)"
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

  return (
    <section className="relative pb-4 overflow-hidden bg-black">
      {/* TOP SERIES */}
      <div
        ref={topContainerRef}
        className={`relative w-full overflow-hidden select-none bg-gray-900 ${
          isMobile
            ? "h-[420px] cursor-grab active:cursor-grabbing pt-[72px]"
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
            {/* Keep the original full-width Mobile slider.
                On Desktop, show the complete poster on the right. */}
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
                  className="relative h-full flex-shrink-0"
                  style={{ width: `${100 / topSeriesMovies.length}%` }}
                >
                  <img
                    src={movie.poster || "/placeholder.svg"}
                    alt={movie.title}
                    className={
                      isMobile
                        ? "w-full h-full object-cover pointer-events-none"
                        : "absolute right-0 top-0 w-full md:w-[65%] lg:w-[60%] h-full object-contain object-right pointer-events-none"
                    }
                    style={{
                      objectPosition: isMobile ? "top" : "right center",
                    }}
                  />
                  {!isMobile && (
                    <div className="absolute inset-0 bg-[#071014]/20 pointer-events-none" />
                  )}
                </div>
              ))}
            </div>

            {/* MOBILE: restore original top blur and mask.
                DESKTOP: use a left-side dark gradient and subtle blur. */}
            {isMobile ? (
              <div
                className="absolute top-0 left-0 w-full pointer-events-none z-[5]"
                style={{
                  height: "140px",
                  background:
                    "linear-gradient(to bottom, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.65) 35%, rgba(0,0,0,0.3) 65%, rgba(0,0,0,0) 100%)",
                  backdropFilter: "blur(12px)",
                  WebkitBackdropFilter: "blur(12px)",
                  maskImage:
                    "linear-gradient(to bottom, black 0%, black 45%, rgba(0,0,0,0.4) 70%, transparent 100%)",
                  WebkitMaskImage:
                    "linear-gradient(to bottom, black 0%, black 45%, rgba(0,0,0,0.4) 70%, transparent 100%)",
                }}
              />
            ) : (
              <>
                <div
                  className="absolute inset-0 z-[5] pointer-events-none"
                  style={{
                    background:
                      "linear-gradient(90deg, rgba(3,8,12,0.99) 0%, rgba(3,8,12,0.96) 22%, rgba(3,8,12,0.80) 38%, rgba(3,8,12,0.25) 58%, transparent 76%), linear-gradient(0deg, rgba(0,0,0,0.85) 0%, transparent 35%)",
                  }}
                />

                <div
                  className="absolute top-0 left-0 w-[48%] h-full z-[6] pointer-events-none"
                  style={{
                    backdropFilter: "blur(5px)",
                    WebkitBackdropFilter: "blur(5px)",
                    maskImage:
                      "linear-gradient(90deg, black 0%, black 65%, transparent 100%)",
                    WebkitMaskImage:
                      "linear-gradient(90deg, black 0%, black 65%, transparent 100%)",
                  }}
                />
              </>
            )}

            {/* Original bottom gradient restored on Mobile. */}
            <div
              className={`absolute bottom-0 left-0 w-full pointer-events-none z-[5] ${
                isMobile ? "h-[45%]" : "h-[28%]"
              }`}
              style={{
                background: isMobile
                  ? "linear-gradient(to top, #000 0%, rgba(0,0,0,0.6) 55%, transparent 100%)"
                  : "linear-gradient(to top, #000 0%, rgba(0,0,0,0.35) 45%, transparent 100%)",
              }}
            />

            <div
              className="absolute inset-0 z-10"
              onClick={() => {
                if (Math.abs(topDragDistance) < 5) {
                  onMovieClick(currentTopMovie)
                }
              }}
              style={{ cursor: "pointer" }}
            />

            {/* MOBILE: original bottom information layout. */}
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
                      <span className="truncate">
                        {currentTopMovie.genre}
                      </span>
                    )}
                  </div>
                </div>

                <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0 shadow-lg">
                  <Play className="w-5 h-5 text-white fill-white ml-0.5" />
                </div>
              </div>
            ) : (
              /* DESKTOP: information on the left. */
              <div className="absolute inset-y-0 left-0 z-20 flex items-center w-[58%] px-8 lg:px-12 xl:px-16 pointer-events-none">
                <div className="w-full max-w-2xl pt-5">
                  <p className="text-cyan-300 text-sm font-bold mb-3">
                    TOP SERIES
                  </p>

                  <p className="text-gray-300 text-xs tracking-[0.3em] uppercase mb-4">
                    Featured Series
                  </p>

                  <h1 className="text-white text-4xl lg:text-5xl xl:text-6xl font-extrabold leading-tight mb-5 drop-shadow-2xl line-clamp-2">
                    {currentTopMovie.title}
                  </h1>

                  <div className="flex flex-wrap items-center gap-4 text-gray-200 text-sm mb-5">
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
                      <Play className="w-7 h-7 fill-current ml-1" />
                    </div>

                    <div>
                      <p className="text-white font-bold text-lg">
                        Explore Series
                      </p>
                      <p className="text-gray-300 text-sm">
                        Discover your next favorite
                      </p>
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

      {/* TRENDING NOW */}
      <div className={`relative z-10 ${isMobile ? "px-4 mt-2" : "px-6 lg:px-10 mt-5"}`}>
        <div className="relative z-20 mb-1 flex flex-col items-center justify-center">
          <h2
            className="text-xl font-bold text-center tracking-wider"
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
                text-shadow: 0 0 8px rgba(255,107,0,.7), 0 0 15px rgba(255,165,0,.5);
              }
              100% {
                text-shadow: 0 0 15px rgba(255,107,0,.9), 0 0 25px rgba(255,165,0,.7), 0 0 35px rgba(255,69,0,.6);
              }
            }
          `}</style>
        </div>

        <p className="uploaded-text text-center text-sm md:text-base mb-3 relative z-20">
          {totalMovieCount} Movie &amp; Series Uploaded
        </p>

        {/* DESKTOP: continuous horizontal poster carousel */}
        {!isMobile && trendingMovies.length > 0 && (
          <div className="relative z-20">
            <button
              onClick={handlePrev}
              aria-label="Previous trending movies"
              className="absolute left-0 top-1/2 -translate-y-1/2 z-30 flex items-center justify-center w-11 h-11 rounded-full carousel-nav-button text-white"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>

            <div
              ref={desktopViewportRef}
              className="overflow-hidden mx-5"
              onMouseEnter={() => {
                desktopPausedRef.current = true
              }}
              onMouseLeave={() => {
                desktopPausedRef.current = false
              }}
            >
              <div
                ref={desktopTrackRef}
                className="flex items-start gap-4 py-4"
                onTransitionEnd={handleDesktopTransitionEnd}
                style={{
                  width: "max-content",
                  transform: `translateX(-${desktopIndex * 212}px)`,
                  transition: desktopTransition
                    ? "transform 0.5s cubic-bezier(0.25, 1, 0.5, 1)"
                    : "none",
                }}
              >
                {desktopMovies.map((movie, index) => (
                  <div
                    key={`${movie.id}-${index}`}
                    className="relative w-[196px] flex-shrink-0 cursor-pointer"
                    onClick={() => onMovieClick(movie)}
                  >
                    <div className="relative aspect-[2/3] overflow-hidden rounded-lg bg-gray-900 shadow-lg transition-transform duration-300 hover:scale-[1.03]">
                      <img
                        src={movie.poster || "/placeholder.svg"}
                        alt={movie.title}
                        loading="lazy"
                        draggable={false}
                        className="w-full h-full object-cover"
                      />

                      <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-transparent to-transparent pointer-events-none" />

                      {movie.rating &&
                        movie.rating !== "not available" && (
                          <span className="absolute top-2 right-2 bg-black/75 text-white text-xs px-2 py-1 rounded-md font-semibold border border-white/20">
                            ⭐ {movie.rating}
                          </span>
                        )}

                      <div className="absolute inset-x-0 bottom-0 p-3">
                        <h3 className="text-white text-sm font-bold line-clamp-2">
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
              className="absolute right-0 top-1/2 -translate-y-1/2 z-30 flex items-center justify-center w-11 h-11 rounded-full carousel-nav-button text-white"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>
        )}

        {/* MOBILE: original 3D carousel */}
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
            {trendingMovies.map((movie, index) => (
              <div
                key={movie.id}
                className="absolute w-[140px] h-[190px] rounded-2xl overflow-hidden cursor-pointer"
                style={getCardStyle(index)}
                onClick={() => onMovieClick(movie)}
              >
                <img
                  src={movie.poster || "/placeholder.svg"}
                  alt={movie.title}
                  className="w-full h-full object-cover pointer-events-none"
                />

                {movie.rating &&
                  movie.rating !== "not available" && (
                    <span className="absolute top-1.5 right-1.5 bg-black/70 text-white text-[9px] px-1.5 py-0.5 rounded-full font-semibold border border-white/20">
                      ⭐ {movie.rating}
                    </span>
                  )}

                <div className="absolute bottom-0 left-0 w-full p-2 bg-gradient-to-t from-black/90 to-transparent">
                  <h3 className="text-white text-[10px] font-bold truncate">
                    {movie.title}
                  </h3>

                  {movie.year && (
                    <p className="text-gray-300 text-[8px]">
                      {movie.year}
                    </p>
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
              box-shadow: 0 0 15px rgba(34,197,94,.6),
                inset 0 0 20px rgba(255,255,255,.1);
            }
            50% {
              box-shadow: 0 0 25px rgba(34,197,94,.8),
                inset 0 0 30px rgba(255,255,255,.15);
            }
          }

          .carousel-nav-button {
            background: rgba(34,197,94,.15);
            backdrop-filter: blur(20px);
            border: 1px solid rgba(34,197,94,.4);
            transition: all .3s ease;
            animation: carouselNavGlow .8s ease-in-out infinite;
          }

          .carousel-nav-button:hover {
            background: rgba(34,197,94,.25);
            border-color: rgba(34,197,94,.6);
          }

          @keyframes uploadedGreenFlow {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
          }

          .uploaded-text {
            font-family: 'Roboto', sans-serif;
            font-weight: 700;
            letter-spacing: .02em;
            background: linear-gradient(
              90deg, #15803d, #22c55e, #86efac, #22c55e, #15803d
            );
            background-size: 300% 100%;
            -webkit-background-clip: text;
            background-clip: text;
            color: transparent;
            -webkit-text-fill-color: transparent;
            filter: drop-shadow(0 0 6px rgba(34,197,94,.45));
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
    </section>
  )
        }
