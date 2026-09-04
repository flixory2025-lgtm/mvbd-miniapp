"use client"

import {
  useState,
  useMemo,
  useEffect,
  useRef,
} from "react"

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
] as const

type TabId = (typeof tabs)[number]

export default function Home() {
  /* =========================================================
     BASIC STATE
     ========================================================= */

  const [searchQuery, setSearchQuery] = useState("")
  const [selectedGenre, setSelectedGenre] =
    useState<string | null>(null)

  const [selectedMovie, setSelectedMovie] =
    useState<(typeof movies)[0] | null>(null)

  const [currentPage, setCurrentPage] = useState(1)

  const [showWelcomePopup, setShowWelcomePopup] =
    useState(false)

  const [activeTab, setActiveTab] =
    useState<TabId>("home")

  const [isSearching, setIsSearching] =
    useState(false)

  const [showAdultContent, setShowAdultContent] =
    useState(false)

  const [tabHistory, setTabHistory] =
    useState<TabId[]>(["home"])

  const [showDetailPage, setShowDetailPage] =
    useState(false)

  const [profileSubPage, setProfileSubPage] =
    useState<
      "main" | "contact" | "about" | "settings"
    >("main")

  /* =========================================================
     SWIPE STATE
     ========================================================= */

  const [dragX, setDragX] = useState(0)
  const [isSwiping, setIsSwiping] =
    useState(false)

  const [isAnimating, setIsAnimating] =
    useState(false)

  /*
   * IMPORTANT:
   * window.innerWidth সরাসরি render-এর সময় ব্যবহার করছি না।
   * ফলে Next.js SSR / prerender-এ "window is not defined"
   * error হবে না।
   */
  const [viewportWidth, setViewportWidth] =
    useState(390)

  const swipeStartX = useRef(0)
  const swipeStartY = useRef(0)

  const lastX = useRef(0)
  const lastTime = useRef(0)

  const velocityX = useRef(0)

  const pointerIdRef =
    useRef<number | null>(null)

  const animationTimerRef =
    useRef<ReturnType<typeof setTimeout> | null>(
      null
    )

  /* =========================================================
     VIEWPORT WIDTH
     ========================================================= */

  useEffect(() => {
    const updateWidth = () => {
      setViewportWidth(
        Math.max(1, window.innerWidth)
      )
    }

    updateWidth()

    window.addEventListener(
      "resize",
      updateWidth
    )

    return () => {
      window.removeEventListener(
        "resize",
        updateWidth
      )
    }
  }, [])

  /* =========================================================
     CLEANUP ANIMATION TIMER
     ========================================================= */

  useEffect(() => {
    return () => {
      if (animationTimerRef.current) {
        clearTimeout(
          animationTimerRef.current
        )
      }
    }
  }, [])

  /* =========================================================
     ACTIVE INDEX
     ========================================================= */

  const activeIndex = Math.max(
    0,
    tabs.indexOf(activeTab)
  )

  /* =========================================================
     BROWSER BACK BUTTON
     ========================================================= */

  useEffect(() => {
    const handlePopState = () => {
      setTabHistory((history) => {
        if (history.length <= 1) {
          return history
        }

        const newHistory =
          history.slice(0, -1)

        const previousTab =
          newHistory[
            newHistory.length - 1
          ]

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

  /* =========================================================
     PROTECTED SWIPE AREA
     =========================================================
     
     TrendingCarousel-এর ভিতর swipe করলে
     main page swipe বন্ধ থাকবে।
     ========================================================= */

  const isInsideProtectedSwipeArea = (
    target: EventTarget | null
  ) => {
    if (!(target instanceof Element)) {
      return false
    }

    return Boolean(
      target.closest(
        "[data-no-page-swipe]"
      )
    )
  }

  /* =========================================================
     TAB CHANGE
     ========================================================= */

  const handleTabChange = (
    newTab: string,
    addHistory = true
  ) => {
    if (
      !tabs.includes(
        newTab as TabId
      )
    ) {
      return
    }

    const nextTab =
      newTab as TabId

    if (nextTab === activeTab) {
      return
    }

    if (animationTimerRef.current) {
      clearTimeout(
        animationTimerRef.current
      )
    }

    setIsAnimating(true)
    setIsSwiping(false)
    setDragX(0)

    setActiveTab(nextTab)

    if (addHistory) {
      setTabHistory((previous) => [
        ...previous,
        nextTab,
      ])

      window.history.pushState(
        null,
        "",
        ""
      )
    }

    if (nextTab !== "profile") {
      setProfileSubPage("main")
    }

    animationTimerRef.current =
      setTimeout(() => {
        setIsAnimating(false)
      }, 520)
  }

  /* =========================================================
     POINTER DOWN
     ========================================================= */

  const handlePointerDown = (
    event: React.PointerEvent<HTMLDivElement>
  ) => {
    if (showDetailPage) {
      return
    }

    /*
     * Mouse-এর ক্ষেত্রে শুধু left button
     */
    if (
      event.pointerType === "mouse" &&
      event.button !== 0
    ) {
      return
    }

    /*
     * Trending / protected carousel-এর
     * ভিতর থেকে event এলে page swipe শুরু হবে না।
     */
    if (
      isInsideProtectedSwipeArea(
        event.target
      )
    ) {
      return
    }

    swipeStartX.current =
      event.clientX

    swipeStartY.current =
      event.clientY

    lastX.current =
      event.clientX

    lastTime.current =
      performance.now()

    velocityX.current = 0

    pointerIdRef.current =
      event.pointerId

    setIsSwiping(false)
    setDragX(0)

    /*
     * Finger movement-এর সময় pointer হারিয়ে যাবে না।
     */
    try {
      event.currentTarget.setPointerCapture(
        event.pointerId
      )
    } catch {
      // কিছু browser capture support না করলে
      // swipe তবুও কাজ করবে।
    }
  }

  /* =========================================================
     POINTER MOVE
     ========================================================= */

  const handlePointerMove = (
    event: React.PointerEvent<HTMLDivElement>
  ) => {
    if (
      pointerIdRef.current !==
      event.pointerId
    ) {
      return
    }

    if (showDetailPage) {
      return
    }

    /*
     * Protected carousel হলে main page swipe বন্ধ।
     */
    if (
      isInsideProtectedSwipeArea(
        event.target
      )
    ) {
      return
    }

    const deltaX =
      event.clientX -
      swipeStartX.current

    const deltaY =
      event.clientY -
      swipeStartY.current

    /*
     * Vertical scroll detect.
     */
    if (
      !isSwiping &&
      Math.abs(deltaY) >
        Math.abs(deltaX) &&
      Math.abs(deltaY) > 10
    ) {
      pointerIdRef.current = null

      try {
        event.currentTarget.releasePointerCapture(
          event.pointerId
        )
      } catch {
        // ignore
      }

      return
    }

    /*
     * Tiny movement ignore.
     */
    if (
      !isSwiping &&
      Math.abs(deltaX) < 7
    ) {
      return
    }

    setIsSwiping(true)

    /*
     * Edge resistance.
     */
    let resistance = 1

    if (
      activeIndex === 0 &&
      deltaX > 0
    ) {
      resistance = 0.22
    }

    if (
      activeIndex ===
        tabs.length - 1 &&
      deltaX < 0
    ) {
      resistance = 0.22
    }

    const adjustedX =
      deltaX * resistance

    setDragX(adjustedX)

    /*
     * Velocity calculation.
     */
    const now =
      performance.now()

    const dt =
      now - lastTime.current

    if (dt > 0) {
      velocityX.current =
        (event.clientX -
          lastX.current) /
        dt
    }

    lastX.current =
      event.clientX

    lastTime.current = now

    /*
     * Custom horizontal gesture.
     */
    if (
      event.cancelable
    ) {
      event.preventDefault()
    }
  }

  /* =========================================================
     POINTER END
     ========================================================= */

  const finishSwipe = (
    event: React.PointerEvent<HTMLDivElement>
  ) => {
    if (
      pointerIdRef.current !==
      event.pointerId
    ) {
      return
    }

    pointerIdRef.current = null

    try {
      event.currentTarget.releasePointerCapture(
        event.pointerId
      )
    } catch {
      // ignore
    }

    if (!isSwiping) {
      setDragX(0)
      return
    }

    const distance =
      event.clientX -
      swipeStartX.current

    const threshold =
      viewportWidth * 0.20

    /*
     * Fast flick.
     */
    const fastSwipe =
      Math.abs(
        velocityX.current
      ) > 0.55

    let nextIndex =
      activeIndex

    if (
      (
        distance < -threshold ||
        (
          fastSwipe &&
          velocityX.current < -0.55
        )
      ) &&
      activeIndex <
        tabs.length - 1
    ) {
      nextIndex =
        activeIndex + 1
    } else if (
      (
        distance > threshold ||
        (
          fastSwipe &&
          velocityX.current > 0.55
        )
      ) &&
      activeIndex > 0
    ) {
      nextIndex =
        activeIndex - 1
    }

    setIsSwiping(false)

    /*
     * Page change.
     */
    if (
      nextIndex !== activeIndex
    ) {
      handleTabChange(
        tabs[nextIndex],
        true
      )

      return
    }

    /*
     * Same page-এ smooth return.
     */
    setIsAnimating(true)
    setDragX(0)

    if (animationTimerRef.current) {
      clearTimeout(
        animationTimerRef.current
      )
    }

    animationTimerRef.current =
      setTimeout(() => {
        setIsAnimating(false)
      }, 420)
  }

  const handlePointerUp = (
    event: React.PointerEvent<HTMLDivElement>
  ) => {
    finishSwipe(event)
  }

  const handlePointerCancel = (
    event: React.PointerEvent<HTMLDivElement>
  ) => {
    if (
      pointerIdRef.current !==
      event.pointerId
    ) {
      return
    }

    pointerIdRef.current = null

    try {
      event.currentTarget.releasePointerCapture(
        event.pointerId
      )
    } catch {
      // ignore
    }

    setIsSwiping(false)
    setIsAnimating(true)
    setDragX(0)

    if (animationTimerRef.current) {
      clearTimeout(
        animationTimerRef.current
      )
    }

    animationTimerRef.current =
      setTimeout(() => {
        setIsAnimating(false)
      }, 420)
  }

  /* =========================================================
     WELCOME POPUP
     ========================================================= */

  useEffect(() => {
    const hasVisited =
      localStorage.getItem(
        "mvbd_visited"
      )

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

  /* =========================================================
     SEARCH
     ========================================================= */

  const filteredMovies = useMemo(() => {
    let filtered = movies

    if (searchQuery.trim()) {
      filtered =
        filtered.filter(
          (movie) =>
            movie.title
              .toLowerCase()
              .includes(
                searchQuery
                  .toLowerCase()
              )
        )
    }

    if (
      selectedGenre &&
      !searchQuery.trim()
    ) {
      filtered =
        filtered.filter(
          (movie) =>
            movie.genre.includes(
              selectedGenre
            )
        )
    }

    return [...filtered].sort(
      (a, b) => b.id - a.id
    )
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

  /* =========================================================
     HOME PAGE
     ========================================================= */

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
            /*
             * IMPORTANT:
             * এই wrapper-এর ভিতরের horizontal gesture
             * main page swipe থেকে protected থাকবে।
             */
            <div
              data-no-page-swipe
              className="mvbd-trending-protected"
            >
              <TrendingCarousel
                onMovieClick={(movie) => {
                  setSelectedMovie(movie)
                  setShowDetailPage(true)
                }}
              />
            </div>
          )}

          {!isSearching && (
            <GenreCategories
              genres={genres}
              selectedGenre={
                selectedGenre
              }
              onGenreSelect={
                handleGenreSelect
              }
              showAdultContent={
                showAdultContent
              }
            />
          )}

          {isSearching && (
            <div className="px-4 pt-4">
              <h2 className="text-xl font-bold text-white mb-2">
                সার্চ রেজাল্ট: "{searchQuery}"
              </h2>

              <p className="text-slate-400 text-sm mb-4">
                {filteredMovies.length} টি
                মুভি পাওয়া গেছে
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
            onPageChange={
              setCurrentPage
            }
            showAdultContent={
              showAdultContent
            }
            isSearching={
              isSearching
            }
          />
        </>
      )}

      <Footer />
    </div>
  )

  /* =========================================================
     PROFILE PAGE
     ========================================================= */

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
            setProfileSubPage(
              "main"
            )
          }
        />
      )}

      {profileSubPage === "about" && (
        <AboutUsPage
          onBack={() =>
            setProfileSubPage(
              "main"
            )
          }
        />
      )}

      {profileSubPage === "settings" && (
        <SettingsPage
          onBack={() =>
            setProfileSubPage(
              "main"
            )
          }
        />
      )}

      <Footer />
    </div>
  )

  /* =========================================================
     PAGE CONTENT
     ========================================================= */

  const renderPageContent = (
    tab: TabId
  ) => {
    switch (tab) {
      case "home":
        return renderHomePage()

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
        return renderProfilePage()

      default:
        return renderHomePage()
    }
  }

  /* =========================================================
     PAGE TRACK
     ========================================================= */

  const trackTransform = `translate3d(calc(-${
    activeIndex * 100
  }vw + ${dragX}px), 0, 0)`

  /*
   * Bottom navigation-এর liquid indicator
   * finger-এর সাথে live move করবে।
   */
  const swipePosition =
    activeIndex -
    dragX /
      Math.max(
        1,
        viewportWidth
      )

  /* =========================================================
     RENDER
     ========================================================= */

  return (
    <div className="w-full min-h-screen bg-black overflow-x-hidden">
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
              PAGE SWIPE VIEWPORT
              ================================================= */}

          <div className="mvbd-swipe-viewport">
            <div
              className={`
                mvbd-page-track
                ${
                  isAnimating
                    ? "is-animating"
                    : ""
                }
              `}
              style={{
                transform:
                  trackTransform,
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
                {renderPageContent(
                  "home"
                )}
              </section>

              {/* ANIME */}
              <section className="mvbd-page">
                {renderPageContent(
                  "shorts"
                )}
              </section>

              {/* SERIES */}
              <section className="mvbd-page">
                {renderPageContent(
                  "exclusive"
                )}
              </section>

              {/* PROFILE */}
              <section className="mvbd-page">
                {renderPageContent(
                  "profile"
                )}
              </section>
            </div>
          </div>

          {/* =================================================
              BOTTOM NAVIGATION
              ================================================= */}

          <BottomNavigation
            activeTab={activeTab}
            onTabChange={
              handleTabChange
            }
            swipePosition={
              swipePosition
            }
            isSwiping={isSwiping}
          />

          {/* =================================================
              WELCOME POPUP
              ================================================= */}

          {showWelcomePopup && (
            <WelcomePopup
              onClose={
                handleClosePopup
              }
            />
          )}
        </>
      )}
    </div>
  )
}
