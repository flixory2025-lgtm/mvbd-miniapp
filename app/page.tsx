"use client"

import { useEffect, useState } from "react"
import { ArrowUp, ChevronDown, ExternalLink, Menu, Play, Send, Sparkles, X } from "lucide-react"
import "./landing.css"

const TELEGRAM_URL = "https://t.me/addlist/G-AjTDjHEW0yYTJl"
const OFFICIAL_URL = "https://mvbds.xyz/home"
const mobileBackground = "https://i.postimg.cc/gkRTC0Mg/9934115925457a81b67404e741f62ffc.jpg"
const desktopBackground = "https://i.postimg.cc/7hLqB21s/Netflix-all-movies-and-series-featured-image.jpg"
const desktopPreview = "https://i.postimg.cc/28rC9gGj/Screenshot-2026-09-26-134807.jpg"
const mobilePreview = "https://i.postimg.cc/VNdfBMRZ/Screenshot-20260926-134833-Chrome.jpg"
const faqs = [["Is MoviesVerseBD free to use?", "Browse the collection and follow the official links for each title."], ["What languages are available?", "Bangla, Hindi, English, Korean and South Indian titles are featured."], ["How do I watch a movie?", "Choose a title, review its availability, then continue through the official link."], ["Where can I find updates?", "Join the official Telegram channel for new releases and announcements."]]

export default function Home() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => entries.forEach((entry) => entry.isIntersecting && entry.target.classList.add("is-visible")), { threshold: 0.12 })
    document.querySelectorAll(".reveal").forEach((element) => observer.observe(element))
    return () => observer.disconnect()
  }, [])

  return <main className="mvbd-landing" style={{ "--mobile-bg": `url(${mobileBackground})`, "--desktop-bg": `url(${desktopBackground})` } as React.CSSProperties}>
    <header className="site-header"><a className="brand" href="#top" aria-label="MoviesVerseBD home"><span>Movies</span>Verse<span>BD</span><b>.xyz</b></a><nav className="desktop-nav"><a href="#top">Home</a><a href="#features">Explore</a><a href="#preview">Preview</a><a href="#faq">FAQ</a></nav><button className="menu-button" onClick={() => setMenuOpen(!menuOpen)} aria-label={menuOpen ? "Close menu" : "Open menu"} aria-expanded={menuOpen}>{menuOpen ? <X /> : <Menu />}</button>{menuOpen && <nav className="mobile-menu"><a href="#top" onClick={() => setMenuOpen(false)}>Home</a><a href="#features" onClick={() => setMenuOpen(false)}>Explore</a><a href="#preview" onClick={() => setMenuOpen(false)}>Preview</a><a href="#faq" onClick={() => setMenuOpen(false)}>FAQ</a></nav>}</header>
    <section id="top" className="hero content-width reveal"><div className="hero-copy"><div className="notice"><Sparkles size={16} /> নতুন রিলিজ ও আপডেট পেতে আমাদের সাথে থাকুন</div><p className="eyebrow">Your gateway to entertainment</p><h1>Discover Movies @ <strong>MoviesVerseBD.xyz</strong></h1><p className="hero-text">Hollywood, Bollywood, Bangla, South Indian and Korean entertainment — curated in one beautifully simple place.</p><div className="hero-actions"><a className="primary-button" href={OFFICIAL_URL} target="_blank" rel="noreferrer"><Play size={18} fill="currentColor" /> Visit official site</a><a className="secondary-button" href={TELEGRAM_URL} target="_blank" rel="noreferrer"><Send size={18} /> Telegram updates</a></div><p className="helper">Always check <b>mvbds.xyz</b> for the latest official links.</p></div><div className="hero-art"><div className="art-glow" /><div className="floating-card card-one">Now streaming</div><div className="floating-card card-two">4K <span>Ultra HD</span></div><div className="art-screen"><span>MVBD</span><div className="screen-line" /><div className="screen-grid"><i /><i /><i /><i /></div></div></div></section>
    <section id="features" className="glass-panel feature-strip content-width reveal"><div><b>Huge collection</b><span>Movies, series & anime</span></div><div><b>Multi-language</b><span>Bangla, Hindi & English</span></div><div><b>Ultra HD</b><span>Sharp, smooth streaming</span></div></section>
    <section className="glass-panel intro content-width reveal"><h2>MoviesVerseBD is your home for <em>great entertainment.</em></h2><p>Find your next favourite story with an easy-to-use experience, a growing catalogue and fast access to official viewing destinations.</p></section>
    <section className="glass-panel steps content-width reveal"><SectionTitle title="কীভাবে শুরু করবেন" accent="সহজে" /><div className="step-grid"><Step number="01" title="একটি টাইটেল বেছে নিন" text="আপনার পছন্দের সিনেমা বা সিরিজ খুঁজে নিন।" /><Step number="02" title="ডিটেইলস দেখুন" text="ভাষা, কোয়ালিটি ও availability যাচাই করুন।" /><Step number="03" title="অফিশিয়াল লিংকে যান" text="নিরাপদে official destination থেকে শুরু করুন।" /></div></section>
    <section id="preview" className="glass-panel preview-section content-width reveal"><SectionTitle title="Made for every" accent="screen" /><div className="preview-grid"><figure><div className="laptop-frame"><img src={desktopPreview} alt="MoviesVerseBD desktop preview" /></div><figcaption>Laptop experience</figcaption></figure><figure><div className="phone-frame"><img src={mobilePreview} alt="MoviesVerseBD mobile preview" /></div><figcaption>Mobile experience</figcaption></figure></div></section>
    <section id="faq" className="glass-panel faq content-width reveal"><SectionTitle title="Frequently Asked" accent="Questions" />{faqs.map(([question, answer], index) => <div className="faq-item" key={question}><button onClick={() => setOpenFaq(openFaq === index ? null : index)} aria-expanded={openFaq === index}><span>{question}</span><ChevronDown className={openFaq === index ? "rotate" : ""} /></button>{openFaq === index && <p>{answer}</p>}</div>)}</section>
    <section id="domains" className="glass-panel domains content-width reveal"><SectionTitle title="Our Official" accent="Links" /><a className="domain-row active" href={OFFICIAL_URL} target="_blank" rel="noreferrer"><span>mvbds.xyz/home</span><b>VISIT SITE <ExternalLink size={14} /></b></a><a className="domain-row" href={TELEGRAM_URL} target="_blank" rel="noreferrer"><span>Telegram updates</span><b>JOIN NOW <Send size={14} /></b></a></section>
    <footer className="footer content-width"><a className="brand" href="#top"><span>Movies</span>Verse<span>BD</span><b>.xyz</b></a><p>MoviesVerseBD does not host files. Availability and rights belong to their respective owners. Please use official services and respect copyright.</p><small>© 2026 MoviesVerseBD. All rights reserved.</small></footer><a className="back-top" href="#top" aria-label="Back to top"><ArrowUp /></a><nav className="bottom-nav"><a className="active" href="#top"><Sparkles /><span>Home</span></a><a href="#preview"><ExternalLink /><span>Preview</span></a><a href={TELEGRAM_URL} target="_blank" rel="noreferrer"><Send /><span>Telegram</span></a></nav>
  </main>
}
function SectionTitle({ title, accent }: { title: string; accent: string }) { return <div className="section-title"><h2>{title} <em>{accent}</em></h2><i /></div> }
function Step({ number, title, text }: { number: string; title: string; text: string }) { return <article className="step"><strong>{number}</strong><div><h3>{title}</h3><p>{text}</p></div></article> }

