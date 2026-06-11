"use client"

import { useFootballFixture } from "@/lib/sports/hooks"
import { GlassCard, LiveBadge, SkeletonList, ErrorState } from "./ui-primitives"
import { ArrowLeft } from "lucide-react"
import { useState } from "react"
import { cn } from "@/lib/utils"

const TABS = ["Stats", "Lineups", "Events"] as const
type Tab = (typeof TABS)[number]

export default function FootballMatchDetail({ id, onBack }: { id: string; onBack: () => void }) {
  const { detail, error, isLoading, refresh } = useFootballFixture(id)
  const [tab, setTab] = useState<Tab>("Stats")

  const match = detail?.match
  const statistics = detail?.statistics ?? []
  const lineups = detail?.lineups ?? []
  const events = detail?.events ?? []

  return (
    <div className="min-h-screen pb-28">
      <Header onBack={onBack} />

      <div className="px-4">
        {isLoading && !match ? (
          <div className="pt-4">
            <SkeletonList count={4} />
          </div>
        ) : error ? (
          <ErrorState message={error.message} onRetry={() => refresh()} />
        ) : !match ? (
          <ErrorState message="Match details unavailable." onRetry={() => refresh()} />
        ) : (
          <>
            <GlassCard className="mt-4 p-5">
              <p className="mb-4 text-center text-[11px] font-medium text-slate-400">{match.league?.name}</p>
              <div className="flex items-center justify-between gap-3">
                <div className="flex flex-1 flex-col items-center gap-2">
                  <img src={match.teams.home.logo || "/placeholder.svg"} alt="" crossOrigin="anonymous" className="h-14 w-14 object-contain" />
                  <span className="text-center text-xs font-semibold text-white">{match.teams.home.name}</span>
                </div>
                <div className="flex flex-col items-center gap-1.5">
                  {match.goals.home != null ? (
                    <span className="text-3xl font-bold tabular-nums text-white">
                      {match.goals.home} - {match.goals.away}
                    </span>
                  ) : (
                    <span className="text-lg font-semibold text-slate-400">vs</span>
                  )}
                  {match.state === "live" ? (
                    <LiveBadge minute={match.fixture.status.elapsed} />
                  ) : (
                    <span className="text-[11px] font-medium text-slate-400">{match.fixture.status.long}</span>
                  )}
                </div>
                <div className="flex flex-1 flex-col items-center gap-2">
                  <img src={match.teams.away.logo || "/placeholder.svg"} alt="" crossOrigin="anonymous" className="h-14 w-14 object-contain" />
                  <span className="text-center text-xs font-semibold text-white">{match.teams.away.name}</span>
                </div>
              </div>
            </GlassCard>

            <div className="mt-4 flex gap-2 rounded-full bg-white/[0.04] p-1 ring-1 ring-white/10">
              {TABS.map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={cn(
                    "flex-1 rounded-full py-2 text-xs font-semibold transition",
                    tab === t ? "bg-emerald-500/25 text-emerald-200 ring-1 ring-emerald-500/40" : "text-slate-400",
                  )}
                >
                  {t}
                </button>
              ))}
            </div>

            <div className="mt-4">
              {tab === "Stats" && <StatsView statistics={statistics} />}
              {tab === "Lineups" && <LineupsView lineups={lineups} />}
              {tab === "Events" && <EventsView events={events} />}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function Header({ onBack }: { onBack: () => void }) {
  return (
    <div className="sticky top-0 z-10 flex items-center gap-3 border-b border-white/10 bg-black/40 px-4 py-3 backdrop-blur-xl">
      <button onClick={onBack} aria-label="Back" className="rounded-full bg-white/10 p-2 text-white ring-1 ring-white/10">
        <ArrowLeft className="h-4 w-4" />
      </button>
      <h1 className="text-base font-bold text-white">Match Details</h1>
    </div>
  )
}

function StatsView({ statistics }: { statistics: any[] }) {
  if (statistics.length < 2)
    return <p className="py-10 text-center text-sm text-slate-400">No statistics available yet.</p>

  const home = statistics[0]
  const away = statistics[1]
  const types = home.statistics.map((s: any) => s.type)

  const num = (v: any) => (typeof v === "string" && v.includes("%") ? Number.parseInt(v) : Number(v) || 0)

  return (
    <GlassCard className="p-5">
      <div className="flex flex-col gap-4">
        {types.map((type: string, i: number) => {
          const h = home.statistics[i]?.value ?? 0
          const a = away.statistics.find((s: any) => s.type === type)?.value ?? 0
          const total = num(h) + num(a) || 1
          return (
            <div key={type}>
              <div className="mb-1 flex items-center justify-between text-xs font-semibold text-white">
                <span className="tabular-nums">{h ?? 0}</span>
                <span className="text-[11px] font-medium text-slate-400">{type}</span>
                <span className="tabular-nums">{a ?? 0}</span>
              </div>
              <div className="flex h-1.5 gap-1">
                <div className="flex flex-1 justify-end overflow-hidden rounded-full bg-white/5">
                  <div className="h-full rounded-full bg-emerald-400" style={{ width: `${(num(h) / total) * 100}%` }} />
                </div>
                <div className="flex flex-1 overflow-hidden rounded-full bg-white/5">
                  <div className="h-full rounded-full bg-sky-400" style={{ width: `${(num(a) / total) * 100}%` }} />
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </GlassCard>
  )
}

function LineupsView({ lineups }: { lineups: any[] }) {
  if (!lineups.length) return <p className="py-10 text-center text-sm text-slate-400">Lineups not announced yet.</p>
  return (
    <div className="flex flex-col gap-4">
      {lineups.map((lu: any) => (
        <GlassCard key={lu.team.id} className="p-4">
          <div className="mb-3 flex items-center gap-2">
            <img src={lu.team.logo || "/placeholder.svg"} alt="" crossOrigin="anonymous" className="h-6 w-6 object-contain" />
            <span className="text-sm font-semibold text-white">{lu.team.name}</span>
            {lu.formation && (
              <span className="ml-auto rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-semibold text-slate-300">
                {lu.formation}
              </span>
            )}
          </div>
          <div className="flex flex-col gap-1.5">
            {lu.startXI?.map((p: any) => (
              <div key={p.player.id} className="flex items-center gap-3 text-sm text-slate-200">
                <span className="w-6 shrink-0 text-center text-xs font-bold text-emerald-300">{p.player.number}</span>
                <span className="line-clamp-1">{p.player.name}</span>
                <span className="ml-auto text-[11px] text-slate-500">{p.player.pos}</span>
              </div>
            ))}
          </div>
        </GlassCard>
      ))}
    </div>
  )
}

function EventsView({ events }: { events: any[] }) {
  if (!events.length) return <p className="py-10 text-center text-sm text-slate-400">No events recorded yet.</p>
  return (
    <GlassCard className="p-4">
      <div className="flex flex-col gap-3">
        {events.map((e: any, i: number) => (
          <div key={i} className="flex items-center gap-3 text-sm">
            <span className="w-9 shrink-0 rounded-full bg-white/10 py-0.5 text-center text-[11px] font-bold text-white">
              {e.time.elapsed}&apos;
            </span>
            <span className="font-medium text-white">{e.type}</span>
            <span className="line-clamp-1 text-slate-300">{e.player?.name}</span>
            <span className="ml-auto line-clamp-1 text-[11px] text-slate-500">{e.team?.name}</span>
          </div>
        ))}
      </div>
    </GlassCard>
  )
}
