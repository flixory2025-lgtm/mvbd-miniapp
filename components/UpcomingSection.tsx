"use client"

import { useEffect, useRef, useState } from "react"
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

interface UpcomingSectionProps {
  onMovieClick?: (movie: any) => void
}

/* =========================================================
   Release Date ফরম্যাটিং
========================================================= */
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

/* =========================================================
   Free Swipe Carousel (Top Series hero-এর মতো)
========================================================= */
function FreeSwipeCarousel({
  items,
  cardsPerView,
}: {
  items: UpcomingItem[]
  cardsPerView: number
}) {
  const [dragOffset, setDragOffset] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [transitionOn, setTransitionOn] = useState(true)

  const dragStartXRef = useRef(0)
  const didDragRef = useRef(false)

  const handleDragStart = (clientX: number) => {
    setIsDragging(true)
    setTransitionOn(false)
    dragStartXRef.current = clientX
    setDragOffset(0)
    didDragRef.current = false
  }

  const handleDragMove = (clientX: number) => {
    if (!isDragging) return
    const dx = clientX - dragStartXRef.current
    if (Math.abs(dx) > 5) didDragRef.current = true
    setDragOffset(dx)
  }

  const handleDragEnd = () => {
    if (!isDragging) return
    setIsDragging(false)
    setTransitionOn(true)
    setDragOffset(0)
    setTimeout(() => {
      didDragRef.current = false
    }, 50)
  }

  const onTouchStart = (e: React.TouchEvent) =>
    handleDragStart(e.touches[0].clientX)
  const onTouchMove = (e: React.TouchEvent) =>
    handleDragMove(e.touches[0].clientX)
  const onTouchEnd = handleDragEnd

  const onMouseDown = (e: React.MouseEvent) => handleDragStart(e.clientX)
  const onMouseMove = (e: React.MouseEvent) => {
    if (isDragging) handleDragMove(e.clientX)
  }
  const onMouseUp = handleDragEnd
  const onMouseLeave = () => {
    if (isDragging) handleDragEnd()
  }

  const gap = 8

  return (
    <div
      className="overflow-x-hidden overflow-y-visible cursor-grab active:cursor-grabbing select-none"
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseLeave}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      style={{ touchAction: "pan-y" }}
    >
      <div
        className="flex"
        style={{
          gap: `${gap}px`,
          transform: `translateX(${dragOffset}px)`,
          transition: transitionOn
            ? "transform 0.4s cubic-bezier(0.25, 1, 0.5, 1)"
            : "none",
          width: "max-content",
        }}
      >
        {items.map((item) => {
          const cardWidth = `calc((100vw - 32px - ${
            (cardsPerView - 1) * gap
          }px) / ${cardsPerView})`

          return (
            <div
              key={item.id}
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
                    draggable={false}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-600 text-[10px] p-1 text-center">
                    {item.title}
                  </div>
                )}

                {/* Position Number — Netflix style, উপরে বাম */}
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

                {/* Release Date — কমলা ব্যাজ, উপরে ডান */}
                <span className="absolute top-1.5 right-1.5 bg-orange-500 text-white text-[9px] md:text-[10px] px-1.5 py-[2px] rounded font-bold shadow-lg border border-white/40 z-10 flex items-center gap-0.5 whitespace-nowrap">
                  <Calendar className="w-2 h-2" />
                  {formatReleaseDate(item.releaseDate)}
                </span>

                {/* Title নিচে */}
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
          )
        })}
      </div>
    </div>
  )
}

/* =========================================================
   Main Section
========================================================= */
export default function UpcomingSection({}: UpcomingSectionProps) {
  const [items, setItems] = useState<UpcomingItem[]>([])
  const [loading, setLoading] = useState(true)
  const [cardsPerView, setCardsPerView] = useState(3)

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

  if (items.length === 0) return null

  return (
    <section className="relative px-4 mt-5 mb-6">
      {/* হেডিং */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-white text-sm md:text-base font-bold tracking-wide flex items-center gap-2">
          <span className="w-1 h-4 bg-green-500 rounded-full"></span>
          UPCOMING / RELEASE SOON
        </h2>
        <span className="text-[9px] text-gray-400 hidden md:block">
          Top 10 Famous
        </span>
      </div>

      <FreeSwipeCarousel items={items} cardsPerView={cardsPerView} />
    </section>
  )
}
