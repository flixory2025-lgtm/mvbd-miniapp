"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { Star } from "lucide-react"

interface UpcomingItem {
  id: number
  title: string
  poster: string | null
  backdrop: string | null
  year: string
  rating: string
  tag: string
  mediaType: "movie" | "tv"
}

interface UpcomingSectionProps {
  onMovieClick: (movie: any) => void
}

export default function UpcomingSection({ onMovieClick }: UpcomingSectionProps) {
  const [items, setItems] = useState<UpcomingItem[]>([])
  const [loading, setLoading] = useState(true)
  const [visibleStart, setVisibleStart] = useState(0)
  const [isTransitioning, setIsTransitioning] = useState(true)
  const [isPaused, setIsPaused] = useState(false)
  const [cardsPerView, setCardsPerView] = useState(6)

  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  /* =========================================================
     API থেকে ডাটা আনি
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
     রেসপন্সিভ কার্ড সংখ্যা নির্ধারণ
  ========================================================= */
  useEffect(() => {
    const updateCardsPerView = () => {
      const w = window.innerWidth
      if (w < 480) setCardsPerView(2)
      else if (w < 768) setCardsPerView(3)
      else if (w < 1024) setCardsPerView(4)
      else if (w < 1440) setCardsPerView(5)
      else setCardsPerView(6)
    }
    updateCardsPerView()
    window.addEventListener("resize", updateCardsPerView)
    return () => window.removeEventListener("resize", updateCardsPerView)
  }, [])

  /* =========================================================
     Slideshow লজিক — প্রতি ৩ সেকেন্ডে ডান থেকে বামে
  ========================================================= */
  const advanceSlide = useCallback(() => {
    setVisibleStart((prev) => {
      const next = prev + 1
      // শেষে পৌঁছে গেলে আবার শুরুতে ফিরে যাবে
      if (next > items.length - cardsPerView) return 0
      return next
    })
  }, [items.length, cardsPerView])

  useEffect(() => {
    if (items.length === 0 || isPaused) return
    if (intervalRef.current) clearInterval(intervalRef.current)

    intervalRef.current = setInterval(() => {
      advanceSlide()
    }, 3000)

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [items.length, isPaused, advanceSlide])

  /* =========================================================
     Transition রিসেট (infinite loop-এ স্মুথ করার জন্য)
  ========================================================= */
  useEffect(() => {
    if (visibleStart === 0) {
      // ছোট delay দিয়ে transition বন্ধ করে দিই, যাতে আবার নতুন করে শুরু হয়
      setIsTransitioning(false)
      const t = setTimeout(() => setIsTransitioning(true), 50)
      return () => clearTimeout(t)
    }
  }, [visibleStart])

  /* =========================================================
     ডাটা না থাকলে Skeleton দেখাই
  ========================================================= */
  if (loading) {
    return (
      <section className="relative px-4 mt-8 mb-8">
        <h2 className="text-white text-xl md:text-2xl font-bold mb-4">
          Upcoming Movies & Series
        </h2>
        <div className="flex gap-3 overflow-hidden">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="w-[140px] md:w-[180px] h-[210px] md:h-[270px] rounded-xl bg-white/5 animate-pulse flex-shrink-0"
            />
          ))}
        </div>
      </section>
    )
  }

  if (items.length === 0) return null

  /* =========================================================
     কার্ড width হিসাব (px-4 এর সাথে মিলিয়ে)
  ========================================================= */
  const gap = 12 // px
  const total = items.length
  const translatePercent = -(visibleStart * (100 / cardsPerView))

  return (
    <section className="relative px-4 mt-8 mb-10">
      {/* হেডিং */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-white text-xl md:text-2xl font-bold">
          Upcoming Movies & Series
        </h2>
        <span className="text-xs text-gray-400 hidden md:block">
          Auto-updating
        </span>
      </div>

      {/* স্লাইডশো কন্টেইনার */}
      <div
        ref={containerRef}
        className="overflow-hidden"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        onTouchStart={() => setIsPaused(true)}
        onTouchEnd={() => setIsPaused(false)}
      >
        <div
          className="flex"
          style={{
            gap: `${gap}px`,
            transform: `translateX(${translatePercent}%)`,
            transition: isTransitioning
              ? "transform 0.7s cubic-bezier(0.25, 1, 0.5, 1)"
              : "none",
            width: `${(total / cardsPerView) * 100}%`,
          }}
        >
          {items.map((item) => (
            <div
              key={item.id}
              onClick={() => onMovieClick(item)}
              className="relative rounded-xl overflow-hidden cursor-pointer flex-shrink-0 group"
              style={{ width: `${100 / total}%` }}
            >
              {/* পোস্টার */}
              <div className="relative w-full aspect-[2/3] bg-gray-800">
                {item.poster ? (
                  <img
                    src={item.poster}
                    alt={item.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-600 text-xs p-2 text-center">
                    {item.title}
                  </div>
                )}

                {/* উপরে ছোট ট্যাগ (Movie / Series / K-Drama) */}
                <span className="absolute top-2 left-2 bg-black/75 text-white text-[9px] md:text-[10px] px-2 py-0.5 rounded font-semibold border border-white/20 backdrop-blur-sm">
                  {item.tag}
                </span>

                {/* রেটিং */}
                {item.rating && item.rating !== "not available" && (
                  <span className="absolute top-2 right-2 bg-black/75 text-yellow-400 text-[9px] md:text-[10px] px-1.5 py-0.5 rounded flex items-center gap-0.5 border border-white/20">
                    <Star className="w-2.5 h-2.5 fill-yellow-400" />
                    {item.rating}
                  </span>
                )}

                {/* নিচে গ্রেডিয়েন্ট + টাইটেল */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/70 to-transparent p-2 md:p-3">
                  <h3 className="text-white text-[11px] md:text-sm font-bold truncate">
                    {item.title}
                  </h3>
                  <p className="text-gray-300 text-[9px] md:text-[11px] mt-0.5">
                    {item.year}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* নিচে ছোট ইন্ডিকেটর ডট (Netflix-এর মতো নয়, তবে একটা ফিনিশিং টাচ) */}
      <div className="flex justify-center gap-1.5 mt-4">
        {Array.from({ length: Math.max(1, total - cardsPerView + 1) }).map(
          (_, i) => (
            <div
              key={i}
              className={`h-1 rounded-full transition-all duration-300 ${
                i === visibleStart
                  ? "w-6 bg-green-500"
                  : "w-1.5 bg-white/20"
              }`}
            />
          )
        )}
      </div>
    </section>
  )
}
