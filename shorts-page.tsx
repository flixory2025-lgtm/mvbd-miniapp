"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Volume2, VolumeX, Heart, MessageCircle, Share2 } from "lucide-react"
import Image from "next/image"
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
  const [isMuted, setIsMuted] = useState(false)
  const [userLikes, setUserLikes] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const containerRef = useRef<HTMLDivElement>(null)
  const touchStartY = useRef(0)

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

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    const touchEndY = e.changedTouches[0].clientY
    const diff = touchStartY.current - touchEndY

    if (Math.abs(diff) > 50) {
      if (diff > 0 && currentIndex < shorts.length - 1) {
        setCurrentIndex(currentIndex + 1)
        setUserLikes(new Set())
      } else if (diff < 0 && currentIndex > 0) {
        setCurrentIndex(currentIndex - 1)
        setUserLikes(new Set())
      }
    }
  }

  const handleWheel = (e: React.WheelEvent) => {
    if (e.deltaY > 0 && currentIndex < shorts.length - 1) {
      setCurrentIndex(currentIndex + 1)
      setUserLikes(new Set())
    } else if (e.deltaY < 0 && currentIndex > 0) {
      setCurrentIndex(currentIndex - 1)
      setUserLikes(new Set())
    }
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

  const toggleMute = () => {
    setIsMuted(!isMuted)
  }

  const getYouTubeEmbedUrl = (url: string) => {
    const shortRegex = /youtube\.com\/shorts\/([a-zA-Z0-9_-]+)/
    const match = url.match(shortRegex)
    if (match) {
      return `https://www.youtube.com/embed/${match[1]}?autoplay=${isPlaying ? 1 : 0}&mute=${isMuted ? 1 : 0}&controls=0&modestbranding=1&rel=0&loop=1&playlist=${match[1]}`
    }
    return url
  }

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Image src="/mvbd-logo.png" alt="Loading" width={80} height={80} className="animate-pulse" />
          <p className="text-white">Loading Shorts...</p>
        </div>
      </div>
    )
  }

  if (shorts.length === 0) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 px-4 text-center">
          <Image src="/mvbd-logo.png" alt="No Shorts" width={80} height={80} />
          <p className="text-white text-lg">কোনো Shorts এখনো আপলোড করা হয়নি</p>
          <p className="text-slate-400 text-sm">শীঘ্রই আসছে!</p>
        </div>
      </div>
    )
  }

  const currentShort = shorts[currentIndex]
  const isLiked = userLikes.has(currentShort.id)

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 bg-black overflow-hidden"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onWheel={handleWheel}
    >
      <div className="relative w-full h-full" onClick={() => setIsPlaying(!isPlaying)}>
        <iframe
          key={`${currentShort.id}-${isPlaying}`}
          src={getYouTubeEmbedUrl(currentShort.videoUrl)}
          className="absolute inset-0 w-full h-full object-cover pointer-events-none"
          allow="autoplay; encrypted-media"
          allowFullScreen
        />

        {/* Top gradient with logo */}
        <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-black/60 to-transparent z-10 flex items-start justify-center pt-4 pointer-events-none">
          <Image src="/mvbd-logo.png" alt="MVBD" width={60} height={60} className="object-contain" />
        </div>

        {!isPlaying && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
            <div className="w-20 h-20 rounded-full bg-black/50 flex items-center justify-center animate-pulse">
              <svg className="w-10 h-10 text-white ml-2" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
          </div>
        )}

        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/70 to-transparent z-10 pb-20 pointer-events-none">
          <div className="flex gap-3 p-4">
            {/* Left side: Title and Description */}
            <div className="flex-1 min-w-0">
              <h2 className="text-white font-bold text-lg mb-1 line-clamp-2 drop-shadow-lg">{currentShort.title}</h2>
              <p className="text-white/90 text-sm line-clamp-2 drop-shadow-md">{currentShort.description}</p>
            </div>

            {/* Right side: Action buttons */}
            <div className="flex flex-col items-center gap-4 pointer-events-auto">
              {/* Like button */}
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  toggleLike()
                }}
                className="flex flex-col items-center gap-1 transition-transform active:scale-90"
              >
                <div
                  className={`w-12 h-12 rounded-full ${
                    isLiked ? "bg-red-500/20" : "bg-slate-800/50"
                  } backdrop-blur-sm flex items-center justify-center ${isLiked ? "animate-bounce" : ""}`}
                >
                  <Heart className={`w-7 h-7 ${isLiked ? "fill-red-500 text-red-500" : "text-white"}`} />
                </div>
                <span className="text-white text-xs font-semibold drop-shadow-md">
                  {currentShort.likes.toLocaleString()}
                </span>
              </button>

              {/* Comment button */}
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handleComment()
                }}
                className="flex flex-col items-center gap-1 transition-transform active:scale-90"
              >
                <div className="w-12 h-12 rounded-full bg-slate-800/50 backdrop-blur-sm flex items-center justify-center">
                  <MessageCircle className="w-7 h-7 text-white" />
                </div>
                <span className="text-white text-xs font-semibold drop-shadow-md">{currentShort.comments}</span>
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
                className="flex flex-col items-center gap-1 transition-transform active:scale-90"
              >
                <div className="w-12 h-12 rounded-full bg-slate-800/50 backdrop-blur-sm flex items-center justify-center">
                  <Share2 className="w-7 h-7 text-white" />
                </div>
                <span className="text-white text-xs font-semibold drop-shadow-md">Share</span>
              </button>

              {/* Mute/Unmute button */}
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  toggleMute()
                }}
                className="transition-transform active:scale-90"
              >
                <div className="w-12 h-12 rounded-full bg-slate-800/50 backdrop-blur-sm flex items-center justify-center">
                  {isMuted ? <VolumeX className="w-7 h-7 text-white" /> : <Volume2 className="w-7 h-7 text-white" />}
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Progress indicators */}
        <div className="absolute right-2 top-1/2 transform -translate-y-1/2 z-10 pointer-events-none">
          <div className="flex flex-col gap-2">
            {shorts.map((_, idx) => (
              <div
                key={idx}
                className={`w-1 h-8 rounded-full transition-all ${idx === currentIndex ? "bg-white" : "bg-white/30"}`}
              />
            ))}
          </div>
        </div>

        {/* Swipe hint */}
        {currentIndex === 0 && (
          <div className="absolute bottom-24 left-1/2 transform -translate-x-1/2 z-10 animate-bounce pointer-events-none">
            <p className="text-white text-sm bg-black/50 px-4 py-2 rounded-full backdrop-blur-sm drop-shadow-lg">
              ↑ Swipe up for more
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
