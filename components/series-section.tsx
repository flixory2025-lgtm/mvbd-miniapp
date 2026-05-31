"use client"

import { useState, useMemo, useRef } from "react"
import Header from "@/components/header"
import MovieGrid from "@/components/movie-grid"
import MovieModal from "@/components/movie-modal"
import GenreCategories from "@/components/genre-categories"
import { movies, genres } from "@/lib/movie-data"
import { Facebook, Send, Instagram, MessageCircle, Youtube, Music } from "lucide-react"

export default function SeriesSection() {
  const [selectedMovie, setSelectedMovie] = useState<(typeof movies)[0] | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedGenre, setSelectedGenre] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [isSearching, setIsSearching] = useState(false)
  
  // Trending carousel states
  const [currentTrendingIndex, setCurrentTrendingIndex] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [startX, setStartX] = useState(0)
  const [scrollLeft, setScrollLeft] = useState(0)
  const [isAutoPlaying, setIsAutoPlaying] = useState(true)
  const carouselRef = useRef<HTMLDivElement>(null)
  const timeoutRef = useRef<NodeJS.Timeout>()
  
  // Footer ripples
  const [ripples, setRipples] = useState<Array<{ id: number; x: number; y: number }>>([])
  const rippleIdRef = useRef(0)

  // Filter movies that contain "season" in title (series)
  const allSeries = useMemo(() => {
    return movies.filter((m) => m.title.toLowerCase().includes("season"))
  }, [])

  // Filter series based on search and genre
  const filteredSeries = useMemo(() => {
    return allSeries.filter((series) => {
      const matchesSearch = series.title.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesGenre =
        selectedGenre === null ||
        selectedGenre === "All" ||
        series.genre.toLowerCase().includes(selectedGenre.toLowerCase())
      return matchesSearch && matchesGenre
    })
  }, [allSeries, searchQuery, selectedGenre])

  // Trending series (first 15 for carousel)
  const trendingSeries = useMemo(() => {
    return allSeries.slice(0, 15)
  }, [allSeries])

  // Auto-scroll functionality for trending carousel
  useEffect(() => {
    if (!isAutoPlaying || trendingSeries.length === 0) return
    
    const interval = setInterval(() => {
      if (carouselRef.current && !isDragging) {
        const scrollAmount = carouselRef.current.clientWidth / 3
        const maxScroll = carouselRef.current.scrollWidth - carouselRef.current.clientWidth
        
        if (carouselRef.current.scrollLeft + scrollAmount >= maxScroll) {
          carouselRef.current.scrollTo({ left: 0, behavior: 'smooth' })
        } else {
          carouselRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' })
        }
        
        const newIndex = Math.round(carouselRef.current.scrollLeft / scrollAmount)
        setCurrentTrendingIndex(newIndex % trendingSeries.length)
      }
    }, 3000)
    
    return () => clearInterval(interval)
  }, [isAutoPlaying, isDragging, trendingSeries.length])

  // Handle manual scroll
  const handleScroll = () => {
    if (carouselRef.current && !isDragging && trendingSeries.length > 0) {
      const scrollAmount = carouselRef.current.clientWidth / 3
      const newIndex = Math.round(carouselRef.current.scrollLeft / scrollAmount)
      setCurrentTrendingIndex(newIndex % trendingSeries.length)
    }
  }

  // Mouse/Touch drag handlers for carousel
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true)
    setIsAutoPlaying(false)
    setStartX(e.pageX - (carouselRef.current?.offsetLeft || 0))
    setScrollLeft(carouselRef.current?.scrollLeft || 0)
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !carouselRef.current) return
    e.preventDefault()
    const x = e.pageX - (carouselRef.current.offsetLeft || 0)
    const walk = (x - startX) * 1.5
    carouselRef.current.scrollLeft = scrollLeft - walk
  }

  const handleMouseUp = () => {
    setIsDragging(false)
    timeoutRef.current = setTimeout(() => {
      setIsAutoPlaying(true)
    }, 5000)
  }

  const handleMouseLeave = () => {
    if (isDragging) {
      setIsDragging(false)
      timeoutRef.current = setTimeout(() => {
        setIsAutoPlaying(true)
      }, 5000)
    }
  }

  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true)
    setIsAutoPlaying(false)
    setStartX(e.touches[0].pageX - (carouselRef.current?.offsetLeft || 0))
    setScrollLeft(carouselRef.current?.scrollLeft || 0)
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || !carouselRef.current) return
    const x = e.touches[0].pageX - (carouselRef.current.offsetLeft || 0)
    const walk = (x - startX) * 1.5
    carouselRef.current.scrollLeft = scrollLeft - walk
  }

  const handleTouchEnd = () => {
    setIsDragging(false)
    timeoutRef.current = setTimeout(() => {
      setIsAutoPlaying(true)
    }, 5000)
  }

  const scrollLeftManual = () => {
    if (carouselRef.current && trendingSeries.length > 0) {
      setIsAutoPlaying(false)
      const scrollAmount = carouselRef.current.clientWidth / 3
      carouselRef.current.scrollBy({ left: -scrollAmount, behavior: 'smooth' })
      
      timeoutRef.current = setTimeout(() => {
        setIsAutoPlaying(true)
      }, 5000)
    }
  }

  const scrollRightManual = () => {
    if (carouselRef.current && trendingSeries.length > 0) {
      setIsAutoPlaying(false)
      const scrollAmount = carouselRef.current.clientWidth / 3
      carouselRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' })
      
      timeoutRef.current = setTimeout(() => {
        setIsAutoPlaying(true)
      }, 5000)
    }
  }

  const goToSlide = (index: number) => {
    if (carouselRef.current && trendingSeries.length > 0) {
      setIsAutoPlaying(false)
      const scrollAmount = carouselRef.current.clientWidth / 3
      carouselRef.current.scrollTo({ left: index * scrollAmount, behavior: 'smooth' })
      setCurrentTrendingIndex(index)
      
      timeoutRef.current = setTimeout(() => {
        setIsAutoPlaying(true)
      }, 5000)
    }
  }

  const handleSearch = (query: string) => {
    setSearchQuery(query)
    setIsSearching(query.trim().length > 0)
    setCurrentPage(1)
  }

  const handleGenreSelect = (genre: string | null) => {
    setSelectedGenre(genre)
    setCurrentPage(1)
  }

  // Footer handlers
  const handleLinkClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    const id = rippleIdRef.current++
    setRipples((prev) => [...prev, { id, x, y }])

    setTimeout(() => {
      setRipples((prev) => prev.filter((r) => r.id !== id))
    }, 600)
  }

  const socialLinks = [
    {
      icon: Facebook,
      url: "https://www.facebook.com/moviesverse.bd",
      label: "Facebook",
      color: "hover:text-blue-400",
    },
    {
      icon: Send,
      url: "https://t.me/addlist/G-AjTDjHEW0yYTJl",
      label: "Telegram",
      color: "hover:text-sky-400",
    },
    {
      icon: Instagram,
      url: "https://www.instagram.com/moviesverse.bd?igsh=MWY1YTJqN2cwNDZlaA==",
      label: "Instagram",
      color: "hover:text-pink-400",
    },
    {
      icon: MessageCircle,
      url: "https://wa.me/qr/D2BVBPREHG4LH1",
      label: "WhatsApp",
      color: "hover:text-green-400",
    },
    {
      icon: Youtube,
      url: "https://youtube.com/@mvbdstudio?si=c5TXOD4la_YEYgkf",
      label: "YouTube",
      color: "hover:text-red-400",
    },
    {
      icon: Music,
      url: "https://www.tiktok.com/@moviesversebd?_r=1&_t=ZS-96egIldETCO",
      label: "TikTok",
      color: "hover:text-slate-300",
    },
  ]

  // Pagination
  const itemsPerPage = 30
  const totalPages = Math.ceil(filteredSeries.length / itemsPerPage)
  const paginatedMovies = filteredSeries.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  return (
    <div className="min-h-screen bg-black pb-0">
      <style jsx global>{`
        @keyframes movieFlicker {
          0%, 100% { opacity: 0.15; }
          50% { opacity: 0.25; }
        }
        
        @keyframes waterRipple {
          0% { transform: scale(0); opacity: 1; }
          100% { transform: scale(2); opacity: 0; }
        }
        
        @keyframes networkMove1 {
          0% { transform: translate(0, 0); }
          100% { transform: translate(20px, -20px); }
        }
        
        @keyframes networkMove2 {
          0% { transform: translate(0, 0); }
          100% { transform: translate(-30px, 15px); }
        }
        
        @keyframes networkMove3 {
          0% { transform: translate(0, 0); }
          100% { transform: translate(25px, 25px); }
        }
        
        .animate-waterRipple {
          animation: waterRipple 0.6s ease-out forwards;
        }
        
        .animate-networkMove1 {
          animation: networkMove1 8s ease-in-out infinite alternate;
        }
        
        .animate-networkMove2 {
          animation: networkMove2 10s ease-in-out infinite alternate;
        }
        
        .animate-networkMove3 {
          animation: networkMove3 12s ease-in-out infinite alternate;
        }
        
        .bg-gradient-radial {
          background: radial-gradient(circle, rgba(59, 130, 246, 0.4), transparent);
        }
        
        .series-header-background {
          position: relative;
          overflow: hidden;
          background: linear-gradient(135deg, rgba(0, 0, 0, 0.8), rgba(20, 20, 40, 0.6));
          padding: 40px 20px;
          margin-bottom: 30px;
        }
        
        .series-title {
          font-size: 3.5rem;
          font-weight: 900;
          background: linear-gradient(135deg, #64c8ff 0%, #22c55e 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          margin: 0;
          letter-spacing: -1px;
        }
        
        @media (max-width: 768px) {
          .series-title { font-size: 2.5rem; }
        }
        
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
      `}</style>

      {/* Header with Search */}
      <Header onSearch={handleSearch} />

      {/* Series Header Background */}
      <div className="series-header-background">
        <div className="relative z-10 text-center">
          <h1 className="series-title">Web Series & TV Shows</h1>
          <p className="text-cyan-300 text-lg mt-4">Explore {allSeries.length} amazing series</p>
        </div>
      </div>

      {/* No Results */}
      {searchQuery.trim() && filteredSeries.length === 0 && (
        <div className="px-4 py-12 text-center">
          <p className="text-lg text-slate-300 mb-6">আমরা দুঃখিত! এই নামের কোনো সিরিজ আমাদের কালেকশনে নেই</p>
        </div>
      )}

      {/* Main Content */}
      {filteredSeries.length > 0 && (
        <>
          {/* Trending Now Carousel */}
          {!isSearching && trendingSeries.length > 0 && (
            <div className="mb-12 px-4">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl md:text-2xl font-bold text-white tracking-wider">
                  Trending Now
                </h2>
                <div className="flex gap-2">
                  <button
                    onClick={scrollLeftManual}
                    className="bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-all duration-300 backdrop-blur-sm"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <button
                    onClick={scrollRightManual}
                    className="bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-all duration-300 backdrop-blur-sm"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Carousel Container */}
              <div 
                ref={carouselRef}
                className="overflow-x-auto scroll-smooth hide-scrollbar cursor-grab active:cursor-grabbing"
                style={{
                  scrollbarWidth: 'none',
                  msOverflowStyle: 'none',
                  WebkitOverflowScrolling: 'touch'
                }}
                onScroll={handleScroll}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseLeave}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
              >
                <div className="flex gap-4" style={{ width: 'max-content' }}>
                  {[...trendingSeries, ...trendingSeries, ...trendingSeries].map((series, index) => (
                    <div
                      key={`${series.id}-${index}`}
                      className="flex-shrink-0 w-40 sm:w-48 md:w-56 lg:w-64 aspect-[2/3] rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-all duration-500 transform hover:scale-105 cursor-pointer relative"
                      onClick={() => setSelectedMovie(series)}
                    >
                      <img
                        src={series.poster}
                        alt={series.title}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300 flex items-end p-3">
                        <p className="text-white text-xs sm:text-sm font-semibold truncate">{series.title}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Indicator Dots */}
              <div className="flex justify-center gap-2 mt-4">
                {trendingSeries.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => goToSlide(index)}
                    className={`transition-all duration-300 ${
                      index === currentTrendingIndex 
                        ? "bg-green-500 w-6 h-2" 
                        : "bg-slate-600 w-2 h-2 hover:bg-slate-500"
                    } rounded-full`}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Genre Categories */}
          {!isSearching && genres.length > 0 && (
            <GenreCategories
              genres={genres}
              selectedGenre={selectedGenre}
              onGenreSelect={handleGenreSelect}
            />
          )}

          {/* Search Results Header */}
          {isSearching && (
            <div className="px-4 pt-4">
              <h2 className="text-xl font-bold text-white mb-2">সার্চ রেজাল্ট: "{searchQuery}"</h2>
              <p className="text-slate-400 text-sm mb-4">{filteredSeries.length} টি সিরিজ পাওয়া গেছে</p>
            </div>
          )}

          {/* Movie Grid */}
          <MovieGrid
            movies={paginatedMovies}
            onMovieClick={setSelectedMovie}
            currentPage={currentPage}
            onPageChange={setCurrentPage}
            totalPages={totalPages}
          />
        </>
      )}

      {/* Movie Modal */}
      {selectedMovie && (
        <MovieModal
          movie={selectedMovie}
          onClose={() => setSelectedMovie(null)}
        />
      )}

      {/* Footer */}
      <footer className="relative overflow-hidden backdrop-blur-xl bg-black/50 border-t border-white/10 mt-12">
        <div className="absolute inset-0 bg-gradient-to-t from-emerald-500/5 to-transparent pointer-events-none"></div>
        
        <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-15">
          <div className="absolute w-[200px] h-[200px] -top-[50px] left-[5%] border-2 border-cyan-400/30 rounded-full animate-networkMove1" />
          <div className="absolute w-[300px] h-[300px] top-[10%] right-[10%] border-2 border-emerald-400/20 rounded-full animate-networkMove2" />
          <div className="absolute w-[250px] h-[250px] -bottom-[30px] right-[15%] border-2 border-cyan-400/25 rounded-full animate-networkMove3" />
        </div>

        <div className="relative px-4 py-8 max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            <div className="space-y-4">
              <h3 className="text-white font-bold text-lg">Movies Verse BD</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                MoviesVerse হল বাংলাদেশের সেরা মুভি স্ট্রিমিং প্ল্যাটফর্ম যেখানে আপনি সর্বশেষ এবং ক্লাসিক মুভি উপভোগ করতে পারেন।
                <br />
                <span className="text-slate-500 text-xs mt-1 block">
                  Your ultimate entertainment destination for the best movies, series, and exclusive content in Bangladesh.
                </span>
              </p>
            </div>

            <div className="space-y-4">
              <h3 className="text-white font-bold text-lg">যোগাযোগ করুন</h3>
              <div className="space-y-2 text-slate-400 text-sm">
                <p>📧 Email: info@moviesverse.com</p>
                <p>📱 Telegram: @moviesversebdreq</p>
              </div>
              <div className="pt-2 space-y-2">
                <h4 className="text-white/80 font-medium text-sm">Quick Links</h4>
                <div className="flex flex-wrap gap-4">
                  <a href="#profile" className="text-slate-400 text-xs hover:text-emerald-400 transition-colors">Profile</a>
                  <a href="#about" className="text-slate-400 text-xs hover:text-emerald-400 transition-colors">About Us</a>
                  <a href="#contact" className="text-slate-400 text-xs hover:text-emerald-400 transition-colors">Contact Us</a>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-white font-bold text-lg">অনুসরণ করুন</h3>
              <div className="flex gap-3 flex-wrap">
                {socialLinks.map((social) => {
                  const Icon = social.icon
                  return (
                    <a
                      key={social.label}
                      href={social.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={handleLinkClick}
                      className={`relative overflow-hidden w-10 h-10 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-white transition-all duration-300 hover:bg-white/20 ${social.color}`}
                      title={social.label}
                    >
                      <Icon className="w-5 h-5" />
                      {ripples.map((ripple) => (
                        <div
                          key={ripple.id}
                          className="absolute w-5 h-5 rounded-full bg-gradient-radial from-blue-500/40 to-transparent pointer-events-none animate-waterRipple"
                          style={{
                            left: `${ripple.x}px`,
                            top: `${ripple.y}px`,
                            marginLeft: "-10px",
                            marginTop: "-10px",
                          }}
                        />
                      ))}
                    </a>
                  )
                })}
              </div>
            </div>
          </div>

          <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent mb-6"></div>

          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left">
            <div className="space-y-2">
              <p className="text-slate-500 text-xs">© 2025 MoviesVerse. সর্বাধিকার সংরক্ষিত। All rights reserved.</p>
              <div className="text-slate-600 text-xs">
                Made by{" "}
                <a
                  href="https://wa.me/qr/R2ZGCQAMXWRPP1"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block ml-1 bg-gradient-to-r from-purple-400 via-pink-400 to-red-400 bg-clip-text text-transparent font-bold hover:opacity-80 transition-opacity cursor-pointer"
                  style={{ fontStyle: "italic", fontFamily: "cursive", letterSpacing: "0.5px" }}
                >
                  Abdul Mazid
                </a>
              </div>
            </div>

            <div className="flex gap-4 text-xs text-slate-500">
              <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
              <span>•</span>
              <a href="#" className="hover:text-white transition-colors">Terms & Conditions</a>
              <span>•</span>
              <a href="#" className="hover:text-white transition-colors">Contact</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
