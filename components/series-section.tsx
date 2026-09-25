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
const plans = SUBSCRIPTION_PLANS

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

    const previousOverflow = document.body.style.overflow
    const previousTouchAction = document.body.style.touchAction

    document.body.style.overflow = "hidden"
    document.body.style.touchAction = "none"

    return () => {
      document.body.style.overflow = previousOverflow
      document.body.style.touchAction = previousTouchAction
    }
  }, [])

  if (!mounted) return null

  return createPortal(
    <div
      className="mvbd-viewport-modal"
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

/* =========================================================
   MAIN
========================================================= */

export default function SeriesSection() {
  const { user, profile } = useAuth()

  const [selectedPlan, setSelectedPlan] =
    useState<Plan | null>(null)

  const [transactionId, setTransactionId] = useState("")
  const [showPayment, setShowPayment] = useState(false)
  const [showProcessing, setShowProcessing] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [progress, setProgress] = useState(0)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState("")

  /* =======================================================
     PAYMENT
  ======================================================= */

  const openPlan = (plan: Plan) => {
    setSelectedPlan(plan)
    setTransactionId("")
    setError("")
    setCopied(false)
    setShowPayment(true)
  }

  const closePayment = () => {
    setShowPayment(false)
    setError("")
  }

  const copyNumber = async () => {
    try {
      await navigator.clipboard.writeText(PAYMENT_NUMBER)
      setCopied(true)

      setTimeout(() => {
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
      setError("Please enter a valid transaction ID.")
      return
    }

    if (!selectedPlan) {
      setError("Please select a subscription plan.")
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

    const startTime = Date.now()
    const processingDuration = 9000

    const timer = window.setInterval(() => {
      const elapsed = Date.now() - startTime

      const percentage = Math.min(
        100,
        Math.round(
          (elapsed / processingDuration) * 100
        )
      )

      setProgress(percentage)

      if (percentage >= 100) {
        window.clearInterval(timer)

        setTimeout(() => {
          setShowProcessing(false)
          setShowSuccess(true)
        }, 650)
      }
    }, 100)
  }

  const closeSuccess = () => {
    setShowSuccess(false)
    setSelectedPlan(null)
    setTransactionId("")
    setProgress(0)
    setError("")
  }

  return (
    <>
      <main className="mvbd-premium-page">

        <style jsx global>{`

          /* =====================================================
             RESET
          ===================================================== */

          .mvbd-premium-page,
          .mvbd-premium-page *,
          .mvbd-viewport-modal,
          .mvbd-viewport-modal * {
            box-sizing: border-box;
          }

          /* =====================================================
             MAIN BACKGROUND
          ===================================================== */

          .mvbd-premium-page {
            position: relative;
            min-height: 100vh;
            min-height: 100dvh;
            overflow: hidden;
            padding: 18px 14px 80px;
            isolation: isolate;
            color: white;

            background:
              radial-gradient(
                ellipse at 50% 0%,
                rgba(0, 255, 90, .13),
                transparent 35%
              ),
              radial-gradient(
                ellipse at 0% 35%,
                rgba(0, 255, 100, .09),
                transparent 30%
              ),
              radial-gradient(
                ellipse at 100% 65%,
                rgba(0, 180, 80, .08),
                transparent 30%
              ),
              linear-gradient(
                180deg,
                #001006 0%,
                #000503 35%,
                #000000 100%
              );
          }

          /* =====================================================
             MOVING GREEN AURORA
          ===================================================== */

          .mvbd-premium-page::before {
            content: "";
            position: fixed;
            inset: -40%;
            z-index: -3;
            pointer-events: none;

            background:
              radial-gradient(
                circle at 25% 30%,
                rgba(0, 255, 94, .16),
                transparent 24%
              ),
              radial-gradient(
                circle at 75% 25%,
                rgba(39, 255, 116, .10),
                transparent 22%
              ),
              radial-gradient(
                circle at 50% 75%,
                rgba(0, 180, 72, .14),
                transparent 25%
              );

            filter: blur(75px);

            animation:
              mvbdGreenAurora
              16s
              ease-in-out
              infinite
              alternate;
          }

          @keyframes mvbdGreenAurora {
            0% {
              transform:
                translate(-3%, -2%)
                scale(1);
            }

            50% {
              transform:
                translate(4%, 3%)
                scale(1.1);
            }

            100% {
              transform:
                translate(-2%, 6%)
                scale(1.04);
            }
          }

          /* =====================================================
             GREEN PARTICLE FIELD
          ===================================================== */

          .mvbd-stars {
            position: absolute;
            inset: 0 0 auto 0;
            height: 720px;
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
                rgba(80,255,130,.75) 0 1px,
                transparent 1.8px
              ),
              radial-gradient(
                circle,
                rgba(190,255,210,.5) 0 1px,
                transparent 1.7px
              );

            background-size:
              83px 97px,
              151px 137px;

            opacity: .32;

            animation:
              mvbdParticleDrift
              24s
              linear
              infinite;
          }

          @keyframes mvbdParticleDrift {
            from {
              transform: translateY(0);
            }

            to {
              transform: translateY(120px);
            }
          }

          .mvbd-star {
            position: absolute;
            width: 4px;
            height: 4px;
            border-radius: 50%;

            background: #73ff9c;

            box-shadow:
              0 0 8px #2cff72,
              0 0 20px rgba(44,255,114,.5);

            animation:
              mvbdStarPulse
              var(--duration)
              ease-in-out
              infinite
              alternate;
          }

          @keyframes mvbdStarPulse {
            from {
              transform: scale(.3);
              opacity: .15;
            }

            to {
              transform: scale(1.7);
              opacity: .9;
            }
          }

          /* =====================================================
             CONTAINER
          ===================================================== */

          .mvbd-container {
            position: relative;
            z-index: 2;
            width: min(1180px, 100%);
            margin: 0 auto;
          }

          /* =====================================================
             NAV
          ===================================================== */

          .mvbd-nav {
            display: flex;
            align-items: center;
            justify-content: space-between;

            padding: 10px 13px;

            border:
              1px solid
              rgba(83,255,130,.22);

            border-radius: 22px;

            background:
              linear-gradient(
                135deg,
                rgba(0,255,100,.10),
                rgba(255,255,255,.025)
              );

            backdrop-filter: blur(30px);
            -webkit-backdrop-filter: blur(30px);

            box-shadow:
              0 15px 55px rgba(0,0,0,.55),
              0 0 30px rgba(0,255,90,.04),
              inset 0 1px rgba(255,255,255,.12);
          }

          .mvbd-brand {
            display: flex;
            align-items: center;
            gap: 10px;

            font-size: 14px;
            font-weight: 900;
          }

          .mvbd-logo {
            width: 38px;
            height: 38px;

            display: grid;
            place-items: center;

            border-radius: 13px;

            color: #061009;

            font-size: 21px;
            font-weight: 1000;

            background:
              linear-gradient(
                145deg,
                #d8ffdc,
                #20ff63 48%,
                #00b93d
              );

            box-shadow:
              0 0 25px rgba(0,255,85,.35),
              inset 0 1px rgba(255,255,255,.8);
          }

          .mvbd-nav-badge {
            padding: 7px 11px;
            border-radius: 999px;

            border:
              1px solid
              rgba(71,255,118,.18);

            background:
              rgba(0,255,90,.045);

            color:
              rgba(170,255,193,.72);

            font-size: 9px;
            font-weight: 850;
          }

          /* =====================================================
             HERO
          ===================================================== */

          .mvbd-hero {
            position: relative;
            padding: 62px 8px 40px;
            text-align: center;
          }

          .mvbd-hero-glow {
            position: absolute;

            width: 500px;
            height: 280px;

            left: 50%;
            top: 25px;

            transform: translateX(-50%);

            border-radius: 50%;

            background:
              radial-gradient(
                circle,
                rgba(0,255,93,.17),
                rgba(0,255,93,.045) 42%,
                transparent 70%
              );

            filter: blur(25px);

            animation:
              mvbdHeroGlow
              6s
              ease-in-out
              infinite
              alternate;
          }

          @keyframes mvbdHeroGlow {
            from {
              transform:
                translateX(-50%)
                scale(.9);
            }

            to {
              transform:
                translateX(-50%)
                scale(1.18);
            }
          }

          .mvbd-eyebrow {
            position: relative;

            display: inline-flex;
            align-items: center;
            gap: 7px;

            padding: 7px 13px;

            border-radius: 999px;

            border:
              1px solid
              rgba(75,255,120,.22);

            background:
              rgba(0,255,85,.055);

            color:
              rgba(182,255,201,.85);

            font-size: 10px;
            font-weight: 800;

            backdrop-filter: blur(20px);
          }

          .mvbd-live-dot {
            width: 6px;
            height: 6px;

            border-radius: 50%;

            background: #39ff73;

            box-shadow:
              0 0 8px #32ff70,
              0 0 18px rgba(50,255,112,.65);

            animation:
              mvbdLivePulse
              1.6s
              ease-in-out
              infinite;
          }

          @keyframes mvbdLivePulse {
            50% {
              transform: scale(1.7);
              opacity: .45;
            }
          }

          .mvbd-hero h1 {
            position: relative;

            margin: 20px 0 12px;

            font-size:
              clamp(40px, 7vw, 75px);

            line-height: .95;

            letter-spacing: -4px;

            font-weight: 1000;

            background:
              linear-gradient(
                100deg,
                #ffffff 10%,
                #caffd4 48%,
                #27ff67 95%
              );

            -webkit-background-clip: text;
            background-clip: text;

            color: transparent;

            filter:
              drop-shadow(
                0 0 25px
                rgba(0,255,80,.13)
              );
          }

          .mvbd-premium-title {
            color: #39ff70;

            font-size:
              clamp(12px, 2vw, 17px);

            font-weight: 950;

            letter-spacing: 8px;

            text-shadow:
              0 0 18px
              rgba(0,255,83,.35);
          }

          .mvbd-subtitle {
            max-width: 620px;

            margin: 15px auto 0;

            color:
              rgba(255,255,255,.48);

            font-size: 13px;
            line-height: 1.7;
          }

          .mvbd-trial {
            display: inline-flex;

            margin-top: 17px;
            padding: 8px 13px;

            border-radius: 999px;

            border:
              1px solid
              rgba(44,255,108,.22);

            background:
              rgba(0,255,80,.045);

            color:
              rgba(185,255,203,.8);

            font-size: 10px;
            font-weight: 800;

            box-shadow:
              0 0 25px
              rgba(0,255,90,.05);
          }

          /* =====================================================
             PLAN GRID
          ===================================================== */

          .mvbd-plans {
            display: grid;

            grid-template-columns:
              repeat(4, 1fr);

            gap: 13px;
          }

          /* =====================================================
             PLAN CARD
          ===================================================== */

          .mvbd-card {
            --plan-color: #25ff66;
            --plan-soft: rgba(37,255,102,.14);

            position: relative;
            overflow: hidden;

            min-height: 535px;

            padding: 22px 18px 17px;

            border-radius: 25px;

            border:
              1px solid
              color-mix(
                in srgb,
                var(--plan-color) 48%,
                transparent
              );

            background:
              linear-gradient(
                155deg,
                color-mix(
                  in srgb,
                  var(--plan-color) 11%,
                  rgba(4,10,6,.9)
                ),
                rgba(2,7,4,.94) 55%,
                rgba(0,0,0,.96)
              );

            backdrop-filter:
              blur(30px)
              saturate(145%);

            -webkit-backdrop-filter:
              blur(30px)
              saturate(145%);

            box-shadow:
              0 20px 70px rgba(0,0,0,.65),
              0 0 28px var(--plan-soft),
              inset 0 1px rgba(255,255,255,.1);

            transition:
              transform .45s cubic-bezier(.2,.8,.2,1),
              box-shadow .45s,
              border-color .35s;
          }

          .mvbd-card::before {
            content: "";

            position: absolute;

            width: 220px;
            height: 220px;

            top: -130px;
            right: -100px;

            border-radius: 50%;

            background:
              radial-gradient(
                circle,
                var(--plan-soft),
                transparent 68%
              );

            filter: blur(8px);

            animation:
              mvbdCardGlow
              7s
              ease-in-out
              infinite
              alternate;
          }

          .mvbd-card::after {
            content: "";

            position: absolute;

            width: 55%;
            height: 160%;

            top: -30%;
            left: -90%;

            transform: rotate(25deg);

            background:
              linear-gradient(
                90deg,
                transparent,
                rgba(255,255,255,.13),
                transparent
              );

            filter: blur(8px);

            animation:
              mvbdCardShine
              6s
              ease-in-out
              infinite;
          }

          @keyframes mvbdCardGlow {
            from {
              transform: translate(0,0) scale(.85);
            }

            to {
              transform: translate(-45px,55px) scale(1.35);
            }
          }

          @keyframes mvbdCardShine {
            0%,
            60% {
              left: -90%;
            }

            100% {
              left: 150%;
            }
          }

          .mvbd-card:hover {
            transform: translateY(-8px) scale(1.012);

            box-shadow:
              0 30px 90px rgba(0,0,0,.75),
              0 0 45px var(--plan-soft),
              inset 0 1px rgba(255,255,255,.16);
          }

          /* =====================================================
             PLAN COLORS
          ===================================================== */

          .mvbd-card-free {
            --plan-color: #37ff70;
            --plan-soft: rgba(37,255,100,.22);
          }

          .mvbd-card-monthly {
            --plan-color: #24cfff;
            --plan-soft: rgba(36,207,255,.20);
          }

          .mvbd-card-two {
            --plan-color: #d34cff;
            --plan-soft: rgba(211,76,255,.20);
          }

          .mvbd-card-three {
            --plan-color: #ffd72f;
            --plan-soft: rgba(255,215,47,.20);
          }

          /* =====================================================
             CARD TOP
          ===================================================== */

          .mvbd-plan-icon {
            width: 43px;
            height: 43px;

            display: grid;
            place-items: center;

            margin-bottom: 13px;

            border-radius: 14px;

            border:
              1px solid
              color-mix(
                in srgb,
                var(--plan-color) 60%,
                transparent
              );

            background:
              color-mix(
                in srgb,
                var(--plan-color) 11%,
                transparent
              );

            color: var(--plan-color);

            font-size: 20px;

            box-shadow:
              0 0 20px
              var(--plan-soft),
              inset 0 1px
              rgba(255,255,255,.12);
          }

          .mvbd-plan-name {
            color:
              color-mix(
                in srgb,
                var(--plan-color) 90%,
                white
              );

            font-size: 11px;
            font-weight: 950;
            letter-spacing: 1px;
          }

          .mvbd-price {
            margin-top: 10px;

            color: white;

            font-size: 37px;
            font-weight: 1000;

            letter-spacing: -2px;

            text-shadow:
              0 0 18px
              var(--plan-soft);
          }

          .mvbd-price small {
            color:
              rgba(255,255,255,.43);

            font-size: 10px;
            font-weight: 700;

            letter-spacing: 0;
          }

          .mvbd-save {
            min-height: 17px;

            margin-top: 2px;

            color:
              color-mix(
                in srgb,
                var(--plan-color) 80%,
                white
              );

            font-size: 9px;
            font-weight: 800;
          }

          .mvbd-description {
            min-height: 48px;

            margin-top: 10px;

            color:
              rgba(255,255,255,.48);

            font-size: 10px;
            line-height: 1.55;
          }

          /* =====================================================
             FEATURES
          ===================================================== */

          .mvbd-features {
            list-style: none;

            margin: 11px 0 17px;
            padding: 0;

            color:
              rgba(255,255,255,.70);

            font-size: 10px;
            line-height: 1.5;
          }

          .mvbd-features li {
            display: flex;
            align-items: flex-start;
            gap: 7px;

            padding: 7px 0;

            border-bottom:
              1px solid
              rgba(255,255,255,.055);
          }

          .mvbd-features li::before {
            content: "✓";

            flex-shrink: 0;

            display: grid;
            place-items: center;

            width: 17px;
            height: 17px;

            margin-top: -1px;

            border-radius: 50%;

            color: #001b08;

            background:
              var(--plan-color);

            font-size: 9px;
            font-weight: 1000;

            box-shadow:
              0 0 10px
              var(--plan-soft);
          }

          /* =====================================================
             POPULAR
          ===================================================== */

          .mvbd-ribbon {
            position: absolute;

            top: 15px;
            right: 13px;

            padding: 5px 8px;

            border-radius: 999px;

            background:
              linear-gradient(
                135deg,
                #ffdf72,
                #ffad32
              );

            color: #201400;

            font-size: 7px;
            font-weight: 1000;

            box-shadow:
              0 0 18px
              rgba(255,190,50,.25);
          }

          /* =====================================================
             BUTTON
          ===================================================== */

          .mvbd-choose {
            position: relative;
            overflow: hidden;

            width: 100%;

            margin-top: auto;

            padding: 13px 12px;

            border:
              1px solid
              color-mix(
                in srgb,
                var(--plan-color) 70%,
                transparent
              );

            border-radius: 15px;

            background:
              linear-gradient(
                135deg,
                color-mix(
                  in srgb,
                  var(--plan-color) 22%,
                  transparent
                ),
                color-mix(
                  in srgb,
                  var(--plan-color) 8%,
                  black
                )
              );

            color:
              color-mix(
                in srgb,
                var(--plan-color) 90%,
                white
              );

            cursor: pointer;

            font-size: 11px;
            font-weight: 950;

            box-shadow:
              0 0 22px
              var(--plan-soft),
              inset 0 1px
              rgba(255,255,255,.14);

            transition:
              transform .25s,
              filter .25s;
          }

          .mvbd-choose::after {
            content: "";

            position: absolute;

            top: -80%;
            left: -70%;

            width: 35%;
            height: 260%;

            transform: rotate(25deg);

            background:
              rgba(255,255,255,.35);

            filter: blur(8px);

            animation:
              mvbdButtonShine
              4.5s
              ease-in-out
              infinite;
          }

          @keyframes mvbdButtonShine {
            0%,
            55% {
              left: -70%;
            }

            100% {
              left: 150%;
            }
          }

          .mvbd-choose:hover {
            transform: scale(1.025);
            filter: brightness(1.15);
          }

          .mvbd-choose:active {
            transform: scale(.96);
          }

          /* =====================================================
             WHY MVBD
          ===================================================== */

          .mvbd-why {
            margin-top: 18px;

            padding: 24px 18px;

            border:
              1px solid
              rgba(45,255,106,.18);

            border-radius: 25px;

            background:
              linear-gradient(
                145deg,
                rgba(0,255,85,.055),
                rgba(255,255,255,.018)
              );

            backdrop-filter: blur(25px);

            box-shadow:
              0 20px 70px rgba(0,0,0,.5),
              inset 0 1px rgba(255,255,255,.08);
          }

          .mvbd-why-title {
            text-align: center;

            margin-bottom: 20px;

            font-size: 20px;
            font-weight: 1000;
          }

          .mvbd-why-title span {
            color: #32ff6b;

            text-shadow:
              0 0 20px
              rgba(0,255,90,.3);
          }

          .mvbd-benefits {
            display: grid;

            grid-template-columns:
              repeat(5, 1fr);

            gap: 12px;
          }

          .mvbd-benefit {
            text-align: center;

            padding: 8px;
          }

          .mvbd-benefit-icon {
            width: 48px;
            height: 48px;

            display: grid;
            place-items: center;

            margin: 0 auto 9px;

            border-radius: 50%;

            border:
              1px solid
              rgba(47,255,105,.45);

            background:
              rgba(0,255,90,.07);

            color: #39ff73;

            font-size: 20px;

            box-shadow:
              0 0 20px
              rgba(0,255,90,.12),
              inset 0 1px
              rgba(255,255,255,.1);
          }

          .mvbd-benefit strong {
            display: block;

            color:
              rgba(255,255,255,.86);

            font-size: 10px;
          }

          .mvbd-benefit span {
            display: block;

            margin-top: 4px;

            color:
              rgba(255,255,255,.36);

            font-size: 8px;
            line-height: 1.4;
          }

          /* =====================================================
             FOOTER
          ===================================================== */

          .mvbd-footer {
            position: relative;

            margin-top: 28px;

            padding: 28px 10px 0;

            text-align: center;

            color:
              rgba(255,255,255,.35);

            font-size: 10px;
          }

          .mvbd-footer-logo {
            color: #39ff70;

            font-size: 27px;
            font-weight: 1000;

            text-shadow:
              0 0 25px
              rgba(0,255,90,.35);
          }

          .mvbd-footer-line {
            margin-top: 7px;

            color:
              rgba(255,255,255,.28);

            font-size: 9px;
            letter-spacing: 1px;
          }

          /* =====================================================
             INFO
          ===================================================== */

          .mvbd-info {
            margin-top: 14px;

            padding: 14px 16px;

            border:
              1px solid
              rgba(255,255,255,.07);

            border-radius: 18px;

            background:
              rgba(255,255,255,.018);

            text-align: center;

            color:
              rgba(255,255,255,.34);

            font-size: 9px;
            line-height: 1.65;
          }

          .mvbd-info strong {
            color: #43ff79;
          }

          /* =====================================================
             MODAL
          ===================================================== */

          .mvbd-viewport-modal {
            position: fixed !important;
            inset: 0 !important;

            width: 100vw !important;
            height: 100vh !important;
            height: 100dvh !important;

            display: flex !important;

            align-items: center !important;
            justify-content: center !important;

            padding: 16px !important;

            overflow: hidden !important;

            z-index: 2147483647 !important;

            background:
              radial-gradient(
                circle at 50% 45%,
                rgba(0,255,80,.09),
                transparent 34%
              ),
              rgba(0,0,0,.86);

            backdrop-filter:
              blur(28px);

            -webkit-backdrop-filter:
              blur(28px);

            animation:
              mvbdOverlayIn
              .35s
              ease
              forwards;
          }

          @keyframes mvbdOverlayIn {
            from {
              opacity: 0;
              backdrop-filter: blur(0);
            }

            to {
              opacity: 1;
              backdrop-filter: blur(28px);
            }
          }

          .mvbd-sheet {
            position: relative !important;

            width:
              min(470px, calc(100vw - 32px)) !important;

            max-width:
              calc(100vw - 32px) !important;

            max-height:
              min(88dvh, 720px) !important;

            overflow-x: hidden;
            overflow-y: auto;

            padding: 24px;

            border:
              1px solid
              rgba(50,255,105,.18);

            border-radius: 30px;

            background:
              linear-gradient(
                145deg,
                rgba(5,24,11,.96),
                rgba(3,7,4,.98)
              );

            backdrop-filter:
              blur(40px)
              saturate(150%);

            -webkit-backdrop-filter:
              blur(40px)
              saturate(150%);

            box-shadow:
              0 40px 140px rgba(0,0,0,.8),
              0 0 70px rgba(0,255,80,.08),
              inset 0 1px rgba(255,255,255,.12);

            animation:
              mvbdSheetIn
              .55s
              cubic-bezier(.16,1,.3,1);
          }

          @keyframes mvbdSheetIn {
            from {
              opacity: 0;
              transform:
                translateY(25px)
                scale(.91);
              filter: blur(12px);
            }

            to {
              opacity: 1;
              transform:
                translateY(0)
                scale(1);
              filter: blur(0);
            }
          }

          .mvbd-close {
            float: right;

            width: 36px;
            height: 36px;

            border:
              1px solid
              rgba(55,255,110,.16);

            border-radius: 50%;

            background:
              rgba(0,255,80,.045);

            color:
              rgba(255,255,255,.85);

            font-size: 20px;

            cursor: pointer;

            transition:
              transform .3s,
              background .3s;
          }

          .mvbd-close:hover {
            transform:
              rotate(90deg)
              scale(1.06);

            background:
              rgba(0,255,80,.10);
          }

          .mvbd-sheet h2 {
            margin:
              3px 42px 7px 0;

            font-size: 23px;
            letter-spacing: -.8px;
          }

          .mvbd-muted {
            color:
              rgba(255,255,255,.45);

            font-size: 12px;
            line-height: 1.7;
          }

          .mvbd-selected {
            display: flex;
            align-items: center;
            justify-content: space-between;

            margin: 17px 0;
            padding: 14px;

            border:
              1px solid
              rgba(50,255,100,.12);

            border-radius: 18px;

            background:
              rgba(0,255,80,.035);
          }

          .mvbd-selected-price {
            color: #4cff7a;
            font-weight: 950;
          }

          .mvbd-payment-box {
            margin-top: 12px;

            padding: 16px;

            border:
              1px solid
              rgba(255,255,255,.07);

            border-radius: 19px;

            background:
              rgba(255,255,255,.035);
          }

          .mvbd-label {
            color:
              rgba(255,255,255,.4);

            font-size: 9px;
            font-weight: 800;
            letter-spacing: .8px;
            text-transform: uppercase;
          }

          .mvbd-number-row {
            display: flex;
            align-items: center;
            justify-content: space-between;

            gap: 8px;
            margin-top: 8px;
          }

          .mvbd-number {
            color: #49ff78;

            font-size: 19px;
            font-weight: 950;
          }

          .mvbd-copy {
            padding: 9px 11px;

            border:
              1px solid
              rgba(70,255,120,.18);

            border-radius: 11px;

            background:
              rgba(0,255,80,.055);

            color:
              rgba(255,255,255,.85);

            font-size: 10px;
            cursor: pointer;
          }

          .mvbd-input {
            display: block;
            width: 100%;

            margin-top: 12px;
            padding: 14px 15px;

            border:
              1px solid
              rgba(255,255,255,.09);

            border-radius: 16px;

            outline: none;

            background:
              rgba(0,0,0,.35);

            color: white;

            font-size: 14px;
          }

          .mvbd-input::placeholder {
            color:
              rgba(255,255,255,.27);
          }

          .mvbd-input:focus {
            border-color:
              rgba(53,255,111,.45);

            box-shadow:
              0 0 0 4px
              rgba(0,255,80,.05);
          }

          .mvbd-error {
            margin-top: 8px;
            color: #ff9e96;
            font-size: 10px;
          }

          .mvbd-send {
            position: relative;
            overflow: hidden;

            width: 100%;

            margin-top: 12px;
            padding: 14px;

            border: 0;
            border-radius: 16px;

            background:
              linear-gradient(
                135deg,
                #d8ffdf,
                #34ff72,
                #00bd45
              );

            color: #001b08;

            font-weight: 1000;

            cursor: pointer;

            box-shadow:
              0 15px 40px
              rgba(0,255,80,.15),
              inset 0 1px
              rgba(255,255,255,.7);
          }

          .mvbd-send:active {
            transform: scale(.97);
          }

          .mvbd-note {
            margin-top: 9px;

            color:
              rgba(255,255,255,.23);

            font-size: 9px;
            text-align: center;
          }

          /* =====================================================
             PROCESSING
          ===================================================== */

          .mvbd-processing {
            text-align: center;
            padding: 28px 10px;
          }

          .mvbd-orb {
            position: relative;

            width: 92px;
            height: 92px;

            margin:
              5px auto 22px;

            border-radius:
              45% 55% 62% 38% /
              55% 42% 58% 45%;

            background:
              conic-gradient(
                from 0deg,
                #20ff62,
                #0ab94c,
                #8affab,
                #20ff62
              );

            box-shadow:
              0 0 60px
              rgba(0,255,80,.2);

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
          }

          .mvbd-orb::after {
            content: "";

            position: absolute;
            inset: 8px;

            border-radius: inherit;

            background:
              radial-gradient(
                circle at 35% 25%,
                rgba(255,255,255,.08),
                #031008 62%
              );
          }

          @keyframes mvbdOrbSpin {
            to {
              transform: rotate(360deg);
            }
          }

          @keyframes mvbdOrbMorph {
            to {
              border-radius:
                62% 38% 44% 56% /
                38% 59% 41% 62%;
            }
          }

          .mvbd-progress {
            height: 5px;

            margin:
              22px 0 9px;

            overflow: hidden;

            border-radius: 999px;

            background:
              rgba(255,255,255,.07);
          }

          .mvbd-progress-bar {
            height: 100%;

            border-radius: inherit;

            background:
              linear-gradient(
                90deg,
                #0cff57,
                #5aff89,
                #baffca
              );

            box-shadow:
              0 0 15px
              rgba(0,255,80,.45);

            transition:
              width .12s linear;
          }

          .mvbd-percent {
            color:
              rgba(255,255,255,.3);

            font-size: 10px;
          }

          /* =====================================================
             SUCCESS
          ===================================================== */

          .mvbd-success-icon {
            width: 74px;
            height: 74px;

            display: grid;
            place-items: center;

            margin:
              7px auto 17px;

            border:
              1px solid
              rgba(70,255,120,.25);

            border-radius: 50%;

            background:
              rgba(0,255,80,.06);

            color: #65ff8c;

            font-size: 34px;

            box-shadow:
              0 0 50px
              rgba(0,255,80,.12);
          }

          .mvbd-done {
            width: 100%;

            margin-top: 18px;
            padding: 13px;

            border:
              1px solid
              rgba(65,255,115,.15);

            border-radius: 15px;

            background:
              rgba(0,255,80,.055);

            color: white;

            font-weight: 800;

            cursor: pointer;
          }

          /* =====================================================
             TABLET
          ===================================================== */

          @media (max-width: 900px) {
            .mvbd-plans {
              grid-template-columns:
                repeat(2, 1fr);
            }

            .mvbd-benefits {
              grid-template-columns:
                repeat(3, 1fr);
            }
          }

          /* =====================================================
             MOBILE
          ===================================================== */

          @media (max-width: 600px) {
            .mvbd-premium-page {
              padding:
                10px 10px 65px;
            }

            .mvbd-nav {
              border-radius: 19px;
            }

            .mvbd-nav-badge {
              display: none;
            }

            .mvbd-hero {
              padding:
                52px 5px 30px;
            }

            .mvbd-hero h1 {
              letter-spacing: -2.5px;
              font-size: 43px;
            }

            .mvbd-premium-title {
              letter-spacing: 5px;
            }

            .mvbd-plans {
              grid-template-columns: 1fr;
              gap: 14px;
            }

            .mvbd-card {
              min-height: auto;
              padding: 21px;
            }

            .mvbd-card-popular {
              order: -1;
            }

            .mvbd-benefits {
              grid-template-columns:
                repeat(2, 1fr);
            }

            .mvbd-benefit:last-child {
              grid-column: 1 / -1;
            }

            .mvbd-viewport-modal {
              padding: 12px !important;
            }

            .mvbd-sheet {
              width:
                calc(100vw - 24px) !important;

              max-width:
                calc(100vw - 24px) !important;

              max-height:
                86dvh !important;

              padding: 20px;
              border-radius: 27px;
            }
          }

          /* =====================================================
             SMALL PHONE
          ===================================================== */

          @media (max-width: 380px) {
            .mvbd-hero h1 {
              font-size: 38px;
            }

            .mvbd-card {
              padding: 18px;
            }

            .mvbd-sheet {
              width:
                calc(100vw - 18px) !important;

              max-width:
                calc(100vw - 18px) !important;

              padding: 18px;
            }
          }

          /* =====================================================
             REDUCED MOTION
          ===================================================== */

          @media (prefers-reduced-motion: reduce) {
            .mvbd-premium-page *,
            .mvbd-premium-page *::before,
            .mvbd-premium-page *::after,
            .mvbd-viewport-modal *,
            .mvbd-viewport-modal *::before,
            .mvbd-viewport-modal *::after {
              animation-duration: .01ms !important;
              animation-iteration-count: 1 !important;
              transition: none !important;
            }
          }

        `}</style>

        {/* =====================================================
            PARTICLES
        ===================================================== */}

        <div
          className="mvbd-stars"
          aria-hidden="true"
        >
          {Array.from({ length: 42 }).map(
            (_, index) => (
              <span
                key={index}
                className="mvbd-star"
                style={
                  {
                    left:
                      `${(index * 31.7) % 100}%`,

                    top:
                      `${(index * 67.3) % 700}px`,

                    ["--duration" as string]:
                      `${1.8 + (index % 5) * .65}s`,

                    animationDelay:
                      `${-(index % 6) * .55}s`,
                  } as React.CSSProperties
                }
              />
            )
          )}
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
              ✦ PREMIUM ACCESS
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
              Enjoy premium movies, series and anime
              with a smooth entertainment experience
              across your devices.
            </p>

            <div className="mvbd-trial">
              ✦ 7-day free trial for new members
            </div>

          </section>

          {/* =================================================
              PLANS
          ================================================= */}

          <section className="mvbd-plans">

            {plans.map((plan) => {

              const cardClass =
                plan.planId === "trial"
                  ? "mvbd-card-free"
                  : plan.planId === "monthly"
                    ? "mvbd-card-monthly"
                    : plan.planId === "two_months"
                      ? "mvbd-card-two"
                      : "mvbd-card-three"

              return (
                <article
                  key={plan.planId}
                  className={`mvbd-card ${cardClass}`}
                >

                  {plan.popular && (
                    <div className="mvbd-ribbon">
                      MOST POPULAR
                    </div>
                  )}

                  <div className="mvbd-plan-icon">
                    {plan.planId === "trial"
                      ? "♛"
                      : plan.planId === "monthly"
                        ? "▣"
                        : plan.planId === "two_months"
                          ? "◆"
                          : "▦"}
                  </div>

                  <div className="mvbd-plan-name">
                    {plan.planId === "trial"
                      ? "FREE PLAN"
                      : plan.name}
                  </div>

                  <div className="mvbd-price">
                    {plan.price}

                    {plan.planId !== "trial" && (
                      <small>
                        {" "}
                        / {plan.duration}
                      </small>
                    )}
                  </div>

                  <div className="mvbd-save">
                    {plan.planId === "trial"
                      ? "Enjoy basic access"
                      : plan.save || "\u00a0"}
                  </div>

                  <div className="mvbd-description">
                    {plan.description}
                  </div>

                  <ul className="mvbd-features">

                    {plan.planId === "trial" ? (
                      <>
                        <li>
                          MVBD PM Channel Access
                        </li>

                        <li>
                          MoviesVerseBD Channel Access
                        </li>

                        <li>
                          Anime Verse BD Channel Access
                        </li>

                        <li>
                          MVBD MeBook Access
                        </li>

                        <li>
                          Free MVBD Mini App Access
                        </li>

                        <li>
                          Movie & Series Trailer Access
                        </li>

                        <li>
                          Basic entertainment access
                        </li>
                      </>
                    ) : (
                      <>
                        <li>
                          All Free Plan Features
                        </li>

                        <li>
                          Full Movie Streaming
                        </li>

                        <li>
                          Series & Anime Streaming
                        </li>

                        <li>
                          Download Option
                        </li>

                        <li>
                          Ad-Free Experience
                        </li>

                        <li>
                          Premium Content Access
                        </li>

                        <li>
                          Regular Updates
                        </li>

                        <li>
                          Priority Support
                        </li>
                      </>
                    )}

                  </ul>

                  <button
                    type="button"
                    className="mvbd-choose"
                    onClick={() =>
                      openPlan(plan)
                    }
                  >
                    {plan.planId === "trial"
                      ? "Start Exploring →"
                      : plan.planId === "monthly"
                        ? "Get 1 Month Access →"
                        : plan.planId === "two_months"
                          ? "Get 2 Months Access →"
                          : "Get 3 Months Access →"}
                  </button>

                </article>
              )
            })}

          </section>

          {/* =================================================
              WHY CHOOSE MVBD
          ================================================= */}

          <section className="mvbd-why">

            <div className="mvbd-why-title">
              WHY CHOOSE <span>MVBD?</span>
            </div>

            <div className="mvbd-benefits">

              <div className="mvbd-benefit">
                <div className="mvbd-benefit-icon">
                  ⚡
                </div>

                <strong>
                  Fast & Smooth
                </strong>

                <span>
                  Streaming experience
                </span>
              </div>

              <div className="mvbd-benefit">
                <div className="mvbd-benefit-icon">
                  🛡
                </div>

                <strong>
                  Safe & Secure
                </strong>

                <span>
                  Secure platform
                </span>
              </div>

              <div className="mvbd-benefit">
                <div className="mvbd-benefit-icon">
                  ▣
                </div>

                <strong>
                  All Devices
                </strong>

                <span>
                  Works across devices
                </span>
              </div>

              <div className="mvbd-benefit">
                <div className="mvbd-benefit-icon">
                  ★
                </div>

                <strong>
                  Premium Quality
                </strong>

                <span>
                  Quality entertainment
                </span>
              </div>

              <div className="mvbd-benefit">
                <div className="mvbd-benefit-icon">
                  ♥
                </div>

                <strong>
                  Movie Lovers
                </strong>

                <span>
                  Your entertainment partner
                </span>
              </div>

            </div>

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

          {/* =================================================
              FOOTER
          ================================================= */}

          <footer className="mvbd-footer">

            <div className="mvbd-footer-logo">
              M ◉ MovieVerseBD
            </div>

            <div className="mvbd-footer-line">
              SUBSCRIBE NOW & ENJOY PREMIUM ENTERTAINMENT
            </div>

            <div style={{ marginTop: "10px" }}>
              Movies • Series • Anime
            </div>

          </footer>

        </div>
      </main>

      {/* =====================================================
          PAYMENT MODAL
      ===================================================== */}

      {showPayment && selectedPlan && (
        <ViewportModal
          onBackdropClick={closePayment}
        >

          <div
            className="mvbd-sheet"
            onClick={(event) =>
              event.stopPropagation()
            }
          >

            <button
              type="button"
              className="mvbd-close"
              onClick={closePayment}
              aria-label="Close"
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
              onChange={(event) => {
                setTransactionId(
                  event.target.value
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
            >
              Send for Review →
            </button>

            <div className="mvbd-note">
              Please make sure your transaction ID
              is correct before submitting.
            </div>

          </div>

        </ViewportModal>
      )}

      {/* =====================================================
          PROCESSING
      ===================================================== */}

      {showProcessing && (
        <ViewportModal>

          <div className="mvbd-sheet mvbd-processing">

            <div className="mvbd-orb" />

            <h2>
              Processing payment…
            </h2>

            <p className="mvbd-muted">
              Please wait while your payment
              submission is being prepared for
              admin review.
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
          SUCCESS
      ===================================================== */}

      {showSuccess && (
        <ViewportModal
          onBackdropClick={closeSuccess}
        >

          <div
            className="mvbd-sheet mvbd-processing"
            onClick={(event) =>
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
              sent to the admin team.

              <br />
              <br />

              They are currently{" "}
              <strong>
                under review
              </strong>{" "}
              and will be approved as soon as
              possible if everything is correct.

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
