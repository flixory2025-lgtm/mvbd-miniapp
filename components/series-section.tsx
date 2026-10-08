"use client"

import {
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react"
import { createPortal } from "react-dom"

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

export default function SeriesSection() {
  const [openFaq, setOpenFaq] = useState<number | null>(0)
  const [selectedPlan, setSelectedPlan] = useState<any>(null)
  const [showPayment, setShowPayment] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [transactionId, setTransactionId] = useState("")
  const [error, setError] = useState("")
  const [copied, setCopied] = useState(false)

  /* =======================================================
     HANDLERS
  ======================================================= */

  const openPlan = (plan: any) => {
    setSelectedPlan(plan)
    setError("")
    setTransactionId("")
    setCopied(false)
    setShowPayment(true)
  }

  const closePayment = () => {
    setShowPayment(false)
    setError("")
  }

  const copyNumber = async () => {
    try {
      await navigator.clipboard.writeText("01700000000")
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch {
      setCopied(false)
    }
  }

  const submitPayment = () => {
    if (!transactionId || transactionId.length < 3) {
      setError("Please enter a valid transaction ID.")
      return
    }
    setShowPayment(false)
    setShowSuccess(true)
  }

  const closeSuccess = () => {
    setShowSuccess(false)
    setSelectedPlan(null)
    setTransactionId("")
    setError("")
  }

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <>
      <main className="mvbd-main">
        {/* =================================================
            BACKGROUND (No Image, Pure CSS Gradient)
        ================================================= */}
        <div className="mvbd-bg-gradient" />
        <div className="mvbd-bg-glow" />

        <div className="mvbd-container">
          
          {/* =================================================
              HEADER
          ================================================= */}
          <header className="mvbd-header">
            <div className="mvbd-logo">
              <div className="mvbd-logo-icon">M</div>
              <span>MoviesVerseBD</span>
            </div>
            <nav className="mvbd-nav">
              <a href="#">Home</a>
              <a href="#">Features</a>
              <a href="#">Pricing</a>
              <a href="#">FAQ</a>
            </nav>
            <div className="mvbd-header-actions">
              <button className="mvbd-btn-outline">Sign In</button>
              <button className="mvbd-btn-primary">Get Started</button>
            </div>
          </header>

          {/* =================================================
              HERO SECTION
          ================================================= */}
          <section className="mvbd-hero">
            <div className="mvbd-hero-badge">✦ AI-POWERED BOOKKEEPING</div>
            <h1 className="mvbd-hero-title">
              Books Done.<br />
              <span>Stress is Gone.</span>
            </h1>
            <p className="mvbd-hero-desc">
              Automate your bookkeeping with AI. Close your books in days, not months.
            </p>
            <button className="mvbd-btn-hero">Get Started Free</button>
            
            {/* Dashboard Mockup */}
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
          </section>

          {/* =================================================
              FEATURES SECTION
          ================================================= */}
          <section className="mvbd-section">
            <div className="mvbd-section-badge">✦ FEATURES</div>
            <h2 className="mvbd-section-title">Why Businesses Choose MoviesVerseBD?</h2>
            <p className="mvbd-section-subtitle">Everything you need to manage your finances in one place.</p>

            <div className="mvbd-features-grid">
              {/* Box 1 */}
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

              {/* Box 2 */}
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

              {/* Box 3 */}
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

              {/* Box 4 - Integrations */}
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
              PRICING SECTION
          ================================================= */}
          <section className="mvbd-section">
            <div className="mvbd-section-badge">✦ PRICING</div>
            <h2 className="mvbd-section-title">Choose the Right Plan for You</h2>
            <p className="mvbd-section-subtitle">Simple, transparent pricing for every stage of your business.</p>

            <div className="mvbd-pricing-grid">
              {/* Starter */}
              <div className="mvbd-price-card">
                <div className="mvbd-price-header">
                  <h3>Starter</h3>
                  <p>For individuals</p>
                </div>
                <div className="mvbd-price-amount">$250<span>/mo</span></div>
                <ul className="mvbd-price-features">
                  <li>✓ 1 User</li>
                  <li>✓ 100 Transactions</li>
                  <li>✓ Basic Reports</li>
                  <li>✓ Email Support</li>
                </ul>
                <button className="mvbd-btn-price" onClick={() => openPlan({ name: "Starter", price: "$250" })}>Get Started</button>
              </div>

              {/* Scale */}
              <div className="mvbd-price-card popular">
                <div className="mvbd-popular-badge">MOST POPULAR</div>
                <div className="mvbd-price-header">
                  <h3>Scale</h3>
                  <p>For growing teams</p>
                </div>
                <div className="mvbd-price-amount">$700<span>/mo</span></div>
                <ul className="mvbd-price-features">
                  <li>✓ 5 Users</li>
                  <li>✓ Unlimited Transactions</li>
                  <li>✓ Advanced Reports</li>
                  <li>✓ Priority Support</li>
                </ul>
                <button className="mvbd-btn-price primary" onClick={() => openPlan({ name: "Scale", price: "$700" })}>Get Started</button>
              </div>

              {/* Growth */}
              <div className="mvbd-price-card">
                <div className="mvbd-price-header">
                  <h3>Growth</h3>
                  <p>For scaling teams</p>
                </div>
                <div className="mvbd-price-amount">$450<span>/mo</span></div>
                <ul className="mvbd-price-features">
                  <li>✓ 10 Users</li>
                  <li>✓ Unlimited Transactions</li>
                  <li>✓ Custom Reports</li>
                  <li>✓ 24/7 Support</li>
                </ul>
                <button className="mvbd-btn-price" onClick={() => openPlan({ name: "Growth", price: "$450" })}>Get Started</button>
              </div>

              {/* Enterprise */}
              <div className="mvbd-price-card full-width">
                <div className="mvbd-price-header">
                  <h3>Enterprise</h3>
                  <p>For large organizations</p>
                </div>
                <div className="mvbd-price-amount">Custom</div>
                <ul className="mvbd-price-features horizontal">
                  <li>✓ Unlimited Users</li>
                  <li>✓ Dedicated Account Manager</li>
                  <li>✓ Custom Integrations</li>
                  <li>✓ SLA Guarantee</li>
                </ul>
                <button className="mvbd-btn-price" onClick={() => openPlan({ name: "Enterprise", price: "Custom" })}>Contact Sales</button>
              </div>
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
              <button className="mvbd-btn-hero">Get Started Free</button>
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
            GLOBAL CSS
        ================================================= */}
        <style jsx global>{`
          * { box-sizing: border-box; margin: 0; padding: 0; }

          /* ================= PAGE ================= */
          .mvbd-main {
            position: relative;
            min-height: 100svh;
            width: 100%;
            overflow-x: hidden;
            background: #000000;
            color: #ffffff;
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
            isolation: isolate;
          }

          /* ================= BACKGROUND (Pure CSS) ================= */
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

          /* ================= CONTAINER ================= */
          .mvbd-container {
            position: relative;
            z-index: 1;
            width: min(1200px, calc(100% - 40px));
            margin: 0 auto;
            padding: 20px 0 60px;
          }

          /* ================= HEADER ================= */
          .mvbd-header {
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

          .mvbd-logo {
            display: flex;
            align-items: center;
            gap: 10px;
            font-weight: 700;
            font-size: 16px;
            letter-spacing: -0.5px;
          }
          .mvbd-logo-icon {
            width: 32px;
            height: 32px;
            display: grid;
            place-items: center;
            border-radius: 8px;
            font-size: 16px;
            font-weight: 900;
            color: #000000;
            background: linear-gradient(135deg, #00ffc8, #00b8ff);
          }
          .mvbd-logo-icon.small {
            width: 24px;
            height: 24px;
            font-size: 12px;
          }

          .mvbd-nav {
            display: flex;
            gap: 28px;
          }
          .mvbd-nav a {
            color: #8a9ba8;
            font-size: 13px;
            font-weight: 500;
            text-decoration: none;
            transition: color 0.2s;
          }
          .mvbd-nav a:hover {
            color: #00ffc8;
          }

          .mvbd-header-actions {
            display: flex;
            gap: 10px;
          }
          .mvbd-btn-outline {
            padding: 8px 18px;
            border-radius: 8px;
            border: 1px solid rgba(0, 255, 200, 0.3);
            background: transparent;
            color: #00ffc8;
            font-size: 12px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s;
          }
          .mvbd-btn-outline:hover {
            background: rgba(0, 255, 200, 0.1);
          }
          .mvbd-btn-primary {
            padding: 8px 18px;
            border-radius: 8px;
            border: 0;
            background: linear-gradient(135deg, #00ffc8, #00b8ff);
            color: #000000;
            font-size: 12px;
            font-weight: 700;
            cursor: pointer;
          }

          /* ================= HERO ================= */
          .mvbd-hero {
            text-align: center;
            padding: 80px 16px 60px;
          }
          .mvbd-hero-badge {
            display: inline-block;
            padding: 6px 16px;
            border-radius: 999px;
            border: 1px solid rgba(0, 255, 200, 0.2);
            background: rgba(0, 255, 200, 0.05);
            color: #00ffc8;
            font-size: 10px;
            font-weight: 700;
            letter-spacing: 1px;
            margin-bottom: 24px;
          }
          .mvbd-hero-title {
            font-size: clamp(36px, 6vw, 72px);
            line-height: 1.05;
            font-weight: 800;
            letter-spacing: -2px;
            color: #ffffff;
          }
          .mvbd-hero-title span {
            color: #00ffc8;
            text-shadow: 0 0 40px rgba(0, 255, 200, 0.3);
          }
          .mvbd-hero-desc {
            margin: 20px auto 0;
            max-width: 500px;
            color: #8a9ba8;
            font-size: 15px;
            line-height: 1.7;
          }
          .mvbd-btn-hero {
            margin-top: 30px;
            padding: 14px 40px;
            border-radius: 999px;
            border: 0;
            font-size: 15px;
            font-weight: 700;
            color: #000000;
            background: linear-gradient(135deg, #00ffc8, #00b8ff);
            cursor: pointer;
            transition: transform 0.2s, box-shadow 0.2s;
          }
          .mvbd-btn-hero:hover {
            transform: translateY(-2px);
            box-shadow: 0 0 40px rgba(0, 255, 200, 0.4);
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
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 12px 18px;
            border-bottom: 1px solid rgba(0, 255, 200, 0.1);
            background: rgba(0, 0, 0, 0.5);
          }
          .mvbd-dot {
            width: 10px;
            height: 10px;
            border-radius: 50%;
          }
          .mvbd-dot.red { background: #ff5f56; }
          .mvbd-dot.yellow { background: #ffbd2e; }
          .mvbd-dot.green { background: #27c93f; }
          .mvbd-dashboard-title {
            margin-left: 10px;
            font-size: 11px;
            color: #8a9ba8;
          }
          .mvbd-dashboard-body {
            display: flex;
            min-height: 300px;
          }
          .mvbd-dash-sidebar {
            width: 60px;
            padding: 16px 0;
            border-right: 1px solid rgba(0, 255, 200, 0.08);
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 16px;
          }
          .mvbd-dash-item {
            width: 28px;
            height: 28px;
            border-radius: 6px;
            background: rgba(255, 255, 255, 0.05);
          }
          .mvbd-dash-item.active {
            background: rgba(0, 255, 200, 0.15);
            border: 1px solid rgba(0, 255, 200, 0.3);
          }
          .mvbd-dash-main {
            flex: 1;
            padding: 20px;
            display: grid;
            gap: 16px;
          }
          .mvbd-dash-card {
            height: 60px;
            border-radius: 8px;
            background: rgba(255, 255, 255, 0.03);
            border: 1px solid rgba(0, 255, 200, 0.08);
          }
          .mvbd-dash-row {
            display: flex;
            gap: 16px;
          }
          .mvbd-dash-chart {
            flex: 1;
            height: 120px;
            border-radius: 8px;
            background: linear-gradient(180deg, rgba(0, 255, 200, 0.05), transparent);
            border: 1px solid rgba(0, 255, 200, 0.1);
          }
          .mvbd-dash-list {
            flex: 1;
            display: grid;
            gap: 10px;
          }
          .mvbd-dash-list-item {
            height: 32px;
            border-radius: 6px;
            background: rgba(255, 255, 255, 0.03);
          }

          /* ================= SECTIONS ================= */
          .mvbd-section {
            margin-top: 100px;
            text-align: center;
          }
          .mvbd-section-badge {
            display: inline-block;
            padding: 4px 14px;
            border-radius: 999px;
            border: 1px solid rgba(0, 255, 200, 0.2);
            background: rgba(0, 255, 200, 0.05);
            color: #00ffc8;
            font-size: 9px;
            font-weight: 700;
            letter-spacing: 1px;
            margin-bottom: 20px;
          }
          .mvbd-section-title {
            font-size: clamp(28px, 4vw, 44px);
            font-weight: 800;
            letter-spacing: -1.5px;
            color: #ffffff;
            line-height: 1.15;
          }
          .mvbd-section-subtitle {
            margin: 16px auto 0;
            max-width: 500px;
            color: #8a9ba8;
            font-size: 14px;
            line-height: 1.6;
          }

          /* ================= FEATURES GRID ================= */
          .mvbd-features-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 20px;
            margin-top: 50px;
            text-align: left;
          }
          .mvbd-feature-box {
            padding: 28px;
            border-radius: 20px;
            border: 1px solid rgba(0, 255, 200, 0.12);
            background: rgba(0, 0, 0, 0.6);
            display: flex;
            flex-direction: column;
            gap: 20px;
            transition: border-color 0.3s;
          }
          .mvbd-feature-box:hover {
            border-color: rgba(0, 255, 200, 0.4);
          }
          .mvbd-feature-box.large {
            grid-column: span 2;
            flex-direction: row;
            align-items: center;
          }
          .mvbd-feature-box.full {
            grid-column: span 3;
            flex-direction: row;
            align-items: center;
            justify-content: space-between;
          }
          .mvbd-feature-content h3 {
            font-size: 20px;
            font-weight: 700;
            color: #ffffff;
            margin-bottom: 8px;
          }
          .mvbd-feature-content p {
            font-size: 13px;
            color: #8a9ba8;
            line-height: 1.6;
            margin-bottom: 16px;
          }
          .mvbd-btn-small {
            padding: 8px 18px;
            border-radius: 8px;
            border: 1px solid rgba(0, 255, 200, 0.3);
            background: transparent;
            color: #00ffc8;
            font-size: 11px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s;
          }
          .mvbd-btn-small:hover {
            background: rgba(0, 255, 200, 0.1);
          }
          .mvbd-feature-visual {
            flex: 1;
            display: flex;
            justify-content: center;
            align-items: center;
          }
          .mvbd-visual-card {
            width: 100%;
            max-width: 180px;
            padding: 16px;
            border-radius: 12px;
            border: 1px solid rgba(0, 255, 200, 0.15);
            background: rgba(0, 255, 200, 0.03);
          }
          .mvbd-visual-line {
            height: 8px;
            border-radius: 4px;
            background: rgba(0, 255, 200, 0.15);
            margin-bottom: 8px;
          }
          .mvbd-visual-line.short {
            width: 60%;
          }
          .mvbd-visual-circle {
            width: 40px;
            height: 40px;
            border-radius: 50%;
            border: 2px solid rgba(0, 255, 200, 0.3);
            margin-top: 12px;
          }
          .mvbd-visual-chart {
            width: 80px;
            height: 80px;
            border-radius: 50%;
            border: 4px solid rgba(0, 255, 200, 0.1);
            border-top-color: #00ffc8;
          }
          .mvbd-visual-bars {
            display: flex;
            gap: 6px;
            align-items: flex-end;
            height: 60px;
          }
          .mvbd-bar {
            width: 12px;
            border-radius: 4px;
            background: linear-gradient(180deg, #00ffc8, #00b8ff);
          }
          .mvbd-bar:nth-child(1) { height: 30%; }
          .mvbd-bar:nth-child(2) { height: 60%; }
          .mvbd-bar:nth-child(3) { height: 100%; }
          .mvbd-integrations {
            display: flex;
            gap: 16px;
          }
          .mvbd-int-icon {
            width: 48px;
            height: 48px;
            display: grid;
            place-items: center;
            border-radius: 12px;
            font-size: 20px;
            border: 1px solid rgba(0, 255, 200, 0.15);
            background: rgba(0, 255, 200, 0.03);
          }

          /* ================= HARD GRID ================= */
          .mvbd-hard-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 20px;
            margin-top: 50px;
            text-align: left;
          }
          .mvbd-hard-box {
            padding: 28px;
            border-radius: 20px;
            border: 1px solid rgba(0, 255, 200, 0.12);
            background: rgba(0, 0, 0, 0.6);
            transition: border-color 0.3s;
          }
          .mvbd-hard-box:hover {
            border-color: rgba(0, 255, 200, 0.4);
          }
          .mvbd-hard-icon {
            width: 44px;
            height: 44px;
            display: grid;
            place-items: center;
            border-radius: 12px;
            font-size: 20px;
            border: 1px solid rgba(0, 255, 200, 0.15);
            background: rgba(0, 255, 200, 0.05);
            margin-bottom: 18px;
          }
          .mvbd-hard-box h3 {
            font-size: 16px;
            font-weight: 700;
            color: #ffffff;
            margin-bottom: 8px;
          }
          .mvbd-hard-box p {
            font-size: 12px;
            color: #8a9ba8;
            line-height: 1.6;
            margin-bottom: 16px;
          }

          /* ================= PRICING ================= */
          .mvbd-pricing-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 20px;
            margin-top: 50px;
            text-align: left;
          }
          .mvbd-price-card {
            position: relative;
            padding: 32px 28px;
            border-radius: 20px;
            border: 1px solid rgba(0, 255, 200, 0.12);
            background: rgba(0, 0, 0, 0.6);
            display: flex;
            flex-direction: column;
            transition: border-color 0.3s, transform 0.3s;
          }
          .mvbd-price-card:hover {
            border-color: rgba(0, 255, 200, 0.4);
            transform: translateY(-4px);
          }
          .mvbd-price-card.popular {
            border-color: rgba(0, 255, 200, 0.5);
            background: rgba(0, 255, 200, 0.03);
            box-shadow: 0 0 40px rgba(0, 255, 200, 0.08);
          }
          .mvbd-popular-badge {
            position: absolute;
            top: -10px;
            left: 50%;
            transform: translateX(-50%);
            padding: 4px 14px;
            border-radius: 999px;
            font-size: 9px;
            font-weight: 800;
            letter-spacing: 0.5px;
            color: #000000;
            background: linear-gradient(135deg, #00ffc8, #00b8ff);
            white-space: nowrap;
          }
          .mvbd-price-header h3 {
            font-size: 18px;
            font-weight: 700;
            color: #ffffff;
          }
          .mvbd-price-header p {
            font-size: 12px;
            color: #8a9ba8;
            margin-top: 4px;
          }
          .mvbd-price-amount {
            font-size: 36px;
            font-weight: 800;
            color: #ffffff;
            margin: 20px 0;
            letter-spacing: -1px;
          }
          .mvbd-price-amount span {
            font-size: 14px;
            font-weight: 400;
            color: #8a9ba8;
          }
          .mvbd-price-features {
            list-style: none;
            display: grid;
            gap: 12px;
            margin-bottom: 24px;
            flex: 1;
          }
          .mvbd-price-features li {
            font-size: 13px;
            color: #b0c0cc;
          }
          .mvbd-btn-price {
            width: 100%;
            padding: 12px;
            border-radius: 10px;
            border: 1px solid rgba(0, 255, 200, 0.3);
            background: transparent;
            color: #00ffc8;
            font-size: 13px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s;
          }
          .mvbd-btn-price:hover {
            background: rgba(0, 255, 200, 0.1);
          }
          .mvbd-btn-price.primary {
            background: linear-gradient(135deg, #00ffc8, #00b8ff);
            color: #000000;
            border: 0;
          }
          .mvbd-price-card.full-width {
            grid-column: span 3;
            flex-direction: row;
            align-items: center;
            gap: 40px;
            text-align: left;
          }
          .mvbd-price-card.full-width .mvbd-price-features.horizontal {
            display: flex;
            flex-direction: row;
            gap: 24px;
            margin-bottom: 0;
            flex: 1;
          }
          .mvbd-price-card.full-width .mvbd-btn-price {
            width: auto;
            padding: 12px 32px;
          }

          /* ================= FAQ ================= */
          .mvbd-faq-list {
            max-width: 700px;
            margin: 50px auto 0;
            display: grid;
            gap: 12px;
          }
          .mvbd-faq-item {
            border-radius: 14px;
            border: 1px solid rgba(0, 255, 200, 0.12);
            background: rgba(0, 0, 0, 0.6);
            overflow: hidden;
            cursor: pointer;
            transition: border-color 0.3s;
          }
          .mvbd-faq-item:hover {
            border-color: rgba(0, 255, 200, 0.4);
          }
          .mvbd-faq-question {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 20px 24px;
            font-size: 15px;
            font-weight: 600;
            color: #ffffff;
            text-align: left;
          }
          .mvbd-faq-icon {
            font-size: 18px;
            color: #00ffc8;
            font-weight: 300;
          }
          .mvbd-faq-answer {
            padding: 0 24px 20px;
            font-size: 13px;
            line-height: 1.7;
            color: #8a9ba8;
            text-align: left;
            border-top: 1px solid rgba(0, 255, 200, 0.08);
            padding-top: 16px;
          }

          /* ================= CTA ================= */
          .mvbd-cta-section {
            position: relative;
            margin-top: 100px;
            padding: 80px 20px;
            text-align: center;
            border-radius: 24px;
            border: 1px solid rgba(0, 255, 200, 0.2);
            background: rgba(0, 0, 0, 0.8);
            overflow: hidden;
          }
          .mvbd-cta-glow {
            position: absolute;
            top: 0;
            left: 50%;
            transform: translateX(-50%);
            width: 100%;
            height: 100%;
            background: radial-gradient(ellipse at top, rgba(0, 255, 200, 0.1) 0%, transparent 60%);
            pointer-events: none;
          }
          .mvbd-cta-content {
            position: relative;
            z-index: 1;
          }
          .mvbd-cta-icon {
            font-size: 32px;
            margin-bottom: 20px;
            color: #00ffc8;
          }
          .mvbd-cta-title {
            font-size: clamp(28px, 4vw, 44px);
            font-weight: 800;
            letter-spacing: -1.5px;
            color: #ffffff;
            line-height: 1.15;
          }
          .mvbd-cta-desc {
            margin: 16px auto 0;
            max-width: 400px;
            color: #8a9ba8;
            font-size: 14px;
            line-height: 1.6;
          }

          /* ================= FOOTER ================= */
          .mvbd-footer {
            margin-top: 80px;
            padding: 40px 0;
            border-top: 1px solid rgba(0, 255, 200, 0.1);
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 16px;
          }
          .mvbd-footer-brand {
            display: flex;
            align-items: center;
            gap: 10px;
            font-weight: 700;
            font-size: 15px;
          }
          .mvbd-footer-copy {
            color: #5c6b75;
            font-size: 12px;
          }

          /* ================= MODALS ================= */
          .mvbd-modal-backdrop {
            position: fixed; inset: 0; z-index: 99999;
            display: flex; align-items: center; justify-content: center;
            padding: 18px; background: rgba(0, 0, 0, 0.85);
            backdrop-filter: blur(8px);
            animation: mvbdModalIn 0.2s ease both;
          }
          .mvbd-modal {
            width: min(440px, 100%);
            max-height: min(88svh, 700px);
            overflow-y: auto;
            padding: 28px;
            border-radius: 20px;
            border: 1px solid rgba(0, 255, 200, 0.2);
            background: #020b14;
            box-shadow: 0 30px 90px rgba(0, 0, 0, 0.9);
            animation: mvbdModalScale 0.24s cubic-bezier(0.2, 0.8, 0.2, 1) both;
          }
          .mvbd-modal::-webkit-scrollbar { width: 4px; }
          .mvbd-modal::-webkit-scrollbar-thumb { background: #1a4a44; border-radius: 99px; }
          .mvbd-modal-title { font-size: 20px; font-weight: 700; color: #ffffff; }
          .mvbd-modal-subtitle { margin-top: 8px; color: #8a9ba8; font-size: 13px; line-height: 1.6; }
          .mvbd-modal-close {
            float: right; width: 32px; height: 32px;
            border: 0; border-radius: 50%;
            color: #8a9ba8; background: rgba(255, 255, 255, 0.06);
            cursor: pointer; font-size: 16px;
          }
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
          .mvbd-success { text-align: center; padding: 16px 10px; }
          .mvbd-success-icon { width: 64px; height: 64px; display: grid; place-items: center; margin: 0 auto 20px; border-radius: 50%; color: #000000; background: linear-gradient(135deg, #00ffc8, #00b8ff); font-size: 28px; font-weight: 900; }

          /* ================= ANIMATIONS ================= */
          @keyframes mvbdModalIn { from { opacity: 0; } to { opacity: 1; } }
          @keyframes mvbdModalScale { from { opacity: 0; transform: translateY(12px) scale(0.97); } to { opacity: 1; transform: translateY(0) scale(1); } }

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
            .mvbd-container { width: calc(100% - 24px); }
            .mvbd-header { padding: 10px 14px; }
            .mvbd-header-actions .mvbd-btn-outline { display: none; }
            .mvbd-hero { padding: 50px 0 40px; }
            .mvbd-hero-title { font-size: 32px; }
            .mvbd-section-title { font-size: 24px; }
            .mvbd-cta-title { font-size: 24px; }
          }
        `}</style>
      </main>

      {/* ================= PAYMENT MODAL ================= */}
      {showPayment && selectedPlan && (
        <ViewportModal onBackdropClick={closePayment}>
          <div className="mvbd-modal" role="dialog" aria-modal="true">
            <button className="mvbd-modal-close" onClick={closePayment} aria-label="Close">×</button>
            <div className="mvbd-modal-title">💳 Complete Payment</div>
            <p className="mvbd-modal-subtitle">Send the exact plan amount to the payment number below and enter your transaction ID.</p>
            <div className="mvbd-selected-plan">
              <small>SELECTED PLAN</small>
              <strong>{selectedPlan.name} • {selectedPlan.price}</strong>
            </div>
            <div className="mvbd-payment-number">
              <strong>01700000000</strong>
              <button className="mvbd-copy-button" onClick={copyNumber}>{copied ? "Copied" : "Copy"}</button>
            </div>
            <input className="mvbd-input" value={transactionId} onChange={(e) => setTransactionId(e.target.value)} placeholder="Enter transaction ID" autoComplete="off" />
            {error && <div className="mvbd-error">{error}</div>}
            <button className="mvbd-submit-button" onClick={submitPayment}>Submit Payment Request</button>
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
