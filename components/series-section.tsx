"use client"

import {
  useCallback,
  useEffect,
  useState,
  type ReactNode,
} from "react"

import { createPortal } from "react-dom"

import { useAuth } from "@/components/auth-provider"

import {
  createPendingPaymentRequest,
} from "@/lib/payment-requests"

import {
  PAYMENT_NUMBER,
  SUBSCRIPTION_PLANS,
  type SubscriptionPlan,
  type PlanAccessItem,
} from "@/lib/subscription-plans"

type Plan = SubscriptionPlan

const plans = SUBSCRIPTION_PLANS

const MOBILE_BACKGROUND =
  "https://i.postimg.cc/43PLHM4Z/file-0000000041908206b4fe692b01e0940b.png"

const DESKTOP_BACKGROUND =
  "https://i.postimg.cc/43s2dZg3/file-00000000e1908211bbeb998f8584d5ba.png"

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

    const previousOverflow =
      document.body.style.overflow

    const previousTouchAction =
      document.body.style.touchAction

    document.body.style.overflow = "hidden"
    document.body.style.touchAction = "none"

    return () => {
      document.body.style.overflow =
        previousOverflow

      document.body.style.touchAction =
        previousTouchAction
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
    document.body,
  )
}

/* =========================================================
   MAIN
========================================================= */

export default function SeriesSection({
  onOpenMeBook,
}: {
  onOpenMeBook?: () => void
}) {
  const { user, profile } = useAuth()

  const [selectedPlan, setSelectedPlan] =
    useState<Plan | null>(null)

  const [transactionId, setTransactionId] =
    useState("")

  const [showPayment, setShowPayment] =
    useState(false)

  const [showFreeAccess, setShowFreeAccess] =
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

  /* =======================================================
     OPEN FREE PLAN
  ======================================================= */

  const openFreePlan = useCallback(() => {
    setSelectedPlan(null)
    setError("")
    setShowFreeAccess(true)
  }, [])

  /* =======================================================
     OPEN PAID PLAN
  ======================================================= */

  const openPlan = useCallback(
    (plan: Plan) => {
      if (plan.planId === "trial") {
        openFreePlan()
        return
      }

      setSelectedPlan(plan)
      setTransactionId("")
      setError("")
      setCopied(false)
      setShowPayment(true)
    },
    [openFreePlan],
  )

  /* =======================================================
     CLOSE MODALS
  ======================================================= */

  const closePayment = useCallback(() => {
    setShowPayment(false)
    setError("")
  }, [])

  const closeFreeAccess = useCallback(() => {
    setShowFreeAccess(false)
  }, [])

  const closeSuccess = useCallback(() => {
    setShowSuccess(false)
    setSelectedPlan(null)
    setTransactionId("")
    setProgress(0)
    setError("")
  }, [])

  /* =======================================================
     COPY NUMBER
  ======================================================= */

  const copyNumber = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(
        PAYMENT_NUMBER,
      )

      setCopied(true)

      window.setTimeout(() => {
        setCopied(false)
      }, 1600)
    } catch {
      setCopied(false)
    }
  }, [])

  /* =======================================================
     FREE ACCESS ACTION
  ======================================================= */

  const handleFreeAccess = useCallback(
    (item: PlanAccessItem) => {
      if (!item.available || item.locked) return

      switch (item.action) {
        case "mvbd-pm":
          window.open(
            "https://t.me/mvbdpm2",
            "_blank",
            "noopener,noreferrer",
          )
          break

        case "anime-verse":
          window.open(
            "https://t.me/avbdpm",
            "_blank",
            "noopener,noreferrer",
          )
          break

        case "mebook":
          setShowFreeAccess(false)
          onOpenMeBook?.()
          break

        case "mini-app":
          /*
           * Mini App URL can be connected here when you want
           * to make the destination explicit.
           *
           * For now the button gives a local access message.
           */
          window.dispatchEvent(
            new CustomEvent(
              "mvbd:mini-app-access",
            ),
          )
          break

        case "trailers":
          setShowFreeAccess(false)

          window.dispatchEvent(
            new CustomEvent(
              "mvbd:open-trailers",
            ),
          )
          break

        default:
          break
      }
    },
    [onOpenMeBook],
  )

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

    /*
     * Lower-frequency updates reduce unnecessary React
     * renders and make the page much smoother.
     */
    const startTime = Date.now()
    const processingDuration = 9000

    const timer = window.setInterval(() => {
      const elapsed =
        Date.now() - startTime

      const percentage = Math.min(
        100,
        Math.round(
          (elapsed / processingDuration) * 100,
        ),
      )

      setProgress(percentage)

      if (percentage >= 100) {
        window.clearInterval(timer)

        window.setTimeout(() => {
          setShowProcessing(false)
          setShowSuccess(true)
        }, 450)
      }
    }, 180)
  }

  /* =======================================================
     CLEANUP
  ======================================================= */

  useEffect(() => {
    return () => {
      document.body.style.overflow = ""
      document.body.style.touchAction = ""
    }
  }, [])

  return (
    <>
      <main className="mvbd-premium-page">

        <style jsx global>{`

          /* =================================================
             RESET
          ================================================= */

          .mvbd-premium-page,
          .mvbd-premium-page *,
          .mvbd-viewport-modal,
          .mvbd-viewport-modal * {
            box-sizing: border-box;
          }

          /* =================================================
             PAGE
          ================================================= */

          .mvbd-premium-page {
            position: relative;

            min-height: 100dvh;

            overflow: hidden;

            isolation: isolate;

            padding:
              18px 16px 70px;

            color: white;

            background:
              #020403;

            contain:
              paint;
          }

          /*
           * Responsive poster background.
           *
           * Mobile:
           * 43PLHM4Z
           *
           * Desktop/tablet:
           * 43s2dZg3
           */

          .mvbd-premium-page::after {
            content: "";

            position: absolute;

            inset: 0;

            z-index: -4;

            pointer-events: none;

            background-image:
              linear-gradient(
                180deg,
                rgba(0, 8, 4, 0.20),
                rgba(0, 5, 3, 0.72)
              ),
              url("${MOBILE_BACKGROUND}");

            background-position:
              center top;

            background-repeat:
              no-repeat;

            background-size:
              cover;

            opacity: 0.82;

            transform:
              translateZ(0);

            will-change:
              transform;
          }

          /* =================================================
             DESKTOP BACKGROUND
          ================================================= */

          @media (min-width: 761px) {
            .mvbd-premium-page::after {
              background-image:
                linear-gradient(
                  180deg,
                  rgba(0, 8, 4, 0.18),
                  rgba(0, 5, 3, 0.68)
                ),
                url("${DESKTOP_BACKGROUND}");
            }
          }

          /* =================================================
             DARK GLASS OVERLAY
          ================================================= */

          .mvbd-premium-page::before {
            content: "";

            position: absolute;

            inset: 0;

            z-index: -3;

            pointer-events: none;

            background:
              radial-gradient(
                circle at 50% 15%,
                rgba(67, 255, 122, 0.14),
                transparent 34%
              ),
              radial-gradient(
                circle at 5% 65%,
                rgba(0, 255, 112, 0.08),
                transparent 27%
              ),
              radial-gradient(
                circle at 95% 75%,
                rgba(0, 225, 92, 0.08),
                transparent 28%
              );

            opacity: 0.9;
          }

          /* =================================================
             LIQUID LIGHT
          ================================================= */

          .mvbd-liquid-light {
            position: absolute;

            width: 360px;
            height: 360px;

            border-radius: 50%;

            pointer-events: none;

            z-index: -2;

            background:
              radial-gradient(
                circle,
                rgba(42, 255, 105, 0.10),
                transparent 67%
              );

            filter: blur(30px);

            animation:
              mvbdLightFloat
              12s
              ease-in-out
              infinite
              alternate;

            transform:
              translateZ(0);
          }

          @keyframes mvbdLightFloat {
            from {
              transform:
                translate3d(-100px, 30px, 0)
                scale(0.9);
            }

            to {
              transform:
                translate3d(
                  calc(100vw - 280px),
                  180px,
                  0
                )
                scale(1.12);
            }
          }

          /* =================================================
             STARS / PARTICLES
          ================================================= */

          .mvbd-stars {
            position: absolute;

            inset: 0;

            height: 650px;

            overflow: hidden;

            pointer-events: none;

            z-index: -1;

            opacity: 0.65;
          }

          .mvbd-star {
            position: absolute;

            width: 3px;
            height: 3px;

            border-radius: 50%;

            background:
              rgba(164, 255, 186, 0.85);

            box-shadow:
              0 0 9px
              rgba(78, 255, 124, 0.7);

            animation:
              mvbdStarPulse
              var(--duration)
              ease-in-out
              infinite
              alternate;
          }

          @keyframes mvbdStarPulse {
            from {
              opacity: 0.12;
              transform: scale(0.55);
            }

            to {
              opacity: 0.75;
              transform: scale(1.25);
            }
          }

          /* =================================================
             CONTAINER
          ================================================= */

          .mvbd-container {
            position: relative;

            z-index: 2;

            width:
              min(1180px, 100%);

            margin:
              0 auto;
          }

          /* =================================================
             NAV
          ================================================= */

          .mvbd-nav {
            display: flex;

            align-items: center;
            justify-content: space-between;

            padding: 11px 14px;

            border:
              1px solid
              rgba(157, 255, 187, 0.22);

            border-radius: 24px;

            background:
              rgba(2, 24, 13, 0.47);

            backdrop-filter:
              blur(14px)
              saturate(125%);

            -webkit-backdrop-filter:
              blur(14px)
              saturate(125%);

            box-shadow:
              0 15px 55px
              rgba(0, 0, 0, 0.45),
              inset 0 1px
              rgba(255, 255, 255, 0.12);

            transform:
              translateZ(0);
          }

          .mvbd-brand {
            display: flex;

            align-items: center;

            gap: 10px;

            font-size: 14px;

            font-weight: 900;
          }

          .mvbd-logo {
            width: 39px;
            height: 39px;

            display: grid;

            place-items: center;

            border-radius: 14px;

            background:
              linear-gradient(
                145deg,
                #35ff67,
                #08a83d
              );

            color: #001f0b;

            font-size: 21px;

            font-weight: 1000;

            box-shadow:
              0 0 25px
              rgba(35, 255, 100, 0.32),
              inset 0 1px
              rgba(255, 255, 255, 0.55);
          }

          .mvbd-nav-badge {
            padding: 8px 12px;

            border-radius: 999px;

            border:
              1px solid
              rgba(123, 255, 157, 0.17);

            background:
              rgba(77, 255, 117, 0.055);

            color:
              rgba(198, 255, 210, 0.75);

            font-size: 10px;

            font-weight: 800;
          }

          /* =================================================
             HERO
          ================================================= */

          .mvbd-hero {
            position: relative;

            padding:
              68px 8px 42px;

            text-align: center;
          }

          .mvbd-hero-glow {
            position: absolute;

            width: 420px;
            height: 230px;

            left: 50%;
            top: 55px;

            transform:
              translateX(-50%);

            border-radius: 50%;

            background:
              radial-gradient(
                circle,
                rgba(45, 255, 103, 0.17),
                transparent 68%
              );

            filter: blur(25px);

            pointer-events: none;

            animation:
              mvbdHeroGlow
              6s
              ease-in-out
              infinite
              alternate;
          }

          @keyframes mvbdHeroGlow {
            from {
              opacity: 0.55;
              transform:
                translateX(-50%)
                scale(0.93);
            }

            to {
              opacity: 0.95;
              transform:
                translateX(-50%)
                scale(1.1);
            }
          }

          .mvbd-eyebrow {
            position: relative;

            display: inline-flex;

            align-items: center;

            gap: 7px;

            padding: 8px 13px;

            border-radius: 999px;

            border:
              1px solid
              rgba(119, 255, 153, 0.19);

            background:
              rgba(19, 75, 35, 0.28);

            backdrop-filter:
              blur(12px);

            color:
              rgba(208, 255, 218, 0.84);

            font-size: 11px;

            font-weight: 800;
          }

          .mvbd-live-dot {
            width: 7px;
            height: 7px;

            border-radius: 50%;

            background:
              #45ff73;

            box-shadow:
              0 0 8px
              #35ff68,
              0 0 20px
              rgba(53, 255, 104, 0.5);

            animation:
              mvbdLivePulse
              1.7s
              ease-in-out
              infinite;
          }

          @keyframes mvbdLivePulse {
            50% {
              transform: scale(1.5);
              opacity: 0.45;
            }
          }

          .mvbd-hero h1 {
            position: relative;

            margin:
              22px 0 13px;

            font-size:
              clamp(42px, 7vw, 76px);

            line-height: 0.95;

            letter-spacing: -3.8px;

            font-weight: 950;

            background:
              linear-gradient(
                100deg,
                #ffffff 5%,
                #d8ffe2 48%,
                #43ff70 95%
              );

            -webkit-background-clip: text;

            background-clip: text;

            color: transparent;

            text-shadow:
              0 0 35px
              rgba(47, 255, 99, 0.10);
          }

          .mvbd-premium-title {
            margin-bottom: 14px;

            color:
              rgba(190, 255, 204, 0.75);

            font-size:
              clamp(12px, 2vw, 18px);

            font-weight: 900;

            letter-spacing: 6px;
          }

          .mvbd-subtitle {
            max-width: 630px;

            margin: auto;

            color:
              rgba(255, 255, 255, 0.65);

            font-size: 13px;

            line-height: 1.75;
          }

          .mvbd-trial {
            display: inline-flex;

            margin-top: 18px;

            padding: 9px 14px;

            border-radius: 999px;

            border:
              1px solid
              rgba(69, 255, 110, 0.22);

            background:
              rgba(34, 255, 90, 0.055);

            color:
              rgba(205, 255, 216, 0.78);

            font-size: 11px;

            font-weight: 800;
          }

          /* =================================================
             PLANS
          ================================================= */

          .mvbd-plans {
            display: grid;

            grid-template-columns:
              repeat(4, minmax(0, 1fr));

            gap: 14px;

            align-items: stretch;
          }

          /* =================================================
             LIQUID PLAN CARD
          ================================================= */

          .mvbd-card {
            position: relative;

            overflow: hidden;

            padding: 22px;

            border-radius:
              32px 26px 34px 25px;

            border:
              1px solid
              rgba(133, 255, 166, 0.22);

            background:
              linear-gradient(
                145deg,
                rgba(3, 38, 17, 0.70),
                rgba(1, 15, 8, 0.56)
              );

            backdrop-filter:
              blur(14px)
              saturate(130%);

            -webkit-backdrop-filter:
              blur(14px)
              saturate(130%);

            box-shadow:
              0 25px 70px
              rgba(0, 0, 0, 0.45),
              inset 0 1px
              rgba(255, 255, 255, 0.12);

            transform:
              translateZ(0);

            transition:
              transform 0.32s ease,
              box-shadow 0.32s ease,
              border-color 0.32s ease;
          }

          /*
           * Animated liquid edge.
           */

          .mvbd-card::before {
            content: "";

            position: absolute;

            inset: -2px;

            z-index: -1;

            border-radius:
              35% 65% 50% 50% /
              55% 35% 65% 45%;

            background:
              conic-gradient(
                from 0deg,
                rgba(50, 255, 105, 0.85),
                rgba(0, 184, 255, 0.50),
                rgba(162, 55, 255, 0.48),
                rgba(255, 211, 52, 0.52),
                rgba(50, 255, 105, 0.85)
              );

            opacity: 0.24;

            filter: blur(7px);

            animation:
              mvbdLiquidBorder
              8s
              ease-in-out
              infinite;
          }

          @keyframes mvbdLiquidBorder {
            0% {
              transform:
                rotate(0deg)
                scale(1);
              border-radius:
                35% 65% 50% 50% /
                55% 35% 65% 45%;
            }

            50% {
              transform:
                rotate(4deg)
                scale(1.035);
              border-radius:
                55% 45% 38% 62% /
                40% 60% 40% 60%;
            }

            100% {
              transform:
                rotate(-3deg)
                scale(1);
              border-radius:
                35% 65% 50% 50% /
                55% 35% 65% 45%;
            }
          }

          .mvbd-card::after {
            content: "";

            position: absolute;

            width: 190px;
            height: 190px;

            right: -105px;
            top: -105px;

            border-radius: 50%;

            background:
              radial-gradient(
                circle,
                rgba(85, 255, 123, 0.19),
                transparent 68%
              );

            pointer-events: none;

            animation:
              mvbdCardGlow
              7s
              ease-in-out
              infinite
              alternate;
          }

          @keyframes mvbdCardGlow {
            from {
              transform:
                translate(0, 0)
                scale(0.85);
            }

            to {
              transform:
                translate(-35px, 45px)
                scale(1.15);
            }
          }

          .mvbd-card:hover {
            transform:
              translateY(-6px);

            border-color:
              rgba(111, 255, 143, 0.40);

            box-shadow:
              0 35px 85px
              rgba(0, 0, 0, 0.58),
              0 0 35px
              rgba(51, 255, 103, 0.08),
              inset 0 1px
              rgba(255, 255, 255, 0.16);
          }

          /* =================================================
             CARD COLORS
          ================================================= */

          .mvbd-card-free {
            border-color:
              rgba(54, 255, 105, 0.35);
          }

          .mvbd-card-month {
            border-color:
              rgba(38, 214, 255, 0.30);
          }

          .mvbd-card-two {
            border-color:
              rgba(190, 91, 255, 0.34);
          }

          .mvbd-card-three {
            border-color:
              rgba(255, 218, 59, 0.34);
          }

          /* =================================================
             POPULAR
          ================================================= */

          .mvbd-ribbon {
            position: absolute;

            right: 15px;
            top: 15px;

            padding: 7px 10px;

            border-radius: 999px;

            background:
              linear-gradient(
                135deg,
                #bc7cff,
                #ff63db
              );

            color:
              #210c31;

            font-size: 8px;

            font-weight: 950;

            box-shadow:
              0 0 25px
              rgba(193, 90, 255, 0.25);
          }

          /* =================================================
             FREE BADGE
          ================================================= */

          .mvbd-free-badge {
            display: inline-flex;

            margin-bottom: 10px;

            padding: 6px 9px;

            border-radius: 999px;

            background:
              rgba(53, 255, 104, 0.10);

            border:
              1px solid
              rgba(53, 255, 104, 0.24);

            color:
              #9cffb2;

            font-size: 9px;

            font-weight: 900;
          }

          .mvbd-plan-name {
            color:
              rgba(221, 255, 228, 0.82);

            font-size: 11px;

            font-weight: 900;

            letter-spacing: 0.8px;
          }

          .mvbd-price {
            margin:
              13px 0 3px;

            font-size: 42px;

            font-weight: 950;

            letter-spacing: -2px;

            line-height: 1;
          }

          .mvbd-price small {
            color:
              rgba(255, 255, 255, 0.42);

            font-size: 11px;

            font-weight: 700;

            letter-spacing: 0;
          }

          .mvbd-save {
            min-height: 17px;

            color:
              rgba(140, 255, 164, 0.80);

            font-size: 10px;

            font-weight: 800;
          }

          .mvbd-description {
            margin-top: 12px;

            min-height: 56px;

            color:
              rgba(255, 255, 255, 0.52);

            font-size: 11px;

            line-height: 1.6;
          }

          /* =================================================
             FEATURES
          ================================================= */

          .mvbd-features {
            list-style: none;

            margin:
              12px 0 18px;

            padding: 0;

            color:
              rgba(255, 255, 255, 0.58);

            font-size: 11px;

            line-height: 1.85;
          }

          .mvbd-features li::before {
            content: "✓";

            margin-right: 7px;

            color:
              #45ff72;

            font-weight: 950;
          }

          /* =================================================
             LIQUID BUTTON
          ================================================= */

          .mvbd-choose {
            position: relative;

            overflow: hidden;

            width: 100%;

            min-height: 48px;

            border: 1px solid
              rgba(255, 255, 255, 0.18);

            border-radius:
              17px 21px 16px 20px;

            padding: 12px 14px;

            cursor: pointer;

            background:
              linear-gradient(
                135deg,
                rgba(57, 255, 108, 0.90),
                rgba(10, 177, 70, 0.92)
              );

            color:
              #001d08;

            box-shadow:
              0 12px 32px
              rgba(38, 255, 95, 0.14),
              inset 0 1px
              rgba(255, 255, 255, 0.62);

            font-size: 12px;

            font-weight: 950;

            transform:
              translateZ(0);

            transition:
              transform 0.22s ease,
              filter 0.22s ease;
          }

          .mvbd-choose::after {
            content: "";

            position: absolute;

            top: -80%;
            left: -60%;

            width: 35%;
            height: 260%;

            transform:
              rotate(25deg)
              translateZ(0);

            background:
              rgba(255, 255, 255, 0.42);

            filter: blur(7px);

            animation:
              mvbdButtonShine
              4.5s
              ease-in-out
              infinite;
          }

          @keyframes mvbdButtonShine {
            0%,
            58% {
              left: -70%;
            }

            100% {
              left: 145%;
            }
          }

          .mvbd-choose:hover {
            filter: brightness(1.07);

            transform:
              translateY(-2px);
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

            padding: 17px;

            border:
              1px solid
              rgba(112, 255, 146, 0.15);

            border-radius: 23px;

            background:
              rgba(2, 30, 13, 0.46);

            backdrop-filter:
              blur(12px);

            text-align: center;

            color:
              rgba(255, 255, 255, 0.50);

            font-size: 11px;

            line-height: 1.7;
          }

          .mvbd-info strong {
            color:
              #9cffb2;
          }

          .mvbd-footer {
            padding:
              25px 0 0;

            text-align: center;

            color:
              rgba(220, 255, 227, 0.35);

            font-size: 10px;
          }

          /* =================================================
             MODAL BACKDROP
          ================================================= */

          .mvbd-viewport-modal {
            position: fixed !important;

            inset: 0 !important;

            width: 100vw !important;
            height: 100dvh !important;

            display: flex !important;

            align-items: center !important;

            justify-content: center !important;

            padding:
              max(14px, env(safe-area-inset-top))
              max(14px, env(safe-area-inset-right))
              max(14px, env(safe-area-inset-bottom))
              max(14px, env(safe-area-inset-left)) !important;

            overflow: hidden !important;

            z-index: 2147483647 !important;

            background:
              rgba(0, 7, 3, 0.78);

            backdrop-filter:
              blur(13px);

            -webkit-backdrop-filter:
              blur(13px);

            animation:
              mvbdOverlayIn
              0.20s
              ease-out
              both;

            will-change:
              opacity;
          }

          @keyframes mvbdOverlayIn {
            from {
              opacity: 0;
            }

            to {
              opacity: 1;
            }
          }

          /* =================================================
             SHEET
          ================================================= */

          .mvbd-sheet {
            position: relative !important;

            width:
              min(480px, calc(100vw - 28px)) !important;

            max-width:
              calc(100vw - 28px) !important;

            max-height:
              min(88dvh, 720px) !important;

            margin: 0 !important;

            padding: 23px;

            overflow-x: hidden;

            overflow-y: auto;

            border:
              1px solid
              rgba(110, 255, 144, 0.25);

            border-radius:
              31px 25px 34px 27px;

            background:
              linear-gradient(
                145deg,
                rgba(7, 42, 19, 0.94),
                rgba(2, 14, 7, 0.97)
              );

            box-shadow:
              0 35px 110px
              rgba(0, 0, 0, 0.78),
              0 0 55px
              rgba(35, 255, 95, 0.08),
              inset 0 1px
              rgba(255, 255, 255, 0.12);

            animation:
              mvbdSheetIn
              0.30s
              cubic-bezier(
                0.16,
                1,
                0.3,
                1
              )
              both;

            transform:
              translateZ(0);

            will-change:
              transform,
              opacity;
          }

          @keyframes mvbdSheetIn {
            from {
              opacity: 0;

              transform:
                translate3d(0, 18px, 0)
                scale(0.965);
            }

            to {
              opacity: 1;

              transform:
                translate3d(0, 0, 0)
                scale(1);
            }
          }

          /* =================================================
             MODAL LIQUID GLOW
          ================================================= */

          .mvbd-sheet::before {
            content: "";

            position: absolute;

            width: 220px;
            height: 220px;

            right: -115px;
            top: -115px;

            border-radius: 50%;

            background:
              radial-gradient(
                circle,
                rgba(54, 255, 104, 0.18),
                transparent 68%
              );

            pointer-events: none;
          }

          .mvbd-sheet::after {
            content: "";

            position: absolute;

            width: 180px;
            height: 180px;

            left: -105px;
            bottom: -105px;

            border-radius: 50%;

            background:
              radial-gradient(
                circle,
                rgba(0, 180, 255, 0.10),
                transparent 68%
              );

            pointer-events: none;
          }

          /* =================================================
             CLOSE
          ================================================= */

          .mvbd-close {
            position: relative;

            z-index: 3;

            float: right;

            width: 36px;
            height: 36px;

            border:
              1px solid
              rgba(255, 255, 255, 0.10);

            border-radius: 50%;

            background:
              rgba(255, 255, 255, 0.055);

            color:
              rgba(255, 255, 255, 0.82);

            font-size: 20px;

            cursor: pointer;

            transition:
              transform 0.2s ease,
              background 0.2s ease;
          }

          .mvbd-close:hover {
            transform:
              rotate(90deg);

            background:
              rgba(255, 255, 255, 0.11);
          }

          .mvbd-sheet h2 {
            position: relative;

            z-index: 2;

            margin:
              3px 42px 7px 0;

            font-size: 23px;

            letter-spacing: -0.8px;
          }

          .mvbd-muted {
            position: relative;

            z-index: 2;

            color:
              rgba(255, 255, 255, 0.52);

            font-size: 12px;

            line-height: 1.7;
          }

          /* =================================================
             FREE ACCESS
          ================================================= */

          .mvbd-access-list {
            position: relative;

            z-index: 2;

            display: grid;

            gap: 9px;

            margin-top: 17px;
          }

          .mvbd-access-item {
            display: flex;

            align-items: center;

            justify-content: space-between;

            gap: 10px;

            padding: 11px;

            border:
              1px solid
              rgba(119, 255, 150, 0.13);

            border-radius: 17px;

            background:
              rgba(255, 255, 255, 0.035);

            box-shadow:
              inset 0 1px
              rgba(255, 255, 255, 0.055);
          }

          .mvbd-access-left {
            min-width: 0;
          }

          .mvbd-access-title {
            color:
              rgba(255, 255, 255, 0.86);

            font-size: 11px;

            font-weight: 850;
          }

          .mvbd-access-description {
            margin-top: 2px;

            color:
              rgba(255, 255, 255, 0.38);

            font-size: 9px;

            line-height: 1.45;
          }

          .mvbd-access-button {
            flex:
              0 0 auto;

            min-height: 34px;

            border:
              1px solid
              rgba(74, 255, 113, 0.23);

            border-radius: 11px;

            padding:
              7px 9px;

            background:
              rgba(50, 255, 100, 0.075);

            color:
              #a5ffb8;

            font-size: 9px;

            font-weight: 900;

            cursor: pointer;

            transition:
              transform 0.18s ease,
              background 0.18s ease;
          }

          .mvbd-access-button:hover {
            transform:
              translateY(-1px);

            background:
              rgba(50, 255, 100, 0.13);
          }

          .mvbd-access-button:active {
            transform:
              scale(0.96);
          }

          .mvbd-access-button.locked {
            border-color:
              rgba(255, 104, 104, 0.18);

            background:
              rgba(255, 70, 70, 0.055);

            color:
              #ffaaa3;

            cursor:
              not-allowed;
          }

          /* =================================================
             LOCKED
          ================================================= */

          .mvbd-locked-box {
            position: relative;

            z-index: 2;

            margin-top: 15px;

            padding: 14px;

            border:
              1px solid
              rgba(255, 105, 105, 0.15);

            border-radius: 19px;

            background:
              rgba(255, 55, 55, 0.035);
          }

          .mvbd-locked-title {
            margin-bottom: 8px;

            color:
              #ffaaa3;

            font-size: 10px;

            font-weight: 900;

            text-transform: uppercase;

            letter-spacing: 0.6px;
          }

          .mvbd-locked-list {
            display: grid;

            gap: 4px;

            margin: 0;

            padding: 0;

            list-style: none;

            color:
              rgba(255, 255, 255, 0.43);

            font-size: 10px;

            line-height: 1.5;
          }

          .mvbd-locked-list li::before {
            content: "×";

            margin-right: 7px;

            color:
              #ff7770;

            font-weight: 900;
          }

          /* =================================================
             UPGRADE
          ================================================= */

          .mvbd-upgrade {
            position: relative;

            z-index: 2;

            width: 100%;

            margin-top: 15px;

            padding: 13px;

            border: 0;

            border-radius: 16px;

            background:
              linear-gradient(
                135deg,
                #49ff76,
                #08ad47
              );

            color:
              #001b08;

            font-size: 11px;

            font-weight: 950;

            cursor: pointer;

            box-shadow:
              0 13px 30px
              rgba(49, 255, 104, 0.13),
              inset 0 1px
              rgba(255, 255, 255, 0.58);

            transition:
              transform 0.2s ease,
              filter 0.2s ease;
          }

          .mvbd-upgrade:hover {
            transform:
              translateY(-2px);

            filter:
              brightness(1.05);
          }

          /* =================================================
             PAYMENT
          ================================================= */

          .mvbd-selected {
            position: relative;

            z-index: 2;

            display: flex;

            align-items: center;

            justify-content: space-between;

            gap: 15px;

            margin: 17px 0;

            padding: 14px;

            border:
              1px solid
              rgba(255, 255, 255, 0.09);

            border-radius: 18px;

            background:
              rgba(255, 255, 255, 0.045);
          }

          .mvbd-selected-price {
            color:
              #8dffad;

            font-weight: 950;
          }

          .mvbd-payment-box {
            position: relative;

            z-index: 2;

            padding: 15px;

            border:
              1px solid
              rgba(74, 255, 111, 0.15);

            border-radius: 19px;

            background:
              rgba(50, 255, 100, 0.045);
          }

          .mvbd-label {
            color:
              rgba(255, 255, 255, 0.42);

            font-size: 9px;

            font-weight: 850;

            letter-spacing: 0.8px;

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
            font-size: 18px;

            font-weight: 950;
          }

          .mvbd-copy {
            flex-shrink: 0;

            border:
              1px solid
              rgba(255, 255, 255, 0.09);

            border-radius: 11px;

            padding: 8px 10px;

            background:
              rgba(255, 255, 255, 0.055);

            color:
              rgba(255, 255, 255, 0.82);

            font-size: 9px;

            cursor: pointer;
          }

          /* =================================================
             INPUT
          ================================================= */

          .mvbd-input {
            position: relative;

            z-index: 2;

            display: block;

            width: 100%;

            margin-top: 11px;

            padding: 13px 14px;

            border:
              1px solid
              rgba(255, 255, 255, 0.10);

            border-radius: 15px;

            outline: none;

            background:
              rgba(0, 0, 0, 0.25);

            color: white;

            font-size: 13px;
          }

          .mvbd-input::placeholder {
            color:
              rgba(255, 255, 255, 0.27);
          }

          .mvbd-input:focus {
            border-color:
              rgba(80, 255, 121, 0.35);

            box-shadow:
              0 0 0 3px
              rgba(50, 255, 100, 0.055);
          }

          .mvbd-error {
            position: relative;

            z-index: 2;

            margin-top: 7px;

            color:
              #ffaaa3;

            font-size: 10px;
          }

          .mvbd-send {
            position: relative;

            z-index: 2;

            width: 100%;

            margin-top: 11px;

            padding: 13px;

            border: 0;

            border-radius: 16px;

            background:
              linear-gradient(
                135deg,
                #48ff75,
                #09ad48
              );

            color:
              #001d08;

            font-weight: 950;

            cursor: pointer;
          }

          .mvbd-note {
            position: relative;

            z-index: 2;

            margin-top: 9px;

            color:
              rgba(255, 255, 255, 0.25);

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
              25px 9px 9px;
          }

          .mvbd-orb {
            position: relative;

            width: 88px;
            height: 88px;

            margin:
              5px auto 21px;

            border-radius:
              46% 54% 61% 39% /
              55% 42% 58% 45%;

            background:
              conic-gradient(
                from 0deg,
                #37ff6d,
                #24c8ff,
                #a75dff,
                #37ff6d
              );

            animation:
              mvbdOrbSpin
              3.8s
              linear
              infinite,
              mvbdOrbMorph
              4.8s
              ease-in-out
              infinite
              alternate;

            box-shadow:
              0 0 45px
              rgba(62, 255, 110, 0.15);
          }

          .mvbd-orb::after {
            content: "";

            position: absolute;

            inset: 8px;

            border-radius: inherit;

            background:
              radial-gradient(
                circle at 35% 25%,
                rgba(255, 255, 255, 0.08),
                #050907 62%
              );
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
                46% 54% 61% 39% /
                55% 42% 58% 45%;
            }

            to {
              border-radius:
                62% 38% 44% 56% /
                39% 59% 41% 61%;
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

            border-radius: 999px;

            background:
              rgba(255, 255, 255, 0.07);
          }

          .mvbd-progress-bar {
            height: 100%;

            border-radius: inherit;

            background:
              linear-gradient(
                90deg,
                #40ff73,
                #20c9ff,
                #a56cff
              );

            box-shadow:
              0 0 14px
              rgba(69, 255, 116, 0.35);

            transition:
              width 0.18s linear;
          }

          .mvbd-percent {
            color:
              rgba(255, 255, 255, 0.30);

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
              rgba(115, 255, 146, 0.25);

            border-radius: 50%;

            background:
              radial-gradient(
                circle,
                rgba(76, 255, 111, 0.12),
                rgba(76, 255, 111, 0.025)
              );

            color:
              #aaffbc;

            font-size: 34px;

            box-shadow:
              0 0 45px
              rgba(69, 255, 105, 0.10);

            animation:
              mvbdSuccess
              0.42s
              cubic-bezier(
                0.16,
                1,
                0.3,
                1
              );
          }

          @keyframes mvbdSuccess {
            from {
              opacity: 0;
              transform:
                scale(0.65);
            }

            70% {
              transform:
                scale(1.08);
            }

            to {
              opacity: 1;
              transform:
                scale(1);
            }
          }

          .mvbd-done {
            position: relative;

            z-index: 2;

            width: 100%;

            margin-top: 17px;

            padding: 13px;

            border:
              1px solid
              rgba(255, 255, 255, 0.09);

            border-radius: 15px;

            background:
              rgba(255, 255, 255, 0.055);

            color: white;

            font-weight: 850;

            cursor: pointer;
          }

          /* =================================================
             TABLET
          ================================================= */

          @media (max-width: 1000px) {
            .mvbd-plans {
              grid-template-columns:
                repeat(2, minmax(0, 1fr));
            }
          }

          /* =================================================
             MOBILE
          ================================================= */

          @media (max-width: 760px) {

            .mvbd-premium-page {
              padding:
                12px 10px 60px;
            }

            .mvbd-plans {
              grid-template-columns: 1fr;

              gap: 13px;
            }

            .mvbd-hero {
              padding:
                55px 6px 34px;
            }

            .mvbd-hero h1 {
              font-size:
                clamp(39px, 12vw, 55px);

              letter-spacing:
                -2.8px;
            }

            .mvbd-card {
              padding: 20px;

              border-radius:
                29px 24px 31px 25px;
            }

            .mvbd-price {
              font-size: 40px;
            }

            .mvbd-sheet {
              width:
                calc(100vw - 20px) !important;

              max-width:
                calc(100vw - 20px) !important;

              max-height:
                87dvh !important;

              padding: 19px;

              border-radius:
                27px 23px 30px 25px;
            }

            .mvbd-access-item {
              align-items:
                flex-start;
            }

            .mvbd-access-button {
              font-size: 8px;
            }

            .mvbd-stars {
              height: 570px;
            }
          }

          /* =================================================
             SMALL PHONE
          ================================================= */

          @media (max-width: 380px) {

            .mvbd-premium-page {
              padding-left:
                8px;

              padding-right:
                8px;
            }

            .mvbd-sheet {
              width:
                calc(100vw - 16px) !important;

              max-width:
                calc(100vw - 16px) !important;

              padding:
                17px;
            }

            .mvbd-access-item {
              gap: 7px;
            }

            .mvbd-access-title {
              font-size: 10px;
            }

            .mvbd-number {
              font-size: 15px;
            }
          }

          /* =================================================
             REDUCED MOTION
          ================================================= */

          @media (prefers-reduced-motion: reduce) {

            .mvbd-premium-page *,
            .mvbd-premium-page *::before,
            .mvbd-premium-page *::after,
            .mvbd-viewport-modal *,
            .mvbd-viewport-modal *::before,
            .mvbd-viewport-modal *::after {
              animation-duration:
                0.01ms !important;

              animation-iteration-count:
                1 !important;

              transition:
                none !important;
            }
          }

        `}</style>

        {/* =================================================
            LIQUID LIGHT
        ================================================= */}

        <div
          className="mvbd-liquid-light"
          aria-hidden="true"
        />

        {/* =================================================
            PARTICLES
        ================================================= */}

        <div
          className="mvbd-stars"
          aria-hidden="true"
        >
          {Array.from({
            length: 20,
          }).map((_, index) => (
            <span
              key={index}
              className="mvbd-star"
              style={
                {
                  left:
                    `${(index * 47.3) % 100}%`,

                  top:
                    `${(index * 71.7) % 600}px`,

                  ["--duration" as string]:
                    `${2 + (index % 4) * 0.65}s`,

                  animationDelay:
                    `${-(index % 5) * 0.45}s`,
                } as React.CSSProperties
              }
            />
          ))}
        </div>

        <div className="mvbd-container">

          {/* =================================================
              NAV
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
              Enjoy the MVBD experience with
              community access and premium
              membership options.
            </p>

            <div className="mvbd-trial">
              ✦ Free access available for everyone
            </div>

          </section>

          {/* =================================================
              PLANS
          ================================================= */}

          <section className="mvbd-plans">

            {plans.map((plan) => {

              const isFree =
                plan.planId === "trial"

              const cardClass =
                isFree
                  ? "mvbd-card-free"
                  : plan.planId === "monthly"
                    ? "mvbd-card-month"
                    : plan.planId === "two_months"
                      ? "mvbd-card-two"
                      : "mvbd-card-three"

              return (
                <article
                  key={plan.planId}
                  className={
                    `mvbd-card ${cardClass}`
                  }
                >

                  {isFree && (
                    <div className="mvbd-free-badge">
                      FREE PLAN
                    </div>
                  )}

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

                    {!isFree && (
                      <small>
                        {" "}
                        / {plan.duration}
                      </small>
                    )}
                  </div>

                  <div className="mvbd-save">
                    {isFree
                      ? "Basic access"
                      : plan.save || "\u00a0"}
                  </div>

                  <div className="mvbd-description">
                    {plan.description}
                  </div>

                  <ul className="mvbd-features">

                    {isFree ? (
                      <>
                        <li>
                          Community access
                        </li>

                        <li>
                          Anime channel access
                        </li>

                        <li>
                          MVBD MeBook access
                        </li>

                        <li>
                          Basic Mini App access
                        </li>

                        <li>
                          Trailer access
                        </li>
                      </>
                    ) : (
                      <>
                        <li>
                          Full premium membership
                        </li>

                        <li>
                          Premium library access
                        </li>

                        <li>
                          Premium app experience
                        </li>

                        <li>
                          Regular updates
                        </li>

                        <li>
                          Priority support
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
                    {isFree
                      ? "Explore Free Access →"
                      : `Get ${plan.planName} →`}
                  </button>

                </article>
              )
            })}

          </section>

          {/* =================================================
              INFO
          ================================================= */}

          <div className="mvbd-info">

            <strong>
              Free Plan
            </strong>{" "}

            gives access to selected MVBD
            community features.

            <br />

            Premium features require an active
            paid subscription.

            <br />

            After payment, submit your
            transaction ID for admin review.

          </div>

          <div className="mvbd-footer">
            MoviesVerseBD • MVBD Premium Membership
          </div>

        </div>

      </main>

      {/* =====================================================
          FREE ACCESS MODAL
      ===================================================== */}

      {showFreeAccess && (
        <ViewportModal
          onBackdropClick={
            closeFreeAccess
          }
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
              onClick={closeFreeAccess}
              aria-label="Close"
            >
              ×
            </button>

            <h2>
              Free Plan Access
            </h2>

            <p className="mvbd-muted">
              These features are available
              without a paid subscription.
              Premium streaming features remain
              locked.
            </p>

            <div className="mvbd-access-list">

              {plans
                .find(
                  (plan) =>
                    plan.planId === "trial",
                )
                ?.accessItems?.map(
                  (item) => (
                    <div
                      key={item.id}
                      className="mvbd-access-item"
                    >

                      <div className="mvbd-access-left">

                        <div className="mvbd-access-title">
                          {item.available
                            ? "✓ "
                            : "🔒 "}
                          {item.title}
                        </div>

                        <div className="mvbd-access-description">
                          {item.description}
                        </div>

                      </div>

                      <button
                        type="button"
                        disabled={
                          !item.available ||
                          item.locked
                        }
                        className={
                          `mvbd-access-button ${
                            item.locked
                              ? "locked"
                              : ""
                          }`
                        }
                        onClick={() =>
                          handleFreeAccess(
                            item,
                          )
                        }
                      >
                        {item.buttonText}
                      </button>

                    </div>
                  ),
                )}

            </div>

            <div className="mvbd-locked-box">

              <div className="mvbd-locked-title">
                🔒 Not included in Free Plan
              </div>

              <ul className="mvbd-locked-list">

                {plans
                  .find(
                    (plan) =>
                      plan.planId === "trial",
                  )
                  ?.lockedItems?.map(
                    (item) => (
                      <li key={item}>
                        {item}
                      </li>
                    ),
                  )}

              </ul>

            </div>

            <button
              type="button"
              className="mvbd-upgrade"
              onClick={() => {
                setShowFreeAccess(false)

                const monthlyPlan =
                  plans.find(
                    (plan) =>
                      plan.planId ===
                      "monthly",
                  )

                if (monthlyPlan) {
                  openPlan(monthlyPlan)
                }
              }}
            >
              Unlock Premium Access →
            </button>

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
                Send Money to the payment
                number and then enter your
                transaction ID below.
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
              >
                Send for Review →
              </button>

              <div className="mvbd-note">
                Please make sure your
                transaction ID is correct before
                submitting.
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
          onBackdropClick={
            closeSuccess
          }
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
