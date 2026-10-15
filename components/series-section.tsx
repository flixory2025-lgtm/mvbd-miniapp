"use client"

import {
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react"
import { createPortal } from "react-dom"

import { useAuth } from "@/components/auth-provider"
import { createPendingPaymentRequest } from "@/lib/payment-requests"

import {
  PAYMENT_NUMBER,
  SUBSCRIPTION_PLANS,
  type SubscriptionPlan,
  type FreeAccessItem,
} from "@/lib/subscription-plans"

type Plan = SubscriptionPlan

interface SeriesSectionProps {
  onOpenMeBook?: () => void
}

/* =========================================================
   CONSTANTS
========================================================= */

const MVBD_LOGO =
  "https://i.postimg.cc/cLtfLFRX/17773-removebg-preview.png"

const COMPARISON_FEATURES = [
  { icon: "📱", name: "Phone Logins", free: "∞", premium: "∞" },
  { icon: "🖥️", name: "Desktop Logins", free: "∞", premium: "∞" },
  { icon: "🌐", name: "Web Logins", free: "∞", premium: "∞" },
  { icon: "📺", name: "MVBD PM Channel Access", free: "Limited", premium: "∞" },
  { icon: "⚡", name: "Faster Downloads", free: false, premium: true },
  { icon: "🏆", name: "AnimeVerseBD", free: true, premium: true },
  { icon: "📖", name: "MeBook", free: true, premium: true },
  { icon: "🎥", name: "High Quality", free: false, premium: true },
  { icon: "🚫", name: "No Ads", free: false, premium: true },
  { icon: "📲", name: "MVBD Mini App", free: true, premium: true },
  { icon: "🎬", name: "Movie & Series Trailers", free: true, premium: true },
  { icon: "HD", name: "480p Quality", free: true, premium: true },
]

/* =========================================================
   BODY SCROLL LOCK (shared, ref-counted)
========================================================= */

let bodyLockCount = 0
let savedOverflow = ""
let savedTouchAction = ""
let savedPaddingRight = ""

function lockBodyScroll() {
  if (typeof document === "undefined") return
  if (bodyLockCount === 0) {
    const scrollbarWidth =
      window.innerWidth - document.documentElement.clientWidth

    savedOverflow = document.body.style.overflow
    savedTouchAction = document.body.style.touchAction
    savedPaddingRight = document.body.style.paddingRight

    document.body.style.overflow = "hidden"
    document.body.style.touchAction = "auto"
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`
    }
  }
  bodyLockCount += 1
}

function unlockBodyScroll() {
  if (typeof document === "undefined") return
  bodyLockCount = Math.max(0, bodyLockCount - 1)
  if (bodyLockCount === 0) {
    document.body.style.overflow = savedOverflow
    document.body.style.touchAction = savedTouchAction
    document.body.style.paddingRight = savedPaddingRight
  }
}

/* =========================================================
   VIEWPORT MODAL
========================================================= */

function ViewportModal({
  children,
  onBackdropClick,
}: {
  children: ReactNode
  onBackdropClick?: () => void
}) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    lockBodyScroll()
    return () => {
      unlockBodyScroll()
    }
  }, [])

  useEffect(() => {
    if (!onBackdropClick) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onBackdropClick()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [onBackdropClick])

  if (!mounted) return null

  return createPortal(
    <div
      className="mvbd-modal-backdrop"
      role="presentation"
      onClick={(event) => {
        if (
          event.target === event.currentTarget &&
          onBackdropClick
        ) {
          onBackdropClick()
        }
      }}
    >
      {children}
    </div>,
    document.body,
  )
}

/* =========================================================
   FEATURE VALUE
========================================================= */

function FeatureValue({
  value,
}: {
  value: boolean | string
}) {
  if (value === true) {
    return <span className="mvbd-feature-check">✓</span>
  }

  if (value === false) {
    return <span className="mvbd-feature-cross">×</span>
  }

  if (value === "∞") {
    return <span className="mvbd-feature-unlimited">∞</span>
  }

  return <span className="mvbd-feature-limited">{value}</span>
}

/* =========================================================
   MAIN
========================================================= */

export default function SeriesSection({
  onOpenMeBook,
}: SeriesSectionProps) {
  const { user, profile } = useAuth()

  const [activePlanId, setActivePlanId] = useState<string>(
    () =>
      (
        SUBSCRIPTION_PLANS.find((plan) => plan.popular) ||
        SUBSCRIPTION_PLANS[0]
      )?.planId || "",
  )
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null)
  const [showPayment, setShowPayment] = useState(false)
  const [showFreeAccess, setShowFreeAccess] = useState(false)
  const [showProcessing, setShowProcessing] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [transactionId, setTransactionId] = useState("")
  const [progress, setProgress] = useState(0)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState("")

  const processingTimerRef = useRef<number | null>(null)
  const successTimerRef = useRef<number | null>(null)
  const copyTimerRef = useRef<number | null>(null)

  const anyModalOpen =
    showPayment || showFreeAccess || showProcessing || showSuccess

  const activePlan: Plan | undefined =
    SUBSCRIPTION_PLANS.find((plan) => plan.planId === activePlanId) ||
    SUBSCRIPTION_PLANS[0]

  /* =======================================================
     CLEANUP
  ======================================================= */

  useEffect(() => {
    return () => {
      if (processingTimerRef.current) {
        window.clearInterval(processingTimerRef.current)
      }
      if (successTimerRef.current) {
        window.clearTimeout(successTimerRef.current)
      }
      if (copyTimerRef.current) {
        window.clearTimeout(copyTimerRef.current)
      }
    }
  }, [])

  /* =======================================================
     OPEN PLAN
  ======================================================= */

  const openPlan = (plan: Plan) => {
    setSelectedPlan(plan)
    setError("")
    setTransactionId("")
    setCopied(false)

    if (plan.planId === "trial") {
      setShowFreeAccess(true)
      setShowPayment(false)
      return
    }

    setShowPayment(true)
  }

  const closePayment = () => {
    setShowPayment(false)
    setError("")
  }

  const closeFreeAccess = () => {
    setShowFreeAccess(false)
  }

  /* =======================================================
     COPY PAYMENT NUMBER
  ======================================================= */

  const copyNumber = async () => {
    try {
      await navigator.clipboard.writeText(PAYMENT_NUMBER)
      setCopied(true)
      if (copyTimerRef.current) window.clearTimeout(copyTimerRef.current)
      copyTimerRef.current = window.setTimeout(
        () => setCopied(false),
        1800,
      )
    } catch {
      setCopied(false)
    }
  }

  /* =======================================================
     SUBMIT PAYMENT
  ======================================================= */

  const submitPayment = async () => {
    const trx = transactionId.trim()

    if (!user || !profile) {
      setError("Please sign in before submitting a payment request.")
      return
    }

    if (!trx || trx.length < 3) {
      setError("Please enter a valid transaction ID.")
      return
    }

    if (!selectedPlan) {
      setError("Please select a subscription plan.")
      return
    }

    if (selectedPlan.planId === "trial") {
      setError("The Free Plan does not require payment.")
      return
    }

    setError("")

    try {
      await createPendingPaymentRequest({
        user,
        profile,
        planId: selectedPlan.planId,
        transactionId: trx,
      })
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to submit your payment request.",
      )
      return
    }

    setShowPayment(false)
    setShowProcessing(true)
    setProgress(0)

    if (processingTimerRef.current) {
      window.clearInterval(processingTimerRef.current)
    }
    if (successTimerRef.current) {
      window.clearTimeout(successTimerRef.current)
    }

    const startTime = Date.now()
    const processingDuration = 9000

    processingTimerRef.current = window.setInterval(() => {
      const elapsed = Date.now() - startTime
      const percentage = Math.min(
        100,
        Math.round((elapsed / processingDuration) * 100),
      )
      setProgress(percentage)

      if (percentage >= 100) {
        if (processingTimerRef.current) {
          window.clearInterval(processingTimerRef.current)
        }
        successTimerRef.current = window.setTimeout(() => {
          setShowProcessing(false)
          setShowSuccess(true)
        }, 500)
      }
    }, 200)
  }

  const closeSuccess = () => {
    setShowSuccess(false)
    setSelectedPlan(null)
    setTransactionId("")
    setProgress(0)
    setError("")
  }

  /* =======================================================
     FREE ACCESS HANDLER
  ======================================================= */

  const handleFreeAccess = (item: FreeAccessItem) => {
    if (item.type === "mebook") {
      setShowFreeAccess(false)
      onOpenMeBook?.()
    }
  }

  const isRestrictedFreeItem = (item: FreeAccessItem) => {
    const title = String(item.title || "").toLowerCase()
    const id = String(item.id || "").toLowerCase()

    return (
      item.type === "restricted" ||
      (title.includes("18+") && !item.href) ||
      (title.includes("18 +") && !item.href) ||
      (title.includes("adult") && !item.href) ||
      (title.includes("age-restricted") && !item.href) ||
      (title.includes("age restricted") && !item.href) ||
      (id.includes("18") && !item.href) ||
      (id.includes("adult") && !item.href)
    )
  }

  /* =======================================================
     CARD HELPERS
  ======================================================= */

  const getPlanLabel = (plan: Plan) => {
    if (plan.planId === "trial") return "FREE"
    if (plan.planId === "monthly") return "1 MONTH"
    if (plan.planId === "two_months") return "2 MONTHS"
    if (plan.planId === "three_months") return "3 MONTHS"
    return plan.planName
  }

  const getPlanDuration = (plan: Plan) => {
    if (plan.planId === "trial") return "BASIC ACCESS"
    if (plan.planId === "monthly") return "30 DAYS"
    if (plan.planId === "two_months") return "60 DAYS"
    if (plan.planId === "three_months") return "90 DAYS"
    return "PREMIUM ACCESS"
  }

  const getCtaLabel = (plan: Plan) =>
    plan.planId === "trial" ? "Explore Free Access" : "Next"

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <>
      <main
        className={`mvbd-premium-page${
          anyModalOpen ? " is-modal-open" : ""
        }`}
      >
        {/* Background */}
        <div className="mvbd-page-background">
          <div className="mvbd-glow mvbd-glow-top" />
          <div className="mvbd-glow mvbd-glow-bottom" />
          <div className="mvbd-grain" />
        </div>

        <div className="mvbd-page-content">
          {/* HEADER */}
          <header className="mvbd-premium-header">
            <div className="mvbd-brand">
              <div className="mvbd-brand-logo-wrap">
                <img
                  src={MVBD_LOGO}
                  alt="MoviesVerseBD"
                  className="mvbd-brand-logo"
                />
              </div>
              <div className="mvbd-brand-text">
                <strong>MoviesVerseBD</strong>
                <span>Premium Membership</span>
              </div>
            </div>
            <div className="mvbd-status">
              <span className="mvbd-status-dot" />
              PREMIUM
            </div>
          </header>

          {/* HERO */}
          <section className="mvbd-premium-hero">
            <p className="mvbd-step">Step 1 of 2</p>
            <h1>
              <span className="mvbd-title-silver">Choose Your</span>{" "}
              <span className="mvbd-title-green">Premium Plan</span>
            </h1>
            <p className="mvbd-hero-sub">
              Unlock a better MoviesVerseBD experience with flexible
              membership plans. Cancel the hassle, pick what fits you.
            </p>
          </section>

          {/* PLAN SELECTOR (Netflix style) */}
          <section className="mvbd-plan-select" aria-label="Plans">
            <div
              className="mvbd-plan-options"
              role="radiogroup"
              aria-label="Choose a plan"
            >
              {SUBSCRIPTION_PLANS.map((plan) => {
                const isFree = plan.planId === "trial"
                const isActive = plan.planId === activePlanId

                return (
                  <button
                    key={plan.planId}
                    type="button"
                    role="radio"
                    aria-checked={isActive}
                    className={[
                      "mvbd-option",
                      isActive ? "is-active" : "",
                      plan.popular ? "is-popular" : "",
                    ].join(" ")}
                    onClick={() => setActivePlanId(plan.planId)}
                  >
                    {plan.popular && (
                      <span className="mvbd-option-badge">
                        Most Popular
                      </span>
                    )}

                    <span className="mvbd-option-top">
                      <span className="mvbd-option-icon">
                        {plan.sticker || "✦"}
                      </span>
                      <span className="mvbd-option-name">
                        <small>MoviesVerseBD</small>
                        <strong>{getPlanLabel(plan)}</strong>
                      </span>
                      <span className="mvbd-radio" aria-hidden="true">
                        <i />
                      </span>
                    </span>

                    <span className="mvbd-option-price">
                      {isFree ? "FREE" : plan.price}
                    </span>

                    <span className="mvbd-option-meta">
                      <span className="mvbd-pill">
                        {getPlanDuration(plan)}
                      </span>
                      <span className="mvbd-option-quality">
                        🎥 {plan.videoQuality}
                      </span>
                    </span>
                  </button>
                )
              })}
            </div>
          </section>

          {/* PLAN DETAILS */}
          {activePlan && (
            <section className="mvbd-details" aria-live="polite">
              <div className="mvbd-panel">
                <div className="mvbd-panel-head">
                  <div className="mvbd-ps-badge">
                    <img src={MVBD_LOGO} alt="" />
                  </div>
                  <div>
                    <h2>
                      <span className="mvbd-title-silver">Plan</span>{" "}
                      <span className="mvbd-title-green">Details</span>
                    </h2>
                    <p>
                      {getPlanLabel(activePlan)} •{" "}
                      {activePlan.planId === "trial"
                        ? "FREE"
                        : activePlan.price}
                    </p>
                  </div>
                </div>

                <div className="mvbd-detail-rows">
                  <div className="mvbd-detail-row">
                    <span>Price</span>
                    <strong>
                      {activePlan.planId === "trial"
                        ? "FREE"
                        : activePlan.price}
                    </strong>
                  </div>
                  <div className="mvbd-detail-row">
                    <span>Access</span>
                    <strong>{getPlanDuration(activePlan)}</strong>
                  </div>
                  <div className="mvbd-detail-row">
                    <span>Video quality</span>
                    <strong>{activePlan.videoQuality}</strong>
                  </div>
                </div>

                <ul className="mvbd-feature-list">
                  {(activePlan.features || []).map((feature, index) => (
                    <li
                      key={`${activePlan.planId}-${index}`}
                      className={
                        feature.type === "locked" ||
                        feature.type === "restricted"
                          ? "locked"
                          : ""
                      }
                    >
                      <span
                        className={
                          feature.type === "locked"
                            ? "feature-cross"
                            : feature.type === "restricted"
                              ? "feature-restricted"
                              : feature.type === "quality"
                                ? "feature-quality"
                                : "feature-check"
                        }
                      >
                        {feature.type === "locked"
                          ? "🔒"
                          : feature.type === "restricted"
                            ? "🔞"
                            : feature.type === "quality"
                              ? "🎥"
                              : "✓"}
                      </span>
                      <span className="feature-text">
                        {feature.text}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </section>
          )}

          {/* FEATURES COMPARISON */}
          <section className="mvbd-features-section">
            <div className="mvbd-features-heading">
              <div>
                <h2>
                  <span className="mvbd-title-silver">Compare</span>{" "}
                  <span className="mvbd-title-green">Features</span>
                </h2>
                <p>
                  Compare what you get with Free and Premium access.
                </p>
              </div>
              <div className="mvbd-features-crown">
                <span>♛</span>
                PREMIUM
              </div>
            </div>

            <div className="mvbd-comparison">
              <div className="mvbd-comparison-feature-column">
                <div className="mvbd-comparison-title">Features</div>
                {COMPARISON_FEATURES.map((feature) => (
                  <div
                    className="mvbd-comparison-feature"
                    key={feature.name}
                  >
                    <span className="mvbd-feature-icon">
                      {feature.icon}
                    </span>
                    <span>{feature.name}</span>
                  </div>
                ))}
              </div>

              <div className="mvbd-comparison-plan mvbd-free-column">
                <div className="mvbd-comparison-plan-title">
                  <span>FREE</span>
                </div>
                {COMPARISON_FEATURES.map((feature) => (
                  <div
                    className="mvbd-comparison-value"
                    key={`free-${feature.name}`}
                  >
                    <FeatureValue value={feature.free} />
                  </div>
                ))}
              </div>

              <div className="mvbd-comparison-plan mvbd-premium-column">
                <div className="mvbd-comparison-plan-title">
                  <span>✦ PRO</span>
                </div>
                {COMPARISON_FEATURES.map((feature) => (
                  <div
                    className="mvbd-comparison-value"
                    key={`premium-${feature.name}`}
                  >
                    <FeatureValue value={feature.premium} />
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* PAYMENT INFO */}
          <section className="mvbd-payment-info">
            <div className="mvbd-info-icon">৳</div>
            <div>
              <strong>Secure Payment</strong>
              <span>
                Paid plans are activated after transaction verification.
              </span>
            </div>
            <div className="mvbd-secure-badge">VERIFIED</div>
          </section>

          {/* FOOTER */}
          <footer className="mvbd-premium-footer">
            <div className="mvbd-footer-logo">
              <img src={MVBD_LOGO} alt="" />
            </div>
            <span>MoviesVerseBD • MVBD Premium Membership</span>
          </footer>
        </div>

        {/* STICKY CHECKOUT BAR */}
        {activePlan && (
          <div className="mvbd-checkout-bar">
            <div className="mvbd-checkout-inner">
              <div className="mvbd-checkout-summary">
                <small>Selected plan</small>
                <strong>
                  {getPlanLabel(activePlan)} •{" "}
                  {activePlan.planId === "trial"
                    ? "FREE"
                    : activePlan.price}
                </strong>
              </div>
              <button
                type="button"
                className="mvbd-next-pill"
                onClick={() => openPlan(activePlan)}
              >
                {getCtaLabel(activePlan)}
              </button>
            </div>
          </div>
        )}

        {/* =================================================
            GLOBAL CSS
        ================================================= */}

        <style jsx global>{`
          @import url("https://fonts.googleapis.com/css2?family=Raleway:wght@500;600;700;800;900&display=swap");

          :root {
            --mv-green: #3cf25c;
            --mv-green-deep: #14b83a;
            --mv-green-soft: rgba(60, 242, 92, 0.12);
            --mv-red: #ff2f45;
            --mv-bg: #020403;
            --mv-text: #f4f6f4;
            --mv-muted: rgba(255, 255, 255, 0.55);
            --mv-font: "Raleway", "Inter", system-ui, -apple-system,
              "Segoe UI", Roboto, sans-serif;
          }

          * {
            box-sizing: border-box;
          }

          html,
          body {
            margin: 0;
            padding: 0;
            background: var(--mv-bg);
          }

          button,
          input {
            font: inherit;
          }

          .mvbd-premium-page {
            position: relative;
            min-height: 100svh;
            width: 100%;
            overflow-x: hidden;
            background: var(--mv-bg);
            color: var(--mv-text);
            font-family: var(--mv-font);
            isolation: isolate;
          }

          .mvbd-premium-page.is-modal-open .mvbd-status-dot {
            animation-play-state: paused !important;
          }

          /* ---------- BACKGROUND ---------- */
          .mvbd-page-background {
            position: fixed;
            inset: 0;
            z-index: -5;
            overflow: hidden;
            pointer-events: none;
            background: #020403;
          }

          .mvbd-glow {
            position: absolute;
            left: 50%;
            transform: translateX(-50%);
            border-radius: 50%;
            filter: blur(60px);
          }

          .mvbd-glow-top {
            top: -320px;
            width: 900px;
            height: 520px;
            background: radial-gradient(
              ellipse,
              rgba(30, 190, 60, 0.42),
              transparent 70%
            );
          }

          .mvbd-glow-bottom {
            bottom: -340px;
            width: 1000px;
            height: 480px;
            background: radial-gradient(
              ellipse,
              rgba(30, 190, 60, 0.3),
              transparent 70%
            );
          }

          .mvbd-grain {
            position: absolute;
            inset: 0;
            opacity: 0.05;
            background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 180 180' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='.7'/%3E%3C/svg%3E");
          }

          .mvbd-page-content {
            position: relative;
            z-index: 2;
            width: min(1120px, calc(100% - 36px));
            margin: 0 auto;
            padding: 18px 0 150px;
          }

          /* ---------- SHARED: curved outline (reference style) ---------- */
          .mvbd-option,
          .mvbd-panel,
          .mvbd-comparison,
          .mvbd-payment-info {
            position: relative;
          }

          .mvbd-option::before,
          .mvbd-panel::before,
          .mvbd-comparison::before,
          .mvbd-payment-info::before {
            content: "";
            position: absolute;
            inset: 0;
            border-radius: inherit;
            padding: 1.5px;
            background: linear-gradient(
              135deg,
              var(--mv-green) 0%,
              rgba(60, 242, 92, 0) 32%,
              rgba(60, 242, 92, 0) 68%,
              var(--mv-green) 100%
            );
            -webkit-mask: linear-gradient(#000 0 0) content-box,
              linear-gradient(#000 0 0);
            -webkit-mask-composite: xor;
            mask: linear-gradient(#000 0 0) content-box exclude,
              linear-gradient(#000 0 0);
            pointer-events: none;
            opacity: 0.85;
          }

          /* ---------- TITLES (white/silver + green like reference) ---------- */
          .mvbd-title-silver {
            background: linear-gradient(180deg, #ffffff, #9aa09a);
            -webkit-background-clip: text;
            background-clip: text;
            -webkit-text-fill-color: transparent;
          }

          .mvbd-title-green {
            background: linear-gradient(180deg, #6dff86, #1fd04a);
            -webkit-background-clip: text;
            background-clip: text;
            -webkit-text-fill-color: transparent;
            filter: drop-shadow(0 0 18px rgba(60, 242, 92, 0.35));
          }

          /* ---------- HEADER ---------- */
          .mvbd-premium-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 20px;
            padding: 11px 16px;
            border: 1px solid rgba(60, 242, 92, 0.16);
            border-radius: 20px;
            background: rgba(4, 8, 5, 0.7);
            backdrop-filter: blur(18px);
            -webkit-backdrop-filter: blur(18px);
          }

          .mvbd-brand {
            display: flex;
            align-items: center;
            gap: 11px;
          }

          .mvbd-brand-logo-wrap {
            width: 43px;
            height: 43px;
            display: grid;
            place-items: center;
            border-radius: 13px;
            background: rgba(60, 242, 92, 0.07);
            border: 1px solid rgba(60, 242, 92, 0.25);
            box-shadow: 0 0 24px rgba(60, 242, 92, 0.18);
            overflow: hidden;
          }

          .mvbd-brand-logo {
            width: 35px;
            height: 35px;
            object-fit: contain;
            display: block;
          }

          .mvbd-brand-text strong {
            display: block;
            font-size: 14px;
            font-weight: 800;
          }

          .mvbd-brand-text span {
            display: block;
            margin-top: 3px;
            color: var(--mv-muted);
            font-size: 10px;
            font-weight: 600;
          }

          .mvbd-status {
            display: flex;
            align-items: center;
            gap: 7px;
            padding: 7px 13px;
            border-radius: 999px;
            color: var(--mv-green);
            background: var(--mv-green-soft);
            border: 1px solid rgba(60, 242, 92, 0.3);
            font-size: 10px;
            font-weight: 800;
            letter-spacing: 0.8px;
          }

          .mvbd-status-dot {
            width: 6px;
            height: 6px;
            border-radius: 50%;
            background: var(--mv-green);
            box-shadow: 0 0 12px var(--mv-green);
            animation: mvbdStatusPulse 2s ease-in-out infinite;
          }

          /* ---------- HERO ---------- */
          .mvbd-premium-hero {
            text-align: center;
            padding: 64px 8px 38px;
          }

          .mvbd-step {
            margin: 0 0 12px;
            color: var(--mv-muted);
            font-size: 12px;
            font-weight: 600;
          }

          .mvbd-premium-hero h1 {
            margin: 0;
            font-size: clamp(36px, 6.2vw, 68px);
            line-height: 1.04;
            letter-spacing: -2px;
            font-weight: 800;
          }

          .mvbd-hero-sub {
            max-width: 520px;
            margin: 18px auto 0;
            color: var(--mv-muted);
            font-size: 13px;
            line-height: 1.7;
            font-weight: 500;
          }

          /* ---------- PLAN OPTIONS ---------- */
          .mvbd-plan-options {
            display: grid;
            grid-template-columns: repeat(4, minmax(0, 1fr));
            gap: 14px;
          }

          .mvbd-option {
            display: flex;
            flex-direction: column;
            align-items: stretch;
            gap: 0;
            min-width: 0;
            padding: 20px 18px 18px;
            text-align: left;
            color: inherit;
            cursor: pointer;
            border: 0;
            border-radius: 26px 26px 26px 26px;
            background: linear-gradient(
              150deg,
              rgba(14, 22, 16, 0.92),
              rgba(3, 6, 4, 0.96)
            );
            transition: transform 0.2s ease, box-shadow 0.2s ease,
              background 0.2s ease;
            touch-action: manipulation;
            -webkit-tap-highlight-color: transparent;
          }

          .mvbd-option:hover {
            transform: translateY(-3px);
          }

          .mvbd-option:focus-visible,
          .mvbd-next-pill:focus-visible,
          .mvbd-access-button:focus-visible {
            outline: 2px solid var(--mv-green);
            outline-offset: 3px;
          }

          .mvbd-option.is-active {
            background: linear-gradient(
              150deg,
              rgba(24, 70, 32, 0.85),
              rgba(4, 14, 6, 0.97)
            );
            box-shadow: 0 0 0 1.5px var(--mv-green),
              0 0 44px rgba(60, 242, 92, 0.22);
          }

          .mvbd-option.is-active::before {
            opacity: 0;
          }

          .mvbd-option-badge {
            position: absolute;
            top: -11px;
            left: 50%;
            transform: translateX(-50%);
            padding: 5px 13px;
            border-radius: 999px;
            white-space: nowrap;
            color: #03110a;
            background: linear-gradient(135deg, #7dff93, #22d24d);
            font-size: 10px;
            font-weight: 800;
            box-shadow: 0 0 22px rgba(60, 242, 92, 0.45);
            z-index: 2;
          }

          .mvbd-option-top {
            display: flex;
            align-items: center;
            gap: 11px;
          }

          .mvbd-option-icon {
            width: 44px;
            height: 44px;
            flex: 0 0 44px;
            display: grid;
            place-items: center;
            border-radius: 13px;
            font-size: 21px;
            color: var(--mv-green);
            background: var(--mv-green-soft);
            border: 1px solid rgba(60, 242, 92, 0.25);
          }

          .mvbd-option-name {
            flex: 1;
            min-width: 0;
          }

          .mvbd-option-name small {
            display: block;
            color: var(--mv-muted);
            font-size: 9px;
            font-weight: 600;
          }

          .mvbd-option-name strong {
            display: block;
            margin-top: 3px;
            font-size: 17px;
            font-weight: 800;
          }

          .mvbd-radio {
            width: 22px;
            height: 22px;
            flex: 0 0 22px;
            display: grid;
            place-items: center;
            border-radius: 50%;
            border: 2px solid rgba(255, 255, 255, 0.3);
            transition: border-color 0.2s ease;
          }

          .mvbd-radio i {
            width: 10px;
            height: 10px;
            border-radius: 50%;
            background: var(--mv-green);
            box-shadow: 0 0 10px var(--mv-green);
            transform: scale(0);
            transition: transform 0.2s ease;
          }

          .mvbd-option.is-active .mvbd-radio {
            border-color: var(--mv-green);
          }

          .mvbd-option.is-active .mvbd-radio i {
            transform: scale(1);
          }

          .mvbd-option-price {
            display: block;
            margin-top: 28px;
            font-size: 38px;
            line-height: 1;
            font-weight: 900;
            letter-spacing: -1.5px;
            color: #ffffff;
          }

          .mvbd-option-meta {
            display: flex;
            flex-direction: column;
            align-items: flex-start;
            gap: 9px;
            margin-top: 16px;
          }

          .mvbd-pill {
            padding: 6px 12px;
            border-radius: 999px;
            color: var(--mv-green);
            background: var(--mv-green-soft);
            border: 1px solid rgba(60, 242, 92, 0.22);
            font-size: 10px;
            font-weight: 800;
          }

          .mvbd-option-quality {
            color: var(--mv-muted);
            font-size: 12px;
            font-weight: 600;
          }

          /* ---------- DETAILS PANEL ---------- */
          .mvbd-details {
            margin-top: 38px;
          }

          .mvbd-panel {
            padding: 26px 24px 20px;
            border-radius: 30px;
            background: linear-gradient(
              150deg,
              rgba(8, 14, 10, 0.92),
              rgba(2, 4, 3, 0.97)
            );
          }

          .mvbd-panel-head {
            display: flex;
            align-items: center;
            gap: 14px;
          }

          .mvbd-ps-badge {
            width: 48px;
            height: 48px;
            flex: 0 0 48px;
            display: grid;
            place-items: center;
            border-radius: 14px;
            background: rgba(60, 242, 92, 0.12);
            border: 1px solid rgba(60, 242, 92, 0.5);
            box-shadow: 0 0 28px rgba(60, 242, 92, 0.4);
          }

          .mvbd-ps-badge img {
            width: 32px;
            height: 32px;
            object-fit: contain;
          }

          .mvbd-panel-head h2 {
            margin: 0;
            font-size: clamp(24px, 4vw, 32px);
            font-weight: 800;
            letter-spacing: -1px;
            line-height: 1.1;
          }

          .mvbd-panel-head p {
            margin: 5px 0 0;
            color: var(--mv-muted);
            font-size: 12px;
            font-weight: 600;
          }

          .mvbd-detail-rows {
            margin-top: 20px;
            border-top: 1px solid rgba(255, 255, 255, 0.08);
          }

          .mvbd-detail-row {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 16px;
            padding: 14px 0;
            border-bottom: 1px solid rgba(255, 255, 255, 0.08);
            font-size: 13px;
          }

          .mvbd-detail-row span {
            color: var(--mv-muted);
            font-weight: 600;
          }

          .mvbd-detail-row strong {
            font-weight: 800;
            text-align: right;
          }

          .mvbd-feature-list {
            list-style: none;
            margin: 14px 0 0;
            padding: 0;
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            column-gap: 28px;
          }

          .mvbd-feature-list li {
            display: flex;
            align-items: flex-start;
            gap: 11px;
            padding: 10px 0;
            color: rgba(255, 255, 255, 0.82);
            font-size: 13px;
            line-height: 1.45;
            font-weight: 500;
          }

          .mvbd-feature-list li.locked {
            color: rgba(255, 255, 255, 0.38);
          }

          .mvbd-feature-list li > span:first-child {
            width: 20px;
            height: 20px;
            flex: 0 0 20px;
            display: grid;
            place-items: center;
            margin-top: 1px;
            border-radius: 50%;
            font-size: 10px;
            font-weight: 900;
          }

          .feature-check,
          .feature-quality {
            color: #03110a;
            background: var(--mv-green);
            box-shadow: 0 0 12px rgba(60, 242, 92, 0.4);
          }

          .feature-cross {
            color: #ff7d86;
            background: rgba(255, 47, 69, 0.1);
            border: 1px solid rgba(255, 47, 69, 0.25);
          }

          .feature-restricted {
            color: #ffffff;
            background: #b3202f;
          }

          .mvbd-feature-list .feature-text {
            flex: 1;
          }

          /* ---------- COMPARISON ---------- */
          .mvbd-features-section {
            margin-top: 64px;
          }

          .mvbd-features-heading {
            display: flex;
            align-items: flex-end;
            justify-content: space-between;
            gap: 20px;
            margin-bottom: 20px;
          }

          .mvbd-features-heading h2 {
            margin: 0;
            font-size: clamp(26px, 4.4vw, 40px);
            font-weight: 800;
            letter-spacing: -1.2px;
            line-height: 1.05;
          }

          .mvbd-features-heading p {
            margin: 8px 0 0;
            color: var(--mv-muted);
            font-size: 12px;
            font-weight: 500;
          }

          .mvbd-features-crown {
            display: flex;
            align-items: center;
            gap: 7px;
            padding: 8px 12px;
            border-radius: 999px;
            color: var(--mv-green);
            background: var(--mv-green-soft);
            border: 1px solid rgba(60, 242, 92, 0.25);
            font-size: 10px;
            font-weight: 800;
            letter-spacing: 0.8px;
          }

          .mvbd-features-crown span {
            font-size: 14px;
          }

          .mvbd-comparison {
            display: grid;
            grid-template-columns: minmax(220px, 1fr) 105px 105px;
            overflow: hidden;
            border-radius: 28px;
            background: rgba(4, 8, 5, 0.8);
          }

          .mvbd-comparison-feature-column,
          .mvbd-comparison-plan {
            min-width: 0;
          }

          .mvbd-comparison-plan {
            border-left: 1px solid rgba(255, 255, 255, 0.06);
          }

          .mvbd-premium-column {
            background: linear-gradient(
              180deg,
              rgba(60, 242, 92, 0.12),
              rgba(60, 242, 92, 0.02)
            );
          }

          .mvbd-comparison-title,
          .mvbd-comparison-plan-title {
            height: 62px;
            display: flex;
            align-items: center;
            font-size: 12px;
            font-weight: 800;
          }

          .mvbd-comparison-title {
            padding: 0 20px;
            color: var(--mv-muted);
          }

          .mvbd-comparison-plan-title {
            justify-content: center;
            color: rgba(255, 255, 255, 0.65);
          }

          .mvbd-premium-column .mvbd-comparison-plan-title {
            color: var(--mv-green);
          }

          .mvbd-comparison-feature {
            min-height: 60px;
            display: flex;
            align-items: center;
            gap: 11px;
            padding: 0 20px;
            border-top: 1px solid rgba(255, 255, 255, 0.06);
            color: rgba(255, 255, 255, 0.82);
            font-size: 12px;
            font-weight: 600;
          }

          .mvbd-feature-icon {
            width: 28px;
            height: 28px;
            flex: 0 0 28px;
            display: grid;
            place-items: center;
            border-radius: 9px;
            background: var(--mv-green-soft);
            border: 1px solid rgba(60, 242, 92, 0.18);
            font-size: 12px;
            text-align: center;
          }

          .mvbd-comparison-value {
            min-height: 60px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-top: 1px solid rgba(255, 255, 255, 0.06);
          }

          .mvbd-feature-check,
          .mvbd-feature-cross,
          .mvbd-feature-unlimited,
          .mvbd-feature-limited {
            min-width: 29px;
            height: 29px;
            display: grid;
            place-items: center;
            border-radius: 50%;
            font-size: 13px;
            font-weight: 900;
          }

          .mvbd-feature-check {
            color: #03110a;
            background: var(--mv-green);
            box-shadow: 0 0 16px rgba(60, 242, 92, 0.35);
          }

          .mvbd-feature-cross {
            color: rgba(255, 255, 255, 0.3);
            background: rgba(255, 255, 255, 0.05);
          }

          .mvbd-feature-unlimited {
            color: #03110a;
            background: linear-gradient(135deg, #7dff93, #22d24d);
            font-size: 17px;
          }

          .mvbd-feature-limited {
            width: auto;
            min-width: 58px;
            height: 26px;
            padding: 0 9px;
            border-radius: 999px;
            color: var(--mv-green);
            background: var(--mv-green-soft);
            border: 1px solid rgba(60, 242, 92, 0.22);
            font-size: 8px;
            letter-spacing: 0.4px;
            text-transform: uppercase;
          }

          /* ---------- PAYMENT INFO ---------- */
          .mvbd-payment-info {
            display: flex;
            align-items: center;
            gap: 13px;
            max-width: 720px;
            margin: 32px auto 0;
            padding: 16px 18px;
            border-radius: 22px;
            background: rgba(6, 10, 7, 0.8);
          }

          .mvbd-info-icon {
            width: 40px;
            height: 40px;
            display: grid;
            place-items: center;
            flex: 0 0 40px;
            border-radius: 50%;
            color: #fff;
            background: var(--mv-red);
            box-shadow: 0 0 22px rgba(255, 47, 69, 0.5);
            font-weight: 800;
          }

          .mvbd-payment-info strong {
            display: block;
            font-size: 13px;
            font-weight: 800;
          }

          .mvbd-payment-info span {
            display: block;
            margin-top: 3px;
            color: var(--mv-muted);
            font-size: 11px;
            font-weight: 500;
          }

          .mvbd-secure-badge {
            margin-left: auto;
            padding: 6px 10px;
            border-radius: 999px;
            color: var(--mv-green);
            background: var(--mv-green-soft);
            border: 1px solid rgba(60, 242, 92, 0.25);
            font-size: 9px;
            font-weight: 800;
            letter-spacing: 0.6px;
          }

          .mvbd-premium-footer {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            margin-top: 34px;
            color: rgba(255, 255, 255, 0.3);
            font-size: 10px;
            font-weight: 600;
          }

          .mvbd-footer-logo {
            width: 23px;
            height: 23px;
            display: grid;
            place-items: center;
            border-radius: 7px;
            background: rgba(255, 255, 255, 0.04);
          }

          .mvbd-footer-logo img {
            width: 18px;
            height: 18px;
            object-fit: contain;
          }

          /* =======================================================
             STICKY CHECKOUT BAR (সংশোধিত)
             ======================================================= */
          .mvbd-checkout-bar {
            position: fixed;
            left: 0;
            right: 0;
            /* ডেস্কটপের জন্য নেভিগেশন বারের উপরে জায়গা */
            bottom: 85px; 
            z-index: 50;
            padding: 14px 18px calc(14px + env(safe-area-inset-bottom, 0px));
            background: linear-gradient(
              180deg,
              rgba(2, 4, 3, 0),
              rgba(2, 4, 3, 0.92) 38%
            );
            pointer-events: none;
          }

          .mvbd-checkout-inner {
            width: min(720px, 100%);
            margin: 0 auto;
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 14px;
            padding: 10px 10px 10px 20px;
            border-radius: 999px;
            border: 1px solid rgba(60, 242, 92, 0.25);
            background: rgba(4, 8, 5, 0.88);
            backdrop-filter: blur(14px);
            -webkit-backdrop-filter: blur(14px);
            pointer-events: auto;
          }

          .mvbd-checkout-summary {
            min-width: 0;
          }

          .mvbd-checkout-summary small {
            display: block;
            color: var(--mv-muted);
            font-size: 10px;
            font-weight: 600;
          }

          .mvbd-checkout-summary strong {
            display: block;
            margin-top: 2px;
            font-size: 14px;
            font-weight: 800;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }

          .mvbd-next-pill {
            min-width: 150px;
            min-height: 50px;
            padding: 0 28px;
            border: 0;
            border-radius: 999px;
            color: #fff;
            cursor: pointer;
            font-size: 15px;
            font-weight: 800;
            background: radial-gradient(
              ellipse at 50% 20%,
              #ff5a6b,
              var(--mv-red) 60%,
              #d81a30
            );
            box-shadow: 0 0 34px rgba(255, 47, 69, 0.55),
              inset 0 1px 0 rgba(255, 255, 255, 0.25);
            transition: transform 0.15s ease, filter 0.15s ease;
            touch-action: manipulation;
            -webkit-tap-highlight-color: transparent;
          }

          .mvbd-next-pill:hover {
            filter: brightness(1.08);
          }

          .mvbd-next-pill:active {
            transform: scale(0.97);
          }

          /* ---------- MODALS ---------- */
          .mvbd-modal-backdrop {
            position: fixed;
            inset: 0;
            z-index: 99999;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 18px;
            background: rgba(1, 3, 2, 0.84);
            backdrop-filter: blur(6px);
            -webkit-backdrop-filter: blur(6px);
            animation: mvbdModalIn 0.22s ease both;
            overscroll-behavior: contain;
            font-family: var(--mv-font);
          }

          @media (max-width: 700px) {
            .mvbd-modal-backdrop {
              backdrop-filter: none;
              -webkit-backdrop-filter: none;
              background: rgba(1, 3, 2, 0.93);
            }
          }

          .mvbd-modal {
            position: relative;
            width: min(440px, 100%);
            max-height: min(88svh, 700px);
            overflow-y: auto;
            padding: 27px;
            color: #fff;
            border-radius: 26px;
            border: 1px solid rgba(60, 242, 92, 0.3);
            background: linear-gradient(145deg, #0b150e, #030604);
            box-shadow: 0 35px 100px rgba(0, 0, 0, 0.85),
              0 0 60px rgba(60, 242, 92, 0.12);
            animation: mvbdModalScale 0.26s cubic-bezier(0.2, 0.8, 0.2, 1) both;
            overscroll-behavior: contain;
            -webkit-overflow-scrolling: touch;
          }

          .mvbd-modal::-webkit-scrollbar {
            width: 4px;
          }
          .mvbd-modal::-webkit-scrollbar-thumb {
            background: rgba(60, 242, 92, 0.35);
            border-radius: 99px;
          }

          .mvbd-modal-title {
            color: #f6f8f6;
            font-size: 20px;
            font-weight: 800;
          }

          .mvbd-modal-subtitle {
            margin: 8px 0 0;
            color: var(--mv-muted);
            font-size: 12px;
            line-height: 1.65;
            font-weight: 500;
          }

          .mvbd-modal-close {
            float: right;
            width: 32px;
            height: 32px;
            border: 0;
            border-radius: 50%;
            color: rgba(255, 255, 255, 0.7);
            background: rgba(255, 255, 255, 0.07);
            cursor: pointer;
            font-size: 17px;
          }

          .mvbd-free-access-list {
            display: grid;
            gap: 9px;
            margin-top: 20px;
          }

          .mvbd-access-button {
            width: 100%;
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 13px;
            border: 1px solid rgba(255, 255, 255, 0.08);
            border-radius: 16px;
            background: rgba(255, 255, 255, 0.035);
            color: #ffffff;
            text-align: left;
            text-decoration: none;
            cursor: pointer;
            transition: background 0.2s ease, border-color 0.2s ease;
          }

          .mvbd-access-button:hover {
            background: var(--mv-green-soft);
            border-color: rgba(60, 242, 92, 0.35);
          }

          .mvbd-access-icon {
            width: 38px;
            height: 38px;
            flex: 0 0 38px;
            display: grid;
            place-items: center;
            border-radius: 11px;
            color: var(--mv-green);
            background: var(--mv-green-soft);
          }

          .mvbd-access-text {
            flex: 1;
            min-width: 0;
          }

          .mvbd-access-text strong {
            display: block;
            font-size: 13px;
            font-weight: 800;
          }

          .mvbd-access-text span {
            display: block;
            margin-top: 3px;
            color: var(--mv-muted);
            font-size: 11px;
            line-height: 1.4;
          }

          .mvbd-access-arrow {
            color: var(--mv-green);
            font-size: 16px;
          }

          .mvbd-access-info {
            cursor: default;
          }
          .mvbd-access-info:hover {
            background: rgba(255, 255, 255, 0.035);
            border-color: rgba(255, 255, 255, 0.08);
          }
          .mvbd-access-restricted {
            cursor: not-allowed;
            opacity: 0.55;
          }

          .mvbd-not-included {
            margin-top: 22px;
            padding-top: 17px;
            border-top: 1px solid rgba(255, 255, 255, 0.08);
          }

          .mvbd-not-included-title {
            margin-bottom: 11px;
            color: var(--mv-muted);
            font-size: 11px;
            font-weight: 800;
          }

          .mvbd-not-included ul {
            margin: 0;
            padding: 0;
            list-style: none;
            display: grid;
            gap: 7px;
          }

          .mvbd-not-included li {
            color: rgba(255, 255, 255, 0.4);
            font-size: 12px;
          }

          .mvbd-not-included li::before {
            content: "×";
            margin-right: 8px;
            color: var(--mv-red);
          }

          .mvbd-selected-plan {
            margin-top: 18px;
            padding: 15px;
            border-radius: 16px;
            background: var(--mv-green-soft);
            border: 1px solid rgba(60, 242, 92, 0.25);
          }

          .mvbd-selected-plan small {
            display: block;
            color: var(--mv-muted);
            font-size: 10px;
            font-weight: 700;
          }

          .mvbd-selected-plan strong {
            display: block;
            margin-top: 6px;
            color: var(--mv-green);
            font-size: 15px;
            font-weight: 800;
          }

          .mvbd-payment-number {
            margin-top: 15px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 10px;
            padding: 13px;
            border-radius: 14px;
            background: rgba(255, 255, 255, 0.035);
            border: 1px solid rgba(255, 255, 255, 0.08);
          }

          .mvbd-payment-number strong {
            color: #ffffff;
            font-size: 15px;
            font-weight: 800;
          }

          .mvbd-copy-button {
            border: 1px solid rgba(60, 242, 92, 0.3);
            border-radius: 9px;
            padding: 7px 12px;
            color: var(--mv-green);
            background: var(--mv-green-soft);
            cursor: pointer;
            font-size: 11px;
            font-weight: 700;
          }

          .mvbd-input {
            width: 100%;
            margin-top: 15px;
            min-height: 48px;
            padding: 0 15px;
            outline: none;
            border-radius: 14px;
            border: 1px solid rgba(255, 255, 255, 0.1);
            color: #ffffff;
            background: rgba(255, 255, 255, 0.035);
            font-size: 14px;
          }

          .mvbd-input:focus {
            border-color: rgba(60, 242, 92, 0.6);
            box-shadow: 0 0 0 3px rgba(60, 242, 92, 0.1);
          }

          .mvbd-error {
            margin-top: 11px;
            padding: 11px;
            border-radius: 12px;
            color: #ff9aa4;
            background: rgba(255, 47, 69, 0.08);
            font-size: 12px;
            border: 1px solid rgba(255, 47, 69, 0.2);
          }

          .mvbd-submit-button {
            width: 100%;
            min-height: 52px;
            margin-top: 15px;
            border: 0;
            border-radius: 999px;
            color: #fff;
            background: radial-gradient(
              ellipse at 50% 20%,
              #ff5a6b,
              var(--mv-red) 60%,
              #d81a30
            );
            font-size: 14px;
            font-weight: 800;
            cursor: pointer;
            box-shadow: 0 0 30px rgba(255, 47, 69, 0.45);
          }

          .mvbd-submit-button:hover {
            filter: brightness(1.08);
          }

          .mvbd-processing {
            text-align: center;
            padding: 22px 8px;
          }

          .mvbd-loader {
            width: 62px;
            height: 62px;
            margin: 0 auto 23px;
            border-radius: 50%;
            border: 3px solid rgba(255, 255, 255, 0.08);
            border-top-color: var(--mv-green);
            animation: mvbdSpin 0.8s linear infinite;
          }

          .mvbd-progress-track {
            height: 7px;
            margin-top: 23px;
            overflow: hidden;
            border-radius: 99px;
            background: rgba(255, 255, 255, 0.07);
          }

          .mvbd-progress-fill {
            height: 100%;
            border-radius: inherit;
            background: linear-gradient(90deg, #1fd04a, #7dff93);
            box-shadow: 0 0 14px rgba(60, 242, 92, 0.6);
            transition: width 0.2s linear;
          }

          .mvbd-progress-text {
            margin-top: 11px;
            color: var(--mv-muted);
            font-size: 12px;
            font-weight: 700;
          }

          .mvbd-success {
            text-align: center;
            padding: 15px 8px;
          }

          .mvbd-success-icon {
            width: 64px;
            height: 64px;
            display: grid;
            place-items: center;
            margin: 0 auto 20px;
            border-radius: 50%;
            color: #03110a;
            background: linear-gradient(135deg, #7dff93, #22d24d);
            box-shadow: 0 0 40px rgba(60, 242, 92, 0.5);
            font-size: 27px;
            font-weight: 900;
          }

          /* ---------- ANIMATIONS ---------- */
          @keyframes mvbdStatusPulse {
            0%,
            100% {
              opacity: 0.45;
              transform: scale(0.85);
            }
            50% {
              opacity: 1;
              transform: scale(1);
            }
          }

          @keyframes mvbdModalIn {
            from {
              opacity: 0;
            }
            to {
              opacity: 1;
            }
          }

          @keyframes mvbdModalScale {
            from {
              opacity: 0;
              transform: translateY(12px) scale(0.97);
            }
            to {
              opacity: 1;
              transform: translateY(0) scale(1);
            }
          }

          @keyframes mvbdSpin {
            to {
              transform: rotate(360deg);
            }
          }

          /* ---------- TABLET ---------- */
          @media (max-width: 1050px) {
            .mvbd-plan-options {
              grid-template-columns: repeat(2, minmax(0, 1fr));
              row-gap: 22px;
            }
          }

          /* ---------- MOBILE ---------- */
          @media (max-width: 700px) {
            .mvbd-page-content {
              width: calc(100% - 20px);
              padding: 10px 0 140px;
            }

            .mvbd-premium-header {
              padding: 10px 12px;
              border-radius: 18px;
            }

            .mvbd-brand-logo-wrap {
              width: 39px;
              height: 39px;
            }
            .mvbd-brand-logo {
              width: 32px;
              height: 32px;
            }
            .mvbd-brand-text strong {
              font-size: 13px;
            }
            .mvbd-status {
              padding: 6px 10px;
              font-size: 9px;
            }

            .mvbd-premium-hero {
              padding: 44px 4px 28px;
            }
            .mvbd-premium-hero h1 {
              font-size: 38px;
              letter-spacing: -1.4px;
            }
            .mvbd-hero-sub {
              font-size: 12px;
            }

            .mvbd-plan-options {
              grid-template-columns: 1fr;
              row-gap: 20px;
              gap: 20px;
            }

            .mvbd-option {
              display: grid;
              grid-template-columns: 1fr auto;
              grid-template-areas:
                "top top"
                "price meta";
              align-items: end;
              padding: 18px 16px;
              row-gap: 18px;
            }
            .mvbd-option-top {
              grid-area: top;
            }
            .mvbd-option-price {
              grid-area: price;
              margin-top: 0;
              font-size: 34px;
            }
            .mvbd-option-meta {
              grid-area: meta;
              margin-top: 0;
              align-items: flex-end;
            }

            .mvbd-details {
              margin-top: 30px;
            }
            .mvbd-panel {
              padding: 22px 18px 14px;
              border-radius: 26px;
            }
            .mvbd-feature-list {
              grid-template-columns: 1fr;
            }

            .mvbd-features-section {
              margin-top: 48px;
            }
            .mvbd-features-heading {
              align-items: center;
            }
            .mvbd-features-crown {
              display: none;
            }

            .mvbd-comparison {
              grid-template-columns: minmax(0, 1fr) 74px 74px;
              border-radius: 22px;
            }
            .mvbd-comparison-title {
              padding: 0 13px;
            }
            .mvbd-comparison-feature {
              min-height: 57px;
              padding: 0 12px;
              gap: 8px;
              font-size: 10.5px;
            }
            .mvbd-feature-icon {
              width: 25px;
              height: 25px;
              flex-basis: 25px;
              font-size: 10px;
            }
            .mvbd-comparison-title,
            .mvbd-comparison-plan-title {
              height: 57px;
              font-size: 10px;
            }
            .mvbd-comparison-value {
              min-height: 57px;
            }
            .mvbd-feature-check,
            .mvbd-feature-cross,
            .mvbd-feature-unlimited,
            .mvbd-feature-limited {
              min-width: 25px;
              height: 25px;
              font-size: 11px;
            }
            .mvbd-feature-unlimited {
              font-size: 15px;
            }
            .mvbd-feature-limited {
              min-width: 49px;
              padding: 0 5px;
              font-size: 7px;
            }

            .mvbd-payment-info {
              padding: 13px;
              gap: 10px;
            }
            .mvbd-secure-badge {
              display: none;
            }

            /* মোবাইলের জন্য চেকআউট বার (নেভিগেশন বারের উপরে) */
            .mvbd-checkout-bar {
              bottom: 75px; 
              padding: 12px 10px calc(12px + env(safe-area-inset-bottom, 0px));
            }
            .mvbd-checkout-inner {
              padding: 8px 8px 8px 16px;
            }
            .mvbd-next-pill {
              min-width: 120px;
              padding: 0 22px;
            }
          }

          @media (max-width: 390px) {
            .mvbd-status {
              display: none;
            }
            .mvbd-premium-hero h1 {
              font-size: 33px;
            }
            .mvbd-comparison {
              grid-template-columns: minmax(0, 1fr) 67px 67px;
            }
            .mvbd-comparison-feature {
              padding-left: 9px;
              padding-right: 7px;
            }
          }

          /* ---------- REDUCED MOTION ---------- */
          @media (prefers-reduced-motion: reduce) {
            *,
            *::before,
            *::after {
              scroll-behavior: auto !important;
            }

            .mvbd-status-dot,
            .mvbd-loader {
              animation: none !important;
            }

            .mvbd-option,
            .mvbd-radio i,
            .mvbd-next-pill,
            .mvbd-access-button {
              transition: none !important;
            }
          }
        `}</style>
      </main>

      {/* FREE ACCESS MODAL */}
      {showFreeAccess && selectedPlan && (
        <ViewportModal onBackdropClick={closeFreeAccess}>
          <div
            className="mvbd-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="free-plan-title"
          >
            <button
              type="button"
              className="mvbd-modal-close"
              onClick={closeFreeAccess}
              aria-label="Close"
            >
              ×
            </button>

            <div id="free-plan-title" className="mvbd-modal-title">
              🎁 Free Plan
            </div>

            <p className="mvbd-modal-subtitle">
              আপনার Free Plan-এ যেসব access available আছে সেগুলো এখান
              থেকে ব্যবহার করতে পারবেন।
            </p>

            <div className="mvbd-free-access-list">
              {(selectedPlan.freeAccess || []).map((item) => {
                if (isRestrictedFreeItem(item)) {
                  return (
                    <div
                      key={item.id}
                      className="mvbd-access-button mvbd-access-restricted"
                    >
                      <div className="mvbd-access-icon">🔒</div>
                      <div className="mvbd-access-text">
                        <strong>{item.title}</strong>
                        <span>
                          Age-restricted content is unavailable here.
                        </span>
                      </div>
                    </div>
                  )
                }

                if (item.type === "external") {
                  return (
                    <a
                      key={item.id}
                      href={item.href}
                      target="_blank"
                      rel="noreferrer"
                      className="mvbd-access-button"
                    >
                      <div className="mvbd-access-icon">
                        {item.sticker || "↗"}
                      </div>
                      <div className="mvbd-access-text">
                        <strong>{item.title}</strong>
                        <span>{item.description}</span>
                      </div>
                      <div className="mvbd-access-arrow">→</div>
                    </a>
                  )
                }

                if (item.type === "mebook") {
                  return (
                    <button
                      key={item.id}
                      type="button"
                      className="mvbd-access-button"
                      onClick={() => handleFreeAccess(item)}
                    >
                      <div className="mvbd-access-icon">
                        {item.sticker || "M"}
                      </div>
                      <div className="mvbd-access-text">
                        <strong>{item.title}</strong>
                        <span>{item.description}</span>
                      </div>
                      <div className="mvbd-access-arrow">→</div>
                    </button>
                  )
                }

                return (
                  <div
                    key={item.id}
                    className="mvbd-access-button mvbd-access-info"
                  >
                    <div className="mvbd-access-icon">
                      {item.sticker || "✓"}
                    </div>
                    <div className="mvbd-access-text">
                      <strong>{item.title}</strong>
                      <span>{item.description}</span>
                    </div>
                  </div>
                )
              })}
            </div>

            {!!selectedPlan.notIncluded?.length && (
              <div className="mvbd-not-included">
                <div className="mvbd-not-included-title">
                  Not included
                </div>
                <ul>
                  {selectedPlan.notIncluded.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </ViewportModal>
      )}

      {/* PAYMENT MODAL */}
      {showPayment && selectedPlan && (
        <ViewportModal onBackdropClick={closePayment}>
          <div
            className="mvbd-modal"
            role="dialog"
            aria-modal="true"
          >
            <button
              type="button"
              className="mvbd-modal-close"
              onClick={closePayment}
              aria-label="Close"
            >
              ×
            </button>

            <div className="mvbd-modal-title">💳 Complete Payment</div>

            <p className="mvbd-modal-subtitle">
              Send the exact plan amount to the payment number below and
              enter your transaction ID.
            </p>

            <div className="mvbd-selected-plan">
              <small>SELECTED PLAN</small>
              <strong>
                {selectedPlan.sticker} {selectedPlan.planName} •{" "}
                {selectedPlan.price}
              </strong>
            </div>

            <div className="mvbd-payment-number">
              <strong>{PAYMENT_NUMBER}</strong>
              <button
                type="button"
                className="mvbd-copy-button"
                onClick={copyNumber}
              >
                {copied ? "Copied" : "Copy"}
              </button>
            </div>

            <input
              className="mvbd-input"
              value={transactionId}
              onChange={(event) => setTransactionId(event.target.value)}
              placeholder="Enter transaction ID"
              autoComplete="off"
            />

            {error && <div className="mvbd-error">{error}</div>}

            <button
              type="button"
              className="mvbd-submit-button"
              onClick={submitPayment}
            >
              Submit Payment Request
            </button>
          </div>
        </ViewportModal>
      )}

      {/* PROCESSING */}
      {showProcessing && (
        <ViewportModal>
          <div
            className="mvbd-modal"
            role="dialog"
            aria-modal="true"
          >
            <div className="mvbd-processing">
              <div className="mvbd-loader" />
              <div className="mvbd-modal-title">⏳ Processing Request</div>
              <p className="mvbd-modal-subtitle">
                Your payment request has been submitted. Please wait while
                the request is being processed.
              </p>
              <div className="mvbd-progress-track">
                <div
                  className="mvbd-progress-fill"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className="mvbd-progress-text">
                {progress}% processing
              </div>
            </div>
          </div>
        </ViewportModal>
      )}

      {/* SUCCESS */}
      {showSuccess && (
        <ViewportModal>
          <div
            className="mvbd-modal"
            role="dialog"
            aria-modal="true"
          >
            <div className="mvbd-success">
              <div className="mvbd-success-icon">✓</div>
              <div className="mvbd-modal-title">🎉 Request Submitted</div>
              <p className="mvbd-modal-subtitle">
                Your subscription request has been submitted successfully.
                Your membership will be updated after verification.
              </p>
              <button
                type="button"
                className="mvbd-submit-button"
                onClick={closeSuccess}
              >
                Done
              </button>
            </div>
          </div>
        </ViewportModal>
      )}
    </>
  )
        }
