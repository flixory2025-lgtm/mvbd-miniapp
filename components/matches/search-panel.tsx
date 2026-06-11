"use client"

import { useState } from "react"
import useSWR from "swr"
import { GlassCard, SkeletonList, SearchEmptyState } from "./ui-primitives"
import { Search, Star, Trophy, Shield } from "lucide-react"
import { useFavorites, type FavoriteItem } from "@/lib/sports/use-favorites"
import { cn } from "@/lib/utils"
import type { SportType } from "@/lib/sports/types"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export default function SearchPanel({ sport }: { sport: SportType }) {
  const [query, setQuery] = useState("")
  const [fbType, setFbType] = useState<"team" | "league">("team")
  const debounced = query.trim()

  const footballKey =
    sport === "football" && debounced.length >= 3
      ? `/api/football/search?q=${encodeURIComponent(debounced)}&type=${fbType}`
      : null
  const cricketKey =
    sport === "cricket" && debounced.length >= 3 ? `/api/cricket/search?q=${encodeURIComponent(debounced)}` : null

  const { data: fbData, isLoading: fbLoading } = useSWR(footballKey, fetcher)
  const { data: crData, isLoading: crLoading } = useSWR(cricketKey, fetcher)

  const { isFavorite, toggleFavorite } = useFavorites()

  const teams = fbData?.data?.teams ?? []
  const leagues = fbData?.data?.leagues ?? []
  const cricketSeries = crData?.data?.series ?? []
  const isLoading = fbLoading || crLoading

  function ResultRow({ item, icon }: { item: FavoriteItem; icon: React.ReactNode }) {
    const fav = isFavorite(item.id)
    return (
      <GlassCard className="flex items-center gap-3 p-3.5">
        {item.logo ? (
          <img src={item.logo || "/placeholder.svg"} alt="" crossOrigin="anonymous" className="h-8 w-8 rounded-full bg-white/10 object-contain" />
        ) : (
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-300">{icon}</div>
        )}
        <span className="line-clamp-1 flex-1 text-sm font-medium text-white">{item.name}</span>
        <button onClick={() => toggleFavorite(item)} aria-label="Toggle favorite" className="text-slate-500 transition hover:text-amber-400">
          <Star className={cn("h-5 w-5", fav && "fill-amber-400 text-amber-400")} />
        </button>
      </GlassCard>
    )
  }

  return (
    <div>
      <div className="mb-4 flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-4 py-2.5 backdrop-blur-xl">
        <Search className="h-4 w-4 text-slate-400" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={sport === "football" ? "Search teams or leagues" : "Search tournaments"}
          className="flex-1 bg-transparent text-sm text-white outline-none placeholder:text-slate-500"
        />
      </div>

      {sport === "football" && (
        <div className="mb-4 flex gap-2">
          {(["team", "league"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setFbType(t)}
              className={cn(
                "rounded-full px-4 py-1.5 text-xs font-semibold ring-1 transition",
                fbType === t ? "bg-emerald-500/25 text-emerald-200 ring-emerald-500/40" : "bg-white/5 text-slate-300 ring-white/10",
              )}
            >
              {t === "team" ? "Teams" : "Leagues"}
            </button>
          ))}
        </div>
      )}

      {debounced.length < 3 ? (
        <p className="py-10 text-center text-sm text-slate-400">Type at least 3 characters to search.</p>
      ) : isLoading ? (
        <SkeletonList count={5} />
      ) : (
        <div className="flex flex-col gap-3">
          {sport === "football" &&
            fbType === "team" &&
            teams.map((t: any) => (
              <ResultRow
                key={t.id}
                icon={<Shield className="h-4 w-4" />}
                item={{ id: `ft-team-${t.id}`, type: "football-team", name: t.name, logo: t.logo }}
              />
            ))}
          {sport === "football" &&
            fbType === "league" &&
            leagues.map((l: any) => (
              <ResultRow
                key={l.id}
                icon={<Trophy className="h-4 w-4" />}
                item={{ id: `ft-league-${l.id}`, type: "football-league", name: l.name, logo: l.logo }}
              />
            ))}
          {sport === "cricket" &&
            cricketSeries.map((s: any) => (
              <ResultRow
                key={s.id}
                icon={<Trophy className="h-4 w-4" />}
                item={{ id: `cr-series-${s.id}`, type: "cricket-series", name: s.name }}
              />
            ))}

          {((sport === "football" && fbType === "team" && !teams.length) ||
            (sport === "football" && fbType === "league" && !leagues.length) ||
            (sport === "cricket" && !cricketSeries.length)) && <SearchEmptyState query={debounced} />}
        </div>
      )}
    </div>
  )
}
