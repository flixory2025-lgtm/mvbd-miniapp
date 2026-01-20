"use client"

import { useState, useMemo } from "react"
import Header from "./header"
import GenreCategories from "./genre-categories"
import MovieGrid from "./movie-grid"
import MovieModal from "./movie-modal"
import Footer from "./footer"
import { movies, genres } from "@/lib/movie-data"
import type { Movie } from "@/lib/movie-data"

export default function ExclusivePage() {
  const [selectedGenre, setSelectedGenre] = useState<string | null>(null)
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)

  const filteredMovies = useMemo(() => {
    if (!selectedGenre) return movies
    return movies.filter((movie) =>
      movie.genre.toLowerCase().includes(selectedGenre.toLowerCase())
    )
  }, [selectedGenre])

  const moviesPerPage = 12
  const totalPages = Math.ceil(filteredMovies.length / moviesPerPage)
  const paginatedMovies = filteredMovies.slice(
    (currentPage - 1) * moviesPerPage,
    currentPage * moviesPerPage
  )

  const handleMovieClick = (movie: Movie) => {
    setSelectedMovie(movie)
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setSelectedMovie(null)
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    window.scrollTo(0, 0)
  }

  return (
    <div className="min-h-screen bg-black">
      <Header />
      <GenreCategories
        genres={genres}
        selectedGenre={selectedGenre}
        onGenreSelect={setSelectedGenre}
        showAdultContent={false}
      />
      <MovieGrid
        movies={paginatedMovies}
        onMovieClick={handleMovieClick}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={handlePageChange}
        showAdultContent={false}
        isSearching={false}
      />
      {selectedMovie && (
        <MovieModal
          movie={selectedMovie}
          isOpen={isModalOpen}
          onClose={handleCloseModal}
        />
      )}
      <Footer />
    </div>
  )
}
