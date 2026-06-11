"use client"

import type { FootballMatch } from "@/lib/sports/types"
import { GlassCard, LiveBadge, StatusPill } from "./ui-primitives"
import { Star } from "lucide-react"
import { cn } from "@/lib/utils"

function TeamRow({ logo, name, align = "left" }: { logo: string; name: string; align?: "left" | "right" }) {
  return (
    <div className={cn("flex flex-1 items-center gap-2.5", align === "right" && "flex-row-reverse text-right")}>
      <img
        src={logo || "/placeholder.svg"}
        alt={name}
        crossOrigin="anonymous"
        className="h-9 w-9 shrink-0 rounded-full bg-white/10 object-contain p-0.5"
      />
      <span className="line-clamp-1 text-sm font-semibold text-white">{name}</span>
    </div>
  )
}

export default function FootballMatchCard({
  match,
  onClick,
  isFavorite,
  onToggleFavorite,
}: {
  match: FootballMatch
  onClick: () => void
  isFavorite?: boolean
  onToggleFavorite?: () => void
}) {
  const { teams, goals, league, fixture, state } = match
  const time = new Date(fixture.date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  const hasScore = goals.home != null

  return (
    <GlassCard onClick={onClick} className="p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          {league.logo && (
            <img src={league.logo || "/placeholder.svg"} alt="" crossOrigin="anonymous" className="h-4 w-4 object-contain" />
          )}
          <span className="line-clamp-1 text-[11px] font-medium text-slate-400">{league.name}</span>
        </div>
        <div className="flex items-center gap-2">
          {state === "live" ? (
            <LiveBadge minute={fixture.status.elapsed} />
          ) : state === "finished" ? (
            <StatusPill label="FT" tone="muted" />
          ) : (
            <StatusPill label={time} tone="green" />
          )}
          {onToggleFavorite && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                onToggleFavorite()
              }}
              aria-label="Toggle favorite"
              className="text-slate-500 transition hover:text-amber-400"
            >
              <Star className={cn("h-4 w-4", isFavorite && "fill-amber-400 text-amber-400")} />
            </button>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <TeamRow logo={teams.home.logo} name={teams.home.name} />
        <div className="flex min-w-[52px] items-center justify-center">
          {hasScore ? (
            <span className="rounded-lg bg-white/10 px-2.5 py-1 text-base font-bold tabular-nums text-white">
              {goals.home}-{goals.away}
            </span>
          ) : (
            <span className="text-xs font-medium text-slate-500">vs</span>
          )}
        </div>
        <TeamRow logo={teams.away.logo} name={teams.away.name} align="right" />
      </div>
    </GlassCard>
  )
}
