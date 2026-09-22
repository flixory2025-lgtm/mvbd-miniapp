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

import { movies, genres } from "@/lib/movie-data"
import { animes } from "@/lib/anime-data"
import type { Anime } from "@/lib/anime-data"

/* =========================================================
   TABS — MUST MATCH bottom-navigation.tsx

   Home → Anime(shorts) → MeBook(mebook)
   → Subscriptions(exclusive) → Profile

   IMPORTANT:
   Horizontal swipe/page navigation is completely disabled.
   Pages can ONLY be changed from BottomNavigation clicks
   or normal programmatic navigation.
========================================================= */

const tabs = [
  "home",
  "shorts",
  "mebook",
  "exclusive",
  "profile",
] as const

type TabId = (typeof tabs)[number]

export default function Home() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedGenre, setSelectedGenre] =
    useState<string | null>(null)

  const [selectedMovie, setSelectedMovie] = useState<
    (typeof movies)[0] | null
  >(null)

  const [currentPage, setCurrentPage] =
    useState(1)

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
     HORIZONTAL TOUCH BLOCKING

     IMPORTANT:

     এখানে কোনো swipe navigation করা হচ্ছে না।

     এই refs শুধু touch-এর শুরুতে X position মনে রাখে,
     যাতে user finger দিয়ে left/right swipe করলে browser/app
     horizontal gesture চালাতে না পারে।

     Vertical scrolling সম্পূর্ণ স্বাভাবিক থাকবে।
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

    /*
      Horizontal movement clearly বেশি হলে
      browser-এর horizontal gesture prevent করা হবে।

      Vertical movement হলে কিছুই করা হবে না,
      তাই normal page scrolling কাজ করবে।
    */

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
     ACTIVE TAB INDEX

     Kept for compatibility / existing logic.
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

     Browser history থাকবে।
     Horizontal swipe navigation নেই।
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
    const timer = window.setTimeout(() => {
      setShowWelcomePopup(true)
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
     PAGE NAVIGATION

     IMPORTANT:
     Page change ONLY happens from this function.

     There is NO swipe-to-page logic.
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
            onMovieClick={(movie) => {
              setSelectedMovie(movie)
              setShowDetailPage(true)
            }}
            currentPage={
              currentPage
            }
            totalPages={
              totalPages
            }
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
     ANIME PAGE
  ========================================================= */

  const renderAnimePage = () => (
    <div className="bg-black">
      <AnimePage
        onAnimeClick={(anime) => {
          setSelectedAnime(anime)
          setShowAnimeDetailPage(
            true
          )
        }}
      />
    </div>
  )

  /* =========================================================
     SERIES / SUBSCRIPTION PAGE
  ========================================================= */

  const renderSeriesPage = () => (
    <div className="bg-black">
      <SeriesSection />
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
        onMovieClick={(movie) =>
          setSelectedMovie(
            movie
          )
        }
        showAdultContent={
          showAdultContent
        }
      />
    )
  }

  /* =========================================================
     MAIN RENDER

     IMPORTANT:

     1. touchAction: "pan-y"
        → vertical scrolling allowed
        → horizontal browser gesture blocked

     2. overscrollBehaviorX: "none"
        → horizontal overscroll disabled

     3. onTouchMove
        → horizontal finger movement detected হলে
          preventDefault()

     4. NO swipe state
        → no isSwiping
        → no swipePosition
        → no previous/next page transform
        → no pointer swipe navigation

     Therefore:
       LEFT/RIGHT SWIPE = NOTHING
       UP/DOWN SCROLL = WORKS
       BOTTOM NAV CLICK = PAGE CHANGES
  ========================================================= */

  return (
    <div
      className="w-full bg-black"
      style={{
        width: "100%",
        minHeight: "100vh",
        overflowX: "hidden",
        overscrollBehaviorX: "none",
        touchAction: "pan-y",
      }}
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
          overflowX: "hidden",
          overflowY: "visible",
          overscrollBehaviorX: "none",
          touchAction: "pan-y",
        }}
      >
        {/* =====================================================
            CURRENT PAGE

            Only activeTab is rendered.
            No previous/next page exists for swipe navigation.
        ===================================================== */}

        <div
          className="relative w-full"
          style={{
            width: "100%",
            overflowX: "hidden",
            touchAction: "pan-y",
          }}
        >
          {renderPage(activeTab)}
        </div>

        {/* =====================================================
            BOTTOM NAVIGATION

            MeBook page-এর সময় hidden থাকবে।
            অন্য page-এ BottomNavigation দিয়ে tab change হবে।

            এখানে কোনো swipe prop দেওয়া হচ্ছে না।
        ===================================================== */}

        {activeTab !== "mebook" && (
          <div
            className="relative z-[50]"
            style={{
              WebkitUserSelect:
                "none",
              userSelect:
                "none",
              touchAction:
                "manipulation",
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

      {showWelcomePopup && (
        <WelcomePopup
          onClose={
            handleClosePopup
          }
        />
      )}

      {/* =====================================================
          MVBD AI ASSISTANT

          Only Home page-এ থাকবে।
      ===================================================== */}

      {activeTab === "home" && (
        <MvbdAiAssistant />
      )}
    </div>
  )
}
