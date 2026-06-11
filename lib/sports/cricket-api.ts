import "server-only"
import type { MatchStatus } from "./types"

// ফ্রি API - কোনো API key লাগবে না
const CRICKET_BASE = "https://api.sportscore.com/v1"

export function cricketState(match: { 
  status?: string; 
  startTime?: string;
  finished?: boolean;
  live?: boolean;
}): MatchStatus {
  // SportScore এর স্ট্যাটাস ম্যাপিং
  if (match.finished || match.status === "finished") return "finished"
  if (match.live || match.status === "live") return "live"
  return "upcoming"
}

interface CricketFetchOptions {
  revalidate?: number
}

/**
 * সম্পূর্ণ ফ্রি ক্রিকেট API - কোনো API key প্রয়োজন নেই
 * SportScore API ব্যবহার করে (প্রতিদিন 10,000+ কল ফ্রি)
 */
export async function cricketFetch<T = unknown>(
  endpoint: string,
  params: Record<string, string | number> = {},
  options: CricketFetchOptions = {},
): Promise<T> {
  const url = new URL(`${CRICKET_BASE}${endpoint}`)
  
  // SportScore এর জন্য প্যারামিটার সেট করুন
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, String(v))
  }

  try {
    const res = await fetch(url.toString(), {
      next: { revalidate: options.revalidate ?? 60 },
      headers: {
        'Accept': 'application/json',
      }
    })

    if (!res.ok) {
      throw new Error(`CRICKET_API_ERROR_${res.status}`)
    }

    const json = await res.json()
    
    // SportScore API রেসপন্স ফরম্যাট হ্যান্ডেল করুন
    if (json.error) {
      throw new Error(`CRICKET_API_ERROR: ${json.error}`)
    }

    return json as T
  } catch (error) {
    console.error("Cricket API failed:", error)
    // ফাঁকা ডাটা রিটার্ন করুন (app crash হবে না)
    return { data: [], success: false } as T
  }
}

// হেল্পার ফাংশন - লাইভ ম্যাচ পাওয়ার জন্য
export async function getLiveCricketMatches() {
  return cricketFetch("/cricket/matches/live")
}

// হেল্পার ফাংশন - আজকের ম্যাচ পাওয়ার জন্য
export async function getTodayCricketMatches() {
  const today = new Date().toISOString().split('T')[0]
  return cricketFetch("/cricket/matches", { date: today })
}

// হেল্পার ফাংশন - সিরিজ লিস্ট পাওয়ার জন্য
export async function getCricketSeries() {
  return cricketFetch("/cricket/series")
}
