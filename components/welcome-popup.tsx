"use client"

import { useState, useEffect } from "react"
import { X } from "lucide-react"

interface WelcomePopupProps {
  onClose: () => void
}

export default function WelcomePopup({ onClose }: WelcomePopupProps) {
  const [displayedText, setDisplayedText] = useState("")
  const [isTypingComplete, setIsTypingComplete] = useState(false)

  const fullText = "Mini App এর সব মুভি আমাদের Telegram এর Private Channel এ দেওয়া আছে। তাই আগে Private Channel এ Join করুন।"

  useEffect(() => {
    let currentIndex = 0
    const typingInterval = setInterval(() => {
      if (currentIndex < fullText.length) {
        setDisplayedText(fullText.slice(0, currentIndex + 1))
        currentIndex++
      } else {
        clearInterval(typingInterval)
        setIsTypingComplete(true)
      }
    }, 40)

    return () => clearInterval(typingInterval)
  }, [])

  const handleJoinChannel = () => {
    window.open("https://t.me/+O-A7AGa-gWNiZWY1", "_blank")
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
      <div className="bg-gradient-to-b from-slate-900 to-slate-950 rounded-2xl max-w-md w-full border border-slate-700 shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-green-500 px-6 py-4 flex items-center justify-between">
          <h2 className="text-white font-bold text-xl">স্বাগতম!</h2>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white transition p-1 rounded-full hover:bg-white/20"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Typewriter Text */}
          <div className="bg-slate-800/50 rounded-xl p-4 mb-6 min-h-[100px] border border-slate-700">
            <p className="text-white text-lg leading-relaxed">
              {displayedText}
              {!isTypingComplete && <span className="inline-block w-0.5 h-5 bg-green-500 ml-1 animate-pulse" />}
            </p>
          </div>

          {/* Notice Box */}
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 mb-6">
            <p className="text-amber-400 text-sm font-medium text-center">⚠️ বিশেষ দ্রষ্টব্য</p>
            <p className="text-slate-300 text-sm text-center mt-2">
              MoviesVerseBD এর সমস্ত মুভি Telegram এর Private Channel এ Upload হয়।
            </p>
          </div>

          {/* Buttons */}
          <div className="flex flex-col gap-3">
            {/* Join Private Channel Button */}
            <button
              onClick={handleJoinChannel}
              className="w-full bg-[#0088cc] hover:bg-[#0077b5] text-white font-bold py-3.5 px-6 rounded-xl flex items-center justify-center gap-3 transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-lg"
            >
              {/* Telegram Icon */}
              <svg viewBox="0 0 24 24" className="w-6 h-6 fill-current">
                <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
              </svg>
              Join Private Channel
            </button>

            {/* Watch Now Button */}
            <button
              onClick={onClose}
              className="w-full bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-white font-medium py-3 px-6 rounded-xl transition-all"
            >
              অন্যথায় মুভি এখনই দেখুন
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
