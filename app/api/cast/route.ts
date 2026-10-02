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
   TITLE CLEANING
========================================================= */

function cleanTitle(title: string): string {
  return title
    .replace(/\(\d{4}\)/g, "")
    .replace(/\[\d{4}\]/g, "")
    .replace(/\{[^}]*\}/g, "")
    .replace(/[\u{1D7CE}-\u{1D7FF}]/gu, "")
    .replace(/season\s*\d+/gi, "")
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
 * genre string থেকে K-Drama চেনে।
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

/**
 * Title থেকে K-Drama hint আছে কি না।
 */
function hasKDramaHintInTitle(title: string): boolean {
  return /kdrama|k-drama|korean|\(스터디|스터디|한국/i.test(title)
}

/**
 * Fuzzy title matching — দুই স্ট্রিং কতটা মিলে সেটা 0-1 স্কেলে।
 */
function titleSimilarity(a: string, b: string): number {
  const s1 = a.toLowerCase().trim()
  const s2 = b.toLowerCase().trim()

  if (s1 === s2) return 1
  if (s1.includes(s2) || s2.includes(s1)) return 0.8

  // Word overlap
  const words1 = s1.split(/\s+/).filter((w) => w.length > 2)
  const words2 = s2.split(/\s+/).filter((w) => w.length > 2)
  if (words1.length === 0 || words2.length === 0) return 0

  let matches = 0
  for (const w1 of words1) {
    if (words2.some((w2) => w1 === w2 || w1.includes(w2) || w2.includes(w1))) {
      matches++
    }
  }
  return matches / Math.max(words1.length, words2.length)
}

/* =========================================================
   TMDB CAST FETCH
========================================================= */

async function fetchTmdbCast(
  token: string,
  title: string | null,
  year: string | null,
  preferredType: "movie" | "tv",
  tmdbId: string | null,
  genreHint: string | null
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

      // একটা endpoint-এ search করে best result বের করার ফাংশন
      const searchAndPick = async (
        endpoint: "search/movie" | "search/tv"
      ): Promise<{ id: number; type: "movie" | "tv" } | null> => {
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

          // প্রতিটা result-এর score হিসাব করি
          const scored = results.map((r: any) => {
            const rTitle = r.title || r.name || ""
            const rOriginal = r.original_title || r.original_name || ""
            const rDate = r.release_date || r.first_air_date || ""
            const rYear = parseInt(rDate.slice(0, 4)) || 0
            const rLang = r.original_language || ""
            const rPopularity = r.popularity || 0

            // Title similarity (max 0.5)
            const titleScore =
              Math.max(
                titleSimilarity(clean, rTitle),
                titleSimilarity(clean, rOriginal)
              ) * 0.5

            // Year match (max 0.3)
            let yearScore = 0
            if (yearNum && rYear) {
              const diff = Math.abs(rYear - parseInt(yearNum))
              if (diff === 0) yearScore = 0.3
              else if (diff === 1) yearScore = 0.2
              else if (diff === 2) yearScore = 0.1
            } else if (!yearNum) {
              yearScore = 0.15
            }

            // Language match (max 0.1)
            let langScore = 0
            if (genreHint && /kdrama|korean/i.test(genreHint)) {
              if (rLang === "ko") langScore = 0.1
            } else {
              langScore = 0.05
            }

            // Popularity bonus (max 0.1)
            const popScore = Math.min(rPopularity / 100, 0.1)

            const total = titleScore + yearScore + langScore + popScore

            return {
              id: r.id,
              type: endpoint === "search/tv" ? "tv" : "movie",
              score: total,
              title: rTitle,
              year: rYear,
              lang: rLang,
            }
          })

          // সবচেয়ে ভালো score নিই
          scored.sort((a: any, b: any) => b.score - a.score)
          const best = scored[0]

          // খুব কম score হলে বাদ দিই
          if (best.score < 0.3) return null

          return { id: best.id, type: best.type }
        } catch {
          return null
        }
      }

      // প্রথমে preferred endpoint try করি
      const primaryEndpoint =
        preferredType === "tv" ? "search/tv" : "search/movie"
      let best = await searchAndPick(primaryEndpoint as any)

      // preferred fail হলে অন্যটা try করি
      if (!best) {
        const fallbackEndpoint =
          preferredType === "tv" ? "search/movie" : "search/tv"
        best = await searchAndPick(fallbackEndpoint as any)
      }

      if (best) {
        matchedId = best.id
        matchedType = best.type
      }
    }

    if (!matchedId) return null

    /* --------------------------------------------------
       Credits fetch — movie এবং tv দুটোই try করি
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
   MAIN HANDLER
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
     mediaType ঠিক করি
     - kdrama → tv
     - anime → tv
     - genre-তে kdrama থাকলে → tv
  ===================================================== */

  let effectiveMediaType: "movie" | "tv" = "movie"

  if (
    mediaTypeParam === "anime" ||
    mediaTypeParam === "kdrama" ||
    mediaTypeParam === "tv"
  ) {
    effectiveMediaType = "tv"
  } else if (isKDramaGenre(genre)) {
    effectiveMediaType = "tv"
  } else if (title && hasKDramaHintInTitle(title)) {
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
      tmdbId,
      genre
    )
    if (tmdbCast && tmdbCast.length > 0) {
      return NextResponse.json({ cast: tmdbCast, source: "tmdb" })
    }
  }

  /* =====================================================
     ধাপ ২: IMDb
  ===================================================== */

  if (imdbId) {
    const imdbCast = await fetchImdbCast(imdbId)
    if (imdbCast && imdbCast.length > 0) {
      return NextResponse.json({ cast: imdbCast, source: "imdb" })
    }
  }

  /* =====================================================
     ধাপ ৩: MyDramaList (K-Drama fallback)
  ===================================================== */

  const isKDramaLike =
    mediaTypeParam === "kdrama" ||
    mediaTypeParam === "anime" ||
    isKDramaGenre(genre) ||
    (title && hasKDramaHintInTitle(title))

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
