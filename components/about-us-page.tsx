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

const GREEN = "#3ddc2e"

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
      <span style={{ color: GREEN }}>{suffix}</span>
    </span>
  )
}

function GoBack({
  onBack,
  className,
  style,
  children,
}: {
  onBack?: () => void
  className?: string
  style?: React.CSSProperties
  children: React.ReactNode
}) {
  // onBack thakle (overlay / profile theke) oita, na hole home e niye jabe
  return onBack ? (
    <button type="button" onClick={onBack} className={className} style={style}>
      {children}
    </button>
  ) : (
    <a href="/" className={className} style={style}>
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

export default function AboutUsPage({ onBack }: AboutUsPageProps = {}) {
  const [activeTab, setActiveTab] = useState<(typeof TABS)[number]["id"]>("mission")

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#0b0b0d] pb-24 text-white">
      <style>{`
        @keyframes aboutMarquee { from { transform: translateX(0) } to { transform: translateX(-50%) } }
        @keyframes aboutSpin { to { transform: rotate(360deg) } }
        @keyframes aboutFade { from { opacity: 0; transform: translateY(10px) } to { opacity: 1; transform: translateY(0) } }
        .about-fade { animation: aboutFade .3s ease-out; }
        .about-outline { -webkit-text-stroke: 1.5px rgba(255,255,255,.55); color: transparent; }
        @media (prefers-reduced-motion: reduce) {
          .about-marquee, .about-spin, .about-fade { animation: none !important; }
        }
      `}</style>

      {/* ============ PAGE TITLE BANNER ============ */}
      <section className="relative overflow-hidden border-b border-white/10 px-6 pb-20 pt-24 text-center">
        <div className="pointer-events-none absolute -left-24 top-0 h-72 w-72 rounded-full bg-orange-700/20 blur-[90px]" />
        <div className="pointer-events-none absolute -right-20 -top-10 h-80 w-80 rounded-full bg-emerald-600/20 blur-[100px]" />
        <div className="pointer-events-none absolute left-1/2 top-10 h-64 w-64 -translate-x-1/2 rounded-full bg-slate-500/10 blur-[80px]" />

        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="absolute left-4 top-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-200 backdrop-blur-md transition-colors hover:bg-white/15"
          >
            <ArrowLeft className="h-4 w-4" /> Back
          </button>
        )}

        <h1 className="relative text-4xl font-extrabold sm:text-5xl">About Us</h1>
        <p className="relative mt-4 text-xs font-semibold tracking-widest">
          <GoBack onBack={onBack} className="text-white hover:underline">
            HOME
          </GoBack>
          <span className="mx-3 text-slate-500">›</span>
          <span style={{ color: GREEN }}>ABOUT US</span>
        </p>
      </section>

      {/* ============ INTRO + COLLAGE ============ */}
      <section className="mx-auto grid max-w-6xl items-center gap-12 px-6 py-20 md:grid-cols-2">
        <div>
          <p className="text-[11px] font-semibold tracking-widest" style={{ color: GREEN }}>
            MOVIES VERSE BANGLADESH
          </p>
          <h2 className="mt-3 text-4xl font-extrabold leading-tight sm:text-5xl">
            সব মুভি আর সিরিজ <span style={{ color: GREEN }}>এক জায়গায়</span>
          </h2>
          <p className="mt-5 max-w-md text-sm leading-relaxed text-slate-400">
            আমরা একটি প্রিমিয়াম বিনোদন প্ল্যাটফর্ম যা বাংলাদেশীদের জন্য সর্বোত্তম মুভি এবং সিরিজ কন্টেন্ট প্রদান করে। আমাদের লক্ষ্য হল আপনার বিনোদনের অভিজ্ঞতাকে পরবর্তী স্তরে নিয়ে যাওয়া।
          </p>
          <p className="mt-3 max-w-md text-sm leading-relaxed text-slate-400">
            প্রতিদিন হাজারো ব্যবহারকারী আমাদের প্ল্যাটফর্মে সর্বশেষ এবং সবচেয়ে জনপ্রিয় কন্টেন্ট উপভোগ করেন।
          </p>

          {/* Mission / Vision / Values tabs */}
          <div className="mt-8 max-w-md">
            <div className="flex gap-2">
              {TABS.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setActiveTab(id)}
                  className={`flex flex-1 items-center justify-center gap-2 rounded-md border px-2 py-2.5 text-xs font-semibold transition-colors ${
                    activeTab === id
                      ? "bg-white/10 text-white"
                      : "border-white/10 text-slate-400 hover:text-white"
                  }`}
                  style={activeTab === id ? { borderColor: GREEN } : undefined}
                >
                  <Icon
                    className="h-4 w-4 flex-shrink-0"
                    style={{ color: activeTab === id ? GREEN : undefined }}
                  />
                  <span className="truncate">{label}</span>
                </button>
              ))}
            </div>

            <div key={activeTab} className="about-fade mt-4 space-y-3 text-sm leading-relaxed text-slate-300">
              {activeTab === "mission" && (
                <>
                  <p>
                    বিশ্বমানের বিনোদন কন্টেন্ট প্রদান করে বাংলাদেশী দর্শকদের বৈশ্বিক পর্যায়ে নিয়ে যাওয়া আমাদের প্রধান লক্ষ্য।
                  </p>
                  <p className="text-slate-400">
                    আমরা বিশ্বাস করি যে প্রতিটি দর্শক সর্বোচ্চ মানের এবং বৈচিত্র্যময় কন্টেন্ট পাওয়ার যোগ্য। এজন্য আমরা ক্রমাগত আমাদের লাইব্রেরি আপডেট করি এবং নতুন এবং উত্তেজনাপূর্ণ শিরোনাম যোগ করি।
                  </p>
                </>
              )}
              {activeTab === "vision" && (
                <>
                  <p>South Asia এর নেতৃস্থানীয় বিনোদন প্ল্যাটফর্ম হওয়ার স্বপ্ন দেখি আমরা।</p>
                  <p className="text-slate-400">
                    প্রযুক্তি এবং সৃজনশীলতার সমন্বয়ে আমরা এমন একটি পরিবেশ তৈরি করছি যেখানে প্রতিটি ব্যবহারকারী তাদের পছন্দের কন্টেন্ট সহজেই খুঁজে পেতে পারে এবং উপভোগ করতে পারে।
                  </p>
                </>
              )}
              {activeTab === "values" && (
                <ul className="space-y-2">
                  {VALUES.map((v) => (
                    <li key={v} className="flex items-start gap-3">
                      <span className="mt-0.5 font-bold" style={{ color: GREEN }}>
                        ✓
                      </span>
                      <span>{v}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>

        {/* Collage */}
        <div className="relative mx-auto h-[420px] w-full max-w-md">
          <div className="absolute left-0 top-0 h-[250px] w-[190px] rounded-sm shadow-2xl" style={art(0)} />
          <div
            className="absolute left-[130px] top-[170px] h-[220px] w-[200px] rounded-sm shadow-2xl ring-4 ring-[#0b0b0d]"
            style={art(1)}
          />
          <span
            className="absolute right-0 top-[40px] text-[10px] font-semibold tracking-widest"
            style={{ color: GREEN }}
          >
            ACTIVE USERS
          </span>
          <p
            className="absolute right-0 top-[60px] text-6xl font-extrabold sm:text-7xl"
            style={{ textShadow: "0 0 30px rgba(255,255,255,.15)" }}
          >
            50K+
          </p>
          <span
            className="absolute right-[-8px] top-[260px] text-[10px] font-semibold tracking-widest"
            style={{ color: GREEN, writingMode: "vertical-rl" }}
          >
            MOVIES & SERIES
          </span>
        </div>
      </section>

      {/* ============ BIG STATEMENT ============ */}
      <section className="relative px-6 py-16 text-center">
        <h2 className="mx-auto max-w-3xl text-3xl font-extrabold leading-snug sm:text-5xl">
          Movies Verse হলো <span style={{ color: GREEN }}>বাংলাদেশীদের</span> জন্য{" "}
          <span style={{ color: GREEN }}>মুভি ও সিরিজের</span> ঠিকানা{" "}
          <span
            className="inline-flex h-8 w-8 items-center justify-center rounded-full align-middle"
            style={{ background: GREEN }}
          >
            <Play className="h-4 w-4 fill-black text-black" />
          </span>
        </h2>
      </section>

      {/* ============ MARQUEE ============ */}
      <section className="overflow-hidden py-6">
        <div
          className="about-marquee flex w-max gap-10 whitespace-nowrap"
          style={{ animation: "aboutMarquee 28s linear infinite" }}
        >
          {[0, 1].map((k) => (
            <div key={k} className="flex items-center gap-10">
              {["Magical Movies", "Web Series", "Anime Verse", "Latest Releases"].map((t) => (
                <span key={t + k} className="flex items-center gap-10">
                  <span className="about-outline text-5xl font-extrabold sm:text-6xl">{t}</span>
                  <Sparkles className="h-6 w-6" style={{ color: GREEN }} />
                </span>
              ))}
            </div>
          ))}
        </div>
      </section>

      {/* ============ POSTER ROW + ROTATING BADGE ============ */}
      <section className="relative px-4 pb-28 pt-10">
        <div className="mx-auto flex max-w-5xl items-end justify-center gap-4 sm:gap-8">
          {[2, 3, 4].map((i, idx) => (
            <div
              key={i}
              className={`rounded-sm shadow-2xl ${
                idx === 1 ? "h-56 w-40 sm:h-72 sm:w-56" : "mb-[-24px] h-44 w-28 sm:h-64 sm:w-48"
              }`}
              style={art(i)}
            />
          ))}
        </div>

        <div className="absolute left-1/2 top-[calc(100%-110px)] h-24 w-24 -translate-x-1/2 sm:top-[calc(100%-100px)]">
          <div className="relative h-full w-full rounded-full bg-white">
            <svg
              viewBox="0 0 100 100"
              className="about-spin absolute inset-0"
              style={{ animation: "aboutSpin 14s linear infinite" }}
            >
              <defs>
                <path id="aboutCircle" d="M50,50 m-36,0 a36,36 0 1,1 72,0 a36,36 0 1,1 -72,0" />
              </defs>
              <text fontSize="9.5" fontWeight="700" letterSpacing="2.2" fill="#111">
                <textPath href="#aboutCircle">WATCH • ENJOY • REPEAT • WATCH •</textPath>
              </text>
            </svg>
            <div
              className="absolute left-1/2 top-1/2 flex h-9 w-9 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full"
              style={{ background: GREEN }}
            >
              <Play className="h-4 w-4 fill-black text-black" />
            </div>
          </div>
        </div>
      </section>

      {/* ============ STATS ============ */}
      <section className="mx-auto grid max-w-5xl grid-cols-2 gap-10 px-6 pb-24 pt-8 md:grid-cols-4">
        {[
          { icon: Film, node: <CountUp end={1000} suffix="+" />, label: "কন্টেন্ট" },
          { icon: Users, node: <CountUp end={50} suffix="K+" />, label: "সক্রিয় ব্যবহারকারী" },
          {
            icon: Headphones,
            node: (
              <>
                24<span style={{ color: GREEN }}>/7</span>
              </>
            ),
            label: "সেবা",
          },
          { icon: Star, node: <CountUp end={4.8} decimals={1} suffix="★" />, label: "রেটিং" },
        ].map(({ icon: Icon, node, label }) => (
          <div key={label} className="text-center">
            <Icon className="mx-auto h-9 w-9" style={{ color: GREEN }} strokeWidth={1.5} />
            <p className="mt-4 text-4xl font-extrabold">{node}</p>
            <p className="mt-2 text-xs font-semibold text-slate-300">{label}</p>
          </div>
        ))}
      </section>

      {/* ============ TEAM + AWARDS ============ */}
      <section className="mx-auto grid max-w-5xl gap-6 px-6 pb-16 md:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <h3 className="mb-3 flex items-center gap-2 text-lg font-bold">
            <Users className="h-5 w-5" style={{ color: GREEN }} />
            আমাদের টিম
          </h3>
          <p className="text-sm leading-relaxed text-slate-400">
            আমাদের দক্ষ এবং নিবেদিত টিম প্রতিদিন কঠোর পরিশ্রম করে আপনার বিনোদনের অভিজ্ঞতা উন্নত করতে। প্রতিটি সদস্য তাদের ক্ষেত্রে বিশেষজ্ঞ এবং আপনার সন্তুষ্টির জন্য প্রতিশ্রুতিবদ্ধ।
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <h3 className="mb-3 flex items-center gap-2 text-lg font-bold">
            <Award className="h-5 w-5 text-yellow-400" />
            স্বীকৃতি
          </h3>
          <div className="space-y-2">
            {AWARDS.map((a) => (
              <div
                key={a}
                className="flex items-center gap-3 rounded-lg border border-white/5 bg-white/5 p-3 text-sm text-slate-300"
              >
                <span className="text-yellow-400">★</span>
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
