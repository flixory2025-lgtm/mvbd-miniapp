"use client"

import { useState, useMemo, useEffect, useRef } from "react"
import Header from "@/components/header"
import TrendingCarousel from "@/components/trending-carousel"
import GenreCategories from "@/components/genre-categories"
import MovieGrid from "@/components/movie-grid"
import MovieModal from "@/components/movie-modal"
import Footer from "@/components/footer"
import WelcomePopup from "@/components/welcome-popup"
import BottomNavigation from "@/components/bottom-navigation"
import AnimePage from "@/components/anime-page"
import ExclusivePage from "@/components/exclusive-page"
import ProfilePage from "@/components/profile-page"
import ShortsPage from "@/components/shorts-page"
import SeriesSection from "@/components/series-section"
import { movies, genres } from "@/lib/movie-data"
import ContactUsPage from "@/components/contact-us-page"
import AboutUsPage from "@/components/about-us-page"
import SettingsPage from "@/components/settings-page"
import UniversalFooter from "@/components/universal-footer"

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
  const [profileSubTab, setProfileSubTab] = useState<"profile" | "contact" | "about" | "settings">("profile")
  const [slideDirection, setSlideDirection] = useState<"left" | "right" | "none">("none")
  const contentRef = useRef<HTMLDivElement>(null)

  // Swipe detection for profile sub-pages
  const handleProfileSwipeLeft = () => {
    if (profileSubTab === "profile") {
      setSlideDirection("left")
      setTimeout(() => setProfileSubTab("contact"), 150)
    } else if (profileSubTab === "contact") {
      setSlideDirection("left")
      setTimeout(() => setProfileSubTab("about"), 150)
    } else if (profileSubTab === "about") {
      setSlideDirection("left")
      setTimeout(() => setProfileSubTab("settings"), 150)
    }
  }

  const handleProfileSwipeRight = () => {
    if (profileSubTab === "contact") {
      setSlideDirection("right")
      setTimeout(() => setProfileSubTab("profile"), 150)
    } else if (profileSubTab === "about") {
      setSlideDirection("right")
      setTimeout(() => setProfileSubTab("contact"), 150)
    } else if (profileSubTab === "settings") {
      setSlideDirection("right")
      setTimeout(() => setProfileSubTab("about"), 150)
    }
  }

  // Navigation tab swipe handling
  const handleNavSwipeLeft = () => {
    const tabs = ["home", "shorts", "exclusive", "profile"]
    const currentIndex = tabs.indexOf(activeTab)
    if (currentIndex < tabs.length - 1) {
      handleTabChange(tabs[currentIndex + 1])
    }
  }

  const handleNavSwipeRight = () => {
    const tabs = ["home", "shorts", "exclusive", "profile"]
    const currentIndex = tabs.indexOf(activeTab)
    if (currentIndex > 0) {
      handleTabChange(tabs[currentIndex - 1])
    }
  }

  // Profile sub-page swipe (only when on profile page)
  const profileSwipeHandlers = activeTab === "profile" ? {
    onSwipeLeft: handleProfileSwipeLeft,
    onSwipeRight: handleProfileSwipeRight,
  } : {
    onSwipeLeft: handleNavSwipeLeft,
    onSwipeRight: handleNavSwipeRight,
  }

  useSwipe({
    ...profileSwipeHandlers,
    threshold: 50,
  })

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
      case "profile":
        return (
          <div
            ref={contentRef}
            className={`transition-all duration-300 ${
              slideDirection === "left"
                ? "animate-slideOut"
                : slideDirection === "right"
                  ? "animate-slideInRight"
                  : "animate-slideInLeft"
            }`}
          >
            {profileSubTab === "profile" && (
              <ProfilePage
                onNavigateContact={() => {
                  setSlideDirection("left")
                  setTimeout(() => setProfileSubTab("contact"), 150)
                }}
                onNavigateAbout={() => {
                  setSlideDirection("left")
                  setTimeout(() => setProfileSubTab("about"), 150)
                }}
                onNavigateSettings={() => {
                  setSlideDirection("left")
                  setTimeout(() => setProfileSubTab("settings"), 150)
                }}
              />
            )}
            {profileSubTab === "contact" && (
              <div>
                <button
                  onClick={() => {
                    setSlideDirection("right")
                    setTimeout(() => setProfileSubTab("profile"), 150)
                  }}
                  className="fixed top-4 left-4 z-50 text-white bg-black/50 px-4 py-2 rounded-lg hover:bg-black/70 transition"
                >
                  ← Back
                </button>
                <ContactUsPage />
              </div>
            )}
            {profileSubTab === "about" && (
              <div>
                <button
                  onClick={() => {
                    setSlideDirection("right")
                    setTimeout(() => setProfileSubTab("contact"), 150)
                  }}
                  className="fixed top-4 left-4 z-50 text-white bg-black/50 px-4 py-2 rounded-lg hover:bg-black/70 transition"
                >
                  ← Back
                </button>
                <AboutUsPage />
              </div>
            )}
            {profileSubTab === "settings" && (
              <div>
                <button
                  onClick={() => {
                    setSlideDirection("right")
                    setTimeout(() => setProfileSubTab("about"), 150)
                  }}
                  className="fixed top-4 left-4 z-50 text-white bg-black/50 px-4 py-2 rounded-lg hover:bg-black/70 transition"
                >
                  ← Back
                </button>
                <SettingsPage />
              </div>
            )}
            <UniversalFooter />

            <style jsx>{`
              @keyframes slideOut {
                from {
                  opacity: 1;
                  transform: translateX(0);
                }
                to {
                  opacity: 0;
                  transform: translateX(-100%);
                }
              }

              @keyframes slideInLeft {
                from {
                  opacity: 0;
                  transform: translateX(100%);
                }
                to {
                  opacity: 1;
                  transform: translateX(0);
                }
              }

              @keyframes slideInRight {
                from {
                  opacity: 0;
                  transform: translateX(-100%);
                }
                to {
                  opacity: 1;
                  transform: translateX(0);
                }
              }

              .animate-slideOut {
                animation: slideOut 0.3s ease-out;
              }

              .animate-slideInLeft {
                animation: slideInLeft 0.3s ease-out;
              }

              .animate-slideInRight {
                animation: slideInRight 0.3s ease-out;
              }
            `}</style>
          </div>
        )
      default:
        return (
          <>
            <div className="min-h-screen bg-black pb-20">
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
                  {!isSearching && <TrendingCarousel onMovieClick={setSelectedMovie} />}
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
          </>
        )
    }
  }

  return (
    <>
      {renderContent()}

      <BottomNavigation activeTab={activeTab} onTabChange={handleTabChange} />

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
