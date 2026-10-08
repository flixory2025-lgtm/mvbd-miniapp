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
   MAIN
========================================================= */

export default function SeriesSection({
  onOpenMeBook,
}: SeriesSectionProps) {
  const { user, profile } = useAuth()

  const [selectedPlan, setSelectedPlan] =
    useState<Plan | null>(null)

  const [showPayment, setShowPayment] =
    useState(false)

  const [showFreeAccess, setShowFreeAccess] =
    useState(false)

  const [showProcessing, setShowProcessing] =
    useState(false)

  const [showSuccess, setShowSuccess] =
    useState(false)

  const [transactionId, setTransactionId] =
    useState("")

  const [progress, setProgress] =
    useState(0)

  const [copied, setCopied] =
    useState(false)

  const [error, setError] =
    useState("")

  const processingTimerRef =
    useRef<number | null>(null)

  const successTimerRef =
    useRef<number | null>(null)

  /* =======================================================
     CLEANUP
  ======================================================= */

  useEffect(() => {
    return () => {
      if (processingTimerRef.current) {
        window.clearInterval(
          processingTimerRef.current,
        )
      }

      if (successTimerRef.current) {
        window.clearTimeout(
          successTimerRef.current,
        )
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

  /* =======================================================
     CLOSE PAYMENT
  ======================================================= */

  const closePayment = () => {
    setShowPayment(false)
    setError("")
  }

  /* =======================================================
     CLOSE FREE ACCESS
  ======================================================= */

  const closeFreeAccess = () => {
    setShowFreeAccess(false)
  }

  /* =======================================================
     COPY PAYMENT NUMBER
  ======================================================= */

  const copyNumber = async () => {
    try {
      await navigator.clipboard.writeText(
        PAYMENT_NUMBER,
      )

      setCopied(true)

      window.setTimeout(() => {
        setCopied(false)
      }, 1800)
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
      setError(
        "Please sign in before submitting a payment request.",
      )
      return
    }

    if (!trx || trx.length < 3) {
      setError(
        "Please enter a valid transaction ID.",
      )
      return
    }

    if (!selectedPlan) {
      setError(
        "Please select a subscription plan.",
      )
      return
    }

    if (selectedPlan.planId === "trial") {
      setError(
        "The Free Plan does not require payment.",
      )
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
      window.clearInterval(
        processingTimerRef.current,
      )
    }

    if (successTimerRef.current) {
      window.clearTimeout(
        successTimerRef.current,
      )
    }

    const startTime = Date.now()
    const processingDuration = 9000

    processingTimerRef.current =
      window.setInterval(() => {
        const elapsed =
          Date.now() - startTime

        const percentage = Math.min(
          100,
          Math.round(
            (elapsed / processingDuration) *
              100,
          ),
        )

        setProgress(percentage)

        if (percentage >= 100) {
          if (processingTimerRef.current) {
            window.clearInterval(
              processingTimerRef.current,
            )
          }

          successTimerRef.current =
            window.setTimeout(() => {
              setShowProcessing(false)
              setShowSuccess(true)
            }, 500)
        }
      }, 200)
  }

  /* =======================================================
     CLOSE SUCCESS
  ======================================================= */

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

  const handleFreeAccess = (
    item: FreeAccessItem,
  ) => {
    if (item.type === "mebook") {
      setShowFreeAccess(false)
      onOpenMeBook?.()
    }
  }

  /* =======================================================
     RESTRICTED ITEM CHECK
  ======================================================= */

  const isRestrictedFreeItem = (
    item: FreeAccessItem,
  ) => {
    const title =
      String(item.title || "").toLowerCase()

    const id =
      String(item.id || "").toLowerCase()

    return (
      item.type === "restricted" ||
      (title.includes("18+") &&
        !item.href) ||
      (title.includes("18 +") &&
        !item.href) ||
      (title.includes("adult") &&
        !item.href) ||
      (title.includes("age-restricted") &&
        !item.href) ||
      (title.includes("age restricted") &&
        !item.href) ||
      (id.includes("18") && !item.href) ||
      (id.includes("adult") && !item.href)
    )
  }

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <>
      <main className="mvbd-premium-page">
        {/* =================================================
            BACKGROUND (New Image Style - Dark Teal/Cyan)
        ================================================= */}

        <div className="mvbd-page-background" />

        <div className="mvbd-page-overlay" />

        <div className="mvbd-page-content">
          {/* =================================================
              HEADER (New Image Style)
          ================================================= */}

          <header className="mvbd-premium-header">
            <div className="mvbd-brand">
              <div className="mvbd-brand-mark">
                M
              </div>

              <div>
                <strong>
                  MoviesVerseBD
                </strong>

                <span>
                  Premium Membership
                </span>
              </div>
            </div>

            <div className="mvbd-status">
              <span className="mvbd-status-dot" />
              MEMBERSHIP
            </div>
          </header>

          {/* =================================================
              HERO (New Image Style)
          ================================================= */}

          <section className="mvbd-premium-hero">
            <div className="mvbd-eyebrow">
              ✦ MOVIESVERSEBD
            </div>

            <h1>
              Choose Your
              <span>
                Premium Plan
              </span>
            </h1>

            <p>
              Select a membership plan that
              works best for you.
            </p>
          </section>

          {/* =================================================
              PLANS (Your Subscription System with New UI)
          ================================================= */}

          <section className="mvbd-plans-grid">
            {SUBSCRIPTION_PLANS.map(
              (plan) => {
                const isFree =
                  plan.planId === "trial"

                const isMonthly =
                  plan.planId === "monthly"

                const isTwoMonths =
                  plan.planId ===
                  "two_months"

                const isThreeMonths =
                  plan.planId ===
                  "three_months"

                const features =
                  plan.features || []

                return (
                  <article
                    key={plan.planId}
                    className={[
                      "mvbd-plan-card",
                      `mvbd-plan-${plan.planId}`,
                      plan.popular
                        ? "mvbd-plan-popular"
                        : "",
                    ].join(" ")}
                  >
                    {/* CARD GLOW */}
                    <div className="mvbd-card-glow" />

                    {/* POPULAR BADGE */}
                    {plan.popular && (
                      <div className="mvbd-popular-badge">
                        ⭐ MOST POPULAR
                      </div>
                    )}

                    {/* TOP */}
                    <div className="mvbd-card-top">
                      <div className="mvbd-plan-icon">
                        {plan.sticker || "📦"}
                      </div>

                      <div>
                        <div className="mvbd-plan-name">
                          {isFree
                            ? "FREE PLAN"
                            : isMonthly
                              ? "1 MONTH"
                              : isTwoMonths
                                ? "2 MONTH"
                                : "3 MONTH"}
                        </div>

                        <div className="mvbd-plan-subtitle">
                          {isFree
                            ? "Enjoy Basic Access"
                            : "SUBSCRIPTION PLAN"}
                        </div>
                      </div>
                    </div>

                    {/* PRICE */}
                    <div className="mvbd-price">
                      {isFree
                        ? "FREE"
                        : plan.price}
                    </div>

                    {/* DURATION */}
                    <div className="mvbd-duration-pill">
                      {isFree
                        ? "BASIC ACCESS"
                        : isMonthly
                          ? "30 DAYS ACCESS"
                          : isTwoMonths
                            ? "60 DAYS ACCESS"
                            : "90 DAYS ACCESS"}
                    </div>

                    {/* QUALITY BADGE */}
                    <div className="mvbd-quality-badge">
                      <span>🎥</span>
                      <span>
                        {plan.videoQuality}
                      </span>
                    </div>

                    {/* FEATURES */}
                    <ul className="mvbd-feature-list">
                      {features.map(
                        (
                          feature,
                          index,
                        ) => (
                          <li
                            key={`${plan.planId}-${index}`}
                            className={
                              feature.type ===
                                "locked" ||
                              feature.type ===
                                "restricted"
                                ? "locked"
                                : ""
                            }
                          >
                            <span
                              className={
                                feature.type ===
                                "locked"
                                  ? "feature-cross"
                                  : feature.type ===
                                      "restricted"
                                    ? "feature-restricted"
                                    : feature.type ===
                                        "quality"
                                      ? "feature-quality"
                                      : "feature-check"
                              }
                            >
                              {feature.type ===
                              "locked"
                                ? "🔒"
                                : feature.type ===
                                    "restricted"
                                  ? "🔞"
                                  : feature.type ===
                                      "quality"
                                    ? "🎥"
                                    : "✅"}
                            </span>

                            <span className="feature-text">
                              {feature.text}
                            </span>
                          </li>
                        ),
                      )}
                    </ul>

                    {/* BUTTON */}
                    <button
                      type="button"
                      className="mvbd-choose-button"
                      onClick={() =>
                        openPlan(plan)
                      }
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

                      <span className="mvbd-button-arrow">
                        ›
                      </span>
                    </button>
                  </article>
                )
              },
            )}
          </section>

          {/* =================================================
              PAYMENT INFO (New Image Style)
          ================================================= */}

          <section className="mvbd-payment-info">
            <div className="mvbd-info-icon">
              ৳
            </div>

            <div>
              <strong>
                Secure Payment
              </strong>

              <span>
                Paid plans are activated
                after transaction
                verification.
              </span>
            </div>
          </section>

          {/* =================================================
              FOOTER (New Image Style)
          ================================================= */}

          <footer className="mvbd-premium-footer">
            MoviesVerseBD • MVBD Premium
            Membership
          </footer>
        </div>

        {/* =================================================
            GLOBAL CSS (New Image Style - Dark Teal/Cyan)
        ================================================= */}

        <style jsx global>{`
          * {
            box-sizing: border-box;
          }

          /* =================================================
             PAGE
          ================================================= */

          .mvbd-premium-page {
            position: relative;

            min-height: 100svh;

            width: 100%;

            overflow-x: hidden;

            background: #000000;

            color: #ffffff;

            isolation: isolate;
          }

          /* =================================================
             BACKGROUND (Pure CSS - Dark Teal Gradient)
          ================================================= */

          .mvbd-page-background {
            position: fixed;

            inset: 0;

            z-index: -3;

            pointer-events: none;

            background:
              linear-gradient(
                180deg,
                #000000 0%,
                #020b14 40%,
                #000000 100%
              );
          }

          .mvbd-page-overlay {
            position: fixed;

            inset: 0;

            z-index: -2;

            pointer-events: none;

            background:
              radial-gradient(
                ellipse at top,
                rgba(0, 255, 200, 0.08) 0%,
                transparent 70%
              );
          }

          /* =================================================
             CONTENT
          ================================================= */

          .mvbd-page-content {
            position: relative;

            z-index: 1;

            width:
              min(
                1200px,
                calc(100% - 40px)
              );

            margin: 0 auto;

            padding:
              20px
              0
              60px;
          }

          /* =================================================
             HEADER
          ================================================= */

          .mvbd-premium-header {
            display: flex;

            align-items: center;

            justify-content:
              space-between;

            gap: 20px;

            padding:
              14px
              24px;

            border:
              1px solid
              rgba(0, 255, 200, 0.12);

            border-radius: 16px;

            background:
              rgba(0, 0, 0, 0.7);

            backdrop-filter:
              blur(20px);
          }

          .mvbd-brand {
            display: flex;

            align-items: center;

            gap: 10px;
          }

          .mvbd-brand-mark {
            width: 32px;

            height: 32px;

            display: grid;

            place-items: center;

            border-radius: 8px;

            font-size: 16px;

            font-weight: 900;

            color: #000000;

            background:
              linear-gradient(
                135deg,
                #00ffc8,
                #00b8ff
              );
          }

          .mvbd-brand strong {
            display: block;

            font-size: 15px;

            font-weight: 700;
          }

          .mvbd-brand span {
            display: block;

            margin-top: 2px;

            color: #8a9ba8;

            font-size: 10px;
          }

          .mvbd-status {
            display: flex;

            align-items: center;

            gap: 7px;

            padding:
              6px
              14px;

            border-radius: 999px;

            color: #00ffc8;

            background:
              rgba(0, 255, 200, 0.08);

            border:
              1px solid
              rgba(0, 255, 200, 0.2);

            font-size: 10px;

            font-weight: 700;

            letter-spacing:
              0.5px;
          }

          .mvbd-status-dot {
            width: 6px;

            height: 6px;

            border-radius: 50%;

            background: #00ffc8;

            box-shadow:
              0 0 10px #00ffc8;

            animation:
              mvbdPulse
              1.8s
              ease-in-out
              infinite;
          }

          /* =================================================
             HERO
          ================================================= */

          .mvbd-premium-hero {
            text-align: center;

            padding:
              80px
              16px
              60px;
          }

          .mvbd-eyebrow {
            color: #00ffc8;

            font-size: 11px;

            font-weight: 800;

            letter-spacing:
              4px;

            text-transform:
              uppercase;

            margin-bottom: 16px;
          }

          .mvbd-premium-hero h1 {
            margin: 0;

            font-size:
              clamp(
                36px,
                6vw,
                72px
              );

            line-height: 1.05;

            font-weight: 800;

            letter-spacing:
              -2px;

            color: #ffffff;
          }

          .mvbd-premium-hero h1 span {
            display: block;

            color: #00ffc8;

            text-shadow:
              0 0 40px
                rgba(0, 255, 200, 0.3);
          }

          .mvbd-premium-hero p {
            margin:
              20px
              auto
              0;

            max-width: 500px;

            color: #8a9ba8;

            font-size: 15px;

            line-height: 1.7;
          }

          /* =================================================
             PLAN GRID
          ================================================= */

          .mvbd-plans-grid {
            display: grid;

            grid-template-columns:
              repeat(
                4,
                minmax(0, 1fr)
              );

            gap: 16px;

            align-items: stretch;
          }

          /* =================================================
             PLAN CARD (New Image Style)
          ================================================= */

          .mvbd-plan-card {
            --plan-main:
              #00ffc8;

            --plan-glow:
              #00ffc8;

            --plan-glow-soft:
              rgba(
                0,
                255,
                200,
                0.22
              );

            --plan-shadow:
              rgba(
                0,
                255,
                200,
                0.2
              );

            position: relative;

            min-width: 0;

            min-height: 690px;

            display: flex;

            flex-direction: column;

            padding:
              22px
              18px
              18px;

            overflow: hidden;

            border-radius: 24px;

            background:
              rgba(0, 0, 0, 0.6);

            border:
              1px solid
              rgba(
                0,
                255,
                200,
                0.12
              );

            box-shadow:
              0 20px 50px
                rgba(0, 0, 0, 0.6);

            isolation: isolate;

            transition:
              transform
                0.3s
                ease,
              box-shadow
                0.3s
                ease,
              border-color
                0.3s
                ease;
          }

          .mvbd-plan-card:hover {
            transform:
              translateY(-6px);

            border-color:
              rgba(
                0,
                255,
                200,
                0.4
              );
          }

          /* Top Glow Line */
          .mvbd-plan-card::before {
            content: "";

            position: absolute;

            top: -1px;

            left: 10%;

            width: 80%;

            height: 2px;

            border-radius:
              999px;

            background:
              var(--plan-glow);

            box-shadow:
              0 0 15px
                var(--plan-glow),
              0 0 40px
                var(--plan-main);

            opacity: 0.8;

            z-index: 3;
          }

          .mvbd-card-glow {
            position: absolute;

            width: 230px;
            height: 230px;

            top: -100px;

            left: 50%;

            transform:
              translateX(-50%);

            border-radius: 50%;

            background:
              radial-gradient(
                circle,
                var(--plan-glow-soft)
                  0%,
                transparent 68%
              );

            pointer-events: none;

            z-index: -1;

            animation:
              mvbdCardGlow
              5s
              ease-in-out
              infinite;
          }

          /* =================================================
             PLAN COLORS (All Cyan/Teal to match new image)
          ================================================= */

          .mvbd-plan-trial,
          .mvbd-plan-monthly,
          .mvbd-plan-two_months,
          .mvbd-plan-three_months {
            --plan-main:
              #00ffc8;

            --plan-glow:
              #00ffc8;

            --plan-glow-soft:
              rgba(
                0,
                255,
                200,
                0.22
              );

            --plan-shadow:
              rgba(
                0,
                255,
                200,
                0.2
              );

            border-color:
              rgba(
                0,
                255,
                200,
                0.12
              );

            background:
              rgba(0, 0, 0, 0.6);
          }

          /* =================================================
             CARD CONTENT
          ================================================= */

          .mvbd-card-top {
            position: relative;

            z-index: 4;

            display: flex;

            align-items: center;

            min-height: 70px;

            gap: 11px;
          }

          .mvbd-plan-icon {
            width: 45px;

            height: 45px;

            flex: 0 0 45px;

            display: grid;

            place-items: center;

            border-radius: 12px;

            color:
              var(--plan-main);

            background:
              rgba(
                0,
                255,
                200,
                0.1
              );

            border:
              1px solid
              rgba(
                0,
                255,
                200,
                0.2
              );

            font-size: 23px;

            font-weight: 900;
          }

          .mvbd-plan-name {
            color: #ffffff;

            font-size: 17px;

            line-height: 1.1;

            font-weight: 950;

            letter-spacing:
              0.4px;
          }

          .mvbd-plan-subtitle {
            margin-top: 6px;

            color: #8a9ba8;

            font-size: 10px;

            line-height: 1.2;

            font-weight: 700;

            letter-spacing:
              0.4px;
          }

          /* =================================================
             PRICE
          ================================================= */

          .mvbd-price {
            position: relative;

            z-index: 4;

            margin-top: 24px;

            min-height: 68px;

            display: flex;

            align-items: center;

            color:
              var(--plan-main);

            font-size:
              clamp(
                35px,
                3vw,
                48px
              );

            line-height: 1;

            font-weight: 950;

            letter-spacing:
              -1.5px;

            text-shadow:
              0 0 18px
                rgba(
                  0,
                  255,
                  200,
                  0.3
                );
          }

          /* =================================================
             DURATION
          ================================================= */

          .mvbd-duration-pill {
            position: relative;

            z-index: 4;

            display: flex;

            align-items: center;

            justify-content: center;

            width: 100%;

            min-height: 38px;

            margin-top: 8px;

            padding:
              7px
              12px;

            border-radius:
              999px;

            color: #000000;

            background:
              linear-gradient(
                90deg,
                #00ffc8,
                #00b8ff
              );

            box-shadow:
              0 0 18px
                rgba(
                  0,
                  255,
                  200,
                  0.22
                );

            font-size: 10px;

            font-weight: 950;

            letter-spacing:
              0.5px;

            text-align: center;
          }

          /* =================================================
             QUALITY BADGE
          ================================================= */

          .mvbd-quality-badge {
            position: relative;

            z-index: 4;

            display: inline-flex;

            align-items: center;

            justify-content: center;

            gap: 6px;

            align-self: center;

            margin-top: 10px;

            padding:
              6px
              14px;

            border-radius:
              999px;

            border:
              1px solid
              rgba(
                0,
                255,
                200,
                0.2
              );

            background:
              rgba(
                0,
                255,
                200,
                0.08
              );

            color:
              var(--plan-main);

            font-size: 10px;

            font-weight: 900;

            letter-spacing:
              0.5px;
          }

          /* =================================================
             FEATURES
          ================================================= */

          .mvbd-feature-list {
            position: relative;

            z-index: 4;

            list-style: none;

            display: grid;

            gap: 0;

            flex: 1;

            margin:
              19px
              0
              0;

            padding: 0;
          }

          .mvbd-feature-list li {
            display: flex;

            align-items:
              flex-start;

            gap: 9px;

            min-height: 49px;

            padding:
              8px
              0;

            border-bottom:
              1px solid
              rgba(
                255,
                255,
                255,
                0.06
              );

            color: #b0c0cc;

            font-size: 11px;

            line-height: 1.35;
          }

          .mvbd-feature-list li:last-child {
            border-bottom: 0;
          }

          .mvbd-feature-list
            li
            > span:first-child {
            width: 21px;

            height: 21px;

            flex: 0 0 21px;

            display: grid;

            place-items: center;

            margin-top: 1px;

            border-radius: 50%;

            font-size: 10px;

            font-weight: 950;
          }

          .feature-check {
            color: #000000;

            background:
              #00ffc8;
          }

          .feature-quality {
            color: #000000;

            background:
              #ffd52e;
          }

          .feature-cross {
            color: #ff5a45;

            background:
              rgba(
                255,
                63,
                42,
                0.1
              );

            border:
              1px solid
              rgba(
                255,
                63,
                42,
                0.25
              );

            font-size: 11px !important;
          }

          .feature-restricted {
            color: #ffffff;

            background:
              #d82929;

            font-size:
              10px !important;
          }

          .mvbd-feature-list
            .feature-text {
            flex: 1;

            padding-top: 2px;
          }

          .mvbd-feature-list
            li.locked {
            color: #6e6055;
          }

          /* =================================================
             CHOOSE BUTTON
          ================================================= */

          .mvbd-choose-button {
            position: relative;

            z-index: 5;

            width: 100%;

            min-height: 57px;

            margin-top: 19px;

            display: flex;

            align-items: center;

            justify-content: center;

            gap: 12px;

            border-radius:
              999px;

            border:
              1px solid
              rgba(
                0,
                255,
                200,
                0.3
              );

            color: #00ffc8;

            background:
              transparent;

            cursor: pointer;

            font-size: 12px;

            font-weight: 900;

            transition:
              transform
                0.2s
                ease,
              box-shadow
                0.2s
                ease,
              background
                0.2s
                ease;
          }

          .mvbd-choose-button:hover {
            transform:
              translateY(-2px);

            background:
              rgba(
                0,
                255,
                200,
                0.1
              );

            box-shadow:
              0 0 28px
                rgba(
                  0,
                  255,
                  200,
                  0.2
                );
          }

          .mvbd-choose-button:active {
            transform:
              scale(0.98);
          }

          .mvbd-button-arrow {
            color:
              var(--plan-main);

            font-size: 28px;

            line-height: 0;

            font-weight: 300;
          }

          /* =================================================
             POPULAR
          ================================================= */

          .mvbd-popular-badge {
            position: absolute;

            top: 0;

            right: 0;

            z-index: 10;

            padding:
              6px
              14px;

            border-radius:
              0
              0
              0
              14px;

            color: #000000;

            background:
              linear-gradient(
                135deg,
                #00ffc8,
                #00b8ff
              );

            font-size: 8px;

            font-weight: 950;

            letter-spacing:
              0.8px;

            animation:
              mvbdBadgePulse
              2s
              ease-in-out
              infinite;
          }

          /* =================================================
             PAYMENT INFO
          ================================================= */

          .mvbd-payment-info {
            display: flex;

            align-items: center;

            gap: 13px;

            max-width: 650px;

            margin:
              28px
              auto
              0;

            padding:
              14px
              17px;

            border-radius: 17px;

            background:
              rgba(
                0,
                0,
                0,
                0.6
              );

            border:
              1px solid
              rgba(
                0,
                255,
                200,
                0.12
              );
          }

          .mvbd-info-icon {
            width: 35px;

            height: 35px;

            display: grid;

            place-items: center;

            border-radius: 11px;

            color: #00ffc8;

            background:
              rgba(
                0,
                255,
                200,
                0.08
              );
          }

          .mvbd-payment-info strong {
            display: block;

            font-size: 12px;
          }

          .mvbd-payment-info span {
            display: block;

            margin-top: 3px;

            color: #8a9ba8;

            font-size: 10px;
          }

          /* =================================================
             FOOTER
          ================================================= */

          .mvbd-premium-footer {
            text-align: center;

            margin-top: 30px;

            color: #5c6b75;

            font-size: 10px;
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

            background:
              rgba(
                0,
                0,
                0,
                0.85
              );

            backdrop-filter:
              blur(8px);

            animation:
              mvbdModalIn
              0.2s
              ease
              both;
          }

          /* =================================================
             MODAL
          ================================================= */

          .mvbd-modal {
            width:
              min(
                440px,
                100%
              );

            max-height:
              min(
                88svh,
                700px
              );

            overflow-y: auto;

            padding: 28px;

            border-radius: 20px;

            border:
              1px solid
              rgba(
                0,
                255,
                200,
                0.2
              );

            background:
              #020b14;

            box-shadow:
              0 30px 90px
                rgba(
                  0,
                  0,
                  0,
                  0.9
                );

            animation:
              mvbdModalScale
              0.24s
              cubic-bezier(
                0.2,
                0.8,
                0.2,
                1
              )
              both;
          }

          .mvbd-modal::-webkit-scrollbar {
            width: 4px;
          }

          .mvbd-modal::-webkit-scrollbar-thumb {
            background:
              #1a4a44;

            border-radius: 99px;
          }

          .mvbd-modal-title {
            font-size: 20px;

            font-weight: 700;

            color: #ffffff;
          }

          .mvbd-modal-subtitle {
            margin-top: 8px;

            color: #8a9ba8;

            font-size: 13px;

            line-height: 1.6;
          }

          .mvbd-modal-close {
            float: right;

            width: 32px;

            height: 32px;

            border: 0;

            border-radius: 50%;

            color: #8a9ba8;

            background:
              rgba(
                255,
                255,
                255,
                0.06
              );

            cursor: pointer;

            font-size: 16px;
          }

          /* =================================================
             FREE ACCESS
          ================================================= */

          .mvbd-free-access-list {
            display: grid;

            gap: 10px;

            margin-top: 20px;
          }

          .mvbd-access-button {
            width: 100%;

            display: flex;

            align-items: center;

            gap: 12px;

            padding: 14px;

            border:
              1px solid
              rgba(
                0,
                255,
                200,
                0.15
              );

            border-radius: 14px;

            background:
              rgba(
                255,
                255,
                255,
                0.03
              );

            color: #ffffff;

            text-align: left;

            cursor: pointer;

            transition:
              all
                0.2s
                ease;
          }

          .mvbd-access-button:hover {
            background:
              rgba(
                0,
                255,
                200,
                0.08
              );

            border-color:
              rgba(
                0,
                255,
                200,
                0.4
              );
          }

          .mvbd-access-icon {
            width: 38px;

            height: 38px;

            flex:
              0
              0
              38px;

            display: grid;

            place-items: center;

            border-radius: 10px;

            font-size: 18px;

            background:
              rgba(
                0,
                255,
                200,
                0.1
              );

            color: #00ffc8;
          }

          .mvbd-access-text {
            min-width: 0;

            flex: 1;
          }

          .mvbd-access-text strong {
            display: block;

            font-size: 13px;
          }

          .mvbd-access-text span {
            display: block;

            margin-top: 3px;

            color: #8a9ba8;

            font-size: 11px;

            line-height: 1.4;
          }

          .mvbd-access-arrow {
            color: #00ffc8;

            font-size: 16px;
          }

          .mvbd-access-info {
            cursor: default;
          }

          .mvbd-access-info:hover {
            transform: none;

            background:
              rgba(
                255,
                255,
                255,
                0.03
              );
          }

          .mvbd-access-restricted {
            cursor: not-allowed;

            opacity: 0.6;
          }

          .mvbd-not-included {
            margin-top: 22px;

            padding-top: 18px;

            border-top:
              1px solid
              rgba(
                255,
                255,
                255,
                0.07
              );
          }

          .mvbd-not-included-title {
            margin-bottom: 12px;

            color: #8a9ba8;

            font-size: 10px;

            font-weight: 800;

            letter-spacing: 1px;

            text-transform:
              uppercase;
          }

          .mvbd-not-included ul {
            margin: 0;

            padding: 0;

            list-style: none;

            display: grid;

            gap: 8px;
          }

          .mvbd-not-included li {
            color: #6e6055;

            font-size: 12px;
          }

          .mvbd-not-included li::before {
            content: "×";

            margin-right: 8px;

            color: #5c4d42;
          }

          /* =================================================
             PAYMENT MODAL
          ================================================= */

          .mvbd-selected-plan {
            margin-top: 18px;

            padding: 16px;

            border-radius: 12px;

            background:
              rgba(
                0,
                255,
                200,
                0.05
              );

            border:
              1px solid
              rgba(
                0,
                255,
                200,
                0.15
              );
          }

          .mvbd-selected-plan small {
            display: block;

            color: #8a9ba8;

            font-size: 10px;

            font-weight: 700;

            letter-spacing:
              0.5px;
          }

          .mvbd-selected-plan strong {
            display: block;

            margin-top: 6px;

            font-size: 16px;

            color: #ffffff;
          }

          .mvbd-payment-number {
            margin-top: 16px;

            display: flex;

            align-items: center;

            justify-content:
              space-between;

            gap: 10px;

            padding: 14px;

            border-radius: 12px;

            background:
              rgba(
                255,
                255,
                255,
                0.04
              );

            border:
              1px solid
              rgba(
                255,
                255,
                255,
                0.08
              );
          }

          .mvbd-payment-number strong {
            color: #00ffc8;

            font-size: 16px;

            letter-spacing:
              0.5px;
          }

          .mvbd-copy-button {
            border:
              1px solid
              rgba(
                255,
                255,
                255,
                0.1
              );

            border-radius: 8px;

            padding:
              8px
              12px;

            color: #b0c0cc;

            background:
              rgba(
                255,
                255,
                255,
                0.05
              );

            cursor: pointer;

            font-size: 11px;

            font-weight: 600;
          }

          .mvbd-input {
            width: 100%;

            margin-top: 16px;

            min-height: 48px;

            padding:
              0
              16px;

            outline: none;

            border-radius: 12px;

            border:
              1px solid
              rgba(
                255,
                255,
                255,
                0.1
              );

            color: #ffffff;

            background:
              rgba(
                255,
                255,
                255,
                0.04
              );

            font-size: 14px;
          }

          .mvbd-input:focus {
            border-color:
              rgba(
                0,
                255,
                200,
                0.6
              );
          }

          .mvbd-error {
            margin-top: 12px;

            padding: 12px;

            border-radius: 10px;

            color: #ff9d9d;

            background:
              rgba(
                255,
                50,
                50,
                0.08
              );

            font-size: 12px;

            border:
              1px solid
              rgba(
                255,
                50,
                50,
                0.15
              );
          }

          .mvbd-submit-button {
            width: 100%;

            min-height: 50px;

            margin-top: 16px;

            border: 0;

            border-radius: 12px;

            color: #000000;

            background:
              linear-gradient(
                135deg,
                #00ffc8,
                #00b8ff
              );

            font-size: 14px;

            font-weight: 700;

            cursor: pointer;
          }

          .mvbd-submit-button:hover {
            filter:
              brightness(1.05);
          }

          /* =================================================
             PROCESSING
          ================================================= */

          .mvbd-processing {
            text-align: center;

            padding:
              24px
              10px;
          }

          .mvbd-loader {
            width: 64px;

            height: 64px;

            margin:
              0
              auto
              24px;

            border-radius: 50%;

            border:
              3px solid
              rgba(
                255,
                255,
                255,
                0.08
              );

            border-top-color:
              #00ffc8;

            animation:
              mvbdSpin
              0.8s
              linear
              infinite;
          }

          .mvbd-progress-track {
            height: 8px;

            margin-top: 24px;

            overflow: hidden;

            border-radius: 99px;

            background:
              rgba(
                255,
                255,
                255,
                0.06
              );
          }

          .mvbd-progress-fill {
            height: 100%;

            border-radius:
              inherit;

            background:
              linear-gradient(
                90deg,
                #00ffc8,
                #00b8ff
              );

            transition:
              width
              0.2s
              linear;
          }

          .mvbd-progress-text {
            margin-top: 12px;

            color: #8a9ba8;

            font-size: 12px;

            font-weight: 600;
          }

          /* =================================================
             SUCCESS
          ================================================= */

          .mvbd-success {
            text-align: center;

            padding:
              16px
              10px;
          }

          .mvbd-success-icon {
            width: 64px;

            height: 64px;

            display: grid;

            place-items: center;

            margin:
              0
              auto
              20px;

            border-radius: 50%;

            color: #000000;

            background:
              linear-gradient(
                135deg,
                #00ffc8,
                #00b8ff
              );

            font-size: 28px;

            font-weight: 900;
          }

          /* =================================================
             ANIMATIONS
          ================================================= */

          @keyframes mvbdPulse {
            0%,
            100% {
              opacity: 0.4;

              transform:
                scale(0.85);
            }

            50% {
              opacity: 1;

              transform:
                scale(1);
            }
          }

          @keyframes mvbdCardGlow {
            0%,
            100% {
              opacity: 0.45;

              transform:
                translateX(-50%)
                scale(0.95);
            }

            50% {
              opacity: 0.85;

              transform:
                translateX(-50%)
                scale(1.12);
            }
          }

          @keyframes mvbdBadgePulse {
            0%,
            100% {
              box-shadow:
                0 0 18px
                  rgba(
                    0,
                    255,
                    200,
                    0.3
                  );
            }

            50% {
              box-shadow:
                0 0 30px
                  rgba(
                    0,
                    255,
                    200,
                    0.6
                  );
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

              transform:
                translateY(12px)
                scale(0.97);
            }

            to {
              opacity: 1;

              transform:
                translateY(0)
                scale(1);
            }
          }

          @keyframes mvbdSpin {
            to {
              transform:
                rotate(360deg);
            }
          }

          /* =================================================
             TABLET
          ================================================= */

          @media (max-width: 1100px) {
            .mvbd-plans-grid {
              grid-template-columns:
                repeat(
                  2,
                  minmax(0, 1fr)
                );
            }

            .mvbd-plan-card {
              min-height: 660px;
            }
          }

          /* =================================================
             MOBILE
          ================================================= */

          @media (max-width: 700px) {
            .mvbd-page-content {
              width:
                calc(100% - 22px);

              padding-top: 11px;

              padding-bottom: 30px;
            }

            .mvbd-premium-header {
              padding:
                11px
                13px;

              border-radius: 18px;
            }

            .mvbd-brand-mark {
              width: 37px;

              height: 37px;

              border-radius: 11px;

              font-size: 21px;
            }

            .mvbd-brand strong {
              font-size: 13px;
            }

            .mvbd-brand span {
              font-size: 9px;
            }

            .mvbd-status {
              padding:
                7px
                9px;

              font-size: 8px;
            }

            .mvbd-premium-hero {
              padding:
                45px
                8px
                30px;
            }

            .mvbd-premium-hero h1 {
              font-size: 36px;

              letter-spacing:
                -1.5px;
            }

            .mvbd-premium-hero p {
              font-size: 12px;
            }

            .mvbd-plans-grid {
              grid-template-columns:
                1fr;

              gap: 16px;
            }

            .mvbd-plan-card {
              min-height: auto;

              padding:
                21px
                17px
                17px;

              border-radius: 22px;
            }

            .mvbd-plan-name {
              font-size: 16px;
            }

            .mvbd-price {
              margin-top: 20px;

              font-size: 42px;
            }

            .mvbd-feature-list li {
              min-height: 46px;

              font-size: 11px;
            }

            .mvbd-choose-button {
              min-height: 54px;
            }
          }

          /* =================================================
             SMALL MOBILE
          ================================================= */

          @media (max-width: 400px) {
            .mvbd-page-content {
              width:
                calc(100% - 16px);
            }

            .mvbd-status {
              display: none;
            }

            .mvbd-premium-hero h1 {
              font-size: 32px;
            }

            .mvbd-plan-card {
              padding:
                19px
                15px
                15px;
            }

            .mvbd-plan-icon {
              width: 41px;

              height: 41px;

              flex-basis: 41px;
            }

            .mvbd-plan-name {
              font-size: 15px;
            }

            .mvbd-plan-subtitle {
              font-size: 9px;
            }

            .mvbd-price {
              font-size: 38px;
            }

            .mvbd-feature-list li {
              font-size: 10.5px;
            }

            .mvbd-modal-backdrop {
              padding: 10px;
            }

            .mvbd-modal {
              padding: 18px;

              border-radius: 18px;
            }
          }

          /* =================================================
             REDUCED MOTION
          ================================================= */

          @media (
            prefers-reduced-motion:
              reduce
          ) {
            .mvbd-plan-card,
            .mvbd-choose-button,
            .mvbd-access-button {
              transition: none;
            }

            .mvbd-card-glow,
            .mvbd-status-dot,
            .mvbd-loader,
            .mvbd-popular-badge,
            .mvbd-success-icon {
              animation: none;
            }
          }
        `}</style>
      </main>

      {/* =====================================================
          FREE ACCESS MODAL
      ===================================================== */}

      {showFreeAccess &&
        selectedPlan && (
          <ViewportModal
            onBackdropClick={
              closeFreeAccess
            }
          >
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

              <div
                id="free-plan-title"
                className="mvbd-modal-title"
              >
                🎁 Free Plan
              </div>

              <p className="mvbd-modal-subtitle">
                আপনার Free Plan-এ যেসব
                access available আছে সেগুলো
                এখান থেকে ব্যবহার করতে
                পারবেন।
              </p>

              <div className="mvbd-free-access-list">
                {(
                  selectedPlan.freeAccess ||
                  []
                ).map((item) => {
                  if (
                    isRestrictedFreeItem(
                      item,
                    )
                  ) {
                    return (
                      <div
                        key={item.id}
                        className="mvbd-access-button mvbd-access-restricted"
                      >
                        <div className="mvbd-access-icon">
                          🔒
                        </div>

                        <div className="mvbd-access-text">
                          <strong>
                            {item.title}
                          </strong>

                          <span>
                            Age-restricted
                            content is
                            unavailable
                            here.
                          </span>
                        </div>
                      </div>
                    )
                  }

                  if (
                    item.type ===
                    "external"
                  ) {
                    return (
                      <a
                        key={item.id}
                        href={
                          item.href
                        }
                        target="_blank"
                        rel="noreferrer"
                        className="mvbd-access-button"
                      >
                        <div className="mvbd-access-icon">
                          {item.sticker || "↗"}
                        </div>

                        <div className="mvbd-access-text">
                          <strong>
                            {item.title}
                          </strong>

                          <span>
                            {
                              item.description
                            }
                          </span>
                        </div>

                        <div className="mvbd-access-arrow">
                          ›
                        </div>
                      </a>
                    )
                  }

                  if (
                    item.type ===
                    "mebook"
                  ) {
                    return (
                      <button
                        key={item.id}
                        type="button"
                        className="mvbd-access-button"
                        onClick={() =>
                          handleFreeAccess(
                            item,
                          )
                        }
                      >
                        <div className="mvbd-access-icon">
                          {item.sticker || "M"}
                        </div>

                        <div className="mvbd-access-text">
                          <strong>
                            {
                              item.title
                            }
                          </strong>

                          <span>
                            {
                              item.description
                            }
                          </span>
                        </div>

                        <div className="mvbd-access-arrow">
                          ›
                        </div>
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
                        <strong>
                          {item.title}
                        </strong>

                        <span>
                          {
                            item.description
                          }
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>

              {!!selectedPlan
                .notIncluded
                ?.length && (
                <div className="mvbd-not-included">
                  <div className="mvbd-not-included-title">
                    Not included
                  </div>

                  <ul>
                    {selectedPlan.notIncluded.map(
                      (item) => (
                        <li key={item}>
                          {item}
                        </li>
                      ),
                    )}
                  </ul>
                </div>
              )}
            </div>
          </ViewportModal>
        )}

      {/* =====================================================
          PAYMENT MODAL
      ===================================================== */}

      {showPayment &&
        selectedPlan && (
          <ViewportModal
            onBackdropClick={
              closePayment
            }
          >
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
                <small>
                  SELECTED PLAN
                </small>

                <strong>
                  {selectedPlan.sticker}{" "}
                  {
                    selectedPlan.planName
                  }{" "}
                  •{" "}
                  {
                    selectedPlan.price
                  }
                </strong>
              </div>

              <div className="mvbd-payment-number">
                <strong>
                  {PAYMENT_NUMBER}
                </strong>

                <button
                  type="button"
                  className="mvbd-copy-button"
                  onClick={
                    copyNumber
                  }
                >
                  {copied
                    ? "Copied"
                    : "Copy"}
                </button>
              </div>

              <input
                className="mvbd-input"
                value={transactionId}
                onChange={(event) =>
                  setTransactionId(
                    event.target.value,
                  )
                }
                placeholder="Enter transaction ID"
                autoComplete="off"
              />

              {error && (
                <div className="mvbd-error">
                  {error}
                </div>
              )}

              <button
                type="button"
                className="mvbd-submit-button"
                onClick={
                  submitPayment
                }
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
                  style={{
                    width: `${progress}%`,
                  }}
                />
              </div>

              <div className="mvbd-progress-text">
                {progress}%
                processing
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
              <div className="mvbd-success-icon">
                ✓
              </div>

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
                onClick={
                  closeSuccess
                }
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
