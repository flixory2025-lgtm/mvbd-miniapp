"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Heart, MessageCircle, Share2, Play, Pause, X, Send } from "lucide-react"
import { collection, doc, updateDoc, increment, onSnapshot, addDoc, query, where } from "firebase/firestore"
import { db } from "@/lib/firebase"

interface Short {
  id: string
  title: string
  description: string
  videoUrl: string
  likes: number
  comments: number
}

interface Comment {
  id: string
  shortId: string
  userName: string
  text: string
  timestamp: string
}

export default function ShortsPage() {
  const [shorts, setShorts] = useState<Short[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(true)
  const [userLikes, setUserLikes] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [showPlayPauseIcon, setShowPlayPauseIcon] = useState(false)
  const [showCommentModal, setShowCommentModal] = useState(false)
  const [comments, setComments] = useState<Comment[]>([])
  const [commentText, setCommentText] = useState("")
  const [userName, setUserName] = useState("")
  const [loadingComments, setLoadingComments] = useState(false)

  const containerRef = useRef<HTMLDivElement>(null)
  const videoRef = useRef<HTMLIFrameElement>(null)
  const touchStartY = useRef(0)
  const isScrolling = useRef(false)
  const commentsContainerRef = useRef<HTMLDivElement>(null)

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

    const savedUserName = localStorage.getItem("mvbd_user_name")
    if (savedUserName) {
      setUserName(savedUserName)
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

  useEffect(() => {
    if (shorts.length > 0 && showCommentModal) {
      loadComments(shorts[currentIndex].id)
    }
  }, [currentIndex, shorts, showCommentModal])

  const loadComments = async (shortId: string) => {
    setLoadingComments(true)
    try {
      const commentsRef = collection(db, "comments")
      const q = query(commentsRef, where("shortId", "==", shortId))

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const commentsData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Comment[]
        // Sort by timestamp on client side
        commentsData.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        setComments(commentsData)
        setLoadingComments(false)
      })

      return () => unsubscribe()
    } catch (error) {
      console.error("Error loading comments:", error)
      setLoadingComments(false)
    }
  }

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!commentText.trim() || !userName.trim() || !shorts[currentIndex]) return

    try {
      const commentsRef = collection(db, "comments")
      await addDoc(commentsRef, {
        shortId: shorts[currentIndex].id,
        userName: userName.trim(),
        text: commentText.trim(),
        timestamp: new Date().toISOString(),
      })

      localStorage.setItem("mvbd_user_name", userName)

      const shortRef = doc(db, "shorts", shorts[currentIndex].id)
      await updateDoc(shortRef, {
        comments: increment(1),
      })

      setCommentText("")

      setTimeout(() => {
        commentsContainerRef.current?.scrollIntoView({ behavior: "smooth" })
      }, 100)
    } catch (error) {
      console.error("Error adding comment:", error)
    }
  }

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (isScrolling.current) return

    const touchEndY = e.changedTouches[0].clientY
    const diff = touchStartY.current - touchEndY

    if (Math.abs(diff) > 50) {
      isScrolling.current = true

      if (diff > 0) {
        // Swipe up - go to next
        setCurrentIndex((prev) => (prev + 1) % shorts.length)
      } else {
        // Swipe down - go to previous with loop
        setCurrentIndex((prev) => (prev - 1 + shorts.length) % shorts.length)
      }

      setTimeout(() => {
        isScrolling.current = false
      }, 600)
    }
  }

  const handleWheel = (e: React.WheelEvent) => {
    if (isScrolling.current) return

    if (Math.abs(e.deltaY) > 30) {
      isScrolling.current = true

      if (e.deltaY > 0) {
        // Scroll down - next video
        setCurrentIndex((prev) => (prev + 1) % shorts.length)
      } else {
        // Scroll up - previous video
        setCurrentIndex((prev) => (prev - 1 + shorts.length) % shorts.length)
      }

      setTimeout(() => {
        isScrolling.current = false
      }, 600)
    }
  }

  const togglePlayPause = () => {
    const newPlayState = !isPlaying
    setIsPlaying(newPlayState)
    setShowPlayPauseIcon(true)

    if (videoRef.current) {
      videoRef.current.contentWindow?.postMessage(
        { event: "command", func: newPlayState ? "playVideo" : "pauseVideo" },
        "*",
      )
    }

    setTimeout(() => setShowPlayPauseIcon(false), 800)
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

  const getYouTubeEmbedUrl = (url: string) => {
    const shortRegex = /youtube\.com\/shorts\/([a-zA-Z0-9_-]+)/
    const match = url.match(shortRegex)
    if (match) {
      return `https://www.youtube.com/embed/${match[1]}?autoplay=${isPlaying ? 1 : 0}&mute=0&controls=0&modestbranding=1&rel=0&loop=1&playlist=${match[1]}&enablejsapi=1&origin=${typeof window !== "undefined" ? window.location.origin : ""}`
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
      <div className="relative w-full h-full" onClick={togglePlayPause}>
        <iframe
          ref={videoRef}
          key={`${currentShort.id}-${currentIndex}`}
          src={getYouTubeEmbedUrl(currentShort.videoUrl)}
          className="absolute inset-0 w-full h-full object-cover"
          allow="autoplay; encrypted-media; fullscreen"
          allowFullScreen
          style={{ pointerEvents: "none" }}
          loading="lazy"
        />

        {showPlayPauseIcon && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30">
            <div className="bg-black/50 rounded-full p-6 animate-fade-out">
              {isPlaying ? (
                <Play className="w-12 h-12 text-white fill-white" />
              ) : (
                <Pause className="w-12 h-12 text-white fill-white" />
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

              <div className="flex flex-col items-center gap-4 pb-1 pointer-events-auto">
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

                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setShowCommentModal(true)
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

                <div className="mt-1">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-red-500 to-pink-500 flex items-center justify-center border-2 border-white shadow-lg">
                    <span className="text-white font-bold text-xs">MB</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="absolute right-2 top-1/2 -translate-y-1/2 z-10 flex flex-col gap-1.5 pointer-events-none max-h-96 overflow-hidden">
          {shorts.map((_, idx) => (
            <div
              key={idx}
              className={`rounded-full transition-all duration-300 ${
                idx === currentIndex ? "w-1.5 h-7 bg-white shadow-lg" : "w-1.5 h-1.5 bg-white/30"
              }`}
            />
          ))}
        </div>

        {currentIndex === 0 && (
          <div className="absolute bottom-28 left-1/2 -translate-x-1/2 z-10 animate-bounce pointer-events-none">
            <div className="bg-black/70 backdrop-blur-sm px-4 py-2 rounded-full shadow-xl">
              <p className="text-white text-sm font-semibold">Swipe up for more</p>
            </div>
          </div>
        )}
      </div>

      {showCommentModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-start justify-center p-4 pt-20">
          <div className="bg-gradient-to-b from-black/95 to-black/90 rounded-2xl w-full md:max-w-md max-h-[70vh] flex flex-col border border-white/10 shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-4 border-b border-white/10 flex-shrink-0">
              <h2 className="text-white font-bold text-lg">Comments</h2>
              <button
                onClick={() => setShowCommentModal(false)}
                className="text-white/60 hover:text-white transition-colors p-1 hover:bg-white/10 rounded-full"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Comments List - Scrollable */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 min-h-0">
              {loadingComments ? (
                <div className="flex items-center justify-center py-8">
                  <div className="w-8 h-8 border-3 border-red-500 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : comments.length === 0 ? (
                <div className="flex items-center justify-center py-8 text-center">
                  <div>
                    <MessageCircle className="w-10 h-10 text-white/20 mx-auto mb-2" />
                    <p className="text-white/60 text-sm">No comments yet</p>
                  </div>
                </div>
              ) : (
                comments.map((comment) => (
                  <div
                    key={comment.id}
                    className="bg-white/5 rounded-lg p-2.5 border border-white/10 hover:bg-white/10 transition-colors"
                  >
                    <div className="flex items-start gap-2">
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-red-500 to-pink-500 flex items-center justify-center flex-shrink-0">
                        <span className="text-white font-bold text-xs">{comment.userName.charAt(0).toUpperCase()}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-white font-semibold text-xs">{comment.userName}</p>
                          <span className="text-white/40 text-xs whitespace-nowrap">
                            {new Date(comment.timestamp).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                            })}
                          </span>
                        </div>
                        <p className="text-white/80 text-xs mt-1 break-words">{comment.text}</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
              <div ref={commentsContainerRef} />
            </div>

            {/* Comment Input */}
            <div className="bg-gradient-to-t from-black/95 to-black/50 px-4 py-3 border-t border-white/10 flex-shrink-0">
              <form onSubmit={handleAddComment} className="space-y-2">
                <input
                  type="text"
                  placeholder="Your name..."
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  maxLength={20}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-1.5 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-xs"
                />
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Add a comment..."
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    maxLength={150}
                    className="flex-1 bg-white/10 border border-white/20 rounded-lg px-3 py-1.5 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-xs"
                  />
                  <button
                    type="submit"
                    disabled={!commentText.trim() || !userName.trim()}
                    className="bg-red-500 hover:bg-red-600 disabled:bg-red-500/50 text-white rounded-lg px-3 py-1.5 transition-colors flex items-center justify-center flex-shrink-0"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fade-out {
          0% { opacity: 1; transform: scale(1); }
          100% { opacity: 0; transform: scale(0.8); }
        }
        .animate-fade-out {
          animation: fade-out 0.8s ease-out forwards;
        }
      `}</style>
    </div>
  )
}
