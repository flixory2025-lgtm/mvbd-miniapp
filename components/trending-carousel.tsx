"use client"

import {
  useState,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useCallback,
} from "react"
import { ChevronLeft, ChevronRight, Play, Film, Star } from "lucide-react"
import { movies } from "@/lib/movie-data"
import UpcomingSection from "@/components/UpcomingSection"

const topSeriesIds = [
  3456, 3461, 3465, 3467, 3475, 3477, 3480, 3481,
  3483, 3484, 3486, 3487, 3490, 3493, 3496, 3497,
  3498,
]

const trendingIds = [
  3453, 3454, 3455, 3456, 3457, 3458, 3460, 3461,
  3462, 3463, 3464, 3465, 3466, 3467, 3468, 3469,
  3472, 3473, 3475, 3476, 3477, 3478, 3479, 3480,
  3481, 3483, 3484, 3485, 3486, 3487, 3488, 3490,
  3491, 3493, 3495, 3496, 3497, 3498, 3413, 3412,
  3411, 3410,
]

/* =========================================================
   TOP 20 HERO — helpers
========================================================= */
const HERO_REFRESH_MS = 3 * 60 * 60 * 1000 // API থেকে ৩ ঘণ্টা পর পর নতুন data
const HERO_AUTO_MS = 4500 // auto slide
const HERO_GAP = 12 // mobile info-card gap (px)

const useIsoLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect

interface HeroItem {
  key: string
  id: number | string
  title: string
  poster?: string | null
  backdrop?: string | null
  backdropSm?: string | null
  year?: string | number
  rating?: string
  genre?: string
  tag?: string
  isLocal?: boolean
  raw: any
}

const apiToHeroItem = (a: any, idx: number): HeroItem => ({
  key: `${a.mediaType || "x"}-${a.id}-${idx}`,
  id: a.id,
  title: a.title || "Untitled",
  poster: a.poster,
  backdrop: a.backdrop,
  backdropSm: a.backdropSm,
  year: a.year,
  rating: a.rating,
  genre: a.genre,
  tag: a.tag,
  raw: a,
})

// API load না হলে / fail করলে আগের local top series দেখাবে
const localToHeroItem = (m: any): HeroItem => ({
  key: `local-${m.id}`,
  id: m.id,
  title: m.title,
  poster: m.poster,
  backdrop: null,
  year: m.year,
  rating: m.rating,
  genre: m.genre,
  isLocal: true,
  raw: m,
})

// "Title [Hindi] (2025) Season 1" -> "title"
const cleanForMatch = (s: string) =>
  String(s || "")
    .toLowerCase()
    .replace(/\[[^\]]*\]|\([^)]*\)|\{[^}]*\}/g, " ")
    .replace(/season\s*\d+/g, " ")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim()

let localMovieIndex: Map<string, (typeof movies)[0]> | null = null
const findLocalMovie = (title: string) => {
  if (!localMovieIndex) {
    localMovieIndex = new Map()
    for (const m of movies) {
      const k = cleanForMatch(m.title)
      if (!k) continue
      const prev = localMovieIndex.get(k)
      if (!prev || Number(m.id) > Number(prev.id)) localMovieIndex.set(k, m)
    }
  }
  return localMovieIndex.get(cleanForMatch(title)) || null
}

interface TrendingCarouselProps {
  onMovieClick: (movie: (typeof movies)[0]) => void
}

export default function TrendingCarousel({
  onMovieClick,
}: TrendingCarouselProps) {
  const trendingMovies = movies.filter((m) => trendingIds.includes(m.id))
  const trendingCount = trendingMovies.length
  const totalMovieCount = movies.length

  // Mobile 3D carousel state
  const [currentIndex, setCurrentIndex] = useState(0)
  const [dragDistance, setDragDistance] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [isTransitioning, setIsTransitioning] = useState(true)
  const [isMobile, setIsMobile] = useState(false)

  const startXRef = useRef(0)
  const autoSlideRef = useRef<ReturnType<typeof setInterval> | null>(null)
  // ✅ Native scroll refs
  const deskScrollRef = useRef<HTMLDivElement>(null)
  const isUserInteractingRef = useRef(false)
  const interactionTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Restore saved positions
  useEffect(() => {
    try {
      const savedTrendingIndex = sessionStorage.getItem("trendingIndex")
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
      sessionStorage.setItem("trendingIndex", currentIndex.toString())
    } catch {}
  }, [currentIndex])

  // Detect screen size
  useEffect(() => {
    const updateSize = () => {
      setIsMobile(window.innerWidth < 768)
    }
    updateSize()
    window.addEventListener("resize", updateSize)
    return () => {
      window.removeEventListener("resize", updateSize)
    }
  }, [])


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

  const deskStrip = [...trendingMovies, ...trendingMovies, ...trendingMovies]

  /* =========================================================
     ✅ TOP 20 HERO — landscape, API driven, free native swipe
     - /api/top20 থেকে data (৩ ঘণ্টা পর পর auto refresh)
     - native horizontal scroll + snap  => আঙুলের সাথে smooth free swipe
     - 3 copy strip => সবসময় infinite loop (শেষে গেলে আবার প্রথমে)
  ========================================================= */
  const [apiTop, setApiTop] = useState<HeroItem[]>([])
  const [heroIndex, setHeroIndex] = useState(0)

  const heroScrollRef = useRef<HTMLDivElement>(null)
  const heroStripRef = useRef<HTMLDivElement>(null)
  const heroCountRef = useRef(0)
  const heroIndexRef = useRef(0)
  const heroLastStripRef = useRef(0)
  const heroRafRef = useRef(0)
  const heroIdleRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const heroSnapTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const heroInteractingRef = useRef(false)
  const heroInteractTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null
  )
  const heroTouchingRef = useRef(false)
  const heroDidDragRef = useRef(false)
  const heroDragRef = useRef({ active: false, startX: 0, startLeft: 0 })
  const heroRestoredRef = useRef(false)

  const heroItems = useMemo<HeroItem[]>(() => {
    if (apiTop.length > 0) return apiTop
    return movies
      .filter((m) => topSeriesIds.includes(m.id))
      .map(localToHeroItem)
  }, [apiTop])
  const heroCount = heroItems.length
  heroCountRef.current = heroCount
  const heroLoop = heroCount > 1

  // 3 copy (আগে / মাঝে / পরে) — মাঝেরটাতে সবসময় থাকবে, তাই কখনো শেষ হয় না
  const heroSlides = useMemo(() => {
    const copies = heroLoop ? [0, 1, 2] : [0]
    return copies.flatMap((copy) =>
      heroItems.map((item, i) => ({ item, copy, i }))
    )
  }, [heroItems, heroLoop])

  // API fetch + প্রতি ৩ ঘণ্টায় আবার fetch
  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        const res = await fetch("/api/top20")
        if (!res.ok) return
        const data = await res.json()
        const list: any[] = Array.isArray(data?.results) ? data.results : []
        const usable = list.filter((a) => a && (a.backdrop || a.poster))
        if (!cancelled && usable.length > 0) {
          setApiTop(usable.map(apiToHeroItem))
        }
      } catch {}
    }
    load()
    const t = setInterval(load, HERO_REFRESH_MS)
    return () => {
      cancelled = true
      clearInterval(t)
    }
  }, [])

  const getHeroSlideWidth = () => {
    const el = heroScrollRef.current
    if (!el) return 0
    const first = el.firstElementChild as HTMLElement | null
    return first ? first.getBoundingClientRect().width : el.clientWidth
  }

  // Mobile info-card strip — hero scroll এর সাথে হুবহু sync (state ছাড়া, transform দিয়ে)
  const updateHeroStrip = (pos: number) => {
    const track = heroStripRef.current
    if (!track) return
    const first = track.firstElementChild as HTMLElement | null
    if (!first) return
    const step = first.offsetWidth + HERO_GAP
    track.style.transform = `translate3d(${-pos * step}px,0,0)`
  }

  // কোনো animation ছাড়া সরাসরি নির্দিষ্ট slide এ বসিয়ে দেয়
  const positionHeroAt = (stripIdx: number) => {
    const el = heroScrollRef.current
    if (!el) return
    const w = getHeroSlideWidth()
    if (!w) return
    el.style.scrollSnapType = "none"
    el.scrollLeft = stripIdx * w
    heroLastStripRef.current = stripIdx
    updateHeroStrip(stripIdx)
    requestAnimationFrame(() => {
      const node = heroScrollRef.current
      if (node && !heroDragRef.current.active && !heroSnapTimeoutRef.current) {
        node.style.scrollSnapType = "x mandatory"
      }
    })
  }

  // শেষের/প্রথম copy তে চলে গেলে অদৃশ্যভাবে মাঝের copy তে ফিরিয়ে আনে
  const recenterHero = () => {
    const el = heroScrollRef.current
    const count = heroCountRef.current
    if (!el || count < 2) return
    if (heroTouchingRef.current || heroDragRef.current.active) return
    const w = getHeroSlideWidth()
    if (!w) return
    const strip = Math.round(el.scrollLeft / w)
    if (Math.abs(el.scrollLeft - strip * w) > 2) return // এখনও snap হচ্ছে
    if (strip < count) positionHeroAt(strip + count)
    else if (strip >= count * 2) positionHeroAt(strip - count)
  }

  const markHeroInteracting = () => {
    heroInteractingRef.current = true
    if (heroInteractTimeoutRef.current) {
      clearTimeout(heroInteractTimeoutRef.current)
    }
    heroInteractTimeoutRef.current = setTimeout(() => {
      heroInteractingRef.current = false
    }, 5000)
  }

  const onHeroScroll = () => {
    if (heroRafRef.current) return
    heroRafRef.current = requestAnimationFrame(() => {
      heroRafRef.current = 0
      const el = heroScrollRef.current
      const count = heroCountRef.current
      if (!el || count === 0) return
      const w = getHeroSlideWidth()
      if (!w) return
      const pos = el.scrollLeft / w
      updateHeroStrip(pos)
      const strip = Math.round(pos)
      heroLastStripRef.current = strip
      const real = ((strip % count) + count) % count
      if (real !== heroIndexRef.current) {
        heroIndexRef.current = real
        setHeroIndex(real)
      }
      if (heroIdleRef.current) clearTimeout(heroIdleRef.current)
      heroIdleRef.current = setTimeout(recenterHero, 160)
    })
  }

  const onHeroTouchStart = () => {
    heroTouchingRef.current = true
    markHeroInteracting()
  }
  const onHeroTouchEnd = () => {
    heroTouchingRef.current = false
    markHeroInteracting()
    if (heroIdleRef.current) clearTimeout(heroIdleRef.current)
    heroIdleRef.current = setTimeout(recenterHero, 260)
  }

  // Desktop mouse drag (touch এ native scroll নিজেই কাজ করে)
  const onHeroPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== "mouse" || e.button !== 0) return
    const el = heroScrollRef.current
    if (!el) return
    markHeroInteracting()
    if (heroSnapTimeoutRef.current) {
      clearTimeout(heroSnapTimeoutRef.current)
      heroSnapTimeoutRef.current = null
    }
    heroDragRef.current = {
      active: true,
      startX: e.clientX,
      startLeft: el.scrollLeft,
    }
    heroDidDragRef.current = false
    el.style.scrollSnapType = "none"
    el.style.cursor = "grabbing"
  }

  const onHeroPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const d = heroDragRef.current
    const el = heroScrollRef.current
    if (!d.active || !el) return
    const dx = e.clientX - d.startX
    if (Math.abs(dx) > 5) heroDidDragRef.current = true
    el.scrollLeft = d.startLeft - dx
    markHeroInteracting()
  }

  const endHeroMouseDrag = () => {
    const d = heroDragRef.current
    const el = heroScrollRef.current
    if (!d.active || !el) return
    d.active = false
    const w = getHeroSlideWidth()
    if (!w) return
    const delta = el.scrollLeft - d.startLeft
    const startStrip = Math.round(d.startLeft / w)
    let target = startStrip
    if (delta > w * 0.12) target = startStrip + 1
    else if (delta < -w * 0.12) target = startStrip - 1
    el.style.cursor = "grab"
    el.scrollTo({ left: target * w, behavior: "smooth" })
    markHeroInteracting()
    // smooth scroll শেষ হওয়ার পর snap আবার চালু
    heroSnapTimeoutRef.current = setTimeout(() => {
      heroSnapTimeoutRef.current = null
      if (heroScrollRef.current && !heroDragRef.current.active) {
        heroScrollRef.current.style.scrollSnapType = "x mandatory"
      }
    }, 550)
    setTimeout(() => {
      heroDidDragRef.current = false
    }, 60)
  }

  const heroGo = (dir: 1 | -1) => {
    const el = heroScrollRef.current
    if (!el || heroCountRef.current < 1) return
    const w = getHeroSlideWidth()
    if (!w) return
    markHeroInteracting()
    el.scrollTo({
      left: (Math.round(el.scrollLeft / w) + dir) * w,
      behavior: "smooth",
    })
  }

  // ক্লিক করলে: সাইটে ওই movie/series থাকলে সেটাই খুলবে, না থাকলে API data
  const openHero = (item: HeroItem) => {
    const local = item.isLocal ? item.raw : findLocalMovie(item.title)
    onMovieClick((local ?? item.raw) as (typeof movies)[0])
  }

  // list বদলালে (fallback -> API) সঠিক জায়গায় বসাও + আগের position restore
  useIsoLayoutEffect(() => {
    if (heroCount === 0) return
    let idx = Math.min(heroIndexRef.current, heroCount - 1)
    if (!heroRestoredRef.current) {
      try {
        const saved = parseInt(
          sessionStorage.getItem("topSeriesIndex") || "",
          10
        )
        if (!isNaN(saved) && saved >= 0 && saved < heroCount) idx = saved
      } catch {}
      if (apiTop.length > 0) heroRestoredRef.current = true
    }
    heroIndexRef.current = idx
    setHeroIndex(idx)
    positionHeroAt((heroLoop ? heroCount : 0) + idx)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [heroCount, apiTop.length])

  useEffect(() => {
    try {
      sessionStorage.setItem("topSeriesIndex", String(heroIndexRef.current))
    } catch {}
  }, [heroIndex])

  // Window / sidebar size বদলালে alignment ঠিক রাখো
  useEffect(() => {
    const el = heroScrollRef.current
    if (!el || typeof ResizeObserver === "undefined") return
    const ro = new ResizeObserver(() => {
      if (heroCountRef.current === 0) return
      positionHeroAt(heroLastStripRef.current)
    })
    ro.observe(el)
    return () => ro.disconnect()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [heroCount])

  // Auto slide
  useEffect(() => {
    if (heroCount < 2) return
    if (
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
    ) {
      return
    }
    const id = setInterval(() => {
      if (heroInteractingRef.current || document.hidden) return
      const el = heroScrollRef.current
      if (!el) return
      if (el.getBoundingClientRect().bottom < 0) return // hero স্ক্রিনের বাইরে
      const w = getHeroSlideWidth()
      if (!w) return
      el.scrollTo({
        left: (Math.round(el.scrollLeft / w) + 1) * w,
        behavior: "smooth",
      })
    }, HERO_AUTO_MS)
    return () => clearInterval(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [heroCount])

  useEffect(() => {
    return () => {
      if (heroRafRef.current) cancelAnimationFrame(heroRafRef.current)
      if (heroIdleRef.current) clearTimeout(heroIdleRef.current)
      if (heroSnapTimeoutRef.current) clearTimeout(heroSnapTimeoutRef.current)
      if (heroInteractTimeoutRef.current)
        clearTimeout(heroInteractTimeoutRef.current)
    }
  }, [])

  return (
    <section className="relative pb-4 overflow-hidden bg-black">
      {/* ====================================================== */}
      {/* TOP 20 HERO — landscape poster (header এর পেছন পর্যন্ত) */}
      {/* ====================================================== */}
      <div className="relative w-full overflow-hidden select-none bg-black h-[calc(76px_+_58vw)] md:h-[520px] lg:h-[620px]">
        {heroCount > 0 && (
          <>
            {/* ✅ Native free swipe track */}
            <div
              ref={heroScrollRef}
              className="hero-scroll absolute inset-0 flex overflow-x-auto overflow-y-hidden"
              style={{
                scrollSnapType: "x mandatory",
                overscrollBehaviorX: "contain",
                WebkitOverflowScrolling: "touch",
                scrollbarWidth: "none",
                msOverflowStyle: "none",
                cursor: "grab",
              }}
              onScroll={onHeroScroll}
              onTouchStart={onHeroTouchStart}
              onTouchEnd={onHeroTouchEnd}
              onTouchCancel={onHeroTouchEnd}
              onPointerDown={onHeroPointerDown}
              onPointerMove={onHeroPointerMove}
              onPointerUp={endHeroMouseDrag}
              onPointerLeave={endHeroMouseDrag}
              onPointerCancel={endHeroMouseDrag}
              onWheel={(e) => {
                if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) markHeroInteracting()
              }}
            >
              {heroSlides.map(({ item, copy, i }) => (
                <div
                  key={`${copy}-${item.key}`}
                  className="relative h-full flex-shrink-0 overflow-hidden"
                  style={{
                    flexBasis: "100%",
                    width: "100%",
                    scrollSnapAlign: "start",
                  }}
                  onClick={() => {
                    if (!heroDidDragRef.current) openHero(item)
                  }}
                >
                  <img
                    src={item.backdrop || item.poster || "/placeholder.svg"}
                    srcSet={
                      item.backdrop && item.backdropSm
                        ? `${item.backdropSm} 780w, ${item.backdrop} 1280w`
                        : undefined
                    }
                    sizes="100vw"
                    alt={item.title}
                    draggable={false}
                    loading={copy === (heroLoop ? 1 : 0) && i < 3 ? "eager" : "lazy"}
                    decoding="async"
                    className="absolute inset-0 h-full w-full object-cover pointer-events-none"
                    style={{
                      objectPosition: item.backdrop ? "center 30%" : "center 15%",
                    }}
                  />

                  {/* Desktop text (slide এর সাথেই swipe হয়) */}
                  <div className="hidden md:flex absolute inset-y-0 left-0 z-20 items-center w-[50%] lg:w-[46%] px-8 lg:px-12 xl:px-16 pointer-events-none">
                    <div className="w-full max-w-2xl pt-6">
                      <div className="text-cyan-300 text-sm lg:text-base font-bold tracking-wide mb-3">
                        TOP 20 TRENDING
                      </div>
                      <div className="text-white/70 text-xs lg:text-sm font-semibold tracking-[0.3em] uppercase mb-4">
                        {item.tag || "Featured"}
                      </div>
                      <h1 className="text-white text-4xl lg:text-5xl xl:text-6xl font-extrabold leading-tight mb-5 drop-shadow-2xl line-clamp-2">
                        {item.title}
                      </h1>
                      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-gray-200 text-sm lg:text-base mb-5">
                        {item.year && (
                          <span className="flex items-center gap-2">
                            <Film className="w-4 h-4" />
                            {item.year}
                          </span>
                        )}
                        {item.rating && item.rating !== "not available" && (
                          <span className="flex items-center gap-2 text-yellow-400">
                            <Star className="w-4 h-4 fill-yellow-400" />
                            {item.rating}
                          </span>
                        )}
                        {item.genre && (
                          <span className="text-gray-300">{item.genre}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 lg:w-16 lg:h-16 rounded-full bg-white text-black flex items-center justify-center shadow-xl">
                          <Play className="w-7 h-7 lg:w-8 lg:h-8 fill-current ml-1" />
                        </div>
                        <div>
                          <div className="text-white font-bold text-base lg:text-lg">
                            Explore Now
                          </div>
                          <div className="text-gray-300 text-sm">
                            Discover your next favorite
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* হালকা top shade (blur ছাড়া) — header এর লেখা পড়া যাওয়ার জন্য */}
            <div
              className="absolute top-0 left-0 w-full h-[110px] z-[5] pointer-events-none"
              style={{
                background:
                  "linear-gradient(to bottom, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0.18) 55%, transparent 100%)",
              }}
            />

            {/* Desktop: বাম দিকে text এর জন্য হালকা shade (blur নেই) */}
            <div
              className="hidden md:block absolute inset-0 z-[5] pointer-events-none"
              style={{
                background:
                  "linear-gradient(90deg, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.6) 28%, rgba(0,0,0,0.18) 55%, transparent 75%)",
              }}
            />

            {/* নিচে page এর কালো background এর সাথে মিশে যাওয়া */}
            <div
              className="absolute bottom-0 left-0 w-full h-[42%] md:h-[32%] z-[5] pointer-events-none"
              style={{
                background:
                  "linear-gradient(to top, #000 0%, rgba(0,0,0,0.6) 50%, transparent 100%)",
              }}
            />

            {/* Progress bars */}
            <div className="absolute z-[6] pointer-events-none flex items-center gap-1 bottom-14 left-1/2 -translate-x-1/2 md:bottom-10 md:left-8 lg:left-12 xl:left-16 md:translate-x-0">
              {heroItems.map((item, index) => (
                <div
                  key={item.key}
                  className={`h-1 rounded-full transition-all duration-300 ${
                    index === heroIndex
                      ? "w-5 md:w-8 bg-white"
                      : "w-1.5 md:w-3 bg-white/40"
                  }`}
                />
              ))}
            </div>

            {/* Desktop arrows */}
            <div className="hidden md:flex absolute z-30 bottom-8 right-8 gap-3">
              <button
                onClick={() => heroGo(-1)}
                aria-label="Previous"
                className="flex items-center justify-center w-11 h-11 rounded-full carousel-nav-button text-white"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <button
                onClick={() => heroGo(1)}
                aria-label="Next"
                className="flex items-center justify-center w-11 h-11 rounded-full carousel-nav-button text-white"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </div>
          </>
        )}
      </div>

      {/* ====================================================== */}
      {/* MOBILE: hero এর নিচে info card strip (hero এর সাথে sync) */}
      {/* ====================================================== */}
      {heroCount > 0 && (
        <div className="md:hidden relative z-10 -mt-12 mb-1 overflow-hidden px-4">
          <div
            ref={heroStripRef}
            className="flex will-change-transform"
            style={{ gap: HERO_GAP }}
          >
            {heroSlides.map(({ item, copy }) => (
              <div
                key={`${copy}-${item.key}`}
                className="flex items-center gap-3 rounded-2xl p-2.5 cursor-pointer"
                style={{
                  flex: "0 0 calc(100% - 16px)",
                  minWidth: 0,
                  background: "rgba(255,255,255,0.09)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  backdropFilter: "blur(14px)",
                  WebkitBackdropFilter: "blur(14px)",
                }}
                onClick={() => openHero(item)}
              >
                <div className="w-[52px] h-[74px] rounded-lg overflow-hidden flex-shrink-0 bg-gray-800 border border-white/15">
                  <img
                    src={item.poster || item.backdrop || "/placeholder.svg"}
                    alt={item.title}
                    loading="lazy"
                    draggable={false}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-white text-base font-bold truncate">
                    {item.title}
                  </h2>
                  <div className="flex items-center gap-2 text-xs text-gray-300 mt-1 min-w-0">
                    {item.year && (
                      <span className="flex items-center gap-1 flex-shrink-0">
                        <Film className="w-3 h-3" />
                        {item.year}
                      </span>
                    )}
                    {item.rating && item.rating !== "not available" && (
                      <span className="flex items-center gap-1 text-yellow-400 flex-shrink-0">
                        <Star className="w-3 h-3 fill-yellow-400" />
                        {item.rating}
                      </span>
                    )}
                    {(item.tag || item.genre) && (
                      <span className="truncate">{item.tag || item.genre}</span>
                    )}
                  </div>
                </div>
                <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0 shadow-lg">
                  <Play className="w-5 h-5 text-white fill-white ml-0.5" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

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

          /* ✅ Top 20 hero — scrollbar লুকানো */
          .hero-scroll::-webkit-scrollbar {
            display: none;
            width: 0;
            height: 0;
          }
          .hero-scroll {
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
