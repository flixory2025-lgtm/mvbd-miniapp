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

type Tab = (typeof tabs)[number]

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
    useState<Tab>("home")

  const [isSearching, setIsSearching] =
    useState(false)

  const [showAdultContent, setShowAdultContent] =
    useState(false)

  const [tabHistory, setTabHistory] =
    useState<Tab[]>(["home"])

  const [showDetailPage, setShowDetailPage] =
    useState(false)

  const [profileSubPage, setProfileSubPage] =
    useState<
      "main" | "contact" | "about" | "settings"
    >("main")

  /*
   * =========================================================
   * SWIPE STATE
   * =========================================================
   */

  const [dragX, setDragX] = useState(0)
  const [isSwiping, setIsSwiping] = useState(false)

  const [settling, setSettling] = useState(false)
  const [settleX, setSettleX] = useState(0)

  const [viewportHeight, setViewportHeight] =
    useState<number | null>(null)

  const viewportRef =
    useRef<HTMLDivElement>(null)

  const currentPageRef =
    useRef<HTMLDivElement>(null)

  const pointerIdRef =
    useRef<number | null>(null)

  const startXRef = useRef(0)
  const startYRef = useRef(0)

  const lastXRef = useRef(0)
  const lastTimeRef = useRef(0)

  const velocityXRef = useRef(0)

  const swipeDirectionRef =
    useRef<-1 | 1 | 0>(0)

  /*
   * =========================================================
   * ACTIVE INDEX
   * =========================================================
   */

  const activeIndex = Math.max(
    0,
    tabs.indexOf(activeTab)
  )

  /*
   * =========================================================
   * PREVIOUS / NEXT
   * =========================================================
   */

  const previousTab: Tab | null =
    activeIndex > 0
      ? tabs[activeIndex - 1]
      : null

  const nextTab: Tab | null =
    activeIndex < tabs.length - 1
      ? tabs[activeIndex + 1]
      : null

  /*
   * =========================================================
   * MEASURE CURRENT PAGE
   * =========================================================
   */

  useEffect(() => {
    const element = currentPageRef.current

    if (!element) return

    const updateHeight = () => {
      const height =
        element.getBoundingClientRect().height

      if (height > 0) {
        setViewportHeight(height)
      }
    }

    updateHeight()

    const observer =
      new ResizeObserver(updateHeight)

    observer.observe(element)

    window.addEventListener(
      "resize",
      updateHeight
    )

    return () => {
      observer.disconnect()

      window.removeEventListener(
        "resize",
        updateHeight
      )
    }
  }, [
    activeTab,
    profileSubPage,
    isSearching,
    selectedGenre,
    currentPage,
  ])

  /*
   * =========================================================
   * HISTORY / BACK BUTTON
   * =========================================================
   */

  useEffect(() => {
    const handlePopState = () => {
      setTabHistory((history) => {
        if (history.length <= 1) {
          return history
        }

        const newHistory =
          history.slice(0, -1)

        const previous =
          newHistory[newHistory.length - 1]

        setActiveTab(previous)

        setDragX(0)
        setSettleX(0)
        setSettling(false)
        setIsSwiping(false)

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
   * =========================================================
   * TAB CHANGE
   * =========================================================
   */

  const changeTab = (
    newTab: Tab,
    addHistory = true,
    animate = true
  ) => {
    if (!tabs.includes(newTab)) return

    if (newTab === activeTab) return

    const newIndex =
      tabs.indexOf(newTab)

    const direction =
      newIndex > activeIndex
        ? -1
        : 1

    if (!animate) {
      setActiveTab(newTab)
      setDragX(0)
      setSettleX(0)
      setSettling(false)
      setIsSwiping(false)

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

      return
    }

    /*
     * Direct nav button click-এর জন্য
     * smooth transition
     */

    setSettling(true)
    setIsSwiping(false)

    setSettleX(
      direction *
        window.innerWidth
    )

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
      setActiveTab(newTab)
      setDragX(0)
      setSettleX(0)
      setSettling(false)
    }, 360)
  }

  /*
   * =========================================================
   * PROTECTED HORIZONTAL AREAS
   * =========================================================
   *
   * Trending poster carousel এখানে protected.
   */

  const isProtectedSwipeArea = (
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

  /*
   * =========================================================
   * POINTER DOWN
   * =========================================================
   */

  const handlePointerDown = (
    event: React.PointerEvent<HTMLDivElement>
  ) => {
    if (showDetailPage) return

    if (
      event.pointerType === "mouse" &&
      event.button !== 0
    ) {
      return
    }

    /*
     * Trending / protected carousel
     * থেকে page swipe শুরু হবে না।
     */

    if (
      isProtectedSwipeArea(event.target)
    ) {
      return
    }

    pointerIdRef.current =
      event.pointerId

    startXRef.current =
      event.clientX

    startYRef.current =
      event.clientY

    lastXRef.current =
      event.clientX

    lastTimeRef.current =
      performance.now()

    velocityXRef.current = 0

    swipeDirectionRef.current = 0

    setIsSwiping(false)
    setSettling(false)
    setDragX(0)

    try {
      event.currentTarget.setPointerCapture(
        event.pointerId
      )
    } catch {
      // Ignore pointer capture errors.
    }
  }

  /*
   * =========================================================
   * POINTER MOVE
   * =========================================================
   */

  const handlePointerMove = (
    event: React.PointerEvent<HTMLDivElement>
  ) => {
    if (
      pointerIdRef.current !==
      event.pointerId
    ) {
      return
    }

    if (showDetailPage) return

    const deltaX =
      event.clientX -
      startXRef.current

    const deltaY =
      event.clientY -
      startYRef.current

    /*
     * আগে direction lock করবো।
     */

    if (!isSwiping) {
      const absX = Math.abs(deltaX)
      const absY = Math.abs(deltaY)

      if (
        absY > absX &&
        absY > 10
      ) {
        pointerIdRef.current = null

        try {
          event.currentTarget.releasePointerCapture(
            event.pointerId
          )
        } catch {
          // Ignore.
        }

        return
      }

      if (absX < 8) {
        return
      }

      swipeDirectionRef.current =
        deltaX < 0 ? -1 : 1

      setIsSwiping(true)
    }

    /*
     * Edge resistance
     */

    let adjustedX = deltaX

    if (
      activeIndex === 0 &&
      deltaX > 0
    ) {
      adjustedX =
        deltaX * 0.20
    }

    if (
      activeIndex === tabs.length - 1 &&
      deltaX < 0
    ) {
      adjustedX =
        deltaX * 0.20
    }

    /*
     * অতিরিক্ত drag আটকানো
     */

    const maxDrag =
      window.innerWidth * 1.05

    adjustedX =
      Math.max(
        -maxDrag,
        Math.min(
          maxDrag,
          adjustedX
        )
      )

    setDragX(adjustedX)

    /*
     * Velocity
     */

    const now =
      performance.now()

    const dt =
      now -
      lastTimeRef.current

    if (dt > 0) {
      velocityXRef.current =
        (event.clientX -
          lastXRef.current) /
        dt
    }

    lastXRef.current =
      event.clientX

    lastTimeRef.current =
      now

    /*
     * Horizontal gesture হলে
     * browser-এর native horizontal movement
     * আটকানো।
     */

    if (
      event.cancelable
    ) {
      event.preventDefault()
    }
  }

  /*
   * =========================================================
   * FINISH SWIPE
   * =========================================================
   */

  const finishSwipe = (
    clientX: number
  ) => {
    if (
      pointerIdRef.current === null
    ) {
      return
    }

    pointerIdRef.current = null

    const distance =
      clientX -
      startXRef.current

    if (!isSwiping) {
      setDragX(0)
      return
    }

    const width =
      window.innerWidth

    const threshold =
      width * 0.20

    const velocity =
      velocityXRef.current

    const shouldGoNext =
      (
        distance < -threshold ||
        velocity < -0.55
      ) &&
      activeIndex <
        tabs.length - 1

    const shouldGoPrevious =
      (
        distance > threshold ||
        velocity > 0.55
      ) &&
      activeIndex > 0

    let direction: -1 | 1 | 0 = 0

    if (shouldGoNext) {
      direction = -1
    } else if (shouldGoPrevious) {
      direction = 1
    }

    setIsSwiping(false)

    /*
     * Page change
     */

    if (direction !== 0) {
      const targetIndex =
        activeIndex +
        (direction === -1 ? 1 : -1)

      const targetTab =
        tabs[targetIndex]

      /*
       * Current page screen-এর বাইরে যাবে,
       * next page তার জায়গায় আসবে।
       */

      setSettling(true)

      setSettleX(
        direction *
          width
      )

      window.setTimeout(() => {
        setActiveTab(targetTab)

        setDragX(0)
        setSettleX(0)
        setSettling(false)

        setTabHistory(
          (previous) => [
            ...previous,
            targetTab,
          ]
        )

        window.history.pushState(
          null,
          "",
          ""
        )

        if (
          targetTab !==
          "profile"
        ) {
          setProfileSubPage("main")
        }
      }, 320)

      return
    }

    /*
     * Threshold না হলে
     * নিজের জায়গায় smooth return.
     */

    setSettling(true)
    setSettleX(0)

    window.setTimeout(() => {
      setDragX(0)
      setSettleX(0)
      setSettling(false)
    }, 280)
  }

  /*
   * =========================================================
   * POINTER UP
   * =========================================================
   */

  const handlePointerUp = (
    event: React.PointerEvent<HTMLDivElement>
  ) => {
    if (
      pointerIdRef.current !==
      event.pointerId
    ) {
      return
    }

    try {
      event.currentTarget.releasePointerCapture(
        event.pointerId
      )
    } catch {
      // Ignore.
    }

    finishSwipe(
      event.clientX
    )
  }

  /*
   * =========================================================
   * POINTER CANCEL
   * =========================================================
   */

  const handlePointerCancel = () => {
    pointerIdRef.current = null

    if (!isSwiping) {
      setDragX(0)
      return
    }

    setIsSwiping(false)
    setSettling(true)
    setSettleX(0)

    window.setTimeout(() => {
      setDragX(0)
      setSettleX(0)
      setSettling(false)
    }, 280)
  }

  /*
   * =========================================================
   * WELCOME POPUP
   * =========================================================
   */

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

  /*
   * =========================================================
   * SEARCH
   * =========================================================
   */

  const filteredMovies =
    useMemo(() => {
      let filtered = movies

      if (
        searchQuery.trim()
      ) {
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

  /*
   * =========================================================
   * HOME
   * =========================================================
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
            /*
             * IMPORTANT:
             * Trending carousel page swipe থেকে protected.
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
              selectedGenre={selectedGenre}
              onGenreSelect={handleGenreSelect}
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
            showAdultContent={
              showAdultContent
            }
            isSearching={isSearching}
          />
        </>
      )}

      <Footer />
    </div>
  )

  /*
   * =========================================================
   * PROFILE
   * =========================================================
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
   * =========================================================
   * RENDER PAGE CONTENT
   * =========================================================
   */

  const renderPageContent = (
    tab: Tab
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
        return null
    }
  }

  /*
   * =========================================================
   * LIVE PAGE POSITIONS
   * =========================================================
   */

  const currentTransform =
    settling
      ? `translate3d(${settleX}px,0,0)`
      : `translate3d(${dragX}px,0,0)`

  /*
   * During drag:
   *
   * drag left  → next page comes from right
   * drag right → previous page comes from left
   */

  const adjacentTab =
    dragX < 0
      ? nextTab
      : dragX > 0
        ? previousTab
        : null

  const adjacentStart =
    dragX < 0
      ? window.innerWidth
      : -window.innerWidth

  const adjacentTransform =
    settling
      ? "translate3d(0,0,0)"
      : `translate3d(${adjacentStart + dragX}px,0,0)`

  /*
   * Indicator position:
   *
   * 0 = Home
   * 1 = Anime
   * 2 = Series
   * 3 = Profile
   */

  const swipePosition =
    Math.max(
      0,
      Math.min(
        tabs.length - 1,
        activeIndex -
          dragX /
            Math.max(
              1,
              typeof window !==
                "undefined"
                ? window.innerWidth
                : 390
            )
      )
    )

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
          <div
            ref={viewportRef}
            className="mvbd-swipe-viewport"
            style={{
              height:
                viewportHeight ??
                undefined,
            }}
          >
            {/* =================================================
                CURRENT PAGE
                ================================================= */}

            <div
              ref={currentPageRef}
              className={`mvbd-current-page ${
                settling
                  ? "mvbd-page-settling"
                  : ""
              }`}
              style={{
                transform:
                  currentTransform,
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
              }}
            >
              {renderPageContent(
                activeTab
              )}
            </div>

            {/* =================================================
                ADJACENT PAGE PREVIEW
                ================================================= */}

            {adjacentTab && (
              <div
                className={`mvbd-adjacent-page ${
                  settling
                    ? "mvbd-page-settling"
                    : ""
                }`}
                style={{
                  transform:
                    adjacentTransform,
                }}
                aria-hidden="true"
              >
                {renderPageContent(
                  adjacentTab
                )}
              </div>
            )}

            {/* =================================================
                SETTLING PREVIEW
                ================================================= */}

            {settling &&
              adjacentTab && (
                <div
                  className="mvbd-settle-page"
                  style={{
                    transform:
                      "translate3d(0,0,0)",
                  }}
                  aria-hidden="true"
                >
                  {renderPageContent(
                    adjacentTab
                  )}
                </div>
              )}
          </div>

          <BottomNavigation
            activeTab={activeTab}
            onTabChange={(tab) =>
              changeTab(
                tab as Tab
              )
            }
            swipePosition={
              isSwiping
                ? swipePosition
                : activeIndex
            }
            isSwiping={
              isSwiping
            }
          />

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
