"use client"

import { useState, useMemo, useEffect } from "react"
import Header from "@/components/header"
import TrendingCarousel from "@/components/trending-carousel"
import GenreCategories from "@/components/genre-categories"
import MovieGrid from "@/components/movie-grid"
import MovieModal from "@/components/movie-modal"
import Footer from "@/components/footer"
import WelcomePopup from "@/components/welcome-popup"
import BottomNavigation from "@/components/bottom-navigation"
import ShortsPage from "@/components/shorts-page"
import ExclusivePage from "@/components/exclusive-page"
import ProfilePage from "@/components/profile-page"
import Snowfall from "@/components/snowfall"
import { movies, genres } from "@/lib/movie-data"

export default function Home() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedGenre, setSelectedGenre] = useState<string | null>(null)
  const [selectedMovie, setSelectedMovie] = useState<(typeof movies)[0] | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [showWelcomePopup, setShowWelcomePopup] = useState(false)
  const [activeTab, setActiveTab] = useState("home")
  const [isSearching, setIsSearching] = useState(false)
  const [showAdultContent, setShowAdultContent] = useState(false)

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" })
  }, [currentPage])

  useEffect(() => {
    const hasVisited = localStorage.getItem("mvbd_visited")
    if (!hasVisited) {
      setShowWelcomePopup(true)
    }
  }, [])

  const handleClosePopup = () => {
    localStorage.setItem("mvbd_visited", "true")
    setShowWelcomePopup(false)
  }

  const filteredMovies = useMemo(() => {
    let filtered = movies

    if (searchQuery.trim()) {
      filtered = filtered.filter((movie) => movie.title.toLowerCase().includes(searchQuery.toLowerCase()))
    }

    if (selectedGenre && !searchQuery.trim()) {
      filtered = filtered.filter((movie) => movie.genre.includes(selectedGenre))
    }

    filtered = filtered.sort((a, b) => b.id - a.id)

    return filtered
  }, [searchQuery, selectedGenre])

  const itemsPerPage = 30
  const totalPages = Math.ceil(filteredMovies.length / itemsPerPage)
  const paginatedMovies = filteredMovies.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  const handleSearch = (query: string) => {
    setSearchQuery(query)
    setCurrentPage(1)
    setIsSearching(query.trim().length > 0)
  }

  const handleGenreSelect = (genre: string | null) => {
    setSelectedGenre(genre)
    setCurrentPage(1)
    setShowAdultContent(genre === "Adult")
  }

  const renderContent = () => {
    switch (activeTab) {
      case "shorts":
        return (
          <div className="relative min-h-screen">
            <ShortsPage />
          </div>
        )
      case "exclusive":
        return (
          <div className="relative min-h-screen">
            <ExclusivePage />
          </div>
        )
      case "profile":
        return (
          <div className="relative min-h-screen">
            <ProfilePage />
          </div>
        )
      default:
        return (
          <>
            {/* Header with higher z-index */}
            <div className="relative z-30 bg-black">
              <Header onSearch={handleSearch} />
            </div>
            
            {/* Main content area with Snowfall */}
            <div className="relative bg-black min-h-screen">
              {/* Snowfall only in this area - starts below header */}
              <div className="absolute inset-0 pointer-events-none">
                <Snowfall />
              </div>
              
              {/* Main content */}
              <div className="relative z-20">
                {searchQuery.trim() && filteredMovies.length === 0 ? (
                  <div className="px-4 py-12 text-center pt-20">
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
                    {!isSearching && (
                      <>
                        <div className="pt-4">
                          <TrendingCarousel onMovieClick={setSelectedMovie} />
                        </div>
                        <GenreCategories
                          genres={genres}
                          selectedGenre={selectedGenre}
                          onGenreSelect={handleGenreSelect}
                          showAdultContent={showAdultContent}
                        />
                      </>
                    )}

                    {isSearching && (
                      <div className="px-4 pt-20">
                        <h2 className="text-xl font-bold text-white mb-2">সার্চ রেজাল্ট: "{searchQuery}"</h2>
                        <p className="text-slate-400 text-sm mb-4">{filteredMovies.length} টি মুভি পাওয়া গেছে</p>
                      </div>
                    )}

                    <MovieGrid
                      movies={paginatedMovies}
                      onMovieClick={setSelectedMovie}
                      currentPage={currentPage}
                      totalPages={totalPages}
                      onPageChange={setCurrentPage}
                      showAdultContent={showAdultContent}
                      isSearching={isSearching}
                    />
                  </>
                )}

                <Footer />
              </div>
            </div>
          </>
        )
    }
  }

  return (
    <>
      {renderContent()}

      <BottomNavigation activeTab={activeTab} onTabChange={setActiveTab} />

      {selectedMovie && activeTab === "home" && (
        <MovieModal
          movie={selectedMovie}
          onClose={() => setSelectedMovie(null)}
          onMovieClick={setSelectedMovie}
          showAdultContent={showAdultContent}
        />
      )}

      {showWelcomePopup && <WelcomePopup onClose={handleClosePopup} />}
    </>
  )
}
