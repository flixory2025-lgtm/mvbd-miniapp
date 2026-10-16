"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { Star, Calendar } from "lucide-react"

interface UpcomingItem {
  id: number
  title: string
  poster: string | null
  year: string
  releaseDate: string | null
  rating: string
  tag: string
  mediaType: "movie" | "tv"
}

interface UpcomingSectionProps {
  onMovieClick: (movie: any) => void
}

/* =========================================================
   Release Date ফরম্যাটিং
========================================================= */
function formatReleaseDate(dateStr: string | null): string {
  if (!dateStr) return "Coming Soon"

  try {
    const release = new Date(dateStr + "T00:00:00")
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const diffDays = Math.ceil(
      (release.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    )

    if (diffDays >= 0) {
      if (diffDays === 0) return "Today"
      if (diffDays === 1) return "Tomorrow"
      if (diffDays <= 7) {
        return release.toLocaleDateString("en-US", { weekday: "short" })
      }
      if (diffDays <= 14) return "Next Week"

      const sameYear = release.getFullYear() === today.getFullYear()
      return release.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: sameYear ? undefined : "numeric",
      })
    }

    return release.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    })
  } catch {
    return "Coming Soon"
  }
}

export default function UpcomingSection({ onMovieClick }: UpcomingSectionProps) {
  const [items, setItems] = useState<UpcomingItem[]>([])
  const [loading, setLoading] = useState(true)
  const [isPaused, setIsPaused] = useState(false)
  const [cardsPerView, setCardsPerView] = useState(6)
  const [trackIndex, setTrackIndex] = useState(0)
  const [transitionOn, setTransitionOn] = useState(true)

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Drag refs (swipe fix)
  const dragStartXRef = useRef(0)
  const dragOffsetRef = useRef(0)
  const isDraggingRef = useRef(false)
  const didDragRef = useRef(false)
  const [dragOffset, setDragOffset] = useState(0)

  /* =========================================================
     API থেকে Top 10 upcoming আনো
  ========================================================= */
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch("/api/upcoming")
        const data = await res.json()
        setItems(data.results || [])
      } catch (err) {
        console.error("Upcoming fetch error:", err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  /* =========================================================
     Responsive cards per view (ছোট সাইজ)
  ========================================================= */
  useEffect(() => {
    const update = () => {
      const w = window.innerWidth
      if (w < 480) setCardsPerView(2)
      else if (w < 640) setCardsPerView(3)
      else if (w < 768) setCardsPerView(4)
      else if (w < 1024) setCardsPerView(5)
      else if (w < 1440) setCardsPerView(7)
      else setCardsPerView(9)
    }
    update()
    window.addEventListener("resize", update)
    return () => window.removeEventListener("resize", update)
  }, [])

  /* =========================================================
     Infinite loop: ডান থেকে বামে একধাপ করে স্লাইড
  ========================================================= */
  const maxIndex = Math.max(0, items.length - cardsPerView)

  const goNext = useCallback(() => {
    setTrackIndex((prev) => (prev >= maxIndex ? 0 : prev + 1))
  }, [maxIndex])

  const goPrev = useCallback(() => {
    setTrackIndex((prev) => (prev <= 0 ? maxIndex : prev - 1))
  }, [maxIndex])

  // Auto slide: প্রতি ৩ সেকেন্ডে, sequential, স্মুথ
  useEffect(() => {
    if (items.length === 0 || isPaused) return
    if (intervalRef.current) clearInterval(intervalRef.current)

    intervalRef.current = setInterval(() => {
      goNext()
    }, 3000)

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [items.length, isPaused, goNext])

  /* =========================================================
     Swipe / Drag handlers — FIXED
  ========================================================= */
  const handleDragStart = (clientX: number) => {
    if (items.length === 0) return
    isDraggingRef.current = true
    didDragRef.current = false
    dragStartXRef.current = clientX
    dragOffsetRef.current = 0
    setDragOffset(0)
    setTransitionOn(false)
    setIsPaused(true)
  }

  const handleDragMove = (clientX: number) => {
    if (!isDraggingRef.current) return
    const dx = clientX - dragStartXRef.current
    if (Math.abs(dx) > 5) didDragRef.current = true
    dragOffsetRef.current = dx
    setDragOffset(dx)
  }

  const handleDragEnd = () => {
    if (!isDraggingRef.current) return
    isDraggingRef.current = false
    setTransitionOn(true)
    setIsPaused(false)

    const containerW = containerRef.current?.offsetWidth || 0
    const perCard = containerW / cardsPerView || 80
    const threshold = perCard / 3

    const dx = dragOffsetRef.current

    if (dx < -threshold) {
      goNext()
    } else if (dx > threshold) {
      goPrev()
    }

    dragOffsetRef.current = 0
    setDragOffset(0)

    // Click event যাতে ট্রিগার না হয় সেজন্য
    setTimeout(() => {
      didDragRef.current = false
    }, 50)
  }

  // Touch
  const onTouchStart = (e: React.TouchEvent) => handleDragStart(e.touches[0].clientX)
  const onTouchMove = (e: React.TouchEvent) => handleDragMove(e.touches[0].clientX)
  const onTouchEnd = () => handleDragEnd()

  // Mouse
  const onMouseDown = (e: React.MouseEvent) => handleDragStart(e.clientX)
  const onMouseMove = (e: React.MouseEvent) => {
    if (isDraggingRef.current) handleDragMove(e.clientX)
  }
  const onMouseUp = () => handleDragEnd()
  const onMouseLeave = () => {
    if (isDraggingRef.current) handleDragEnd()
    else setIsPaused(false)
  }

  /* =========================================================
     Loading skeleton (ছোট)
  ========================================================= */
  if (loading) {
    return (
      <section className="relative px-4 md:px-6 lg:px-10 mt-6 mb-6">
        <h2 className="text-white text-base md:text-lg font-bold mb-3">
          Top 10 Upcoming
        </h2>
        <div className="flex gap-2 overflow-hidden">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="w-[110px] md:w-[130px] aspect-[2/3] rounded-lg bg-white/5 animate-pulse flex-shrink-0"
            />
          ))}
        </div>
      </section>
    )
  }

  if (items.length === 0) return null

  const total = items.length
  const gap = 8 // ছোট gap
  const translatePercent = -(trackIndex * (100 / cardsPerView))
  const dragPercent = containerRef.current
    ? (dragOffset / containerRef.current.offsetWidth) * 100
    : 0

  return (
    <section className="relative px-4 md:px-6 lg:px-10 mt-6 mb-6">
      {/* হেডিং */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-white text-base md:text-lg font-bold">
          Top 10 Upcoming
        </h2>
        <span className="text-[10px] text-gray-400 hidden md:block">
          Auto-updating
        </span>
      </div>

      {/* স্লাইডশো কন্টেইনার */}
      <div
        ref={containerRef}
        className="overflow-hidden cursor-grab active:cursor-grabbing select-none"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={onMouseLeave}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        style={{ touchAction: "pan-y" }}
      >
        <div
          className="flex"
          style={{
            gap: `${gap}px`,
            width: `${(total / cardsPerView) * 100}%`,
            transform: `translateX(calc(${translatePercent}% + ${dragPercent}%))`,
            transition: transitionOn
              ? "transform 0.7s cubic-bezier(0.25, 1, 0.5, 1)"
              : "none",
          }}
        >
          {items.map((item) => (
            <div
              key={item.id}
              onClick={() => {
                if (!didDragRef.current) onMovieClick(item)
              }}
              className="relative rounded-lg overflow-hidden cursor-pointer flex-shrink-0 group"
              style={{ width: `${100 / total}%` }}
            >
              <div className="relative w-full aspect-[2/3] bg-gray-800">
                {item.poster ? (
                  <img
                    src={item.poster}
                    alt={item.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                    draggable={false}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-600 text-[10px] p-2 text-center">
                    {item.title}
                  </div>
                )}

                {/* উপরে বাম: ট্যাগ */}
                <span className="absolute top-1.5 left-1.5 bg-black/80 text-white text-[8px] md:text-[9px] px-1.5 py-[2px] rounded font-bold border border-white/20 backdrop-blur-sm z-10">
                  {item.tag}
                </span>

                {/* উপরে ডান: রেটিং */}
                {item.rating && item.rating !== "not available" && (
                  <span className="absolute top-1.5 right-1.5 bg-black/80 text-yellow-400 text-[8px] md:text-[9px] px-1.5 py-[2px] rounded flex items-center gap-0.5 border border-white/20 z-10 font-bold">
                    <Star className="w-2 h-2 fill-yellow-400" />
                    {item.rating}
                  </span>
                )}

                {/* রিলিজ ডেট - ট্যাগের নিচে, সুন্দর সবুজ ব্যাজ */}
                <span className="absolute top-7 md:top-8 left-1.5 bg-gradient-to-r from-green-500 to-emerald-500 text-white text-[8px] md:text-[9px] px-1.5 py-[2px] rounded font-bold shadow-lg border border-white/30 z-10 flex items-center gap-0.5 whitespace-nowrap">
                  <Calendar className="w-2 h-2" />
                  {formatReleaseDate(item.releaseDate)}
                </span>

                {/* নিচে গ্রেডিয়েন্ট + টাইটেল */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/70 to-transparent p-1.5 md:p-2">
                  <h3 className="text-white text-[10px] md:text-[11px] font-bold truncate leading-tight">
                    {item.title}
                  </h3>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ইন্ডিকেটর ডট */}
      <div className="flex justify-center gap-1 mt-3">
        {Array.from({ length: Math.max(1, maxIndex + 1) }).map((_, i) => (
          <button
            key={i}
            onClick={() => setTrackIndex(i)}
            aria-label={`Go to slide ${i + 1}`}
            className={`h-1 rounded-full transition-all duration-300 ${
              i === trackIndex ? "w-5 bg-green-500" : "w-1.5 bg-white/20"
            }`}
          />
        ))}
      </div>
    </section>
  )
                  }
