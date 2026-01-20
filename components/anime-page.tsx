"use client"

import { useState, useMemo, useEffect } from "react"
import Header from "./header"
import GenreCategories from "./genre-categories"
import MovieGrid from "./movie-grid"
import MovieModal from "./movie-modal"
import Footer from "./footer"
import AnimeTrendingCarousel from "./anime-trending-carousel"
import { animes, animeGenres } from "@/lib/anime-data"
import type { Anime } from "@/lib/anime-data"

export default function AnimePage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedGenre, setSelectedGenre] = useState<string | null>(null)
  const [selectedAnime, setSelectedAnime] = useState<Anime | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [isSearching, setIsSearching] = useState(false)
  const trendingAnimes = animes.slice(0, 5); // Declare trendingAnimes variable

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

    filtered = filtered.sort((a, b) => b.id - a.id)

    return filtered
  }, [searchQuery, selectedGenre])

  const itemsPerPage = 12
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

  const handleAnimeClick = (anime: Anime) => {
    setSelectedAnime(anime)
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setSelectedAnime(null)
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    window.scrollTo(0, 0)
  }

  return (
    <div className="min-h-screen bg-black">
      <Header onSearch={handleSearch} />

      {!isSearching && <AnimeTrendingCarousel onAnimeClick={handleAnimeClick} />}

      {!isSearching && (
        <GenreCategories
          genres={animeGenres}
          selectedGenre={selectedGenre}
          onGenreSelect={handleGenreSelect}
          showAdultContent={false}
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

      {selectedAnime && (
        <MovieModal
          movie={selectedAnime as any}
          isOpen={isModalOpen}
          onClose={handleCloseModal}
        />
      )}

      <Footer />
    </div>
  )
}
