"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { ArrowLeft, Star, Calendar, ExternalLink, X } from "lucide-react"
import { movies } from "@/lib/movie-data"

type Credit = {
  id: number
  title: string
  year: string
  mediaType: "movie" | "tv"
  posterPath: string | null
  rating: number
  character: string
  popularity: number
}

type Person = {
  id: number
  name: string
  profilePath: string | null
  biography: string
  knownFor: string
  birthday: string | null
  placeOfBirth: string | null
}

/* =========================================================
   TITLE NORMALIZATION
========================================================= */

function normalizeTitle(t: string): string {
  return t
    .toLowerCase()
    .replace(/\(\d{4}\)/g, "")
    .replace(/\[\d{4}\]/g, "")
    .replace(/\{[^}]*\}/g, "")
    .replace(/[\u{1D7CE}-\u{1D7FF}]/gu, "")
    .replace(/season\s*\d+/gi, "")
    .replace(/part\s*\d+/gi, "")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim()
}

function extractYear(year: string | number): number {
  if (!year) return 0
  const match = String(year).match(/\d{4}/)
  return match ? parseInt(match[0]) : 0
}

/**
 * দুইটা টাইটেল কতটা মিলে সেটার score (0 থেকে 1)
 */
function titleScore(a: string, b: string): number {
  const s1 = normalizeTitle(a)
  const s2 = normalizeTitle(b)

  if (!s1 || !s2) return 0
  if (s1 === s2) return 1

  // একটা অন্যটার substring হলে
  if (s1.includes(s2) || s2.includes(s1)) return 0.75

  // Word overlap
  const words1 = s1.split(" ").filter((w) => w.length > 2)
  const words2 = s2.split(" ").filter((w) => w.length > 2)

  if (words1.length === 0 || words2.length === 0) return 0

  let matches = 0
  for (const w1 of words1) {
    if (words2.some((w2) => w1 === w2 || w1.includes(w2) || w2.includes(w1))) {
      matches++
    }
  }

  return matches / Math.max(words1.length, words2.length)
}

/**
 * একটা credit-এর জন্য সাইটের সেরা ম্যাচ খুঁজে বের করে।
 * Score-based matching ব্যবহার করে।
 */
function findBestMatch(
  credit: Credit,
  siteMovies: Array<{ id: number; title: string; year: number | string }>
): { id: number; title: string; year: number | string } | null {
  const tmdbYear = parseInt(credit.year) || 0
  const tmdbTitle = credit.title

  let bestMatch: {
    id: number
    title: string
    year: number | string
  } | null = null
  let bestScore = 0

  for (const m of siteMovies) {
    const siteTitle = m.title
    const siteYear = extractYear(m.year)

    // Title similarity (0-1)
    const tScore = titleScore(tmdbTitle, siteTitle)
    if (tScore < 0.5) continue // খুব কম মিল হলে বাদ দিই

    // Year score
    let yScore = 0
    if (tmdbYear && siteYear) {
      const diff = Math.abs(tmdbYear - siteYear)
      if (diff === 0) yScore = 1
      else if (diff === 1) yScore = 0.7
      else if (diff === 2) yScore = 0.3
      else continue // ২ বছরের বেশি পার্থক্য হলে বাদ
    } else {
      // একপাশে year নেই — partial credit
      yScore = 0.4
    }

    // Final score: title 60% + year 40%
    const totalScore = tScore * 0.6 + yScore * 0.4

    if (totalScore > bestScore) {
      bestScore = totalScore
      bestMatch = { id: m.id, title: m.title, year: m.year }
    }
  }

  // খুব কম score হলে null দিই (ভুল ম্যাচ এড়াতে)
  if (bestScore < 0.65) return null

  return bestMatch
}

export default function PersonPage() {
  const router = useRouter()
  const params = useParams()
  const personId = params?.id as string

  const [person, setPerson] = useState<Person | null>(null)
  const [credits, setCredits] = useState<Credit[]>([])
  const [loading, setLoading] = useState(true)
  const [showRequestPopup, setShowRequestPopup] = useState(false)
  const [requestedTitle, setRequestedTitle] = useState("")

  useEffect(() => {
    if (!personId) return

    let cancelled = false

    async function fetchPerson() {
      setLoading(true)
      try {
        const res = await fetch(`/api/person/${personId}`)
        if (!res.ok) throw new Error("Failed")
        const data = await res.json()

        if (!cancelled) {
          setPerson(data.person)
          setCredits(data.credits || [])
        }
      } catch (err) {
        console.error("Person fetch error:", err)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchPerson()
    return () => {
      cancelled = true
    }
  }, [personId])

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  /**
   * Back/X ক্লিক করলে
   */
  function goBack() {
    try {
      const returnMovieId = sessionStorage.getItem("mvbd_return_movie_id")
      if (returnMovieId) {
        sessionStorage.setItem("mvbd_open_movie_id", returnMovieId)
        sessionStorage.removeItem("mvbd_return_movie_id")
        router.push("/?from=person")
        return
      }
    } catch {}

    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back()
    } else {
      router.push("/?from=person")
    }
  }

  function handleCreditClick(credit: Credit) {
    const found = findBestMatch(
      credit,
      movies.map((m) => ({ id: m.id, title: m.title, year: m.year }))
    )

    if (found) {
      try {
        sessionStorage.setItem("mvbd_open_movie_id", String(found.id))
        sessionStorage.removeItem("mvbd_return_movie_id")
      } catch {}
      router.push("/?from=person")
    } else {
      setRequestedTitle(`${credit.title}${credit.year ? ` (${credit.year})` : ""}`)
      setShowRequestPopup(true)
    }
  }

  function handleBack() {
    goBack()
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-black/80 backdrop-blur-lg border-b border-white/10">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <button
            onClick={handleBack}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold transition border border-white/20 hover:border-white/40"
          >
            <ArrowLeft className="w-5 h-5" />
            Back
          </button>
          <button
            onClick={handleBack}
            className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition border border-white/20"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </header>

      {loading ? (
        <div className="p-12 flex flex-col items-center justify-center min-h-[400px]">
          <div className="w-12 h-12 border-4 border-white/20 border-t-green-400 rounded-full animate-spin mb-4" />
          <p className="text-white/60">লোড হচ্ছে...</p>
        </div>
      ) : person ? (
        <div className="pb-20">
          {/* Person Header */}
          <div className="relative p-6 md:p-8 bg-gradient-to-br from-green-500/10 via-blue-500/5 to-transparent border-b border-white/10">
            <div className="max-w-5xl mx-auto flex flex-col md:flex-row gap-6 items-start">
              <div className="w-32 h-32 md:w-40 md:h-40 rounded-full overflow-hidden bg-white/10 flex-shrink-0 ring-4 ring-white/10 shadow-2xl mx-auto md:mx-0">
                {person.profilePath ? (
                  <img
                    src={person.profilePath}
                    alt={person.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-white/40 text-5xl font-bold">
                    {person.name.charAt(0)}
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0 text-center md:text-left">
                <h2 className="text-3xl md:text-4xl font-bold text-white mb-2">
                  {person.name}
                </h2>

                {person.knownFor && (
                  <p className="text-green-400 text-sm font-semibold uppercase tracking-wider mb-3">
                    {person.knownFor}
                  </p>
                )}

                <div className="flex flex-wrap gap-4 text-sm text-slate-300 mb-4 justify-center md:justify-start">
                  {person.birthday && (
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-4 h-4 text-slate-400" />
                      {person.birthday}
                    </div>
                  )}
                  {person.placeOfBirth && (
                    <div className="flex items-center gap-1.5">
                      📍 {person.placeOfBirth}
                    </div>
                  )}
                </div>

                {person.biography && (
                  <p className="text-slate-300 text-sm leading-relaxed">
                    {person.biography}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Credits Grid */}
          <div className="p-6 md:p-8 max-w-5xl mx-auto">
            <h3 className="text-xl md:text-2xl font-bold text-white mb-5 flex items-center gap-2">
              <span className="w-1 h-6 bg-gradient-to-b from-green-400 to-blue-500 rounded-full"></span>
              মুভি ও সিরিজ ({credits.length})
            </h3>

            {credits.length === 0 ? (
              <p className="text-slate-400 text-center py-8">
                কোনো কাজ পাওয়া যায়নি
              </p>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3 md:gap-4">
                {credits.map((credit) => {
                  const found = findBestMatch(
                    credit,
                    movies.map((m) => ({
                      id: m.id,
                      title: m.title,
                      year: m.year,
                    }))
                  )
                  const inSite = found !== null

                  return (
                    <button
                      key={`${credit.mediaType}-${credit.id}`}
                      onClick={() => handleCreditClick(credit)}
                      className="text-left group relative"
                    >
                      <div className="aspect-[2/3] rounded-lg overflow-hidden bg-white/5 relative ring-1 ring-white/10 group-hover:ring-green-400/60 transition-all duration-300 group-hover:scale-[1.03] shadow-lg">
                        {credit.posterPath ? (
                          <img
                            src={credit.posterPath}
                            alt={credit.title}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-white/30 text-xs p-2 text-center">
                            {credit.title}
                          </div>
                        )}

                        {inSite && (
                          <div className="absolute top-1.5 left-1.5 bg-green-500 text-black text-[9px] font-bold px-2 py-0.5 rounded-full shadow-lg z-10">
                            ✓ সাইটে আছে
                          </div>
                        )}

                        <div className="absolute top-1.5 right-1.5 bg-black/70 backdrop-blur-sm text-white text-[9px] font-bold px-2 py-0.5 rounded uppercase z-10">
                          {credit.mediaType === "tv" ? "TV" : "Movie"}
                        </div>

                        {credit.rating > 0 && (
                          <div className="absolute bottom-1.5 right-1.5 bg-yellow-500/90 text-black text-[9px] font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5 z-10">
                            <Star className="w-2.5 h-2.5 fill-black" />
                            {credit.rating.toFixed(1)}
                          </div>
                        )}

                        {credit.year && (
                          <div className="absolute bottom-1.5 left-1.5 bg-black/70 backdrop-blur-sm text-white text-[9px] font-bold px-1.5 py-0.5 rounded z-10">
                            {credit.year}
                          </div>
                        )}
                      </div>

                      <p className="mt-2 text-xs text-slate-300 line-clamp-2 group-hover:text-white transition leading-tight">
                        {credit.title}
                      </p>
                      {credit.character && (
                        <p className="text-[10px] text-slate-500 line-clamp-1 mt-0.5">
                          {credit.character}
                        </p>
                      )}
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="p-12 text-center">
          <p className="text-slate-400">ডেটা লোড করা যায়নি</p>
        </div>
      )}

      {/* Request Popup */}
      {showRequestPopup && (
        <div
          className="fixed inset-0 z-[110] bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setShowRequestPopup(false)}
        >
          <div
            className="relative w-full max-w-md bg-gradient-to-b from-slate-900 to-black rounded-2xl border border-white/10 shadow-2xl p-6 md:p-8"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowRequestPopup(false)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-orange-500/20 to-red-500/20 border border-orange-400/30 flex items-center justify-center text-3xl">
                🎬
              </div>

              <h3 className="text-xl font-bold text-white mb-2">
                মুভিটি সাইটে নেই
              </h3>

              <p className="text-slate-300 text-sm mb-1">
                <span className="font-semibold text-white">
                  "{requestedTitle}"
                </span>
              </p>

              <p className="text-slate-400 text-sm mb-6 leading-relaxed">
                আপনি যদি এটি দেখতে চান, আমাদের রিকোয়েস্ট গ্রুপে জানান —
                অ্যাডমিন দ্রুতই আপলোড করে দেবেন।
              </p>

              <div className="flex flex-col gap-3">
                <a
                  href="https://www.facebook.com/groups/733950559669339/?ref=share&mibextid=NSMWBT"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition"
                >
                  <ExternalLink className="w-4 h-4" />
                  Facebook Group-এ রিকোয়েস্ট করুন
                </a>

                <a
                  href="https://t.me/moviesversebdreq"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3 bg-sky-500 hover:bg-sky-600 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition"
                >
                  <ExternalLink className="w-4 h-4" />
                  Telegram Group-এ রিকোয়েস্ট করুন
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
