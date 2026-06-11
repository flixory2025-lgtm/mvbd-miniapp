"use client"

import { useCricketScorecard } from "@/lib/sports/hooks"
import { GlassCard, SkeletonList, ErrorState, LiveBadge } from "./ui-primitives"
import { ArrowLeft } from "lucide-react"

export default function CricketMatchDetail({ id, onBack }: { id: string; onBack: () => void }) {
  const { scorecard, error, isLoading, refresh } = useCricketScorecard(id)

  return (
    <div className="min-h-screen pb-28">
      <div className="sticky top-0 z-10 flex items-center gap-3 border-b border-white/10 bg-black/40 px-4 py-3 backdrop-blur-xl">
        <button onClick={onBack} aria-label="Back" className="rounded-full bg-white/10 p-2 text-white ring-1 ring-white/10">
          <ArrowLeft className="h-4 w-4" />
        </button>
        <h1 className="text-base font-bold text-white">Scorecard</h1>
      </div>

      <div className="px-4">
        {isLoading && !scorecard ? (
          <div className="pt-4">
            <SkeletonList count={4} />
          </div>
        ) : error ? (
          <ErrorState message={error.message} onRetry={() => refresh()} />
        ) : !scorecard ? (
          <ErrorState message="Scorecard unavailable." onRetry={() => refresh()} />
        ) : (
          <>
            <GlassCard className="mt-4 p-5">
              <p className="text-center text-sm font-semibold text-white">{scorecard.name}</p>
              <div className="mt-3 flex flex-col items-center gap-1.5">
                {(scorecard.score ?? []).map((s: any, i: number) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    <span className="text-slate-400">{s.inning}</span>
                    <span className="font-bold tabular-nums text-emerald-300">
                      {s.r}/{s.w} ({s.o})
                    </span>
                  </div>
                ))}
                {scorecard.matchStarted && !scorecard.matchEnded && <LiveBadge />}
              </div>
              <p className="mt-3 text-center text-[11px] text-slate-400">{scorecard.status}</p>
            </GlassCard>

            <div className="mt-4 flex flex-col gap-4">
              {(scorecard.scorecard ?? []).map((inn: any, idx: number) => (
                <GlassCard key={idx} className="overflow-hidden">
                  <div className="border-b border-white/10 bg-white/[0.04] px-4 py-2.5">
                    <span className="text-sm font-semibold text-white">{inn.inning}</span>
                  </div>

                  <div className="px-4 py-3">
                    <div className="mb-2 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                      <span className="flex-1">Batter</span>
                      <span className="w-8 text-right">R</span>
                      <span className="w-8 text-right">B</span>
                      <span className="w-8 text-right">4s</span>
                      <span className="w-8 text-right">6s</span>
                      <span className="w-12 text-right">SR</span>
                    </div>
                    {(inn.batting ?? []).map((b: any, i: number) => (
                      <div key={i} className="flex items-center gap-2 py-1.5 text-sm">
                        <div className="flex-1">
                          <p className="line-clamp-1 font-medium text-white">{b.batsman?.name}</p>
                          {b["dismissal-text"] && b["dismissal-text"] !== "batting" && (
                            <p className="line-clamp-1 text-[10px] text-slate-500">{b["dismissal-text"]}</p>
                          )}
                        </div>
                        <span className="w-8 text-right font-bold tabular-nums text-white">{b.r}</span>
                        <span className="w-8 text-right tabular-nums text-slate-400">{b.b}</span>
                        <span className="w-8 text-right tabular-nums text-slate-400">{b["4s"]}</span>
                        <span className="w-8 text-right tabular-nums text-slate-400">{b["6s"]}</span>
                        <span className="w-12 text-right tabular-nums text-slate-400">{b.sr}</span>
                      </div>
                    ))}
                  </div>

                  {inn.bowling?.length > 0 && (
                    <div className="border-t border-white/10 px-4 py-3">
                      <div className="mb-2 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                        <span className="flex-1">Bowler</span>
                        <span className="w-8 text-right">O</span>
                        <span className="w-8 text-right">M</span>
                        <span className="w-8 text-right">R</span>
                        <span className="w-8 text-right">W</span>
                        <span className="w-12 text-right">Econ</span>
                      </div>
                      {inn.bowling.map((bw: any, i: number) => (
                        <div key={i} className="flex items-center gap-2 py-1.5 text-sm">
                          <span className="line-clamp-1 flex-1 font-medium text-white">{bw.bowler?.name}</span>
                          <span className="w-8 text-right tabular-nums text-slate-400">{bw.o}</span>
                          <span className="w-8 text-right tabular-nums text-slate-400">{bw.m}</span>
                          <span className="w-8 text-right tabular-nums text-slate-400">{bw.r}</span>
                          <span className="w-8 text-right font-bold tabular-nums text-white">{bw.w}</span>
                          <span className="w-12 text-right tabular-nums text-slate-400">{bw.eco}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </GlassCard>
              ))}

              {!scorecard.scorecard?.length && (
                <p className="py-10 text-center text-sm text-slate-400">Detailed scorecard not available yet.</p>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
