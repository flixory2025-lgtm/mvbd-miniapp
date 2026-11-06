"use client"

import { createPortal } from "react-dom"
import { useEffect, useRef, useState } from "react"
import {
  BookOpen,
  Check,
  ChevronRight,
  Crown,
  ExternalLink,
  Film,
  Lock,
  Loader2,
  Play,
  Send,
  X,
} from "lucide-react"
import { toast } from "sonner"

import { useAuth } from "@/components/auth-provider"
import { createPendingPaymentRequest } from "@/lib/payment-requests"
import {
  PAYMENT_NUMBER,
  SUBSCRIPTION_PLANS,
  type SubscriptionPlanId,
} from "@/lib/subscription-plans"

interface SubscriptionPanelProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onOpenMeBook?: () => void
}

/*
 * =========================================
 * SUBSCRIPTION SHEET STYLES
 * (profile / settings page er same compact dark-glass look)
 * Accent: Settings theke je colour select hobe oita auto nibe
 * (--mvbd-accent), na thakle #F2FF00
 * =========================================
 */
const SHEET_CSS = String.raw`
@import url("https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap");

.sp-root{
  --ac:var(--mvbd-accent,#F2FF00);--ac-rgb:var(--mvbd-accent-rgb,242,255,0);--ink:#12140a;
  color:#fff;font-family:Inter,system-ui,-apple-system,"Segoe UI",sans-serif;
  -webkit-tap-highlight-color:transparent;-webkit-text-size-adjust:100%;text-size-adjust:100%}
.sp-root *,.sp-root *::before,.sp-root *::after{box-sizing:border-box}

.sp-backdrop{position:fixed;inset:0;z-index:9999;display:flex;align-items:flex-end;justify-content:center;
  background:radial-gradient(60% 40% at 50% 100%,rgba(var(--ac-rgb),.12),rgba(0,0,0,.82)),rgba(0,0,0,.6);
  -webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px);
  transition:opacity .35s ease}

.sp-sheet{position:relative;display:flex;flex-direction:column;width:100%;max-width:27rem;
  max-height:92vh;max-height:92dvh;overflow:hidden;will-change:transform;
  border-radius:1.6rem 1.6rem 0 0;border:1px solid rgba(255,255,255,.1);border-bottom:0;
  background:radial-gradient(100% 40% at 100% 0%,rgba(var(--ac-rgb),.1),transparent 60%),linear-gradient(160deg,#1d1f19,#0c0d0a);
  box-shadow:inset 0 1px 0 rgba(255,255,255,.1),0 -24px 70px -20px rgba(0,0,0,.95);
  transition:transform .4s cubic-bezier(.32,.72,0,1)}
.sp-sheet.is-drag{transition:none}

/* grab area (handle + header) */
.sp-grab{flex:none;touch-action:none;cursor:grab;user-select:none;-webkit-user-select:none}
.sp-grab:active{cursor:grabbing}
.sp-pill{width:2.5rem;height:.28rem;margin:.6rem auto 0;border-radius:999px;background:rgba(255,255,255,.22)}
.sp-head{display:flex;align-items:center;justify-content:space-between;gap:.75rem;
  padding:.7rem 1rem .85rem 1.15rem;border-bottom:1px solid rgba(255,255,255,.08)}
.sp-eyebrow{margin:0;font-size:9.5px;font-weight:700;letter-spacing:.22em;text-transform:uppercase;color:var(--ac)}
.sp-head h2{margin:3px 0 0;font-size:15px;font-weight:600}
.sp-head p.sp-sub{margin:2px 0 0;font-size:10px;color:rgba(255,255,255,.5)}
.sp-circle{display:grid;place-items:center;flex:none;width:2.3rem;height:2.3rem;border-radius:50%;color:rgba(255,255,255,.88);
  background:linear-gradient(145deg,rgba(255,255,255,.1),rgba(255,255,255,.03));
  border:1px solid rgba(255,255,255,.12);box-shadow:inset 0 1px 0 rgba(255,255,255,.12);
  transition:transform .2s ease,background .2s ease}
.sp-circle:active{transform:scale(.93)}
.sp-circle svg{width:15px;height:15px}

.sp-scroll{flex:1;min-height:0;overflow-y:auto;overscroll-behavior:contain;
  padding:.9rem 1rem calc(1.4rem + env(safe-area-inset-bottom))}

/* section heading */
.sp-sec{display:flex;align-items:center;gap:.55rem;margin:1.25rem 0 .6rem}
.sp-sec-ic{display:grid;place-items:center;flex:none;width:1.9rem;height:1.9rem;border-radius:50%;color:var(--ink);background:var(--ac);
  box-shadow:0 6px 16px -6px rgba(var(--ac-rgb),.7)}
.sp-sec-ic svg{width:13px;height:13px}
.sp-sec h3{margin:0;font-size:13px;font-weight:700}
.sp-sec p{margin:1px 0 0;font-size:10px;color:rgba(255,255,255,.5)}

/* free plan card */
.sp-card{position:relative;overflow:hidden;padding:.95rem 1rem 1rem;border-radius:1.15rem;
  background:
   radial-gradient(90% 120% at 100% 0%,rgba(var(--ac-rgb),.14),transparent 62%),
   linear-gradient(135deg,rgba(255,255,255,.075),rgba(255,255,255,.02));
  border:1px solid rgba(var(--ac-rgb),.16);
  box-shadow:inset 0 1px 0 rgba(255,255,255,.1),0 18px 36px -22px rgba(0,0,0,.9)}
.sp-card-top{display:flex;align-items:flex-start;gap:.7rem}
.sp-gift{display:grid;place-items:center;flex:none;width:2.4rem;height:2.4rem;border-radius:50%;font-size:1.05rem;
  background:rgba(var(--ac-rgb),.12);border:1px solid rgba(var(--ac-rgb),.3)}
.sp-card-title{display:flex;align-items:center;gap:.45rem;flex-wrap:wrap;margin:0;font-size:13px;font-weight:600}
.sp-tag{display:inline-flex;align-items:center;padding:.15rem .55rem;border-radius:999px;font-size:8.5px;font-weight:700;
  letter-spacing:.12em;text-transform:uppercase;color:var(--ac);background:rgba(var(--ac-rgb),.1);border:1px solid rgba(var(--ac-rgb),.25)}
.sp-desc{margin:.35rem 0 0;font-size:10.5px;line-height:1.55;color:rgba(255,255,255,.6)}
.sp-desc.hl{margin-top:.4rem;color:rgba(255,255,255,.72)}
.sp-note{margin:.75rem 0 0;padding:.6rem .85rem;border-radius:1rem;font-size:10px;line-height:1.55;color:rgba(255,255,255,.5);
  background:rgba(0,0,0,.25);border:1px solid rgba(255,255,255,.07)}

/* rows */
.sp-list{display:flex;flex-direction:column;gap:.45rem;margin-top:.8rem}
.sp-row{display:flex;align-items:center;gap:.65rem;width:100%;min-width:0;padding:.4rem .85rem .4rem .4rem;border-radius:1.4rem;
  text-align:left;color:rgba(255,255,255,.9);text-decoration:none;
  background:linear-gradient(145deg,rgba(255,255,255,.065),rgba(255,255,255,.025));
  border:1px solid rgba(255,255,255,.075);box-shadow:inset 0 1px 0 rgba(255,255,255,.07);
  transition:transform .2s ease,border-color .2s ease,background .2s ease}
a.sp-row:active,button.sp-row:active{transform:scale(.985)}
@media (hover:hover){a.sp-row:hover,button.sp-row:hover{border-color:rgba(var(--ac-rgb),.3)}}
.sp-row.is-locked{opacity:.65}
.sp-em{display:grid;place-items:center;flex:none;width:2.05rem;height:2.05rem;border-radius:50%;font-size:.95rem;
  background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.12)}
.sp-t{flex:1;min-width:0}
.sp-t b{display:block;font-size:12px;font-weight:500}
.sp-t small{display:block;margin-top:1px;font-size:10px;font-weight:400;line-height:1.4;color:rgba(255,255,255,.45)}
.sp-trail{flex:none;width:14px;height:14px;color:rgba(255,255,255,.4);transition:color .2s ease,transform .2s ease}
@media (hover:hover){.sp-row:hover .sp-trail{color:var(--ac)}}
.sp-lock{flex:none;padding:.15rem .5rem;border-radius:999px;font-size:8.5px;letter-spacing:.1em;text-transform:uppercase;
  color:rgba(255,255,255,.45);border:1px solid rgba(255,255,255,.12)}

/* plans */
.sp-plan{position:relative;align-items:center;padding:.55rem .85rem .55rem .5rem;cursor:pointer}
.sp-plan.is-on{border-color:var(--ac);
  background:linear-gradient(145deg,rgba(var(--ac-rgb),.14),rgba(var(--ac-rgb),.04));
  box-shadow:inset 0 1px 0 rgba(255,255,255,.1),0 10px 26px -16px rgba(var(--ac-rgb),.7)}
.sp-plan .sp-em{width:2.4rem;height:2.4rem;font-size:1.15rem}
.sp-plan .sp-t b{font-size:12.5px;font-weight:600}
.sp-chips{display:flex;flex-wrap:wrap;gap:.3rem;margin-top:.35rem}
.sp-chip{display:inline-flex;align-items:center;gap:.25rem;padding:.12rem .5rem;border-radius:999px;font-size:9px;font-weight:600;
  color:var(--ac);background:rgba(var(--ac-rgb),.09);border:1px solid rgba(var(--ac-rgb),.22)}
.sp-chip.solid{color:var(--ink);background:var(--ac);border-color:transparent;font-weight:700;text-transform:uppercase;letter-spacing:.08em;font-size:8.5px}
.sp-chip.mute{color:rgba(255,255,255,.75);background:rgba(255,255,255,.07);border-color:rgba(255,255,255,.12)}
.sp-price{flex:none;display:flex;flex-direction:column;align-items:flex-end;gap:.4rem}
.sp-price b{font-size:14px;font-weight:700;font-variant-numeric:tabular-nums}
.sp-radio{display:grid;place-items:center;width:1.2rem;height:1.2rem;border-radius:50%;border:1.5px solid rgba(255,255,255,.25);color:transparent;
  transition:background .2s ease,border-color .2s ease}
.sp-radio svg{width:11px;height:11px}
.sp-plan.is-on .sp-radio{background:var(--ac);border-color:var(--ac);color:var(--ink)}

/* payment */
.sp-pay{margin-top:1rem;padding:.95rem 1rem 1rem;border-radius:1.15rem;
  background:linear-gradient(145deg,rgba(255,255,255,.06),rgba(255,255,255,.02));
  border:1px solid rgba(255,255,255,.09);box-shadow:inset 0 1px 0 rgba(255,255,255,.08)}
.sp-pay-top{display:flex;align-items:flex-start;gap:.7rem}
.sp-pay-top .sp-gift{width:2.2rem;height:2.2rem;font-size:1rem}
.sp-pay-top strong{font-weight:600}
.sp-num{margin-top:.8rem;padding:.65rem .9rem;border-radius:1rem;background:rgba(var(--ac-rgb),.06);border:1px solid rgba(var(--ac-rgb),.18)}
.sp-num small{display:block;font-size:9px;font-weight:600;letter-spacing:.16em;text-transform:uppercase;color:rgba(255,255,255,.45)}
.sp-num b{display:block;margin-top:2px;font-size:16px;font-weight:700;letter-spacing:.05em;color:var(--ac);font-variant-numeric:tabular-nums}
.sp-lbl{display:block;margin:.85rem 0 .3rem .9rem;font-size:10px;font-weight:500;color:rgba(255,255,255,.55)}
.sp-input{display:block;width:100%;min-width:0;height:2.55rem;padding:0 1rem;border-radius:999px;color:#fff;font-size:16px;outline:none;
  -webkit-appearance:none;appearance:none;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.12);
  box-shadow:inset 0 1px 0 rgba(255,255,255,.06);transition:border-color .2s,box-shadow .2s}
.sp-input::placeholder{color:rgba(255,255,255,.3)}
.sp-input:focus{border-color:rgba(var(--ac-rgb),.7);box-shadow:0 0 0 3px rgba(var(--ac-rgb),.16)}
.sp-btn{display:inline-flex;align-items:center;justify-content:center;gap:.45rem;width:100%;height:2.65rem;margin-top:.7rem;border-radius:999px;
  font-size:12px;font-weight:700;color:var(--ink);white-space:nowrap;background:var(--ac);
  box-shadow:inset 0 1px 0 rgba(255,255,255,.6),0 8px 20px -8px rgba(var(--ac-rgb),.7);
  transition:transform .2s ease,filter .2s ease,opacity .2s ease}
.sp-btn:active{transform:scale(.97)}
.sp-btn:disabled{opacity:.4;cursor:not-allowed}
@media (hover:hover){.sp-btn:not(:disabled):hover{filter:brightness(1.06)}}
.sp-foot{margin:.7rem 0 0;text-align:center;font-size:9.5px;line-height:1.5;color:rgba(255,255,255,.4)}

@media (prefers-reduced-motion:reduce){.sp-sheet,.sp-backdrop{transition-duration:.01ms!important}}
`

const CLOSE_MS = 380
const DISMISS_DISTANCE = 120
const DISMISS_VELOCITY = 0.65

export default function SubscriptionPanel({
  open,
  onOpenChange,
  onOpenMeBook,
}: SubscriptionPanelProps) {
  const { user, profile, entitlement } = useAuth()

  const [selected, setSelected] =
    useState<SubscriptionPlanId>("two_months")

  const [transactionId, setTransactionId] = useState("")
  const [loading, setLoading] = useState(false)
  const [portalNode, setPortalNode] = useState<HTMLElement | null>(null)

  // sheet animation state
  const [rendered, setRendered] = useState(false) // DOM e ache kina
  const [shown, setShown] = useState(false) // slide-in howa
  const [dragY, setDragY] = useState(0)
  const [dragging, setDragging] = useState(false)

  const drag = useRef({
    active: false,
    startY: 0,
    lastY: 0,
    lastT: 0,
    velocity: 0,
    dy: 0,
  })

  // --------------------------------------------------
  // Portal
  // --------------------------------------------------

  useEffect(() => {
    setPortalNode(document.body)

    return () => {
      setPortalNode(null)
    }
  }, [])

  // --------------------------------------------------
  // Open / close animation (niche theke uthbe, niche name jabe)
  // --------------------------------------------------

  useEffect(() => {
    if (open) {
      setRendered(true)
      setDragY(0)

      let raf2 = 0
      const raf1 = requestAnimationFrame(() => {
        raf2 = requestAnimationFrame(() => setShown(true))
      })

      return () => {
        cancelAnimationFrame(raf1)
        cancelAnimationFrame(raf2)
      }
    }

    setShown(false)

    const timer = window.setTimeout(() => {
      setRendered(false)
      setDragY(0)
    }, CLOSE_MS)

    return () => window.clearTimeout(timer)
  }, [open])

  // --------------------------------------------------
  // Prevent background scrolling (exit animation shesh na hoa porjonto)
  // --------------------------------------------------

  useEffect(() => {
    if (!rendered) return

    const previousOverflow = document.body.style.overflow

    document.body.style.overflow = "hidden"

    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [rendered])

  // --------------------------------------------------
  // Escape key
  // --------------------------------------------------

  useEffect(() => {
    if (!open) return

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onOpenChange(false)
    }

    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [open, onOpenChange])

  // --------------------------------------------------
  // Reset form when modal closes
  // --------------------------------------------------

  useEffect(() => {
    if (!open) {
      setTransactionId("")
    }
  }, [open])

  // --------------------------------------------------
  // Drag to dismiss (handle + header theke niche tana jabe)
  // --------------------------------------------------

  const onDragStart = (event: React.PointerEvent<HTMLDivElement>) => {
    if ((event.target as HTMLElement).closest("button")) return

    event.currentTarget.setPointerCapture(event.pointerId)

    drag.current = {
      active: true,
      startY: event.clientY,
      lastY: event.clientY,
      lastT: performance.now(),
      velocity: 0,
      dy: 0,
    }

    setDragging(true)
  }

  const onDragMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const state = drag.current
    if (!state.active) return

    const now = performance.now()
    const dt = Math.max(1, now - state.lastT)

    state.velocity = (event.clientY - state.lastY) / dt
    state.lastY = event.clientY
    state.lastT = now
    state.dy = Math.max(0, event.clientY - state.startY)

    setDragY(state.dy)
  }

  const onDragEnd = () => {
    const state = drag.current
    if (!state.active) return

    state.active = false
    setDragging(false)

    if (
      state.dy > DISMISS_DISTANCE ||
      (state.velocity > DISMISS_VELOCITY && state.dy > 20)
    ) {
      onOpenChange(false)
    } else {
      setDragY(0)
    }
  }

  // --------------------------------------------------
  // Don't render
  // --------------------------------------------------

  if (!rendered || !portalNode) return null

  // --------------------------------------------------
  // Plans
  // --------------------------------------------------

  const freePlan =
    SUBSCRIPTION_PLANS.find((plan) => plan.planId === "trial") ?? null

  const paidPlans = SUBSCRIPTION_PLANS.filter(
    (plan) => plan.planId !== "trial",
  )

  const selectedPlan = paidPlans.find(
    (plan) => plan.planId === selected,
  )

  const activePaidPlan = entitlement.isPremiumActive
    ? entitlement.subscriptionPlan
    : null

  // --------------------------------------------------
  // Payment
  // --------------------------------------------------

  const submitPayment = async () => {
    if (!user || !profile || !selectedPlan) return

    if (!transactionId.trim()) {
      toast.error("Please enter your transaction ID")
      return
    }

    setLoading(true)

    try {
      await createPendingPaymentRequest({
        user,
        profile,
        planId: selectedPlan.planId,
        transactionId: transactionId.trim(),
      })

      toast.success("Payment request submitted for review")

      setTransactionId("")
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Could not submit payment request",
      )
    } finally {
      setLoading(false)
    }
  }

  // --------------------------------------------------
  // Free Plan Items
  // --------------------------------------------------

  const freeFeatures = [
    {
      id: "mvbd-pm",
      icon: Send,
      title: "MVBD PM Channel",
      description: "Access the official MVBD PM channel.",
      type: "link" as const,
      href: "https://t.me/mvbdpm2",
      sticker: "📢",
    },

    {
      id: "anime-verse",
      icon: Play,
      title: "Anime Verse BD Channel",
      description: "Access the Anime Verse BD channel.",
      type: "link" as const,
      href: "https://t.me/avbdpm",
      sticker: "🎌",
    },

    {
      id: "mebook",
      icon: BookOpen,
      title: "MeBook",
      description: "Explore the MeBook section from MVBD.",
      type: "mebook" as const,
      sticker: "📚",
    },

    {
      id: "trailers",
      icon: Film,
      title: "Movie & Series Trailer Access",
      description: "Watch available movie and series trailers.",
      type: "info" as const,
      sticker: "🎬",
    },

    {
      id: "free-quality",
      icon: Play,
      title: "480p – 720p Movie Streaming",
      description: "Free plan এ 480p–720p পর্যন্ত movie দেখতে পারবেন।",
      type: "info" as const,
      sticker: "📺",
    },

    {
      id: "restricted",
      icon: Lock,
      title: "18+ Channel",
      description: "১৮+ কনটেন্টের জন্য আমাদের Telegram চ্যানেলে যান।",
      type: "link" as const,
      href: "https://t.me/MoviesVerseBD",
      sticker: "🔞",
    },
  ]

  // --------------------------------------------------
  // Animation values
  // --------------------------------------------------

  const sheetTransform = shown
    ? `translateY(${dragY}px)`
    : "translateY(100%)"

  const backdropOpacity = shown
    ? Math.max(0.25, 1 - dragY / 420)
    : 0

  // --------------------------------------------------
  // Render
  // --------------------------------------------------

  return createPortal(
    <div
      className="sp-root sp-backdrop"
      role="presentation"
      style={{ opacity: backdropOpacity }}
      onMouseDown={(event) => {
        if (event.currentTarget === event.target) {
          onOpenChange(false)
        }
      }}
    >
      <style>{SHEET_CSS}</style>

      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="subscription-panel-title"
        className={`sp-sheet${dragging ? " is-drag" : ""}`}
        style={{ transform: sheetTransform }}
      >
        {/* --------------------------------------------- */}
        {/* Handle + Header (drag area) */}
        {/* --------------------------------------------- */}

        <div
          className="sp-grab"
          onPointerDown={onDragStart}
          onPointerMove={onDragMove}
          onPointerUp={onDragEnd}
          onPointerCancel={onDragEnd}
        >
          <div className="sp-pill" aria-hidden="true" />

          <div className="sp-head">
            <div className="min-w-0">
              <p className="sp-eyebrow">MoviesVerseBD</p>

              <h2 id="subscription-panel-title">Choose your access</h2>

              <p className="sp-sub">
                Free access or unlock premium features.
              </p>
            </div>

            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="sp-circle"
              aria-label="Close"
            >
              <X />
            </button>
          </div>
        </div>

        {/* --------------------------------------------- */}
        {/* Scrollable Content */}
        {/* --------------------------------------------- */}

        <div className="sp-scroll">
          {/* ========================================= */}
          {/* FREE PLAN */}
          {/* ========================================= */}

          <div className="sp-card">
            <div className="sp-card-top">
              <div className="sp-gift">🎁</div>

              <div className="min-w-0">
                <p className="sp-card-title">
                  Free Plan
                  <span className="sp-tag">Free</span>
                </p>

                <p className="sp-desc">
                  {freePlan?.description ||
                    "ফ্রি প্ল্যানে 480P–720P Normal Download সুবিধা ব্যবহার করুন।"}
                </p>

                <p className="sp-desc hl">
                  ফ্রি প্ল্যানে 480P–720P পর্যন্ত মুভি স্ট্রিমিং এবং ডাউনলোড করা যাবে। 1080P–4K ডাউনলোডের জন্য Premium Plan প্রয়োজন।
                </p>
              </div>
            </div>

            {/* Free Features */}

            <div className="sp-list">
              {freeFeatures.map((feature) => {
                // -------------------------------------
                // External Link
                // -------------------------------------

                if (feature.type === "link") {
                  return (
                    <a
                      key={feature.id}
                      href={feature.href}
                      target="_blank"
                      rel="noreferrer"
                      className="sp-row"
                    >
                      <span className="sp-em">{feature.sticker}</span>

                      <span className="sp-t">
                        <b>{feature.title}</b>
                        <small>{feature.description}</small>
                      </span>

                      <ExternalLink className="sp-trail" />
                    </a>
                  )
                }

                // -------------------------------------
                // MeBook
                // -------------------------------------

                if (feature.type === "mebook") {
                  return (
                    <button
                      key={feature.id}
                      type="button"
                      onClick={() => {
                        onOpenChange(false)
                        onOpenMeBook?.()
                      }}
                      className="sp-row"
                    >
                      <span className="sp-em">{feature.sticker}</span>

                      <span className="sp-t">
                        <b>{feature.title}</b>
                        <small>{feature.description}</small>
                      </span>

                      <ChevronRight className="sp-trail" />
                    </button>
                  )
                }

                // -------------------------------------
                // Normal Info
                // -------------------------------------

                return (
                  <div key={feature.id} className="sp-row">
                    <span className="sp-em">{feature.sticker}</span>

                    <span className="sp-t">
                      <b>{feature.title}</b>
                      <small>{feature.description}</small>
                    </span>
                  </div>
                )
              })}
            </div>

            {/* Premium Note */}

            <p className="sp-note">
              Want more access? Choose a premium plan below to unlock
              1080p–4K streaming, downloads, and ad-free experience.
            </p>
          </div>

          {/* ========================================= */}
          {/* PAID PLANS */}
          {/* ========================================= */}

          <div className="sp-sec">
            <span className="sp-sec-ic">
              <Crown />
            </span>

            <div>
              <h3>Premium Plans</h3>
              <p>Choose a plan that works for you.</p>
            </div>
          </div>

          <div className="sp-list" style={{ marginTop: 0 }}>
            {paidPlans.map((plan) => {
              const isSelected = selected === plan.planId

              const isCurrent = activePaidPlan === plan.planId

              return (
                <button
                  key={plan.planId}
                  type="button"
                  role="radio"
                  aria-checked={isSelected}
                  onClick={() => setSelected(plan.planId)}
                  className={`sp-row sp-plan${isSelected ? " is-on" : ""}`}
                >
                  <span className="sp-em">{plan.sticker}</span>

                  <span className="sp-t">
                    <b>{plan.duration}</b>
                    <small>{plan.description}</small>

                    <span className="sp-chips">
                      {isCurrent && (
                        <span className="sp-chip mute">Current</span>
                      )}

                      <span className="sp-chip">
                        🎥 {plan.videoQuality}
                      </span>

                      {plan.popular && (
                        <span className="sp-chip solid">Popular</span>
                      )}

                      {plan.save && (
                        <span className="sp-chip mute">{plan.save}</span>
                      )}
                    </span>
                  </span>

                  <span className="sp-price">
                    <b>{plan.price}</b>

                    <span className="sp-radio" aria-hidden="true">
                      <Check />
                    </span>
                  </span>
                </button>
              )
            })}
          </div>

          {/* ========================================= */}
          {/* PAYMENT BOX */}
          {/* ========================================= */}

          {selectedPlan && (
            <div className="sp-pay">
              <div className="sp-pay-top">
                <div className="sp-gift">💳</div>

                <div className="min-w-0">
                  <p className="sp-card-title">Complete your payment</p>

                  <p className="sp-desc">
                    Send <strong>{selectedPlan.price}</strong> to{" "}
                    <strong style={{ color: "var(--ac)" }}>
                      {PAYMENT_NUMBER}
                    </strong>
                    .
                  </p>
                </div>
              </div>

              {/* Payment Number */}

              <div className="sp-num">
                <small>Payment Number</small>
                <b>{PAYMENT_NUMBER}</b>
              </div>

              {/* Transaction ID */}

              <label htmlFor="transaction-id" className="sp-lbl">
                Transaction ID
              </label>

              <input
                id="transaction-id"
                type="text"
                value={transactionId}
                onChange={(event) => setTransactionId(event.target.value)}
                placeholder="Enter your transaction ID"
                autoComplete="off"
                className="sp-input"
              />

              {/* Submit */}

              <button
                type="button"
                disabled={loading || !transactionId.trim()}
                onClick={() => void submitPayment()}
                className="sp-btn"
              >
                {loading ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Check className="size-4" />
                    Submit for Review
                  </>
                )}
              </button>

              <p className="sp-foot">
                Your premium access will be activated after admin review and
                approval.
              </p>
            </div>
          )}
        </div>
      </section>
    </div>,
    portalNode,
  )
}
