"use client"

import { createPortal } from "react-dom"
import { useEffect, useState } from "react"

interface GenreCategoriesProps {
  genres: string[]
  selectedGenre: string | null
  onGenreSelect: (genre: string | null) => void
  showAdultContent?: boolean
}

type AppModal = "tutorial" | "download" | null

const tutorialVideoId = "6UU7_yeJ2ws"
const apkDownloadUrl = "https://github.com/flixory2025-lgtm/mvbd-miniapp/releases/download/1%2C5v/MVBD.1.apk"

export default function GenreCategories({
  genres,
  selectedGenre,
  onGenreSelect,
  showAdultContent = false,
}: GenreCategoriesProps) {
  const [activeModal, setActiveModal] = useState<AppModal>(null)

  useEffect(() => {
    if (!activeModal) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setActiveModal(null)
    }

    document.addEventListener("keydown", handleKeyDown)
    document.body.style.overflow = "hidden"
    return () => {
      document.removeEventListener("keydown", handleKeyDown)
      document.body.style.overflow = ""
    }
  }, [activeModal])

  return (
    <div className="bg-black/30 backdrop-blur-lg border-b border-white/10 px-4 py-6">
      <style>{`
        @keyframes liquidGlassButtonZoom {
          0% { transform: scale(1); background: rgba(255, 255, 255, 0.05); backdrop-filter: blur(20px); }
          50% { transform: scale(1.05); background: rgba(255, 255, 255, 0.08); backdrop-filter: blur(25px); }
          100% { transform: scale(1.08); background: rgba(100, 200, 255, 0.1); backdrop-filter: blur(30px); }
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
            {selectedGenre === null && <CategoryHighlight />}
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
                {selectedGenre === genre && <CategoryHighlight />}
              </button>
            ))}
          <button
            type="button"
            onClick={() => setActiveModal("tutorial")}
            className="liquid-glass-category px-4 py-2 font-medium text-cyan-200 hover:text-cyan-100"
          >
            mvbd mini app tutorial
          </button>
          <button
            type="button"
            onClick={() => setActiveModal("download")}
            className="liquid-glass-category px-4 py-2 font-medium text-emerald-200 hover:text-emerald-100"
          >
            download app for better experience
          </button>
        </div>
      </div>

      {activeModal && typeof document !== "undefined" &&
        createPortal(
          <div
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 p-4 backdrop-blur-xl"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setActiveModal(null)
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="app-feature-title"
            className="relative z-[10000] w-full max-w-2xl overflow-hidden rounded-2xl border border-white/20 bg-slate-950 text-white shadow-2xl ring-1 ring-black/40"
          >
            <button
              type="button"
              aria-label="Close popup"
              onClick={() => setActiveModal(null)}
              className="absolute right-3 top-3 z-10 rounded-full bg-black/60 px-3 py-1 text-2xl leading-none text-slate-200 transition hover:bg-white/15 hover:text-white"
            >
              ×
            </button>
            {activeModal === "tutorial" ? (
              <>
                <div className="px-6 pb-4 pt-6 pr-14">
                  <h3 id="app-feature-title" className="text-xl font-bold text-balance">mvbd mini app tutorial</h3>
                  <p className="mt-1 text-sm text-slate-400">ভিডিওটি দেখে অ্যাপটি আরও সহজে ব্যবহার করুন।</p>
                </div>
                <div className="aspect-video w-full bg-black">
                  <iframe
                    className="h-full w-full"
                    src={`https://www.youtube.com/embed/${tutorialVideoId}?autoplay=1&rel=0`}
                    title="MVBD Mini App tutorial"
                    allow="autoplay; encrypted-media; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              </>
            ) : (
              <div className="px-6 pb-7 pt-8 pr-14">
                <h3 id="app-feature-title" className="text-xl font-bold text-balance">Download app for better experience</h3>
                <p className="mt-3 leading-6 text-slate-300">
                  MVBD Mini App ব্যবহার করলে মুভি ব্রাউজিং হবে আরও দ্রুত ও সুবিধাজনক। অ্যাপ থেকে সহজে মুভি খুঁজে পাবেন, স্মুথ নেভিগেশন উপভোগ করবেন এবং মোবাইলে আরও ভালো অভিজ্ঞতা পাবেন।
                </p>
                <ul className="mt-4 list-disc space-y-2 pl-5 leading-6 text-slate-400">
                  <li>দ্রুত ও সহজে মুভি এবং সিরিজ খুঁজে দেখুন</li>
                  <li>মোবাইলের জন্য তৈরি স্মুথ অ্যাপ অভিজ্ঞতা</li>
                  <li>অবশ্যই মিনি অ্যাপ টি ডাউনলোড করতে হলে আপনাকে chrome browser এ গিয়ে mvbds.xyz ওখান থেকে আমাদের সাইট এ প্রবেশ করে এরপর ডাউনলোড বাটন এ ক্লিক করলে ডিরেক্ট ডাউনলোড হবে।</li>
                </ul>
                <a
                  href={apkDownloadUrl}
                  download
                  className="mt-6 inline-flex rounded-lg bg-emerald-500 px-5 py-3 font-semibold text-slate-950 transition hover:bg-emerald-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300"
                >
                  Download Now
                </a>
              </div>
            )}
          </section>
          </div>,
          document.body,
        )}
    </div>
  )
}

function CategoryHighlight() {
  return (
    <div className="absolute inset-0 pointer-events-none">
      <div className="fire-continuous fire-continuous-1" />
      <div className="fire-continuous fire-continuous-2" />
      <div className="fire-continuous fire-continuous-3" />
      <div className="fire-continuous fire-continuous-4" />
      <div className="fire-continuous fire-continuous-5" />
    </div>
  )
}
