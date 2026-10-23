// app/api/top20/route.ts
import { NextResponse } from "next/server"

export const runtime = "nodejs"
// ✅ ৩ ঘণ্টা পর পর নতুন করে TMDB থেকে data আসবে (Upcoming section এর মতোই)
export const revalidate = 10800

const TMDB = "https://api.themoviedb.org/3"
const IMG_BACKDROP_LG = "https://image.tmdb.org/t/p/w1280"
const IMG_BACKDROP_SM = "https://image.tmdb.org/t/p/w780"
const IMG_POSTER = "https://image.tmdb.org/t/p/w500"
const REVALIDATE_SECONDS = 10800 // 3 hours
const TOTAL = 20

// TMDB genre id -> নাম (movie + tv)
const GENRES: Record<number, string> = {
  28: "Action",
  12: "Adventure",
  16: "Animation",
  35: "Comedy",
  80: "Crime",
  99: "Documentary",
  18: "Drama",
  10751: "Family",
  14: "Fantasy",
  36: "History",
  27: "Horror",
  10402: "Music",
  9648: "Mystery",
  10749: "Romance",
  878: "Sci-Fi",
  10770: "TV Movie",
  53: "Thriller",
  10752: "War",
  37: "Western",
  10759: "Action & Adventure",
  10762: "Kids",
  10765: "Sci-Fi & Fantasy",
  10768: "War & Politics",
}

type MediaType = "movie" | "tv"

type Pool = {
  items: any[]
  mediaType: MediaType
  tag: string
}

type Top20Item = {
  id: number
  tmdbId: number
  title: string
  poster: string | null
  backdrop: string
  backdropSm: string
  year: string
  releaseDate: string | null
  rating: string
  overview: string
  popularity: number
  mediaType: MediaType
  tag: string
  genre: string
}

/* ---------- date helpers ---------- */
const toYmd = (d: Date) => d.toISOString().split("T")[0]
const daysAgo = (n: number) => {
  const d = new Date()
  d.setUTCDate(d.getUTCDate() - n)
  return toYmd(d)
}

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

  const today = toYmd(new Date())

  const safeFetch = async (url: string): Promise<any[]> => {
    try {
      const res = await fetch(url, {
        headers,
        next: { revalidate: REVALIDATE_SECONDS },
      })
      if (!res.ok) return []
      const data = await res.json()
      return data.results || []
    } catch {
      return []
    }
  }

  /* -------------------------------------------------------
     Discover helpers — "এখন যেগুলো সবচেয়ে বেশি চলছে"
     (upcoming না — গত কয়েকদিন/মাসে release হওয়া বা এখন
      air হওয়া, popularity অনুযায়ী সাজানো)
  ------------------------------------------------------- */
  const movieUrl = (extra: string, windowDays: number) =>
    `${TMDB}/discover/movie?include_adult=false&language=en-US&page=1&sort_by=popularity.desc` +
    `&primary_release_date.gte=${daysAgo(windowDays)}&primary_release_date.lte=${today}` +
    `&${extra}`

  const tvUrl = (extra: string, windowDays: number) =>
    `${TMDB}/discover/tv?include_adult=false&language=en-US&page=1&sort_by=popularity.desc` +
    `&air_date.gte=${daysAgo(windowDays)}&air_date.lte=${today}` +
    `&${extra}`

  const [
    kdramas,
    hollywood,
    bollywood,
    fantasy,
    adventure,
    horror,
    mystery,
    indonesian,
    banglaMovies,
    banglaTv,
  ] = await Promise.all([
    // 1) K-Drama (reality / talk / news বাদ)
    safeFetch(
      tvUrl(
        "with_original_language=ko&with_origin_country=KR&without_genres=10764|10767|10763",
        45
      )
    ),
    // 2) Hollywood / Bollywood / Fantasy / Adventure
    safeFetch(movieUrl("with_original_language=en", 90)),
    safeFetch(movieUrl("with_original_language=hi", 90)),
    safeFetch(movieUrl("with_genres=14", 90)),
    safeFetch(movieUrl("with_genres=12", 90)),
    // 3) Horror / Mystery / Indonesian
    safeFetch(movieUrl("with_genres=27", 90)),
    safeFetch(movieUrl("with_genres=9648", 90)),
    safeFetch(movieUrl("with_original_language=id", 150)),
    // 4) Bangla movie + natok (Bangla content কম, তাই window বড়)
    safeFetch(movieUrl("with_original_language=bn", 400)),
    safeFetch(tvUrl("with_original_language=bn", 400)),
  ])

  /* -------------------------------------------------------
     Format — landscape backdrop না থাকলে hero তে দেখানো যাবে না
  ------------------------------------------------------- */
  const formatItem = (
    raw: any,
    mediaType: MediaType,
    tag: string
  ): Top20Item | null => {
    if (!raw || !raw.id || !raw.backdrop_path) return null

    const isMovie = mediaType === "movie"
    const date: string = (isMovie ? raw.release_date : raw.first_air_date) || ""
    const genre =
      (raw.genre_ids || [])
        .map((g: number) => GENRES[g])
        .filter(Boolean)
        .slice(0, 2)
        .join(" / ") || tag

    return {
      id: raw.id,
      tmdbId: raw.id,
      title: (isMovie ? raw.title : raw.name) || "Untitled",
      poster: raw.poster_path ? `${IMG_POSTER}${raw.poster_path}` : null,
      backdrop: `${IMG_BACKDROP_LG}${raw.backdrop_path}`,
      backdropSm: `${IMG_BACKDROP_SM}${raw.backdrop_path}`,
      year: date ? date.split("-")[0] : "",
      releaseDate: date || null,
      rating:
        raw.vote_average > 0 ? Number(raw.vote_average).toFixed(1) : "not available",
      overview: raw.overview || "",
      popularity: raw.popularity || 0,
      mediaType,
      tag,
      genre,
    }
  }

  const seen = new Set<string>()
  const keyOf = (i: Top20Item) => `${i.mediaType}-${i.id}`

  /**
   * একাধিক pool থেকে ঘুরিয়ে ঘুরিয়ে (round-robin) item তোলে —
   * যেমন Hollywood, Bollywood, Fantasy, Adventure থেকে একটা করে।
   */
  const pickRoundRobin = (pools: Pool[], count: number): Top20Item[] => {
    const out: Top20Item[] = []
    const cursors = pools.map(() => 0)
    let progressed = true

    while (out.length < count && progressed) {
      progressed = false
      for (let p = 0; p < pools.length && out.length < count; p++) {
        const pool = pools[p]
        while (cursors[p] < pool.items.length) {
          const item = formatItem(
            pool.items[cursors[p]++],
            pool.mediaType,
            pool.tag
          )
          if (!item || seen.has(keyOf(item))) continue
          seen.add(keyOf(item))
          out.push(item)
          progressed = true
          break
        }
      }
    }
    return out
  }

  const allPools: Pool[] = [
    { items: kdramas, mediaType: "tv", tag: "K-Drama" },
    { items: hollywood, mediaType: "movie", tag: "Hollywood" },
    { items: bollywood, mediaType: "movie", tag: "Bollywood" },
    { items: fantasy, mediaType: "movie", tag: "Fantasy" },
    { items: adventure, mediaType: "movie", tag: "Adventure" },
    { items: horror, mediaType: "movie", tag: "Horror" },
    { items: mystery, mediaType: "movie", tag: "Mystery" },
    { items: indonesian, mediaType: "movie", tag: "Indonesian" },
    { items: banglaMovies, mediaType: "movie", tag: "Bangla Movie" },
    { items: banglaTv, mediaType: "tv", tag: "Bangla Natok" },
  ]

  // ---------- 8 K-Drama ----------
  const groupKdrama = pickRoundRobin([allPools[0]], 8)

  // ---------- 4: Hollywood / Bollywood / Fantasy / Adventure ----------
  const groupHbfa = pickRoundRobin(allPools.slice(1, 5), 4)

  // ---------- 4: Horror / Mystery / Indonesian ----------
  const groupHmi = pickRoundRobin(allPools.slice(5, 8), 4)

  // ---------- 4: Bangla Movie / Natok ----------
  const groupBangla = pickRoundRobin(allPools.slice(8, 10), 4)

  // ---------- কোনো group এ কম পড়লে বাকি সব pool থেকে popularity অনুযায়ী ভরাট ----------
  const picked = groupKdrama.length + groupHbfa.length + groupHmi.length + groupBangla.length
  const groupFill: Top20Item[] = []
  if (picked < TOTAL) {
    const leftovers: Array<{ item: Top20Item }> = []
    for (const pool of allPools) {
      for (const raw of pool.items) {
        const item = formatItem(raw, pool.mediaType, pool.tag)
        if (item && !seen.has(keyOf(item))) leftovers.push({ item })
      }
    }
    leftovers.sort((a, b) => b.item.popularity - a.item.popularity)
    for (const { item } of leftovers) {
      if (picked + groupFill.length >= TOTAL) break
      if (seen.has(keyOf(item))) continue
      seen.add(keyOf(item))
      groupFill.push(item)
    }
  }

  /* -------------------------------------------------------
     Interleave — পরপর ৮টা K-Drama না এসে সবগুলো mix হয়ে আসবে
  ------------------------------------------------------- */
  const groups = [groupKdrama, groupHbfa, groupHmi, groupBangla, groupFill]
  const keyed: Array<{ item: Top20Item; k: number; g: number }> = []
  groups.forEach((list, g) => {
    list.forEach((item, idx) => {
      keyed.push({ item, k: (idx + 0.5) / list.length, g })
    })
  })
  keyed.sort((a, b) => a.k - b.k || a.g - b.g)

  const results = keyed.slice(0, TOTAL).map(({ item }, idx) => ({
    ...item,
    position: idx + 1,
  }))

  return NextResponse.json({
    results,
    updatedAt: new Date().toISOString(),
  })
}
