"use client"

import { useFootballStandings, useFootballTopScorers } from "@/lib/sports/hooks"
import { GlassCard, SkeletonList, ErrorState } from "./ui-primitives"
import { useState } from "react"
import { cn } from "@/lib/utils"

// Popular leagues for the dropdown
const LEAGUES = [
  { id: "39", name: "Premier League" },
  { id: "140", name: "La Liga" },
  { id: "135", name: "Serie A" },
  { id: "78", name: "Bundesliga" },
  { id: "61", name: "Ligue 1" },
  { id: "2", name: "Champions League" },
  { id: "1", name: "World Cup" },
]

function LeagueSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="mb-4 flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {LEAGUES.map((l) => (
        <button
          key={l.id}
          onClick={() => onChange(l.id)}
          className={cn(
            "shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold ring-1 transition",
            value === l.id
              ? "bg-emerald-500/25 text-emerald-200 ring-emerald-500/40"
              : "bg-white/5 text-slate-300 ring-white/10",
          )}
        >
          {l.name}
        </button>
      ))}
    </div>
  )
}

export function StandingsPanel() {
  const [league, setLeague] = useState("39")
  const { standings, error, isLoading } = useFootballStandings(league)

  return (
    <div>
      <LeagueSelect value={league} onChange={setLeague} />
      {isLoading && !standings.length ? (
        <SkeletonList count={6} />
      ) : error ? (
        <ErrorState message={error.message} />
      ) : !standings.length ? (
        <p className="py-10 text-center text-sm text-slate-400">No standings available for this league.</p>
      ) : (
        <GlassCard className="overflow-hidden">
          <div className="flex items-center gap-2 border-b border-white/10 bg-white/[0.04] px-4 py-2.5 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
            <span className="w-5">#</span>
            <span className="flex-1">Team</span>
            <span className="w-7 text-center">P</span>
            <span className="w-7 text-center">GD</span>
            <span className="w-8 text-center">Pts</span>
          </div>
          {standings.map((s: any) => (
            <div key={s.team.id} className="flex items-center gap-2 px-4 py-2.5 text-sm">
              <span className="w-5 font-bold tabular-nums text-slate-400">{s.rank}</span>
              <div className="flex flex-1 items-center gap-2">
                <img src={s.team.logo || "/placeholder.svg"} alt="" crossOrigin="anonymous" className="h-5 w-5 object-contain" />
                <span className="line-clamp-1 font-medium text-white">{s.team.name}</span>
              </div>
              <span className="w-7 text-center tabular-nums text-slate-400">{s.all.played}</span>
              <span className="w-7 text-center tabular-nums text-slate-400">{s.goalsDiff}</span>
              <span className="w-8 text-center font-bold tabular-nums text-emerald-300">{s.points}</span>
            </div>
          ))}
        </GlassCard>
      )}
    </div>
  )
}

export function TopScorersPanel() {
  const [league, setLeague] = useState("39")
  const { scorers, error, isLoading } = useFootballTopScorers(league)

  return (
    <div>
      <LeagueSelect value={league} onChange={setLeague} />
      {isLoading && !scorers.length ? (
        <SkeletonList count={6} />
      ) : error ? (
        <ErrorState message={error.message} />
      ) : !scorers.length ? (
        <p className="py-10 text-center text-sm text-slate-400">No top scorers available.</p>
      ) : (
        <GlassCard className="overflow-hidden">
          {scorers.slice(0, 20).map((s: any, i: number) => (
            <div key={s.player.id ?? i} className="flex items-center gap-3 border-b border-white/5 px-4 py-2.5 last:border-0">
              <span className="w-5 text-center font-bold tabular-nums text-slate-400">{i + 1}</span>
              <img src={s.player.photo || "/placeholder.svg"} alt="" crossOrigin="anonymous" className="h-8 w-8 rounded-full bg-white/10 object-cover" />
              <div className="min-w-0 flex-1">
                <p className="line-clamp-1 text-sm font-medium text-white">{s.player.name}</p>
                <p className="line-clamp-1 text-[11px] text-slate-500">{s.team?.name}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-emerald-300">{s.goals}</p>
                <p className="text-[10px] text-slate-500">goals</p>
              </div>
            </div>
          ))}
        </GlassCard>
      )}
    </div>
  )
}
