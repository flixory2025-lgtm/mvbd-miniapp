"use client"

import { useState } from "react"

type Plan = {
  name: string
  duration: string
  price: string
  description: string
  popular?: boolean
  save?: string
}

const plans: Plan[] = [
  {
    name: "1 MONTH",
    duration: "30 days",
    price: "৳20",
    description: "Perfect for trying the premium experience.",
  },
  {
    name: "2 MONTHS",
    duration: "60 days",
    price: "৳35",
    description: "A balanced plan for regular members.",
    popular: true,
    save: "Save ৳5",
  },
  {
    name: "3 MONTHS",
    duration: "90 days",
    price: "৳50",
    description: "Best value for long-term premium access.",
    save: "Best value",
  },
]

export default function SeriesSection() {
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null)
  const [transactionId, setTransactionId] = useState("")
  const [showPayment, setShowPayment] = useState(false)
  const [showProcessing, setShowProcessing] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [progress, setProgress] = useState(0)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState("")

  const openPlan = (plan: Plan) => {
    setSelectedPlan(plan)
    setTransactionId("")
    setError("")
    setCopied(false)
    setShowPayment(true)
  }

  const closePayment = () => {
    setShowPayment(false)
  }

  const copyNumber = async () => {
    try {
      await navigator.clipboard.writeText("01865522275")
      setCopied(true)

      setTimeout(() => {
        setCopied(false)
      }, 1800)
    } catch {
      setCopied(false)
    }
  }

  const submitPayment = () => {
    const trx = transactionId.trim()

    if (!trx) {
      setError("Please enter your transaction ID.")
      return
    }

    if (!selectedPlan) return

    setError("")
    setShowPayment(false)
    setShowProcessing(true)
    setProgress(0)

    const start = Date.now()
    const duration = 9000

    const timer = window.setInterval(() => {
      const elapsed = Date.now() - start
      const percentage = Math.min(
        100,
        Math.round((elapsed / duration) * 100)
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
  }

  return (
    <main className="mvbd-premium-page">
      <style jsx>{`
        .mvbd-premium-page {
          min-height: 100vh;
          position: relative;
          overflow: hidden;
          background:
            radial-gradient(
              circle at 15% 15%,
              rgba(113, 80, 255, 0.18),
              transparent 28%
            ),
            radial-gradient(
              circle at 85% 18%,
              rgba(255, 115, 175, 0.12),
              transparent 27%
            ),
            radial-gradient(
              circle at 50% 78%,
              rgba(255, 153, 95, 0.13),
              transparent 30%
            ),
            #06060b;
          color: #fff;
          padding: 24px 18px 70px;
        }

        .mvbd-premium-page::before {
          content: "";
          position: fixed;
          inset: -30%;
          z-index: 0;
          pointer-events: none;
          background:
            radial-gradient(
              circle at 20% 30%,
              rgba(255, 118, 92, 0.12),
              transparent 25%
            ),
            radial-gradient(
              circle at 80% 25%,
              rgba(125, 93, 255, 0.13),
              transparent 28%
            ),
            radial-gradient(
              circle at 50% 80%,
              rgba(91, 153, 255, 0.08),
              transparent 25%
            );
          filter: blur(55px);
          animation: mvbdAurora 15s ease-in-out infinite alternate;
        }

        @keyframes mvbdAurora {
          from {
            transform: translate3d(-2%, 0, 0) scale(1);
          }

          to {
            transform: translate3d(3%, 2%, 0) scale(1.08);
          }
        }

        .mvbd-stars {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 610px;
          overflow: hidden;
          pointer-events: none;
          z-index: 1;
        }

        .mvbd-stars::before {
          content: "";
          position: absolute;
          inset: 0;
          background-image:
            radial-gradient(
              circle,
              rgba(170, 140, 255, 0.95) 0 1px,
              transparent 1.8px
            ),
            radial-gradient(
              circle,
              rgba(100, 165, 255, 0.8) 0 1px,
              transparent 1.8px
            ),
            radial-gradient(
              circle,
              rgba(255, 255, 255, 0.7) 0 1px,
              transparent 1.7px
            );
          background-size:
            83px 91px,
            127px 119px,
            173px 157px;
          background-position:
            10px 8px,
            42px 31px,
            90px 50px;
          opacity: 0.5;
          animation: mvbdStarMove 24s linear infinite;
        }

        .mvbd-stars::after {
          content: "";
          position: absolute;
          inset: -10%;
          background:
            radial-gradient(
              circle at 20% 20%,
              rgba(144, 111, 255, 0.15),
              transparent 20%
            ),
            radial-gradient(
              circle at 80% 30%,
              rgba(102, 164, 255, 0.1),
              transparent 22%
            );
          filter: blur(22px);
        }

        @keyframes mvbdStarMove {
          from {
            transform: translateY(0);
          }

          to {
            transform: translateY(91px);
          }
        }

        .mvbd-star {
          position: absolute;
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: linear-gradient(135deg, #fff, #a88cff);
          box-shadow: 0 0 13px rgba(147, 118, 255, 0.95);
          animation: mvbdTwinkle var(--duration) ease-in-out infinite
            alternate;
          opacity: 0.65;
        }

        @keyframes mvbdTwinkle {
          from {
            transform: scale(0.35);
            opacity: 0.18;
          }

          to {
            transform: scale(1.55);
            opacity: 1;
          }
        }

        .mvbd-container {
          position: relative;
          z-index: 3;
          width: min(1120px, 100%);
          margin: 0 auto;
        }

        .mvbd-nav {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 14px;
          border-radius: 28px;
          border: 1px solid rgba(255, 255, 255, 0.15);
          background: rgba(255, 255, 255, 0.065);
          backdrop-filter: blur(30px) saturate(160%);
          -webkit-backdrop-filter: blur(30px) saturate(160%);
          box-shadow:
            0 20px 70px rgba(0, 0, 0, 0.32),
            inset 0 1px rgba(255, 255, 255, 0.13);
        }

        .mvbd-brand {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 15px;
          font-weight: 800;
        }

        .mvbd-logo {
          width: 40px;
          height: 40px;
          display: grid;
          place-items: center;
          border-radius: 14px;
          background: linear-gradient(145deg, #ffc395, #ff6e8f);
          box-shadow: 0 9px 28px rgba(255, 116, 126, 0.3);
        }

        .mvbd-nav-badge {
          padding: 8px 12px;
          border-radius: 999px;
          border: 1px solid rgba(255, 255, 255, 0.14);
          background: rgba(255, 255, 255, 0.07);
          color: rgba(255, 255, 255, 0.68);
          font-size: 11px;
          font-weight: 700;
        }

        .mvbd-hero {
          position: relative;
          text-align: center;
          padding: 75px 8px 42px;
        }

        .mvbd-hero-glow {
          position: absolute;
          width: 340px;
          height: 190px;
          top: 85px;
          left: 50%;
          transform: translateX(-50%);
          border-radius: 50%;
          background: radial-gradient(
            circle,
            rgba(255, 151, 118, 0.2),
            transparent 68%
          );
          filter: blur(18px);
          pointer-events: none;
        }

        .mvbd-eyebrow {
          position: relative;
          display: inline-flex;
          align-items: center;
          gap: 7px;
          padding: 8px 13px;
          border: 1px solid rgba(255, 255, 255, 0.17);
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.07);
          backdrop-filter: blur(18px);
          color: #ffe1d0;
          font-size: 12px;
          font-weight: 700;
        }

        .mvbd-live-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #ffc49f;
          box-shadow: 0 0 17px #ff9d79;
          animation: mvbdDotPulse 1.6s ease-in-out infinite;
        }

        @keyframes mvbdDotPulse {
          50% {
            transform: scale(1.5);
            opacity: 0.5;
          }
        }

        .mvbd-hero h1 {
          position: relative;
          margin: 21px 0 14px;
          font-size: clamp(43px, 8vw, 76px);
          line-height: 0.94;
          letter-spacing: -4px;
          font-weight: 900;
          background: linear-gradient(
            100deg,
            #ffffff 5%,
            #ffe1ce 45%,
            #ff9877 82%
          );
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
        }

        .mvbd-premium-title {
          position: relative;
          margin-bottom: 17px;
          color: rgba(255, 255, 255, 0.82);
          font-size: clamp(14px, 2vw, 19px);
          font-weight: 850;
          letter-spacing: 7px;
        }

        .mvbd-subtitle {
          max-width: 650px;
          margin: 0 auto;
          color: rgba(255, 255, 255, 0.63);
          font-size: 15px;
          line-height: 1.7;
        }

        .mvbd-trial {
          display: inline-flex;
          margin-top: 20px;
          padding: 10px 14px;
          border-radius: 999px;
          border: 1px solid rgba(185, 246, 207, 0.22);
          background: rgba(185, 246, 207, 0.07);
          color: #c9f8d8;
          font-size: 12px;
          font-weight: 750;
        }

        .mvbd-plans {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
        }

        .mvbd-card {
          position: relative;
          overflow: hidden;
          padding: 24px;
          border-radius: 32px;
          border: 1px solid rgba(255, 255, 255, 0.15);
          background: linear-gradient(
            145deg,
            rgba(255, 255, 255, 0.115),
            rgba(255, 255, 255, 0.04)
          );
          backdrop-filter: blur(30px) saturate(155%);
          -webkit-backdrop-filter: blur(30px) saturate(155%);
          box-shadow:
            0 28px 90px rgba(0, 0, 0, 0.34),
            inset 0 1px rgba(255, 255, 255, 0.13);
          transition:
            transform 0.45s cubic-bezier(0.2, 0.8, 0.2, 1),
            border-color 0.45s,
            box-shadow 0.45s;
        }

        .mvbd-card:hover {
          transform: translateY(-8px);
          border-color: rgba(255, 184, 150, 0.38);
          box-shadow:
            0 38px 110px rgba(0, 0, 0, 0.42),
            inset 0 1px rgba(255, 255, 255, 0.15);
        }

        .mvbd-card-popular {
          border-color: rgba(255, 174, 133, 0.48);
          background: linear-gradient(
            145deg,
            rgba(255, 150, 110, 0.17),
            rgba(255, 255, 255, 0.05)
          );
        }

        .mvbd-ribbon {
          position: absolute;
          right: 17px;
          top: 17px;
          padding: 7px 10px;
          border-radius: 999px;
          background: linear-gradient(135deg, #ffd19c, #ff806e);
          color: #35140d;
          font-size: 10px;
          font-weight: 900;
          box-shadow: 0 8px 25px rgba(255, 126, 92, 0.23);
        }

        .mvbd-plan-name {
          color: #ffd8c5;
          font-size: 12px;
          font-weight: 850;
          letter-spacing: 0.8px;
        }

        .mvbd-price {
          margin: 14px 0 2px;
          font-size: 47px;
          font-weight: 900;
          letter-spacing: -2px;
        }

        .mvbd-price small {
          color: rgba(255, 255, 255, 0.62);
          font-size: 13px;
          font-weight: 600;
          letter-spacing: 0;
        }

        .mvbd-save {
          min-height: 17px;
          color: #c9f8d8;
          font-size: 11px;
        }

        .mvbd-description {
          margin-top: 12px;
          min-height: 39px;
          color: rgba(255, 255, 255, 0.52);
          font-size: 12px;
          line-height: 1.6;
        }

        .mvbd-features {
          list-style: none;
          margin: 12px 0 16px;
          padding: 0;
          color: rgba(255, 255, 255, 0.65);
          font-size: 13px;
          line-height: 2;
        }

        .mvbd-features li::before {
          content: "✓";
          margin-right: 9px;
          color: #d5ffe2;
          font-weight: 900;
        }

        .mvbd-choose {
          width: 100%;
          border: 0;
          border-radius: 17px;
          padding: 14px;
          cursor: pointer;
          color: #29130c;
          background: linear-gradient(135deg, #ffe0b8, #ff9976);
          box-shadow: 0 13px 35px rgba(255, 128, 89, 0.2);
          font-size: 14px;
          font-weight: 900;
          transition:
            transform 0.25s,
            filter 0.25s;
        }

        .mvbd-choose:hover {
          filter: brightness(1.05);
          transform: scale(1.015);
        }

        .mvbd-choose:active {
          transform: scale(0.97);
        }

        .mvbd-info {
          margin-top: 18px;
          padding: 19px;
          border: 1px solid rgba(255, 255, 255, 0.14);
          border-radius: 27px;
          background: rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(25px);
          text-align: center;
          color: rgba(255, 255, 255, 0.58);
          font-size: 12px;
          line-height: 1.65;
        }

        .mvbd-info strong {
          color: #fff0e6;
        }

        .mvbd-footer {
          padding: 28px 0 0;
          text-align: center;
          color: rgba(255, 255, 255, 0.32);
          font-size: 11px;
        }

        /* Modal */
        .mvbd-overlay {
          position: fixed;
          inset: 0;
          z-index: 100;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 18px;
          background: rgba(4, 3, 8, 0.64);
          backdrop-filter: blur(20px) saturate(135%);
          -webkit-backdrop-filter: blur(20px) saturate(135%);
          animation: mvbdOverlayIn 0.28s ease;
        }

        @keyframes mvbdOverlayIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        .mvbd-sheet {
          width: min(470px, 100%);
          max-height: 90vh;
          overflow: auto;
          padding: 24px;
          border: 1px solid rgba(255, 255, 255, 0.18);
          border-radius: 32px;
          background: rgba(28, 20, 24, 0.8);
          backdrop-filter: blur(40px) saturate(160%);
          -webkit-backdrop-filter: blur(40px) saturate(160%);
          box-shadow:
            0 35px 120px rgba(0, 0, 0, 0.58),
            inset 0 1px rgba(255, 255, 255, 0.16);
          animation: mvbdSheetIn 0.5s cubic-bezier(0.2, 0.8, 0.2, 1);
        }

        @keyframes mvbdSheetIn {
          from {
            opacity: 0;
            transform: translateY(24px) scale(0.96);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        .mvbd-close {
          float: right;
          width: 35px;
          height: 35px;
          border: 0;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.1);
          color: #fff;
          font-size: 21px;
          cursor: pointer;
        }

        .mvbd-sheet h2 {
          margin: 3px 42px 7px 0;
          font-size: 25px;
          letter-spacing: -1px;
        }

        .mvbd-muted {
          color: rgba(255, 255, 255, 0.62);
          font-size: 13px;
          line-height: 1.65;
        }

        .mvbd-selected {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin: 17px 0;
          padding: 15px;
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 19px;
          background: rgba(255, 255, 255, 0.07);
        }

        .mvbd-selected-price {
          color: #ffd0b0;
          font-weight: 900;
        }

        .mvbd-payment-box {
          margin-top: 13px;
          padding: 17px;
          border: 1px solid rgba(255, 255, 255, 0.13);
          border-radius: 21px;
          background: rgba(255, 255, 255, 0.06);
        }

        .mvbd-label {
          color: rgba(255, 255, 255, 0.55);
          font-size: 10px;
          font-weight: 800;
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
          font-size: 20px;
          font-weight: 900;
          letter-spacing: 0.3px;
        }

        .mvbd-copy {
          border: 0;
          border-radius: 12px;
          padding: 9px 11px;
          background: rgba(255, 255, 255, 0.1);
          color: #fff;
          font-size: 11px;
          cursor: pointer;
        }

        .mvbd-input {
          width: 100%;
          margin-top: 12px;
          padding: 14px 15px;
          border: 1px solid rgba(255, 255, 255, 0.16);
          border-radius: 17px;
          outline: none;
          background: rgba(0, 0, 0, 0.2);
          color: #fff;
          font-size: 15px;
        }

        .mvbd-input::placeholder {
          color: rgba(255, 255, 255, 0.38);
        }

        .mvbd-input:focus {
          border-color: rgba(255, 175, 140, 0.55);
          box-shadow: 0 0 0 4px rgba(255, 145, 110, 0.08);
        }

        .mvbd-error {
          margin-top: 8px;
          color: #ffaaa0;
          font-size: 11px;
        }

        .mvbd-send {
          width: 100%;
          margin-top: 12px;
          padding: 14px;
          border: 0;
          border-radius: 17px;
          background: linear-gradient(135deg, #ffd7ad, #ff8f73);
          color: #2b120b;
          font-weight: 900;
          cursor: pointer;
        }

        .mvbd-note {
          margin-top: 11px;
          color: rgba(255, 255, 255, 0.38);
          font-size: 10px;
          line-height: 1.5;
          text-align: center;
        }

        /* Processing */
        .mvbd-processing {
          text-align: center;
          padding: 14px 5px 4px;
        }

        .mvbd-orb {
          position: relative;
          width: 92px;
          height: 92px;
          margin: 7px auto 20px;
          border-radius: 50%;
          background: conic-gradient(
            from 0deg,
            #ff9c7a,
            #9e7cff,
            #63b4ff,
            #ff9c7a
          );
          animation: mvbdSpin 1.1s linear infinite;
          box-shadow: 0 0 55px rgba(157, 118, 255, 0.3);
        }

        .mvbd-orb::after {
          content: "";
          position: absolute;
          inset: 8px;
          border-radius: 50%;
          background: #1d151a;
          box-shadow: inset 0 0 25px rgba(255, 255, 255, 0.08);
        }

        .mvbd-orb::before {
          content: "";
          position: absolute;
          inset: -11px;
          border: 1px solid rgba(255, 255, 255, 0.16);
          border-radius: 50%;
          animation: mvbdPulse 1.5s ease-in-out infinite;
        }

        @keyframes mvbdSpin {
          to {
            transform: rotate(360deg);
          }
        }

        @keyframes mvbdPulse {
          50% {
            transform: scale(1.08);
            opacity: 0.35;
          }
        }

        .mvbd-progress {
          height: 5px;
          margin: 22px 0 9px;
          overflow: hidden;
          border-radius: 99px;
          background: rgba(255, 255, 255, 0.1);
        }

        .mvbd-progress-bar {
          height: 100%;
          border-radius: inherit;
          background: linear-gradient(90deg, #ff9d78, #a77cff, #68b5ff);
          transition: width 0.12s linear;
        }

        .mvbd-percent {
          color: rgba(255, 255, 255, 0.42);
          font-size: 11px;
        }

        .mvbd-success-icon {
          width: 74px;
          height: 74px;
          display: grid;
          place-items: center;
          margin: 8px auto 17px;
          border: 1px solid rgba(180, 255, 208, 0.3);
          border-radius: 50%;
          background: rgba(180, 255, 208, 0.1);
          color: #bfffd4;
          font-size: 35px;
          box-shadow: 0 0 45px rgba(105, 255, 160, 0.12);
          animation: mvbdSuccessPop 0.55s cubic-bezier(0.2, 0.8, 0.2, 1);
        }

        @keyframes mvbdSuccessPop {
          from {
            transform: scale(0.5);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }

        .mvbd-done {
          width: 100%;
          margin-top: 18px;
          padding: 13px;
          border: 0;
          border-radius: 16px;
          background: rgba(255, 255, 255, 0.1);
          color: #fff;
          font-weight: 800;
          cursor: pointer;
        }

        @media (max-width: 760px) {
          .mvbd-premium-page {
            padding-left: 14px;
            padding-right: 14px;
          }

          .mvbd-plans {
            grid-template-columns: 1fr;
          }

          .mvbd-card-popular {
            order: -1;
          }

          .mvbd-hero {
            padding-top: 58px;
          }

          .mvbd-hero h1 {
            letter-spacing: -2.5px;
          }

          .mvbd-stars {
            height: 590px;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          *,
          *::before,
          *::after {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition: none !important;
          }
        }
      `}</style>

      {/* Animated Star Background */}
      <div className="mvbd-stars" aria-hidden="true">
        {Array.from({ length: 34 }).map((_, index) => (
          <span
            key={index}
            className="mvbd-star"
            style={
              {
                left: `${(index * 31.7) % 100}%`,
                top: `${(index * 67.3) % 570}px`,
                ["--duration" as string]: `${1.6 + (index % 5) * 0.65}s`,
                animationDelay: `${-(index % 6) * 0.55}s`,
              } as React.CSSProperties
            }
          />
        ))}
      </div>

      <div className="mvbd-container">
        {/* Navigation */}
        <nav className="mvbd-nav">
          <div className="mvbd-brand">
            <div className="mvbd-logo">M</div>
            <span>MoviesVerseBD</span>
          </div>

          <div className="mvbd-nav-badge">Premium Access</div>
        </nav>

        {/* Hero */}
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

          <div className="mvbd-premium-title">MVBD PREMIUM</div>

          <p className="mvbd-subtitle">
            Enjoy a beautiful premium experience with uninterrupted access
            to your authorized MVBD library.
          </p>

          <div className="mvbd-trial">
            ✦ 7-day free trial for new members
          </div>
        </section>

        {/* Plans */}
        <section className="mvbd-plans">
          {plans.map((plan) => (
            <article
              key={plan.name}
              className={`mvbd-card ${
                plan.popular ? "mvbd-card-popular" : ""
              }`}
            >
              {plan.popular && (
                <div className="mvbd-ribbon">MOST POPULAR</div>
              )}

              <div className="mvbd-plan-name">{plan.name}</div>

              <div className="mvbd-price">
                {plan.price}{" "}
                <small>/ {plan.duration}</small>
              </div>

              <div className="mvbd-save">
                {plan.save || "\u00a0"}
              </div>

              <div className="mvbd-description">
                {plan.description}
              </div>

              <ul className="mvbd-features">
                <li>Premium access</li>
                <li>MVBD app access</li>
                <li>Telegram access included</li>
                <li>Fast premium experience</li>
              </ul>

              <button
                type="button"
                className="mvbd-choose"
                onClick={() => openPlan(plan)}
              >
                Continue
              </button>
            </article>
          ))}
        </section>

        {/* Info */}
        <div className="mvbd-info">
          <strong>New here?</strong> Start with your 7-day free trial.
          After your trial ends, an active subscription is required for
          premium access.
          <br />
          After payment, submit your transaction ID for admin review.
        </div>

        <div className="mvbd-footer">
          MoviesVerseBD • MVBD Premium Membership
        </div>
      </div>

      {/* Payment Popup */}
      {showPayment && selectedPlan && (
        <div
          className="mvbd-overlay"
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              closePayment()
            }
          }}
        >
          <div className="mvbd-sheet">
            <button
              type="button"
              className="mvbd-close"
              onClick={closePayment}
              aria-label="Close"
            >
              ×
            </button>

            <h2>Complete your payment</h2>

            <p className="mvbd-muted">
              Send Money to the MVBD payment number and then paste your
              transaction ID below.
            </p>

            <div className="mvbd-selected">
              <span>{selectedPlan.name}</span>
              <span className="mvbd-selected-price">
                {selectedPlan.price}
              </span>
            </div>

            <div className="mvbd-payment-box">
              <div className="mvbd-label">Send Money — bKash</div>

              <div className="mvbd-number-row">
                <span className="mvbd-number">01865522275</span>

                <button
                  type="button"
                  className="mvbd-copy"
                  onClick={copyNumber}
                >
                  {copied ? "Copied ✓" : "Copy"}
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
                setTransactionId(event.target.value)
                setError("")
              }}
            />

            {error && <div className="mvbd-error">{error}</div>}

            <button
              type="button"
              className="mvbd-send"
              onClick={submitPayment}
            >
              Send for Review →
            </button>

            <div className="mvbd-note">
              Please make sure your transaction ID is correct before
              submitting.
            </div>
          </div>
        </div>
      )}

      {/* Processing Popup */}
      {showProcessing && (
        <div className="mvbd-overlay">
          <div className="mvbd-sheet mvbd-processing">
            <div className="mvbd-orb" />

            <h2>Processing payment…</h2>

            <p className="mvbd-muted">
              Please wait while your payment submission is being prepared
              for admin review.
            </p>

            <div className="mvbd-progress">
              <div
                className="mvbd-progress-bar"
                style={{ width: `${progress}%` }}
              />
            </div>

            <div className="mvbd-percent">{progress}%</div>
          </div>
        </div>
      )}

      {/* Success Popup */}
      {showSuccess && (
        <div
          className="mvbd-overlay"
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              closeSuccess()
            }
          }}
        >
          <div className="mvbd-sheet mvbd-processing">
            <div className="mvbd-success-icon">✓</div>

            <h2>Payment sent for review</h2>

            <p className="mvbd-muted">
              Your payment details have been sent to the admin team.
              <br />
              <br />
              They are currently <strong>under review</strong> and will be
              approved as soon as possible if everything is correct.
              <br />
              <br />
              Please wait until the review is completed.
            </p>

            <button
              type="button"
              className="mvbd-done"
              onClick={closeSuccess}
            >
              Done
            </button>
          </div>
        </div>
      )}
    </main>
  )
}
