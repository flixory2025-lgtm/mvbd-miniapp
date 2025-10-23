"use client"

import type { movies as allMovies } from "@/lib/movie-data"

interface MovieGridProps {
  movies: typeof allMovies
  onMovieClick: (movie: (typeof allMovies)[0]) => void
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
}

export default function MovieGrid({ movies, onMovieClick, currentPage, totalPages, onPageChange }: MovieGridProps) {
  return (
    <section className="px-4 py-8">
      {movies.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-slate-400 text-lg">কোনো মুভি পাওয়া যায়নি</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 mb-8">
            {movies.map((movie) => (
              <div key={movie.id} onClick={() => onMovieClick(movie)} className="cursor-pointer group">
                <div className="aspect-[2/3] rounded-lg overflow-hidden shadow-lg hover:shadow-2xl transition transform hover:scale-105 bg-slate-700">
                  <img
                    src={movie.poster || "/placeholder.svg"}
                    alt={movie.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <p className="mt-2 text-sm text-slate-300 line-clamp-2 group-hover:text-white transition">
                  {movie.title}
                </p>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 py-8">
              <button
                onClick={() => onPageChange(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                আগে
              </button>

              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => onPageChange(page)}
                    className={`px-3 py-2 rounded-lg transition ${
                      currentPage === page
                        ? "bg-green-500 text-white"
                        : "bg-slate-700 text-slate-300 hover:bg-slate-600"
                    }`}
                  >
                    {page}
                  </button>
                ))}
              </div>

              <button
                onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition"
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
