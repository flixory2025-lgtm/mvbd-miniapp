import "server-only"
import type { MatchStatus } from "./types"

const FOOTBALL_BASE = "https://v3.football.api-sports.io"

// Status short codes from API-Football mapped to our 3 buckets
const LIVE_CODES = ["1H", "HT", "2H", "ET", "BT", "P", "SUSP", "INT", "LIVE"]
const FINISHED_CODES = ["FT", "AET", "PEN", "PST", "CANC", "ABD", "AWD", "WO"]

export function footballState(short: string): MatchStatus {
  if (LIVE_CODES.includes(short)) return "live"
  if (FINISHED_CODES.includes(short)) return "finished"
  return "upcoming"
}

interface FootballFetchOptions {
  // revalidate seconds for Next data cache
  revalidate?: number
}

/**
 * Server-only fetch wrapper for API-Football.
 * Reads the key from process.env.FOOTBALL_API_KEY — never exposed to the client.
 */
export async function footballFetch<T = unknown>(
  endpoint: string,
  params: Record<string, string | number> = {},
  options: FootballFetchOptions = {},
): Promise<T> {
  const key = process.env.FOOTBALL_API_KEY
  if (!key) {
    throw new Error("MISSING_FOOTBALL_API_KEY")
  }

  const url = new URL(`${FOOTBALL_BASE}${endpoint}`)
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, String(v))
  }

  const res = await fetch(url.toString(), {
    headers: {
      "x-apisports-key": key,
    },
    next: { revalidate: options.revalidate ?? 60 },
  })

  if (!res.ok) {
    throw new Error(`FOOTBALL_API_ERROR_${res.status}`)
  }

  const json = await res.json()

  // API-Football returns errors inside a 200 body sometimes
  if (json.errors && Object.keys(json.errors).length > 0) {
    const msg = typeof json.errors === "object" ? JSON.stringify(json.errors) : String(json.errors)
    throw new Error(`FOOTBALL_API_ERROR: ${msg}`)
  }

  return json as T
}
