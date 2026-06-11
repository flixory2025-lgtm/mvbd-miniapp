"use client"

import { useCricketSeries } from "@/lib/sports/hooks"
import { GlassCard, SkeletonList, ErrorState, EmptyState } from "./ui-primitives"
import { Trophy } from "lucide-react"

export function CricketSeriesPanel() {
  const { series, error, isLoading } = useCricketSeries()

  if (isLoading && !series.length) return <SkeletonList count={6} />
  if (error) return <ErrorState message={error.message} />
  if (!series.length) return <EmptyState title="No tournaments" message="No active tournaments right now." />

  return (
    <div className="flex flex-col gap-3">
      {series.map((s: any) => (
        <GlassCard key={s.id} className="flex items-center gap-3 p-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 ring-1 ring-emerald-500/30">
            <Trophy className="h-5 w-5 text-emerald-300" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="line-clamp-1 text-sm font-semibold text-white">{s.name}</p>
            <p className="text-[11px] text-slate-400">
              {s.matches} matches · {s.t20 || 0} T20 · {s.odi || 0} ODI · {s.test || 0} Test
            </p>
          </div>
        </GlassCard>
      ))}
    </div>
  )
}
