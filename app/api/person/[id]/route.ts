import { NextRequest, NextResponse } from "next/server"

export const runtime = "nodejs"

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const personId = params.id

  if (!personId) {
    return NextResponse.json(
      { error: "Person ID is required" },
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

  try {
    // Fetch person details
    const detailsRes = await fetch(
      `https://api.themoviedb.org/3/person/${personId}?language=en-US`,
      {
        headers,
        next: { revalidate: 86400 },
      }
    )

    if (!detailsRes.ok) {
      return NextResponse.json(
        { error: "Failed to fetch person details" },
        { status: 200 }
      )
    }

    const details = await detailsRes.json()

    // Fetch combined credits (movies + TV)
    const creditsRes = await fetch(
      `https://api.themoviedb.org/3/person/${personId}/combined_credits?language=en-US`,
      {
        headers,
        next: { revalidate: 86400 },
      }
    )

    if (!creditsRes.ok) {
      return NextResponse.json(
        {
          person: {
            id: details.id,
            name: details.name,
            profilePath: details.profile_path
              ? `https://image.tmdb.org/t/p/w300${details.profile_path}`
              : null,
            biography: details.biography || "",
            knownFor: details.known_for_department || "",
          },
          credits: [],
        },
        { status: 200 }
      )
    }

    const creditsData = await creditsRes.json()

    // Combine cast + crew, dedupe, sort by popularity
    const allCredits = [
      ...(creditsData.cast || []),
      ...(creditsData.crew || []),
    ]

    const seen = new Set<number>()
    const uniqueCredits = allCredits.filter((item: any) => {
      if (!item.id || seen.has(item.id)) return false
      seen.add(item.id)
      return true
    })

    // Sort by popularity (highest first), then by release date
    uniqueCredits.sort((a: any, b: any) => {
      const aPop = a.popularity || 0
      const bPop = b.popularity || 0
      return bPop - aPop
    })

    // Take top 30, map to clean objects
    const credits = uniqueCredits.slice(0, 30).map((item: any) => {
      const isTV = item.media_type === "tv"
      const title = item.title || item.name || "Untitled"
      const releaseDate = item.release_date || item.first_air_date || ""
      const year = releaseDate ? releaseDate.slice(0, 4) : ""
      const posterPath = item.poster_path
        ? `https://image.tmdb.org/t/p/w300${item.poster_path}`
        : null

      return {
        id: item.id,
        title,
        year,
        mediaType: isTV ? "tv" : "movie",
        posterPath,
        rating: item.vote_average || 0,
        character: item.character || "",
        popularity: item.popularity || 0,
      }
    })

    return NextResponse.json({
      person: {
        id: details.id,
        name: details.name,
        profilePath: details.profile_path
          ? `https://image.tmdb.org/t/p/w300${details.profile_path}`
          : null,
        biography: details.biography || "",
        knownFor: details.known_for_department || "",
        birthday: details.birthday || null,
        placeOfBirth: details.place_of_birth || null,
      },
      credits,
    })
  } catch (error) {
    console.error("Person fetch error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 200 }
    )
  }
}
