"use client"

import { useState, useEffect } from "react"

export interface FavoriteItem {
  id: string
  type: "cricket" | "football"
  name: string
}

export function useFavorites() {
  const [favorites, setFavorites] = useState<FavoriteItem[]>([])

  useEffect(() => {
    // লোকাল স্টোরেজ থেকে ফেভারিট লোড করবে
    const saved = localStorage.getItem("favorites")
    if (saved) {
      setFavorites(JSON.parse(saved))
    }
  }, [])

  const addFavorite = (item: FavoriteItem) => {
    const newFavorites = [...favorites, item]
    setFavorites(newFavorites)
    localStorage.setItem("favorites", JSON.stringify(newFavorites))
  }

  const removeFavorite = (id: string) => {
    const newFavorites = favorites.filter(f => f.id !== id)
    setFavorites(newFavorites)
    localStorage.setItem("favorites", JSON.stringify(newFavorites))
  }

  const isFavorite = (id: string) => {
    return favorites.some(f => f.id === id)
  }

  return { favorites, addFavorite, removeFavorite, isFavorite }
}
