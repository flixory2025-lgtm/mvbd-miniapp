import "server-only"
import type { MatchStatus } from "./types"

// ফ্রি ফুটবল API - ESPN এর ফ্রি API
const FOOTBALL_BASE = "https://api.football-data.org/v4"

// স্ট্যাটাস কোড ম্যাপিং
const LIVE_STATUSES = ["LIVE", "IN_PLAY", "PAUSED"]
const FINISHED_STATUSES = ["FINISHED", "AWARDED", "POSTPONED", "CANCELLED"]

export function footballState(status: string): MatchStatus {
  if (LIVE_STATUSES.includes(status)) return "live"
  if (FINISHED_STATUSES.includes(status)) return "finished"
  return "upcoming"
}

interface FootballFetchOptions {
  revalidate?: number
}

/**
 * সম্পূর্ণ ফ্রি ফুটবল API - বিনামূল্যে API key প্রয়োজন (কিন্তু ফ্রি)
 * Football-Data.org - প্রতিদিন ১০ কল ফ্রি (বেশি লাগলে অন্য অপশন দিচ্ছি)
 * 
 * FREE API KEY নিতে: https://www.football-data.org/client/register
 * রেজিস্ট্রেশন করে email এ key পাবেন (2 মিনিট সময় লাগবে)
 */
export async function footballFetch<T = unknown>(
  endpoint: string,
  params: Record<string, string | number> = {},
  options: FootballFetchOptions = {},
): Promise<T> {
  // ফ্রি API key - আপনাকে রেজিস্ট্রেশন করতে হবে (নিচে বিস্তারিত)
  const key = process.env.FOOTBALL_API_KEY
  
  if (!key) {
    console.warn("FOOTBALL_API_KEY not set, using demo data")
    // ডেমো ডাটা রিটার্ন করুন (অ্যাপ ক্র্যাশ হবে না)
    return { matches: [], success: false } as T
  }

  const url = new URL(`${FOOTBALL_BASE}${endpoint}`)
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, String(v))
  }

  try {
    const res = await fetch(url.toString(), {
      headers: {
        "X-Auth-Token": key,
      },
      next: { revalidate: options.revalidate ?? 60 },
    })

    if (!res.ok) {
      if (res.status === 429) {
        console.warn("Football API rate limit reached")
        return { matches: [], rateLimited: true } as T
      }
      throw new Error(`FOOTBALL_API_ERROR_${res.status}`)
    }

    const json = await res.json()
    return json as T
  } catch (error) {
    console.error("Football API failed:", error)
    // ফাঁকা ডাটা রিটার্ন করুন
    return { matches: [] } as T
  }
}

// হেল্পার ফাংশন - লাইভ ফুটবল ম্যাচ
export async function getLiveFootballMatches() {
  return footballFetch("/matches", { status: "LIVE" })
}

// হেল্পার ফাংশন - আজকের ম্যাচ
export async function getTodayFootballMatches() {
  const today = new Date().toISOString().split('T')[0]
  return footballFetch("/matches", { dateFrom: today, dateTo: today })
}

// হেল্পার ফাংশন - নির্দিষ্ট লিগের ম্যাচ (উদা: প্রিমিয়ার লিগ = PL)
export async function getLeagueMatches(leagueCode: string = "PL") {
  return footballFetch(`/competitions/${leagueCode}/matches`)
}
