"use client"

import { useEffect, useState } from "react"
import { X, Star, Calendar, ExternalLink } from "lucide-react"

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

interface PersonModalProps {
  personId: number | null
  onClose: () => void
  /** Called when user clicks a movie that exists on our site */
  onMovieFound: (title: string, year: string) => void
  /** Optional: our site's movie database to check availability */
  siteMovies?: Array<{ id: number; title: string; year: number | string }>
}

export default function PersonModal({
  personId,
  onClose,
  onMovieFound,
  siteMovies = [],
}: PersonModalProps) {
  const [person, setPerson] = useState<Person | null>(null)
  const [credits, setCredits] = useState<Credit[]>([])
  const [loading, setLoading] = useState(true)
  const [showRequestPopup, setShowRequestPopup] = useState(false)
  const [requestedTitle, setRequestedTitle] = useState("")

  // Fetch person data when modal opens
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

  // Lock body scroll while modal is open
  useEffect(() => {
    if (personId) {
      document.body.style.overflow = "hidden"
    }
    return () => {
      document.body.style.overflow = ""
    }
  }, [personId])

  if (!personId) return null

  /** Try to find this credit in our local movie database */
  function findInSite(credit: Credit): { id: number; title: string; year: number | string } | null {
    const cleanTmdbTitle = credit.title
      .toLowerCase()
      .replace(/\(\d{4}\)/g, "")
      .replace(/\[\d{4}\]/g, "")
      .replace(/\s+/g, " ")
      .trim()

    for (const m of siteMovies) {
      const cleanSiteTitle = m.title
        .toLowerCase()
        .replace(/\(\d{4}\)/g, "")
        .replace(/\[\d{4}\]/g, "")
        .replace(/\s+/g, " ")
        .trim()

      // Match by title
      const titleMatch =
        cleanSiteTitle === cleanTmdbTitle ||
        cleanSiteTitle.includes(cleanTmdbTitle) ||
        cleanTmdbTitle.includes(cleanSiteTitle)

      if (!titleMatch) continue

      // If both have year, check they're within 1 year
      const tmdbYear = parseInt(credit.year) || 0
      const siteYear = parseInt(String(m.year)) || 0

      if (tmdbYear && siteYear) {
        if (Math.abs(tmdbYear - siteYear) <= 1) {
          return m
        }
      } else {
        // No year on one side, accept title match
        return m
      }
    }

    return null
  }

  function handleCreditClick(credit: Credit) {
    const found = findInSite(credit)
    if (found) {
      onMovieFound(found.title, String(found.year))
      onClose()
    } else {
      setRequestedTitle(credit.title)
      setShowRequestPopup(true)
    }
  }

  return (
    <>
      {/* Main Modal */}
      <div
        className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-start md:items-center justify-center p-0 md:p-4 overflow-y-auto"
        onClick={onClose}
      >
        <div
          className="relative w-full max-w-5xl bg-gradient-to-b from-slate-900 to-black md:rounded-2xl border border-white/10 shadow-2xl my-0 md:my-8 overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-20 w-10 h-10 rounded-full bg-black/60 hover:bg-black/90 text-white flex items-center justify-center transition border border-white/20"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>

          {loading ? (
            <div className="p-12 flex flex-col items-center justify-center min-h-[400px]">
              <div className="w-12 h-12 border-4 border-white/20 border-t-green-400 rounded-full animate-spin mb-4" />
              <p className="text-white/60">লোড হচ্ছে...</p>
            </div>
          ) : person ? (
            <div>
              {/* Person Header */}
              <div className="relative p-6 md:p-8 bg-gradient-to-br from-green-500/10 via-blue-500/5 to-transparent border-b border-white/10">
                <div className="flex flex-col md:flex-row gap-6 items-start">
                  {/* Profile Image */}
                  <div className="w-32 h-32 md:w-40 md:h-40 rounded-full overflow-hidden bg-white/10 flex-shrink-0 ring-4 ring-white/10 shadow-2xl">
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

                  {/* Person Info */}
                  <div className="flex-1 min-w-0">
                    <h2 className="text-3xl md:text-4xl font-bold text-white mb-2">
                      {person.name}
                    </h2>

                    {person.knownFor && (
                      <p className="text-green-400 text-sm font-semibold uppercase tracking-wider mb-3">
                        {person.knownFor}
                      </p>
                    )}

                    <div className="flex flex-wrap gap-4 text-sm text-slate-300 mb-4">
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
                      <p className="text-slate-300 text-sm leading-relaxed line-clamp-4 md:line-clamp-5">
                        {person.biography}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Credits Grid */}
              <div className="p-6 md:p-8">
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
                      const inSite = findInSite(credit) !== null
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

                            {/* Available on site badge */}
                            {inSite && (
                              <div className="absolute top-1.5 left-1.5 bg-green-500 text-black text-[9px] font-bold px-2 py-0.5 rounded-full shadow-lg z-10">
                                ✓ সাইটে আছে
                              </div>
                            )}

                            {/* Media type badge */}
                            <div className="absolute top-1.5 right-1.5 bg-black/70 backdrop-blur-sm text-white text-[9px] font-bold px-2 py-0.5 rounded uppercase z-10">
                              {credit.mediaType === "tv" ? "TV" : "Movie"}
                            </div>

                            {/* Rating badge */}
                            {credit.rating > 0 && (
                              <div className="absolute bottom-1.5 right-1.5 bg-yellow-500/90 text-black text-[9px] font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5 z-10">
                                <Star className="w-2.5 h-2.5 fill-black" />
                                {credit.rating.toFixed(1)}
                              </div>
                            )}

                            {/* Year badge */}
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
        </div>
      </div>

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
    </>
  )
}
