"use client"

import { animes } from "@/lib/anime-data"
import type { Anime } from "@/lib/anime-data"

const trendingIds = [203, 204, 205, 206, 189, 190, 191, 192, 193, 194, 195, 196, 197, 198, 199, 200,]

interface AnimeTrendingCarouselProps {
  onAnimeClick: (anime: Anime) => void
}

export default function AnimeTrendingCarousel({ onAnimeClick }: AnimeTrendingCarouselProps) {
  const trendingAnimes = animes.filter((a) => trendingIds.includes(a.id))
  const totalAnimeCount = animes.length

  return (
    <section className="px-4 py-2">
      <div className="relative flex justify-center -mt-4 mb-0">
        <div
          className="absolute inset-0 -top-20 flex justify-center"
          style={{
            backgroundImage: "url('https://i.postimg.cc/tRMc5ZNM/198b2f01e73b905772279616eccc7c65.jpg')",
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
          }}
        >
          <div className="w-full h-96 bg-gradient-to-b from-black/50 via-black/80 to-black rounded-b-3xl" />
        </div>
        <img
          src="https://i.postimg.cc/R0Z7mhQq/Screenshot-2026-01-25-085527-removebg-preview.png"
          alt="MoviesVerseBD Logo"
          className="relative z-20 w-72 h-72 object-contain"
        />
      </div>

      <div className="relative z-20 -mt-4 mb-6 flex flex-col items-center justify-center">
        <h2
          className="text-xl font-bold text-center tracking-wider animate-pulse"
          style={{
            fontFamily: "'Times New Roman', serif",
            letterSpacing: "0.2em",
            background: "linear-gradient(to right, #ff6b00, #ffa500, #ff6b00)",
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
            color: "transparent",
            textShadow: "0 0 10px rgba(255, 107, 0, 0.7), 0 0 15px rgba(255, 165, 0, 0.5)",
            animation: "fireGlow 2s ease-in-out infinite alternate",
          }}
        >
          Trending Now
        </h2>
        <p className="text-green-500 text-sm mt-2 font-semibold">{totalAnimeCount} anime & series uploaded</p>
        <style jsx>{`
          @keyframes fireGlow {
            0% {
              text-shadow: 0 0 8px rgba(255, 107, 0, 0.7), 0 0 15px rgba(255, 165, 0, 0.5);
              background: linear-gradient(to right, #ff6b00, #ffa500, #ff6b00);
              -webkit-background-clip: text;
              background-clip: text;
            }
            100% {
              text-shadow: 0 0 12px rgba(255, 107, 0, 0.9), 0 0 20px rgba(255, 165, 0, 0.7);
              background: linear-gradient(to right, #ffa500, #ff6b00, #ffa500);
              -webkit-background-clip: text;
              background-clip: text;
            }
          }
        `}</style>
      </div>

      <div
        className="carousel-container relative z-10 flex gap-4 overflow-x-auto overscroll-x-contain touch-pan-x pb-2 snap-x snap-mandatory [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        aria-label="Trending anime"
      >
        {trendingAnimes.map((anime) => (
          <button
            type="button"
            key={anime.id}
            className="flex-shrink-0 w-[31%] sm:w-[22%] md:w-[16%] aspect-[2/3] snap-start rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-transform duration-300 hover:scale-105 cursor-pointer relative"
            onClick={() => onAnimeClick(anime)}
            aria-label={`View details for ${anime.title}`}
          >
            <img
              src={anime.poster || "/placeholder.svg"}
              alt={anime.title}
              className="w-full h-full object-cover"
            />
          </button>
        ))}
      </div>
    </section>
  )
}
