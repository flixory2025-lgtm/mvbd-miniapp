"use client"

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent,
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

const tabs = ["home", "shorts", "exclusive", "profile"] as const

type TabId = (typeof tabs)[number]

type SettleMode = "commit" | "cancel" | null

export default function Home() {
  /* =========================================================
     BASIC PAGE STATE
  ========================================================= */

  const [searchQuery, setSearchQuery] = useState("")
  const [selectedGenre, setSelectedGenre] = useState<string | null>(null)
  const [selectedMovie, setSelectedMovie] = useState<
    (typeof movies)[0] | null
  >(null)

  const [currentPage, setCurrentPage] = useState(1)
  const [showWelcomePopup, setShowWelcomePopup] = useState(false)

  const [activeTab, setActiveTab] = useState<TabId>("home")
  const [isSearching, setIsSearching] = useState(false)
  const [showAdultContent, setShowAdultContent] = useState(false)

  const [tabHistory, setTabHistory] = useState<TabId[]>(["home"])

  const [showDetailPage, setShowDetailPage] = useState(false)

  const [profileSubPage, setProfileSubPage] = useState<
    "main" | "contact" | "about" | "settings"
  >("main")

  /* =========================================================
     SWIPE STATE

     IMPORTANT:
     Page movement itself is handled directly through DOM refs.
     React state is NOT used for every pointermove.
     This removes the "kepe kepe" feeling.
  ========================================================= */

  const [isSwiping, setIsSwiping] = useState(false)

  const [swipePosition, setSwipePosition] = useState(0)

  const [settleMode, setSettleMode] = useState<SettleMode>(null)

  const [viewportWidth, setViewportWidth] = useState(390)

  const activeIndex = Math.max(0, tabs.indexOf(activeTab))

  /* =========================================================
     DOM REFS
  ========================================================= */

  const swipeShellRef = useRef<HTMLDivElement>(null)

  const currentPageRef = useRef<HTMLDivElement>(null)
  const previousPageRef = useRef<HTMLDivElement>(null)
  const nextPageRef = useRef<HTMLDivElement>(null)

  /* =========================================================
     POINTER / PHYSICS REFS
  ========================================================= */

  const pointerIdRef = useRef<number | null>(null)

  const startXRef = useRef(0)
  const startYRef = useRef(0)

  const lastXRef = useRef(0)
  const lastTimeRef = useRef(0)

  const velocityXRef = useRef(0)

  const dragXRef = useRef(0)

  const horizontalLockRef = useRef(false)

  const activeSwipeDirectionRef = useRef<"previous" | "next" | null>(null)

  const settleTargetRef = useRef<TabId | null>(null)

  const finishTimerRef = useRef<number | null>(null)

  /* =========================================================
     VIEWPORT WIDTH
     ========================================================= */

  useEffect(() => {
    const updateViewportWidth = () => {
      setViewportWidth(Math.max(1, window.innerWidth))
    }

    updateViewportWidth()

    window.addEventListener("resize", updateViewportWidth)

    return () => {
      window.removeEventListener("resize", updateViewportWidth)
    }
  }, [])

  /* =========================================================
     CLEANUP TIMER
  ========================================================= */

  useEffect(() => {
    return () => {
      if (finishTimerRef.current !== null) {
        window.clearTimeout(finishTimerRef.current)
      }
    }
  }, [])

  /* =========================================================
     BROWSER BACK BUTTON
  ========================================================= */

  useEffect(() => {
    const handlePopState = () => {
      setTabHistory((history) => {
        if (history.length <= 1) {
          return history
        }

        const newHistory = history.slice(0, -1)
        const previousTab = newHistory[newHistory.length - 1]

        if (previousTab) {
          setActiveTab(previousTab)
        }

        return newHistory
      })
    }

    window.addEventListener("popstate", handlePopState)

    return () => {
      window.removeEventListener("popstate", handlePopState)
    }
  }, [])

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
     FILTERED MOVIES
  ========================================================= */

  const filteredMovies = useMemo(() => {
    let filtered = movies

    if (searchQuery.trim()) {
      filtered = filtered.filter((movie) =>
        movie.title.toLowerCase().includes(searchQuery.toLowerCase())
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

  const totalPages = Math.ceil(filteredMovies.length / itemsPerPage)

  const paginatedMovies = filteredMovies.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  /* =========================================================
     SEARCH
  ========================================================= */

  const handleSearch = (query: string) => {
    setSearchQuery(query)
    setCurrentPage(1)
    setIsSearching(query.trim().length > 0)
  }

  /* =========================================================
     GENRE
  ========================================================= */

  const handleGenreSelect = (genre: string | null) => {
    setSelectedGenre(genre)
    setCurrentPage(1)
    setShowAdultContent(genre === "Adult")
  }

  /* =========================================================
     PAGE NAVIGATION
  ========================================================= */

  const handleTabChange = (
    newTab: string,
    addHistory = true
  ) => {
    if (!tabs.includes(newTab as TabId)) return

    const targetTab = newTab as TabId

    if (targetTab === activeTab) return

    /*
      Direct navigation from bottom nav.
      No artificial page animation here.
      The swipe animation is handled separately.
    */

    setSettleMode(null)

    dragXRef.current = 0

    setIsSwiping(false)

    setSwipePosition(tabs.indexOf(targetTab))

    setActiveTab(targetTab)
    setSwipePosition(tabs.indexOf(targetTab))

    if (addHistory) {
      setTabHistory((previous) => [
        ...previous,
        targetTab,
      ])

      window.history.pushState(null, "", "")
    }

    if (targetTab !== "profile") {
      setProfileSubPage("main")
    }
  }

  /* =========================================================
     PROTECTED SWIPE AREAS
     
     Trending carousel and any future horizontal component
     can use data-no-page-swipe.
  ========================================================= */

  const isProtectedSwipeTarget = (
    target: EventTarget | null
  ) => {
    if (!(target instanceof Element)) {
      return false
    }

    return Boolean(
      target.closest("[data-no-page-swipe]")
    )
  }

  /* =========================================================
     APPLY SWIPE TRANSFORMS DIRECTLY

     THIS IS THE IMPORTANT PART.

     No React setState for every pixel.
     Browser moves the layers directly.
  ========================================================= */

  const applySwipePosition = (
    x: number,
    width: number
  ) => {
    const safeWidth = Math.max(1, width)

    const current = currentPageRef.current
    const previous = previousPageRef.current
    const next = nextPageRef.current

    if (!current) return

    let finalX = x

    /*
      Small resistance at the beginning/end.
    */

    if (activeIndex === 0 && finalX > 0) {
      finalX *= 0.22
    }

    if (
      activeIndex === tabs.length - 1 &&
      finalX < 0
    ) {
      finalX *= 0.22
    }

    /*
      Never allow the current page to move more
      than one screen.
    */

    finalX = Math.max(
      -safeWidth,
      Math.min(safeWidth, finalX)
    )

    dragXRef.current = finalX

    /*
      Current page follows finger 1:1.
    */

    current.style.transform = `translate3d(${finalX}px, 0, 0)`

    /*
      Swipe LEFT:
      next page comes from right.

      Swipe RIGHT:
      previous page comes from left.
    */

    if (finalX < 0 && activeIndex < tabs.length - 1) {
      if (next) {
        next.style.visibility = "visible"
        next.style.transform = `translate3d(${
          safeWidth + finalX
        }px, 0, 0)`
      }

      if (previous) {
        previous.style.visibility = "hidden"
        previous.style.transform = `translate3d(-${safeWidth}px, 0, 0)`
      }
    } else if (
      finalX > 0 &&
      activeIndex > 0
    ) {
      if (previous) {
        previous.style.visibility = "visible"
        previous.style.transform = `translate3d(${
          -safeWidth + finalX
        }px, 0, 0)`
      }

      if (next) {
        next.style.visibility = "hidden"
        next.style.transform = `translate3d(${safeWidth}px, 0, 0)`
      }
    } else {
      if (previous) {
        previous.style.visibility = "hidden"
        previous.style.transform = `translate3d(-${safeWidth}px, 0, 0)`
      }

      if (next) {
        next.style.visibility = "hidden"
        next.style.transform = `translate3d(${safeWidth}px, 0, 0)`
      }
    }

    /*
      Bottom indicator follows finger.

      Example:
      Home = 0
      halfway toward Anime = 0.5
      Anime = 1
    */

    const position =
      activeIndex -
      finalX / safeWidth

    const clampedPosition = Math.max(
      0,
      Math.min(tabs.length - 1, position)
    )

    setSwipePosition(clampedPosition)
  }

  /* =========================================================
     RESET PAGE POSITIONS
  ========================================================= */

  const resetPageTransforms = () => {
    const current = currentPageRef.current
    const previous = previousPageRef.current
    const next = nextPageRef.current

    if (current) {
      current.style.transition = "none"
      current.style.transform =
        "translate3d(0, 0, 0)"
    }

    if (previous) {
      previous.style.transition = "none"
      previous.style.visibility = "hidden"
      previous.style.transform = `translate3d(-${viewportWidth}px, 0, 0)`
    }

    if (next) {
      next.style.transition = "none"
      next.style.visibility = "hidden"
      next.style.transform = `translate3d(${viewportWidth}px, 0, 0)`
    }

    dragXRef.current = 0

    setSwipePosition(activeIndex)
  }

  /* =========================================================
     FINISH SWIPE
  ========================================================= */

  const finishSwipe = (
    committed: boolean,
    direction: "previous" | "next" | null
  ) => {
    const current = currentPageRef.current
    const previous = previousPageRef.current
    const next = nextPageRef.current

    if (!current) return

    const width = Math.max(
      1,
      viewportWidth
    )

    /*
      More natural timing:

      Short remaining distance = shorter animation.
      Full page movement = around 280ms.
    */

    const currentDrag = Math.abs(
      dragXRef.current
    )

    const remaining = committed
      ? Math.max(0, width - currentDrag)
      : currentDrag

    const progress =
      Math.min(1, remaining / width)

    const duration = committed
      ? Math.round(150 + progress * 150)
      : Math.round(150 + progress * 100)

    const easing =
      "cubic-bezier(0.22, 1, 0.36, 1)"

    setSettleMode(
      committed ? "commit" : "cancel"
    )

    /*
      IMPORTANT:
      During settling we use CSS transition.
      During finger movement we use NONE.
    */

    current.style.transition = `transform ${duration}ms ${easing}`

    if (previous) {
      previous.style.transition = `transform ${duration}ms ${easing}`
    }

    if (next) {
      next.style.transition = `transform ${duration}ms ${easing}`
    }

    if (
      committed &&
      direction === "next" &&
      activeIndex < tabs.length - 1
    ) {
      /*
        Current -> left
        Next -> center
      */

      current.style.transform =
        `translate3d(-${width}px, 0, 0)`

      if (next) {
        next.style.visibility = "visible"
        next.style.transform =
          "translate3d(0, 0, 0)"
      }

      if (previous) {
        previous.style.visibility = "hidden"
      }

      setSwipePosition(activeIndex + 1)

      settleTargetRef.current =
        tabs[activeIndex + 1]

    } else if (
      committed &&
      direction === "previous" &&
      activeIndex > 0
    ) {
      /*
        Current -> right
        Previous -> center
      */

      current.style.transform =
        `translate3d(${width}px, 0, 0)`

      if (previous) {
        previous.style.visibility = "visible"
        previous.style.transform =
          "translate3d(0, 0, 0)"
      }

      if (next) {
        next.style.visibility = "hidden"
      }

      setSwipePosition(activeIndex - 1)

      settleTargetRef.current =
        tabs[activeIndex - 1]

    } else {
      /*
        Cancel:
        everything returns exactly where it started.
      */

      current.style.transform =
        "translate3d(0, 0, 0)"

      if (previous) {
        previous.style.visibility =
          direction === "previous"
            ? "visible"
            : "hidden"

        previous.style.transform =
          `translate3d(-${width}px, 0, 0)`
      }

      if (next) {
        next.style.visibility =
          direction === "next"
            ? "visible"
            : "hidden"

        next.style.transform =
          `translate3d(${width}px, 0, 0)`
      }

      setSwipePosition(activeIndex)

      settleTargetRef.current = null
    }

    if (finishTimerRef.current !== null) {
      window.clearTimeout(
        finishTimerRef.current
      )
    }

    finishTimerRef.current =
      window.setTimeout(() => {
        const target =
          settleTargetRef.current

        if (
          committed &&
          target
        ) {
          setActiveTab(target)
          setSwipePosition(tabs.indexOf(target))

          if (target !== "profile") {
            setProfileSubPage("main")
          }

          setTabHistory((previousHistory) => [
            ...previousHistory,
            target,
          ])

          window.history.pushState(
            null,
            "",
            ""
          )
        }

        settleTargetRef.current = null

        setSettleMode(null)

        setIsSwiping(false)

        /*
          Wait one frame after changing page,
          then reset all transforms.
        */

        window.requestAnimationFrame(() => {
          window.requestAnimationFrame(() => {
            resetPageTransforms()
          })
        })
      }, duration + 20)
  }

  /* =========================================================
     POINTER DOWN
  ========================================================= */

  const handlePointerDown = (
    event: PointerEvent<HTMLDivElement>
  ) => {
    if (
      event.pointerType === "mouse" &&
      event.button !== 0
    ) {
      return
    }

    if (showDetailPage) return

    /*
      Do NOT steal the gesture from:
      Trending carousel / other protected components.
    */

    if (
      isProtectedSwipeTarget(
        event.target
      )
    ) {
      return
    }

    /*
      Don't start another gesture while
      previous animation is settling.
    */

    if (settleMode !== null) {
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

    dragXRef.current = 0

    horizontalLockRef.current = false

    activeSwipeDirectionRef.current = null

    setIsSwiping(false)

    setSwipePosition(activeIndex)

    try {
      swipeShellRef.current?.setPointerCapture(
        event.pointerId
      )
    } catch {
      // Ignore capture errors.
    }
  }

  /* =========================================================
     POINTER MOVE
  ========================================================= */

  const handlePointerMove = (
    event: PointerEvent<HTMLDivElement>
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
      Before deciding horizontal/vertical,
      wait a few pixels.

      This prevents normal vertical scrolling
      from feeling sticky.
    */

    if (!horizontalLockRef.current) {
      if (
        Math.abs(deltaX) < 7 &&
        Math.abs(deltaY) < 7
      ) {
        return
      }

      /*
        Vertical gesture:
        completely give control back to browser.
      */

      if (
        Math.abs(deltaY) >
          Math.abs(deltaX) * 1.15
      ) {
        pointerIdRef.current = null

        try {
          swipeShellRef.current?.releasePointerCapture(
            event.pointerId
          )
        } catch {
          // Ignore.
        }

        return
      }

      horizontalLockRef.current = true

      setIsSwiping(true)
    }

    /*
      Velocity calculation.
      This is used like native mobile scrolling:
      distance + momentum.
    */

    const now = performance.now()

    const dt =
      now -
      lastTimeRef.current

    if (dt > 0) {
      const instantVelocity =
        (event.clientX -
          lastXRef.current) /
        dt

      /*
        Smooth velocity instead of taking
        one noisy pointer sample.
      */

      velocityXRef.current =
        velocityXRef.current * 0.65 +
        instantVelocity * 0.35
    }

    lastXRef.current =
      event.clientX

    lastTimeRef.current = now

    /*
      Detect direction.
    */

    if (deltaX < 0) {
      activeSwipeDirectionRef.current =
        "next"
    } else if (deltaX > 0) {
      activeSwipeDirectionRef.current =
        "previous"
    }

    /*
      Direct 1:1 movement.
    */

    applySwipePosition(
      deltaX,
      viewportWidth
    )

    /*
      Once horizontal movement is locked,
      prevent browser horizontal handling.
      Vertical scrolling remains allowed.
    */

    if (event.cancelable) {
      event.preventDefault()
    }
  }

  /* =========================================================
     POINTER UP
  ========================================================= */

  const handlePointerUp = (
    event: PointerEvent<HTMLDivElement>
  ) => {
    if (
      pointerIdRef.current !==
      event.pointerId
    ) {
      return
    }

    pointerIdRef.current = null

    try {
      swipeShellRef.current?.releasePointerCapture(
        event.pointerId
      )
    } catch {
      // Ignore.
    }

    if (!horizontalLockRef.current) {
      return
    }

    const distance =
      event.clientX -
      startXRef.current

    const velocity =
      velocityXRef.current

    const width =
      Math.max(1, viewportWidth)

    /*
      Native-like projection:

      Current position +
      a little momentum from the swipe.

      This feels much more natural than
      using a fixed "20%" threshold only.
    */

    const projected =
      distance +
      velocity * 140

    const commitDistance =
      width * 0.18

    let direction:
      | "previous"
      | "next"
      | null = null

    /*
      Swipe left -> next
    */

    if (
      projected < -commitDistance &&
      activeIndex < tabs.length - 1
    ) {
      direction = "next"
    }

    /*
      Swipe right -> previous
    */

    if (
      projected > commitDistance &&
      activeIndex > 0
    ) {
      direction = "previous"
    }

    /*
      Very fast flick:
      allow it to switch even when distance
      wasn't very large.
    */

    if (
      !direction &&
      Math.abs(velocity) > 0.65
    ) {
      if (
        velocity < 0 &&
        activeIndex < tabs.length - 1
      ) {
        direction = "next"
      } else if (
        velocity > 0 &&
        activeIndex > 0
      ) {
        direction = "previous"
      }
    }

    setIsSwiping(false)

    if (direction) {
      finishSwipe(
        true,
        direction
      )
    } else {
      finishSwipe(
        false,
        activeSwipeDirectionRef.current
      )
    }

    horizontalLockRef.current = false
  }

  /* =========================================================
     POINTER CANCEL
  ========================================================= */

  const handlePointerCancel = (
    event?: PointerEvent<HTMLDivElement>
  ) => {
    if (
      event &&
      pointerIdRef.current !==
        event.pointerId
    ) {
      return
    }

    pointerIdRef.current = null

    if (
      !horizontalLockRef.current
    ) {
      return
    }

    try {
      if (event) {
        swipeShellRef.current?.releasePointerCapture(
          event.pointerId
        )
      }
    } catch {
      // Ignore.
    }

    horizontalLockRef.current = false

    setIsSwiping(false)

    finishSwipe(
      false,
      activeSwipeDirectionRef.current
    )
  }

  /* =========================================================
     PAGE CONTENT
  ========================================================= */

  const renderHomePage = () => (
    <div className="min-h-[100svh] bg-black pb-[76px]">
      <Header
        onSearch={handleSearch}
        pageType="home"
        searchData={movies}
      />

      {searchQuery.trim() &&
      filteredMovies.length === 0 ? (
        <div className="px-4 py-12 text-center">
          <p className="text-lg text-slate-300 mb-6">
            আমরা দুঃখিত! এই নামের কোনো মুভি আমাদের
            কালেকশনে নেই
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
              IMPORTANT:
              Trending carousel is protected.
              Its own horizontal swipe will NOT
              move the entire page.
            */
            <div
              data-no-page-swipe
              className="w-full"
              style={{
                touchAction: "pan-x pan-y",
              }}
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

  const renderAnimePage = () => (
    <div className="min-h-[100svh] bg-black pb-[76px]">
      <AnimePage />
    </div>
  )

  const renderSeriesPage = () => (
    <div className="min-h-[100svh] bg-black pb-[76px]">
      <SeriesSection />
    </div>
  )

  const renderProfilePage = () => (
    <div className="min-h-[100svh] bg-black pb-[76px]">
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

  const renderPage = (
    tab: TabId
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

  /* =========================================================
     PAGE REFERENCES

     After activeTab changes, make sure the newly rendered
     layers start from the correct positions.
  ========================================================= */

  useEffect(() => {
    /*
      Don't immediately interfere while the old page
      is finishing its transition.
    */

    if (settleMode !== null) {
      return
    }

    const current =
      currentPageRef.current

    const previous =
      previousPageRef.current

    const next =
      nextPageRef.current

    if (current) {
      current.style.transition = "none"
      current.style.transform =
        "translate3d(0, 0, 0)"
    }

    if (previous) {
      previous.style.transition = "none"
      previous.style.visibility =
        "hidden"
      previous.style.transform =
        `translate3d(-${viewportWidth}px, 0, 0)`
    }

    if (next) {
      next.style.transition = "none"
      next.style.visibility =
        "hidden"
      next.style.transform =
        `translate3d(${viewportWidth}px, 0, 0)`
    }

    dragXRef.current = 0

    setSwipePosition(activeIndex)
  }, [
    activeTab,
    activeIndex,
    viewportWidth,
    settleMode,
  ])

  /* =========================================================
     MAIN RENDER
  ========================================================= */

  if (
    showDetailPage &&
    selectedMovie
  ) {
    return (
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
    )
  }

  const previousTab =
    activeIndex > 0
      ? tabs[activeIndex - 1]
      : null

  const nextTab =
    activeIndex < tabs.length - 1
      ? tabs[activeIndex + 1]
      : null

  return (
    <div className="w-full min-h-screen bg-black">
      <div
        ref={swipeShellRef}
        className="relative w-full min-h-[100svh]"
        style={{
          /*
            Vertical scrolling belongs to browser.
            Horizontal gesture belongs to our swipe system.
          */
          touchAction: "pan-y",
          overflowX: "clip",
          overflowY: "visible",
          overscrollBehaviorX: "none",
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
        onLostPointerCapture={() => {
          if (
            horizontalLockRef.current
          ) {
            handlePointerCancel()
          }
        }}
      >
        {/* =====================================================
            CURRENT PAGE
        ===================================================== */}

        <div
          ref={currentPageRef}
          className="relative w-full"
          style={{
            transform:
              "translate3d(0, 0, 0)",
            transition: "none",
            willChange: "transform",
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility:
              "hidden",
            zIndex: 2,
          }}
        >
          {renderPage(activeTab)}
        </div>

        {/* =====================================================
            PREVIOUS PAGE

            It is already rendered, but invisible and positioned
            one full screen to the left.
        ===================================================== */}

        {previousTab && (
          <div
            ref={previousPageRef}
            className="absolute left-0 top-0 w-full"
            style={{
              transform: `translate3d(-${viewportWidth}px, 0, 0)`,
              transition: "none",
              visibility: "hidden",
              willChange: "transform",
              backfaceVisibility: "hidden",
              WebkitBackfaceVisibility:
                "hidden",
              pointerEvents: "none",
              zIndex: 1,
            }}
          >
            {renderPage(previousTab)}
          </div>
        )}

        {/* =====================================================
            NEXT PAGE

            Already rendered one full screen to the right.
        ===================================================== */}

        {nextTab && (
          <div
            ref={nextPageRef}
            className="absolute left-0 top-0 w-full"
            style={{
              transform: `translate3d(${viewportWidth}px, 0, 0)`,
              transition: "none",
              visibility: "hidden",
              willChange: "transform",
              backfaceVisibility: "hidden",
              WebkitBackfaceVisibility:
                "hidden",
              pointerEvents: "none",
              zIndex: 1,
            }}
          >
            {renderPage(nextTab)}
          </div>
        )}
      </div>

      {/* =======================================================
          BOTTOM NAVIGATION

          swipePosition is fractional while dragging.
          Example:
          0 -> Home
          0.5 -> halfway
          1 -> Anime
      ======================================================= */}

      <BottomNavigation
        activeTab={activeTab}
        onTabChange={handleTabChange}
        swipePosition={swipePosition}
        isSwiping={isSwiping}
      />

      {showWelcomePopup && (
        <WelcomePopup
          onClose={handleClosePopup}
        />
      )}
    </div>
  )
}
