import { NextRequest, NextResponse } from "next/server"

export const runtime = "nodejs"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const title = searchParams.get("title")
  const year = searchParams.get("year")
  const mediaType = searchParams.get("mediaType") || "movie"
  const tmdbId = searchParams.get("tmdbId")

  const token = process.env.TMDB_TOKEN

  if (!token) {
    return NextResponse.json(
      { error: "TMDB token not configured" },
      { status: 500 }
    )
  }

  const headers = {
    Authorization: `Bearer ${token}`,
    accept: "application/json",
  }

  try {
    let matchedId: number | null = null
    let matchedMediaType: "movie" | "tv" = mediaType === "anime" ? "tv" : "movie"

    /* =====================================================
       MODE 1: tmdbId দেওয়া আছে → সরাসরি fetch
    ===================================================== */

    if (tmdbId) {
      const parsedId = parseInt(tmdbId)
      if (!isNaN(parsedId)) {
        matchedId = parsedId
        // tmdbId দেওয়ার সময় user নিজেই জানেন এটা movie না tv,
        // তাই mediaType ব্যবহার করি
      }
    }

    /* =====================================================
       MODE 2: tmdbId নেই → title দিয়ে search
    ===================================================== */

    if (!matchedId) {
      if (!title) {
        return NextResponse.json(
          { error: "Title or tmdbId is required" },
          { status: 400 }
        )
      }

      // Clean the title
      const cleanTitle = title
        .replace(/\(\d{4}\)/g, "")
        .replace(/\[\d{4}\]/g, "")
        .replace(/\{[^}]*\}/g, "")
        .replace(/[\u{1D7CE}-\u{1D7FF}]/gu, "") // Mathematical bold digits
        .replace(/[^\p{L}\p{N}\s:.\-&'!?]/gu, " ")
        .replace(/\s+/g, " ")
        .trim()

      const searchEndpoint =
        mediaType === "anime" ? "search/tv" : "search/movie"

      let searchUrl = `https://api.themoviedb.org/3/${searchEndpoint}?query=${encodeURIComponent(
        cleanTitle
      )}&language=en-US&page=1`

      // Year filter (শুধু movie-র জন্য)
      if (year && mediaType !== "anime") {
        const yearNum = String(year).match(/\d{4}/)?.[0]
        if (yearNum) {
          searchUrl += `&year=${yearNum}`
        }
      }

      const searchRes = await fetch(searchUrl, {
        headers,
        next: { revalidate: 86400 },
      })

      if (!searchRes.ok) {
        return NextResponse.json({ cast: [] })
      }

      const searchData = await searchRes.json()
      const results = searchData.results || []

      if (results.length === 0) {
        return NextResponse.json({ cast: [] })
      }

      // Year tolerance চেক করে best match নিই
      const yearNum = year ? parseInt(String(year).match(/\d{4}/)?.[0] || "0") : 0

      let bestMatch = results[0]

      if (yearNum) {
        // Exact year match খুঁজি
        const exactMatch = results.find((r: any) => {
          const releaseDate = r.release_date || r.first_air_date || ""
          const rYear = parseInt(releaseDate.slice(0, 4)) || 0
          return rYear === yearNum
        })

        if (exactMatch) {
          bestMatch = exactMatch
        } else {
          // ±1 বছর tolerance
          const closeMatch = results.find((r: any) => {
            const releaseDate = r.release_date || r.first_air_date || ""
            const rYear = parseInt(releaseDate.slice(0, 4)) || 0
            return rYear && Math.abs(rYear - yearNum) <= 1
          })

          if (closeMatch) bestMatch = closeMatch
        }
      }

      matchedId = bestMatch.id
      matchedMediaType = mediaType === "anime" ? "tv" : "movie"
    }

    /* =====================================================
       Credits fetch
    ===================================================== */

    if (!matchedId) {
      return NextResponse.json({ cast: [] })
    }

    const creditsEndpoint =
      matchedMediaType === "tv"
        ? `tv/${matchedId}/credits`
        : `movie/${matchedId}/credits`

    const creditsRes = await fetch(
      `https://api.themoviedb.org/3/${creditsEndpoint}?language=en-US`,
      {
        headers,
        next: { revalidate: 86400 },
      }
    )

    if (!creditsRes.ok) {
      return NextResponse.json({ cast: [] })
    }

    const creditsData = await creditsRes.json()
    const castList = (creditsData.cast || []).slice(0, 20).map(
      (actor: any) => ({
        id: actor.id,
        name: actor.name,
        character: actor.character || "",
        profilePath: actor.profile_path
          ? `https://image.tmdb.org/t/p/w185${actor.profile_path}`
          : null,
        order: actor.order,
      })
    )

    return NextResponse.json({
      cast: castList,
      tmdbId: matchedId,
      source: tmdbId ? "direct" : "search",
    })
  } catch (error) {
    console.error("Cast fetch error:", error)
    return NextResponse.json(
      { error: "Internal server error", cast: [] },
      { status: 200 }
    )
  }
}
