import { NextRequest, NextResponse } from "next/server"
import { fetchImdbCast } from "@/lib/imdb-cast"
import { fetchMdlCastByTitle } from "@/lib/mdl-cast"

export const runtime = "nodejs"

type CastMember = {
  id: number | string
  name: string
  character: string
  profilePath: string | null
  order?: number
}

/* =========================================================
   HELPERS
========================================================= */

function cleanTitle(title: string): string {
  return title
    .replace(/\(\d{4}\)/g, "")
    .replace(/\[\d{4}\]/g, "")
    .replace(/\{[^}]*\}/g, "")
    .replace(/[\u{1D7CE}-\u{1D7FF}]/gu, "")
    .replace(/[^\p{L}\p{N}\s:.\-&'!?]/gu, " ")
    .replace(/\s+/g, " ")
    .trim()
}

function extractYear(year: string | null): string | null {
  if (!year) return null
  const match = String(year).match(/\d{4}/)
  return match ? match[0] : null
}

/**
 * genre string থেকে K-Drama ডিটেক্ট করে।
 * "Action | kdrama | Thriller" → true
 */
function isKDramaGenre(genre: string | null): boolean {
  if (!genre) return false
  const g = genre.toLowerCase()
  return (
    g.includes("kdrama") ||
    g.includes("k-drama") ||
    g.includes("korean drama") ||
    g.includes("korean")
  )
}

/* =========================================================
   TMDB CAST
========================================================= */

async function fetchTmdbCast(
  token: string,
  title: string | null,
  year: string | null,
  preferredType: "movie" | "tv",
  tmdbId: string | null
): Promise<CastMember[] | null> {
  const headers = {
    Authorization: `Bearer ${token}`,
    accept: "application/json",
  }

  try {
    let matchedId: number | null = null
    let matchedType: "movie" | "tv" = preferredType

    /* --------------------------------------------------
       Mode 1: tmdbId সরাসরি দেওয়া
    -------------------------------------------------- */
    if (tmdbId) {
      const parsed = parseInt(tmdbId)
      if (!isNaN(parsed)) {
        matchedId = parsed
      }
    }

    /* --------------------------------------------------
       Mode 2: Title দিয়ে search
    -------------------------------------------------- */
    if (!matchedId && title) {
      const clean = cleanTitle(title)
      const yearNum = extractYear(year)

      // একটা endpoint-এ search করার হেল্পার
      const searchOn = async (
        endpoint: "search/movie" | "search/tv"
      ) => {
        let url = `https://api.themoviedb.org/3/${endpoint}?query=${encodeURIComponent(
          clean
        )}&language=en-US&page=1`

        if (yearNum && endpoint === "search/movie") {
          url += `&year=${yearNum}`
        }

        try {
          const res = await fetch(url, {
            headers,
            next: { revalidate: 86400 },
          })
          if (!res.ok) return null
          const data = await res.json()
          const results = data.results || []
          if (results.length === 0) return null

          let best = results[0]

          if (yearNum) {
            const exact = results.find((r: any) => {
              const date = r.release_date || r.first_air_date || ""
              return date.slice(0, 4) === yearNum
            })
            if (exact) {
              best = exact
            } else {
              const close = results.find((r: any) => {
                const date = r.release_date || r.first_air_date || ""
                const rYear = parseInt(date.slice(0, 4)) || 0
                return rYear && Math.abs(rYear - parseInt(yearNum)) <= 1
              })
              if (close) best = close
            }
          }

          return best
        } catch {
          return null
        }
      }

      // preferredType অনুযায়ী endpoint ঠিক করি
      const primaryEndpoint =
        preferredType === "tv" ? "search/tv" : "search/movie"
      const fallbackEndpoint =
        preferredType === "tv" ? "search/movie" : "search/tv"

      let best = await searchOn(primaryEndpoint as any)

      // Primary fail হলে fallback try করি
      if (!best) {
        best = await searchOn(fallbackEndpoint as any)
        if (best) {
          // matchedType আপডেট করি
          matchedType = fallbackEndpoint === "search/tv" ? "tv" : "movie"
        }
      } else {
        matchedType = primaryEndpoint === "search/tv" ? "tv" : "movie"
      }

      if (best) {
        matchedId = best.id
      }
    }

    if (!matchedId) return null

    /* --------------------------------------------------
       Credits fetch
    -------------------------------------------------- */
    const tryCredits = async (type: "movie" | "tv") => {
      try {
        const res = await fetch(
          `https://api.themoviedb.org/3/${type}/${matchedId}/credits?language=en-US`,
          {
            headers,
            next: { revalidate: 86400 },
          }
        )
        if (!res.ok) return null
        const data = await res.json()
        const cast = data.cast || []
        if (cast.length === 0) return null
        return cast
      } catch {
        return null
      }
    }

    let castList = await tryCredits(matchedType)
    if (!castList || castList.length === 0) {
      const other = matchedType === "tv" ? "movie" : "tv"
      castList = await tryCredits(other as any)
    }

    if (!castList || castList.length === 0) return null

    return castList.slice(0, 20).map((actor: any) => ({
      id: actor.id,
      name: actor.name,
      character: actor.character || "",
      profilePath: actor.profile_path
        ? `https://image.tmdb.org/t/p/w185${actor.profile_path}`
        : null,
      order: actor.order,
    }))
  } catch (error) {
    console.error("TMDB cast fetch error:", error)
    return null
  }
}

/* =========================================================
   MAIN GET HANDLER
========================================================= */

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const title = searchParams.get("title")
  const year = searchParams.get("year")
  const genre = searchParams.get("genre")
  const mediaTypeParam = searchParams.get("mediaType") || "movie"
  const tmdbId = searchParams.get("tmdbId")
  const imdbId = searchParams.get("imdbId")
  const mdlId = searchParams.get("mdlId")

  const token = process.env.TMDB_TOKEN

  /* =====================================================
     genre থেকে mediaType ঠিক করি
     - kdrama → tv
     - anime → tv
     - অন্যথায় → movie
  ===================================================== */

  let effectiveMediaType: "movie" | "tv" = "movie"

  if (mediaTypeParam === "anime" || mediaTypeParam === "kdrama") {
    effectiveMediaType = "tv"
  } else if (mediaTypeParam === "tv") {
    effectiveMediaType = "tv"
  } else if (isKDramaGenre(genre)) {
    effectiveMediaType = "tv"
  }

  /* =====================================================
     ধাপ ১: TMDB
  ===================================================== */

  if (token) {
    const tmdbCast = await fetchTmdbCast(
      token,
      title,
      year,
      effectiveMediaType,
      tmdbId
    )
    if (tmdbCast && tmdbCast.length > 0) {
      return NextResponse.json({ cast: tmdbCast, source: "tmdb" })
    }
  }

  /* =====================================================
     ধাপ ২: IMDb (বাংলা / আন্তর্জাতিক মুভি)
  ===================================================== */

  if (imdbId) {
    const imdbCast = await fetchImdbCast(imdbId)
    if (imdbCast && imdbCast.length > 0) {
      return NextResponse.json({ cast: imdbCast, source: "imdb" })
    }
  }

  /* =====================================================
     ধাপ ৩: MyDramaList (K-Drama / এশিয়ান ড্রামা)
  ===================================================== */

  const isKDramaLike =
    mediaTypeParam === "kdrama" ||
    mediaTypeParam === "anime" ||
    isKDramaGenre(genre)

  if (mdlId) {
    const mdlCast = await fetchMdlCastByTitle(title || "")
    if (mdlCast && mdlCast.length > 0) {
      return NextResponse.json({ cast: mdlCast, source: "mdl" })
    }
  } else if (isKDramaLike && title) {
    const mdlCast = await fetchMdlCastByTitle(title)
    if (mdlCast && mdlCast.length > 0) {
      return NextResponse.json({ cast: mdlCast, source: "mdl" })
    }
  }

  return NextResponse.json({ cast: [], source: "none" })
}
