"use client"

import React from "react"

import { useState } from "react"
import {
  Facebook,
  Send,
  Youtube,
  X,
} from "lucide-react"

interface Platform {
  id: string
  name: string
  icon: React.ReactNode
  url: string
  description: string
  color: string
}

const PLATFORMS: Platform[] = [
  {
    id: "facebook-page",
    name: "Facebook Page",
    icon: <Facebook className="w-8 h-8" />,
    url: "https://www.facebook.com/profile.php?id=61577718582563",
    description: "Join our official Facebook page for updates and community discussions",
    color: "from-blue-600 to-blue-400",
  },
  {
    id: "facebook-group",
    name: "Facebook Group",
    icon: <Facebook className="w-8 h-8" />,
    url: "https://facebook.com/groups/963258709145001/",
    description: "Connect with our community in our exclusive Facebook group",
    color: "from-blue-700 to-blue-500",
  },
  {
    id: "telegram-mini",
    name: "Telegram Private Channel",
    icon: <Send className="w-8 h-8" />,
    url: "https://t.me/+O-A7AGa-gWNiZWY1",
    description: "Access our mini app with exclusive movie and series uploads",
    color: "from-blue-500 to-cyan-400",
  },
  {
    id: "telegram-pm",
    name: "MVBD PM Channel",
    icon: <Send className="w-8 h-8" />,
    url: "https://t.me/mvbdpm1",
    description: "First release channel where movies are uploaded (auto-delete after 2 days)",
    color: "from-cyan-500 to-blue-400",
  },
  {
    id: "telegram-anime",
    name: "Anime Verse BD",
    icon: <Send className="w-8 h-8" />,
    url: "https://t.me/animeversebd",
    description: "Your source for all anime series and movies",
    color: "from-purple-500 to-pink-400",
  },
  {
    id: "telegram-18",
    name: "18+ Movies Channel",
    icon: <Send className="w-8 h-8" />,
    url: "https://t.me/MoviesVerseBD",
    description: "Adult content channel - 18+ only",
    color: "from-red-600 to-orange-500",
  },
  {
    id: "telegram-updates",
    name: "Updates Channel",
    icon: <Send className="w-8 h-8" />,
    url: "https://t.me/+-9GyUKquiKs0MGM1",
    description: "Daily updates from all our channels with direct links",
    color: "from-yellow-500 to-orange-400",
  },
  {
    id: "telegram-exclusive",
    name: "Exclusive Channel",
    icon: <Send className="w-8 h-8" />,
    url: "https://t.me/moviesversebdup",
    description: "Announcements, news, and exclusive content",
    color: "from-indigo-500 to-purple-400",
  },
  {
    id: "telegram-request",
    name: "Movie Request Group",
    icon: <Send className="w-8 h-8" />,
    url: "https://t.me/moviesversebdreq",
    description: "Request your favorite movies and series here",
    color: "from-green-500 to-emerald-400",
  },
  {
    id: "youtube",
    name: "YouTube Channel",
    icon: <Youtube className="w-8 h-8" />,
    url: "https://youtube.com/@mvbdstudio?si=FtT4dcBYhenGnfnR",
    description: "Subscribe to our YouTube channel for trailers and updates",
    color: "from-red-600 to-red-400",
  },
]

export default function PlatformsSection() {
  const [selectedPlatform, setSelectedPlatform] = useState<Platform | null>(null)

  const handleJoinNow = () => {
    if (selectedPlatform) {
      window.open(selectedPlatform.url, "_blank")
    }
  }

  const handleJoinLater = () => {
    setSelectedPlatform(null)
  }

  return (
    <section className="px-4 py-12 bg-gradient-to-b from-black to-gray-900">
      <div className="max-w-6xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Our Platforms
          </h2>
          <div className="flex items-center justify-center gap-3">
            <div className="w-16 h-1 bg-gradient-to-r from-blue-500 to-transparent"></div>
            <p className="text-2xl font-semibold text-green-400">
              {PLATFORMS.length} Platforms
            </p>
            <div className="w-16 h-1 bg-gradient-to-l from-blue-500 to-transparent"></div>
          </div>
        </div>

        {/* Platforms Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
          {PLATFORMS.map((platform) => (
            <button
              key={platform.id}
              onClick={() => setSelectedPlatform(platform)}
              className="group relative overflow-hidden rounded-lg p-4 h-32 flex flex-col items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 hover:border-gray-500 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/50"
            >
              {/* Background gradient */}
              <div
                className={`absolute inset-0 bg-gradient-to-br ${platform.color} opacity-0 group-hover:opacity-10 transition-opacity duration-300`}
              ></div>

              {/* Content */}
              <div className="relative z-10 flex flex-col items-center gap-2">
                <div className="text-white group-hover:scale-110 transition-transform duration-300">
                  {platform.icon}
                </div>
                <p className="text-xs sm:text-sm font-semibold text-gray-200 text-center line-clamp-2 group-hover:text-white transition-colors">
                  {platform.name}
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Platform Modal/Popup */}
      {selectedPlatform && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-gradient-to-b from-gray-900 to-black rounded-2xl border border-gray-700 max-w-sm w-full p-8 shadow-2xl shadow-blue-500/20 animate-in fade-in zoom-in duration-300">
            {/* Close Button */}
            <button
              onClick={() => setSelectedPlatform(null)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>

            {/* Icon */}
            <div className="flex justify-center mb-6">
              <div
                className={`p-4 rounded-full bg-gradient-to-br ${selectedPlatform.color} text-white shadow-lg`}
              >
                {selectedPlatform.icon}
              </div>
            </div>

            {/* Title */}
            <h3 className="text-2xl font-bold text-white text-center mb-2">
              {selectedPlatform.name}
            </h3>

            {/* Description */}
            <p className="text-gray-300 text-center mb-6 leading-relaxed">
              {selectedPlatform.description}
            </p>

            {/* Buttons */}
            <div className="flex gap-3">
              <button
                onClick={handleJoinNow}
                className="flex-1 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold py-3 rounded-lg transition-all duration-300 transform hover:scale-105"
              >
                Join Now
              </button>
              <button
                onClick={handleJoinLater}
                className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-semibold py-3 rounded-lg transition-all duration-300"
              >
                Join Later
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
