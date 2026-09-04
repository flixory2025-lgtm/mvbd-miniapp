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
import ProfilePage from "@/components/profile-page"
import SeriesSection from "@/components/series-section"
import ContactUsPage from "@/components/contact-us-page"
import AboutUsPage from "@/components/about-us-page"
import SettingsPage from "@/components/settings-page"

import { movies, genres } from "@/lib/movie-data"

type ProfileSubPage =
  | "main"
  | "contact"
  | "about"
  | "settings"

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
    useState<ProfileSubPage>("main")

  /* --------------------------------
     Swipe animation states
  -------------------------------- */

  const [pageAnimation, setPageAnimation] =
    useState<"left" | "right" | "none">("none")

  const touchStartX = useRef(0)
  const touchStartY = useRef(0)

  /* --------------------------------
     ONLY 4 NAVIGATION PAGES
  -------------------------------- */

  const tabs = [
    "home",
    "shorts",
    "exclusive",
    "profile",
  ]

  /* --------------------------------
     Scroll to top on page change
  -------------------------------- */

  useEffect(() => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    })
  }, [currentPage, activeTab])

  /* --------------------------------
     Welcome popup
  -------------------------------- */

  useEffect(() => {
    const hasVisited =
      localStorage.getItem("mvbd_visited")

    if (!hasVisited) {
      setShowWelcomePopup(true)
    }
  }, [])

  /* --------------------------------
     Browser Back Button
  -------------------------------- */

  useEffect(() => {
    const handlePopState = () => {
      setTabHistory((previousHistory) => {
        if (previousHistory.length <= 1) {
          return previousHistory
        }

        const newHistory =
          previousHistory.slice(0, -1)

        const previousTab =
          newHistory[newHistory.length - 1]

        setActiveTab(previousTab)

        return newHistory
      })
    }

    window.addEventListener(
      "popstate",
      handlePopState,
    )

    return () => {
      window.removeEventListener(
        "popstate",
        handlePopState,
      )
    }
  }, [])

  /* --------------------------------
     Change Tab
  -------------------------------- */

  const handleTabChange = (newTab: string) => {
    if (newTab === activeTab) return

    const oldIndex =
      tabs.indexOf(activeTab)

    const newIndex =
      tabs.indexOf(newTab)

    if (newIndex > oldIndex) {
      setPageAnimation("left")
    } else {
      setPageAnimation("right")
    }

    /*
     * Small delay makes the
     * liquid transition feel natural.
     */
    window.setTimeout(() => {
      setActiveTab(newTab)

      setTabHistory((previousHistory) => [
        ...previousHistory,
        newTab,
      ])

      window.history.pushState(
        null,
        "",
        "",
      )

      if (newTab !== "profile") {
        setProfileSubPage("main")
      }
    }, 120)

    window.setTimeout(() => {
      setPageAnimation("none")
    }, 650)
  }

  /* --------------------------------
     TOUCH START
  -------------------------------- */

  const handleTouchStart = (
    event: React.TouchEvent<HTMLDivElement>,
  ) => {
    const touch = event.touches[0]

    touchStartX.current =
      touch.clientX

    touchStartY.current =
      touch.clientY
  }

  /* --------------------------------
     TOUCH END
  -------------------------------- */

  const handleTouchEnd = (
    event: React.TouchEvent<HTMLDivElement>,
  ) => {
    const touch =
      event.changedTouches[0]

    const deltaX =
      touch.clientX -
      touchStartX.current

    const deltaY =
      touch.clientY -
      touchStartY.current

    /*
     * If vertical movement is bigger,
     * user is scrolling — NOT swiping pages.
     */
    if (
      Math.abs(deltaY) >
      Math.abs(deltaX)
    ) {
      return
    }

    /*
     * Minimum horizontal swipe.
     */
    if (Math.abs(deltaX) < 70) {
      return
    }

    const currentIndex =
      tabs.indexOf(activeTab)

    /* Swipe LEFT → next page */
    if (
      deltaX < 0 &&
      currentIndex < tabs.length - 1
    ) {
      handleTabChange(
        tabs[currentIndex + 1],
      )
    }

    /* Swipe RIGHT → previous page */
    if (
      deltaX > 0 &&
      currentIndex > 0
    ) {
      handleTabChange(
        tabs[currentIndex - 1],
      )
    }
  }

  /* --------------------------------
     Popup
  -------------------------------- */

  const handleClosePopup = () => {
    localStorage.setItem(
      "mvbd_visited",
      "true",
    )

    setShowWelcomePopup(false)
  }

  /* --------------------------------
     Movie Filtering
  -------------------------------- */

  const filteredMovies = useMemo(() => {
    let filtered = movies

    if (searchQuery.trim()) {
      filtered = filtered.filter((movie) =>
        movie.title
          .toLowerCase()
          .includes(
            searchQuery.toLowerCase(),
          ),
      )
    }

    if (
      selectedGenre &&
      !searchQuery.trim()
    ) {
      filtered = filtered.filter((movie) =>
        movie.genre.includes(
          selectedGenre,
        ),
      )
    }

    return [...filtered].sort(
      (a, b) => b.id - a.id,
    )
  }, [
    searchQuery,
    selectedGenre,
  ])

  const itemsPerPage = 30

  const totalPages = Math.ceil(
    filteredMovies.length /
      itemsPerPage,
  )

  const paginatedMovies =
    filteredMovies.slice(
      (currentPage - 1) *
        itemsPerPage,

      currentPage *
        itemsPerPage,
    )

  /* --------------------------------
     Search
  -------------------------------- */

  const handleSearch = (
    query: string,
  ) => {
    setSearchQuery(query)
    setCurrentPage(1)

    setIsSearching(
      query.trim().length > 0,
    )
  }

  /* --------------------------------
     Genre
  -------------------------------- */

  const handleGenreSelect = (
    genre: string | null,
  ) => {
    setSelectedGenre(genre)
    setCurrentPage(1)

    setShowAdultContent(
      genre === "Adult",
    )
  }

  /* --------------------------------
     CONTENT
  -------------------------------- */

  const renderContent = () => {
    switch (activeTab) {
      /*
       * HOME
       */

      case "home":
        return (
          <div className="min-h-screen bg-black pb-24">
            <Header
              onSearch={handleSearch}
              pageType="home"
              searchData={movies}
            />

            {searchQuery.trim() &&
            filteredMovies.length === 0 ? (
              <div className="px-4 py-12 text-center">

                <p className="mb-6 text-lg text-slate-300">
                  আমরা দুঃখিত! এই নামের কোনো মুভি
                  আমাদের কালেকশনে নেই
                </p>

                <div className="flex flex-wrap justify-center gap-4">

                  <a
                    href="https://www.facebook.com/groups/733950559669339/?ref=share&mibextid=NSMWBT"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-lg bg-blue-600 px-6 py-2 text-white transition hover:bg-blue-700"
                  >
                    Facebook Group
                  </a>

                  <a
                    href="https://t.me/moviesversebdreq"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-lg bg-sky-500 px-6 py-2 text-white transition hover:bg-sky-600"
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

                    <h2 className="mb-2 text-xl font-bold text-white">
                      সার্চ রেজাল্ট:
                      "{searchQuery}"
                    </h2>

                    <p className="mb-4 text-sm text-slate-400">
                      {filteredMovies.length}
                      টি মুভি পাওয়া গেছে
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
       * ANIME
       */

      case "shorts":
        return (
          <div className="min-h-screen bg-black pb-24">
            <AnimePage />
          </div>
        )

      /*
       * SERIES
       */

      case "exclusive":
        return (
          <div className="min-h-screen bg-black pb-24">
            <SeriesSection />
          </div>
        )

      /*
       * PROFILE
       */

      case "profile":
        return (
          <div className="min-h-screen bg-black pb-24">

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
                    "main",
                  )
                }
              />
            )}

            {profileSubPage === "about" && (
              <AboutUsPage
                onBack={() =>
                  setProfileSubPage(
                    "main",
                  )
                }
              />
            )}

            {profileSubPage === "settings" && (
              <SettingsPage
                onBack={() =>
                  setProfileSubPage(
                    "main",
                  )
                }
              />
            )}

            <Footer />

          </div>
        )

      default:
        return null
    }
  }

  /* --------------------------------
     FINAL UI
  -------------------------------- */

  return (
    <div
      className="min-h-screen w-full overflow-x-hidden bg-black"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >

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

          {/* PAGE TRANSITION WRAPPER */}

          <div
            key={activeTab}
            className={`
              mvbd-page-container
              ${
                pageAnimation === "left"
                  ? "mvbd-slide-left"
                  : ""
              }
              ${
                pageAnimation === "right"
                  ? "mvbd-slide-right"
                  : ""
              }
            `}
          >
            {renderContent()}
          </div>

          {/* BOTTOM NAVIGATION */}

          <BottomNavigation
            activeTab={activeTab}
            onTabChange={
              handleTabChange
            }
          />

          {/* WELCOME */}

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
