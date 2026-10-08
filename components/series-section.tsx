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

  /* =======================================================
     NEW 3D PLAN DECK STATE
  ======================================================= */

  const [activePlanIndex, setActivePlanIndex] =
    useState(0)

  const [isDeckPaused, setIsDeckPaused] =
    useState(false)

  const [isDragging, setIsDragging] =
    useState(false)

  const dragStartX =
    useRef<number | null>(null)

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
     PLAN HELPERS
  ======================================================= */

  const getPlanName = (plan: Plan) => {
    switch (plan.planId) {
      case "trial":
        return "FREE"

      case "monthly":
        return "1 MONTH"

      case "two_months":
        return "2 MONTHS"

      case "three_months":
        return "3 MONTHS"

      default:
        return plan.planName
    }
  }

  const getPlanDuration = (plan: Plan) => {
    switch (plan.planId) {
      case "trial":
        return "BASIC ACCESS"

      case "monthly":
        return "30 DAYS"

      case "two_months":
        return "60 DAYS"

      case "three_months":
        return "90 DAYS"

      default:
        return "PREMIUM ACCESS"
    }
  }

  const getPlanGradient = (index: number) => {
    const gradients = [
      "linear-gradient(145deg,#07131c 0%,#102c3b 42%,#071016 100%)",
      "linear-gradient(145deg,#13091f 0%,#32125a 45%,#0b0b16 100%)",
      "linear-gradient(145deg,#071b1c 0%,#075b5d 45%,#071116 100%)",
      "linear-gradient(145deg,#1b0b12 0%,#551b42 45%,#0d0a13 100%)",
    ]

    return gradients[index % gradients.length]
  }

  const getPlanAccent = (index: number) => {
    const accents = [
      "#00f5d4",
      "#b66cff",
      "#00d9ff",
      "#ff4fa3",
    ]

    return accents[index % accents.length]
  }

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
     3D DECK NAVIGATION
  ======================================================= */

  const totalPlans =
    SUBSCRIPTION_PLANS.length

  const goToPlan = (index: number) => {
    if (!totalPlans) return

    const normalized =
      (index + totalPlans) %
      totalPlans

    setActivePlanIndex(normalized)
  }

  const nextPlan = () => {
    goToPlan(activePlanIndex + 1)
  }

  const previousPlan = () => {
    goToPlan(activePlanIndex - 1)
  }

  /* =======================================================
     AUTO SLIDER
  ======================================================= */

  useEffect(() => {
    if (
      isDeckPaused ||
      totalPlans <= 1
    ) {
      return
    }

    const timer =
      window.setInterval(() => {
        setActivePlanIndex((current) =>
          (current + 1) % totalPlans,
        )
      }, 4200)

    return () => {
      window.clearInterval(timer)
    }
  }, [
    isDeckPaused,
    totalPlans,
  ])

  /* =======================================================
     DRAG / SWIPE
  ======================================================= */

  const handlePointerDown = (
    event: React.PointerEvent<HTMLDivElement>,
  ) => {
    dragStartX.current =
      event.clientX

    setIsDragging(true)
    setIsDeckPaused(true)
  }

  const handlePointerUp = (
    event: React.PointerEvent<HTMLDivElement>,
  ) => {
    if (
      dragStartX.current === null
    ) {
      setIsDragging(false)
      return
    }

    const difference =
      event.clientX -
      dragStartX.current

    if (Math.abs(difference) > 45) {
      if (difference < 0) {
        nextPlan()
      } else {
        previousPlan()
      }
    }

    dragStartX.current = null
    setIsDragging(false)
    setIsDeckPaused(false)
  }

  const handlePointerCancel = () => {
    dragStartX.current = null
    setIsDragging(false)
    setIsDeckPaused(false)
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
    const trx =
      transactionId.trim()

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

    if (
      selectedPlan.planId ===
      "trial"
    ) {
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
        planId:
          selectedPlan.planId,
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

    if (
      processingTimerRef.current
    ) {
      window.clearInterval(
        processingTimerRef.current,
      )
    }

    if (
      successTimerRef.current
    ) {
      window.clearTimeout(
        successTimerRef.current,
      )
    }

    const startTime =
      Date.now()

    const processingDuration =
      9000

    processingTimerRef.current =
      window.setInterval(() => {
        const elapsed =
          Date.now() -
          startTime

        const percentage =
          Math.min(
            100,
            Math.round(
              (elapsed /
                processingDuration) *
                100,
            ),
          )

        setProgress(
          percentage,
        )

        if (
          percentage >= 100
        ) {
          if (
            processingTimerRef.current
          ) {
            window.clearInterval(
              processingTimerRef.current,
            )
          }

          successTimerRef.current =
            window.setTimeout(
              () => {
                setShowProcessing(
                  false,
                )

                setShowSuccess(
                  true,
                )
              },
              500,
            )
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
    if (
      item.type ===
      "mebook"
    ) {
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
      String(
        item.title || "",
      ).toLowerCase()

    const id =
      String(
        item.id || "",
      ).toLowerCase()

    return (
      item.type ===
        "restricted" ||
      (title.includes("18+") &&
        !item.href) ||
      (title.includes("18 +") &&
        !item.href) ||
      (title.includes("adult") &&
        !item.href) ||
      (title.includes(
        "age-restricted",
      ) &&
        !item.href) ||
      (title.includes(
        "age restricted",
      ) &&
        !item.href) ||
      (id.includes("18") &&
        !item.href) ||
      (id.includes("adult") &&
        !item.href)
    )
  }

  /* =======================================================
     GET DECK CARD POSITION
  ======================================================= */

  const getCardPosition = (
    index: number,
  ) => {
    if (!totalPlans) {
      return {
        position: "center",
        offset: 0,
      }
    }

    let difference =
      index -
      activePlanIndex

    if (
      difference >
      totalPlans / 2
    ) {
      difference -=
        totalPlans
    }

    if (
      difference <
      -totalPlans / 2
    ) {
      difference +=
        totalPlans
    }

    if (difference === 0) {
      return {
        position: "center",
        offset: 0,
      }
    }

    if (difference === -1) {
      return {
        position: "left",
        offset: -1,
      }
    }

    if (difference === 1) {
      return {
        position: "right",
        offset: 1,
      }
    }

    return {
      position:
        difference < 0
          ? "far-left"
          : "far-right",
      offset:
        difference < 0
          ? -2
          : 2,
    }
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

        <div className="mvbd-noise" />

        <div className="mvbd-orb mvbd-orb-one" />
        <div className="mvbd-orb mvbd-orb-two" />
        <div className="mvbd-orb mvbd-orb-three" />

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
              ✦ MOVIESVERSEBD PREMIUM
            </div>

            <h1>
              Choose the Right
              <span>
                Plan for You
              </span>
            </h1>

            <p>
              Unlock more entertainment,
              better quality and premium
              access with a plan that fits
              you.
            </p>

          </section>

          {/* =================================================
              NEW 3D CARD DECK
          ================================================= */}

          <section
            className="mvbd-deck-section"
            onMouseEnter={() =>
              setIsDeckPaused(true)
            }
            onMouseLeave={() =>
              setIsDeckPaused(false)
            }
          >

            <div className="mvbd-deck-heading">

              <span>
                PREMIUM PLANS
              </span>

              <small>
                Swipe or tap a card to explore
              </small>

            </div>

            <div
              className={[
                "mvbd-plan-deck",
                isDragging
                  ? "is-dragging"
                  : "",
              ].join(" ")}
              onPointerDown={
                handlePointerDown
              }
              onPointerUp={
                handlePointerUp
              }
              onPointerCancel={
                handlePointerCancel
              }
            >

              <div className="mvbd-deck-glow" />

              {SUBSCRIPTION_PLANS.map(
                (
                  plan,
                  index,
                ) => {

                  const card =
                    getCardPosition(
                      index,
                    )

                  const isActive =
                    card.position ===
                    "center"

                  const accent =
                    getPlanAccent(
                      index,
                    )

                  const features =
                    plan.features ||
                    []

                  return (
                    <button
                      type="button"
                      key={
                        plan.planId
                      }
                      className={[
                        "mvbd-deck-card",
                        `mvbd-deck-${card.position}`,
                        isActive
                          ? "mvbd-deck-active"
                          : "",
                      ].join(" ")}
                      style={
                        {
                          "--deck-accent":
                            accent,
                          "--deck-bg":
                            getPlanGradient(
                              index,
                            ),
                          "--deck-index":
                            index,
                        } as React.CSSProperties
                      }
                      onClick={() => {

                        if (
                          isActive
                        ) {
                          openPlan(
                            plan,
                          )
                        } else {
                          goToPlan(
                            index,
                          )
                        }

                      }}
                      aria-label={`View ${getPlanName(plan)} plan`}
                    >

                      {/* CARD LIGHT */}
                      <span className="mvbd-deck-card-light" />

                      {/* TOP */}
                      <div className="mvbd-deck-card-top">

                        <div className="mvbd-deck-plan-icon">
                          {plan.sticker ||
                            "✦"}
                        </div>

                        {plan.popular && (
                          <span className="mvbd-deck-popular">
                            ★ POPULAR
                          </span>
                        )}

                      </div>

                      {/* PLAN NAME */}
                      <div className="mvbd-deck-plan-label">
                        {getPlanName(
                          plan,
                        )}
                      </div>

                      <div className="mvbd-deck-plan-sub">
                        {plan.planId ===
                        "trial"
                          ? "BASIC ACCESS"
                          : "PREMIUM MEMBERSHIP"}
                      </div>

                      {/* PRICE */}
                      <div className="mvbd-deck-price">

                        {plan.planId ===
                        "trial"
                          ? "FREE"
                          : plan.price}

                      </div>

                      {/* DURATION */}
                      <div className="mvbd-deck-duration">
                        <span>
                          ✦
                        </span>

                        {getPlanDuration(
                          plan,
                        )}

                      </div>

                      {/* QUALITY */}
                      <div className="mvbd-deck-quality">
                        <span>
                          🎥
                        </span>

                        {plan.videoQuality}

                      </div>

                      {/* FEATURES */}
                      <div className="mvbd-deck-features">

                        {features
                          .slice(
                            0,
                            4,
                          )
                          .map(
                            (
                              feature,
                              featureIndex,
                            ) => (

                              <div
                                key={`${plan.planId}-deck-${featureIndex}`}
                                className={
                                  feature.type ===
                                    "locked" ||
                                  feature.type ===
                                    "restricted"
                                    ? "muted"
                                    : ""
                                }
                              >

                                <span>
                                  {feature.type ===
                                  "locked"
                                    ? "🔒"
                                    : feature.type ===
                                        "restricted"
                                      ? "🔞"
                                      : "✓"}
                                </span>

                                <span>
                                  {
                                    feature.text
                                  }
                                </span>

                              </div>

                            ),
                          )}

                      </div>

                      {/* CARD CTA */}
                      <div className="mvbd-deck-cta">

                        <span>
                          {isActive
                            ? "Choose Plan"
                            : "View Plan"}
                        </span>

                        <b>
                          →
                        </b>

                      </div>

                    </button>
                  )
                },
              )}

            </div>

            {/* ARROWS */}

            <button
              type="button"
              className="mvbd-deck-arrow mvbd-deck-arrow-left"
              onClick={
                previousPlan
              }
              aria-label="Previous plan"
            >
              ‹
            </button>

            <button
              type="button"
              className="mvbd-deck-arrow mvbd-deck-arrow-right"
              onClick={
                nextPlan
              }
              aria-label="Next plan"
            >
              ›
            </button>

            {/* DOTS */}

            <div className="mvbd-deck-dots">

              {SUBSCRIPTION_PLANS.map(
                (
                  plan,
                  index,
                ) => (
                  <button
                    type="button"
                    key={
                      plan.planId
                    }
                    className={
                      index ===
                      activePlanIndex
                        ? "active"
                        : ""
                    }
                    onClick={() =>
                      goToPlan(
                        index,
                      )
                    }
                    aria-label={`Show ${getPlanName(plan)}`}
                  />
                ),
              )}

            </div>

            <div className="mvbd-deck-hint">
              <span>
                ←
              </span>

              Swipe / Drag

              <span>
                →
              </span>
            </div>

          </section>

          {/* =================================================
              ORIGINAL SUBSCRIPTION PLANS
          ================================================= */}

          <section className="mvbd-original-section">

            <div className="mvbd-section-title">

              <div>
                <span>
                  MEMBERSHIP OPTIONS
                </span>

                <h2>
                  Select your
                  subscription
                </h2>
              </div>

              <p>
                Choose a plan below to
                continue.
              </p>

            </div>

            <section className="mvbd-plans-grid">

              {SUBSCRIPTION_PLANS.map(
                (plan) => {

                  const isFree =
                    plan.planId ===
                    "trial"

                  const isMonthly =
                    plan.planId ===
                    "monthly"

                  const isTwoMonths =
                    plan.planId ===
                    "two_months"

                  const features =
                    plan.features ||
                    []

                  return (
                    <article
                      key={
                        plan.planId
                      }
                      className={[
                        "mvbd-plan-card",
                        `mvbd-plan-${plan.planId}`,
                        plan.popular
                          ? "mvbd-plan-popular"
                          : "",
                      ].join(" ")}
                    >

                      <div className="mvbd-card-glow" />

                      {plan.popular && (
                        <div className="mvbd-popular-badge">
                          ⭐ MOST POPULAR
                        </div>
                      )}

                      <div className="mvbd-card-top">

                        <div className="mvbd-plan-icon">
                          {plan.sticker ||
                            "📦"}
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

                      <div className="mvbd-price">

                        {isFree
                          ? "FREE"
                          : plan.price}

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

                        <span>
                          🎥
                        </span>

                        <span>
                          {
                            plan.videoQuality
                          }
                        </span>

                      </div>

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
                                      : "✓"}

                              </span>

                              <span className="feature-text">
                                {
                                  feature.text
                                }
                              </span>

                            </li>

                          ),
                        )}

                      </ul>

                      <button
                        type="button"
                        className="mvbd-choose-button"
                        onClick={() =>
                          openPlan(
                            plan,
                          )
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
                          →
                        </span>

                      </button>

                    </article>
                  )
                },
              )}

            </section>

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
            background: #020205;
            color: #ffffff;
            isolation: isolate;
          }

          /* =================================================
             BACKGROUND
          ================================================= */

          .mvbd-page-background {
            position: fixed;
            inset: 0;
            z-index: -5;
            pointer-events: none;

            background:
              radial-gradient(
                circle at 50% -10%,
                rgba(104, 65, 255, 0.18),
                transparent 35%
              ),
              radial-gradient(
                circle at 10% 55%,
                rgba(0, 230, 210, 0.09),
                transparent 30%
              ),
              radial-gradient(
                circle at 90% 70%,
                rgba(255, 50, 170, 0.08),
                transparent 30%
              ),
              linear-gradient(
                180deg,
                #020205 0%,
                #030812 45%,
                #010104 100%
              );
          }

          .mvbd-page-overlay {
            position: fixed;
            inset: 0;
            z-index: -3;
            pointer-events: none;

            background:
              linear-gradient(
                180deg,
                rgba(0,0,0,0.1),
                rgba(0,0,0,0.35)
              );
          }

          .mvbd-noise {
            position: fixed;
            inset: 0;
            z-index: -2;
            pointer-events: none;
            opacity: 0.035;

            background-image:
              url("data:image/svg+xml,%3Csvg viewBox='0 0 180 180' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='.8'/%3E%3C/svg%3E");
          }

          .mvbd-orb {
            position: fixed;
            pointer-events: none;
            z-index: -4;
            border-radius: 50%;
            filter: blur(80px);
            opacity: 0.25;
          }

          .mvbd-orb-one {
            width: 320px;
            height: 320px;
            top: 8%;
            left: -140px;
            background: #6d28d9;
            animation:
              mvbdOrbOne
              12s
              ease-in-out
              infinite alternate;
          }

          .mvbd-orb-two {
            width: 280px;
            height: 280px;
            top: 42%;
            right: -120px;
            background: #06b6d4;
            animation:
              mvbdOrbTwo
              14s
              ease-in-out
              infinite alternate;
          }

          .mvbd-orb-three {
            width: 230px;
            height: 230px;
            bottom: 5%;
            left: 40%;
            background: #ec4899;
            opacity: 0.13;
            animation:
              mvbdOrbThree
              11s
              ease-in-out
              infinite alternate;
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
            justify-content: space-between;
            gap: 20px;

            padding:
              14px
              24px;

            border:
              1px solid
              rgba(255,255,255,0.09);

            border-radius: 18px;

            background:
              linear-gradient(
                135deg,
                rgba(255,255,255,0.055),
                rgba(255,255,255,0.018)
              );

            backdrop-filter:
              blur(25px);

            -webkit-backdrop-filter:
              blur(25px);

            box-shadow:
              0 20px 60px
              rgba(0,0,0,0.35);
          }

          .mvbd-brand {
            display: flex;
            align-items: center;
            gap: 11px;
          }

          .mvbd-brand-mark {
            width: 34px;
            height: 34px;

            display: grid;
            place-items: center;

            border-radius: 10px;

            font-size: 16px;
            font-weight: 950;

            color: #050509;

            background:
              linear-gradient(
                135deg,
                #00f5d4,
                #00c6ff,
                #a855f7
              );

            box-shadow:
              0 0 25px
              rgba(0,245,212,0.25);
          }

          .mvbd-brand strong {
            display: block;
            font-size: 15px;
            font-weight: 800;
          }

          .mvbd-brand span {
            display: block;
            margin-top: 2px;
            color: #84909d;
            font-size: 10px;
          }

          .mvbd-status {
            display: flex;
            align-items: center;
            gap: 7px;

            padding:
              7px
              13px;

            border-radius: 999px;

            color: #00f5d4;

            background:
              rgba(0,245,212,0.06);

            border:
              1px solid
              rgba(0,245,212,0.16);

            font-size: 9px;
            font-weight: 800;
            letter-spacing: 0.7px;
          }

          .mvbd-status-dot {
            width: 6px;
            height: 6px;
            border-radius: 50%;

            background:
              #00f5d4;

            box-shadow:
              0 0 12px
              #00f5d4;

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
              76px
              16px
              34px;
          }

          .mvbd-eyebrow {
            display: inline-block;

            color: #00f5d4;

            font-size: 10px;
            font-weight: 900;

            letter-spacing: 4px;

            margin-bottom: 17px;

            text-shadow:
              0 0 20px
              rgba(0,245,212,0.35);
          }

          .mvbd-premium-hero h1 {
            margin: 0;

            font-size:
              clamp(
                40px,
                6vw,
                72px
              );

            line-height: 1.02;

            font-weight: 850;

            letter-spacing: -3px;
          }

          .mvbd-premium-hero h1 span {
            display: block;

            background:
              linear-gradient(
                90deg,
                #ffffff 0%,
                #00f5d4 35%,
                #8b5cf6 65%,
                #ff4fa3 100%
              );

            -webkit-background-clip:
              text;

            background-clip:
              text;

            -webkit-text-fill-color:
              transparent;

            filter:
              drop-shadow(
                0 0 25px
                rgba(0,245,212,0.16)
              );
          }

          .mvbd-premium-hero p {
            max-width: 530px;

            margin:
              20px
              auto
              0;

            color: #8995a4;

            font-size: 14px;
            line-height: 1.7;
          }

          /* =================================================
             3D DECK SECTION
          ================================================= */

          .mvbd-deck-section {
            position: relative;

            width: 100%;

            margin:
              10px
              auto
              60px;

            padding:
              0
              10px;
          }

          .mvbd-deck-heading {
            position: relative;
            z-index: 30;

            display: flex;
            flex-direction: column;
            align-items: center;

            gap: 6px;

            margin-bottom: 12px;

            text-align: center;
          }

          .mvbd-deck-heading span {
            font-size: 10px;
            font-weight: 900;
            letter-spacing: 3px;

            color: #a9b2c0;
          }

          .mvbd-deck-heading small {
            color: #66717e;
            font-size: 10px;
          }

          .mvbd-plan-deck {
            position: relative;

            width: 100%;
            height: 430px;

            touch-action: pan-y;

            user-select: none;

            perspective:
              1200px;
          }

          .mvbd-deck-glow {
            position: absolute;

            width: 430px;
            height: 250px;

            left: 50%;
            top: 50%;

            transform:
              translate(
                -50%,
                -45%
              );

            border-radius: 50%;

            background:
              radial-gradient(
                ellipse,
                rgba(
                  0,
                  245,
                  212,
                  0.17
                ),
                rgba(
                  139,
                  92,
                  246,
                  0.09
                ),
                transparent
              );

            filter:
              blur(35px);

            pointer-events: none;

            animation:
              mvbdDeckGlow
              5s
              ease-in-out
              infinite;
          }

          /* =================================================
             DECK CARD
          ================================================= */

          .mvbd-deck-card {
            position: absolute;

            left: 50%;
            top: 50%;

            width:
              min(
                270px,
                62vw
              );

            height: 375px;

            padding:
              22px
              20px
              18px;

            border:
              1px solid
              rgba(255,255,255,0.12);

            border-radius: 24px;

            background:
              var(--deck-bg);

            color: #ffffff;

            cursor: pointer;

            text-align: left;

            overflow: hidden;

            transform-style:
              preserve-3d;

            transition:
              transform
              0.55s
              cubic-bezier(
                .2,
                .8,
                .2,
                1
              ),
              opacity
              0.55s
              ease,
              filter
              0.55s
              ease,
              box-shadow
              0.55s
              ease;

            box-shadow:
              0 30px 70px
              rgba(0,0,0,0.55);

            -webkit-tap-highlight-color:
              transparent;
          }

          .mvbd-deck-card::before {
            content: "";

            position: absolute;

            inset: 0;

            background:
              linear-gradient(
                135deg,
                rgba(255,255,255,0.11),
                transparent 32%,
                transparent 65%,
                rgba(255,255,255,0.025)
              );

            pointer-events: none;
          }

          .mvbd-deck-card::after {
            content: "";

            position: absolute;

            width: 180px;
            height: 180px;

            top: -70px;
            right: -65px;

            border-radius: 50%;

            background:
              var(--deck-accent);

            opacity: 0.16;

            filter:
              blur(35px);

            pointer-events: none;
          }

          .mvbd-deck-active {
            transform:
              translate(
                -50%,
                -50%
              )
              translateZ(80px)
              rotateY(0deg)
              scale(1.04);

            opacity: 1;

            z-index: 20;

            border-color:
              color-mix(
                in srgb,
                var(--deck-accent)
                60%,
                rgba(255,255,255,0.18)
              );

            box-shadow:
              0 40px 100px
              rgba(0,0,0,0.7),
              0 0 50px
              color-mix(
                in srgb,
                var(--deck-accent)
                20%,
                transparent
              );
          }

          .mvbd-deck-left {
            transform:
              translate(
                -50%,
                -50%
              )
              translateX(-235px)
              translateZ(-80px)
              rotateY(18deg)
              scale(0.86);

            opacity: 0.65;

            z-index: 10;

            filter:
              saturate(0.8)
              brightness(0.72);
          }

          .mvbd-deck-right {
            transform:
              translate(
                -50%,
                -50%
              )
              translateX(235px)
              translateZ(-80px)
              rotateY(-18deg)
              scale(0.86);

            opacity: 0.65;

            z-index: 10;

            filter:
              saturate(0.8)
              brightness(0.72);
          }

          .mvbd-deck-far-left {
            transform:
              translate(
                -50%,
                -50%
              )
              translateX(-430px)
              translateZ(-180px)
              rotateY(30deg)
              scale(0.72);

            opacity: 0;

            z-index: 2;
            pointer-events: none;
          }

          .mvbd-deck-far-right {
            transform:
              translate(
                -50%,
                -50%
              )
              translateX(430px)
              translateZ(-180px)
              rotateY(-30deg)
              scale(0.72);

            opacity: 0;

            z-index: 2;
            pointer-events: none;
          }

          .mvbd-deck-card-light {
            position: absolute;

            width: 170px;
            height: 170px;

            left: -60px;
            top: -70px;

            border-radius: 50%;

            background:
              radial-gradient(
                circle,
                var(--deck-accent),
                transparent 68%
              );

            opacity: 0.18;

            filter:
              blur(15px);

            pointer-events: none;
          }

          .mvbd-deck-card-top {
            position: relative;
            z-index: 3;

            display: flex;
            align-items: center;
            justify-content: space-between;
          }

          .mvbd-deck-plan-icon {
            width: 48px;
            height: 48px;

            display: grid;
            place-items: center;

            border-radius: 15px;

            border:
              1px solid
              rgba(255,255,255,0.13);

            background:
              rgba(255,255,255,0.07);

            font-size: 22px;

            box-shadow:
              inset 0 1px 0
              rgba(255,255,255,0.08);
          }

          .mvbd-deck-popular {
            padding:
              6px
              10px;

            border-radius:
              999px;

            color: #050509;

            background:
              linear-gradient(
                90deg,
                #00f5d4,
                #00c6ff
              );

            font-size: 8px;
            font-weight: 950;

            letter-spacing: 0.5px;

            box-shadow:
              0 0 22px
              rgba(0,245,212,0.25);
          }

          .mvbd-deck-plan-label {
            position: relative;
            z-index: 3;

            margin-top: 24px;

            color: #ffffff;

            font-size: 23px;

            font-weight: 900;

            letter-spacing: -0.5px;
          }

          .mvbd-deck-plan-sub {
            position: relative;
            z-index: 3;

            margin-top: 5px;

            color: #84909d;

            font-size: 9px;

            font-weight: 800;

            letter-spacing: 1px;
          }

          .mvbd-deck-price {
            position: relative;
            z-index: 3;

            margin-top: 19px;

            color:
              var(--deck-accent);

            font-size: 39px;

            font-weight: 950;

            letter-spacing: -1.5px;

            text-shadow:
              0 0 24px
              color-mix(
                in srgb,
                var(--deck-accent)
                35%,
                transparent
              );
          }

          .mvbd-deck-duration {
            position: relative;
            z-index: 3;

            display: flex;
            align-items: center;
            gap: 7px;

            width: fit-content;

            margin-top: 8px;

            padding:
              7px
              11px;

            border-radius:
              999px;

            color: #dce6ef;

            background:
              rgba(255,255,255,0.055);

            border:
              1px solid
              rgba(255,255,255,0.08);

            font-size: 9px;
            font-weight: 800;
          }

          .mvbd-deck-duration span {
            color:
              var(--deck-accent);
          }

          .mvbd-deck-quality {
            position: relative;
            z-index: 3;

            display: flex;
            align-items: center;
            gap: 7px;

            margin-top: 11px;

            color: #aab6c2;

            font-size: 10px;
            font-weight: 700;
          }

          .mvbd-deck-features {
            position: relative;
            z-index: 3;

            display: grid;
            gap: 7px;

            margin-top: 18px;
          }

          .mvbd-deck-features > div {
            display: flex;
            align-items: center;
            gap: 7px;

            min-width: 0;

            color: #b8c3ce;

            font-size: 9px;

            white-space: nowrap;

            overflow: hidden;
            text-overflow: ellipsis;
          }

          .mvbd-deck-features > div > span:first-child {
            width: 17px;
            height: 17px;

            flex: 0 0 17px;

            display: grid;
            place-items: center;

            border-radius: 50%;

            color: #06100e;

            background:
              var(--deck-accent);

            font-size: 8px;
          }

          .mvbd-deck-features > div.muted {
            opacity: 0.42;
          }

          .mvbd-deck-cta {
            position: absolute;

            left: 20px;
            right: 20px;
            bottom: 17px;

            z-index: 5;

            display: flex;
            align-items: center;
            justify-content: space-between;

            padding:
              11px
              14px;

            border-radius:
              12px;

            color: #ffffff;

            background:
              rgba(255,255,255,0.055);

            border:
              1px solid
              rgba(255,255,255,0.09);

            font-size: 10px;
            font-weight: 850;
          }

          .mvbd-deck-cta b {
            color:
              var(--deck-accent);

            font-size: 18px;
            line-height: 0;
          }

          .mvbd-deck-card:hover.mvbd-deck-active {
            transform:
              translate(
                -50%,
                -50%
              )
              translateZ(100px)
              rotateY(0deg)
              scale(1.07);

            box-shadow:
              0 45px 110px
              rgba(0,0,0,0.72),
              0 0 70px
              color-mix(
                in srgb,
                var(--deck-accent)
                22%,
                transparent
              );
          }

          .mvbd-plan-deck.is-dragging
            .mvbd-deck-card {
            transition: none;
          }

          /* =================================================
             ARROWS
          ================================================= */

          .mvbd-deck-arrow {
            position: absolute;

            top: 53%;

            transform:
              translateY(-50%);

            z-index: 40;

            width: 43px;
            height: 43px;

            display: grid;
            place-items: center;

            border:
              1px solid
              rgba(255,255,255,0.1);

            border-radius: 50%;

            color: #ffffff;

            background:
              rgba(255,255,255,0.045);

            backdrop-filter:
              blur(15px);

            cursor: pointer;

            font-size: 29px;
            line-height: 1;

            transition:
              transform
              0.2s
              ease,
              background
              0.2s
              ease,
              border-color
              0.2s
              ease;
          }

          .mvbd-deck-arrow:hover {
            background:
              rgba(0,245,212,0.1);

            border-color:
              rgba(0,245,212,0.35);

            transform:
              translateY(-50%)
              scale(1.08);
          }

          .mvbd-deck-arrow-left {
            left: 4px;
          }

          .mvbd-deck-arrow-right {
            right: 4px;
          }

          /* =================================================
             DOTS
          ================================================= */

          .mvbd-deck-dots {
            position: relative;
            z-index: 40;

            display: flex;
            justify-content: center;
            align-items: center;
            gap: 7px;

            margin-top: 8px;
          }

          .mvbd-deck-dots button {
            width: 7px;
            height: 7px;

            padding: 0;

            border: 0;

            border-radius: 999px;

            background:
              rgba(255,255,255,0.2);

            cursor: pointer;

            transition:
              width
              0.3s
              ease,
              background
              0.3s
              ease,
              box-shadow
              0.3s
              ease;
          }

          .mvbd-deck-dots button.active {
            width: 25px;

            background:
              linear-gradient(
                90deg,
                #00f5d4,
                #8b5cf6
              );

            box-shadow:
              0 0 15px
              rgba(0,245,212,0.3);
          }

          .mvbd-deck-hint {
            display: flex;
            justify-content: center;
            align-items: center;
            gap: 10px;

            margin-top: 11px;

            color: #4f5965;

            font-size: 8px;
            letter-spacing: 0.5px;
          }

          .mvbd-deck-hint span {
            color: #71808e;
          }

          /* =================================================
             ORIGINAL SECTION
          ================================================= */

          .mvbd-original-section {
            position: relative;
            margin-top: 20px;
          }

          .mvbd-section-title {
            display: flex;
            align-items: end;
            justify-content: space-between;
            gap: 20px;

            margin:
              0
              0
              20px;
          }

          .mvbd-section-title span {
            color: #00f5d4;

            font-size: 9px;
            font-weight: 900;

            letter-spacing: 2px;
          }

          .mvbd-section-title h2 {
            margin:
              7px
              0
              0;

            font-size: 26px;

            font-weight: 850;

            letter-spacing: -1px;
          }

          .mvbd-section-title p {
            margin: 0;

            color: #65717d;

            font-size: 11px;
          }

          /* =================================================
             PLAN GRID
          ================================================= */

          .mvbd-plans-grid {
            display: grid;

            grid-template-columns:
              repeat(
                4,
                minmax(0,1fr)
              );

            gap: 15px;

            align-items: stretch;
          }

          .mvbd-plan-card {
            --plan-main:
              #00f5d4;

            position: relative;

            min-width: 0;

            min-height: 660px;

            display: flex;
            flex-direction: column;

            padding:
              22px
              18px
              18px;

            overflow: hidden;

            border-radius: 22px;

            background:
              linear-gradient(
                145deg,
                rgba(255,255,255,0.055),
                rgba(255,255,255,0.018)
              );

            border:
              1px solid
              rgba(255,255,255,0.08);

            box-shadow:
              0 25px 65px
              rgba(0,0,0,0.4);

            isolation: isolate;

            transition:
              transform
              0.35s
              ease,
              border-color
              0.35s
              ease,
              box-shadow
              0.35s
              ease;
          }

          .mvbd-plan-card::before {
            content: "";

            position: absolute;

            top: -1px;
            left: 12%;

            width: 76%;
            height: 2px;

            background:
              linear-gradient(
                90deg,
                transparent,
                var(--plan-main),
                transparent
              );

            box-shadow:
              0 0 25px
              var(--plan-main);

            opacity: 0.7;
          }

          .mvbd-plan-card:hover {
            transform:
              translateY(-7px);

            border-color:
              rgba(0,245,212,0.28);

            box-shadow:
              0 35px 85px
              rgba(0,0,0,0.55),
              0 0 35px
              rgba(0,245,212,0.06);
          }

          .mvbd-plan-trial,
          .mvbd-plan-monthly,
          .mvbd-plan-two_months,
          .mvbd-plan-three_months {
            --plan-main:
              #00f5d4;
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
                rgba(0,245,212,0.18),
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
              rgba(0,245,212,0.08);

            border:
              1px solid
              rgba(0,245,212,0.15);

            font-size: 22px;
          }

          .mvbd-plan-name {
            color: #ffffff;

            font-size: 16px;
            line-height: 1.1;

            font-weight: 950;
          }

          .mvbd-plan-subtitle {
            margin-top: 6px;

            color: #7e8995;

            font-size: 9px;
            font-weight: 700;

            letter-spacing: 0.4px;
          }

          .mvbd-price {
            position: relative;
            z-index: 4;

            margin-top: 23px;

            min-height: 65px;

            display: flex;
            align-items: center;

            color:
              var(--plan-main);

            font-size: 42px;

            line-height: 1;

            font-weight: 950;

            letter-spacing: -1.5px;

            text-shadow:
              0 0 20px
              rgba(0,245,212,0.2);
          }

          .mvbd-duration-pill {
            position: relative;
            z-index: 4;

            display: flex;
            align-items: center;
            justify-content: center;

            width: 100%;

            min-height: 37px;

            margin-top: 8px;

            padding:
              7px
              12px;

            border-radius: 999px;

            color: #020706;

            background:
              linear-gradient(
                90deg,
                #00f5d4,
                #00c6ff
              );

            font-size: 9px;
            font-weight: 950;

            letter-spacing: 0.5px;
          }

          .mvbd-quality-badge {
            position: relative;
            z-index: 4;

            display: inline-flex;
            align-items: center;
            justify-content: center;

            align-self: center;

            gap: 6px;

            margin-top: 10px;

            padding:
              6px
              13px;

            border-radius: 999px;

            border:
              1px solid
              rgba(0,245,212,0.14);

            background:
              rgba(0,245,212,0.055);

            color:
              var(--plan-main);

            font-size: 9px;
            font-weight: 900;
          }

          .mvbd-feature-list {
            position: relative;
            z-index: 4;

            list-style: none;

            display: grid;

            flex: 1;

            margin:
              18px
              0
              0;

            padding: 0;
          }

          .mvbd-feature-list li {
            display: flex;
            align-items: flex-start;

            gap: 9px;

            min-height: 48px;

            padding:
              8px
              0;

            border-bottom:
              1px solid
              rgba(255,255,255,0.055);

            color: #aeb9c5;

            font-size: 10.5px;
            line-height: 1.35;
          }

          .mvbd-feature-list li:last-child {
            border-bottom: 0;
          }

          .mvbd-feature-list
            li
            > span:first-child {
            width: 20px;
            height: 20px;

            flex: 0 0 20px;

            display: grid;
            place-items: center;

            border-radius: 50%;

            font-size: 9px;
          }

          .feature-check {
            color: #00100d;
            background: #00f5d4;
          }

          .feature-quality {
            color: #07100d;
            background: #ffd52e;
          }

          .feature-cross {
            color: #ff786b;

            background:
              rgba(255,70,50,0.08);

            border:
              1px solid
              rgba(255,70,50,0.15);
          }

          .feature-restricted {
            color: #ffffff;
            background: #d82929;
          }

          .mvbd-feature-list
            .feature-text {
            flex: 1;
            padding-top: 2px;
          }

          .mvbd-feature-list
            li.locked {
            color: #665f5c;
          }

          .mvbd-choose-button {
            position: relative;
            z-index: 5;

            width: 100%;
            min-height: 54px;

            margin-top: 18px;

            display: flex;
            align-items: center;
            justify-content: center;

            gap: 12px;

            border-radius: 999px;

            border:
              1px solid
              rgba(0,245,212,0.25);

            color: #00f5d4;

            background:
              rgba(0,245,212,0.025);

            cursor: pointer;

            font-size: 11px;
            font-weight: 900;

            transition:
              transform
              0.2s
              ease,
              background
              0.2s
              ease,
              box-shadow
              0.2s
              ease;
          }

          .mvbd-choose-button:hover {
            transform:
              translateY(-2px);

            background:
              rgba(0,245,212,0.08);

            box-shadow:
              0 0 28px
              rgba(0,245,212,0.14);
          }

          .mvbd-button-arrow {
            font-size: 20px;
            line-height: 0;
          }

          .mvbd-popular-badge {
            position: absolute;

            top: 0;
            right: 0;

            z-index: 10;

            padding:
              6px
              13px;

            border-radius:
              0
              0
              0
              14px;

            color: #03100d;

            background:
              linear-gradient(
                135deg,
                #00f5d4,
                #00c6ff
              );

            font-size: 7px;
            font-weight: 950;

            letter-spacing: 0.8px;
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
              30px
              auto
              0;

            padding:
              14px
              17px;

            border-radius: 17px;

            background:
              rgba(255,255,255,0.025);

            border:
              1px solid
              rgba(255,255,255,0.07);

            backdrop-filter:
              blur(20px);
          }

          .mvbd-info-icon {
            width: 36px;
            height: 36px;

            display: grid;
            place-items: center;

            border-radius: 11px;

            color: #00f5d4;

            background:
              rgba(0,245,212,0.07);

            border:
              1px solid
              rgba(0,245,212,0.12);
          }

          .mvbd-payment-info strong {
            display: block;
            font-size: 11px;
          }

          .mvbd-payment-info span {
            display: block;

            margin-top: 3px;

            color: #737e8a;

            font-size: 9px;
          }

          /* =================================================
             FOOTER
          ================================================= */

          .mvbd-premium-footer {
            text-align: center;

            margin-top: 28px;

            color: #4d5661;

            font-size: 9px;
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
              rgba(0,0,0,0.82);

            backdrop-filter:
              blur(12px);

            -webkit-backdrop-filter:
              blur(12px);

            animation:
              mvbdModalIn
              0.2s
              ease
              both;
          }

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

            border-radius: 21px;

            border:
              1px solid
              rgba(0,245,212,0.16);

            background:
              linear-gradient(
                145deg,
                #071019,
                #02070d
              );

            box-shadow:
              0 30px 100px
              rgba(0,0,0,0.9),
              0 0 50px
              rgba(0,245,212,0.05);

            animation:
              mvbdModalScale
              0.24s
              cubic-bezier(
                .2,
                .8,
                .2,
                1
              )
              both;
          }

          .mvbd-modal::-webkit-scrollbar {
            width: 4px;
          }

          .mvbd-modal::-webkit-scrollbar-thumb {
            background: #1d4c4a;
            border-radius: 99px;
          }

          .mvbd-modal-title {
            font-size: 20px;
            font-weight: 750;
            color: #ffffff;
          }

          .mvbd-modal-subtitle {
            margin-top: 8px;

            color: #82909d;

            font-size: 12px;

            line-height: 1.65;
          }

          .mvbd-modal-close {
            float: right;

            width: 32px;
            height: 32px;

            border: 0;

            border-radius: 50%;

            color: #8c98a4;

            background:
              rgba(255,255,255,0.05);

            cursor: pointer;

            font-size: 17px;
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
              rgba(0,245,212,0.1);

            border-radius: 14px;

            background:
              rgba(255,255,255,0.025);

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
              rgba(0,245,212,0.055);

            border-color:
              rgba(0,245,212,0.25);
          }

          .mvbd-access-icon {
            width: 38px;
            height: 38px;

            flex:
              0 0 38px;

            display: grid;
            place-items: center;

            border-radius: 10px;

            background:
              rgba(0,245,212,0.07);

            color: #00f5d4;

            font-size: 18px;
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

            color: #7c8996;

            font-size: 10px;

            line-height: 1.4;
          }

          .mvbd-access-arrow {
            color: #00f5d4;
            font-size: 17px;
          }

          .mvbd-access-info {
            cursor: default;
          }

          .mvbd-access-info:hover {
            background:
              rgba(255,255,255,0.025);
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
              rgba(255,255,255,0.07);
          }

          .mvbd-not-included-title {
            margin-bottom: 12px;

            color: #7e8995;

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
            gap: 8px;
          }

          .mvbd-not-included li {
            color: #665d58;
            font-size: 11px;
          }

          .mvbd-not-included li::before {
            content: "×";
            margin-right: 8px;
            color: #554b46;
          }

          /* =================================================
             PAYMENT MODAL
          ================================================= */

          .mvbd-selected-plan {
            margin-top: 18px;

            padding: 16px;

            border-radius: 12px;

            background:
              rgba(0,245,212,0.035);

            border:
              1px solid
              rgba(0,245,212,0.1);
          }

          .mvbd-selected-plan small {
            display: block;

            color: #77848f;

            font-size: 9px;
            font-weight: 700;

            letter-spacing: 0.5px;
          }

          .mvbd-selected-plan strong {
            display: block;

            margin-top: 6px;

            font-size: 15px;

            color: #ffffff;
          }

          .mvbd-payment-number {
            margin-top: 16px;

            display: flex;
            align-items: center;
            justify-content: space-between;

            gap: 10px;

            padding: 14px;

            border-radius: 12px;

            background:
              rgba(255,255,255,0.035);

            border:
              1px solid
              rgba(255,255,255,0.07);
          }

          .mvbd-payment-number strong {
            color: #00f5d4;
            font-size: 15px;
          }

          .mvbd-copy-button {
            border:
              1px solid
              rgba(255,255,255,0.1);

            border-radius: 8px;

            padding:
              8px
              12px;

            color: #b0bac4;

            background:
              rgba(255,255,255,0.045);

            cursor: pointer;

            font-size: 10px;
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
              rgba(255,255,255,0.09);

            color: #ffffff;

            background:
              rgba(255,255,255,0.035);

            font-size: 13px;
          }

          .mvbd-input:focus {
            border-color:
              rgba(0,245,212,0.5);

            box-shadow:
              0 0 20px
              rgba(0,245,212,0.06);
          }

          .mvbd-error {
            margin-top: 12px;

            padding: 12px;

            border-radius: 10px;

            color: #ff9d9d;

            background:
              rgba(255,50,50,0.07);

            font-size: 11px;

            border:
              1px solid
              rgba(255,50,50,0.12);
          }

          .mvbd-submit-button {
            width: 100%;

            min-height: 50px;

            margin-top: 16px;

            border: 0;

            border-radius: 12px;

            color: #020706;

            background:
              linear-gradient(
                135deg,
                #00f5d4,
                #00c6ff,
                #8b5cf6
              );

            font-size: 13px;
            font-weight: 800;

            cursor: pointer;

            box-shadow:
              0 12px 30px
              rgba(0,245,212,0.1);
          }

          .mvbd-submit-button:hover {
            filter:
              brightness(1.08);
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
              rgba(255,255,255,0.07);

            border-top-color:
              #00f5d4;

            border-right-color:
              #8b5cf6;

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
              rgba(255,255,255,0.06);
          }

          .mvbd-progress-fill {
            height: 100%;

            border-radius:
              inherit;

            background:
              linear-gradient(
                90deg,
                #00f5d4,
                #00c6ff,
                #8b5cf6
              );

            transition:
              width
              0.2s
              linear;
          }

          .mvbd-progress-text {
            margin-top: 12px;

            color: #7e8995;

            font-size: 11px;
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

            color: #020706;

            background:
              linear-gradient(
                135deg,
                #00f5d4,
                #00c6ff,
                #8b5cf6
              );

            font-size: 28px;
            font-weight: 900;

            box-shadow:
              0 0 35px
              rgba(0,245,212,0.2);
          }

          /* =================================================
             ANIMATIONS
          ================================================= */

          @keyframes mvbdPulse {
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

          @keyframes mvbdCardGlow {
            0%,
            100% {
              opacity: 0.4;

              transform:
                translateX(-50%)
                scale(0.95);
            }

            50% {
              opacity: 0.8;

              transform:
                translateX(-50%)
                scale(1.12);
            }
          }

          @keyframes mvbdDeckGlow {
            0%,
            100% {
              transform:
                translate(
                  -50%,
                  -45%
                )
                scale(0.9);

              opacity: 0.65;
            }

            50% {
              transform:
                translate(
                  -50%,
                  -45%
                )
                scale(1.12);

              opacity: 1;
            }
          }

          @keyframes mvbdOrbOne {
            from {
              transform:
                translate3d(
                  0,
                  0,
                  0
                );
            }

            to {
              transform:
                translate3d(
                  100px,
                  80px,
                  0
                );
            }
          }

          @keyframes mvbdOrbTwo {
            from {
              transform:
                translate3d(
                  0,
                  0,
                  0
                );
            }

            to {
              transform:
                translate3d(
                  -100px,
                  -70px,
                  0
                );
            }
          }

          @keyframes mvbdOrbThree {
            from {
              transform:
                translate3d(
                  -40px,
                  0,
                  0
                );
            }

            to {
              transform:
                translate3d(
                  70px,
                  -50px,
                  0
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
                  minmax(0,1fr)
                );
            }

            .mvbd-deck-card {
              width: 260px;
            }

            .mvbd-deck-left {
              transform:
                translate(
                  -50%,
                  -50%
                )
                translateX(-200px)
                translateZ(-80px)
                rotateY(17deg)
                scale(0.84);
            }

            .mvbd-deck-right {
              transform:
                translate(
                  -50%,
                  -50%
                )
                translateX(200px)
                translateZ(-80px)
                rotateY(-17deg)
                scale(0.84);
            }
          }

          /* =================================================
             MOBILE
          ================================================= */

          @media (max-width: 700px) {

            .mvbd-page-content {
              width:
                calc(100% - 18px);

              padding-top: 10px;
              padding-bottom: 35px;
            }

            .mvbd-premium-header {
              padding:
                10px
                12px;

              border-radius: 17px;
            }

            .mvbd-brand-mark {
              width: 36px;
              height: 36px;

              border-radius: 11px;

              font-size: 20px;
            }

            .mvbd-brand strong {
              font-size: 12px;
            }

            .mvbd-brand span {
              font-size: 8px;
            }

            .mvbd-status {
              padding:
                6px
                8px;

              font-size: 7px;
            }

            .mvbd-premium-hero {
              padding:
                48px
                6px
                25px;
            }

            .mvbd-premium-hero h1 {
              font-size: 38px;
              letter-spacing: -2px;
            }

            .mvbd-premium-hero p {
              font-size: 11px;
              max-width: 350px;
            }

            .mvbd-deck-section {
              margin-bottom: 45px;
            }

            .mvbd-plan-deck {
              height: 410px;
            }

            .mvbd-deck-card {
              width: 245px;
              height: 360px;

              padding:
                19px
                17px
                16px;

              border-radius: 22px;
            }

            .mvbd-deck-active {
              transform:
                translate(
                  -50%,
                  -50%
                )
                translateZ(50px)
                scale(1);
            }

            .mvbd-deck-left {
              transform:
                translate(
                  -50%,
                  -50%
                )
                translateX(-145px)
                translateZ(-90px)
                rotateY(20deg)
                scale(0.77);

              opacity: 0.28;
            }

            .mvbd-deck-right {
              transform:
                translate(
                  -50%,
                  -50%
                )
                translateX(145px)
                translateZ(-90px)
                rotateY(-20deg)
                scale(0.77);

              opacity: 0.28;
            }

            .mvbd-deck-far-left,
            .mvbd-deck-far-right {
              opacity: 0;
            }

            .mvbd-deck-arrow {
              width: 38px;
              height: 38px;

              top: 52%;

              font-size: 25px;
            }

            .mvbd-deck-arrow-left {
              left: 0;
            }

            .mvbd-deck-arrow-right {
              right: 0;
            }

            .mvbd-deck-plan-label {
              font-size: 21px;
            }

            .mvbd-deck-price {
              font-size: 36px;
            }

            .mvbd-deck-features > div {
              font-size: 8.5px;
            }

            .mvbd-section-title {
              align-items: flex-start;
              flex-direction: column;
              gap: 7px;
            }

            .mvbd-section-title h2 {
              font-size: 23px;
            }

            .mvbd-plans-grid {
              grid-template-columns: 1fr;
              gap: 15px;
            }

            .mvbd-plan-card {
              min-height: auto;

              padding:
                21px
                17px
                17px;
            }

            .mvbd-price {
              font-size: 40px;
            }

          }

          /* =================================================
             SMALL MOBILE
          ================================================= */

          @media (max-width: 400px) {

            .mvbd-page-content {
              width:
                calc(100% - 14px);
            }

            .mvbd-status {
              display: none;
            }

            .mvbd-premium-hero h1 {
              font-size: 33px;
            }

            .mvbd-plan-deck {
              height: 390px;
            }

            .mvbd-deck-card {
              width: 225px;
              height: 345px;
            }

            .mvbd-deck-left {
              transform:
                translate(
                  -50%,
                  -50%
                )
                translateX(-115px)
                translateZ(-100px)
                rotateY(22deg)
                scale(0.72);
            }

            .mvbd-deck-right {
              transform:
                translate(
                  -50%,
                  -50%
                )
                translateX(115px)
                translateZ(-100px)
                rotateY(-22deg)
                scale(0.72);
            }

            .mvbd-deck-arrow {
              width: 34px;
              height: 34px;
            }

            .mvbd-deck-plan-label {
              font-size: 19px;
            }

            .mvbd-deck-price {
              font-size: 33px;
            }

            .mvbd-deck-features {
              margin-top: 14px;
              gap: 5px;
            }

            .mvbd-deck-features > div {
              font-size: 8px;
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
            prefers-reduced-motion: reduce
          ) {

            .mvbd-plan-card,
            .mvbd-deck-card,
            .mvbd-deck-arrow,
            .mvbd-choose-button {
              transition: none;
            }

            .mvbd-card-glow,
            .mvbd-status-dot,
            .mvbd-loader,
            .mvbd-orb,
            .mvbd-deck-glow {
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
                onClick={
                  closeFreeAccess
                }
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
                        key={
                          item.id
                        }
                        className="mvbd-access-button mvbd-access-restricted"
                      >

                        <div className="mvbd-access-icon">
                          🔒
                        </div>

                        <div className="mvbd-access-text">

                          <strong>
                            {
                              item.title
                            }
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
                        key={
                          item.id
                        }
                        href={
                          item.href
                        }
                        target="_blank"
                        rel="noreferrer"
                        className="mvbd-access-button"
                      >

                        <div className="mvbd-access-icon">
                          {
                            item.sticker ||
                            "↗"
                          }
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

                      </a>
                    )
                  }

                  if (
                    item.type ===
                    "mebook"
                  ) {
                    return (
                      <button
                        key={
                          item.id
                        }
                        type="button"
                        className="mvbd-access-button"
                        onClick={() =>
                          handleFreeAccess(
                            item,
                          )
                        }
                      >

                        <div className="mvbd-access-icon">
                          {
                            item.sticker ||
                            "M"
                          }
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
                      key={
                        item.id
                      }
                      className="mvbd-access-button mvbd-access-info"
                    >

                      <div className="mvbd-access-icon">
                        {
                          item.sticker ||
                          "✓"
                        }
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
                        <li
                          key={
                            item
                          }
                        >
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
                onClick={
                  closePayment
                }
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
                  {
                    selectedPlan.sticker
                  }{" "}
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
                value={
                  transactionId
                }
                onChange={(
                  event,
                ) =>
                  setTransactionId(
                    event.target
                      .value,
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
                    width:
                      `${progress}%`,
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
