"use client"

import { useState, useMemo } from "react"
import Header from "@/components/header"
import TrendingCarousel from "@/components/trending-carousel"
import GenreCategories from "@/components/genre-categories"
import MovieGrid from "@/components/movie-grid"
import MovieModal from "@/components/movie-modal"
import Footer from "@/components/footer"
import { movies, genres } from "@/lib/movie-data"

export default function Home() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedGenre, setSelectedGenre] = useState<string | null>(null)
  const [selectedMovie, setSelectedMovie] = useState<(typeof movies)[0] | null>(null)
  const [currentPage, setCurrentPage] = useState(1)

  const filteredMovies = useMemo(() => {
    let filtered = movies

    if (searchQuery.trim()) {
      filtered = filtered.filter((movie) => movie.title.toLowerCase().includes(searchQuery.toLowerCase()))
    }

    if (selectedGenre) {
      filtered = filtered.filter((movie) => movie.genres.includes(selectedGenre))
    }

    return filtered
  }, [searchQuery, selectedGenre])

  const itemsPerPage = 30
  const totalPages = Math.ceil(filteredMovies.length / itemsPerPage)
  const paginatedMovies = filteredMovies.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  const handleSearch = (query: string) => {
    setSearchQuery(query)
    setCurrentPage(1)
  }

  const handleGenreSelect = (genre: string | null) => {
    setSelectedGenre(genre)
    setCurrentPage(1)
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
      <Header onSearch={handleSearch} />

      {searchQuery.trim() && filteredMovies.length === 0 ? (
        <div className="px-4 py-12 text-center">
          <p className="text-lg text-slate-300 mb-6">আমরা দুঃখিত! এই নামের কোনো মুভি আমাদের কালেকশনে নেই</p>
          <div className="flex gap-4 justify-center flex-wrap">
            <a
              href="https://www.facebook.com/groups/733950559669339/?ref=share&mibextid=NSMWBT"
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
            >
              Facebook Group
            </a>
            <a
              href="https://t.me/moviesversebdreq"
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-2 bg-sky-500 hover:bg-sky-600 text-white rounded-lg transition"
            >
              Telegram Group
            </a>
          </div>
        </div>
      ) : (
        <>
          {!searchQuery && <TrendingCarousel />}
          <GenreCategories genres={genres} selectedGenre={selectedGenre} onGenreSelect={handleGenreSelect} />
          <MovieGrid
            movies={paginatedMovies}
            onMovieClick={setSelectedMovie}
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </>
      )}

      <Footer />

      {selectedMovie && <MovieModal movie={selectedMovie} onClose={() => setSelectedMovie(null)} />}
    </div>
  )
}
