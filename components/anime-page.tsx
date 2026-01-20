"use client"

import { useState, useMemo, useEffect } from "react"
import Header from "./header"
import GenreCategories from "./genre-categories"
import MovieGrid from "./movie-grid"
import MovieModal from "./movie-modal"
import Footer from "./footer"
import { animes, animeGenres } from "@/lib/anime-data"
import type { Anime } from "@/lib/anime-data"

export default function AnimePage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedGenre, setSelectedGenre] = useState<string | null>(null)
  const [selectedAnime, setSelectedAnime] = useState<Anime | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [isSearching, setIsSearching] = useState(false)

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" })
  }, [currentPage])

  const filteredAnimes = useMemo(() => {
    let filtered = animes

    if (searchQuery.trim()) {
      filtered = filtered.filter((anime) =>
        anime.title.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    if (selectedGenre && !searchQuery.trim()) {
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

  const trendingAnimes = animes
    .filter((anime) => [140, 142, 144, 146, 148, 150, 152].includes(anime.id))
    .sort((a, b) => a.id - b.id)

  return (
    <div className="min-h-screen bg-black">
      <Header onSearch={handleSearch} />

      {/* Anime Header Section */}
      <div className="bg-gradient-to-b from-slate-900/50 to-black px-4 py-8 border-b border-slate-800">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-4 mb-6">
            <div className="text-5xl">✨</div>
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">ANIMEVERSE</h1>
              <p className="text-slate-400">Premium anime & series collection</p>
            </div>
          </div>

          {/* Trending Now Section */}
          <div className="mt-8">
            <h2 className="text-2xl font-bold text-white mb-2">Trending Now</h2>
            <p className="text-slate-400 text-sm mb-4">
              {animes.length} anime & series uploaded
            </p>

            {/* Auto Sliding Carousel */}
            <div className="relative group overflow-hidden rounded-lg">
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                {trendingAnimes.map((anime, index) => (
                  <div
                    key={anime.id}
                    className="flex-shrink-0 w-48 h-72 cursor-pointer group/item relative overflow-hidden rounded-lg"
                    onClick={() => handleAnimeClick(anime)}
                  >
                    <img
                      src={anime.poster || "/placeholder.svg"}
                      alt={anime.title}
                      className="w-full h-full object-cover group-hover/item:scale-110 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-black/40 group-hover/item:bg-black/20 transition-colors flex items-end">
                      <div className="p-3 w-full">
                        <p className="text-white font-bold text-sm line-clamp-2">
                          {anime.title}
                        </p>
                        <p className="text-yellow-400 text-xs font-bold">
                          ⭐ {anime.rating}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Category Section */}
      <GenreCategories
        genres={animeGenres}
        selectedGenre={selectedGenre}
        onGenreSelect={handleGenreSelect}
        showAdultContent={false}
      />

      {/* Anime Grid */}
      <MovieGrid
        movies={paginatedAnimes as any}
        onMovieClick={(anime) => handleAnimeClick(anime as Anime)}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={handlePageChange}
        showAdultContent={false}
        isSearching={isSearching}
      />

      {/* Anime Modal */}
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
