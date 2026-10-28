"use client"

import { useEffect, useRef } from "react"

type SocialPlatform =
  | "facebook"
  | "telegram"
  | "instagram"
  | "whatsapp"
  | "youtube"
  | "tiktok"
  | "threads"

interface SocialLink {
  name: string
  label: string
  url: string
  platform: SocialPlatform
}

/* =========================================================
   BRAND SVG ICONS (sizes set via attributes, no scoped CSS)
   ========================================================= */

const svgProps = {
  viewBox: "0 0 24 24",
  width: 22,
  height: 22,
  "aria-hidden": true,
  focusable: false,
} as const

function FacebookIcon() {
  return (
    <svg {...svgProps}>
      <path
        fill="currentColor"
        d="M13.5 21v-8h2.7l.4-3h-3.1V8.08c0-.87.24-1.46 1.5-1.46h1.7V3.94c-.29-.04-1.29-.12-2.46-.12-2.44 0-4.11 1.49-4.11 4.23V10H7.5v3h2.63v8h3.37Z"
      />
    </svg>
  )
}

function InstagramIcon() {
  return (
    <svg {...svgProps}>
      <rect x="3.2" y="3.2" width="17.6" height="17.6" rx="5" fill="none" stroke="currentColor" strokeWidth="2" />
      <circle cx="12" cy="12" r="4.1" fill="none" stroke="currentColor" strokeWidth="2" />
      <circle cx="17.45" cy="6.65" r="1.2" fill="currentColor" />
    </svg>
  )
}

function YoutubeIcon() {
  return (
    <svg {...svgProps}>
      <path
        fill="currentColor"
        d="M23.5 6.2a3 3 0 0 0-2.12-2.12C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.38.58A3 3 0 0 0 .5 6.2 31.2 31.2 0 0 0 0 12a31.2 31.2 0 0 0 .5 5.8 3 3 0 0 0 2.12 2.12C4.5 20.5 12 20.5 12 20.5s7.5 0 9.38-.58a3 3 0 0 0 2.12-2.12A31.2 31.2 0 0 0 24 12a31.2 31.2 0 0 0-.5-5.8ZM9.6 15.85v-7.7L16 12l-6.4 3.85Z"
      />
    </svg>
  )
}

function TelegramIcon() {
  return (
    <svg {...svgProps}>
      <path
        fill="currentColor"
        d="M21.9 4.1 18.7 19c-.24 1.05-.86 1.31-1.74.82l-4.77-3.52-2.3 2.21c-.25.25-.46.46-.94.46l.34-4.86 8.85-8c.39-.34-.09-.53-.6-.19L6.6 12.96l-4.69-1.47c-1.02-.32-1.04-1.02.21-1.51L20.45 3.3c.86-.31 1.62.2 1.45.8Z"
      />
    </svg>
  )
}

function WhatsappIcon() {
  return (
    <svg {...svgProps}>
      <path
        fill="currentColor"
        d="M20.52 3.48A11.83 11.83 0 0 0 12.07 0C5.52 0 .19 5.32.19 11.88c0 2.09.55 4.13 1.59 5.92L.1 24l6.34-1.66a11.87 11.87 0 0 0 5.63 1.43h.01c6.55 0 11.88-5.33 11.88-11.89 0-3.17-1.23-6.15-3.44-8.4ZM12.08 21.75h-.01a9.85 9.85 0 0 1-5.02-1.37l-.36-.21-3.76.99 1-3.67-.23-.38a9.87 9.87 0 0 1-1.51-5.23C2.19 6.44 6.62 2 12.07 2c2.64 0 5.12 1.03 6.98 2.9a9.82 9.82 0 0 1 2.89 6.99c0 5.45-4.43 9.86-9.86 9.86Zm5.41-7.39c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.47-.89-.79-1.49-1.77-1.66-2.07-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.07-.15-.67-1.61-.92-2.2-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.49s1.07 2.89 1.22 3.09c.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.69.63.71.23 1.35.2 1.86.12.57-.09 1.76-.72 2.01-1.42.25-.7.25-1.3.17-1.42-.07-.12-.27-.2-.57-.35Z"
      />
    </svg>
  )
}

function TiktokIcon() {
  return (
    <svg {...svgProps}>
      <path
        fill="currentColor"
        d="M16.55 2h-3.16v13.07a3.48 3.48 0 1 1-2.42-3.32V8.53a6.78 6.78 0 1 0 5.58 6.65V8.1a8.33 8.33 0 0 0 4.87 1.57V6.5c-2.55-.11-4.55-1.84-4.87-4.5Z"
      />
    </svg>
  )
}

function ThreadsIcon() {
  return (
    <svg {...svgProps}>
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M17.9 11.35c-.25-3.13-2.08-5.1-5.25-5.1-2.92 0-4.94 1.56-4.94 4.03 0 2.25 1.72 3.61 4.31 3.61 2.44 0 4.06-1.22 4.06-3.05 0-1.55-1.2-2.5-3.17-2.5-2.19 0-3.8 1.17-3.8 3.09 0 2.22 1.88 3.73 4.66 3.73 3.3 0 5.42-2.02 5.42-5.31 0-4.58-3.02-7.31-7.3-7.31-4.22 0-6.95 2.45-6.95 6.34"
      />
    </svg>
  )
}

function MailIcon() {
  return (
    <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" aria-hidden="true">
      <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
    </svg>
  )
}

function ArrowIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  )
}

function UpIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 19V5M6 11l6-6 6 6" />
    </svg>
  )
}

/* =========================================================
   ICON SELECTOR
   ========================================================= */

function SocialIcon({ platform }: { platform: SocialPlatform }) {
  switch (platform) {
    case "facebook":
      return <FacebookIcon />
    case "telegram":
      return <TelegramIcon />
    case "instagram":
      return <InstagramIcon />
    case "whatsapp":
      return <WhatsappIcon />
    case "youtube":
      return <YoutubeIcon />
    case "tiktok":
      return <TiktokIcon />
    case "threads":
      return <ThreadsIcon />
    default:
      return null
  }
}

/* brand colors (R,G,B) used for the hover glow */
const PLATFORM_RGB: Record<SocialPlatform, string> = {
  facebook: "24,119,242",
  instagram: "244,114,182",
  telegram: "56,189,248",
  whatsapp: "37,211,102",
  youtube: "255,51,51",
  tiktok: "255,255,255",
  threads: "255,255,255",
}

const MARQUEE_WORDS = ["MOVIES", "SERIES", "ANIME", "ENTERTAINMENT", "MVBD"]

/* =========================================================
   FOOTER
   ========================================================= */

export default function UniversalFooter() {
  const currentYear = new Date().getFullYear()
  const rootRef = useRef<HTMLElement>(null)

  /*
   * PERFORMANCE:
   * - Animations run ONLY while the footer is on screen
   *   (paused automatically when user scrolls away).
   * - Reveal animation plays once, no re-renders (class toggling only).
   * - Only transform/opacity are animated (GPU friendly, no layout/paint).
   */
  useEffect(() => {
    const el = rootRef.current
    if (!el) return

    el.classList.add("mvf-js")

    if (typeof IntersectionObserver === "undefined") {
      el.classList.add("mvf-in", "mvf-active")
      return
    }

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            el.classList.add("mvf-in", "mvf-active")
          } else {
            el.classList.remove("mvf-active")
          }
        }
      },
      { threshold: 0.05 }
    )

    io.observe(el)
    return () => io.disconnect()
  }, [])

  const socialLinks: SocialLink[] = [
    {
      name: "Facebook",
      label: "Facebook",
      url: "https://www.facebook.com/share/19eVKBFqiV/",
      platform: "facebook",
    },
    {
      name: "Instagram",
      label: "Instagram",
      url: "https://www.instagram.com/mvbdstudio?stkn=aGFyY2UwNXVibGVq",
      platform: "instagram",
    },
    {
      name: "Telegram",
      label: "Telegram",
      url: "https://t.me/addlist/G-AjTDjHEW0yYTJl",
      platform: "telegram",
    },
    {
      name: "WhatsApp",
      label: "WhatsApp",
      url: "https://wa.me/qr/D2BVBPREHG4LH1",
      platform: "whatsapp",
    },
    {
      name: "YouTube",
      label: "YouTube",
      url: "https://youtube.com/@moviesversebd26?si=gKTfFLJDC4dGc7KW",
      platform: "youtube",
    },
    {
      name: "TikTok",
      label: "TikTok",
      url: "https://www.tiktok.com/@moviesversebd?_r=1&_t=ZS-99dip5TzHyy",
      platform: "tiktok",
    },
    {
      name: "Threads",
      label: "Threads",
      url: "https://www.threads.com/@mvbdstudio",
      platform: "threads",
    },
  ]

  const telegramUrl = socialLinks.find((s) => s.platform === "telegram")?.url ?? "#"

  const scrollToTop = () => {
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" })
    }
  }

  return (
    <footer ref={rootRef} className="mvf">
      {/* =====================================================
          CINEMA BACKGROUND (static gradients, very light)
          ===================================================== */}
      <div className="mvf-bg" aria-hidden="true">
        <div className="mvf-beam mvf-anim" />
        <div className="mvf-glow-l" />
        <div className="mvf-glow-r" />
        <div className="mvf-fade" />
      </div>

      {/* =====================================================
          FILM STRIP TOP BORDER
          ===================================================== */}
      <div className="mvf-film" aria-hidden="true">
        <div className="mvf-film-holes mvf-anim" />
      </div>

      {/* =====================================================
          GIANT MARQUEE TEXT
          ===================================================== */}
      <div className="mvf-marquee" aria-hidden="true">
        <div className="mvf-marquee-track mvf-anim">
          {[0, 1].map((copy) => (
            <div className="mvf-marquee-group" key={copy}>
              {MARQUEE_WORDS.map((word) => (
                <span className="mvf-marquee-item" key={`${copy}-${word}`}>
                  <span className="mvf-marquee-word">{word}</span>
                  <span className="mvf-marquee-star">✦</span>
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>

      <div className="mvf-container">
        {/* =====================================================
            TICKET CTA
            ===================================================== */}
        <div className="mvf-ticket mvf-r" style={{ ["--d" as string]: "0ms" }}>
          <div className="mvf-ticket-main">
            <span className="mvf-ticket-tag">
              <i /> ADMIT ONE
            </span>
            <h3 className="mvf-ticket-title">
              Your next movie night <em>starts here.</em>
            </h3>
            <p className="mvf-ticket-text">
              Join the MVBD community for movies, series and anime updates.
            </p>
          </div>

          <div className="mvf-ticket-stub">
            <a
              href={telegramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mvf-cta"
            >
              <TelegramIcon />
              <span>Join on Telegram</span>
              <ArrowIcon />
            </a>
          </div>
        </div>

        {/* =====================================================
            MAIN GRID
            ===================================================== */}
        <div className="mvf-grid">
          {/* Brand + About */}
          <div className="mvf-col mvf-r" style={{ ["--d" as string]: "80ms" }}>
            <div className="mvf-brand">
              <img
                src="https://i.postimg.cc/V6GHC8yG/17773-removebg-preview.png"
                alt="MoviesVerseBD"
                width={46}
                height={46}
                loading="lazy"
                decoding="async"
                className="mvf-logo"
              />
              <div>
                <div className="mvf-brand-title">
                  MoviesVerse<span>BD</span>
                </div>
                <div className="mvf-brand-sub">YOUR MOVIE UNIVERSE</div>
              </div>
            </div>

            <p className="mvf-about">
              Your ultimate entertainment destination for movies, series, anime and more.
              Discover your next favourite movie, series or anime with MoviesVerseBD.
            </p>

            <div className="mvf-status">
              <span className="mvf-dot mvf-anim" />
              MVBD is always evolving
            </div>
          </div>

          {/* Quick Links */}
          <div className="mvf-col mvf-r" style={{ ["--d" as string]: "160ms" }}>
            <div className="mvf-title">
              <span />
              Quick Links
            </div>

            <nav className="mvf-links" aria-label="Footer quick links">
              <a href="#profile" className="mvf-link">
                <span>Profile</span>
                <ArrowIcon />
              </a>
              <a href="#about" className="mvf-link">
                <span>About Us</span>
                <ArrowIcon />
              </a>
              <a href="#contact" className="mvf-link">
                <span>Contact Us</span>
                <ArrowIcon />
              </a>
              <a href="#subscriptions" className="mvf-link">
                <span>Subscriptions</span>
                <ArrowIcon />
              </a>
            </nav>
          </div>

          {/* Social */}
          <div className="mvf-col mvf-r" style={{ ["--d" as string]: "240ms" }}>
            <div className="mvf-title">
              <span />
              Connect With Us
            </div>

            <div className="mvf-social-grid">
              {socialLinks.map((social) => (
                <a
                  key={social.name}
                  href={social.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Visit MVBD on ${social.label}`}
                  title={social.label}
                  className="mvf-social"
                  style={{ ["--rgb" as string]: PLATFORM_RGB[social.platform] }}
                >
                  <SocialIcon platform={social.platform} />
                </a>
              ))}
            </div>

            <div className="mvf-follow">
              <i />
              <span>
                FOLLOW <b>MVBD</b> EVERYWHERE
              </span>
            </div>
          </div>
        </div>

        {/* =====================================================
            DIVIDER
            ===================================================== */}
        <div className="mvf-divider" aria-hidden="true">
          <span className="mvf-anim" />
        </div>

        {/* =====================================================
            BOTTOM
            ===================================================== */}
        <div className="mvf-bottom">
          <div className="mvf-copy">
            <p>© {currentYear} MoviesVerseBD. All rights reserved.</p>
            <p>
              Made by{" "}
              <a
                href="https://wa.me/qr/R2ZGCQAMXWRPP1"
                target="_blank"
                rel="noopener noreferrer"
                className="mvf-maker"
              >
                Abdul Mazid
              </a>
            </p>
          </div>

          <div className="mvf-bottom-links">
            <a href="mailto:support@mvbds.xyz" className="mvf-mail">
              <MailIcon /> support@mvbds.xyz
            </a>
            <b>•</b>
            <a href="https://mvbds.xyz/privacy-policy.html" className="mvf-bl">
              Privacy Policy
            </a>
            <b>•</b>
            <a href="https://mvbds.xyz/terms.html" className="mvf-bl">
              Terms &amp; Conditions
            </a>
            <b>•</b>
            <a href="#contact" className="mvf-bl">
              Contact
            </a>
          </div>

          <button
            type="button"
            onClick={scrollToTop}
            aria-label="Back to top"
            className="mvf-top"
          >
            <UpIcon />
          </button>
        </div>
      </div>

      {/* =====================================================
          CSS (global + prefixed so child components are styled too)
          ===================================================== */}
      <style jsx global>{`
        .mvf {
          position: relative;
          overflow: hidden;
          isolation: isolate;
          contain: paint;
          background: #03060a;
          border-top: 1px solid rgba(255, 255, 255, 0.06);
          color: #cbd5e1;
        }

        /* ---------- background ---------- */
        .mvf-bg {
          position: absolute;
          inset: 0;
          z-index: -1;
          pointer-events: none;
        }
        .mvf-beam {
          position: absolute;
          top: 0;
          left: 50%;
          width: 1000px;
          max-width: 150%;
          height: 460px;
          transform: translate3d(-50%, 0, 0);
          background: radial-gradient(
            ellipse 50% 100% at 50% 0%,
            rgba(16, 185, 129, 0.22),
            rgba(16, 185, 129, 0.06) 45%,
            transparent 72%
          );
          animation: mvf-beam 6s ease-in-out infinite alternate;
          will-change: opacity;
        }
        .mvf-glow-l,
        .mvf-glow-r {
          position: absolute;
          width: 420px;
          height: 420px;
          border-radius: 50%;
        }
        .mvf-glow-l {
          left: -200px;
          bottom: -160px;
          background: radial-gradient(circle, rgba(16, 185, 129, 0.1), transparent 68%);
        }
        .mvf-glow-r {
          right: -200px;
          top: 30%;
          background: radial-gradient(circle, rgba(245, 158, 11, 0.07), transparent 68%);
        }
        .mvf-fade {
          position: absolute;
          inset: 0;
          background: linear-gradient(180deg, transparent 55%, rgba(0, 0, 0, 0.55));
        }
        @keyframes mvf-beam {
          from {
            opacity: 0.55;
          }
          to {
            opacity: 1;
          }
        }

        /* ---------- film strip ---------- */
        .mvf-film {
          position: relative;
          height: 16px;
          overflow: hidden;
          background: #000;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        }
        .mvf-film-holes {
          position: absolute;
          top: 4px;
          bottom: 4px;
          left: 0;
          width: calc(100% + 56px);
          border-radius: 2px;
          background: repeating-linear-gradient(
            90deg,
            rgba(255, 255, 255, 0.17) 0 14px,
            transparent 14px 28px
          );
          animation: mvf-film 3s linear infinite;
          will-change: transform;
        }
        @keyframes mvf-film {
          to {
            transform: translate3d(-28px, 0, 0);
          }
        }

        /* ---------- marquee ---------- */
        .mvf-marquee {
          position: relative;
          overflow: hidden;
          padding: 28px 0 6px;
          -webkit-mask-image: linear-gradient(90deg, transparent, #000 14%, #000 86%, transparent);
          mask-image: linear-gradient(90deg, transparent, #000 14%, #000 86%, transparent);
        }
        .mvf-marquee-track {
          display: flex;
          width: max-content;
          animation: mvf-marquee 38s linear infinite;
          will-change: transform;
        }
        .mvf-marquee-group {
          display: flex;
          align-items: center;
          flex-shrink: 0;
        }
        .mvf-marquee-item {
          display: inline-flex;
          align-items: center;
          gap: 28px;
          padding-right: 28px;
        }
        .mvf-marquee-word {
          font-size: clamp(42px, 9vw, 92px);
          line-height: 1;
          font-weight: 900;
          letter-spacing: -0.02em;
          color: transparent;
          -webkit-text-stroke: 1px rgba(255, 255, 255, 0.13);
          user-select: none;
        }
        .mvf-marquee-star {
          font-size: clamp(14px, 2.4vw, 22px);
          color: rgba(52, 211, 153, 0.75);
        }
        @keyframes mvf-marquee {
          to {
            transform: translate3d(-50%, 0, 0);
          }
        }

        /* ---------- layout ---------- */
        .mvf-container {
          position: relative;
          max-width: 1152px;
          margin: 0 auto;
          padding: 8px 16px 28px;
        }

        /* ---------- ticket CTA ---------- */
        .mvf-ticket {
          display: flex;
          align-items: stretch;
          margin-bottom: 44px;
          border-radius: 22px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          background:
            linear-gradient(135deg, rgba(16, 185, 129, 0.17), rgba(245, 158, 11, 0.07) 62%, rgba(255, 255, 255, 0.03));
          box-shadow: 0 20px 50px -24px rgba(16, 185, 129, 0.45);
          -webkit-mask:
            radial-gradient(circle 13px at 0 50%, transparent 97%, #000) left / 51% 100% no-repeat,
            radial-gradient(circle 13px at 100% 50%, transparent 97%, #000) right / 51% 100% no-repeat;
          mask:
            radial-gradient(circle 13px at 0 50%, transparent 97%, #000) left / 51% 100% no-repeat,
            radial-gradient(circle 13px at 100% 50%, transparent 97%, #000) right / 51% 100% no-repeat;
        }
        .mvf-ticket-main {
          flex: 1;
          padding: 26px 28px;
        }
        .mvf-ticket-tag {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.28em;
          color: #fbbf24;
        }
        .mvf-ticket-tag i {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #fbbf24;
          box-shadow: 0 0 10px #fbbf24;
        }
        .mvf-ticket-title {
          margin: 10px 0 6px;
          font-size: clamp(22px, 3.4vw, 30px);
          line-height: 1.15;
          font-weight: 800;
          letter-spacing: -0.02em;
          color: #fff;
        }
        .mvf-ticket-title em {
          font-style: normal;
          background: linear-gradient(90deg, #6ee7b7, #34d399 55%, #fbbf24);
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
        }
        .mvf-ticket-text {
          margin: 0;
          font-size: 13px;
          line-height: 1.6;
          color: rgba(255, 255, 255, 0.5);
        }
        .mvf-ticket-stub {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px 30px;
          border-left: 2px dashed rgba(255, 255, 255, 0.16);
        }
        .mvf-cta {
          position: relative;
          display: inline-flex;
          align-items: center;
          gap: 10px;
          padding: 14px 20px;
          overflow: hidden;
          border-radius: 999px;
          font-size: 14px;
          font-weight: 700;
          color: #04130c;
          white-space: nowrap;
          background: linear-gradient(135deg, #6ee7b7, #10b981);
          box-shadow: 0 10px 30px -10px rgba(16, 185, 129, 0.8);
          transition: transform 0.25s ease, box-shadow 0.25s ease;
        }
        .mvf-cta::after {
          content: "";
          position: absolute;
          top: 0;
          left: 0;
          width: 40%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.55), transparent);
          transform: translate3d(-160%, 0, 0) skewX(-20deg);
        }
        .mvf-cta:hover {
          transform: translate3d(0, -2px, 0);
          box-shadow: 0 16px 36px -10px rgba(16, 185, 129, 0.95);
        }
        .mvf-cta:hover::after {
          transform: translate3d(380%, 0, 0) skewX(-20deg);
          transition: transform 0.7s ease;
        }
        .mvf-cta svg:last-child {
          transition: transform 0.25s ease;
        }
        .mvf-cta:hover svg:last-child {
          transform: translate3d(3px, 0, 0);
        }

        /* ---------- main grid ---------- */
        .mvf-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 36px;
          margin-bottom: 36px;
        }
        @media (min-width: 768px) {
          .mvf-grid {
            grid-template-columns: 1.5fr 1fr 1.2fr;
            gap: 40px;
          }
        }

        .mvf-brand {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 16px;
        }
        .mvf-logo {
          flex-shrink: 0;
          object-fit: contain;
          filter: drop-shadow(0 0 12px rgba(16, 185, 129, 0.45));
        }
        .mvf-brand-title {
          font-size: 22px;
          line-height: 1;
          font-weight: 800;
          letter-spacing: -0.03em;
          color: #fff;
        }
        .mvf-brand-title span {
          color: #34d399;
        }
        .mvf-brand-sub {
          margin-top: 6px;
          font-size: 8px;
          letter-spacing: 0.32em;
          color: rgba(255, 255, 255, 0.38);
        }
        .mvf-about {
          margin: 0;
          max-width: 380px;
          font-size: 13.5px;
          line-height: 1.75;
          color: #94a3b8;
        }
        .mvf-status {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          margin-top: 18px;
          padding: 7px 12px;
          border-radius: 999px;
          font-size: 11px;
          color: rgba(255, 255, 255, 0.5);
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.08);
        }
        .mvf-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #34d399;
          box-shadow: 0 0 10px #34d399;
          animation: mvf-dot 1.8s ease-in-out infinite;
          will-change: transform, opacity;
        }
        @keyframes mvf-dot {
          0%,
          100% {
            transform: scale(0.7);
            opacity: 0.5;
          }
          50% {
            transform: scale(1.15);
            opacity: 1;
          }
        }

        .mvf-title {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 18px;
          font-size: 15px;
          font-weight: 700;
          color: #fff;
        }
        .mvf-title span {
          width: 4px;
          height: 18px;
          border-radius: 99px;
          background: linear-gradient(180deg, #6ee7b7, #10b981);
          box-shadow: 0 0 12px rgba(52, 211, 153, 0.6);
        }

        /* ---------- quick links ---------- */
        .mvf-links {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .mvf-link {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 11px 14px;
          border-radius: 14px;
          font-size: 13px;
          font-weight: 500;
          color: rgba(255, 255, 255, 0.55);
          background: rgba(255, 255, 255, 0.025);
          border: 1px solid rgba(255, 255, 255, 0.05);
          transition: color 0.2s ease, background 0.2s ease, border-color 0.2s ease, transform 0.25s ease;
        }
        .mvf-link svg {
          opacity: 0;
          transform: translate3d(-6px, 0, 0);
          transition: opacity 0.2s ease, transform 0.25s ease;
        }
        .mvf-link:hover {
          color: #6ee7b7;
          background: rgba(16, 185, 129, 0.08);
          border-color: rgba(52, 211, 153, 0.22);
          transform: translate3d(4px, 0, 0);
        }
        .mvf-link:hover svg {
          opacity: 1;
          transform: none;
        }

        /* ---------- social ---------- */
        .mvf-social-grid {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
        }
        .mvf-social {
          --rgb: 255, 255, 255;
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 46px;
          height: 46px;
          border-radius: 15px;
          color: rgba(255, 255, 255, 0.7);
          background: linear-gradient(145deg, rgba(255, 255, 255, 0.09), rgba(255, 255, 255, 0.025));
          border: 1px solid rgba(255, 255, 255, 0.1);
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.08);
          transition: transform 0.25s cubic-bezier(0.22, 1.2, 0.36, 1), color 0.2s ease,
            border-color 0.2s ease, box-shadow 0.25s ease, background 0.25s ease;
        }
        .mvf-social:hover {
          transform: translate3d(0, -5px, 0) scale(1.06);
          color: rgb(var(--rgb));
          border-color: rgba(var(--rgb), 0.45);
          background: linear-gradient(145deg, rgba(var(--rgb), 0.16), rgba(var(--rgb), 0.04));
          box-shadow: 0 14px 28px -10px rgba(var(--rgb), 0.55), inset 0 1px 0 rgba(255, 255, 255, 0.14);
        }
        .mvf-follow {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-top: 20px;
        }
        .mvf-follow i {
          width: 34px;
          height: 1px;
          background: linear-gradient(90deg, rgba(52, 211, 153, 0.7), transparent);
        }
        .mvf-follow span {
          font-size: 9px;
          letter-spacing: 0.28em;
          color: rgba(255, 255, 255, 0.3);
          white-space: nowrap;
        }
        .mvf-follow b {
          color: #34d399;
          font-weight: 700;
        }

        /* ---------- divider ---------- */
        .mvf-divider {
          position: relative;
          height: 1px;
          margin-bottom: 22px;
          overflow: hidden;
          background: linear-gradient(
            90deg,
            transparent,
            rgba(52, 211, 153, 0.25),
            rgba(255, 255, 255, 0.09),
            rgba(52, 211, 153, 0.25),
            transparent
          );
        }
        .mvf-divider span {
          position: absolute;
          top: 0;
          left: 0;
          width: 22%;
          height: 100%;
          background: linear-gradient(90deg, transparent, #6ee7b7, transparent);
          transform: translate3d(-100%, 0, 0);
          animation: mvf-flow 4.5s linear infinite;
          will-change: transform;
        }
        @keyframes mvf-flow {
          to {
            transform: translate3d(460%, 0, 0);
          }
        }

        /* ---------- bottom ---------- */
        .mvf-bottom {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 16px;
          text-align: center;
        }
        @media (min-width: 768px) {
          .mvf-bottom {
            flex-direction: row;
            justify-content: space-between;
            text-align: left;
          }
        }
        .mvf-copy p {
          margin: 0;
          font-size: 12px;
          color: #64748b;
        }
        .mvf-copy p + p {
          margin-top: 6px;
          color: #475569;
        }
        .mvf-maker {
          display: inline-block;
          margin-left: 3px;
          font-style: italic;
          font-family: cursive;
          font-weight: 700;
          letter-spacing: 0.5px;
          background: linear-gradient(90deg, #a78bfa, #f472b6, #fb7185);
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
          transition: opacity 0.2s ease;
        }
        .mvf-maker:hover {
          opacity: 0.8;
        }
        .mvf-bottom-links {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          justify-content: center;
          gap: 10px 12px;
          font-size: 12px;
          color: #64748b;
        }
        .mvf-bottom-links b {
          font-weight: 400;
          color: #334155;
        }
        .mvf-bl {
          transition: color 0.2s ease;
        }
        .mvf-bl:hover {
          color: #fff;
        }
        .mvf-mail {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          font-weight: 500;
          color: #34d399;
          transition: color 0.2s ease;
        }
        .mvf-mail:hover {
          color: #6ee7b7;
        }
        .mvf-top {
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          width: 40px;
          height: 40px;
          border-radius: 50%;
          color: #cbd5e1;
          cursor: pointer;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.12);
          transition: transform 0.25s ease, color 0.2s ease, background 0.2s ease, border-color 0.2s ease;
        }
        .mvf-top:hover {
          transform: translate3d(0, -3px, 0);
          color: #04130c;
          background: #34d399;
          border-color: #34d399;
        }

        /* ---------- reveal on scroll (plays once) ---------- */
        .mvf-js .mvf-r {
          opacity: 0;
          transform: translate3d(0, 22px, 0);
          transition: opacity 0.7s ease, transform 0.8s cubic-bezier(0.22, 1, 0.36, 1);
          transition-delay: var(--d, 0ms);
        }
        .mvf-js.mvf-in .mvf-r {
          opacity: 1;
          transform: none;
        }

        /* ---------- pause everything when off-screen ---------- */
        .mvf:not(.mvf-active) .mvf-anim {
          animation-play-state: paused;
        }

        /* ---------- mobile ---------- */
        @media (max-width: 640px) {
          .mvf-ticket {
            flex-direction: column;
          }
          .mvf-ticket-main {
            padding: 24px 22px 18px;
          }
          .mvf-ticket-stub {
            padding: 18px 22px 24px;
            border-left: 0;
            border-top: 2px dashed rgba(255, 255, 255, 0.16);
          }
          .mvf-cta {
            width: 100%;
            justify-content: center;
          }
          .mvf-social {
            width: 44px;
            height: 44px;
          }
          .mvf-marquee {
            padding-top: 20px;
          }
        }

        /* ---------- accessibility / low-end devices ---------- */
        @media (prefers-reduced-motion: reduce) {
          .mvf-anim {
            animation: none !important;
          }
          .mvf-js .mvf-r {
            opacity: 1;
            transform: none;
            transition: none;
          }
          .mvf-social,
          .mvf-link,
          .mvf-cta,
          .mvf-top {
            transition: none !important;
          }
        }
      `}</style>
    </footer>
  )
}
