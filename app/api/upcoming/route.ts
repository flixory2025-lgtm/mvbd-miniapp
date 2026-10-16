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
    // Upcoming Movies - sorted by popularity (famous first)
    fetch(
      `https://api.themoviedb.org/3/movie/upcoming?language=en-US&page=1&region=US`,
      { headers, next: { revalidate: 21600 } }
    ),
    // On the air TV Series
    fetch(
      `https://api.themoviedb.org/3/tv/on_the_air?language=en-US&page=1`,
      { headers, next: { revalidate: 21600 } }
    ),
    // Upcoming K-Drama
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

  const seen = new Set<number>()
  const combined: any[] = []

  const pushItem = (
    item: any,
    mediaType: "movie" | "tv",
    tag: string,
    popularityBoost: number = 0
  ) => {
    if (!item || !item.id) return
    if (seen.has(item.id)) return
    seen.add(item.id)

    const isMovie = mediaType === "movie"
    const releaseDate = isMovie ? item.release_date : item.first_air_date

    // Today বা ভবিষ্যতের তারিখ হলে তবেই upcoming হিসেবে গণ্য হবে
    // (movies/api সাধারণত ভবিষ্যতেরই দেয়, তবু safety)
    combined.push({
      id: item.id,
      title: isMovie ? item.title : item.name,
      poster: item.poster_path
        ? `https://image.tmdb.org/t/p/w500${item.poster_path}`
        : null,
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
    })
  }

  // Movies এবং TV-কে popularity boost দিই যাতে famous গুলো আগে আসে
  movies.forEach((m: any) => pushItem(m, "movie", "Movie", 15))
  tvShows.forEach((t: any) => pushItem(t, "tv", "Series", 5))
  kdramas.forEach((k: any) => pushItem(k, "tv", "K-Drama", 0))

  // popularity অনুযায়ী sort করে **শুধু Top 10** নিই
  const top10 = combined
    .sort((a, b) => b.popularity - a.popularity)
    .slice(0, 10)

  return NextResponse.json({ results: top10 })
}
