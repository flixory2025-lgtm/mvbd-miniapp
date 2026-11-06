"use client"

import { Check, ExternalLink, X } from "lucide-react"
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
            <button type="button" onClick={() => openTelegram()} className="mvs-primary"><ExternalLink className="size-4" /> Download Normal <span className="mvs-sub">(480P–720P)</span></button>
            <button type="button" onClick={() => hasPremiumAccess ? openTelegram(telegram4kLink) : requestSubscription()} className="mvs-secondary"><ExternalLink className="size-4" /> Download 1080P–4K</button>
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
.mvs-close:focus-visible,.mvs-primary:focus-visible,.mvs-secondary:focus-visible,.mvs-sublink:focus-visible{outline:2px solid #c6f35f;outline-offset:3px}

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

.mvs-actions{display:grid;gap:10px}
.mvs-primary,.mvs-secondary{
  display:flex;align-items:center;justify-content:center;gap:8px;width:100%;min-height:52px;padding:12px 20px;
  border-radius:999px;font-size:15.5px;font-weight:700;line-height:1;cursor:pointer;
  transition:transform .18s ease,box-shadow .18s ease,background .18s ease;
}
.mvs-primary svg,.mvs-secondary svg{flex:none}
.mvs-primary{border:0;color:#0b1206;background:#c6f35f;box-shadow:0 10px 28px rgba(198,243,95,.25)}
.mvs-primary:hover{transform:translateY(-1px);box-shadow:0 14px 36px rgba(198,243,95,.38)}
.mvs-primary:active,.mvs-secondary:active{transform:scale(.98)}
.mvs-sub{font-size:12px;font-weight:600;opacity:.75}
.mvs-secondary{color:#d9f99d;background:rgba(198,243,95,.1);border:1px solid rgba(198,243,95,.4);-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px)}
.mvs-secondary:hover{background:rgba(198,243,95,.18);transform:translateY(-1px)}

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
}
`
