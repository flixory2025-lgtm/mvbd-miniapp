"use client"

import { X, Play } from "lucide-react"
import { useState } from "react"

interface TelegramJoinPopupProps {
  movieTitle: string
  telegramLink?: string
  moviePoster?: string
  onClose: () => void
}

export default function TelegramJoinPopup({ movieTitle, telegramLink, moviePoster, onClose }: TelegramJoinPopupProps) {
  const [hasJoined, setHasJoined] = useState(false)

  const handleWatchNow = () => {
    // Open the telegram movie link if available, otherwise default channel
    const linkToOpen = telegramLink || "https://t.me/+O-A7AGa-gWNiZWY1"
    window.open(linkToOpen, "_blank")
  }

  const handleJoinChannel = () => {
    window.open("https://t.me/+O-A7AGa-gWNiZWY1", "_blank")
    setHasJoined(true)
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[70] p-4" onClick={onClose}>
      <style>{`
        @keyframes liquidGlassShimmer {
          0% {
            background-position: 200% center;
          }
          100% {
            background-position: -200% center;
          }
        }

        @keyframes floatAnimation {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-8px);
          }
        }

        @keyframes borderGlow {
          0%, 100% {
            border-color: rgba(34, 197, 94, 0.3);
            box-shadow: 0 0 20px rgba(34, 197, 94, 0.2), inset 0 0 40px rgba(255, 255, 255, 0.05);
          }
          50% {
            border-color: rgba(34, 197, 94, 0.6);
            box-shadow: 0 0 40px rgba(34, 197, 94, 0.4), inset 0 0 60px rgba(255, 255, 255, 0.1);
          }
        }

        .liquid-glass-popup {
          background: rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(30px);
          border: 1px solid rgba(255, 255, 255, 0.15);
          animation: borderGlow 3s ease-in-out infinite;
        }

        .liquid-glass-button {
          background: rgba(255, 255, 255, 0.08);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.2);
          transition: all 0.3s ease;
        }

        .liquid-glass-button:hover {
          background: rgba(255, 255, 255, 0.15);
          border: 1px solid rgba(255, 255, 255, 0.3);
          transform: scale(1.02);
        }

        .liquid-glass-button.green {
          background: rgba(34, 197, 94, 0.15);
          border: 1px solid rgba(34, 197, 94, 0.4);
        }

        .liquid-glass-button.green:hover {
          background: rgba(34, 197, 94, 0.25);
          border: 1px solid rgba(34, 197, 94, 0.6);
          box-shadow: 0 0 25px rgba(34, 197, 94, 0.4);
        }

        .liquid-glass-button.blue {
          background: rgba(59, 130, 246, 0.15);
          border: 1px solid rgba(59, 130, 246, 0.4);
        }

        .liquid-glass-button.blue:hover {
          background: rgba(59, 130, 246, 0.25);
          border: 1px solid rgba(59, 130, 246, 0.6);
          box-shadow: 0 0 25px rgba(59, 130, 246, 0.4);
        }

        .icon-float {
          animation: floatAnimation 3s ease-in-out infinite;
        }

        .warning-glass {
          background: rgba(239, 68, 68, 0.1);
          backdrop-filter: blur(15px);
          border: 1px solid rgba(239, 68, 68, 0.3);
        }
      `}</style>
      
      <div
        className="liquid-glass-popup rounded-3xl max-w-md w-full relative overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Animated gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 via-transparent to-blue-500/5 pointer-events-none" />

        <button
          onClick={onClose}
          className="absolute top-4 right-4 liquid-glass-button text-white p-2 rounded-full z-10 hover:bg-red-500/20 hover:border-red-500/40"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="relative p-8">
          <div className="flex justify-center mb-6">
            <div className="liquid-glass-button green p-5 rounded-full icon-float">
              <Play className="w-10 h-10 text-green-400" />
            </div>
          </div>

          <h2 className="text-2xl font-bold text-white mb-6 text-center leading-relaxed">
            এই মুভিটি দেখতে হলে অবশ্যই আগে আমাদের Telegram Private Channel এ জয়েন করতে হবে!
          </h2>

          <div className="warning-glass rounded-xl p-4 mb-6">
            <p className="text-red-300 text-sm text-center font-medium">জয়েন না করে দেখতে গেলে সমস্যা হতে পারে</p>
          </div>

          <p className="text-slate-300 text-center mb-6 leading-relaxed">
            জয়েন করতে নিচে দেওয়া <span className="text-green-400 font-bold">Private Channel</span> বাটনে ক্লিক করুন। এরপর{" "}
            <span className="text-blue-400 font-bold">Watch Now</span> তে ক্লিক করুন।
          </p>

          <div className="space-y-3">
            <button
              onClick={handleJoinChannel}
              className="w-full liquid-glass-button green text-white font-bold py-4 rounded-xl flex items-center justify-center gap-3 transition"
            >
              <svg className="w-6 h-6 text-green-400" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z" />
              </svg>
              Private Channel এ জয়েন করুন
            </button>

            <button
              onClick={handleWatchNow}
              className="w-full liquid-glass-button blue text-white font-bold py-4 rounded-xl flex items-center justify-center gap-3 transition"
            >
              <Play className="w-5 h-5 text-blue-400" />
              Watch Now
            </button>
          </div>

          {hasJoined && (
            <p className="text-green-400 text-sm text-center mt-4 font-medium">
              ✓ আপনি জয়েন করেছেন! এখন Watch Now এ ক্লিক করুন
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
