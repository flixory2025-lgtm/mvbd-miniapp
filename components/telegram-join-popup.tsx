"use client"

import { Check, ExternalLink, Play, X } from "lucide-react"
import { useEffect, useState } from "react"

interface TelegramJoinPopupProps {
  movieTitle: string
  telegramLink?: string
  telegram4kLink?: string
  moviePoster?: string
  hasPremiumAccess?: boolean
  mediaType?: "movie" | "anime"
  onClose: () => void
}

export default function TelegramJoinPopup({ movieTitle, telegramLink, telegram4kLink, moviePoster, hasPremiumAccess = false, mediaType = "movie", onClose }: TelegramJoinPopupProps) {
  const [hasOpenedTelegram, setHasOpenedTelegram] = useState(false)
  const mediaLabel = mediaType === "anime" ? "anime" : "movie"

  useEffect(() => {
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => { document.body.style.overflow = previousOverflow }
  }, [])
  const openTelegram = (destination?: string) => {
    const target = destination?.trim()
    if (!target) return
    window.open(target, "_blank", "noopener,noreferrer")
    setHasOpenedTelegram(true)
  }

  const requestSubscription = () => {
    window.dispatchEvent(new CustomEvent("mvbd:open-subscriptions"))
    onClose()
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
          {!hasPremiumAccess && <div className="mb-4 rounded-2xl border border-amber-300/20 bg-amber-300/[.08] p-3 text-sm leading-6 text-amber-50"><strong>প্রিমিয়াম ডাউনলোডের জন্য সাবস্ক্রিপশন প্রয়োজন</strong><p className="mt-1">আপনি ফ্রি প্ল্যানে Normal Download করতে পারবেন। 1080P–4K কোয়ালিটির জন্য একটি subscription plan নিন।</p></div>}
          <div className="watch-copy">
            <p>আপনার পছন্দের {mediaLabel}টি Telegram থেকে ডাউনলোড করুন। নিচের অপশন থেকে quality বেছে নিন।</p>
            <p>Normal Download-এ 480P–720P পর্যন্ত কোয়ালিটি পাওয়া যাবে এবং এটি ফ্রি প্ল্যানেই ব্যবহার করা যাবে।</p>
            <p>1080P–4K Download বেছে নিলে সেরা কোয়ালিটিতে ডাউনলোড করতে পারবেন; এর জন্য active subscription লাগবে।</p>
          </div>
          <div className="watch-actions">
            <button type="button" onClick={() => openTelegram(telegramLink)} className="watch-primary"><ExternalLink className="size-4" /> Download Normal <span className="text-xs opacity-75">(480P–720P)</span></button>
            <button type="button" onClick={() => hasPremiumAccess ? openTelegram(telegram4kLink) : requestSubscription()} className="watch-secondary"><ExternalLink className="size-4" /> Download 1080P–4K</button>
          </div>
          {!hasPremiumAccess && <button type="button" onClick={requestSubscription} className="mt-3 w-full text-center text-sm font-semibold text-amber-200 underline underline-offset-4">1080P–4K পেতে subscription plan দেখুন</button>}
          {hasOpenedTelegram && <p className="watch-success"><Check className="size-4" /> Telegram opened in a new tab</p>}
        </div>
      </section>
    </div>
  )
}
