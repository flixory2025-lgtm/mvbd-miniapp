"use client"

import { Check, ExternalLink, Play, X } from "lucide-react"
import { useEffect, useState } from "react"

interface TelegramJoinPopupProps {
  movieTitle: string
  telegramLink?: string
  moviePoster?: string
  hasPremiumAccess?: boolean
  mediaType?: "movie" | "anime"
  onClose: () => void
}

export default function TelegramJoinPopup({ movieTitle, telegramLink, moviePoster, hasPremiumAccess = false, mediaType = "movie", onClose }: TelegramJoinPopupProps) {
  const [hasOpenedTelegram, setHasOpenedTelegram] = useState(false)
  const mediaLabel = mediaType === "anime" ? "anime" : "movie"

  useEffect(() => {
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => { document.body.style.overflow = previousOverflow }
  }, [])
  const openTelegram = () => {
    if (!hasPremiumAccess) return
    const destination = telegramLink || "https://t.me/mvbd_cloud_bot"
    window.open(destination, "_blank", "noopener,noreferrer")
    setHasOpenedTelegram(true)
  }

  return (
    <div className="watch-overlay" role="dialog" aria-modal="true" aria-label={`Watch ${mediaLabel}`} onMouseDown={(event) => { if (event.currentTarget === event.target) onClose() }}>
      <section className="watch-card" onMouseDown={(event) => event.stopPropagation()}>
        <button type="button" onClick={onClose} className="watch-close" aria-label="Close watch popup"><X className="size-5" /></button>
        {moviePoster && <div className="watch-poster" style={{ backgroundImage: `linear-gradient(90deg, rgba(6,10,8,.2), rgba(6,10,8,.95)), url(${moviePoster})` }} aria-hidden="true" />}
        <div className="watch-content">
          <div className="watch-logo" aria-hidden="true"><span>M</span><Play className="size-4 fill-current" /></div>
          <p className="watch-kicker">MVBD CLOUD BOT</p>
          <h2>{movieTitle}</h2>
          {!hasPremiumAccess && <div className="mb-4 rounded-2xl border border-red-300/20 bg-red-300/[.08] p-3 text-sm leading-6 text-red-100"><strong>Premium Subscription Required</strong><p className="mt-1">আপনার active premium subscription নেই। আগে একটি subscription plan নিন, তারপর {mediaLabel}টি দেখতে পারবেন।</p></div>}
          <div className="watch-copy">
            <p>এই {mediaLabel} টি দেখতে হলে আগে নিশ্চিত করুন যে আপনি premium subscription কিনেছেন।</p>
            <p>যদি premium subscription না নিয়ে থাকেন, তাহলে নিচের Buy Subscription button-এ click করুন।</p>
            <p>আর যদি আপনি premium user হয়ে থাকেন, তাহলে Watch Now-তে click করুন।</p>
            <p>Watch Now-তে click করলে আপনাকে Telegram-এর mvbd cloud bot-এ নিয়ে যাবে। সেখানে bot-টি Start করলেই আপনি {mediaLabel} পেয়ে যাবেন।</p>
          </div>
          <div className="watch-actions">
            <button type="button" onClick={() => { window.dispatchEvent(new CustomEvent("mvbd:open-subscriptions")); onClose() }} className="watch-secondary">Buy Subscription</button>
            <button type="button" onClick={openTelegram} className="watch-primary"><ExternalLink className="size-4" /> Watch Now</button>
          </div>
          {hasOpenedTelegram && <p className="watch-success"><Check className="size-4" /> Telegram opened in a new tab</p>}
        </div>
      </section>
    </div>
  )
}
