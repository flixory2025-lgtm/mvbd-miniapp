"use client"

import { createPortal } from "react-dom"
import { useEffect, useState } from "react"
import { toast } from "sonner"
import {
  ArrowLeft,
  BadgeCheck,
  Bell,
  CalendarDays,
  Check,
  ChevronRight,
  Clipboard,
  Crown,
  Loader2,
  Lock,
  LogIn,
  LogOut,
  Mail,
  MessageCircle,
  Pencil,
  Send,
  Settings,
  ShieldCheck,
  Ticket,
  UserRound,
  Users,
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
 * PROFILE UI STYLES (compact dark-glass look)
 * Accent colour change korte chaile shudhu --ac
 * (ar --ac-rgb) bodlalei hobe.
 * =========================================
 */
const PROFILE_CSS = String.raw`
@import url("https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap");

.pf-root{
  --ac:#F2FF00;--ac-rgb:242,255,0;--ink:#12140a;
  position:relative;isolation:isolate;overflow:hidden;color:#fff;background:#0b0c0a;
  font-family:Inter,system-ui,-apple-system,"Segoe UI",sans-serif;
  -webkit-tap-highlight-color:transparent;-webkit-text-size-adjust:100%;text-size-adjust:100%}
.pf-root *,.pf-root *::before,.pf-root *::after{box-sizing:border-box}
.pf-root::before{content:"";position:absolute;inset:0;z-index:-1;pointer-events:none;
  background:
   radial-gradient(52% 30% at 100% 10%,rgba(var(--ac-rgb),.17),transparent 70%),
   radial-gradient(60% 32% at 0% 100%,rgba(var(--ac-rgb),.11),transparent 70%),
   linear-gradient(180deg,#1b1d18 0%,#10110e 45%,#0a0b09 100%)}
.pf-tabular{font-variant-numeric:tabular-nums;font-feature-settings:"tnum"}
.pf-wrap{width:100%;max-width:27rem;margin:0 auto}

@keyframes pfRise{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:none}}
.pf-rise{animation:pfRise .55s cubic-bezier(.2,.8,.2,1) both}
.pf-d1{animation-delay:.06s}.pf-d2{animation-delay:.12s}.pf-d3{animation-delay:.18s}

/* ---------- header ---------- */
.pf-head{display:grid;grid-template-columns:2.3rem 1fr 2.3rem;align-items:center;gap:.5rem}
.pf-head h1{margin:0;text-align:center;font-size:14px;font-weight:600;letter-spacing:.01em}
.pf-circle{display:grid;place-items:center;flex:none;width:2.3rem;height:2.3rem;border-radius:50%;color:rgba(255,255,255,.88);
  background:linear-gradient(145deg,rgba(255,255,255,.1),rgba(255,255,255,.03));
  border:1px solid rgba(255,255,255,.12);box-shadow:inset 0 1px 0 rgba(255,255,255,.12);
  transition:transform .2s ease,background .2s ease}
.pf-circle:active{transform:scale(.93)}
.pf-circle svg{width:15px;height:15px}
@media (hover:hover){.pf-circle:hover{background:linear-gradient(145deg,rgba(255,255,255,.16),rgba(255,255,255,.05))}}

/* ---------- user row ---------- */
.pf-user{display:flex;align-items:center;gap:.7rem;margin-top:1.15rem;min-width:0}
.pf-ava{position:relative;flex:none;width:2.7rem;height:2.7rem}
.pf-ava-in{display:grid;place-items:center;width:100%;height:100%;border-radius:50%;overflow:hidden;
  background:#1c1f17;border:1.5px solid rgba(var(--ac-rgb),.55);
  box-shadow:0 0 0 3px rgba(var(--ac-rgb),.08)}
.pf-ava-in img{width:100%;height:100%;object-fit:cover}
.pf-ava-in span{font-size:13px;font-weight:700;color:var(--ac)}
.pf-ava-crown{position:absolute;right:-.2rem;bottom:-.15rem;display:grid;place-items:center;width:1.05rem;height:1.05rem;border-radius:50%;
  background:var(--ac);color:var(--ink);box-shadow:0 0 0 2px #12130f}
.pf-ava-crown svg{width:9px;height:9px}
.pf-uinfo{min-width:0;flex:1}
.pf-uname{margin:0;font-size:13px;font-weight:600;line-height:1.25;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.pf-umail{margin:2px 0 0;font-size:10.5px;color:rgba(255,255,255,.5);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.pf-pencil{flex:none;display:grid;place-items:center;width:2rem;height:2rem;border-radius:50%;color:rgba(255,255,255,.7)}
.pf-pencil svg{width:14px;height:14px}
.pf-pencil.is-on{color:var(--ink);background:var(--ac)}

/* ---------- premium card ---------- */
.pf-prem{position:relative;overflow:hidden;margin-top:1rem;padding:.95rem 1rem 1rem;border-radius:1.15rem;
  background:
   radial-gradient(90% 120% at 100% 100%,rgba(var(--ac-rgb),.14),transparent 62%),
   linear-gradient(135deg,rgba(255,255,255,.075),rgba(255,255,255,.02));
  border:1px solid rgba(var(--ac-rgb),.14);
  box-shadow:inset 0 1px 0 rgba(255,255,255,.1),0 18px 36px -22px rgba(0,0,0,.9)}
.pf-prem-wm{position:absolute;right:.9rem;top:50%;width:3.9rem;height:3.9rem;transform:translateY(-50%) rotate(8deg);
  color:rgba(255,255,255,.3);filter:drop-shadow(0 0 14px rgba(var(--ac-rgb),.25));pointer-events:none}
.pf-prem-body{position:relative;z-index:1;max-width:72%}
.pf-prem-title{display:flex;align-items:center;gap:.4rem;margin:0;font-size:12px;font-weight:600}
.pf-prem-title svg{width:13px;height:13px;color:var(--ac)}
.pf-prem-desc{margin:.35rem 0 0;font-size:10px;line-height:1.5;color:rgba(255,255,255,.55)}
.pf-prem-warn{margin:.5rem 0 0;font-size:10px;line-height:1.5;color:#fcd98a}
.pf-btn{display:inline-flex;align-items:center;justify-content:center;gap:.4rem;border-radius:999px;font-weight:700;color:var(--ink);white-space:nowrap;
  background:var(--ac);box-shadow:inset 0 1px 0 rgba(255,255,255,.6),0 8px 20px -8px rgba(var(--ac-rgb),.7);
  transition:transform .2s ease,filter .2s ease}
.pf-btn:active{transform:scale(.96)}
.pf-btn:disabled{opacity:.5}
@media (hover:hover){.pf-btn:hover{filter:brightness(1.06)}}
.pf-btn-sm{padding:.42rem .95rem;font-size:10px}
.pf-btn-md{padding:.7rem 1.2rem;font-size:12px}
.pf-prem .pf-btn{margin-top:.75rem}

.pf-cd{position:relative;z-index:1;display:grid;grid-template-columns:repeat(4,1fr);gap:.4rem;margin-top:.7rem;max-width:15rem}
.pf-cd div{min-width:0;border-radius:.7rem;padding:.38rem .1rem .3rem;text-align:center;
  background:rgba(0,0,0,.28);border:1px solid rgba(255,255,255,.08)}
.pf-cd b{display:block;font-size:13px;font-weight:700;line-height:1.1}
.pf-cd small{display:block;margin-top:2px;font-size:8px;font-weight:600;letter-spacing:.14em;text-transform:uppercase;color:rgba(255,255,255,.45)}

/* ---------- sections + rows ---------- */
.pf-sec{margin:1.35rem 0 .6rem;font-size:13px;font-weight:700;letter-spacing:.005em}
.pf-list{display:flex;flex-direction:column;gap:.5rem}
.pf-row{display:flex;align-items:center;gap:.7rem;width:100%;min-width:0;min-height:2.85rem;padding:.3rem .85rem .3rem .38rem;
  border-radius:999px;text-align:left;font-size:12px;font-weight:500;color:rgba(255,255,255,.9);
  background:linear-gradient(145deg,rgba(255,255,255,.065),rgba(255,255,255,.025));
  border:1px solid rgba(255,255,255,.075);box-shadow:inset 0 1px 0 rgba(255,255,255,.07);
  -webkit-backdrop-filter:blur(14px);backdrop-filter:blur(14px);
  transition:transform .2s ease,border-color .2s ease}
button.pf-row:active{transform:scale(.985)}
@media (hover:hover){button.pf-row:hover{border-color:rgba(var(--ac-rgb),.28)}}
.pf-ri{flex:none;display:grid;place-items:center;width:2.05rem;height:2.05rem;border-radius:50%;color:rgba(255,255,255,.72);
  background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.12)}
.pf-ri svg{width:14px;height:14px}
.pf-rt{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.pf-rv{flex:0 1 auto;max-width:48%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:10.5px;font-weight:500;color:rgba(255,255,255,.5)}
.pf-rv.mono{font-family:ui-monospace,"SF Mono",Menlo,Consolas,monospace;letter-spacing:.06em;color:rgba(255,255,255,.7)}
.pf-rv.ac{color:var(--ac);font-weight:700;font-size:12px}
.pf-chev{flex:none;width:14px;height:14px;color:rgba(255,255,255,.4);transition:transform .25s ease}
.pf-chev.is-open{transform:rotate(90deg)}
.pf-row.danger .pf-ri{color:#ff9d92;border-color:rgba(255,120,105,.28);background:rgba(255,120,105,.07)}
.pf-row.danger .pf-rt{color:#ffb4ab}

.pf-chip{display:inline-flex;align-items:center;gap:.35rem;padding:.2rem .6rem;border-radius:999px;font-size:10px;font-weight:600;color:#fff;
  background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.1)}
.pf-chip i{width:.4rem;height:.4rem;border-radius:50%;background:#a1a1aa}
.pf-chip.on i{background:var(--ac);box-shadow:0 0 8px rgba(var(--ac-rgb),.9)}
.pf-chip.pending i{background:#fcd34d}
.pf-chip.off i{background:#fb7185}

.pf-copy{flex:none;display:grid;place-items:center;width:1.7rem;height:1.7rem;border-radius:50%;color:var(--ink);background:var(--ac);
  box-shadow:0 6px 14px -6px rgba(var(--ac-rgb),.8)}
.pf-copy svg{width:12px;height:12px}
.pf-badge{flex:none;display:grid;place-items:center;min-width:1.15rem;height:1.15rem;padding:0 .3rem;border-radius:999px;font-size:9.5px;font-weight:700;color:var(--ink);background:var(--ac)}

/* edit panel */
.pf-edit{display:grid;grid-template-columns:1fr 1fr;gap:.55rem;padding:.2rem .1rem .15rem}
.pf-fld{display:flex;flex-direction:column;gap:.3rem;min-width:0}
.pf-fld span{padding-left:.9rem;font-size:10px;font-weight:500;color:rgba(255,255,255,.55)}
.pf-fld input{display:block;width:100%;min-width:0;height:2.55rem;padding:0 1rem;border-radius:999px;color:#fff;font-size:16px;outline:none;
  color-scheme:dark;-webkit-appearance:none;appearance:none;
  background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.12);box-shadow:inset 0 1px 0 rgba(255,255,255,.06);
  transition:border-color .2s,box-shadow .2s}
.pf-fld input:focus{border-color:rgba(var(--ac-rgb),.7);box-shadow:0 0 0 3px rgba(var(--ac-rgb),.16)}
.pf-edit .pf-btn{grid-column:1/-1;margin-top:.15rem;height:2.6rem}

/* ---------- logged-out card ---------- */
.pf-card{position:relative;overflow:hidden;border-radius:1.4rem;
  background:radial-gradient(90% 70% at 100% 0%,rgba(var(--ac-rgb),.13),transparent 60%),linear-gradient(145deg,rgba(255,255,255,.07),rgba(255,255,255,.02));
  border:1px solid rgba(255,255,255,.09);box-shadow:inset 0 1px 0 rgba(255,255,255,.1),0 24px 50px -26px rgba(0,0,0,.9)}
.pf-bigicon{display:grid;place-items:center;width:3.4rem;height:3.4rem;margin:0 auto;border-radius:50%;color:var(--ink);background:var(--ac);
  box-shadow:0 10px 28px -8px rgba(var(--ac-rgb),.7)}

/* ---------- modal ---------- */
.pf-icon-sm{display:grid;place-items:center;flex:none;width:2.05rem;height:2.05rem;border-radius:50%;color:var(--ink);background:var(--ac);
  box-shadow:0 6px 16px -6px rgba(var(--ac-rgb),.7)}
.pf-modal-backdrop{position:fixed;inset:0;z-index:9999;display:flex;align-items:center;justify-content:center;
  padding:max(1rem,env(safe-area-inset-top)) 1rem max(1rem,env(safe-area-inset-bottom));
  background:radial-gradient(60% 40% at 50% 24%,rgba(var(--ac-rgb),.12),rgba(0,0,0,.85)),rgba(0,0,0,.7);
  -webkit-backdrop-filter:blur(10px);backdrop-filter:blur(10px)}
.pf-modal-card{position:relative;width:100%;max-width:27rem;max-height:88vh;max-height:88dvh;overflow-y:auto;overscroll-behavior:contain;color:#fff;
  border-radius:1.4rem;border:1px solid rgba(255,255,255,.1);
  background:radial-gradient(100% 50% at 100% 0%,rgba(var(--ac-rgb),.1),transparent 60%),linear-gradient(160deg,#1d1f19,#0c0d0a);
  box-shadow:inset 0 1px 0 rgba(255,255,255,.1),0 30px 70px -20px rgba(0,0,0,.95)}
.pf-modal-head{display:flex;align-items:center;justify-content:space-between;gap:.75rem;padding:1rem 1rem .9rem 1.15rem;border-bottom:1px solid rgba(255,255,255,.08)}
.pf-modal-head p{margin:0;font-size:10px;color:rgba(255,255,255,.5)}
.pf-modal-head h2{margin:2px 0 0;font-size:15px;font-weight:600}
.pf-bubble-me{background:var(--ac);color:var(--ink);font-weight:500;box-shadow:0 8px 18px -8px rgba(var(--ac-rgb),.7)}
.pf-bubble-them{background:linear-gradient(145deg,rgba(255,255,255,.12),rgba(255,255,255,.04));border:1px solid rgba(255,255,255,.1);color:#e9ece4}
.pf-bubble-me,.pf-bubble-them{overflow-wrap:anywhere;word-break:break-word}

@media (prefers-reduced-motion:reduce){.pf-rise{animation:none!important}.pf-root *{transition:none!important}}
`

function ProfileStyles() {
  return <style>{PROFILE_CSS}</style>
}

function Row({
  icon,
  label,
  value,
  valueClass = "",
  onClick,
  trailing,
  chevron = true,
  danger = false,
}: {
  icon: React.ReactNode
  label: string
  value?: React.ReactNode
  valueClass?: string
  onClick?: () => void
  trailing?: React.ReactNode
  chevron?: boolean
  danger?: boolean
}) {
  const inner = (
    <>
      <span className="pf-ri">{icon}</span>
      <span className="pf-rt">{label}</span>
      {value !== undefined && value !== null && (
        <span className={`pf-rv ${valueClass}`}>{value}</span>
      )}
      {trailing}
      {chevron && onClick && <ChevronRight className="pf-chev" />}
    </>
  )

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={`pf-row${danger ? " danger" : ""}`}
      >
        {inner}
      </button>
    )
  }

  return <div className={`pf-row${danger ? " danger" : ""}`}>{inner}</div>
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
      profile?.name ||
        user?.displayName ||
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
          : "text-[#F2FF00]"

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

        <section className="pf-card pf-rise w-full max-w-sm p-7 text-center">
          <div className="pf-bigicon">
            <UserRound className="size-6" />
          </div>

          <h1 className="mt-4 text-lg font-semibold tracking-tight">
            Your MVBD account
          </h1>

          <p className="mt-2 text-xs leading-5 text-zinc-400">
            Sign in to manage your membership,
            referrals, notifications, and support.
          </p>

          <button
            onClick={() => setShowAuthModal(true)}
            className="pf-btn pf-btn-md mt-6"
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

  const displayName =
    profile?.name ||
    user.displayName ||
    "MVBD member"

  const validUntil =
    expiry
      ? new Intl.DateTimeFormat("en", {
          dateStyle: "medium",
        }).format(new Date(expiry.toMillis()))
      : ""

  const statusClass =
    status === "Active"
      ? "on"
      : status === "Pending"
        ? "pending"
        : "off"

  return (
    <main className="pf-root min-h-0 px-4 pb-24 pt-5 text-white">
      <ProfileStyles />

      <div className="pf-wrap">

        {/* HEADER */}
        <header className="pf-head pf-rise">
          <button
            type="button"
            className="pf-circle"
            aria-label="Go back"
            onClick={() => window.history.back()}
          >
            <ArrowLeft />
          </button>

          <h1>My Profile</h1>

          {onNavigate ? (
            <button
              type="button"
              className="pf-circle"
              aria-label="Settings"
              onClick={() => onNavigate("settings")}
            >
              <Settings />
            </button>
          ) : (
            <span aria-hidden="true" />
          )}
        </header>

        {/* USER */}
        <div className="pf-user pf-rise pf-d1">
          <div className="pf-ava">
            <div className="pf-ava-in">
              {photo ? (
                <img src={photo} alt="Your profile" />
              ) : (
                <span>{initials}</span>
              )}
            </div>

            {isPremium && (
              <span className="pf-ava-crown">
                <Crown />
              </span>
            )}
          </div>

          <div className="pf-uinfo">
            <p className="pf-uname">{displayName}</p>
            <p className="pf-umail">{user.email}</p>
          </div>

          <button
            type="button"
            onClick={() => setIsEditing((value) => !value)}
            className={`pf-pencil${isEditing ? " is-on" : ""}`}
            aria-label="Edit profile"
          >
            <Pencil />
          </button>
        </div>

        {/* PREMIUM ACCESS CARD */}
        <section className="pf-prem pf-rise pf-d2">
          {expiry ? (
            <Crown className="pf-prem-wm" aria-hidden="true" />
          ) : (
            <Lock className="pf-prem-wm" aria-hidden="true" />
          )}

          <div className="pf-prem-body">
            <p className="pf-prem-title">
              <Crown />
              {expiry
                ? isPremium && entitlement.isPremiumActive
                  ? "Premium Access"
                  : "Trial Access"
                : "Premium Access"}
            </p>

            {expiry ? (
              remaining.expired ? (
                <p className="pf-prem-desc text-red-300">
                  Your access validity has ended.
                </p>
              ) : (
                <p className="pf-prem-desc">
                  Valid until {validUntil}
                </p>
              )
            ) : (
              <p className="pf-prem-desc">
                Access advanced seamless features and enjoy the full MVBD movie experience.
              </p>
            )}

            {profile?.subscriptionStatus === "expired" && (
              <p className="pf-prem-warn">
                Your membership has expired. Subscribe again to continue watching premium movies.
              </p>
            )}
          </div>

          {expiry && !remaining.expired && (
            <div className="pf-cd" aria-label={countdownText}>
              {[
                [remaining.days, "Days"],
                [remaining.hours, "Hrs"],
                [remaining.minutes, "Min"],
                [remaining.seconds, "Sec"],
              ].map(([value, unit]) => (
                <div key={unit as string}>
                  <b className={`pf-tabular ${days > 3 ? "text-[#F2FF00]" : daysTone}`}>
                    {String(value).padStart(2, "0")}
                  </b>
                  <small>{unit}</small>
                </div>
              ))}
            </div>
          )}

          <button
            type="button"
            onClick={() => setShowSubscriptions(true)}
            className="pf-btn pf-btn-sm"
          >
            {expiry ? "Manage Access" : "Unlock Access"}
          </button>
        </section>

        {/* USER INFORMATION */}
        <h2 className="pf-sec">User information</h2>

        <div className="pf-list pf-rise pf-d3">
          <Row
            icon={<UserRound />}
            label="Edit Profile"
            onClick={() => setIsEditing((value) => !value)}
            trailing={null}
            chevron={false}
            value={
              <ChevronRight
                className={`pf-chev${isEditing ? " is-open" : ""}`}
              />
            }
          />

          {isEditing && (
            <div className="pf-edit">
              <label className="pf-fld">
                <span>Full name</span>
                <input
                  value={name}
                  onChange={(event) =>
                    setName(event.target.value)
                  }
                  placeholder="Your name"
                />
              </label>

              <label className="pf-fld">
                <span>Date of birth</span>
                <input
                  type="date"
                  value={dateOfBirth}
                  onChange={(event) =>
                    setDateOfBirth(event.target.value)
                  }
                />
              </label>

              <button
                type="button"
                disabled={saving}
                onClick={() => void saveProfile()}
                className="pf-btn pf-btn-md"
              >
                {saving && (
                  <Loader2 className="size-4 animate-spin" />
                )}

                Save changes
              </button>
            </div>
          )}

          <Row
            icon={<ShieldCheck />}
            label="Member ID"
            value={profile?.mvbdId || "Pending"}
            valueClass="mono"
          />

          <Row
            icon={<Mail />}
            label="Email"
            value={user.email || "Not set"}
          />

          <Row
            icon={<CalendarDays />}
            label="Date of birth"
            value={profile?.dateOfBirth || "Not set"}
          />

          {onNavigate && (
            <Row
              icon={<Settings />}
              label="Setting"
              onClick={() => onNavigate("settings")}
            />
          )}
        </div>

        {/* MY ACCOUNT */}
        <h2 className="pf-sec">My Account</h2>

        <div className="pf-list">
          <Row
            icon={<BadgeCheck />}
            label="Status"
            chevron={false}
            value={
              <span className={`pf-chip ${statusClass}`}>
                <i />
                {status}
              </span>
            }
          />

          <Row
            icon={<Crown />}
            label="Plan"
            value={accountType}
            chevron={false}
          />

          <Row
            icon={<Ticket />}
            label="Promo code"
            value={referralCode}
            valueClass="mono"
            chevron={false}
            trailing={
              <button
                type="button"
                onClick={() => void copyCode()}
                className="pf-copy"
                aria-label="Copy promo code"
              >
                {copied ? <Check /> : <Clipboard />}
              </button>
            }
          />

          <Row
            icon={<Users />}
            label="Successful referrals"
            value={successfulReferrals}
            valueClass="ac pf-tabular"
            chevron={false}
          />

          <Row
            icon={<Bell />}
            label="Notifications"
            onClick={() => void openNotifications()}
            trailing={
              unreadCount > 0 ? (
                <span className="pf-badge">{unreadCount}</span>
              ) : null
            }
          />

          <Row
            icon={<MessageCircle />}
            label="Support team"
            onClick={() => setModal("support")}
          />

          <Row
            icon={<LogOut />}
            label="Sign out"
            danger
            onClick={() => void signOut()}
          />
        </div>
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
              <section className="pf-modal-card">
                <div className="pf-modal-head">
                  <div className="min-w-0">
                    <p>
                      {modal === "notifications"
                        ? "What's new"
                        : "We're here for you"}
                    </p>

                    <h2>
                      {modal === "notifications"
                        ? "Notifications"
                        : "Support team"}
                    </h2>
                  </div>

                  <button
                    onClick={() => setModal(null)}
                    className="pf-circle"
                    aria-label="Close"
                  >
                    <X />
                  </button>
                </div>

                {modal === "notifications" ? (
                  <div className="overflow-visible p-4">

                    {notifications.length === 0 ? (
                      <p className="p-8 text-center text-xs text-zinc-400">
                        No notifications yet.
                      </p>
                    ) : (
                      notifications.map((item) => (
                        <article
                          key={item.notificationId}
                          className="border-b border-white/10 p-3 last:border-0"
                        >
                          <div className="flex gap-3">

                            <span className="pf-icon-sm">
                              <Bell className="size-4" />
                            </span>

                            <div className="min-w-0">
                              <p className="text-[13px] text-zinc-100 [overflow-wrap:anywhere]">
                                {item.message}
                              </p>

                              <p className="mt-1 text-[10px] text-zinc-400">
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
                        <p className="py-8 text-center text-xs text-zinc-400">
                          Start a conversation with support.
                        </p>
                      ) : (
                        messages.map((item) => (
                          <div
                            key={item.id}
                            className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-[13px] ${
                              item.senderUid === user.uid
                                ? "pf-bubble-me ml-auto"
                                : "pf-bubble-them"
                            }`}
                          >
                            <p>{item.message}</p>

                            <p
                              className={`mt-1 text-[10px] ${
                                item.senderUid === user.uid
                                  ? "text-[#4a4f12]"
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
                        className="min-w-0 flex-1 rounded-full border border-white/15 bg-white/[.07] px-5 text-base text-white shadow-[inset_0_1px_0_rgba(255,255,255,.12)] outline-none placeholder:text-zinc-500 focus:border-[#F2FF00]/70 focus:shadow-[0_0_0_3px_rgba(242,255,0,.16)]"
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
