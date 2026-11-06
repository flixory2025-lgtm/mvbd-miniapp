"use client"

import { useEffect, useState } from "react"
import type { ImgHTMLAttributes } from "react"

/**
 * Poster that loads from your own /public folder first.
 * If that file is missing (or src is empty) it asks /api/poster (TMDB -> MyDramaList)
 * and shows that poster instead. Results are cached in localStorage.
 */

export const POSTER_PLACEHOLDER = "/placeholder.svg"

type PosterOpts = {
  src?: string | null
  title: string
  year?: number | string
  genre?: string
  mediaType?: string
  tmdbId?: number | string
  tmdbType?: "movie" | "tv"
}

const CACHE_PREFIX = "mvbd-poster:v1:"
const TTL_FOUND = 7 * 24 * 3600 * 1000
const TTL_MISS = 12 * 3600 * 1000

/** undefined = nothing cached, "" = looked up but nothing found, string = poster url */
function readCache(key: string): string | undefined {
  if (typeof window === "undefined") return undefined
  try {
    const raw = window.localStorage.getItem(CACHE_PREFIX + key)
    if (!raw) return undefined
    const { u, t } = JSON.parse(raw) as { u: string; t: number }
    if (Date.now() - t > (u ? TTL_FOUND : TTL_MISS)) {
      window.localStorage.removeItem(CACHE_PREFIX + key)
      return undefined
    }
    return u
  } catch {
    return undefined
  }
}

function writeCache(key: string, url: string) {
  if (typeof window === "undefined") return
  try {
    window.localStorage.setItem(CACHE_PREFIX + key, JSON.stringify({ u: url, t: Date.now() }))
  } catch {
    /* storage full / blocked: ignore */
  }
}

// many cards can ask for the same poster at once: share one request
const inflight = new Map<string, Promise<string | null>>()

function fetchPoster(key: string, o: PosterOpts): Promise<string | null> {
  const existing = inflight.get(key)
  if (existing) return existing

  const params = new URLSearchParams()
  params.set("title", o.title)
  if (o.year !== undefined && o.year !== "") params.set("year", String(o.year))
  if (o.genre) params.set("genre", o.genre)
  if (o.mediaType) params.set("mediaType", o.mediaType)
  if (o.tmdbId !== undefined && o.tmdbId !== "") params.set("tmdbId", String(o.tmdbId))
  if (o.tmdbType) params.set("tmdbType", o.tmdbType)

  const p = fetch(`/api/poster?${params.toString()}`)
    .then((r) => (r.ok ? r.json() : null))
    .then((d) => (d && typeof d.poster === "string" ? (d.poster as string) : null))
    .catch(() => null)
    .finally(() => {
      inflight.delete(key)
    })

  inflight.set(key, p)
  return p
}

const isMissing = (src?: string | null) => !src || src.includes("placeholder")

/** Returns a poster url that is known to work (or the placeholder). */
export function usePosterUrl(o: PosterOpts): string {
  const key = [o.src || "", o.tmdbId ?? "", o.tmdbType || "", o.title, o.year ?? ""].join("|")
  const [url, setUrl] = useState<string>(isMissing(o.src) ? POSTER_PLACEHOLDER : (o.src as string))

  useEffect(() => {
    let alive = true

    const cached = readCache(key)
    if (cached !== undefined) {
      setUrl(cached || POSTER_PLACEHOLDER)
      return
    }

    const lookup = async () => {
      const found = await fetchPoster(key, o)
      writeCache(key, found || "")
      if (alive) setUrl(found || POSTER_PLACEHOLDER)
    }

    if (isMissing(o.src)) {
      setUrl(POSTER_PLACEHOLDER)
      void lookup()
      return () => {
        alive = false
      }
    }

    // local poster: show it, but test that it really loads
    setUrl(o.src as string)
    const probe = new Image()
    probe.onerror = () => {
      void lookup()
    }
    probe.src = o.src as string

    return () => {
      alive = false
      probe.onerror = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])

  return url
}

type PosterImageProps = PosterOpts &
  Omit<ImgHTMLAttributes<HTMLImageElement>, "src"> & { alt?: string }

export default function PosterImage({
  src,
  title,
  year,
  genre,
  mediaType,
  tmdbId,
  tmdbType,
  alt,
  onError,
  ...rest
}: PosterImageProps) {
  const url = usePosterUrl({ src, title, year, genre, mediaType, tmdbId, tmdbType })
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      {...rest}
      src={url}
      alt={alt ?? title}
      onError={(e) => {
        const el = e.currentTarget
        if (!el.src.endsWith(POSTER_PLACEHOLDER)) el.src = POSTER_PLACEHOLDER
        onError?.(e)
      }}
    />
  )
}
