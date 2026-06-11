"use client"

import { useCallback, useEffect, useState } from "react"

const KEY = "mvbd_sports_favorites"

export interface FavoriteItem {
  id: string
  type: "football-team" | "football-league" | "cricket-team" | "cricket-series"
  name: string
  logo?: string
}

function read(): FavoriteItem[] {
  if (typeof window === "undefined") return []
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]")
  } catch {
    return []
  }
}

export function useFavorites() {
  const [favorites, setFavorites] = useState<FavoriteItem[]>([])

  useEffect(() => {
    setFavorites(read())
    const onStorage = (e: StorageEvent) => {
      if (e.key === KEY) setFavorites(read())
    }
    window.addEventListener("storage", onStorage)
    return () => window.removeEventListener("storage", onStorage)
  }, [])

  const persist = useCallback((next: FavoriteItem[]) => {
    setFavorites(next)
    localStorage.setItem(KEY, JSON.stringify(next))
  }, [])

  const isFavorite = useCallback((id: string) => favorites.some((f) => f.id === id), [favorites])

  const toggleFavorite = useCallback(
    (item: FavoriteItem) => {
      const exists = favorites.some((f) => f.id === item.id)
      persist(exists ? favorites.filter((f) => f.id !== item.id) : [...favorites, item])
    },
    [favorites, persist],
  )

  return { favorites, isFavorite, toggleFavorite }
}
