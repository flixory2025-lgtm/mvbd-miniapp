// Jekhane rakhbe: app/api/anime-upcoming/route.ts  (nam obosshoi route.ts)
// src folder thakle: src/app/api/anime-upcoming/route.ts
//
// Source 1: AniList GraphQL API (free, no key, server theke bhalo kaj kore)
// Source 2 (fallback): Jikan API (MyAnimeList)
// Sob theke famous (popularity) 20 ta upcoming anime.

import { NextResponse } from "next/server"

export const dynamic = "force-dynamic" // empty/fail response jeno cache na hoy

const TTL = 6 * 60 * 60 * 1000
let memo: { t: number; data: any[] } | null = null

interface Item {
  id: number
  title: string
  poster: string | null
  year: string
  releaseDate: string | null
  rating: string
  tag: string
  mediaType: "movie" | "tv"
  position: number
}

const pad = (n: number) => String(n).padStart(2, "0")

/* ---------------- AniList ---------------- */
async function fromAniList(): Promise<Item[]> {
  const query = `
    query {
      Page(page: 1, perPage: 30) {
        media(type: ANIME, status: NOT_YET_RELEASED, sort: POPULARITY_DESC, isAdult: false) {
          id
          format
          title { romaji english }
          coverImage { extraLarge large }
          startDate { year month day }
          seasonYear
        }
      }
    }`
  const res = await fetch("https://graphql.anilist.co", {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ query }),
    cache: "no-store",
  })
  if (!res.ok) throw new Error("AniList " + res.status)
  const json = await res.json()
  const list: any[] = json?.data?.Page?.media || []

  const out: Item[] = []
  for (const a of list) {
    const poster = a?.coverImage?.extraLarge || a?.coverImage?.large || null
    if (!a?.id || !poster) continue
    const d = a.startDate || {}
    const year = d.year || a.seasonYear || ""
    out.push({
      id: a.id,
      title: a.title?.english || a.title?.romaji || "Untitled",
      poster,
      year: year ? String(year) : "",
      releaseDate:
        d.year && d.month && d.day ? `${d.year}-${pad(d.month)}-${pad(d.day)}` : null,
      rating: "",
      tag: "Anime",
      mediaType: a.format === "MOVIE" ? "movie" : "tv",
      position: out.length + 1,
    })
    if (out.length === 20) break
  }
  return out
}

/* ---------------- Jikan (fallback) ---------------- */
async function fromJikan(): Promise<Item[]> {
  const res = await fetch(
    "https://api.jikan.moe/v4/anime?status=upcoming&order_by=members&sort=desc&sfw=true&limit=25",
    { headers: { Accept: "application/json" }, cache: "no-store" }
  )
  if (!res.ok) throw new Error("Jikan " + res.status)
  const json = await res.json()

  const out: Item[] = []
  const seen = new Set<number>()
  for (const a of json.data || []) {
    const poster =
      a?.images?.webp?.large_image_url ||
      a?.images?.jpg?.large_image_url ||
      a?.images?.jpg?.image_url ||
      null
    if (!a?.mal_id || !poster || seen.has(a.mal_id)) continue
    seen.add(a.mal_id)
    const from: string | null = a?.aired?.from || null
    out.push({
      id: a.mal_id,
      title: a.title_english || a.title,
      poster,
      year:
        (a?.aired?.prop?.from?.year && String(a.aired.prop.from.year)) ||
        (a?.year && String(a.year)) ||
        "",
      releaseDate: from ? from.slice(0, 10) : null,
      rating: "",
      tag: "Anime",
      mediaType: "tv",
      position: out.length + 1,
    })
    if (out.length === 20) break
  }
  return out
}

export async function GET() {
  // memory cache (server restart na hosha porjonto)
  if (memo && Date.now() - memo.t < TTL) {
    return NextResponse.json(
      { results: memo.data, source: "cache" },
      { headers: { "Cache-Control": "s-maxage=3600, stale-while-revalidate=21600" } }
    )
  }

  const errors: string[] = []
  for (const [name, fn] of [
    ["anilist", fromAniList],
    ["jikan", fromJikan],
  ] as const) {
    try {
      const results = await fn()
      if (results.length > 0) {
        memo = { t: Date.now(), data: results }
        return NextResponse.json(
          { results, source: name },
          { headers: { "Cache-Control": "s-maxage=3600, stale-while-revalidate=21600" } }
        )
      }
      errors.push(name + ": empty")
    } catch (e: any) {
      errors.push(name + ": " + (e?.message || "failed"))
    }
  }

  console.error("anime-upcoming failed:", errors)
  return NextResponse.json(
    { results: [], errors },
    { status: 502, headers: { "Cache-Control": "no-store" } }
  )
}
