"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

type CastMember = {
  id: number
  name: string
  character: string
  profilePath: string | null
  order: number
}

interface MovieCastProps {
  title: string
  year?: string | number
  mediaType?: "movie" | "anime"
}

export default function MovieCast({
  title,
  year,
  mediaType = "movie",
}: MovieCastProps) {
  const router = useRouter()
  const [cast, setCast] = useState<CastMember[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function fetchCast() {
      setLoading(true)
      setError(false)

      try {
        const params = new URLSearchParams({
          title: title,
          mediaType: mediaType,
        })

        if (year) {
          params.set("year", String(year))
        }

        const res = await fetch(`/api/cast?${params.toString()}`)

        if (!res.ok) {
          throw new Error("Failed to fetch cast")
        }

        const data = await res.json()

        if (!cancelled) {
          setCast(data.cast || [])
        }
      } catch (err) {
        console.error("Cast fetch error:", err)
        if (!cancelled) {
          setError(true)
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    if (title) {
      fetchCast()
    }

    return () => {
      cancelled = true
    }
  }, [title, year, mediaType])

  if (error || (!loading && cast.length === 0)) {
    return null
  }

  return (
    <div className="mt-10">
      <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
        <span className="w-1 h-7 bg-gradient-to-b from-green-400 to-blue-500 rounded-full"></span>
        কাস্ট লিস্ট
      </h3>

      {loading ? (
        <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="flex-shrink-0 w-32 animate-pulse"
            >
              <div className="w-32 h-32 rounded-full bg-white/10 mb-3"></div>
              <div className="h-3 bg-white/10 rounded mb-2"></div>
              <div className="h-2 bg-white/10 rounded w-3/4"></div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex gap-5 overflow-x-auto pb-4 scrollbar-hide">
          {cast.map((actor) => (
            <button
              key={actor.id}
              onClick={() => router.push(`/person/${actor.id}`)}
              className="flex-shrink-0 w-32 text-center group focus:outline-none"
            >
              <div className="w-32 h-32 rounded-full overflow-hidden bg-white/10 mb-3 ring-2 ring-white/10 group-hover:ring-green-400/60 transition-all duration-300 group-hover:scale-105">
                {actor.profilePath ? (
                  <img
                    src={actor.profilePath}
                    alt={actor.name}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-white/40 text-3xl font-bold">
                    {actor.name.charAt(0)}
                  </div>
                )}
              </div>

              <p className="text-white text-sm font-semibold line-clamp-2 leading-tight">
                {actor.name}
              </p>

              {actor.character && (
                <p className="text-slate-400 text-xs line-clamp-2 mt-1 leading-tight">
                  {actor.character}
                </p>
              )}
            </button>
          ))}
        </div>
      )}

      <style jsx>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  )
}
