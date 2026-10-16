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

  // তিনটি সোর্স থেকে ডাটা আনি (parallel)
  const [moviesRes, tvRes, kdramaRes] = await Promise.allSettled([
    // 1. Upcoming Movies (Theatrical + Digital)
    fetch(
      `https://api.themoviedb.org/3/movie/upcoming?language=en-US&page=1&region=US`,
      { headers, next: { revalidate: 21600 } }
    ),
    // 2. Upcoming TV Series (On The Air)
    fetch(
      `https://api.themoviedb.org/3/tv/on_the_air?language=en-US&page=1`,
      { headers, next: { revalidate: 21600 } }
    ),
    // 3. Upcoming K-Drama (Discover TV + Korean filter)
    fetch(
      `https://api.themoviedb.org/3/discover/tv?with_original_language=ko&with_origin_country=KR&first_air_date.gte=${today}&sort_by=first_air_date.asc&language=en-US&page=1`,
      { headers, next: { revalidate: 21600 } }
    ),
  ])

  const getResults = (res: PromiseSettledResult<Response>) => {
    if (res.status !== "fulfilled" || !res.value.ok) return []
    return res.value.json().then((d: any) => d.results || [])
  }

  const [movies, tvShows, kdramas] = await Promise.all([
    getResults(moviesRes).catch(() => []),
    getResults(tvRes).catch(() => []),
    getResults(kdramaRes).catch(() => []),
  ])

  // সব ডাটা একসাথে মার্জ করে ডুপ্লিকেট বাদ দিই
  const seen = new Set<number>()
  const combined: any[] = []

  const pushItem = (item: any, mediaType: "movie" | "tv", tag: string) => {
    if (!item || !item.id) return
    if (seen.has(item.id)) return
    seen.add(item.id)

    const isMovie = mediaType === "movie"
    combined.push({
      id: item.id,
      title: isMovie ? item.title : item.name,
      originalTitle: isMovie ? item.original_title : item.original_name,
      poster: item.poster_path
        ? `https://image.tmdb.org/t/p/w500${item.poster_path}`
        : null,
      backdrop: item.backdrop_path
        ? `https://image.tmdb.org/t/p/w780${item.backdrop_path}`
        : null,
      year: (isMovie ? item.release_date : item.first_air_date)
        ? (isMovie ? item.release_date : item.first_air_date).split("-")[0]
        : "Coming Soon",
      releaseDate: isMovie ? item.release_date : item.first_air_date,
      rating:
        item.vote_average && item.vote_average > 0
          ? item.vote_average.toFixed(1)
          : "not available",
      overview: item.overview || "",
      mediaType,
      tag,
    })
  }

  movies.forEach((m: any) => pushItem(m, "movie", "Movie"))
  tvShows.forEach((t: any) => pushItem(t, "tv", "Series"))
  kdramas.forEach((k: any) => pushItem(k, "tv", "K-Drama"))

  return NextResponse.json({ results: combined })
}
