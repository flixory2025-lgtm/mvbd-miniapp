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
    document.body
  )
}

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

  const [progress, setProgress] = useState(0)

  const [copied, setCopied] =
    useState(false)

  const [error, setError] =
    useState("")

  const processingTimerRef =
    useRef<number | null>(null)

  const successTimerRef =
    useRef<number | null>(null)

  useEffect(() => {
    return () => {
      if (processingTimerRef.current) {
        window.clearInterval(
          processingTimerRef.current
        )
      }

      if (successTimerRef.current) {
        window.clearTimeout(
          successTimerRef.current
        )
      }
    }
  }, [])

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

  const copyNumber = async () => {
    try {
      await navigator.clipboard.writeText(
        PAYMENT_NUMBER
      )

      setCopied(true)

      window.setTimeout(() => {
        setCopied(false)
      }, 1800)
    } catch {
      setCopied(false)
    }
  }

  const submitPayment = async () => {
    const trx = transactionId.trim()

    if (!user || !profile) {
      setError(
        "Please sign in before submitting a payment request."
      )
      return
    }

    if (!trx || trx.length < 3) {
      setError(
        "Please enter a valid transaction ID."
      )
      return
    }

    if (!selectedPlan) {
      setError(
        "Please select a subscription plan."
      )
      return
    }

    if (selectedPlan.planId === "trial") {
      setError(
        "The Free Plan does not require payment."
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
          : "Unable to submit your payment request."
      )

      return
    }

    setShowPayment(false)
    setShowProcessing(true)
    setProgress(0)

    if (processingTimerRef.current) {
      window.clearInterval(
        processingTimerRef.current
      )
    }

    if (successTimerRef.current) {
      window.clearTimeout(
        successTimerRef.current
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
            (elapsed / processingDuration) * 100
          )
        )

        setProgress(percentage)

        if (percentage >= 100) {
          if (processingTimerRef.current) {
            window.clearInterval(
              processingTimerRef.current
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

  const closeSuccess = () => {
    setShowSuccess(false)
    setSelectedPlan(null)
    setTransactionId("")
    setProgress(0)
    setError("")
  }

  const handleFreeAccess = (
    item: FreeAccessItem
  ) => {
    if (item.type === "mebook") {
      setShowFreeAccess(false)
      onOpenMeBook?.()
    }
  }

  return (
    <>
      <main className="mvbd-premium-page">
        {/* Background */}
        <div className="mvbd-page-background" />

        <div className="mvbd-page-overlay" />

        <div className="mvbd-page-content">
          {/* HEADER */}
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

          {/* HERO */}
          <section className="mvbd-premium-hero">
            <div className="mvbd-eyebrow">
              MOVIESVERSEBD
            </div>

            <h1>
              Choose Your
              <span> Premium Plan</span>
            </h1>

            <p>
              Select a membership plan that works
              best for you.
            </p>
          </section>

          {/* PLANS */}
          <section className="mvbd-plans-grid">
            {SUBSCRIPTION_PLANS.map((plan) => (
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
                {plan.popular && (
                  <div className="mvbd-popular-badge">
                    MOST POPULAR
                  </div>
                )}

                <div className="mvbd-card-top">
                  <div className="mvbd-plan-icon">
                    {plan.planId === "trial"
                      ? "✦"
                      : plan.planId === "monthly"
                        ? "◆"
                        : plan.planId ===
                            "two_months"
                          ? "◇"
                          : "★"}
                  </div>

                  <div className="mvbd-plan-name">
                    {plan.name}
                  </div>
                </div>

                <div className="mvbd-price">
                  {plan.price}
                </div>

                <div className="mvbd-duration">
                  {plan.duration}
                </div>

                {plan.save ? (
                  <div className="mvbd-save">
                    {plan.save}
                  </div>
                ) : (
                  <div className="mvbd-save mvbd-save-empty">
                    &nbsp;
                  </div>
                )}

                <p className="mvbd-plan-description">
                  {plan.description}
                </p>

                <ul className="mvbd-feature-list">
                  {plan.planId === "trial" ? (
                    <>
                      <li>
                        <span>✓</span>
                        Basic MVBD access
                      </li>

                      <li>
                        <span>✓</span>
                        Selected free features
                      </li>

                      <li>
                        <span>✓</span>
                        Community channels
                      </li>

                      <li className="locked">
                        <span>×</span>
                        Premium features locked
                      </li>
                    </>
                  ) : (
                    <>
                      <li>
                        <span>✓</span>
                        Premium access
                      </li>

                      <li>
                        <span>✓</span>
                        MVBD app access
                      </li>

                      <li>
                        <span>✓</span>
                        Telegram access included
                      </li>

                      <li>
                        <span>✓</span>
                        Fast premium experience
                      </li>
                    </>
                  )}
                </ul>

                <button
                  type="button"
                  className="mvbd-choose-button"
                  onClick={() => openPlan(plan)}
                >
                  {plan.planId === "trial"
                    ? "View Free Access"
                    : "Continue"}
                </button>
              </article>
            ))}
          </section>

          {/* INFO */}
          <section className="mvbd-payment-info">
            <div className="mvbd-info-icon">
              ৳
            </div>

            <div>
              <strong>
                Secure Payment
              </strong>

              <span>
                Paid plans are activated after
                transaction verification.
              </span>
            </div>
          </section>

          <footer className="mvbd-premium-footer">
            MoviesVerseBD • MVBD Premium Membership
          </footer>
        </div>

        <style jsx global>{`
          * {
            box-sizing: border-box;
          }

          .mvbd-premium-page {
            position: relative;
            min-height: 100svh;
            width: 100%;
            overflow-x: hidden;
            background: #020605;
            color: #ffffff;
            isolation: isolate;
          }

          /* ---------------- BACKGROUND ---------------- */

          .mvbd-page-background {
            position: fixed;
            inset: 0;
            z-index: -3;
            pointer-events: none;

            background-image:
              url("https://i.postimg.cc/43PLHM4Z/file-0000000041908206b4fe692b01e0940b.png");

            background-position: center top;
            background-size: cover;
            background-repeat: no-repeat;

            transform: translateZ(0);
          }

          .mvbd-page-overlay {
            position: fixed;
            inset: 0;
            z-index: -2;
            pointer-events: none;

            background:
              linear-gradient(
                180deg,
                rgba(0, 0, 0, 0.58) 0%,
                rgba(0, 5, 3, 0.76) 48%,
                rgba(0, 0, 0, 0.94) 100%
              );
          }

          /*
           Desktop / Tablet background
          */
          @media (min-width: 761px) {
            .mvbd-page-background {
              background-image:
                url("https://i.postimg.cc/43s2dZg3/file-00000000e1908211bbeb998f8584d5ba.png");
            }
          }

          /* ---------------- CONTENT ---------------- */

          .mvbd-page-content {
            position: relative;
            z-index: 1;

            width: min(
              1440px,
              calc(100% - 32px)
            );

            margin: 0 auto;
            padding:
              22px
              0
              45px;
          }

          /* ---------------- HEADER ---------------- */

          .mvbd-premium-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 16px;

            padding: 14px 18px;

            border: 1px solid
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
            letter-spacing: 0.3px;
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

            padding: 8px 12px;

            border-radius: 999px;

            color: #79fca9;

            background:
              rgba(0, 255, 106, 0.07);

            border: 1px solid
              rgba(0, 255, 106, 0.16);

            font-size: 10px;
            font-weight: 800;
            letter-spacing: 1px;
          }

          .mvbd-status-dot {
            width: 7px;
            height: 7px;

            border-radius: 50%;

            background: #36ff88;

            box-shadow:
              0 0 10px #36ff88;

            animation:
              mvbdPulse 1.8s ease-in-out infinite;
          }

          /* ---------------- HERO ---------------- */

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
            letter-spacing: 3px;

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
            letter-spacing: -2px;

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

          /* ---------------- PLAN GRID ---------------- */

          .mvbd-plans-grid {
            display: grid;

            grid-template-columns:
              repeat(4, minmax(0, 1fr));

            gap: 18px;
          }

          /* ---------------- CARD ---------------- */

          .mvbd-plan-card {
            position: relative;

            min-width: 0;

            padding: 23px;

            border-radius: 27px;

            overflow: hidden;

            border: 1px solid
              rgba(87, 255, 144, 0.22);

            background:
              linear-gradient(
                160deg,
                rgba(9, 27, 20, 0.94),
                rgba(2, 8, 6, 0.94)
              );

            box-shadow:
              0 18px 50px
                rgba(0, 0, 0, 0.42),
              inset 0 1px 0
                rgba(255, 255, 255, 0.06);

            transform: translateZ(0);

            transition:
              transform 0.28s ease,
              border-color 0.28s ease,
              box-shadow 0.28s ease;
          }

          .mvbd-plan-card::before {
            content: "";

            position: absolute;

            width: 180px;
            height: 180px;

            top: -100px;
            right: -70px;

            border-radius: 50%;

            background:
              radial-gradient(
                circle,
                rgba(47, 255, 133, 0.18),
                transparent 68%
              );

            pointer-events: none;

            animation:
              mvbdFloat 7s ease-in-out infinite;
          }

          .mvbd-plan-card::after {
            content: "";

            position: absolute;

            left: -80px;
            bottom: -110px;

            width: 220px;
            height: 220px;

            border-radius: 45% 55% 60% 40%;

            background:
              radial-gradient(
                circle,
                rgba(0, 214, 255, 0.08),
                transparent 68%
              );

            pointer-events: none;

            animation:
              mvbdLiquid 9s ease-in-out infinite;
          }

          .mvbd-plan-card:hover {
            transform:
              translateY(-7px);

            border-color:
              rgba(73, 255, 139, 0.55);

            box-shadow:
              0 25px 65px
                rgba(0, 0, 0, 0.52),
              0 0 35px
                rgba(0, 255, 106, 0.11);
          }

          .mvbd-plan-popular {
            border-color:
              rgba(0, 240, 255, 0.35);
          }

          .mvbd-plan-two_months {
            border-color:
              rgba(0, 255, 170, 0.35);
          }

          .mvbd-plan-three_months {
            border-color:
              rgba(255, 215, 85, 0.28);
          }

          .mvbd-card-top,
          .mvbd-price,
          .mvbd-duration,
          .mvbd-save,
          .mvbd-plan-description,
          .mvbd-feature-list,
          .mvbd-choose-button {
            position: relative;
            z-index: 2;
          }

          .mvbd-card-top {
            display: flex;
            align-items: center;
            gap: 10px;
          }

          .mvbd-plan-icon {
            width: 36px;
            height: 36px;

            display: grid;
            place-items: center;

            border-radius: 12px;

            color: #69ffa0;

            background:
              rgba(0, 255, 111, 0.09);

            border: 1px solid
              rgba(0, 255, 111, 0.18);
          }

          .mvbd-plan-name {
            font-size: 13px;
            font-weight: 900;
            letter-spacing: 1.2px;
          }

          .mvbd-price {
            margin-top: 25px;

            font-size: 38px;
            line-height: 1;

            font-weight: 900;
            letter-spacing: -1px;
          }

          .mvbd-duration {
            margin-top: 8px;

            color: #7f9a8e;

            font-size: 12px;
          }

          .mvbd-save {
            display: inline-flex;

            margin-top: 13px;

            padding: 5px 9px;

            border-radius: 999px;

            color: #63ff9b;

            background:
              rgba(0, 255, 106, 0.08);

            border: 1px solid
              rgba(0, 255, 106, 0.15);

            font-size: 10px;
            font-weight: 800;
          }

          .mvbd-save-empty {
            visibility: hidden;
          }

          .mvbd-plan-description {
            min-height: 48px;

            margin:
              17px
              0
              18px;

            color: #9caf a4;

            color: #9cafa5;

            font-size: 12px;
            line-height: 1.6;
          }

          /* ---------------- FEATURES ---------------- */

          .mvbd-feature-list {
            list-style: none;

            margin: 0;
            padding: 0;

            display: grid;
            gap: 10px;
          }

          .mvbd-feature-list li {
            display: flex;
            align-items: center;
            gap: 9px;

            color: #c3d1ca;

            font-size: 11px;
            line-height: 1.4;
          }

          .mvbd-feature-list li span {
            width: 18px;
            height: 18px;

            flex: 0 0 18px;

            display: grid;
            place-items: center;

            border-radius: 50%;

            color: #5cff99;

            background:
              rgba(0, 255, 106, 0.09);

            font-size: 10px;
            font-weight: 900;
          }

          .mvbd-feature-list li.locked {
            color: #697970;
          }

          .mvbd-feature-list li.locked span {
            color: #78847e;

            background:
              rgba(255, 255, 255, 0.04);
          }

          /* ---------------- BUTTON ---------------- */

          .mvbd-choose-button {
            width: 100%;

            margin-top: 25px;

            min-height: 48px;

            border: 0;
            border-radius: 15px;

            color: #001b0c;

            background:
              linear-gradient(
                135deg,
                #8affb7,
                #25ef77
              );

            font-size: 12px;
            font-weight: 900;

            cursor: pointer;

            box-shadow:
              0 8px 25px
                rgba(0, 255, 106, 0.18);

            transition:
              transform 0.2s ease,
              box-shadow 0.2s ease;
          }

          .mvbd-choose-button:hover {
            transform:
              translateY(-2px);

            box-shadow:
              0 12px 32px
                rgba(0, 255, 106, 0.3);
          }

          .mvbd-choose-button:active {
            transform:
              scale(0.98);
          }

          /* ---------------- POPULAR ---------------- */

          .mvbd-popular-badge {
            position: absolute;

            top: 0;
            right: 0;

            padding:
              7px
              12px;

            border-radius:
              0
              0
              0
              13px;

            color: #001b16;

            background:
              linear-gradient(
                135deg,
                #5effd4,
                #26d9ff
              );

            font-size: 8px;
            font-weight: 900;
            letter-spacing: 0.7px;

            z-index: 3;
          }

          /* ---------------- PAYMENT INFO ---------------- */

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
              rgba(3, 13, 9, 0.8);

            border: 1px solid
              rgba(255, 255, 255, 0.08);
          }

          .mvbd-info-icon {
            width: 35px;
            height: 35px;

            display: grid;
            place-items: center;

            border-radius: 11px;

            color: #62ff9b;

            background:
              rgba(0, 255, 106, 0.08);
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

          .mvbd-premium-footer {
            text-align: center;

            margin-top: 30px;

            color: #52645b;

            font-size: 10px;
          }

          /* ---------------- MODAL ---------------- */

          .mvbd-modal-backdrop {
            position: fixed;
            inset: 0;

            z-index: 99999;

            display: flex;
            align-items: center;
            justify-content: center;

            padding: 18px;

            background:
              rgba(0, 0, 0, 0.78);

            animation:
              mvbdModalIn 0.2s ease both;
          }

          .mvbd-modal {
            width: min(
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

            border: 1px solid
              rgba(76, 255, 137, 0.28);

            background:
              linear-gradient(
                155deg,
                #07130e,
                #020605
              );

            box-shadow:
              0 30px 90px
                rgba(0, 0, 0, 0.7),
              0 0 45px
                rgba(0, 255, 106, 0.08);

            animation:
              mvbdModalScale 0.24s
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
            background: #235e3b;
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
              rgba(255, 255, 255, 0.06);

            cursor: pointer;

            font-size: 16px;
          }

          /* ---------------- FREE ACCESS ---------------- */

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

            border: 1px solid
              rgba(85, 255, 145, 0.15);

            border-radius: 16px;

            background:
              rgba(255, 255, 255, 0.035);

            color: #ffffff;

            text-align: left;

            cursor: pointer;

            transition:
              transform 0.2s ease,
              background 0.2s ease;
          }

          .mvbd-access-button:hover {
            transform:
              translateY(-2px);

            background:
              rgba(42, 255, 117, 0.07);
          }

          .mvbd-access-icon {
            width: 38px;
            height: 38px;

            flex: 0 0 38px;

            display: grid;
            place-items: center;

            border-radius: 12px;

            color: #67ff9d;

            background:
              rgba(0, 255, 106, 0.09);
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

          .mvbd-access-restricted {
            cursor: not-allowed;

            border-color:
              rgba(255, 255, 255, 0.07);

            opacity: 0.65;
          }

          .mvbd-access-restricted
            .mvbd-access-icon {
            color: #8d9792;

            background:
              rgba(255, 255, 255, 0.05);
          }

          .mvbd-not-included {
            margin-top: 22px;
            padding-top: 18px;

            border-top: 1px solid
              rgba(255, 255, 255, 0.07);
          }

          .mvbd-not-included-title {
            margin-bottom: 11px;

            color: #7c8e86;

            font-size: 10px;
            font-weight: 900;
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
            color: #67766f;

            font-size: 10px;
          }

          .mvbd-not-included li::before {
            content: "×";

            margin-right: 8px;

            color: #66716d;
          }

          /* ---------------- PAYMENT MODAL ---------------- */

          .mvbd-selected-plan {
            margin-top: 18px;

            padding: 14px;

            border-radius: 15px;

            background:
              rgba(0, 255, 106, 0.055);

            border: 1px solid
              rgba(0, 255, 106, 0.12);
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
            justify-content: space-between;
            gap: 10px;

            padding: 13px;

            border-radius: 14px;

            background:
              rgba(255, 255, 255, 0.045);
          }

          .mvbd-payment-number strong {
            color: #65ff9c;

            font-size: 17px;
            letter-spacing: 1px;
          }

          .mvbd-copy-button {
            border: 1px solid
              rgba(255, 255, 255, 0.1);

            border-radius: 9px;

            padding: 7px 10px;

            color: #c8d7d0;

            background:
              rgba(255, 255, 255, 0.05);

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

            border: 1px solid
              rgba(255, 255, 255, 0.1);

            color: #ffffff;

            background:
              rgba(255, 255, 255, 0.045);

            font-size: 13px;
          }

          .mvbd-input:focus {
            border-color:
              rgba(63, 255, 136, 0.55);
          }

          .mvbd-error {
            margin-top: 10px;

            padding: 10px;

            border-radius: 10px;

            color: #ff9d9d;

            background:
              rgba(255, 50, 50, 0.07);

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

          /* ---------------- PROCESSING ---------------- */

          .mvbd-processing {
            text-align: center;

            padding: 22px 10px;
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
              rgba(255, 255, 255, 0.08);

            border-top-color: #52ff95;

            animation:
              mvbdSpin 0.8s linear infinite;
          }

          .mvbd-progress-track {
            height: 7px;

            margin-top: 20px;

            overflow: hidden;

            border-radius: 99px;

            background:
              rgba(255, 255, 255, 0.07);
          }

          .mvbd-progress-fill {
            height: 100%;

            border-radius: inherit;

            background:
              linear-gradient(
                90deg,
                #00d95f,
                #72ffac
              );

            transition:
              width 0.2s linear;
          }

          .mvbd-progress-text {
            margin-top: 10px;

            color: #70877c;

            font-size: 10px;
          }

          /* ---------------- SUCCESS ---------------- */

          .mvbd-success {
            text-align: center;

            padding: 15px 10px;
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
                rgba(0, 255, 106, 0.22);
          }

          /* ---------------- ANIMATIONS ---------------- */

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

          @keyframes mvbdFloat {
            0%,
            100% {
              transform:
                translate3d(
                  0,
                  0,
                  0
                );
            }

            50% {
              transform:
                translate3d(
                  -25px,
                  18px,
                  0
                );
            }
          }

          @keyframes mvbdLiquid {
            0%,
            100% {
              transform:
                translate3d(
                  0,
                  0,
                  0
                )
                rotate(0deg);
            }

            50% {
              transform:
                translate3d(
                  22px,
                  -18px,
                  0
                )
                rotate(8deg);
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
              transform: rotate(360deg);
            }
          }

          @media (
            prefers-reduced-motion: reduce
          ) {
            .mvbd-plan-card,
            .mvbd-access-button,
            .mvbd-choose-button {
              transition: none;
            }

            .mvbd-plan-card::before,
            .mvbd-plan-card::after,
            .mvbd-status-dot,
            .mvbd-loader {
              animation: none;
            }
          }

          /* ---------------- TABLET ---------------- */

          @media (max-width: 1050px) {
            .mvbd-plans-grid {
              grid-template-columns:
                repeat(2, minmax(0, 1fr));
            }
          }

          /* ---------------- MOBILE ---------------- */

          @media (max-width: 760px) {
            .mvbd-page-content {
              width:
                calc(100% - 22px);

              padding-top: 11px;
              padding-bottom: 30px;
            }

            .mvbd-premium-header {
              padding: 11px 13px;
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
              padding: 7px 9px;

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
              letter-spacing: -1.5px;
            }

            .mvbd-premium-hero p {
              font-size: 12px;
            }

            .mvbd-plans-grid {
              grid-template-columns: 1fr;
              gap: 14px;
            }

            .mvbd-plan-card {
              padding: 20px;

              border-radius: 23px;
            }

            .mvbd-price {
              font-size: 35px;
            }

            .mvbd-plan-description {
              min-height: auto;
            }

            .mvbd-choose-button {
              min-height: 50px;
            }
          }

          @media (max-width: 420px) {
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

            .mvbd-modal-backdrop {
              padding: 10px;
            }

            .mvbd-modal {
              padding: 18px;

              border-radius: 21px;
            }
          }
        `}</style>
      </main>

      {/* ================= FREE ACCESS MODAL ================= */}

      {showFreeAccess && selectedPlan && (
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
              আপনার Free Plan-এ যেসব access
              available আছে সেগুলো এখান থেকে
              ব্যবহার করতে পারবেন।
            </p>

            <div className="mvbd-free-access-list">
              {(
                selectedPlan.freeAccess || []
              ).map((item) => {
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
                        ↗
                      </div>

                      <div className="mvbd-access-text">
                        <strong>
                          {item.title}
                        </strong>

                        <span>
                          {item.description}
                        </span>
                      </div>

                      <div className="mvbd-access-arrow">
                        ›
                      </div>
                    </a>
                  )
                }

                if (item.type === "mebook") {
                  return (
                    <button
                      key={item.id}
                      type="button"
                      className="mvbd-access-button"
                      onClick={() =>
                        handleFreeAccess(
                          item
                        )
                      }
                    >
                      <div className="mvbd-access-icon">
                        M
                      </div>

                      <div className="mvbd-access-text">
                        <strong>
                          {item.title}
                        </strong>

                        <span>
                          {item.description}
                        </span>
                      </div>

                      <div className="mvbd-access-arrow">
                        ›
                      </div>
                    </button>
                  )
                }

                if (
                  item.type === "restricted"
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
                          {item.description}
                        </span>
                      </div>
                    </div>
                  )
                }

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
                        {item.description}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>

            {!!selectedPlan.notIncluded
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
                    )
                  )}
                </ul>
              </div>
            )}
          </div>
        </ViewportModal>
      )}

      {/* ================= PAYMENT MODAL ================= */}

      {showPayment && selectedPlan && (
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
            >
              ×
            </button>

            <div className="mvbd-modal-title">
              Complete Payment
            </div>

            <p className="mvbd-modal-subtitle">
              Send the exact plan amount to the
              bKash number below and enter your
              transaction ID.
            </p>

            <div className="mvbd-selected-plan">
              <small>
                SELECTED PLAN
              </small>

              <strong>
                {selectedPlan.planName} •{" "}
                {selectedPlan.price}
              </strong>
            </div>

            <div className="mvbd-payment-number">
              <strong>
                {PAYMENT_NUMBER}
              </strong>

              <button
                type="button"
                className="mvbd-copy-button"
                onClick={copyNumber}
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
                  event.target.value
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
              onClick={submitPayment}
            >
              Submit Payment Request
            </button>
          </div>
        </ViewportModal>
      )}

      {/* ================= PROCESSING ================= */}

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
                submitted. Please wait while the
                request is being processed.
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
                {progress}% processing
              </div>
            </div>
          </div>
        </ViewportModal>
      )}

      {/* ================= SUCCESS ================= */}

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
                Your subscription request has been
                submitted successfully. Your
                membership will be updated after
                verification.
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
