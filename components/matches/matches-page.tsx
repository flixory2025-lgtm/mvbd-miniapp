"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import { useOnlineStatus } from "@/lib/sports/use-online-status"
import { OfflineScreen } from "./ui-primitives"
import MatchesList from "./matches-list"
import FootballMatchDetail from "./football-match-detail"
import CricketMatchDetail from "./cricket-match-detail"
import { StandingsPanel, TopScorersPanel } from "./football-panels"
import { CricketSeriesPanel } from "./cricket-panels"
import SearchPanel from "./search-panel"
import type { MatchStatus, SportType } from "@/lib/sports/types"
import { Search } from "lucide-react"

const FOOTBALL_TABS = ["Live", "Upcoming", "Finished", "Standings", "Scorers", "Search"] as const
const CRICKET_TABS = ["Live", "Upcoming", "Results", "Tournaments", "Search"] as const

type FootballTab = (typeof FOOTBALL_TABS)[number]
type CricketTab = (typeof CRICKET_TABS)[number]

const STATUS_MAP: Record<string, MatchStatus> = {
  Live: "live",
  Upcoming: "upcoming",
  Finished: "finished",
  Results: "finished",
}

export default function MatchesPage() {
  const online = useOnlineStatus()
  const [sport, setSport] = useState<SportType>("football")
  const [fbTab, setFbTab] = useState<FootballTab>("Live")
  const [crTab, setCrTab] = useState<CricketTab>("Live")
  const [detail, setDetail] = useState<{ sport: SportType; id: string } | null>(null)
  const [retryKey, setRetryKey] = useState(0)

  if (!online) {
    return (
      <div className="min-h-screen bg-black text-white">
        <SportsBackground />
        <OfflineScreen onRetry={() => setRetryKey((k) => k + 1)} />
      </div>
    )
  }

  if (detail) {
    return (
      <div className="relative min-h-screen bg-black text-white">
        <SportsBackground />
        <div className="relative z-10 animate-[fadeIn_0.25s_ease-out]">
          {detail.sport === "football" ? (
            <FootballMatchDetail id={detail.id} onBack={() => setDetail(null)} />
          ) : (
            <CricketMatchDetail id={detail.id} onBack={() => setDetail(null)} />
          )}
        </div>
      </div>
    )
  }

  const tabs = sport === "football" ? FOOTBALL_TABS : CRICKET_TABS
  const activeTab = sport === "football" ? fbTab : crTab
  const setActiveTab = (t: string) => (sport === "football" ? setFbTab(t as FootballTab) : setCrTab(t as CricketTab))

  return (
    <div className="relative min-h-screen bg-black pb-28 text-white" key={retryKey}>
      <SportsBackground />

      <div className="relative z-10">
        {/* Header */}
        <header className="px-4 pt-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white">Matches</h1>
              <p className="text-xs text-slate-400">Live scores, stats &amp; standings</p>
            </div>
          </div>

          {/* Sport switcher */}
          <div className="mt-4 flex gap-2 rounded-full border border-white/10 bg-white/[0.05] p-1 backdrop-blur-xl">
            {(["football", "cricket"] as SportType[]).map((s) => (
              <button
                key={s}
                onClick={() => setSport(s)}
                className={cn(
                  "flex-1 rounded-full py-2.5 text-sm font-semibold capitalize transition",
                  sport === s
                    ? "bg-emerald-500/25 text-emerald-100 ring-1 ring-emerald-500/40 shadow-[0_0_20px_rgba(16,185,129,0.25)]"
                    : "text-slate-400",
                )}
              >
                {s}
              </button>
            ))}
          </div>
        </header>

        {/* Sub-tabs */}
        <div className="mt-4 flex gap-2 overflow-x-auto px-4 pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {tabs.map((t) => (
            <button
              key={t}
              onClick={() => setActiveTab(t)}
              className={cn(
                "flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2 text-xs font-semibold ring-1 transition",
                activeTab === t
                  ? "bg-white/15 text-white ring-white/20"
                  : "bg-white/[0.04] text-slate-400 ring-white/10",
              )}
            >
              {t === "Search" && <Search className="h-3.5 w-3.5" />}
              {t}
              {t === "Live" && <LiveDot />}
            </button>
          ))}
        </div>

        {/* Content */}
        <main className="px-4 pt-4">
          <Content sport={sport} tab={activeTab} onSelect={(id) => setDetail({ sport, id })} />
        </main>
      </div>
    </div>
  )
}

function Content({
  sport,
  tab,
  onSelect,
}: {
  sport: SportType
  tab: string
  onSelect: (id: string) => void
}) {
  if (tab === "Search") return <SearchPanel sport={sport} />
  if (tab === "Standings") return <StandingsPanel />
  if (tab === "Scorers") return <TopScorersPanel />
  if (tab === "Tournaments") return <CricketSeriesPanel />

  const status = STATUS_MAP[tab] ?? "live"
  return <MatchesList sport={sport} status={status} onSelect={onSelect} />
}

function LiveDot() {
  return (
    <span className="relative flex h-1.5 w-1.5">
      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
      <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-red-500" />
    </span>
  )
}

function SportsBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0">
      <img
        src="/sports/stadium-bg.png"
        alt=""
        className="h-full w-full object-cover opacity-40"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/85 to-black" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(16,185,129,0.15),transparent_60%)]" />
    </div>
  )
}
