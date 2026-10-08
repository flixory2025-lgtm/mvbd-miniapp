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

    const oldOverflow = document.body.style.overflow
    const oldTouchAction = document.body.style.touchAction

    document.body.style.overflow = "hidden"
    document.body.style.touchAction = "none"

    return () => {
      document.body.style.overflow = oldOverflow
      document.body.style.touchAction = oldTouchAction
    }
  }, [])

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

  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null)
  const [showPayment, setShowPayment] = useState(false)
  const [showFreeAccess, setShowFreeAccess] = useState(false)
  const [showProcessing, setShowProcessing] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [transactionId, setTransactionId] = useState("")
  const [progress, setProgress] = useState(0)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState("")
  const [activeCard, setActiveCard] = useState(0)

  const processingTimerRef = useRef<number | null>(null)
  const successTimerRef = useRef<number | null>(null)
  const swiperInstanceRef = useRef<any>(null)
  const swiperContainerRef = useRef<HTMLDivElement | null>(null)

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
    }
  }, [])

  /* =======================================================
     SWIPER CDN LOADER + INITIALIZATION (SMOOTH)
  ======================================================= */

  useEffect(() => {
    let cancelled = false

    const loadSwiper = (): Promise<void> => {
      return new Promise((resolve, reject) => {
        if (typeof window === "undefined") {
          resolve()
          return
        }

        if (
          !document.querySelector(
            'link[data-swiper-css="true"]',
          )
        ) {
          const cssLink = document.createElement("link")
          cssLink.rel = "stylesheet"
          cssLink.href =
            "https://cdn.jsdelivr.net/npm/swiper@8/swiper-bundle.min.css"
          cssLink.setAttribute("data-swiper-css", "true")
          document.head.appendChild(cssLink)
        }

        if ((window as any).Swiper) {
          resolve()
          return
        }

        const existingScript = document.querySelector(
          'script[data-swiper-js="true"]',
        ) as HTMLScriptElement | null

        if (existingScript) {
          existingScript.addEventListener("load", () => resolve())
          existingScript.addEventListener("error", () =>
            reject(new Error("Failed to load Swiper")),
          )
          return
        }

        const script = document.createElement("script")
        script.src =
          "https://cdn.jsdelivr.net/npm/swiper@8/swiper-bundle.min.js"
        script.async = true
        script.setAttribute("data-swiper-js", "true")
        script.onload = () => resolve()
        script.onerror = () =>
          reject(new Error("Failed to load Swiper"))
        document.body.appendChild(script)
      })
    }

    const initSwiper = async () => {
      try {
        await loadSwiper()
        if (cancelled) return

        const Swiper = (window as any).Swiper
        if (!Swiper) {
          console.error("Swiper not available on window")
          return
        }

        const el = swiperContainerRef.current
        if (!el) return

        if (swiperInstanceRef.current) {
          try {
            swiperInstanceRef.current.destroy(true, true)
          } catch {}
          swiperInstanceRef.current = null
        }

        swiperInstanceRef.current = new Swiper(el, {
          effect: "cards",
          grabCursor: true,
          initialSlide: 0,
          speed: 400,
          resistanceRatio: 0.85,
          followFinger: true,
          touchStartPreventDefault: false,
          touchMoveStopPropagation: true,
          simulateTouch: true,
          allowTouchMove: true,
          preventClicks: false,
          preventClicksPropagation: false,
          threshold: 5,
          watchSlidesProgress: true,
          cardsEffect: {
            perSlideOffset: 8,
            perSlideRotate: 2,
            slideShadows: true,
          },
          mousewheel: {
            forceToAxis: true,
            releaseOnEdges: true,
            sensitivity: 0.6,
          },
          keyboard: {
            enabled: true,
          },
          on: {
            slideChange: (swiper: any) => {
              setActiveCard(swiper.activeIndex)
            },
          },
        })
      } catch (err) {
        console.error("Swiper init failed:", err)
      }
    }

    initSwiper()

    return () => {
      cancelled = true
      if (swiperInstanceRef.current) {
        try {
          swiperInstanceRef.current.destroy(true, true)
        } catch {}
        swiperInstanceRef.current = null
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
      window.setTimeout(() => setCopied(false), 1800)
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

  const cardPlans = SUBSCRIPTION_PLANS

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <>
      <main className="mvbd-premium-page">

        {/* =================================================
            CINEMATIC BACKGROUND
        ================================================= */}

        <div className="mvbd-page-background">
          <div className="mvbd-sun-glow" />
          <div className="mvbd-ray mvbd-ray-1" />
          <div className="mvbd-ray mvbd-ray-2" />
          <div className="mvbd-ray mvbd-ray-3" />
          <div className="mvbd-ray mvbd-ray-4" />
          <div className="mvbd-light-orb mvbd-orb-1" />
          <div className="mvbd-light-orb mvbd-orb-2" />
          <div className="mvbd-grain" />
        </div>

        <div className="mvbd-page-overlay" />

        <div className="mvbd-page-content">

          {/* =================================================
              HEADER
          ================================================= */}

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

          {/* =================================================
              HERO
          ================================================= */}

          <section className="mvbd-premium-hero">
            <div className="mvbd-eyebrow">
              ✦ MOVIESVERSEBD PREMIUM
            </div>
            <h1>
              Choose Your
              <span>Premium Plan</span>
            </h1>
            <p>
              Unlock a better MoviesVerseBD
              experience with flexible
              membership plans.
            </p>
          </section>

          {/* =================================================
              PLAN CARD STACK (SWIPER CARDS EFFECT)
          ================================================= */}

          <section className="mvbd-plan-showcase">

            <div className="mvbd-showcase-header">
              <div>
                <span className="mvbd-section-kicker">MEMBERSHIP</span>
                <h2>Choose the Right Plan</h2>
                <p>Swipe or tap a plan to explore your membership.</p>
              </div>
              <div className="mvbd-card-counter">
                <span>{String(activeCard + 1).padStart(2, "0")}</span>
                <i>/</i>
                <span>{String(cardPlans.length).padStart(2, "0")}</span>
              </div>
            </div>

            <div className="mvbd-card-stage">
              <div className="mvbd-stage-glow" />

              <div
                ref={swiperContainerRef}
                className="swiper mySwiper"
              >
                <div className="swiper-wrapper">
                  {cardPlans.map((plan) => (
                    <div
                      className="swiper-slide"
                      key={plan.planId}
                    >
                      <div className="mvbd-stack-card-inner">
                        <div className="mvbd-stack-light" />

                        {plan.popular && (
                          <div className="mvbd-stack-popular">
                            ✦ MOST POPULAR
                          </div>
                        )}

                        <div className="mvbd-stack-top">
                          <div className="mvbd-stack-icon">
                            {plan.sticker || "✦"}
                          </div>
                          <div>
                            <span>MOVIESVERSEBD</span>
                            <strong>{getPlanLabel(plan)}</strong>
                          </div>
                        </div>

                        <div className="mvbd-stack-price">
                          {plan.planId === "trial" ? "FREE" : plan.price}
                        </div>

                        <div className="mvbd-stack-duration">
                          {getPlanDuration(plan)}
                        </div>

                        <div className="mvbd-stack-divider" />

                        <div className="mvbd-stack-quality">
                          <span>🎥</span>
                          <span>{plan.videoQuality}</span>
                        </div>

                        <button
                          type="button"
                          className="mvbd-stack-bottom"
                          onPointerDown={(e) => e.stopPropagation()}
                          onClick={() => openPlan(plan)}
                        >
                          <span>
                            {plan.planId === "trial"
                              ? "Explore Free Access"
                              : "Unlock Premium Access"}
                          </span>
                          <b>→</b>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="mvbd-stack-hint">
              <span>←</span>
              Swipe or tap a card to select
              <span>→</span>
            </div>

          </section>

          {/* =================================================
              QUICK PLAN BUTTONS
          ================================================= */}

          <section className="mvbd-plans-grid">
            {SUBSCRIPTION_PLANS.map((plan) => {
              const isFree = plan.planId === "trial"
              const isMonthly = plan.planId === "monthly"
              const isTwoMonths = plan.planId === "two_months"
              const features = plan.features || []

              return (
                <article
                  key={plan.planId}
                  className={[
                    "mvbd-plan-card",
                    plan.popular ? "mvbd-plan-popular" : "",
                  ].join(" ")}
                >
                  {plan.popular && (
                    <div className="mvbd-popular-badge">
                      ⭐ MOST POPULAR
                    </div>
                  )}

                  <div className="mvbd-card-top">
                    <div className="mvbd-plan-icon">
                      {plan.sticker || "📦"}
                    </div>
                    <div>
                      <div className="mvbd-plan-name">
                        {getPlanLabel(plan)}
                      </div>
                      <div className="mvbd-plan-subtitle">
                        {isFree
                          ? "FREE ACCESS"
                          : "PREMIUM SUBSCRIPTION"}
                      </div>
                    </div>
                  </div>

                  <div className="mvbd-price">
                    {isFree ? "FREE" : plan.price}
                  </div>

                  <div className="mvbd-duration-pill">
                    {isFree
                      ? "BASIC ACCESS"
                      : isMonthly
                        ? "30 DAYS ACCESS"
                        : isTwoMonths
                          ? "60 DAYS ACCESS"
                          : "90 DAYS ACCESS"}
                  </div>

                  <div className="mvbd-quality-badge">
                    🎥 {plan.videoQuality}
                  </div>

                  <ul className="mvbd-feature-list">
                    {features.map((feature, index) => (
                      <li
                        key={`${plan.planId}-${index}`}
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

                  <button
                    type="button"
                    className="mvbd-choose-button"
                    onClick={() => openPlan(plan)}
                  >
                    <span>
                      {isFree
                        ? "Start Exploring"
                        : isMonthly
                          ? "Get 1 Month"
                          : isTwoMonths
                            ? "Get 2 Months"
                            : "Get 3 Months"}
                    </span>
                    <span className="mvbd-button-arrow">→</span>
                  </button>
                </article>
              )
            })}
          </section>

          {/* =================================================
              FEATURES COMPARISON
          ================================================= */}

          <section className="mvbd-features-section">
            <div className="mvbd-features-heading">
              <div>
                <span className="mvbd-section-kicker">
                  MEMBERSHIP BENEFITS
                </span>
                <h2>Features</h2>
                <p>
                  Compare what you get with
                  Free and Premium access.
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

          {/* =================================================
              PAYMENT INFO
          ================================================= */}

          <section className="mvbd-payment-info">
            <div className="mvbd-info-icon">৳</div>
            <div>
              <strong>Secure Payment</strong>
              <span>
                Paid plans are activated
                after transaction
                verification.
              </span>
            </div>
            <div className="mvbd-secure-badge">VERIFIED</div>
          </section>

          {/* =================================================
              FOOTER
          ================================================= */}

          <footer className="mvbd-premium-footer">
            <div className="mvbd-footer-logo">
              <img src={MVBD_LOGO} alt="" />
            </div>
            <span>
              MoviesVerseBD • MVBD Premium Membership
            </span>
          </footer>

        </div>

        {/* =================================================
            GLOBAL CSS
        ================================================= */}

        <style jsx global>{`

          * {
            box-sizing: border-box;
          }

          html,
          body {
            margin: 0;
            padding: 0;
            background: #05070b;
          }

          button,
          input {
            font: inherit;
          }

          /* =================================================
             PAGE
          ================================================= */

          .mvbd-premium-page {
            position: relative;
            min-height: 100svh;
            width: 100%;
            overflow-x: hidden;
            background: #05070b;
            color: #ffffff;
            isolation: isolate;
          }

          /* =================================================
             CINEMATIC BACKGROUND
          ================================================= */

          .mvbd-page-background {
            position: fixed;
            inset: 0;
            z-index: -5;
            overflow: hidden;
            pointer-events: none;

            background:
              radial-gradient(
                ellipse 80% 45%
                at 50% -10%,
                rgba(248, 213, 130, 0.11),
                transparent 65%
              ),
              linear-gradient(
                180deg,
                #07090e 0%,
                #05080c 45%,
                #020407 100%
              );
          }

          .mvbd-page-overlay {
            position: fixed;
            inset: 0;
            z-index: -4;
            pointer-events: none;

            background:
              radial-gradient(
                ellipse at 50% 0%,
                rgba(255, 227, 158, 0.08),
                transparent 48%
              ),
              linear-gradient(
                90deg,
                rgba(0, 0, 0, 0.42),
                transparent 45%,
                rgba(0, 0, 0, 0.48)
              );
          }

          .mvbd-sun-glow {
            position: absolute;
            width: 380px;
            height: 380px;
            top: -250px;
            left: 50%;
            transform: translateX(-50%);
            border-radius: 50%;

            background: radial-gradient(
              circle,
              rgba(255, 237, 183, 0.42) 0%,
              rgba(255, 212, 113, 0.15) 24%,
              rgba(255, 181, 79, 0.05) 44%,
              transparent 72%
            );

            filter: blur(18px);
            animation: mvbdSunPulse 8s ease-in-out infinite;
          }

          .mvbd-ray {
            position: absolute;
            top: -15%;
            left: 50%;
            height: 125%;
            width: 130px;
            transform-origin: 50% 0;

            background: linear-gradient(
              180deg,
              rgba(255, 239, 188, 0.12),
              rgba(255, 207, 117, 0.035),
              transparent 75%
            );

            filter: blur(18px);
            opacity: 0.6;
            mix-blend-mode: screen;
            animation: mvbdRayMove 13s ease-in-out infinite;
          }

          .mvbd-ray-1 {
            transform: translateX(-50%) rotate(-25deg);
          }

          .mvbd-ray-2 {
            width: 95px;
            transform: translateX(-50%) rotate(-10deg);
            opacity: 0.35;
            animation-delay: -3s;
          }

          .mvbd-ray-3 {
            width: 160px;
            transform: translateX(-50%) rotate(17deg);
            opacity: 0.28;
            animation-delay: -6s;
          }

          .mvbd-ray-4 {
            width: 75px;
            transform: translateX(-50%) rotate(32deg);
            opacity: 0.24;
            animation-delay: -9s;
          }

          .mvbd-light-orb {
            position: absolute;
            border-radius: 50%;
            pointer-events: none;
            filter: blur(70px);
            animation: mvbdOrbFloat 15s ease-in-out infinite;
          }

          .mvbd-orb-1 {
            width: 340px;
            height: 340px;
            top: 30%;
            left: -200px;
            background: rgba(21, 123, 108, 0.08);
          }

          .mvbd-orb-2 {
            width: 300px;
            height: 300px;
            right: -180px;
            top: 55%;
            background: rgba(82, 68, 147, 0.08);
            animation-delay: -7s;
          }

          .mvbd-grain {
            position: absolute;
            inset: 0;
            opacity: 0.035;
            pointer-events: none;

            background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 180 180' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='.7'/%3E%3C/svg%3E");
          }

          /* =================================================
             CONTENT
          ================================================= */

          .mvbd-page-content {
            position: relative;
            z-index: 2;
            width: min(1180px, calc(100% - 36px));
            margin: 0 auto;
            padding: 18px 0 70px;
          }

          /* =================================================
             HEADER
          ================================================= */

          .mvbd-premium-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 20px;
            padding: 11px 16px;
            border: 1px solid rgba(255,255,255,0.09);
            border-radius: 18px;
            background: rgba(8, 11, 16, 0.62);
            backdrop-filter: blur(22px);
            -webkit-backdrop-filter: blur(22px);
            box-shadow: 0 20px 60px rgba(0,0,0,0.25);
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
            background: linear-gradient(
              145deg,
              rgba(255,255,255,0.11),
              rgba(255,255,255,0.025)
            );
            border: 1px solid rgba(255,255,255,0.10);
            box-shadow: 0 0 30px rgba(255, 214, 130, 0.07);
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
            letter-spacing: -0.2px;
          }

          .mvbd-brand-text span {
            display: block;
            margin-top: 3px;
            color: rgba(255,255,255,0.48);
            font-size: 9px;
            letter-spacing: 0.6px;
            text-transform: uppercase;
          }

          .mvbd-status {
            display: flex;
            align-items: center;
            gap: 7px;
            padding: 7px 12px;
            border-radius: 999px;
            color: #f5d991;
            background: rgba(242, 207, 121, 0.07);
            border: 1px solid rgba(242, 207, 121, 0.15);
            font-size: 9px;
            font-weight: 800;
            letter-spacing: 1px;
          }

          .mvbd-status-dot {
            width: 6px;
            height: 6px;
            border-radius: 50%;
            background: #f7d982;
            box-shadow: 0 0 12px rgba(247,217,130,0.9);
            animation: mvbdStatusPulse 2s ease-in-out infinite;
          }

          /* =================================================
             HERO
          ================================================= */

          .mvbd-premium-hero {
            text-align: center;
            padding: 76px 12px 48px;
          }

          .mvbd-eyebrow {
            display: inline-flex;
            align-items: center;
            color: #e8d39b;
            font-size: 10px;
            font-weight: 900;
            letter-spacing: 4px;
            margin-bottom: 17px;
          }

          .mvbd-premium-hero h1 {
            margin: 0;
            font-size: clamp(38px, 6vw, 70px);
            line-height: 0.98;
            letter-spacing: -3px;
            font-weight: 850;
            color: #f8f7f2;
            text-shadow: 0 8px 40px rgba(0,0,0,0.35);
          }

          .mvbd-premium-hero h1 span {
            display: block;
            margin-top: 9px;
            background: linear-gradient(
              100deg,
              #ffffff 0%,
              #f3dda3 38%,
              #b8e6d5 72%,
              #ffffff 100%
            );
            background-size: 200% auto;
            -webkit-background-clip: text;
            background-clip: text;
            -webkit-text-fill-color: transparent;
            animation: mvbdGradientText 7s ease-in-out infinite;
          }

          .mvbd-premium-hero p {
            max-width: 520px;
            margin: 20px auto 0;
            color: rgba(255,255,255,0.48);
            font-size: 13px;
            line-height: 1.7;
          }

          /* =================================================
             SECTION HEADINGS
          ================================================= */

          .mvbd-section-kicker {
            color: #cdbb83;
            font-size: 9px;
            font-weight: 900;
            letter-spacing: 2.5px;
          }

          .mvbd-plan-showcase h2,
          .mvbd-features-section h2 {
            margin: 7px 0 0;
            color: #f5f4ef;
            font-size: clamp(24px, 4vw, 34px);
            line-height: 1.05;
            letter-spacing: -1.2px;
          }

          .mvbd-showcase-header {
            display: flex;
            align-items: flex-end;
            justify-content: space-between;
            gap: 20px;
            margin-bottom: 22px;
          }

          .mvbd-showcase-header p,
          .mvbd-features-heading p {
            margin: 8px 0 0;
            color: rgba(255,255,255,0.42);
            font-size: 11px;
          }

          .mvbd-card-counter {
            display: flex;
            align-items: center;
            gap: 7px;
            color: rgba(255,255,255,0.35);
            font-size: 11px;
            font-weight: 700;
          }

          .mvbd-card-counter span:first-child {
            color: #e8d394;
          }

          .mvbd-card-counter i {
            font-style: normal;
            opacity: 0.35;
          }

          /* =================================================
             CARD STAGE - SWIPER CONTAINER (SMOOTH)
          ================================================= */

          .mvbd-card-stage {
            position: relative;
            min-height: 450px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 34px;
            background: radial-gradient(
              ellipse at 50% 20%,
              rgba(255,220,139,0.055),
              transparent 58%
            );
            border: 1px solid rgba(255,255,255,0.045);
            touch-action: pan-y;
            user-select: none;
            -webkit-user-select: none;
          }

          .mvbd-stage-glow {
            position: absolute;
            width: 320px;
            height: 320px;
            border-radius: 50%;
            background: radial-gradient(
              circle,
              rgba(239,208,125,0.10),
              transparent 68%
            );
            filter: blur(25px);
            pointer-events: none;
          }

          /* =================================================
             SWIPER WRAPPER (SMOOTH)
          ================================================= */

          .mySwiper {
            width: 100%;
            height: 100%;
            overflow: visible !important;
            display: flex;
            justify-content: center;
            align-items: center;
            position: relative;
            max-width: 330px;
            min-height: 395px;
            touch-action: pan-y;
            user-select: none;
            -webkit-user-select: none;
            -webkit-tap-highlight-color: transparent;
          }

          .mySwiper.swiper-cards {
            overflow: visible;
          }

          .swiper-slide {
            width: 300px;
            height: 375px;
            border-radius: 27px;
            overflow: hidden;
            position: relative;
            box-shadow: 0 35px 70px rgba(0, 0, 0, 0.65);
            border: 1px solid rgba(255, 255, 255, 0.10);
            background: linear-gradient(
              145deg,
              rgba(27, 32, 38, 0.96),
              rgba(7, 10, 14, 0.98)
            );

            /* Swiper নিজে transform handle করে - নিজের transition বন্ধ */
            transition: none !important;
            will-change: transform;
            backface-visibility: hidden;
            -webkit-backface-visibility: hidden;
            transform: translateZ(0);
          }

          .swiper-slide-active {
            box-shadow:
              0 45px 100px rgba(0,0,0,0.72),
              0 0 60px rgba(225,196,116,0.10);
            border-color: rgba(236,211,143,0.22);
          }

          .swiper-slide::before {
            content: "";
            position: absolute;
            inset: 0;
            background: linear-gradient(
              130deg,
              rgba(255,255,255,0.075),
              transparent 27%,
              transparent 68%,
              rgba(255,221,139,0.025)
            );
            pointer-events: none;
            z-index: 1;
          }

          /* =================================================
             STACK CARD INNER (SMOOTH)
          ================================================= */

          .mvbd-stack-card-inner {
            width: 100%;
            height: 100%;
            padding: 25px 23px;
            position: relative;
            display: flex;
            flex-direction: column;
            pointer-events: auto;
            user-select: none;
            -webkit-user-select: none;
          }

          .mvbd-stack-light {
            position: absolute;
            width: 210px;
            height: 210px;
            top: -115px;
            left: 50%;
            transform: translateX(-50%);
            border-radius: 50%;
            background: radial-gradient(
              circle,
              rgba(246,218,148,0.23),
              rgba(246,218,148,0.04) 42%,
              transparent 70%
            );
            filter: blur(8px);
            animation: mvbdCardLight 5s ease-in-out infinite;
            z-index: 0;
            pointer-events: none;
          }

          .mvbd-stack-popular {
            position: absolute;
            top: 0;
            right: 0;
            padding: 8px 13px;
            border-radius: 0 0 0 14px;
            color: #17130b;
            background: linear-gradient(
              135deg,
              #f6dda0,
              #c9ad61
            );
            font-size: 7px;
            font-weight: 950;
            letter-spacing: 0.8px;
            box-shadow: 0 0 25px rgba(236,207,126,0.20);
            z-index: 2;
          }

          .mvbd-stack-top {
            position: relative;
            z-index: 3;
            display: flex;
            align-items: center;
            gap: 12px;
          }

          .mvbd-stack-icon {
            width: 50px;
            height: 50px;
            display: grid;
            place-items: center;
            flex: 0 0 50px;
            border-radius: 15px;
            color: #f2d88e;
            background: rgba(242,214,139,0.08);
            border: 1px solid rgba(242,214,139,0.16);
            font-size: 22px;
            box-shadow: inset 0 0 25px rgba(255,255,255,0.02);
          }

          .mvbd-stack-top span {
            display: block;
            color: rgba(255,255,255,0.38);
            font-size: 7px;
            letter-spacing: 1.5px;
            font-weight: 800;
          }

          .mvbd-stack-top strong {
            display: block;
            margin-top: 5px;
            color: #f5f3ed;
            font-size: 17px;
            font-weight: 850;
          }

          .mvbd-stack-price {
            position: relative;
            z-index: 3;
            margin-top: 42px;
            color: #f5dda0;
            font-size: 44px;
            line-height: 1;
            font-weight: 900;
            letter-spacing: -2px;
            text-shadow: 0 0 35px rgba(241,213,139,0.18);
          }

          .mvbd-stack-duration {
            position: relative;
            z-index: 3;
            display: inline-flex;
            margin-top: 12px;
            padding: 7px 12px;
            border-radius: 999px;
            color: rgba(255,255,255,0.65);
            background: rgba(255,255,255,0.045);
            border: 1px solid rgba(255,255,255,0.07);
            font-size: 8px;
            font-weight: 800;
            letter-spacing: 0.7px;
            align-self: flex-start;
          }

          .mvbd-stack-divider {
            position: relative;
            z-index: 3;
            height: 1px;
            margin: 24px 0 15px;
            background: linear-gradient(
              90deg,
              rgba(255,255,255,0.11),
              transparent
            );
          }

          .mvbd-stack-quality {
            position: relative;
            z-index: 3;
            display: flex;
            align-items: center;
            gap: 7px;
            color: rgba(255,255,255,0.65);
            font-size: 10px;
            font-weight: 700;
          }

          .mvbd-stack-bottom {
            position: absolute;
            z-index: 3;
            left: 23px;
            right: 23px;
            bottom: 22px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 12px 14px;
            border-radius: 13px;
            color: #15120b;
            background: linear-gradient(
              100deg,
              #f4dda0,
              #d1b968
            );
            font-size: 9px;
            font-weight: 900;
            box-shadow: 0 8px 25px rgba(217,188,105,0.10);
            border: none;
            cursor: pointer;
            width: calc(100% - 46px);
            transition: filter 0.2s ease, transform 0.2s ease;
            touch-action: manipulation;
            -webkit-tap-highlight-color: transparent;
          }

          .mvbd-stack-bottom:hover {
            filter: brightness(1.1);
          }

          .mvbd-stack-bottom b {
            font-size: 17px;
            line-height: 0;
          }

          .mvbd-stack-hint {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 12px;
            margin-top: 14px;
            color: rgba(255,255,255,0.28);
            font-size: 9px;
            letter-spacing: 0.7px;
          }

          .mvbd-stack-hint span {
            color: rgba(239,211,139,0.55);
            font-size: 13px;
          }

          /* =================================================
             NORMAL PLAN CARDS
          ================================================= */

          .mvbd-plans-grid {
            display: grid;
            grid-template-columns: repeat(4, minmax(0, 1fr));
            gap: 14px;
            margin-top: 45px;
          }

          .mvbd-plan-card {
            position: relative;
            display: flex;
            flex-direction: column;
            min-width: 0;
            min-height: 630px;
            padding: 20px 17px 17px;
            overflow: hidden;
            border-radius: 23px;
            border: 1px solid rgba(255,255,255,0.07);
            background: linear-gradient(
              145deg,
              rgba(18,23,29,0.90),
              rgba(5,8,12,0.96)
            );
            box-shadow: 0 25px 60px rgba(0,0,0,0.38);
            transition: transform 0.3s ease, border-color 0.3s ease;
          }

          .mvbd-plan-card:hover {
            transform: translateY(-5px);
            border-color: rgba(237,213,146,0.20);
          }

          .mvbd-plan-card::before {
            content: "";
            position: absolute;
            top: -80px;
            left: 50%;
            width: 210px;
            height: 210px;
            transform: translateX(-50%);
            border-radius: 50%;
            background: radial-gradient(
              circle,
              rgba(235,211,142,0.10),
              transparent 68%
            );
            pointer-events: none;
          }

          .mvbd-card-top {
            display: flex;
            align-items: center;
            gap: 10px;
          }

          .mvbd-plan-icon {
            width: 43px;
            height: 43px;
            display: grid;
            place-items: center;
            flex: 0 0 43px;
            border-radius: 12px;
            color: #ead28f;
            background: rgba(237,212,139,0.07);
            border: 1px solid rgba(237,212,139,0.14);
          }

          .mvbd-plan-name {
            color: #f5f4ee;
            font-size: 15px;
            font-weight: 850;
          }

          .mvbd-plan-subtitle {
            margin-top: 5px;
            color: rgba(255,255,255,0.35);
            font-size: 8px;
            letter-spacing: 0.7px;
            font-weight: 800;
          }

          .mvbd-price {
            margin-top: 25px;
            color: #e8d391;
            font-size: 39px;
            line-height: 1;
            font-weight: 900;
            letter-spacing: -1.7px;
          }

          .mvbd-duration-pill {
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 35px;
            margin-top: 10px;
            border-radius: 999px;
            color: #18140b;
            background: linear-gradient(
              90deg,
              #f2dda4,
              #cdb569
            );
            font-size: 8px;
            font-weight: 950;
            letter-spacing: 0.6px;
          }

          .mvbd-quality-badge {
            align-self: center;
            margin-top: 9px;
            padding: 6px 12px;
            border-radius: 999px;
            color: rgba(255,255,255,0.65);
            background: rgba(255,255,255,0.045);
            border: 1px solid rgba(255,255,255,0.07);
            font-size: 8px;
            font-weight: 800;
          }

          .mvbd-feature-list {
            flex: 1;
            list-style: none;
            margin: 17px 0 0;
            padding: 0;
            display: grid;
            gap: 0;
          }

          .mvbd-feature-list li {
            display: flex;
            align-items: flex-start;
            gap: 8px;
            min-height: 42px;
            padding: 7px 0;
            border-bottom: 1px solid rgba(255,255,255,0.045);
            color: rgba(255,255,255,0.58);
            font-size: 10px;
            line-height: 1.4;
          }

          .mvbd-feature-list li:last-child {
            border-bottom: 0;
          }

          .mvbd-feature-list li > span:first-child {
            width: 19px;
            height: 19px;
            flex: 0 0 19px;
            display: grid;
            place-items: center;
            margin-top: 1px;
            border-radius: 50%;
            font-size: 9px;
          }

          .feature-check {
            color: #15130d;
            background: #ead38f;
          }

          .feature-quality {
            color: #15130d;
            background: #ead38f;
          }

          .feature-cross {
            color: #d77f7f;
            background: rgba(214,77,77,0.08);
            border: 1px solid rgba(214,77,77,0.15);
          }

          .feature-restricted {
            color: white;
            background: #9f3030;
          }

          .mvbd-feature-list .feature-text {
            flex: 1;
            padding-top: 2px;
          }

          .mvbd-choose-button {
            width: 100%;
            min-height: 52px;
            margin-top: 16px;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 10px;
            border: 1px solid rgba(235,211,144,0.20);
            border-radius: 14px;
            color: #e8d394;
            background: rgba(235,211,144,0.045);
            cursor: pointer;
            font-size: 10px;
            font-weight: 900;
            transition: all 0.22s ease;
          }

          .mvbd-choose-button:hover {
            background: linear-gradient(
              100deg,
              rgba(240,218,154,0.14),
              rgba(189,213,198,0.07)
            );
            border-color: rgba(235,211,144,0.35);
            transform: translateY(-2px);
          }

          .mvbd-button-arrow {
            font-size: 19px;
          }

          .mvbd-popular-badge {
            position: absolute;
            top: 0;
            right: 0;
            padding: 6px 11px;
            border-radius: 0 0 0 13px;
            color: #17130b;
            background: linear-gradient(
              135deg,
              #f4dda0,
              #c5a95e
            );
            font-size: 7px;
            font-weight: 950;
            letter-spacing: 0.5px;
          }

          /* =================================================
             FEATURES SECTION
          ================================================= */

          .mvbd-features-section {
            margin-top: 68px;
          }

          .mvbd-features-heading {
            display: flex;
            align-items: flex-end;
            justify-content: space-between;
            gap: 20px;
            margin-bottom: 20px;
          }

          .mvbd-features-crown {
            display: flex;
            align-items: center;
            gap: 7px;
            color: #e6cf8f;
            font-size: 8px;
            font-weight: 900;
            letter-spacing: 1px;
            padding: 8px 11px;
            border-radius: 999px;
            border: 1px solid rgba(230,207,143,0.14);
            background: rgba(230,207,143,0.05);
          }

          .mvbd-features-crown span {
            font-size: 13px;
          }

          /* =================================================
             COMPARISON
          ================================================= */

          .mvbd-comparison {
            position: relative;
            display: grid;
            grid-template-columns: minmax(220px, 1fr) 105px 105px;
            overflow: hidden;
            border-radius: 23px;
            border: 1px solid rgba(255,255,255,0.07);
            background: rgba(7,10,15,0.72);
            box-shadow: 0 30px 80px rgba(0,0,0,0.34);
            backdrop-filter: blur(18px);
          }

          .mvbd-comparison-feature-column,
          .mvbd-comparison-plan {
            min-width: 0;
          }

          .mvbd-comparison-feature-column {
            background: rgba(255,255,255,0.012);
          }

          .mvbd-comparison-plan {
            border-left: 1px solid rgba(255,255,255,0.055);
          }

          .mvbd-premium-column {
            background: linear-gradient(
              180deg,
              rgba(228,204,137,0.095),
              rgba(228,204,137,0.025)
            );
          }

          .mvbd-comparison-title,
          .mvbd-comparison-plan-title {
            height: 62px;
            display: flex;
            align-items: center;
            font-size: 11px;
            font-weight: 800;
          }

          .mvbd-comparison-title {
            padding: 0 20px;
            color: rgba(255,255,255,0.44);
            text-transform: uppercase;
            letter-spacing: 1px;
          }

          .mvbd-comparison-plan-title {
            justify-content: center;
            color: rgba(255,255,255,0.55);
          }

          .mvbd-premium-column .mvbd-comparison-plan-title {
            color: #e9d393;
          }

          .mvbd-comparison-feature {
            min-height: 60px;
            display: flex;
            align-items: center;
            gap: 11px;
            padding: 0 20px;
            border-top: 1px solid rgba(255,255,255,0.045);
            color: rgba(255,255,255,0.70);
            font-size: 11px;
            font-weight: 500;
          }

          .mvbd-feature-icon {
            width: 27px;
            height: 27px;
            flex: 0 0 27px;
            display: grid;
            place-items: center;
            border-radius: 8px;
            color: rgba(255,255,255,0.82);
            background: rgba(255,255,255,0.045);
            border: 1px solid rgba(255,255,255,0.055);
            font-size: 12px;
            text-align: center;
          }

          .mvbd-comparison-value {
            min-height: 60px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-top: 1px solid rgba(255,255,255,0.045);
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
            color: #11150f;
            background: #e7dda9;
            box-shadow: 0 0 20px rgba(232,218,158,0.08);
          }

          .mvbd-feature-cross {
            color: rgba(255,255,255,0.27);
            background: rgba(255,255,255,0.045);
          }

          .mvbd-feature-unlimited {
            color: #11150f;
            background: linear-gradient(
              135deg,
              #f3dda0,
              #c9b067
            );
            font-size: 17px;
          }

          .mvbd-feature-limited {
            width: auto;
            min-width: 58px;
            height: 26px;
            padding: 0 9px;
            border-radius: 999px;
            color: #e4d292;
            background: rgba(228,210,146,0.08);
            border: 1px solid rgba(228,210,146,0.13);
            font-size: 7px;
            letter-spacing: 0.4px;
            text-transform: uppercase;
          }

          /* =================================================
             PAYMENT INFO
          ================================================= */

          .mvbd-payment-info {
            display: flex;
            align-items: center;
            gap: 13px;
            max-width: 700px;
            margin: 28px auto 0;
            padding: 15px 17px;
            border-radius: 17px;
            background: rgba(12,16,21,0.70);
            border: 1px solid rgba(255,255,255,0.07);
            backdrop-filter: blur(18px);
          }

          .mvbd-info-icon {
            width: 38px;
            height: 38px;
            display: grid;
            place-items: center;
            flex: 0 0 38px;
            border-radius: 11px;
            color: #e8d391;
            background: rgba(232,211,145,0.07);
            border: 1px solid rgba(232,211,145,0.12);
          }

          .mvbd-payment-info strong {
            display: block;
            color: rgba(255,255,255,0.82);
            font-size: 11px;
          }

          .mvbd-payment-info span {
            display: block;
            margin-top: 3px;
            color: rgba(255,255,255,0.38);
            font-size: 9px;
          }

          .mvbd-secure-badge {
            margin-left: auto;
            padding: 6px 9px;
            border-radius: 999px;
            color: #a8d5c3;
            background: rgba(107,193,157,0.06);
            border: 1px solid rgba(107,193,157,0.11);
            font-size: 7px;
            font-weight: 900;
            letter-spacing: 0.7px;
          }

          /* =================================================
             FOOTER
          ================================================= */

          .mvbd-premium-footer {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            margin-top: 30px;
            color: rgba(255,255,255,0.25);
            font-size: 9px;
          }

          .mvbd-footer-logo {
            width: 23px;
            height: 23px;
            display: grid;
            place-items: center;
            border-radius: 7px;
            background: rgba(255,255,255,0.035);
          }

          .mvbd-footer-logo img {
            width: 18px;
            height: 18px;
            object-fit: contain;
          }

          /* =================================================
             MODAL BACKDROP
          ================================================= */

          .mvbd-modal-backdrop {
            position: fixed;
            inset: 0;
            z-index: 99999;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 18px;
            background: rgba(1,3,6,0.82);
            backdrop-filter: blur(12px);
            -webkit-backdrop-filter: blur(12px);
            animation: mvbdModalIn 0.22s ease both;
          }

          .mvbd-modal {
            position: relative;
            width: min(440px, 100%);
            max-height: min(88svh, 700px);
            overflow-y: auto;
            padding: 27px;
            border-radius: 23px;
            border: 1px solid rgba(231,208,143,0.17);
            background: linear-gradient(
              145deg,
              #10161d,
              #05080c
            );
            box-shadow:
              0 35px 100px rgba(0,0,0,0.82),
              0 0 60px rgba(227,202,133,0.05);
            animation: mvbdModalScale 0.26s cubic-bezier(
              0.2,
              0.8,
              0.2,
              1
            ) both;
          }

          .mvbd-modal::-webkit-scrollbar {
            width: 4px;
          }

          .mvbd-modal::-webkit-scrollbar-thumb {
            background: rgba(230,207,142,0.25);
            border-radius: 99px;
          }

          .mvbd-modal-title {
            color: #f6f4ed;
            font-size: 20px;
            font-weight: 800;
          }

          .mvbd-modal-subtitle {
            margin-top: 8px;
            color: rgba(255,255,255,0.48);
            font-size: 12px;
            line-height: 1.65;
          }

          .mvbd-modal-close {
            float: right;
            width: 32px;
            height: 32px;
            border: 0;
            border-radius: 50%;
            color: rgba(255,255,255,0.55);
            background: rgba(255,255,255,0.06);
            cursor: pointer;
            font-size: 17px;
          }

          /* =================================================
             FREE ACCESS
          ================================================= */

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
            border: 1px solid rgba(255,255,255,0.07);
            border-radius: 14px;
            background: rgba(255,255,255,0.035);
            color: #ffffff;
            text-align: left;
            cursor: pointer;
            transition: all 0.2s ease;
          }

          .mvbd-access-button:hover {
            background: rgba(235,211,143,0.07);
            border-color: rgba(235,211,143,0.18);
          }

          .mvbd-access-icon {
            width: 38px;
            height: 38px;
            flex: 0 0 38px;
            display: grid;
            place-items: center;
            border-radius: 10px;
            color: #e9d392;
            background: rgba(233,211,146,0.07);
          }

          .mvbd-access-text {
            flex: 1;
            min-width: 0;
          }

          .mvbd-access-text strong {
            display: block;
            font-size: 12px;
          }

          .mvbd-access-text span {
            display: block;
            margin-top: 3px;
            color: rgba(255,255,255,0.40);
            font-size: 10px;
            line-height: 1.4;
          }

          .mvbd-access-arrow {
            color: #e9d392;
            font-size: 16px;
          }

          .mvbd-access-info {
            cursor: default;
          }

          .mvbd-access-restricted {
            cursor: not-allowed;
            opacity: 0.55;
          }

          .mvbd-not-included {
            margin-top: 22px;
            padding-top: 17px;
            border-top: 1px solid rgba(255,255,255,0.07);
          }

          .mvbd-not-included-title {
            margin-bottom: 11px;
            color: rgba(255,255,255,0.38);
            font-size: 9px;
            font-weight: 800;
            letter-spacing: 1px;
            text-transform: uppercase;
          }

          .mvbd-not-included ul {
            margin: 0;
            padding: 0;
            list-style: none;
            display: grid;
            gap: 7px;
          }

          .mvbd-not-included li {
            color: rgba(255,255,255,0.28);
            font-size: 11px;
          }

          .mvbd-not-included li::before {
            content: "×";
            margin-right: 8px;
            color: rgba(220,100,100,0.55);
          }

          /* =================================================
             PAYMENT MODAL
          ================================================= */

          .mvbd-selected-plan {
            margin-top: 18px;
            padding: 15px;
            border-radius: 13px;
            background: rgba(232,211,145,0.045);
            border: 1px solid rgba(232,211,145,0.11);
          }

          .mvbd-selected-plan small {
            display: block;
            color: rgba(255,255,255,0.35);
            font-size: 9px;
            font-weight: 800;
            letter-spacing: 0.5px;
          }

          .mvbd-selected-plan strong {
            display: block;
            margin-top: 6px;
            color: #f0dfaa;
            font-size: 15px;
          }

          .mvbd-payment-number {
            margin-top: 15px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 10px;
            padding: 13px;
            border-radius: 12px;
            background: rgba(255,255,255,0.035);
            border: 1px solid rgba(255,255,255,0.07);
          }

          .mvbd-payment-number strong {
            color: #e9d392;
            font-size: 15px;
          }

          .mvbd-copy-button {
            border: 1px solid rgba(255,255,255,0.09);
            border-radius: 8px;
            padding: 7px 11px;
            color: rgba(255,255,255,0.65);
            background: rgba(255,255,255,0.04);
            cursor: pointer;
            font-size: 10px;
          }

          .mvbd-input {
            width: 100%;
            margin-top: 15px;
            min-height: 48px;
            padding: 0 15px;
            outline: none;
            border-radius: 12px;
            border: 1px solid rgba(255,255,255,0.08);
            color: #ffffff;
            background: rgba(255,255,255,0.035);
            font-size: 13px;
          }

          .mvbd-input:focus {
            border-color: rgba(234,211,143,0.45);
            box-shadow: 0 0 0 3px rgba(234,211,143,0.05);
          }

          .mvbd-error {
            margin-top: 11px;
            padding: 11px;
            border-radius: 10px;
            color: #ffaaaa;
            background: rgba(255,60,60,0.07);
            font-size: 11px;
            border: 1px solid rgba(255,60,60,0.12);
          }

          .mvbd-submit-button {
            width: 100%;
            min-height: 50px;
            margin-top: 15px;
            border: 0;
            border-radius: 13px;
            color: #17130b;
            background: linear-gradient(
              135deg,
              #f3dda0,
              #c8af67
            );
            font-size: 12px;
            font-weight: 900;
            cursor: pointer;
            box-shadow: 0 12px 30px rgba(220,193,111,0.09);
          }

          .mvbd-submit-button:hover {
            filter: brightness(1.07);
          }

          /* =================================================
             PROCESSING
          ================================================= */

          .mvbd-processing {
            text-align: center;
            padding: 22px 8px;
          }

          .mvbd-loader {
            width: 62px;
            height: 62px;
            margin: 0 auto 23px;
            border-radius: 50%;
            border: 3px solid rgba(255,255,255,0.07);
            border-top-color: #e7d18f;
            animation: mvbdSpin 0.8s linear infinite;
          }

          .mvbd-progress-track {
            height: 7px;
            margin-top: 23px;
            overflow: hidden;
            border-radius: 99px;
            background: rgba(255,255,255,0.06);
          }

          .mvbd-progress-fill {
            height: 100%;
            border-radius: inherit;
            background: linear-gradient(
              90deg,
              #e7d18f,
              #b6d8c9
            );
            transition: width 0.2s linear;
          }

          .mvbd-progress-text {
            margin-top: 11px;
            color: rgba(255,255,255,0.40);
            font-size: 11px;
            font-weight: 600;
          }

          /* =================================================
             SUCCESS
          ================================================= */

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
            color: #11150f;
            background: linear-gradient(
              135deg,
              #f1dda1,
              #b9d9c9
            );
            font-size: 27px;
            font-weight: 900;
          }

          /* =================================================
             ANIMATIONS
          ================================================= */

          @keyframes mvbdSunPulse {
            0%, 100% {
              opacity: 0.65;
              transform: translateX(-50%) scale(0.94);
            }
            50% {
              opacity: 1;
              transform: translateX(-50%) scale(1.08);
            }
          }

          @keyframes mvbdRayMove {
            0%, 100% {
              opacity: 0.32;
              filter: blur(19px);
            }
            50% {
              opacity: 0.68;
              filter: blur(24px);
            }
          }

          @keyframes mvbdOrbFloat {
            0%, 100% {
              transform: translate3d(0,0,0) scale(1);
            }
            50% {
              transform: translate3d(25px,-20px,0) scale(1.08);
            }
          }

          @keyframes mvbdCardLight {
            0%, 100% {
              opacity: 0.45;
              transform: translateX(-50%) scale(0.92);
            }
            50% {
              opacity: 0.9;
              transform: translateX(-50%) scale(1.08);
            }
          }

          @keyframes mvbdStatusPulse {
            0%, 100% {
              opacity: 0.45;
              transform: scale(0.85);
            }
            50% {
              opacity: 1;
              transform: scale(1);
            }
          }

          @keyframes mvbdGradientText {
            0%, 100% {
              background-position: 0% 50%;
            }
            50% {
              background-position: 100% 50%;
            }
          }

          @keyframes mvbdModalIn {
            from { opacity: 0; }
            to { opacity: 1; }
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
            to { transform: rotate(360deg); }
          }

          /* =================================================
             TABLET
          ================================================= */

          @media (max-width: 1050px) {
            .mvbd-plans-grid {
              grid-template-columns: repeat(2, minmax(0, 1fr));
            }
            .mvbd-plan-card {
              min-height: 600px;
            }
          }

          /* =================================================
             MOBILE
          ================================================= */

          @media (max-width: 700px) {
            .mvbd-page-content {
              width: calc(100% - 18px);
              padding: 10px 0 35px;
            }

            .mvbd-premium-header {
              padding: 10px 12px;
              border-radius: 16px;
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
              font-size: 12px;
            }

            .mvbd-brand-text span {
              font-size: 8px;
            }

            .mvbd-status {
              padding: 6px 9px;
              font-size: 7px;
            }

            .mvbd-premium-hero {
              padding: 48px 5px 30px;
            }

            .mvbd-eyebrow {
              font-size: 8px;
              letter-spacing: 2.4px;
            }

            .mvbd-premium-hero h1 {
              font-size: 36px;
              letter-spacing: -1.8px;
            }

            .mvbd-premium-hero p {
              font-size: 11px;
            }

            .mvbd-showcase-header {
              align-items: flex-end;
            }

            .mvbd-plan-showcase h2,
            .mvbd-features-section h2 {
              font-size: 25px;
            }

            .mvbd-card-stage {
              min-height: 405px;
              border-radius: 27px;
            }

            .mySwiper {
              max-width: 275px;
              min-height: 355px;
            }

            .swiper-slide {
              width: 250px;
              height: 340px;
            }

            .mvbd-stack-card-inner {
              padding: 21px 19px;
            }

            .mvbd-stack-top strong {
              font-size: 15px;
            }

            .mvbd-stack-price {
              margin-top: 32px;
              font-size: 38px;
            }

            .mvbd-stack-bottom {
              left: 19px;
              right: 19px;
              bottom: 18px;
              padding: 11px 12px;
              width: calc(100% - 38px);
            }

            .mvbd-plans-grid {
              grid-template-columns: 1fr;
              gap: 13px;
              margin-top: 34px;
            }

            .mvbd-plan-card {
              min-height: auto;
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
              border-radius: 18px;
            }

            .mvbd-comparison-title {
              padding: 0 13px;
            }

            .mvbd-comparison-feature {
              min-height: 57px;
              padding: 0 12px;
              gap: 8px;
              font-size: 9.5px;
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
              font-size: 9px;
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
              font-size: 6px;
            }

            .mvbd-payment-info {
              padding: 12px;
              gap: 10px;
            }

            .mvbd-secure-badge {
              display: none;
            }
          }

          /* =================================================
             SMALL MOBILE
          ================================================= */

          @media (max-width: 390px) {
            .mvbd-status {
              display: none;
            }

            .mvbd-premium-hero h1 {
              font-size: 32px;
            }

            .mySwiper {
              max-width: 260px;
              min-height: 345px;
            }

            .swiper-slide {
              width: 235px;
              height: 330px;
            }

            .mvbd-card-stage {
              min-height: 390px;
            }

            .mvbd-comparison {
              grid-template-columns: minmax(0, 1fr) 67px 67px;
            }

            .mvbd-comparison-feature {
              padding-left: 9px;
              padding-right: 7px;
            }
          }

          /* =================================================
             REDUCED MOTION
          ================================================= */

          @media (prefers-reduced-motion: reduce) {
            *, *::before, *::after {
              scroll-behavior: auto !important;
            }

            .mvbd-sun-glow,
            .mvbd-ray,
            .mvbd-light-orb,
            .mvbd-stack-light,
            .mvbd-status-dot,
            .mvbd-loader,
            .mvbd-premium-hero h1 span {
              animation: none !important;
            }

            .mvbd-plan-card,
            .mvbd-choose-button,
            .mvbd-access-button {
              transition: none !important;
            }
          }

        `}</style>
      </main>

      {/* =====================================================
          FREE ACCESS MODAL
      ===================================================== */}

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
              আপনার Free Plan-এ যেসব
              access available আছে সেগুলো
              এখান থেকে ব্যবহার করতে
              পারবেন।
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

      {/* =====================================================
          PAYMENT MODAL
      ===================================================== */}

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

            <div className="mvbd-modal-title">
              💳 Complete Payment
            </div>

            <p className="mvbd-modal-subtitle">
              Send the exact plan amount to
              the payment number below and
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
              onChange={(event) =>
                setTransactionId(event.target.value)
              }
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

      {/* =====================================================
          PROCESSING
      ===================================================== */}

      {showProcessing && (
        <ViewportModal>
          <div
            className="mvbd-modal"
            role="dialog"
            aria-modal="true"
          >
            <div className="mvbd-processing">
              <div className="mvbd-loader" />
              <div className="mvbd-modal-title">
                ⏳ Processing Request
              </div>
              <p className="mvbd-modal-subtitle">
                Your payment request has been
                submitted. Please wait while
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

      {/* =====================================================
          SUCCESS
      ===================================================== */}

      {showSuccess && (
        <ViewportModal>
          <div
            className="mvbd-modal"
            role="dialog"
            aria-modal="true"
          >
            <div className="mvbd-success">
              <div className="mvbd-success-icon">✓</div>
              <div className="mvbd-modal-title">
                🎉 Request Submitted
              </div>
              <p className="mvbd-modal-subtitle">
                Your subscription request has
                been submitted successfully.
                Your membership will be
                updated after verification.
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
