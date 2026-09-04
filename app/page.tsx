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
import { movies, genres } from "@/lib/movie-data"

const SWIPE_TABS = ["home", "shorts", "exclusive", "profile"]

const SWIPE_THRESHOLD = 70
const SWIPE_VELOCITY = 0.35

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
  const [profileSubPage, setProfileSubPage] = useState<
    "main" | "contact" | "about" | "settings"
  >("main")

  /* =========================================================
     LIQUID SWIPE SYSTEM
     ========================================================= */

  const swipeViewportRef = useRef<HTMLDivElement>(null)

  const touchStartX = useRef(0)
  const touchStartY = useRef(0)
  const touchCurrentX = useRef(0)
  const touchStartTime = useRef(0)

  const isDragging = useRef(false)
  const horizontalGesture = useRef(false)

  const [swipeOffset, setSwipeOffset] = useState(0)
  const [isSwiping, setIsSwiping] = useState(false)

  const activeIndex = Math.max(0, SWIPE_TABS.indexOf(activeTab))

  const canSwipe =
    !showDetailPage &&
    profileSubPage === "main"

  /* =========================================================
     PAGE / TAB CHANGE
     ========================================================= */

  const changeTab = (newTab: string, addHistory = true) => {
    if (!SWIPE_TABS.includes(newTab)) return
    if (newTab === activeTab) return

    if (addHistory) {
      setTabHistory((prev) => [...prev, newTab])
      window.history.pushState(null, "", "")
    }

    setActiveTab(newTab)

    if (newTab !== "profile") {
      setProfileSubPage("main")
    }

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    })
  }

  const handleTabChange = (newTab: string) => {
    const newIndex = SWIPE_TABS.indexOf(newTab)

    if (newIndex === -1 || newIndex === activeIndex) return

    const direction = newIndex > activeIndex ? -1 : 1

    /*
      Give button navigation the same liquid movement feeling
      as swipe navigation.
    */
    setIsSwiping(true)
    setSwipeOffset(direction * window.innerWidth * 0.18)

    requestAnimationFrame(() => {
      setSwipeOffset(direction * window.innerWidth)
    })

    window.setTimeout(() => {
      changeTab(newTab)
      setSwipeOffset(0)

      window.setTimeout(() => {
        setIsSwiping(false)
      }, 30)
    }, 300)
  }

  /* =========================================================
     TOUCH START
     ========================================================= */

  const handleTouchStart = (event: React.TouchEvent<HTMLDivElement>) => {
    if (!canSwipe) return

    const touch = event.touches[0]

    touchStartX.current = touch.clientX
    touchStartY.current = touch.clientY
    touchCurrentX.current = touch.clientX
    touchStartTime.current = performance.now()

    isDragging.current = true
    horizontalGesture.current = false

    setIsSwiping(true)
  }

  /* =========================================================
     TOUCH MOVE
     ========================================================= */

  const handleTouchMove = (event: React.TouchEvent<HTMLDivElement>) => {
    if (!isDragging.current || !canSwipe) return

    const touch = event.touches[0]

    const deltaX = touch.clientX - touchStartX.current
    const deltaY = touch.clientY - touchStartY.current

    touchCurrentX.current = touch.clientX

    /*
      Determine whether this is horizontal swipe
      or normal vertical scrolling.
    */
    if (!horizontalGesture.current) {
      if (Math.abs(deltaX) < 8 && Math.abs(deltaY) < 8) {
        return
      }

      if (Math.abs(deltaY) > Math.abs(deltaX)) {
        isDragging.current = false
        setIsSwiping(false)
        setSwipeOffset(0)
        return
      }

      horizontalGesture.current = true
    }

    if (!horizontalGesture.current) return

    event.preventDefault()

    let adjustedDelta = deltaX

    /*
      Add resistance when user tries to swipe beyond
      first/last page.
    */
    if (
      (activeIndex === 0 && deltaX > 0) ||
      (activeIndex === SWIPE_TABS.length - 1 && deltaX < 0)
    ) {
      adjustedDelta = deltaX * 0.28
    }

    /*
      Small resistance makes the movement feel more like
      a physical liquid surface.
    */
    adjustedDelta =
      adjustedDelta *
      (1 - Math.min(Math.abs(adjustedDelta) / (window.innerWidth * 2), 0.35))

    setSwipeOffset(adjustedDelta)
  }

  /* =========================================================
     TOUCH END
     ========================================================= */

  const handleTouchEnd = () => {
    if (!isDragging.current) return

    isDragging.current = false

    if (!horizontalGesture.current) {
      setIsSwiping(false)
      setSwipeOffset(0)
      return
    }

    const deltaX = touchCurrentX.current - touchStartX.current
    const elapsed = Math.max(
      performance.now() - touchStartTime.current,
      1
    )

    const velocity = Math.abs(deltaX) / elapsed

    const shouldChange =
      Math.abs(deltaX) > SWIPE_THRESHOLD ||
      velocity > SWIPE_VELOCITY

    /*
      Swipe LEFT
      current -> next
    */
    if (
      shouldChange &&
      deltaX < 0 &&
      activeIndex < SWIPE_TABS.length - 1
    ) {
      setSwipeOffset(-window.innerWidth)

      window.setTimeout(() => {
        changeTab(SWIPE_TABS[activeIndex + 1])
        setSwipeOffset(0)

        window.setTimeout(() => {
          setIsSwiping(false)
        }, 30)
      }, 280)

      horizontalGesture.current = false
      return
    }

    /*
      Swipe RIGHT
      current -> previous
    */
    if (
      shouldChange &&
      deltaX > 0 &&
      activeIndex > 0
    ) {
      setSwipeOffset(window.innerWidth)

      window.setTimeout(() => {
        changeTab(SWIPE_TABS[activeIndex - 1])
        setSwipeOffset(0)

        window.setTimeout(() => {
          setIsSwiping(false)
        }, 30)
      }, 280)

      horizontalGesture.current = false
      return
    }

    /*
      Not enough movement:
      liquid spring-back
    */
    setSwipeOffset(0)

    window.setTimeout(() => {
      setIsSwiping(false)
    }, 320)

    horizontalGesture.current = false
  }

  /* =========================================================
     BROWSER BACK
     ========================================================= */

  useEffect(() => {
    const handlePopState = () => {
      setTabHistory((prev) => {
        if (prev.length <= 1) {
          return prev
        }

        const newHistory = prev.slice(0, -1)
        const previousTab = newHistory[newHistory.length - 1]

        setActiveTab(previousTab)

        if (previousTab !== "profile") {
          setProfileSubPage("main")
        }

        setSwipeOffset(0)

        return newHistory
      })
    }

    window.addEventListener("popstate", handlePopState)

    return () => {
      window.removeEventListener("popstate", handlePopState)
    }
  }, [])

  /* =========================================================
     CURRENT PAGE SCROLL
     ========================================================= */

  useEffect(() => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    })
  }, [currentPage])

  /* =========================================================
     WELCOME POPUP
     ========================================================= */

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

  /* =========================================================
     MOVIE FILTER
     ========================================================= */

  const filteredMovies = useMemo(() => {
    let filtered = movies

    if (searchQuery.trim()) {
      filtered = filtered.filter((movie) =>
        movie.title
          .toLowerCase()
          .includes(searchQuery.toLowerCase())
      )
    }

    if (selectedGenre && !searchQuery.trim()) {
      filtered = filtered.filter((movie) =>
        movie.genre.includes(selectedGenre)
      )
    }

    return [...filtered].sort((a, b) => b.id - a.id)
  }, [searchQuery, selectedGenre])

  const itemsPerPage = 30

  const totalPages = Math.ceil(
    filteredMovies.length / itemsPerPage
  )

  const paginatedMovies = filteredMovies.slice(
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
    setShowAdultContent(genre === "Adult")
  }

  /* =========================================================
     HOME CONTENT
     ========================================================= */

  const renderHomeContent = () => {
    return (
      <div className="min-h-screen bg-black pb-20">
        <Header
          onSearch={handleSearch}
          pageType="home"
          searchData={movies}
        />

        {searchQuery.trim() && filteredMovies.length === 0 ? (
          <div className="px-4 py-12 text-center">
            <p className="text-lg text-slate-300 mb-6">
              আমরা দুঃখিত! এই নামের কোনো মুভি আমাদের কালেকশনে নেই
            </p>

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
                <h2 className="text-xl font-bold text-white mb-2">
                  সার্চ রেজাল্ট: "{searchQuery}"
                </h2>

                <p className="text-slate-400 text-sm mb-4">
                  {filteredMovies.length} টি মুভি পাওয়া গেছে
                </p>
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
    )
  }

  /* =========================================================
     INDIVIDUAL TAB CONTENT
     ========================================================= */

  const renderTabContent = (tab: string) => {
    switch (tab) {
      case "shorts":
        return (
          <div className="min-h-screen bg-black pb-20">
            <AnimePage />
          </div>
        )

      case "exclusive":
        return (
          <div className="min-h-screen bg-black pb-20">
            <SeriesSection />
          </div>
        )

      case "profile":
        return (
          <div className="min-h-screen bg-black pb-20">
            {profileSubPage === "main" && (
              <ProfilePage
                onNavigate={(page) =>
                  setProfileSubPage(page)
                }
              />
            )}

            {profileSubPage === "contact" && (
              <ContactUsPage
                onBack={() =>
                  setProfileSubPage("main")
                }
              />
            )}

            {profileSubPage === "about" && (
              <AboutUsPage
                onBack={() =>
                  setProfileSubPage("main")
                }
              />
            )}

            {profileSubPage === "settings" && (
              <SettingsPage
                onBack={() =>
                  setProfileSubPage("main")
                }
              />
            )}

            <Footer />
          </div>
        )

      case "home":
      default:
        return renderHomeContent()
    }
  }

  /* =========================================================
     SWIPE PAGES
     ========================================================= */

  const previousTab =
    activeIndex > 0
      ? SWIPE_TABS[activeIndex - 1]
      : null

  const nextTab =
    activeIndex < SWIPE_TABS.length - 1
      ? SWIPE_TABS[activeIndex + 1]
      : null

  /*
    We render previous/current/next so the neighboring page
    is actually visible while dragging.
  */
  const swipePages = [
    previousTab,
    activeTab,
    nextTab,
  ]

  const pageTranslate =
    `calc(-100% + ${swipeOffset}px)`

  /* =========================================================
     RENDER
     ========================================================= */

  return (
    <div className="w-full min-h-screen bg-black">
      {showDetailPage && selectedMovie ? (
        <MovieDetailPage
          movie={selectedMovie}
          onBack={() => {
            setShowDetailPage(false)
            setSelectedMovie(null)
          }}
          onMovieClick={(movie) =>
            setSelectedMovie(movie)
          }
          showAdultContent={showAdultContent}
        />
      ) : (
        <>
          {/* =================================================
              LIVE SWIPE VIEWPORT
             ================================================= */}

          <div
            ref={swipeViewportRef}
            className="relative w-full overflow-x-hidden overflow-y-visible"
            style={{
              touchAction: canSwipe
                ? "pan-y"
                : "auto",
              overscrollBehaviorX: "none",
            }}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onTouchCancel={handleTouchEnd}
          >
            <div
              className="flex w-full"
              style={{
                width: "300%",
                transform: `translate3d(${pageTranslate}, 0, 0)`,

                /*
                  No transition while finger is dragging.
                  Smooth spring-like transition after release.
                */
                transition: isSwiping
                  ? isDragging.current
                    ? "none"
                    : "transform 420ms cubic-bezier(0.22, 1, 0.36, 1)"
                  : "none",

                willChange: "transform",
              }}
            >
              {swipePages.map((tab, index) => (
                <div
                  key={`${tab || "empty"}-${index}`}
                  className="w-1/3 min-w-0 shrink-0"
                  style={{
                    /*
                      Slight visual depth during swipe.
                    */
                    transform:
                      isSwiping && tab
                        ? `scale(${
                            index === 1
                              ? 1
                              : 0.985
                          })`
                        : "scale(1)",

                    transition:
                      "transform 420ms cubic-bezier(0.22, 1, 0.36, 1)",
                  }}
                >
                  {tab
                    ? renderTabContent(tab)
                    : (
                      <div className="min-h-screen bg-black" />
                    )}
                </div>
              ))}
            </div>
          </div>

          {/* =================================================
              BOTTOM LIQUID NAVIGATION
             ================================================= */}

          <BottomNavigation
            activeTab={activeTab}
            onTabChange={handleTabChange}
          />

          {/* =================================================
              WELCOME POPUP
             ================================================= */}

          {showWelcomePopup && (
            <WelcomePopup
              onClose={handleClosePopup}
            />
          )}
        </>
      )}
    </div>
  )
          }
