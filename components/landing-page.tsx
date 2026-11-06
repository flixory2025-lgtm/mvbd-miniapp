"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { movies } from "@/lib/movie-data";

/* ============================================================
   MoviesVerseBD — HBO Max style landing page
   - Sob button white
   - "Subscribe" => "Visit Now"
   - HBO Max logo => MoviesVerseBD logo
   - Props, trendingIds, enter-site transition ager moto-i ache
============================================================ */

type MovieItem = (typeof movies)[0];

type LandingPageProps = {
  onEnterSite?: () => void;
  onMovieClick?: (movie: MovieItem) => void;
};

type Poster = { title: string; poster: string; movie?: MovieItem };

const LOGO_URL =
  "https://i.postimg.cc/Bn4cPRwz/20288-removebg-preview.png";

// ✅ Same trendingIds
const trendingIds = [
  3360, 3361, 3362, 3363, 3364, 3365, 3366, 3367, 3368, 3369, 3370, 3371,
  3373, 3375, 3376, 3377, 3379, 3380, 3382, 3383, 3386, 3387, 3355, 3354,
  3352, 3351, 3350, 3349, 3348, 3347, 3346, 3345, 3344, 3342, 3341, 3340,
  3339, 3338, 3337, 3335, 3389, 3388,
];

// ✅ Jodi movie-data te kom thake tahole ei poster gulo diye pool bhorti hobe
const FALLBACK_POSTERS: Poster[] = [
  { title: "Scarlet Hour", poster: "https://i.postimg.cc/65j7bLDQ/MV5BZGVm-Nz-Rl-ZTct-NTU2OS00MTQw-LWI2ZWQt-OGVi-Mjc4ODNl-Nz-Vm-Xk-Ey-Xk-Fqc-Gc-V1-QL75-UX1080.jpg" },
  { title: "Nebula Protocol", poster: "https://i.postimg.cc/qBG6ydw2/MV5BMTk4NTk4MTk1OF5BMl5Ban-Bn-Xk-Ft-ZTcw-NTE2MDIw-NA-V1.jpg" },
  { title: "Echoes of Tomorrow", poster: "https://i.postimg.cc/4xjYs44x/MV5BNDg3ZGMw-ODAt-MGQ0YS00Ym-Mw-LWI3Nm-Ut-MWYz-NDE3Zj-Y1ODRk-Xk-Ey-Xk-Fqc-Gc-V1.jpg" },
  { title: "Midnight Fall", poster: "https://i.postimg.cc/bwZZ7Shb/c27aec8ab39db4bed60c8bc5e5b0f02d.jpg" },
  { title: "Crimson Tide", poster: "https://i.postimg.cc/Wzp3Xh85/MV5BMDBm-Zm-Rl-OWEt-YWZl-Yi00Nz-Vk-LTk5Zj-Et-YTVm-MDQ3ODZk-MGNh-Xk-Ey-Xk-Fqc-Gc-V1.jpg" },
  { title: "Deep Water", poster: "https://i.postimg.cc/J44DQdd1/MV5BYm-I3Yj-Jk-N2It-Y2Zm-YS00Y2Jh-LTk2YTQt-Yz-E5YWU5ODI1Mz-Jm-Xk-Ey-Xk-Fqc-Gc-V1.jpg" },
  { title: "Shadow Lines", poster: "https://i.postimg.cc/yxfN5srV/MV5BOTk5YWY5MDAt-NGZm-OC00Mj-E4LWEz-MWYt-MTJj-ODNi-MTVj-M2Uw-Xk-Ey-Xk-Fqc-Gc-V1.jpg" },
  { title: "The Silent Sea", poster: "https://i.postimg.cc/Y28jjz2n/netflix-the-silent-sea-character-poster-bae-doona-gong-yoo-v0-2eb5ltwohf281.jpg" },
  { title: "Hidden Truth", poster: "https://i.postimg.cc/9Mhzwxqn/images.jpg" },
];

const PLANS = {
  online: [
    {
      name: "Standard",
      price: "Free",
      per: "/forever",
      perks: [
        "Stream on any phone, tablet or PC",
        "Full HD video quality",
        "New titles added every day",
      ],
      recommended: false,
    },
    {
      name: "Premium",
      price: "Free",
      per: "/forever",
      perks: [
        "Bangla subtitles on most titles",
        "Hollywood, Bollywood & South hits",
        "No signup, no email, no password",
        "Zero ads between your scenes",
      ],
      recommended: true,
    },
  ],
  download: [
    {
      name: "Quick Download",
      price: "Free",
      per: "/every file",
      perks: [
        "Fast download servers",
        "720p and 1080p options",
        "Watch offline, anywhere",
      ],
      recommended: false,
    },
    {
      name: "Best Quality",
      price: "Free",
      per: "/every file",
      perks: [
        "4K and BluRay quality when available",
        "Dual audio on selected titles",
        "Multiple servers if one is busy",
        "Series packs for easy binge-watching",
      ],
      recommended: true,
    },
  ],
};

const FAQS = [
  {
    q: "How do I start watching on MoviesVerseBD?",
    a: "Tap Visit Now, pick any movie or series and press play. There is nothing to sign up for.",
  },
  {
    q: "Is MoviesVerseBD really free?",
    a: "Yes. Every title is free to stream and download. There are no plans, no cards and no hidden fees.",
  },
  {
    q: "Do the movies have Bangla subtitles?",
    a: "Most titles come with Bangla subtitles. You can also browse Hollywood, Bollywood and South Indian movies by category.",
  },
  {
    q: "Which devices work with MoviesVerseBD?",
    a: "Any device with a modern browser: phones, tablets, laptops and smart TVs with a web browser.",
  },
];

const FOOTER_LINKS: { label: string; target?: string }[] = [
  { label: "Trending", target: "trending" },
  { label: "Top 10 Today", target: "top10" },
  { label: "New Releases", target: "new" },
  { label: "Movies" },
  { label: "Web Series" },
  { label: "Hollywood" },
  { label: "Bollywood" },
  { label: "DMCA" },
  { label: "Privacy Policy" },
  { label: "Terms of Use" },
  { label: "Contact Us" },
  { label: "Help" },
];

/* ============================================================
   Small presentational pieces
============================================================ */

function VisitButton({
  onClick,
  size = "md",
  fullWidth = false,
}: {
  onClick: (e: React.MouseEvent) => void;
  size?: "sm" | "md" | "lg";
  fullWidth?: boolean;
}) {
  return (
    <a
      href="#"
      onClick={onClick}
      className={`hb-btn hb-btn-${size}${fullWidth ? " hb-btn-full" : ""}`}
    >
      Visit Now
    </a>
  );
}

function CheckIcon() {
  return (
    <svg
      className="hb-check"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

function ChevronIcon() {
  return (
    <svg
      className="hb-chevron"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

function PosterGrid({
  items,
  onOpen,
}: {
  items: Poster[];
  onOpen: (p: Poster) => void;
}) {
  return (
    <div className="hb-grid">
      {items.map((p, i) => (
        <button
          key={`${p.title}-${i}`}
          type="button"
          className="hb-tile"
          onClick={() => onOpen(p)}
          aria-label={p.title}
        >
          <img src={p.poster} alt={p.title} loading="lazy" />
        </button>
      ))}
    </div>
  );
}

function Banner({
  item,
  onOpen,
}: {
  item: Poster;
  onOpen: (p: Poster) => void;
}) {
  return (
    <button
      type="button"
      className="hb-banner"
      onClick={() => onOpen(item)}
      aria-label={item.title}
    >
      <img src={item.poster} alt="" loading="lazy" />
      <span className="hb-banner-fade" />
      <span className="hb-banner-title">{item.title}</span>
    </button>
  );
}

/* ============================================================
   Main component
============================================================ */

export default function LandingPage({
  onEnterSite,
  onMovieClick,
}: LandingPageProps = {}) {
  const onEnterSiteRef = useRef(onEnterSite);
  useEffect(() => {
    onEnterSiteRef.current = onEnterSite;
  }, [onEnterSite]);

  const rootRef = useRef<HTMLDivElement>(null);
  const enteringRef = useRef(false);

  const [scrolled, setScrolled] = useState(false);
  const [tab, setTab] = useState<"online" | "download">("online");
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  /* ✅ Visit Main Site handler (same fade-out transition) */
  const enterSite = (e?: React.SyntheticEvent) => {
    e?.preventDefault();
    if (document.documentElement.classList.contains("zooming")) return;
    if (enteringRef.current) return;
    enteringRef.current = true;

    const root = rootRef.current;
    if (root) {
      root.style.transition = "opacity 400ms ease, transform 400ms ease";
      root.style.opacity = "0";
      root.style.transform = "scale(0.98)";
    }

    setTimeout(() => {
      if (onEnterSiteRef.current) onEnterSiteRef.current();
      else window.location.reload();
    }, 420);
  };

  const openPoster = (p: Poster) => {
    if (p.movie && onMovieClick) onMovieClick(p.movie);
    else enterSite();
  };

  const scrollToId = (id: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  /* ✅ Poster pool — trending movies + fallback */
  const pool = useMemo<Poster[]>(() => {
    const list: Poster[] = movies
      .filter((m) => trendingIds.includes(m.id))
      .map((m) => ({
        title: String(m.title),
        poster: String(m.poster),
        movie: m,
      }))
      .filter((p) => p.poster && p.poster !== "undefined");
    return list.length >= 20 ? list : [...list, ...FALLBACK_POSTERS];
  }, []);

  const pick = (start: number, n: number): Poster[] =>
    Array.from({ length: n }, (_, i) => pool[(start + i) % pool.length]);

  const collage = pick(22, 15);

  return (
    <div className="landing-page-root hb-root" ref={rootRef}>
      <style>{css}</style>

      {/* ================= NAV ================= */}
      <div
        role="banner"
        className={`hb-nav${scrolled ? " hb-nav-solid" : ""}`}
      >
        <a
          href="#"
          className="hb-nav-logo"
          onClick={(e) => {
            e.preventDefault();
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
          aria-label="MoviesVerseBD"
        >
          <img src={LOGO_URL} alt="MoviesVerseBD" />
        </a>
        <a href="#trending" className="hb-nav-link" onClick={scrollToId("trending")}>
          Browse
        </a>
        <VisitButton onClick={enterSite} size="sm" />
      </div>

      {/* ================= HERO ================= */}
      <div className="hb-hero">
        <div className="hb-collage" aria-hidden="true">
          {collage.map((p, i) => (
            <img key={`c-${i}`} src={p.poster} alt="" />
          ))}
        </div>
        <div className="hb-hero-shade" aria-hidden="true" />

        <div className="hb-hero-content">
          <img
            src={LOGO_URL}
            alt="MoviesVerseBD"
            className="hb-hero-logo"
            fetchPriority="high"
          />
          <p className="hb-hero-price">Just free, forever*</p>
          <p className="hb-hero-note">
            *No signup, no card. New titles added every day
          </p>
          <VisitButton onClick={enterSite} size="lg" />
        </div>
      </div>

      {/* ================= PLANS ================= */}
      <div className="hb-block hb-plans" id="plans">
        <h2 className="hb-h2">Find Your Perfect Way to Watch</h2>

        <div className="hb-tabs" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={tab === "online"}
            className={`hb-tab${tab === "online" ? " is-active" : ""}`}
            onClick={() => setTab("online")}
          >
            Watch Online
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === "download"}
            className={`hb-tab${tab === "download" ? " is-active" : ""}`}
            onClick={() => setTab("download")}
          >
            Download
            <span className="hb-save">100% free</span>
          </button>
        </div>

        <div className="hb-plan-list">
          {PLANS[tab].map((plan) => (
            <div className="hb-plan-wrap" key={`${tab}-${plan.name}`}>
              {plan.recommended && (
                <div className="hb-reco">Recommended</div>
              )}
              <div
                className={`hb-plan${plan.recommended ? " hb-plan-reco" : ""}`}
              >
                <h3 className="hb-plan-name">{plan.name}</h3>
                <div className="hb-plan-price">
                  {plan.price}
                  <span>{plan.per}</span>
                </div>
                <ul className="hb-perks">
                  {plan.perks.map((perk) => (
                    <li key={perk}>
                      <CheckIcon />
                      <span>{perk}</span>
                    </li>
                  ))}
                </ul>
                <VisitButton onClick={enterSite} fullWidth />
              </div>
            </div>
          ))}
        </div>

        <p className="hb-fine">
          Everything on MoviesVerseBD is free to watch. Title and subtitle
          availability may vary. See our{" "}
          <a href="#" onClick={enterSite}>
            terms of use
          </a>
          .
        </p>
      </div>

      {/* ================= CONTENT ================= */}
      <div className="hb-block" id="trending">
        <h2 className="hb-h2">Trending Now</h2>
        <PosterGrid items={pick(0, 4)} onOpen={openPoster} />
      </div>

      <Banner item={pick(4, 1)[0]} onOpen={openPoster} />

      <div className="hb-block" id="top10">
        <h2 className="hb-h2">Iconic Hits</h2>
        <PosterGrid items={pick(5, 4)} onOpen={openPoster} />
      </div>

      <Banner item={pick(9, 1)[0]} onOpen={openPoster} />

      <div className="hb-block">
        <h2 className="hb-h2">Top 10 in Bangladesh</h2>
        <PosterGrid items={pick(10, 4)} onOpen={openPoster} />
      </div>

      <Banner item={pick(14, 1)[0]} onOpen={openPoster} />

      <div className="hb-block" id="new">
        <h2 className="hb-h2">New Releases</h2>
        <PosterGrid items={pick(15, 4)} onOpen={openPoster} />
      </div>

      <div className="hb-block">
        <h2 className="hb-h2">Binge-Worthy Picks</h2>
        <PosterGrid items={pick(19, 4)} onOpen={openPoster} />
      </div>

      {/* ================= INTRO + FAQ ================= */}
      <div className="hb-block hb-faq-block">
        <p className="hb-intro">
          Hollywood blockbusters, Bollywood hits, South Indian favorites and
          binge-worthy web series, all in one place on MoviesVerseBD.
        </p>

        <div className="hb-cta-row">
          <VisitButton onClick={enterSite} size="lg" />
        </div>

        <div className="hb-faq">
          {FAQS.map((f, i) => {
            const open = openFaq === i;
            return (
              <div className={`hb-faq-item${open ? " is-open" : ""}`} key={f.q}>
                <button
                  type="button"
                  className="hb-faq-q"
                  aria-expanded={open}
                  onClick={() => setOpenFaq(open ? null : i)}
                >
                  <span>{f.q}</span>
                  <ChevronIcon />
                </button>
                <div className="hb-faq-a">
                  <div>
                    <p>{f.a}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ================= FOOTER ================= */}
      <div role="contentinfo" className="hb-footer">
        <div className="hb-footer-links">
          {FOOTER_LINKS.map((l) => (
            <a
              key={l.label}
              href="#"
              onClick={l.target ? scrollToId(l.target) : enterSite}
            >
              {l.label}
            </a>
          ))}
        </div>

        <p className="hb-copy">
          © 2025 MoviesVerseBD · powered by <span>🎓</span> Elix industry. All
          rights reserved.
        </p>

        <img src={LOGO_URL} alt="MoviesVerseBD" className="hb-footer-logo" />
      </div>
    </div>
  );
}

/* ============================================================
   Scoped CSS (hb- prefix, jate tomar baki site er CSS er
   shathe conflict na kore)
============================================================ */
const css = `
@import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800&display=swap');

.hb-root {
  background: #000;
  color: #fff;
  min-height: 100vh;
  overflow-x: hidden;
  font-family: "Montserrat", "Gotham", "Helvetica Neue", Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
}
.hb-root *, .hb-root *::before, .hb-root *::after { box-sizing: border-box; }
.hb-root img { display: block; max-width: 100%; }
.hb-root button { font-family: inherit; }
.hb-root a:focus-visible,
.hb-root button:focus-visible { outline: 2px solid #fff; outline-offset: 3px; }

/* ---------- Buttons (white) ---------- */
.hb-btn {
  display: inline-flex; align-items: center; justify-content: center;
  background: #fff; color: #000 !important; text-decoration: none;
  font-weight: 600; border-radius: 6px; border: 0; cursor: pointer;
  transition: background 0.2s ease, transform 0.15s ease;
  white-space: nowrap;
}
.hb-btn:hover { background: #e4e4e4; }
.hb-btn:active { transform: scale(0.98); }
.hb-btn-sm { padding: 0 26px; height: 40px; font-size: 15px; }
.hb-btn-md { padding: 0 28px; height: 46px; font-size: 16px; }
.hb-btn-lg { padding: 0 34px; height: 50px; font-size: 18px; }
.hb-btn-full { width: 100%; height: 50px; font-size: 16px; }

/* ---------- Nav ---------- */
.hb-nav {
  position: fixed; top: 0; left: 0; right: 0; z-index: 50;
  display: flex; align-items: center; justify-content: space-between;
  gap: 12px; padding: 12px 14px;
  background: linear-gradient(to bottom, rgba(0,0,0,0.7), rgba(0,0,0,0));
  transition: background 0.25s ease, backdrop-filter 0.25s ease;
}
.hb-nav-solid {
  background: rgba(0,0,0,0.88);
  -webkit-backdrop-filter: blur(10px);
  backdrop-filter: blur(10px);
}
.hb-nav-logo { display: flex; align-items: center; flex: 0 0 auto; }
.hb-nav-logo img { height: 30px; width: auto; max-width: 120px; object-fit: contain; }
.hb-nav-link {
  color: #fff; text-decoration: none; font-size: 15px; font-weight: 500;
  flex: 1; text-align: center;
}
.hb-nav-link:hover { opacity: 0.8; }

/* ---------- Hero ---------- */
.hb-hero {
  position: relative; overflow: hidden; background: #000;
  min-height: 100svh; display: flex; align-items: center; justify-content: center;
}
.hb-collage {
  position: absolute; top: -6%; left: -25%; width: 150%; height: 78%;
  display: grid; grid-template-columns: repeat(5, 1fr); gap: 8px;
  transform: rotate(-5deg);
  transform-origin: center top;
  opacity: 0.95;
}
.hb-collage img { width: 100%; aspect-ratio: 2 / 3; object-fit: cover; border-radius: 3px; }
.hb-hero-shade {
  position: absolute; inset: 0;
  background: linear-gradient(to bottom,
    rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.3) 28%,
    rgba(0,0,0,0.78) 55%, #000 76%);
}
.hb-hero-content {
  position: relative; z-index: 2; width: 100%; max-width: 560px;
  padding: 120px 24px 56px; text-align: center;
  display: flex; flex-direction: column; align-items: center;
}
.hb-hero-logo {
  width: min(78vw, 400px); height: auto; object-fit: contain;
  filter: drop-shadow(0 6px 24px rgba(0,0,0,0.55));
  margin-bottom: 12px;
}
.hb-hero-price { font-size: clamp(1.15rem, 4.4vw, 1.6rem); font-weight: 500; margin: 0 0 14px; }
.hb-hero-note { font-size: 12px; color: #d8d8d8; margin: 0 0 22px; }

/* ---------- Blocks / headings ---------- */
.hb-block { width: 100%; max-width: 1100px; margin: 0 auto; padding: 0 14px; }
.hb-h2 {
  text-align: center; font-weight: 400; font-size: clamp(1.7rem, 6.5vw, 2.4rem);
  line-height: 1.3; margin: 44px 0 22px; color: #fff;
}

/* ---------- Plans ---------- */
.hb-plans { max-width: 900px; padding-bottom: 8px; }
.hb-plans .hb-h2 { margin-top: 24px; }
.hb-tabs {
  display: flex; justify-content: center; gap: 4px;
  border-bottom: 1px solid #2c2c2c; margin: 0 auto 22px; max-width: 420px;
}
.hb-tab {
  background: none; border: 0; color: #a8a8a8; cursor: pointer;
  font-size: 15px; font-weight: 500; padding: 12px 14px;
  display: inline-flex; align-items: center; gap: 8px;
  border-bottom: 2px solid transparent; margin-bottom: -1px;
}
.hb-tab.is-active { color: #fff; border-bottom-color: #fff; }
.hb-save {
  font-size: 10px; font-weight: 600; color: #6db6ff;
  background: rgba(77,163,255,0.14); padding: 3px 7px; border-radius: 4px;
}
.hb-plan-list { display: grid; grid-template-columns: 1fr; gap: 22px; }
.hb-plan-wrap { display: flex; flex-direction: column; }
.hb-reco {
  align-self: flex-start; background: #4da3ff; color: #00121f;
  font-size: 11px; font-weight: 700; letter-spacing: 0.04em; text-transform: uppercase;
  padding: 5px 14px; border-radius: 8px 8px 0 0;
}
.hb-plan {
  flex: 1; background: #141414; border: 1px solid #262626;
  border-radius: 14px; padding: 22px 20px 22px; text-align: left;
  display: flex; flex-direction: column;
}
.hb-plan-reco { border-top-left-radius: 0; }
.hb-plan-name { margin: 0 0 8px; font-size: 22px; font-weight: 600; }
.hb-plan-price { font-size: 28px; font-weight: 700; margin-bottom: 18px; }
.hb-plan-price span { font-size: 14px; font-weight: 400; color: #a8a8a8; margin-left: 2px; }
.hb-perks { list-style: none; margin: 0 0 24px; padding: 0; flex: 1; }
.hb-perks li { display: flex; gap: 12px; align-items: flex-start; font-size: 14px; line-height: 1.45; margin-bottom: 12px; color: #ededed; }
.hb-check { width: 16px; height: 16px; flex: 0 0 16px; margin-top: 2px; }
.hb-fine { text-align: center; color: #9a9a9a; font-size: 12px; line-height: 1.6; margin: 22px auto 0; max-width: 420px; }
.hb-fine a { color: #6db6ff; text-decoration: none; }

/* ---------- Poster grid ---------- */
.hb-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; }
.hb-tile {
  display: block; padding: 0; border: 0; background: #111; cursor: pointer;
  border-radius: 4px; overflow: hidden; aspect-ratio: 1 / 1;
}
.hb-tile img {
  width: 100%; height: 100%; object-fit: cover; object-position: center 25%;
  transition: transform 0.35s ease;
}
.hb-tile:hover img { transform: scale(1.04); }

/* ---------- Banner ---------- */
.hb-banner {
  position: relative; display: block; width: 100%; max-width: 760px;
  margin: 44px auto 0; padding: 0; border: 0; background: #000; cursor: pointer;
  aspect-ratio: 1 / 0.95; overflow: hidden;
}
.hb-banner img { width: 100%; height: 100%; object-fit: cover; object-position: center 18%; }
.hb-banner-fade {
  position: absolute; inset: 0;
  background: linear-gradient(to bottom, rgba(0,0,0,0) 40%, rgba(0,0,0,0.75) 78%, #000 100%);
}
.hb-banner-title {
  position: absolute; left: 16px; right: 16px; bottom: 26px; text-align: center;
  font-weight: 800; font-size: clamp(1.6rem, 7vw, 2.6rem); line-height: 1.1;
  letter-spacing: 0.01em; text-shadow: 0 3px 18px rgba(0,0,0,0.7);
}

/* ---------- Intro + FAQ ---------- */
.hb-faq-block { max-width: 720px; padding-top: 28px; }
.hb-intro { font-size: 16px; line-height: 1.7; color: #e8e8e8; text-align: left; margin: 20px 0 22px; }
.hb-cta-row { display: flex; justify-content: center; margin-bottom: 32px; }
.hb-faq { background: #161616; border-radius: 12px; padding: 4px 18px; }
.hb-faq-item + .hb-faq-item { border-top: 1px solid #2c2c2c; }
.hb-faq-q {
  width: 100%; background: none; border: 0; color: #fff; cursor: pointer;
  display: flex; justify-content: space-between; align-items: center; gap: 14px;
  text-align: left; padding: 18px 0; font-size: 16px; font-weight: 500; line-height: 1.4;
}
.hb-chevron { width: 20px; height: 20px; flex: 0 0 20px; transition: transform 0.25s ease; }
.is-open .hb-chevron { transform: rotate(180deg); }
.hb-faq-a { display: grid; grid-template-rows: 0fr; transition: grid-template-rows 0.28s ease; }
.is-open .hb-faq-a { grid-template-rows: 1fr; }
.hb-faq-a > div { overflow: hidden; }
.hb-faq-a p { margin: 0 0 18px; color: #bdbdbd; font-size: 15px; line-height: 1.65; }

/* ---------- Footer ---------- */
.hb-footer { padding: 56px 20px 0; text-align: center; background: #000; }
.hb-footer-links {
  display: flex; flex-wrap: wrap; justify-content: center;
  gap: 10px 30px; max-width: 460px; margin: 0 auto;
}
.hb-footer-links a { color: #fff; text-decoration: none; font-size: 14px; padding: 6px 2px; }
.hb-footer-links a:hover { text-decoration: underline; }
.hb-copy { color: #a8a8a8; font-size: 12px; line-height: 1.6; max-width: 420px; margin: 26px auto 0; }
.hb-footer-logo { width: min(86%, 460px); height: auto; margin: 56px auto 0; padding-bottom: 40px; object-fit: contain; }

/* ---------- Desktop ---------- */
@media (min-width: 768px) {
  .hb-nav { padding: 16px 40px; }
  .hb-nav-logo img { height: 36px; max-width: 150px; }
  .hb-nav-link { flex: 0 1 auto; }
  .hb-collage { grid-template-columns: repeat(8, 1fr); gap: 12px; height: 85%; left: -10%; width: 120%; }
  .hb-hero-content { padding-top: 140px; }
  .hb-hero-logo { width: 440px; }
  .hb-block { padding: 0 32px; }
  .hb-plan-list { grid-template-columns: 1fr 1fr; align-items: stretch; }
  .hb-grid { grid-template-columns: repeat(4, 1fr); gap: 14px; }
  .hb-banner { aspect-ratio: 16 / 8; }
  .hb-banner img { object-position: center 20%; }
}

@media (prefers-reduced-motion: reduce) {
  .hb-root * { transition: none !important; }
}
`;
