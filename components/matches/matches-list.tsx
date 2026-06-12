
"use client"

import { useEffect, useState, useRef } from "react"

// ডেমো ডাটা - কোনো API কল ছাড়া
const DEMO_DATA = {
  football: {
    live: [
      { id: "1", homeTeam: { name: "Manchester City" }, awayTeam: { name: "Liverpool" }, status: "LIVE", score: { home: 2, away: 1 }, minute: 67, videoUrl: "" },
      { id: "2", homeTeam: { name: "Real Madrid" }, awayTeam: { name: "Barcelona" }, status: "LIVE", score: { home: 1, away: 0 }, minute: 34, videoUrl: "" },
    ],
    upcoming: [
      { id: "3", homeTeam: { name: "Bayern Munich" }, awayTeam: { name: "Dortmund" }, status: "SCHEDULED", date: "2026-06-12T20:00:00Z" },
      { id: "4", homeTeam: { name: "PSG" }, awayTeam: { name: "Marseille" }, status: "SCHEDULED", date: "2026-06-12T21:00:00Z" },
    ],
    finished: [
      { id: "5", homeTeam: { name: "Arsenal" }, awayTeam: { name: "Chelsea" }, status: "FINISHED", score: { home: 2, away: 2 } },
      { id: "6", homeTeam: { name: "Juventus" }, awayTeam: { name: "Milan" }, status: "FINISHED", score: { home: 1, away: 0 } },
    ],
  },
  cricket: {
    live: [
      { id: "101", name: "India vs Australia", shortName: "IND vs AUS", matchStarted: true, matchEnded: false, score: "245/3 (35.2)" },
      { id: "102", name: "England vs South Africa", shortName: "ENG vs SA", matchStarted: true, matchEnded: false, score: "120/2 (20.1)" },
    ],
    upcoming: [
      { id: "103", name: "Pakistan vs New Zealand", shortName: "PAK vs NZ", matchStarted: false, matchEnded: false, date: "2026-06-12T10:00:00Z" },
      { id: "104", name: "Bangladesh vs Sri Lanka", shortName: "BAN vs SL", matchStarted: false, matchEnded: false, date: "2026-06-13T11:00:00Z" },
    ],
    finished: [
      { id: "105", name: "West Indies vs Afghanistan", shortName: "WI vs AFG", matchStarted: true, matchEnded: true, score: "West Indies won by 5 wickets" },
    ],
  },
}

export default function MatchesList({ 
  sport, 
  status, 
  onSelect 
}: { 
  sport: string
  status: string
  onSelect: (id: string) => void 
}) {
  const [matches, setMatches] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    try {
      // সরাসরি ডেমো ডাটা সেট করুন
      const data = DEMO_DATA[sport as keyof typeof DEMO_DATA]?.[status as keyof typeof DEMO_DATA.football] || []
      setMatches(data)
    } catch (error) {
      console.error("Error loading matches:", error)
      setMatches([])
    } finally {
      setLoading(false)
    }
  }, [sport, status])

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 animate-pulse rounded-lg bg-white/5" />
        ))}
      </div>
    )
  }

  if (matches.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-slate-400">No {status} matches found</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {matches.map((match) => (
        <MatchCard key={match.id} match={match} sport={sport} onClick={() => onSelect(match.id)} />
      ))}
    </div>
  )
}

function MatchCard({ match, sport, onClick }: { match: any; sport: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full rounded-xl border border-white/10 bg-white/[0.04] p-4 text-left transition active:scale-[0.98]"
    >
      {sport === "football" ? (
        <>
          <div className="flex items-center justify-between">
            <div className="flex-1 text-right">
              <p className="font-semibold">{match.homeTeam?.name || "Team A"}</p>
              <p className="text-2xl font-bold">{match.score?.home ?? "-"}</p>
            </div>
            <div className="mx-4 text-xs text-slate-400">VS</div>
            <div className="flex-1">
              <p className="font-semibold">{match.awayTeam?.name || "Team B"}</p>
              <p className="text-2xl font-bold">{match.score?.away ?? "-"}</p>
            </div>
          </div>
          {match.minute && <div className="mt-2 text-center text-xs text-emerald-400">Live • {match.minute}'</div>}
          {match.date && <div className="mt-2 text-center text-xs text-slate-400">{new Date(match.date).toLocaleString()}</div>}
        </>
      ) : (
        <>
          <div className="flex items-center justify-between">
            <span className="font-semibold">{match.shortName || match.name}</span>
            {match.matchStarted && !match.matchEnded && <span className="text-xs text-emerald-400">● LIVE</span>}
          </div>
          {match.score && <p className="mt-1 text-sm text-slate-300">{match.score}</p>}
          {match.date && !match.matchStarted && <p className="mt-1 text-xs text-slate-400">{new Date(match.date).toLocaleString()}</p>}
        </>
      )}
    </button>
  )
}
