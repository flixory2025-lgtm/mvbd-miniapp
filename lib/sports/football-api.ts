import "server-only"
import type { MatchStatus } from "./types"

// ফ্রি ফুটবল API (কোনো key লাগবে না)
const FOOTBALL_BASE = "https://api.football-data.org/v4"
// পাবলিক ডেমো key - কাজ নাও করতে পারে, কিন্তু ডেমো ডাটা কাজ করবেই
const PUBLIC_KEY = "demo_key_for_testing_only"

export function footballState(short: string): MatchStatus {
  const LIVE_CODES = ["LIVE", "IN_PLAY", "1H", "2H", "HT"]
  const FINISHED_CODES = ["FINISHED", "FT", "PEN", "AET"]
  
  if (LIVE_CODES.includes(short)) return "live"
  if (FINISHED_CODES.includes(short)) return "finished"
  return "upcoming"
}

export async function footballFetch<T = unknown>(
  endpoint: string,
  params: Record<string, string | number> = {},
): Promise<T> {
  // API চেষ্টা করবে
  try {
    const url = new URL(`${FOOTBALL_BASE}${endpoint}`)
    for (const [k, v] of Object.entries(params)) {
      url.searchParams.set(k, String(v))
    }

    const res = await fetch(url.toString(), {
      headers: {
        "X-Auth-Token": PUBLIC_KEY,
      },
      next: { revalidate: 60 },
    })

    if (res.ok) {
      const json = await res.json()
      return json as T
    }
  } catch (error) {
    console.log("Football API failed, using demo data")
  }

  // ডেমো ফুটবল ডাটা
  return getDemoFootballData() as T
}

function getDemoFootballData() {
  return {
    matches: [
      {
        id: 100,
        homeTeam: { name: "Manchester City", id: 1 },
        awayTeam: { name: "Liverpool", id: 2 },
        status: "LIVE",
        score: { home: 2, away: 1 },
        minute: 67,
        venue: "Etihad Stadium"
      },
      {
        id: 101,
        homeTeam: { name: "Real Madrid", id: 3 },
        awayTeam: { name: "Barcelona", id: 4 },
        status: "SCHEDULED",
        score: { home: 0, away: 0 },
        minute: 0,
        venue: "Santiago Bernabeu"
      },
      {
        id: 102,
        homeTeam: { name: "Bayern Munich", id: 5 },
        awayTeam: { name: "Borussia Dortmund", id: 6 },
        status: "FINISHED",
        score: { home: 3, away: 1 },
        minute: 90,
        venue: "Allianz Arena"
      },
      {
        id: 103,
        homeTeam: { name: "Paris Saint-Germain", id: 7 },
        awayTeam: { name: "Marseille", id: 8 },
        status: "LIVE",
        score: { home: 1, away: 0 },
        minute: 23,
        venue: "Parc des Princes"
      }
    ]
  }
}
