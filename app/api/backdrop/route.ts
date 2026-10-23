// app/api/backdrop/route.ts
import { NextRequest, NextResponse } from "next/server"

export const runtime = "nodejs"

function cleanTitle(title: string): string {
  return title
    .replace(/\(\d{4}\)/g, "")
    .replace(/\[[^\]]*\]/g, "")
    .replace(/\{[^}]*\}/g, "")
    .replace(/[\u{1D7CE}-\u{1D7FF}]/gu, "")
    .replace(/season\s*\d+/gi, "")
    .replace(/\b(s\d{1,2}|hindi|dubbed|dual audio|web-?dl|hdrip|bluray|720p|1080p|480p|x264|x265|hevc|esub|complete)\b/gi, "")
    .replace(/[^\p{L}\p{N}\s:.\-&'!?]/gu, " ")
    .replace(/\s+/g, " ")
    .trim()
}

function extractYear(year: string | null): number | null {
  const m = year ? String(year).match(/\d{4}/) : null
  return m ? parseInt(m[0], 10) : null
}

function similarity(a: string, b: string): number {
  const s1 = a.toLowerCase().trim()
  const s2 = b.toLowerCase().trim()
  if (!s1 || !s2) return 0
  if (s1 === s2) return 1
  if (s1.includes(s2) || s2.includes(s1)) return 0.8
  const w1 = s1.split(/\s+/).filter((w) => w.length > 2)
  const w2 = s2.split(/\s+/).filter((w) => w.length > 2)
  if (!w1.length || !w2.length) return 0
  let hit = 0
  for (const a1 of w1) if (w2.some((b1) => a1 === b1 || a1.includes(b1) || b1.includes(a1))) hit++
  return hit / Math.max(w1.length, w2.length)
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const rawTitle = searchParams.get("title")
  const year = extractYear(searchParams.get("year"))
  const genre = searchParams.get("genre") || ""
  const tmdbIdParam = searchParams.get("tmdbId")
  const typeParam = searchParams.get("type") // "tv" | "movie" (default tv: top series)

  const token = process.env.TMDB_TOKEN
  if (!token) return NextResponse.json({ backdrop: null, error: "Missing TMDB_TOKEN" }, { status: 500 })
  if (!rawTitle && !tmdbIdParam) return NextResponse.json({ backdrop: null })

  const headers = { Authorization: `Bearer ${token}`, accept: "application/json" }
  const cache = { "Cache-Control": "public, s-maxage=604800, stale-while-revalidate=86400" }
  const img = (p: string | null | undefined) => (p ? `https://image.tmdb.org/t/p/w1280${p}` : null)

  const preferred: "tv" | "movie" = typeParam === "movie" ? "movie" : "tv"
  const order: ("tv" | "movie")[] = preferred === "tv" ? ["tv", "movie"] : ["movie", "tv"]

  try {
    // Manual override: exact TMDB id
    if (tmdbIdParam) {
      for (const t of order) {
        const r = await fetch(`https://api.themoviedb.org/3/${t}/${parseInt(tmdbIdParam, 10)}?language=en-US`, {
          headers,
          next: { revalidate: 604800 },
        })
        if (r.ok) {
          const d = await r.json()
          if (d.backdrop_path) return NextResponse.json({ backdrop: img(d.backdrop_path), tmdbId: d.id }, { headers: cache })
        }
      }
    }

    const clean = cleanTitle(rawTitle || "")
    if (!clean) return NextResponse.json({ backdrop: null })
    const korean = /kdrama|k-drama|korean/i.test(genre) || /kdrama|k-drama|korean/i.test(rawTitle || "")

    for (const t of order) {
      let url = `https://api.themoviedb.org/3/search/${t}?query=${encodeURIComponent(clean)}&language=en-US&page=1`
      if (year) url += t === "tv" ? `&first_air_date_year=${year}` : `&year=${year}`

      let res = await fetch(url, { headers, next: { revalidate: 604800 } })
      let results: any[] = res.ok ? (await res.json()).results || [] : []

      // year filter বেশি strict হলে year ছাড়া আবার try
      if (!results.length && year) {
        res = await fetch(
          `https://api.themoviedb.org/3/search/${t}?query=${encodeURIComponent(clean)}&language=en-US&page=1`,
          { headers, next: { revalidate: 604800 } }
        )
        results = res.ok ? (await res.json()).results || [] : []
      }
      if (!results.length) continue

      const scored = results
        .filter((r) => r.backdrop_path)
        .map((r) => {
          const names = [r.title, r.name, r.original_title, r.original_name].filter(Boolean)
          const titleScore = Math.max(0, ...names.map((n: string) => similarity(clean, n))) * 0.55
          const ry = parseInt((r.release_date || r.first_air_date || "").slice(0, 4), 10) || 0
          let yearScore = year ? 0 : 0.15
          if (year && ry) {
            const diff = Math.abs(ry - year)
            yearScore = diff === 0 ? 0.3 : diff === 1 ? 0.2 : diff === 2 ? 0.1 : 0
          }
          const langScore = korean && r.original_language === "ko" ? 0.1 : 0.03
          const popScore = Math.min((r.popularity || 0) / 100, 0.1)
          return { r, score: titleScore + yearScore + langScore + popScore }
        })
        .sort((a, b) => b.score - a.score)

      if (scored[0] && scored[0].score >= 0.35) {
        return NextResponse.json({ backdrop: img(scored[0].r.backdrop_path), tmdbId: scored[0].r.id }, { headers: cache })
      }
    }
    return NextResponse.json({ backdrop: null }, { headers: { "Cache-Control": "public, s-maxage=3600" } })
  } catch {
    return NextResponse.json({ backdrop: null })
  }
}
