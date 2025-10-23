"use client"

interface GenreCategoriesProps {
  genres: string[]
  selectedGenre: string | null
  onGenreSelect: (genre: string | null) => void
}

export default function GenreCategories({ genres, selectedGenre, onGenreSelect }: GenreCategoriesProps) {
  return (
    <div className="bg-black border-b border-slate-700 px-4 py-6">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-white font-bold text-lg mb-4">Categories</h2>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => onGenreSelect(null)}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              selectedGenre === null ? "bg-green-500 text-white" : "bg-slate-700 text-slate-300 hover:bg-slate-600"
            }`}
          >
            All
          </button>
          {genres
            .filter((g) => g !== "All")
            .map((genre) => (
              <button
                key={genre}
                onClick={() => onGenreSelect(genre)}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  selectedGenre === genre ? "bg-green-500 text-white" : "bg-slate-700 text-slate-300 hover:bg-slate-600"
                }`}
              >
                {genre}
              </button>
            ))}
        </div>
      </div>
    </div>
  )
}
