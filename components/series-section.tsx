"use client"

import { useState, useMemo, useEffect } from "react"
import Header from "@/components/header"
import MovieGrid from "@/components/movie-grid"
import MovieModal from "@/components/movie-modal"
import GenreCategories from "@/components/genre-categories"
import { movies, genres } from "@/lib/movie-data"

// Swiper import for slideshow
import Swiper from 'swiper'
import 'swiper/css'

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

  // Trending series (first 15 from all series)
  const trendingSeries = useMemo(() => {
    return allSeries.slice(0, 15)
  }, [allSeries])

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
  const itemsPerPage = 30
  const totalPages = Math.ceil(filteredSeries.length / itemsPerPage)
  const paginatedMovies = filteredSeries.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  // Initialize Swiper for trending slider
  useEffect(() => {
    if (!isSearching && trendingSeries.length > 0) {
      const swiperElement = document.querySelector('#trendingSwiper')
      if (swiperElement && !(swiperElement as any).swiper) {
        new Swiper('#trendingSwiper', {
          slidesPerView: 'auto',
          spaceBetween: 16,
          loop: true,
          autoplay: {
            delay: 3000,
            disableOnInteraction: false,
            pauseOnMouseEnter: true,
          },
          speed: 800,
          freeMode: false,
          breakpoints: {
            320: {
              slidesPerView: 2.2,
              spaceBetween: 12,
            },
            480: {
              slidesPerView: 2.5,
            },
            640: {
              slidesPerView: 3.2,
            },
            768: {
              slidesPerView: 4.2,
            },
            1024: {
              slidesPerView: 5.2,
            },
            1280: {
              slidesPerView: 6.2,
            }
          },
          touchRatio: 1,
          resistance: true,
          resistanceRatio: 0.85,
        })
      }
    }

    // Cleanup function
    return () => {
      const swiperElement = document.querySelector('#trendingSwiper')
      if (swiperElement && (swiperElement as any).swiper) {
        (swiperElement as any).swiper.destroy(true, true)
      }
    }
  }, [isSearching, trendingSeries.length])

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

        /* Trending Section New Styles */
        .trending-wrapper {
          margin: 40px 0 30px;
        }

        .trending-title-center {
          text-align: center;
          margin-bottom: 2rem;
        }

        .trending-title-animated {
          font-size: 2.2rem;
          font-weight: 800;
          background: linear-gradient(135deg, #ffd89b, #c7e9fb, #22c55e);
          background-size: 200% auto;
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
          display: inline-block;
          animation: shine 3s ease-in-out infinite, subtleGlow 2s ease-in-out infinite alternate;
          letter-spacing: 2px;
          text-transform: uppercase;
        }

        @keyframes shine {
          0% {
            background-position: 0% center;
          }
          100% {
            background-position: 200% center;
          }
        }

        @keyframes subtleGlow {
          0% {
            text-shadow: 0 0 2px rgba(34, 197, 94, 0.3);
          }
          100% {
            text-shadow: 0 0 12px rgba(34, 197, 94, 0.7);
          }
        }

        .trending-swiper-container {
          position: relative;
          overflow: hidden;
          padding: 0 20px;
        }

        .trending-swiper-container::before,
        .trending-swiper-container::after {
          content: '';
          position: absolute;
          top: 0;
          bottom: 0;
          width: 60px;
          z-index: 10;
          pointer-events: none;
        }

        .trending-swiper-container::before {
          left: 0;
          background: linear-gradient(to right, rgba(0, 0, 0, 0.9), rgba(0, 0, 0, 0));
        }

        .trending-swiper-container::after {
          right: 0;
          background: linear-gradient(to left, rgba(0, 0, 0, 0.9), rgba(0, 0, 0, 0));
        }

        .trending-poster-card {
          cursor: pointer;
          border-radius: 12px;
          overflow: hidden;
          transition: all 0.3s ease;
          aspect-ratio: 2 / 3;
          background: #1a1a2e;
          box-shadow: 0 10px 20px -5px rgba(0, 0, 0, 0.5);
        }

        .trending-poster-card:hover {
          transform: scale(1.05);
          box-shadow: 0 20px 30px -8px black;
        }

        .trending-poster-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.4s;
        }

        .trending-poster-card:hover .trending-poster-img {
          transform: scale(1.02);
        }

        .poster-overlay {
          position: absolute;
          inset: 0;
          background: rgba(0, 0, 0, 0.6);
          display: flex;
          align-items: center;
          justify-content: center;
          opacity: 0;
          transition: opacity 0.3s;
        }

        .trending-poster-card:hover .poster-overlay {
          opacity: 1;
        }

        .poster-overlay p {
          color: white;
          font-weight: 600;
          text-align: center;
          padding: 0 8px;
          font-size: 0.85rem;
        }

        @media (max-width: 640px) {
          .trending-swiper-container::before,
          .trending-swiper-container::after {
            width: 30px;
          }
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
          {/* Trending Now - New Slider Section */}
          {!isSearching && trendingSeries.length > 0 && (
            <div className="trending-wrapper">
              <div className="trending-title-center">
                <h2 className="trending-title-animated">✦ Trending Now ✦</h2>
              </div>
              <div className="trending-swiper-container">
                <div className="swiper trending-swiper" id="trendingSwiper">
                  <div className="swiper-wrapper">
                    {trendingSeries.map((series) => (
                      <div className="swiper-slide" key={series.id}>
                        <div
                          className="trending-poster-card relative"
                          onClick={() => setSelectedMovie(series)}
                        >
                          <img
                            src={series.poster}
                            alt={series.title}
                            className="trending-poster-img"
                            loading="lazy"
                          />
                          <div className="poster-overlay">
                            <p>{series.title}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
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
