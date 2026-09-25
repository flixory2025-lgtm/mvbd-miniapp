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
     
     This prevents age-restricted content from becoming
     a clickable external link even if the data accidentally
     contains it as an external item.
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
      title.includes("18+") ||
      title.includes("18 +") ||
      title.includes("adult") ||
      title.includes("age-restricted") ||
      title.includes("age restricted") ||
      id.includes("18") ||
      id.includes("adult")
    )
  }

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <>
      <main className="mvbd-premium-page">
        {/* =================================================
            BACKGROUND
        ================================================= */}

        <div className="mvbd-page-background" />

        <div className="mvbd-page-overlay" />

        <div className="mvbd-page-content">
          {/* =================================================
              HEADER
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
              HERO
          ================================================= */}

          <section className="mvbd-premium-hero">
            <div className="mvbd-eyebrow">
              MOVIESVERSEBD
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
              PLANS
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

                /* -------------------------------------------
                   FREE FEATURES
                ------------------------------------------- */

                const features = isFree
                  ? [
                      {
                        text:
                          "MVBD PM Channel Access",
                        type:
                          "included",
                      },
                      {
                        text:
                          "MoviesverseBD Channel Access",
                        type:
                          "restricted",
                      },
                      {
                        text:
                          "Anime Verse BD Channel Access",
                        type:
                          "included",
                      },
                      {
                        text:
                          "MVBD MeBook Access",
                        type:
                          "included",
                      },
                      {
                        text:
                          "Free MVBD Mini App Check Access",
                        type:
                          "included",
                      },
                      {
                        text:
                          "Movie Series Trailer Access",
                        type:
                          "included",
                      },
                      {
                        text:
                          "No Movie Streaming (Subscription Required)",
                        type:
                          "locked",
                      },
                      {
                        text:
                          "No Premium Content",
                        type:
                          "locked",
                      },
                      {
                        text:
                          "No Download Option",
                        type:
                          "locked",
                      },
                      {
                        text:
                          "No Ad-Free Experience",
                        type:
                          "locked",
                      },
                      {
                        text:
                          "Limited Features",
                        type:
                          "locked",
                      },
                    ]
                  : [
                      {
                        text:
                          "All Free Plan Features",
                        type:
                          "included",
                      },
                      {
                        text:
                          "Full Movie Streaming (HD Quality)",
                        type:
                          "included",
                      },
                      {
                        text:
                          "Series & Anime Streaming",
                        type:
                          "included",
                      },
                      {
                        text:
                          "Download Option (Select Content)",
                        type:
                          "included",
                      },
                      {
                        text:
                          "Ad-Free Experience",
                        type:
                          "included",
                      },
                      {
                        text:
                          "Premium Content Access",
                        type:
                          "included",
                      },
                      {
                        text:
                          "Regular Updates (New Movies & Series)",
                        type:
                          "included",
                      },
                      {
                        text:
                          "Priority Support",
                        type:
                          "included",
                      },
                    ]

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
                        MOST POPULAR
                      </div>
                    )}

                    {/* TOP */}

                    <div className="mvbd-card-top">
                      <div className="mvbd-plan-icon">
                        {isFree && "♛"}
                        {isMonthly && "▣"}
                        {isTwoMonths && "▣"}
                        {isThreeMonths && "▣"}
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
                                    : "feature-check"
                              }
                            >
                              {feature.type ===
                              "locked"
                                ? "×"
                                : feature.type ===
                                    "restricted"
                                  ? "18"
                                  : "✓"}
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
              PAYMENT INFO
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
              FOOTER
          ================================================= */}

          <footer className="mvbd-premium-footer">
            MoviesVerseBD • MVBD Premium
            Membership
          </footer>
        </div>

        {/* =================================================
            GLOBAL CSS
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

            background: #020605;

            color: #ffffff;

            isolation: isolate;
          }

          /* =================================================
             BACKGROUND
          ================================================= */

          .mvbd-page-background {
            position: fixed;

            inset: 0;

            z-index: -3;

            pointer-events: none;

            background-image:
              url("https://i.postimg.cc/43PLHM4Z/file-0000000041908206b4fe692b01e0940b.png");

            background-position:
              center top;

            background-size: cover;

            background-repeat: no-repeat;

            transform:
              translateZ(0);
          }

          .mvbd-page-overlay {
            position: fixed;

            inset: 0;

            z-index: -2;

            pointer-events: none;

            background:
              linear-gradient(
                180deg,
                rgba(0, 0, 0, 0.48)
                  0%,
                rgba(0, 5, 3, 0.72)
                  48%,
                rgba(0, 0, 0, 0.95)
                  100%
              );
          }

          /* DESKTOP BACKGROUND */

          @media (min-width: 761px) {
            .mvbd-page-background {
              background-image:
                url("https://i.postimg.cc/43s2dZg3/file-00000000e1908211bbeb998f8584d5ba.png");
            }
          }

          /* =================================================
             CONTENT
          ================================================= */

          .mvbd-page-content {
            position: relative;

            z-index: 1;

            width:
              min(
                1440px,
                calc(100% - 32px)
              );

            margin: 0 auto;

            padding:
              22px
              0
              45px;
          }

          /* =================================================
             HEADER
          ================================================= */

          .mvbd-premium-header {
            display: flex;

            align-items: center;

            justify-content:
              space-between;

            gap: 16px;

            padding:
              14px
              18px;

            border:
              1px solid
              rgba(97, 255, 151, 0.2);

            border-radius: 22px;

            background:
              rgba(2, 10, 7, 0.76);

            box-shadow:
              0 12px 35px
                rgba(0, 0, 0, 0.35),
              inset 0 1px 0
                rgba(255, 255, 255, 0.06);
          }

          .mvbd-brand {
            display: flex;

            align-items: center;

            gap: 12px;
          }

          .mvbd-brand-mark {
            width: 42px;
            height: 42px;

            display: grid;

            place-items: center;

            border-radius: 13px;

            font-size: 24px;

            font-weight: 900;

            color: #001b0c;

            background:
              linear-gradient(
                135deg,
                #75ffad,
                #00d95f
              );

            box-shadow:
              0 0 22px
                rgba(0, 255, 105, 0.35);
          }

          .mvbd-brand strong {
            display: block;

            font-size: 15px;

            font-weight: 800;

            letter-spacing:
              0.3px;
          }

          .mvbd-brand span {
            display: block;

            margin-top: 2px;

            color: #8ea99b;

            font-size: 11px;
          }

          .mvbd-status {
            display: flex;

            align-items: center;

            gap: 7px;

            padding:
              8px
              12px;

            border-radius: 999px;

            color: #79fca9;

            background:
              rgba(0, 255, 106, 0.07);

            border:
              1px solid
              rgba(0, 255, 106, 0.16);

            font-size: 10px;

            font-weight: 800;

            letter-spacing:
              1px;
          }

          .mvbd-status-dot {
            width: 7px;
            height: 7px;

            border-radius: 50%;

            background: #36ff88;

            box-shadow:
              0 0 10px #36ff88;

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
              64px
              16px
              42px;
          }

          .mvbd-eyebrow {
            color: #48ff91;

            font-size: 11px;

            font-weight: 900;

            letter-spacing:
              3px;

            margin-bottom: 12px;
          }

          .mvbd-premium-hero h1 {
            margin: 0;

            font-size:
              clamp(
                34px,
                5vw,
                68px
              );

            line-height: 1.05;

            font-weight: 900;

            letter-spacing:
              -2px;

            text-shadow:
              0 4px 30px
                rgba(0, 0, 0, 0.6);
          }

          .mvbd-premium-hero h1 span {
            display: block;

            color: #3cff86;

            text-shadow:
              0 0 30px
                rgba(0, 255, 112, 0.28);
          }

          .mvbd-premium-hero p {
            margin:
              16px
              auto
              0;

            max-width: 550px;

            color: #a4b9af;

            font-size: 14px;

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
             PLAN CARD
          ================================================= */

          .mvbd-plan-card {
            --plan-main:
              #47ff8a;

            --plan-glow:
              #47ff8a;

            --plan-glow-soft:
              rgba(
                47,
                255,
                119,
                0.22
              );

            --plan-shadow:
              rgba(
                38,
                255,
                115,
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

            border-radius: 28px;

            background:
              linear-gradient(
                160deg,
                rgba(3, 17, 12, 0.97),
                rgba(0, 7, 5, 0.98)
              );

            border:
              1px solid
              rgba(
                82,
                255,
                145,
                0.45
              );

            box-shadow:
              0 20px 55px
                rgba(0, 0, 0, 0.5),
              inset 0 1px 0
                rgba(
                  255,
                  255,
                  255,
                  0.07
                );

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

          .mvbd-plan-card::before {
            content: "";

            position: absolute;

            top: -2px;

            left: 8%;

            width: 84%;

            height: 3px;

            border-radius:
              999px;

            background:
              var(--plan-glow);

            box-shadow:
              0 0 12px
                var(--plan-glow),
              0 0 30px
                var(--plan-glow),
              0 0 55px
                var(--plan-glow);

            opacity: 0.9;

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

          .mvbd-plan-card:hover {
            transform:
              translateY(-8px);

            border-color:
              var(--plan-glow);

            box-shadow:
              0 25px 70px
                rgba(0, 0, 0, 0.58),
              0 0 30px
                var(--plan-shadow);
          }

          /* =================================================
             PLAN COLORS
          ================================================= */

          .mvbd-plan-trial {
            --plan-main:
              #36ff78;

            --plan-glow:
              #47ff8a;

            --plan-glow-soft:
              rgba(
                47,
                255,
                119,
                0.22
              );

            --plan-shadow:
              rgba(
                38,
                255,
                115,
                0.2
              );

            border-color:
              rgba(
                55,
                255,
                125,
                0.65
              );

            background:
              linear-gradient(
                160deg,
                rgba(
                  0,
                  43,
                  23,
                  0.96
                ),
                rgba(
                  0,
                  12,
                  7,
                  0.98
                )
              );
          }

          .mvbd-plan-monthly {
            --plan-main:
              #27dfff;

            --plan-glow:
              #20dfff;

            --plan-glow-soft:
              rgba(
                20,
                218,
                255,
                0.23
              );

            --plan-shadow:
              rgba(
                0,
                210,
                255,
                0.2
              );

            border-color:
              rgba(
                20,
                214,
                255,
                0.62
              );

            background:
              linear-gradient(
                160deg,
                rgba(
                  0,
                  28,
                  51,
                  0.97
                ),
                rgba(
                  1,
                  8,
                  16,
                  0.98
                )
              );
          }

          .mvbd-plan-two_months {
            --plan-main:
              #d84cff;

            --plan-glow:
              #ce42ff;

            --plan-glow-soft:
              rgba(
                210,
                55,
                255,
                0.24
              );

            --plan-shadow:
              rgba(
                198,
                42,
                255,
                0.22
              );

            border-color:
              rgba(
                207,
                55,
                255,
                0.65
              );

            background:
              linear-gradient(
                160deg,
                rgba(
                  42,
                  4,
                  64,
                  0.97
                ),
                rgba(
                  10,
                  2,
                  19,
                  0.98
                )
              );
          }

          .mvbd-plan-three_months {
            --plan-main:
              #ffd52e;

            --plan-glow:
              #ffd329;

            --plan-glow-soft:
              rgba(
                255,
                211,
                38,
                0.22
              );

            --plan-shadow:
              rgba(
                255,
                204,
                30,
                0.2
              );

            border-color:
              rgba(
                255,
                210,
                40,
                0.64
              );

            background:
              linear-gradient(
                160deg,
                rgba(
                  53,
                  40,
                  4,
                  0.97
                ),
                rgba(
                  15,
                  10,
                  1,
                  0.98
                )
              );
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

            border-radius: 13px;

            color:
              var(--plan-main);

            background:
              color-mix(
                in srgb,
                var(--plan-main)
                  10%,
                transparent
              );

            border:
              1px solid
              color-mix(
                in srgb,
                var(--plan-main)
                  30%,
                transparent
              );

            box-shadow:
              0 0 20px
                color-mix(
                  in srgb,
                  var(--plan-main)
                    18%,
                  transparent
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

            color: #a8bbb2;

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
                color-mix(
                  in srgb,
                  var(--plan-main)
                    35%,
                  transparent
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

            color: #07100b;

            background:
              linear-gradient(
                90deg,
                var(--plan-main),
                color-mix(
                  in srgb,
                  var(--plan-main)
                    72%,
                  white
                )
              );

            box-shadow:
              0 0 18px
                color-mix(
                  in srgb,
                  var(--plan-main)
                    22%,
                  transparent
                );

            font-size: 10px;

            font-weight: 950;

            letter-spacing:
              0.5px;

            text-align: center;
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
                0.075
              );

            color: #e1ebe6;

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
            color: #001d0c;

            background:
              #32f879;

            box-shadow:
              0 0 9px
                rgba(
                  42,
                  255,
                  117,
                  0.35
                );
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

            font-size: 14px !important;
          }

          .feature-restricted {
            color: #ffffff;

            background:
              #d82929;

            font-size:
              8px !important;

            box-shadow:
              0 0 8px
                rgba(
                  255,
                  30,
                  30,
                  0.25
                );
          }

          .mvbd-feature-list
            .feature-text {
            flex: 1;

            padding-top: 2px;
          }

          .mvbd-feature-list
            li.locked {
            color: #7c8882;
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
              color-mix(
                in srgb,
                var(--plan-main)
                  80%,
                white
              );

            color: #ffffff;

            background:
              linear-gradient(
                135deg,
                color-mix(
                  in srgb,
                  var(--plan-main)
                    35%,
                  #020605
                ),
                color-mix(
                  in srgb,
                  var(--plan-main)
                    15%,
                  #020605
                )
              );

            box-shadow:
              inset 0 1px 0
                rgba(
                  255,
                  255,
                  255,
                  0.15
                ),
              0 0 18px
                color-mix(
                  in srgb,
                  var(--plan-main)
                    18%,
                  transparent
                );

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
              linear-gradient(
                135deg,
                color-mix(
                  in srgb,
                  var(--plan-main)
                    55%,
                  #020605
                ),
                color-mix(
                  in srgb,
                  var(--plan-main)
                    25%,
                  #020605
                )
              );

            box-shadow:
              0 0 28px
                color-mix(
                  in srgb,
                  var(--plan-main)
                    32%,
                  transparent
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
              7px
              13px;

            border-radius:
              0
              0
              0
              14px;

            color: #06130d;

            background:
              linear-gradient(
                135deg,
                #5effdc,
                #2beaff
              );

            box-shadow:
              0 0 18px
                rgba(
                  40,
                  237,
                  255,
                  0.3
                );

            font-size: 8px;

            font-weight: 950;

            letter-spacing:
              0.8px;
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
                3,
                13,
                9,
                0.8
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

          .mvbd-info-icon {
            width: 35px;

            height: 35px;

            display: grid;

            place-items: center;

            border-radius: 11px;

            color: #62ff9b;

            background:
              rgba(
                0,
                255,
                106,
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

            color: #80948b;

            font-size: 10px;
          }

          /* =================================================
             FOOTER
          ================================================= */

          .mvbd-premium-footer {
            text-align: center;

            margin-top: 30px;

            color: #52645b;

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
                0.78
              );

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
                470px,
                100%
              );

            max-height:
              min(
                88svh,
                760px
              );

            overflow-y: auto;

            padding: 22px;

            border-radius: 25px;

            border:
              1px solid
              rgba(
                76,
                255,
                137,
                0.28
              );

            background:
              linear-gradient(
                155deg,
                #07130e,
                #020605
              );

            box-shadow:
              0 30px 90px
                rgba(
                  0,
                  0,
                  0,
                  0.7
                ),
              0 0 45px
                rgba(
                  0,
                  255,
                  106,
                  0.08
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
              #235e3b;

            border-radius: 99px;
          }

          .mvbd-modal-title {
            font-size: 22px;

            font-weight: 900;
          }

          .mvbd-modal-subtitle {
            margin-top: 7px;

            color: #84988e;

            font-size: 12px;

            line-height: 1.6;
          }

          .mvbd-modal-close {
            float: right;

            width: 32px;

            height: 32px;

            border: 0;

            border-radius: 50%;

            color: #a9bcb3;

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

            padding: 13px;

            border:
              1px solid
              rgba(
                85,
                255,
                145,
                0.15
              );

            border-radius: 16px;

            background:
              rgba(
                255,
                255,
                255,
                0.035
              );

            color: #ffffff;

            text-align: left;

            cursor: pointer;

            transition:
              transform
                0.2s
                ease,
              background
                0.2s
                ease;
          }

          .mvbd-access-button:hover {
            transform:
              translateY(-2px);

            background:
              rgba(
                42,
                255,
                117,
                0.07
              );
          }

          .mvbd-access-icon {
            width: 38px;

            height: 38px;

            flex:
              0 0 38px;

            display: grid;

            place-items: center;

            border-radius: 12px;

            color: #67ff9d;

            background:
              rgba(
                0,
                255,
                106,
                0.09
              );
          }

          .mvbd-access-text {
            min-width: 0;

            flex: 1;
          }

          .mvbd-access-text strong {
            display: block;

            font-size: 12px;
          }

          .mvbd-access-text span {
            display: block;

            margin-top: 3px;

            color: #758a80;

            font-size: 10px;

            line-height: 1.5;
          }

          .mvbd-access-arrow {
            color: #56ff94;

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
                0.035
              );
          }

          .mvbd-access-restricted {
            cursor: not-allowed;

            border-color:
              rgba(
                255,
                255,
                255,
                0.07
              );

            opacity: 0.65;
          }

          .mvbd-access-restricted
            .mvbd-access-icon {
            color: #8d9792;

            background:
              rgba(
                255,
                255,
                255,
                0.05
              );
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
            margin-bottom: 11px;

            color: #7c8e86;

            font-size: 10px;

            font-weight: 900;

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
            color: #67766f;

            font-size: 10px;
          }

          .mvbd-not-included li::before {
            content: "×";

            margin-right: 8px;

            color: #66716d;
          }

          /* =================================================
             PAYMENT MODAL
          ================================================= */

          .mvbd-selected-plan {
            margin-top: 18px;

            padding: 14px;

            border-radius: 15px;

            background:
              rgba(
                0,
                255,
                106,
                0.055
              );

            border:
              1px solid
              rgba(
                0,
                255,
                106,
                0.12
              );
          }

          .mvbd-selected-plan small {
            display: block;

            color: #719083;

            font-size: 9px;
          }

          .mvbd-selected-plan strong {
            display: block;

            margin-top: 4px;

            font-size: 17px;
          }

          .mvbd-payment-number {
            margin-top: 15px;

            display: flex;

            align-items: center;

            justify-content:
              space-between;

            gap: 10px;

            padding: 13px;

            border-radius: 14px;

            background:
              rgba(
                255,
                255,
                255,
                0.045
              );
          }

          .mvbd-payment-number strong {
            color: #65ff9c;

            font-size: 17px;

            letter-spacing: 1px;
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

            border-radius: 9px;

            padding:
              7px
              10px;

            color: #c8d7d0;

            background:
              rgba(
                255,
                255,
                255,
                0.05
              );

            cursor: pointer;

            font-size: 10px;
          }

          .mvbd-input {
            width: 100%;

            margin-top: 14px;

            min-height: 48px;

            padding:
              0
              14px;

            outline: none;

            border-radius: 13px;

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
                0.045
              );

            font-size: 13px;
          }

          .mvbd-input:focus {
            border-color:
              rgba(
                63,
                255,
                136,
                0.55
              );
          }

          .mvbd-error {
            margin-top: 10px;

            padding: 10px;

            border-radius: 10px;

            color: #ff9d9d;

            background:
              rgba(
                255,
                50,
                50,
                0.07
              );

            font-size: 10px;
          }

          .mvbd-submit-button {
            width: 100%;

            min-height: 48px;

            margin-top: 14px;

            border: 0;

            border-radius: 14px;

            color: #001b0c;

            background:
              linear-gradient(
                135deg,
                #8affb7,
                #27ed78
              );

            font-size: 12px;

            font-weight: 900;

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
              22px
              10px;
          }

          .mvbd-loader {
            width: 62px;

            height: 62px;

            margin:
              0
              auto
              22px;

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
              #52ff95;

            animation:
              mvbdSpin
              0.8s
              linear
              infinite;
          }

          .mvbd-progress-track {
            height: 7px;

            margin-top: 20px;

            overflow: hidden;

            border-radius: 99px;

            background:
              rgba(
                255,
                255,
                255,
                0.07
              );
          }

          .mvbd-progress-fill {
            height: 100%;

            border-radius:
              inherit;

            background:
              linear-gradient(
                90deg,
                #00d95f,
                #72ffac
              );

            transition:
              width
              0.2s
              linear;
          }

          .mvbd-progress-text {
            margin-top: 10px;

            color: #70877c;

            font-size: 10px;
          }

          /* =================================================
             SUCCESS
          ================================================= */

          .mvbd-success {
            text-align: center;

            padding:
              15px
              10px;
          }

          .mvbd-success-icon {
            width: 68px;

            height: 68px;

            display: grid;

            place-items: center;

            margin:
              0
              auto
              18px;

            border-radius: 50%;

            color: #001b0c;

            background:
              linear-gradient(
                135deg,
                #8affb7,
                #29ed78
              );

            font-size: 30px;

            font-weight: 900;

            box-shadow:
              0 0 35px
                rgba(
                  0,
                  255,
                  106,
                  0.22
                );
          }

          /* =================================================
             ANIMATIONS
          ================================================= */

          @keyframes mvbdPulse {
            0%,
            100% {
              opacity: 0.45;

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

              border-radius: 25px;
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

              border-radius: 21px;
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
            .mvbd-loader {
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
                Free Plan
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
                  /* ---------------------------------------
                     RESTRICTED
                  --------------------------------------- */

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

                  /* ---------------------------------------
                     EXTERNAL
                  --------------------------------------- */

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
                          ↗
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

                  /* ---------------------------------------
                     MEBBOOK
                  --------------------------------------- */

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
                          M
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

                  /* ---------------------------------------
                     INFO
                  --------------------------------------- */

                  return (
                    <div
                      key={item.id}
                      className="mvbd-access-button mvbd-access-info"
                    >
                      <div className="mvbd-access-icon">
                        ✓
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
                Complete Payment
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
                Processing Request
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
                Request Submitted
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
