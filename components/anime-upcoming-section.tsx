"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { createPortal } from "react-dom"
import { ChevronLeft, ChevronRight, Star, CalendarDays, X } from "lucide-react"

/* =========================================================
   Upcoming Anime — Jikan API (MyAnimeList data, free, no key)
   Docs: https://docs.api.jikan.moe/
   ✅ Sob theke popular (members onujayi) 20 ta upcoming anime
   ✅ 6 ghontar jonno sessionStorage cache (API rate limit bachate)
========================================================= */

const API_URL =
  "https://api.jikan.moe/v4/anime?status=upcoming&order_by=members&sort=desc&sfw=true&limit=20"
const CACHE_KEY = "animeUpcomingCache_v1"
const CACHE_TTL = 6 * 60 * 60 * 1000

interface UpcomingAnime {
  id: number
  title: string
  poster: string
  date: string
  score: number | null
  genres: string[]
  synopsis: string
  trailer: string | null
}

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
]

function formatDate(a: any): string {
  const from = a?.aired?.prop?.from
  if (from?.year) {
    if (from.month && from.day) return `${MONTHS[from.month - 1]} ${from.day}, ${from.year}`
    if (from.month) return `${MONTHS[from.month - 1]} ${from.year}`
    return String(from.year)
  }
  if (a?.season && a?.year) {
    return `${a.season.charAt(0).toUpperCase()}${a.season.slice(1)} ${a.year}`
  }
  return "TBA"
}

function mapAnime(a: any): UpcomingAnime | null {
  const poster =
    a?.images?.webp?.large_image_url ||
    a?.images?.jpg?.large_image_url ||
    a?.images?.jpg?.image_url
  if (!a?.mal_id || !poster) return null
  return {
    id: a.mal_id,
    title: a.title_english || a.title,
    poster,
    date: formatDate(a),
    score: typeof a.score === "number" ? a.score : null,
    genres: Array.isArray(a.genres) ? a.genres.map((g: any) => g.name) : [],
    synopsis: a.synopsis || "",
    trailer: a.trailer?.url || null,
  }
}

export default function AnimeUpcomingSection() {
  const [items, setItems] = useState<UpcomingAnime[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [selected, setSelected] = useState<UpcomingAnime | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  const load = useCallback(async (signal?: AbortSignal) => {
    setLoading(true)
    setError(false)
    try {
      const raw = sessionStorage.getItem(CACHE_KEY)
      if (raw) {
        const c = JSON.parse(raw)
        if (Date.now() - c.t < CACHE_TTL && Array.isArray(c.d) && c.d.length) {
          setItems(c.d)
          setLoading(false)
          return
        }
      }
    } catch {}

    try {
      const res = await fetch(API_URL, { signal })
      if (!res.ok) throw new Error("API " + res.status)
      const json = await res.json()
      const seen = new Set<number>()
      const list: UpcomingAnime[] = []
      for (const a of json.data || []) {
        const m = mapAnime(a)
        if (m && !seen.has(m.id)) {
          seen.add(m.id)
          list.push(m)
        }
      }
      const top = list.slice(0, 20)
      setItems(top)
      try {
        sessionStorage.setItem(CACHE_KEY, JSON.stringify({ t: Date.now(), d: top }))
      } catch {}
    } catch (e: any) {
      if (e?.name !== "AbortError") setError(true)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const ctrl = new AbortController()
    load(ctrl.signal)
    return () => ctrl.abort()
  }, [load])

  // modal: Esc + body scroll lock
  useEffect(() => {
    if (!selected) return
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setSelected(null)
    document.addEventListener("keydown", onKey)
    document.body.style.overflow = "hidden"
    return () => {
      document.removeEventListener("keydown", onKey)
      document.body.style.overflow = ""
    }
  }, [selected])

  const scrollByCard = (dir: 1 | -1) => {
    const el = scrollRef.current
    if (!el) return
    const card = el.querySelector("[data-up-card]") as HTMLElement | null
    const step = (card?.offsetWidth ?? 160) + 16
    el.scrollBy({ left: dir * step * 2, behavior: "smooth" })
  }

  return (
    <div className="relative z-10 px-4 md:px-6 lg:px-10 mt-6 pb-6" data-no-page-swipe>
      <style>{`
        .up-scroll { scrollbar-width: none; -ms-overflow-style: none; }
        .up-scroll::-webkit-scrollbar { display: none; width: 0; height: 0; }
        @keyframes upShimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
        .up-skel {
          background: linear-gradient(90deg, #111 25%, #1c1c1c 50%, #111 75%);
          background-size: 200% 100%; animation: upShimmer 1.4s linear infinite;
        }
        @media (prefers-reduced-motion: reduce) { .up-skel { animation: none; } }
      `}</style>

      <div className="flex flex-col items-center mb-1">
        <h2
          className="text-xl font-bold text-center tracking-wider"
          style={{
            fontFamily: "'Times New Roman', serif",
            letterSpacing: "0.2em",
            background: "linear-gradient(to right, #22c55e, #86efac, #22c55e)",
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
            color: "transparent",
            textShadow: "0 0 12px rgba(34,197,94,0.45)",
          }}
        >
          Upcoming Anime
        </h2>
        <p className="text-gray-400 text-xs md:text-sm mt-1 mb-3">
          Most anticipated releases
        </p>
      </div>

      <div className="relative group">
        <button
          onClick={() => scrollByCard(-1)}
          aria-label="Previous upcoming anime"
          className="absolute left-0 top-1/2 -translate-y-1/2 z-30 hidden md:flex items-center justify-center w-10 h-10 rounded-full bg-black/60 border border-white/20 text-white hover:bg-black/80"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <div
          ref={scrollRef}
          className="up-scroll flex gap-4 overflow-x-auto pb-3 pt-2 snap-x overscroll-x-contain"
          style={{ touchAction: "pan-x pan-y", WebkitOverflowScrolling: "touch" }}
          onPointerDown={(e) => e.stopPropagation()}
          onPointerMove={(e) => e.stopPropagation()}
          onPointerUp={(e) => e.stopPropagation()}
        >
          {loading &&
            Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="up-skel flex-shrink-0 w-[130px] md:w-[170px] aspect-[2/3] rounded-lg"
              />
            ))}

          {!loading && error && (
            <div className="w-full text-center py-10 text-gray-400 text-sm">
              Upcoming anime load kora jayni.{" "}
              <button
                onClick={() => load()}
                className="text-green-400 underline underline-offset-2"
              >
                Retry
              </button>
            </div>
          )}

          {!loading &&
            !error &&
            items.map((a) => (
              <button
                type="button"
                key={a.id}
                data-up-card
                onClick={() => setSelected(a)}
                aria-label={`Details of ${a.title}`}
                className="relative flex-shrink-0 w-[130px] md:w-[170px] text-left snap-start group/card"
              >
                <div className="relative aspect-[2/3] overflow-hidden rounded-lg bg-gray-900 shadow-lg transition-transform duration-300 group-hover/card:scale-[1.04]">
                  <img
                    src={a.poster}
                    alt={a.title}
                    loading="lazy"
                    referrerPolicy="no-referrer"
                    draggable={false}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-transparent to-transparent" />
                  <span className="absolute top-2 left-2 flex items-center gap-1 bg-green-500/90 text-black text-[10px] md:text-xs font-bold px-1.5 py-0.5 rounded-md">
                    <CalendarDays className="w-3 h-3" />
                    {a.date}
                  </span>
                  {a.score && (
                    <span className="absolute top-2 right-2 bg-black/75 text-white text-[10px] md:text-xs px-1.5 py-0.5 rounded-md font-semibold border border-white/20">
                      ⭐ {a.score.toFixed(1)}
                    </span>
                  )}
                  <div className="absolute inset-x-0 bottom-0 p-2 md:p-3">
                    <h3 className="text-white text-xs md:text-sm font-bold leading-snug line-clamp-2">
                      {a.title}
                    </h3>
                  </div>
                </div>
              </button>
            ))}
        </div>

        <button
          onClick={() => scrollByCard(1)}
          aria-label="Next upcoming anime"
          className="absolute right-0 top-1/2 -translate-y-1/2 z-30 hidden md:flex items-center justify-center w-10 h-10 rounded-full bg-black/60 border border-white/20 text-white hover:bg-black/80"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {selected &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/75 p-4 backdrop-blur-xl"
            role="presentation"
            onMouseDown={(e) => {
              if (e.target === e.currentTarget) setSelected(null)
            }}
          >
            <section
              role="dialog"
              aria-modal="true"
              aria-label={selected.title}
              className="relative w-full max-w-lg max-h-[88vh] overflow-y-auto rounded-2xl border border-white/20 bg-slate-950 text-white shadow-2xl"
            >
              <button
                type="button"
                aria-label="Close"
                onClick={() => setSelected(null)}
                className="absolute right-3 top-3 z-10 rounded-full bg-black/60 p-1.5 text-slate-200 hover:bg-white/15"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="flex gap-4 p-4 pr-12">
                <img
                  src={selected.poster}
                  alt={selected.title}
                  referrerPolicy="no-referrer"
                  className="w-28 aspect-[2/3] object-cover rounded-lg flex-shrink-0"
                />
                <div className="min-w-0">
                  <h3 className="text-lg font-bold leading-snug">{selected.title}</h3>
                  <p className="mt-2 flex items-center gap-1.5 text-sm text-green-400">
                    <CalendarDays className="w-4 h-4" /> {selected.date}
                  </p>
                  {selected.score && (
                    <p className="mt-1 flex items-center gap-1.5 text-sm text-yellow-400">
                      <Star className="w-4 h-4 fill-yellow-400" /> {selected.score.toFixed(1)}
                    </p>
                  )}
                  {selected.genres.length > 0 && (
                    <p className="mt-2 text-xs text-gray-300">{selected.genres.join(" • ")}</p>
                  )}
                </div>
              </div>
              {selected.synopsis && (
                <p className="px-4 pb-4 text-sm leading-6 text-slate-300">
                  {selected.synopsis.length > 420
                    ? selected.synopsis.slice(0, 420).trimEnd() + "…"
                    : selected.synopsis}
                </p>
              )}
              {selected.trailer && (
                <div className="px-4 pb-5">
                  <a
                    href={selected.trailer}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold hover:bg-red-500"
                  >
                    ▶ Watch Trailer
                  </a>
                </div>
              )}
            </section>
          </div>,
          document.body
        )}
    </div>
  )
}
