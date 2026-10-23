"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { Calendar } from "lucide-react"

interface UpcomingItem {
  id: number
  title: string
  poster: string | null
  year: string
  releaseDate: string | null
  rating: string
  tag: string
  mediaType: "movie" | "tv"
  position: number
}

interface AnimeUpcomingSectionProps {
  onAnimeClick?: (anime: any) => void
}

function formatReleaseDate(dateStr: string | null): string {
  if (!dateStr) return "Soon"
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
    return "Soon"
  }
}

export default function AnimeUpcomingSection({}: AnimeUpcomingSectionProps) {
  const [items, setItems] = useState<UpcomingItem[]>([])
  const [loading, setLoading] = useState(true)
  const [failed, setFailed] = useState(false)
  const [retryKey, setRetryKey] = useState(0)
  const [cardsPerView, setCardsPerView] = useState(3)
  const [isPaused, setIsPaused] = useState(false)

  const scrollRef = useRef<HTMLDivElement>(null)
  const autoRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    const update = () => {
      const w = window.innerWidth
      if (w < 480) setCardsPerView(3)
      else if (w < 768) setCardsPerView(4)
      else if (w < 1024) setCardsPerView(5)
      else setCardsPerView(6)
    }
    update()
    window.addEventListener("resize", update)
    return () => window.removeEventListener("resize", update)
  }, [])

  useEffect(() => {
    const ctrl = new AbortController()
    const fetchData = async () => {
      setLoading(true)
      setFailed(false)
      try {
        const res = await fetch("/api/anime-upcoming", { signal: ctrl.signal })
        if (!res.ok) throw new Error("HTTP " + res.status)
        const data = await res.json()
        const list = data.results || []
        setItems(list)
        if (list.length === 0) setFailed(true)
      } catch (err: any) {
        if (err?.name !== "AbortError") {
          console.error("Anime upcoming fetch error:", err)
          setFailed(true)
        }
      } finally {
        if (!ctrl.signal.aborted) setLoading(false)
      }
    }
    fetchData()
    return () => ctrl.abort()
  }, [retryKey])

  const advanceSlide = useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    const firstCard = el.querySelector("[data-card]") as HTMLElement | null
    if (!firstCard) return
    const cardWidth = firstCard.offsetWidth
    const gap = 8
    const step = cardWidth + gap
    const maxScroll = el.scrollWidth - el.clientWidth
    if (el.scrollLeft >= maxScroll - 5) {
      el.scrollTo({ left: 0, behavior: "smooth" })
      return
    }
    const next = Math.min(el.scrollLeft + step, maxScroll)
    el.scrollTo({ left: next, behavior: "smooth" })
  }, [])

  useEffect(() => {
    if (items.length === 0 || isPaused) return
    if (autoRef.current) clearInterval(autoRef.current)
    autoRef.current = setInterval(() => {
      advanceSlide()
    }, 3000)
    return () => {
      if (autoRef.current) clearInterval(autoRef.current)
    }
  }, [items.length, isPaused, advanceSlide])

  const pauseAuto = () => setIsPaused(true)
  const resumeAuto = () => setIsPaused(false)

  if (loading) {
    return (
      <section className="relative px-4 mt-5 mb-5">
        <div className="h-5 w-48 bg-white/5 rounded animate-pulse mb-3" />
        <div className="flex gap-2 overflow-hidden">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="w-[calc((100vw-48px)/3)] aspect-[2/3] rounded-lg bg-white/5 animate-pulse"
            />
          ))}
        </div>
      </section>
    )
  }

  // data na ele section ghayeb na hoye ekta message + Retry dekhabe
  if (items.length === 0) {
    if (!failed) return null
    return (
      <section className="relative px-4 mt-5 mb-6">
        <h2 className="text-white text-sm md:text-base font-bold tracking-wide flex items-center gap-2 mb-3">
          <span className="w-1 h-4 bg-green-500 rounded-full"></span>
          UPCOMING ANIME / RELEASE SOON
        </h2>
        <div className="rounded-lg border border-white/10 bg-white/5 py-8 text-center text-sm text-gray-400">
          Upcoming anime load hoyni.{" "}
          <button
            onClick={() => setRetryKey((k) => k + 1)}
            className="text-green-400 underline underline-offset-2"
          >
            Retry
          </button>
        </div>
      </section>
    )
  }

  const gap = 8
  const cardWidth = `calc((100vw - 32px - ${
    (cardsPerView - 1) * gap
  }px) / ${cardsPerView})`

  return (
    <section className="relative px-4 mt-5 mb-6">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-white text-sm md:text-base font-bold tracking-wide flex items-center gap-2">
          <span className="w-1 h-4 bg-green-500 rounded-full"></span>
          UPCOMING ANIME / RELEASE SOON
        </h2>
        <span className="text-[9px] text-gray-400 hidden md:block">
          Top 20 Famous
        </span>
      </div>

      <div
        ref={scrollRef}
        data-no-page-swipe
        className="flex overflow-x-auto overflow-y-hidden pb-1 upcoming-scroll"
        style={{
          gap: `${gap}px`,
          scrollbarWidth: "none",
          msOverflowStyle: "none",
          WebkitOverflowScrolling: "touch",
        }}
        onMouseEnter={pauseAuto}
        onMouseLeave={resumeAuto}
        onTouchStart={pauseAuto}
        onTouchEnd={resumeAuto}
        onPointerDown={(e) => e.stopPropagation()}
        onPointerMove={(e) => e.stopPropagation()}
        onPointerUp={(e) => e.stopPropagation()}
      >
        {items.map((item) => (
          <div
            key={item.id}
            data-card
            className="relative flex-shrink-0 pointer-events-none"
            style={{
              width: cardWidth,
              maxWidth: "180px",
            }}
          >
            <div className="relative w-full aspect-[2/3] bg-gray-800 rounded-lg overflow-hidden">
              {item.poster ? (
                <img
                  src={item.poster}
                  alt={item.title}
                  className="w-full h-full object-cover"
                  loading="lazy"
                  referrerPolicy="no-referrer"
                  draggable={false}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-600 text-[10px] p-1 text-center">
                  {item.title}
                </div>
              )}

              <div className="absolute top-0 left-0 z-10">
                <span
                  className="block px-1.5 pt-0.5 text-white text-2xl md:text-3xl font-black leading-none"
                  style={{
                    textShadow:
                      "-2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000, 2px 2px 0 #000, 0 3px 8px rgba(0,0,0,0.9)",
                  }}
                >
                  {item.position}
                </span>
              </div>

              <span className="absolute top-1.5 right-1.5 bg-orange-500 text-white text-[9px] md:text-[10px] px-1.5 py-[2px] rounded font-bold shadow-lg border border-white/40 z-10 flex items-center gap-0.5 whitespace-nowrap">
                <Calendar className="w-2 h-2" />
                {formatReleaseDate(item.releaseDate)}
              </span>

              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/80 to-transparent p-1.5">
                <h3 className="text-white text-[10px] md:text-[11px] font-bold truncate leading-tight">
                  {item.title}
                </h3>
                <p className="text-gray-400 text-[8px] md:text-[9px] mt-0.5">
                  {item.year}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <style jsx>{`
        .upcoming-scroll::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </section>
  )
}
