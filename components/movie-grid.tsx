"use client"

import type { movies as allMovies } from "@/lib/movie-data"
import { useEffect, useState } from "react"
import { getMovieUploadTime, getTimeAgo, setMovieUploadTime } from "@/lib/firebase"

interface MovieGridProps {
  movies: typeof allMovies
  onMovieClick: (movie: (typeof allMovies)[0]) => void
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
  showAdultContent?: boolean
  isSearching?: boolean
}

const isAdultMovie = (genre: string): boolean => {
  return genre.toLowerCase().includes("adult")
}

export default function MovieGrid({
  movies,
  onMovieClick,
  currentPage,
  totalPages,
  onPageChange,
  showAdultContent = false,
  isSearching = false,
}: MovieGridProps) {
  const [uploadTimes, setUploadTimes] = useState<Record<number, string>>({})
  const [uploadDates, setUploadDates] = useState<Record<number, string>>({})

  useEffect(() => {
    const fetchUploadTimes = async () => {
      const times: Record<number, string> = {}
      const dates: Record<number, string> = {}
      for (const movie of movies) {
        let uploadTime = await getMovieUploadTime(movie.id)
        if (!uploadTime) {
          await setMovieUploadTime(movie.id)
          uploadTime = new Date().toISOString()
        }
        dates[movie.id] = uploadTime
        times[movie.id] = getTimeAgo(uploadTime)
      }
      setUploadDates(dates)
      setUploadTimes(times)
    }
    fetchUploadTimes()
  }, [movies])

  useEffect(() => {
    const interval = setInterval(() => {
      setUploadTimes((prev) => {
        const updated: Record<number, string> = {}
        for (const movieId in uploadDates) {
          updated[movieId] = getTimeAgo(uploadDates[movieId])
        }
        return updated
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [uploadDates])

  const getVisiblePages = () => {
    const maxVisible = 5
    let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2))
    const endPage = Math.min(totalPages, startPage + maxVisible - 1)

    if (endPage - startPage + 1 < maxVisible) {
      startPage = Math.max(1, endPage - maxVisible + 1)
    }

    return Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage + i)
  }

  const visiblePages = getVisiblePages()

  return (
    <section className="px-4 py-4">
      {movies.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-slate-400 text-lg">কোনো মুভি পাওয়া যায়নি</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 mb-8">
            {movies.map((movie) => {
              const isAdult = isAdultMovie(movie.genre)
              const shouldBlur = isAdult && !showAdultContent
              return (
                <div key={movie.id} onClick={() => onMovieClick(movie)} className="cursor-pointer group">
                  <div className="aspect-[2/3] rounded-lg overflow-hidden shadow-lg hover:shadow-2xl transition transform hover:scale-105 bg-slate-700 relative">
                    <img
                      src={movie.poster || "/placeholder.svg"}
                      alt={movie.title}
                      className={`w-full h-full object-cover ${shouldBlur ? "blur-lg" : ""}`}
                    />

                    {isAdult && (
                      <span className="absolute top-1 right-1 bg-gradient-to-r from-pink-500 to-red-500 text-white text-[8px] px-1.5 py-0.5 rounded font-bold animate-pulse border border-white z-10">
                        18+
                      </span>
                    )}

                    {movie.language && (
                      <span className="absolute top-1 left-1 bg-black/70 text-white text-[9px] px-1.5 py-0.5 rounded uppercase font-semibold z-10">
                        {movie.language}
                      </span>
                    )}

                    {movie.year && (
                      <span className="absolute bottom-1 left-1 bg-black/60 text-white text-[9px] px-1.5 py-0.5 rounded font-medium z-10">
                        {movie.year}
                      </span>
                    )}

                    {movie.rating && movie.rating !== "not available" && (
                      <span className="absolute bottom-1 right-1 bg-yellow-500/90 text-black text-[9px] px-1.5 py-0.5 rounded font-bold flex items-center gap-0.5 z-10">
                        ⭐ {movie.rating}
                      </span>
                    )}
                  </div>
                  <p className="mt-2 text-xs text-slate-300 line-clamp-2 group-hover:text-white transition">
                    {movie.title}
                  </p>
                  {uploadTimes[movie.id] && <p className="text-[10px] text-green-400 mt-1">{uploadTimes[movie.id]}</p>}
                </div>
              )
            })}
          </div>

          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-1 md:gap-2 py-8 flex-wrap">
              <button
                onClick={() => onPageChange(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="px-2 md:px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition text-sm md:text-base"
              >
                আগে
              </button>

              {visiblePages[0] > 1 && (
                <>
                  <button
                    onClick={() => onPageChange(1)}
                    className="px-2 md:px-3 py-2 bg-slate-700 text-slate-300 hover:bg-slate-600 rounded-lg transition text-sm md:text-base"
                  >
                    1
                  </button>
                  {visiblePages[0] > 2 && <span className="text-slate-400 px-1">...</span>}
                </>
              )}

              {visiblePages.map((page) => (
                <button
                  key={page}
                  onClick={() => onPageChange(page)}
                  className={`px-2 md:px-3 py-2 rounded-lg transition text-sm md:text-base ${
                    currentPage === page ? "bg-green-500 text-white" : "bg-slate-700 text-slate-300 hover:bg-slate-600"
                  }`}
                >
                  {page}
                </button>
              ))}

              {visiblePages[visiblePages.length - 1] < totalPages && (
                <>
                  {visiblePages[visiblePages.length - 1] < totalPages - 1 && (
                    <span className="text-slate-400 px-1">...</span>
                  )}
                  <button
                    onClick={() => onPageChange(totalPages)}
                    className="px-2 md:px-3 py-2 bg-slate-700 text-slate-300 hover:bg-slate-600 rounded-lg transition text-sm md:text-base"
                  >
                    {totalPages}
                  </button>
                </>
              )}

              <button
                onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="px-2 md:px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition text-sm md:text-base"
              >
                পরে
              </button>
            </div>
          )}
        </>
      )}
    </section>
  )
}
