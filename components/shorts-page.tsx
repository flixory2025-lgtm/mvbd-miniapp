"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Heart, MessageCircle, Share2, Play, Pause } from "lucide-react"
import { collection, doc, updateDoc, increment, onSnapshot } from "firebase/firestore"
import { db } from "@/lib/firebase"

interface Short {
  id: string
  title: string
  description: string
  videoUrl: string
  likes: number
  comments: number
}

export default function ShortsPage() {
  const [shorts, setShorts] = useState<Short[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(true)
  const [userLikes, setUserLikes] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [showPlayIcon, setShowPlayIcon] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const videoRef = useRef<HTMLIFrameElement>(null)
  const touchStartY = useRef(0)
  const isScrolling = useRef(false)

  useEffect(() => {
    const shortsCollection = collection(db, "shorts")
    const unsubscribe = onSnapshot(shortsCollection, (snapshot) => {
      const shortsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Short[]
      setShorts(shortsData)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  useEffect(() => {
    const savedLikes = localStorage.getItem("mvbd_liked_shorts")
    if (savedLikes) {
      setUserLikes(new Set(JSON.parse(savedLikes)))
    }
  }, [])

  useEffect(() => {
    if (shorts.length > 0) {
      const randomIndex = Math.floor(Math.random() * shorts.length)
      setCurrentIndex(randomIndex)
    }
  }, [shorts.length])

  useEffect(() => {
    setIsPlaying(true)
  }, [currentIndex])

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (isScrolling.current) return

    const touchEndY = e.changedTouches[0].clientY
    const diff = touchStartY.current - touchEndY

    if (Math.abs(diff) > 50) {
      isScrolling.current = true
      if (diff > 0 && currentIndex < shorts.length - 1) {
        setCurrentIndex(currentIndex + 1)
      } else if (diff < 0 && currentIndex > 0) {
        setCurrentIndex(currentIndex - 1)
      }
      setTimeout(() => {
        isScrolling.current = false
      }, 500)
    }
  }

  const handleWheel = (e: React.WheelEvent) => {
    if (isScrolling.current) return

    if (Math.abs(e.deltaY) > 30) {
      isScrolling.current = true
      if (e.deltaY > 0 && currentIndex < shorts.length - 1) {
        setCurrentIndex(currentIndex + 1)
      } else if (e.deltaY < 0 && currentIndex > 0) {
        setCurrentIndex(currentIndex - 1)
      }
      setTimeout(() => {
        isScrolling.current = false
      }, 500)
    }
  }

  const togglePlayPause = () => {
    setIsPlaying(!isPlaying)
    setShowPlayIcon(true)
    setTimeout(() => setShowPlayIcon(false), 600)
  }

  const toggleLike = async () => {
    if (!shorts[currentIndex]) return

    const shortId = shorts[currentIndex].id
    const isLiked = userLikes.has(shortId)

    try {
      const shortRef = doc(db, "shorts", shortId)
      await updateDoc(shortRef, {
        likes: increment(isLiked ? -1 : 1),
      })

      const newLikes = new Set(userLikes)
      if (isLiked) {
        newLikes.delete(shortId)
      } else {
        newLikes.add(shortId)
      }
      setUserLikes(newLikes)
      localStorage.setItem("mvbd_liked_shorts", JSON.stringify(Array.from(newLikes)))
    } catch (error) {
      console.error("Error updating like:", error)
    }
  }

  const handleComment = async () => {
    if (!shorts[currentIndex]) return

    try {
      const shortRef = doc(db, "shorts", shorts[currentIndex].id)
      await updateDoc(shortRef, {
        comments: increment(1),
      })
    } catch (error) {
      console.error("Error updating comment:", error)
    }
  }

  const getYouTubeEmbedUrl = (url: string) => {
    const shortRegex = /youtube\.com\/shorts\/([a-zA-Z0-9_-]+)/
    const match = url.match(shortRegex)
    if (match) {
      return `https://www.youtube.com/embed/${match[1]}?autoplay=1&mute=0&controls=0&modestbranding=1&rel=0&loop=1&playlist=${match[1]}`
    }
    return url
  }

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center z-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-red-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-white font-semibold">Loading Shorts...</p>
        </div>
      </div>
    )
  }

  if (shorts.length === 0) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center z-50">
        <div className="flex flex-col items-center gap-4 px-4 text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-red-500 to-pink-500 rounded-full flex items-center justify-center">
            <Play className="w-10 h-10 text-white" />
          </div>
          <p className="text-white text-xl font-bold">No Shorts Available</p>
          <p className="text-slate-400 text-sm">Shorts will appear here once uploaded</p>
        </div>
      </div>
    )
  }

  const currentShort = shorts[currentIndex]
  const isLiked = userLikes.has(currentShort.id)

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 bg-black overflow-hidden z-40"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onWheel={handleWheel}
    >
      <div className="relative w-full h-full transition-transform duration-500 ease-out" onClick={togglePlayPause}>
        <iframe
          ref={videoRef}
          key={`${currentShort.id}-${currentIndex}`}
          src={getYouTubeEmbedUrl(currentShort.videoUrl)}
          className="absolute inset-0 w-full h-full object-cover"
          allow="autoplay; encrypted-media"
          allowFullScreen
          style={{ pointerEvents: "none" }}
        />

        {showPlayIcon && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30">
            <div className="bg-black/60 rounded-full p-6 animate-ping">
              {isPlaying ? (
                <Play className="w-12 h-12 text-white" fill="white" />
              ) : (
                <Pause className="w-12 h-12 text-white" fill="white" />
              )}
            </div>
          </div>
        )}

        <div className="absolute top-0 left-0 right-0 h-20 bg-gradient-to-b from-black/40 to-transparent z-10 pointer-events-none">
          <div className="flex items-center justify-between px-4 pt-4">
            <p className="text-white font-bold text-base drop-shadow-lg">Shorts</p>
            <div className="flex gap-2">
              <div className="w-8 h-8 rounded-full bg-white/10 backdrop-blur-sm" />
            </div>
          </div>
        </div>

        <div className="absolute bottom-16 left-0 right-0 z-20 pointer-events-none">
          <div className="bg-gradient-to-t from-black/90 via-black/50 to-transparent pt-20 pb-4">
            <div className="flex items-end px-4 gap-3">
              <div className="flex-1 min-w-0 pb-2">
                <h2
                  className="text-white font-bold text-base mb-1 line-clamp-2"
                  style={{ textShadow: "2px 2px 8px rgba(0,0,0,0.9), 0 0 20px rgba(0,0,0,0.8)" }}
                >
                  {currentShort.title}
                </h2>
                <p
                  className="text-white/90 text-sm line-clamp-2 leading-relaxed"
                  style={{ textShadow: "1px 1px 6px rgba(0,0,0,0.9), 0 0 15px rgba(0,0,0,0.7)" }}
                >
                  {currentShort.description}
                </p>
              </div>

              {/* Right side: Action buttons */}
              <div className="flex flex-col items-center gap-4 pb-1 pointer-events-auto">
                {/* Like button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    toggleLike()
                  }}
                  className="flex flex-col items-center gap-1 transition-transform active:scale-95"
                >
                  <div className={`transition-all duration-300 ${isLiked ? "scale-110" : "scale-100"}`}>
                    <Heart
                      className={`w-7 h-7 transition-colors ${
                        isLiked ? "fill-red-500 text-red-500" : "text-white fill-none"
                      }`}
                      strokeWidth={2.5}
                      style={{ filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.8))" }}
                    />
                  </div>
                  <span className="text-white text-xs font-bold" style={{ textShadow: "1px 1px 4px rgba(0,0,0,0.9)" }}>
                    {currentShort.likes >= 1000 ? `${(currentShort.likes / 1000).toFixed(1)}K` : currentShort.likes}
                  </span>
                </button>

                {/* Comment button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleComment()
                  }}
                  className="flex flex-col items-center gap-1 transition-transform active:scale-95"
                >
                  <MessageCircle
                    className="w-7 h-7 text-white"
                    strokeWidth={2.5}
                    style={{ filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.8))" }}
                  />
                  <span className="text-white text-xs font-bold" style={{ textShadow: "1px 1px 4px rgba(0,0,0,0.9)" }}>
                    {currentShort.comments >= 1000
                      ? `${(currentShort.comments / 1000).toFixed(1)}K`
                      : currentShort.comments}
                  </span>
                </button>

                {/* Share button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    if (navigator.share) {
                      navigator.share({
                        title: currentShort.title,
                        text: currentShort.description,
                        url: window.location.href,
                      })
                    }
                  }}
                  className="flex flex-col items-center gap-1 transition-transform active:scale-95"
                >
                  <Share2
                    className="w-7 h-7 text-white"
                    strokeWidth={2.5}
                    style={{ filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.8))" }}
                  />
                  <span className="text-white text-xs font-bold" style={{ textShadow: "1px 1px 4px rgba(0,0,0,0.9)" }}>
                    Share
                  </span>
                </button>

                {/* Profile circle */}
                <div className="mt-1">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-red-500 to-pink-500 flex items-center justify-center border-2 border-white shadow-lg">
                    <span className="text-white font-bold text-xs">MB</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Progress dots */}
        <div className="absolute right-2 top-1/2 -translate-y-1/2 z-10 flex flex-col gap-1.5 pointer-events-none">
          {shorts.map((_, idx) => (
            <div
              key={idx}
              className={`rounded-full transition-all duration-300 ${
                idx === currentIndex ? "w-1.5 h-7 bg-white shadow-lg" : "w-1.5 h-1.5 bg-white/30"
              }`}
            />
          ))}
        </div>

        {/* Swipe indicator */}
        {currentIndex === 0 && (
          <div className="absolute bottom-28 left-1/2 -translate-x-1/2 z-10 animate-bounce pointer-events-none">
            <div className="bg-black/70 backdrop-blur-sm px-4 py-2 rounded-full shadow-xl">
              <p className="text-white text-sm font-semibold">Swipe up for more</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
