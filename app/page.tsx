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
import { movies, genres } from "@/lib/movie-data"
import { isTelegramWebView } from "@/lib/telegram-utils"

export default function Home() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedGenre, setSelectedGenre] = useState<string | null>(null)
  const [selectedMovie, setSelectedMovie] = useState<(typeof movies)[0] | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [showWelcomePopup, setShowWelcomePopup] = useState(false)
  const [activeTab, setActiveTab] = useState("home")
  const [isSearching, setIsSearching] = useState(false)
  const [showAdultContent, setShowAdultContent] = useState(false)
  const [isTelegramApp, setIsTelegramApp] = useState(false)

  // Detect if running in Telegram Mini App
  useEffect(() => {
    setIsTelegramApp(isTelegramWebView())
    
    // Add Telegram-specific CSS class if in Telegram
    if (isTelegramWebView()) {
      document.body.classList.add('telegram-webview')
    }
  }, [])

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

  const handleMovieClick = (movie: (typeof movies)[0]) => {
    setSelectedMovie(movie)
    
    // Telegram-এ video player modal খুললে scroll position reset করুন
    if (isTelegramApp) {
      window.scrollTo({ top: 0, behavior: 'auto' })
    }
  }

  const renderContent = () => {
    switch (activeTab) {
      case "shorts":
        return <ShortsPage isTelegramApp={isTelegramApp} />
      case "exclusive":
        return <ExclusivePage isTelegramApp={isTelegramApp} />
      case "profile":
        return <ProfilePage />
      default:
        return (
          <div className={`min-h-screen bg-black pb-20 ${isTelegramApp ? 'telegram-safe-area' : ''}`}>
            <Header onSearch={handleSearch} isTelegramApp={isTelegramApp} />

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
                
                {isTelegramApp && (
                  <div className="mt-8 p-4 bg-slate-800/50 rounded-lg">
                    <p className="text-slate-400 text-sm mb-2">📱 Telegram Mini App ব্যবহারের জন্য:</p>
                    <p className="text-slate-300 text-sm">
                      ভিডিও play না হলে, "Open in Browser" অপশনে ক্লিক করে ব্রাউজারে ওপেন করুন
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <>
                {!isSearching && <TrendingCarousel onMovieClick={handleMovieClick} isTelegramApp={isTelegramApp} />}
                {!isSearching && (
                  <GenreCategories
                    genres={genres}
                    selectedGenre={selectedGenre}
                    onGenreSelect={handleGenreSelect}
                    showAdultContent={showAdultContent}
                    isTelegramApp={isTelegramApp}
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
                  onMovieClick={handleMovieClick}
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                  showAdultContent={showAdultContent}
                  isSearching={isSearching}
                  isTelegramApp={isTelegramApp}
                />
              </>
            )}

            <Footer />
          </div>
        )
    }
  }

  return (
    <>
      {/* Telegram-specific notification */}
      {isTelegramApp && (
        <div className="fixed top-0 left-0 right-0 bg-blue-600 text-white text-center py-2 text-sm z-50">
          🔊 Telegram App-এ ভিডিও সরাসরি চালানোর জন্য অপটিমাইজড
        </div>
      )}

      <div className={isTelegramApp ? 'mt-8' : ''}>
        {renderContent()}
      </div>

      <BottomNavigation 
        activeTab={activeTab} 
        onTabChange={setActiveTab} 
        isTelegramApp={isTelegramApp}
      />

      {selectedMovie && activeTab === "home" && (
        <MovieModal
          movie={selectedMovie}
          onClose={() => setSelectedMovie(null)}
          onMovieClick={handleMovieClick}
          showAdultContent={showAdultContent}
          isTelegramApp={isTelegramApp}
        />
      )}

      {showWelcomePopup && <WelcomePopup onClose={handleClosePopup} />}

      {/* Telegram-specific global styles */}
      <style jsx global>{`
        .telegram-webview {
          -webkit-touch-callout: none;
          -webkit-user-select: none;
          user-select: none;
        }
        
        .telegram-safe-area {
          padding-bottom: env(safe-area-inset-bottom, 20px);
        }
        
        /* Improve video player in Telegram */
        iframe {
          max-width: 100%;
        }
        
        /* Optimize for Telegram's webview */
        @media (max-width: 768px) {
          .telegram-webview video,
          .telegram-webview iframe {
            object-fit: contain;
          }
        }
      `}</style>
    </>
  )
}
