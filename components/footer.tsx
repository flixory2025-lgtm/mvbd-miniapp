"use client"

import Link from "next/link"
import { useEffect, useState } from "react"

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

/* =========================================================
   ICON SELECTOR
   ========================================================= */

function SocialIcon({
  platform,
}: {
  platform: SocialPlatform
}) {
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
      url: "https://youtube.com/@mvbdstudio?si=d0_d4Bxxsz8_Awaz",
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

  return (
    <footer className="mvbd-footer relative overflow-hidden">

      {/* =====================================================
          ANIMATED BACKGROUND
          ===================================================== */}

      <div className="mvbd-footer-bg">

        {/* Aurora */}
        <div className="mvbd-aurora mvbd-aurora-1" />
        <div className="mvbd-aurora mvbd-aurora-2" />
        <div className="mvbd-aurora mvbd-aurora-3" />

        {/* Moving Grid */}
        <div className="mvbd-grid" />

        {/* Floating particles */}
        <span className="mvbd-particle p1" />
        <span className="mvbd-particle p2" />
        <span className="mvbd-particle p3" />
        <span className="mvbd-particle p4" />
        <span className="mvbd-particle p5" />
        <span className="mvbd-particle p6" />

        {/* Bottom light */}
        <div className="mvbd-bottom-light" />
      </div>

      <div className="relative z-10 px-4 py-10 max-w-6xl mx-auto">

        {/* ===================================================
            TOP BRAND
            =================================================== */}

        <div className="text-center mb-9">

          <div className="inline-flex items-center justify-center gap-2 mb-3">

            <div className="mvbd-brand-orb">
              <span>M</span>
            </div>

            <div className="text-left">
              <div className="mvbd-brand-title">
                MoviesVerse<span>BD</span>
              </div>

              <div className="mvbd-brand-subtitle">
                YOUR MOVIE UNIVERSE
              </div>
            </div>

          </div>

          <p className="text-slate-400 text-sm max-w-md mx-auto leading-relaxed">
            Your ultimate entertainment destination for movies, series,
            anime and more.
          </p>

        </div>

        {/* ===================================================
            MAIN FOOTER CONTENT
            =================================================== */}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-9">

          {/* About */}
          <div className="mvbd-footer-column">

            <div className="mvbd-section-title">
              <span />
              About MVBD
            </div>

            <p className="text-slate-400 text-sm leading-6">
              Discover your next favourite movie, series or anime
              with MoviesVerseBD.
            </p>

            <div className="mvbd-mini-status">
              <span className="mvbd-live-dot" />
              MVBD is always evolving
            </div>

          </div>

          {/* Quick Links */}
          <div className="mvbd-footer-column">

            <div className="mvbd-section-title">
              <span />
              Quick Links
            </div>

            <div className="grid grid-cols-2 gap-2">

              <a
                href="#profile"
                className="mvbd-quick-link"
              >
                Profile
              </a>

              <a
                href="#about"
                className="mvbd-quick-link"
              >
                About Us
              </a>

              <a
                href="#contact"
                className="mvbd-quick-link"
              >
                Contact Us
              </a>

              <a
                href="#subscriptions"
                className="mvbd-quick-link"
              >
                Subscriptions
              </a>

            </div>

          </div>

          {/* Social */}
          <div className="mvbd-footer-column">

            <div className="mvbd-section-title">
              <span />
              Connect With Us
            </div>

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

                  {/* animated ring */}
                  <span className="mvbd-social-ring" />

                  {/* orbit dot */}
                  <span className="mvbd-orbit">
                    <span />
                  </span>

                  {/* icon */}
                  <span className="mvbd-social-icon">
                    <SocialIcon platform={social.platform} />
                  </span>

                  {/* shine */}
                  <span className="mvbd-social-shine" />

                </a>
              ))}

            </div>

          </div>

        </div>

        {/* ===================================================
            SOCIAL LABEL STRIP
            =================================================== */}

        <div className="mvbd-social-strip">

          <div className="mvbd-social-strip-line" />

          <span>
            FOLLOW <b>MVBD</b> EVERYWHERE
          </span>

          <div className="mvbd-social-strip-line" />

        </div>

        {/* ===================================================
            DIVIDER
            =================================================== */}

        <div className="mvbd-divider" />

        {/* ===================================================
            BOTTOM
            =================================================== */}

        <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left">

          <div className="space-y-1.5">

            <p className="text-slate-500 text-xs">
              © {currentYear} MoviesVerseBD. All rights reserved.
            </p>

            <div className="text-slate-600 text-xs">

              Made by{" "}

              <a
                href="https://wa.me/qr/R2ZGCQAMXWRPP1"
                target="_blank"
                rel="noopener noreferrer"
                className="mvbd-maker"
              >
                Abdul Mazid
              </a>

            </div>

          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 text-xs text-slate-500">

            <a
              href="#privacy"
              className="mvbd-bottom-link"
            >
              Privacy Policy
            </a>

            <span className="text-slate-700">•</span>

            <a
              href="#terms"
              className="mvbd-bottom-link"
            >
              Terms & Conditions
            </a>

            <span className="text-slate-700">•</span>

            <a
              href="#contact"
              className="mvbd-bottom-link"
            >
              Contact
            </a>

          </div>

        </div>

      </div>

      {/* =====================================================
          ALL FOOTER CSS
          ===================================================== */}

      <style jsx>{`

        /* =========================
           FOOTER BASE
           ========================= */

        .mvbd-footer {
          min-height: 420px;
          background:
            radial-gradient(
              circle at 50% 0%,
              rgba(16,185,129,.075),
              transparent 35%
            ),
            #020504;
          border-top: 1px solid rgba(255,255,255,.08);
        }

        .mvbd-footer-bg {
          position: absolute;
          inset: 0;
          overflow: hidden;
          pointer-events: none;
        }

        /* =========================
           AURORA
           ========================= */

        .mvbd-aurora {
          position: absolute;
          width: 420px;
          height: 220px;
          border-radius: 50%;
          filter: blur(80px);
          opacity: .13;
          mix-blend-mode: screen;
        }

        .mvbd-aurora-1 {
          top: -110px;
          left: 5%;
          background: #00ff88;
          animation: mvbdAurora1 12s ease-in-out infinite alternate;
        }

        .mvbd-aurora-2 {
          top: 80px;
          right: -100px;
          background: #00b7ff;
          animation: mvbdAurora2 15s ease-in-out infinite alternate;
        }

        .mvbd-aurora-3 {
          bottom: -150px;
          left: 35%;
          background: #7c3aed;
          animation: mvbdAurora3 18s ease-in-out infinite alternate;
        }

        @keyframes mvbdAurora1 {
          0% {
            transform: translate3d(-40px,0,0) scale(.8);
          }
          100% {
            transform: translate3d(230px,90px,0) scale(1.25);
          }
        }

        @keyframes mvbdAurora2 {
          0% {
            transform: translate3d(0,40px,0) scale(1);
          }
          100% {
            transform: translate3d(-220px,-80px,0) scale(1.35);
          }
        }

        @keyframes mvbdAurora3 {
          0% {
            transform: translate3d(-100px,30px,0) scale(.9);
          }
          100% {
            transform: translate3d(180px,-80px,0) scale(1.3);
          }
        }

        /* =========================
           MOVING GRID
           ========================= */

        .mvbd-grid {
          position: absolute;
          inset: -100px;
          opacity: .035;
          background-image:
            linear-gradient(
              rgba(255,255,255,.7) 1px,
              transparent 1px
            ),
            linear-gradient(
              90deg,
              rgba(255,255,255,.7) 1px,
              transparent 1px
            );
          background-size: 45px 45px;
          transform: perspective(500px) rotateX(58deg) scale(1.5);
          transform-origin: center bottom;
          animation: mvbdGridMove 12s linear infinite;
        }

        @keyframes mvbdGridMove {
          from {
            background-position: 0 0;
          }
          to {
            background-position: 0 45px;
          }
        }

        /* =========================
           PARTICLES
           ========================= */

        .mvbd-particle {
          position: absolute;
          width: 3px;
          height: 3px;
          border-radius: 50%;
          background: rgba(110,255,180,.8);
          box-shadow:
            0 0 12px rgba(52,211,153,.8);
          animation: mvbdParticleFloat 7s ease-in-out infinite;
        }

        .p1 {
          left: 8%;
          top: 25%;
          animation-delay: -1s;
        }

        .p2 {
          left: 25%;
          top: 70%;
          animation-delay: -4s;
        }

        .p3 {
          left: 48%;
          top: 18%;
          animation-delay: -2s;
        }

        .p4 {
          right: 18%;
          top: 35%;
          animation-delay: -5s;
        }

        .p5 {
          right: 8%;
          top: 75%;
          animation-delay: -3s;
        }

        .p6 {
          left: 68%;
          bottom: 10%;
          animation-delay: -6s;
        }

        @keyframes mvbdParticleFloat {
          0%, 100% {
            transform: translate3d(0,0,0);
            opacity: .25;
          }
          50% {
            transform: translate3d(0,-28px,0);
            opacity: 1;
          }
        }

        /* =========================
           BOTTOM LIGHT
           ========================= */

        .mvbd-bottom-light {
          position: absolute;
          bottom: -100px;
          left: 50%;
          width: 70%;
          height: 180px;
          transform: translateX(-50%);
          background: rgba(16,185,129,.18);
          filter: blur(80px);
          animation: mvbdBottomGlow 5s ease-in-out infinite alternate;
        }

        @keyframes mvbdBottomGlow {
          from {
            opacity: .35;
            transform: translateX(-50%) scale(.85);
          }
          to {
            opacity: .8;
            transform: translateX(-50%) scale(1.15);
          }
        }

        /* =========================
           BRAND
           ========================= */

        .mvbd-brand-orb {
          position: relative;
          width: 44px;
          height: 44px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 14px;
          background:
            linear-gradient(
              135deg,
              rgba(74,222,128,.2),
              rgba(16,185,129,.05)
            );
          border: 1px solid rgba(74,222,128,.28);
          box-shadow:
            0 0 25px rgba(16,185,129,.12),
            inset 0 1px 0 rgba(255,255,255,.12);
          overflow: hidden;
        }

        .mvbd-brand-orb::before {
          content: "";
          position: absolute;
          width: 80px;
          height: 20px;
          background: rgba(255,255,255,.12);
          transform: rotate(-35deg) translateX(-60px);
          animation: mvbdBrandShine 3.5s ease-in-out infinite;
        }

        .mvbd-brand-orb span {
          position: relative;
          z-index: 2;
          font-size: 21px;
          font-weight: 900;
          color: #4ade80;
        }

        @keyframes mvbdBrandShine {
          0%, 65% {
            transform: rotate(-35deg) translateX(-70px);
          }
          100% {
            transform: rotate(-35deg) translateX(90px);
          }
        }

        .mvbd-brand-title {
          font-size: 20px;
          line-height: 1;
          font-weight: 800;
          color: white;
          letter-spacing: -.5px;
        }

        .mvbd-brand-title span {
          color: #4ade80;
        }

        .mvbd-brand-subtitle {
          margin-top: 4px;
          font-size: 7px;
          letter-spacing: 3px;
          color: rgba(255,255,255,.35);
        }

        /* =========================
           SECTION TITLES
           ========================= */

        .mvbd-section-title {
          display: flex;
          align-items: center;
          gap: 9px;
          color: white;
          font-size: 15px;
          font-weight: 700;
          margin-bottom: 15px;
        }

        .mvbd-section-title span {
          width: 4px;
          height: 18px;
          border-radius: 99px;
          background: #34d399;
          box-shadow: 0 0 12px rgba(52,211,153,.65);
          animation: mvbdTitlePulse 2s ease-in-out infinite;
        }

        @keyframes mvbdTitlePulse {
          0%,100% {
            opacity: .45;
            transform: scaleY(.75);
          }
          50% {
            opacity: 1;
            transform: scaleY(1);
          }
        }

        /* =========================
           STATUS
           ========================= */

        .mvbd-mini-status {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          margin-top: 16px;
          padding: 7px 10px;
          border-radius: 999px;
          background: rgba(255,255,255,.035);
          border: 1px solid rgba(255,255,255,.07);
          color: rgba(255,255,255,.38);
          font-size: 10px;
        }

        .mvbd-live-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #4ade80;
          box-shadow: 0 0 10px #4ade80;
          animation: mvbdLivePulse 1.5s ease-in-out infinite;
        }

        @keyframes mvbdLivePulse {
          0%,100% {
            transform: scale(.7);
            opacity: .45;
          }
          50% {
            transform: scale(1.15);
            opacity: 1;
          }
        }

        /* =========================
           QUICK LINKS
           ========================= */

        .mvbd-quick-link {
          position: relative;
          padding: 8px 10px;
          border-radius: 9px;
          color: rgba(255,255,255,.42);
          font-size: 12px;
          background: rgba(255,255,255,.025);
          border: 1px solid transparent;
          transition:
            color .25s ease,
            background .25s ease,
            border-color .25s ease,
            transform .25s ease;
        }

        .mvbd-quick-link:hover {
          color: #6ee7b7;
          background: rgba(52,211,153,.06);
          border-color: rgba(52,211,153,.13);
          transform: translateY(-2px);
        }

        /* =========================
           SOCIAL GRID
           ========================= */

        .mvbd-social-grid {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
        }

        .mvbd-social {
          --platform: #ffffff;

          position: relative;
          width: 45px;
          height: 45px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 15px;

          color: rgba(255,255,255,.68);

          background:
            linear-gradient(
              145deg,
              rgba(255,255,255,.09),
              rgba(255,255,255,.025)
            );

          border: 1px solid rgba(255,255,255,.10);

          box-shadow:
            inset 0 1px 0 rgba(255,255,255,.08),
            0 8px 25px rgba(0,0,0,.22);

          overflow: visible;

          transition:
            transform .35s cubic-bezier(.22,1,.36,1),
            color .3s ease,
            border-color .3s ease,
            box-shadow .3s ease;
        }

        .mvbd-social:hover {
          transform: translateY(-7px) scale(1.08);
          color: var(--platform);
          border-color: color-mix(
            in srgb,
            var(--platform) 35%,
            transparent
          );

          box-shadow:
            0 12px 35px rgba(0,0,0,.3),
            0 0 25px color-mix(
              in srgb,
              var(--platform) 20%,
              transparent
            ),
            inset 0 1px 0 rgba(255,255,255,.13);
        }

        /* =========================
           PLATFORM COLORS
           ========================= */

        .mvbd-social.facebook {
          --platform: #1877f2;
        }

        .mvbd-social.instagram {
          --platform: #f472b6;
        }

        .mvbd-social.telegram {
          --platform: #38bdf8;
        }

        .mvbd-social.whatsapp {
          --platform: #25d366;
        }

        .mvbd-social.youtube {
          --platform: #ff3333;
        }

        .mvbd-social.tiktok {
          --platform: #ffffff;
        }

        .mvbd-social.threads {
          --platform: #ffffff;
        }

        /* =========================
           ICON
           ========================= */

        .mvbd-social-icon {
          position: relative;
          z-index: 5;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 22px;
          height: 22px;

          transition:
            transform .35s cubic-bezier(.22,1,.36,1),
            filter .35s ease;
        }

        .mvbd-social:hover .mvbd-social-icon {
          transform: scale(1.13) rotate(-3deg);
          filter:
            drop-shadow(
              0 0 8px
              color-mix(
                in srgb,
                var(--platform) 70%,
                transparent
              )
            );
        }

        .mvbd-social-svg {
          width: 100%;
          height: 100%;
          display: block;
        }

        /* =========================
           LIVE RING
           ========================= */

        .mvbd-social-ring {
          position: absolute;
          inset: -1px;
          border-radius: inherit;
          border: 1px solid transparent;
          opacity: 0;
          pointer-events: none;
        }

        .mvbd-social:hover .mvbd-social-ring {
          border-color: var(--platform);
          animation: mvbdSocialRing 1.5s ease-out infinite;
        }

        @keyframes mvbdSocialRing {
          0% {
            inset: 0;
            opacity: .65;
          }
          100% {
            inset: -9px;
            opacity: 0;
          }
        }

        /* =========================
           ORBIT DOT
           ========================= */

        .mvbd-orbit {
          position: absolute;
          inset: -5px;
          border-radius: 50%;
          pointer-events: none;
          opacity: 0;
        }

        .mvbd-orbit span {
          position: absolute;
          top: -2px;
          left: 50%;
          width: 4px;
          height: 4px;
          transform: translateX(-50%);
          border-radius: 50%;
          background: var(--platform);
          box-shadow:
            0 0 8px var(--platform);
        }

        .mvbd-social:hover .mvbd-orbit {
          opacity: 1;
          animation: mvbdOrbit 2.2s linear infinite;
        }

        @keyframes mvbdOrbit {
          to {
            transform: rotate(360deg);
          }
        }

        /* =========================
           ICON SHINE
           ========================= */

        .mvbd-social-shine {
          position: absolute;
          z-index: 2;
          top: -20%;
          left: -80%;
          width: 55%;
          height: 140%;
          transform: rotate(20deg);
          background: linear-gradient(
            90deg,
            transparent,
            rgba(255,255,255,.2),
            transparent
          );
          pointer-events: none;
        }

        .mvbd-social:hover .mvbd-social-shine {
          animation: mvbdSocialShine .65s ease;
        }

        @keyframes mvbdSocialShine {
          from {
            left: -80%;
          }
          to {
            left: 140%;
          }
        }

        /* =========================
           SOCIAL STRIP
           ========================= */

        .mvbd-social-strip {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 14px;
          margin: 5px 0 20px;
        }

        .mvbd-social-strip span:not(.mvbd-social-strip-line) {
          color: rgba(255,255,255,.25);
          font-size: 8px;
          letter-spacing: 3px;
          white-space: nowrap;
        }

        .mvbd-social-strip b {
          color: #4ade80;
          font-weight: 700;
        }

        .mvbd-social-strip-line {
          width: 55px;
          height: 1px;
          background: linear-gradient(
            90deg,
            transparent,
            rgba(52,211,153,.35),
            transparent
          );
        }

        /* =========================
           DIVIDER
           ========================= */

        .mvbd-divider {
          height: 1px;
          margin-bottom: 22px;
          background:
            linear-gradient(
              90deg,
              transparent,
              rgba(52,211,153,.22),
              rgba(255,255,255,.08),
              rgba(52,211,153,.22),
              transparent
            );
          position: relative;
          overflow: hidden;
        }

        .mvbd-divider::after {
          content: "";
          position: absolute;
          top: 0;
          left: -20%;
          width: 20%;
          height: 100%;
          background: #6ee7b7;
          box-shadow: 0 0 12px #34d399;
          animation: mvbdDividerFlow 4s linear infinite;
        }

        @keyframes mvbdDividerFlow {
          from {
            left: -20%;
          }
          to {
            left: 120%;
          }
        }

        /* =========================
           MAKER
           ========================= */

        .mvbd-maker {
          display: inline-block;
          margin-left: 3px;
          font-style: italic;
          font-family: cursive;
          letter-spacing: .5px;
          font-weight: 700;

          background:
            linear-gradient(
              90deg,
              #a78bfa,
              #f472b6,
              #fb7185
            );

          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;

          transition:
            opacity .25s ease,
            filter .25s ease;
        }

        .mvbd-maker:hover {
          opacity: .8;
          filter: drop-shadow(0 0 7px rgba(244,114,182,.3));
        }

        /* =========================
           BOTTOM LINKS
           ========================= */

        .mvbd-bottom-link {
          transition:
            color .25s ease,
            text-shadow .25s ease;
        }

        .mvbd-bottom-link:hover {
          color: white;
          text-shadow: 0 0 10px rgba(255,255,255,.18);
        }

        /* =========================
           MOBILE
           ========================= */

        @media (max-width: 640px) {

          .mvbd-footer {
            min-height: auto;
          }

          .mvbd-aurora {
            width: 280px;
            height: 160px;
            filter: blur(65px);
          }

          .mvbd-grid {
            background-size: 35px 35px;
          }

          .mvbd-social {
            width: 43px;
            height: 43px;
            border-radius: 14px;
          }

          .mvbd-social-grid {
            gap: 9px;
          }

          .mvbd-social-strip-line {
            width: 30px;
          }

        }

        /* =========================
           REDUCED MOTION
           ========================= */

        @media (prefers-reduced-motion: reduce) {

          .mvbd-aurora,
          .mvbd-grid,
          .mvbd-particle,
          .mvbd-bottom-light,
          .mvbd-brand-orb::before,
          .mvbd-social-ring,
          .mvbd-orbit,
          .mvbd-social-shine,
          .mvbd-divider::after,
          .mvbd-live-dot,
          .mvbd-section-title span {
            animation: none !important;
          }

          .mvbd-social {
            transition: none !important;
          }

        }

      `}</style>

    </footer>
  )
}
