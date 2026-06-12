"use client"

import { useEffect, useState, useRef } from "react"
import { cn } from "@/lib/utils"
import type { SportType, MatchStatus, FootballMatch, CricketMatch } from "@/lib/sports/types"
import { Play, Pause, Volume2, VolumeX, Maximize, SkipBack, SkipForward, Settings, Subtitles, Pip } from "lucide-react"

// ডেমো ডাটা - কোনো API কল ছাড়া
const DEMO_DATA = {
  football: {
    live: [
      { id: "1", homeTeam: { name: "Manchester City" }, awayTeam: { name: "Liverpool" }, status: "LIVE", score: { home: 2, away: 1 }, minute: 67, videoUrl: "https://drive.google.com/file/d/1YFcnWlG1JEHHnUc_-WDCk1-G2PbxTzTv/preview" },
      { id: "2", homeTeam: { name: "Real Madrid" }, awayTeam: { name: "Barcelona" }, status: "LIVE", score: { home: 1, away: 0 }, minute: 34, videoUrl: "" },
    ],
    upcoming: [
      { id: "3", homeTeam: { name: "Bayern Munich" }, awayTeam: { name: "Dortmund" }, status: "SCHEDULED", date: "2026-06-12T20:00:00Z" },
      { id: "4", homeTeam: { name: "PSG" }, awayTeam: { name: "Marseille" }, status: "SCHEDULED", date: "2026-06-12T21:00:00Z" },
    ],
    finished: [
      { id: "5", homeTeam: { name: "Arsenal" }, awayTeam: { name: "Chelsea" }, status: "FINISHED", score: { home: 2, away: 2 } },
      { id: "6", homeTeam: { name: "Juventus" }, awayTeam: { name: "Milan" }, status: "FINISHED", score: { home: 1, away: 0 } },
    ],
  },
  cricket: {
    live: [
      { id: "101", name: "India vs Australia", shortName: "IND vs AUS", matchStarted: true, matchEnded: false, score: "245/3 (35.2)" },
      { id: "102", name: "England vs South Africa", shortName: "ENG vs SA", matchStarted: true, matchEnded: false, score: "120/2 (20.1)" },
    ],
    upcoming: [
      { id: "103", name: "Pakistan vs New Zealand", shortName: "PAK vs NZ", matchStarted: false, matchEnded: false, date: "2026-06-12T10:00:00Z" },
      { id: "104", name: "Bangladesh vs Sri Lanka", shortName: "BAN vs SL", matchStarted: false, matchEnded: false, date: "2026-06-13T11:00:00Z" },
    ],
    finished: [
      { id: "105", name: "West Indies vs Afghanistan", shortName: "WI vs AFG", matchStarted: true, matchEnded: true, score: "West Indies won by 5 wickets" },
    ],
  },
}

export default function MatchesList({ 
  sport, 
  status, 
  onSelect 
}: { 
  sport: SportType
  status: MatchStatus
  onSelect: (id: string) => void 
}) {
  const [matches, setMatches] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedMatch, setSelectedMatch] = useState<any>(null)

  useEffect(() => {
    // সরাসরি ডেমো ডাটা সেট করুন
    const data = DEMO_DATA[sport][status as keyof typeof DEMO_DATA.football]
    setMatches(data || [])
    setLoading(false)
  }, [sport, status])

  const handleMatchSelect = (match: any) => {
    setSelectedMatch(match)
    onSelect(match.id)
  }

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 animate-pulse rounded-lg bg-white/5" />
        ))}
      </div>
    )
  }

  if (selectedMatch) {
    return (
      <div className="space-y-4">
        <button
          onClick={() => setSelectedMatch(null)}
          className="mb-4 flex items-center gap-2 text-sm text-slate-400 hover:text-white"
        >
          ← Back to matches
        </button>
        <VideoPlayer match={selectedMatch} sport={sport} />
      </div>
    )
  }

  if (matches.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-slate-400">No {status} matches found</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {matches.map((match) => (
        <MatchCard key={match.id} match={match} sport={sport} onClick={() => handleMatchSelect(match)} />
      ))}
    </div>
  )
}

function MatchCard({ match, sport, onClick }: { match: any; sport: SportType; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full rounded-xl border border-white/10 bg-white/[0.04] p-4 text-left transition active:scale-[0.98] hover:bg-white/[0.08]"
    >
      {sport === "football" ? (
        <>
          <div className="flex items-center justify-between">
            <div className="flex-1 text-right">
              <p className="font-semibold">{match.homeTeam?.name || "Team A"}</p>
              <p className="text-2xl font-bold">{match.score?.home ?? "-"}</p>
            </div>
            <div className="mx-4 text-xs text-slate-400">VS</div>
            <div className="flex-1">
              <p className="font-semibold">{match.awayTeam?.name || "Team B"}</p>
              <p className="text-2xl font-bold">{match.score?.away ?? "-"}</p>
            </div>
          </div>
          {match.minute && <div className="mt-2 text-center text-xs text-emerald-400">Live • {match.minute}'</div>}
          {match.date && <div className="mt-2 text-center text-xs text-slate-400">{new Date(match.date).toLocaleString()}</div>}
          {match.videoUrl && (
            <div className="mt-2 flex items-center justify-center gap-1 text-xs text-blue-400">
              <Play className="h-3 w-3" /> Watch Highlights
            </div>
          )}
        </>
      ) : (
        <>
          <div className="flex items-center justify-between">
            <span className="font-semibold">{match.shortName || match.name}</span>
            {match.matchStarted && !match.matchEnded && <span className="text-xs text-emerald-400">● LIVE</span>}
          </div>
          {match.score && <p className="mt-1 text-sm text-slate-300">{match.score}</p>}
          {match.date && !match.matchStarted && <p className="mt-1 text-xs text-slate-400">{new Date(match.date).toLocaleString()}</p>}
        </>
      )}
    </button>
  )
}

function VideoPlayer({ match, sport }: { match: any; sport: SportType }) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [progress, setProgress] = useState(0)
  const [volume, setVolume] = useState(1)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [showControls, setShowControls] = useState(true)
  const [quality, setQuality] = useState("Auto")
  const [showQualityMenu, setShowQualityMenu] = useState(false)
  const [showSpeedMenu, setShowSpeedMenu] = useState(false)
  const [playbackSpeed, setPlaybackSpeed] = useState(1)
  
  const videoRef = useRef<HTMLVideoElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const controlsTimeoutRef = useRef<NodeJS.Timeout>()

  // Convert Google Drive link to direct embed URL
  const getVideoUrl = (url: string) => {
    if (!url) return null
    // Check if it's a Google Drive link
    const driveMatch = url.match(/\/d\/(.+?)\//)
    if (driveMatch) {
      const fileId = driveMatch[1]
      return `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media&key=YOUR_API_KEY`
    }
    // If it's already a preview link
    if (url.includes('drive.google.com')) {
      return url.replace('/preview', '')
    }
    return url
  }

  const videoUrl = match.videoUrl ? getVideoUrl(match.videoUrl) : null

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime)
      setProgress((video.currentTime / video.duration) * 100)
    }

    const handleLoadedMetadata = () => {
      setDuration(video.duration)
    }

    const handlePlay = () => setIsPlaying(true)
    const handlePause = () => setIsPlaying(false)
    const handleEnded = () => setIsPlaying(false)

    video.addEventListener('timeupdate', handleTimeUpdate)
    video.addEventListener('loadedmetadata', handleLoadedMetadata)
    video.addEventListener('play', handlePlay)
    video.addEventListener('pause', handlePause)
    video.addEventListener('ended', handleEnded)

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate)
      video.removeEventListener('loadedmetadata', handleLoadedMetadata)
      video.removeEventListener('play', handlePlay)
      video.removeEventListener('pause', handlePause)
      video.removeEventListener('ended', handleEnded)
    }
  }, [])

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause()
      } else {
        videoRef.current.play()
      }
    }
  }

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted
      setIsMuted(!isMuted)
    }
  }

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value)
    setVolume(value)
    if (videoRef.current) {
      videoRef.current.volume = value
      setIsMuted(value === 0)
    }
  }

  const handleProgressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value)
    setProgress(value)
    if (videoRef.current && duration) {
      videoRef.current.currentTime = (value / 100) * duration
    }
  }

  const handleFullscreen = () => {
    if (containerRef.current) {
      if (document.fullscreenElement) {
        document.exitFullscreen()
      } else {
        containerRef.current.requestFullscreen()
      }
    }
  }

  const handlePiP = async () => {
    if (videoRef.current) {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture()
      } else {
        await videoRef.current.requestPictureInPicture()
      }
    }
  }

  const handleSkip = (seconds: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime += seconds
    }
  }

  const handleSpeedChange = (speed: number) => {
    setPlaybackSpeed(speed)
    if (videoRef.current) {
      videoRef.current.playbackRate = speed
    }
    setShowSpeedMenu(false)
  }

  const formatTime = (time: number) => {
    const hours = Math.floor(time / 3600)
    const minutes = Math.floor((time % 3600) / 60)
    const seconds = Math.floor(time % 60)
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  const handleMouseMove = () => {
    setShowControls(true)
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current)
    }
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying) {
        setShowControls(false)
      }
    }, 3000)
  }

  if (!videoUrl) {
    return (
      <div className="flex aspect-video items-center justify-center rounded-xl bg-black/50">
        <p className="text-slate-400">No video available for this match</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Match Info */}
      <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
        {sport === "football" ? (
          <div className="flex items-center justify-between">
            <div className="flex-1 text-center">
              <p className="text-lg font-semibold">{match.homeTeam?.name}</p>
              <p className="text-3xl font-bold">{match.score?.home ?? "-"}</p>
            </div>
            <div className="px-4 text-sm text-slate-400">VS</div>
            <div className="flex-1 text-center">
              <p className="text-lg font-semibold">{match.awayTeam?.name}</p>
              <p className="text-3xl font-bold">{match.score?.away ?? "-"}</p>
            </div>
          </div>
        ) : (
          <div className="text-center">
            <p className="text-lg font-semibold">{match.name}</p>
            {match.score && <p className="mt-1 text-sm text-slate-300">{match.score}</p>}
          </div>
        )}
        {match.minute && (
          <div className="mt-2 text-center text-sm text-emerald-400">Live • {match.minute}'</div>
        )}
      </div>

      {/* Video Player */}
      <div
        ref={containerRef}
        className="group relative aspect-video overflow-hidden rounded-xl bg-black"
        onMouseMove={handleMouseMove}
        onMouseLeave={() => isPlaying && setShowControls(false)}
      >
        <video
          ref={videoRef}
          src={videoUrl}
          className="h-full w-full"
          onClick={togglePlay}
          playsInline
        >
          Your browser does not support the video tag.
        </video>

        {/* Controls Overlay */}
        <div
          className={cn(
            "absolute inset-0 flex flex-col justify-between bg-gradient-to-t from-black/80 via-transparent to-black/80 transition-opacity duration-300",
            showControls ? "opacity-100" : "opacity-0"
          )}
        >
          {/* Top Controls */}
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 animate-pulse rounded-full bg-red-500"></div>
              <span className="text-sm font-semibold">LIVE</span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handlePiP}
                className="rounded-lg bg-white/10 p-2 transition hover:bg-white/20"
              >
                <Pip className="h-4 w-4" />
              </button>
              <button
                onClick={handleFullscreen}
                className="rounded-lg bg-white/10 p-2 transition hover:bg-white/20"
              >
                <Maximize className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Center Controls */}
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={() => handleSkip(-10)}
              className="rounded-full bg-white/10 p-3 transition hover:bg-white/20"
            >
              <SkipBack className="h-5 w-5" />
            </button>
            <button
              onClick={togglePlay}
              className="rounded-full bg-white/20 p-4 transition hover:scale-110 hover:bg-white/30"
            >
              {isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6" />}
            </button>
            <button
              onClick={() => handleSkip(10)}
              className="rounded-full bg-white/10 p-3 transition hover:bg-white/20"
            >
              <SkipForward className="h-5 w-5" />
            </button>
          </div>

          {/* Bottom Controls */}
          <div className="space-y-2 p-4">
            {/* Progress Bar */}
            <div className="flex items-center gap-3">
              <span className="text-xs">{formatTime(currentTime)}</span>
              <input
                type="range"
                value={progress}
                onChange={handleProgressChange}
                className="flex-1"
                style={{
                  background: `linear-gradient(to right, #3b82f6 ${progress}%, rgba(255,255,255,0.2) ${progress}%)`,
                }}
              />
              <span className="text-xs">{formatTime(duration)}</span>
            </div>

            {/* Control Buttons */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button
                  onClick={toggleMute}
                  className="rounded-lg p-1 transition hover:bg-white/10"
                >
                  {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                </button>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={volume}
                  onChange={handleVolumeChange}
                  className="w-20"
                  style={{
                    background: `linear-gradient(to right, #3b82f6 ${volume * 100}%, rgba(255,255,255,0.2) ${volume * 100}%)`,
                  }}
                />
              </div>

              <div className="flex items-center gap-2">
                {/* Quality Selector */}
                <div className="relative">
                  <button
                    onClick={() => {
                      setShowQualityMenu(!showQualityMenu)
                      setShowSpeedMenu(false)
                    }}
                    className="rounded-lg px-2 py-1 text-xs transition hover:bg-white/10"
                  >
                    {quality}
                  </button>
                  {showQualityMenu && (
                    <div className="absolute bottom-full right-0 mb-2 rounded-lg bg-black/90 p-2 backdrop-blur">
                      {["Auto", "1080p", "720p", "480p", "360p"].map((q) => (
                        <button
                          key={q}
                          onClick={() => {
                            setQuality(q)
                            setShowQualityMenu(false)
                          }}
                          className="block w-full whitespace-nowrap rounded px-3 py-1 text-left text-xs transition hover:bg-white/10"
                        >
                          {q}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Speed Selector */}
                <div className="relative">
                  <button
                    onClick={() => {
                      setShowSpeedMenu(!showSpeedMenu)
                      setShowQualityMenu(false)
                    }}
                    className="rounded-lg px-2 py-1 text-xs transition hover:bg-white/10"
                  >
                    {playbackSpeed}x
                  </button>
                  {showSpeedMenu && (
                    <div className="absolute bottom-full right-0 mb-2 rounded-lg bg-black/90 p-2 backdrop-blur">
                      {[0.25, 0.5, 0.75, 1, 1.25, 1.5, 2].map((speed) => (
                        <button
                          key={speed}
                          onClick={() => handleSpeedChange(speed)}
                          className="block w-full whitespace-nowrap rounded px-3 py-1 text-left text-xs transition hover:bg-white/10"
                        >
                          {speed}x
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <button className="rounded-lg px-2 py-1 text-xs transition hover:bg-white/10">
                  <Subtitles className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* How to add Google Drive Video - Instructions */}
      <div className="rounded-lg border border-blue-500/20 bg-blue-500/10 p-4">
        <p className="mb-2 text-sm font-semibold text-blue-400">📹 How to add Google Drive video:</p>
        <p className="text-xs text-slate-300">
          1. Upload your video to Google Drive<br/>
          2. Set sharing to "Anyone with the link"<br/>
          3. Add the file ID or share link to the <code className="rounded bg-black/30 px-1 py-0.5 text-blue-300">videoUrl</code> field in the match data<br/>
          4. Example: <code className="rounded bg-black/30 px-1 py-0.5 text-xs text-blue-300">"videoUrl": "https://drive.google.com/file/d/YOUR_FILE_ID/preview"</code>
        </p>
      </div>
    </div>
  )
}
