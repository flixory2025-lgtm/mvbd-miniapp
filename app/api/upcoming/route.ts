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

  // তিনটি সোর্স থেকে parallel ডাটা আনি
  const [moviesRes, tvRes, kdramaRes] = await Promise.allSettled([
    // Famous upcoming movies
    fetch(
      `https://api.themoviedb.org/3/movie/upcoming?language=en-US&page=1&region=US`,
      { headers, next: { revalidate: 21600 } }
    ),
    // Famous upcoming TV series
    fetch(
      `https://api.themoviedb.org/3/tv/on_the_air?language=en-US&page=1`,
      { headers, next: { revalidate: 21600 } }
    ),
    // Famous upcoming K-Drama
    fetch(
      `https://api.themoviedb.org/3/discover/tv?with_original_language=ko&with_origin_country=KR&first_air_date.gte=${today}&sort_by=popularity.desc&language=en-US&page=1`,
      { headers, next: { revalidate: 21600 } }
    ),
  ])

  const getResults = (res: PromiseSettledResult<Response>) => {
    if (res.status !== "fulfilled" || !res.value.ok) return Promise.resolve([])
    return res.value.json().then((d: any) => d.results || [])
  }

  const [movies, tvShows, kdramas] = await Promise.all([
    getResults(moviesRes).catch(() => []),
    getResults(tvRes).catch(() => []),
    getResults(kdramaRes).catch(() => []),
  ])

  const now = new Date()
  now.setHours(0, 0, 0, 0)

  /* =========================================================
     একটি item কে standard format-এ রূপান্তর
  ========================================================= */
  const formatItem = (
    item: any,
    mediaType: "movie" | "tv",
    tag: string,
    popularityBoost: number = 0
  ) => {
    if (!item || !item.id) return null
    if (!item.poster_path) return null // poster ছাড়া বাদ

    const isMovie = mediaType === "movie"
    const releaseDate = isMovie ? item.release_date : item.first_air_date

    // অতীতের মুভি বাদ (৭ দিনের পুরনো হলে)
    if (releaseDate) {
      const rel = new Date(releaseDate + "T00:00:00")
      if (rel.getTime() < now.getTime() - 1000 * 60 * 60 * 24 * 7) {
        return null
      }
    }

    return {
      id: item.id,
      title: isMovie ? item.title : item.name,
      poster: `https://image.tmdb.org/t/p/w500${item.poster_path}`,
      year: releaseDate ? releaseDate.split("-")[0] : "Coming Soon",
      releaseDate: releaseDate || null,
      rating:
        item.vote_average && item.vote_average > 0
          ? item.vote_average.toFixed(1)
          : "not available",
      overview: item.overview || "",
      popularity: (item.popularity || 0) + popularityBoost,
      mediaType,
      tag,
    }
  }

  /* =========================================================
     TOP 5 Famous Movies/Series বাছাই
  ========================================================= */
  const movieSeen = new Set<number>()
  const moviePool: any[] = []

  movies.forEach((m: any) => {
    if (movieSeen.has(m.id)) return
    movieSeen.add(m.id)
    const item = formatItem(m, "movie", "Movie", 25)
    if (item) moviePool.push(item)
  })

  tvShows.forEach((t: any) => {
    if (movieSeen.has(t.id)) return
    movieSeen.add(t.id)
    const item = formatItem(t, "tv", "Series", 10)
    if (item) moviePool.push(item)
  })

  const top5Movies = moviePool
    .sort((a, b) => b.popularity - a.popularity)
    .slice(0, 5)

  /* =========================================================
     TOP 5 Famous K-Drama বাছাই
  ========================================================= */
  const kdramaSeen = new Set<number>()
  const top5Kdrama = kdramas
    .filter((k: any) => {
      if (!k || !k.id) return false
      if (kdramaSeen.has(k.id)) return false
      kdramaSeen.add(k.id)
      return true
    })
    .map((k: any) => formatItem(k, "tv", "K-Drama", 0))
    .filter(Boolean)
    .sort((a: any, b: any) => b.popularity - a.popularity)
    .slice(0, 5)

  /* =========================================================
     Top 5 Movies + Top 5 KDrama মার্জ করে
     Release Date অনুযায়ী sort → Position 1, 2, 3... অটো
  ========================================================= */
  const combined = [...top5Movies, ...top5Kdrama]

  combined.sort((a, b) => {
    // যেগুলোর release date আছে সেগুলো আগে
    if (a.releaseDate && !b.releaseDate) return -1
    if (!a.releaseDate && b.releaseDate) return 1

    if (a.releaseDate && b.releaseDate) {
      const da = new Date(a.releaseDate + "T00:00:00").getTime()
      const db = new Date(b.releaseDate + "T00:00:00").getTime()
      return da - db // আগে যেটা রিলিজ হবে সেটা আগে
    }

    return b.popularity - a.popularity
  })

  // Position number (1-10) যোগ করি
  const withPosition = combined.map((item, idx) => ({
    ...item,
    position: idx + 1,
  }))

  return NextResponse.json({ results: withPosition })
}
