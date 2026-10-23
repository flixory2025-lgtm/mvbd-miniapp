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
  releaseDate: string | null // full date: YYYY-MM-DD
  dateLabel: string | null // full date na thakle: "Oct 2026" / "2027"
  sortKey: string // sorting er jonno
  rating: string
  tag: string
  mediaType: "movie" | "tv"
  position: number
}

const pad = (n: number) => String(n).padStart(2, "0")
const MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

// y/m/d theke full date, label ar sortKey banay
function buildDate(y?: number | null, m?: number | null, d?: number | null) {
  if (y && m && d) {
    const full = `${y}-${pad(m)}-${pad(d)}`
    return { releaseDate: full, dateLabel: null as string | null, sortKey: full }
  }
  if (y && m) {
    return { releaseDate: null, dateLabel: `${MON[m - 1]} ${y}`, sortKey: `${y}-${pad(m)}-28` }
  }
  if (y) {
    return { releaseDate: null, dateLabel: String(y), sortKey: `${y}-12-31` }
  }
  return null
}

// aj theke 2 din age (timezone difference er jonno) — client ta purono gulo bad dey
function cutoff() {
  const t = new Date(Date.now() - 2 * 86400000)
  return {
    int: t.getUTCFullYear() * 10000 + (t.getUTCMonth() + 1) * 100 + t.getUTCDate(),
    iso: `${t.getUTCFullYear()}-${pad(t.getUTCMonth() + 1)}-${pad(t.getUTCDate())}`,
  }
}

/* ---------------- AniList ---------------- */
// Shudhu "puro tarikh (din + mash + bochor)" thaka anime nibe.
// Prothom page e 20 ta na pele pore er page o dekhe (max 5 page).
async function fromAniList(): Promise<Item[]> {
  const c = cutoff()
  const out: Item[] = []
  const seen = new Set<number>()

  for (let page = 1; page <= 5 && out.length < 24; page++) {
    const query = `
      query {
        Page(page: ${page}, perPage: 50) {
          pageInfo { hasNextPage }
          media(type: ANIME, status_in: [NOT_YET_RELEASED, RELEASING], startDate_greater: ${c.int}, sort: POPULARITY_DESC, isAdult: false) {
            id
            format
            title { romaji english }
            coverImage { extraLarge large }
            startDate { year month day }
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

    for (const a of list) {
      const poster = a?.coverImage?.extraLarge || a?.coverImage?.large || null
      const d = a?.startDate || {}
      // puro tarikh na thakle skip
      if (!a?.id || !poster || !d.year || !d.month || !d.day || seen.has(a.id)) continue
      const bd = buildDate(d.year, d.month, d.day)!
      if (bd.sortKey < c.iso) continue
      seen.add(a.id)
      out.push({
        id: a.id,
        title: a.title?.english || a.title?.romaji || "Untitled",
        poster,
        year: String(d.year),
        ...bd,
        rating: "",
        tag: "Anime",
        mediaType: a.format === "MOVIE" ? "movie" : "tv",
        position: out.length + 1,
      })
      if (out.length === 24) break
    }
    if (!json?.data?.Page?.pageInfo?.hasNextPage) break
  }
  return out
}

/* ---------------- Jikan (fallback) ---------------- */
async function fromJikan(): Promise<Item[]> {
  const res = await fetch(
    "https://api.jikan.moe/v4/anime?status=upcoming&order_by=members&sort=desc&sfw=true&limit=25&page=1",
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
    const p = a?.aired?.prop?.from || {}
    if (!p.year || !p.month || !p.day) continue // puro tarikh lagbe
    const bd = buildDate(p.year, p.month, p.day)!
    if (bd.sortKey < cutoff().iso) continue
    out.push({
      id: a.mal_id,
      title: a.title_english || a.title,
      poster,
      year: String(p.year || a?.year || ""),
      ...bd,
      rating: "",
      tag: "Anime",
      mediaType: "tv",
      position: out.length + 1,
    })
    if (out.length === 24) break
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
