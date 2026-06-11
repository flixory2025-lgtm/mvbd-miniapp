"use client"

import useSWR from "swr"
import type {
  FootballMatch,
  CricketMatch,
  MatchStatus,
  FootballStanding,
  FootballTopScorer,
} from "./types"

export const LIVE_REFRESH_MS = 30_000 // auto-refresh live data every 30s

async function fetcher(url: string) {
  const res = await fetch(url)
  const json = await res.json().catch(() => ({}))
  if (!res.ok) {
    const err = new Error(json?.error || `Request failed (${res.status})`) as Error & { status?: number }
    err.status = res.status
    throw err
  }
  return json
}

// ---------------- Football hooks ----------------

export function useFootballMatches(status: MatchStatus) {
  const { data, error, isLoading, mutate } = useSWR<{ data: FootballMatch[] }>(
    `/api/football/matches?status=${status}`,
    fetcher,
    {
      refreshInterval: status === "live" ? LIVE_REFRESH_MS : 0,
      revalidateOnFocus: status === "live",
      keepPreviousData: true,
    },
  )
  return { matches: data?.data ?? [], error, isLoading, refresh: mutate }
}

export function useFootballFixture(id: string | null) {
  const { data, error, isLoading, mutate } = useSWR<{ data: any }>(
    id ? `/api/football/fixture/${id}` : null,
    fetcher,
    { refreshInterval: LIVE_REFRESH_MS, keepPreviousData: true },
  )
  return { detail: data?.data ?? null, error, isLoading, refresh: mutate }
}

export function useFootballStandings(league: string, season?: string) {
  const key = `/api/football/standings?league=${league}${season ? `&season=${season}` : ""}`
  const { data, error, isLoading } = useSWR<{ data: { standings: FootballStanding[]; league: any } }>(key, fetcher, {
    keepPreviousData: true,
  })
  return { standings: data?.data?.standings ?? [], league: data?.data?.league ?? null, error, isLoading }
}

export function useFootballTopScorers(league: string, season?: string) {
  const key = `/api/football/topscorers?league=${league}${season ? `&season=${season}` : ""}`
  const { data, error, isLoading } = useSWR<{ data: FootballTopScorer[] }>(key, fetcher, { keepPreviousData: true })
  return { scorers: data?.data ?? [], error, isLoading }
}

// ---------------- Cricket hooks ----------------

export function useCricketMatches(status: MatchStatus) {
  const { data, error, isLoading, mutate } = useSWR<{ data: CricketMatch[] }>(
    `/api/cricket/matches?status=${status}`,
    fetcher,
    {
      refreshInterval: status === "live" ? LIVE_REFRESH_MS : 0,
      revalidateOnFocus: status === "live",
      keepPreviousData: true,
    },
  )
  return { matches: data?.data ?? [], error, isLoading, refresh: mutate }
}

export function useCricketScorecard(id: string | null) {
  const { data, error, isLoading, mutate } = useSWR<{ data: any }>(
    id ? `/api/cricket/match/${id}` : null,
    fetcher,
    { refreshInterval: LIVE_REFRESH_MS, keepPreviousData: true },
  )
  return { scorecard: data?.data ?? null, error, isLoading, refresh: mutate }
}

export function useCricketSeries() {
  const { data, error, isLoading } = useSWR<{ data: any[] }>("/api/cricket/series", fetcher, {
    keepPreviousData: true,
  })
  return { series: data?.data ?? [], error, isLoading }
}
