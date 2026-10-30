"use client"

import { useEffect, useRef, useState } from "react"
import {
  ArrowLeft,
  Play,
  Film,
  Clapperboard,
  BookOpen,
  Store,
  Crown,
  Send,
  Youtube,
  Star,
  Heart,
  Search,
  Users,
  ChevronDown,
  Check,
  Target,
  Eye,
  ShieldCheck,
  Sparkles,
  Zap,
} from "lucide-react"
import { movies } from "@/lib/movie-data"
import UniversalFooter from "./universal-footer"

interface AboutUsPageProps {
  onBack?: () => void
}

/* ------------------------------------------------------------------ */
/*  EDIT HERE: numbers shown on the page                               */
/* ------------------------------------------------------------------ */
const GREEN = "#3ddc2e"
const STATS = {
  titles: 3557, // Movies & Series uploaded
  anime: 206, // Anime & Series uploaded
}

/* Real posters if available, gradient art as fallback */
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

/* ------------------------------------------------------------------ */
/*  Small helpers                                                      */
/* ------------------------------------------------------------------ */
function CountUp({ end, suffix = "" }: { end: number; suffix?: string }) {
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
          setVal(Math.round(end * (1 - Math.pow(1 - p, 3))))
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
      {val.toLocaleString("en-US")}
      <span style={{ color: GREEN }}>{suffix}</span>
    </span>
  )
}

/* Section heading: one clear job, no decoration */
function Heading({ title, sub }: { title: string; sub?: string }) {
  return (
    <div className="mx-auto mb-10 max-w-2xl text-center">
      <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">{title}</h2>
      {sub && <p className="mt-3 text-sm leading-relaxed text-slate-400 sm:text-base">{sub}</p>}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Content                                                            */
/* ------------------------------------------------------------------ */
const FEATURES = [
  {
    icon: Film,
    title: "Movies & Series",
    text: "A huge, constantly growing library of Hollywood, Bollywood, South Indian, Korean and Bangla titles with ratings, genres, cast and language tags.",
  },
  {
    icon: Clapperboard,
    title: "Anime Verse",
    text: "A dedicated anime section with its own trending list, search and series pages, from long-running classics to the newest seasons.",
  },
  {
    icon: BookOpen,
    title: "MeBook",
    text: "Our built-in community feed. Share movie screenshots, post reviews, tag movies, watch shorts and chat with other movie lovers.",
  },
  {
    icon: Store,
    title: "Modex",
    text: "A premium apps store inside MoviesVerseBD. Discover trending apps, new releases and detailed app pages in one clean place.",
  },
  {
    icon: Crown,
    title: "Premium Membership",
    text: "Upgrade for 1080p to 4K quality at a price made for everyone. Your member card lives right in your profile.",
  },
  {
    icon: Search,
    title: "Smart Search",
    text: "Find any movie or anime in seconds with instant search built into every main page.",
  },
]

const STEPS = [
  { title: "Browse", text: "Explore trending titles on Home, Anime or search for something specific." },
  { title: "Open the title page", text: "See the poster, year, genre, rating, views, story and cast before you decide." },
  { title: "Watch the trailer or download", text: "Tap Trailer for YouTube or Download on Telegram to get the full movie." },
  { title: "Upgrade when you want more", text: "Switch to Premium to unlock 1080p and 4K quality." },
]

const TITLE_PAGE = [
  { icon: Send, text: "Download on Telegram" },
  { icon: Youtube, text: "Official trailer on YouTube" },
  { icon: Star, text: "Ratings and view counts" },
  { icon: Users, text: "Full cast list" },
  { icon: Heart, text: "Like, comment and share" },
  { icon: Film, text: "Language, year and genre tags" },
]

const PLANS = [
  { name: "Free", price: "Free", note: "Basic access", quality: "480p – 720p", featured: false },
  { name: "1 Month", price: "৳20", note: "30 days", quality: "1080p – 4K", featured: true },
  { name: "2 Months", price: "৳35", note: "60 days · best value", quality: "1080p – 4K", featured: false },
]

const TABS = [
  {
    id: "mission",
    label: "Mission",
    icon: Target,
    title: "Make great entertainment easy to reach.",
    text: "Our mission is to bring world-class movies, series and anime to Bangladeshi viewers in a fast, simple and affordable way. We keep adding new titles every day so there is always something worth watching.",
  },
  {
    id: "vision",
    label: "Vision",
    icon: Eye,
    title: "The home of entertainment in South Asia.",
    text: "We are building a platform where technology and creativity meet, so every viewer can find the story they love, share it with friends and come back for more.",
  },
  {
    id: "values",
    label: "Values",
    icon: ShieldCheck,
    title: "What we stand for.",
    list: [
      "Quality: we never compromise on what we publish.",
      "Simplicity: every feature should be easy to understand.",
      "Affordability: premium should never feel expensive.",
      "Community: viewers come first, always.",
      "Improvement: we ship updates constantly.",
    ],
  },
] as const

const FAQ = [
  {
    q: "What is MoviesVerseBD?",
    a: "MoviesVerseBD is an entertainment platform where you can discover movies, web series and anime, watch trailers, download titles through Telegram, and join a movie community called MeBook.",
  },
  {
    q: "Is it free to use?",
    a: "Yes. The Free plan gives you basic access with 480p to 720p quality. Premium plans unlock 1080p to 4K.",
  },
  {
    q: "How much is Premium?",
    a: "Premium starts at ৳20 for 1 month (30 days). The 2 month plan is ৳35, which is the best value.",
  },
  {
    q: "How do I download a movie?",
    a: "Open any title page and tap Download on Telegram. You will be taken to our Telegram channel where the file is ready.",
  },
  {
    q: "What is MeBook?",
    a: "MeBook is our community space. You can post screenshots and reviews, tag movies, watch shorts and connect with other members. It is currently in beta.",
  },
  {
    q: "Where can I see my membership?",
    a: "Open the Profile tab. Your member card shows your plan, your Member ID and your valid time.",
  },
]

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */
export default function AboutUsPage({ onBack }: AboutUsPageProps = {}) {
  const [tab, setTab] = useState<(typeof TABS)[number]["id"]>("mission")
  const [open, setOpen] = useState<number | null>(0)
  const active = TABS.find((t) => t.id === tab)!

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#070809] pb-28 text-white">
      <style>{`
        @keyframes mvMarquee { from { transform: translateX(0) } to { transform: translateX(-50%) } }
        @keyframes mvSpin { to { transform: rotate(360deg) } }
        @keyframes mvFloat { 0%,100% { transform: rotate(-3deg) translateY(0) } 50% { transform: rotate(-3deg) translateY(-8px) } }
        @keyframes mvIn { from { opacity: 0; transform: translateY(8px) } to { opacity: 1; transform: translateY(0) } }
        @keyframes mvGlow { 0%,100% { opacity: .55 } 50% { opacity: 1 } }
        .mv-in { animation: mvIn .3s ease-out; }
        .mv-outline { -webkit-text-stroke: 1.5px rgba(255,255,255,.5); color: transparent; }
        .mv-serif { font-family: Georgia, "Times New Roman", serif; font-style: italic; }
        .mv-perf {
          background-image: radial-gradient(circle, #070809 3px, transparent 3.5px);
          background-size: 16px 16px; background-repeat: repeat-y;
        }
        .mv-film {
          background-image: radial-gradient(circle, rgba(255,255,255,.14) 3px, transparent 3.5px);
          background-size: 22px 14px; background-repeat: repeat-x;
        }
        .mv-card { transition: transform .25s ease, border-color .25s ease; }
        .mv-card:hover { transform: translateY(-4px); border-color: rgba(61,220,46,.45); }
        .mv-focus:focus-visible { outline: 2px solid ${GREEN}; outline-offset: 3px; }
        @media (prefers-reduced-motion: reduce) {
          .mv-marquee, .mv-spin, .mv-float, .mv-in, .mv-glow { animation: none !important; }
          .mv-card { transition: none; }
        }
      `}</style>

      {/* ======================= HERO: THE TICKET ======================= */}
      <section className="relative overflow-hidden px-5 pb-16 pt-6 sm:pt-10">
        <div
          className="mv-glow pointer-events-none absolute left-1/2 top-24 h-80 w-80 -translate-x-1/2 rounded-full blur-[110px]"
          style={{ background: "rgba(61,220,46,.22)", animation: "mvGlow 6s ease-in-out infinite" }}
        />
        <div className="pointer-events-none absolute -right-24 top-0 h-72 w-72 rounded-full bg-orange-600/10 blur-[100px]" />

        <div className="relative mx-auto max-w-5xl">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="mv-focus mb-8 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-200 backdrop-blur-md transition-colors hover:bg-white/15"
            >
              <ArrowLeft className="h-4 w-4" /> Back
            </button>
          )}

          <div className="grid items-center gap-12 md:grid-cols-[1.1fr_1fr]">
            <div>
              <p className="text-sm font-medium" style={{ color: GREEN }}>
                About MoviesVerseBD
              </p>
              <h1 className="mt-3 text-5xl font-black leading-[1.02] tracking-tight sm:text-6xl">
                Every story.
                <br />
                One <span className="mv-serif font-medium" style={{ color: GREEN }}>ticket</span>.
              </h1>
              <p className="mt-6 max-w-md text-base leading-relaxed text-slate-300">
                MoviesVerseBD is the entertainment home built for Bangladesh. Movies, web series, anime, a movie
                community and a premium apps store, all in one app that feels fast and looks beautiful.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <a
                  href="#plans"
                  className="mv-focus inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-bold text-black transition-transform hover:scale-[1.03]"
                  style={{ background: GREEN }}
                >
                  <Crown className="h-4 w-4" /> See Premium plans
                </a>
                <a
                  href="#features"
                  className="mv-focus inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-6 py-3 text-sm font-semibold backdrop-blur-md transition-colors hover:bg-white/10"
                >
                  Explore features
                </a>
              </div>
            </div>

            {/* The ticket: the one memorable element */}
            <div className="relative mx-auto w-full max-w-sm">
              <div
                className="mv-float absolute -left-6 -top-6 h-40 w-28 rounded-md shadow-2xl ring-1 ring-white/10"
                style={{ ...art(0), animation: "mvFloat 7s ease-in-out infinite" }}
              />
              <div
                className="absolute -bottom-6 -right-4 h-36 w-24 rotate-6 rounded-md shadow-2xl ring-1 ring-white/10"
                style={art(1)}
              />
              <div
                className="relative overflow-hidden rounded-3xl border border-white/10 p-6 shadow-[0_30px_80px_-20px_rgba(61,220,46,.35)]"
                style={{ background: "linear-gradient(150deg,#0f2a0f 0%,#0a140a 55%,#070809 100%)" }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl text-xl font-black text-black" style={{ background: GREEN }}>
                    M
                  </div>
                  <p className="mv-serif text-3xl text-amber-100/90">Admit One</p>
                </div>

                <p className="mt-8 text-xs tracking-widest text-slate-400">MEMBER</p>
                <p className="mt-1 text-2xl font-extrabold">MoviesVerseBD</p>

                <div className="mv-perf my-6 h-4 w-full opacity-90" style={{ backgroundSize: "16px 16px", backgroundRepeat: "repeat-x", height: 16 }} />

                <div className="grid grid-cols-3 gap-3 text-center">
                  <div>
                    <p className="text-2xl font-extrabold">{STATS.titles.toLocaleString("en-US")}</p>
                    <p className="mt-1 text-[11px] text-slate-400">Movies & Series</p>
                  </div>
                  <div>
                    <p className="text-2xl font-extrabold">{STATS.anime}</p>
                    <p className="mt-1 text-[11px] text-slate-400">Anime</p>
                  </div>
                  <div>
                    <p className="text-2xl font-extrabold">4K</p>
                    <p className="mt-1 text-[11px] text-slate-400">Top quality</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ======================= FILM STRIP MARQUEE ======================= */}
      <section className="relative border-y border-white/10 bg-black/40 py-5">
        <div className="mv-film pointer-events-none absolute inset-x-0 top-1 h-3" />
        <div className="mv-film pointer-events-none absolute inset-x-0 bottom-1 h-3" />
        <div className="overflow-hidden py-3">
          <div
            className="mv-marquee flex w-max gap-10 whitespace-nowrap"
            style={{ animation: "mvMarquee 30s linear infinite" }}
          >
            {[0, 1].map((k) => (
              <div key={k} className="flex items-center gap-10">
                {["Magical Movies", "Web Series", "Anime Verse", "MeBook", "Modex", "Latest Releases"].map((t) => (
                  <span key={t + k} className="flex items-center gap-10">
                    <span className="mv-outline text-4xl font-black sm:text-5xl">{t}</span>
                    <Sparkles className="h-5 w-5" style={{ color: GREEN }} />
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ======================= WHO WE ARE ======================= */}
      <section className="mx-auto grid max-w-5xl items-center gap-12 px-5 py-20 md:grid-cols-2">
        <div className="relative mx-auto h-[380px] w-full max-w-sm">
          <div className="absolute left-0 top-0 h-[240px] w-[170px] rounded-md shadow-2xl" style={art(2)} />
          <div
            className="absolute left-[110px] top-[130px] h-[230px] w-[190px] rounded-md shadow-2xl ring-4 ring-[#070809]"
            style={art(3)}
          />
          <div className="absolute right-0 top-2 flex h-24 w-24 items-center justify-center">
            <svg viewBox="0 0 100 100" className="mv-spin absolute inset-0" style={{ animation: "mvSpin 14s linear infinite" }}>
              <defs>
                <path id="mvCircle" d="M50,50 m-36,0 a36,36 0 1,1 72,0 a36,36 0 1,1 -72,0" />
              </defs>
              <text fontSize="9.5" fontWeight="700" letterSpacing="2.2" fill="#fff">
                <textPath href="#mvCircle">WATCH • ENJOY • REPEAT • WATCH •</textPath>
              </text>
            </svg>
            <span className="flex h-9 w-9 items-center justify-center rounded-full" style={{ background: GREEN }}>
              <Play className="h-4 w-4 fill-black text-black" />
            </span>
          </div>
        </div>

        <div>
          <h2 className="text-3xl font-extrabold leading-tight sm:text-4xl">Built by movie lovers, for movie lovers.</h2>
          <p className="mt-5 text-sm leading-relaxed text-slate-400 sm:text-base">
            MoviesVerseBD started with a simple idea: finding and enjoying great entertainment in Bangladesh should be
            easy, fast and affordable. Today our library holds thousands of movies, series and anime, and it keeps
            growing every single day.
          </p>
          <p className="mt-4 text-sm leading-relaxed text-slate-400 sm:text-base">
            We design every screen for mobile first, keep the interface clean and dark so posters stand out, and add
            new features based on what our members ask for.
          </p>

          <div className="mt-8 grid grid-cols-2 gap-4">
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <p className="text-3xl font-extrabold">
                <CountUp end={STATS.titles} suffix="+" />
              </p>
              <p className="mt-1 text-xs text-slate-400">Movies & series uploaded</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <p className="text-3xl font-extrabold">
                <CountUp end={STATS.anime} suffix="+" />
              </p>
              <p className="mt-1 text-xs text-slate-400">Anime & series uploaded</p>
            </div>
          </div>
        </div>
      </section>

      {/* ======================= FEATURES ======================= */}
      <section id="features" className="mx-auto max-w-5xl scroll-mt-6 px-5 pb-20">
        <Heading
          title="Everything inside MoviesVerseBD"
          sub="Six parts that work together, so you never need another app to enjoy a movie night."
        />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map(({ icon: Icon, title, text }) => (
            <div key={title} className="mv-card rounded-2xl border border-white/10 bg-white/[0.03] p-6">
              <span
                className="flex h-11 w-11 items-center justify-center rounded-xl"
                style={{ background: "rgba(61,220,46,.12)", color: GREEN }}
              >
                <Icon className="h-5 w-5" />
              </span>
              <h3 className="mt-5 text-lg font-bold">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-400">{text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ======================= HOW IT WORKS (a real sequence) ======================= */}
      <section className="mx-auto max-w-5xl px-5 pb-20">
        <Heading title="How it works" sub="From opening the app to watching in four simple steps." />
        <ol className="relative mx-auto max-w-2xl space-y-6 border-l border-white/10 pl-8">
          {STEPS.map((s, i) => (
            <li key={s.title} className="relative">
              <span
                className="absolute -left-[46px] flex h-9 w-9 items-center justify-center rounded-full text-sm font-black text-black"
                style={{ background: GREEN }}
              >
                {i + 1}
              </span>
              <h3 className="text-lg font-bold">{s.title}</h3>
              <p className="mt-1 text-sm leading-relaxed text-slate-400">{s.text}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* ======================= TITLE PAGE ======================= */}
      <section className="mx-auto max-w-5xl px-5 pb-20">
        <div className="overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-white/[0.05] to-transparent p-6 sm:p-10">
          <div className="grid items-center gap-8 md:grid-cols-2">
            <div>
              <h2 className="text-3xl font-extrabold leading-tight sm:text-4xl">A title page with everything on it.</h2>
              <p className="mt-4 text-sm leading-relaxed text-slate-400 sm:text-base">
                Every movie and series page gives you the full picture before you press play.
              </p>
            </div>
            <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {TITLE_PAGE.map(({ icon: Icon, text }) => (
                <li key={text} className="flex items-center gap-3 rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm">
                  <Icon className="h-4 w-4 flex-shrink-0" style={{ color: GREEN }} />
                  {text}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ======================= PLANS ======================= */}
      <section id="plans" className="mx-auto max-w-5xl scroll-mt-6 px-5 pb-20">
        <Heading
          title="Simple plans, small prices"
          sub="Start free. Upgrade for sharper picture quality whenever you are ready."
        />
        <div className="grid gap-4 md:grid-cols-3">
          {PLANS.map((p) => (
            <div
              key={p.name}
              className={`relative rounded-3xl border p-6 ${
                p.featured ? "border-transparent" : "border-white/10 bg-white/[0.03]"
              }`}
              style={
                p.featured
                  ? { background: "linear-gradient(160deg,rgba(61,220,46,.18),rgba(7,8,9,.9))", boxShadow: `0 0 0 1.5px ${GREEN}` }
                  : undefined
              }
            >
              {p.featured && (
                <span
                  className="absolute -top-3 left-6 rounded-full px-3 py-1 text-xs font-bold text-black"
                  style={{ background: GREEN }}
                >
                  Most popular
                </span>
              )}
              <p className="text-sm text-slate-400">{p.name}</p>
              <p className="mt-2 text-5xl font-black">{p.price}</p>
              <p className="mt-1 text-xs text-slate-400">{p.note}</p>
              <div className="my-5 h-px bg-white/10" />
              <ul className="space-y-3 text-sm text-slate-200">
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4" style={{ color: GREEN }} /> {p.quality} quality
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4" style={{ color: GREEN }} /> Movies, series and anime
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4" style={{ color: GREEN }} /> MeBook community access
                </li>
              </ul>
            </div>
          ))}
        </div>
        <p className="mt-5 text-center text-xs text-slate-500">
          Choose a plan from the Subscriptions tab. Prices are in Bangladeshi Taka (৳).
        </p>
      </section>

      {/* ======================= MISSION / VISION / VALUES ======================= */}
      <section className="mx-auto max-w-3xl px-5 pb-20">
        <Heading title="Why we do this" />
        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5 sm:p-8">
          <div className="flex gap-2" role="tablist">
            {TABS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={tab === id}
                onClick={() => setTab(id)}
                className={`mv-focus flex flex-1 items-center justify-center gap-2 rounded-xl border px-2 py-3 text-sm font-semibold transition-colors ${
                  tab === id ? "bg-white/10 text-white" : "border-white/10 text-slate-400 hover:text-white"
                }`}
                style={tab === id ? { borderColor: GREEN } : undefined}
              >
                <Icon className="h-4 w-4" style={{ color: tab === id ? GREEN : undefined }} />
                {label}
              </button>
            ))}
          </div>

          <div key={tab} className="mv-in mt-6">
            <h3 className="text-2xl font-extrabold leading-snug">{active.title}</h3>
            {"text" in active && (
              <p className="mt-3 text-sm leading-relaxed text-slate-400 sm:text-base">{active.text}</p>
            )}
            {"list" in active && (
              <ul className="mt-4 space-y-3">
                {active.list.map((v) => (
                  <li key={v} className="flex items-start gap-3 text-sm text-slate-300 sm:text-base">
                    <Check className="mt-0.5 h-4 w-4 flex-shrink-0" style={{ color: GREEN }} />
                    {v}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </section>

      {/* ======================= FAQ ======================= */}
      <section className="mx-auto max-w-3xl px-5 pb-20">
        <Heading title="Questions people ask" />
        <div className="space-y-3">
          {FAQ.map((f, i) => {
            const isOpen = open === i
            return (
              <div key={f.q} className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]">
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? null : i)}
                  aria-expanded={isOpen}
                  className="mv-focus flex w-full items-center justify-between gap-4 px-5 py-4 text-left text-sm font-semibold sm:text-base"
                >
                  {f.q}
                  <ChevronDown
                    className="h-5 w-5 flex-shrink-0 transition-transform duration-300"
                    style={{ color: GREEN, transform: isOpen ? "rotate(180deg)" : "none" }}
                  />
                </button>
                <div
                  className="grid transition-all duration-300"
                  style={{ gridTemplateRows: isOpen ? "1fr" : "0fr" }}
                >
                  <div className="overflow-hidden">
                    <p className="px-5 pb-5 text-sm leading-relaxed text-slate-400">{f.a}</p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* ======================= CLOSING ======================= */}
      <section className="mx-auto max-w-4xl px-5 pb-16">
        <div
          className="relative overflow-hidden rounded-3xl p-8 text-center sm:p-14"
          style={{ background: "linear-gradient(135deg,#123d12,#0a140a 60%,#070809)", boxShadow: "inset 0 0 0 1px rgba(61,220,46,.35)" }}
        >
          <div className="mv-film pointer-events-none absolute inset-x-0 top-2 h-3" />
          <div className="mv-film pointer-events-none absolute inset-x-0 bottom-2 h-3" />
          <h2 className="mx-auto max-w-xl text-3xl font-black leading-tight sm:text-5xl">
            Your seat is <span className="mv-serif font-medium" style={{ color: GREEN }}>ready</span>.
          </h2>
          <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-slate-300 sm:text-base">
            Thank you for being part of MoviesVerseBD. Pick a movie, grab some popcorn and enjoy the show.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            {onBack ? (
              <button
                type="button"
                onClick={onBack}
                className="mv-focus inline-flex items-center gap-2 rounded-full px-7 py-3 text-sm font-bold text-black transition-transform hover:scale-[1.03]"
                style={{ background: GREEN }}
              >
                <Zap className="h-4 w-4" /> Start watching
              </button>
            ) : (
              <a
                href="/"
                className="mv-focus inline-flex items-center gap-2 rounded-full px-7 py-3 text-sm font-bold text-black transition-transform hover:scale-[1.03]"
                style={{ background: GREEN }}
              >
                <Zap className="h-4 w-4" /> Start watching
              </a>
            )}
          </div>
        </div>
      </section>

      <UniversalFooter />
    </div>
  )
}
