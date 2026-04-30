"use client"

interface GenreCategoriesProps {
  genres: string[]
  selectedGenre: string | null
  onGenreSelect: (genre: string | null) => void
  showAdultContent?: boolean
}

export default function GenreCategories({
  genres,
  selectedGenre,
  onGenreSelect,
  showAdultContent = false,
}: GenreCategoriesProps) {
  return (
    <div className="bg-black/30 backdrop-blur-lg border-b border-white/10 px-4 py-6">
      <style>{`
        @keyframes liquidGlassButtonZoom {
          0% {
            transform: scale(1);
            background: rgba(255, 255, 255, 0.05);
            backdrop-filter: blur(20px);
          }
          50% {
            transform: scale(1.05);
            background: rgba(255, 255, 255, 0.08);
            backdrop-filter: blur(25px);
          }
          100% {
            transform: scale(1.08);
            background: rgba(100, 200, 255, 0.1);
            backdrop-filter: blur(30px);
          }
        }

        .liquid-glass-category {
          background: rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.15);
          border-radius: 16px;
          transition: all 0.3s ease;
        }

        .liquid-glass-category:hover {
          background: rgba(255, 255, 255, 0.08);
          backdrop-filter: blur(25px);
          border: 1px solid rgba(255, 255, 255, 0.25);
          transform: scale(1.02);
        }

        .liquid-glass-category.active {
          background: rgba(100, 200, 255, 0.12);
          backdrop-filter: blur(30px);
          border: 1px solid rgba(100, 200, 255, 0.4);
          animation: liquidGlassButtonZoom 0.5s ease-out;
        }
      `}</style>
      <div className="max-w-7xl mx-auto">
        <h2 className="text-white font-bold text-lg mb-4">Categories</h2>
        <div className="flex gap-3 flex-wrap">
          <button
            onClick={() => onGenreSelect(null)}
            className={`liquid-glass-category px-4 py-2 font-medium transition relative overflow-hidden ${
              selectedGenre === null ? "active text-blue-200" : "text-slate-300"
            }`}
          >
            All
            {selectedGenre === null && (
              <div className="absolute inset-0 pointer-events-none">
                <div className="fire-continuous fire-continuous-1" />
                <div className="fire-continuous fire-continuous-2" />
                <div className="fire-continuous fire-continuous-3" />
                <div className="fire-continuous fire-continuous-4" />
                <div className="fire-continuous fire-continuous-5" />
              </div>
            )}
          </button>
          {genres
            .filter((g) => g !== "All")
            .map((genre) => (
              <button
                key={genre}
                onClick={() => onGenreSelect(genre)}
                className={`liquid-glass-category px-4 py-2 font-medium transition relative overflow-hidden ${
                  selectedGenre === genre ? "active text-blue-200" : "text-slate-300"
                }`}
              >
                {genre}
                {selectedGenre === genre && (
                  <div className="absolute inset-0 pointer-events-none">
                    <div className="fire-continuous fire-continuous-1" />
                    <div className="fire-continuous fire-continuous-2" />
                    <div className="fire-continuous fire-continuous-3" />
                    <div className="fire-continuous fire-continuous-4" />
                    <div className="fire-continuous fire-continuous-5" />
                  </div>
                )}
              </button>
            ))}
        </div>
      </div>
    </div>
  )
}
