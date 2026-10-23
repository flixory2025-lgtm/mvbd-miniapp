// app/api/top20/route.ts
import { NextResponse } from "next/server"

export const runtime = "nodejs"

export async function GET() {
  const token = process.env.TMDB_TOKEN

  if (!token) {
    return NextResponse.json(
      { results: [], error: "Missing TMDB_TOKEN" },
      { status: 500 }
    )
  }

  const headers = {
    Authorization: `Bearer ${token}`,
    accept: "application/json",
  }

  const today = new Date().toISOString().split("T")[0]
  const revalidate = 10800 // 3 hours (আপনার নির্দেশ অনুযায়ী ৩ ঘণ্টা পর আপডেট হবে)

  const safeFetch = async (url: string) => {
    try {
      const res = await fetch(url, { headers, next: { revalidate } })
      if (!res.ok) return []
      const data = await res.json()
      return data.results || []
    } catch {
      return []
    }
  }

  // 1. K-Drama: 8 ta
  const kdramas = await safeFetch(
    `https://api.themoviedb.org/3/discover/tv?with_original_language=ko&with_origin_country=KR&first_air_date.gte=${today}&sort_by=popularity.desc&language=en-US&page=1`
  )

  // 2. Hollywood / Bollywood / Fantasy: 4 ta
  const [hollywood, bollywood, fantasy] = await Promise.all([
    safeFetch(`https://api.themoviedb.org/3/discover/movie?with_origin_country=US|GB&with_original_language=en&primary_release_date.gte=${today}&sort_by=popularity.desc&language=en-US&page=1`),
    safeFetch(`https://api.themoviedb.org/3/discover/movie?with_origin_country=IN&primary_release_date.gte=${today}&sort_by=popularity.desc&language=en-US&page=1`),
    safeFetch(`https://api.themoviedb.org/3/discover/movie?with_genres=14&primary_release_date.gte=${today}&sort_by=popularity.desc&language=en-US&page=1`),
  ])

  // 3. Horror / Mystery: 4 ta
  const [horror, mystery] = await Promise.all([
    safeFetch(`https://api.themoviedb.org/3/discover/movie?with_genres=27&primary_release_date.gte=${today}&sort_by=popularity.desc&language=en-US&page=1`),
    safeFetch(`https://api.themoviedb.org/3/discover/movie?with_genres=9648&primary_release_date.gte=${today}&sort_by=popularity.desc&language=en-US&page=1`),
  ])

  // 4. Bangla / Indonesian: 4 ta
  const [bangla, indonesian] = await Promise.all([
    safeFetch(`https://api.themoviedb.org/3/discover/movie?with_original_language=bn&primary_release_date.gte=${today}&sort_by=popularity.desc&language=en-US&page=1`),
    safeFetch(`https://api.themoviedb.org/3/discover/movie?with_original_language=id&primary_release_date.gte=${today}&sort_by=popularity.desc&language=en-US&page=1`),
  ])

  const now = new Date()
  now.setHours(0, 0, 0, 0)

  const formatItem = (
    item: any,
    mediaType: "movie" | "tv",
    tag: string,
    popularityBoost = 0
  ) => {
    if (!item || !item.id || !item.poster_path) return null

    const isMovie = mediaType === "movie"
    const releaseDate = isMovie ? item.release_date : item.first_air_date

    // Release hoye gele bad (only for upcoming, but here we want currently trending so we don't filter out released ones)
    // We just want popular ones. Let's not filter by date for trending.
    
    return {
      id: item.id,
      title: isMovie ? item.title : item.name,
      poster: `https://image.tmdb.org/t/p/w500${item.poster_path}`,
      // Landscape er jonno backdrop use korte pari, but poster eo landscape style apply kora jay. 
      // Apnar carousel e poster field use hoy, tai poster e rakhlam.
      year: releaseDate ? releaseDate.split("-")[0] : "Coming Soon",
      rating: item.vote_average > 0 ? item.vote_average.toFixed(1) : "not available",
      overview: item.overview || "",
      popularity: (item.popularity || 0) + popularityBoost,
      mediaType,
      tag,
    }
  }

  const seen = new Set<number>()

  const pickTop = (pool: any[], mediaType: "movie" | "tv", tag: string, count: number, boost = 0) => {
    const out: any[] = []
    for (const raw of pool) {
      if (out.length >= count) break
      if (!raw || !raw.id || seen.has(raw.id)) continue
      const item = formatItem(raw, mediaType, tag, boost)
      if (!item) continue
      seen.add(item.id)
      out.push(item)
    }
    return out
  }

  // Pick exactly as requested: 8 K-Drama, 4 (Hollywood/Bollywood/Fantasy), 4 (Horror/Mystery), 4 (Bangla/Indo) = 20
  const topKdrama = pickTop(kdramas.sort((a: any, b: any) => (b.popularity || 0) - (a.popularity || 0)), "tv", "K-Drama", 8, 50)
  
  const hbfPool = [...hollywood, ...bollywood, ...fantasy].sort((a: any, b: any) => (b.popularity || 0) - (a.popularity || 0))
  const topHbf = pickTop(hbfPool, "movie", "Movie", 4, 20)

  const hmPool = [...horror, ...mystery].sort((a: any, b: any) => (b.popularity || 0) - (a.popularity || 0))
  const topHm = pickTop(hmPool, "movie", "Movie", 4, 10)

  const biPool = [...bangla, ...indonesian].sort((a: any, b: any) => (b.popularity || 0) - (a.popularity || 0))
  const topBi = pickTop(biPool, "movie", "Movie", 4, 15)

  // Merge all 20 items
  const combined = [...topKdrama, ...topHbf, ...topHm, ...topBi]

  return NextResponse.json({ results: combined })
}
