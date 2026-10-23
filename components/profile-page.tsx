"use client"

import { createPortal } from "react-dom"
import { useEffect, useState } from "react"
import { toast } from "sonner"
import {
  Bell,
  CalendarDays,
  Check,
  ChevronRight,
  CircleHelp,
  Clapperboard,
  Clipboard,
  Crown,
  Edit3,
  Film,
  Loader2,
  LogIn,
  LogOut,
  Mail,
  MessageCircle,
  Popcorn,
  Send,
  ShieldCheck,
  Sparkles,
  Star,
  Ticket,
  UserRound,
  X,
} from "lucide-react"

import AuthModal from "@/components/auth-modal"
import { useAuth } from "@/components/auth-provider"

import {
  collection,
  onSnapshot,
  query,
  where,
} from "firebase/firestore"

import { db } from "@/lib/firebase"

import {
  markNotificationRead,
  subscribeToMyNotifications,
  type Notification,
} from "@/lib/notifications"

import { updateUserProfile } from "@/lib/user-profile"

import SubscriptionPanel from "@/components/subscription-panel"

import {
  getSupportMessages,
  sendSupportMessage,
  subscribeToSupportMessages,
  type SupportMessage,
} from "@/lib/support-chat"

/*
 * =========================================
 * GREEN ORB LOADER COMPONENT
 * =========================================
 */
function GreenOrbLoader() {
  return (
    <>
      <div className="green-orb-loader">
        <span className="green-orb" />
        <span className="green-orb-inner" />
        <span className="green-orb-letter">M</span>
      </div>
      <p className="green-orb-text">Loading profile page</p>

      <style jsx>{`
        .green-orb-loader {
          position: relative;
          width: 90px;
          height: 90px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .green-orb {
          position: absolute;
          inset: 0;
          border-radius: 50%;
          background: conic-gradient(
            from 0deg,
            #B7FF00,
            #20E000,
            #0a3d0a,
            #B7FF00
          );
          animation: greenOrbSpin 2.5s linear infinite;
          filter: blur(6px);
          opacity: 0.7;
        }

        .green-orb-inner {
          position: absolute;
          inset: 6px;
          border-radius: 50%;
          background: #07090d;
          z-index: 1;
        }

        .green-orb-letter {
          position: relative;
          z-index: 3;
          font-size: 32px;
          font-weight: 900;
          background: linear-gradient(
            135deg,
            #fff 0%,
            #B7FF00 50%,
            #20E000 100%
          );
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
          animation: greenOrbPulse 2.5s ease-in-out infinite;
          text-shadow: 0 0 30px rgba(183, 255, 0, 0.6);
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI",
            system-ui, sans-serif;
        }

        .green-orb-text {
          font-size: 12px;
          font-weight: 600;
          letter-spacing: 3px;
          text-transform: uppercase;
          color: #9ca3af;
          animation: greenOrbTextBlink 1.6s ease-in-out infinite;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI",
            system-ui, sans-serif;
        }

        @keyframes greenOrbSpin {
          to {
            transform: rotate(360deg);
          }
        }

        @keyframes greenOrbPulse {
          0%,
          100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.1);
          }
        }

        @keyframes greenOrbTextBlink {
          0%,
          100% {
            opacity: 0.4;
          }
          50% {
            opacity: 1;
          }
        }
      `}</style>
    </>
  )
}

interface ProfilePageProps {
  onNavigate?: (page: "contact" | "about" | "settings") => void
}

type Modal = "notifications" | "support" | null

type FirebaseTimestampLike = {
  toMillis: () => number
}

function getRemainingTime(
  timestamp: FirebaseTimestampLike | null,
  now: number,
) {
  if (!timestamp) {
    return {
      total: 0,
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      expired: true,
    }
  }

  const total = Math.max(
    0,
    timestamp.toMillis() - now,
  )

  const totalSeconds = Math.floor(
    total / 1000,
  )

  const days = Math.floor(
    totalSeconds / 86400,
  )

  const hours = Math.floor(
    (totalSeconds % 86400) / 3600,
  )

  const minutes = Math.floor(
    (totalSeconds % 3600) / 60,
  )

  const seconds =
    totalSeconds % 60

  return {
    total,
    days,
    hours,
    minutes,
    seconds,
    expired: total <= 0,
  }
}

function formatTime(value: unknown) {
  if (
    !value ||
    typeof value !== "object" ||
    !("toDate" in value)
  ) {
    return "Just now"
  }

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(
    (
      value as {
        toDate: () => Date
      }
    ).toDate(),
  )
}

/*
 * =========================================
 * DECORATIVE PIECES (cinema theme)
 * =========================================
 */

/** Calligraphy-style corner flourishes for any box */
function Corners() {
  return (
    <>
      {["tl", "tr", "bl", "br"].map((c) => (
        <svg
          key={c}
          className={`pf-cn ${c}`}
          viewBox="0 0 44 44"
          aria-hidden="true"
        >
          <path
            d="M2 42V16C2 8 8 2 16 2h26"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinecap="round"
          />
          <path
            d="M9 42V18c0-5.5 3.5-9 9-9h24"
            fill="none"
            stroke="currentColor"
            strokeWidth=".8"
            strokeLinecap="round"
            opacity=".6"
          />
          <path
            d="M16 16c3-1 5 0 6 2-3 0-5 1-6-2Z"
            fill="currentColor"
          />
          <circle cx="3" cy="42" r="1.6" fill="currentColor" />
          <circle cx="42" cy="3" r="1.6" fill="currentColor" />
        </svg>
      ))}
    </>
  )
}

/** Cinema marquee bulbs */
function Bulbs({ count = 16 }: { count?: number }) {
  return (
    <div className="pf-bulbs" aria-hidden="true">
      {Array.from({ length: count }).map((_, i) => (
        <span key={i} style={{ animationDelay: `${(i % 2) * 0.6}s` }} />
      ))}
    </div>
  )
}

/** Film strip band with sprocket holes */
function FilmStrip() {
  return <div className="pf-filmstrip" aria-hidden="true" />
}

/** Cinematic section divider with script text */
function CineDivider({ text }: { text: string }) {
  return (
    <div className="pf-divider" aria-hidden="true">
      <span className="pf-divider-line" />
      <Clapperboard className="size-4 text-[#B7FF00]" />
      <span className="pf-script pf-divider-text">{text}</span>
      <Film className="size-4 text-[#B7FF00]" />
      <span className="pf-divider-line r" />
    </div>
  )
}

const PROFILE_CSS = String.raw`
@import url("https://fonts.googleapis.com/css2?family=Unbounded:wght@500;600;700&family=Inter:wght@400;500;600;700&family=Great+Vibes&family=Playfair+Display:ital,wght@1,500;1,600&display=swap");

.pf-root{
  --g1:#B7FF00;--g2:#20E000;--g3:#0a3d0a;--ink:#06120a;--gold:#f6e7a8;
  --grad:linear-gradient(135deg,#d9ff5c 0%,#B7FF00 24%,#20E000 72%,#0fb300 100%);
  position:relative;isolation:isolate;overflow:hidden;background:#030705;color:#fff;
  font-family:Inter,system-ui,-apple-system,"Segoe UI",sans-serif;
  -webkit-tap-highlight-color:transparent;-webkit-text-size-adjust:100%;text-size-adjust:100%}
.pf-root *,.pf-root *::before,.pf-root *::after{box-sizing:border-box}
.pf-root::before{content:"";position:absolute;inset:0;z-index:-2;pointer-events:none;
  background:
   radial-gradient(60% 36% at 50% -6%,rgba(32,224,0,.28),transparent 70%),
   radial-gradient(44% 30% at 100% 55%,rgba(183,255,0,.11),transparent 70%),
   radial-gradient(44% 28% at 0% 88%,rgba(32,224,0,.14),transparent 70%),
   radial-gradient(40% 24% at 100% 100%,rgba(246,231,168,.06),transparent 70%)}
.pf-root::after{content:"";position:absolute;inset:0;z-index:-1;pointer-events:none;opacity:.07;mix-blend-mode:overlay;
  background:url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.8' numOctaves='2'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>")}

.pf-disp{font-family:Unbounded,Inter,system-ui,sans-serif}
.pf-script{font-family:"Great Vibes","Playfair Display",cursive;font-weight:400;letter-spacing:.01em}
.pf-serif{font-family:"Playfair Display",Georgia,serif;font-style:italic}
.pf-tabular{font-variant-numeric:tabular-nums;font-feature-settings:"tnum"}
.pf-grad-text{background:var(--grad);-webkit-background-clip:text;background-clip:text;color:transparent;-webkit-text-fill-color:transparent;filter:drop-shadow(0 0 16px rgba(32,224,0,.4))}
.pf-gold-text{background:linear-gradient(180deg,#fffbe0,#f6e7a8 45%,#caa95a);-webkit-background-clip:text;background-clip:text;color:transparent;-webkit-text-fill-color:transparent}

/* entrance */
@keyframes pfRise{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:none}}
.pf-rise{animation:pfRise .8s cubic-bezier(.2,.8,.2,1) both}
.pf-d1{animation-delay:.08s}.pf-d2{animation-delay:.16s}.pf-d3{animation-delay:.26s}.pf-d4{animation-delay:.36s}

/* =============== LIQUID GLASS =============== */
.pf-glass{position:relative;isolation:isolate;min-width:0;border-radius:1.6rem;
  background:
   radial-gradient(120% 60% at 92% -14%,rgba(255,255,255,.17),transparent 55%),
   radial-gradient(90% 60% at 0% 112%,rgba(32,224,0,.14),transparent 62%),
   linear-gradient(145deg,rgba(255,255,255,.085),rgba(255,255,255,.025));
  -webkit-backdrop-filter:blur(20px) saturate(160%);backdrop-filter:blur(20px) saturate(160%);
  box-shadow:inset 0 1px 0 rgba(255,255,255,.22),0 24px 50px -24px rgba(0,0,0,.9)}
.pf-glass::before{content:"";position:absolute;inset:0;border-radius:inherit;padding:1px;pointer-events:none;z-index:2;
  background:linear-gradient(150deg,rgba(255,255,255,.55),rgba(255,255,255,.06) 28%,rgba(183,255,0,.12) 62%,rgba(32,224,0,.55));
  -webkit-mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);-webkit-mask-composite:xor;
  mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);mask-composite:exclude}
.pf-tint{background:
   radial-gradient(120% 60% at 92% -14%,rgba(255,255,255,.2),transparent 55%),
   linear-gradient(145deg,rgba(183,255,0,.17),rgba(32,224,0,.05) 50%,rgba(32,224,0,.13));
  box-shadow:inset 0 1px 0 rgba(255,255,255,.3),0 24px 50px -24px rgba(0,0,0,.9),0 0 60px -22px rgba(32,224,0,.5)}
.pf-sheen{overflow:hidden}
.pf-sheen::after{content:"";position:absolute;top:-50%;left:0;width:30%;height:200%;pointer-events:none;z-index:1;
  background:linear-gradient(100deg,transparent,rgba(255,255,255,.12),transparent);
  transform:translateX(-300%) rotate(14deg);animation:pfSheen 9s ease-in-out infinite;will-change:transform}
@keyframes pfSheen{0%,55%{transform:translateX(-300%) rotate(14deg)}100%{transform:translateX(480%) rotate(14deg)}}
@supports not ((backdrop-filter:blur(1px)) or (-webkit-backdrop-filter:blur(1px))){
  .pf-glass{background-color:rgba(14,22,17,.94)}}

/* calligraphy corner flourishes */
.pf-cn{position:absolute;width:26px;height:26px;color:rgba(183,255,0,.6);pointer-events:none;z-index:3;filter:drop-shadow(0 0 6px rgba(32,224,0,.45))}
.pf-cn.tl{top:11px;left:11px}
.pf-cn.tr{top:11px;right:11px;transform:scaleX(-1)}
.pf-cn.bl{bottom:11px;left:11px;transform:scaleY(-1)}
.pf-cn.br{bottom:11px;right:11px;transform:scale(-1,-1)}
.pf-card-pad{padding-top:2.1rem}

/* watermark icon inside a card */
.pf-wm{position:absolute;z-index:0;right:-1.2rem;bottom:-1.4rem;width:9rem;height:9rem;color:rgba(183,255,0,.06);transform:rotate(-14deg);pointer-events:none}

/* =============== small pieces =============== */
.pf-label{display:flex;align-items:center;gap:.65rem;font-size:10.5px;font-weight:600;letter-spacing:.26em;text-transform:uppercase;color:rgba(255,255,255,.62)}
.pf-label::after{content:"";flex:1;height:1px;background:linear-gradient(90deg,rgba(183,255,0,.4),transparent)}
.pf-label.pf-c{justify-content:center}.pf-label.pf-c::after{display:none}
.pf-num{font-family:Unbounded,Inter,sans-serif;font-size:11px;font-weight:600;letter-spacing:.1em;color:var(--g1)}
.pf-sub{margin-top:.55rem;font-family:"Great Vibes",cursive;font-size:1.7rem;line-height:1;color:var(--gold);text-shadow:0 0 18px rgba(246,231,168,.35)}
.pf-h2{margin-top:.15rem;font-family:Unbounded,Inter,sans-serif;font-size:1.08rem;font-weight:600;letter-spacing:-.01em;line-height:1.3}

.pf-btn{display:inline-flex;align-items:center;justify-content:center;gap:.5rem;border-radius:999px;font-weight:700;color:var(--ink);white-space:nowrap;
  background:var(--grad);
  box-shadow:inset 0 1px 0 rgba(255,255,255,.7),inset 0 -2px 6px rgba(0,70,0,.28),0 10px 26px -10px rgba(32,224,0,.85);
  transition:transform .2s ease,filter .2s ease}
.pf-btn:active{transform:scale(.97)}
.pf-btn:disabled{opacity:.55}
.pf-btn-glass{display:inline-flex;align-items:center;justify-content:center;gap:.45rem;border-radius:999px;color:rgba(255,255,255,.9);white-space:nowrap;
  background:linear-gradient(145deg,rgba(255,255,255,.14),rgba(255,255,255,.04));
  -webkit-backdrop-filter:blur(16px) saturate(160%);backdrop-filter:blur(16px) saturate(160%);
  border:1px solid rgba(255,255,255,.18);box-shadow:inset 0 1px 0 rgba(255,255,255,.38),0 8px 20px -10px rgba(0,0,0,.85);
  transition:background .2s ease,transform .2s ease}
.pf-btn-glass:active{transform:scale(.95)}
@media (hover:hover){
  .pf-btn:hover{filter:brightness(1.07)}
  .pf-btn-glass:hover{background:linear-gradient(145deg,rgba(255,255,255,.22),rgba(255,255,255,.07))}
}

.pf-icon{display:grid;place-items:center;flex:none;width:2.7rem;height:2.7rem;border-radius:50%;color:var(--ink);
  background:radial-gradient(circle at 30% 20%,#ecff95,#B7FF00 38%,#20E000 78%,#0c8a00);
  box-shadow:inset 0 1px 1px rgba(255,255,255,.75),inset 0 -3px 8px rgba(0,70,0,.3),0 8px 22px -6px rgba(32,224,0,.7)}
.pf-icon-lg{width:4rem;height:4rem}
.pf-icon-sm{width:2.25rem;height:2.25rem}

.pf-field{position:relative;display:flex;align-items:center;gap:.8rem;min-width:0;min-height:4.6rem;border-radius:1.1rem;padding:.8rem .95rem;
  background:linear-gradient(145deg,rgba(255,255,255,.06),rgba(255,255,255,.02));border:1px solid rgba(255,255,255,.08);
  box-shadow:inset 0 1px 0 rgba(255,255,255,.1);transition:border-color .25s,transform .25s}
.pf-field::after{content:"";position:absolute;left:.95rem;right:.95rem;bottom:0;height:1px;background:linear-gradient(90deg,transparent,rgba(183,255,0,.45),transparent);opacity:.55}
@media (hover:hover){.pf-field:hover{border-color:rgba(183,255,0,.3);transform:translateY(-1px)}}
.pf-fi{flex:none;display:grid;place-items:center;width:2.25rem;height:2.25rem;border-radius:.7rem;color:var(--g1);
  background:linear-gradient(145deg,rgba(183,255,0,.18),rgba(32,224,0,.06));border:1px solid rgba(183,255,0,.22)}
.pf-fbody{flex:1;min-width:0;display:flex;flex-direction:column;gap:.22rem}
.pf-fbody>span{font-size:10px;font-weight:600;letter-spacing:.2em;text-transform:uppercase;color:rgba(255,255,255,.48)}
.pf-fbody>strong{display:block;font-size:14.5px;font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.pf-fbody input{display:block;width:100%;min-width:0;max-width:100%;min-height:2.4rem;border-radius:.65rem;padding:.4rem .65rem;color:#fff;
  font-size:16px;outline:none;color-scheme:dark;-webkit-appearance:none;appearance:none;
  background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.14);transition:border-color .2s,box-shadow .2s}
.pf-fbody input:focus{border-color:rgba(183,255,0,.75);box-shadow:0 0 0 3px rgba(32,224,0,.2)}

.pf-action{position:relative;display:flex;align-items:center;gap:.9rem;width:100%;min-width:0;text-align:left;border-radius:999px;padding:.72rem 1.1rem .72rem .72rem;transition:transform .25s ease}
.pf-action:active{transform:scale(.985)}
.pf-action .pf-atext{min-width:0;flex:1}
.pf-action strong{display:block;font-size:15px;font-weight:600}
.pf-action small{display:block;margin-top:1px;font-size:12px;color:rgba(255,255,255,.52);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
@media (hover:hover){.pf-action:hover{transform:translateY(-2px)}}
.pf-dot{flex:none;width:.6rem;height:.6rem;border-radius:50%;background:var(--grad);box-shadow:0 0 12px #20E000;animation:pfPing 1.8s ease-in-out infinite}
@keyframes pfPing{50%{transform:scale(1.45);opacity:.6}}

/* =============== cinema ornaments =============== */
.pf-bulbs{display:flex;justify-content:space-between;gap:4px;padding:0 .2rem}
.pf-bulbs span{flex:none;width:6px;height:6px;border-radius:50%;background:#f6e7a8;box-shadow:0 0 8px 1px rgba(246,231,168,.8);animation:pfBulb 1.2s ease-in-out infinite alternate}
@keyframes pfBulb{from{opacity:.25;box-shadow:0 0 2px rgba(246,231,168,.3)}to{opacity:1}}

.pf-filmstrip{height:14px;border-radius:3px;opacity:.9;
  background:
   repeating-linear-gradient(90deg,transparent 0 6px,rgba(3,7,5,.95) 6px 14px,transparent 14px 20px) center/100% 6px no-repeat,
   linear-gradient(180deg,rgba(183,255,0,.28),rgba(183,255,0,.1))}

.pf-divider{display:flex;align-items:center;justify-content:center;gap:.8rem;margin:2.2rem 0 1.6rem}
.pf-divider-line{flex:1;height:1px;background:linear-gradient(90deg,transparent,rgba(183,255,0,.5))}
.pf-divider-line.r{background:linear-gradient(270deg,transparent,rgba(183,255,0,.5))}
.pf-divider-text{font-size:1.7rem;line-height:1;color:var(--gold);text-shadow:0 0 18px rgba(246,231,168,.4);white-space:nowrap}

.pf-flourish{display:flex;align-items:center;justify-content:center;gap:.6rem;margin:.7rem auto 0;width:min(14rem,70%)}
.pf-flourish i{flex:1;height:1px;background:linear-gradient(90deg,transparent,rgba(246,231,168,.7))}
.pf-flourish i:last-child{background:linear-gradient(270deg,transparent,rgba(246,231,168,.7))}
.pf-flourish b{width:7px;height:7px;transform:rotate(45deg);background:var(--gold);box-shadow:0 0 10px rgba(246,231,168,.8)}

/* =============== HERO =============== */
.pf-hero{position:relative;isolation:isolate;overflow:hidden;border-radius:2rem;border:1px solid rgba(183,255,0,.16);background:#050a07;
  box-shadow:0 30px 80px -34px rgba(32,224,0,.55)}
.pf-aurora{position:absolute;inset:0;z-index:-4;overflow:hidden}
.pf-aurora span{position:absolute;border-radius:50%;will-change:transform}
.pf-aurora span:nth-child(1){width:110%;height:62%;left:-25%;top:-24%;background:radial-gradient(closest-side,rgba(32,224,0,.55),rgba(32,224,0,.16) 55%,transparent);animation:pfA1 16s ease-in-out infinite alternate}
.pf-aurora span:nth-child(2){width:80%;height:56%;right:-26%;top:-12%;background:radial-gradient(closest-side,rgba(183,255,0,.38),rgba(183,255,0,.10) 55%,transparent);animation:pfA2 19s ease-in-out infinite alternate}
.pf-aurora span:nth-child(3){width:90%;height:50%;left:5%;bottom:-22%;background:radial-gradient(closest-side,rgba(12,130,40,.5),transparent);animation:pfA3 14s ease-in-out infinite alternate}
@keyframes pfA1{to{transform:translate3d(10%,8%,0) scale(1.12)}}
@keyframes pfA2{to{transform:translate3d(-12%,10%,0) scale(1.1)}}
@keyframes pfA3{to{transform:translate3d(8%,-8%,0) scale(1.15)}}
.pf-dots{position:absolute;inset:0;z-index:-3;pointer-events:none;opacity:.3;
  background-image:radial-gradient(rgba(183,255,0,.4) 1px,transparent 1.3px);background-size:22px 22px;
  -webkit-mask:radial-gradient(70% 55% at 50% 28%,#000,transparent);mask:radial-gradient(70% 55% at 50% 28%,#000,transparent)}
.pf-beams{position:absolute;inset:0;z-index:-3;pointer-events:none;overflow:hidden}
.pf-beams span{position:absolute;top:-4%;left:50%;width:150%;height:110%;margin-left:-75%;transform-origin:50% 0;
  background:conic-gradient(from 180deg at 50% 0,transparent 156deg,rgba(183,255,0,.13) 172deg,rgba(246,231,168,.1) 180deg,rgba(183,255,0,.13) 188deg,transparent 204deg);
  -webkit-mask:linear-gradient(180deg,#000,transparent 75%);mask:linear-gradient(180deg,#000,transparent 75%)}
.pf-beams span:nth-child(1){animation:pfSway 9s ease-in-out infinite alternate}
.pf-beams span:nth-child(2){animation:pfSway 12s ease-in-out infinite alternate-reverse;opacity:.7}
@keyframes pfSway{from{transform:rotate(-9deg)}to{transform:rotate(9deg)}}
.pf-hero-fade{position:absolute;inset:0;z-index:-1;pointer-events:none;
  background:linear-gradient(180deg,rgba(0,0,0,.1) 0%,rgba(0,0,0,.3) 40%,rgba(4,8,6,.9) 82%,#040806 100%)}

.pf-floaters{position:absolute;inset:0;z-index:-2;pointer-events:none;overflow:hidden}
.pf-floaters svg{position:absolute;color:rgba(183,255,0,.17);animation:pfFloat 8s ease-in-out infinite}
.pf-floaters svg:nth-child(1){top:16%;left:6%;width:34px;height:34px}
.pf-floaters svg:nth-child(2){top:30%;right:7%;width:40px;height:40px;animation-delay:-2s}
.pf-floaters svg:nth-child(3){top:56%;left:9%;width:30px;height:30px;animation-delay:-4s}
.pf-floaters svg:nth-child(4){top:64%;right:10%;width:32px;height:32px;animation-delay:-6s}
.pf-floaters svg:nth-child(5){top:8%;right:30%;width:22px;height:22px;animation-delay:-3s}
@keyframes pfFloat{0%,100%{transform:translateY(0) rotate(-8deg)}50%{transform:translateY(-14px) rotate(8deg)}}

.pf-avatar-wrap{position:relative;width:9.5rem;height:9.5rem;margin:1.6rem auto 0;flex:none}
.pf-ring{position:absolute;border-radius:50%;pointer-events:none;border:1px solid rgba(183,255,0,.16)}
.pf-ring.r1{inset:-14px}.pf-ring.r2{inset:-30px;border-color:rgba(183,255,0,.08)}
.pf-ring.r3{inset:-46px;border:1px dashed rgba(246,231,168,.14);animation:pfSpin 40s linear infinite reverse}
.pf-orbit{position:absolute;inset:-14px;border-radius:50%;pointer-events:none;animation:pfSpin 14s linear infinite;will-change:transform}
.pf-orbit::after{content:"";position:absolute;top:-4px;left:50%;width:8px;height:8px;margin-left:-4px;border-radius:50%;background:var(--g1);box-shadow:0 0 14px 2px #B7FF00}
.pf-avatar{position:absolute;inset:0;border-radius:50%;padding:3px;
  background:conic-gradient(from 0deg,#B7FF00,#20E000,#0a3d0a,#B7FF00);box-shadow:0 0 70px -6px rgba(32,224,0,.55)}
.pf-avatar-in{display:grid;place-items:center;width:100%;height:100%;border-radius:50%;overflow:hidden;background:#0a120d;
  box-shadow:inset 0 0 0 2px rgba(4,8,6,.9),inset 0 -12px 28px rgba(32,224,0,.22)}
.pf-crown{position:absolute;z-index:3;right:-.3rem;top:-.4rem;display:grid;place-items:center;width:2.4rem;height:2.4rem;border-radius:.85rem;transform:rotate(12deg);color:var(--ink);
  background:var(--grad);box-shadow:inset 0 1px 0 rgba(255,255,255,.7),0 8px 22px rgba(32,224,0,.6)}
@keyframes pfSpin{to{transform:rotate(360deg)}}

.pf-welcome{margin-top:2.6rem;font-family:"Great Vibes",cursive;font-size:clamp(1.7rem,7vw,2.5rem);line-height:1;color:var(--gold);text-shadow:0 0 24px rgba(246,231,168,.4)}
.pf-name{margin-top:.5rem;font-family:Unbounded,Inter,sans-serif;font-weight:600;font-size:clamp(21px,6vw,38px);line-height:1.18;letter-spacing:-.01em;overflow-wrap:anywhere;
  background:linear-gradient(180deg,#fff 0%,#eaffc4 55%,#B7FF00 140%);-webkit-background-clip:text;background-clip:text;color:transparent;-webkit-text-fill-color:transparent;
  filter:drop-shadow(0 0 18px rgba(183,255,0,.22))}
.pf-pill{display:inline-flex;align-items:center;gap:.55rem;padding:.55rem 1.1rem;border-radius:999px;font-size:13.5px;font-weight:500;max-width:100%}

/* membership ticket */
.pf-pass{--stub:11.2rem;position:relative;width:100%;max-width:27rem;margin:2rem auto 0;padding:0;text-align:left;border-radius:1.7rem;
  -webkit-mask:
    radial-gradient(circle 11px at 0 calc(100% - var(--stub)),#0000 97%,#000) left/51% 100% no-repeat,
    radial-gradient(circle 11px at 100% calc(100% - var(--stub)),#0000 97%,#000) right/51% 100% no-repeat;
  mask:
    radial-gradient(circle 11px at 0 calc(100% - var(--stub)),#0000 97%,#000) left/51% 100% no-repeat,
    radial-gradient(circle 11px at 100% calc(100% - var(--stub)),#0000 97%,#000) right/51% 100% no-repeat}
.pf-pass-main{position:relative;padding:1.3rem 1.3rem 1.2rem}
.pf-pass-stub{position:relative;min-height:var(--stub);padding:1.1rem 1.3rem 1.2rem;display:flex;flex-direction:column;justify-content:center}
.pf-perf{position:absolute;left:1.1rem;right:1.1rem;top:0;border-top:2px dashed rgba(183,255,0,.38)}
.pf-admit{font-family:"Great Vibes",cursive;font-size:1.9rem;line-height:1;color:var(--gold);text-shadow:0 0 18px rgba(246,231,168,.4)}
.pf-logo{display:grid;place-items:center;flex:none;width:2.1rem;height:2.1rem;border-radius:.65rem;background:var(--grad);color:var(--ink);font-family:Unbounded,sans-serif;font-weight:700;font-size:15px;
  box-shadow:inset 0 1px 0 rgba(255,255,255,.7),0 6px 18px -4px rgba(32,224,0,.7)}
.pf-mini{font-size:9.5px;font-weight:600;letter-spacing:.24em;text-transform:uppercase;color:rgba(255,255,255,.5)}
.pf-chipgfx{flex:none;width:2.4rem;height:1.8rem;border-radius:.45rem;background:linear-gradient(135deg,rgba(255,255,255,.35),rgba(183,255,0,.35),rgba(32,224,0,.3));
  border:1px solid rgba(255,255,255,.3);box-shadow:inset 0 1px 0 rgba(255,255,255,.5);
  background-image:linear-gradient(90deg,transparent 48%,rgba(0,0,0,.25) 49% 51%,transparent 52%),linear-gradient(0deg,transparent 48%,rgba(0,0,0,.25) 49% 51%,transparent 52%),linear-gradient(135deg,rgba(255,255,255,.35),rgba(183,255,0,.35),rgba(32,224,0,.3))}
.pf-mono{font-family:ui-monospace,"SF Mono",Menlo,Consolas,monospace;font-size:clamp(14px,4.2vw,18px);letter-spacing:.2em;overflow-wrap:anywhere;color:#f3ffd6}
.pf-days{font-family:Unbounded,Inter,sans-serif;font-weight:700;font-size:clamp(2.4rem,11vw,3.4rem);line-height:1.05;letter-spacing:-.02em}
.pf-days small{font-family:Inter,sans-serif;font-size:.8rem;font-weight:600;letter-spacing:.24em;color:rgba(255,255,255,.55);margin-left:.4rem}
.pf-tc{min-width:0;border-radius:.95rem;padding:.6rem .25rem .5rem;text-align:center;background:rgba(0,0,0,.3);border:1px solid rgba(183,255,0,.16);box-shadow:inset 0 1px 0 rgba(255,255,255,.1)}
.pf-tc b{display:block;font-family:Unbounded,Inter,sans-serif;font-weight:600;font-size:1.15rem;line-height:1.1}
.pf-tc small{display:block;margin-top:3px;font-size:9px;font-weight:600;letter-spacing:.22em;text-transform:uppercase;color:rgba(255,255,255,.48)}
.pf-barcode{height:2.2rem;border-radius:3px;opacity:.7;
  background:repeating-linear-gradient(90deg,#d9ff5c 0 2px,transparent 2px 4px,#d9ff5c 4px 5px,transparent 5px 9px,#d9ff5c 9px 12px,transparent 12px 14px)}

/* referral */
.pf-code{display:flex;align-items:center;justify-content:space-between;gap:.75rem;min-width:0;border-radius:1.1rem;padding:.65rem .65rem .65rem 1rem;
  background:rgba(0,0,0,.34);border:1px dashed rgba(246,231,168,.5);box-shadow:inset 0 1px 0 rgba(255,255,255,.08)}
.pf-code code{min-width:0;flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-family:ui-monospace,"SF Mono",Menlo,Consolas,monospace;font-size:14px;letter-spacing:.16em;color:#fff6cf}
.pf-bignum{font-family:Unbounded,Inter,sans-serif;font-weight:700;font-size:2.8rem;line-height:1;letter-spacing:-.02em}
.pf-stars{display:flex;gap:3px;color:var(--gold)}
.pf-stars svg{filter:drop-shadow(0 0 6px rgba(246,231,168,.6))}

/* =============== MODAL =============== */
.pf-modal-backdrop{position:fixed;inset:0;z-index:9999;display:flex;align-items:center;justify-content:center;
  padding:max(1rem,env(safe-area-inset-top)) 1rem max(1rem,env(safe-area-inset-bottom));
  background:radial-gradient(60% 46% at 50% 26%,rgba(32,224,0,.22),rgba(0,0,0,.84)),rgba(0,0,0,.72);
  -webkit-backdrop-filter:blur(12px);backdrop-filter:blur(12px)}
.pf-glass.pf-modal-card{width:100%;max-width:34rem;max-height:90vh;max-height:90dvh;overflow-y:auto;overscroll-behavior:contain;color:#fff;
  background:radial-gradient(100% 50% at 90% -10%,rgba(183,255,0,.13),transparent 60%),linear-gradient(145deg,rgba(26,40,31,.94),rgba(6,12,8,.97))}
.pf-bubble-me{background:var(--grad);color:var(--ink);font-weight:500;box-shadow:inset 0 1px 0 rgba(255,255,255,.6),0 8px 20px -8px rgba(32,224,0,.7)}
.pf-bubble-them{background:linear-gradient(145deg,rgba(255,255,255,.14),rgba(255,255,255,.05));border:1px solid rgba(255,255,255,.12);
  box-shadow:inset 0 1px 0 rgba(255,255,255,.22);color:#e8efe9}
.pf-bubble-me,.pf-bubble-them{overflow-wrap:anywhere;word-break:break-word}

@media (prefers-reduced-motion:reduce){
  .pf-sheen::after,.pf-aurora span,.pf-orbit,.pf-dot,.pf-beams span,.pf-floaters svg,.pf-bulbs span,.pf-ring.r3,.pf-rise{animation:none!important}
}
`

function ProfileStyles() {
  return <style>{PROFILE_CSS}</style>
}

export default function ProfilePage(
  { onNavigate }: ProfilePageProps = {},
) {
  const {
    user,
    profile,
    entitlement,
    loading,
    signOut,
    refreshProfile,
  } = useAuth()

  const [showAuthModal, setShowAuthModal] =
    useState(false)

  const [isEditing, setIsEditing] =
    useState(false)

  const [name, setName] =
    useState("")

  const [dateOfBirth, setDateOfBirth] =
    useState("")

  const [saving, setSaving] =
    useState(false)

  const [copied, setCopied] =
    useState(false)

  const [modal, setModal] =
    useState<Modal>(null)

  const [showSubscriptions, setShowSubscriptions] =
    useState(false)

  const [notifications, setNotifications] =
    useState<Notification[]>([])

  const [messages, setMessages] =
    useState<SupportMessage[]>([])

  const [message, setMessage] =
    useState("")

  const [sending, setSending] =
    useState(false)

  const [now, setNow] =
    useState(Date.now())

  const [mounted, setMounted] =
    useState(false)

  const [successfulReferrals, setSuccessfulReferrals] =
    useState(0)

  useEffect(() => {
    setMounted(true)

    return () => {
      setMounted(false)
    }
  }, [])

  useEffect(() => {
    setName(
      profile?.name ??
        user?.displayName ??
        "",
    )

    setDateOfBirth(
      profile?.dateOfBirth ??
        "",
    )
  }, [profile, user])

  useEffect(() => {
    if (!user?.uid) {
      setSuccessfulReferrals(0)
      return
    }

    const referralsQuery = query(
      collection(db, "users"),
      where("referredBy", "==", user.uid),
    )

    const unsubscribeReferrals =
      onSnapshot(
        referralsQuery,
        (snapshot) => {
          let activePaidReferrals = 0

          snapshot.forEach((referralDoc) => {
            const data = referralDoc.data()

            const isPaidSubscription =
              data.accessType ===
                "subscription" &&
              data.subscriptionStatus ===
                "active"

            if (isPaidSubscription) {
              activePaidReferrals += 1
            }
          })

          setSuccessfulReferrals(
            activePaidReferrals,
          )
        },
        (error) => {
          console.error(
            "Unable to subscribe to referral count",
            error,
          )

          setSuccessfulReferrals(0)
        },
      )

    return () => {
      unsubscribeReferrals()
    }
  }, [user?.uid])

  useEffect(() => {
    if (!user) {
      setNotifications([])
      return
    }

    const unsubscribeNotifications =
      subscribeToMyNotifications(
        user.uid,
        setNotifications,
        () =>
          toast.error(
            "Notifications are unavailable right now.",
          ),
      )

    return () =>
      unsubscribeNotifications()
  }, [user])

  useEffect(() => {
    if (
      !user ||
      modal !== "support"
    ) {
      return
    }

    let active = true

    void getSupportMessages(
      user.uid,
    ).then((items) => {
      if (active) {
        setMessages(items)
      }
    })

    const unsubscribe =
      subscribeToSupportMessages(
        user.uid,
        setMessages,
      )

    return () => {
      active = false
      unsubscribe()
    }
  }, [modal, user])

  useEffect(() => {
    if (!modal) return

    const previousOverflow =
      document.body.style.overflow

    const previousTouchAction =
      document.body.style.touchAction

    document.body.style.overflow =
      "hidden"

    document.body.style.touchAction =
      "none"

    return () => {
      document.body.style.overflow =
        previousOverflow

      document.body.style.touchAction =
        previousTouchAction
    }
  }, [modal])

  useEffect(() => {
    const timer =
      window.setInterval(() => {
        setNow(Date.now())
      }, 1000)

    const openSubscriptions = () =>
      setShowSubscriptions(true)

    window.addEventListener(
      "mvbd:open-subscriptions",
      openSubscriptions,
    )

    return () => {
      window.clearInterval(timer)

      window.removeEventListener(
        "mvbd:open-subscriptions",
        openSubscriptions,
      )
    }
  }, [])

  const expiry =
    entitlement.isPremiumActive
      ? entitlement.subscriptionExpiresAt
      : entitlement.isTrialActive
        ? entitlement.trialExpiresAt
        : null

  const remaining =
    getRemainingTime(
      expiry,
      now,
    )

  const days =
    remaining.days

  const daysTone =
    remaining.expired
      ? "text-red-300"
      : days <= 2
        ? "text-red-300"
        : days === 3
          ? "text-amber-300"
          : "text-lime-300"

  const countdownText =
    remaining.expired
      ? "Expired"
      : `${String(
          remaining.hours,
        ).padStart(2, "0")}h • ${String(
          remaining.minutes,
        ).padStart(2, "0")}m • ${String(
          remaining.seconds,
        ).padStart(2, "0")}s`

  const unreadCount =
    notifications.filter(
      (item) => !item.read,
    ).length

  const isPremium =
    entitlement.isPremiumActive ||
    entitlement.isTrialActive

  const accountType =
    entitlement.isPremiumActive
      ? "Paid"
      : entitlement.isTrialActive
        ? "Trial"
        : "Free"

  const status =
    profile?.subscriptionStatus ===
    "active"
      ? "Active"
      : profile?.subscriptionStatus ===
          "pending"
        ? "Pending"
        : profile?.subscriptionStatus ===
            "expired"
          ? "Cancelled"
          : "Not Active"

  const photo =
    user?.photoURL ||
    profile?.photoURL

  const initials = (
    profile?.name ||
    user?.email ||
    "MV"
  )
    .slice(0, 2)
    .toUpperCase()

  const profileData =
    profile as
      | (
          Record<string, unknown> & {
            referralCode?: string
            promoCode?: string
            refCode?: string
            successfulReferrals?: number
            referralCount?: number
          }
        )
      | null

  const referralCode =
    profileData?.referralCode ||
    profileData?.promoCode ||
    profileData?.refCode ||
    profile?.mvbdId ||
    "MVBD-PENDING"

  const saveProfile =
    async () => {
      if (!user) return

      setSaving(true)

      try {
        await updateUserProfile(
          user.uid,
          {
            name:
              name.trim(),
            dateOfBirth:
              dateOfBirth.trim(),
          },
        )

        await refreshProfile()

        setIsEditing(false)

        toast.success(
          "Profile saved",
        )
      } catch (error) {
        toast.error(
          error instanceof Error
            ? error.message
            : "Could not save profile",
        )
      } finally {
        setSaving(false)
      }
    }

  const copyCode =
    async () => {
      try {
        await navigator.clipboard.writeText(
          referralCode,
        )

        setCopied(true)

        window.setTimeout(
          () =>
            setCopied(false),
          1600,
        )
      } catch {
        toast.error(
          "Could not copy code",
        )
      }
    }

  const openNotifications =
    async () => {
      setModal(
        "notifications",
      )

      if (!user) return

      const unread =
        notifications.filter(
          (item) =>
            !item.read,
        )

      await Promise.all(
        unread.map(
          (item) =>
            markNotificationRead(
              user.uid,
              item.notificationId,
            ),
        ),
      )

      setNotifications(
        (items) =>
          items.map(
            (item) => ({
              ...item,
              read: true,
            }),
          ),
      )
    }

  const submitMessage =
    async () => {
      if (
        !user ||
        !message.trim()
      ) {
        return
      }

      setSending(true)

      try {
        await sendSupportMessage(
          user.uid,
          message.trim(),
          profile?.name ||
            user.email ||
            "User",
        )

        setMessage("")
      } catch {
        toast.error(
          "Message could not be sent",
        )
      } finally {
        setSending(false)
      }
    }

  if (loading) {
    return (
      <main className="pf-root flex min-h-[60vh] flex-col items-center justify-center gap-6">
        <ProfileStyles />
        <GreenOrbLoader />
      </main>
    )
  }

  if (!user) {
    return (
      <main className="pf-root flex min-h-[60vh] items-center justify-center px-4 py-10">
        <ProfileStyles />

        <section className="pf-glass pf-tint pf-sheen pf-rise w-full max-w-md p-8 pt-10 text-center">
          <Corners />

          <div className="pf-icon pf-icon-lg mx-auto mb-4">
            <UserRound className="size-7" />
          </div>

          <p className="pf-script text-3xl text-[#f6e7a8]">
            Step into the spotlight
          </p>

          <h1 className="pf-disp mt-1 text-2xl font-semibold tracking-tight">
            Your MVBD account
          </h1>

          <div className="pf-flourish">
            <i />
            <b />
            <i />
          </div>

          <p className="mt-4 text-sm leading-6 text-zinc-300">
            Sign in to manage your membership,
            referrals, notifications, and support.
          </p>

          <button
            onClick={() => setShowAuthModal(true)}
            className="pf-btn mt-7 px-6 py-3 text-sm"
          >
            <LogIn className="size-4" />
            Sign in
          </button>

          <AuthModal
            open={showAuthModal}
            onOpenChange={setShowAuthModal}
          />
        </section>
      </main>
    )
  }

  return (
    <main className="pf-root min-h-0 px-4 pb-24 pt-5 text-white sm:px-6 lg:px-8">
      <ProfileStyles />

      <div className="mx-auto w-full max-w-6xl">

        {/* PROFILE HERO */}
        <section className="pf-hero pf-rise px-4 pb-8 pt-4 text-center sm:px-10">
          <div className="pf-aurora" aria-hidden="true">
            <span />
            <span />
            <span />
          </div>
          <div className="pf-dots" aria-hidden="true" />
          <div className="pf-beams" aria-hidden="true">
            <span />
            <span />
          </div>
          <div className="pf-floaters" aria-hidden="true">
            <Clapperboard />
            <Popcorn />
            <Film />
            <Ticket />
            <Star />
          </div>
          <div className="pf-hero-fade" aria-hidden="true" />
          <Corners />

          <div className="px-1 pt-1">
            <Bulbs count={18} />
          </div>

          <div className="mt-3 flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2.5">
              <span className="pf-logo">M</span>
              <span className="truncate text-[10px] font-semibold uppercase tracking-[.3em] text-white/60">
                MVBD • Member
              </span>
            </div>

            <button
              onClick={() => void signOut()}
              className="pf-btn-glass shrink-0 px-3.5 py-2 text-xs"
            >
              <LogOut className="size-3.5" />
              Sign out
            </button>
          </div>

          <div className="pf-avatar-wrap">
            <span className="pf-ring r3" aria-hidden="true" />
            <span className="pf-ring r2" aria-hidden="true" />
            <span className="pf-ring r1" aria-hidden="true" />
            <span className="pf-orbit" aria-hidden="true" />

            <div className="pf-avatar">
              <div className="pf-avatar-in">
                {photo ? (
                  <img
                    src={photo}
                    alt="Your profile"
                    className="size-full object-cover"
                  />
                ) : (
                  <span className="pf-disp pf-grad-text text-4xl font-bold">
                    {initials}
                  </span>
                )}
              </div>
            </div>

            {isPremium && (
              <span className="pf-crown">
                <Crown className="size-5" />
              </span>
            )}
          </div>

          <p className="pf-welcome">
            Welcome back,
          </p>

          <p className="pf-name">
            {profile?.name ||
              user.displayName ||
              "MVBD member"}
          </p>

          <div className="pf-flourish">
            <i />
            <b />
            <i />
          </div>

          <p className="mt-3 break-words px-2 text-sm text-zinc-300 [overflow-wrap:anywhere]">
            {user.email}
          </p>

          <div className="mt-5">
            <div className="pf-glass pf-pill">
              <span
                className={`size-2 shrink-0 rounded-full ${
                  isPremium
                    ? "bg-[#B7FF00] shadow-[0_0_12px_#20E000]"
                    : "bg-zinc-400"
                }`}
              />

              {isPremium ? (
                <>
                  <Crown className="size-4 shrink-0 text-[#B7FF00]" />
                  Premium Membership
                </>
              ) : (
                "Normal User"
              )}
            </div>
          </div>

          {/* MEMBERSHIP TICKET */}
          <div className="pf-glass pf-tint pf-sheen pf-pass">
            <div className="pf-pass-main">
              <div className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-2.5">
                  <span className="pf-logo">M</span>
                  <div className="min-w-0">
                    <p className="pf-mini">Plan</p>
                    <p className="pf-disp truncate text-sm font-semibold">
                      {accountType}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col items-end">
                  <span className="pf-admit">Admit One</span>
                  <span className="pf-chipgfx mt-1" aria-hidden="true" />
                </div>
              </div>

              <div className="mt-5">
                <p className="pf-mini">Member ID</p>
                <p className="pf-mono mt-1">
                  {profile?.mvbdId || "Pending"}
                </p>
              </div>
            </div>

            <div className="pf-pass-stub">
              <span className="pf-perf" aria-hidden="true" />

              {expiry ? (
                <>
                  <p className="pf-mini">Valid time</p>

                  {remaining.expired ? (
                    <>
                      <p className="pf-days mt-1.5 text-red-300">
                        Expired
                      </p>

                      <p className="mt-1 text-[11px] text-red-300/70">
                        Your access validity has ended
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="pf-days pf-tabular mt-1">
                        <span
                          className={
                            days > 3 ? "pf-grad-text" : daysTone
                          }
                        >
                          {days}
                        </span>
                        <small>DAYS</small>
                      </p>

                      <div
                        className="mt-3 grid grid-cols-3 gap-2"
                        aria-label={countdownText}
                      >
                        {[
                          [remaining.hours, "Hours"],
                          [remaining.minutes, "Mins"],
                          [remaining.seconds, "Secs"],
                        ].map(([value, unit]) => (
                          <div key={unit as string} className="pf-tc">
                            <b className={`pf-tabular ${daysTone}`}>
                              {String(value).padStart(2, "0")}
                            </b>
                            <small>{unit}</small>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </>
              ) : (
                <>
                  <p className="pf-mini">Now showing</p>
                  <p className="pf-script mt-1 text-3xl text-[#f6e7a8]">
                    Unlock the full show
                  </p>
                  <div className="pf-barcode mt-4" aria-hidden="true" />
                </>
              )}
            </div>

            <Corners />
          </div>

          <div className="mt-6 px-1">
            <Bulbs count={18} />
          </div>
        </section>

        <CineDivider text="Lights, Camera, Premium" />

        {/* ACCOUNT DETAILS + ACCESS */}
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,.8fr)]">

          <section className="pf-glass pf-rise pf-d1 pf-card-pad p-5 sm:p-7">
            <Corners />
            <Clapperboard className="pf-wm" aria-hidden="true" />

            <div className="relative z-[1] flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <p className="pf-label">
                  <span className="pf-num">01</span>
                  Account details
                </p>

                <p className="pf-sub">Your story</p>

                <h2 className="pf-h2">
                  Personal information
                </h2>
              </div>

              <button
                onClick={() =>
                  setIsEditing((value) => !value)
                }
                className="pf-btn-glass size-10 shrink-0"
                aria-label="Edit profile"
              >
                <Edit3 className="size-4" />
              </button>
            </div>

            <div className="relative z-[1] mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">

              <label className="pf-field">
                <span className="pf-fi">
                  <UserRound className="size-[18px]" />
                </span>

                <div className="pf-fbody">
                  <span>Full name</span>

                  {isEditing ? (
                    <input
                      value={name}
                      onChange={(event) =>
                        setName(event.target.value)
                      }
                    />
                  ) : (
                    <strong>
                      {profile?.name || "Not set"}
                    </strong>
                  )}
                </div>
              </label>

              <label className="pf-field">
                <span className="pf-fi">
                  <Mail className="size-[18px]" />
                </span>

                <div className="pf-fbody">
                  <span>Email</span>

                  <strong>
                    {user.email || "Not set"}
                  </strong>
                </div>
              </label>

              <label className="pf-field">
                <span className="pf-fi">
                  <CalendarDays className="size-[18px]" />
                </span>

                <div className="pf-fbody">
                  <span>Date of birth</span>

                  {isEditing ? (
                    <input
                      type="date"
                      value={dateOfBirth}
                      onChange={(event) =>
                        setDateOfBirth(event.target.value)
                      }
                    />
                  ) : (
                    <strong>
                      {profile?.dateOfBirth || "Not set"}
                    </strong>
                  )}
                </div>
              </label>

              <div className="pf-field">
                <span className="pf-fi">
                  <ShieldCheck className="size-[18px]" />
                </span>

                <div className="pf-fbody">
                  <span>Member ID</span>

                  <strong>
                    {profile?.mvbdId || "Pending"}
                  </strong>
                </div>
              </div>
            </div>

            {isEditing && (
              <button
                disabled={saving}
                onClick={() => void saveProfile()}
                className="pf-btn relative z-[1] mt-5 px-6 py-2.5 text-sm"
              >
                {saving && (
                  <Loader2 className="size-4 animate-spin" />
                )}

                Save changes
              </button>
            )}
          </section>

          <section className="pf-glass pf-rise pf-d2 pf-card-pad p-5 sm:p-7">
            <Corners />
            <Film className="pf-wm" aria-hidden="true" />

            <div className="relative z-[1]">
              <p className="pf-label">
                <span className="pf-num">02</span>
                Access
              </p>

              <p className="pf-sub">Backstage pass</p>

              <h2 className="pf-h2">
                Account status
              </h2>

              <div className="mt-6 space-y-4">

                <div className="flex items-center justify-between gap-3 border-b border-white/10 pb-4">
                  <span className="text-zinc-400">
                    Status
                  </span>

                  <span className="pf-glass pf-pill !rounded-full !px-3.5 !py-1 text-xs font-semibold">
                    <span
                      className={`size-1.5 shrink-0 rounded-full ${
                        status === "Active"
                          ? "bg-[#B7FF00] shadow-[0_0_8px_#20E000]"
                          : status === "Pending"
                            ? "bg-amber-300"
                            : "bg-rose-400"
                      }`}
                    />
                    {status}
                  </span>
                </div>

                {profile?.subscriptionStatus === "expired" && (
                  <p className="rounded-2xl border border-amber-300/25 bg-amber-300/[.09] p-3 text-sm leading-6 text-amber-100 shadow-[inset_0_1px_0_rgba(255,255,255,.15)]">
                    Your membership has expired. Subscribe again to continue watching premium movies.
                  </p>
                )}

                <div className="flex items-center justify-between gap-3">
                  <span className="text-zinc-400">
                    Type
                  </span>

                  <span className="font-semibold">
                    {accountType}
                  </span>
                </div>

                <button
                  onClick={() => setShowSubscriptions(true)}
                  className="pf-btn mt-2 w-full px-4 py-3 text-sm"
                >
                  <Crown className="size-4" />
                  Manage premium access
                </button>
              </div>
            </div>
          </section>
        </div>

        <CineDivider text="Share the magic" />

        {/* REFERRAL + ACTIONS */}
        <section className="grid gap-5 md:grid-cols-2">

          <div className="pf-glass pf-tint pf-rise pf-d3 pf-card-pad p-5 sm:p-7">
            <Corners />
            <Ticket className="pf-wm" aria-hidden="true" />

            <div className="relative z-[1]">
              <p className="pf-label">
                <span className="pf-num">03</span>
                Invite friends
              </p>

              <p className="pf-sub">The golden ticket</p>

              <h2 className="pf-h2">
                Your promo code
              </h2>

              <p className="mt-2 text-sm leading-6 text-zinc-300">
                Share your code with friends and grow the MVBD community.
              </p>

              <div className="pf-code mt-5">
                <code>{referralCode}</code>

                <button
                  onClick={() => void copyCode()}
                  className="pf-btn shrink-0 px-3.5 py-2 text-xs"
                >
                  {copied ? (
                    <Check className="size-3.5" />
                  ) : (
                    <Clipboard className="size-3.5" />
                  )}

                  {copied ? "Copied" : "Copy code"}
                </button>
              </div>

              <div className="mt-6 flex items-end justify-between gap-3">
                <p className="flex items-end gap-3 text-sm text-zinc-300">
                  <strong className="pf-bignum pf-tabular pf-grad-text">
                    {successfulReferrals}
                  </strong>
                  <span className="pb-1">
                    successful referrals
                  </span>
                </p>

                <div className="pf-stars pb-1.5" aria-hidden="true">
                  <Sparkles className="size-4" />
                  <Star className="size-4" />
                  <Sparkles className="size-4" />
                </div>
              </div>
            </div>
          </div>

          {/* ACTIONS */}
          <div className="pf-rise pf-d4 flex min-w-0 flex-col gap-3.5">

            <button
              onClick={() => void openNotifications()}
              className="pf-glass pf-action"
            >
              <span className="pf-icon">
                <Bell className="size-5" />
              </span>

              <span className="pf-atext">
                <strong>Notifications</strong>

                <small>
                  {unreadCount
                    ? `${unreadCount} unread update${
                        unreadCount === 1 ? "" : "s"
                      }`
                    : "You're all caught up"}
                </small>
              </span>

              {unreadCount > 0 && (
                <i className="pf-dot" />
              )}

              <ChevronRight className="size-4 shrink-0 text-white/40" />
            </button>

            <button
              onClick={() => setModal("support")}
              className="pf-glass pf-action"
            >
              <span className="pf-icon">
                <MessageCircle className="size-5" />
              </span>

              <span className="pf-atext">
                <strong>Support team</strong>

                <small>Chat with MVBD support</small>
              </span>

              <ChevronRight className="size-4 shrink-0 text-white/40" />
            </button>

            {onNavigate && (
              <button
                onClick={() => onNavigate("settings")}
                className="pf-glass pf-action"
              >
                <span className="pf-icon">
                  <CircleHelp className="size-5" />
                </span>

                <span className="pf-atext">
                  <strong>More settings</strong>

                  <small>Manage your experience</small>
                </span>

                <ChevronRight className="size-4 shrink-0 text-white/40" />
              </button>
            )}

            <p className="pf-script mt-2 text-center text-3xl text-[#f6e7a8]/80">
              Enjoy the show
            </p>
            <FilmStrip />
          </div>
        </section>
      </div>

      {/* SUBSCRIPTION PANEL */}
      <SubscriptionPanel
        open={showSubscriptions}
        onOpenChange={setShowSubscriptions}
      />

      {/* NOTIFICATION / SUPPORT PORTAL MODAL */}
      {mounted && modal
        ? createPortal(
            <div
              className="pf-root pf-modal-backdrop"
              onMouseDown={(event) => {
                if (event.currentTarget === event.target) {
                  setModal(null)
                }
              }}
            >
              <section className="pf-glass pf-modal-card">
                <Corners />

                <div className="flex items-center justify-between gap-3 border-b border-white/10 p-5 pt-7">
                  <div className="min-w-0">
                    <p className="pf-label">
                      MVBD
                    </p>

                    <p className="pf-sub">
                      {modal === "notifications"
                        ? "What's new"
                        : "We're here for you"}
                    </p>

                    <h2 className="pf-disp text-lg font-semibold">
                      {modal === "notifications"
                        ? "Notifications"
                        : "Support team"}
                    </h2>
                  </div>

                  <button
                    onClick={() => setModal(null)}
                    className="pf-btn-glass size-9 shrink-0"
                    aria-label="Close"
                  >
                    <X className="size-4" />
                  </button>
                </div>

                {modal === "notifications" ? (
                  <div className="overflow-visible p-4">

                    {notifications.length === 0 ? (
                      <p className="p-8 text-center text-sm text-zinc-400">
                        No notifications yet.
                      </p>
                    ) : (
                      notifications.map((item) => (
                        <article
                          key={item.notificationId}
                          className="border-b border-white/10 p-4 last:border-0"
                        >
                          <div className="flex gap-3">

                            <span className="pf-icon pf-icon-sm">
                              <Bell className="size-4" />
                            </span>

                            <div className="min-w-0">
                              <p className="text-sm text-zinc-100 [overflow-wrap:anywhere]">
                                {item.message}
                              </p>

                              <p className="mt-1 text-xs text-zinc-400">
                                {formatTime(item.createdAt)}
                              </p>
                            </div>
                          </div>
                        </article>
                      ))
                    )}
                  </div>
                ) : (
                  <>
                    <div className="flex flex-col gap-3 overflow-visible p-4">

                      {messages.length === 0 ? (
                        <p className="py-8 text-center text-sm text-zinc-400">
                          Start a conversation with support.
                        </p>
                      ) : (
                        messages.map((item) => (
                          <div
                            key={item.id}
                            className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm ${
                              item.senderUid === user.uid
                                ? "pf-bubble-me ml-auto"
                                : "pf-bubble-them"
                            }`}
                          >
                            <p>{item.message}</p>

                            <p
                              className={`mt-1 text-[10px] ${
                                item.senderUid === user.uid
                                  ? "text-[#2c4a12]"
                                  : "text-zinc-400"
                              }`}
                            >
                              {formatTime(item.createdAt)}
                            </p>
                          </div>
                        ))
                      )}
                    </div>

                    <div className="flex gap-2 border-t border-white/10 p-4">

                      <input
                        value={message}
                        onChange={(event) =>
                          setMessage(event.target.value)
                        }
                        onKeyDown={(event) => {
                          if (
                            event.key === "Enter" &&
                            !event.nativeEvent.isComposing &&
                            event.keyCode !== 229
                          ) {
                            void submitMessage()
                          }
                        }}
                        placeholder="Write a message..."
                        className="min-w-0 flex-1 rounded-full border border-white/15 bg-white/[.07] px-5 text-base text-white shadow-[inset_0_1px_0_rgba(255,255,255,.15)] outline-none placeholder:text-zinc-500 focus:border-[#B7FF00]/70 focus:shadow-[0_0_0_3px_rgba(32,224,0,.2)]"
                      />

                      <button
                        onClick={() => void submitMessage()}
                        disabled={sending || !message.trim()}
                        className="pf-btn size-11 shrink-0"
                        aria-label="Send message"
                      >
                        {sending ? (
                          <Loader2 className="size-4 animate-spin" />
                        ) : (
                          <Send className="size-4" />
                        )}
                      </button>
                    </div>
                  </>
                )}
              </section>
            </div>,
            document.body,
          )
        : null}
    </main>
  )
      }
