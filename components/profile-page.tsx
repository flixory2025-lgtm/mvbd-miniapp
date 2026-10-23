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
  Clipboard,
  Crown,
  Edit3,
  Loader2,
  LogIn,
  LogOut,
  Mail,
  MessageCircle,
  Send,
  ShieldCheck,
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
 * আপনার পছন্দের "A · Green Orb" ভার্সন।
 * শুধু CSS দিয়ে তৈরি, কোনো লাইব্রেরি লাগবে না।
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

const PROFILE_CSS = String.raw`
@import url("https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Inter:wght@400;500;600;700&display=swap");

.pf-root{position:relative;isolation:isolate;overflow:hidden;background:#030303;color:#fff;font-family:Inter,system-ui,-apple-system,"Segoe UI",sans-serif}
.pf-root::before{content:"";position:absolute;inset:0;z-index:-2;pointer-events:none;
  background:
   radial-gradient(60% 38% at 50% -4%,rgba(229,9,20,.30),transparent 70%),
   radial-gradient(42% 30% at 100% 58%,rgba(150,0,20,.20),transparent 70%),
   radial-gradient(40% 28% at 0% 88%,rgba(229,9,20,.15),transparent 70%)}
.pf-root::after{content:"";position:absolute;inset:0;z-index:-1;pointer-events:none;opacity:.07;mix-blend-mode:overlay;
  background:url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.8' numOctaves='2'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>")}

.pf-display{font-family:"Bebas Neue",Impact,sans-serif;letter-spacing:.05em}

/* ---------- LIQUID GLASS ---------- */
.pf-glass{position:relative;overflow:hidden;border-radius:1.7rem;
  background:linear-gradient(140deg,rgba(255,255,255,.12) 0%,rgba(255,255,255,.04) 38%,rgba(255,255,255,.02) 62%,rgba(255,255,255,.08) 100%);
  -webkit-backdrop-filter:blur(26px) saturate(175%);backdrop-filter:blur(26px) saturate(175%);
  border:1px solid rgba(255,255,255,.16);
  box-shadow:inset 0 1.5px 0 rgba(255,255,255,.42),inset 0 -1px 0 rgba(255,255,255,.07),inset 1px 0 0 rgba(255,255,255,.12),inset -1px 0 0 rgba(255,255,255,.05),0 26px 60px -22px rgba(0,0,0,.85),0 0 0 1px rgba(0,0,0,.45)}
.pf-glass::before{content:"";position:absolute;inset:0;pointer-events:none;z-index:0;
  background:radial-gradient(120% 55% at 88% -12%,rgba(255,255,255,.24),transparent 55%),radial-gradient(80% 50% at 8% 112%,rgba(229,9,20,.20),transparent 60%)}
.pf-glass::after{content:"";position:absolute;top:-60%;left:0;width:34%;height:220%;pointer-events:none;z-index:0;
  background:linear-gradient(100deg,transparent,rgba(255,255,255,.13),transparent);
  transform:translateX(-260%) rotate(14deg);animation:pfSheen 10s ease-in-out infinite}
.pf-glass>*{position:relative;z-index:1}
@keyframes pfSheen{0%,55%{transform:translateX(-260%) rotate(14deg)}100%{transform:translateX(420%) rotate(14deg)}}

.pf-red{border-color:rgba(255,70,85,.38);
  background:linear-gradient(140deg,rgba(229,9,20,.30),rgba(229,9,20,.07) 45%,rgba(229,9,20,.15));
  box-shadow:inset 0 1.5px 0 rgba(255,180,185,.4),inset 0 -1px 0 rgba(255,255,255,.06),0 26px 60px -22px rgba(0,0,0,.85),0 0 70px -14px rgba(229,9,20,.5)}

/* ---------- small pieces ---------- */
.pf-label{display:flex;align-items:center;gap:.6rem;font-size:10.5px;letter-spacing:.28em;text-transform:uppercase;color:rgba(255,255,255,.6)}
.pf-label::before{content:"";width:3px;height:15px;border-radius:2px;background:#e50914;box-shadow:0 0 12px #e50914}
.pf-num{font-family:"Bebas Neue",Impact,sans-serif;letter-spacing:.08em;color:#ff3342;font-size:15px}
.pf-h2{margin-top:.55rem;font-size:1.3rem;font-weight:600;letter-spacing:-.01em}

.pf-btn-red{display:inline-flex;align-items:center;justify-content:center;gap:.5rem;border-radius:999px;color:#fff;font-weight:600;
  background:linear-gradient(180deg,#ff3a47,#cf0916);
  box-shadow:inset 0 1px 0 rgba(255,255,255,.5),inset 0 -2px 6px rgba(0,0,0,.25),0 10px 28px -8px rgba(229,9,20,.8);
  transition:transform .2s,box-shadow .2s,filter .2s}
.pf-btn-red:hover{transform:translateY(-1px);filter:brightness(1.08)}
.pf-btn-red:active{transform:scale(.97)}
.pf-btn-red:disabled{opacity:.55}
.pf-btn-glass{display:inline-flex;align-items:center;justify-content:center;gap:.45rem;border-radius:999px;color:rgba(255,255,255,.85);
  background:linear-gradient(140deg,rgba(255,255,255,.14),rgba(255,255,255,.04));
  -webkit-backdrop-filter:blur(18px) saturate(170%);backdrop-filter:blur(18px) saturate(170%);
  border:1px solid rgba(255,255,255,.18);box-shadow:inset 0 1px 0 rgba(255,255,255,.4),0 8px 22px -10px rgba(0,0,0,.8);
  transition:background .2s,transform .2s}
.pf-btn-glass:hover{background:linear-gradient(140deg,rgba(255,255,255,.22),rgba(255,255,255,.07))}
.pf-btn-glass:active{transform:scale(.96)}

.pf-icon{display:grid;place-items:center;flex-shrink:0;width:2.7rem;height:2.7rem;border-radius:50%;color:#fff;
  background:radial-gradient(circle at 30% 22%,rgba(255,140,150,.95),#e50914 58%,#7a050c);
  box-shadow:inset 0 1px 1px rgba(255,255,255,.65),inset 0 -3px 8px rgba(0,0,0,.3),0 8px 22px -4px rgba(229,9,20,.65)}

.pf-field{position:relative;display:flex;flex-direction:column;gap:.3rem;min-width:0;border-radius:1.15rem;padding:.9rem 2.6rem .9rem 1rem;
  background:rgba(255,255,255,.045);border:1px solid rgba(255,255,255,.10);
  box-shadow:inset 0 1px 0 rgba(255,255,255,.14),inset 0 -1px 0 rgba(0,0,0,.3)}
.pf-field>span{font-size:10px;letter-spacing:.24em;text-transform:uppercase;color:rgba(255,255,255,.5)}
.pf-field>strong{font-size:15px;font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.pf-field input{width:100%;min-width:0;border-radius:.65rem;padding:.5rem .65rem;color:#fff;font-size:14px;outline:none;color-scheme:dark;
  background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.14);transition:border-color .2s,box-shadow .2s}
.pf-field input:focus{border-color:rgba(255,60,75,.8);box-shadow:0 0 0 3px rgba(229,9,20,.22)}
.pf-field-icon{position:absolute;right:1rem;top:50%;transform:translateY(-50%);width:1.1rem;height:1.1rem;color:rgba(255,255,255,.3)}

.pf-action{display:flex;align-items:center;gap:.9rem;width:100%;text-align:left;border-radius:999px;padding:.75rem 1.1rem .75rem .75rem;transition:transform .25s,border-color .25s,box-shadow .25s}
.pf-action:hover{transform:translateY(-2px);border-color:rgba(255,70,85,.5)}
.pf-action:active{transform:scale(.985)}
.pf-action strong{display:block;font-size:15px;font-weight:600}
.pf-action small{display:block;margin-top:1px;font-size:12px;color:rgba(255,255,255,.5)}
.pf-dot{width:.6rem;height:.6rem;border-radius:50%;background:#ff2d3d;box-shadow:0 0 12px #ff2d3d;animation:pfPing 1.6s ease-in-out infinite}
@keyframes pfPing{50%{transform:scale(1.5);opacity:.6}}

/* ---------- HERO ---------- */
.pf-hero{position:relative;isolation:isolate;overflow:hidden;border-radius:2rem;border:1px solid rgba(255,255,255,.09);background:#040404;
  box-shadow:0 30px 80px -30px rgba(229,9,20,.45)}
.pf-storm{position:absolute;inset:0;z-index:-2;overflow:hidden}
.pf-storm span{position:absolute;border-radius:50%;filter:blur(46px);mix-blend-mode:screen}
.pf-storm span:nth-child(1){width:90%;height:55%;left:-15%;top:-12%;background:radial-gradient(circle,#ff1d1d,#7d0000 60%,transparent 72%);animation:pfDrift1 14s ease-in-out infinite alternate}
.pf-storm span:nth-child(2){width:70%;height:48%;right:-18%;top:-6%;background:radial-gradient(circle,#ff5a1f,#9a1200 60%,transparent 72%);opacity:.8;animation:pfDrift2 17s ease-in-out infinite alternate}
.pf-storm span:nth-child(3){width:60%;height:40%;left:20%;top:12%;background:radial-gradient(circle,#c4000f,#3b0006 62%,transparent 74%);opacity:.9;animation:pfDrift3 12s ease-in-out infinite alternate}
.pf-flash{position:absolute;inset:0;opacity:0;background:radial-gradient(40% 30% at 55% 8%,rgba(255,200,200,.7),transparent 70%);animation:pfFlash 8s infinite}
.pf-hero-fade{position:absolute;inset:0;z-index:-1;pointer-events:none;
  background:linear-gradient(180deg,rgba(0,0,0,.15) 0%,rgba(0,0,0,.35) 38%,rgba(3,3,3,.92) 78%,#030303 100%)}
@keyframes pfDrift1{to{transform:translate(12%,10%) scale(1.15)}}
@keyframes pfDrift2{to{transform:translate(-14%,12%) scale(1.1)}}
@keyframes pfDrift3{to{transform:translate(8%,-8%) scale(1.2)}}
@keyframes pfFlash{0%,90%,100%{opacity:0}91%{opacity:.85}92%{opacity:.1}93.5%{opacity:.6}95%{opacity:0}}

.pf-avatar{position:relative;display:grid;place-items:center;width:9rem;height:9rem;border-radius:50%;margin:0 auto}
.pf-avatar::before{content:"";position:absolute;inset:-6px;border-radius:50%;
  background:conic-gradient(from 0deg,#ff2d3d,rgba(255,255,255,.0) 25%,#ff7a1f 50%,rgba(255,255,255,0) 75%,#ff2d3d);
  filter:blur(1px);animation:pfSpin 9s linear infinite;
  -webkit-mask:radial-gradient(farthest-side,transparent calc(100% - 3px),#000 calc(100% - 2px));mask:radial-gradient(farthest-side,transparent calc(100% - 3px),#000 calc(100% - 2px))}
.pf-avatar::after{content:"";position:absolute;inset:-14px;border-radius:50%;pointer-events:none;box-shadow:0 0 80px 6px rgba(229,9,20,.42)}
@keyframes pfSpin{to{transform:rotate(360deg)}}
.pf-avatar-in{position:relative;z-index:1;display:grid;place-items:center;width:100%;height:100%;border-radius:50%;overflow:hidden;
  background:linear-gradient(140deg,rgba(255,255,255,.18),rgba(255,255,255,.04));border:1px solid rgba(255,255,255,.3);
  -webkit-backdrop-filter:blur(16px);backdrop-filter:blur(16px);
  box-shadow:inset 0 2px 0 rgba(255,255,255,.5),inset 0 -8px 22px rgba(229,9,20,.25)}
.pf-crown{position:absolute;z-index:2;right:-.35rem;top:-.55rem;display:grid;place-items:center;width:2.4rem;height:2.4rem;border-radius:.85rem;transform:rotate(12deg);color:#fff;
  background:linear-gradient(160deg,#ff4452,#b80812);box-shadow:inset 0 1px 0 rgba(255,255,255,.6),0 8px 22px rgba(229,9,20,.7)}

.pf-title{font-family:"Bebas Neue",Impact,sans-serif;text-transform:uppercase;font-size:clamp(34px,9vw,68px);line-height:.98;letter-spacing:.07em;
  color:transparent;-webkit-text-stroke:1.4px #ff3342;overflow-wrap:anywhere;
  text-shadow:0 0 22px rgba(229,9,20,.8),0 0 64px rgba(229,9,20,.5)}
.pf-rule{height:1px;width:min(15rem,60%);margin:0 auto;background:linear-gradient(90deg,transparent,#ff3342,transparent);box-shadow:0 0 12px #e50914}

.pf-member-pill{display:inline-flex;align-items:center;gap:.55rem;border-radius:999px;padding:.55rem 1.1rem;font-size:13.5px;font-weight:500;border-radius:999px}

.pf-days{font-family:"Bebas Neue",Impact,sans-serif;font-size:4.6rem;line-height:1;letter-spacing:.03em;text-shadow:0 0 34px currentColor}
.pf-timechip{border-radius:1.1rem;padding:.55rem .3rem;text-align:center}
.pf-timechip b{display:block;font-family:"Bebas Neue",Impact,sans-serif;font-size:1.85rem;line-height:1;font-weight:400;letter-spacing:.04em}
.pf-timechip small{display:block;margin-top:2px;font-size:9px;letter-spacing:.22em;text-transform:uppercase;color:rgba(255,255,255,.5)}

/* ---------- referral ---------- */
.pf-code{display:flex;align-items:center;justify-content:space-between;gap:.75rem;border-radius:1.1rem;padding:.7rem .75rem .7rem 1rem;
  background:rgba(0,0,0,.35);border:1px solid rgba(255,90,100,.32);box-shadow:inset 0 1px 0 rgba(255,255,255,.1)}
.pf-bignum{font-family:"Bebas Neue",Impact,sans-serif;font-size:3rem;line-height:1;letter-spacing:.04em;text-shadow:0 0 28px rgba(229,9,20,.8)}

/* ---------- modal ---------- */
.pf-modal-backdrop{position:fixed;inset:0;z-index:9999;display:flex;align-items:center;justify-content:center;padding:1rem;
  background:radial-gradient(60% 50% at 50% 28%,rgba(229,9,20,.28),rgba(0,0,0,.82)),rgba(0,0,0,.7);
  -webkit-backdrop-filter:blur(14px);backdrop-filter:blur(14px)}
.pf-glass.pf-modal-card{width:100%;max-width:34rem;max-height:90vh;overflow-y:auto;color:#fff;
  background:linear-gradient(140deg,rgba(52,52,58,.70),rgba(12,12,14,.86))}
.pf-bubble-me{background:linear-gradient(160deg,#ff3a47,#c40914);color:#fff;box-shadow:inset 0 1px 0 rgba(255,255,255,.45),0 8px 20px -8px rgba(229,9,20,.7)}
.pf-bubble-them{background:linear-gradient(140deg,rgba(255,255,255,.14),rgba(255,255,255,.05));border:1px solid rgba(255,255,255,.14);
  box-shadow:inset 0 1px 0 rgba(255,255,255,.25);color:#e5e5e8}

@media (prefers-reduced-motion:reduce){
  .pf-glass::after,.pf-storm span,.pf-flash,.pf-avatar::before,.pf-dot{animation:none!important}
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
          : "text-emerald-300"

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
        {/* 👇 Green Orb Loader + "Loading profile page" */}
        <GreenOrbLoader />
      </main>
    )
  }

  if (!user) {
    return (
      <main className="pf-root flex min-h-[60vh] items-center justify-center px-4">
        <ProfileStyles />

        <section className="pf-glass pf-red w-full max-w-md p-8 text-center">
          <div className="pf-icon mx-auto mb-5 !size-16">
            <UserRound className="size-7" />
          </div>

          <h1 className="pf-title !text-[40px]">
            Your MVBD account
          </h1>

          <p className="mt-3 text-sm leading-6 text-zinc-300">
            Sign in to manage your membership,
            referrals, notifications, and support.
          </p>

          <button
            onClick={() => setShowAuthModal(true)}
            className="pf-btn-red mt-7 px-6 py-3 text-sm"
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

      <div className="mx-auto max-w-6xl">

        {/* PROFILE HERO */}
        <section className="pf-hero px-5 pb-10 pt-5 text-center sm:px-10">
          <div className="pf-storm" aria-hidden="true">
            <span />
            <span />
            <span />
            <i className="pf-flash" />
          </div>
          <div className="pf-hero-fade" aria-hidden="true" />

          <div className="relative z-10 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="grid size-8 place-items-center rounded-md bg-[#e50914] text-lg leading-none text-white shadow-[0_0_20px_rgba(229,9,20,.7)] pf-display">
                M
              </span>
              <span className="text-[10px] uppercase tracking-[.3em] text-white/60">
                MVBD • Member
              </span>
            </div>

            <button
              onClick={() => void signOut()}
              className="pf-btn-glass px-3.5 py-2 text-xs"
            >
              <LogOut className="size-3.5" />
              Sign out
            </button>
          </div>

          <div className="relative z-10 mt-8">
            <div className="pf-avatar">
              <div className="pf-avatar-in">
                {photo ? (
                  <img
                    src={photo}
                    alt="Your profile"
                    className="size-full object-cover"
                  />
                ) : (
                  <span className="pf-display text-5xl text-white">
                    {initials}
                  </span>
                )}
              </div>

              {isPremium && (
                <span className="pf-crown">
                  <Crown className="size-5" />
                </span>
              )}
            </div>
          </div>

          <p className="pf-title relative z-10 mt-7">
            {profile?.name ||
              user.displayName ||
              "MVBD member"}
          </p>

          <div className="pf-rule relative z-10 mt-4" />

          <p className="relative z-10 mt-4 break-all text-sm text-zinc-300">
            {user.email}
          </p>

          <div className="relative z-10 mt-5">
            <div className="pf-glass pf-member-pill">
              <span
                className={`size-2 rounded-full ${
                  isPremium
                    ? "bg-[#ff3342] shadow-[0_0_12px_#ff3342]"
                    : "bg-zinc-400"
                }`}
              />

              {isPremium ? (
                <>
                  <Crown className="size-4 text-[#ff5560]" />
                  Premium Membership
                </>
              ) : (
                "Normal User"
              )}
            </div>
          </div>

          {expiry && (
            <div className="relative z-10 mx-auto mt-9 max-w-sm">
              <p className="pf-label justify-center">
                Valid time
              </p>

              {remaining.expired ? (
                <>
                  <p className="pf-days mt-3 text-red-300">
                    Expired
                  </p>

                  <p className="mt-2 text-[11px] text-red-300/70">
                    Your access validity has ended
                  </p>
                </>
              ) : (
                <>
                  <p className={`pf-days mt-3 ${daysTone}`}>
                    {days}{" "}
                    <span className="text-lg font-normal tracking-[.2em] text-zinc-400">
                      DAYS
                    </span>
                  </p>

                  <div
                    className="mx-auto mt-4 grid max-w-[18rem] grid-cols-3 gap-2.5"
                    aria-label={countdownText}
                  >
                    {[
                      [remaining.hours, "Hours"],
                      [remaining.minutes, "Mins"],
                      [remaining.seconds, "Secs"],
                    ].map(([value, unit]) => (
                      <div
                        key={unit as string}
                        className="pf-glass pf-timechip"
                      >
                        <b className={daysTone}>
                          {String(value).padStart(2, "0")}
                        </b>
                        <small>{unit}</small>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </section>

        {/* ACCOUNT DETAILS + ACCESS */}
        <div className="mt-6 grid gap-5 lg:grid-cols-[1.4fr_.8fr]">

          <section className="pf-glass p-5 sm:p-7">
            <div className="flex items-start justify-between">
              <div>
                <p className="pf-label">
                  <span className="pf-num">01</span>
                  Account details
                </p>

                <h2 className="pf-h2">
                  Personal information
                </h2>
              </div>

              <button
                onClick={() =>
                  setIsEditing((value) => !value)
                }
                className="pf-btn-glass size-10"
                aria-label="Edit profile"
              >
                <Edit3 className="size-4" />
              </button>
            </div>

            <div className="mt-6 grid gap-3.5 sm:grid-cols-2">

              <label className="pf-field">
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
              </label>

              <label className="pf-field">
                <span>Email</span>

                <strong>
                  {user.email || "Not set"}
                </strong>

                <Mail className="pf-field-icon" />
              </label>

              <label className="pf-field">
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

                <CalendarDays className="pf-field-icon" />
              </label>

              <div className="pf-field">
                <span>Member ID</span>

                <strong>
                  {profile?.mvbdId || "Pending"}
                </strong>

                <ShieldCheck className="pf-field-icon" />
              </div>
            </div>

            {isEditing && (
              <button
                disabled={saving}
                onClick={() => void saveProfile()}
                className="pf-btn-red mt-5 px-6 py-2.5 text-sm"
              >
                {saving && (
                  <Loader2 className="size-4 animate-spin" />
                )}

                Save changes
              </button>
            )}
          </section>

          <section className="pf-glass p-5 sm:p-7">
            <p className="pf-label">
              <span className="pf-num">02</span>
              Access
            </p>

            <h2 className="pf-h2">
              Account status
            </h2>

            <div className="mt-6 space-y-4">

              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <span className="text-zinc-400">
                  Status
                </span>

                <span className="pf-glass !rounded-full px-3.5 py-1 text-xs font-medium text-white">
                  <span
                    className={`mr-1.5 inline-block size-1.5 rounded-full align-middle ${
                      status === "Active"
                        ? "bg-emerald-400 shadow-[0_0_8px_#34d399]"
                        : status === "Pending"
                          ? "bg-amber-300"
                          : "bg-[#ff3342]"
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

              <div className="flex items-center justify-between">
                <span className="text-zinc-400">
                  Type
                </span>

                <span className="font-semibold">
                  {accountType}
                </span>
              </div>

              <button
                onClick={() => setShowSubscriptions(true)}
                className="pf-btn-red mt-2 w-full px-4 py-3 text-sm"
              >
                <Crown className="size-4" />
                Manage premium access
              </button>
            </div>
          </section>
        </div>

        {/* REFERRAL + ACTIONS */}
        <section className="mt-5 grid gap-5 md:grid-cols-2">

          <div className="pf-glass pf-red p-5 sm:p-7">

            <p className="pf-label">
              <span className="pf-num">03</span>
              Invite friends
            </p>

            <h2 className="pf-h2">
              Your promo code
            </h2>

            <p className="mt-2 text-sm leading-6 text-zinc-300">
              Share your code with friends and grow the MVBD community.
            </p>

            <div className="pf-code mt-5">
              <code className="min-w-0 truncate text-sm tracking-[.16em] text-white">
                {referralCode}
              </code>

              <button
                onClick={() => void copyCode()}
                className="pf-btn-red shrink-0 px-3.5 py-2 text-xs"
              >
                {copied ? (
                  <Check className="size-3.5" />
                ) : (
                  <Clipboard className="size-3.5" />
                )}

                {copied ? "Copied" : "Copy code"}
              </button>
            </div>

            <p className="mt-6 flex items-end gap-3 text-sm text-zinc-300">
              <strong className="pf-bignum text-white">
                {successfulReferrals}
              </strong>
              <span className="pb-1.5">
                successful referrals
              </span>
            </p>
          </div>

          {/* ACTIONS */}
          <div className="flex flex-col gap-3.5">

            <p className="pf-label md:hidden">
              <span className="pf-num">04</span>
              Quick actions
            </p>

            <button
              onClick={() => void openNotifications()}
              className="pf-glass pf-action"
            >
              <span className="pf-icon">
                <Bell className="size-5" />
              </span>

              <span>
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

              <ChevronRight className="ml-auto size-4 text-white/40" />
            </button>

            <button
              onClick={() => setModal("support")}
              className="pf-glass pf-action"
            >
              <span className="pf-icon">
                <MessageCircle className="size-5" />
              </span>

              <span>
                <strong>Support team</strong>

                <small>Chat with MVBD support</small>
              </span>

              <ChevronRight className="ml-auto size-4 text-white/40" />
            </button>

            {onNavigate && (
              <button
                onClick={() => onNavigate("settings")}
                className="pf-glass pf-action"
              >
                <span className="pf-icon">
                  <CircleHelp className="size-5" />
                </span>

                <span>
                  <strong>More settings</strong>

                  <small>Manage your experience</small>
                </span>

                <ChevronRight className="ml-auto size-4 text-white/40" />
              </button>
            )}
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
              className="pf-modal-backdrop"
              onMouseDown={(event) => {
                if (event.currentTarget === event.target) {
                  setModal(null)
                }
              }}
            >
              <ProfileStyles />

              <section className="pf-glass pf-red pf-modal-card">

                <div className="flex items-center justify-between border-b border-white/10 p-5">
                  <div>
                    <p className="pf-label">
                      MVBD
                    </p>

                    <h2 className="mt-1.5 text-xl font-semibold">
                      {modal === "notifications"
                        ? "Notifications"
                        : "Support team"}
                    </h2>
                  </div>

                  <button
                    onClick={() => setModal(null)}
                    className="pf-btn-glass size-9"
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

                            <span className="pf-icon !size-9">
                              <Bell className="size-4" />
                            </span>

                            <div>
                              <p className="text-sm text-zinc-100">
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
                                  ? "text-white/70"
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
                        className="min-w-0 flex-1 rounded-full border border-white/15 bg-white/[.07] px-5 text-sm text-white shadow-[inset_0_1px_0_rgba(255,255,255,.15)] outline-none placeholder:text-zinc-500 focus:border-[#ff3342]/70 focus:shadow-[0_0_0_3px_rgba(229,9,20,.22)]"
                      />

                      <button
                        onClick={() => void submitMessage()}
                        disabled={sending || !message.trim()}
                        className="pf-btn-red size-11 shrink-0 !rounded-full"
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
