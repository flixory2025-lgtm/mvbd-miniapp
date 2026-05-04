dhd"use client"

import { useState, useMemo } from "react"
import Header from "@/components/header"
import TrendingCarousel from "@/components/trending-carousel"
import MovieGrid from "@/components/movie-grid"
import MovieModal from "@/components/movie-modal"
import GenreCategories from "@/components/genre-categories"
import { movies, genres } from "@/lib/movie-data"

export default function SeriesSection() {
  const [selectedMovie, setSelectedMovie] = useState<(typeof movies)[0] | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedGenre, setSelectedGenre] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [isSearching, setIsSearching] = useState(false)

  // Filter movies that contain "season" in title (series)
  const allSeries = useMemo(() => {
    return movies.filter((m) => m.title.toLowerCase().includes("season"))
  }, [])

  // Filter series based on search and genre
  const filteredSeries = useMemo(() => {
    return allSeries.filter((series) => {
      const matchesSearch = series.title.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesGenre =
        selectedGenre === null ||
        selectedGenre === "All" ||
        series.genre.toLowerCase().includes(selectedGenre.toLowerCase())
      return matchesSearch && matchesGenre
    })
  }, [allSeries, searchQuery, selectedGenre])

  // Trending series IDs (customizable)
  const trendingSeriesIds = useMemo(() => {
    return allSeries.slice(0, 12).map((s) => s.id)
  }, [allSeries])

  const trendingSeries = useMemo(() => {
    return allSeries.filter((s) => trendingSeriesIds.includes(s.id))
  }, [allSeries, trendingSeriesIds])

  const handleSearch = (query: string) => {
    setSearchQuery(query)
    setIsSearching(query.trim().length > 0)
    setCurrentPage(1)
  }

  const handleGenreSelect = (genre: string | null) => {
    setSelectedGenre(genre)
    setCurrentPage(1)
  }

  // Pagination
  const itemsPerPage = 10
  const totalPages = Math.ceil(filteredSeries.length / itemsPerPage)
  const paginatedMovies = filteredSeries.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  return (
    <div className="min-h-screen bg-black pb-20">
      <style>{`
        @keyframes movieFlicker {
          0%, 100% {
            opacity: 0.15;
          }
          50% {
            opacity: 0.25;
          }
        }

        .series-header-background {
          position: relative;
          overflow: hidden;
          background: linear-gradient(135deg, rgba(0, 0, 0, 0.8), rgba(20, 20, 40, 0.6));
          padding: 40px 20px;
          margin-bottom: 30px;
        }

        .series-background-animation {
          position: absolute;
          inset: 0;
          opacity: 0.1;
          pointer-events: none;
        }

        .series-background-animation video {
          width: 100%;
          height: 100%;
          object-fit: cover;
          animation: movieFlicker 4s ease-in-out infinite;
        }

        .series-header-content {
          position: relative;
          z-index: 10;
          text-align: center;
        }

        .series-title {
          font-size: 3.5rem;
          font-weight: 900;
          background: linear-gradient(135deg, #64c8ff 0%, #22c55e 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          margin: 0;
          letter-spacing: -1px;
        }

        @media (max-width: 768px) {
          .series-title {
            font-size: 2.5rem;
          }
        }

        .trending-section {
          margin-top: 40px;
          margin-bottom: 30px;
        }

        .trending-label {
          font-size: 1.5rem;
          font-weight: 700;
          color: white;
          margin-bottom: 16px;
          padding-left: 16px;
          text-transform: uppercase;
          letter-spacing: 1px;
        }
      `}</style>

      {/* Header with Search */}
      <Header onSearch={handleSearch} />

      {/* Series Header Background */}
      <div className="series-header-background">
        <div className="series-header-content">
          <h1 className="series-title">Web Series & TV Shows</h1>
          <p className="text-cyan-300 text-lg mt-4">Explore {allSeries.length} amazing series</p>
        </div>
      </div>

      {/* No Results */}
      {searchQuery.trim() && filteredSeries.length === 0 && (
        <div className="px-4 py-12 text-center">
          <p className="text-lg text-slate-300 mb-6">আমরা দুঃখিত! এই নামের কোনো সিরিজ আমাদের কালেকশনে নেই</p>
        </div>
      )}

      {/* Main Content */}
      {filteredSeries.length > 0 && (
        <>
          {/* Trending Now */}
          {!isSearching && trendingSeries.length > 0 && (
            <div className="trending-section">
              <div className="trending-label">Trending Now</div>
              <TrendingCarousel onMovieClick={setSelectedMovie} />
            </div>
          )}

          {/* Genre Categories */}
          {!isSearching && genres.length > 0 && (
            <GenreCategories
              genres={genres}
              selectedGenre={selectedGenre}
              onGenreSelect={handleGenreSelect}
            />
          )}

          {/* Search Results Header */}
          {isSearching && (
            <div className="px-4 pt-4">
              <h2 className="text-xl font-bold text-white mb-2">সার্চ রেজাল্ট: "{searchQuery}"</h2>
              <p className="text-slate-400 text-sm mb-4">{filteredSeries.length} টি সিরিজ পাওয়া গেছে</p>
            </div>
          )}

          {/* Movie Grid */}
          <MovieGrid
            movies={paginatedMovies}
            onMovieClick={setSelectedMovie}
            currentPage={currentPage}
            onPageChange={setCurrentPage}
            totalPages={totalPages}
          />
        </>
      )}

      {/* Movie Modal */}
      {selectedMovie && (
        <MovieModal
          movie={selectedMovie}
          onClose={() => setSelectedMovie(null)}
        />
      )}
    </div>
  )
}
