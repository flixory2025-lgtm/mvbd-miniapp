"use client"

import { X, Play } from "lucide-react"
import { useState } from "react"

interface TelegramJoinPopupProps {
  movieTitle: string
  telegramLink?: string
  onClose: () => void
}

export default function TelegramJoinPopup({ movieTitle, telegramLink, onClose }: TelegramJoinPopupProps) {
  const [hasJoined, setHasJoined] = useState(false)

  const handleWatchNow = () => {
    if (hasJoined && telegramLink) {
      window.open(telegramLink, "_blank")
    }
  }

  const handleJoinChannel = () => {
    window.open("https://t.me/+O-A7AGa-gWNiZWY1", "_blank")
    setHasJoined(true)
  }

  return (
    <div className="fixed inset-0 bg-black/95 flex items-center justify-center z-[70] p-4" onClick={onClose}>
      <div
        className="bg-gradient-to-b from-slate-900 to-black border border-green-500/30 rounded-2xl max-w-md w-full relative overflow-hidden animate-[slideUp_0.3s_ease-out]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Animated background decoration */}
        <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 via-transparent to-blue-500/10 animate-pulse"></div>

        <button
          onClick={onClose}
          className="absolute top-4 right-4 bg-red-600 hover:bg-red-700 text-white p-2 rounded-full transition z-10 animate-bounce"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="relative p-8">
          {/* Icon */}
          <div className="flex justify-center mb-6">
            <div className="bg-gradient-to-br from-green-500 to-blue-500 p-4 rounded-full animate-[spin_3s_linear_infinite]">
              <Play className="w-12 h-12 text-white" />
            </div>
          </div>

          {/* Title */}
          <h2 className="text-2xl font-bold text-white mb-6 text-center leading-relaxed">
            এই মুভিটি দেখতে হলে অবশ্যই আগে আমাদের Telegram Private Channel এ জয়েন করতে হবে!
          </h2>

          {/* Warning message */}
          <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4 mb-6">
            <p className="text-red-300 text-sm text-center font-medium">
              জয়েন ছাড়া Watch Now তে ক্লিক করলে <span className="font-bold text-red-400">Not Available</span> দেখাবে
            </p>
          </div>

          {/* Instruction */}
          <p className="text-slate-300 text-center mb-6 leading-relaxed">
            জয়েন করতে নিচে দেওয়া <span className="text-green-400 font-bold">Private Channel</span> বাটনে ক্লিক করুন। এরপর{" "}
            <span className="text-blue-400 font-bold">Watch Now</span> তে ক্লিক করুন।
          </p>

          {/* Buttons */}
          <div className="space-y-3">
            <button
              onClick={handleJoinChannel}
              className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-3 transition shadow-lg shadow-green-500/50 animate-pulse hover:animate-none"
            >
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z" />
              </svg>
              Private Channel এ জয়েন করুন
            </button>

            <button
              onClick={handleWatchNow}
              disabled={!hasJoined}
              className={`w-full font-bold py-4 rounded-xl flex items-center justify-center gap-3 transition shadow-lg ${
                hasJoined
                  ? "bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-blue-500/50 animate-bounce"
                  : "bg-gray-700 text-gray-400 cursor-not-allowed opacity-50"
              }`}
            >
              <Play className="w-5 h-5" />
              {hasJoined ? "Watch Now" : "Not Available"}
            </button>
          </div>

          {/* Footer note */}
          {hasJoined && (
            <p className="text-green-400 text-sm text-center mt-4 font-medium animate-pulse">
              ✓ আপনি জয়েন করেছেন! এখন Watch Now এ ক্লিক করুন
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
