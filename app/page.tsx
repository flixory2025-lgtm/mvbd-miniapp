"use"use client"

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
import SeriesSection from "@/components/series-section"
import ProfilePage from "@/components/profile-page"
import ContactUsPage from "@/components/contact-us-page"
import AboutUsPage from "@/components/about-us-page"
import SettingsPage from "@/components/settings-page"

import { movies, genres } from "@/lib/movie-data"

const tabs = [
  "home",
  "shorts",
  "exclusive",
  "profile",
]

export default function Home() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedGenre, setSelectedGenre] =
    useState<string | null>(null)

  const [selectedMovie, setSelectedMovie] =
    useState<(typeof movies)[0] | null>(null)

  const [currentPage, setCurrentPage] = useState(1)

  const [showWelcomePopup, setShowWelcomePopup] =
    useState(false)

  const [activeTab, setActiveTab] =
    useState("home")

  const [isSearching, setIsSearching] =
    useState(false)

  const [showAdultContent, setShowAdultContent] =
    useState(false)

  const [tabHistory, setTabHistory] =
    useState<string[]>(["home"])

  const [showDetailPage, setShowDetailPage] =
    useState(false)

  const [profileSubPage, setProfileSubPage] =
    useState<
      "main" | "contact" | "about" | "settings"
    >("main")

  /*
   * ---------------------------------------------------------
   * SWIPE STATE
   * ---------------------------------------------------------
   */

  const [dragX, setDragX] = useState(0)
  const [isSwiping, setIsSwiping] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)

  const touchStartX = useRef(0)
  const touchStartY = useRef(0)

  const lastX = useRef(0)
  const lastTime = useRef(0)

  const velocityX = useRef(0)

  const pointerIdRef = useRef<number | null>(null)

  const trackRef = useRef<HTMLDivElement>(null)

  /*
   * ---------------------------------------------------------
   * ACTIVE INDEX
   * ---------------------------------------------------------
   */

  const activeIndex = Math.max(
    0,
    tabs.indexOf(activeTab)
  )

  /*
   * ---------------------------------------------------------
   * PAGE HISTORY
   * ---------------------------------------------------------
   */

  useEffect(() => {
    const handlePopState = () => {
      setTabHistory((history) => {
        if (history.length <= 1) {
          return history
        }

        const newHistory =
          history.slice(0, -1)

        const previousTab =
          newHistory[newHistory.length - 1]

        setActiveTab(previousTab)

        return newHistory
      })
    }

    window.addEventListener(
      "popstate",
      handlePopState
    )

    return () => {
      window.removeEventListener(
        "popstate",
        handlePopState
      )
    }
  }, [])

  /*
   * ---------------------------------------------------------
   * TAB CHANGE
   * ---------------------------------------------------------
   */

  const handleTabChange = (
    newTab: string,
    addHistory = true
  ) => {
    if (!tabs.includes(newTab)) return

    if (newTab === activeTab) return

    setIsAnimating(true)
    setIsSwiping(false)
    setDragX(0)

    setActiveTab(newTab)

    if (addHistory) {
      setTabHistory((previous) => [
        ...previous,
        newTab,
      ])

      window.history.pushState(
        null,
        "",
        ""
      )
    }

    if (newTab !== "profile") {
      setProfileSubPage("main")
    }

    window.setTimeout(() => {
      setIsAnimating(false)
    }, 520)
  }

  /*
   * ---------------------------------------------------------
   * SWIPE START
   * ---------------------------------------------------------
   */

  const handlePointerDown = (
    event: React.PointerEvent<HTMLDivElement>
  ) => {
    /*
     * শুধু primary pointer
     */
    if (event.pointerType === "mouse" && event.button !== 0) {
      return
    }

    /*
     * Detail page থাকলে swipe বন্ধ
     */
    if (showDetailPage) return

    touchStartX.current = event.clientX
    touchStartY.current = event.clientY

    lastX.current = event.clientX
    lastTime.current = performance.now()

    velocityX.current = 0

    pointerIdRef.current = event.pointerId

    setIsSwiping(false)
    setDragX(0)
  }

  /*
   * ---------------------------------------------------------
   * SWIPE MOVE
   * ---------------------------------------------------------
   */

  const handlePointerMove = (
    event: React.PointerEvent<HTMLDivElement>
  ) => {
    if (
      pointerIdRef.current !== event.pointerId
    ) {
      return
    }

    if (showDetailPage) return

    const deltaX =
      event.clientX -
      touchStartX.current

    const deltaY =
      event.clientY -
      touchStartY.current

    /*
     * Vertical scrolling হলে swipe takeover করবে না।
     */
    if (
      !isSwiping &&
      Math.abs(deltaY) > Math.abs(deltaX) &&
      Math.abs(deltaY) > 8
    ) {
      pointerIdRef.current = null
      return
    }

    /*
     * ছোট movement ignore
     */
    if (
      !isSwiping &&
      Math.abs(deltaX) < 8
    ) {
      return
    }

    setIsSwiping(true)

    /*
     * প্রথম page থেকে আর বামে যাবে না
     * শেষ page থেকে আর ডানে যাবে না
     */
    let resistance = 1

    if (
      (activeIndex === 0 && deltaX > 0) ||
      (activeIndex === tabs.length - 1 &&
        deltaX < 0)
    ) {
      resistance = 0.28
    }

    const adjustedX =
      deltaX * resistance

    setDragX(adjustedX)

    /*
     * Velocity calculation
     */
    const now = performance.now()
    const dt = now - lastTime.current

    if (dt > 0) {
      velocityX.current =
        (event.clientX - lastX.current) /
        dt
    }

    lastX.current = event.clientX
    lastTime.current = now

    /*
     * Browser-এর native horizontal gesture
     * interfere না করার জন্য preventDefault
     */
    if (event.cancelable) {
      event.preventDefault()
    }
  }

  /*
   * ---------------------------------------------------------
   * SWIPE END
   * ---------------------------------------------------------
   */

  const handlePointerUp = (
    event: React.PointerEvent<HTMLDivElement>
  ) => {
    if (
      pointerIdRef.current !== event.pointerId
    ) {
      return
    }

    pointerIdRef.current = null

    if (!isSwiping) {
      setDragX(0)
      return
    }

    const screenWidth =
      window.innerWidth

    const distance =
      event.clientX -
      touchStartX.current

    /*
     * 20% screen drag করলে page change হবে।
     */
    const threshold =
      screenWidth * 0.20

    /*
     * Fast flick support
     */
    const fastSwipe =
      Math.abs(velocityX.current) > 0.55

    let nextIndex = activeIndex

    if (
      (distance < -threshold || velocityX.current < -0.55) &&
      activeIndex < tabs.length - 1
    ) {
      nextIndex = activeIndex + 1
    } else if (
      (distance > threshold || velocityX.current > 0.55) &&
      activeIndex > 0
    ) {
      nextIndex = activeIndex - 1
    }

    setIsSwiping(false)

    /*
     * New page
     */
    if (nextIndex !== activeIndex) {
      setDragX(0)

      handleTabChange(
        tabs[nextIndex],
        true
      )
    } else {
      /*
       * একই page-এ ফিরে যাবে
       */
      setIsAnimating(true)
      setDragX(0)

      window.setTimeout(() => {
        setIsAnimating(false)
      }, 420)
    }
  }

  const handlePointerCancel = () => {
    pointerIdRef.current = null

    if (isSwiping) {
      setIsSwiping(false)
      setIsAnimating(true)
      setDragX(0)

      window.setTimeout(() => {
        setIsAnimating(false)
      }, 420)
    }
  }

  /*
   * ---------------------------------------------------------
   * WELCOME POPUP
   * ---------------------------------------------------------
   */

  useEffect(() => {
    const hasVisited =
      localStorage.getItem("mvbd_visited")

    if (!hasVisited) {
      setShowWelcomePopup(true)
    }
  }, [])

  const handleClosePopup = () => {
    localStorage.setItem(
      "mvbd_visited",
      "true"
    )

    setShowWelcomePopup(false)
  }

  /*
   * ---------------------------------------------------------
   * SEARCH
   * ---------------------------------------------------------
   */

  const filteredMovies = useMemo(() => {
    let filtered = movies

    if (searchQuery.trim()) {
      filtered = filtered.filter((movie) =>
        movie.title
          .toLowerCase()
          .includes(
            searchQuery.toLowerCase()
          )
      )
    }

    if (
      selectedGenre &&
      !searchQuery.trim()
    ) {
      filtered = filtered.filter((movie) =>
        movie.genre.includes(
          selectedGenre
        )
      )
    }

    filtered = [...filtered].sort(
      (a, b) => b.id - a.id
    )

    return filtered
  }, [
    searchQuery,
    selectedGenre,
  ])

  const itemsPerPage = 30

  const totalPages =
    Math.ceil(
      filteredMovies.length /
        itemsPerPage
    )

  const paginatedMovies =
    filteredMovies.slice(
      (currentPage - 1) *
        itemsPerPage,
      currentPage *
        itemsPerPage
    )

  const handleSearch = (
    query: string
  ) => {
    setSearchQuery(query)
    setCurrentPage(1)
    setIsSearching(
      query.trim().length > 0
    )
  }

  const handleGenreSelect = (
    genre: string | null
  ) => {
    setSelectedGenre(genre)
    setCurrentPage(1)
    setShowAdultContent(
      genre === "Adult"
    )
  }

  /*
   * ---------------------------------------------------------
   * HOME PAGE
   * ---------------------------------------------------------
   */

  const renderHomePage = () => (
    <div className="min-h-screen bg-black pb-20">
      <Header
        onSearch={handleSearch}
        pageType="home"
        searchData={movies}
      />

      {searchQuery.trim() &&
      filteredMovies.length === 0 ? (
        <div className="px-4 py-12 text-center">
          <p className="text-lg text-slate-300 mb-6">
            আমরা দুঃখিত! এই নামের কোনো মুভি
            আমাদের কালেকশনে নেই
          </p>

          <div className="flex gap-4 justify-center flex-wrap">
            <a
              href="https://www.facebook.com/groups/733950559669339/?ref=share&mibextid=NSMWBT"
              target="_blank"
              rel="noopener noreferrer"
              className="
                px-6
                py-2
                bg-blue-600
                hover:bg-blue-700
                text-white
                rounded-lg
                transition
              "
            >
              Facebook Group
            </a>

            <a
              href="https://t.me/moviesversebdreq"
              target="_blank"
              rel="noopener noreferrer"
              className="
                px-6
                py-2
                bg-sky-500
                hover:bg-sky-600
                text-white
                rounded-lg
                transition
              "
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

  /*
   * ---------------------------------------------------------
   * PROFILE PAGE
   * ---------------------------------------------------------
   */

  const renderProfilePage = () => (
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

  /*
   * ---------------------------------------------------------
   * PAGE TRACK POSITION
   * ---------------------------------------------------------
   *
   * Example:
   *
   * Home = 0
   * Anime = 1
   * Series = 2
   * Profile = 3
   *
   * dragX = -100px হলে:
   *
   * Home → 100px left
   * Anime → 100px left
   *
   * একদম real-time.
   */

  const trackTransform = `
    translate3d(
      calc(-${activeIndex * 100}vw + ${dragX}px),
      0,
      0
    )
  `

  /*
   * Bottom navigation indicator position
   */
  const swipePosition =
    activeIndex -
    dragX /
      Math.max(
        1,
        typeof window !== "undefined"
          ? window.innerWidth
          : 390
      )

  return (
    <div className="w-full min-h-screen bg-black">
      {showDetailPage &&
      selectedMovie ? (
        <MovieDetailPage
          movie={selectedMovie}
          onBack={() => {
            setShowDetailPage(false)
            setSelectedMovie(null)
          }}
          onMovieClick={(movie) =>
            setSelectedMovie(movie)
          }
          showAdultContent={
            showAdultContent
          }
        />
      ) : (
        <>
          {/* =================================================
              SWIPE VIEWPORT
              ================================================= */}

          <div
            className="
              mvbd-swipe-viewport
              w-full
              min-h-screen
            "
          >
            <div
              ref={trackRef}
              className={`
                mvbd-page-track
                ${isAnimating ? "is-animating" : ""}
              `}
              style={{
                transform: trackTransform,
              }}
              onPointerDown={
                handlePointerDown
              }
              onPointerMove={
                handlePointerMove
              }
              onPointerUp={
                handlePointerUp
              }
              onPointerCancel={
                handlePointerCancel
              }
              onLostPointerCapture={
                handlePointerCancel
              }
            >
              {/* HOME */}
              <section className="mvbd-page">
                {renderHomePage()}
              </section>

              {/* ANIME */}
              <section className="mvbd-page">
                <div className="min-h-screen bg-black pb-20">
                  <AnimePage />
                </div>
              </section>

              {/* SERIES */}
              <section className="mvbd-page">
                <div className="min-h-screen bg-black pb-20">
                  <SeriesSection />
                </div>
              </section>

              {/* PROFILE */}
              <section className="mvbd-page">
                {renderProfilePage()}
              </section>
            </div>
          </div>

          {/* =================================================
              BOTTOM NAVIGATION
              ================================================= */}

          <BottomNavigation
            activeTab={activeTab}
            onTabChange={handleTabChange}
            swipePosition={swipePosition}
            isSwiping={isSwiping}
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
