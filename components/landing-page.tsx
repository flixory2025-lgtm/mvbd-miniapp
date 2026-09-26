"use client"

import type React from "react"
import { useEffect, useRef } from "react"
import { ArrowDown, ArrowRight, Check, Play, Sparkles } from "lucide-react"

const mobileBackdrop = "https://i.postimg.cc/gkRTC0Mg/9934115925457a81b67404e741f62ffc.jpg"
const desktopBackdrop = "https://i.postimg.cc/7hLqB21s/Netflix-all-movies-and-series-featured-image.jpg"
const desktopPreview = "https://i.postimg.cc/28rC9gGj/Screenshot-2026-09-26-134807.jpg"
const mobilePreview = "https://i.postimg.cc/VNdfBMRZ/Screenshot-20260926-134833-Chrome.jpg"

function Reveal({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const node = ref.current
    if (!node) return
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        node.classList.add("is-visible")
        observer.disconnect()
      }
    }, { threshold: 0.15 })
    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  return <div ref={ref} className={`landing-reveal ${className}`}>{children}</div>
}

export default function LandingPage() {
  return (
    <section className="landing-shell">
      <div className="landing-hero" style={{ "--mobile-bg": `url(${mobileBackdrop})`, "--desktop-bg": `url(${desktopBackdrop})` } as React.CSSProperties}>
        <div className="landing-noise" />
        <nav className="landing-nav" aria-label="Main navigation">
          <a href="#top" className="landing-brand"><span className="brand-mark">M</span><span>MVBD<span className="brand-dot">.</span></span></a>
          <div className="landing-nav-links"><a href="#features">Features</a><a href="#preview">Preview</a><a href="#catalog">Library</a></div>
          <a href="https://mvbds.xyz" className="landing-nav-cta">Visit main site <ArrowRight aria-hidden="true" /></a>
        </nav>

        <div className="landing-hero-content" id="top">
          <Reveal className="hero-copy">
            <div className="eyebrow"><Sparkles aria-hidden="true" /> Your world of cinema</div>
            <h1>Welcome to<br /><em>MoviesVerseBD</em></h1>
            <p className="hero-domain">mvbds.xyz</p>
            <p>Discover the movies, series and anime you love — curated beautifully for the way you watch.</p>
            <div className="hero-actions"><a href="https://mvbds.xyz" className="landing-primary"><Play fill="currentColor" aria-hidden="true" /> Visit main site</a><a href="#preview" className="landing-ghost">See how it works <ArrowDown aria-hidden="true" /></a></div>
            <div className="hero-proof"><span className="proof-dots"><i /><i /><i /><i /></span><span>Built for movie lovers</span><span className="proof-divider" /><span>mvbds.xyz</span></div>
          </Reveal>
          <Reveal className="hero-side-note"><span className="vertical-line" /><span>WATCH<br />WITHOUT<br />LIMITS</span></Reveal>
        </div>
        <div className="hero-bottom-fade" />
      </div>

      <div className="landing-body">
        <Reveal className="intro-row" id="features">
          <p className="section-kicker">THE MVBD EXPERIENCE</p>
          <h2>Less searching.<br /><span>More watching.</span></h2>
          <p className="intro-text">A cinematic space for your next obsession. Fast discovery, a focused interface, and a library that feels made for you.</p>
        </Reveal>

        <div className="feature-grid">
          {[{ n: "01", title: "Find your next favorite", text: "Browse a growing collection across every mood, language and genre." }, { n: "02", title: "Watch your way", text: "A seamless experience that feels just as good on a big screen or in your hand." }, { n: "03", title: "Always something new", text: "Fresh releases and timeless classics, brought together in one place." }].map((feature) => (
            <Reveal key={feature.n} className="feature-card"><span className="feature-number">{feature.n}</span><div><h3>{feature.title}</h3><p>{feature.text}</p></div><Check aria-hidden="true" /></Reveal>
          ))}
        </div>

        <Reveal className="preview-section" id="preview">
          <div className="preview-heading"><div><p className="section-kicker">DESIGNED FOR EVERY SCREEN</p><h2>Looks good.<br /><span>Everywhere.</span></h2></div><p>From your laptop to your late-night scroll, MVBD keeps the spotlight on the stories.</p></div>
          <div className="devices-stage">
            <div className="device-laptop"><div className="laptop-screen"><img src={desktopPreview} alt="MVBD desktop interface preview" /></div><div className="laptop-base" /></div>
            <div className="device-phone"><div className="phone-speaker" /><img src={mobilePreview} alt="MVBD mobile interface preview" /></div>
            <div className="stage-glow" />
          </div>
        </Reveal>

        <Reveal className="landing-cta"><div><p className="section-kicker">YOUR NEXT WATCH IS WAITING</p><h2>Make tonight<br /><span>movie night.</span></h2></div><a href="https://mvbds.xyz" className="landing-primary">Visit main site <ArrowRight aria-hidden="true" /></a></Reveal>
        <footer className="landing-footer"><a href="#top" className="landing-brand"><span className="brand-mark">M</span><span>MVBD<span className="brand-dot">.</span></span></a><span>© 2026 MVBD. Made for the stories.</span><span>mvbds.xyz</span></footer>
      </div>
    </section>
  )
}
