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
        <div className="mvbd-page-background" />
        <div className="mvbd-page-noise" />

        <div className="mvbd-page-content">

          {/* =================================================
              TOP BRAND
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
              ✦ PREMIUM MEMBERSHIP
            </div>

            <h1>
              Choose the Right
              <br />
              <span>
                Plan for You
              </span>
            </h1>

            <p>
              Select a membership plan
              that works best for you.
            </p>

            <div className="mvbd-billing-toggle">
              <span className="active">
                Monthly
              </span>

              <span>
                Yearly
              </span>

              <b>
                SAVE
              </b>
            </div>

          </section>

          {/* =================================================
              PLANS
          ================================================= */}

          <section className="mvbd-plans-grid">

            {SUBSCRIPTION_PLANS.map(
              (plan, index) => {

                const isFree =
                  plan.planId === "trial"

                const isMonthly =
                  plan.planId === "monthly"

                const isTwoMonths =
                  plan.planId === "two_months"

                const isThreeMonths =
                  plan.planId === "three_months"

                const features =
                  plan.features || []

                const isFeatured =
                  plan.popular ||
                  index === 1

                const isEnterprise =
                  index === 3

                return (
                  <article
                    key={plan.planId}
                    className={[
                      "mvbd-plan-card",
                      isFeatured
                        ? "mvbd-plan-featured"
                        : "",
                      isEnterprise
                        ? "mvbd-plan-enterprise"
                        : "",
                    ].join(" ")}
                  >

                    {/* CARD LIGHT */}

                    <div className="mvbd-card-light" />

                    {/* POPULAR */}

                    {isFeatured &&
                      !isEnterprise && (
                        <div className="mvbd-popular-badge">
                          MOST POPULAR
                        </div>
                      )}

                    {/* =================================================
                        NORMAL CARD
                    ================================================= */}

                    <div className="mvbd-plan-inner">

                      <div className="mvbd-card-top">

                        <div className="mvbd-plan-heading">

                          <div className="mvbd-plan-name">
                            {isFree
                              ? "Starter"
                              : isMonthly
                                ? "Basic"
                                : isTwoMonths
                                  ? "Scale"
                                  : "Premium"}
                          </div>

                          <div className="mvbd-plan-small">
                            {isFree
                              ? "FREE ACCESS"
                              : "SUBSCRIPTION"}
                          </div>

                        </div>

                        {plan.sticker && (
                          <div className="mvbd-plan-sticker">
                            {plan.sticker}
                          </div>
                        )}

                      </div>

                      {/* PRICE */}

                      <div className="mvbd-price-row">

                        <div className="mvbd-price">
                          {isFree
                            ? "FREE"
                            : plan.price}
                        </div>

                        {!isFree && (
                          <span className="mvbd-price-period">
                            / plan
                          </span>
                        )}

                      </div>

                      {/* DESCRIPTION */}

                      <p className="mvbd-plan-description">
                        {isFree
                          ? "Explore MoviesVerseBD with basic access."
                          : "Everything you need for a better viewing experience."}
                      </p>

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
                          →
                        </span>
                      </button>

                      {/* FEATURES */}

                      <div className="mvbd-features-title">
                        INCLUDED
                      </div>

                      <ul className="mvbd-feature-list">

                        {features.map(
                          (
                            feature,
                            featureIndex,
                          ) => (
                            <li
                              key={`${plan.planId}-${featureIndex}`}
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
                                  ? "×"
                                  : feature.type ===
                                      "restricted"
                                    ? "18+"
                                    : feature.type ===
                                        "quality"
                                      ? "★"
                                      : "✓"}
                              </span>

                              <span className="feature-text">
                                {feature.text}
                              </span>

                            </li>
                          ),
                        )}

                      </ul>

                    </div>

                    {/* =================================================
                        ENTERPRISE / FOURTH CARD
                    ================================================= */}

                    {isEnterprise && (
                      <div className="mvbd-enterprise-layout">

                        <div className="mvbd-enterprise-left">

                          <div className="mvbd-plan-small">
                            PREMIUM
                          </div>

                          <div className="mvbd-enterprise-title">
                            {plan.price ||
                              "Custom"}
                          </div>

                          <p>
                            {plan.planName ||
                              "Premium membership plan"}
                          </p>

                          <button
                            type="button"
                            className="mvbd-enterprise-button"
                            onClick={() =>
                              openPlan(plan)
                            }
                          >
                            Get Started
                            <span>
                              →
                            </span>
                          </button>

                        </div>

                        <div className="mvbd-enterprise-right">

                          <div className="mvbd-features-title">
                            INCLUDED
                          </div>

                          <ul className="mvbd-feature-list">

                            {features.map(
                              (
                                feature,
                                featureIndex,
                              ) => (
                                <li
                                  key={`enterprise-${plan.planId}-${featureIndex}`}
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
                                      ? "×"
                                      : feature.type ===
                                          "restricted"
                                        ? "18+"
                                        : feature.type ===
                                            "quality"
                                          ? "★"
                                          : "✓"}
                                  </span>

                                  <span className="feature-text">
                                    {feature.text}
                                  </span>

                                </li>
                              ),
                            )}

                          </ul>

                        </div>

                      </div>
                    )}

                  </article>
                )
              },
            )}

          </section>

          {/* =================================================
              SECURE PAYMENT
          ================================================= */}

          <section className="mvbd-payment-info">

            <div className="mvbd-info-icon">
              ✓
            </div>

            <div>
              <strong>
                Secure & Verified Payment
              </strong>

              <span>
                Paid plans are activated
                after transaction verification.
              </span>
            </div>

          </section>

          {/* =================================================
              FOOTER
          ================================================= */}

          <footer className="mvbd-premium-footer">
            <span>
              MoviesVerseBD
            </span>
            <i>•</i>
            MVBD Premium Membership
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
            background: #000;
            color: #fff;
            isolation: isolate;
          }

          .mvbd-page-background {
            position: fixed;
            inset: 0;
            z-index: -5;
            pointer-events: none;

            background:
              radial-gradient(
                ellipse 650px 450px at 50% 28%,
                rgba(0, 255, 220, .105),
                transparent 65%
              ),
              radial-gradient(
                ellipse 500px 500px at 50% 100%,
                rgba(0, 105, 120, .08),
                transparent 70%
              ),
              #000;
          }

          .mvbd-page-noise {
            position: fixed;
            inset: 0;
            z-index: -4;
            pointer-events: none;
            opacity: .16;

            background-image:
              radial-gradient(
                rgba(255,255,255,.16) .5px,
                transparent .5px
              );

            background-size: 5px 5px;
          }

          /* =================================================
             CONTENT
          ================================================= */

          .mvbd-page-content {
            position: relative;
            z-index: 1;

            width:
              min(
                1100px,
                calc(100% - 34px)
              );

            margin: 0 auto;

            padding:
              18px
              0
              48px;
          }

          /* =================================================
             HEADER
          ================================================= */

          .mvbd-premium-header {
            display: flex;
            align-items: center;
            justify-content: space-between;

            padding:
              10px
              15px;

            border-radius: 13px;

            background:
              rgba(5, 11, 15, .58);

            border:
              1px solid
              rgba(255,255,255,.055);

            backdrop-filter:
              blur(20px);
          }

          .mvbd-brand {
            display: flex;
            align-items: center;
            gap: 9px;
          }

          .mvbd-brand-mark {
            width: 29px;
            height: 29px;

            display: grid;
            place-items: center;

            border-radius: 8px;

            font-size: 13px;
            font-weight: 900;

            color: #00110e;

            background:
              linear-gradient(
                135deg,
                #b8fff2,
                #00ffc8
              );

            box-shadow:
              0 0 22px
              rgba(0,255,200,.2);
          }

          .mvbd-brand strong {
            display: block;

            font-size: 12px;
            line-height: 1.2;
            font-weight: 750;
          }

          .mvbd-brand span {
            display: block;

            margin-top: 2px;

            color: #71808a;

            font-size: 7px;
            letter-spacing: .7px;
            text-transform: uppercase;
          }

          .mvbd-status {
            display: flex;
            align-items: center;
            gap: 6px;

            color: #7f9996;

            font-size: 7px;
            letter-spacing: 1px;
            font-weight: 700;
          }

          .mvbd-status-dot {
            width: 5px;
            height: 5px;

            border-radius: 50%;

            background: #00ffc8;

            box-shadow:
              0 0 10px
              rgba(0,255,200,.9);
          }

          /* =================================================
             HERO
          ================================================= */

          .mvbd-premium-hero {
            text-align: center;

            padding:
              62px
              10px
              42px;
          }

          .mvbd-eyebrow {
            margin-bottom: 12px;

            color: #79938e;

            font-size: 7px;
            letter-spacing: 2.7px;
            font-weight: 800;
          }

          .mvbd-premium-hero h1 {
            margin: 0;

            color: #f2f7f7;

            font-size:
              clamp(
                31px,
                4.3vw,
                52px
              );

            line-height: .98;

            font-weight: 500;

            letter-spacing: -2.5px;

            text-shadow:
              0 0 30px
              rgba(255,255,255,.06);
          }

          .mvbd-premium-hero h1 span {
            color: #fff;
          }

          .mvbd-premium-hero p {
            margin:
              13px
              auto
              0;

            color: #65747a;

            font-size: 9px;

            line-height: 1.6;
          }

          /* =================================================
             BILLING TOGGLE
          ================================================= */

          .mvbd-billing-toggle {
            position: relative;

            display: inline-flex;
            align-items: center;

            margin-top: 16px;

            padding: 3px;

            border:
              1px solid
              rgba(255,255,255,.08);

            border-radius: 999px;

            background:
              rgba(255,255,255,.035);

            color: #66757b;

            font-size: 7px;
            font-weight: 700;
          }

          .mvbd-billing-toggle span {
            padding:
              6px
              12px;

            border-radius: 999px;
          }

          .mvbd-billing-toggle span.active {
            color: #c9ffff;

            background:
              rgba(0,255,200,.09);
          }

          .mvbd-billing-toggle b {
            margin-left: 2px;
            margin-right: 5px;

            color: #00ffc8;

            font-size: 6px;
          }

          /* =================================================
             PLAN GRID
          ================================================= */

          .mvbd-plans-grid {
            display: grid;

            grid-template-columns:
              repeat(
                3,
                minmax(0, 1fr)
              );

            gap: 13px;

            align-items: stretch;
          }

          /* =================================================
             PLAN CARD
          ================================================= */

          .mvbd-plan-card {
            --cyan:
              #00e7cf;

            position: relative;

            min-width: 0;

            min-height: 430px;

            overflow: hidden;

            border-radius: 15px;

            border:
              1px solid
              rgba(83,150,153,.13);

            background:
              linear-gradient(
                145deg,
                rgba(10,23,28,.93),
                rgba(3,11,15,.96)
              );

            box-shadow:
              0 25px 70px
              rgba(0,0,0,.5);

            transition:
              transform .28s ease,
              border-color .28s ease,
              box-shadow .28s ease;
          }

          .mvbd-plan-card:hover {
            transform:
              translateY(-4px);

            border-color:
              rgba(0,255,220,.28);

            box-shadow:
              0 30px 80px
              rgba(0,0,0,.7),
              0 0 35px
              rgba(0,255,210,.045);
          }

          /* =================================================
             CARD LIGHT
          ================================================= */

          .mvbd-card-light {
            position: absolute;

            width: 250px;
            height: 180px;

            top: -90px;
            left: 50%;

            transform:
              translateX(-50%);

            border-radius: 50%;

            pointer-events: none;

            background:
              radial-gradient(
                ellipse,
                rgba(0,255,220,.10),
                transparent 68%
              );

            filter:
              blur(12px);
          }

          .mvbd-plan-featured {
            border-color:
              rgba(0,255,220,.35);

            box-shadow:
              0 0 0 1px
              rgba(0,255,220,.04),
              0 30px 90px
              rgba(0,0,0,.7),
              0 0 45px
              rgba(0,255,220,.07);
          }

          .mvbd-plan-featured .mvbd-card-light {
            width: 320px;
            height: 250px;

            top: -105px;

            background:
              radial-gradient(
                ellipse,
                rgba(0,255,220,.25),
                rgba(0,255,220,.08) 32%,
                transparent 68%
              );

            filter:
              blur(10px);
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
              5px
              10px;

            border-radius:
              0
              0
              0
              9px;

            color: #02110e;

            background:
              linear-gradient(
                135deg,
                #bafff2,
                #00ffc8
              );

            font-size: 6px;
            letter-spacing: .8px;
            font-weight: 950;

            box-shadow:
              0 0 20px
              rgba(0,255,200,.25);
          }

          /* =================================================
             CARD INNER
          ================================================= */

          .mvbd-plan-inner {
            position: relative;
            z-index: 2;

            height: 100%;

            display: flex;
            flex-direction: column;

            padding:
              21px
              18px
              17px;
          }

          .mvbd-card-top {
            display: flex;

            align-items: flex-start;
            justify-content: space-between;
          }

          .mvbd-plan-name {
            color: #edf7f6;

            font-size: 11px;
            font-weight: 800;

            letter-spacing: .1px;
          }

          .mvbd-plan-small {
            margin-top: 5px;

            color: #66777c;

            font-size: 6px;
            font-weight: 800;

            letter-spacing: 1.2px;
          }

          .mvbd-plan-sticker {
            display: grid;
            place-items: center;

            width: 27px;
            height: 27px;

            border-radius: 8px;

            color: #00e6cf;

            background:
              rgba(0,255,210,.06);

            border:
              1px solid
              rgba(0,255,210,.13);

            font-size: 13px;
          }

          /* =================================================
             PRICE
          ================================================= */

          .mvbd-price-row {
            display: flex;
            align-items: baseline;

            margin-top: 18px;
          }

          .mvbd-price {
            color: #f1f8f7;

            font-size:
              clamp(
                29px,
                3vw,
                39px
              );

            line-height: 1;

            font-weight: 500;

            letter-spacing:
              -1.5px;
          }

          .mvbd-plan-featured .mvbd-price {
            color: #dffefa;

            text-shadow:
              0 0 25px
              rgba(0,255,210,.18);
          }

          .mvbd-price-period {
            margin-left: 5px;

            color: #56676d;

            font-size: 7px;
          }

          /* =================================================
             DESCRIPTION
          ================================================= */

          .mvbd-plan-description {
            min-height: 36px;

            margin:
              10px
              0
              8px;

            color: #637379;

            font-size: 7px;

            line-height: 1.55;
          }

          /* =================================================
             BUTTON
          ================================================= */

          .mvbd-choose-button {
            display: flex;
            align-items: center;
            justify-content: space-between;

            width: 100%;
            min-height: 32px;

            padding:
              0
              12px;

            border:
              1px solid
              rgba(255,255,255,.09);

            border-radius: 999px;

            color: #c4d1d0;

            background:
              rgba(255,255,255,.025);

            cursor: pointer;

            font-size: 7px;
            font-weight: 800;

            transition:
              all .2s ease;
          }

          .mvbd-choose-button:hover {
            color: #00110e;

            border-color:
              transparent;

            background:
              linear-gradient(
                90deg,
                #cafff5,
                #00ffc8
              );

            box-shadow:
              0 0 22px
              rgba(0,255,200,.16);
          }

          .mvbd-button-arrow {
            font-size: 13px;
            color: #00d9c2;
          }

          .mvbd-choose-button:hover
            .mvbd-button-arrow {
            color: #00110e;
          }

          /* =================================================
             FEATURES
          ================================================= */

          .mvbd-features-title {
            margin-top: 18px;
            margin-bottom: 4px;

            color: #526269;

            font-size: 5.5px;
            font-weight: 800;

            letter-spacing: 1.1px;
          }

          .mvbd-feature-list {
            list-style: none;

            display: grid;

            gap: 0;

            margin: 0;
            padding: 0;
          }

          .mvbd-feature-list li {
            display: flex;
            align-items: center;

            min-height: 29px;

            border-bottom:
              1px solid
              rgba(255,255,255,.035);

            color: #8b9a9e;

            font-size: 7px;

            line-height: 1.3;
          }

          .mvbd-feature-list li:last-child {
            border-bottom: 0;
          }

          .mvbd-feature-list
            li
            > span:first-child {
            width: 13px;
            height: 13px;

            flex:
              0
              0
              13px;

            display: grid;
            place-items: center;

            margin-right: 7px;

            border-radius: 50%;

            font-size: 6px;
            font-weight: 900;
          }

          .feature-check {
            color: #00110e;
            background: #00e6c8;
          }

          .feature-quality {
            color: #111;
            background: #d8c56c;
          }

          .feature-cross {
            color: #77625d;

            background:
              rgba(255,70,50,.05);

            border:
              1px solid
              rgba(255,70,50,.1);
          }

          .feature-restricted {
            color: #fff;

            background:
              #9e3030;

            font-size: 4.5px !important;
          }

          .mvbd-feature-list
            .feature-text {
            flex: 1;
          }

          .mvbd-feature-list
            li.locked {
            color: #4f5151;
          }

          /* =================================================
             ENTERPRISE / FOURTH CARD
          ================================================= */

          .mvbd-plan-enterprise {
            grid-column:
              1 / -1;

            min-height: 155px;

            background:
              linear-gradient(
                100deg,
                rgba(7,17,22,.98),
                rgba(5,15,20,.94)
              );
          }

          .mvbd-plan-enterprise
            .mvbd-card-light {
            left: 20%;
            top: -150px;

            width: 450px;
            height: 250px;
          }

          .mvbd-enterprise-layout {
            position: relative;
            z-index: 2;

            height: 100%;

            display: grid;

            grid-template-columns:
              32%
              68%;
          }

          .mvbd-enterprise-left {
            display: flex;
            flex-direction: column;
            justify-content: center;

            padding:
              22px
              25px;

            border-right:
              1px solid
              rgba(255,255,255,.045);
          }

          .mvbd-enterprise-title {
            margin-top: 3px;

            color: #f3f8f7;

            font-size: 27px;
            line-height: 1;

            font-weight: 400;

            letter-spacing: -1px;
          }

          .mvbd-enterprise-left p {
            margin:
              8px
              0
              12px;

            color: #617176;

            font-size: 7px;
          }

          .mvbd-enterprise-button {
            width: 105px;
            height: 27px;

            display: flex;
            align-items: center;
            justify-content: space-between;

            padding:
              0
              10px;

            border:
              1px solid
              rgba(0,255,210,.16);

            border-radius: 999px;

            color: #98aaa9;

            background:
              rgba(0,255,210,.025);

            cursor: pointer;

            font-size: 6px;
            font-weight: 800;

            transition:
              all .2s ease;
          }

          .mvbd-enterprise-button span {
            color: #00d9c2;
            font-size: 11px;
          }

          .mvbd-enterprise-button:hover {
            color: #00110e;

            background:
              #00e6c8;

            border-color:
              #00e6c8;
          }

          .mvbd-enterprise-button:hover span {
            color: #00110e;
          }

          .mvbd-enterprise-right {
            padding:
              19px
              25px;
          }

          .mvbd-enterprise-right
            .mvbd-features-title {
            margin-top: 0;
          }

          .mvbd-enterprise-right
            .mvbd-feature-list {
            display: grid;

            grid-template-columns:
              repeat(
                2,
                minmax(0,1fr)
              );

            column-gap: 25px;
          }

          .mvbd-enterprise-right
            .mvbd-feature-list li {
            min-height: 27px;
          }

          /* =================================================
             PAYMENT
          ================================================= */

          .mvbd-payment-info {
            display: flex;
            align-items: center;
            justify-content: center;

            gap: 9px;

            width: fit-content;

            margin:
              25px
              auto
              0;

            color: #6c7b7e;

            font-size: 7px;
          }

          .mvbd-info-icon {
            width: 17px;
            height: 17px;

            display: grid;
            place-items: center;

            border-radius: 50%;

            color: #00e6c8;

            border:
              1px solid
              rgba(0,255,210,.13);

            background:
              rgba(0,255,210,.04);

            font-size: 8px;
          }

          .mvbd-payment-info strong {
            color: #89999b;

            font-size: 7px;
          }

          .mvbd-payment-info span {
            display: block;

            margin-top: 2px;

            color: #536267;

            font-size: 6px;
          }

          /* =================================================
             FOOTER
          ================================================= */

          .mvbd-premium-footer {
            margin-top: 25px;

            text-align: center;

            color: #414d51;

            font-size: 6px;

            letter-spacing: .3px;
          }

          .mvbd-premium-footer span {
            color: #657477;
          }

          .mvbd-premium-footer i {
            margin: 0 5px;

            color: #263336;

            font-style: normal;
          }

          /* =================================================
             MODAL
          ================================================= */

          .mvbd-modal-backdrop {
            position: fixed;
            inset: 0;
            z-index: 99999;

            display: flex;
            align-items: center;
            justify-content: center;

            padding: 15px;

            background:
              rgba(0,0,0,.88);

            backdrop-filter:
              blur(10px);

            animation:
              mvbdModalIn
              .2s
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

            padding: 25px;

            border-radius: 17px;

            border:
              1px solid
              rgba(0,255,200,.16);

            background:
              #061014;

            box-shadow:
              0 30px 100px
              rgba(0,0,0,.9);

            animation:
              mvbdModalScale
              .25s
              cubic-bezier(
                .2,.8,.2,1
              )
              both;
          }

          .mvbd-modal::-webkit-scrollbar {
            width: 4px;
          }

          .mvbd-modal::-webkit-scrollbar-thumb {
            background: #17423e;
            border-radius: 99px;
          }

          .mvbd-modal-title {
            color: #fff;

            font-size: 19px;
            font-weight: 700;
          }

          .mvbd-modal-subtitle {
            margin-top: 7px;

            color: #78888c;

            font-size: 12px;
            line-height: 1.6;
          }

          .mvbd-modal-close {
            float: right;

            width: 29px;
            height: 29px;

            border: 0;
            border-radius: 50%;

            color: #78888c;

            background:
              rgba(255,255,255,.05);

            cursor: pointer;

            font-size: 17px;
          }

          /* =================================================
             FREE ACCESS
          ================================================= */

          .mvbd-free-access-list {
            display: grid;
            gap: 9px;

            margin-top: 18px;
          }

          .mvbd-access-button {
            width: 100%;

            display: flex;
            align-items: center;

            gap: 11px;

            padding: 13px;

            border:
              1px solid
              rgba(0,255,200,.12);

            border-radius: 12px;

            background:
              rgba(255,255,255,.025);

            color: #fff;

            text-align: left;

            cursor: pointer;

            transition:
              all .2s ease;
          }

          .mvbd-access-button:hover {
            border-color:
              rgba(0,255,200,.35);

            background:
              rgba(0,255,200,.05);
          }

          .mvbd-access-icon {
            width: 36px;
            height: 36px;

            flex:
              0
              0
              36px;

            display: grid;
            place-items: center;

            border-radius: 9px;

            color: #00ffc8;

            background:
              rgba(0,255,200,.07);
          }

          .mvbd-access-text {
            flex: 1;
          }

          .mvbd-access-text strong {
            display: block;

            font-size: 12px;
          }

          .mvbd-access-text span {
            display: block;

            margin-top: 3px;

            color: #718084;

            font-size: 10px;
            line-height: 1.4;
          }

          .mvbd-access-arrow {
            color: #00ffc8;
          }

          .mvbd-access-restricted {
            opacity: .55;
            cursor: not-allowed;
          }

          .mvbd-access-info {
            cursor: default;
          }

          .mvbd-not-included {
            margin-top: 20px;
            padding-top: 16px;

            border-top:
              1px solid
              rgba(255,255,255,.06);
          }

          .mvbd-not-included-title {
            margin-bottom: 10px;

            color: #6b7a7e;

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
            color: #565d5e;

            font-size: 11px;
          }

          .mvbd-not-included li::before {
            content: "×";
            margin-right: 7px;
            color: #4a4746;
          }

          /* =================================================
             PAYMENT MODAL
          ================================================= */

          .mvbd-selected-plan {
            margin-top: 16px;

            padding: 14px;

            border-radius: 11px;

            background:
              rgba(0,255,200,.04);

            border:
              1px solid
              rgba(0,255,200,.1);
          }

          .mvbd-selected-plan small {
            display: block;

            color: #657579;

            font-size: 8px;
          }

          .mvbd-selected-plan strong {
            display: block;

            margin-top: 5px;

            color: #fff;

            font-size: 14px;
          }

          .mvbd-payment-number {
            display: flex;
            align-items: center;
            justify-content: space-between;

            gap: 8px;

            margin-top: 13px;

            padding: 12px;

            border-radius: 11px;

            background:
              rgba(255,255,255,.035);

            border:
              1px solid
              rgba(255,255,255,.07);
          }

          .mvbd-payment-number strong {
            color: #00ffc8;

            font-size: 14px;
          }

          .mvbd-copy-button {
            padding:
              7px
              10px;

            border:
              1px solid
              rgba(255,255,255,.08);

            border-radius: 7px;

            color: #8b999d;

            background:
              rgba(255,255,255,.04);

            cursor: pointer;

            font-size: 10px;
          }

          .mvbd-input {
            width: 100%;

            min-height: 46px;

            margin-top: 13px;

            padding:
              0
              14px;

            outline: none;

            border-radius: 10px;

            border:
              1px solid
              rgba(255,255,255,.08);

            color: #fff;

            background:
              rgba(255,255,255,.035);

            font-size: 13px;
          }

          .mvbd-input:focus {
            border-color:
              rgba(0,255,200,.4);
          }

          .mvbd-error {
            margin-top: 10px;

            padding: 10px;

            border-radius: 9px;

            color: #ff9d9d;

            background:
              rgba(255,50,50,.07);

            border:
              1px solid
              rgba(255,50,50,.12);

            font-size: 11px;
          }

          .mvbd-submit-button {
            width: 100%;

            min-height: 47px;

            margin-top: 13px;

            border: 0;

            border-radius: 10px;

            color: #00110e;

            background:
              linear-gradient(
                135deg,
                #c5fff5,
                #00ffc8
              );

            cursor: pointer;

            font-size: 12px;
            font-weight: 800;
          }

          /* =================================================
             PROCESSING
          ================================================= */

          .mvbd-processing {
            padding:
              20px
              5px;

            text-align: center;
          }

          .mvbd-loader {
            width: 52px;
            height: 52px;

            margin:
              0
              auto
              20px;

            border-radius: 50%;

            border:
              2px solid
              rgba(255,255,255,.07);

            border-top-color:
              #00ffc8;

            animation:
              mvbdSpin
              .8s
              linear
              infinite;
          }

          .mvbd-progress-track {
            height: 7px;

            margin-top: 20px;

            overflow: hidden;

            border-radius: 99px;

            background:
              rgba(255,255,255,.06);
          }

          .mvbd-progress-fill {
            height: 100%;

            border-radius: inherit;

            background:
              linear-gradient(
                90deg,
                #00ffc8,
                #00aee8
              );

            transition:
              width
              .2s
              linear;
          }

          .mvbd-progress-text {
            margin-top: 10px;

            color: #708084;

            font-size: 10px;
          }

          /* =================================================
             SUCCESS
          ================================================= */

          .mvbd-success {
            padding:
              12px
              5px;

            text-align: center;
          }

          .mvbd-success-icon {
            width: 58px;
            height: 58px;

            display: grid;
            place-items: center;

            margin:
              0
              auto
              18px;

            border-radius: 50%;

            color: #00110e;

            background:
              linear-gradient(
                135deg,
                #c5fff5,
                #00ffc8
              );

            font-size: 25px;
            font-weight: 900;
          }

          /* =================================================
             ANIMATIONS
          ================================================= */

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
                translateY(10px)
                scale(.97);
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

          @media (max-width: 850px) {

            .mvbd-page-content {
              width:
                calc(100% - 24px);
            }

            .mvbd-plans-grid {
              grid-template-columns:
                repeat(
                  2,
                  minmax(0,1fr)
                );
            }

            .mvbd-plan-enterprise {
              grid-column:
                1 / -1;
            }

            .mvbd-enterprise-layout {
              grid-template-columns:
                38%
                62%;
            }

          }

          /* =================================================
             MOBILE
          ================================================= */

          @media (max-width: 620px) {

            .mvbd-page-content {
              width:
                calc(100% - 16px);

              padding-top: 8px;
            }

            .mvbd-status {
              display: none;
            }

            .mvbd-premium-hero {
              padding:
                47px
                5px
                30px;
            }

            .mvbd-premium-hero h1 {
              font-size: 34px;
              letter-spacing: -1.8px;
            }

            .mvbd-premium-hero p {
              font-size: 8px;
            }

            .mvbd-plans-grid {
              grid-template-columns: 1fr;
              gap: 12px;
            }

            .mvbd-plan-card {
              min-height: 390px;
            }

            .mvbd-plan-enterprise {
              min-height: auto;
            }

            .mvbd-enterprise-layout {
              grid-template-columns: 1fr;
            }

            .mvbd-enterprise-left {
              padding:
                20px
                18px;

              border-right: 0;

              border-bottom:
                1px solid
                rgba(255,255,255,.05);
            }

            .mvbd-enterprise-right {
              padding:
                18px;
            }

            .mvbd-enterprise-right
              .mvbd-feature-list {
              grid-template-columns: 1fr;
            }

          }

          @media (max-width: 380px) {

            .mvbd-premium-hero h1 {
              font-size: 30px;
            }

            .mvbd-plan-inner {
              padding:
                18px
                15px
                15px;
            }

            .mvbd-price {
              font-size: 34px;
            }

          }

          /* =================================================
             REDUCED MOTION
          ================================================= */

          @media (
            prefers-reduced-motion: reduce
          ) {

            .mvbd-plan-card,
            .mvbd-choose-button,
            .mvbd-access-button {
              transition: none;
            }

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
                          {item.sticker ||
                            "↗"}
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
                          {item.sticker ||
                            "M"}
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
                        {item.sticker ||
                          "✓"}
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
