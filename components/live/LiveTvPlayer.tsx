"use client";

import { useEffect, useRef, useState } from "react";
import Hls from "hls.js";
import { X, Minimize2, Maximize2, Volume2, VolumeX } from "lucide-react";

interface LiveTvPlayerProps {
  streamUrl: string;
  channelName: string;
  channelLogo?: string;
  category: string;
  onClose: () => void;
}

export default function LiveTvPlayer({ streamUrl, channelName, channelLogo, category, onClose }: LiveTvPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!videoRef.current || !streamUrl) return;

    const video = videoRef.current;

    const initHls = () => {
      if (Hls.isSupported()) {
        const hls = new Hls({
          xhrSetup: (xhr, url) => {
            xhr.setRequestHeader("Referer", "https://topembed.pw/");
            xhr.setRequestHeader("User-Agent", "Mozilla/5.0");
          },
        });
        hls.loadSource(streamUrl);
        hls.attachMedia(video);
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          video.play().catch(() => setError(true));
          setIsPlaying(true);
          setLoading(false);
        });
        hls.on(Hls.Events.ERROR, () => {
          setError(true);
          setLoading(false);
        });
        return () => hls.destroy();
      } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
        video.src = streamUrl;
        video.addEventListener("loadedmetadata", () => {
          video.play().catch(() => setError(true));
          setLoading(false);
        });
      } else {
        setError(true);
        setLoading(false);
      }
    };

    initHls();
  }, [streamUrl]);

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const getCategoryColor = () => {
    const colors: Record<string, string> = {
      Sports: "bg-emerald-500",
      Movies: "bg-purple-500",
      Cartoons: "bg-yellow-500",
      Horror: "bg-red-700",
      "Web Series": "bg-blue-500",
      "TV Serials": "bg-pink-500",
      Adult: "bg-red-600",
    };
    return colors[category] || "bg-gray-500";
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-2 md:p-4">
      <div className="relative w-full max-w-6xl rounded-xl overflow-hidden bg-black shadow-2xl">
        {/* Header */}
        <div className="absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-black/90 to-transparent p-3 md:p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {channelLogo && (
                <span className="text-2xl">{channelLogo}</span>
              )}
              <div>
                <h3 className="text-white font-semibold text-sm md:text-base">{channelName}</h3>
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${getCategoryColor()} text-white`}>
                    {category}
                  </span>
                  <span className="text-xs text-emerald-400">● LIVE</span>
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Video Player */}
        <div className="relative aspect-video bg-black">
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
            </div>
          )}
          {error ? (
            <div className="absolute inset-0 flex items-center justify-center text-white">
              <div className="text-center">
                <p className="text-red-400 mb-2 text-lg">⚠️ Unable to load stream</p>
                <p className="text-sm text-slate-400">Channel might be offline or region blocked</p>
                <button
                  onClick={onClose}
                  className="mt-4 px-4 py-2 bg-white/10 rounded-lg hover:bg-white/20"
                >
                  Try Another Channel
                </button>
              </div>
            </div>
          ) : (
            <video
              ref={videoRef}
              className="w-full h-full object-contain"
              controls={false}
              autoPlay
              playsInline
            />
          )}
        </div>

        {/* Controls */}
        {!error && (
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3">
            <div className="flex items-center justify-center gap-4">
              <button onClick={toggleMute} className="p-2 rounded-full bg-white/10 hover:bg-white/20">
                {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
              </button>
              <button onClick={toggleFullscreen} className="p-2 rounded-full bg-white/10 hover:bg-white/20">
                {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
