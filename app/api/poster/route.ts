import { NextRequest, NextResponse } from "next/server"

export const runtime = "nodejs"

/**
 * GET /api/poster?title=...&year=...&genre=...&mediaType=...&tmdbId=...&tmdbType=movie|tv&size=w500
 *
 * Returns { poster: string | null, source: "tmdb" | "mdl" | "none" }
 *
 * Order: TMDB (by id, then by title search) -> MyDramaList (optional) -> none
 *
 * Env:
 *   TMDB_TOKEN    (already used by your cast route)
 *   MDL_API_BASE  (optional) base URL of an unofficial MyDramaList API,
 *                 e.g. https://your-kuryana.vercel.app  -- leave empty to skip MDL
 */

const IMG_BASE = "https://image.tmdb.org/t/p"
const WEEK = 60 * 60 * 24 * 7

/* ---------------------------------------------------------- */
/*  Helpers (same matching rules as your cast route)           */
/* ---------------------------------------------------------- */

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

function isKDramaGenre(genre: string | null): boolean {
  if (!genre) return false
  const g = genre.toLowerCase()
  return g.includes("kdrama") || g.includes("k-drama") || g.includes("korean")
}

function titleSimilarity(a: string, b: string): number {
  const s1 = a.toLowerCase().trim()
  const s2 = b.toLowerCase().trim()
  if (!s1 || !s2) return 0
  if (s1 === s2) return 1
  if (s1.includes(s2) || s2.includes(s1)) return 0.8
  const words1 = s1.split(/\s+/).filter((w) => w.length > 2)
  const words2 = s2.split(/\s+/).filter((w) => w.length > 2)
  if (words1.length === 0 || words2.length === 0) return 0
  let matches = 0
  for (const w1 of words1) {
    if (words2.some((w2) => w1 === w2 || w1.includes(w2) || w2.includes(w1))) matches++
  }
  return matches / Math.max(words1.length, words2.length)
}

/* ---------------------------------------------------------- */
/*  TMDB                                                       */
/* ---------------------------------------------------------- */

async function tmdbPosterById(
  headers: Record<string, string>,
  id: number,
  types: Array<"movie" | "tv">
): Promise<string | null> {
  for (const type of types) {
    try {
      const res = await fetch(`https://api.themoviedb.org/3/${type}/${id}?language=en-US`, {
        headers,
        next: { revalidate: WEEK },
      })
      if (!res.ok) continue
      const data = await res.json()
      if (data.poster_path) return data.poster_path as string
    } catch {
      /* try next type */
    }
  }
  return null
}

async function tmdbPosterBySearch(
  headers: Record<string, string>,
  title: string,
  year: string | null,
  type: "movie" | "tv",
  genreHint: string | null
): Promise<string | null> {
  const clean = cleanTitle(title)
  if (!clean) return null

  let url = `https://api.themoviedb.org/3/search/${type}?query=${encodeURIComponent(
    clean
  )}&language=en-US&page=1`
  if (year && type === "movie") url += `&year=${year}`

  try {
    const res = await fetch(url, { headers, next: { revalidate: WEEK } })
    if (!res.ok) return null
    const data = await res.json()
    const results = (data.results || []).filter((r: any) => r.poster_path)
    if (results.length === 0) return null

    const scored = results.map((r: any) => {
      const rTitle = r.title || r.name || ""
      const rOriginal = r.original_title || r.original_name || ""
      const rYear = parseInt((r.release_date || r.first_air_date || "").slice(0, 4)) || 0

      const sim = Math.max(titleSimilarity(clean, rTitle), titleSimilarity(clean, rOriginal))

      let yearScore = 0
      if (year && rYear) {
        const diff = Math.abs(rYear - parseInt(year))
        yearScore = diff === 0 ? 0.3 : diff === 1 ? 0.2 : diff === 2 ? 0.1 : 0
      } else if (!year) {
        yearScore = 0.15
      }

      let langScore = 0.05
      if (genreHint && /kdrama|korean/i.test(genreHint)) {
        langScore = r.original_language === "ko" ? 0.1 : 0
      }

      const popScore = Math.min((r.popularity || 0) / 100, 0.1)
      return { r, sim, total: sim * 0.5 + yearScore + langScore + popScore }
    })

    scored.sort((a: any, b: any) => b.total - a.total)
    const best = scored[0]
    // a wrong poster is worse than no poster, so be a little stricter than the cast route
    if (best.sim < 0.5 || best.total < 0.4) return null
    return best.r.poster_path as string
  } catch {
    return null
  }
}

/* ---------------------------------------------------------- */
/*  MyDramaList (optional, unofficial API)                     */
/* ---------------------------------------------------------- */

async function urlExists(url: string): Promise<boolean> {
  try {
    const res = await fetch(url, { method: "HEAD", signal: AbortSignal.timeout(4000) })
    return res.ok
  } catch {
    return false
  }
}

async function mdlPoster(title: string): Promise<string | null> {
  const base = process.env.MDL_API_BASE
  if (!base) return null
  const clean = cleanTitle(title)
  if (!clean) return null

  try {
    const res = await fetch(`${base.replace(/\/$/, "")}/search/q/${encodeURIComponent(clean)}`, {
      next: { revalidate: WEEK },
      signal: AbortSignal.timeout(7000),
    })
    if (!res.ok) return null
    const data = await res.json()
    const list: any[] = Array.isArray(data?.results)
      ? data.results
      : Array.isArray(data?.results?.dramas)
        ? data.results.dramas
        : []
    if (list.length === 0) return null

    const best = list
      .map((item) => ({ item, sim: titleSimilarity(clean, item.title || "") }))
      .sort((a, b) => b.sim - a.sim)[0]
    if (!best || best.sim < 0.6) return null

    const img: string | undefined = best.item.image || best.item.thumb || best.item.cover
    if (!img) return null

    // MDL stores several sizes (_4s / _4t = small, _4c = poster). Prefer the poster size.
    const bigger = img.replace(/_(\d+)[a-z]\.(jpg|jpeg|png|webp)$/i, "_$1c.$2")
    if (bigger !== img && (await urlExists(bigger))) return bigger
    return img
  } catch {
    return null
  }
}

/* ---------------------------------------------------------- */
/*  Handler                                                    */
/* ---------------------------------------------------------- */

function reply(poster: string | null, source: "tmdb" | "mdl" | "none") {
  return NextResponse.json(
    { poster, source },
    {
      headers: {
        // found posters are cached for a week at the CDN, misses for an hour
        "Cache-Control": poster
          ? "public, s-maxage=604800, stale-while-revalidate=2592000"
          : "public, s-maxage=3600, stale-while-revalidate=86400",
      },
    }
  )
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const title = searchParams.get("title")
  const year = extractYear(searchParams.get("year"))
  const genre = searchParams.get("genre")
  const mediaType = searchParams.get("mediaType") || "movie"
  const tmdbIdParam = searchParams.get("tmdbId")
  const tmdbTypeParam = searchParams.get("tmdbType")
  const sizeParam = searchParams.get("size") || "w500"
  const size = ["w185", "w342", "w500", "w780", "original"].includes(sizeParam) ? sizeParam : "w500"

  const explicitType = tmdbTypeParam === "tv" || tmdbTypeParam === "movie" ? tmdbTypeParam : null
  const preferredType: "movie" | "tv" =
    explicitType ??
    (mediaType === "anime" || mediaType === "kdrama" || mediaType === "tv" || isKDramaGenre(genre)
      ? "tv"
      : "movie")
  const otherType = preferredType === "tv" ? "movie" : "tv"

  const token = process.env.TMDB_TOKEN

  if (token) {
    const headers = { Authorization: `Bearer ${token}`, accept: "application/json" }

    // 1) exact id (best, no guessing)
    const id = tmdbIdParam ? parseInt(tmdbIdParam) : NaN
    if (!isNaN(id)) {
      const path = await tmdbPosterById(headers, id, explicitType ? [explicitType] : [preferredType, otherType])
      if (path) return reply(`${IMG_BASE}/${size}${path}`, "tmdb")
    }

    // 2) title search
    if (title) {
      let path = await tmdbPosterBySearch(headers, title, year, preferredType, genre)
      if (!path) path = await tmdbPosterBySearch(headers, title, year, otherType, genre)
      if (path) return reply(`${IMG_BASE}/${size}${path}`, "tmdb")
    }
  }

  // 3) MyDramaList (only for K-drama-like titles, only if MDL_API_BASE is set)
  const kdramaLike = mediaType === "kdrama" || isKDramaGenre(genre)
  if (kdramaLike && title) {
    const mdl = await mdlPoster(title)
    if (mdl) return reply(mdl, "mdl")
  }

  return reply(null, "none")
}
