"use client"

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

const FOOTER_BG_URL =
  "https://i.postimg.cc/jjJhVmLZ/f2890eb44e8fd63f2ec2004e11f742af.jpg"
const LOGO_URL = "https://i.postimg.cc/RC8VhYFd/20261023-144832.png"

/* =========================================================
   BRAND SVG ICONS
   ========================================================= */

function FacebookIcon() {
  return (
    <svg viewBox="0 0 24 24" className="mvbd-social-svg" aria-hidden="true">
      <path
        fill="currentColor"
        d="M13.5 21v-8h2.7l.4-3h-3.1V8.08c0-.87.24-1.46 1.5-1.46h1.7V3.94c-.29-.04-1.29-.12-2.46-.12-2.44 0-4.11 1.49-4.11 4.23V10H7.5v3h2.63v8h3.37Z"
      />
    </svg>
  )
}

function InstagramIcon() {
  return (
    <svg viewBox="0 0 24 24" className="mvbd-social-svg" aria-hidden="true">
      <rect
        x="3.2"
        y="3.2"
        width="17.6"
        height="17.6"
        rx="5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      />
      <circle
        cx="12"
        cy="12"
        r="4.1"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      />
      <circle cx="17.45" cy="6.65" r="1.2" fill="currentColor" />
    </svg>
  )
}

function YoutubeIcon() {
  return (
    <svg viewBox="0 0 24 24" className="mvbd-social-svg" aria-hidden="true">
      <path
        fill="currentColor"
        d="M23.5 6.2a3 3 0 0 0-2.12-2.12C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.38.58A3 3 0 0 0 .5 6.2 31.2 31.2 0 0 0 0 12a31.2 31.2 0 0 0 .5 5.8 3 3 0 0 0 2.12 2.12C4.5 20.5 12 20.5 12 20.5s7.5 0 9.38-.58a3 3 0 0 0 2.12-2.12A31.2 31.2 0 0 0 24 12a31.2 31.2 0 0 0-.5-5.8ZM9.6 15.85v-7.7L16 12l-6.4 3.85Z"
      />
    </svg>
  )
}

function TelegramIcon() {
  return (
    <svg viewBox="0 0 24 24" className="mvbd-social-svg" aria-hidden="true">
      <path
        fill="currentColor"
        d="M21.9 4.1 18.7 19c-.24 1.05-.86 1.31-1.74.82l-4.77-3.52-2.3 2.21c-.25.25-.46.46-.94.46l.34-4.86 8.85-8c.39-.34-.09-.53-.6-.19L6.6 12.96l-4.69-1.47c-1.02-.32-1.04-1.02.21-1.51L20.45 3.3c.86-.31 1.62.2 1.45.8Z"
      />
    </svg>
  )
}

function WhatsappIcon() {
  return (
    <svg viewBox="0 0 24 24" className="mvbd-social-svg" aria-hidden="true">
      <path
        fill="currentColor"
        d="M20.52 3.48A11.83 11.83 0 0 0 12.07 0C5.52 0 .19 5.32.19 11.88c0 2.09.55 4.13 1.59 5.92L.1 24l6.34-1.66a11.87 11.87 0 0 0 5.63 1.43h.01c6.55 0 11.88-5.33 11.88-11.89 0-3.17-1.23-6.15-3.44-8.4ZM12.08 21.75h-.01a9.85 9.85 0 0 1-5.02-1.37l-.36-.21-3.76.99 1-3.67-.23-.38a9.87 9.87 0 0 1-1.51-5.23C2.19 6.44 6.62 2 12.07 2c2.64 0 5.12 1.03 6.98 2.9a9.82 9.82 0 0 1 2.89 6.99c0 5.45-4.43 9.86-9.86 9.86Zm5.41-7.39c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.47-.89-.79-1.49-1.77-1.66-2.07-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.07-.15-.67-1.61-.92-2.2-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.49s1.07 2.89 1.22 3.09c.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.69.63.71.23 1.35.2 1.86.12.57-.09 1.76-.72 2.01-1.42.25-.7.25-1.3.17-1.42-.07-.12-.27-.2-.57-.35Z"
      />
    </svg>
  )
}

function TiktokIcon() {
  return (
    <svg viewBox="0 0 24 24" className="mvbd-social-svg" aria-hidden="true">
      <path
        fill="currentColor"
        d="M16.55 2h-3.16v13.07a3.48 3.48 0 1 1-2.42-3.32V8.53a6.78 6.78 0 1 0 5.58 6.65V8.1a8.33 8.33 0 0 0 4.87 1.57V6.5c-2.55-.11-4.55-1.84-4.87-4.5Z"
      />
    </svg>
  )
}

function ThreadsIcon() {
  return (
    <svg viewBox="0 0 24 24" className="mvbd-social-svg" aria-hidden="true">
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
    <svg viewBox="0 0 24 24" className="mvbd-mail-svg" fill="currentColor" aria-hidden="true">
      <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
    </svg>
  )
}

function ArrowUpIcon() {
  return (
    <svg viewBox="0 0 24 24" className="mvbd-mail-svg" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 19V5M5 12l7-7 7 7" />
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

/* =========================================================
   FOOTER
   ========================================================= */

export default function UniversalFooter() {
  const currentYear = new Date().getFullYear()

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

  const handleBackToTop = () => {
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" })
    }
  }

  return (
    <footer className="mvbd-footer">
      {/* =====================================================
          STATIC BACKGROUND (no heavy animation = no lag)
          ===================================================== */}
      <div className="mvbd-bg" aria-hidden="true">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={FOOTER_BG_URL}
          alt=""
          className="mvbd-bg-img"
          loading="lazy"
          decoding="async"
        />
        <div className="mvbd-bg-shade" />
        <div className="mvbd-bg-glow" />
      </div>

      <div className="mvbd-wrap">
        {/* ===================================================
            HERO / CTA PANEL
            =================================================== */}
        <section className="mvbd-glass mvbd-hero">
          <div className="mvbd-hero-text">
            <div className="mvbd-eyebrow">
              <span className="mvbd-live-dot" />
              MVBD is always evolving
            </div>
            <h2 className="mvbd-hero-title">
              Questions? We&apos;re always here for you.
            </h2>
            <p className="mvbd-hero-sub">
              Your ultimate entertainment destination for movies, series,
              anime and more.
            </p>
          </div>

          <div className="mvbd-hero-actions">
            <a href="#contact" className="mvbd-btn mvbd-btn-primary">
              Contact Us
            </a>
            <a href="mailto:support@mvbds.xyz" className="mvbd-btn mvbd-btn-ghost">
              <MailIcon /> support@mvbds.xyz
            </a>
          </div>
        </section>

        {/* ===================================================
            MAIN COLUMNS
            =================================================== */}
        <div className="mvbd-cols">
          {/* Brand */}
          <div className="mvbd-col mvbd-col-brand">
            <a href="/" className="mvbd-logo-link" aria-label="MoviesVerseBD home">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={LOGO_URL}
                alt="MoviesVerseBD"
                className="mvbd-logo"
                loading="lazy"
                decoding="async"
              />
            </a>

            <p className="mvbd-text">
              Discover your next favourite movie, series or anime with
              MoviesVerseBD.
            </p>

            <div className="mvbd-tagline">YOUR MOVIE UNIVERSE</div>
          </div>

          {/* Quick Links */}
          <nav className="mvbd-col" aria-label="Quick links">
            <h3 className="mvbd-heading">Quick Links</h3>
            <ul className="mvbd-list">
              <li><a href="#profile" className="mvbd-link">Profile</a></li>
              <li><a href="#about" className="mvbd-link">About Us</a></li>
              <li><a href="#contact" className="mvbd-link">Contact Us</a></li>
              <li><a href="#subscriptions" className="mvbd-link">Subscriptions</a></li>
            </ul>
          </nav>

          {/* Legal */}
          <nav className="mvbd-col" aria-label="Legal">
            <h3 className="mvbd-heading">Support &amp; Legal</h3>
            <ul className="mvbd-list">
              <li>
                <a href="https://mvbds.xyz/privacy-policy.html" className="mvbd-link">
                  Privacy Policy
                </a>
              </li>
              <li>
                <a href="https://mvbds.xyz/terms.html" className="mvbd-link">
                  Terms &amp; Conditions
                </a>
              </li>
              <li><a href="#contact" className="mvbd-link">Contact</a></li>
              <li>
                <a href="mailto:support@mvbds.xyz" className="mvbd-link">
                  Email Support
                </a>
              </li>
            </ul>
          </nav>

          {/* Social */}
          <div className="mvbd-col mvbd-col-social">
            <h3 className="mvbd-heading">Connect With Us</h3>

            <div className="mvbd-social-grid">
              {socialLinks.map((social) => (
                <a
                  key={social.name}
                  href={social.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Visit MVBD on ${social.label}`}
                  title={social.label}
                  className={`mvbd-social ${social.platform}`}
                >
                  <span className="mvbd-social-icon">
                    <SocialIcon platform={social.platform} />
                  </span>
                  <span className="mvbd-social-name">{social.label}</span>
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* ===================================================
            BOTTOM BAR
            =================================================== */}
        <div className="mvbd-glass mvbd-bottom">
          <div className="mvbd-bottom-left">
            <p className="mvbd-copy">
              © {currentYear} MoviesVerseBD. All rights reserved.
            </p>
            <p className="mvbd-made">
              Made by{" "}
              <a
                href="https://wa.me/qr/R2ZGCQAMXWRPP1"
                target="_blank"
                rel="noopener noreferrer"
                className="mvbd-maker"
              >
                Abdul Mazid
              </a>
            </p>
          </div>

          <div className="mvbd-bottom-right">
            <span className="mvbd-follow">
              FOLLOW <b>MVBD</b> EVERYWHERE
            </span>
            <button
              type="button"
              onClick={handleBackToTop}
              className="mvbd-top-btn"
              aria-label="Back to top"
            >
              <ArrowUpIcon />
            </button>
          </div>
        </div>
      </div>

      {/* =====================================================
          CSS  (global-scoped so child icon components are styled)
          ===================================================== */}
      <style jsx global>{`
        /* ---------- BASE ---------- */
        .mvbd-footer {
          position: relative;
          isolation: isolate;
          overflow: hidden;
          background: #04070a;
          border-top: 1px solid rgba(255, 255, 255, 0.08);
          color: rgba(255, 255, 255, 0.7);
          /* Skip rendering work until the footer is near the viewport */
          content-visibility: auto;
          contain-intrinsic-size: auto 760px;
        }

        /* ---------- BACKGROUND (static, cheap) ---------- */
        .mvbd-bg {
          position: absolute;
          inset: 0;
          z-index: -1;
          pointer-events: none;
        }
        .mvbd-bg-img {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: center;
          opacity: 0.55;
        }
        .mvbd-bg-shade {
          position: absolute;
          inset: 0;
          background:
            linear-gradient(180deg, #04070a 0%, rgba(4, 7, 10, 0.55) 28%, rgba(4, 7, 10, 0.72) 70%, #04070a 100%),
            linear-gradient(90deg, rgba(4, 7, 10, 0.55), rgba(4, 7, 10, 0.15) 50%, rgba(4, 7, 10, 0.55));
        }
        .mvbd-bg-glow {
          position: absolute;
          inset: 0;
          background:
            radial-gradient(ellipse 60% 45% at 50% 0%, rgba(16, 185, 129, 0.16), transparent 70%),
            radial-gradient(ellipse 45% 40% at 90% 100%, rgba(56, 189, 248, 0.09), transparent 70%),
            radial-gradient(ellipse 40% 40% at 5% 100%, rgba(124, 58, 237, 0.1), transparent 70%);
        }

        .mvbd-wrap {
          position: relative;
          max-width: 1240px;
          margin: 0 auto;
          padding: 40px 16px 24px;
        }

        /* ---------- LIQUID GLASS ---------- */
        .mvbd-glass {
          position: relative;
          border-radius: 26px;
          background:
            linear-gradient(140deg, rgba(255, 255, 255, 0.12) 0%, rgba(255, 255, 255, 0.04) 45%, rgba(255, 255, 255, 0.07) 100%);
          border: 1px solid rgba(255, 255, 255, 0.14);
          box-shadow:
            inset 0 1px 0 rgba(255, 255, 255, 0.28),
            inset 0 -1px 0 rgba(255, 255, 255, 0.05),
            inset 0 0 22px rgba(255, 255, 255, 0.03),
            0 18px 50px rgba(0, 0, 0, 0.45);
          -webkit-backdrop-filter: blur(16px) saturate(165%);
          backdrop-filter: blur(16px) saturate(165%);
          overflow: hidden;
        }
        /* soft specular highlight */
        .mvbd-glass::before {
          content: "";
          position: absolute;
          inset: 0;
          border-radius: inherit;
          background: radial-gradient(120% 70% at 0% 0%, rgba(255, 255, 255, 0.14), transparent 55%);
          pointer-events: none;
        }

        /* ---------- HERO ---------- */
        .mvbd-hero {
          display: flex;
          flex-direction: column;
          gap: 22px;
          padding: 28px 22px;
          margin-bottom: 36px;
        }
        .mvbd-eyebrow {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 6px 12px;
          border-radius: 999px;
          font-size: 11px;
          letter-spacing: 0.3px;
          color: rgba(255, 255, 255, 0.75);
          background: rgba(255, 255, 255, 0.07);
          border: 1px solid rgba(255, 255, 255, 0.12);
        }
        .mvbd-live-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #4ade80;
          box-shadow: 0 0 10px #4ade80;
        }
        .mvbd-hero-title {
          margin: 14px 0 8px;
          font-size: 24px;
          line-height: 1.2;
          font-weight: 800;
          letter-spacing: -0.5px;
          color: #fff;
        }
        .mvbd-hero-sub {
          margin: 0;
          max-width: 520px;
          font-size: 14px;
          line-height: 1.6;
          color: rgba(255, 255, 255, 0.62);
        }
        .mvbd-hero-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
        }

        .mvbd-btn {
          position: relative;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          min-height: 46px;
          padding: 0 22px;
          border-radius: 999px;
          font-size: 14px;
          font-weight: 700;
          text-decoration: none;
          transition: transform 0.2s ease, box-shadow 0.2s ease, background 0.2s ease;
        }
        .mvbd-btn:hover {
          transform: translateY(-2px);
        }
        .mvbd-btn-primary {
          color: #04130c;
          background: linear-gradient(135deg, #6ee7b7, #34d399 55%, #10b981);
          box-shadow: 0 10px 28px rgba(16, 185, 129, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.55);
        }
        .mvbd-btn-primary:hover {
          box-shadow: 0 14px 34px rgba(16, 185, 129, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.6);
        }
        .mvbd-btn-ghost {
          color: #a7f3d0;
          background: rgba(255, 255, 255, 0.07);
          border: 1px solid rgba(255, 255, 255, 0.16);
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.15);
        }
        .mvbd-btn-ghost:hover {
          background: rgba(255, 255, 255, 0.12);
        }
        .mvbd-mail-svg {
          width: 16px;
          height: 16px;
          flex-shrink: 0;
        }

        /* ---------- COLUMNS ---------- */
        .mvbd-cols {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 34px 20px;
          padding: 0 6px;
          margin-bottom: 36px;
        }
        .mvbd-col-brand,
        .mvbd-col-social {
          grid-column: 1 / -1;
        }

        .mvbd-logo-link {
          display: inline-block;
          margin-bottom: 14px;
        }
        .mvbd-logo {
          display: block;
          height: 52px;
          width: auto;
          max-width: 240px;
          object-fit: contain;
          filter: drop-shadow(0 6px 18px rgba(0, 0, 0, 0.5));
        }
        .mvbd-text {
          margin: 0;
          max-width: 340px;
          font-size: 14px;
          line-height: 1.7;
          color: rgba(255, 255, 255, 0.6);
        }
        .mvbd-tagline {
          margin-top: 16px;
          font-size: 10px;
          letter-spacing: 4px;
          color: rgba(255, 255, 255, 0.4);
        }

        .mvbd-heading {
          position: relative;
          margin: 0 0 16px;
          padding-bottom: 10px;
          font-size: 15px;
          font-weight: 700;
          letter-spacing: 0.2px;
          color: #fff;
        }
        .mvbd-heading::after {
          content: "";
          position: absolute;
          left: 0;
          bottom: 0;
          width: 28px;
          height: 3px;
          border-radius: 99px;
          background: linear-gradient(90deg, #34d399, rgba(52, 211, 153, 0));
        }

        .mvbd-list {
          list-style: none;
          margin: 0;
          padding: 0;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .mvbd-link {
          display: inline-block;
          font-size: 14px;
          color: rgba(255, 255, 255, 0.62);
          text-decoration: none;
          transition: color 0.2s ease, transform 0.2s ease;
        }
        .mvbd-link:hover {
          color: #6ee7b7;
          transform: translateX(4px);
        }

        /* ---------- SOCIAL ---------- */
        .mvbd-social-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 10px;
        }
        .mvbd-social {
          --platform: #ffffff;
          position: relative;
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 8px 12px 8px 8px;
          border-radius: 16px;
          color: rgba(255, 255, 255, 0.78);
          text-decoration: none;
          background: linear-gradient(145deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.03));
          border: 1px solid rgba(255, 255, 255, 0.11);
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.14), 0 6px 18px rgba(0, 0, 0, 0.25);
          transition: transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease, background 0.2s ease;
        }
        .mvbd-social:hover {
          transform: translateY(-3px);
          border-color: color-mix(in srgb, var(--platform) 45%, transparent);
          background: linear-gradient(145deg, color-mix(in srgb, var(--platform) 16%, transparent), rgba(255, 255, 255, 0.04));
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.2), 0 10px 26px rgba(0, 0, 0, 0.35),
            0 0 18px color-mix(in srgb, var(--platform) 22%, transparent);
        }
        .mvbd-social-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          width: 34px;
          height: 34px;
          border-radius: 11px;
          color: var(--platform);
          background: rgba(255, 255, 255, 0.08);
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.18);
        }
        .mvbd-social-svg {
          width: 18px;
          height: 18px;
          display: block;
        }
        .mvbd-social-name {
          font-size: 13px;
          font-weight: 600;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .mvbd-social.facebook { --platform: #1877f2; }
        .mvbd-social.instagram { --platform: #f472b6; }
        .mvbd-social.telegram { --platform: #38bdf8; }
        .mvbd-social.whatsapp { --platform: #25d366; }
        .mvbd-social.youtube { --platform: #ff3333; }
        .mvbd-social.tiktok { --platform: #ffffff; }
        .mvbd-social.threads { --platform: #ffffff; }

        /* ---------- BOTTOM BAR ---------- */
        .mvbd-bottom {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 14px;
          padding: 16px 20px;
          border-radius: 22px;
          text-align: center;
        }
        .mvbd-bottom-left {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .mvbd-copy,
        .mvbd-made {
          margin: 0;
          font-size: 12px;
          color: rgba(255, 255, 255, 0.5);
        }
        .mvbd-maker {
          display: inline-block;
          margin-left: 3px;
          font-style: italic;
          font-family: cursive;
          font-weight: 700;
          letter-spacing: 0.5px;
          text-decoration: none;
          background: linear-gradient(90deg, #a78bfa, #f472b6, #fb7185);
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
          transition: opacity 0.2s ease;
        }
        .mvbd-maker:hover {
          opacity: 0.8;
        }
        .mvbd-bottom-right {
          display: flex;
          align-items: center;
          gap: 14px;
        }
        .mvbd-follow {
          font-size: 9px;
          letter-spacing: 3px;
          white-space: nowrap;
          color: rgba(255, 255, 255, 0.32);
        }
        .mvbd-follow b {
          color: #4ade80;
          font-weight: 700;
        }
        .mvbd-top-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 40px;
          height: 40px;
          border-radius: 14px;
          color: #a7f3d0;
          cursor: pointer;
          background: linear-gradient(145deg, rgba(255, 255, 255, 0.12), rgba(255, 255, 255, 0.04));
          border: 1px solid rgba(255, 255, 255, 0.16);
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.2);
          transition: transform 0.2s ease, background 0.2s ease;
        }
        .mvbd-top-btn:hover {
          transform: translateY(-3px);
          background: rgba(52, 211, 153, 0.18);
        }

        /* ---------- TABLET ---------- */
        @media (min-width: 640px) {
          .mvbd-wrap {
            padding: 48px 24px 28px;
          }
          .mvbd-hero {
            padding: 34px 32px;
          }
          .mvbd-hero-title {
            font-size: 30px;
          }
          .mvbd-social-grid {
            grid-template-columns: repeat(3, minmax(0, 1fr));
          }
        }

        /* ---------- DESKTOP (big-site layout) ---------- */
        @media (min-width: 900px) {
          .mvbd-hero {
            flex-direction: row;
            align-items: center;
            justify-content: space-between;
            gap: 32px;
            padding: 40px 44px;
          }
          .mvbd-hero-title {
            font-size: 34px;
          }
          .mvbd-cols {
            grid-template-columns: 1.35fr 0.8fr 0.9fr 1.6fr;
            gap: 40px;
            padding: 0 10px;
          }
          .mvbd-col-brand,
          .mvbd-col-social {
            grid-column: auto;
          }
          .mvbd-social-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
          .mvbd-bottom {
            flex-direction: row;
            justify-content: space-between;
            padding: 18px 28px;
            text-align: left;
          }
        }

        /* ---------- MOBILE / LOW-END: lighter blur ---------- */
        @media (max-width: 640px) {
          .mvbd-glass {
            -webkit-backdrop-filter: blur(10px) saturate(150%);
            backdrop-filter: blur(10px) saturate(150%);
            box-shadow:
              inset 0 1px 0 rgba(255, 255, 255, 0.25),
              inset 0 -1px 0 rgba(255, 255, 255, 0.05),
              0 12px 30px rgba(0, 0, 0, 0.4);
          }
          .mvbd-logo {
            height: 46px;
          }
        }

        /* Browsers without backdrop-filter get a solid dark glass look */
        @supports not ((backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px))) {
          .mvbd-glass {
            background: rgba(14, 22, 20, 0.88);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .mvbd-btn,
          .mvbd-link,
          .mvbd-social,
          .mvbd-top-btn {
            transition: none !important;
          }
        }
      `}</style>
    </footer>
  )
}
