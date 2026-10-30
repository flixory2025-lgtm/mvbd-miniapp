"use client"

import { useEffect, useRef, useState } from "react"
import {
  Play,
  Users,
  Zap,
  Target,
  Award,
  Heart,
  ArrowLeft,
  Sparkles,
  Film,
  Headphones,
  Star,
} from "lucide-react"
import { movies } from "@/lib/movie-data"
import UniversalFooter from "./universal-footer"

interface AboutUsPageProps {
  onBack?: () => void
}

/* Accent color (R G B). Red = "229 9 20". Green chaile: "61 220 46" */
const ACCENT_RGB = "229 9 20"
const AC = "rgb(var(--ac))"

/* Poster thakle real poster, na hole gradient art */
const FALLBACKS = [
  "linear-gradient(160deg,#f97316,#7c2d12 55%,#1e1b4b)",
  "linear-gradient(160deg,#22d3ee,#0e7490 55%,#0f172a)",
  "linear-gradient(160deg,#f59e0b,#78350f 55%,#111827)",
  "linear-gradient(160deg,#38bdf8,#1d4ed8 55%,#0b1020)",
  "linear-gradient(160deg,#fb7185,#9f1239 55%,#1e1b4b)",
]

const posters: string[] = (movies as any[])
  .map((m) => m?.poster)
  .filter(Boolean)
  .slice(0, 5)

function art(i: number): React.CSSProperties {
  const src = posters[i]
  return src
    ? { backgroundImage: `url(${src})`, backgroundSize: "cover", backgroundPosition: "center" }
    : { backgroundImage: FALLBACKS[i % FALLBACKS.length] }
}

/* Scroll progress (0..1) ke CSS variable --p hishebe set kore. React re-render hoy na, tai smooth. */
function useScenes(root: React.RefObject<HTMLDivElement | null>) {
  useEffect(() => {
    const els = Array.from(root.current?.querySelectorAll<HTMLElement>("[data-scene]") ?? [])
    let raf = 0
    const run = () => {
      raf = 0
      const vh = window.innerHeight
      for (const el of els) {
        const r = el.getBoundingClientRect()
        if (r.bottom < -vh || r.top > vh * 2) continue
        const pin = el.hasAttribute("data-pin")
        const span = pin ? r.height - vh : r.height + vh
        const raw = pin ? -r.top : vh - r.top
        el.style.setProperty("--p", Math.min(1, Math.max(0, raw / span)).toFixed(4))
      }
    }
    const on = () => {
      if (!raf) raf = requestAnimationFrame(run)
    }
    run()
    window.addEventListener("scroll", on, { passive: true, capture: true })
    window.addEventListener("resize", on)
    return () => {
      window.removeEventListener("scroll", on, { capture: true } as any)
      window.removeEventListener("resize", on)
      cancelAnimationFrame(raf)
    }
  }, [root])
}

function CountUp({
  end,
  suffix = "",
  decimals = 0,
}: {
  end: number
  suffix?: string
  decimals?: number
}) {
  const ref = useRef<HTMLSpanElement>(null)
  const [val, setVal] = useState(0)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    let raf = 0
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return
        io.disconnect()
        const t0 = performance.now()
        const tick = (t: number) => {
          const p = Math.min((t - t0) / 1600, 1)
          setVal(end * (1 - Math.pow(1 - p, 3)))
          if (p < 1) raf = requestAnimationFrame(tick)
        }
        raf = requestAnimationFrame(tick)
      },
      { threshold: 0.4 }
    )
    io.observe(el)
    return () => {
      io.disconnect()
      cancelAnimationFrame(raf)
    }
  }, [end])

  return (
    <span ref={ref}>
      {val.toFixed(decimals)}
      <span style={{ color: AC }}>{suffix}</span>
    </span>
  )
}

function GoBack({
  onBack,
  className,
  children,
}: {
  onBack?: () => void
  className?: string
  children: React.ReactNode
}) {
  // onBack thakle (overlay / profile theke) oita, na hole home e niye jabe
  return onBack ? (
    <button type="button" onClick={onBack} className={className} aria-label="Back">
      {children}
    </button>
  ) : (
    <a href="/" className={className} aria-label="Back">
      {children}
    </a>
  )
}

const TABS = [
  { id: "mission", label: "আমাদের মিশন", icon: Target },
  { id: "vision", label: "আমাদের ভিশন", icon: Zap },
  { id: "values", label: "আমাদের মূল্যবোধ", icon: Heart },
] as const

const VALUES = [
  "গুণমান - আমরা কখনো মানে আপস করি না",
  "স্বচ্ছতা - আমাদের সকল অপারেশন স্বচ্ছ এবং সৎ",
  "উদ্ভাবন - নতুন এবং উন্নত সেবা প্রদানে প্রতিশ্রুতিবদ্ধ",
  "সম্প্রদায় - আমাদের ব্যবহারকারীদের সাথে একটি শক্তিশালী সম্পর্ক বজায় রাখা",
  "দায়িত্বশীলতা - সামাজিক এবং পরিবেশগত দায়বদ্ধতা",
]

const AWARDS = [
  "বাংলাদেশের সেরা স্ট্রিমিং সার্ভিস ২০২৫",
  "গ্রাহক সেবায় শ্রেষ্ঠত্বের জন্য পুরস্কৃত",
  "সেরা কন্টেন্ট কিউরেশন অ্যাওয়ার্ড",
]

/* Big statement er shobdo gulo — scroll korle ekta ekta kore jole uthbe */
const STATEMENT: [string, boolean][] = [
  ["Movies", false],
  ["Verse", false],
  ["হলো", false],
  ["বাংলাদেশীদের", true],
  ["জন্য", false],
  ["মুভি", true],
  ["ও", true],
  ["সিরিজের", true],
  ["ঠিকানা", false],
]

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Anek+Bangla:wdth,wght@75..125,300..800&family=Oswald:wght@400;600;700&display=swap');

.ab { --ac:${ACCENT_RGB}; --bone:#ece6e3; --dim:rgba(236,230,227,.56); position:relative; min-height:100vh; overflow-x:clip; background:#040404; color:var(--bone); font-family:'Anek Bangla','Hind Siliguri',system-ui,sans-serif; }
.ab [data-scene] { --p:0; }
.ab-d { font-family:'Oswald','Anek Bangla',sans-serif; font-stretch:80%; font-weight:700; line-height:1.3; }
.ab-vig { position:fixed; inset:0; z-index:40; pointer-events:none; background:radial-gradient(ellipse at 50% 45%, transparent 55%, rgba(0,0,0,.65)); }

/* ---------- liquid glass back icon ---------- */
.ab-back { position:fixed; z-index:60; left:max(14px,env(safe-area-inset-left)); top:max(14px,env(safe-area-inset-top)); width:46px; height:46px; border-radius:999px; display:grid; place-items:center; color:#fff; overflow:hidden;
  background:linear-gradient(145deg,rgba(255,255,255,.26),rgba(255,255,255,.05) 55%,rgba(255,255,255,.14));
  -webkit-backdrop-filter:blur(16px) saturate(190%) brightness(1.1); backdrop-filter:blur(16px) saturate(190%) brightness(1.1);
  border:1px solid rgba(255,255,255,.3);
  box-shadow:inset 0 1.5px 0 rgba(255,255,255,.65), inset 0 -10px 18px rgba(255,255,255,.07), 0 10px 30px rgba(0,0,0,.55), 0 0 26px rgb(var(--ac)/.2);
  transition:transform .28s cubic-bezier(.3,1.6,.5,1); }
.ab-back::before { content:""; position:absolute; inset:3px 9px auto; height:42%; border-radius:999px; background:linear-gradient(180deg,rgba(255,255,255,.55),transparent); opacity:.55; pointer-events:none; }
.ab-back:hover { transform:scale(1.08); } .ab-back:active { transform:scale(.93); }
.ab-back:focus-visible { outline:2px solid #fff; outline-offset:3px; }

/* ---------- pinned scenes ---------- */
.ab-pin { position:relative; }
.ab-stage { position:sticky; top:0; height:100vh; height:100svh; overflow:hidden; }

/* Scene 1 : drain gate -> title */
.gate { position:absolute; left:50%; top:46%; width:min(84vmin,640px); aspect-ratio:1; will-change:transform,opacity;
  transform:translate(-50%,-50%) scale(calc(1 + var(--p) * 7)); opacity:clamp(0, calc(1.9 - var(--p) * 2.6), 1); }
.gate-glow { position:absolute; inset:6%; border-radius:50%; background:radial-gradient(circle at 50% 60%, rgb(var(--ac)/.55), transparent 62%); animation:abFlick 2.8s ease-in-out infinite alternate; mix-blend-mode:screen; }
.gate-light { position:absolute; inset:0; background:radial-gradient(circle at 50% 46%, rgb(var(--ac)/.5), transparent 58%); opacity:clamp(0, calc((var(--p) - .12) * 2.2), 1); }
.gate-cue { position:absolute; left:50%; bottom:5vh; width:1px; height:58px; background:linear-gradient(rgba(255,255,255,.55),transparent); opacity:clamp(0, calc(1 - var(--p) * 8), 1); }
.gate-cue::after { content:""; position:absolute; left:-2px; top:0; width:5px; height:5px; border-radius:50%; background:#fff; animation:abDrop 1.8s ease-in infinite; }
.ttl { --r:clamp(0, calc((var(--p) - .45) * 2.6), 1); position:absolute; inset:0; display:flex; flex-direction:column; align-items:center; justify-content:center; padding:0 22px; text-align:center; opacity:var(--r); scale:calc(1.22 - var(--r) * .22); }
.ttl-meta { display:flex; align-items:center; gap:14px; width:min(560px,92%); font-size:11px; font-weight:600; letter-spacing:.3em; color:var(--dim); }
.ttl-meta i { flex:1; height:1px; background:linear-gradient(90deg,transparent,rgb(var(--ac)/.7)); }
.ttl-meta i:last-child { transform:scaleX(-1); }
.ttl-h1 { margin:.1em 0 0; font-size:clamp(76px,21vw,250px); line-height:1.05; text-transform:uppercase; letter-spacing:.02em; background:linear-gradient(180deg,#ff4a4a 10%,rgb(var(--ac)) 45%,#5a0508 100%); -webkit-background-clip:text; background-clip:text; color:transparent; filter:drop-shadow(0 0 26px rgb(var(--ac)/.5)); }
.ttl-tag { margin:6px 0 0; font-size:clamp(22px,3.6vw,38px); }
.ttl-p { max-width:34rem; margin:18px auto 0; font-size:14px; line-height:1.85; color:var(--dim); }

/* Scene 3 : statement */
.stmt { position:absolute; inset:0; display:flex; align-items:center; padding:0 clamp(22px,7vw,110px); }
.stmt-art { position:absolute; right:0; top:0; width:min(62%,720px); height:100%; opacity:.5; transform:translateY(calc(var(--p) * -9vh)) scale(1.12);
  -webkit-mask-image:linear-gradient(270deg,#000 25%,transparent); mask-image:linear-gradient(270deg,#000 25%,transparent); }
.stmt-art::after { content:""; position:absolute; inset:0; background:linear-gradient(180deg,rgba(4,4,4,.7),transparent 40%,rgba(4,4,4,.85)), radial-gradient(circle at 80% 30%, rgb(var(--ac)/.35), transparent 60%); }
.stmt-h { position:relative; max-width:60rem; font-size:clamp(40px,8.6vw,118px); line-height:1.32; }
.stmt-h .w { opacity:clamp(.12, calc(var(--p) * 11 - var(--i) + .6), 1); transition:opacity .15s linear; }
.stmt-h .w.hot { color:rgb(var(--ac)); text-shadow:0 0 38px rgb(var(--ac)/.55); }

/* ---------- normal sections ---------- */
.ab-sec { position:relative; margin:0 auto; max-width:72rem; padding:clamp(72px,12vw,150px) 24px; }
.ab-par { transform:translateY(calc((.5 - var(--p)) * var(--k,80) * 1px)); }
.ab-fig { position:relative; height:min(78vh,560px); -webkit-mask-image:linear-gradient(90deg,#000 40%,transparent); mask-image:linear-gradient(90deg,#000 40%,transparent); }
.ab-fig::after { content:""; position:absolute; inset:0; background:linear-gradient(0deg,rgba(4,4,4,.85),transparent 45%), radial-gradient(circle at 20% 78%, rgb(var(--ac)/.5), transparent 60%); }
.ab-ring { position:absolute; right:2%; top:8%; width:138px; height:138px; border-radius:50%; display:grid; place-items:center; text-align:center; background:rgba(4,4,4,.55); border:1px solid rgba(255,255,255,.14); -webkit-backdrop-filter:blur(6px); backdrop-filter:blur(6px); }
.ab-ring::before { content:""; position:absolute; inset:-7px; border-radius:50%; border:1px dashed rgb(var(--ac)/.65); animation:abSpin 22s linear infinite; }
.ab-ring b { display:block; font-size:38px; line-height:1.2; }
.ab-ring small { font-size:9px; font-weight:600; letter-spacing:.24em; color:rgb(var(--ac)); }
.ab-vert { position:absolute; right:-6px; top:46%; writing-mode:vertical-rl; font-size:10px; font-weight:600; letter-spacing:.3em; color:rgb(var(--ac)); }

.ab-label { font-size:11px; font-weight:600; letter-spacing:.3em; color:rgb(var(--ac)); }
.ab-tabs { display:flex; margin-top:30px; border-top:1px solid rgba(255,255,255,.1); }
.ab-tab { flex:1; display:flex; flex-direction:column; align-items:center; gap:8px; padding:18px 6px 4px; font-size:12px; font-weight:600; color:var(--dim); border-left:1px solid rgba(255,255,255,.08); margin-top:-1px; border-top:2px solid transparent; transition:color .2s,border-color .2s; }
.ab-tab:first-child { border-left:0; }
.ab-tab:hover { color:var(--bone); }
.ab-tab[aria-selected="true"] { color:var(--bone); border-top-color:rgb(var(--ac)); }
.ab-tab[aria-selected="true"] svg { color:rgb(var(--ac)); filter:drop-shadow(0 0 8px rgb(var(--ac)/.8)); }
.ab-tab:focus-visible { outline:2px solid rgb(var(--ac)); outline-offset:2px; }

.ab-outline { -webkit-text-stroke:1.5px rgba(255,255,255,.5); color:transparent; }
.ab-bleed::before { content:""; position:absolute; left:-10%; top:10%; width:60%; height:80%; background:radial-gradient(circle, rgb(var(--ac)/.28), transparent 65%); filter:blur(30px); pointer-events:none; }
.ab-rule { border-top:1px solid rgba(255,255,255,.1); }
.ab-stat { position:relative; text-align:center; padding-top:26px; }
.ab-stat::before { content:""; position:absolute; top:0; left:20%; right:20%; height:1px; background:linear-gradient(90deg,transparent,rgb(var(--ac)),transparent); }

@keyframes abMarquee { from { transform:translateX(0) } to { transform:translateX(-50%) } }
@keyframes abSpin { to { transform:rotate(360deg) } }
@keyframes abFade { from { opacity:0; transform:translateY(10px) } to { opacity:1; transform:translateY(0) } }
@keyframes abFlick { 0% { opacity:.55 } 40% { opacity:.95 } 55% { opacity:.7 } 100% { opacity:1 } }
@keyframes abDrop { from { transform:translateY(0); opacity:1 } to { transform:translateY(58px); opacity:0 } }
.ab-fade { animation:abFade .3s ease-out; }
@media (max-width:640px) { .ab-ring { width:104px; height:104px; } .ab-ring b { font-size:28px; } .stmt-art { opacity:.32; width:90%; } }
@media (prefers-reduced-motion:reduce) { .ab-marquee,.ab-spin,.ab-fade,.gate-glow,.gate-cue::after,.ab-ring::before { animation:none !important; } }
`

export default function AboutUsPage({ onBack }: AboutUsPageProps = {}) {
  const [activeTab, setActiveTab] = useState<(typeof TABS)[number]["id"]>("mission")
  const root = useRef<HTMLDivElement>(null)
  useScenes(root)

  return (
    <div ref={root} className="ab">
      <style>{CSS}</style>
      <div className="ab-vig" />

      {/* ============ LIQUID GLASS BACK ICON ============ */}
      <GoBack onBack={onBack} className="ab-back">
        <ArrowLeft className="h-5 w-5" strokeWidth={2.2} />
      </GoBack>

      {/* ============ SCENE 1 : DRAIN GATE -> ABOUT US ============ */}
      <section data-scene data-pin className="ab-pin" style={{ height: "340vh" }}>
        <div className="ab-stage">
          <div className="gate-light" />
          <div className="gate">
            <svg viewBox="0 0 400 400" className="h-full w-full" aria-hidden="true">
              <defs>
                <filter id="abRough" x="-10%" y="-10%" width="120%" height="120%">
                  <feTurbulence type="fractalNoise" baseFrequency=".035" numOctaves="3" seed="7" result="n" />
                  <feDisplacementMap in="SourceGraphic" in2="n" scale="12" />
                </filter>
                <radialGradient id="abInner" cx="50%" cy="60%" r="55%">
                  <stop offset="0" style={{ stopColor: "rgb(var(--ac) / .6)" }} />
                  <stop offset=".6" style={{ stopColor: "rgb(var(--ac) / .12)" }} />
                  <stop offset="1" stopColor="#000" />
                </radialGradient>
                <linearGradient id="abBar" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0" stopColor="#dcdcdc" />
                  <stop offset="1" stopColor="#262626" />
                </linearGradient>
                <clipPath id="abClip">
                  <circle cx="200" cy="200" r="158" />
                </clipPath>
              </defs>
              <circle cx="200" cy="200" r="160" fill="url(#abInner)" />
              <g clipPath="url(#abClip)">
                {[-3, -2, -1, 0, 1, 2, 3].map((i) => (
                  <rect key={i} x={200 + i * 40 - 3} y="30" width="6" height="340" fill="url(#abBar)" opacity=".85" />
                ))}
              </g>
              <circle cx="200" cy="200" r="172" fill="none" stroke="#bdbdbd" strokeOpacity=".7" strokeWidth="22" filter="url(#abRough)" />
              <circle cx="200" cy="200" r="160" fill="none" stroke="#fff" strokeOpacity=".3" strokeWidth="2" />
            </svg>
            <div className="gate-glow" />
          </div>
          <div className="gate-cue" />

          <div className="ttl">
            <div className="ttl-meta">
              <i />
              <span>MOVIES VERSE BANGLADESH</span>
              <i />
            </div>
            <h1 className="ab-d ttl-h1">About Us</h1>
            <h2 className="ab-d ttl-tag">সব মুভি আর সিরিজ এক জায়গায়</h2>
            <p className="ttl-p">
              আমরা একটি প্রিমিয়াম বিনোদন প্ল্যাটফর্ম যা বাংলাদেশীদের জন্য সর্বোত্তম মুভি এবং সিরিজ কন্টেন্ট প্রদান করে। আমাদের লক্ষ্য হল আপনার বিনোদনের অভিজ্ঞতাকে পরবর্তী স্তরে নিয়ে যাওয়া।
            </p>
            <p className="ttl-p" style={{ marginTop: 10 }}>
              প্রতিদিন হাজারো ব্যবহারকারী আমাদের প্ল্যাটফর্মে সর্বশেষ এবং সবচেয়ে জনপ্রিয় কন্টেন্ট উপভোগ করেন।
            </p>
          </div>
        </div>
      </section>

      {/* ============ SCENE 2 : MISSION / VISION / VALUES ============ */}
      <section data-scene className="ab-sec ab-bleed grid items-center gap-10 md:grid-cols-2">
        <div className="relative ab-par" style={{ ["--k" as any]: 70 }}>
          <div className="ab-fig" style={art(0)} />
          <div className="ab-ring">
            <div>
              <b className="ab-d">50K+</b>
              <small>ACTIVE USERS</small>
            </div>
          </div>
          <span className="ab-vert">MOVIES &amp; SERIES</span>
        </div>

        <div className="relative">
          <div role="tablist" className="ab-tabs">
            {TABS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={activeTab === id}
                onClick={() => setActiveTab(id)}
                className="ab-tab"
              >
                <Icon className="h-5 w-5" strokeWidth={1.6} />
                <span>{label}</span>
              </button>
            ))}
          </div>

          <div key={activeTab} className="ab-fade mt-7 min-h-[190px] space-y-3 text-[15px] leading-[1.9]">
            {activeTab === "mission" && (
              <>
                <p>বিশ্বমানের বিনোদন কন্টেন্ট প্রদান করে বাংলাদেশী দর্শকদের বৈশ্বিক পর্যায়ে নিয়ে যাওয়া আমাদের প্রধান লক্ষ্য।</p>
                <p style={{ color: "var(--dim)" }}>
                  আমরা বিশ্বাস করি যে প্রতিটি দর্শক সর্বোচ্চ মানের এবং বৈচিত্র্যময় কন্টেন্ট পাওয়ার যোগ্য। এজন্য আমরা ক্রমাগত আমাদের লাইব্রেরি আপডেট করি এবং নতুন এবং উত্তেজনাপূর্ণ শিরোনাম যোগ করি।
                </p>
              </>
            )}
            {activeTab === "vision" && (
              <>
                <p>South Asia এর নেতৃস্থানীয় বিনোদন প্ল্যাটফর্ম হওয়ার স্বপ্ন দেখি আমরা।</p>
                <p style={{ color: "var(--dim)" }}>
                  প্রযুক্তি এবং সৃজনশীলতার সমন্বয়ে আমরা এমন একটি পরিবেশ তৈরি করছি যেখানে প্রতিটি ব্যবহারকারী তাদের পছন্দের কন্টেন্ট সহজেই খুঁজে পেতে পারে এবং উপভোগ করতে পারে।
                </p>
              </>
            )}
            {activeTab === "values" && (
              <ul className="space-y-2">
                {VALUES.map((v) => (
                  <li key={v} className="flex items-start gap-3">
                    <span className="mt-0.5 font-bold" style={{ color: AC }}>
                      ✓
                    </span>
                    <span>{v}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </section>

      {/* ============ SCENE 3 : BIG STATEMENT ============ */}
      <section data-scene data-pin className="ab-pin" style={{ height: "260vh" }}>
        <div className="ab-stage">
          <div className="stmt-art" style={art(1)} />
          <div className="stmt">
            <h2 className="ab-d stmt-h">
              {STATEMENT.map(([w, hot], i) => (
                <span key={w + i} className={`w ${hot ? "hot" : ""}`} style={{ ["--i" as any]: i }}>
                  {w}{" "}
                </span>
              ))}
              <span
                className="inline-flex h-9 w-9 items-center justify-center rounded-full align-middle sm:h-12 sm:w-12"
                style={{ background: AC, boxShadow: "0 0 30px rgb(var(--ac) / .7)" }}
              >
                <Play className="h-4 w-4 fill-black text-black sm:h-5 sm:w-5" />
              </span>
            </h2>
          </div>
        </div>
      </section>

      {/* ============ MARQUEE ============ */}
      <section className="overflow-hidden py-6">
        <div
          className="ab-marquee flex w-max gap-10 whitespace-nowrap"
          style={{ animation: "abMarquee 28s linear infinite" }}
        >
          {[0, 1].map((k) => (
            <div key={k} className="flex items-center gap-10">
              {["Magical Movies", "Web Series", "Anime Verse", "Latest Releases"].map((t) => (
                <span key={t + k} className="flex items-center gap-10">
                  <span className="ab-d ab-outline text-5xl sm:text-7xl">{t}</span>
                  <Sparkles className="h-6 w-6" style={{ color: AC }} />
                </span>
              ))}
            </div>
          ))}
        </div>
      </section>

      {/* ============ POSTER ROW + ROTATING BADGE ============ */}
      <section data-scene className="relative px-4 pb-32 pt-24">
        <div className="mx-auto flex max-w-5xl items-end justify-center gap-4 sm:gap-8">
          {[2, 3, 4].map((i, idx) => (
            <div
              key={i}
              className={`ab-par rounded-sm ${
                idx === 1 ? "h-56 w-40 sm:h-72 sm:w-56" : "mb-[-24px] h-44 w-28 sm:h-64 sm:w-48"
              }`}
              style={{
                ...art(i),
                ["--k" as any]: idx === 1 ? 150 : 70,
                boxShadow: "0 30px 80px rgba(0,0,0,.8), 0 0 60px rgb(var(--ac) / .2)",
              }}
            />
          ))}
        </div>

        <div className="absolute left-1/2 top-[calc(100%-110px)] h-24 w-24 -translate-x-1/2 sm:top-[calc(100%-100px)]">
          <div className="relative h-full w-full rounded-full bg-[#ece6e3]">
            <svg
              viewBox="0 0 100 100"
              className="ab-spin absolute inset-0"
              style={{ animation: "abSpin 14s linear infinite" }}
            >
              <defs>
                <path id="abCircle" d="M50,50 m-36,0 a36,36 0 1,1 72,0 a36,36 0 1,1 -72,0" />
              </defs>
              <text fontSize="9.5" fontWeight="700" letterSpacing="2.2" fill="#111">
                <textPath href="#abCircle">WATCH • ENJOY • REPEAT • WATCH •</textPath>
              </text>
            </svg>
            <div
              className="absolute left-1/2 top-1/2 flex h-9 w-9 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full"
              style={{ background: AC }}
            >
              <Play className="h-4 w-4 fill-black text-black" />
            </div>
          </div>
        </div>
      </section>

      {/* ============ STATS ============ */}
      <section className="mx-auto grid max-w-5xl grid-cols-2 gap-x-8 gap-y-14 px-6 pb-28 pt-10 md:grid-cols-4">
        {[
          { icon: Film, node: <CountUp end={1000} suffix="+" />, label: "কন্টেন্ট" },
          { icon: Users, node: <CountUp end={50} suffix="K+" />, label: "সক্রিয় ব্যবহারকারী" },
          {
            icon: Headphones,
            node: (
              <>
                24<span style={{ color: AC }}>/7</span>
              </>
            ),
            label: "সেবা",
          },
          { icon: Star, node: <CountUp end={4.8} decimals={1} suffix="★" />, label: "রেটিং" },
        ].map(({ icon: Icon, node, label }) => (
          <div key={label} className="ab-stat">
            <Icon className="mx-auto h-8 w-8" style={{ color: AC }} strokeWidth={1.4} />
            <p className="ab-d mt-4 text-5xl sm:text-6xl">{node}</p>
            <p className="mt-2 text-xs font-semibold" style={{ color: "var(--dim)" }}>
              {label}
            </p>
          </div>
        ))}
      </section>

      {/* ============ TEAM + AWARDS ============ */}
      <section className="ab-sec ab-bleed grid gap-14 pb-36 md:grid-cols-2 md:gap-0">
        <div className="relative md:pr-14">
          <h3 className="ab-d flex items-center gap-3 text-4xl sm:text-5xl">
            <Users className="h-7 w-7" style={{ color: AC }} />
            আমাদের টিম
          </h3>
          <p className="mt-5 max-w-md text-[15px] leading-[1.9]" style={{ color: "var(--dim)" }}>
            আমাদের দক্ষ এবং নিবেদিত টিম প্রতিদিন কঠোর পরিশ্রম করে আপনার বিনোদনের অভিজ্ঞতা উন্নত করতে। প্রতিটি সদস্য তাদের ক্ষেত্রে বিশেষজ্ঞ এবং আপনার সন্তুষ্টির জন্য প্রতিশ্রুতিবদ্ধ।
          </p>
        </div>

        <div className="relative md:border-l md:border-white/10 md:pl-14">
          <h3 className="ab-d flex items-center gap-3 text-4xl sm:text-5xl">
            <Award className="h-7 w-7" style={{ color: AC }} />
            স্বীকৃতি
          </h3>
          <div className="mt-5">
            {AWARDS.map((a) => (
              <div key={a} className="ab-rule flex items-center gap-4 py-4 text-[15px]">
                <span style={{ color: AC, textShadow: "0 0 14px rgb(var(--ac) / .8)" }}>★</span>
                <span>{a}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <UniversalFooter />
    </div>
  )
                }
