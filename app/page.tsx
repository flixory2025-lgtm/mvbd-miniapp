"use client"

import {
  useEffect,
  useMemo,
  useRef,
  useState,
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
import MeBookPage from "@/components/mebook-page"
import { MvbdAiAssistant } from "@/components/mvbd-ai/mvbd-ai-assistant"
import LandingPage from "@/components/landing-page"

import { movies, genres } from "@/lib/movie-data"
import { animes } from "@/lib/anime-data"
import type { Anime } from "@/lib/anime-data"

/* =========================================================
   TABS
========================================================= */

const tabs = [
  "home",
  "shorts",
  "mebook",
  "exclusive",
  "profile",
] as const

type TabId = (typeof tabs)[number]

/* =========================================================
   LOCAL STORAGE KEYS
========================================================= */

const STORAGE_KEY_WELCOME = "mvbd_welcome_seen"

export default function Home() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedGenre, setSelectedGenre] =
    useState<string | null>(null)

  const [selectedMovie, setSelectedMovie] = useState<
    (typeof movies)[0] | null
  >(null)

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

  const [selectedAnime, setSelectedAnime] =
    useState<Anime | null>(null)

  const [showAnimeDetailPage, setShowAnimeDetailPage] =
    useState(false)

  const [profileSubPage, setProfileSubPage] =
    useState<
      "main" | "contact" | "about" | "settings"
    >("main")

  /* =========================================================
     LANDING PAGE STATE
  ========================================================= */

  const [showLanding, setShowLanding] = useState(true)

  /* =========================================================
     SCROLL POSITION
  ========================================================= */

  const homeScrollPositionRef = useRef(0)
  const animeScrollPositionRef = useRef(0)

  const restoreHomeScrollRef = useRef(false)
  const restoreAnimeScrollRef = useRef(false)

  /* =========================================================
     HORIZONTAL SWIPE BLOCKING
  ========================================================= */

  const touchStartXRef = useRef<number | null>(null)
  const touchStartYRef = useRef<number | null>(null)

  const handleTouchStart = (
    e: React.TouchEvent<HTMLDivElement>
  ) => {
    const touch = e.touches[0]

    if (!touch) {
      touchStartXRef.current = null
      touchStartYRef.current = null
      return
    }

    touchStartXRef.current = touch.clientX
    touchStartYRef.current = touch.clientY
  }

  const handleTouchMove = (
    e: React.TouchEvent<HTMLDivElement>
  ) => {
    const touch = e.touches[0]

    if (
      !touch ||
      touchStartXRef.current === null ||
      touchStartYRef.current === null
    ) {
      return
    }

    const deltaX =
      touch.clientX - touchStartXRef.current

    const deltaY =
      touch.clientY - touchStartYRef.current

    if (
      Math.abs(deltaX) >
      Math.abs(deltaY)
    ) {
      e.preventDefault()
    }
  }

  const handleTouchEnd = () => {
    touchStartXRef.current = null
    touchStartYRef.current = null
  }

  const handleTouchCancel = () => {
    touchStartXRef.current = null
    touchStartYRef.current = null
  }

  /* =========================================================
     SCROLL RESTORE — Home
  ========================================================= */

  useEffect(() => {
    if (
      !showDetailPage &&
      restoreHomeScrollRef.current
    ) {
      restoreHomeScrollRef.current = false

      requestAnimationFrame(() => {
        window.scrollTo({
          top: homeScrollPositionRef.current,
          behavior: "instant",
        })
      })
    }
  }, [showDetailPage])

  /* =========================================================
     SCROLL RESTORE — Anime
  ========================================================= */

  useEffect(() => {
    if (
      !showAnimeDetailPage &&
      restoreAnimeScrollRef.current
    ) {
      restoreAnimeScrollRef.current = false

      requestAnimationFrame(() => {
        window.scrollTo({
          top: animeScrollPositionRef.current,
          behavior: "instant",
        })
      })
    }
  }, [showAnimeDetailPage])

  /* =========================================================
     ACTIVE TAB INDEX
  ========================================================= */

  const activeIndex = Math.max(
    0,
    tabs.indexOf(activeTab)
  )

  /* =========================================================
     OPEN SUBSCRIPTIONS EVENT
  ========================================================= */

  useEffect(() => {
    const openSubscriptions = () => {
      setSelectedMovie(null)
      setShowDetailPage(false)
      setActiveTab("exclusive")
      setProfileSubPage("main")
    }

    window.addEventListener(
      "mvbd:open-subscriptions",
      openSubscriptions
    )

    return () => {
      window.removeEventListener(
        "mvbd:open-subscriptions",
        openSubscriptions
      )
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

        const newHistory =
          history.slice(0, -1)

        const previousTab =
          newHistory[newHistory.length - 1]

        if (previousTab) {
          setActiveTab(previousTab)

          if (
            previousTab !== "profile"
          ) {
            setProfileSubPage("main")
          }
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

  /* =========================================================
     WELCOME POPUP — ONLY FIRST VISIT

     Prothom bar user ashle popup dekhabe.
     localStorage e "seen" flag save hobe.
     Porবর্তী bar theke ar dekhabe na।
  ========================================================= */

  useEffect(() => {
    // SSR guard — window access only on client
    if (typeof window === "undefined") return

    // Check if user already saw the popup
    const hasSeenWelcome =
      window.localStorage.getItem(STORAGE_KEY_WELCOME)

    // Already seen → don't show popup
    if (hasSeenWelcome === "true") {
      return
    }

    // First visit → show popup after 450ms
    const timer = window.setTimeout(() => {
      setShowWelcomePopup(true)

      // Mark as seen immediately (even if user closes via X)
      window.localStorage.setItem(
        STORAGE_KEY_WELCOME,
        "true"
      )
    }, 450)

    return () => {
      window.clearTimeout(timer)
    }
  }, [])

  const handleClosePopup = () => {
    setShowWelcomePopup(false)
  }

  /* =========================================================
     FILTERED MOVIES
  ========================================================= */

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
        movie.genre.includes(selectedGenre)
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

  const totalPages = Math.ceil(
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

  /* =========================================================
     SEARCH
  ========================================================= */

  const handleSearch = (
    query: string
  ) => {
    setSearchQuery(query)
    setCurrentPage(1)
    setIsSearching(
      query.trim().length > 0
    )
  }

  /* =========================================================
     GENRE
  ========================================================= */

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
     PAGINATION
  ========================================================= */

  const handleMoviePageChange = (
    page: number
  ) => {
    setCurrentPage(page)

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    })
  }

  /* =========================================================
     HOME MOVIE OPEN
  ========================================================= */

  const handleHomeMovieClick = (
    movie: (typeof movies)[0]
  ) => {
    homeScrollPositionRef.current =
      window.scrollY

    restoreHomeScrollRef.current = true

    setSelectedMovie(movie)
    setShowDetailPage(true)
  }

  /* =========================================================
     ANIME OPEN
  ========================================================= */

  const handleAnimeClick = (
    anime: Anime
  ) => {
    animeScrollPositionRef.current =
      window.scrollY

    restoreAnimeScrollRef.current = true

    setSelectedAnime(anime)
    setShowAnimeDetailPage(true)
  }

  /* =========================================================
     PAGE / TAB NAVIGATION
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

    const targetTab =
      newTab as TabId

    if (
      targetTab === activeTab
    ) {
      return
    }

    setActiveTab(targetTab)

    if (addHistory) {
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
    }

    if (
      targetTab !== "profile"
    ) {
      setProfileSubPage("main")
    }
  }

  /* =========================================================
     HOME PAGE
  ========================================================= */

  const renderHomePage = () => (
    <div className="bg-black">
      <Header
        onSearch={handleSearch}
        searchQuery={searchQuery}
        pageType="home"
        searchData={movies}
      />

      {searchQuery.trim() &&
      filteredMovies.length === 0 ? (
        <div className="px-4 py-12 text-center">
          <p className="mb-6 text-lg text-slate-300">
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
            <div className="w-full">
              <TrendingCarousel
                onMovieClick={
                  handleHomeMovieClick
                }
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
                সার্চ রেজাল্ট: "
                {searchQuery}"
              </h2>

              <p className="text-slate-400 text-sm mb-4">
                {filteredMovies.length} টি মুভি
                পাওয়া গেছে
              </p>
            </div>
          )}

          <MovieGrid
            movies={paginatedMovies}
            onMovieClick={
              handleHomeMovieClick
            }
            currentPage={
              currentPage
            }
            totalPages={
              totalPages
            }
            onPageChange={
              handleMoviePageChange
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
     ANIME PAGE
  ========================================================= */

  const renderAnimePage = () => (
    <div className="bg-black">
      <AnimePage
        onAnimeClick={
          handleAnimeClick
        }
      />
    </div>
  )

  /* =========================================================
     SERIES / SUBSCRIPTION PAGE
  ========================================================= */

  const renderSeriesPage = () => (
    <div className="bg-black">
      <SeriesSection
        onOpenMeBook={() => handleTabChange("mebook")}
      />
    </div>
  )

  /* =========================================================
     MEBOOK PAGE
  ========================================================= */

  const renderMebookPage = () => (
    <div className="bg-black">
      <MeBookPage
        onExit={() =>
          handleTabChange("home")
        }
      />
    </div>
  )

  /* =========================================================
     PROFILE PAGE
  ========================================================= */

  const renderProfilePage = () => (
    <div className="bg-black">
      {profileSubPage ===
        "main" && (
        <ProfilePage
          onNavigate={(page) =>
            setProfileSubPage(
              page
            )
          }
        />
      )}

      {profileSubPage ===
        "contact" && (
        <ContactUsPage
          onBack={() =>
            setProfileSubPage(
              "main"
            )
          }
        />
      )}

      {profileSubPage ===
        "about" && (
        <AboutUsPage
          onBack={() =>
            setProfileSubPage(
              "main"
            )
          }
        />
      )}

      {profileSubPage ===
        "settings" && (
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
     RENDER PAGE
  ========================================================= */

  const renderPage = (
    tab: TabId
  ) => {
    switch (tab) {
      case "home":
        return renderHomePage()

      case "shorts":
        return renderAnimePage()

      case "mebook":
        return renderMebookPage()

      case "exclusive":
        return renderSeriesPage()

      case "profile":
        return renderProfilePage()

      default:
        return renderHomePage()
    }
  }

  /* =========================================================
     ANIME DETAIL PAGE
  ========================================================= */

  if (
    showAnimeDetailPage &&
    selectedAnime
  ) {
    return (
      <MovieDetailPage
        movie={
          selectedAnime as any
        }
        onBack={() => {
          setShowAnimeDetailPage(
            false
          )
          setSelectedAnime(null)
        }}
        onMovieClick={(anime) => {
          setSelectedAnime(
            anime as Anime
          )
        }}
        relatedItems={
          animes as any
        }
        mediaType="anime"
      />
    )
  }

  /* =========================================================
     MOVIE DETAIL PAGE
  ========================================================= */

  if (
    showDetailPage &&
    selectedMovie
  ) {
    return (
      <MovieDetailPage
        movie={selectedMovie}
        onBack={() => {
          setShowDetailPage(
            false
          )
          setSelectedMovie(null)
        }}
        onMovieClick={
          handleHomeMovieClick
        }
        showAdultContent={
          showAdultContent
        }
      />
    )
  }

  /* =========================================================
     LANDING PAGE
  ========================================================= */

  if (showLanding) {
    return (
      <LandingPage
        onEnter={() => setShowLanding(false)}
      />
    )
  }

  /* =========================================================
     MAIN RENDER
  ========================================================= */

  return (
    <div
      className="w-full bg-black"
      onTouchStart={
        handleTouchStart
      }
      onTouchMove={
        handleTouchMove
      }
      onTouchEnd={
        handleTouchEnd
      }
      onTouchCancel={
        handleTouchCancel
      }
    >
      <div
        className="relative w-full"
        style={{
          width: "100%",
          overflowX: "clip",
          overflowY: "visible",
          overscrollBehaviorX: "none",
        }}
      >
        <div
          className="relative w-full"
          style={{
            width: "100%",
            overflowX: "clip",
          }}
        >
          {renderPage(activeTab)}
        </div>

        {/* =====================================================
            BOTTOM NAVIGATION
        ===================================================== */}

        {activeTab !== "mebook" && (
          <div
            className="relative z-[50]"
            style={{
              WebkitUserSelect:
                "none",
              userSelect:
                "none",
            }}
          >
            <BottomNavigation
              activeTab={
                activeTab
              }
              onTabChange={
                handleTabChange
              }
            />
          </div>
        )}
      </div>

      {/* =====================================================
          WELCOME POPUP — ONLY FIRST VISIT
      ===================================================== */}

      {showWelcomePopup && (
        <WelcomePopup
          onClose={
            handleClosePopup
          }
        />
      )}

      {/* =====================================================
          MVBD AI ASSISTANT
      ===================================================== */}

      {activeTab === "home" && (
        <MvbdAiAssistant />
      )}
    </div>
  )
}
