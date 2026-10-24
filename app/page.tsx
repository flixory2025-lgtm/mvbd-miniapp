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
import ModexPage from "@/components/modex-page"
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
   WELCOME POPUP LOCAL STORAGE KEY
========================================================= */

const WELCOME_POPUP_SEEN_KEY = "mvbd_welcome_popup_seen"

/* =========================================================
   LANDING PAGE LOCAL STORAGE KEY
========================================================= */

const LANDING_SEEN_KEY = "mvbd_landing_seen"

/* =========================================================
   ✅ LANGUAGE NORMALIZE HELPER (must match genre-categories)
========================================================= */

const normalizeLanguage = (lang: string): string => {
  if (!lang) return "Others"
  const l = lang.toLowerCase().trim()

  if (l.includes("hindi") || l === "dual audio" || l.includes("हिंदी")) return "Hindi"
  if (l.includes("bangla") || l.includes("bengali") || l.includes("বাংলা")) return "Bangla"
  if (l.includes("korean") || l.includes("kurean")) return "Korean"
  if (l.includes("english") || l === "eng") return "English"
  if (l.includes("telugu")) return "Telugu"
  if (l.includes("malayalam")) return "Malayalam"
  if (l.includes("japanese")) return "Japanese"
  if (l.includes("tamil")) return "Tamil"
  if (l.includes("indonesian")) return "Indonesian"
  if (l.includes("filipino") || l.includes("tagalog")) return "Filipino"
  if (l.includes("thai")) return "Thai"

  return "Others"
}

/* =========================================================
   ✅ TYPE CHECK HELPER (must match genre-categories)
========================================================= */

const isSeriesTitle = (title: string): boolean => {
  return /season|সিজন|season \d|part \d/i.test(title)
}

export default function Page() {
  /* =========================================================
     LANDING PAGE STATE
  ========================================================= */

  const [showLanding, setShowLanding] = useState(() => {
    if (typeof window === "undefined") return true
    try {
      const urlParams = new URLSearchParams(window.location.search)
      if (urlParams.get("from") === "person") {
        return false // Skip landing
      }
    } catch {}
    return true
  })

  const [landingReady, setLandingReady] = useState(false)

  /* =========================================================
     MODEX PAGE (header menu theke new tab e /?page=modex)
  ========================================================= */

  const [showModex, setShowModex] = useState(false)

  /* =========================================================
     LANDING PAGE READY CHECK
  ========================================================= */

  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search)
      if (params.get("page") === "modex") setShowModex(true)
    } catch {}
    setLandingReady(true)
  }, [])

  /* =========================================================
     HANDLE URL PARAM CHANGE
  ========================================================= */

  useEffect(() => {
    if (typeof window === "undefined") return

    const checkUrlParam = () => {
      try {
        const urlParams = new URLSearchParams(window.location.search)
        if (urlParams.get("from") === "person") {
          setShowLanding(false)
          window.history.replaceState(null, "", "/")
        }
      } catch {}
    }

    checkUrlParam()
  }, [])

  /* =========================================================
     HANDLE LANDING → HOME TRANSITION
  ========================================================= */

  const handleEnterSite = () => {
    setShowLanding(false)
  }

  /* =========================================================
     EXISTING STREAMING STATE
  ========================================================= */

  const [searchQuery, setSearchQuery] = useState("")
  const [selectedGenre, setSelectedGenre] =
    useState<string | null>(null)

  /* ✅ NEW: Filter states */
  const [selectedYear, setSelectedYear] = useState<string>("All")
  const [selectedRating, setSelectedRating] = useState<string>("All")
  const [selectedLanguage, setSelectedLanguage] = useState<string>("All")
  const [selectedType, setSelectedType] = useState<string>("All")

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
     OPEN MOVIE FROM PERSON PAGE
  ========================================================= */

  useEffect(() => {
    if (typeof window === "undefined") return
    if (showLanding) return

    try {
      const movieIdStr = sessionStorage.getItem("mvbd_open_movie_id")
      if (!movieIdStr) return

      sessionStorage.removeItem("mvbd_open_movie_id")

      const movieId = parseInt(movieIdStr)
      if (isNaN(movieId)) return

      const target = movies.find((m) => m.id === movieId)
      if (target) {
        setSelectedMovie(target)
        setShowDetailPage(true)
      }
    } catch (err) {
      console.error("Failed to open requested movie:", err)
    }
  }, [showLanding])

  /* =========================================================
     SCROLL RESTORE — Home Movie Detail
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
     SCROLL RESTORE — Anime Detail
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
     WELCOME POPUP
  ========================================================= */

  useEffect(() => {
    if (showLanding) return

    let hasSeenPopup = false

    try {
      hasSeenPopup =
        localStorage.getItem(
          WELCOME_POPUP_SEEN_KEY
        ) === "true"
    } catch (error) {
      hasSeenPopup = false
    }

    if (!hasSeenPopup) {
      const timer = window.setTimeout(() => {
        setShowWelcomePopup(true)
      }, 450)

      return () => {
        window.clearTimeout(timer)
      }
    }
  }, [showLanding])

  const handleClosePopup = () => {
    setShowWelcomePopup(false)

    try {
      localStorage.setItem(
        WELCOME_POPUP_SEEN_KEY,
        "true"
      )
    } catch (error) {
      // silently ignore
    }
  }

  /* =========================================================
     ✅ FILTERED MOVIES (with new filters)
  ========================================================= */

  const filteredMovies = useMemo(() => {
    let filtered = movies

    // Search filter
    if (searchQuery.trim()) {
      filtered = filtered.filter((movie) =>
        movie.title
          .toLowerCase()
          .includes(
            searchQuery.toLowerCase()
          )
      )
    }

    // Genre filter
    if (
      selectedGenre &&
      !searchQuery.trim()
    ) {
      filtered = filtered.filter((movie) =>
        movie.genre.includes(selectedGenre)
      )
    }

    // ✅ Year filter
    if (selectedYear !== "All") {
      filtered = filtered.filter(
        (movie) => movie.year?.trim() === selectedYear
      )
    }

    // ✅ Rating filter (range based: 2.0 → 2.0-2.9, 8.0 → 8.0-8.9)
    if (selectedRating !== "All") {
      const minRating = parseFloat(selectedRating)
      const maxRating = minRating + 1
      filtered = filtered.filter((movie) => {
        const r = parseFloat(movie.rating)
        if (isNaN(r)) return false
        return r >= minRating && r < maxRating
      })
    }

    // ✅ Language filter (normalized)
    if (selectedLanguage !== "All") {
      filtered = filtered.filter(
        (movie) =>
          normalizeLanguage(movie.language || "") === selectedLanguage
      )
    }

    // ✅ Type filter (Movie/Series based on title)
    if (selectedType !== "All") {
      filtered = filtered.filter((movie) => {
        const series = isSeriesTitle(movie.title)
        return selectedType === "Series" ? series : !series
      })
    }

    return [...filtered].sort(
      (a, b) => b.id - a.id
    )
  }, [
    searchQuery,
    selectedGenre,
    selectedYear,
    selectedRating,
    selectedLanguage,
    selectedType,
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
     ✅ NEW: FILTER CHANGE HANDLER
  ========================================================= */

  const handleFilterChange = (filters: {
    year?: string
    rating?: string
    language?: string
    type?: string
  }) => {
    if (filters.year !== undefined) setSelectedYear(filters.year)
    if (filters.rating !== undefined) setSelectedRating(filters.rating)
    if (filters.language !== undefined) setSelectedLanguage(filters.language)
    if (filters.type !== undefined) setSelectedType(filters.type)
    setCurrentPage(1)
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
        <div className="px-4 pt-[96px] py-12 text-center">
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
            <>
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
                // ✅ NEW: Filter props
                selectedYear={selectedYear}
                selectedRating={selectedRating}
                selectedLanguage={selectedLanguage}
                selectedType={selectedType}
                onFilterChange={handleFilterChange}
              />

              {/* ========================================================= */}
              {/* ✅✅✅ Recently Uploaded - Year/Rating/Language/Type এর ঠিক নিচে ✅✅✅ */}
              {/* ========================================================= */}
              <div className="w-full flex justify-center items-center py-5 bg-black">
                <h2 className="recently-uploaded-text text-2xl md:text-3xl text-center">
                  Recently Uploaded
                </h2>

                <style>{`
                  @import url('https://fonts.googleapis.com/css2?family=Roboto:wght@700&display=swap');

                  @keyframes recentlyGreenFlow {
                    0%   { background-position: 0% 50%; }
                    50%  { background-position: 100% 50%; }
                    100% { background-position: 0% 50%; }
                  }

                  .recently-uploaded-text {
                    font-family: 'Roboto', sans-serif;
                    font-weight: 700;
                    letter-spacing: 0.02em;
                    background: linear-gradient(90deg, #15803d, #22c55e, #86efac, #22c55e, #15803d);
                    background-size: 300% 100%;
                    -webkit-background-clip: text;
                    background-clip: text;
                    color: transparent;
                    -webkit-text-fill-color: transparent;
                    filter: drop-shadow(0 0 6px rgba(34, 197, 94, 0.45));
                    animation: recentlyGreenFlow 8s ease-in-out infinite;
                  }
                `}</style>
              </div>
            </>
          )}

          {/* ✅ সার্চ রেজাল্ট সেকশন — pt-[96px] যোগ করা হয়েছে */}
          {isSearching && (
            <div className="px-4 pt-[96px]">
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
     MODEX PAGE
  ========================================================= */

  if (showModex) {
    return <ModexPage />
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
     MAIN RENDER
  ========================================================= */

  return (
    <div
      className={`w-full bg-black ${
        !showLanding && activeTab !== "mebook" ? "lg:pl-[220px]" : ""
      }`}
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
          {/* =================================================
              LANDING PAGE or STREAMING SITE
          ================================================= */}

          {!landingReady ? (
            <div
              style={{
                minHeight: "100vh",
                background: "#000",
              }}
            />
          ) : showLanding ? (
            <LandingPage onEnterSite={handleEnterSite} />
          ) : (
            renderPage(activeTab)
          )}
        </div>

        {/* =====================================================
            BOTTOM NAVIGATION
        ===================================================== */}

        {!showLanding && activeTab !== "mebook" && (
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
          WELCOME POPUP
      ===================================================== */}

      {!showLanding && showWelcomePopup && (
        <WelcomePopup
          onClose={
            handleClosePopup
          }
        />
      )}

      {/* =====================================================
          MVBD AI ASSISTANT
      ===================================================== */}

      {!showLanding && activeTab === "home" && (
        <MvbdAiAssistant />
      )}
    </div>
  )
      }
