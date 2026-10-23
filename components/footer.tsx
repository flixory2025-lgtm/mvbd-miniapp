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
  "https://i.postimg.cc/fL7zPWZ4/prettiest-and-best-k-dramas-posters-youve-seen-v0-rkzv09n2qrdg1.jpg"
const LOGO_URL = "https://i.postimg.cc/P5DBy3dH/24131-removebg-preview-(1).png"

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
    <svg
      viewBox="0 0 24 24"
      className="mvbd-mail-svg"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
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
          BACKGROUND  (static poster image, dark theme)
          ===================================================== */}
      <div className="mvbd-bg" aria-hidden="true">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={FOOTER_BG_URL}
          alt=""
          className="mvbd-bg-img"
          decoding="async"
        />
        <div className="mvbd-bg-shade" />
      </div>

      <div className="mvbd-wrap">
        {/* ===================================================
            TOP: BRAND + COLUMNS
            =================================================== */}
        <div className="mvbd-top">
          {/* Brand */}
          <div className="mvbd-brand">
            <a href="/" className="mvbd-logo-link" aria-label="MoviesVerseBD home">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={LOGO_URL}
                alt="MoviesVerseBD"
                className="mvbd-logo"
                decoding="async"
              />
            </a>

            <p className="mvbd-desc">
              Your ultimate entertainment destination for movies, series,
              anime and more.
            </p>

            <p className="mvbd-desc mvbd-desc-sub">
              Discover your next favourite movie, series or anime with
              MoviesVerseBD.
            </p>

            <div className="mvbd-status">
              <span className="mvbd-live-dot" />
              MVBD is always evolving
            </div>
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

          {/* Support & Legal */}
          <nav className="mvbd-col" aria-label="Support and legal">
            <h3 className="mvbd-heading">Support</h3>
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
                <a href="mailto:support@mvbds.xyz" className="mvbd-link mvbd-link-mail">
                  <MailIcon /> support@mvbds.xyz
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
                  <SocialIcon platform={social.platform} />
                </a>
              ))}
            </div>
            <p className="mvbd-follow">
              FOLLOW <b>MVBD</b> EVERYWHERE
            </p>
          </div>
        </div>

        {/* ===================================================
            BOTTOM BAR
            =================================================== */}
        <div className="mvbd-bottom">
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

          <button
            type="button"
            onClick={handleBackToTop}
            className="mvbd-top-btn"
            aria-label="Back to top"
          >
            <ArrowUpIcon />
            <span>Back to top</span>
          </button>
        </div>
      </div>

      {/* =====================================================
          CSS  (global-scoped so icon sub-components are styled)
          ===================================================== */}
      <style jsx global>{`
        /* ---------- BASE ---------- */
        .mvbd-footer {
          position: relative;
          isolation: isolate;
          overflow: hidden;
          background: #07090c;
          color: rgba(255, 255, 255, 0.78);
          content-visibility: auto;
          contain-intrinsic-size: auto 560px;
        }

        /* ---------- BACKGROUND ---------- */
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
          display: block;
        }
        /* dark theme shade: image stays clearly visible,
           text stays easy to read */
        .mvbd-bg-shade {
          position: absolute;
          inset: 0;
          background:
            linear-gradient(
              180deg,
              #07090c 0%,
              rgba(7, 9, 12, 0.62) 16%,
              rgba(7, 9, 12, 0.55) 50%,
              rgba(7, 9, 12, 0.82) 82%,
              #07090c 100%
            );
        }

        .mvbd-wrap {
          position: relative;
          max-width: 1240px;
          margin: 0 auto;
          padding: 56px 20px 24px;
        }

        /* ---------- TOP GRID ---------- */
        .mvbd-top {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 36px 20px;
        }
        .mvbd-brand,
        .mvbd-col-social {
          grid-column: 1 / -1;
        }

        .mvbd-logo-link {
          display: inline-block;
          margin-bottom: 18px;
        }
        .mvbd-logo {
          display: block;
          height: 64px;
          width: auto;
          max-width: 260px;
          object-fit: contain;
          filter: drop-shadow(0 4px 14px rgba(0, 0, 0, 0.7));
        }
        .mvbd-desc {
          margin: 0;
          max-width: 360px;
          font-size: 14px;
          line-height: 1.75;
          color: rgba(255, 255, 255, 0.85);
          text-shadow: 0 1px 8px rgba(0, 0, 0, 0.8);
        }
        .mvbd-desc-sub {
          margin-top: 8px;
          color: rgba(255, 255, 255, 0.6);
        }
        .mvbd-status {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          margin-top: 18px;
          font-size: 12px;
          color: rgba(255, 255, 255, 0.7);
        }
        .mvbd-live-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #34d399;
          box-shadow: 0 0 8px #34d399;
        }

        .mvbd-heading {
          margin: 0 0 18px;
          font-size: 15px;
          font-weight: 700;
          letter-spacing: 0.3px;
          color: #fff;
          text-shadow: 0 1px 8px rgba(0, 0, 0, 0.8);
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
          display: inline-flex;
          align-items: center;
          gap: 7px;
          font-size: 14px;
          color: rgba(255, 255, 255, 0.72);
          text-decoration: none;
          text-shadow: 0 1px 8px rgba(0, 0, 0, 0.8);
          transition: color 0.2s ease;
        }
        .mvbd-link:hover {
          color: #fff;
          text-decoration: underline;
          text-underline-offset: 4px;
        }
        .mvbd-link-mail {
          color: #6ee7b7;
        }
        .mvbd-link-mail:hover {
          color: #a7f3d0;
        }
        .mvbd-mail-svg {
          width: 15px;
          height: 15px;
          flex-shrink: 0;
        }

        /* ---------- SOCIAL (plain, flat) ---------- */
        .mvbd-social-grid {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
        }
        .mvbd-social {
          --platform: #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 42px;
          height: 42px;
          border-radius: 50%;
          color: #fff;
          background: rgba(255, 255, 255, 0.12);
          transition: background 0.2s ease, transform 0.2s ease, color 0.2s ease;
        }
        .mvbd-social:hover {
          transform: translateY(-3px);
          background: var(--platform);
          color: #fff;
        }
        .mvbd-social.tiktok:hover,
        .mvbd-social.threads:hover {
          color: #000;
        }
        .mvbd-social-svg {
          width: 19px;
          height: 19px;
          display: block;
        }
        .mvbd-social.facebook { --platform: #1877f2; }
        .mvbd-social.instagram { --platform: #e1306c; }
        .mvbd-social.telegram { --platform: #229ed9; }
        .mvbd-social.whatsapp { --platform: #25d366; }
        .mvbd-social.youtube { --platform: #ff0000; }
        .mvbd-social.tiktok { --platform: #ffffff; }
        .mvbd-social.threads { --platform: #ffffff; }

        .mvbd-follow {
          margin: 16px 0 0;
          font-size: 9.5px;
          letter-spacing: 3px;
          color: rgba(255, 255, 255, 0.5);
        }
        .mvbd-follow b {
          color: #4ade80;
          font-weight: 700;
        }

        /* ---------- BOTTOM ---------- */
        .mvbd-bottom {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          gap: 16px;
          margin-top: 44px;
          padding-top: 20px;
          background: linear-gradient(
              90deg,
              transparent,
              rgba(255, 255, 255, 0.16),
              transparent
            )
            top / 100% 1px no-repeat;
        }
        .mvbd-bottom-left {
          display: flex;
          flex-direction: column;
          gap: 5px;
        }
        .mvbd-copy,
        .mvbd-made {
          margin: 0;
          font-size: 12px;
          color: rgba(255, 255, 255, 0.62);
        }
        .mvbd-maker {
          display: inline-block;
          margin-left: 3px;
          font-style: italic;
          font-family: cursive;
          font-weight: 700;
          font-size: 14px;
          letter-spacing: 0.5px;
          text-decoration: none;
          background: linear-gradient(90deg, #c4b5fd, #f472b6, #fb7185);
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
          transition: opacity 0.2s ease;
        }
        .mvbd-maker:hover {
          opacity: 0.8;
        }
        .mvbd-top-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          height: 38px;
          padding: 0 16px;
          border: 0;
          border-radius: 999px;
          font-size: 12.5px;
          font-weight: 600;
          color: #fff;
          cursor: pointer;
          background: rgba(255, 255, 255, 0.12);
          transition: background 0.2s ease, color 0.2s ease;
        }
        .mvbd-top-btn:hover {
          background: #10b981;
          color: #03140c;
        }

        /* ---------- TABLET ---------- */
        @media (min-width: 640px) {
          .mvbd-wrap {
            padding: 70px 28px 28px;
          }
          .mvbd-logo {
            height: 72px;
          }
        }

        /* ---------- DESKTOP ---------- */
        @media (min-width: 960px) {
          .mvbd-wrap {
            padding: 90px 36px 30px;
          }
          .mvbd-top {
            grid-template-columns: 1.5fr 0.8fr 1fr 1.1fr;
            gap: 56px;
          }
          .mvbd-brand,
          .mvbd-col-social {
            grid-column: auto;
          }
          .mvbd-logo {
            height: 84px;
          }
          .mvbd-bottom {
            flex-direction: row;
            align-items: center;
            justify-content: space-between;
            margin-top: 64px;
          }
        }

        @media (prefers-reduced-motion: reduce) {
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
