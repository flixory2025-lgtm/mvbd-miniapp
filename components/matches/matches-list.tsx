"use client"

import { useFootballMatches, useCricketMatches } from "@/lib/sports/hooks"
import { useFavorites } from "@/lib/sports/use-favorites"
import { usePullToRefresh } from "@/lib/sports/use-pull-to-refresh"
import FootballMatchCard from "./football-match-card"
import CricketMatchCard from "./cricket-match-card"
import { SkeletonList, ErrorState, EmptyState } from "./ui-primitives"
import { RefreshCw } from "lucide-react"
import type { MatchStatus, SportType } from "@/lib/sports/types"

const EMPTY_COPY: Record<MatchStatus, { title: string; message: string }> = {
  live: { title: "No live matches", message: "There are no matches being played right now. Check upcoming fixtures." },
  upcoming: { title: "No upcoming matches", message: "No scheduled matches found in the next few days." },
  finished: { title: "No recent results", message: "No finished matches to show right now." },
}

export default function MatchesList({
  sport,
  status,
  onSelect,
}: {
  sport: SportType
  status: MatchStatus
  onSelect: (id: string) => void
}) {
  const football = useFootballMatches(sport === "football" ? status : "live")
  const cricket = useCricketMatches(sport === "cricket" ? status : "live")
  const active = sport === "football" ? football : cricket

  const { isFavorite, toggleFavorite } = useFavorites()
  const { containerRef, pullDistance, refreshing, threshold } = usePullToRefresh(async () => {
    await active.refresh()
  })

  const { isLoading, error } = active
  const matches = active.matches

  return (
    <div ref={containerRef} className="relative">
      {/* Pull to refresh indicator */}
      <div
        className="flex items-center justify-center overflow-hidden transition-all"
        style={{ height: pullDistance }}
      >
        <RefreshCw
          className={`h-5 w-5 text-emerald-300 ${refreshing ? "animate-spin" : ""}`}
          style={{ opacity: pullDistance / threshold, transform: `rotate(${pullDistance * 3}deg)` }}
        />
      </div>

      {isLoading && !matches.length ? (
        <SkeletonList count={6} />
      ) : error ? (
        <ErrorState message={error.message} onRetry={() => active.refresh()} />
      ) : !matches.length ? (
        <EmptyState title={EMPTY_COPY[status].title} message={EMPTY_COPY[status].message} />
      ) : (
        <div className="flex flex-col gap-3">
          {sport === "football"
            ? (matches as any[]).map((m) => (
                <div key={m.fixture.id} className="animate-[fadeInUp_0.3s_ease-out]">
                  <FootballMatchCard
                    match={m}
                    onClick={() => onSelect(String(m.fixture.id))}
                    isFavorite={isFavorite(`ft-team-${m.teams.home.id}`)}
                    onToggleFavorite={() =>
                      toggleFavorite({
                        id: `ft-team-${m.teams.home.id}`,
                        type: "football-team",
                        name: m.teams.home.name,
                        logo: m.teams.home.logo,
                      })
                    }
                  />
                </div>
              ))
            : (matches as any[]).map((m) => (
                <div key={m.id} className="animate-[fadeInUp_0.3s_ease-out]">
                  <CricketMatchCard match={m} onClick={() => onSelect(m.id)} />
                </div>
              ))}
        </div>
      )}
    </div>
  )
}
