"use client"

import { Check, X } from "lucide-react"
import { useCallback, useEffect, useRef, useState } from "react"
import type { PointerEvent as ReactPointerEvent } from "react"

interface TelegramJoinPopupProps {
  movieTitle: string
  telegramLink?: string
  telegram4kLink?: string
  moviePoster?: string
  hasPremiumAccess?: boolean
  mediaType?: "movie" | "anime"
  onClose: () => void
}


/* Official Telegram logo */
function TelegramLogo({ size = 28, uid = "a" }: { size?: number; uid?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 240 240" aria-hidden="true">
      <defs>
        <linearGradient id={`tgA-${uid}`} x1=".667" x2=".417" y1=".167" y2=".75">
          <stop offset="0" stopColor="#37aee2" />
          <stop offset="1" stopColor="#1e96c8" />
        </linearGradient>
        <linearGradient id={`tgB-${uid}`} x1=".66" x2=".851" y1=".437" y2=".802">
          <stop offset="0" stopColor="#eff7fc" />
          <stop offset="1" stopColor="#fff" />
        </linearGradient>
      </defs>
      <circle cx="120" cy="120" r="120" fill={`url(#tgA-${uid})`} />
      <path fill="#c8daea" d="M98 175c-3.888 0-3.227-1.468-4.568-5.17L82 132.207 170 80" />
      <path fill="#a9c9dd" d="M98 175c3 0 4.325-1.372 6-3l16-15.558-19.958-12.035" />
      <path
        fill={`url(#tgB-${uid})`}
        d="M100.04 144.41l48.36 35.729c5.519 3.045 9.501 1.468 10.876-5.123l19.685-92.763c2.015-8.08-3.08-11.746-8.36-9.349l-115.59 44.571c-7.89 3.165-7.843 7.567-1.438 9.528l29.663 9.259 68.673-43.325c3.242-1.966 6.218-.91 3.776 1.258"
      />
    </svg>
  )
}

/* Premium crown (gold) */
function CrownIcon({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <defs>
        <linearGradient id="mvsCrown" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffd75e" />
          <stop offset=".55" stopColor="#f2a516" />
          <stop offset="1" stopColor="#c47a05" />
        </linearGradient>
      </defs>
      <path
        d="M3 8.2l4.6 3.6L12 5l4.4 6.8L21 8.2l-1.7 9.6a1 1 0 0 1-1 .8H5.7a1 1 0 0 1-1-.8L3 8.2z"
        fill="url(#mvsCrown)"
        stroke="#a86500"
        strokeWidth=".7"
        strokeLinejoin="round"
      />
      <rect x="5" y="19.6" width="14" height="1.9" rx=".9" fill="url(#mvsCrown)" stroke="#a86500" strokeWidth=".5" />
      <circle cx="12" cy="4.6" r="1.3" fill="#fff3b8" stroke="#a86500" strokeWidth=".5" />
      <circle cx="3" cy="7.6" r="1.1" fill="#fff3b8" stroke="#a86500" strokeWidth=".4" />
      <circle cx="21" cy="7.6" r="1.1" fill="#fff3b8" stroke="#a86500" strokeWidth=".4" />
    </svg>
  )
}

function LockIcon({ open = false, size = 15 }: { open?: boolean; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="4.5" y="10.5" width="15" height="10.5" rx="2.6" fill="currentColor" fillOpacity=".18" />
      {open ? <path d="M8 10.5V7.5a4 4 0 0 1 7.6-1.7" /> : <path d="M8 10.5V7.5a4 4 0 0 1 8 0v3" />}
      <circle cx="12" cy="15.7" r="1.1" fill="currentColor" stroke="none" />
    </svg>
  )
}

const LOGO_URL = "https://i.postimg.cc/C1YpJ5k0/29517-removebg-preview.png"
const CLOSE_DURATION = 380

export default function TelegramJoinPopup({ movieTitle, telegramLink, telegram4kLink, moviePoster, hasPremiumAccess = false, mediaType = "movie", onClose }: TelegramJoinPopupProps) {
  const [hasOpenedTelegram, setHasOpenedTelegram] = useState(false)
  const [open, setOpen] = useState(false)
  const [dragY, setDragY] = useState(0)
  const [dragging, setDragging] = useState(false)
  const mediaLabel = mediaType === "anime" ? "anime" : "movie"

  const startY = useRef(0)
  const startT = useRef(0)
  const closing = useRef(false)

  // lock page scroll
  useEffect(() => {
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => { document.body.style.overflow = previousOverflow }
  }, [])

  // slide up on mount
  useEffect(() => {
    let raf2 = 0
    const raf1 = requestAnimationFrame(() => { raf2 = requestAnimationFrame(() => setOpen(true)) })
    return () => { cancelAnimationFrame(raf1); cancelAnimationFrame(raf2) }
  }, [])

  // slide down, then tell the parent
  const requestClose = useCallback(() => {
    if (closing.current) return
    closing.current = true
    setDragging(false)
    setDragY(0)
    setOpen(false)
    window.setTimeout(onClose, CLOSE_DURATION)
  }, [onClose])

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") requestClose() }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [requestClose])

  // drag down to dismiss (poster / handle area)
  const onPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (closing.current) return
    startY.current = event.clientY
    startT.current = Date.now()
    setDragging(true)
    event.currentTarget.setPointerCapture(event.pointerId)
  }
  const onPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!dragging) return
    setDragY(Math.max(0, event.clientY - startY.current))
  }
  const onPointerUp = () => {
    if (!dragging) return
    const elapsed = Math.max(1, Date.now() - startT.current)
    const velocity = dragY / elapsed
    if (dragY > 120 || velocity > 0.6) {
      requestClose()
    } else {
      setDragging(false)
      setDragY(0)
    }
  }

  const openTelegram = (destination?: string) => {
    const target = destination || telegramLink || "https://t.me/mvbd_cloud_bot"
    window.open(target, "_blank", "noopener,noreferrer")
    setHasOpenedTelegram(true)
  }

  const requestSubscription = () => {
    window.dispatchEvent(new CustomEvent("mvbd:open-subscriptions"))
    requestClose()
  }

  const sheetStyle = {
    transform: open ? `translateY(${dragY}px)` : "translateY(100%)",
    transition: dragging ? "none" : `transform ${CLOSE_DURATION + 70}ms cubic-bezier(.32,.72,0,1)`,
  }
  const backdropStyle = {
    opacity: open ? Math.max(0, 1 - dragY / 420) : 0,
    transition: dragging ? "none" : `opacity ${CLOSE_DURATION}ms ease`,
  }

  return (
    <div className="mvs-root" role="dialog" aria-modal="true" aria-label={`Watch ${mediaLabel}`}>
      <style>{css}</style>
      <div className="mvs-backdrop" style={backdropStyle} onMouseDown={requestClose} />

      <section className="mvs-sheet" style={sheetStyle}>
        {/* Poster background */}
        {moviePoster
          ? <img className="mvs-poster" src={moviePoster} alt="" draggable={false} />
          : <div className="mvs-poster mvs-poster-empty" aria-hidden="true" />}
        <div className="mvs-shade" aria-hidden="true" />

        {/* Drag zone: swipe down anywhere on the poster to close */}
        <div
          className="mvs-drag"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        >
          <span className="mvs-grabber" aria-hidden="true" />
        </div>

        <button type="button" onClick={requestClose} className="mvs-close" aria-label="Close watch popup"><X className="size-5" /></button>

        <div className="mvs-content">
          <div className="mvs-brand">
            <span className="mvs-logo" aria-hidden="true"><img src={LOGO_URL} alt="" draggable={false} /></span>
            <span className="mvs-kicker">MVBD CLOUD BOT</span>
          </div>

          <h2 className="mvs-title">{movieTitle}</h2>

          <p className="mvs-copy">
            Telegram থেকে {mediaLabel}টি ডাউনলোড করুন।
            <span>Normal-এ 480P–720P ফ্রি; 1080P–4K-এর জন্য active subscription লাগবে।</span>
          </p>

          <div className="mvs-actions">
            <button type="button" onClick={() => openTelegram()} className="mvs-btn mvs-btn-green" aria-label="Download Normal 480P to 720P">
              <span className="mvs-gloss" aria-hidden="true" />
              <span className="mvs-ico"><TelegramLogo size={28} uid="normal" /></span>
              <span className="mvs-label">Download Normal <span className="mvs-sub">(480P–720P)</span></span>
            </button>

            <button
              type="button"
              onClick={() => hasPremiumAccess ? openTelegram(telegram4kLink) : requestSubscription()}
              className={`mvs-btn mvs-btn-gold ${hasPremiumAccess ? "is-unlocked" : "is-locked"}`}
              aria-label={hasPremiumAccess ? "Download 1080P to 4K" : "1080P to 4K is locked. Open subscription plans"}
            >
              <span className="mvs-gloss" aria-hidden="true" />
              <span className="mvs-ico"><CrownIcon size={24} /></span>
              <span className="mvs-label">Download 1080P–4K</span>
              <span className="mvs-lock" aria-hidden="true"><LockIcon open={hasPremiumAccess} /></span>
              {hasPremiumAccess && <span className="mvs-shine" aria-hidden="true" />}
            </button>
          </div>

          {!hasPremiumAccess && <button type="button" onClick={requestSubscription} className="mvs-sublink">1080P–4K পেতে subscription plan দেখুন</button>}
          {hasOpenedTelegram && <p className="mvs-success"><Check className="size-4" /> Telegram opened in a new tab</p>}
        </div>
      </section>
    </div>
  )
}

const css = `
.mvs-root{position:fixed;inset:0;z-index:9999;display:flex;align-items:flex-end;justify-content:center;color:#fff}
.mvs-backdrop{position:absolute;inset:0;background:rgba(0,0,0,.62);-webkit-backdrop-filter:blur(6px);backdrop-filter:blur(6px)}

.mvs-sheet{
  position:relative;width:100%;max-width:480px;height:min(88dvh,700px);overflow:hidden;
  border-radius:32px 32px 0 0;background:#050706;
  box-shadow:0 -18px 60px rgba(0,0,0,.6);
  will-change:transform;
  display:flex;flex-direction:column;justify-content:flex-end;
}

/* Poster fills the sheet and melts into dark at the bottom */
.mvs-poster{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:center top;user-select:none;pointer-events:none}
.mvs-poster-empty{background:radial-gradient(circle at 30% 18%,#1d3a12,transparent 60%),radial-gradient(circle at 80% 40%,#2a1a55,transparent 60%),#0a0f0c}
.mvs-shade{
  position:absolute;inset:0;pointer-events:none;
  background:
    linear-gradient(to bottom,rgba(0,0,0,.4) 0%,rgba(0,0,0,0) 16%),
    linear-gradient(to bottom,rgba(5,7,6,0) 34%,rgba(5,7,6,.7) 56%,rgba(5,7,6,.96) 72%,#050706 84%);
}

.mvs-drag{position:absolute;top:0;left:0;right:0;bottom:46%;z-index:2;touch-action:none;cursor:grab;display:flex;justify-content:center}
.mvs-drag:active{cursor:grabbing}
.mvs-grabber{margin-top:9px;width:40px;height:5px;border-radius:999px;background:rgba(255,255,255,.55)}

.mvs-close{
  position:absolute;top:14px;right:14px;z-index:4;width:36px;height:36px;border-radius:999px;
  display:flex;align-items:center;justify-content:center;color:#fff;cursor:pointer;
  background:rgba(20,20,20,.55);border:1px solid rgba(255,255,255,.2);
  -webkit-backdrop-filter:blur(10px);backdrop-filter:blur(10px);transition:background .2s,transform .2s;
}
.mvs-close:hover{background:rgba(20,20,20,.8);transform:scale(1.06)}
.mvs-close:focus-visible,.mvs-btn:focus-visible,.mvs-sublink:focus-visible{outline:2px solid #c6f35f;outline-offset:3px}

.mvs-content{position:relative;z-index:3;padding:0 22px calc(22px + env(safe-area-inset-bottom,0px));text-align:center}

.mvs-brand{display:flex;align-items:center;justify-content:center;gap:10px;margin-bottom:10px}
.mvs-logo{width:38px;height:38px;border-radius:12px;display:flex;align-items:center;justify-content:center;background:linear-gradient(160deg,#171e19,#060807);border:1px solid rgba(198,243,95,.35);box-shadow:0 0 18px rgba(198,243,95,.22)}
.mvs-logo img{width:64%;height:64%;object-fit:contain;user-select:none}
.mvs-kicker{font-size:11px;font-weight:600;letter-spacing:.28em;color:#c6f35f}

.mvs-title{
  margin:0 0 10px;font-family:"Playfair Display",Georgia,"Times New Roman",serif;
  font-size:clamp(28px,8vw,36px);line-height:1.12;font-weight:700;letter-spacing:-.01em;color:#fff;
  text-shadow:0 2px 18px rgba(0,0,0,.6);
}

.mvs-copy{margin:0 auto 18px;max-width:340px;font-size:14px;line-height:1.6;color:rgba(255,255,255,.92)}
.mvs-copy span{display:block;margin-top:2px;font-size:12.5px;color:rgba(255,255,255,.62)}

.mvs-actions{display:grid;gap:12px;padding-bottom:6px}
.mvs-btn{
  position:relative;isolation:isolate;overflow:hidden;width:100%;height:56px;
  display:flex;align-items:center;justify-content:center;gap:10px;padding:0 54px 0 16px;
  border-radius:999px;cursor:pointer;font-size:15.5px;font-weight:700;line-height:1;
  border:1px solid rgba(255,255,255,.18);-webkit-tap-highlight-color:transparent;
  transition:transform .15s ease,box-shadow .15s ease,filter .2s ease;
}
.mvs-btn-green{
  color:#fff;
  background:linear-gradient(180deg,#52ec86 0%,#1fbf55 46%,#0f8a3c 100%);
  box-shadow:inset 0 1.5px 0 rgba(255,255,255,.55),inset 0 -5px 10px rgba(0,60,20,.38),0 5px 0 #0a5f29,0 12px 24px -6px rgba(34,197,94,.55);
}
.mvs-btn-gold{
  color:#3a2200;
  background:linear-gradient(180deg,#ffe98a 0%,#f7bd2f 46%,#bd7a0c 100%);
  box-shadow:inset 0 1.5px 0 rgba(255,255,255,.65),inset 0 -5px 10px rgba(110,60,0,.4),0 5px 0 #7a4a06,0 12px 24px -6px rgba(245,184,46,.5);
}
.mvs-btn-gold.is-locked{filter:saturate(.78) brightness(.9)}
.mvs-btn:active{transform:translateY(4px)}
.mvs-btn-green:active{box-shadow:inset 0 1.5px 0 rgba(255,255,255,.55),inset 0 -5px 10px rgba(0,60,20,.38),0 1px 0 #0a5f29,0 6px 14px -6px rgba(34,197,94,.55)}
.mvs-btn-gold:active{box-shadow:inset 0 1.5px 0 rgba(255,255,255,.65),inset 0 -5px 10px rgba(110,60,0,.4),0 1px 0 #7a4a06,0 6px 14px -6px rgba(245,184,46,.5)}
@media (hover:hover){.mvs-btn:hover{filter:brightness(1.1)}.mvs-btn-gold.is-locked:hover{filter:saturate(.9) brightness(1)}}
.mvs-gloss{position:absolute;left:6%;right:6%;top:2px;height:46%;z-index:0;pointer-events:none;border-radius:999px;background:linear-gradient(180deg,rgba(255,255,255,.4),rgba(255,255,255,0))}
.mvs-ico{position:relative;z-index:1;flex:none;width:36px;height:36px;border-radius:999px;background:#fff;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 6px rgba(0,0,0,.3)}
.mvs-label{position:relative;z-index:1;white-space:nowrap;text-shadow:0 1px 2px rgba(0,0,0,.3)}
.mvs-btn-gold .mvs-label{text-shadow:0 1px 0 rgba(255,255,255,.45)}
.mvs-sub{font-size:12px;font-weight:600;opacity:.85}
.mvs-lock{
  position:absolute;right:14px;top:50%;transform:translateY(-50%);z-index:2;width:30px;height:30px;border-radius:999px;
  display:flex;align-items:center;justify-content:center;
  background:rgba(40,22,0,.55);color:#ffe9a0;border:1px solid rgba(255,233,160,.45);box-shadow:inset 0 1px 0 rgba(255,255,255,.25);
}
.mvs-btn-gold.is-unlocked .mvs-lock{background:rgba(255,255,255,.4);color:#5a3500;border-color:rgba(255,255,255,.6)}
.mvs-shine{position:absolute;top:0;bottom:0;left:-40%;width:30%;z-index:1;pointer-events:none;background:linear-gradient(100deg,transparent,rgba(255,255,255,.55),transparent);transform:skewX(-18deg);animation:mvs-shine 4.5s ease-in-out infinite}
@keyframes mvs-shine{0%,60%{left:-40%}100%{left:130%}}

.mvs-sublink{margin-top:12px;width:100%;background:none;border:0;cursor:pointer;font-size:13px;font-weight:600;color:#fde68a;text-decoration:underline;text-underline-offset:4px}
.mvs-success{margin:12px 0 0;display:flex;align-items:center;justify-content:center;gap:6px;font-size:13px;color:#bef264}

@media (max-height:640px){
  .mvs-sheet{height:94dvh}
  .mvs-title{font-size:26px}
}
@media (min-width:640px){
  .mvs-sheet{border-radius:32px;margin-bottom:24px}
}
@media (prefers-reduced-motion:reduce){
  .mvs-sheet,.mvs-backdrop{transition-duration:1ms!important}
  .mvs-shine{animation:none!important}
}
`
