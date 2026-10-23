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
    <svg viewBox="0 0 24 24" className="mvbd-btn-svg" fill="currentColor" aria-hidden="true">
      <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
    </svg>
  )
}

function ArrowUpIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="mvbd-btn-svg"
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

function ChevronIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="mvbd-chevron"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M9 6l6 6-6 6" />
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
          BACKGROUND  (static image + cheap gradients)
          ===================================================== */}
      <div className="mvbd-bg" aria-hidden="true">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={FOOTER_BG_URL}
          alt=""
          className="mvbd-bg-img"
          decoding="async"
        />
        <div className="mvbd-bg-tone" />
        <div className="mvbd-bg-fade-top" />
        <div className="mvbd-bg-fade-bottom" />
        <div className="mvbd-orb mvbd-orb-1" />
        <div className="mvbd-orb mvbd-orb-2" />
        <div className="mvbd-orb mvbd-orb-3" />
      </div>

      <div className="mvbd-wrap">
        {/* ===================================================
            HERO  (centered logo, Netflix / HBO style)
            =================================================== */}
        <section className="mvbd-glass mvbd-hero">
          <div className="mvbd-hero-logo-wrap">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={LOGO_URL}
              alt="MoviesVerseBD"
              className="mvbd-hero-logo"
              decoding="async"
            />
          </div>

          <div className="mvbd-eyebrow">
            <span className="mvbd-live-dot" />
            MVBD is always evolving
          </div>

          <h2 className="mvbd-hero-title">
            Questions? We&apos;re always here for you.
          </h2>

          <p className="mvbd-hero-sub">
            Your ultimate entertainment destination for movies, series, anime
            and more.
          </p>

          <div className="mvbd-pills" aria-hidden="true">
            <span className="mvbd-pill">Movies</span>
            <span className="mvbd-pill">Series</span>
            <span className="mvbd-pill">Anime</span>
            <span className="mvbd-pill">& More</span>
          </div>

          <div className="mvbd-hero-actions">
            <a href="#contact" className="mvbd-btn mvbd-btn-primary">
              Contact Us
              <ChevronIcon />
            </a>
            <a href="mailto:support@mvbds.xyz" className="mvbd-btn mvbd-btn-ghost">
              <MailIcon />
              support@mvbds.xyz
            </a>
          </div>
        </section>

        {/* ===================================================
            MAIN GLASS SLAB
            =================================================== */}
        <div className="mvbd-glass mvbd-slab">
          <div className="mvbd-cols">
            {/* About */}
            <div className="mvbd-col mvbd-col-about">
              <h3 className="mvbd-heading">About MVBD</h3>
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
            <nav className="mvbd-col" aria-label="Support and legal">
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

          <div className="mvbd-follow-row">
            <span className="mvbd-follow-line" />
            <span className="mvbd-follow">
              FOLLOW <b>MVBD</b> EVERYWHERE
            </span>
            <span className="mvbd-follow-line" />
          </div>

          {/* Bottom bar */}
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
          background: #05080b;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
          color: rgba(255, 255, 255, 0.72);
          content-visibility: auto;
          contain-intrinsic-size: auto 980px;
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
          opacity: 1;
          filter: saturate(1.15) contrast(1.05);
        }
        /* very light tone so the picture stays clearly visible */
        .mvbd-bg-tone {
          position: absolute;
          inset: 0;
          background: rgba(3, 6, 10, 0.28);
        }
        .mvbd-bg-fade-top {
          position: absolute;
          left: 0;
          right: 0;
          top: 0;
          height: 140px;
          background: linear-gradient(180deg, #05080b 0%, rgba(5, 8, 11, 0) 100%);
        }
        .mvbd-bg-fade-bottom {
          position: absolute;
          left: 0;
          right: 0;
          bottom: 0;
          height: 160px;
          background: linear-gradient(0deg, rgba(5, 8, 11, 0.85) 0%, rgba(5, 8, 11, 0) 100%);
        }
        /* colored light blobs: plain radial gradients, zero blur cost */
        .mvbd-orb {
          position: absolute;
          border-radius: 50%;
        }
        .mvbd-orb-1 {
          width: 620px;
          height: 620px;
          top: -220px;
          left: -160px;
          background: radial-gradient(circle, rgba(16, 185, 129, 0.34), transparent 68%);
        }
        .mvbd-orb-2 {
          width: 560px;
          height: 560px;
          top: 30%;
          right: -200px;
          background: radial-gradient(circle, rgba(56, 189, 248, 0.24), transparent 68%);
        }
        .mvbd-orb-3 {
          width: 600px;
          height: 600px;
          bottom: -260px;
          left: 30%;
          background: radial-gradient(circle, rgba(139, 92, 246, 0.28), transparent 68%);
        }

        .mvbd-wrap {
          position: relative;
          max-width: 1240px;
          margin: 0 auto;
          padding: 44px 14px 26px;
        }

        /* ---------- LIQUID GLASS ---------- */
        .mvbd-glass {
          position: relative;
          overflow: hidden;
          border-radius: 30px;
          background:
            linear-gradient(135deg, rgba(255, 255, 255, 0.16) 0%, rgba(255, 255, 255, 0.05) 40%, rgba(255, 255, 255, 0.03) 60%, rgba(255, 255, 255, 0.1) 100%);
          -webkit-backdrop-filter: blur(18px) saturate(180%) brightness(1.05);
          backdrop-filter: blur(18px) saturate(180%) brightness(1.05);
          box-shadow:
            inset 0 1.5px 0 rgba(255, 255, 255, 0.4),
            inset 0 -1.5px 0 rgba(255, 255, 255, 0.08),
            inset 1px 0 0 rgba(255, 255, 255, 0.12),
            inset -1px 0 0 rgba(255, 255, 255, 0.08),
            inset 0 0 40px rgba(255, 255, 255, 0.04),
            0 30px 80px rgba(0, 0, 0, 0.55);
        }
        /* refractive gradient edge */
        .mvbd-glass::after {
          content: "";
          position: absolute;
          inset: 0;
          border-radius: inherit;
          padding: 1.2px;
          background: linear-gradient(
            140deg,
            rgba(255, 255, 255, 0.7),
            rgba(255, 255, 255, 0.08) 28%,
            rgba(255, 255, 255, 0.04) 68%,
            rgba(110, 231, 183, 0.5)
          );
          -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
          -webkit-mask-composite: xor;
          mask: linear-gradient(#000 0 0) content-box exclude, linear-gradient(#000 0 0);
          pointer-events: none;
        }
        /* soft specular sheen */
        .mvbd-glass::before {
          content: "";
          position: absolute;
          inset: 0;
          border-radius: inherit;
          background:
            radial-gradient(90% 55% at 12% 0%, rgba(255, 255, 255, 0.22), transparent 60%),
            radial-gradient(60% 40% at 100% 100%, rgba(110, 231, 183, 0.1), transparent 70%);
          pointer-events: none;
        }
        .mvbd-glass > * {
          position: relative;
          z-index: 1;
        }

        /* ---------- HERO ---------- */
        .mvbd-hero {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          padding: 40px 22px 38px;
          margin-bottom: 22px;
        }
        .mvbd-hero-logo-wrap {
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 20px;
        }
        .mvbd-hero-logo {
          display: block;
          height: 78px;
          width: auto;
          max-width: 82%;
          object-fit: contain;
          filter: drop-shadow(0 10px 28px rgba(0, 0, 0, 0.6));
        }
        .mvbd-eyebrow {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 7px 14px;
          border-radius: 999px;
          font-size: 11.5px;
          font-weight: 500;
          letter-spacing: 0.3px;
          color: rgba(255, 255, 255, 0.85);
          background: rgba(255, 255, 255, 0.09);
          border: 1px solid rgba(255, 255, 255, 0.18);
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.25);
        }
        .mvbd-live-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #4ade80;
          box-shadow: 0 0 10px #4ade80;
        }
        .mvbd-hero-title {
          margin: 18px 0 10px;
          font-size: 26px;
          line-height: 1.18;
          font-weight: 800;
          letter-spacing: -0.8px;
          color: #fff;
          text-shadow: 0 4px 24px rgba(0, 0, 0, 0.5);
        }
        .mvbd-hero-sub {
          margin: 0;
          max-width: 520px;
          font-size: 14.5px;
          line-height: 1.65;
          color: rgba(255, 255, 255, 0.78);
        }
        .mvbd-pills {
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          gap: 8px;
          margin-top: 20px;
        }
        .mvbd-pill {
          padding: 7px 16px;
          border-radius: 999px;
          font-size: 12px;
          font-weight: 600;
          color: #d1fae5;
          background: linear-gradient(145deg, rgba(52, 211, 153, 0.22), rgba(52, 211, 153, 0.06));
          border: 1px solid rgba(110, 231, 183, 0.32);
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.2);
        }
        .mvbd-hero-actions {
          display: flex;
          flex-direction: column;
          width: 100%;
          max-width: 420px;
          gap: 12px;
          margin-top: 28px;
        }

        .mvbd-btn {
          position: relative;
          overflow: hidden;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 9px;
          min-height: 52px;
          padding: 0 26px;
          border-radius: 999px;
          font-size: 14.5px;
          font-weight: 700;
          text-decoration: none;
          transition: transform 0.22s ease, box-shadow 0.22s ease, background 0.22s ease;
        }
        .mvbd-btn::before {
          content: "";
          position: absolute;
          top: 0;
          left: -70%;
          width: 45%;
          height: 100%;
          transform: skewX(-20deg);
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.45), transparent);
          transition: left 0.6s ease;
        }
        .mvbd-btn:hover {
          transform: translateY(-3px);
        }
        .mvbd-btn:hover::before {
          left: 130%;
        }
        .mvbd-btn-primary {
          color: #03140c;
          background: linear-gradient(135deg, #a7f3d0, #34d399 50%, #10b981);
          box-shadow: 0 14px 34px rgba(16, 185, 129, 0.45), inset 0 1.5px 0 rgba(255, 255, 255, 0.65);
        }
        .mvbd-btn-primary:hover {
          box-shadow: 0 18px 44px rgba(16, 185, 129, 0.6), inset 0 1.5px 0 rgba(255, 255, 255, 0.7);
        }
        .mvbd-btn-ghost {
          color: #d1fae5;
          background: linear-gradient(145deg, rgba(255, 255, 255, 0.16), rgba(255, 255, 255, 0.05));
          border: 1px solid rgba(255, 255, 255, 0.24);
          box-shadow: inset 0 1.5px 0 rgba(255, 255, 255, 0.3), 0 10px 26px rgba(0, 0, 0, 0.3);
        }
        .mvbd-btn-ghost:hover {
          background: linear-gradient(145deg, rgba(255, 255, 255, 0.24), rgba(255, 255, 255, 0.08));
        }
        .mvbd-btn-svg {
          width: 17px;
          height: 17px;
          flex-shrink: 0;
        }
        .mvbd-chevron {
          width: 17px;
          height: 17px;
          flex-shrink: 0;
          transition: transform 0.22s ease;
        }
        .mvbd-btn:hover .mvbd-chevron {
          transform: translateX(4px);
        }

        /* ---------- MAIN SLAB ---------- */
        .mvbd-slab {
          padding: 34px 22px 22px;
        }
        .mvbd-cols {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 32px 18px;
        }
        .mvbd-col-about,
        .mvbd-col-social {
          grid-column: 1 / -1;
        }

        .mvbd-heading {
          position: relative;
          margin: 0 0 18px;
          padding-bottom: 12px;
          font-size: 15.5px;
          font-weight: 700;
          letter-spacing: 0.2px;
          color: #fff;
        }
        .mvbd-heading::after {
          content: "";
          position: absolute;
          left: 0;
          bottom: 0;
          width: 32px;
          height: 3px;
          border-radius: 99px;
          background: linear-gradient(90deg, #34d399, rgba(52, 211, 153, 0));
          box-shadow: 0 0 14px rgba(52, 211, 153, 0.6);
        }
        .mvbd-text {
          margin: 0;
          max-width: 340px;
          font-size: 14px;
          line-height: 1.75;
          color: rgba(255, 255, 255, 0.72);
        }
        .mvbd-tagline {
          margin-top: 18px;
          font-size: 10px;
          letter-spacing: 4px;
          color: rgba(255, 255, 255, 0.5);
        }

        .mvbd-list {
          list-style: none;
          margin: 0;
          padding: 0;
          display: flex;
          flex-direction: column;
          gap: 13px;
        }
        .mvbd-link {
          position: relative;
          display: inline-block;
          font-size: 14px;
          color: rgba(255, 255, 255, 0.72);
          text-decoration: none;
          transition: color 0.2s ease, transform 0.2s ease;
        }
        .mvbd-link::after {
          content: "";
          position: absolute;
          left: 0;
          bottom: -3px;
          width: 100%;
          height: 1.5px;
          background: linear-gradient(90deg, #34d399, transparent);
          transform: scaleX(0);
          transform-origin: left;
          transition: transform 0.25s ease;
        }
        .mvbd-link:hover {
          color: #a7f3d0;
          transform: translateX(3px);
        }
        .mvbd-link:hover::after {
          transform: scaleX(1);
        }

        /* ---------- SOCIAL (glass tiles) ---------- */
        .mvbd-social-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 10px;
        }
        .mvbd-social {
          --platform: #ffffff;
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          padding: 12px 4px 10px;
          border-radius: 18px;
          color: rgba(255, 255, 255, 0.82);
          text-decoration: none;
          background: linear-gradient(150deg, rgba(255, 255, 255, 0.16), rgba(255, 255, 255, 0.04));
          border: 1px solid rgba(255, 255, 255, 0.16);
          box-shadow: inset 0 1.5px 0 rgba(255, 255, 255, 0.28), 0 10px 24px rgba(0, 0, 0, 0.3);
          transition: transform 0.22s ease, border-color 0.22s ease, box-shadow 0.22s ease, background 0.22s ease;
        }
        .mvbd-social:hover {
          transform: translateY(-5px);
          border-color: color-mix(in srgb, var(--platform) 55%, transparent);
          background: linear-gradient(150deg, color-mix(in srgb, var(--platform) 26%, transparent), rgba(255, 255, 255, 0.05));
          box-shadow:
            inset 0 1.5px 0 rgba(255, 255, 255, 0.35),
            0 16px 34px rgba(0, 0, 0, 0.4),
            0 0 26px color-mix(in srgb, var(--platform) 35%, transparent);
        }
        .mvbd-social-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 40px;
          height: 40px;
          border-radius: 14px;
          color: var(--platform);
          background: rgba(0, 0, 0, 0.28);
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.22), inset 0 0 14px color-mix(in srgb, var(--platform) 18%, transparent);
        }
        .mvbd-social-svg {
          width: 20px;
          height: 20px;
          display: block;
        }
        .mvbd-social-name {
          max-width: 100%;
          font-size: 10.5px;
          font-weight: 600;
          letter-spacing: 0.2px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .mvbd-social.facebook { --platform: #3b8bff; }
        .mvbd-social.instagram { --platform: #f472b6; }
        .mvbd-social.telegram { --platform: #38bdf8; }
        .mvbd-social.whatsapp { --platform: #25d366; }
        .mvbd-social.youtube { --platform: #ff4040; }
        .mvbd-social.tiktok { --platform: #ffffff; }
        .mvbd-social.threads { --platform: #ffffff; }

        /* ---------- FOLLOW STRIP ---------- */
        .mvbd-follow-row {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 14px;
          margin: 32px 0 20px;
        }
        .mvbd-follow-line {
          flex: 1;
          max-width: 140px;
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(110, 231, 183, 0.55), transparent);
        }
        .mvbd-follow {
          font-size: 9.5px;
          letter-spacing: 3px;
          white-space: nowrap;
          color: rgba(255, 255, 255, 0.55);
        }
        .mvbd-follow b {
          color: #4ade80;
          font-weight: 700;
        }

        /* ---------- BOTTOM ---------- */
        .mvbd-bottom {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 16px;
          padding-top: 18px;
          text-align: center;
          border-top: 1px solid rgba(255, 255, 255, 0.12);
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
          height: 42px;
          padding: 0 18px;
          border-radius: 999px;
          font-size: 12.5px;
          font-weight: 600;
          color: #d1fae5;
          cursor: pointer;
          background: linear-gradient(145deg, rgba(255, 255, 255, 0.18), rgba(255, 255, 255, 0.05));
          border: 1px solid rgba(255, 255, 255, 0.22);
          box-shadow: inset 0 1.5px 0 rgba(255, 255, 255, 0.3);
          transition: transform 0.2s ease, background 0.2s ease;
        }
        .mvbd-top-btn:hover {
          transform: translateY(-3px);
          background: rgba(52, 211, 153, 0.22);
        }

        /* ---------- TABLET ---------- */
        @media (min-width: 640px) {
          .mvbd-wrap {
            padding: 56px 24px 30px;
          }
          .mvbd-hero {
            padding: 52px 40px 48px;
          }
          .mvbd-hero-logo {
            height: 96px;
          }
          .mvbd-hero-title {
            font-size: 36px;
          }
          .mvbd-hero-actions {
            flex-direction: row;
            max-width: none;
            width: auto;
          }
          .mvbd-slab {
            padding: 42px 36px 26px;
          }
          .mvbd-social-grid {
            grid-template-columns: repeat(4, minmax(0, 1fr));
          }
        }

        /* ---------- DESKTOP ---------- */
        @media (min-width: 960px) {
          .mvbd-wrap {
            padding: 70px 32px 34px;
          }
          .mvbd-hero {
            padding: 64px 48px 58px;
            margin-bottom: 26px;
          }
          .mvbd-hero-logo {
            height: 112px;
          }
          .mvbd-hero-title {
            font-size: 44px;
            letter-spacing: -1.2px;
          }
          .mvbd-hero-sub {
            font-size: 16px;
          }
          .mvbd-slab {
            padding: 52px 52px 28px;
          }
          .mvbd-cols {
            grid-template-columns: 1.15fr 0.8fr 0.95fr 1.6fr;
            gap: 48px;
          }
          .mvbd-col-about,
          .mvbd-col-social {
            grid-column: auto;
          }
          .mvbd-social-grid {
            grid-template-columns: repeat(4, minmax(0, 1fr));
          }
          .mvbd-bottom {
            flex-direction: row;
            justify-content: space-between;
            text-align: left;
          }
        }

        /* ---------- MOBILE: lighter blur for smoothness ---------- */
        @media (max-width: 640px) {
          .mvbd-glass {
            border-radius: 26px;
            -webkit-backdrop-filter: blur(12px) saturate(160%);
            backdrop-filter: blur(12px) saturate(160%);
            box-shadow:
              inset 0 1.5px 0 rgba(255, 255, 255, 0.38),
              inset 0 -1px 0 rgba(255, 255, 255, 0.08),
              0 20px 50px rgba(0, 0, 0, 0.5);
          }
          .mvbd-orb-1,
          .mvbd-orb-2,
          .mvbd-orb-3 {
            width: 380px;
            height: 380px;
          }
        }

        /* no backdrop-filter support -> solid dark glass */
        @supports not ((backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px))) {
          .mvbd-glass {
            background: rgba(12, 20, 20, 0.86);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .mvbd-btn,
          .mvbd-btn::before,
          .mvbd-link,
          .mvbd-social,
          .mvbd-top-btn,
          .mvbd-chevron {
            transition: none !important;
          }
        }
      `}</style>
    </footer>
  )
}
