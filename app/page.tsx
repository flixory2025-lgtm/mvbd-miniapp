"use client"

import { useState, useMemo, useEffect, useRef } from "react"
import Header from "@/components/header"
import TrendingCarousel from "@/components/trending-carousel"
import GenreCategories from "@/components/genre-categories"
import MovieGrid from "@/components/movie-grid"
import MovieDetailPage from "@/components/movie-detail-page"
import Footer from "@/components/footer"
import WelcomePopup from "@/components/welcome-popup"
import BottomNavigation from "@/components/bottom-navigation"
import AnimePage from "@/components/anime-page"
import ExclusivePage from "@/components/exclusive-page"
import ProfilePage from "@/components/profile-page"
import ShortsPage from "@/components/shorts-page"
import SeriesSection from "@/components/series-section"
import ContactUsPage from "@/components/contact-us-page"
import AboutUsPage from "@/components/about-us-page"
import SettingsPage from "@/components/settings-page"
import MatchesPage from "@/components/matches/matches-page"
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
  const [tabHistory, setTabHistory] = useState<string[]>(["home"])
  const [showDetailPage, setShowDetailPage] = useState(false)
  const [profileSubPage, setProfileSubPage] = useState<"main" | "contact" | "about" | "settings">("main")
  
  const mainContentRef = useRef<HTMLDivElement>(null)

  const tabs = ["home", "anime", "series", "exclusive", "shorts", "matches", "profile"]

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" })
  }, [currentPage])

  useEffect(() => {
    const hasVisited = localStorage.getItem("mvbd_visited")
    if (!hasVisited) {
      setShowWelcomePopup(true)
    }
  }, [])

  useEffect(() => {
    const handlePopState = () => {
      if (tabHistory.length > 1) {
        const newHistory = tabHistory.slice(0, -1)
        setTabHistory(newHistory)
        setActiveTab(newHistory[newHistory.length - 1])
      }
    }

    window.addEventListener("popstate", handlePopState)
    return () => window.removeEventListener("popstate", handlePopState)
  }, [tabHistory])

  const handleTabChange = (newTab: string) => {
    if (newTab !== activeTab) {
      setTabHistory([...tabHistory, newTab])
      setActiveTab(newTab)
      window.history.pushState(null, "", "")
      // Reset profile sub-page when leaving profile tab
      if (newTab !== "profile") {
        setProfileSubPage("main")
      }
    }
  }

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
          <>
            <AnimePage />
          </>
        )
      case "exclusive":
        return (
          <>
            <SeriesSection />
          </>
        )
      case "matches":
        return <MatchesPage />
      case "profile":
          return (
            <>
              {profileSubPage === "main" && (
                <ProfilePage onNavigate={(page) => setProfileSubPage(page)} />
              )}
              {profileSubPage === "contact" && (
                <ContactUsPage onBack={() => setProfileSubPage("main")} />
              )}
              {profileSubPage === "about" && (
                <AboutUsPage onBack={() => setProfileSubPage("main")} />
              )}
              {profileSubPage === "settings" && (
                <SettingsPage onBack={() => setProfileSubPage("main")} />
              )}
              <Footer />
            </>
          )
        default:
          return (
            <>
            <div className="min-h-screen bg-black pb-20">
              <Header onSearch={handleSearch} pageType="home" searchData={movies} />

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
                  {!isSearching && (
                    <TrendingCarousel
                      onMovieClick={(movie) => {
                        setSelectedMovie(movie)
                        setShowDetailPage(true)
                      }}
                    />
                  )}
                  {!isSearching && (
                    <GenreCategories
                      genres={genres}
                      selectedGenre={selectedGenre}
                      onGenreSelect={handleGenreSelect}
                      showAdultContent={showAdultContent}
                    />
                  )}

                  {isSearching && (
                    <div className="px-4 pt-4">
                      <h2 className="text-xl font-bold text-white mb-2">সার্চ রেজাল্ট: "{searchQuery}"</h2>
                      <p className="text-slate-400 text-sm mb-4">{filteredMovies.length} টি মুভি পাওয়া গেছে</p>
                    </div>
                  )}

                  <MovieGrid
                    movies={paginatedMovies}
                    onMovieClick={(movie) => {
                      setSelectedMovie(movie)
                      setShowDetailPage(true)
                    }}
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
          </>
        )
    }
  }

  return (
    <div 
      ref={mainContentRef}
      className="w-full"
    >
      {showDetailPage && selectedMovie ? (
        <MovieDetailPage
          movie={selectedMovie}
          onBack={() => {
            setShowDetailPage(false)
            setSelectedMovie(null)
          }}
          onMovieClick={(movie) => setSelectedMovie(movie)}
          showAdultContent={showAdultContent}
        />
      ) : (
        <>
          {renderContent()}

          <BottomNavigation activeTab={activeTab} onTabChange={handleTabChange} />

          {showWelcomePopup && <WelcomePopup onClose={handleClosePopup} />}
        </>
      )}
    </div>
  )
}
