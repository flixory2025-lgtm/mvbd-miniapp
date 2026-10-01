import { NextRequest, NextResponse } from "next/server"
import { fetchImdbCast } from "@/lib/imdb-cast"
import { fetchMdlCastByTitle } from "@/lib/mdl-cast"

export const runtime = "nodejs"

/* =========================================================
   TYPES
========================================================= */

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
    .replace(/[\u{1D7CE}-\u{1D7FF}]/gu, "") // Mathematical bold digits
    .replace(/[^\p{L}\p{N}\s:.\-&'!?]/gu, " ")
    .replace(/\s+/g, " ")
    .trim()
}

function extractYear(year: string | null): string | null {
  if (!year) return null
  const match = String(year).match(/\d{4}/)
  return match ? match[0] : null
}

/* =========================================================
   TMDB FETCH
========================================================= */

async function fetchTmdbCast(
  token: string,
  title: string | null,
  year: string | null,
  mediaType: string,
  tmdbId: string | null
): Promise<CastMember[] | null> {
  const headers = {
    Authorization: `Bearer ${token}`,
    accept: "application/json",
  }

  try {
    let matchedId: number | null = null
    let matchedType: "movie" | "tv" = mediaType === "anime" ? "tv" : "movie"

    // --- Mode 1: tmdbId সরাসরি দেওয়া ---
    if (tmdbId) {
      const parsed = parseInt(tmdbId)
      if (!isNaN(parsed)) {
        matchedId = parsed
      }
    }

    // --- Mode 2: Title দিয়ে search ---
    if (!matchedId && title) {
      const clean = cleanTitle(title)
      const yearNum = extractYear(year)
      const searchEndpoint =
        mediaType === "anime" ? "search/tv" : "search/movie"

      let searchUrl = `https://api.themoviedb.org/3/${searchEndpoint}?query=${encodeURIComponent(
        clean
      )}&language=en-US&page=1`

      if (yearNum && mediaType !== "anime") {
        searchUrl += `&year=${yearNum}`
      }

      const searchRes = await fetch(searchUrl, {
        headers,
        next: { revalidate: 86400 },
      })

      if (searchRes.ok) {
        const searchData = await searchRes.json()
        const results = searchData.results || []

        if (results.length > 0) {
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

          matchedId = best.id
        }
      }
    }

    if (!matchedId) return null

    // --- Credits fetch ---
    const creditsEndpoint =
      matchedType === "tv"
        ? `tv/${matchedId}/credits`
        : `movie/${matchedId}/credits`

    const creditsRes = await fetch(
      `https://api.themoviedb.org/3/${creditsEndpoint}?language=en-US`,
      {
        headers,
        next: { revalidate: 86400 },
      }
    )

    if (!creditsRes.ok) return null

    const creditsData = await creditsRes.json()
    const castList = (creditsData.cast || []).slice(0, 20)

    if (castList.length === 0) return null

    return castList.map((actor: any) => ({
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
  const mediaType = searchParams.get("mediaType") || "movie"
  const tmdbId = searchParams.get("tmdbId")
  const imdbId = searchParams.get("imdbId")
  const mdlId = searchParams.get("mdlId")

  const token = process.env.TMDB_TOKEN

  /* =====================================================
     ধাপ ১: TMDB (প্রধান সোর্স)
  ===================================================== */

  if (token) {
    const tmdbCast = await fetchTmdbCast(
      token,
      title,
      year,
      mediaType,
      tmdbId
    )
    if (tmdbCast && tmdbCast.length > 0) {
      return NextResponse.json({
        cast: tmdbCast,
        source: "tmdb",
      })
    }
  }

  /* =====================================================
     ধাপ ২: IMDb (বাংলা মুভি / আন্তর্জাতিক মুভি)
  ===================================================== */

  if (imdbId) {
    const imdbCast = await fetchImdbCast(imdbId)
    if (imdbCast && imdbCast.length > 0) {
      return NextResponse.json({
        cast: imdbCast,
        source: "imdb",
      })
    }
  }

  /* =====================================================
     ধাপ ৩: MyDramaList (K-Drama / এশিয়ান ড্রামা)
  ===================================================== */

  // K-Drama হলে সরাসরি MDL try করি
  const isKDrama =
    mediaType === "anime" ||
    (typeof title === "string" && /\b(kdrama|k-drama|korean)\b/i.test(title))

  if (mdlId) {
    const mdlCast = await fetchMdlCastByTitle(title || "")
    if (mdlCast && mdlCast.length > 0) {
      return NextResponse.json({
        cast: mdlCast,
        source: "mdl",
      })
    }
  } else if (isKDrama && title) {
    // K-Drama চিহ্নিত হলে টাইটেল দিয়েও চেষ্টা করি
    const mdlCast = await fetchMdlCastByTitle(title)
    if (mdlCast && mdlCast.length > 0) {
      return NextResponse.json({
        cast: mdlCast,
        source: "mdl",
      })
    }
  }

  /* =====================================================
     কিছু না পেলে খালি অ্যারে
  ===================================================== */

  return NextResponse.json({ cast: [], source: "none" })
}
