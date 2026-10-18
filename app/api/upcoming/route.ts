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
  const revalidate = 10800 // 3 hours

  // ---------- helpers ----------
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

  // ---------- 1. K-Drama: 8 ta ----------
  const kdramas = await safeFetch(
    `https://api.themoviedb.org/3/discover/tv?with_original_language=ko&with_origin_country=KR&first_air_date.gte=${today}&sort_by=popularity.desc&language=en-US&page=1`
  )

  // ---------- 2. Hollywood / Bollywood / Romance / Fantasy: 4 ta ----------
  // English movies (US/GB), Indian movies (IN), Romance (10749), Fantasy (14)
  const [hollywood, bollywood, romance, fantasy] = await Promise.all([
    safeFetch(`https://api.themoviedb.org/3/discover/movie?with_origin_country=US|GB&with_original_language=en&primary_release_date.gte=${today}&sort_by=popularity.desc&language=en-US&page=1`),
    safeFetch(`https://api.themoviedb.org/3/discover/movie?with_origin_country=IN&primary_release_date.gte=${today}&sort_by=popularity.desc&language=en-US&page=1`),
    safeFetch(`https://api.themoviedb.org/3/discover/movie?with_genres=10749&primary_release_date.gte=${today}&sort_by=popularity.desc&language=en-US&page=1`),
    safeFetch(`https://api.themoviedb.org/3/discover/movie?with_genres=14&primary_release_date.gte=${today}&sort_by=popularity.desc&language=en-US&page=1`),
  ])

  // ---------- 3. Marvel / Superhero / Sci-Fi / Action: 4 ta ----------
  // Marvel company id = 420; Action = 28; Sci-Fi = 878; Adventure = 12 (superhero-ish)
  const [marvel, action, scifi, adventure] = await Promise.all([
    safeFetch(`https://api.themoviedb.org/3/discover/movie?with_companies=420&primary_release_date.gte=${today}&sort_by=popularity.desc&language=en-US&page=1`),
    safeFetch(`https://api.themoviedb.org/3/discover/movie?with_genres=28&primary_release_date.gte=${today}&sort_by=popularity.desc&language=en-US&page=1`),
    safeFetch(`https://api.themoviedb.org/3/discover/movie?with_genres=878&primary_release_date.gte=${today}&sort_by=popularity.desc&language=en-US&page=1`),
    safeFetch(`https://api.themoviedb.org/3/discover/movie?with_genres=12&primary_release_date.gte=${today}&sort_by=popularity.desc&language=en-US&page=1`),
  ])

  // ---------- 4. Horror / Mystery: 4 ta ----------
  // Horror = 27; Mystery = 9648
  const [horror, mystery] = await Promise.all([
    safeFetch(`https://api.themoviedb.org/3/discover/movie?with_genres=27&primary_release_date.gte=${today}&sort_by=popularity.desc&language=en-US&page=1`),
    safeFetch(`https://api.themoviedb.org/3/discover/movie?with_genres=9648&primary_release_date.gte=${today}&sort_by=popularity.desc&language=en-US&page=1`),
  ])

  // ---------- format ----------
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

    // release hoye gele bad
    if (releaseDate) {
      const rel = new Date(releaseDate + "T00:00:00")
      if (rel.getTime() < now.getTime()) return null
    }

    return {
      id: item.id,
      title: isMovie ? item.title : item.name,
      poster: `https://image.tmdb.org/t/p/w500${item.poster_path}`,
      year: releaseDate ? releaseDate.split("-")[0] : "Coming Soon",
      releaseDate: releaseDate || null,
      rating: item.vote_average > 0 ? item.vote_average.toFixed(1) : "not available",
      overview: item.overview || "",
      popularity: (item.popularity || 0) + popularityBoost,
      mediaType,
      tag,
    }
  }

  // ---------- dedupe helper ----------
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

  // ---------- K-Drama: 8 ----------
  const kdramaPool = kdramas.sort((a: any, b: any) => (b.popularity || 0) - (a.popularity || 0))
  const topKdrama = pickTop(kdramaPool, "tv", "K-Drama", 8, 50)

  // ---------- Hollywood/Bollywood/Romance/Fantasy: 4 ----------
  // merge, prefer higher popularity
  const hbrPool = [...hollywood, ...bollywood, ...romance, ...fantasy]
    .sort((a: any, b: any) => (b.popularity || 0) - (a.popularity || 0))
  const topHbr = pickTop(hbrPool, "movie", "Movie", 4, 20)

  // ---------- Marvel/Superhero/SciFi/Action: 4 ----------
  const msaPool = [...marvel, ...action, ...scifi, ...adventure]
    .sort((a: any, b: any) => (b.popularity || 0) - (a.popularity || 0))
  const topMsa = pickTop(msaPool, "movie", "Movie", 4, 20)

  // ---------- Horror/Mystery: 4 ----------
  const hmPool = [...horror, ...mystery]
    .sort((a: any, b: any) => (b.popularity || 0) - (a.popularity || 0))
  const topHm = pickTop(hmPool, "movie", "Movie", 4, 10)

  // ---------- merge all ----------
  const combined = [...topKdrama, ...topHbr, ...topMsa, ...topHm]

  // ---------- sort by release date (null last), then popularity ----------
  combined.sort((a, b) => {
    if (a.releaseDate && !b.releaseDate) return -1
    if (!a.releaseDate && b.releaseDate) return 1
    if (a.releaseDate && b.releaseDate) {
      return new Date(a.releaseDate + "T00:00:00").getTime() - new Date(b.releaseDate + "T00:00:00").getTime()
    }
    return b.popularity - a.popularity
  })

  const withPosition = combined.map((item, idx) => ({
    ...item,
    position: idx + 1,
  }))

  return NextResponse.json({ results: withPosition })
}
