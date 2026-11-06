"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { movies } from "@/lib/movie-data";

type LandingPageProps = {
  onEnterSite?: () => void;
  onMovieClick?: (movie: (typeof movies)[0]) => void;
};

type CardData = {
  title: any;
  rating: any;
  poster: any;
  rank?: number;
  badge?: "new";
  movie?: (typeof movies)[0];
};

// ✅ Same trendingIds — jate niche Trending Now list thik kore
const trendingIds = [
  3360, 3361, 3362, 3363, 3364, 3365, 3366, 3367, 3368, 3369, 3370, 3371,
  3373, 3375, 3376, 3377, 3379, 3380, 3382, 3383, 3386, 3387, 3355, 3354,
  3352, 3351, 3350, 3349, 3348, 3347, 3346, 3345, 3344, 3342, 3341, 3340,
  3339, 3338, 3337, 3335, 3389, 3388,
];

// ✅ Aro beshi messages — prottek bar notun line ashbe
const TYPING_MESSAGES = [
  "Welcome to MoviesVerseBD — Watch Free!",
  "Hollywood, Bollywood & South Hits Here!",
  "Every Movie Has a Story Worth Watching!",
  "Your Next Binge-Worthy Series Awaits!",
  "Entertainment Never Ends on MoviesVerseBD!",
  "Action, Horror, Romance — Pick Your Mood!",
  "From Classics to Latest Trending Titles!",
  "Lights Off, Screen On, Enjoy the Show!",
  "Made for Movie Lovers, Inspired by Stories!",
  "Your Entertainment Journey Starts Here!",
];

const HERO_BG =
  "https://i.postimg.cc/7hLqB21s/Netflix-all-movies-and-series-featured-image.jpg";

const ROW2: CardData[] = [
  { title: "Scarlet Hour", rating: "9.4", rank: 1, poster: "https://i.postimg.cc/65j7bLDQ/MV5BZGVm-Nz-Rl-ZTct-NTU2OS00MTQw-LWI2ZWQt-OGVi-Mjc4ODNl-Nz-Vm-Xk-Ey-Xk-Fqc-Gc-V1-QL75-UX1080.jpg" },
  { title: "Nebula Protocol", rating: "9.1", rank: 2, poster: "https://i.postimg.cc/qBG6ydw2/MV5BMTk4NTk4MTk1OF5BMl5Ban-Bn-Xk-Ft-ZTcw-NTE2MDIw-NA-V1.jpg" },
  { title: "Echoes of Tomorrow", rating: "9.0", rank: 3, poster: "https://i.postimg.cc/4xjYs44x/MV5BNDg3ZGMw-ODAt-MGQ0YS00Ym-Mw-LWI3Nm-Ut-MWYz-NDE3Zj-Y1ODRk-Xk-Ey-Xk-Fqc-Gc-V1.jpg" },
  { title: "Midnight Fall", rating: "8.9", rank: 4, poster: "https://i.postimg.cc/bwZZ7Shb/c27aec8ab39db4bed60c8bc5e5b0f02d.jpg" },
  { title: "Crimson Tide", rating: "8.8", rank: 5, poster: "https://i.postimg.cc/Wzp3Xh85/MV5BMDBm-Zm-Rl-OWEt-YWZl-Yi00Nz-Vk-LTk5Zj-Et-YTVm-MDQ3ODZk-MGNh-Xk-Ey-Xk-Fqc-Gc-V1.jpg" },
  { title: "Deep Water", rating: "8.7", rank: 6, poster: "https://i.postimg.cc/J44DQdd1/MV5BYm-I3Yj-Jk-N2It-Y2Zm-YS00Y2Jh-LTk2YTQt-Yz-E5YWU5ODI1Mz-Jm-Xk-Ey-Xk-Fqc-Gc-V1.jpg" },
  { title: "Shadow Lines", rating: "8.6", rank: 7, poster: "https://i.postimg.cc/yxfN5srV/MV5BOTk5YWY5MDAt-NGZm-OC00Mj-E4LWEz-MWYt-MTJj-ODNi-MTVj-M2Uw-Xk-Ey-Xk-Fqc-Gc-V1.jpg" },
  { title: "The Silent Sea", rating: "8.5", rank: 8, poster: "https://i.postimg.cc/Y28jjz2n/netflix-the-silent-sea-character-poster-bae-doona-gong-yoo-v0-2eb5ltwohf281.jpg" },
  { title: "Hidden Truth", rating: "8.3", rank: 9, poster: "https://i.postimg.cc/9Mhzwxqn/images.jpg" },
];

const ROW3: CardData[] = [
  { title: "Velvet Empire", rating: "8.4", badge: "new", poster: "https://i.postimg.cc/bwZZ7Shb/c27aec8ab39db4bed60c8bc5e5b0f02d.jpg" },
  { title: "Zero Gravity", rating: "8.6", badge: "new", poster: "https://i.postimg.cc/qBG6ydw2/MV5BMTk4NTk4MTk1OF5BMl5Ban-Bn-Xk-Ft-ZTcw-NTE2MDIw-NA-V1.jpg" },
  { title: "Iron Lotus", rating: "8.2", badge: "new", poster: "https://i.postimg.cc/Wzp3Xh85/MV5BMDBm-Zm-Rl-OWEt-YWZl-Yi00Nz-Vk-LTk5Zj-Et-YTVm-MDQ3ODZk-MGNh-Xk-Ey-Xk-Fqc-Gc-V1.jpg" },
  { title: "Last Train to Dhaka", rating: "9.0", badge: "new", poster: "https://i.postimg.cc/65j7bLDQ/MV5BZGVm-Nz-Rl-ZTct-NTU2OS00MTQw-LWI2ZWQt-OGVi-Mjc4ODNl-Nz-Vm-Xk-Ey-Xk-Fqc-Gc-V1-QL75-UX1080.jpg" },
  { title: "The Glass Prince", rating: "8.5", badge: "new", poster: "https://i.postimg.cc/Y28jjz2n/netflix-the-silent-sea-character-poster-bae-doona-gong-yoo-v0-2eb5ltwohf281.jpg" },
  { title: "Neon Harvest", rating: "8.3", badge: "new", poster: "https://i.postimg.cc/J44DQdd1/MV5BYm-I3Yj-Jk-N2It-Y2Zm-YS00Y2Jh-LTk2YTQt-Yz-E5YWU5ODI1Mz-Jm-Xk-Ey-Xk-Fqc-Gc-V1.jpg" },
  { title: "Broken Compass", rating: "8.1", badge: "new", poster: "https://i.postimg.cc/4xjYs44x/MV5BNDg3ZGMw-ODAt-MGQ0YS00Ym-Mw-LWI3Nm-Ut-MWYz-NDE3Zj-Y1ODRk-Xk-Ey-Xk-Fqc-Gc-V1.jpg" },
  { title: "Silent Symphony", rating: "8.7", badge: "new", poster: "https://i.postimg.cc/yxfN5srV/MV5BOTk5YWY5MDAt-NGZm-OC00Mj-E4LWEz-MWYt-MTJj-ODNi-MTVj-M2Uw-Xk-Ey-Xk-Fqc-Gc-V1.jpg" },
  { title: "Ghost Frequency", rating: "8.4", badge: "new", poster: "https://i.postimg.cc/9Mhzwxqn/images.jpg" },
];

const MOODS = [
  { n: "Action", e: "💥", c1: "#ff7a2f", c2: "#b3261e" },
  { n: "Horror", e: "👻", c1: "#7c3aed", c2: "#1e1b4b" },
  { n: "Romance", e: "💖", c1: "#ec4899", c2: "#9d174d" },
  { n: "Sci-Fi", e: "🚀", c1: "#0ea5e9", c2: "#1e3a8a" },
  { n: "Thriller", e: "🔪", c1: "#475569", c2: "#020617" },
  { n: "Drama", e: "🎭", c1: "#f59e0b", c2: "#92400e" },
];

const FAQ = [
  { q: "Is MoviesVerseBD really free?", a: "Yes. Every movie and series on MoviesVerseBD is free to stream — no hidden fees and no shady downloads." },
  { q: "Do I need to sign up or enter my email?", a: "No. Just press the Visit Main Site button and start watching. No signup, no email, no password." },
  { q: "Are Bangla subtitles available?", a: "Most movies include Bangla subtitles. Enjoy Hollywood, Bollywood, South Indian and more." },
  { q: "How often are new movies added?", a: "New releases land on MoviesVerseBD every single day, so you never miss the latest hits." },
  { q: "Can I watch on my phone?", a: "Yes. MoviesVerseBD works on mobile, tablet and desktop — just open it in your browser and hit play." },
];

const FOOT: { h: string; l: [string, string][] }[] = [
  { h: "Browse", l: [["Trending", "#trending"], ["Top 10 Today", "#top10"], ["New Releases", "#new"], ["Hollywood", "#"], ["Bollywood", "#"], ["Web Series", "#"]] },
  { h: "Genres", l: [["Action", "#"], ["Thriller", "#"], ["Drama", "#"], ["Sci-Fi", "#"], ["Romance", "#"], ["Horror", "#"]] },
  { h: "Support", l: [["How To Watch", "#how"], ["FAQ", "#faq"], ["Request a Movie", "#"], ["Report Issue", "#"], ["Contact Us", "#"]] },
  { h: "Legal", l: [["Terms of Use", "#"], ["Privacy Policy", "#"], ["DMCA", "#"], ["Disclaimer", "#"], ["Cookies", "#"]] },
];

const HERO_TILES = [
  { k: "film", x: 12, y: 20, z: 50 },
  { k: "star", x: 88, y: 16, z: 20 },
  { k: "tv", x: 5, y: 60, z: 30 },
  { k: "ticket", x: 95, y: 58, z: 60 },
  { k: "sub", x: 22, y: 90, z: 40 },
  { k: "globe", x: 78, y: 90, z: 25 },
];

const ICONS: Record<string, React.ReactNode> = {
  film: (<><rect x="2" y="2" width="20" height="20" rx="2.18" /><path d="M7 2v20M17 2v20M2 12h20M2 7h5M2 17h5M17 17h5M17 7h5" /></>),
  star: <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />,
  tv: (<><rect x="2" y="7" width="20" height="15" rx="2" /><path d="m17 2-5 5-5-5" /></>),
  ticket: (<><path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z" /><path d="M13 5v2M13 11v2M13 17v2" /></>),
  sub: (<><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M7 15h4M15 15h2M7 11h2M13 11h4" /></>),
  globe: (<><circle cx="12" cy="12" r="10" /><path d="M2 12h20M12 2a15 15 0 0 1 0 20 15 15 0 0 1 0-20z" /></>),
  bolt: <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />,
  shield: (<><path d="M12 2 4 6v6c0 5 3.5 9 8 10 4.5-1 8-5 8-10V6l-8-4z" /><path d="m9 12 2 2 4-4" /></>),
  refresh: (<><path d="M21 12a9 9 0 1 1-6.2-8.5" /><path d="M22 4v6h-6" /></>),
  play: <path d="M8 5v14l11-7z" fill="currentColor" stroke="none" />,
  arrow: <path d="M5 12h14M13 5l7 7-7 7" />,
  down: <path d="m6 9 6 6 6-6" />,
  left: <path d="m15 18-6-6 6-6" />,
  right: <path d="m9 18 6-6-6-6" />,
  check: (<><path d="m9 12 2 2 4-4" /><circle cx="12" cy="12" r="10" /></>),
};

const Ic = ({ n, size = 24, sw = 1.8 }: { n: string; size?: number; sw?: number }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {ICONS[n]}
  </svg>
);

const Mark = ({ size = 40 }: { size?: number }) => (
  <svg viewBox="0 0 48 48" width={size} height={size} aria-hidden="true">
    <defs>
      <linearGradient id="mvMarkG" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="var(--accent-hi)" />
        <stop offset="1" stopColor="var(--accent)" />
      </linearGradient>
    </defs>
    <circle cx="24" cy="24" r="21" fill="none" stroke="url(#mvMarkG)" strokeWidth="4" />
    <path d="M19 15.5v17l14-8.5z" fill="#fff" />
  </svg>
);

const Words = ({ text, from = 0 }: { text: string; from?: number }) => (
  <>
    {text.split(" ").map((w, i) => (
      <span className="w" key={i} style={{ "--i": i + from } as React.CSSProperties}>
        {w}
      </span>
    ))}
  </>
);

/* ============================================================
   ✅ CARD + SLIDER ROW
============================================================ */
function Card({ c, onPick }: { c: CardData; onPick: (c: CardData) => void }) {
  return (
    <div className="mv-card" data-tilt onClick={() => onPick(c)}>
      <div className="mv-poster">
        {c.badge === "new" && <span className="mv-b mv-b-new">NEW</span>}
        {c.rank ? <span className="mv-rank">{c.rank}</span> : null}
        <span className="mv-b mv-b-hd">HD</span>
        <img src={c.poster} alt={c.title} loading="lazy" draggable={false} />
        <div className="mv-poster-info">
          <div className="t">{c.title}</div>
          <div className="r">★ {c.rating}</div>
        </div>
        <div className="mv-play">
          <i><Ic n="play" size={22} /></i>
        </div>
        <span className="mv-glare" />
      </div>
    </div>
  );
}

function Row({
  id, title, items, onPick, enter, className = "",
}: {
  id: string;
  title: string;
  items: CardData[];
  onPick: (c: CardData) => void;
  enter: (e: React.SyntheticEvent) => void;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  // Drag to scroll (mouse) — touch e native swipe
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let down = false, sx = 0, sl = 0, moved = false;
    const pd = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      down = true; moved = false; sx = e.clientX; sl = el.scrollLeft;
      el.style.cursor = "grabbing";
    };
    const pm = (e: PointerEvent) => {
      if (!down) return;
      const dx = e.clientX - sx;
      if (Math.abs(dx) > 5) moved = true;
      el.scrollLeft = sl - dx * 1.4;
    };
    const pu = () => { down = false; el.style.cursor = "grab"; };
    const ck = (e: MouseEvent) => {
      if (moved) { e.preventDefault(); e.stopPropagation(); moved = false; }
    };
    el.style.cursor = "grab";
    el.addEventListener("pointerdown", pd);
    window.addEventListener("pointermove", pm);
    window.addEventListener("pointerup", pu);
    el.addEventListener("click", ck, true);
    return () => {
      el.removeEventListener("pointerdown", pd);
      window.removeEventListener("pointermove", pm);
      window.removeEventListener("pointerup", pu);
      el.removeEventListener("click", ck, true);
    };
  }, []);

  const scrollBy = (dir: number) => {
    const el = ref.current;
    if (el) el.scrollBy({ left: dir * el.clientWidth * 0.75, behavior: "smooth" });
  };

  return (
    <div className={`mv-row ${className}`} id={id}>
      <div className="mv-row-head">
        <h2 className="mv-words" data-io><Words text={title} /></h2>
        <div className="mv-row-tools reveal">
          <button className="mv-arrow" aria-label="Previous" onClick={() => scrollBy(-1)}><Ic n="left" size={18} sw={2.4} /></button>
          <button className="mv-arrow" aria-label="Next" onClick={() => scrollBy(1)}><Ic n="right" size={18} sw={2.4} /></button>
          <a href="#" className="mv-seeall" onClick={enter}>See All <Ic n="arrow" size={16} sw={2.4} /></a>
        </div>
      </div>
      <div className="mv-slider reveal d1" ref={ref}>
        {items.map((c, i) => (
          <Card key={`${c.title}-${i}`} c={c} onPick={onPick} />
        ))}
      </div>
    </div>
  );
}

/* ============================================================
   ✅ 3D DOT GLOBE (canvas, no library)
============================================================ */
const LAND: number[][][] = [
  [[-168,66],[-156,71],[-125,70],[-95,72],[-80,68],[-62,60],[-55,50],[-67,45],[-76,38],[-81,31],[-80,25],[-90,30],[-97,26],[-97,19],[-88,16],[-83,10],[-77,8],[-80,7],[-86,12],[-93,15],[-105,20],[-110,24],[-115,30],[-117,32],[-124,40],[-125,49],[-135,58],[-148,60],[-165,60]],
  [[-55,60],[-45,60],[-20,70],[-20,82],[-60,82],[-70,76]],
  [[-77,8],[-72,12],[-62,10],[-50,0],[-35,-6],[-40,-22],[-48,-26],[-58,-38],[-65,-42],[-68,-52],[-72,-52],[-74,-40],[-71,-20],[-76,-14],[-81,-5],[-80,0]],
  [[-10,36],[-9,43],[-2,43.5],[-1,46],[-5,48],[2,51],[8,54],[20,55],[30,60],[40,67],[60,69],[70,73],[80,73],[100,77],[112,74],[140,72],[160,70],[180,68],[165,61],[156,51],[143,59],[140,53],[135,43],[129,35],[126,37],[122,40],[121,31],[117,23],[108,21],[106,10],[104,8],[103,1],[100,6],[98,10],[97,17],[94,17],[91,22],[88,22],[80,15],[77,8],[73,18],[72,21],[67,25],[61,25],[57,26],[50,30],[48,29],[51,25],[56,26],[59,22],[52,16],[43,13],[39,21],[35,28],[34,31],[36,36],[27,37],[26,40],[24,38],[22,36],[21,40],[19,42],[16,38],[12,44],[8,44],[3,43],[-1,37],[-6,36]],
  [[5,59],[5,62],[14,68],[25,71],[30,70],[28,66],[24,65],[21,61],[17,57],[12,56],[11,59]],
  [[-17,21],[-13,28],[-6,36],[10,37],[11,33],[20,31],[25,32],[32,31],[34,27],[37,21],[43,12],[51,12],[48,5],[40,-3],[39,-10],[40,-15],[35,-24],[32,-29],[27,-34],[19,-35],[15,-27],[12,-17],[13,-8],[9,-1],[9,4],[5,6],[-4,5],[-8,4],[-13,8],[-17,14]],
  [[114,-22],[122,-18],[130,-12],[136,-12],[142,-11],[146,-19],[153,-26],[150,-37],[140,-38],[132,-32],[115,-34]],
  [[-5,50],[2,52],[-2,57],[-5,58],[-6,54]],
  [[130,31],[135,34],[141,38],[142,44],[140,41],[135,36]],
  [[109,1],[117,7],[119,1],[116,-4],[110,-3]],
  [[95,5],[106,-6],[103,-5],[98,2]],
  [[44,-25],[49,-15],[50,-13],[47,-24]],
];

function inPoly(p: number[][], x: number, y: number) {
  let c = false;
  for (let i = 0, j = p.length - 1; i < p.length; j = i++) {
    const [xi, yi] = p[i], [xj, yj] = p[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c;
  }
  return c;
}

function buildDots() {
  const out: number[][] = [];
  const step = 2.6;
  for (let lat = -58; lat <= 82; lat += step) {
    const n = Math.max(1, Math.round((360 * Math.cos((lat * Math.PI) / 180)) / step));
    for (let i = 0; i < n; i++) {
      const lon = -180 + (i + (Math.round(lat / step) % 2 ? 0.5 : 0)) * (360 / n);
      if (LAND.some((p) => inPoly(p, lon, lat))) {
        const la = (lat * Math.PI) / 180;
        out.push([Math.sin(la), Math.cos(la), (lon * Math.PI) / 180]);
      }
    }
  }
  return out;
}

function Globe() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    const accent = (getComputedStyle(cv).getPropertyValue("--accent-rgb").trim() || "255 98 31").split(/\s+/).join(",");
    const dots = buildDots();
    const dhaka = { la: (23.8 * Math.PI) / 180, lo: (90.4 * Math.PI) / 180 };
    let w = 0, h = 0, raf = 0, visible = false;
    let center = dhaka.lo;

    const resize = () => {
      const r = cv.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = r.width; h = r.height;
      cv.width = w * dpr; cv.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; });
    io.observe(cv);

    const tilt = 0.38, ct = Math.cos(tilt), st = Math.sin(tilt);

    const draw = () => {
      raf = requestAnimationFrame(draw);
      if (!visible) return;
      center += 0.0022;
      ctx.clearRect(0, 0, w, h);
      const R = Math.min(w, h) * 0.47, cx = w / 2, cy = h / 2;
      const bins: number[][] = [[], [], [], []];

      for (let i = 0; i < dots.length; i++) {
        const [sp, cp, lon] = dots[i];
        const lam = lon - center;
        const x = cp * Math.sin(lam), z = cp * Math.cos(lam);
        const y2 = sp * ct - z * st, z2 = sp * st + z * ct;
        if (z2 <= 0.02) continue;
        const b = Math.min(3, Math.floor(z2 * 4));
        bins[b].push(cx + x * R, cy - y2 * R, 0.7 + z2 * 1.15);
      }
      for (let b = 0; b < 4; b++) {
        ctx.fillStyle = `rgba(255,232,214,${0.16 + b * 0.25})`;
        ctx.beginPath();
        const a = bins[b];
        for (let i = 0; i < a.length; i += 3) {
          ctx.moveTo(a[i] + a[i + 2], a[i + 1]);
          ctx.arc(a[i], a[i + 1], a[i + 2], 0, 6.2832);
        }
        ctx.fill();
      }

      // Dhaka pin
      const lam = dhaka.lo - center;
      const sp = Math.sin(dhaka.la), cp = Math.cos(dhaka.la);
      const x = cp * Math.sin(lam), z = cp * Math.cos(lam);
      const y2 = sp * ct - z * st, z2 = sp * st + z * ct;
      if (z2 > 0.08) {
        const px = cx + x * R, py = cy - y2 * R;
        const t = (performance.now() / 1000) % 1.8;
        ctx.strokeStyle = `rgba(${accent},${(1 - t / 1.8).toFixed(2)})`;
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(px, py, 6 + t * 16, 0, 6.2832); ctx.stroke();
        ctx.shadowColor = `rgb(${accent})`; ctx.shadowBlur = 18;
        ctx.fillStyle = `rgb(${accent})`;
        ctx.beginPath(); ctx.arc(px, py, 5, 0, 6.2832); ctx.fill();
        ctx.shadowBlur = 0;
        ctx.fillStyle = "#fff";
        ctx.font = "700 13px 'Plus Jakarta Sans', system-ui, sans-serif";
        ctx.fillText("Dhaka", px + 12, py - 10);
      }
    };
    draw();

    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <div className="mv-globe">
      <canvas ref={ref} />
    </div>
  );
}

/* ============================================================
   ✅ MAIN COMPONENT
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
  const heroRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<HTMLDivElement>(null);

  /* ✅ INTRO LOADER (Netflix style: M → oviesVerse + BD → zoom out) */
  const [phase, setPhase] = useState<"intro" | "out" | "done">("intro");
  const loaded = phase !== "intro";

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const t1 = setTimeout(() => {
      setPhase("out");
      document.body.style.overflow = prev;
    }, 4100);
    const t2 = setTimeout(() => setPhase("done"), 5300);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      document.body.style.overflow = prev;
    };
  }, []);

  /* ✅ TYPING ANIMATION */
  const [displayedText, setDisplayedText] = useState("");
  const [msgIndex, setMsgIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const currentMsg = TYPING_MESSAGES[msgIndex];
    const typingSpeed = isDeleting ? 25 : 55;
    const pauseAfter = isDeleting ? 300 : 1800;

    if (!isDeleting) {
      if (charIndex < currentMsg.length) {
        typingTimeoutRef.current = setTimeout(() => {
          setDisplayedText(currentMsg.substring(0, charIndex + 1));
          setCharIndex(charIndex + 1);
        }, typingSpeed);
      } else {
        typingTimeoutRef.current = setTimeout(() => setIsDeleting(true), pauseAfter);
      }
    } else {
      if (charIndex > 0) {
        typingTimeoutRef.current = setTimeout(() => {
          setDisplayedText(currentMsg.substring(0, charIndex - 1));
          setCharIndex(charIndex - 1);
        }, typingSpeed);
      } else {
        typingTimeoutRef.current = setTimeout(() => {
          setIsDeleting(false);
          setMsgIndex((prev) => (prev + 1) % TYPING_MESSAGES.length);
        }, 400);
      }
    }
    return () => {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, [charIndex, isDeleting, msgIndex]);

  /* ✅ VISIT MAIN SITE HANDLER */
  const enter = (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (document.documentElement.classList.contains("zooming")) return;
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

  /* ✅ MOVIE DATA */
  const row1: CardData[] = useMemo(
    () =>
      movies
        .filter((m) => trendingIds.includes(m.id))
        .map((m) => ({ title: m.title, rating: m.rating, poster: m.poster, movie: m })),
    []
  );

  const pick = (c: CardData) => {
    if (c.movie && onMovieClick) onMovieClick(c.movie);
    else if (onEnterSiteRef.current) onEnterSiteRef.current();
  };

  const tickerTitles = useMemo(
    () => [...ROW3, ...ROW2].map((c) => String(c.title)),
    []
  );

  /* ✅ NAV, REVEAL, 3D TILT, PARALLAX */
  const [scrolled, setScrolled] = useState(false);
  const [navLight, setNavLight] = useState(false);
  const [openQ, setOpenQ] = useState<number | null>(0);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const prevBehavior = document.documentElement.style.scrollBehavior;
    document.documentElement.style.scrollBehavior = "smooth";

    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    // Reveal on scroll
    const revealObs = new IntersectionObserver(
      (entries) =>
        entries.forEach((en) => {
          if (en.isIntersecting) {
            en.target.classList.add("visible");
            revealObs.unobserve(en.target);
          }
        }),
      { threshold: 0.12, rootMargin: "0px 0px -60px 0px" }
    );
    root.querySelectorAll(".reveal, [data-io]").forEach((el) => revealObs.observe(el));

    // Nav theme (dark <-> light sections)
    const themeObs = new IntersectionObserver(
      (entries) =>
        entries.forEach((en) => {
          if (en.isIntersecting) setNavLight(en.target.classList.contains("mv-light"));
        }),
      { rootMargin: "-8% 0px -88% 0px" }
    );
    root.querySelectorAll(".mv-light, .mv-dark").forEach((el) => themeObs.observe(el));

    // 3D tilt (cards) + hero parallax
    let tiltEl: HTMLElement | null = null;
    const resetTilt = (el: HTMLElement | null) => {
      if (!el) return;
      el.style.setProperty("--rx", "0deg");
      el.style.setProperty("--ry", "0deg");
    };
    let raf = 0;
    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      const t = (e.target as HTMLElement).closest?.("[data-tilt]") as HTMLElement | null;
      if (tiltEl && tiltEl !== t) resetTilt(tiltEl);
      tiltEl = t;
      if (t) {
        const r = t.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width;
        const py = (e.clientY - r.top) / r.height;
        const k = t.classList.contains("mv-card") ? 14 : 6;
        t.style.setProperty("--ry", `${(px - 0.5) * k}deg`);
        t.style.setProperty("--rx", `${(0.5 - py) * k}deg`);
        t.style.setProperty("--mx", `${px * 100}%`);
        t.style.setProperty("--my", `${py * 100}%`);
      }
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const scene = sceneRef.current, hero = heroRef.current;
        if (scene) {
          const nx = e.clientX / window.innerWidth - 0.5;
          const ny = e.clientY / window.innerHeight - 0.5;
          scene.style.setProperty("--ry", `${nx * 16}deg`);
          scene.style.setProperty("--rx", `${-ny * 12}deg`);
        }
        if (hero) {
          const r = hero.getBoundingClientRect();
          hero.style.setProperty("--mx", `${e.clientX - r.left}px`);
          hero.style.setProperty("--my", `${e.clientY - r.top}px`);
        }
      });
    };
    const onLeave = () => { resetTilt(tiltEl); tiltEl = null; };
    window.addEventListener("pointermove", onMove);
    root.addEventListener("pointerleave", onLeave);

    return () => {
      document.documentElement.style.scrollBehavior = prevBehavior;
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("pointermove", onMove);
      root.removeEventListener("pointerleave", onLeave);
      cancelAnimationFrame(raf);
      revealObs.disconnect();
      themeObs.disconnect();
    };
  }, []);

  return (
    <div className="landing-page-root mvl" ref={rootRef} style={{ background: "#000000" }}>
      <style>{CSS}</style>

      {/* ✅ INTRO — Netflix style: M, then "oviesVerse" + green "BD" */}
      {phase !== "done" && (
        <div className={`mv-intro ${phase === "out" ? "out" : ""}`} aria-hidden="true">
          <div className="mv-intro-in">
            <div className="mv-wm">
              <span className="m">M</span>
              <span className="rest">
                <span>oviesVerse</span>
                <span className="bd">BD</span>
              </span>
            </div>
            <div className="mv-spin" />
          </div>
        </div>
      )}

      {/* ✅ FLOATING PILL NAV */}
      <div role="navigation" id="nav" className={`mv-nav ${loaded ? "show" : ""} ${navLight ? "light" : ""} ${scrolled ? "scrolled" : ""}`}>
        <a href="#" className="mv-brand" onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: "smooth" }); }}>
          <Mark size={28} />
          <span><b>MoviesVerse</b><em>BD</em></span>
        </a>
        <div className="mv-nav-links">
          <a href="#" className="active" onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: "smooth" }); }}>Home</a>
          <a href="#trending">Trending</a>
          <a href="#top10">Top 10</a>
          <a href="#new">New</a>
          <a href="#how">How It Works</a>
        </div>
        <a href="#" className="mv-nav-cta" onClick={enter}>
          <span>Visit Main Site</span>
          <Ic n="arrow" size={16} sw={2.6} />
        </a>
      </div>

      {/* ✅ HERO */}
      <section className={`mv-hero mv-dark ${loaded ? "loaded" : ""}`} ref={heroRef}>
        <div className="mv-hero-bg" style={{ backgroundImage: `url('${HERO_BG}')` }} />
        <div className="mv-beam" />
        <div className="mv-ember" />

        <span className="mv-badge hi" style={{ "--d": 0 } as React.CSSProperties}>
          <i /> 100% Free · No Signup · Bangla Subtitles
        </span>

        <h1 className="mv-h mv-words">
          <Words text="Entertainment for" />{" "}
          <span className="acc"><Words text="every moment" from={2} /></span>
        </h1>

        <p className="mv-sub hi" style={{ "--d": 700 } as React.CSSProperties}>
          Stream Hollywood, Bollywood &amp; South hits instantly — no email, no password, just pure entertainment on MoviesVerseBD.
        </p>

        <div className="mv-cta-row hi" style={{ "--d": 850 } as React.CSSProperties}>
          <a href="#" onClick={enter} className="mv-btn btn-site-main">
            <span>Visit Main Site</span>
            <span className="ar"><Ic n="arrow" size={18} sw={2.6} /></span>
          </a>
          <a href="#trending" className="mv-btn-ghost">Browse Trending</a>
        </div>

        <div className="mv-typing hi" style={{ "--d": 1000 } as React.CSSProperties}>
          <Ic n="check" size={18} sw={2.5} />
          <span>{displayedText}</span>
          <span className="mv-caret" />
        </div>

        {/* 3D scene */}
        <div className="mv-scene-wrap hi" style={{ "--d": 1150 } as React.CSSProperties}>
          <div className="mv-scene" ref={sceneRef}>
            <svg className="mv-lines" viewBox="0 0 640 360" aria-hidden="true">
              {HERO_TILES.map((t, i) => {
                const d = `M${t.x * 6.4} ${t.y * 3.6} L320 180`;
                return (
                  <g key={t.k}>
                    <path d={d} />
                    <path d={d} className="spark" style={{ "--i": i } as React.CSSProperties} />
                  </g>
                );
              })}
            </svg>
            {HERO_TILES.map((t, i) => (
              <div
                key={t.k}
                className={`mv-tile ${i === 1 ? "hot" : ""}`}
                style={{ left: `${t.x}%`, top: `${t.y}%`, "--z": `${t.z}px`, "--i": i } as React.CSSProperties}
              >
                <Ic n={t.k} size={26} />
              </div>
            ))}
            <div className="mv-chip">
              <div className="l1" />
              <div className="l2" />
              <div className="l3"><Ic n="play" size={38} /></div>
            </div>
          </div>
        </div>
      </section>

      {/* ✅ FEATURES BENTO */}
      <section className="mv-dark mv-feat" id="features">
        <div className="mv-sec">
          <div className="mv-head">
            <span className="mv-kicker reveal">WHY MOVIESVERSEBD</span>
            <h2 className="mv-words" data-io>
              <Words text="Unleash your" /> <span className="acc"><Words text="movie night's" from={2} /></span> <Words text="full potential" from={4} />
            </h2>
            <p className="reveal d1">The fastest, cleanest way to watch movies &amp; series in Bangladesh. No signup, no buffering, no hassle.</p>
          </div>

          <div className="mv-bento">
            <div className="mv-glass mv-b1 reveal" data-tilt>
              <div className="mv-viz">
                <div className="mv-player">
                  <div className="pl"><Ic n="play" size={24} /></div>
                  <span className="hdc">HD</span>
                  <span className="ms">Buffering 0s</span>
                  <div className="bar"><i /></div>
                </div>
              </div>
              <h3>Instant Streaming</h3>
              <p>Click any movie and stream instantly. No waiting, no registration — just pure entertainment.</p>
            </div>

            <div className="mv-glass mv-b2 reveal d1" data-tilt>
              <div className="mv-viz">
                <div className="mv-subs">
                  <span className="pill">EN → বাংলা</span>
                  <div className="line">আপনার প্রিয় সিনেমা, বাংলা সাবটাইটেলে</div>
                </div>
              </div>
              <h3>Bangla Subtitles</h3>
              <p>Most movies include Bangla subtitles. Enjoy Hollywood, Bollywood, South Indian and more.</p>
            </div>

            <div className="mv-glass mv-b3 reveal d2" data-tilt>
              <div className="mv-viz">
                <div className="mv-shield">
                  <i className="rg r1" /><i className="rg r2" /><i className="rg r3" />
                  <div className="sh"><Ic n="shield" size={44} sw={1.6} /></div>
                </div>
              </div>
              <h3>100% Free &amp; Safe</h3>
              <p>No hidden fees. No shady downloads. Just pure content streamed securely to your device.</p>
            </div>

            <div className="mv-glass mv-b4 reveal d3" data-tilt>
              <div className="mv-viz mv-marqs">
                {[false, true].map((rev, r) => (
                  <div className="mv-marq" key={r}>
                    <div className={`tk ${rev ? "rev" : ""}`}>
                      {[...tickerTitles, ...tickerTitles].map((t, i) => (
                        <span className="ch" key={i}><b>★</b> {t}</span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <h3>Updated Daily</h3>
              <p>New releases land on MoviesVerseBD every single day. Never miss the latest hits again.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ✅ TRENDING NOW */}
      <section className="mv-dark mv-trend">
        <Row id="trending" title="Trending Now" items={row1} onPick={pick} enter={enter} />
      </section>

      {/* ✅ GLOBE */}
      <section className="mv-dark mv-globe-sec">
        <div className="mv-head">
          <span className="mv-kicker reveal">MADE IN BANGLADESH</span>
          <h2 className="mv-words" data-io>
            <Words text="Built for Bangladesh," /> <span className="acc"><Words text="made for every screen" from={3} /></span>
          </h2>
          <p className="reveal d1">MoviesVerseBD is made for Bangladeshi movie lovers — fast on mobile, smooth on desktop and always free.</p>
        </div>
        <div className="reveal d2"><Globe /></div>
      </section>

      {/* ✅ LIGHT BLOCK: TOP 10 + STEPS + MOODS */}
      <div className="mv-light mv-lightblock">
        <Row id="top10" title="Top 10 in Bangladesh Today" items={ROW2} onPick={pick} enter={enter} className="light" />

        <div className="mv-sec" id="how">
          <div className="mv-head">
            <span className="mv-kicker reveal">SUPER SIMPLE</span>
            <h2 className="mv-words" data-io>
              <Words text="Enter in" /> <span className="acc"><Words text="3 easy steps" from={2} /></span>
            </h2>
            <p className="reveal d1">No signup. No email. No password. Just click the button and start watching.</p>
          </div>
          <div className="mv-steps">
            {[
              ["1", "Click The Button", "Tap the highlighted \"Visit Main Site\" button anywhere on this page to enter our official website."],
              ["2", "Pick Your Movie", "Browse hundreds of movies and web series. Use categories or search to find what you love."],
              ["3", "Stream & Enjoy", "Hit play and enjoy. Download for offline or watch online — MoviesVerseBD has you covered."],
            ].map(([n, t, d], i) => (
              <div className={`mv-step reveal d${i + 1}`} key={n} data-tilt>
                <div className="n">{n}</div>
                <h3>{t}</h3>
                <p>{d}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="mv-sec mv-moods-sec">
          <div className="mv-head">
            <span className="mv-kicker reveal">PICK YOUR MOOD</span>
            <h2 className="mv-words" data-io>
              <Words text="A flexible" /> <span className="acc"><Words text="movie for every mood" from={2} /></span>
            </h2>
          </div>
          <div className="mv-moods">
            {MOODS.map((m, i) => (
              <a
                href="#"
                key={m.n}
                onClick={enter}
                data-tilt
                className={`mv-mood reveal d${(i % 4) + 1}`}
                style={{ "--c1": m.c1, "--c2": m.c2 } as React.CSSProperties}
              >
                <span className="e">{m.e}</span>
                <span className="nm">{m.n}</span>
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* ✅ NEW RELEASES */}
      <section className="mv-dark mv-round mv-new">
        <Row id="new" title="New Releases" items={ROW3} onPick={pick} enter={enter} />
      </section>

      {/* ✅ FAQ */}
      <section className="mv-dark mv-faq-sec" id="faq">
        <div className="mv-head">
          <h2 className="mv-words" data-io><Words text="Frequently asked questions" /></h2>
        </div>
        <div className="mv-faq">
          {FAQ.map((f, i) => (
            <div className={`mv-q reveal d${(i % 4) + 1} ${openQ === i ? "open" : ""}`} key={f.q}>
              <button onClick={() => setOpenQ(openQ === i ? null : i)} aria-expanded={openQ === i}>
                <span>{f.q}</span>
                <Ic n="down" size={20} sw={2.2} />
              </button>
              <div className="a"><div><p>{f.a}</p></div></div>
            </div>
          ))}
        </div>
      </section>

      {/* ✅ BIG CTA */}
      <section className="mv-dark mv-bigcta">
        <div className="mv-bigcta-glow" />
        <h2 className="mv-words" data-io>
          <Words text="Ready to" /> <span className="acc"><Words text="Start Watching?" from={2} /></span>
        </h2>
        <p className="reveal d1">Join thousands of Bangladeshi movie lovers already streaming on MoviesVerseBD. It's free, it's fast, and it's waiting for you.</p>
        <div className="reveal d2">
          <a href="#" className="mv-btn btn-site-main" onClick={enter}>
            <span>Visit Main Site</span>
            <span className="ar"><Ic n="arrow" size={18} sw={2.6} /></span>
          </a>
        </div>
      </section>

      {/* ✅ FOOTER */}
      <div role="contentinfo" className="mv-dark mv-foot">
        <div className="mv-foot-top">
          <div className="mv-foot-brand reveal">
            <div className="mv-brand big"><Mark size={34} /><span><b>MoviesVerse</b><em>BD</em></span></div>
            <p>Bangladesh's most loved movie streaming experience. Fast, free, and endlessly entertaining — with new titles added every single day.</p>
            <div className="mv-social">
              <a href="#" aria-label="Facebook"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M22 12c0-5.5-4.5-10-10-10S2 6.5 2 12c0 5 3.6 9.1 8.4 9.9v-7H7.9V12h2.5V9.8c0-2.5 1.5-3.9 3.8-3.9 1.1 0 2.2.2 2.2.2v2.5h-1.3c-1.2 0-1.6.8-1.6 1.6V12h2.8l-.5 2.9h-2.3v7C18.4 21.1 22 17 22 12z" /></svg></a>
              <a href="#" aria-label="Instagram"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" /><path d="M16 11.4A4 4 0 1 1 12.6 8 4 4 0 0 1 16 11.4z" /><circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" /></svg></a>
              <a href="#" aria-label="YouTube"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M23 12s0-3.4-.4-5c-.2-.9-1-1.6-1.9-1.8C19 5 12 5 12 5s-7 0-8.7.4c-.9.2-1.6 1-1.8 1.9C1 9 1 12 1 12s0 3.4.4 5c.2.9 1 1.6 1.9 1.8C5 19 12 19 12 19s7 0 8.7-.4c.9-.2 1.6-1 1.8-1.9.5-1.5.5-4.7.5-4.7zM10 15V9l5 3-5 3z" /></svg></a>
              <a href="#" aria-label="Telegram"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M22 4.01c0-.79-.63-1.43-1.4-1.4-6.6.25-13.2.5-19.8.75-.74.03-1.3.66-1.3 1.4 0 2.98.02 5.96.05 8.94.01.55.4 1.01.93 1.15 2.6.68 5.2 1.36 7.8 2.04.32.08.44.47.22.71-.98 1.06-1.96 2.13-2.94 3.19-.36.4-.06 1.05.48.98 2.35-.29 4.7-.58 7.05-.87.55-.07.9-.6.78-1.13-.46-2.05-.92-4.1-1.38-6.15-.08-.36.2-.7.57-.68 1.94.1 3.87.19 5.8.29.85.04 1.5-.71 1.34-1.55-.72-3.75-1.44-7.5-2.16-11.25-.09-.45.08-.91.44-1.19.65-.5 1.34-1.03 2.05-1.57.35-.27.44-.76.22-1.14z" /></svg></a>
            </div>
          </div>
          {FOOT.map((col, i) => (
            <div className={`mv-foot-col reveal d${i + 1}`} key={col.h}>
              <h5>{col.h}</h5>
              {col.l.map(([label, href]) => (
                <a href={href} key={label}>{label}</a>
              ))}
            </div>
          ))}
        </div>
        <div className="mv-foot-bottom">
          <div className="legal">
            <a href="#">Terms</a>
            <a href="#">Privacy</a>
            <a href="#">DMCA</a>
            <a href="#">Sitemap</a>
          </div>
          <div className="made">
            © {new Date().getFullYear()} MoviesVerseBD · powered by <span>🎓</span> Elix industry
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   ✅ STYLES (self-contained — sob class "mv-" prefix e, tai
      tomar global CSS er sathe conflict hobe na)
   🎨 Color change korte chao? Shudhu niche --accent-rgb / --accent-hi
      change koro. Green er jonno:  --accent-rgb: 34 197 94;  --accent-hi: #86efac;
============================================================ */
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Oswald:wght@700&display=swap');

.mvl{--accent-rgb:255 98 31;--accent:rgb(var(--accent-rgb));--accent-hi:#ff9a52;--bg:#09090b;--muted:#9a9aa5;--line:rgb(255 255 255 / .09);
  position:relative;background:var(--bg);color:#fff;font-family:'Plus Jakarta Sans',system-ui,-apple-system,'Segoe UI',sans-serif;overflow-x:clip;-webkit-font-smoothing:antialiased}
.mvl *,.mvl *::before,.mvl *::after{box-sizing:border-box}
.mvl a{color:inherit;text-decoration:none}
.mvl h1,.mvl h2,.mvl h3,.mvl h5,.mvl p{margin:0}
.mvl button{font-family:inherit}
.mvl img{max-width:100%}

/* ---------- INTRO (Netflix-style: M + oviesVerse + BD) ---------- */
.mv-intro{position:fixed;inset:0;z-index:200;background:#000;display:grid;place-items:center;overflow:hidden;transition:opacity .7s ease .2s}
.mv-intro.out{opacity:0;pointer-events:none}
.mv-intro-in{display:flex;flex-direction:column;align-items:center;gap:34px}
.mv-wm{display:flex;font-family:'Oswald','Bebas Neue',Impact,system-ui,sans-serif;font-weight:700;font-size:clamp(40px,13vw,112px);line-height:1.05;letter-spacing:.015em;white-space:nowrap;color:#fff;transform-origin:50% 50%}
.mv-wm .m{display:inline-block;animation:mvM .5s .3s cubic-bezier(.2,.8,.2,1) both}
.mv-wm .rest{display:inline-flex;clip-path:inset(0 100% 0 0);animation:mvWipe 1.4s .85s steps(18,end) forwards}
.mv-wm .bd{color:#19e65e;text-shadow:0 0 26px rgb(25 230 94 / .5)}
.mv-intro.out .mv-wm{transform:scale(12);opacity:0;transition:transform .85s cubic-bezier(.65,0,.95,.45),opacity .55s ease .3s}
.mv-spin{width:34px;height:34px;border-radius:50%;border:3px solid #19e65e;border-top-color:transparent;animation:mvFade .3s 2.7s both,mvRot .8s 2.7s linear infinite;transition:opacity .2s}
.mv-intro.out .mv-spin{opacity:0}

/* ---------- NAV ---------- */
.mv-nav{position:fixed;top:16px;left:50%;z-index:90;transform:translate(-50%,-160%);display:flex;align-items:center;gap:8px;padding:7px 7px 7px 16px;border-radius:999px;width:max-content;max-width:calc(100vw - 20px);
  background:rgb(22 22 25 / .6);backdrop-filter:blur(18px) saturate(1.4);-webkit-backdrop-filter:blur(18px) saturate(1.4);border:1px solid rgb(255 255 255 / .1);color:#fff;
  transition:transform 1s cubic-bezier(.2,.8,.2,1),background .4s,border-color .4s,color .4s,box-shadow .4s}
.mv-nav.show{transform:translate(-50%,0)}
.mv-nav.scrolled{box-shadow:0 14px 50px rgb(0 0 0 / .45)}
.mv-nav.light{background:rgb(255 255 255 / .75);border-color:rgb(0 0 0 / .08);color:#0b0b0c}
.mv-brand{display:inline-flex;align-items:center;gap:9px;font-size:15px;white-space:nowrap}
.mv-brand b{font-weight:800;letter-spacing:-.02em}
.mv-brand em{font-style:normal;font-weight:800;color:var(--accent)}
.mv-brand.big{font-size:22px}
.mv-nav-links{display:flex;gap:2px;margin:0 6px 0 12px}
.mv-nav-links a{padding:8px 13px;border-radius:999px;font-size:13.5px;font-weight:600;opacity:.72;transition:.25s}
.mv-nav-links a:hover,.mv-nav-links a.active{opacity:1;background:rgb(127 127 127 / .16)}
.mv-nav-cta{display:inline-flex;align-items:center;gap:8px;padding:10px 16px;border-radius:999px;background:#fff;color:#0b0b0c;font-weight:700;font-size:13.5px;white-space:nowrap;transition:.3s}
.mv-nav-cta:hover{transform:scale(1.04)}
.mv-nav.light .mv-nav-cta{background:#0b0b0c;color:#fff}
@media(max-width:860px){.mv-nav-links{display:none}.mv-nav{gap:14px}}

/* ---------- WORDS / REVEAL ---------- */
.mvl .mv-words .w{display:inline-block;margin-right:.26em;opacity:0;filter:blur(10px);transform:translateY(18px);color:#5b5b64;
  transition:opacity .8s cubic-bezier(.2,.8,.2,1),filter .8s ease,transform .8s cubic-bezier(.2,.8,.2,1),color 1.1s ease;transition-delay:calc(var(--i) * 80ms)}
.mvl .mv-words.visible .w,.mvl .mv-hero.loaded .mv-words .w{opacity:1;filter:blur(0);transform:none;color:#fff}
.mvl .mv-light .mv-words .w{color:#c3c3ca}
.mvl .mv-light .mv-words.visible .w{color:#0b0b0c}
.mvl .mv-words .acc .w{background:linear-gradient(90deg,var(--accent-hi),var(--accent));-webkit-background-clip:text;background-clip:text}
.mvl .mv-words.visible .acc .w,.mvl .mv-hero.loaded .mv-words .acc .w{color:transparent}
.mvl .mv-hero .mv-words .w{transition-delay:calc(var(--i) * 90ms + 350ms)}
.mvl .reveal{opacity:0;transform:translateY(32px);transition:opacity .9s ease,transform .9s cubic-bezier(.2,.8,.2,1)}
.mvl .reveal.visible{opacity:1;transform:none}
.mvl .reveal.d1{transition-delay:.08s}.mvl .reveal.d2{transition-delay:.16s}.mvl .reveal.d3{transition-delay:.24s}.mvl .reveal.d4{transition-delay:.32s}

/* ---------- HERO ---------- */
.mv-hero{position:relative;min-height:100svh;padding:140px 20px 90px;display:flex;flex-direction:column;align-items:center;text-align:center;overflow:hidden;isolation:isolate;background:#050507}
.mv-hero::before{content:"";position:absolute;inset:0;z-index:-1;background:radial-gradient(620px circle at var(--mx,50%) var(--my,30%),rgb(var(--accent-rgb) / .13),transparent 60%)}
.mv-hero-bg{position:absolute;inset:0;z-index:-3;background-size:cover;background-position:center;opacity:.26;filter:saturate(.75)}
.mv-hero-bg::after{content:"";position:absolute;inset:0;background:linear-gradient(to bottom,rgb(5 5 7 / .55),rgb(5 5 7 / .9) 55%,#09090b)}
.mv-beam{position:absolute;z-index:-2;top:9%;right:-22%;width:78%;height:90px;transform:rotate(-30deg);background:linear-gradient(90deg,transparent,rgb(var(--accent-rgb) / .75) 55%,#ffe7cf 85%,transparent);filter:blur(20px);animation:beam 6s ease-in-out infinite alternate}
.mv-beam::after{content:"";position:absolute;left:20%;right:0;top:50%;height:3px;background:linear-gradient(90deg,transparent,#fff3e2 80%,transparent);filter:blur(1px)}
.mv-ember{position:absolute;z-index:-2;left:50%;bottom:-30%;width:120%;height:60%;transform:translateX(-50%);background:radial-gradient(ellipse at center,rgb(var(--accent-rgb) / .35),transparent 65%);filter:blur(30px)}
.mv-hero .hi{opacity:0;transform:translateY(22px);transition:opacity .9s ease,transform .9s cubic-bezier(.2,.8,.2,1);transition-delay:calc(var(--d,0) * 1ms + 300ms)}
.mv-hero.loaded .hi{opacity:1;transform:none}
.mv-badge{display:inline-flex;align-items:center;gap:9px;padding:8px 16px;border-radius:999px;border:1px solid var(--line);background:rgb(255 255 255 / .05);font-size:12.5px;font-weight:600;color:#d7d7de;backdrop-filter:blur(8px)}
.mv-badge i{width:7px;height:7px;border-radius:50%;background:var(--accent);box-shadow:0 0 0 4px rgb(var(--accent-rgb) / .25);animation:pulse 1.6s ease-in-out infinite}
.mv-h{font-size:clamp(2.5rem,7.2vw,5.6rem);font-weight:700;letter-spacing:-.04em;line-height:1.04;max-width:980px;margin:24px 0 20px}
.mv-sub{color:#a8a8b3;font-size:clamp(1rem,1.7vw,1.2rem);line-height:1.65;max-width:640px}
.mv-cta-row{display:flex;flex-wrap:wrap;justify-content:center;gap:14px;margin-top:32px}
.mv-btn{position:relative;overflow:hidden;display:inline-flex;align-items:center;gap:14px;padding:12px 12px 12px 28px;border-radius:999px;color:#fff;font-weight:700;font-size:17px;
  background:linear-gradient(135deg,var(--accent-hi),var(--accent) 60%,var(--accent-hi));box-shadow:0 10px 40px rgb(var(--accent-rgb) / .45),0 0 70px rgb(var(--accent-rgb) / .25),inset 0 1px 0 rgb(255 255 255 / .35);border:1px solid rgb(var(--accent-rgb) / .6);transition:transform .3s,box-shadow .3s}
.mv-btn::before{content:"";position:absolute;top:0;bottom:0;width:60px;left:-80px;background:linear-gradient(90deg,transparent,rgb(255 255 255 / .45),transparent);transform:skewX(-20deg);animation:shine 3.6s ease-in-out infinite}
.mv-btn:hover{transform:translateY(-3px) scale(1.02)}
.mv-btn .ar{width:38px;height:38px;border-radius:50%;background:rgb(255 255 255 / .2);border:1px solid rgb(255 255 255 / .3);display:grid;place-items:center;transition:transform .3s}
.mv-btn:hover .ar{transform:translateX(4px)}
.mv-btn-ghost{display:inline-flex;align-items:center;padding:15px 28px;border-radius:999px;border:1px solid var(--line);background:rgb(255 255 255 / .06);font-weight:600;font-size:16px;backdrop-filter:blur(8px);transition:.3s}
.mv-btn-ghost:hover{background:rgb(255 255 255 / .12);transform:translateY(-3px)}
.mv-typing{margin-top:30px;display:inline-flex;align-items:center;gap:9px;padding:9px 18px;border-radius:999px;background:rgb(255 255 255 / .04);border:1px solid var(--line);color:var(--accent-hi);font-size:14px;font-weight:600;min-height:40px;max-width:94vw;text-align:left}
.mv-typing svg{flex-shrink:0}
.mv-caret{width:2px;height:16px;background:currentColor;flex-shrink:0;animation:blink 1s steps(2) infinite}

/* 3D scene */
.mv-scene-wrap{width:100%;max-width:700px;margin-top:60px;perspective:1100px}
.mv-scene{position:relative;aspect-ratio:16/9;transform-style:preserve-3d;transform:rotateX(var(--rx,0deg)) rotateY(var(--ry,0deg));transition:transform .25s ease-out}
.mv-lines{position:absolute;inset:0;width:100%;height:100%;overflow:visible}
.mv-lines path{fill:none;stroke:rgb(255 255 255 / .09);stroke-width:1}
.mv-lines path.spark{stroke:var(--accent);stroke-width:2.2;stroke-linecap:round;stroke-dasharray:16 220;filter:drop-shadow(0 0 6px var(--accent));animation:dash 3.2s linear infinite;animation-delay:calc(var(--i) * -.55s)}
.mv-tile{position:absolute;width:clamp(44px,9vw,64px);aspect-ratio:1;translate:-50% -50%;border-radius:18px;display:grid;place-items:center;color:#fff;
  background:linear-gradient(160deg,rgb(255 255 255 / .12),rgb(255 255 255 / .03));border:1px solid rgb(255 255 255 / .13);backdrop-filter:blur(8px);box-shadow:0 16px 40px rgb(0 0 0 / .55);
  transform:translateZ(var(--z,40px));animation:floaty 5s ease-in-out infinite;animation-delay:calc(var(--i) * -.8s)}
.mv-tile.hot{color:var(--accent-hi);border-color:rgb(var(--accent-rgb) / .5);box-shadow:0 16px 40px rgb(0 0 0 / .55),0 0 30px rgb(var(--accent-rgb) / .35)}
.mv-chip{position:absolute;left:50%;top:50%;width:clamp(96px,20%,132px);aspect-ratio:1;translate:-50% -50%;transform-style:preserve-3d;transform:translateZ(30px)}
.mv-chip::before{content:"";position:absolute;inset:-70%;background:radial-gradient(circle,rgb(var(--accent-rgb) / .45),transparent 62%);filter:blur(10px);animation:pulse 3s ease-in-out infinite;transform:translateZ(-40px)}
.mv-chip .l1,.mv-chip .l2,.mv-chip .l3{position:absolute;border-radius:24px}
.mv-chip .l1{inset:-14%;border:2px dashed rgb(var(--accent-rgb) / .55);transform:translateZ(-22px);animation:spin 18s linear infinite}
.mv-chip .l2{inset:0;background:linear-gradient(160deg,#1d1d22,#0a0a0c);border:1px solid rgb(255 255 255 / .12);transform:translateZ(0);box-shadow:0 30px 60px rgb(0 0 0 / .7)}
.mv-chip .l3{inset:14%;display:grid;place-items:center;color:#fff;background:linear-gradient(135deg,var(--accent-hi),var(--accent));transform:translateZ(26px);box-shadow:0 0 40px rgb(var(--accent-rgb) / .8),inset 0 1px 0 rgb(255 255 255 / .4)}

/* ---------- SECTIONS / HEADS ---------- */
.mv-dark{background:var(--bg)}
.mv-sec{position:relative;max-width:1180px;margin:0 auto;padding:110px 20px}
.mv-head{text-align:center;max-width:780px;margin:0 auto 54px;padding:0 20px}
.mv-sec .mv-head{padding:0}
.mv-kicker{display:inline-block;padding:7px 14px;border-radius:999px;border:1px solid var(--line);background:rgb(255 255 255 / .04);font-size:11.5px;font-weight:700;letter-spacing:.14em;color:#cfcfd6}
.mv-light .mv-kicker{border-color:rgb(0 0 0 / .1);background:rgb(0 0 0 / .03);color:#4b4b55}
.mv-head h2{font-size:clamp(2rem,4.8vw,3.5rem);font-weight:700;letter-spacing:-.035em;line-height:1.08;margin:18px 0 16px}
.mv-head p{color:var(--muted);font-size:1.05rem;line-height:1.7}
.mv-light .mv-head p{color:#6b6b75}

/* ---------- BENTO ---------- */
.mv-feat{position:relative}
.mv-bento{display:grid;grid-template-columns:repeat(6,1fr);gap:16px}
.mv-b1{grid-column:span 4}.mv-b2{grid-column:span 2}.mv-b3{grid-column:span 2}.mv-b4{grid-column:span 4}
@media(max-width:860px){.mv-bento>*{grid-column:span 6}}
.mv-glass{position:relative;min-height:340px;border-radius:28px;padding:30px;display:flex;flex-direction:column;justify-content:flex-end;overflow:hidden;
  background:linear-gradient(160deg,rgb(255 255 255 / .06),rgb(255 255 255 / .012));border:1px solid var(--line);
  transform:perspective(1000px) rotateX(var(--rx,0deg)) rotateY(var(--ry,0deg));transition:transform .3s ease-out,opacity .9s ease}
.mvl .mv-glass.reveal{transform:perspective(1000px) translateY(32px)}
.mvl .mv-glass.reveal.visible{transform:perspective(1000px) rotateX(var(--rx,0deg)) rotateY(var(--ry,0deg))}
.mv-glass::before{content:"";position:absolute;inset:0;background:radial-gradient(420px circle at var(--mx,50%) var(--my,0%),rgb(var(--accent-rgb) / .17),transparent 60%);opacity:0;transition:opacity .3s;pointer-events:none}
.mv-glass:hover::before{opacity:1}
.mv-glass h3{position:relative;font-size:1.3rem;font-weight:700;margin-bottom:8px;letter-spacing:-.01em}
.mv-glass p{position:relative;color:var(--muted);line-height:1.65;font-size:.95rem}
.mv-viz{position:absolute;left:0;right:0;top:0;height:58%;display:grid;place-items:center;overflow:hidden}
.mv-player{position:relative;width:min(78%,460px);aspect-ratio:16/8;border-radius:18px;display:grid;place-items:center;background:linear-gradient(135deg,rgb(var(--accent-rgb) / .38),#15080a 60%);border:1px solid var(--line);box-shadow:0 30px 60px rgb(0 0 0 / .55);transform:perspective(800px) rotateX(16deg) translateY(22px)}
.mv-player .pl{width:54px;height:54px;border-radius:50%;background:var(--accent);display:grid;place-items:center;color:#fff;box-shadow:0 0 0 10px rgb(var(--accent-rgb) / .22);animation:pulse 2s ease-in-out infinite}
.mv-player .hdc{position:absolute;top:10px;right:12px;font-size:10px;font-weight:800;padding:3px 7px;border-radius:6px;border:1px solid rgb(255 255 255 / .3);background:rgb(0 0 0 / .5)}
.mv-player .ms{position:absolute;top:10px;left:12px;font-size:11px;font-weight:600;color:#bfbfc8}
.mv-player .bar{position:absolute;left:5%;right:5%;bottom:12px;height:4px;border-radius:4px;background:rgb(255 255 255 / .16);overflow:hidden}
.mv-player .bar i{display:block;height:100%;width:0;background:var(--accent);animation:load 4s ease-in-out infinite}
.mv-subs{display:flex;flex-direction:column;align-items:center;gap:12px;padding:0 14px;text-align:center}
.mv-subs .pill{font-size:11px;font-weight:700;padding:5px 11px;border-radius:999px;background:rgb(var(--accent-rgb) / .18);color:var(--accent-hi);border:1px solid rgb(var(--accent-rgb) / .35)}
.mv-subs .line{padding:10px 16px;border-radius:12px;background:rgb(0 0 0 / .65);border:1px solid var(--line);font-size:14px;font-weight:600;animation:subfade 4s ease-in-out infinite}
.mv-shield{position:relative;width:150px;height:150px;display:grid;place-items:center}
.mv-shield .sh{position:relative;z-index:2;width:84px;height:84px;border-radius:26px;display:grid;place-items:center;color:#fff;background:linear-gradient(135deg,var(--accent-hi),var(--accent));box-shadow:0 0 40px rgb(var(--accent-rgb) / .6)}
.mv-shield .rg{position:absolute;inset:0;border-radius:50%;border:1px solid rgb(var(--accent-rgb) / .5);animation:ring 3s ease-out infinite}
.mv-shield .r2{animation-delay:1s}.mv-shield .r3{animation-delay:2s}
.mv-marqs{flex-direction:column;gap:12px;display:flex;justify-content:center;mask-image:linear-gradient(90deg,transparent,#000 15%,#000 85%,transparent);-webkit-mask-image:linear-gradient(90deg,transparent,#000 15%,#000 85%,transparent)}
.mv-marq{overflow:hidden;width:100%}
.mv-marq .tk{display:flex;gap:10px;width:max-content;animation:marq 40s linear infinite}
.mv-marq .tk.rev{animation-direction:reverse;animation-duration:50s}
.mv-marq .ch{padding:9px 16px;border-radius:999px;border:1px solid var(--line);background:rgb(255 255 255 / .05);font-size:13px;font-weight:600;white-space:nowrap}
.mv-marq .ch b{color:var(--accent-hi);margin-right:4px}

/* ---------- ROWS / CARDS ---------- */
.mv-trend{padding:20px 0 40px}
.mv-row{position:relative;padding:60px 0 20px}
.mv-row-head{max-width:1180px;margin:0 auto;padding:0 20px;display:flex;align-items:flex-end;justify-content:space-between;gap:16px;flex-wrap:wrap}
.mv-row-head h2{font-size:clamp(1.7rem,3.6vw,2.6rem);font-weight:700;letter-spacing:-.03em}
.mv-row-tools{display:flex;align-items:center;gap:10px}
.mv-arrow{width:40px;height:40px;border-radius:50%;border:1px solid var(--line);background:rgb(255 255 255 / .05);color:inherit;display:grid;place-items:center;cursor:pointer;transition:.25s}
.mv-arrow:hover{background:var(--accent);border-color:var(--accent);transform:scale(1.08)}
.mv-seeall{display:inline-flex;align-items:center;gap:6px;font-weight:700;font-size:14px;color:var(--accent-hi);margin-left:6px}
.mv-seeall:hover{gap:10px}
.mv-slider{display:flex;gap:18px;overflow-x:auto;padding:26px max(20px,calc((100vw - 1180px) / 2 + 20px)) 44px;scrollbar-width:none;-webkit-overflow-scrolling:touch}
.mv-slider::-webkit-scrollbar{display:none}
.mv-card{flex:0 0 auto;width:clamp(150px,19vw,214px);user-select:none;-webkit-user-select:none;cursor:pointer;transform:perspective(900px) rotateX(var(--rx,0deg)) rotateY(var(--ry,0deg));transition:transform .25s ease-out;will-change:transform}
.mv-poster{position:relative;aspect-ratio:2/3;border-radius:18px;overflow:hidden;background:#17171a;border:1px solid rgb(255 255 255 / .09);box-shadow:0 22px 44px rgb(0 0 0 / .5)}
.mv-poster img{width:100%;height:100%;object-fit:cover;display:block;transition:transform .7s cubic-bezier(.2,.8,.2,1)}
.mv-card:hover .mv-poster img{transform:scale(1.09)}
.mv-poster-info{position:absolute;left:0;right:0;bottom:0;padding:46px 13px 13px;background:linear-gradient(transparent,rgb(0 0 0 / .92));text-align:left;color:#fff}
.mv-poster-info .t{font-weight:700;font-size:.92rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.mv-poster-info .r{margin-top:3px;color:#ffc857;font-size:.8rem;font-weight:700}
.mv-b{position:absolute;top:10px;z-index:2;font-size:10px;font-weight:800;padding:3px 7px;border-radius:6px;letter-spacing:.05em;color:#fff}
.mv-b-hd{right:10px;background:rgb(0 0 0 / .6);border:1px solid rgb(255 255 255 / .28)}
.mv-b-new{left:10px;background:var(--accent)}
.mv-rank{position:absolute;left:10px;bottom:50px;z-index:2;font-size:68px;font-weight:800;line-height:1;color:transparent;-webkit-text-stroke:2px #fff;text-shadow:0 4px 18px rgb(0 0 0 / .6)}
.mv-play{position:absolute;inset:0;display:grid;place-items:center;background:rgb(0 0 0 / .38);opacity:0;transition:opacity .3s}
.mv-card:hover .mv-play{opacity:1}
.mv-play i{width:56px;height:56px;border-radius:50%;background:var(--accent);color:#fff;display:grid;place-items:center;box-shadow:0 0 0 9px rgb(var(--accent-rgb) / .25),0 12px 30px rgb(var(--accent-rgb) / .55);transform:scale(.7);transition:transform .35s cubic-bezier(.2,.8,.2,1)}
.mv-card:hover .mv-play i{transform:scale(1)}
.mv-glare{position:absolute;inset:0;pointer-events:none;background:radial-gradient(240px circle at var(--mx,50%) var(--my,50%),rgb(255 255 255 / .24),transparent 60%);opacity:0;transition:opacity .3s;mix-blend-mode:overlay}
.mv-card:hover .mv-glare{opacity:1}

/* ---------- GLOBE ---------- */
.mv-globe-sec{padding:100px 0 0;text-align:center;overflow:hidden;position:relative}
.mv-globe{position:relative;width:min(92vw,720px);aspect-ratio:1;margin:10px auto -16%;border-radius:50%;
  background:radial-gradient(circle at 50% 42%,#12070c 0%,#12070c 56%,rgb(var(--accent-rgb) / .3) 80%,rgb(var(--accent-rgb) / .95) 99%,transparent 100%);
  box-shadow:0 0 90px rgb(var(--accent-rgb) / .5),0 0 220px rgb(var(--accent-rgb) / .25)}
.mv-globe canvas{position:absolute;inset:0;width:100%;height:100%}

/* ---------- LIGHT BLOCK ---------- */
.mv-light{position:relative;z-index:2;background:#f6f4f0;color:#0b0b0c;border-radius:48px 48px 0 0;margin-top:-48px}
.mv-lightblock{padding-top:36px;padding-bottom:90px}
.mv-light .mv-seeall{color:var(--accent)}
.mv-light .mv-arrow{border-color:rgb(0 0 0 / .12);background:#fff;color:#0b0b0c}
.mv-light .mv-arrow:hover{color:#fff}
.mv-light .mv-poster{box-shadow:0 22px 40px rgb(0 0 0 / .18);border-color:rgb(0 0 0 / .06)}
.mv-steps{display:grid;grid-template-columns:repeat(3,1fr);gap:18px}
@media(max-width:860px){.mv-steps{grid-template-columns:1fr}}
.mv-step{background:#fff;border:1px solid rgb(0 0 0 / .07);border-radius:28px;padding:32px;box-shadow:0 24px 50px rgb(0 0 0 / .05);transform:perspective(900px) rotateX(var(--rx,0deg)) rotateY(var(--ry,0deg));transition:transform .3s ease-out,opacity .9s ease}
.mvl .mv-step.reveal{transform:perspective(900px) translateY(32px)}
.mvl .mv-step.reveal.visible{transform:perspective(900px) rotateX(var(--rx,0deg)) rotateY(var(--ry,0deg))}
.mv-step .n{width:50px;height:50px;border-radius:16px;margin-bottom:24px;display:grid;place-items:center;color:#fff;font-weight:800;font-size:20px;background:linear-gradient(135deg,var(--accent-hi),var(--accent));box-shadow:0 12px 26px rgb(var(--accent-rgb) / .35)}
.mv-step h3{font-size:1.2rem;font-weight:700;margin-bottom:8px}
.mv-step p{color:#6b6b75;line-height:1.65;font-size:.95rem}
.mv-moods-sec{padding-top:20px;padding-bottom:0}
.mv-moods{display:grid;grid-template-columns:repeat(6,1fr);gap:14px}
@media(max-width:900px){.mv-moods{grid-template-columns:repeat(3,1fr)}}
@media(max-width:520px){.mv-moods{grid-template-columns:repeat(2,1fr)}}
.mv-mood{position:relative;aspect-ratio:1/1.12;border-radius:24px;padding:18px;display:flex;flex-direction:column;justify-content:space-between;color:#fff;overflow:hidden;background:linear-gradient(150deg,var(--c1),var(--c2));
  transform:perspective(800px) rotateX(var(--rx,0deg)) rotateY(var(--ry,0deg));transition:transform .3s ease-out,opacity .9s ease,box-shadow .3s;box-shadow:0 18px 34px rgb(0 0 0 / .14)}
.mvl .mv-mood.reveal{transform:perspective(800px) translateY(32px)}
.mvl .mv-mood.reveal.visible{transform:perspective(800px) rotateX(var(--rx,0deg)) rotateY(var(--ry,0deg))}
.mv-mood::after{content:"";position:absolute;inset:0;background:radial-gradient(200px circle at var(--mx,50%) var(--my,0%),rgb(255 255 255 / .28),transparent 60%)}
.mv-mood .e{font-size:42px;line-height:1;filter:drop-shadow(0 8px 12px rgb(0 0 0 / .3));transition:transform .4s}
.mv-mood:hover .e{transform:translateY(-6px) scale(1.15) rotate(-6deg)}
.mv-mood .nm{font-weight:800;font-size:1.05rem;position:relative;z-index:1}

/* ---------- NEW / FAQ / CTA ---------- */
.mv-round{position:relative;z-index:3;border-radius:48px 48px 0 0;margin-top:-48px;padding-top:30px}
.mv-new{padding-bottom:40px}
.mv-faq-sec{padding:90px 20px 40px}
.mv-faq{max-width:820px;margin:0 auto;display:grid;gap:10px}
.mv-q{border:1px solid var(--line);border-radius:20px;background:rgb(255 255 255 / .03);overflow:hidden;transition:background .3s,border-color .3s}
.mv-q.open{background:rgb(255 255 255 / .06);border-color:rgb(var(--accent-rgb) / .35)}
.mv-q button{width:100%;display:flex;align-items:center;justify-content:space-between;gap:16px;padding:20px 22px;background:none;border:0;color:#fff;font-size:1rem;font-weight:600;text-align:left;cursor:pointer}
.mv-q button:focus-visible{outline:2px solid var(--accent);outline-offset:-2px;border-radius:20px}
.mv-q button svg{flex-shrink:0;transition:transform .35s}
.mv-q.open button svg{transform:rotate(180deg);color:var(--accent-hi)}
.mv-q .a{display:grid;grid-template-rows:0fr;transition:grid-template-rows .4s ease}
.mv-q.open .a{grid-template-rows:1fr}
.mv-q .a>div{overflow:hidden}
.mv-q .a p{padding:0 22px 22px;color:var(--muted);line-height:1.7}
.mv-bigcta{position:relative;text-align:center;padding:130px 20px 150px;overflow:hidden}
.mv-bigcta-glow{position:absolute;left:50%;bottom:-40%;width:130%;height:100%;transform:translateX(-50%);background:radial-gradient(ellipse at center,rgb(var(--accent-rgb) / .38),transparent 62%);filter:blur(30px);pointer-events:none}
.mv-bigcta h2{position:relative;font-size:clamp(2.2rem,6vw,4.4rem);font-weight:700;letter-spacing:-.04em;line-height:1.05}
.mv-bigcta p{position:relative;max-width:600px;margin:20px auto 36px;color:var(--muted);line-height:1.7;font-size:1.05rem}
.mv-bigcta .reveal{position:relative}

/* ---------- FOOTER ---------- */
.mv-foot{border-top:1px solid var(--line);padding:70px 20px 34px}
.mv-foot-top{max-width:1180px;margin:0 auto;display:grid;grid-template-columns:1.6fr repeat(4,1fr);gap:36px}
@media(max-width:900px){.mv-foot-top{grid-template-columns:1fr 1fr}.mv-foot-brand{grid-column:1/-1}}
.mv-foot-brand p{margin:16px 0 20px;color:var(--muted);line-height:1.7;font-size:.92rem;max-width:340px}
.mv-social{display:flex;gap:10px}
.mv-social a{width:40px;height:40px;border-radius:50%;border:1px solid var(--line);background:rgb(255 255 255 / .04);display:grid;place-items:center;transition:.3s}
.mv-social a:hover{background:var(--accent);border-color:var(--accent);transform:translateY(-3px)}
.mv-social svg{width:18px;height:18px}
.mv-foot-col h5{font-size:.82rem;letter-spacing:.12em;text-transform:uppercase;color:#fff;margin-bottom:16px;font-weight:700}
.mv-foot-col a{display:block;color:var(--muted);font-size:.92rem;padding:6px 0;transition:.25s}
.mv-foot-col a:hover{color:#fff;transform:translateX(4px)}
.mv-foot-bottom{max-width:1180px;margin:50px auto 0;padding-top:24px;border-top:1px solid var(--line);display:flex;justify-content:space-between;gap:16px;flex-wrap:wrap;color:var(--muted);font-size:.85rem}
.mv-foot-bottom .legal{display:flex;gap:18px}
.mv-foot-bottom .legal a:hover{color:#fff}

/* ---------- KEYFRAMES ---------- */
@keyframes mvM{from{clip-path:inset(0 0 100% 0);transform:translateY(-14px)}to{clip-path:inset(0 0 0 0);transform:none}}
@keyframes mvWipe{to{clip-path:inset(0 0 0 0)}}
@keyframes mvFade{from{opacity:0}to{opacity:1}}
@keyframes mvRot{to{transform:rotate(360deg)}}
@keyframes pulse{0%,100%{transform:scale(1);opacity:1}50%{transform:scale(.82);opacity:.7}}
@keyframes blink{50%{opacity:0}}
@keyframes floaty{0%,100%{transform:translateZ(var(--z,40px)) translateY(0)}50%{transform:translateZ(var(--z,40px)) translateY(-10px)}}
@keyframes dash{from{stroke-dashoffset:0}to{stroke-dashoffset:-236}}
@keyframes spin{to{transform:translateZ(-22px) rotate(360deg)}}
@keyframes beam{from{opacity:.65;transform:rotate(-30deg) translateX(0)}to{opacity:1;transform:rotate(-30deg) translateX(-4%)}}
@keyframes shine{0%,55%{left:-80px}100%{left:120%}}
@keyframes load{0%{width:0}70%,100%{width:100%}}
@keyframes ring{from{transform:scale(.55);opacity:.9}to{transform:scale(1.5);opacity:0}}
@keyframes marq{to{transform:translateX(-50%)}}
@keyframes subfade{0%,100%{opacity:.55}50%{opacity:1}}
@media(prefers-reduced-motion:reduce){
  .mvl *,.mvl *::before,.mvl *::after{animation-duration:.01ms!important;animation-iteration-count:1!important;transition-duration:.01ms!important;transition-delay:0ms!important}
}
`;
