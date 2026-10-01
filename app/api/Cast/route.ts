import { NextRequest, NextResponse } from "next/server"

export const runtime = "nodejs"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const title = searchParams.get("title")
  const year = searchParams.get("year")
  const mediaType = searchParams.get("mediaType") || "movie"

  if (!title) {
    return NextResponse.json(
      { error: "Title is required" },
      { status: 400 }
    )
  }

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

  // Clean the title — remove year in parentheses, brackets, etc.
  const cleanTitle = title
    .replace(/\(\d{4}\)/g, "")
    .replace(/\[\d{4}\]/g, "")
    .replace(/\{[^}]*\}/g, "")
    .replace(/[𝟎-𝟗]/g, "")
    .replace(/\s+/g, " ")
    .trim()

  try {
    // Determine TMDB endpoint based on media type
    const searchEndpoint =
      mediaType === "anime" ? "search/tv" : "search/movie"

    // Build search URL
    let searchUrl = `https://api.themoviedb.org/3/${searchEndpoint}?query=${encodeURIComponent(
      cleanTitle
    )}&language=en-US&page=1`

    // Add year filter if available and it's a movie
    if (year && mediaType !== "anime") {
      const yearNum = String(year).match(/\d{4}/)?.[0]
      if (yearNum) {
        searchUrl += `&year=${yearNum}`
      }
    }

    const searchRes = await fetch(searchUrl, {
      headers,
      next: { revalidate: 86400 }, // cache for 24 hours
    })

    if (!searchRes.ok) {
      return NextResponse.json(
        { error: "TMDB search failed", cast: [] },
        { status: 200 }
      )
    }

    const searchData = await searchRes.json()
    const results = searchData.results || []

    if (results.length === 0) {
      return NextResponse.json({ cast: [] })
    }

    // Pick the best match — first result
    const bestMatch = results[0]
    const tmdbId = bestMatch.id

    // Fetch credits
    const creditsEndpoint =
      mediaType === "anime"
        ? `tv/${tmdbId}/credits`
        : `movie/${tmdbId}/credits`

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
    const castList = (creditsData.cast || []).slice(0, 15).map(
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
      tmdbTitle: bestMatch.title || bestMatch.name,
      tmdbId,
    })
  } catch (error) {
    console.error("Cast fetch error:", error)
    return NextResponse.json(
      { error: "Internal server error", cast: [] },
      { status: 200 }
    )
  }
}
