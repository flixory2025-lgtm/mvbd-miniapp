"use client"

import {
  useEffect,
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
} from "@/lib/subscription-plans"

type Plan = SubscriptionPlan

/* =========================================================
   VIEWPORT MODAL
   Always rendered directly inside document.body.
   Keeps the modal independent from page containers.
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

    return () => {
      setMounted(false)
    }
  }, [])

  useEffect(() => {
    if (!mounted) return

    const previousOverflow =
      document.body.style.overflow

    const previousOverscroll =
      document.body.style.overscrollBehavior

    document.body.style.overflow = "hidden"
    document.body.style.overscrollBehavior = "none"

    return () => {
      document.body.style.overflow =
        previousOverflow

      document.body.style.overscrollBehavior =
        previousOverscroll
    }
  }, [mounted])

  if (!mounted) return null

  return createPortal(
    <div
      className="mvbd-subscription-modal"
      role="dialog"
      aria-modal="true"
      onMouseDown={(event) => {
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
   MAIN SUBSCRIPTION PAGE
========================================================= */

export default function SeriesSection() {
  const { user, profile } = useAuth()

  const [selectedPlan, setSelectedPlan] =
    useState<Plan | null>(null)

  const [transactionId, setTransactionId] =
    useState("")

  const [showPayment, setShowPayment] =
    useState(false)

  const [showProcessing, setShowProcessing] =
    useState(false)

  const [showSuccess, setShowSuccess] =
    useState(false)

  const [progress, setProgress] =
    useState(0)

  const [copied, setCopied] =
    useState(false)

  const [error, setError] =
    useState("")

  const [submitting, setSubmitting] =
    useState(false)

  /* =======================================================
     ONLY PAID PLANS
  ======================================================= */

  const paidPlans = SUBSCRIPTION_PLANS.filter(
    (plan) => plan.planId !== "trial",
  )

  /* =======================================================
     OPEN PLAN
  ======================================================= */

  const openPlan = (plan: Plan) => {
    if (plan.planId === "trial") {
      return
    }

    setSelectedPlan(plan)
    setTransactionId("")
    setError("")
    setCopied(false)
    setShowPayment(true)
  }

  /* =======================================================
     CLOSE PAYMENT
  ======================================================= */

  const closePayment = () => {
    if (submitting) return

    setShowPayment(false)
    setError("")
    setTransactionId("")
    setCopied(false)
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

    if (submitting) return

    if (!user || !profile) {
      setError(
        "Please sign in before submitting a payment request.",
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
        "Trial cannot be submitted as a payment.",
      )
      return
    }

    if (!trx || trx.length < 3) {
      setError(
        "Please enter a valid transaction ID.",
      )
      return
    }

    setError("")
    setSubmitting(true)

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

      setSubmitting(false)
      return
    }

    setSubmitting(false)

    setShowPayment(false)
    setShowProcessing(true)
    setProgress(0)

    const startTime = Date.now()
    const processingDuration = 9000

    const timer =
      window.setInterval(() => {
        const elapsed =
          Date.now() - startTime

        const percentage =
          Math.min(
            100,
            Math.round(
              (elapsed /
                processingDuration) *
                100,
            ),
          )

        setProgress(percentage)

        if (percentage >= 100) {
          window.clearInterval(timer)

          window.setTimeout(() => {
            setShowProcessing(false)
            setShowSuccess(true)
          }, 650)
        }
      }, 100)
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
    setCopied(false)
  }

  return (
    <>
      <main className="mvbd-premium-page">
        <style jsx global>{`
          /* =================================================
             PAGE RESET
          ================================================= */

          .mvbd-premium-page,
          .mvbd-premium-page *,
          .mvbd-subscription-modal,
          .mvbd-subscription-modal * {
            box-sizing: border-box;
          }

          /* =================================================
             MAIN PAGE
             IMPORTANT:
             No forced viewport height.
             No overflow:hidden.
             Outer app shell can control bottom spacing.
          ================================================= */

          .mvbd-premium-page {
            position: relative;

            width: 100%;

            min-height: auto;

            overflow: visible;

            isolation: isolate;

            color: #ffffff;

            padding:
              18px 16px 0;

            background:
              radial-gradient(
                circle at 50% -10%,
                rgba(32, 255, 138, 0.105),
                transparent 32%
              ),
              radial-gradient(
                circle at 8% 42%,
                rgba(0, 194, 120, 0.075),
                transparent 30%
              ),
              radial-gradient(
                circle at 94% 58%,
                rgba(62, 255, 169, 0.055),
                transparent 28%
              ),
              #020504;
          }

          /* =================================================
             LIQUID GREEN AURORA
          ================================================= */

          .mvbd-premium-page::before {
            content: "";

            position: fixed;

            inset: -45%;

            z-index: -2;

            pointer-events: none;

            background:
              radial-gradient(
                circle at 28% 28%,
                rgba(0, 255, 132, 0.105),
                transparent 25%
              ),
              radial-gradient(
                circle at 72% 34%,
                rgba(34, 214, 130, 0.075),
                transparent 26%
              ),
              radial-gradient(
                circle at 52% 78%,
                rgba(0, 143, 89, 0.075),
                transparent 25%
              );

            filter: blur(80px);

            animation:
              mvbdGreenAurora
              18s
              ease-in-out
              infinite
              alternate;
          }

          @keyframes mvbdGreenAurora {
            0% {
              transform:
                translate3d(
                  -2%,
                  -1%,
                  0
                )
                scale(1);
            }

            50% {
              transform:
                translate3d(
                  3%,
                  2%,
                  0
                )
                scale(1.08);
            }

            100% {
              transform:
                translate3d(
                  -1%,
                  4%,
                  0
                )
                scale(1.03);
            }
          }

          /* =================================================
             STARS
          ================================================= */

          .mvbd-stars {
            position: absolute;

            top: 0;
            left: 0;

            width: 100%;
            height: 610px;

            overflow: hidden;

            pointer-events: none;

            z-index: 0;
          }

          .mvbd-stars::before {
            content: "";

            position: absolute;

            inset: 0;

            background-image:
              radial-gradient(
                circle,
                rgba(
                  126,
                  255,
                  190,
                  0.62
                )
                0 1px,
                transparent 1.8px
              ),
              radial-gradient(
                circle,
                rgba(
                  83,
                  215,
                  151,
                  0.5
                )
                0 1px,
                transparent 1.8px
              ),
              radial-gradient(
                circle,
                rgba(
                  255,
                  255,
                  255,
                  0.38
                )
                0 1px,
                transparent 1.7px
              );

            background-size:
              91px 103px,
              137px 127px,
              181px 171px;

            background-position:
              12px 7px,
              37px 29px,
              79px 43px;

            opacity: 0.26;

            animation:
              mvbdStarsDrift
              30s
              linear
              infinite;
          }

          @keyframes mvbdStarsDrift {
            from {
              transform:
                translateY(0);
            }

            to {
              transform:
                translateY(100px);
            }
          }

          .mvbd-star {
            position: absolute;

            width: 4px;
            height: 4px;

            border-radius: 50%;

            background:
              #a8ffd1;

            box-shadow:
              0 0 8px
                rgba(
                  82,
                  255,
                  164,
                  0.65
                ),
              0 0 18px
                rgba(
                  82,
                  255,
                  164,
                  0.24
                );

            opacity: 0.48;

            animation:
              mvbdStarLiquid
                var(--duration)
                ease-in-out
                infinite
                alternate,
              mvbdStarFloat
                7s
                ease-in-out
                infinite;
          }

          @keyframes mvbdStarLiquid {
            0% {
              transform:
                scale(0.25);

              opacity: 0.1;
            }

            50% {
              transform:
                scale(1);

              opacity: 0.52;
            }

            100% {
              transform:
                scale(1.6);

              opacity: 0.82;
            }
          }

          @keyframes mvbdStarFloat {
            50% {
              translate:
                0 -5px;
            }
          }

          /* =================================================
             CONTAINER
          ================================================= */

          .mvbd-container {
            position: relative;

            z-index: 2;

            width:
              min(
                1120px,
                100%
              );

            margin:
              0 auto;
          }

          /* =================================================
             NAV
          ================================================= */

          .mvbd-nav {
            display: flex;

            align-items: center;

            justify-content:
              space-between;

            gap: 12px;

            padding:
              11px 13px;

            border:
              1px solid
              rgba(
                150,
                255,
                199,
                0.115
              );

            border-radius:
              28px;

            background:
              linear-gradient(
                135deg,
                rgba(
                  255,
                  255,
                  255,
                  0.065
                ),
                rgba(
                  51,
                  255,
                  151,
                  0.018
                ),
                rgba(
                  255,
                  255,
                  255,
                  0.025
                )
              );

            backdrop-filter:
              blur(35px)
              saturate(155%);

            -webkit-backdrop-filter:
              blur(35px)
              saturate(155%);

            box-shadow:
              0 20px 70px
                rgba(0, 0, 0, 0.55),
              inset 0 1px
                rgba(
                  255,
                  255,
                  255,
                  0.1
                );
          }

          .mvbd-brand {
            display: flex;

            align-items: center;

            gap: 10px;

            min-width: 0;

            font-size: 14px;

            font-weight: 800;
          }

          .mvbd-logo {
            width: 39px;
            height: 39px;

            flex-shrink: 0;

            display: grid;

            place-items: center;

            border-radius:
              14px;

            color:
              #d8ffe9;

            background:
              linear-gradient(
                145deg,
                rgba(
                  72,
                  255,
                  163,
                  0.34
                ),
                rgba(
                  0,
                  161,
                  94,
                  0.16
                )
              );

            border:
              1px solid
              rgba(
                133,
                255,
                193,
                0.18
              );

            box-shadow:
              0 9px 35px
                rgba(
                  0,
                  255,
                  137,
                  0.1
                ),
              inset 0 1px
                rgba(
                  255,
                  255,
                  255,
                  0.24
                );
          }

          .mvbd-nav-badge {
            flex-shrink: 0;

            padding:
              8px 12px;

            border-radius:
              999px;

            border:
              1px solid
              rgba(
                140,
                255,
                195,
                0.09
              );

            background:
              rgba(
                71,
                255,
                159,
                0.035
              );

            color:
              rgba(
                201,
                255,
                222,
                0.55
              );

            font-size: 10px;

            font-weight: 750;
          }

          /* =================================================
             HERO
          ================================================= */

          .mvbd-hero {
            position: relative;

            padding:
              78px 8px 44px;

            text-align: center;
          }

          .mvbd-hero-glow {
            position: absolute;

            width: 360px;
            height: 220px;

            left: 50%;
            top: 65px;

            transform:
              translateX(-50%);

            border-radius: 50%;

            background:
              radial-gradient(
                circle,
                rgba(
                  48,
                  255,
                  155,
                  0.11
                ),
                rgba(
                  28,
                  170,
                  103,
                  0.035
                ) 45%,
                transparent 70%
              );

            filter: blur(25px);

            animation:
              mvbdHeroGlow
              7s
              ease-in-out
              infinite
              alternate;
          }

          @keyframes mvbdHeroGlow {
            from {
              transform:
                translateX(-50%)
                scale(0.95);
            }

            to {
              transform:
                translateX(-50%)
                scale(1.13);
            }
          }

          .mvbd-eyebrow {
            position: relative;

            display: inline-flex;

            align-items: center;

            gap: 7px;

            padding:
              8px 13px;

            border-radius:
              999px;

            border:
              1px solid
              rgba(
                135,
                255,
                191,
                0.1
              );

            background:
              rgba(
                90,
                255,
                166,
                0.035
              );

            backdrop-filter:
              blur(22px);

            color:
              rgba(
                198,
                255,
                220,
                0.72
              );

            font-size: 11px;

            font-weight: 700;

            box-shadow:
              inset 0 1px
                rgba(
                  255,
                  255,
                  255,
                  0.07
                ),
              0 8px 35px
                rgba(
                  0,
                  0,
                  0,
                  0.25
                );
          }

          .mvbd-live-dot {
            width: 6px;
            height: 6px;

            border-radius: 50%;

            background:
              #63ffa7;

            box-shadow:
              0 0 9px
                #42ff98,
              0 0 20px
                rgba(
                  66,
                  255,
                  152,
                  0.42
                );

            animation:
              mvbdLivePulse
              1.8s
              ease-in-out
              infinite;
          }

          @keyframes mvbdLivePulse {
            50% {
              transform:
                scale(1.6);

              opacity: 0.45;
            }
          }

          .mvbd-hero h1 {
            position: relative;

            margin:
              22px 0 15px;

            font-size:
              clamp(
                43px,
                8vw,
                76px
              );

            line-height: 0.94;

            letter-spacing:
              -4px;

            font-weight: 900;

            background:
              linear-gradient(
                100deg,
                #ffffff 4%,
                #d9ffe9 45%,
                #74ffad 92%
              );

            -webkit-background-clip:
              text;

            background-clip:
              text;

            color:
              transparent;
          }

          .mvbd-premium-title {
            position: relative;

            margin-bottom: 17px;

            color:
              rgba(
                192,
                255,
                215,
                0.67
              );

            font-size:
              clamp(
                13px,
                2vw,
                18px
              );

            font-weight: 850;

            letter-spacing:
              7px;
          }

          .mvbd-subtitle {
            max-width: 640px;

            margin: auto;

            color:
              rgba(
                255,
                255,
                255,
                0.41
              );

            font-size: 14px;

            line-height: 1.75;
          }

          .mvbd-trial {
            display: inline-flex;

            margin-top: 20px;

            padding:
              9px 14px;

            border-radius:
              999px;

            border:
              1px solid
              rgba(
                105,
                255,
                167,
                0.12
              );

            background:
              rgba(
                89,
                255,
                157,
                0.035
              );

            color:
              rgba(
                190,
                255,
                213,
                0.7
              );

            font-size: 11px;

            font-weight: 750;

            box-shadow:
              inset 0 1px
                rgba(
                  255,
                  255,
                  255,
                  0.055
                );
          }

          /* =================================================
             PLANS
          ================================================= */

          .mvbd-plans {
            display: grid;

            grid-template-columns:
              repeat(3, 1fr);

            gap: 15px;
          }

          .mvbd-card {
            position: relative;

            overflow: hidden;

            padding: 24px;

            border-radius:
              31px;

            border:
              1px solid
              rgba(
                126,
                255,
                183,
                0.105
              );

            background:
              linear-gradient(
                145deg,
                rgba(
                  255,
                  255,
                  255,
                  0.06
                ),
                rgba(
                  62,
                  255,
                  158,
                  0.018
                ),
                rgba(
                  255,
                  255,
                  255,
                  0.022
                )
              );

            backdrop-filter:
              blur(34px)
              saturate(155%);

            -webkit-backdrop-filter:
              blur(34px)
              saturate(155%);

            box-shadow:
              0 28px 90px
                rgba(
                  0,
                  0,
                  0,
                  0.5
                ),
              inset 0 1px
                rgba(
                  255,
                  255,
                  255,
                  0.075
                );

            transition:
              transform
                0.55s
                cubic-bezier(
                  0.2,
                  0.8,
                  0.2,
                  1
                ),
              border-color
                0.4s,
              box-shadow
                0.5s;
          }

          .mvbd-card::before {
            content: "";

            position: absolute;

            width: 190px;
            height: 190px;

            right: -105px;
            top: -105px;

            border-radius:
              46% 54% 62% 38% /
              42% 37% 63% 58%;

            background:
              radial-gradient(
                circle,
                rgba(
                  70,
                  255,
                  161,
                  0.11
                ),
                transparent 70%
              );

            filter: blur(20px);

            animation:
              mvbdCardBlob
              8s
              ease-in-out
              infinite
              alternate;
          }

          @keyframes mvbdCardBlob {
            to {
              transform:
                translate(
                  -45px,
                  50px
                )
                scale(1.3);
            }
          }

          .mvbd-card:hover {
            transform:
              translateY(-7px);

            border-color:
              rgba(
                101,
                255,
                167,
                0.25
              );

            box-shadow:
              0 38px 110px
                rgba(
                  0,
                  0,
                  0,
                  0.62
                ),
              0 0 45px
                rgba(
                  0,
                  255,
                  137,
                  0.055
                ),
              inset 0 1px
                rgba(
                  255,
                  255,
                  255,
                  0.11
                );
          }

          .mvbd-card-popular {
            border-color:
              rgba(
                79,
                255,
                161,
                0.23
              );

            background:
              linear-gradient(
                145deg,
                rgba(
                  54,
                  255,
                  150,
                  0.075
                ),
                rgba(
                  255,
                  255,
                  255,
                  0.025
                )
              );
          }

          .mvbd-ribbon {
            position: absolute;

            right: 17px;
            top: 17px;

            padding:
              7px 10px;

            border-radius:
              999px;

            background:
              linear-gradient(
                135deg,
                #caffdf,
                #5aff9c
              );

            color:
              #042512;

            font-size: 9px;

            font-weight: 900;

            box-shadow:
              0 8px 30px
                rgba(
                  60,
                  255,
                  145,
                  0.13
                );
          }

          .mvbd-plan-name {
            color:
              rgba(
                185,
                255,
                211,
                0.7
              );

            font-size: 11px;

            font-weight: 850;

            letter-spacing:
              0.8px;
          }

          .mvbd-price {
            margin:
              14px 0 2px;

            font-size: 46px;

            font-weight: 900;

            letter-spacing:
              -2px;
          }

          .mvbd-price small {
            color:
              rgba(
                255,
                255,
                255,
                0.38
              );

            font-size: 12px;

            font-weight: 600;

            letter-spacing: 0;
          }

          .mvbd-save {
            min-height: 17px;

            color:
              rgba(
                180,
                255,
                207,
                0.68
              );

            font-size: 10px;
          }

          .mvbd-description {
            margin-top: 12px;

            min-height: 39px;

            color:
              rgba(
                255,
                255,
                255,
                0.38
              );

            font-size: 12px;

            line-height: 1.6;
          }

          .mvbd-features {
            list-style: none;

            margin:
              12px 0 16px;

            padding: 0;

            color:
              rgba(
                255,
                255,
                255,
                0.47
              );

            font-size: 12px;

            line-height: 2;
          }

          .mvbd-features li::before {
            content: "✓";

            margin-right: 8px;

            color:
              rgba(
                118,
                255,
                172,
                0.85
              );

            font-weight: 900;
          }

          /* =================================================
             CHOOSE BUTTON
          ================================================= */

          .mvbd-choose {
            position: relative;

            overflow: hidden;

            width: 100%;

            border: 0;

            border-radius:
              17px;

            padding:
              14px;

            cursor: pointer;

            color:
              #03150b;

            background:
              linear-gradient(
                135deg,
                #d8ffe8,
                #69ffa7 48%,
                #b6ffd3
              );

            box-shadow:
              0 13px 35px
                rgba(
                  0,
                  255,
                  137,
                  0.1
                ),
              inset 0 1px
                rgba(
                  255,
                  255,
                  255,
                  0.68
                );

            font-size: 13px;

            font-weight: 900;

            transition:
              transform 0.3s,
              filter 0.3s;
          }

          .mvbd-choose::after {
            content: "";

            position: absolute;

            top: -80%;
            left: -60%;

            width: 35%;
            height: 260%;

            transform:
              rotate(25deg);

            background:
              rgba(
                255,
                255,
                255,
                0.4
              );

            filter: blur(10px);

            animation:
              mvbdButtonShine
              4.8s
              ease-in-out
              infinite;
          }

          @keyframes mvbdButtonShine {
            0%,
            55% {
              left: -70%;
            }

            100% {
              left: 145%;
            }
          }

          .mvbd-choose:hover {
            filter:
              brightness(1.07);

            transform:
              scale(1.015);
          }

          .mvbd-choose:active {
            transform:
              scale(0.97);
          }

          /* =================================================
             INFO
          ================================================= */

          .mvbd-info {
            margin-top: 16px;

            padding: 18px;

            border:
              1px solid
              rgba(
                120,
                255,
                178,
                0.075
              );

            border-radius:
              25px;

            background:
              rgba(
                87,
                255,
                158,
                0.025
              );

            backdrop-filter:
              blur(25px);

            text-align: center;

            color:
              rgba(
                255,
                255,
                255,
                0.36
              );

            font-size: 11px;

            line-height: 1.7;

            box-shadow:
              inset 0 1px
                rgba(
                  255,
                  255,
                  255,
                  0.05
                );
          }

          .mvbd-info strong {
            color:
              rgba(
                183,
                255,
                210,
                0.82
              );
          }

          .mvbd-footer {
            padding:
              27px 0 0;

            text-align: center;

            color:
              rgba(
                255,
                255,
                255,
                0.18
              );

            font-size: 10px;
          }

          /* =================================================
             VIEWPORT MODAL
          ================================================= */

          .mvbd-subscription-modal {
            position: fixed !important;

            inset: 0 !important;

            width: 100vw !important;
            height: 100vh !important;
            height: 100dvh !important;

            margin: 0 !important;

            padding:
              max(
                16px,
                env(safe-area-inset-top)
              )
              max(
                16px,
                env(safe-area-inset-right)
              )
              max(
                16px,
                env(safe-area-inset-bottom)
              )
              max(
                16px,
                env(safe-area-inset-left)
              ) !important;

            display: flex !important;

            align-items: center !important;

            justify-content: center !important;

            overflow: hidden !important;

            z-index:
              2147483647 !important;

            isolation: isolate;

            background:
              radial-gradient(
                circle at 50% 45%,
                rgba(
                  0,
                  255,
                  145,
                  0.07
                ),
                transparent 34%
              ),
              rgba(
                0,
                8,
                5,
                0.84
              );

            backdrop-filter:
              blur(28px)
              saturate(125%);

            -webkit-backdrop-filter:
              blur(28px)
              saturate(125%);

            animation:
              mvbdOverlayIn
              0.38s
              ease
              forwards;
          }

          @keyframes mvbdOverlayIn {
            from {
              opacity: 0;

              backdrop-filter:
                blur(0)
                saturate(100%);

              -webkit-backdrop-filter:
                blur(0)
                saturate(100%);
            }

            to {
              opacity: 1;

              backdrop-filter:
                blur(28px)
                saturate(125%);

              -webkit-backdrop-filter:
                blur(28px)
                saturate(125%);
            }
          }

          /* =================================================
             MODAL SHEET
          ================================================= */

          .mvbd-sheet {
            position: relative !important;

            inset: auto !important;

            top: auto !important;
            right: auto !important;
            bottom: auto !important;
            left: auto !important;

            float: none !important;

            flex:
              0 0 auto !important;

            width:
              min(
                470px,
                calc(100vw - 32px)
              ) !important;

            max-width:
              calc(100vw - 32px) !important;

            height: auto !important;

            max-height:
              min(
                88dvh,
                720px
              ) !important;

            margin: 0 !important;

            padding: 24px;

            overflow-x: hidden;

            overflow-y: auto;

            border:
              1px solid
              rgba(
                120,
                255,
                179,
                0.13
              );

            border-radius:
              34px;

            background:
              linear-gradient(
                145deg,
                rgba(
                  18,
                  34,
                  26,
                  0.94
                ),
                rgba(
                  5,
                  12,
                  9,
                  0.97
                )
              );

            backdrop-filter:
              blur(45px)
              saturate(150%);

            -webkit-backdrop-filter:
              blur(45px)
              saturate(150%);

            box-shadow:
              0 45px 150px
                rgba(
                  0,
                  0,
                  0,
                  0.78
                ),
              0 0 80px
                rgba(
                  0,
                  255,
                  137,
                  0.055
                ),
              inset 0 1px
                rgba(
                  255,
                  255,
                  255,
                  0.1
                );

            transform-origin:
              center center;

            animation:
              mvbdSheetIn
              0.58s
              cubic-bezier(
                0.16,
                1,
                0.3,
                1
              )
              forwards;

            isolation: isolate;
          }

          @keyframes mvbdSheetIn {
            0% {
              opacity: 0;

              transform:
                translate3d(
                  0,
                  25px,
                  0
                )
                scale(0.91);

              filter:
                blur(14px);
            }

            55% {
              opacity: 1;

              transform:
                translate3d(
                  0,
                  -4px,
                  0
                )
                scale(1.015);

              filter:
                blur(0);
            }

            100% {
              opacity: 1;

              transform:
                translate3d(
                  0,
                  0,
                  0
                )
                scale(1);

              filter:
                blur(0);
            }
          }

          /* =================================================
             MODAL LIQUID BLOBS
          ================================================= */

          .mvbd-sheet::before {
            content: "";

            position: absolute;

            z-index: -1;

            width: 230px;
            height: 230px;

            right: -100px;
            top: -110px;

            border-radius:
              46% 54% 62% 38% /
              42% 37% 63% 58%;

            background:
              radial-gradient(
                circle at 30% 30%,
                rgba(
                  78,
                  255,
                  165,
                  0.16
                ),
                rgba(
                  0,
                  151,
                  86,
                  0.045
                ) 50%,
                transparent 70%
              );

            filter: blur(12px);

            animation:
              mvbdModalBlobOne
              8s
              ease-in-out
              infinite
              alternate;
          }

          .mvbd-sheet::after {
            content: "";

            position: absolute;

            z-index: -1;

            width: 190px;
            height: 190px;

            left: -100px;
            bottom: -110px;

            border-radius:
              61% 39% 43% 57% /
              51% 62% 38% 49%;

            background:
              radial-gradient(
                circle,
                rgba(
                  64,
                  255,
                  153,
                  0.085
                ),
                transparent 68%
              );

            filter: blur(18px);

            animation:
              mvbdModalBlobTwo
              9s
              ease-in-out
              infinite
              alternate;
          }

          @keyframes mvbdModalBlobOne {
            0% {
              transform:
                translate(0, 0)
                rotate(0deg)
                scale(1);
            }

            100% {
              transform:
                translate(
                  -45px,
                  55px
                )
                rotate(25deg)
                scale(1.22);
            }
          }

          @keyframes mvbdModalBlobTwo {
            0% {
              transform:
                translate(0, 0)
                rotate(0deg);
            }

            100% {
              transform:
                translate(
                  50px,
                  -30px
                )
                rotate(-20deg)
                scale(1.25);
            }
          }

          /* =================================================
             CLOSE
          ================================================= */

          .mvbd-close {
            float: right;

            width: 36px;
            height: 36px;

            border:
              1px solid
              rgba(
                143,
                255,
                194,
                0.08
              );

            border-radius: 50%;

            background:
              rgba(
                87,
                255,
                160,
                0.045
              );

            color:
              rgba(
                230,
                255,
                240,
                0.82
              );

            font-size: 20px;

            cursor: pointer;

            transition:
              transform 0.3s,
              background 0.3s;
          }

          .mvbd-close:hover {
            transform:
              rotate(90deg)
              scale(1.05);

            background:
              rgba(
                94,
                255,
                164,
                0.09
              );
          }

          .mvbd-sheet h2 {
            margin:
              3px 42px 7px 0;

            font-size: 24px;

            letter-spacing:
              -1px;
          }

          .mvbd-muted {
            color:
              rgba(
                255,
                255,
                255,
                0.45
              );

            font-size: 12px;

            line-height: 1.7;
          }

          /* =================================================
             SELECTED PLAN
          ================================================= */

          .mvbd-selected {
            display: flex;

            align-items: center;

            justify-content:
              space-between;

            gap: 15px;

            margin:
              17px 0;

            padding: 15px;

            border:
              1px solid
              rgba(
                115,
                255,
                174,
                0.085
              );

            border-radius:
              20px;

            background:
              rgba(
                88,
                255,
                159,
                0.035
              );

            box-shadow:
              inset 0 1px
                rgba(
                  255,
                  255,
                  255,
                  0.05
                );
          }

          .mvbd-selected-price {
            color:
              #9dffc1;

            font-weight: 900;
          }

          /* =================================================
             PAYMENT BOX
          ================================================= */

          .mvbd-payment-box {
            margin-top: 13px;

            padding: 17px;

            border:
              1px solid
              rgba(
                112,
                255,
                173,
                0.08
              );

            border-radius:
              21px;

            background:
              rgba(
                85,
                255,
                156,
                0.032
              );

            box-shadow:
              inset 0 1px
                rgba(
                  255,
                  255,
                  255,
                  0.045
                );
          }

          .mvbd-label {
            color:
              rgba(
                193,
                255,
                216,
                0.42
              );

            font-size: 9px;

            font-weight: 800;

            letter-spacing:
              0.8px;

            text-transform:
              uppercase;
          }

          .mvbd-number-row {
            display: flex;

            align-items: center;

            justify-content:
              space-between;

            gap: 8px;

            margin-top: 8px;
          }

          .mvbd-number {
            font-size: 19px;

            font-weight: 900;

            letter-spacing:
              0.2px;
          }

          .mvbd-copy {
            flex-shrink: 0;

            border:
              1px solid
              rgba(
                121,
                255,
                177,
                0.09
              );

            border-radius:
              12px;

            padding:
              9px 11px;

            background:
              rgba(
                92,
                255,
                159,
                0.045
              );

            color:
              rgba(
                222,
                255,
                235,
                0.8
              );

            font-size: 10px;

            cursor: pointer;

            transition:
              transform 0.25s,
              background 0.25s;
          }

          .mvbd-copy:hover {
            transform:
              scale(1.04);

            background:
              rgba(
                92,
                255,
                159,
                0.09
              );
          }

          /* =================================================
             INPUT
          ================================================= */

          .mvbd-input {
            display: block;

            width: 100%;

            margin-top: 12px;

            padding:
              14px 15px;

            border:
              1px solid
              rgba(
                255,
                255,
                255,
                0.09
              );

            border-radius:
              17px;

            outline: none;

            background:
              rgba(
                0,
                0,
                0,
                0.28
              );

            color: white;

            font-size: 14px;

            transition:
              border-color 0.3s,
              box-shadow 0.3s;
          }

          .mvbd-input::placeholder {
            color:
              rgba(
                255,
                255,
                255,
                0.25
              );
          }

          .mvbd-input:focus {
            border-color:
              rgba(
                87,
                255,
                161,
                0.34
              );

            box-shadow:
              0 0 0 4px
                rgba(
                  52,
                  255,
                  148,
                  0.045
                ),
              inset 0 1px
                rgba(
                  255,
                  255,
                  255,
                  0.05
                );
          }

          .mvbd-error {
            margin-top: 8px;

            color:
              #ffaaa1;

            font-size: 10px;
          }

          /* =================================================
             SEND BUTTON
          ================================================= */

          .mvbd-send {
            position: relative;

            overflow: hidden;

            width: 100%;

            margin-top: 12px;

            padding: 14px;

            border: 0;

            border-radius:
              17px;

            background:
              linear-gradient(
                135deg,
                #d8ffe7,
                #62ffa2,
                #b6ffd3
              );

            color:
              #03150b;

            font-weight: 900;

            cursor: pointer;

            box-shadow:
              0 15px 38px
                rgba(
                  0,
                  255,
                  137,
                  0.1
                ),
              inset 0 1px
                rgba(
                  255,
                  255,
                  255,
                  0.65
                );

            transition:
              transform 0.25s,
              filter 0.25s,
              opacity 0.25s;
          }

          .mvbd-send:hover {
            filter:
              brightness(1.06);

            transform:
              scale(1.012);
          }

          .mvbd-send:active {
            transform:
              scale(0.975);
          }

          .mvbd-send:disabled {
            cursor:
              not-allowed;

            opacity:
              0.55;

            transform:
              none;
          }

          .mvbd-send::after {
            content: "";

            position: absolute;

            width: 25%;
            height: 220%;

            top: -60%;
            left: -40%;

            transform:
              rotate(25deg);

            background:
              rgba(
                255,
                255,
                255,
                0.35
              );

            filter: blur(8px);

            animation:
              mvbdSendShine
              4s
              ease-in-out
              infinite;
          }

          @keyframes mvbdSendShine {
            0%,
            58% {
              left: -45%;
            }

            100% {
              left: 140%;
            }
          }

          .mvbd-note {
            margin-top: 10px;

            color:
              rgba(
                255,
                255,
                255,
                0.23
              );

            font-size: 9px;

            line-height: 1.5;

            text-align: center;
          }

          /* =================================================
             PROCESSING
          ================================================= */

          .mvbd-processing {
            text-align: center;

            padding:
              25px 8px 8px;
          }

          .mvbd-orb {
            position: relative;

            width: 92px;
            height: 92px;

            margin:
              6px auto 22px;

            border-radius:
              44% 56% 62% 38% /
              55% 43% 57% 45%;

            background:
              conic-gradient(
                from 0deg,
                #49ff9b,
                #0ca96a,
                #8affc2,
                #49ff9b
              );

            animation:
              mvbdOrbSpin
                3s
                linear
                infinite,
              mvbdOrbMorph
                4.5s
                ease-in-out
                infinite
                alternate;

            box-shadow:
              0 0 55px
                rgba(
                  50,
                  255,
                  148,
                  0.16
                );
          }

          .mvbd-orb::after {
            content: "";

            position: absolute;

            inset: 8px;

            border-radius:
              inherit;

            background:
              radial-gradient(
                circle at 35% 25%,
                rgba(
                  255,
                  255,
                  255,
                  0.065
                ),
                #06100b 62%
              );

            box-shadow:
              inset 0 0 25px
                rgba(
                  255,
                  255,
                  255,
                  0.055
                );
          }

          .mvbd-orb::before {
            content: "";

            position: absolute;

            inset: -12px;

            border:
              1px solid
              rgba(
                119,
                255,
                181,
                0.12
              );

            border-radius:
              48% 52% 40% 60% /
              55% 38% 62% 45%;

            animation:
              mvbdLiquidRing
              2.5s
              ease-in-out
              infinite
              alternate;
          }

          @keyframes mvbdOrbSpin {
            to {
              transform:
                rotate(360deg);
            }
          }

          @keyframes mvbdOrbMorph {
            from {
              border-radius:
                44% 56% 62% 38% /
                55% 43% 57% 45%;
            }

            to {
              border-radius:
                62% 38% 44% 56% /
                38% 59% 41% 62%;
            }
          }

          @keyframes mvbdLiquidRing {
            to {
              transform:
                scale(1.12)
                rotate(-20deg);

              opacity: 0.28;
            }
          }

          /* =================================================
             PROGRESS
          ================================================= */

          .mvbd-progress {
            height: 5px;

            margin:
              22px 0 9px;

            overflow: hidden;

            border-radius:
              999px;

            background:
              rgba(
                255,
                255,
                255,
                0.065
              );
          }

          .mvbd-progress-bar {
            height: 100%;

            border-radius:
              inherit;

            background:
              linear-gradient(
                90deg,
                #42ff98,
                #9dffc2,
                #35d984
              );

            box-shadow:
              0 0 14px
                rgba(
                  74,
                  255,
                  158,
                  0.36
                );

            transition:
              width 0.12s linear;
          }

          .mvbd-percent {
            color:
              rgba(
                201,
                255,
                219,
                0.32
              );

            font-size: 10px;
          }

          /* =================================================
             SUCCESS
          ================================================= */

          .mvbd-success-icon {
            width: 74px;
            height: 74px;

            display: grid;

            place-items: center;

            margin:
              7px auto 17px;

            border:
              1px solid
              rgba(
                110,
                255,
                167,
                0.18
              );

            border-radius: 50%;

            background:
              radial-gradient(
                circle,
                rgba(
                  100,
                  255,
                  165,
                  0.09
                ),
                rgba(
                  100,
                  255,
                  165,
                  0.018
                )
              );

            color:
              #aaffc8;

            font-size: 34px;

            box-shadow:
              0 0 50px
                rgba(
                  74,
                  255,
                  155,
                  0.075
                ),
              inset 0 1px
                rgba(
                  255,
                  255,
                  255,
                  0.07
                );

            animation:
              mvbdSuccess
              0.65s
              cubic-bezier(
                0.16,
                1,
                0.3,
                1
              );
          }

          @keyframes mvbdSuccess {
            0% {
              opacity: 0;

              transform:
                scale(0.5)
                rotate(-12deg);
            }

            70% {
              transform:
                scale(1.08)
                rotate(3deg);
            }

            100% {
              opacity: 1;

              transform:
                scale(1)
                rotate(0);
            }
          }

          /* =================================================
             DONE
          ================================================= */

          .mvbd-done {
            width: 100%;

            margin-top: 18px;

            padding: 13px;

            border:
              1px solid
              rgba(
                114,
                255,
                174,
                0.09
              );

            border-radius:
              16px;

            background:
              rgba(
                87,
                255,
                158,
                0.045
              );

            color:
              white;

            font-weight: 800;

            cursor: pointer;

            transition:
              background 0.3s,
              transform 0.3s;
          }

          .mvbd-done:hover {
            background:
              rgba(
                87,
                255,
                158,
                0.085
              );

            transform:
              scale(1.01);
          }

          /* =================================================
             MOBILE
          ================================================= */

          @media (max-width: 760px) {

            .mvbd-premium-page {
              padding-left:
                12px;

              padding-right:
                12px;

              padding-bottom:
                0;
            }

            .mvbd-plans {
              grid-template-columns:
                1fr;
            }

            .mvbd-card-popular {
              order: -1;
            }

            .mvbd-hero {
              padding-top:
                58px;
            }

            .mvbd-hero h1 {
              letter-spacing:
                -2.7px;
            }

            .mvbd-stars {
              height: 570px;
            }

            .mvbd-subscription-modal {
              width: 100vw !important;
              height: 100dvh !important;

              padding:
                max(
                  12px,
                  env(safe-area-inset-top)
                )
                max(
                  12px,
                  env(safe-area-inset-right)
                )
                max(
                  12px,
                  env(safe-area-inset-bottom)
                )
                max(
                  12px,
                  env(safe-area-inset-left)
                ) !important;
            }

            .mvbd-sheet {
              width:
                calc(100vw - 24px) !important;

              max-width:
                calc(100vw - 24px) !important;

              max-height:
                86dvh !important;

              padding:
                21px;

              border-radius:
                30px;
            }

            .mvbd-number {
              font-size:
                17px;
            }
          }

          /* =================================================
             SMALL PHONES
          ================================================= */

          @media (max-width: 380px) {

            .mvbd-sheet {
              width:
                calc(100vw - 18px) !important;

              max-width:
                calc(100vw - 18px) !important;

              padding:
                18px;

              border-radius:
                27px;
            }

            .mvbd-sheet h2 {
              font-size:
                21px;
            }

            .mvbd-number {
              font-size:
                15px;
            }
          }

          /* =================================================
             REDUCED MOTION
          ================================================= */

          @media (prefers-reduced-motion: reduce) {

            .mvbd-premium-page *,
            .mvbd-premium-page *::before,
            .mvbd-premium-page *::after,
            .mvbd-subscription-modal *,
            .mvbd-subscription-modal *::before,
            .mvbd-subscription-modal *::after {
              animation-duration:
                0.01ms !important;

              animation-iteration-count:
                1 !important;

              transition:
                none !important;
            }
          }

        `}</style>

        {/* ===================================================
            LIVE STARS
        =================================================== */}

        <div
          className="mvbd-stars"
          aria-hidden="true"
        >
          {Array.from({
            length: 34,
          }).map((_, index) => (
            <span
              key={index}
              className="mvbd-star"
              style={
                {
                  left:
                    `${(index * 31.7) % 100}%`,

                  top:
                    `${(index * 67.3) % 570}px`,

                  ["--duration" as string]:
                    `${1.7 + (index % 5) * 0.7}s`,

                  animationDelay:
                    `${-(index % 6) * 0.55}s`,
                } as React.CSSProperties
              }
            />
          ))}
        </div>

        <div className="mvbd-container">

          {/* =================================================
              NAVIGATION
          ================================================= */}

          <nav className="mvbd-nav">

            <div className="mvbd-brand">

              <div className="mvbd-logo">
                M
              </div>

              <span>
                MoviesVerseBD
              </span>

            </div>

            <div className="mvbd-nav-badge">
              Premium Access
            </div>

          </nav>

          {/* =================================================
              HERO
          ================================================= */}

          <section className="mvbd-hero">

            <div className="mvbd-hero-glow" />

            <div className="mvbd-eyebrow">

              <span className="mvbd-live-dot" />

              Unlock your premium experience

            </div>

            <h1>
              Choose your
              <br />
              perfect plan.
            </h1>

            <div className="mvbd-premium-title">
              MVBD PREMIUM
            </div>

            <p className="mvbd-subtitle">
              Enjoy a beautiful premium experience
              with uninterrupted access to your
              authorized MVBD library.
            </p>

            <div className="mvbd-trial">
              ✦ 7-day free trial for new members
            </div>

          </section>

          {/* =================================================
              PAID PLANS
          ================================================= */}

          <section className="mvbd-plans">

            {paidPlans.map((plan) => (
              <article
                key={plan.planId}
                className={
                  `mvbd-card ${
                    plan.popular
                      ? "mvbd-card-popular"
                      : ""
                  }`
                }
              >

                {plan.popular && (
                  <div className="mvbd-ribbon">
                    MOST POPULAR
                  </div>
                )}

                <div className="mvbd-plan-name">
                  {plan.name}
                </div>

                <div className="mvbd-price">
                  {plan.price}

                  <small>
                    {" "}
                    / {plan.duration}
                  </small>
                </div>

                <div className="mvbd-save">
                  {plan.save || "\u00a0"}
                </div>

                <div className="mvbd-description">
                  {plan.description}
                </div>

                <ul className="mvbd-features">

                  <li>
                    Premium access
                  </li>

                  <li>
                    MVBD app access
                  </li>

                  <li>
                    Telegram access included
                  </li>

                  <li>
                    Fast premium experience
                  </li>

                </ul>

                <button
                  type="button"
                  className="mvbd-choose"
                  onClick={() =>
                    openPlan(plan)
                  }
                >
                  Continue
                </button>

              </article>
            ))}

          </section>

          {/* =================================================
              INFO
          ================================================= */}

          <div className="mvbd-info">

            <strong>
              New here?
            </strong>{" "}

            Start with your 7-day free trial.

            After your trial ends, an active
            subscription is required for premium
            access.

            <br />

            After payment, submit your transaction
            ID for admin review.

          </div>

          <div className="mvbd-footer">
            MoviesVerseBD • MVBD Premium Membership
          </div>

        </div>
      </main>

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
              className="mvbd-sheet"
              onMouseDown={(event) =>
                event.stopPropagation()
              }
            >

              <button
                type="button"
                className="mvbd-close"
                onClick={closePayment}
                aria-label="Close"
                disabled={submitting}
              >
                ×
              </button>

              <h2>
                Complete your payment
              </h2>

              <p className="mvbd-muted">
                Send Money to the payment number
                and then paste your transaction ID
                below.
              </p>

              <div className="mvbd-selected">

                <span>
                  {selectedPlan.name}
                </span>

                <span className="mvbd-selected-price">
                  {selectedPlan.price}
                </span>

              </div>

              <div className="mvbd-payment-box">

                <div className="mvbd-label">
                  Send Money — bKash
                </div>

                <div className="mvbd-number-row">

                  <span className="mvbd-number">
                    {PAYMENT_NUMBER}
                  </span>

                  <button
                    type="button"
                    className="mvbd-copy"
                    onClick={copyNumber}
                  >
                    {copied
                      ? "Copied ✓"
                      : "Copy"}
                  </button>

                </div>

              </div>

              <input
                className="mvbd-input"
                type="text"
                inputMode="text"
                autoComplete="off"
                placeholder="Paste transaction ID here"
                value={transactionId}
                disabled={submitting}
                onChange={(event) => {
                  setTransactionId(
                    event.target.value,
                  )

                  setError("")
                }}
              />

              {error && (
                <div className="mvbd-error">
                  {error}
                </div>
              )}

              <button
                type="button"
                className="mvbd-send"
                onClick={submitPayment}
                disabled={submitting}
              >
                {submitting
                  ? "Sending request..."
                  : "Send for Review →"}
              </button>

              <div className="mvbd-note">
                Please make sure your transaction ID
                is correct before submitting.
              </div>

            </div>

          </ViewportModal>
        )}

      {/* =====================================================
          PROCESSING MODAL
      ===================================================== */}

      {showProcessing && (
        <ViewportModal>

          <div className="mvbd-sheet mvbd-processing">

            <div className="mvbd-orb" />

            <h2>
              Processing payment…
            </h2>

            <p className="mvbd-muted">
              Your payment request has been received.
              Please wait while it is being prepared
              for admin review.
            </p>

            <div className="mvbd-progress">

              <div
                className="mvbd-progress-bar"
                style={{
                  width:
                    `${progress}%`,
                }}
              />

            </div>

            <div className="mvbd-percent">
              {progress}%
            </div>

          </div>

        </ViewportModal>
      )}

      {/* =====================================================
          SUCCESS MODAL
      ===================================================== */}

      {showSuccess && (
        <ViewportModal
          onBackdropClick={
            closeSuccess
          }
        >

          <div
            className="mvbd-sheet mvbd-processing"
            onMouseDown={(event) =>
              event.stopPropagation()
            }
          >

            <div className="mvbd-success-icon">
              ✓
            </div>

            <h2>
              Payment sent for review
            </h2>

            <p className="mvbd-muted">

              Your payment details have been
              successfully sent to the admin team.

              <br />
              <br />

              Your request is currently{" "}
              <strong>
                under review
              </strong>{" "}
              and will be approved if the payment
              information is correct.

              <br />
              <br />

              Please wait until the review is
              completed.

            </p>

            <button
              type="button"
              className="mvbd-done"
              onClick={closeSuccess}
            >
              Done
            </button>

          </div>

        </ViewportModal>
      )}

    </>
  )
}
