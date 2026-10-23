"use client"

import { useState, useMemo, useEffect } from "react"
import Header from "./header"
import GenreCategories, { normalizeLanguage, isSeries } from "./genre-categories"
import MovieGrid from "./movie-grid"
import Footer from "./footer"
import AnimeTrendingCarousel from "./anime-trending-carousel"
import { animes, animeGenres } from "@/lib/anime-data"
import type { Anime } from "@/lib/anime-data"

interface AnimePageProps {
  onAnimeClick?: (anime: Anime) => void
}

export default function AnimePage({ onAnimeClick }: AnimePageProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedGenre, setSelectedGenre] = useState<string | null>(null)
  const [selectedYear, setSelectedYear] = useState("All")
  const [selectedRating, setSelectedRating] = useState("All")
  const [selectedLanguage, setSelectedLanguage] = useState("All")
  const [selectedType, setSelectedType] = useState("All")
  const [currentPage, setCurrentPage] = useState(1)
  const [isSearching, setIsSearching] = useState(false)
  const trendingAnimes = animes.slice(0, 5)

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" })
  }, [currentPage])

  const filteredAnimes = useMemo(() => {
    let filtered = animes

    if (searchQuery.trim()) {
      filtered = filtered.filter((anime) =>
        anime.title.toLowerCase().includes(searchQuery.toLowerCase())
      )
      return filtered
    }

    if (selectedGenre) {
      filtered = filtered.filter((anime) =>
        anime.genre.toLowerCase().includes(selectedGenre.toLowerCase())
      )
    }

    if (selectedYear !== "All") {
      filtered = filtered.filter(
        (anime: any) => String(anime.year ?? "").trim() === selectedYear
      )
    }

    if (selectedRating !== "All") {
      const min = parseFloat(selectedRating)
      filtered = filtered.filter((anime: any) => {
        const r = parseFloat(String(anime.rating ?? ""))
        return !isNaN(r) && r >= min
      })
    }

    if (selectedLanguage !== "All") {
      filtered = filtered.filter(
        (anime: any) =>
          anime.language &&
          normalizeLanguage(String(anime.language)) === selectedLanguage
      )
    }

    if (selectedType !== "All") {
      filtered = filtered.filter((anime) =>
        selectedType === "Series" ? isSeries(anime.title) : !isSeries(anime.title)
      )
    }

    // sort() original array mutate kore, tai copy kore sort kora holo
    return [...filtered].sort((a, b) => b.id - a.id)
  }, [searchQuery, selectedGenre, selectedYear, selectedRating, selectedLanguage, selectedType])

  const itemsPerPage = 30
  const totalPages = Math.ceil(filteredAnimes.length / itemsPerPage)
  const paginatedAnimes = filteredAnimes.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  const handleSearch = (query: string) => {
    setSearchQuery(query)
    setCurrentPage(1)
    setIsSearching(query.trim().length > 0)
  }

  const handleGenreSelect = (genre: string | null) => {
    setSelectedGenre(genre)
    setCurrentPage(1)
    setSearchQuery("")
  }

  const handleFilterChange = (filters: {
    year?: string
    rating?: string
    language?: string
    type?: string
  }) => {
    if (filters.year !== undefined) setSelectedYear(filters.year)
    if (filters.rating !== undefined) setSelectedRating(filters.rating)
    if (filters.language !== undefined) setSelectedLanguage(filters.language)
    if (filters.type !== undefined) setSelectedType(filters.type)
    setCurrentPage(1)
    setSearchQuery("")
  }

  const handleAnimeClick = (anime: Anime) => {
    onAnimeClick?.(anime)
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    window.scrollTo(0, 0)
  }

  return (
    <div className="bg-black">
      <Header
        onSearch={handleSearch}
        searchQuery={searchQuery}
        pageType="anime"
        searchData={animes}
      />

      {!isSearching && <AnimeTrendingCarousel onAnimeClick={handleAnimeClick} />}

      {!isSearching && (
        <GenreCategories
          genres={animeGenres}
          selectedGenre={selectedGenre}
          onGenreSelect={handleGenreSelect}
          showAdultContent={false}
          items={animes}
          selectedYear={selectedYear}
          selectedRating={selectedRating}
          selectedLanguage={selectedLanguage}
          selectedType={selectedType}
          onFilterChange={handleFilterChange}
        />
      )}

      <MovieGrid
        movies={paginatedAnimes as any}
        onMovieClick={(anime) => handleAnimeClick(anime as Anime)}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={handlePageChange}
        showAdultContent={false}
        isSearching={isSearching}
      />

      <Footer />
    </div>
  )
}
