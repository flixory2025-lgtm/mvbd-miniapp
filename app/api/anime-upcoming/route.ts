// Jekhane rakhbe: app/api/anime-upcoming/route.ts  (src/app/... hole src er vitore)
// Jikan API (MyAnimeList data) theke sob theke famous 20 ta upcoming anime ane.
// Server side e fetch hoy, tai browser er CORS / rate-limit somossha nei,
// ar 6 ghonta Next.js cache kore rakhe.

import { NextResponse } from "next/server"

export const revalidate = 21600 // 6 hours

const JIKAN_URL =
  "https://api.jikan.moe/v4/anime?status=upcoming&order_by=members&sort=desc&sfw=true&limit=25"

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

async function fetchJikan(): Promise<any> {
  for (let attempt = 0; attempt < 3; attempt++) {
    const res = await fetch(JIKAN_URL, {
      headers: { Accept: "application/json" },
      next: { revalidate },
    })
    if (res.ok) return res.json()
    // 429 (rate limit) / 5xx hole kichukkhon opekkha kore abar chesta
    if (res.status === 429 || res.status >= 500) {
      await sleep(1200 * (attempt + 1))
      continue
    }
    throw new Error("Jikan " + res.status)
  }
  throw new Error("Jikan unavailable")
}

export async function GET() {
  try {
    const json = await fetchJikan()
    const seen = new Set<number>()
    const results: any[] = []

    for (const a of json.data || []) {
      const poster =
        a?.images?.webp?.large_image_url ||
        a?.images?.jpg?.large_image_url ||
        a?.images?.jpg?.image_url ||
        null
      if (!a?.mal_id || !poster || seen.has(a.mal_id)) continue
      seen.add(a.mal_id)

      const from: string | null = a?.aired?.from || null
      const releaseDate = from ? from.slice(0, 10) : null // "YYYY-MM-DD"
      const year =
        (a?.aired?.prop?.from?.year && String(a.aired.prop.from.year)) ||
        (a?.year && String(a.year)) ||
        ""

      results.push({
        id: a.mal_id,
        title: a.title_english || a.title,
        poster,
        year,
        releaseDate,
        rating: typeof a.score === "number" ? a.score.toFixed(1) : "",
        tag: "Anime",
        mediaType: "tv",
        position: results.length + 1,
      })
      if (results.length === 20) break
    }

    return NextResponse.json({ results })
  } catch (err) {
    console.error("anime-upcoming error:", err)
    return NextResponse.json({ results: [] })
  }
}
