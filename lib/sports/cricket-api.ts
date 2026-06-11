import "server-only"
import type { MatchStatus } from "./types"

const CRICKET_BASE = "https://api.cricapi.com/v1"

export function cricketState(match: { matchStarted?: boolean; matchEnded?: boolean; status?: string }): MatchStatus {
  if (match.matchEnded) return "finished"
  if (match.matchStarted) return "live"
  return "upcoming"
}

interface CricketFetchOptions {
  revalidate?: number
}

/**
 * Server-only fetch wrapper for CricAPI (cricapi.com).
 * Reads the key from process.env.CRICKET_API_KEY — never exposed to the client.
 */
export async function cricketFetch<T = unknown>(
  endpoint: string,
  params: Record<string, string | number> = {},
  options: CricketFetchOptions = {},
): Promise<T> {
  const key = process.env.CRICKET_API_KEY
  if (!key) {
    throw new Error("MISSING_CRICKET_API_KEY")
  }

  const url = new URL(`${CRICKET_BASE}${endpoint}`)
  url.searchParams.set("apikey", key)
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, String(v))
  }

  const res = await fetch(url.toString(), {
    next: { revalidate: options.revalidate ?? 60 },
  })

  if (!res.ok) {
    throw new Error(`CRICKET_API_ERROR_${res.status}`)
  }

  const json = await res.json()

  if (json.status && json.status !== "success") {
    throw new Error(`CRICKET_API_ERROR: ${json.status}`)
  }

  return json as T
}
