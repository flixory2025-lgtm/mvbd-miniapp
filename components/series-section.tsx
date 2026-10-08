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
        if (event.target === event.currentTarget && onBackdropClick) {
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
   MAIN COMPONENT
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
  const [openFaq, setOpenFaq] = useState<number | null>(0)

  const processingTimerRef = useRef<number | null>(null)
  const successTimerRef = useRef<number | null>(null)

  useEffect(() => {
    return () => {
      if (processingTimerRef.current) window.clearInterval(processingTimerRef.current)
      if (successTimerRef.current) window.clearTimeout(successTimerRef.current)
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

  const closeFreeAccess = () => setShowFreeAccess(false)

  const copyNumber = async () => {
    try {
      await navigator.clipboard.writeText(PAYMENT_NUMBER)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1800)
    } catch {
      setCopied(false)
    }
  }

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
      setError(requestError instanceof Error ? requestError.message : "Unable to submit your payment request.")
      return
    }

    setShowPayment(false)
    setShowProcessing(true)
    setProgress(0)

    if (processingTimerRef.current) window.clearInterval(processingTimerRef.current)
    if (successTimerRef.current) window.clearTimeout(successTimerRef.current)

    const startTime = Date.now()
    const processingDuration = 9000

    processingTimerRef.current = window.setInterval(() => {
      const elapsed = Date.now() - startTime
      const percentage = Math.min(100, Math.round((elapsed / processingDuration) * 100))
      setProgress(percentage)
      if (percentage >= 100) {
        if (processingTimerRef.current) window.clearInterval(processingTimerRef.current)
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
     RENDER
  ======================================================= */

  return (
    <>
      <main className="mvbd-premium-page">
        {/* =================================================
            BACKGROUND (Pure CSS - Dark Teal Gradient)
        ================================================= */}
        <div className="mvbd-bg-gradient" />
        <div className="mvbd-bg-glow" />

        <div className="mvbd-page-content">
          
          {/* =================================================
              HEADER
          ================================================= */}
          <header className="mvbd-premium-header">
            <div className="mvbd-brand">
              <div className="mvbd-brand-mark">M</div>
              <div>
                <strong>MoviesVerseBD</strong>
                <span>Premium Membership</span>
              </div>
            </div>
            <nav className="mvbd-nav">
              <a href="#">Home</a>
              <a href="#">Features</a>
              <a href="#">Pricing</a>
              <a href="#">FAQ</a>
            </nav>
            <div className="mvbd-status">
              <span className="mvbd-status-dot" />
              MEMBERSHIP
            </div>
          </header>

          {/* =================================================
              HERO SECTION
          ================================================= */}
          <section className="mvbd-premium-hero">
            <div className="mvbd-eyebrow">✦ MOVIESVERSEBD</div>
            <h1>
              Books Done.<br />
              <span>Stress is Gone.</span>
            </h1>
            <p>
              Select a membership plan that works best for you.
            </p>
          </section>

          {/* =================================================
              DASHBOARD MOCKUP (Visual Only)
          ================================================= */}
          <div className="mvbd-dashboard-mockup">
            <div className="mvbd-dashboard-header">
              <div className="mvbd-dot red" />
              <div className="mvbd-dot yellow" />
              <div className="mvbd-dot green" />
              <span className="mvbd-dashboard-title">MoviesVerseBD Dashboard</span>
            </div>
            <div className="mvbd-dashboard-body">
              <div className="mvbd-dash-sidebar">
                <div className="mvbd-dash-item active" />
                <div className="mvbd-dash-item" />
                <div className="mvbd-dash-item" />
                <div className="mvbd-dash-item" />
              </div>
              <div className="mvbd-dash-main">
                <div className="mvbd-dash-card" />
                <div className="mvbd-dash-card" />
                <div className="mvbd-dash-row">
                  <div className="mvbd-dash-chart" />
                  <div className="mvbd-dash-list">
                    <div className="mvbd-dash-list-item" />
                    <div className="mvbd-dash-list-item" />
                    <div className="mvbd-dash-list-item" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* =================================================
              FEATURES SECTION
          ================================================= */}
          <section className="mvbd-section">
            <div className="mvbd-section-badge">✦ FEATURES</div>
            <h2 className="mvbd-section-title">Why Businesses Choose MoviesVerseBD?</h2>
            <p className="mvbd-section-subtitle">Everything you need to manage your finances in one place.</p>

            <div className="mvbd-features-grid">
              <div className="mvbd-feature-box large">
                <div className="mvbd-feature-content">
                  <h3>Growth Not Books</h3>
                  <p>Focus on scaling your business while we handle the numbers.</p>
                  <button className="mvbd-btn-small">Learn More</button>
                </div>
                <div className="mvbd-feature-visual">
                  <div className="mvbd-visual-card">
                    <div className="mvbd-visual-line" />
                    <div className="mvbd-visual-line short" />
                    <div className="mvbd-visual-circle" />
                  </div>
                </div>
              </div>

              <div className="mvbd-feature-box">
                <div className="mvbd-feature-content">
                  <h3>Smarter Accounting</h3>
                  <p>AI-driven insights to keep your books accurate.</p>
                  <button className="mvbd-btn-small">Learn More</button>
                </div>
                <div className="mvbd-feature-visual">
                  <div className="mvbd-visual-chart" />
                </div>
              </div>

              <div className="mvbd-feature-box">
                <div className="mvbd-feature-content">
                  <h3>Real-time Visibility</h3>
                  <p>See your financial health at a glance.</p>
                  <button className="mvbd-btn-small">Learn More</button>
                </div>
                <div className="mvbd-feature-visual">
                  <div className="mvbd-visual-bars">
                    <div className="mvbd-bar" />
                    <div className="mvbd-bar" />
                    <div className="mvbd-bar" />
                  </div>
                </div>
              </div>

              <div className="mvbd-feature-box full">
                <div className="mvbd-feature-content">
                  <h3>Easy Integrations</h3>
                  <p>Connect with your favorite tools seamlessly.</p>
                </div>
                <div className="mvbd-integrations">
                  <div className="mvbd-int-icon">⚡</div>
                  <div className="mvbd-int-icon">📊</div>
                  <div className="mvbd-int-icon">☁️</div>
                  <div className="mvbd-int-icon">🔗</div>
                </div>
              </div>
            </div>
          </section>

          {/* =================================================
              BUILT TO HANDLE SECTION
          ================================================= */}
          <section className="mvbd-section">
            <h2 className="mvbd-section-title">Built to Handle the Hard Stuff</h2>
            <p className="mvbd-section-subtitle">Powerful tools for complex financial workflows.</p>

            <div className="mvbd-hard-grid">
              <div className="mvbd-hard-box">
                <div className="mvbd-hard-icon">📄</div>
                <h3>Automated Bookkeeping</h3>
                <p>Let AI categorize your transactions automatically.</p>
                <button className="mvbd-btn-small">Learn More</button>
              </div>
              <div className="mvbd-hard-box">
                <div className="mvbd-hard-icon">⚖️</div>
                <h3>Tax Compliance</h3>
                <p>Stay compliant with ever-changing tax laws.</p>
                <button className="mvbd-btn-small">Learn More</button>
              </div>
              <div className="mvbd-hard-box">
                <div className="mvbd-hard-icon">📈</div>
                <h3>Catch-Up Bookkeeping</h3>
                <p>Get your past books in order quickly.</p>
                <button className="mvbd-btn-small">Learn More</button>
              </div>
              <div className="mvbd-hard-box">
                <div className="mvbd-hard-icon">🎯</div>
                <h3>Tax Strategy</h3>
                <p>Proactive planning to minimize your tax burden.</p>
                <button className="mvbd-btn-small">Learn More</button>
              </div>
            </div>
          </section>

          {/* =================================================
              PRICING SECTION (Subscription Plans from Data)
          ================================================= */}
          <section className="mvbd-section">
            <div className="mvbd-section-badge">✦ PRICING</div>
            <h2 className="mvbd-section-title">Choose the Right Plan for You</h2>
            <p className="mvbd-section-subtitle">Simple, transparent pricing for every stage of your business.</p>

            <div className="mvbd-pricing-grid">
              {SUBSCRIPTION_PLANS.map((plan) => {
                const isFree = plan.planId === "trial"
                const isMonthly = plan.planId === "monthly"
                const isTwoMonths = plan.planId === "two_months"
                const isThreeMonths = plan.planId === "three_months"

                const features = plan.features || []

                return (
                  <div
                    key={plan.planId}
                    className={`mvbd-price-card ${plan.popular ? "popular" : ""} ${isFree ? "full-width" : ""}`}
                  >
                    {plan.popular && <div className="mvbd-popular-badge">⭐ MOST POPULAR</div>}
                    
                    <div className="mvbd-price-header">
                      <h3>{isFree ? "Starter Plan" : isMonthly ? "Pro Plan" : isTwoMonths ? "Pro Plan" : "Velocity Plan"}</h3>
                      <p>{isFree ? "For individuals" : isMonthly ? "For growing teams" : isTwoMonths ? "For scaling teams" : "For large teams"}</p>
                    </div>
                    
                    <div className="mvbd-price-amount">
                      {isFree ? "$0" : plan.price}
                      <span>/month</span>
                    </div>

                    <div className="mvbd-duration-pill">
                      {isFree ? "BASIC ACCESS" : isMonthly ? "30 DAYS ACCESS" : isTwoMonths ? "60 DAYS ACCESS" : "90 DAYS ACCESS"}
                    </div>

                    <ul className={`mvbd-price-features ${isFree ? "horizontal" : ""}`}>
                      {features.map((feature, index) => (
                        <li key={`${plan.planId}-${index}`}>
                          <span className={
                            feature.type === "locked" ? "feature-cross" :
                            feature.type === "restricted" ? "feature-restricted" :
                            feature.type === "quality" ? "feature-quality" : "feature-check"
                          }>
                            {feature.type === "locked" ? "🔒" :
                             feature.type === "restricted" ? "🔞" :
                             feature.type === "quality" ? "🎥" : "✓"}
                          </span>
                          <span className="feature-text">{feature.text}</span>
                        </li>
                      ))}
                    </ul>

                    <button
                      type="button"
                      className={`mvbd-btn-price ${plan.popular ? "primary" : ""}`}
                      onClick={() => openPlan(plan)}
                    >
                      {isFree ? "Get Started" : isMonthly ? "Get Pro Plan" : isTwoMonths ? "Get Pro Plan" : "Get Velocity Plan"}
                    </button>
                  </div>
                )
              })}
            </div>
          </section>

          {/* =================================================
              FAQ SECTION
          ================================================= */}
          <section className="mvbd-section">
            <div className="mvbd-section-badge">✦ FAQ</div>
            <h2 className="mvbd-section-title">Have Questions?<br />We Have Answers</h2>

            <div className="mvbd-faq-list">
              {[
                { q: "What is MoviesVerseBD?", a: "MoviesVerseBD is an AI-powered bookkeeping platform that helps businesses automate their finances." },
                { q: "How does the AI work?", a: "Our AI learns from your transactions to categorize and reconcile your books automatically." },
                { q: "Can I use it for my small business?", a: "Absolutely! We have plans designed specifically for small businesses and freelancers." },
                { q: "Is my data secure?", a: "Yes, we use bank-level encryption to keep your financial data safe and secure." },
                { q: "Do you offer a free trial?", a: "Yes, we offer a 14-day free trial on all our plans. No credit card required." },
              ].map((faq, idx) => (
                <div key={idx} className="mvbd-faq-item" onClick={() => setOpenFaq(openFaq === idx ? null : idx)}>
                  <div className="mvbd-faq-question">
                    {faq.q}
                    <span className="mvbd-faq-icon">{openFaq === idx ? "−" : "+"}</span>
                  </div>
                  {openFaq === idx && (
                    <div className="mvbd-faq-answer">
                      {faq.a}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>

          {/* =================================================
              CTA SECTION
          ================================================= */}
          <section className="mvbd-cta-section">
            <div className="mvbd-cta-glow" />
            <div className="mvbd-cta-content">
              <div className="mvbd-cta-icon">✦</div>
              <h2 className="mvbd-cta-title">Ready to<br />Change your life?</h2>
              <p className="mvbd-cta-desc">Join thousands of businesses already using MoviesVerseBD.</p>
              <button className="mvbd-btn-hero" onClick={() => openPlan(SUBSCRIPTION_PLANS[1] || SUBSCRIPTION_PLANS[0])}>
                Get Started Free
              </button>
            </div>
          </section>

          {/* =================================================
              FOOTER
          ================================================= */}
          <footer className="mvbd-footer">
            <div className="mvbd-footer-brand">
              <div className="mvbd-logo-icon small">M</div>
              <span>MoviesVerseBD</span>
            </div>
            <p className="mvbd-footer-copy">© 2026 MoviesVerseBD. All rights reserved.</p>
          </footer>
        </div>

        {/* =================================================
            GLOBAL CSS (Exact Match Dark Teal/Cyan Theme)
        ================================================= */}
        <style jsx global>{`
          * { box-sizing: border-box; margin: 0; padding: 0; }

          /* ================= PAGE ================= */
          .mvbd-premium-page {
            position: relative;
            min-height: 100svh;
            width: 100%;
            overflow-x: hidden;
            background: #000000;
            color: #ffffff;
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
            isolation: isolate;
          }

          /* ================= BACKGROUND ================= */
          .mvbd-bg-gradient {
            position: fixed;
            inset: 0;
            z-index: -3;
            background: linear-gradient(
              180deg,
              #000000 0%,
              #020b14 40%,
              #000000 100%
            );
          }

          .mvbd-bg-glow {
            position: fixed;
            top: 0;
            left: 50%;
            transform: translateX(-50%);
            width: 100%;
            max-width: 1200px;
            height: 600px;
            z-index: -2;
            background: radial-gradient(
              ellipse at center,
              rgba(0, 255, 200, 0.08) 0%,
              transparent 70%
            );
            pointer-events: none;
          }

          /* ================= CONTENT ================= */
          .mvbd-page-content {
            position: relative;
            z-index: 1;
            width: min(1200px, calc(100% - 40px));
            margin: 0 auto;
            padding: 20px 0 60px;
          }

          /* ================= HEADER ================= */
          .mvbd-premium-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 20px;
            padding: 14px 24px;
            border: 1px solid rgba(0, 255, 200, 0.12);
            border-radius: 16px;
            background: rgba(0, 0, 0, 0.7);
            backdrop-filter: blur(20px);
          }

          .mvbd-brand { display: flex; align-items: center; gap: 10px; }
          .mvbd-brand-mark {
            width: 32px; height: 32px;
            display: grid; place-items: center;
            border-radius: 8px;
            font-size: 16px; font-weight: 900;
            color: #000000;
            background: linear-gradient(135deg, #00ffc8, #00b8ff);
          }
          .mvbd-brand strong { display: block; font-size: 15px; font-weight: 700; }
          .mvbd-brand span { display: block; margin-top: 2px; color: #8a9ba8; font-size: 10px; }

          .mvbd-nav { display: flex; gap: 28px; }
          .mvbd-nav a {
            color: #8a9ba8; font-size: 13px; font-weight: 500;
            text-decoration: none; transition: color 0.2s;
          }
          .mvbd-nav a:hover { color: #00ffc8; }

          .mvbd-status {
            display: flex; align-items: center; gap: 7px;
            padding: 6px 14px; border-radius: 999px;
            color: #00ffc8; background: rgba(0, 255, 200, 0.08);
            border: 1px solid rgba(0, 255, 200, 0.2);
            font-size: 10px; font-weight: 700; letter-spacing: 0.5px;
          }
          .mvbd-status-dot {
            width: 6px; height: 6px; border-radius: 50%;
            background: #00ffc8; box-shadow: 0 0 10px #00ffc8;
            animation: mvbdPulse 1.8s ease-in-out infinite;
          }

          /* ================= HERO ================= */
          .mvbd-premium-hero {
            text-align: center;
            padding: 80px 16px 60px;
          }
          .mvbd-eyebrow {
            color: #00ffc8; font-size: 11px; font-weight: 800;
            letter-spacing: 4px; text-transform: uppercase; margin-bottom: 16px;
          }
          .mvbd-premium-hero h1 {
            font-size: clamp(36px, 6vw, 72px);
            line-height: 1.05; font-weight: 800; letter-spacing: -2px;
            color: #ffffff;
          }
          .mvbd-premium-hero h1 span {
            display: block; color: #00ffc8;
            text-shadow: 0 0 40px rgba(0, 255, 200, 0.3);
          }
          .mvbd-premium-hero p {
            margin: 20px auto 0; max-width: 500px;
            color: #8a9ba8; font-size: 15px; line-height: 1.7;
          }

          /* ================= DASHBOARD MOCKUP ================= */
          .mvbd-dashboard-mockup {
            margin-top: 60px;
            border-radius: 16px;
            border: 1px solid rgba(0, 255, 200, 0.15);
            background: rgba(0, 0, 0, 0.8);
            overflow: hidden;
            box-shadow: 0 30px 80px rgba(0, 0, 0, 0.8), 0 0 60px rgba(0, 255, 200, 0.05);
          }
          .mvbd-dashboard-header {
            display: flex; align-items: center; gap: 8px;
            padding: 12px 18px;
            border-bottom: 1px solid rgba(0, 255, 200, 0.1);
            background: rgba(0, 0, 0, 0.5);
          }
          .mvbd-dot { width: 10px; height: 10px; border-radius: 50%; }
          .mvbd-dot.red { background: #ff5f56; }
          .mvbd-dot.yellow { background: #ffbd2e; }
          .mvbd-dot.green { background: #27c93f; }
          .mvbd-dashboard-title { margin-left: 10px; font-size: 11px; color: #8a9ba8; }
          .mvbd-dashboard-body { display: flex; min-height: 300px; }
          .mvbd-dash-sidebar {
            width: 60px; padding: 16px 0;
            border-right: 1px solid rgba(0, 255, 200, 0.08);
            display: flex; flex-direction: column; align-items: center; gap: 16px;
          }
          .mvbd-dash-item {
            width: 28px; height: 28px; border-radius: 6px;
            background: rgba(255, 255, 255, 0.05);
          }
          .mvbd-dash-item.active {
            background: rgba(0, 255, 200, 0.15);
            border: 1px solid rgba(0, 255, 200, 0.3);
          }
          .mvbd-dash-main { flex: 1; padding: 20px; display: grid; gap: 16px; }
          .mvbd-dash-card {
            height: 60px; border-radius: 8px;
            background: rgba(255, 255, 255, 0.03);
            border: 1px solid rgba(0, 255, 200, 0.08);
          }
          .mvbd-dash-row { display: flex; gap: 16px; }
          .mvbd-dash-chart {
            flex: 1; height: 120px; border-radius: 8px;
            background: linear-gradient(180deg, rgba(0, 255, 200, 0.05), transparent);
            border: 1px solid rgba(0, 255, 200, 0.1);
          }
          .mvbd-dash-list { flex: 1; display: grid; gap: 10px; }
          .mvbd-dash-list-item { height: 32px; border-radius: 6px; background: rgba(255, 255, 255, 0.03); }

          /* ================= SECTIONS ================= */
          .mvbd-section { margin-top: 100px; text-align: center; }
          .mvbd-section-badge {
            display: inline-block; padding: 4px 14px;
            border-radius: 999px; border: 1px solid rgba(0, 255, 200, 0.2);
            background: rgba(0, 255, 200, 0.05); color: #00ffc8;
            font-size: 9px; font-weight: 700; letter-spacing: 1px; margin-bottom: 20px;
          }
          .mvbd-section-title {
            font-size: clamp(28px, 4vw, 44px); font-weight: 800;
            letter-spacing: -1.5px; color: #ffffff; line-height: 1.15;
          }
          .mvbd-section-subtitle {
            margin: 16px auto 0; max-width: 500px;
            color: #8a9ba8; font-size: 14px; line-height: 1.6;
          }

          /* ================= FEATURES ================= */
          .mvbd-features-grid {
            display: grid; grid-template-columns: repeat(3, 1fr);
            gap: 20px; margin-top: 50px; text-align: left;
          }
          .mvbd-feature-box {
            padding: 28px; border-radius: 20px;
            border: 1px solid rgba(0, 255, 200, 0.12);
            background: rgba(0, 0, 0, 0.6);
            display: flex; flex-direction: column; gap: 20px;
            transition: border-color 0.3s;
          }
          .mvbd-feature-box:hover { border-color: rgba(0, 255, 200, 0.4); }
          .mvbd-feature-box.large { grid-column: span 2; flex-direction: row; align-items: center; }
          .mvbd-feature-box.full { grid-column: span 3; flex-direction: row; align-items: center; justify-content: space-between; }
          .mvbd-feature-content h3 { font-size: 20px; font-weight: 700; color: #ffffff; margin-bottom: 8px; }
          .mvbd-feature-content p { font-size: 13px; color: #8a9ba8; line-height: 1.6; margin-bottom: 16px; }
          .mvbd-btn-small {
            padding: 8px 18px; border-radius: 8px;
            border: 1px solid rgba(0, 255, 200, 0.3);
            background: transparent; color: #00ffc8;
            font-size: 11px; font-weight: 600; cursor: pointer; transition: all 0.2s;
          }
          .mvbd-btn-small:hover { background: rgba(0, 255, 200, 0.1); }
          .mvbd-feature-visual { flex: 1; display: flex; justify-content: center; align-items: center; }
          .mvbd-visual-card { width: 100%; max-width: 180px; padding: 16px; border-radius: 12px; border: 1px solid rgba(0, 255, 200, 0.15); background: rgba(0, 255, 200, 0.03); }
          .mvbd-visual-line { height: 8px; border-radius: 4px; background: rgba(0, 255, 200, 0.15); margin-bottom: 8px; }
          .mvbd-visual-line.short { width: 60%; }
          .mvbd-visual-circle { width: 40px; height: 40px; border-radius: 50%; border: 2px solid rgba(0, 255, 200, 0.3); margin-top: 12px; }
          .mvbd-visual-chart { width: 80px; height: 80px; border-radius: 50%; border: 4px solid rgba(0, 255, 200, 0.1); border-top-color: #00ffc8; }
          .mvbd-visual-bars { display: flex; gap: 6px; align-items: flex-end; height: 60px; }
          .mvbd-bar { width: 12px; border-radius: 4px; background: linear-gradient(180deg, #00ffc8, #00b8ff); }
          .mvbd-bar:nth-child(1) { height: 30%; }
          .mvbd-bar:nth-child(2) { height: 60%; }
          .mvbd-bar:nth-child(3) { height: 100%; }
          .mvbd-integrations { display: flex; gap: 16px; }
          .mvbd-int-icon { width: 48px; height: 48px; display: grid; place-items: center; border-radius: 12px; font-size: 20px; border: 1px solid rgba(0, 255, 200, 0.15); background: rgba(0, 255, 200, 0.03); }

          /* ================= HARD GRID ================= */
          .mvbd-hard-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin-top: 50px; text-align: left; }
          .mvbd-hard-box { padding: 28px; border-radius: 20px; border: 1px solid rgba(0, 255, 200, 0.12); background: rgba(0, 0, 0, 0.6); transition: border-color 0.3s; }
          .mvbd-hard-box:hover { border-color: rgba(0, 255, 200, 0.4); }
          .mvbd-hard-icon { width: 44px; height: 44px; display: grid; place-items: center; border-radius: 12px; font-size: 20px; border: 1px solid rgba(0, 255, 200, 0.15); background: rgba(0, 255, 200, 0.05); margin-bottom: 18px; }
          .mvbd-hard-box h3 { font-size: 16px; font-weight: 700; color: #ffffff; margin-bottom: 8px; }
          .mvbd-hard-box p { font-size: 12px; color: #8a9ba8; line-height: 1.6; margin-bottom: 16px; }

          /* ================= PRICING (Subscription Plans) ================= */
          .mvbd-pricing-grid {
            display: grid; grid-template-columns: repeat(3, 1fr);
            gap: 20px; margin-top: 50px; text-align: left;
          }
          .mvbd-price-card {
            position: relative; padding: 32px 28px;
            border-radius: 20px; border: 1px solid rgba(0, 255, 200, 0.12);
            background: rgba(0, 0, 0, 0.6);
            display: flex; flex-direction: column;
            transition: border-color 0.3s, transform 0.3s;
          }
          .mvbd-price-card:hover { border-color: rgba(0, 255, 200, 0.4); transform: translateY(-4px); }
          .mvbd-price-card.popular {
            border-color: rgba(0, 255, 200, 0.5);
            background: rgba(0, 255, 200, 0.03);
            box-shadow: 0 0 40px rgba(0, 255, 200, 0.08);
          }
          .mvbd-popular-badge {
            position: absolute; top: -10px; left: 50%; transform: translateX(-50%);
            padding: 4px 14px; border-radius: 999px;
            font-size: 9px; font-weight: 800; letter-spacing: 0.5px;
            color: #000000; background: linear-gradient(135deg, #00ffc8, #00b8ff);
            white-space: nowrap;
          }
          .mvbd-price-header h3 { font-size: 18px; font-weight: 700; color: #ffffff; }
          .mvbd-price-header p { font-size: 12px; color: #8a9ba8; margin-top: 4px; }
          .mvbd-price-amount { font-size: 36px; font-weight: 800; color: #ffffff; margin: 20px 0; letter-spacing: -1px; }
          .mvbd-price-amount span { font-size: 14px; font-weight: 400; color: #8a9ba8; }
          .mvbd-duration-pill {
            display: inline-block; padding: 6px 14px; border-radius: 999px;
            font-size: 10px; font-weight: 700; letter-spacing: 0.5px;
            color: #000000; background: linear-gradient(90deg, #00ffc8, #00b8ff);
            margin-bottom: 16px; width: fit-content;
          }
          .mvbd-price-features { list-style: none; display: grid; gap: 12px; margin-bottom: 24px; flex: 1; }
          .mvbd-price-features li { display: flex; align-items: flex-start; gap: 10px; font-size: 13px; color: #b0c0cc; line-height: 1.4; }
          .mvbd-price-features li > span:first-child { width: 20px; height: 20px; flex: 0 0 20px; display: grid; place-items: center; border-radius: 50%; font-size: 10px; margin-top: 1px; }
          .feature-check { color: #000000; background: #00ffc8; }
          .feature-quality { color: #000000; background: #ffd52e; }
          .feature-cross { color: #ff5a45; background: rgba(255, 63, 42, 0.1); border: 1px solid rgba(255, 63, 42, 0.2); }
          .feature-restricted { color: #ffffff; background: #d82929; }
          .mvbd-price-features .feature-text { flex: 1; }
          .mvbd-btn-price {
            width: 100%; padding: 12px; border-radius: 10px;
            border: 1px solid rgba(0, 255, 200, 0.3);
            background: transparent; color: #00ffc8;
            font-size: 13px; font-weight: 600; cursor: pointer; transition: all 0.2s;
          }
          .mvbd-btn-price:hover { background: rgba(0, 255, 200, 0.1); }
          .mvbd-btn-price.primary { background: linear-gradient(135deg, #00ffc8, #00b8ff); color: #000000; border: 0; }
          .mvbd-price-card.full-width { grid-column: span 3; flex-direction: row; align-items: center; gap: 40px; text-align: left; }
          .mvbd-price-card.full-width .mvbd-price-features.horizontal { display: flex; flex-direction: row; gap: 24px; margin-bottom: 0; flex: 1; }
          .mvbd-price-card.full-width .mvbd-btn-price { width: auto; padding: 12px 32px; }

          /* ================= FAQ ================= */
          .mvbd-faq-list { max-width: 700px; margin: 50px auto 0; display: grid; gap: 12px; }
          .mvbd-faq-item { border-radius: 14px; border: 1px solid rgba(0, 255, 200, 0.12); background: rgba(0, 0, 0, 0.6); overflow: hidden; cursor: pointer; transition: border-color 0.3s; }
          .mvbd-faq-item:hover { border-color: rgba(0, 255, 200, 0.4); }
          .mvbd-faq-question { display: flex; justify-content: space-between; align-items: center; padding: 20px 24px; font-size: 15px; font-weight: 600; color: #ffffff; text-align: left; }
          .mvbd-faq-icon { font-size: 18px; color: #00ffc8; font-weight: 300; }
          .mvbd-faq-answer { padding: 0 24px 20px; font-size: 13px; line-height: 1.7; color: #8a9ba8; text-align: left; border-top: 1px solid rgba(0, 255, 200, 0.08); padding-top: 16px; }

          /* ================= CTA ================= */
          .mvbd-cta-section { position: relative; margin-top: 100px; padding: 80px 20px; text-align: center; border-radius: 24px; border: 1px solid rgba(0, 255, 200, 0.2); background: rgba(0, 0, 0, 0.8); overflow: hidden; }
          .mvbd-cta-glow { position: absolute; top: 0; left: 50%; transform: translateX(-50%); width: 100%; height: 100%; background: radial-gradient(ellipse at top, rgba(0, 255, 200, 0.1) 0%, transparent 60%); pointer-events: none; }
          .mvbd-cta-content { position: relative; z-index: 1; }
          .mvbd-cta-icon { font-size: 32px; margin-bottom: 20px; color: #00ffc8; }
          .mvbd-cta-title { font-size: clamp(28px, 4vw, 44px); font-weight: 800; letter-spacing: -1.5px; color: #ffffff; line-height: 1.15; }
          .mvbd-cta-desc { margin: 16px auto 0; max-width: 400px; color: #8a9ba8; font-size: 14px; line-height: 1.6; }
          .mvbd-btn-hero { margin-top: 30px; padding: 14px 40px; border-radius: 999px; border: 0; font-size: 15px; font-weight: 700; color: #000000; background: linear-gradient(135deg, #00ffc8, #00b8ff); cursor: pointer; transition: transform 0.2s, box-shadow 0.2s; }
          .mvbd-btn-hero:hover { transform: translateY(-2px); box-shadow: 0 0 40px rgba(0, 255, 200, 0.4); }

          /* ================= FOOTER ================= */
          .mvbd-footer { margin-top: 80px; padding: 40px 0; border-top: 1px solid rgba(0, 255, 200, 0.1); display: flex; flex-direction: column; align-items: center; gap: 16px; }
          .mvbd-footer-brand { display: flex; align-items: center; gap: 10px; font-weight: 700; font-size: 15px; }
          .mvbd-logo-icon.small { width: 24px; height: 24px; display: grid; place-items: center; border-radius: 6px; font-size: 12px; font-weight: 900; color: #000000; background: linear-gradient(135deg, #00ffc8, #00b8ff); }
          .mvbd-footer-copy { color: #5c6b75; font-size: 12px; }

          /* ================= MODALS ================= */
          .mvbd-modal-backdrop { position: fixed; inset: 0; z-index: 99999; display: flex; align-items: center; justify-content: center; padding: 18px; background: rgba(0, 0, 0, 0.85); backdrop-filter: blur(8px); animation: mvbdModalIn 0.2s ease both; }
          .mvbd-modal { width: min(440px, 100%); max-height: min(88svh, 700px); overflow-y: auto; padding: 28px; border-radius: 20px; border: 1px solid rgba(0, 255, 200, 0.2); background: #020b14; box-shadow: 0 30px 90px rgba(0, 0, 0, 0.9); animation: mvbdModalScale 0.24s cubic-bezier(0.2, 0.8, 0.2, 1) both; }
          .mvbd-modal::-webkit-scrollbar { width: 4px; }
          .mvbd-modal::-webkit-scrollbar-thumb { background: #1a4a44; border-radius: 99px; }
          .mvbd-modal-title { font-size: 20px; font-weight: 700; color: #ffffff; }
          .mvbd-modal-subtitle { margin-top: 8px; color: #8a9ba8; font-size: 13px; line-height: 1.6; }
          .mvbd-modal-close { float: right; width: 32px; height: 32px; border: 0; border-radius: 50%; color: #8a9ba8; background: rgba(255, 255, 255, 0.06); cursor: pointer; font-size: 16px; }
          .mvbd-free-access-list { display: grid; gap: 10px; margin-top: 20px; }
          .mvbd-access-button { width: 100%; display: flex; align-items: center; gap: 12px; padding: 14px; border: 1px solid rgba(0, 255, 200, 0.15); border-radius: 14px; background: rgba(255, 255, 255, 0.03); color: #ffffff; text-align: left; cursor: pointer; transition: all 0.2s ease; }
          .mvbd-access-button:hover { background: rgba(0, 255, 200, 0.08); border-color: rgba(0, 255, 200, 0.4); }
          .mvbd-access-icon { width: 38px; height: 38px; flex: 0 0 38px; display: grid; place-items: center; border-radius: 10px; font-size: 18px; background: rgba(0, 255, 200, 0.1); color: #00ffc8; }
          .mvbd-access-text { min-width: 0; flex: 1; }
          .mvbd-access-text strong { display: block; font-size: 13px; }
          .mvbd-access-text span { display: block; margin-top: 3px; color: #8a9ba8; font-size: 11px; line-height: 1.4; }
          .mvbd-access-arrow { color: #00ffc8; font-size: 16px; }
          .mvbd-access-info { cursor: default; }
          .mvbd-access-info:hover { transform: none; background: rgba(255, 255, 255, 0.03); }
          .mvbd-access-restricted { cursor: not-allowed; opacity: 0.6; }
          .mvbd-not-included { margin-top: 22px; padding-top: 18px; border-top: 1px solid rgba(255, 255, 255, 0.07); }
          .mvbd-not-included-title { margin-bottom: 12px; color: #8a9ba8; font-size: 10px; font-weight: 800; letter-spacing: 1px; text-transform: uppercase; }
          .mvbd-not-included ul { margin: 0; padding: 0; list-style: none; display: grid; gap: 8px; }
          .mvbd-not-included li { color: #6e6055; font-size: 12px; }
          .mvbd-not-included li::before { content: "×"; margin-right: 8px; color: #5c4d42; }
          .mvbd-selected-plan { margin-top: 18px; padding: 16px; border-radius: 12px; background: rgba(0, 255, 200, 0.05); border: 1px solid rgba(0, 255, 200, 0.15); }
          .mvbd-selected-plan small { display: block; color: #8a9ba8; font-size: 10px; font-weight: 700; letter-spacing: 0.5px; }
          .mvbd-selected-plan strong { display: block; margin-top: 6px; font-size: 16px; color: #ffffff; }
          .mvbd-payment-number { margin-top: 16px; display: flex; align-items: center; justify-content: space-between; gap: 10px; padding: 14px; border-radius: 12px; background: rgba(255, 255, 255, 0.04); border: 1px solid rgba(255, 255, 255, 0.08); }
          .mvbd-payment-number strong { color: #00ffc8; font-size: 16px; letter-spacing: 0.5px; }
          .mvbd-copy-button { border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 8px; padding: 8px 12px; color: #b0c0cc; background: rgba(255, 255, 255, 0.05); cursor: pointer; font-size: 11px; font-weight: 600; }
          .mvbd-input { width: 100%; margin-top: 16px; min-height: 48px; padding: 0 16px; outline: none; border-radius: 12px; border: 1px solid rgba(255, 255, 255, 0.1); color: #ffffff; background: rgba(255, 255, 255, 0.04); font-size: 14px; }
          .mvbd-input:focus { border-color: rgba(0, 255, 200, 0.6); }
          .mvbd-error { margin-top: 12px; padding: 12px; border-radius: 10px; color: #ff9d9d; background: rgba(255, 50, 50, 0.08); font-size: 12px; border: 1px solid rgba(255, 50, 50, 0.15); }
          .mvbd-submit-button { width: 100%; min-height: 50px; margin-top: 16px; border: 0; border-radius: 12px; color: #000000; background: linear-gradient(135deg, #00ffc8, #00b8ff); font-size: 14px; font-weight: 700; cursor: pointer; }
          .mvbd-submit-button:hover { filter: brightness(1.05); }
          .mvbd-processing { text-align: center; padding: 24px 10px; }
          .mvbd-loader { width: 64px; height: 64px; margin: 0 auto 24px; border-radius: 50%; border: 3px solid rgba(255, 255, 255, 0.08); border-top-color: #00ffc8; animation: mvbdSpin 0.8s linear infinite; }
          .mvbd-progress-track { height: 8px; margin-top: 24px; overflow: hidden; border-radius: 99px; background: rgba(255, 255, 255, 0.06); }
          .mvbd-progress-fill { height: 100%; border-radius: inherit; background: linear-gradient(90deg, #00ffc8, #00b8ff); transition: width 0.2s linear; }
          .mvbd-progress-text { margin-top: 12px; color: #8a9ba8; font-size: 12px; font-weight: 600; }
          .mvbd-success { text-align: center; padding: 16px 10px; }
          .mvbd-success-icon { width: 64px; height: 64px; display: grid; place-items: center; margin: 0 auto 20px; border-radius: 50%; color: #000000; background: linear-gradient(135deg, #00ffc8, #00b8ff); font-size: 28px; font-weight: 900; }

          /* ================= ANIMATIONS ================= */
          @keyframes mvbdPulse { 0%, 100% { opacity: 0.4; transform: scale(0.85); } 50% { opacity: 1; transform: scale(1); } }
          @keyframes mvbdModalIn { from { opacity: 0; } to { opacity: 1; } }
          @keyframes mvbdModalScale { from { opacity: 0; transform: translateY(12px) scale(0.97); } to { opacity: 1; transform: translateY(0) scale(1); } }
          @keyframes mvbdSpin { to { transform: rotate(360deg); } }

          /* ================= RESPONSIVE ================= */
          @media (max-width: 1024px) {
            .mvbd-features-grid { grid-template-columns: 1fr 1fr; }
            .mvbd-feature-box.large { grid-column: span 2; }
            .mvbd-feature-box.full { grid-column: span 2; }
            .mvbd-hard-grid { grid-template-columns: 1fr 1fr; }
            .mvbd-pricing-grid { grid-template-columns: 1fr 1fr; }
            .mvbd-price-card.full-width { grid-column: span 2; flex-direction: column; align-items: flex-start; gap: 20px; }
            .mvbd-price-card.full-width .mvbd-price-features.horizontal { flex-direction: column; gap: 12px; }
          }
          @media (max-width: 768px) {
            .mvbd-nav { display: none; }
            .mvbd-features-grid { grid-template-columns: 1fr; }
            .mvbd-feature-box.large { grid-column: span 1; flex-direction: column; }
            .mvbd-feature-box.full { grid-column: span 1; flex-direction: column; align-items: flex-start; }
            .mvbd-hard-grid { grid-template-columns: 1fr; }
            .mvbd-pricing-grid { grid-template-columns: 1fr; }
            .mvbd-price-card.full-width { grid-column: span 1; }
            .mvbd-dashboard-body { flex-direction: column; }
            .mvbd-dash-sidebar { width: 100%; flex-direction: row; justify-content: center; border-right: 0; border-bottom: 1px solid rgba(0, 255, 200, 0.08); }
          }
          @media (max-width: 500px) {
            .mvbd-page-content { width: calc(100% - 24px); }
            .mvbd-premium-header { padding: 10px 14px; }
            .mvbd-premium-hero { padding: 50px 0 40px; }
            .mvbd-premium-hero h1 { font-size: 32px; }
            .mvbd-section-title { font-size: 24px; }
            .mvbd-cta-title { font-size: 24px; }
          }
        `}</style>
      </main>

      {/* ================= FREE ACCESS MODAL ================= */}
      {showFreeAccess && selectedPlan && (
        <ViewportModal onBackdropClick={closeFreeAccess}>
          <div className="mvbd-modal" role="dialog" aria-modal="true">
            <button className="mvbd-modal-close" onClick={closeFreeAccess} aria-label="Close">×</button>
            <div className="mvbd-modal-title">🎁 Free Plan</div>
            <p className="mvbd-modal-subtitle">আপনার Free Plan-এ যেসব access available আছে সেগুলো এখান থেকে ব্যবহার করতে পারবেন।</p>
            <div className="mvbd-free-access-list">
              {(selectedPlan.freeAccess || []).map((item) => {
                if (isRestrictedFreeItem(item)) {
                  return (
                    <div key={item.id} className="mvbd-access-button mvbd-access-restricted">
                      <div className="mvbd-access-icon">🔒</div>
                      <div className="mvbd-access-text"><strong>{item.title}</strong><span>Age-restricted content is unavailable here.</span></div>
                    </div>
                  )
                }
                if (item.type === "external") {
                  return (
                    <a key={item.id} href={item.href} target="_blank" rel="noreferrer" className="mvbd-access-button">
                      <div className="mvbd-access-icon">{item.sticker || "↗"}</div>
                      <div className="mvbd-access-text"><strong>{item.title}</strong><span>{item.description}</span></div>
                      <div className="mvbd-access-arrow">›</div>
                    </a>
                  )
                }
                if (item.type === "mebook") {
                  return (
                    <button key={item.id} className="mvbd-access-button" onClick={() => handleFreeAccess(item)}>
                      <div className="mvbd-access-icon">{item.sticker || "M"}</div>
                      <div className="mvbd-access-text"><strong>{item.title}</strong><span>{item.description}</span></div>
                      <div className="mvbd-access-arrow">›</div>
                    </button>
                  )
                }
                return (
                  <div key={item.id} className="mvbd-access-button mvbd-access-info">
                    <div className="mvbd-access-icon">{item.sticker || "✓"}</div>
                    <div className="mvbd-access-text"><strong>{item.title}</strong><span>{item.description}</span></div>
                  </div>
                )
              })}
            </div>
            {!!selectedPlan.notIncluded?.length && (
              <div className="mvbd-not-included">
                <div className="mvbd-not-included-title">Not included</div>
                <ul>{selectedPlan.notIncluded.map((item) => <li key={item}>{item}</li>)}</ul>
              </div>
            )}
          </div>
        </ViewportModal>
      )}

      {/* ================= PAYMENT MODAL ================= */}
      {showPayment && selectedPlan && (
        <ViewportModal onBackdropClick={closePayment}>
          <div className="mvbd-modal" role="dialog" aria-modal="true">
            <button className="mvbd-modal-close" onClick={closePayment} aria-label="Close">×</button>
            <div className="mvbd-modal-title">💳 Complete Payment</div>
            <p className="mvbd-modal-subtitle">Send the exact plan amount to the payment number below and enter your transaction ID.</p>
            <div className="mvbd-selected-plan">
              <small>SELECTED PLAN</small>
              <strong>{selectedPlan.sticker} {selectedPlan.planName} • {selectedPlan.price}</strong>
            </div>
            <div className="mvbd-payment-number">
              <strong>{PAYMENT_NUMBER}</strong>
              <button className="mvbd-copy-button" onClick={copyNumber}>{copied ? "Copied" : "Copy"}</button>
            </div>
            <input className="mvbd-input" value={transactionId} onChange={(e) => setTransactionId(e.target.value)} placeholder="Enter transaction ID" autoComplete="off" />
            {error && <div className="mvbd-error">{error}</div>}
            <button className="mvbd-submit-button" onClick={submitPayment}>Submit Payment Request</button>
          </div>
        </ViewportModal>
      )}

      {/* ================= PROCESSING MODAL ================= */}
      {showProcessing && (
        <ViewportModal>
          <div className="mvbd-modal" role="dialog" aria-modal="true">
            <div className="mvbd-processing">
              <div className="mvbd-loader" />
              <div className="mvbd-modal-title">⏳ Processing Request</div>
              <p className="mvbd-modal-subtitle">Your payment request has been submitted. Please wait while the request is being processed.</p>
              <div className="mvbd-progress-track"><div className="mvbd-progress-fill" style={{ width: `${progress}%` }} /></div>
              <div className="mvbd-progress-text">{progress}% processing</div>
            </div>
          </div>
        </ViewportModal>
      )}

      {/* ================= SUCCESS MODAL ================= */}
      {showSuccess && (
        <ViewportModal>
          <div className="mvbd-modal" role="dialog" aria-modal="true">
            <div className="mvbd-success">
              <div className="mvbd-success-icon">✓</div>
              <div className="mvbd-modal-title">🎉 Request Submitted</div>
              <p className="mvbd-modal-subtitle">Your subscription request has been submitted successfully. Your membership will be updated after verification.</p>
              <button className="mvbd-submit-button" onClick={closeSuccess}>Done</button>
            </div>
          </div>
        </ViewportModal>
      )}
    </>
  )
}
