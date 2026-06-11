"use client"

import type { CricketMatch } from "@/lib/sports/types"
import { GlassCard, LiveBadge, StatusPill } from "./ui-primitives"
import { Star } from "lucide-react"
import { cn } from "@/lib/utils"

function teamLogo(match: CricketMatch, name: string) {
  return match.teamInfo?.find((t) => t.name === name || t.shortname === name)?.img
}

function scoreFor(match: CricketMatch, teamName: string) {
  const info = match.teamInfo?.find((t) => t.name === teamName)
  const short = info?.shortname
  const s = match.score?.find((sc) => sc.inning?.toLowerCase().includes((short || teamName).toLowerCase()))
  if (!s) return null
  return `${s.r}/${s.w} (${s.o})`
}

export default function CricketMatchCard({
  match,
  onClick,
  isFavorite,
  onToggleFavorite,
}: {
  match: CricketMatch
  onClick: () => void
  isFavorite?: boolean
  onToggleFavorite?: () => void
}) {
  const [teamA, teamB] = match.teams ?? ["TBC", "TBC"]
  const time = new Date(match.dateTimeGMT + "Z").toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })

  function TeamLine({ name }: { name: string }) {
    const logo = teamLogo(match, name)
    const score = scoreFor(match, name)
    return (
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2.5">
          <img
            src={logo || "/placeholder.svg"}
            alt={name}
            crossOrigin="anonymous"
            className="h-7 w-7 shrink-0 rounded-full bg-white/10 object-contain"
          />
          <span className="line-clamp-1 text-sm font-semibold text-white">{name}</span>
        </div>
        {score && <span className="shrink-0 text-sm font-bold tabular-nums text-emerald-300">{score}</span>}
      </div>
    )
  }

  return (
    <GlassCard onClick={onClick} className="p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <span className="line-clamp-1 text-[11px] font-medium text-slate-400">
          {match.matchType?.toUpperCase()} · {match.venue?.split(",")[0]}
        </span>
        <div className="flex items-center gap-2">
          {match.state === "live" ? (
            <LiveBadge />
          ) : match.state === "finished" ? (
            <StatusPill label="Result" tone="muted" />
          ) : (
            <StatusPill label="Upcoming" tone="green" />
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

      <div className="flex flex-col gap-2">
        <TeamLine name={teamA} />
        <TeamLine name={teamB} />
      </div>

      <p className="mt-3 line-clamp-1 text-[11px] text-slate-400">
        {match.state === "upcoming" ? time : match.status}
      </p>
    </GlassCard>
  )
}
