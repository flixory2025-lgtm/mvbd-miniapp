"use client"

interface GenreCategoriesProps {
  genres: string[]
  selectedGenre: string | null
  onGenreSelect: (genre: string | null) => void
}

export default function GenreCategories({ genres, selectedGenre, onGenreSelect }: GenreCategoriesProps) {
  return (
    <section className="px-4 py-6 border-b border-slate-700">
      <div className="flex gap-2 overflow-x-auto pb-2">
        <button
          onClick={() => onGenreSelect(null)}
          className={`px-4 py-2 rounded-full whitespace-nowrap transition ${
            selectedGenre === null ? "bg-green-500 text-white" : "bg-slate-700 text-slate-300 hover:bg-slate-600"
          }`}
        >
          সব
        </button>
        {genres.map((genre) => (
          <button
            key={genre}
            onClick={() => onGenreSelect(genre)}
            className={`px-4 py-2 rounded-full whitespace-nowrap transition ${
              selectedGenre === genre ? "bg-green-500 text-white" : "bg-slate-700 text-slate-300 hover:bg-slate-600"
            }`}
          >
            {genre}
          </button>
        ))}
      </div>
    </section>
  )
}
