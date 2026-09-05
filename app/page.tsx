"use client"

import {
  useState,
  useMemo,
  useEffect,
  useRef,
  type PointerEvent as ReactPointerEvent,
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


/* =========================================================
   ONLY 4 MAIN PAGES
   ========================================================= */

const tabs = [
  "home",
  "shorts",
  "exclusive",
  "profile",
] as const

type Tab = (typeof tabs)[number]


export default function Home() {

  /* =======================================================
     BASIC STATE
     ======================================================= */

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


  /* =======================================================
     SWIPE STATE
     ======================================================= */

  const [dragX, setDragX] = useState(0)
  const [isSwiping, setIsSwiping] = useState(false)
  const [isSettling, setIsSettling] = useState(false)

  const swipeStartX = useRef(0)
  const swipeStartY = useRef(0)

  const lastX = useRef(0)
  const lastTime = useRef(0)

  const velocityX = useRef(0)

  const pointerIdRef = useRef<number | null>(null)

  /*
   * Once a gesture becomes vertical or protected,
   * page swipe is permanently disabled for that gesture.
   */
  const gestureLockedRef = useRef(false)

  /*
   * Used so pointerup doesn't fire twice after
   * pointercancel/lostpointercapture.
   */
  const endingGestureRef = useRef(false)


  /* =======================================================
     ACTIVE INDEX
     ======================================================= */

  const activeIndex = Math.max(
    0,
    tabs.indexOf(activeTab)
  )


  /* =======================================================
     NEXT / PREVIOUS TAB
     ======================================================= */

  const previousTab =
    activeIndex > 0
      ? tabs[activeIndex - 1]
      : null

  const nextTab =
    activeIndex < tabs.length - 1
      ? tabs[activeIndex + 1]
      : null


  /* =======================================================
     BROWSER BACK BUTTON
     ======================================================= */

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
        setIsSwiping(false)
        setIsSettling(false)

        if (previous !== "profile") {
          setProfileSubPage("main")
        }

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


  /* =======================================================
     TAB CHANGE
     ======================================================= */

  const handleTabChange = (
    newTab: string,
    addHistory = true
  ) => {

    if (!tabs.includes(newTab as Tab)) {
      return
    }

    const targetTab = newTab as Tab

    if (targetTab === activeTab) {
      return
    }

    setIsSwiping(false)
    setIsSettling(false)
    setDragX(0)

    setActiveTab(targetTab)

    if (addHistory) {

      setTabHistory((previous) => [
        ...previous,
        targetTab,
      ])

      window.history.pushState(
        null,
        "",
        ""
      )
    }

    if (targetTab !== "profile") {
      setProfileSubPage("main")
    }

    /*
     * New page starts from top.
     * This also prevents the new page from appearing
     * at an unexpected vertical position.
     */
    window.requestAnimationFrame(() => {
      window.scrollTo({
        top: 0,
        behavior: "auto",
      })
    })
  }


  /* =======================================================
     CHECK PROTECTED AREAS
     ======================================================= */

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


  /* =======================================================
     POINTER DOWN
     ======================================================= */

  const handlePointerDown = (
    event: ReactPointerEvent<HTMLDivElement>
  ) => {

    /*
     * Ignore secondary mouse buttons.
     */
    if (
      event.pointerType === "mouse" &&
      event.button !== 0
    ) {
      return
    }

    /*
     * Movie detail page = no page swipe.
     */
    if (showDetailPage) {
      return
    }

    /*
     * Trending carousel / other protected
     * horizontal areas = no page swipe.
     */
    if (
      isProtectedSwipeArea(
        event.target
      )
    ) {
      pointerIdRef.current = null
      gestureLockedRef.current = true
      return
    }

    /*
     * Don't start a new swipe while settling.
     */
    if (isSettling) {
      return
    }

    pointerIdRef.current =
      event.pointerId

    endingGestureRef.current = false
    gestureLockedRef.current = false

    swipeStartX.current =
      event.clientX

    swipeStartY.current =
      event.clientY

    lastX.current =
      event.clientX

    lastTime.current =
      performance.now()

    velocityX.current = 0

    setDragX(0)
    setIsSwiping(false)

    /*
     * Keep receiving pointer events even if
     * finger leaves the element.
     */
    try {
      event.currentTarget.setPointerCapture(
        event.pointerId
      )
    } catch {
      // Safe fallback for unsupported situations.
    }
  }


  /* =======================================================
     POINTER MOVE
     ======================================================= */

  const handlePointerMove = (
    event: ReactPointerEvent<HTMLDivElement>
  ) => {

    if (
      pointerIdRef.current !==
      event.pointerId
    ) {
      return
    }

    if (gestureLockedRef.current) {
      return
    }

    if (showDetailPage) {
      return
    }

    const deltaX =
      event.clientX -
      swipeStartX.current

    const deltaY =
      event.clientY -
      swipeStartY.current

    const absX = Math.abs(deltaX)
    const absY = Math.abs(deltaY)


    /*
     * Don't steal vertical scrolling.
     *
     * Once vertical movement clearly wins,
     * this gesture is locked as a normal scroll.
     */
    if (
      !isSwiping &&
      absY > absX &&
      absY > 10
    ) {
      gestureLockedRef.current = true
      pointerIdRef.current = null
      return
    }


    /*
     * Ignore tiny finger movement.
     */
    if (
      !isSwiping &&
      absX < 8
    ) {
      return
    }


    /*
     * At this point it is a horizontal swipe.
     */
    setIsSwiping(true)


    /*
     * Calculate velocity.
     */
    const now =
      performance.now()

    const dt =
      now - lastTime.current

    if (dt > 0) {

      velocityX.current =
        (
          event.clientX -
          lastX.current
        ) / dt
    }

    lastX.current =
      event.clientX

    lastTime.current =
      now


    /*
     * Boundary resistance.
     *
     * First page can't move further right.
     * Last page can't move further left.
     */
    let resistance = 1

    if (
      activeIndex === 0 &&
      deltaX > 0
    ) {
      resistance = 0.18
    }

    if (
      activeIndex === tabs.length - 1 &&
      deltaX < 0
    ) {
      resistance = 0.18
    }


    /*
     * Real-time finger position.
     */
    const adjustedX =
      deltaX * resistance

    setDragX(adjustedX)


    /*
     * Prevent browser horizontal gesture
     * once our custom horizontal gesture is active.
     */
    if (
      event.cancelable &&
      Math.abs(deltaX) > absY
    ) {
      event.preventDefault()
    }
  }


  /* =======================================================
     FINISH SWIPE
     ======================================================= */

  const finishSwipe = (
    event?: ReactPointerEvent<HTMLDivElement>
  ) => {

    if (endingGestureRef.current) {
      return
    }

    endingGestureRef.current = true

    const pointerId =
      pointerIdRef.current

    pointerIdRef.current = null


    /*
     * Release pointer capture.
     */
    if (
      event &&
      pointerId !== null
    ) {
      try {

        if (
          event.currentTarget.hasPointerCapture(
            pointerId
          )
        ) {
          event.currentTarget.releasePointerCapture(
            pointerId
          )
        }

      } catch {
        // Safe fallback.
      }
    }


    if (
      !isSwiping ||
      gestureLockedRef.current
    ) {
      setDragX(0)
      setIsSwiping(false)
      setIsSettling(false)
      return
    }


    const distance =
      event
        ? event.clientX -
          swipeStartX.current
        : dragX


    /*
     * Use a fixed percentage threshold.
     * 20% is enough for a normal swipe.
     */
    const screenWidth =
      typeof window !== "undefined"
        ? window.innerWidth
        : 390

    const threshold =
      Math.max(
        72,
        screenWidth * 0.20
      )


    /*
     * Fast flick.
     */
    const fastLeft =
      velocityX.current < -0.55

    const fastRight =
      velocityX.current > 0.55


    let targetIndex =
      activeIndex


    /*
     * Swipe left → next page.
     */
    if (
      (
        distance < -threshold ||
        fastLeft
      ) &&
      activeIndex <
        tabs.length - 1
    ) {

      targetIndex =
        activeIndex + 1
    }


    /*
     * Swipe right → previous page.
     */
    else if (
      (
        distance > threshold ||
        fastRight
      ) &&
      activeIndex > 0
    ) {

      targetIndex =
        activeIndex - 1
    }


    /*
     * Start smooth settling animation.
     */
    setIsSwiping(false)
    setIsSettling(true)


    /*
     * We intentionally animate the current page
     * back to zero first when the swipe is rejected.
     */
    if (
      targetIndex === activeIndex
    ) {

      setDragX(0)

      window.setTimeout(() => {

        setIsSettling(false)

      }, 360)

      return
    }


    /*
     * Commit new page after the visual swipe
     * has reached the edge.
     */
    const targetTab =
      tabs[targetIndex]


    const direction =
      targetIndex > activeIndex
        ? -1
        : 1


    const finalWidth =
      typeof window !== "undefined"
        ? window.innerWidth
        : 390


    /*
     * Finish the current swipe visually.
     */
    setDragX(
      direction * finalWidth
    )


    /*
     * Wait for the 240ms settle animation,
     * then replace the page.
     */
    window.setTimeout(() => {

      setActiveTab(targetTab)

      setDragX(0)
      setIsSettling(false)

      setTabHistory((previous) => [
        ...previous,
        targetTab,
      ])

      window.history.pushState(
        null,
        "",
        ""
      )

      if (
        targetTab !== "profile"
      ) {
        setProfileSubPage("main")
      }

      /*
       * New page at top.
       */
      window.requestAnimationFrame(() => {
        window.scrollTo({
          top: 0,
          behavior: "auto",
        })
      })

    }, 240)
  }


  /* =======================================================
     POINTER UP
     ======================================================= */

  const handlePointerUp = (
    event: ReactPointerEvent<HTMLDivElement>
  ) => {

    finishSwipe(event)
  }


  /* =======================================================
     POINTER CANCEL
     ======================================================= */

  const handlePointerCancel = (
    event: ReactPointerEvent<HTMLDivElement>
  ) => {

    if (
      pointerIdRef.current !==
      event.pointerId
    ) {
      return
    }

    endingGestureRef.current = true
    pointerIdRef.current = null

    setIsSwiping(false)
    setIsSettling(true)
    setDragX(0)

    window.setTimeout(() => {
      setIsSettling(false)
    }, 300)
  }


  /* =======================================================
     LOST POINTER CAPTURE
     ======================================================= */

  const handleLostPointerCapture = () => {

    /*
     * If pointerup already handled the gesture,
     * don't handle it again.
     */
    if (
      endingGestureRef.current
    ) {
      return
    }

    if (
      pointerIdRef.current === null
    ) {
      return
    }

    pointerIdRef.current = null

    setIsSwiping(false)
    setIsSettling(true)
    setDragX(0)

    window.setTimeout(() => {
      setIsSettling(false)
    }, 300)
  }


  /* =======================================================
     WELCOME POPUP
     ======================================================= */

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


  /* =======================================================
     SEARCH
     ======================================================= */

  const filteredMovies = useMemo(() => {

    let filtered = movies

    if (searchQuery.trim()) {

      filtered =
        filtered.filter((movie) =>
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

      filtered =
        filtered.filter((movie) =>
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


  /* =======================================================
     HOME PAGE
     ======================================================= */

  const renderHomePage = () => (

    <div className="min-h-screen bg-black pb-20">

      <Header
        onSearch={handleSearch}
        pageType="home"
        searchData={movies}
      />


      {
        searchQuery.trim() &&
        filteredMovies.length === 0
      ? (

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

          {
            !isSearching && (

              /*
               * IMPORTANT:
               * Trending carousel is completely protected
               * from the main page swipe.
               */
              <div
                data-no-page-swipe
                className="w-full mvbd-trending-protected"
              >
                <TrendingCarousel
                  onMovieClick={(movie) => {
                    setSelectedMovie(movie)
                    setShowDetailPage(true)
                  }}
                />
              </div>

            )
          }


          {
            !isSearching && (

              <GenreCategories
                genres={genres}
                selectedGenre={selectedGenre}
                onGenreSelect={
                  handleGenreSelect
                }
                showAdultContent={
                  showAdultContent
                }
              />

            )
          }


          {
            isSearching && (

              <div className="px-4 pt-4">

                <h2 className="text-xl font-bold text-white mb-2">

                  সার্চ রেজাল্ট: "{searchQuery}"

                </h2>

                <p className="text-slate-400 text-sm mb-4">

                  {filteredMovies.length}
                  টি মুভি পাওয়া গেছে

                </p>

              </div>

            )
          }


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


  /* =======================================================
     ANIME PAGE
     ======================================================= */

  const renderAnimePage = () => (

    <div className="min-h-screen bg-black pb-20">

      <AnimePage />

    </div>
  )


  /* =======================================================
     SERIES PAGE
     ======================================================= */

  const renderSeriesPage = () => (

    <div className="min-h-screen bg-black pb-20">

      <SeriesSection />

    </div>
  )


  /* =======================================================
     PROFILE PAGE
     ======================================================= */

  const renderProfilePage = () => (

    <div className="min-h-screen bg-black pb-20">

      {
        profileSubPage === "main" && (

          <ProfilePage
            onNavigate={(page) =>
              setProfileSubPage(page)
            }
          />

        )
      }


      {
        profileSubPage === "contact" && (

          <ContactUsPage
            onBack={() =>
              setProfileSubPage("main")
            }
          />

        )
      }


      {
        profileSubPage === "about" && (

          <AboutUsPage
            onBack={() =>
              setProfileSubPage("main")
            }
          />

        )
      }


      {
        profileSubPage === "settings" && (

          <SettingsPage
            onBack={() =>
              setProfileSubPage("main")
            }
          />

        )
      }


      <Footer />

    </div>
  )


  /* =======================================================
     RENDER ACTIVE PAGE
     ======================================================= */

  const renderPageContent = (
    tab: Tab
  ) => {

    switch (tab) {

      case "home":
        return renderHomePage()

      case "shorts":
        return renderAnimePage()

      case "exclusive":
        return renderSeriesPage()

      case "profile":
        return renderProfilePage()

      default:
        return renderHomePage()
    }
  }


  /* =======================================================
     SWIPE TRANSFORMS
     ======================================================= */

  /*
   * Current page follows the finger.
   */
  const currentTransform =
    `translate3d(${dragX}px, 0, 0)`


  /*
   * Previous page sits immediately to the left.
   */
  const previousTransform =
    previousTab
      ? `translate3d(calc(-100% + ${dragX}px), 0, 0)`
      : "translate3d(-100%, 0, 0)"


  /*
   * Next page sits immediately to the right.
   */
  const nextTransform =
    nextTab
      ? `translate3d(calc(100% + ${dragX}px), 0, 0)`
      : "translate3d(100%, 0, 0)"


  /*
   * During normal state only the active page is visible.
   * During swipe, adjacent page becomes visible.
   */
  const showPrevious =
    isSwiping &&
    Boolean(previousTab)

  const showNext =
    isSwiping &&
    Boolean(nextTab)


  /* =======================================================
     BOTTOM NAV SWIPE POSITION
     ======================================================= */

  const viewportWidth =
    typeof window !== "undefined"
      ? window.innerWidth
      : 390

  const swipePosition =
    activeIndex -
    dragX /
      Math.max(
        1,
        viewportWidth
      )


  /* =======================================================
     DETAIL PAGE
     ======================================================= */

  if (
    showDetailPage &&
    selectedMovie
  ) {

    return (

      <div className="w-full min-h-screen bg-black">

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

      </div>

    )
  }


  /* =======================================================
     MAIN RETURN
     ======================================================= */

  return (

    <div className="w-full min-h-screen bg-black">

      {/* =================================================
          PAGE SWIPE AREA
          ================================================= */}

      <div
        className="
          mvbd-single-page-swipe
          relative
          w-full
          overflow-x-hidden
        "
        style={{
          touchAction: "pan-y",
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
          handleLostPointerCapture
        }}
      >

        {/* =================================================
            PREVIOUS PAGE PREVIEW
            ================================================= */}

        {
          showPrevious &&
          previousTab && (

            <div
              className="
                absolute
                top-0
                left-0
                w-full
                min-h-full
                bg-black
                z-[5]
              "
              style={{
                transform:
                  previousTransform,

                transition:
                  isSwiping
                    ? "none"
                    : "transform 240ms cubic-bezier(.22,1,.36,1)",

                willChange:
                  "transform",

                pointerEvents:
                  "none",
              }}
              aria-hidden="true"
            >

              {renderPageContent(
                previousTab
              )}

            </div>

          )
        }


        {/* =================================================
            NEXT PAGE PREVIEW
            ================================================= */}

        {
          showNext &&
          nextTab && (

            <div
              className="
                absolute
                top-0
                left-0
                w-full
                min-h-full
                bg-black
                z-[5]
              "
              style={{
                transform:
                  nextTransform,

                transition:
                  isSwiping
                    ? "none"
                    : "transform 240ms cubic-bezier(.22,1,.36,1)",

                willChange:
                  "transform",

                pointerEvents:
                  "none",
              }}
              aria-hidden="true"
            >

              {renderPageContent(
                nextTab
              )}

            </div>

          )
        }


        {/* =================================================
            CURRENT ACTIVE PAGE
            ================================================= */}

        <div
          className="
            relative
            z-[10]
            w-full
            min-h-screen
            bg-black
          "
          style={{
            transform:
              currentTransform,

            transition:
              isSwiping
                ? "none"
                : "transform 240ms cubic-bezier(.22,1,.36,1)",

            willChange:
              "transform",

            backfaceVisibility:
              "hidden",

            WebkitBackfaceVisibility:
              "hidden",
          }}
        >

          {renderPageContent(
            activeTab
          )}

        </div>

      </div>


      {/* =================================================
          BOTTOM NAVIGATION
          ================================================= */}

      <BottomNavigation
        activeTab={activeTab}
        onTabChange={handleTabChange}
        swipePosition={
          swipePosition
        }
        isSwiping={
          isSwiping
        }
      />


      {/* =================================================
          WELCOME POPUP
          ================================================= */}

      {
        showWelcomePopup && (

          <WelcomePopup
            onClose={
              handleClosePopup
            }
          />

        )
      }

    </div>

  )
}
