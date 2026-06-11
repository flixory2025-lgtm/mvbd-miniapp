"use client"

import { cn } from "@/lib/utils"
import { WifiOff, SearchX, Inbox, AlertTriangle, RefreshCw } from "lucide-react"

// Liquid glass container used across the Matches dashboard
export function GlassCard({
  className,
  children,
  onClick,
}: {
  className?: string
  children: React.ReactNode
  onClick?: () => void
}) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "rounded-2xl border border-white/10 bg-white/[0.06] backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.4)]",
        onClick && "cursor-pointer transition-transform active:scale-[0.98]",
        className,
      )}
    >
      {children}
    </div>
  )
}

export function LiveBadge({ minute }: { minute?: number | null }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-red-500/20 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-red-300 ring-1 ring-red-500/40">
      <span className="relative flex h-1.5 w-1.5">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
        <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-red-500" />
      </span>
      {minute != null ? `${minute}'` : "LIVE"}
    </span>
  )
}

export function StatusPill({ label, tone = "muted" }: { label: string; tone?: "muted" | "green" | "amber" }) {
  const tones = {
    muted: "bg-white/10 text-slate-300 ring-white/10",
    green: "bg-emerald-500/15 text-emerald-300 ring-emerald-500/30",
    amber: "bg-amber-500/15 text-amber-300 ring-amber-500/30",
  }
  return (
    <span className={cn("rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide ring-1", tones[tone])}>
      {label}
    </span>
  )
}

// ---------- Skeletons ----------

export function MatchSkeleton() {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="h-3 w-24 animate-pulse rounded bg-white/10" />
        <div className="h-5 w-12 animate-pulse rounded-full bg-white/10" />
      </div>
      <div className="flex items-center justify-between gap-3">
        <div className="flex flex-1 items-center gap-2">
          <div className="h-9 w-9 animate-pulse rounded-full bg-white/10" />
          <div className="h-3 w-20 animate-pulse rounded bg-white/10" />
        </div>
        <div className="h-6 w-10 animate-pulse rounded bg-white/10" />
        <div className="flex flex-1 items-center justify-end gap-2">
          <div className="h-3 w-20 animate-pulse rounded bg-white/10" />
          <div className="h-9 w-9 animate-pulse rounded-full bg-white/10" />
        </div>
      </div>
    </div>
  )
}

export function SkeletonList({ count = 5 }: { count?: number }) {
  return (
    <div className="flex flex-col gap-3">
      {Array.from({ length: count }).map((_, i) => (
        <MatchSkeleton key={i} />
      ))}
    </div>
  )
}

// ---------- States ----------

export function EmptyState({ title, message }: { title: string; message: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/5 ring-1 ring-white/10">
        <Inbox className="h-6 w-6 text-slate-400" />
      </div>
      <p className="text-base font-semibold text-white">{title}</p>
      <p className="max-w-xs text-sm text-slate-400">{message}</p>
    </div>
  )
}

export function SearchEmptyState({ query }: { query: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/5 ring-1 ring-white/10">
        <SearchX className="h-6 w-6 text-slate-400" />
      </div>
      <p className="text-base font-semibold text-white">No results for &quot;{query}&quot;</p>
      <p className="max-w-xs text-sm text-slate-400">Try a different team, league or tournament name.</p>
    </div>
  )
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  const needsKey = /api key/i.test(message)
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-amber-500/10 ring-1 ring-amber-500/30">
        <AlertTriangle className="h-6 w-6 text-amber-400" />
      </div>
      <p className="text-base font-semibold text-white">{needsKey ? "Setup required" : "Something went wrong"}</p>
      <p className="max-w-xs text-sm text-slate-400">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-1 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-medium text-white ring-1 ring-white/15 transition hover:bg-white/15"
        >
          <RefreshCw className="h-4 w-4" /> Try again
        </button>
      )}
    </div>
  )
}

export function OfflineScreen({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-6 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white/5 ring-1 ring-white/10">
        <WifiOff className="h-9 w-9 text-slate-300" />
      </div>
      <h2 className="text-xl font-bold text-white">No internet connection</h2>
      <p className="max-w-sm text-sm text-slate-400">
        You&apos;re offline. Check your connection and tap retry to load live matches again.
      </p>
      <button
        onClick={onRetry}
        className="inline-flex items-center gap-2 rounded-full bg-emerald-500/20 px-5 py-2.5 text-sm font-semibold text-emerald-200 ring-1 ring-emerald-500/40 transition hover:bg-emerald-500/30"
      >
        <RefreshCw className="h-4 w-4" /> Retry
      </button>
    </div>
  )
}
