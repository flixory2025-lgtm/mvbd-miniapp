"use client"

import { Check, ExternalLink, X } from "lucide-react"
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

const LOGO_URL = "https://i.postimg.cc/C1YpJ5k0/29517-removebg-preview.png"

const CUBES = [
  { left: "6%", top: "14%", size: 74, dur: 26, delay: 0, tone: "lime" },
  { left: "82%", top: "22%", size: 52, dur: 20, delay: -6, tone: "violet" },
  { left: "14%", top: "70%", size: 46, dur: 23, delay: -11, tone: "cyan" },
  { left: "78%", top: "74%", size: 84, dur: 30, delay: -3, tone: "lime" },
]

export default function TelegramJoinPopup({ movieTitle, telegramLink, telegram4kLink, moviePoster, hasPremiumAccess = false, mediaType = "movie", onClose }: TelegramJoinPopupProps) {
  const [hasOpenedTelegram, setHasOpenedTelegram] = useState(false)
  const mediaLabel = mediaType === "anime" ? "anime" : "movie"

  useEffect(() => {
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => { document.body.style.overflow = previousOverflow }
  }, [])
  const openTelegram = (destination?: string) => {
    const target = destination || telegramLink || "https://t.me/mvbd_cloud_bot"
    window.open(target, "_blank", "noopener,noreferrer")
    setHasOpenedTelegram(true)
  }

  const requestSubscription = () => {
    window.dispatchEvent(new CustomEvent("mvbd:open-subscriptions"))
    onClose()
  }

  return (
    <div className="mvp-overlay" role="dialog" aria-modal="true" aria-label={`Watch ${mediaLabel}`} onMouseDown={(event) => { if (event.currentTarget === event.target) onClose() }}>
      <style>{css}</style>

      {/* Dark 3D animated background */}
      <div className="mvp-stage" aria-hidden="true">
        <div className="mvp-aurora mvp-aurora-a" />
        <div className="mvp-aurora mvp-aurora-b" />
        <div className="mvp-aurora mvp-aurora-c" />
        <div className="mvp-floor" />
        <div className="mvp-horizon" />
        {CUBES.map((cube, index) => (
          <div
            key={index}
            className={`mvp-cube-wrap mvp-tone-${cube.tone}`}
            style={{ left: cube.left, top: cube.top, ["--s" as string]: `${cube.size}px`, ["--dur" as string]: `${cube.dur}s`, ["--delay" as string]: `${cube.delay}s` }}
          >
            <div className="mvp-cube">
              <i className="f1" /><i className="f2" /><i className="f3" /><i className="f4" /><i className="f5" /><i className="f6" />
            </div>
          </div>
        ))}
      </div>

      <section className="mvp-card" onMouseDown={(event) => event.stopPropagation()}>
        <button type="button" onClick={onClose} className="mvp-close" aria-label="Close watch popup"><X className="size-5" /></button>

        {/* Poster */}
        <div className="mvp-poster-wrap">
          <div className="mvp-poster">
            {moviePoster
              ? <img src={moviePoster} alt={movieTitle} draggable={false} />
              : <div className="mvp-poster-empty" aria-hidden="true" />}
            <div className="mvp-poster-fade" aria-hidden="true" />
          </div>
        </div>

        <div className="mvp-content">
          {/* Logo at the V tip */}
          <div className="mvp-logo" aria-hidden="true">
            <span className="mvp-logo-glow" />
            <span className="mvp-logo-tile"><img src={LOGO_URL} alt="" draggable={false} /></span>
          </div>

          <p className="mvp-kicker">MVBD CLOUD BOT</p>
          <h2 className="mvp-title">{movieTitle}</h2>

          {!hasPremiumAccess && <div className="mvp-notice"><strong>প্রিমিয়াম ডাউনলোডের জন্য সাবস্ক্রিপশন প্রয়োজন</strong><p>আপনি ফ্রি প্ল্যানে Normal Download করতে পারবেন। 1080P–4K কোয়ালিটির জন্য একটি subscription plan নিন।</p></div>}

          <div className="mvp-copy">
            <p>আপনার পছন্দের {mediaLabel}টি Telegram থেকে ডাউনলোড করুন। নিচের অপশন থেকে quality বেছে নিন।</p>
            <p>Normal Download-এ 480P–720P পর্যন্ত কোয়ালিটি পাওয়া যাবে এবং এটি ফ্রি প্ল্যানেই ব্যবহার করা যাবে।</p>
            <p>1080P–4K Download বেছে নিলে সেরা কোয়ালিটিতে ডাউনলোড করতে পারবেন; এর জন্য active subscription লাগবে।</p>
          </div>

          <div className="mvp-actions">
            <button type="button" onClick={() => openTelegram()} className="mvp-primary"><ExternalLink className="size-4" /> Download Normal <span className="mvp-sub">(480P–720P)</span></button>
            <button type="button" onClick={() => hasPremiumAccess ? openTelegram(telegram4kLink) : requestSubscription()} className="mvp-secondary"><ExternalLink className="size-4" /> Download 1080P–4K</button>
          </div>

          {!hasPremiumAccess && <button type="button" onClick={requestSubscription} className="mvp-sublink">1080P–4K পেতে subscription plan দেখুন</button>}
          {hasOpenedTelegram && <p className="mvp-success"><Check className="size-4" /> Telegram opened in a new tab</p>}
        </div>
      </section>
    </div>
  )
}

const css = `
.mvp-overlay{
  position:fixed;inset:0;z-index:9999;display:flex;align-items:center;justify-content:center;
  padding:12px;background:#020403;overflow:hidden;color:#fff;
}

/* ---------- 3D background ---------- */
.mvp-stage{position:absolute;inset:0;perspective:900px;overflow:hidden;pointer-events:none}
.mvp-aurora{position:absolute;border-radius:50%;filter:blur(70px);opacity:.55;will-change:transform}
.mvp-aurora-a{width:46vmax;height:46vmax;left:-14vmax;top:-18vmax;background:radial-gradient(circle,#4d7c0f 0%,transparent 68%);animation:mvp-drift-a 18s ease-in-out infinite alternate}
.mvp-aurora-b{width:40vmax;height:40vmax;right:-14vmax;top:8vmax;background:radial-gradient(circle,#5b21b6 0%,transparent 68%);animation:mvp-drift-b 22s ease-in-out infinite alternate}
.mvp-aurora-c{width:36vmax;height:36vmax;left:18vmax;bottom:-20vmax;background:radial-gradient(circle,#0e7490 0%,transparent 68%);animation:mvp-drift-a 26s ease-in-out infinite alternate-reverse}
@keyframes mvp-drift-a{from{transform:translate3d(0,0,0) scale(1)}to{transform:translate3d(6vmax,5vmax,0) scale(1.15)}}
@keyframes mvp-drift-b{from{transform:translate3d(0,0,0) scale(1)}to{transform:translate3d(-7vmax,6vmax,0) scale(1.1)}}

.mvp-floor{
  position:absolute;left:-60%;right:-60%;bottom:-8%;height:62%;
  transform-origin:50% 100%;transform:rotateX(72deg);
  background-image:
    linear-gradient(rgba(198,243,95,.28) 1px,transparent 1px),
    linear-gradient(90deg,rgba(198,243,95,.28) 1px,transparent 1px);
  background-size:64px 64px;
  -webkit-mask-image:linear-gradient(to top,#000 0%,transparent 88%);
  mask-image:linear-gradient(to top,#000 0%,transparent 88%);
  animation:mvp-grid 3.2s linear infinite;
}
@keyframes mvp-grid{from{background-position:0 0,0 0}to{background-position:0 64px,0 0}}
.mvp-horizon{
  position:absolute;left:0;right:0;bottom:30%;height:1px;
  background:linear-gradient(90deg,transparent,rgba(198,243,95,.55),transparent);
  box-shadow:0 0 38px 8px rgba(198,243,95,.18);opacity:.6;
}

.mvp-cube-wrap{position:absolute;width:var(--s);height:var(--s);transform-style:preserve-3d;opacity:.6;animation:mvp-float var(--dur) ease-in-out infinite;animation-delay:var(--delay)}
.mvp-cube{position:absolute;inset:0;transform-style:preserve-3d;animation:mvp-spin var(--dur) linear infinite;animation-delay:var(--delay)}
.mvp-cube i{position:absolute;inset:0;border:1px solid var(--edge);background:linear-gradient(135deg,var(--fill),transparent 70%);box-shadow:inset 0 0 18px var(--fill)}
.mvp-cube .f1{transform:translateZ(calc(var(--s)/2))}
.mvp-cube .f2{transform:rotateY(180deg) translateZ(calc(var(--s)/2))}
.mvp-cube .f3{transform:rotateY(90deg) translateZ(calc(var(--s)/2))}
.mvp-cube .f4{transform:rotateY(-90deg) translateZ(calc(var(--s)/2))}
.mvp-cube .f5{transform:rotateX(90deg) translateZ(calc(var(--s)/2))}
.mvp-cube .f6{transform:rotateX(-90deg) translateZ(calc(var(--s)/2))}
.mvp-tone-lime{--edge:rgba(198,243,95,.55);--fill:rgba(198,243,95,.14)}
.mvp-tone-violet{--edge:rgba(167,139,250,.6);--fill:rgba(139,92,246,.18)}
.mvp-tone-cyan{--edge:rgba(103,232,249,.55);--fill:rgba(34,211,238,.14)}
@keyframes mvp-spin{from{transform:rotateX(0) rotateY(0) rotateZ(0)}to{transform:rotateX(360deg) rotateY(720deg) rotateZ(180deg)}}
@keyframes mvp-float{0%,100%{translate:0 0}50%{translate:0 -26px}}

/* ---------- Card ---------- */
.mvp-card{
  position:relative;z-index:1;width:min(100%,420px);max-height:calc(100dvh - 24px);overflow-y:auto;
  border-radius:30px;background:rgba(6,9,8,.9);
  -webkit-backdrop-filter:blur(18px);backdrop-filter:blur(18px);
  border:1px solid rgba(255,255,255,.12);
  box-shadow:0 30px 90px rgba(0,0,0,.75),0 0 70px rgba(198,243,95,.08);
  scrollbar-width:none;
}
.mvp-card::-webkit-scrollbar{display:none}

.mvp-close{
  position:absolute;top:14px;right:14px;z-index:5;width:38px;height:38px;border-radius:999px;
  display:flex;align-items:center;justify-content:center;color:#fff;
  background:rgba(0,0,0,.5);border:1px solid rgba(255,255,255,.22);
  -webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px);cursor:pointer;transition:background .2s,transform .2s;
}
.mvp-close:hover{background:rgba(0,0,0,.75);transform:scale(1.06)}
.mvp-close:focus-visible,.mvp-primary:focus-visible,.mvp-secondary:focus-visible,.mvp-sublink:focus-visible{outline:2px solid #c6f35f;outline-offset:3px}

/* Poster with V-shaped bottom edge (like the reference) */
.mvp-poster-wrap{filter:drop-shadow(0 14px 22px rgba(0,0,0,.65))}
.mvp-poster{
  position:relative;height:clamp(240px,42dvh,400px);overflow:hidden;background:#0a0f0c;
  clip-path:polygon(0 0,100% 0,100% 90%,50% 100%,0 90%);
}
.mvp-poster img{width:100%;height:100%;object-fit:cover;object-position:center top;display:block;user-select:none}
.mvp-poster-empty{width:100%;height:100%;background:radial-gradient(circle at 30% 20%,#1d3a12,transparent 60%),radial-gradient(circle at 80% 70%,#2a1a55,transparent 60%),#0a0f0c}
.mvp-poster-fade{position:absolute;inset:auto 0 0 0;height:22%;background:linear-gradient(to top,rgba(6,9,8,.55),transparent)}

/* ---------- Content ---------- */
.mvp-content{position:relative;padding:0 24px 24px;text-align:center}

.mvp-logo{position:relative;width:84px;height:84px;margin:-46px auto 14px;z-index:3}
.mvp-logo-glow{
  position:absolute;inset:-7px;border-radius:30px;filter:blur(13px);opacity:.9;
  background:conic-gradient(from 0deg,#ff8a00,#ff2d8a,#8b3dff,#2d9bff,#c6f35f,#ff8a00);
  animation:mvp-rotate 7s linear infinite;
}
.mvp-logo-tile{
  position:absolute;inset:0;border-radius:24px;display:flex;align-items:center;justify-content:center;
  background:linear-gradient(160deg,#141a16,#050706);border:1px solid rgba(255,255,255,.18);
  box-shadow:inset 0 1px 0 rgba(255,255,255,.18);
}
.mvp-logo-tile img{width:62%;height:62%;object-fit:contain;user-select:none}
@keyframes mvp-rotate{to{transform:rotate(360deg)}}

.mvp-kicker{margin:0;font-size:11px;font-weight:600;letter-spacing:.3em;color:#c6f35f}
.mvp-title{margin:8px 0 16px;font-size:clamp(24px,7vw,30px);line-height:1.15;font-weight:800;color:#fff;letter-spacing:-.01em}

.mvp-notice{
  margin:0 0 16px;padding:12px 14px;border-radius:16px;text-align:left;font-size:13.5px;line-height:1.6;
  border:1px solid rgba(252,211,77,.25);background:rgba(252,211,77,.08);color:#fffbeb;
}
.mvp-notice p{margin:4px 0 0}

.mvp-copy{display:grid;gap:12px;margin:0 auto 22px;max-width:360px;font-size:14px;line-height:1.75;color:rgba(255,255,255,.9)}
.mvp-copy p{margin:0}

.mvp-actions{display:grid;gap:12px}
.mvp-primary,.mvp-secondary{
  display:flex;align-items:center;justify-content:center;gap:8px;width:100%;min-height:54px;padding:12px 20px;
  border-radius:999px;font-size:15.5px;font-weight:700;line-height:1;cursor:pointer;
  transition:transform .18s ease,box-shadow .18s ease,background .18s ease;
}
.mvp-primary svg,.mvp-secondary svg{flex:none}
.mvp-primary{border:0;color:#0b1206;background:#c6f35f;box-shadow:0 10px 30px rgba(198,243,95,.28)}
.mvp-primary:hover{transform:translateY(-1px);box-shadow:0 14px 38px rgba(198,243,95,.4)}
.mvp-primary:active,.mvp-secondary:active{transform:scale(.98)}
.mvp-sub{font-size:12px;font-weight:600;opacity:.75}
.mvp-secondary{color:#d9f99d;background:rgba(198,243,95,.1);border:1px solid rgba(198,243,95,.4)}
.mvp-secondary:hover{background:rgba(198,243,95,.18);transform:translateY(-1px)}

.mvp-sublink{margin-top:14px;width:100%;background:none;border:0;cursor:pointer;font-size:13.5px;font-weight:600;color:#fde68a;text-decoration:underline;text-underline-offset:4px}
.mvp-success{margin:14px 0 0;display:flex;align-items:center;justify-content:center;gap:6px;font-size:13px;color:#bef264}

@media (max-width:380px){
  .mvp-content{padding:0 18px 20px}
  .mvp-copy{font-size:13.5px}
}
@media (prefers-reduced-motion:reduce){
  .mvp-aurora,.mvp-floor,.mvp-cube-wrap,.mvp-cube,.mvp-logo-glow{animation:none!important}
}
`
