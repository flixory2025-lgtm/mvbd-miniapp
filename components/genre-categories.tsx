"use client"

import { createPortal } from "react-dom"
import {
  useEffect,
  useLayoutEffect,
  useState,
  useMemo,
  useRef,
  type CSSProperties,
} from "react"
import { ChevronDown } from "lucide-react"
import { movies } from "@/lib/movie-data"

interface GenreCategoriesProps {
  genres: string[]
  selectedGenre: string | null
  onGenreSelect: (genre: string | null) => void
  showAdultContent?: boolean
  selectedYear?: string
  selectedRating?: string
  selectedLanguage?: string
  selectedType?: string
  onFilterChange?: (filters: {
    year?: string
    rating?: string
    language?: string
    type?: string
  }) => void
  /* ✅ Selector (Year / Language / Genre) er data source.
     Home page e dewar dorkar nai (default = movies), Anime page e animes pass korbe */
  items?: any[]
}

type AppModal = "tutorial" | "download" | null
type SelectorType =
  | "year"
  | "rating"
  | "language"
  | "type"
  | "genre"
  | "platform"
type FilterType = SelectorType | null

const tutorialVideoId = "deuVIRqrscs"
const apkDownloadUrl = "https://github.com/flixory2025-lgtm/mvbd-miniapp/releases/download/2.0.5v/MVBD.MINI.APP.apk"

const useIsoLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect

/* =========================================================
   CATEGORY THEMES  (background image + title animation)
   ---------------------------------------------------------
   u = background image, w = title text, s = sub title,
   f = title font CSS, a = accent colour, e = enter animation,
   i = idle animation, p = particles, x = lightning,
   lb = cinema bars, sc = scan line
========================================================= */

interface Particles {
  n: number
  col?: string
  ch?: string[]
  s: [number, number]
  vx: [number, number]
  vy: [number, number]
  tw?: number
  g?: number
  sw?: number
  al?: number
  len?: number
}

interface Theme {
  k: string
  u?: string
  w: string
  s: string
  f: string
  a: string
  e: string
  i: string
  p: Particles
  x?: boolean
  fc?: string
  lb?: boolean
  sc?: boolean
}

const THEMES: Record<string, Theme> = {
  all: {
    k: "all",
    u: "https://i.postimg.cc/Y95sTCrL/619306-bg-full-netflix-grid-v2-desktop.jpg",
    w: "everything",
    s: "Every story. One place.",
    f: "font:italic 900 clamp(34px,10.5vw,84px) 'Playfair Display',Georgia,serif;color:#fff;text-shadow:0 0 40px #a78bfa",
    a: "#a78bfa",
    e: "blur",
    i: "hue",
    p: { n: 30, col: "#fff", s: [1, 3], vx: [-0.2, 0.2], vy: [-0.4, -0.1], tw: 1, g: 8 },
  },
  action: {
    k: "action",
    u: "https://i.postimg.cc/D03xBp6N/AAAABcs-As-Enrg-NK9ZKkqf-At4IA0Dy-O4Mw4Jjeuu-Q4z-Hnm-Zgf-LWKk-Zd-ZHTGw-PHvao-O5x-Ebo-YXICk-XRg-ECNBt.jpg",
    w: "ACTION",
    s: "No mercy. No brakes.",
    f: "font:clamp(52px,17vw,130px) 'Black Ops One',Impact,sans-serif;color:#fff1d6;text-shadow:0 0 18px #ff6a00,0 6px 0 #b13300;transform:skewX(-8deg)",
    a: "#ff6a00",
    e: "slam",
    i: "none",
    p: { n: 45, col: "#ff8a1f", s: [1, 3.5], vx: [-0.5, 0.5], vy: [-2.4, -0.7], g: 10 },
  },
  comedy: {
    k: "comedy",
    u: "https://i.postimg.cc/P5VKB5K1/laughing-couple-in-velvet-tracksuits-throwing-cereal-and-milk-in-a-colorful-retro-kitchen-joyful-ene.jpg",
    w: "COMEDY!",
    s: "Laugh till it hurts",
    f: "font:clamp(52px,17vw,130px) Bangers,Impact,sans-serif;color:#fff;-webkit-text-stroke:3px #1b1b1b;text-shadow:6px 6px 0 #ff3b5c;letter-spacing:.04em",
    a: "#ffc107",
    e: "bounce",
    i: "flo",
    p: { n: 22, ch: ["😂", "🎉", "🤣", "✨"], s: [18, 32], vx: [-0.4, 0.4], vy: [0.8, 2.2], sw: 1 },
  },
  drama: {
    k: "drama",
    u: "https://i.postimg.cc/x8P3gfcH/new-k-dramas-on-netflix-in-november-2026.jpg",
    w: "Drama",
    s: "Curtain up. Hearts open.",
    f: "font:italic 900 clamp(56px,19vw,140px) 'Playfair Display',Georgia,serif;color:#ffe29a;text-shadow:0 0 28px #e8b04b,0 4px 0 #6b4300",
    a: "#e8b04b",
    e: "rise",
    i: "pul",
    p: { n: 40, col: "#ffd98a", s: [0.8, 2.2], vx: [-0.15, 0.15], vy: [-0.35, -0.1], tw: 1, g: 6 },
  },
  horror: {
    k: "horror",
    u: "https://i.postimg.cc/3R5jT4GJ/netflix-hill-house.png",
    w: "Horror",
    s: "Do not look behind you",
    f: "font:clamp(56px,18vw,140px) Creepster,Impact,sans-serif;color:#c40000;text-shadow:0 0 25px #f00,0 0 60px #600",
    a: "#e11d1d",
    x: true,
    fc: "#ff2a2a",
    lb: true,
    e: "flick",
    i: "flk",
    p: { n: 50, col: "#9a9a9a", s: [0.8, 2.5], vx: [-0.3, 0.3], vy: [0.3, 1], al: 0.55 },
  },
  zombie: {
    k: "zombie",
    u: "https://i.postimg.cc/qMb87ZKm/oobvkdpinjyf1.jpg",
    w: "ZOMBIE",
    s: "They are already here",
    f: "font:clamp(34px,11.5vw,92px) Nosifer,Impact,sans-serif;color:#7dff3a;text-shadow:0 0 24px #4cff00",
    a: "#6dff2a",
    e: "drip",
    i: "shk",
    p: { n: 45, col: "#8aff4a", s: [1, 3], vx: [-0.3, 0.3], vy: [-0.8, -0.2], g: 12, tw: 1 },
  },
  romance: {
    k: "romance",
    u: "https://i.postimg.cc/k4mSZrr1/ai-generated-a-couple-embracing-under-a-neon-sign-their-love-illuminated-by-the-warm-glow-of-the-lig.jpg",
    w: "Romance",
    s: "Love, written in light",
    f: "font:clamp(60px,20vw,150px) 'Great Vibes',cursive;color:#fff;text-shadow:0 0 30px #ff7aa8",
    a: "#ff6f91",
    e: "write",
    i: "flo",
    p: { n: 26, ch: ["❤", "💗", "💖", "🌸"], s: [14, 30], vx: [-0.3, 0.3], vy: [-1.4, -0.4], sw: 1 },
  },
  scifi: {
    k: "scifi",
    u: "https://i.postimg.cc/Hshym8DJ/Spectral-Netflix.jpg",
    w: "SCI-FI",
    s: "Beyond the known grid",
    f: "font:900 clamp(40px,14vw,110px) Orbitron,sans-serif;color:#d8fbff;text-shadow:0 0 12px #22e6ff,0 0 40px #7c4dff;letter-spacing:.06em",
    a: "#22e6ff",
    sc: true,
    e: "glitch",
    i: "pul",
    p: { n: 45, ch: ["0", "1", "0", "1", "7"], col: "#22e6ff", s: [11, 17], vx: [0, 0], vy: [1, 3], al: 0.6 },
  },
  thriller: {
    k: "thriller",
    u: "https://i.postimg.cc/Xqh7RFZh/264688-war-of-the-worlds-adventure-thriller-sci-fi.jpg",
    w: "Thriller",
    s: "Trust no one",
    f: "font:clamp(44px,15vw,115px) 'Special Elite',monospace;color:#e8eef7;text-shadow:0 0 18px #7aa7d9",
    a: "#7aa7d9",
    lb: true,
    e: "type",
    i: "none",
    p: { n: 70, col: "#9bb8d9", len: 5, s: [1, 1], vx: [-3, -2], vy: [9, 14], al: 0.5 },
  },
  kdrama: {
    k: "kdrama",
    u: "https://i.postimg.cc/nhqcWXn7/images.jpg",
    w: "K-Drama",
    s: "드라마 · Seoul nights, soft hearts",
    f: "font:clamp(48px,16vw,120px) Jua,sans-serif;color:#fff;text-shadow:0 4px 0 #e56aa6,0 0 30px #ff8fc7",
    a: "#ff8fc7",
    e: "blur",
    i: "flo",
    p: { n: 30, ch: ["✿", "❀", "🌸"], col: "#ff9ccc", s: [12, 24], vx: [0.3, 0.9], vy: [0.6, 1.4], sw: 1 },
  },
  bangla: {
    k: "bangla",
    u: "https://i.postimg.cc/vZGHpQTp/sddefault.jpg",
    w: "বাংলা",
    s: "Rivers, fields, stories of Bengal",
    f: "font:clamp(70px,24vw,170px) Galada,'Tiro Bangla',serif;color:#ffe08a;text-shadow:0 0 24px #f6c445,0 4px 0 #8a5a00",
    a: "#f6c445",
    e: "write",
    i: "flo",
    p: { n: 34, col: "#ffe27a", s: [1.5, 3.5], vx: [-0.3, 0.3], vy: [-0.4, 0.2], tw: 1, g: 14 },
  },
  marvel: {
    k: "marvel",
    u: "https://i.postimg.cc/brQpBMh1/dkeyw04-bf3937b4-2209-4a39-90c5-720db3bf42b1.jpg",
    w: "MARVEL",
    s: "Heroes assemble",
    f: "font:clamp(54px,18vw,130px) 'Bebas Neue',Impact,sans-serif;color:#fff;background:#ec1d24;padding:0 .14em;letter-spacing:.05em;box-shadow:0 0 0 4px #fff,0 0 60px #ec1d24aa",
    a: "#ec1d24",
    e: "slam",
    i: "none",
    p: { n: 26, ch: ["★", "✦"], col: "#ffe14d", s: [12, 26], vx: [-1, 1], vy: [-1.2, -0.3] },
  },
  natok: {
    k: "natok",
    u: "https://i.postimg.cc/1zfPQ4SR/Screenshot-20261020-233758-Chrome.jpg",
    w: "নাটক",
    s: "Classic TV drama, after dark",
    f: "font:italic clamp(70px,24vw,170px) 'Tiro Bangla',serif;color:#ffd9a0;text-shadow:0 0 22px #ff9a3c",
    a: "#ffb45a",
    lb: true,
    e: "rise",
    i: "pul",
    p: { n: 40, col: "#ffcf94", s: [0.6, 1.8], vx: [-0.15, 0.15], vy: [-0.2, 0.1], tw: 1 },
  },
  dc: {
    k: "dc",
    u: "https://i.postimg.cc/vZmwrDc1/wallpapersden-com-77206-3840x2560.jpg",
    w: "DC",
    s: "Gotham never sleeps",
    f: "font:clamp(70px,26vw,150px) 'Bebas Neue',Impact,sans-serif;color:#fff;width:clamp(150px,46vw,250px);aspect-ratio:1;border-radius:50%;align-items:center;align-content:center;background:radial-gradient(circle at 35% 30%,#4f86ff,#0a3bd6 60%,#031a6b);box-shadow:0 0 0 5px #fff,0 0 70px #2a5bff,inset 0 0 30px #0008",
    a: "#5a8bff",
    e: "slam",
    i: "pul",
    x: true,
    lb: true,
    p: { n: 60, col: "#8fb0ff", len: 5, s: [1, 1], vx: [-2, -1.5], vy: [10, 15], al: 0.45 },
  },
  kukutv: {
    k: "kukutv",
    u: "https://i.postimg.cc/mDCvLH6V/unnamed.webp",
    w: "KUKU TV",
    s: "Binge. Laugh. Repeat.",
    f: "font:clamp(50px,16vw,120px) 'Lilita One',sans-serif;color:#fff;text-shadow:0 6px 0 #c2185b,0 0 30px #ffd54a",
    a: "#ff3d81",
    e: "bounce",
    i: "flo",
    p: { n: 24, ch: ["▶", "●", "✦"], col: "#fff", s: [12, 26], vx: [-0.3, 0.3], vy: [-1.2, -0.4], al: 0.6, sw: 1 },
  },
  netflix: {
    k: "netflix",
    u: "https://i.postimg.cc/vZTC1jNx/netflix-background-gs7hjuwvv2g0e9fj.jpg",
    w: "NETFLIX",
    s: "Series · Films · Originals",
    f: "font:clamp(60px,20vw,150px) 'Bebas Neue',Impact,sans-serif;color:#e50914;text-shadow:0 0 30px #e5091488;letter-spacing:.06em",
    a: "#e50914",
    lb: true,
    e: "blur",
    i: "pul",
    p: { n: 20, col: "#ff4d57", s: [1, 2.5], vx: [-0.2, 0.2], vy: [-0.6, -0.2], tw: 1, g: 10 },
  },
  sports: {
    k: "sports",
    u: "https://i.postimg.cc/XqnznD5y/male-soccer-player-action-sequence-multiple-balls-dark-background-male-soccer-player-action-sequence.jpg",
    w: "SPORTS",
    s: "Game on. Every day.",
    f: "font:clamp(56px,19vw,140px) Anton,Impact,sans-serif;color:#fff;text-shadow:0 6px 0 #0a4a1c,0 0 30px #3dff7a;transform:skewX(-10deg);letter-spacing:.03em",
    a: "#3dff7a",
    e: "slam",
    i: "none",
    p: { n: 22, col: "#fff", len: 2.2, s: [1, 1], vx: [-16, -9], vy: [0, 0], al: 0.4 },
  },
  adult: {
    k: "adult",
    u: "https://i.postimg.cc/fTTrFpZp/76ba643b11f07959540ab89fdbedd43c2d4cb519e83c3d635baf1331e702caf4-SX1080-FMjpg.jpg",
    w: "18+",
    s: "Mature audiences only",
    f: "font:clamp(90px,34vw,240px) 'Tilt Neon',sans-serif;color:#ffd1ea;text-shadow:0 0 10px #ff2e88,0 0 30px #ff2e88,0 0 70px #ff2e88",
    a: "#ff2e88",
    e: "flick",
    i: "flk",
    p: { n: 22, col: "#ff5aa5", s: [3, 8], vx: [-0.2, 0.2], vy: [-0.3, -0.05], tw: 1, g: 20 },
  },
}

/* genre নামের বানান আলাদা হলে এখান থেকে মিলিয়ে নেওয়া হয় */
const ALIASES: Record<string, string> = {
  sciencefiction: "scifi",
  koreandrama: "kdrama",
  kdramas: "kdrama",
  bengali: "bangla",
  horor: "horror",
  kuku: "kukutv",
  adults: "adult",
  "18": "adult",
  sport: "sports",
  dccomics: "dc",
  marvelcomics: "marvel",
  recentlyuploaded: "all",
}

const normKey = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "")

/* যে genre এর theme নেই তার জন্য default */
const makeDefault = (name: string): Theme => ({
  k: "d-" + normKey(name),
  w: name,
  s: "Explore the collection",
  f: "font:clamp(48px,15vw,110px) 'Bebas Neue',Impact,sans-serif;color:#fff;text-shadow:0 0 30px #60a5fa;letter-spacing:.05em",
  a: "#60a5fa",
  e: "blur",
  i: "flo",
  p: { n: 28, col: "#fff", s: [1, 2.5], vx: [-0.2, 0.2], vy: [-0.5, -0.1], tw: 1, g: 8 },
})

const getTheme = (name: string | null): Theme => {
  if (!name) return THEMES.all
  const k0 = normKey(name)
  const k = ALIASES[k0] || k0
  return THEMES[k] || makeDefault(name)
}

const segs = (str: string): string[] => {
  const I: any = typeof Intl !== "undefined" ? Intl : null
  if (I && I.Segmenter) {
    return Array.from(
      new I.Segmenter(undefined, { granularity: "grapheme" }).segment(str),
      (x: any) => x.segment as string
    )
  }
  return Array.from(str)
}

const rnd = (a: number, b: number) => a + Math.random() * (b - a)

/* =========================================================
   OFFICIAL SOCIAL PLATFORMS (same links as footer)
========================================================= */

type SocialPlatform =
  | "facebook"
  | "instagram"
  | "telegram"
  | "whatsapp"
  | "youtube"
  | "tiktok"
  | "threads"

interface PlatformItem {
  platform: SocialPlatform
  label: string
  url: string
  color: string // official brand colour
}

const platformItems: PlatformItem[] = [
  {
    platform: "facebook",
    label: "Facebook",
    url: "https://www.facebook.com/share/19eVKBFqiV/",
    color: "#1877F2",
  },
  {
    platform: "instagram",
    label: "Instagram",
    url: "https://www.instagram.com/mvbdstudio?stkn=aGFyY2UwNXVibGVq",
    color: "#E4405F",
  },
  {
    platform: "telegram",
    label: "Telegram",
    url: "https://t.me/addlist/G-AjTDjHEW0yYTJl",
    color: "#26A5E4",
  },
  {
    platform: "whatsapp",
    label: "WhatsApp",
    url: "https://wa.me/qr/D2BVBPREHG4LH1",
    color: "#25D366",
  },
  {
    platform: "youtube",
    label: "YouTube",
    url: "https://youtube.com/@moviesversebd26?si=gKTfFLJDC4dGc7KW",
    color: "#FF0000",
  },
  {
    platform: "tiktok",
    label: "TikTok",
    url: "https://www.tiktok.com/@moviesversebd?_r=1&_t=ZS-99dip5TzHyy",
    color: "#FFFFFF",
  },
  {
    platform: "threads",
    label: "Threads",
    url: "https://www.threads.com/@mvbdstudio",
    color: "#FFFFFF",
  },
]

function PlatformIcon({ platform }: { platform: SocialPlatform }) {
  const common = {
    viewBox: "0 0 24 24",
    className: "w-full h-full block",
    "aria-hidden": true,
  } as const

  switch (platform) {
    case "facebook":
      return (
        <svg {...common}>
          <path
            fill="currentColor"
            d="M13.5 21v-8h2.7l.4-3h-3.1V8.08c0-.87.24-1.46 1.5-1.46h1.7V3.94c-.29-.04-1.29-.12-2.46-.12-2.44 0-4.11 1.49-4.11 4.23V10H7.5v3h2.63v8h3.37Z"
          />
        </svg>
      )
    case "instagram":
      return (
        <svg {...common}>
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
    case "telegram":
      return (
        <svg {...common}>
          <path
            fill="currentColor"
            d="M21.9 4.1 18.7 19c-.24 1.05-.86 1.31-1.74.82l-4.77-3.52-2.3 2.21c-.25.25-.46.46-.94.46l.34-4.86 8.85-8c.39-.34-.09-.53-.6-.19L6.6 12.96l-4.69-1.47c-1.02-.32-1.04-1.02.21-1.51L20.45 3.3c.86-.31 1.62.2 1.45.8Z"
          />
        </svg>
      )
    case "whatsapp":
      return (
        <svg {...common}>
          <path
            fill="currentColor"
            d="M20.52 3.48A11.83 11.83 0 0 0 12.07 0C5.52 0 .19 5.32.19 11.88c0 2.09.55 4.13 1.59 5.92L.1 24l6.34-1.66a11.87 11.87 0 0 0 5.63 1.43h.01c6.55 0 11.88-5.33 11.88-11.89 0-3.17-1.23-6.15-3.44-8.4ZM12.08 21.75h-.01a9.85 9.85 0 0 1-5.02-1.37l-.36-.21-3.76.99 1-3.67-.23-.38a9.87 9.87 0 0 1-1.51-5.23C2.19 6.44 6.62 2 12.07 2c2.64 0 5.12 1.03 6.98 2.9a9.82 9.82 0 0 1 2.89 6.99c0 5.45-4.43 9.86-9.86 9.86Zm5.41-7.39c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.47-.89-.79-1.49-1.77-1.66-2.07-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.07-.15-.67-1.61-.92-2.2-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.49s1.07 2.89 1.22 3.09c.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.69.63.71.23 1.35.2 1.86.12.57-.09 1.76-.72 2.01-1.42.25-.7.25-1.3.17-1.42-.07-.12-.27-.2-.57-.35Z"
          />
        </svg>
      )
    case "youtube":
      return (
        <svg {...common}>
          <path
            fill="currentColor"
            d="M23.5 6.2a3 3 0 0 0-2.12-2.12C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.38.58A3 3 0 0 0 .5 6.2 31.2 31.2 0 0 0 0 12a31.2 31.2 0 0 0 .5 5.8 3 3 0 0 0 2.12 2.12C4.5 20.5 12 20.5 12 20.5s7.5 0 9.38-.58a3 3 0 0 0 2.12-2.12A31.2 31.2 0 0 0 24 12a31.2 31.2 0 0 0-.5-5.8ZM9.6 15.85v-7.7L16 12l-6.4 3.85Z"
          />
        </svg>
      )
    case "tiktok":
      return (
        <svg {...common}>
          <path
            fill="currentColor"
            d="M16.55 2h-3.16v13.07a3.48 3.48 0 1 1-2.42-3.32V8.53a6.78 6.78 0 1 0 5.58 6.65V8.1a8.33 8.33 0 0 0 4.87 1.57V6.5c-2.55-.11-4.55-1.84-4.87-4.5Z"
          />
        </svg>
      )
    case "threads":
      return (
        <svg {...common}>
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
    default:
      return null
  }
}

/* ✅ YouTube + Android official-style logos (CTA button background) */
function YouTubeLogo() {
  return (
    <svg viewBox="0 0 24 24" className="gc-bgi" aria-hidden="true">
      <rect x="1" y="4.5" width="22" height="15" rx="4.2" fill="#FF0000" />
      <path d="M9.8 8.7v6.6l5.7-3.3z" fill="#fff" />
    </svg>
  )
}

function AndroidLogo() {
  return (
    <svg viewBox="0 0 24 24" className="gc-bgi" aria-hidden="true">
      <path d="M4.6 15.2a7.4 7.4 0 0 1 14.8 0z" fill="#3DDC84" />
      <path
        d="M4.6 16.2h14.8v3.2a1.6 1.6 0 0 1-1.6 1.6H6.2a1.6 1.6 0 0 1-1.6-1.6z"
        fill="#3DDC84"
      />
      <path
        d="M8.2 6.2 6.6 3.6M15.8 6.2l1.6-2.6"
        stroke="#3DDC84"
        strokeWidth="1.3"
        strokeLinecap="round"
        fill="none"
      />
      <circle cx="9.4" cy="11.6" r=".95" fill="#04110a" />
      <circle cx="14.6" cy="11.6" r=".95" fill="#04110a" />
    </svg>
  )
}

/* =========================================================
   HELPERS
========================================================= */

const normalizeLanguage = (lang: string): string => {
  if (!lang) return "Others"
  const l = lang.toLowerCase().trim()

  if (l.includes("hindi") || l === "dual audio" || l.includes("हिंदी")) return "Hindi"
  if (l.includes("bangla") || l.includes("bengali") || l.includes("বাংলা")) return "Bangla"
  if (l.includes("korean") || l.includes("kurean")) return "Korean"
  if (l.includes("english") || l === "eng") return "English"
  if (l.includes("telugu")) return "Telugu"
  if (l.includes("malayalam")) return "Malayalam"
  if (l.includes("japanese")) return "Japanese"
  if (l.includes("tamil")) return "Tamil"
  if (l.includes("indonesian")) return "Indonesian"
  if (l.includes("filipino") || l.includes("tagalog")) return "Filipino"
  if (l.includes("thai")) return "Thai"

  return "Others"
}

const isSeries = (title: string): boolean => {
  return /season|সিজন|season \d|part \d/i.test(title)
}

const selectorTypes: SelectorType[] = [
  "year",
  "rating",
  "language",
  "type",
  "genre",
  "platform",
]

/* Category button এর ভেতরের image (এক পাশ থেকে অন্য পাশে dark হয়ে যায়) */
function TileBg({ url, delay }: { url?: string; delay: number }) {
  const [ld, setLd] = useState(false)

  useEffect(() => {
    if (!url) return
    let ok = true
    const t = setTimeout(() => {
      const im = new Image()
      im.referrerPolicy = "no-referrer"
      im.onload = () => ok && setLd(true)
      im.src = url
    }, delay)
    return () => {
      ok = false
      clearTimeout(t)
    }
  }, [url, delay])

  if (!url) return null
  return (
    <>
      <span
        className={`gc-tb ${ld ? "ld" : ""}`}
        style={{ backgroundImage: `url("${url}")` }}
      />
      <span className="gc-tg" />
    </>
  )
}

/* নিচের animation এর পেছনের background layer (crossfade) */
interface BgLayer {
  id: number
  url?: string
  a: string
}

function BgLayerView({ layer, alt }: { layer: BgLayer; alt: boolean }) {
  const [on, setOn] = useState(false)

  useEffect(() => {
    let r2 = 0
    const r1 = requestAnimationFrame(() => {
      r2 = requestAnimationFrame(() => setOn(true))
    })
    return () => {
      cancelAnimationFrame(r1)
      cancelAnimationFrame(r2)
    }
  }, [])

  return (
    <div
      className={`gc-bg ${alt ? "k2" : ""} ${on ? "on" : ""}`}
      style={{
        background: `${
          layer.url ? `url("${layer.url}") center/cover no-repeat,` : ""
        }radial-gradient(circle at 50% 30%,${layer.a}66,#000 75%)`,
      }}
    />
  )
}

export { normalizeLanguage, isSeries }

export default function GenreCategories({
  genres,
  selectedGenre,
  onGenreSelect,
  showAdultContent = false,
  selectedYear = "All",
  selectedRating = "All",
  selectedLanguage = "All",
  selectedType = "All",
  onFilterChange,
  items = movies,
}: GenreCategoriesProps) {
  const [activeModal, setActiveModal] = useState<AppModal>(null)
  const [openFilter, setOpenFilter] = useState<FilterType>(null)
  const filterBarRef = useRef<HTMLDivElement>(null)

  /* ---------- animated stage refs / state ---------- */
  const stageRef = useRef<HTMLDivElement>(null)
  const cvRef = useRef<HTMLCanvasElement>(null)
  const hcRef = useRef<HTMLDivElement>(null)
  const wordRef = useRef<HTMLDivElement>(null)
  const subRef = useRef<HTMLDivElement>(null)
  const layerId = useRef(0)
  const eng = useRef<{
    cfg: Particles | null
    P: any[]
    B: any[]
    W: number
    H: number
    spawn: () => void
    burst: (x: number, y: number, c: string) => void
  }>({ cfg: null, P: [], B: [], W: 0, H: 0, spawn: () => {}, burst: () => {} })

  const [layers, setLayers] = useState<BgLayer[]>([])
  const [shown, setShown] = useState<Theme | null>(null)

  const theme = useMemo(() => getTheme(selectedGenre), [selectedGenre])

  const availableYears = useMemo(() => {
    const years = new Set<string>()
    items.forEach((m) => {
      const y = m.year != null ? String(m.year).trim() : ""
      if (/^\d{4}$/.test(y)) years.add(y)
    })
    return Array.from(years).sort((a, b) => parseInt(b) - parseInt(a))
  }, [items])

  const availableLanguages = useMemo(() => {
    const langs = new Set<string>()
    items.forEach((m) => {
      if (m.language) {
        langs.add(normalizeLanguage(String(m.language)))
      }
    })
    return Array.from(langs).sort()
  }, [items])

  /* ✅ Genre selector: movie-data এর সব movie থেকে unique genre বের করা হয়
     (genre গুলো "Action | Drama | bangla" এই format এ থাকে)
     - বড়/ছোট হাতের একই genre (Bangla / bangla) একবারই দেখাবে
     - উপরের Categories চিপে যে নামে আছে সেই নামটাই ব্যবহার হবে */
  const availableGenres = useMemo(() => {
    const variants = new Map<string, Map<string, number>>()

    const add = (name: string, weight: number) => {
      const key = name.toLowerCase()
      if (!variants.has(key)) variants.set(key, new Map())
      const m = variants.get(key)!
      m.set(name, (m.get(name) || 0) + weight)
    }

    // Categories এর নামগুলোকে বেশি গুরুত্ব দেওয়া হলো যেন নামের বানান একই থাকে
    genres.filter((g) => g !== "All").forEach((g) => add(g, 100000))

    items.forEach((m) => {
      if (!m.genre) return
      String(m.genre)
        .split("|")
        .forEach((raw) => {
          const g = raw.trim()
          if (g) add(g, 1)
        })
    })

    const result: string[] = []
    variants.forEach((m) => {
      let best = ""
      let bestCount = -1
      m.forEach((count, name) => {
        if (count > bestCount) {
          best = name
          bestCount = count
        }
      })
      result.push(best)
    })

    return result.sort((a, b) =>
      a.toLowerCase().localeCompare(b.toLowerCase())
    )
  }, [genres, items])

  const availableRatings = ["2.0", "3.0", "4.0", "5.0", "6.0", "7.0", "8.0", "9.0"]
  const availableTypes = ["All", "Movie", "Series"]

  useEffect(() => {
    if (!openFilter) return

    const handleClickOutside = (e: MouseEvent) => {
      if (
        filterBarRef.current &&
        !filterBarRef.current.contains(e.target as Node)
      ) {
        setOpenFilter(null)
      }
    }

    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpenFilter(null)
    }

    document.addEventListener("mousedown", handleClickOutside)
    document.addEventListener("touchstart", handleClickOutside as any)
    document.addEventListener("keydown", handleEsc)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
      document.removeEventListener("touchstart", handleClickOutside as any)
      document.removeEventListener("keydown", handleEsc)
    }
  }, [openFilter])

  useEffect(() => {
    if (!activeModal) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setActiveModal(null)
    }

    document.addEventListener("keydown", handleKeyDown)
    document.body.style.overflow = "hidden"
    return () => {
      document.removeEventListener("keydown", handleKeyDown)
      document.body.style.overflow = ""
    }
  }, [activeModal])

  /* =========================================================
     ✅ PARTICLE ENGINE (canvas)
     Canvas এর আসল CSS size থেকে মাপ নেওয়া হয়:
     - Mobile: শুধু নিচের stage এর ভেতরে
     - Desktop: পুরো Categories section জুড়ে
  ========================================================= */
  useEffect(() => {
    const cv = cvRef.current
    if (!cv) return
    const cx = cv.getContext("2d")
    if (!cx) return
    const E = eng.current
    let raf = 0

    E.spawn = () => {
      const c = E.cfg
      E.P = []
      if (!c) return
      for (let i = 0; i < c.n; i++) {
        E.P.push({
          x: rnd(0, E.W),
          y: rnd(0, E.H),
          s: rnd(c.s[0], c.s[1]),
          vx: rnd(c.vx[0], c.vx[1]),
          vy: rnd(c.vy[0], c.vy[1]),
          c: c.ch ? c.ch[Math.floor(Math.random() * c.ch.length)] : "",
          ph: rnd(0, 6.28),
        })
      }
    }

    E.burst = (x, y, col) => {
      for (let i = 0; i < 42; i++) {
        const a = rnd(0, 6.283)
        const v = rnd(2, 8)
        E.B.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 2, l: 1, c: col })
      }
    }

    const size = () => {
      const d = Math.min(window.devicePixelRatio || 1, 2)
      E.W = cv.clientWidth
      E.H = cv.clientHeight
      cv.width = E.W * d
      cv.height = E.H * d
      cx.setTransform(d, 0, 0, d, 0, 0)
      E.spawn()
    }
    size()
    const ro = new ResizeObserver(() => {
      if (cv.clientWidth !== E.W || cv.clientHeight !== E.H) size()
    })
    ro.observe(cv)

    const tick = (t: number) => {
      cx.clearRect(0, 0, E.W, E.H)

      for (let j = E.B.length - 1; j >= 0; j--) {
        const b = E.B[j]
        b.x += b.vx
        b.y += b.vy
        b.vy += 0.12
        b.l -= 0.018
        if (b.l <= 0) {
          E.B.splice(j, 1)
          continue
        }
        cx.globalAlpha = b.l
        cx.fillStyle = b.c
        cx.shadowColor = b.c
        cx.shadowBlur = 10
        cx.beginPath()
        cx.arc(b.x, b.y, 2.2, 0, 6.283)
        cx.fill()
        cx.shadowBlur = 0
      }

      const cfg = E.cfg
      if (cfg) {
        for (let i = 0; i < E.P.length; i++) {
          const p = E.P[i]
          p.x += p.vx + (cfg.sw ? Math.sin(t / 900 + p.ph) * 0.5 : 0)
          p.y += p.vy
          if (p.x < -60) p.x = E.W + 60
          if (p.x > E.W + 60) p.x = -60
          if (p.y < -60) p.y = E.H + 60
          if (p.y > E.H + 60) p.y = -60
          cx.globalAlpha = cfg.tw
            ? 0.35 + 0.65 * Math.abs(Math.sin(t / 700 + p.ph))
            : cfg.al || 0.85
          if (cfg.ch) {
            cx.font = p.s + "px sans-serif"
            cx.fillStyle = cfg.col || "#fff"
            cx.fillText(p.c, p.x, p.y)
          } else if (cfg.len) {
            cx.strokeStyle = cfg.col || "#fff"
            cx.lineWidth = 1
            cx.beginPath()
            cx.moveTo(p.x, p.y)
            cx.lineTo(p.x - p.vx * cfg.len, p.y - p.vy * cfg.len)
            cx.stroke()
          } else {
            const col = cfg.col || "#fff"
            cx.fillStyle = col
            cx.shadowColor = col
            cx.shadowBlur = cfg.g || 0
            cx.beginPath()
            cx.arc(p.x, p.y, p.s, 0, 6.283)
            cx.fill()
            cx.shadowBlur = 0
          }
        }
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)

    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
    }
  }, [])

  /* =========================================================
     ✅ Genre বদলালে: background crossfade + title animation
  ========================================================= */
  useEffect(() => {
    const th = theme
    const E = eng.current
    let dead = false
    let added = false
    const timers: ReturnType<typeof setTimeout>[] = []

    // --- title: আগেরটা fade out, 320ms পরে নতুনটা animate হয়ে আসে
    if (wordRef.current) wordRef.current.style.opacity = "0"
    if (subRef.current) subRef.current.style.opacity = "0"
    if (cvRef.current) cvRef.current.style.opacity = "0"
    timers.push(
      setTimeout(() => {
        if (dead) return
        setShown(th)
        E.cfg = th.p
        E.spawn()
        if (cvRef.current) cvRef.current.style.opacity = "1"
        E.burst(E.W / 2, E.H / 2, th.a)
      }, 320)
    )

    // --- background: image load হলে নতুন layer fade-in, আগেরটা পরে সরে যায়
    const addLayer = () => {
      if (dead || added) return
      added = true
      const id = ++layerId.current
      setLayers((p) => [...p, { id, url: th.u, a: th.a }])
      timers.push(
        setTimeout(() => setLayers((p) => p.filter((l) => l.id >= id)), 1900)
      )
    }
    if (th.u) {
      const im = new Image()
      im.referrerPolicy = "no-referrer"
      im.onload = addLayer
      im.onerror = addLayer
      im.src = th.u
      timers.push(setTimeout(addLayer, 2500))
    } else {
      addLayer()
    }

    return () => {
      dead = true
      timers.forEach(clearTimeout)
    }
  }, [theme])

  // title এর font/animation apply (flash ছাড়া)
  useIsoLayoutEffect(() => {
    if (!shown || !wordRef.current) return
    wordRef.current.style.cssText =
      shown.f +
      ";animation:" +
      (shown.i === "none" ? "none" : `gci_${shown.i} 4s ease-in-out infinite`) +
      ";opacity:1"
    if (subRef.current) subRef.current.style.opacity = "1"
  }, [shown])

  // mouse এর সাথে হালকা 3D tilt
  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      if (window.matchMedia("(prefers-reduced-motion:reduce)").matches) return
      if (!hcRef.current) return
      hcRef.current.style.transform = `perspective(900px) rotateY(${
        (e.clientX / window.innerWidth - 0.5) * 10
      }deg) rotateX(${-(e.clientY / window.innerHeight - 0.5) * 8}deg)`
    }
    window.addEventListener("pointermove", onMove)
    return () => window.removeEventListener("pointermove", onMove)
  }, [])

  const burstFrom = (el: HTMLElement, genre: string | null) => {
    const cv = cvRef.current
    if (!cv) return
    const sr = cv.getBoundingClientRect()
    const q = el.getBoundingClientRect()
    eng.current.burst(
      q.left + q.width / 2 - sr.left,
      q.top + q.height / 2 - sr.top,
      getTheme(genre).a
    )
  }

  const handleFilterSelect = (type: SelectorType, value: string) => {
    if (type === "genre") {
      onGenreSelect(value === "All" ? null : value)
    } else if (type !== "platform") {
      onFilterChange?.({ [type]: value })
    }
    setOpenFilter(null)
  }

  const getFilterLabel = (type: SelectorType, value: string) => {
    if (type === "year") return value === "All" ? "Year" : value
    if (type === "rating") return value === "All" ? "Rating" : `${value}+`
    if (type === "language") return value === "All" ? "Language" : value
    if (type === "type") return value === "All" ? "Type" : value
    if (type === "genre") return value === "All" ? "Genre" : value
    if (type === "platform") return "Platforms"
    return value
  }

  const getOptions = (type: SelectorType) => {
    if (type === "year") return ["All", ...availableYears]
    if (type === "rating") return ["All", ...availableRatings]
    if (type === "language") return ["All", ...availableLanguages]
    if (type === "type") return availableTypes
    if (type === "genre") return ["All", ...availableGenres]
    return []
  }

  const getSelectedValue = (type: SelectorType) => {
    if (type === "year") return selectedYear
    if (type === "rating") return selectedRating
    if (type === "language") return selectedLanguage
    if (type === "type") return selectedType
    if (type === "genre") return selectedGenre ?? "All"
    return "All"
  }

  // Categories এর button গুলোর common class — সব একই সাইজ
  const categoryBase =
    "liquid-glass-category category-btn relative overflow-hidden font-medium transition"

  const categoryList = genres.filter((g) => g !== "All")

  return (
    <div
      className="gc-root bg-black/30 backdrop-blur-lg border-b border-white/10 px-4 py-6"
      style={{ ["--ac" as any]: theme.a } as CSSProperties}
    >
      <style>{`
        @import url("https://fonts.googleapis.com/css2?family=Anton&family=Bangers&family=Bebas+Neue&family=Black+Ops+One&family=Creepster&family=Galada&family=Great+Vibes&family=Jua&family=Lilita+One&family=Nosifer&family=Orbitron:wght@900&family=Playfair+Display:ital,wght@1,900&family=Poppins:wght@400;500;600&family=Special+Elite&family=Tilt+Neon&family=Tiro+Bangla:ital@1&display=swap");

        @keyframes liquidGlassButtonZoom {
          0% { transform: scale(1); background: rgba(255, 255, 255, 0.05); backdrop-filter: blur(20px); }
          50% { transform: scale(1.05); background: rgba(255, 255, 255, 0.08); backdrop-filter: blur(25px); }
          100% { transform: scale(1.08); background: rgba(100, 200, 255, 0.1); backdrop-filter: blur(30px); }
        }
        .liquid-glass-category {
          background: rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.15);
          border-radius: 16px;
          transition: all 0.3s ease;
        }
        .liquid-glass-category:hover {
          background: rgba(255, 255, 255, 0.08);
          backdrop-filter: blur(25px);
          border: 1px solid rgba(255, 255, 255, 0.25);
          transform: scale(1.02);
        }
        .liquid-glass-category.active {
          background: rgba(100, 200, 255, 0.12);
          backdrop-filter: blur(30px);
          border: 1px solid rgba(100, 200, 255, 0.4);
          animation: liquidGlassButtonZoom 0.5s ease-out;
        }

        /* =========================================================
           ✅ Category buttons grid
           Mobile: 6 কলামের grid → category = 2 কলাম (৩টা এক লাইনে),
                   CTA button (tutorial / download) = 3 কলাম (২টা এক লাইনে)
           Desktop: মাঝখানে (center) সাজানো
           ========================================================= */
        .category-grid {
          display: grid;
          grid-template-columns: repeat(6, minmax(0, 1fr));
          grid-auto-rows: auto;
          gap: 8px;
        }
        .category-grid > .category-btn { grid-column: span 2; }
        .category-grid > .category-btn.gc-cta { grid-column: span 3; }
        .gc-br { display: none; }
        .category-btn {
          width: 100%;
          min-height: 54px;
          padding: 6px 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          text-align: center;
          font-size: 12px;
          line-height: 1.25;
          text-transform: none;
          overflow-wrap: anywhere;
        }
        @media (min-width: 400px) {
          .category-btn { font-size: 13px; padding: 6px 8px; }
        }
        @media (min-width: 640px) {
          .category-grid { gap: 10px; }
          .category-btn { font-size: 14px; min-height: 52px; }
        }
        @media (min-width: 768px) {
          .category-grid {
            display: flex;
            flex-wrap: wrap;
            justify-content: center;
            gap: 12px;
          }
          .category-btn {
            width: auto;
            min-height: 0;
            padding: 8px 16px;
            font-size: 16px;
            line-height: 1.5;
          }
          .gc-br { display: block; flex-basis: 100%; height: 0; }
        }

        /* ✅ Category button এর ভেতরের image */
        .gc-tb {
          position: absolute; inset: 0; opacity: 0; transform: scale(1.12);
          background-size: cover; background-position: center;
          filter: saturate(.85);
          transition: opacity .9s, transform 1.4s cubic-bezier(.2,.7,.2,1), filter .6s;
        }
        .gc-tb.ld { opacity: .85; }
        .gc-tg {
          position: absolute; inset: 0;
          background: linear-gradient(90deg, #0000 0%, #0006 38%, #000e 100%);
          transition: opacity .6s;
        }
        .gc-bl { position: relative; z-index: 1; font-weight: 600; text-shadow: 0 1px 8px #000, 0 0 3px #000; }
        .category-btn.active .gc-tb {
          opacity: 1; transform: scale(1); filter: saturate(1.2);
          animation: gc-tbk 9s ease-in-out 1.4s infinite alternate;
        }
        .category-btn.active .gc-tg { opacity: .75; }
        @media (hover: hover) {
          .category-btn:hover .gc-tb.ld { opacity: 1; transform: scale(1.06); }
        }
        @keyframes gc-tbk { to { transform: scale(1.14) translateX(-3%); } }

        /* ✅ CTA buttons: tutorial (YouTube) + download (Android) */
        .category-btn.gc-cta {
          min-height: 76px; justify-content: flex-start; text-align: left;
          padding: 10px 74px 10px 14px; font-size: 13px; font-weight: 600;
          line-height: 1.25; color: #fff; border-radius: 16px;
        }
        @media (min-width: 768px) {
          .category-btn.gc-cta { flex: 1 1 280px; max-width: 420px; width: auto; font-size: 15px; }
        }
        .gc-ct { position: relative; z-index: 1; text-shadow: 0 1px 6px #000; }
        .gc-cta .gc-bgi {
          position: absolute; right: -10px; top: 50%; width: 84px; height: 84px;
          transform: translateY(-50%) rotate(-8deg);
          filter: drop-shadow(0 0 14px var(--g));
          animation: gc-f 4s ease-in-out infinite;
        }
        .gc-cta::after {
          content: ""; position: absolute; inset: 0; pointer-events: none;
          background: linear-gradient(110deg, transparent 35%, #ffffff22 50%, transparent 65%);
          transform: translateX(-100%); animation: gc-s 4.2s infinite;
        }
        .category-btn.gc-yt, .category-btn.gc-yt:hover {
          --g: #ff0000aa; border-color: rgba(255,60,60,.4);
          background: radial-gradient(circle at 92% 50%, rgba(255,0,0,.42), transparent 58%), linear-gradient(135deg, #1f0608, #09090b 75%);
        }
        .category-btn.gc-an, .category-btn.gc-an:hover {
          --g: #3ddc84aa; border-color: rgba(61,220,132,.4);
          background: radial-gradient(circle at 92% 50%, rgba(61,220,132,.38), transparent 58%), linear-gradient(135deg, #04170d, #09090b 75%);
        }
        @keyframes gc-f { 50% { transform: translateY(-57%) rotate(-4deg); } }
        @keyframes gc-s { 60%, 100% { transform: translateX(100%); } }

        @keyframes filterDropdownOpenUp {
          from {
            opacity: 0;
            transform: translateY(8px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        .filter-dropdown {
          animation: filterDropdownOpenUp 0.25s cubic-bezier(0.25, 1, 0.5, 1);
        }
        @keyframes filterItemSlide {
          from { opacity: 0; transform: translateX(-10px); }
          to { opacity: 1; transform: translateX(0); }
        }
        .filter-item-anim {
          animation: filterItemSlide 0.3s ease-out backwards;
        }
        .filter-selector-btn {
          background: rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.15);
          border-radius: 12px;
          transition: all 0.3s ease;
          color: #cbd5e1;
        }
        .filter-selector-btn:hover {
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(100, 200, 255, 0.3);
          color: white;
        }
        .filter-selector-btn.active {
          background: rgba(100, 200, 255, 0.15);
          border: 1px solid rgba(100, 200, 255, 0.5);
          color: #93c5fd;
        }
        .filter-selector-btn.has-value {
          background: rgba(34, 197, 94, 0.12);
          border: 1px solid rgba(34, 197, 94, 0.4);
          color: #86efac;
        }

        /* ✅ Selector গুলো: mobile এ 3 কলাম grid, desktop এ মাঝখানে */
        .filter-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 8px;
        }
        @media (min-width: 768px) {
          .filter-grid {
            display: flex;
            flex-wrap: wrap;
            justify-content: center;
            gap: 12px;
          }
        }

        /* ✅ Platforms dropdown item */
        .platform-item {
          display: flex;
          align-items: center;
          gap: 12px;
          width: 100%;
          padding: 8px 14px;
          transition: background 0.2s ease, transform 0.2s ease;
        }
        .platform-item:hover {
          background: rgba(255, 255, 255, 0.08);
        }
        .platform-icon-box {
          width: 32px;
          height: 32px;
          padding: 7px;
          border-radius: 10px;
          flex-shrink: 0;
          background: color-mix(in srgb, currentColor 14%, transparent);
          border: 1px solid color-mix(in srgb, currentColor 35%, transparent);
        }
        .platform-item:hover .platform-icon-box {
          box-shadow: 0 0 14px color-mix(in srgb, currentColor 45%, transparent);
        }
        .platform-tiktok .platform-icon-box svg {
          filter: drop-shadow(1px 1px 0 #fe2c55) drop-shadow(-1px -1px 0 #25f4ee);
        }

        /* =========================================================
           ✅ নিচের animated stage (background image + title animation)
           Mobile: আগের মতোই শুধু stage এর ভেতরে
           ========================================================= */
        .gc-stage {
          position: relative; overflow: hidden; isolation: isolate;
          aspect-ratio: 16 / 9; min-height: 210px; max-height: 62vh;
          margin-top: 24px;
          display: flex; align-items: center; justify-content: center;
          -webkit-mask-image: linear-gradient(180deg, transparent 0, #000 12%, #000 82%, transparent 100%);
          mask-image: linear-gradient(180deg, transparent 0, #000 12%, #000 82%, transparent 100%);
        }
        .gc-bgs { position: absolute; inset: 0; z-index: 0; overflow: hidden; }
        .gc-bg {
          position: absolute; inset: -4%; opacity: 0;
          filter: blur(18px) brightness(.55) saturate(.8);
          transition: opacity 1.5s cubic-bezier(.4,0,.2,1), filter 1.9s cubic-bezier(.2,.7,.2,1);
          will-change: opacity, transform;
          animation: gc-kb 26s ease-in-out infinite alternate;
        }
        .gc-bg.k2 { animation-name: gc-kb2; }
        .gc-bg.on { opacity: 1; filter: none; }
        @keyframes gc-kb { to { transform: scale(1.06) translate(-1.5%, 1%); } }
        @keyframes gc-kb2 { from { transform: scale(1.06) translate(1.5%, -1%); } to { transform: scale(1); } }
        .gc-shade {
          position: absolute; inset: 0; z-index: 1; pointer-events: none;
          background: linear-gradient(180deg, #000 0%, rgba(0,0,0,.55) 14%, rgba(0,0,0,.1) 34%, rgba(0,0,0,.18) 60%, rgba(0,0,0,.68) 85%, #000 100%);
        }
        .gc-tint {
          position: absolute; inset: 0; z-index: 1; pointer-events: none;
          mix-blend-mode: soft-light; opacity: .65;
          background: radial-gradient(ellipse at 50% 12%, var(--ac), transparent 62%);
        }
        .gc-vig {
          position: absolute; inset: 0; z-index: 1; pointer-events: none;
          background: radial-gradient(ellipse at 50% 40%, transparent 45%, #0008);
        }
        .gc-grain {
          position: absolute; inset: 0; z-index: 1; pointer-events: none;
          opacity: .14; mix-blend-mode: overlay;
          background: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.8' numOctaves='2'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>");
        }
        .gc-flash { position: absolute; inset: 0; z-index: 1; pointer-events: none; opacity: 0; }
        .gc-flash.on { animation: gc-lt 7s infinite; }
        @keyframes gc-lt { 0%,91%,100% { opacity: 0; } 92% { opacity: .55; } 93% { opacity: 0; } 94.5% { opacity: .3; } 96% { opacity: 0; } }
        .gc-scan {
          position: absolute; left: 0; right: 0; top: -120px; height: 120px; z-index: 1;
          pointer-events: none; opacity: 0;
          background: linear-gradient(180deg, transparent, #22e6ff44, transparent);
        }
        .gc-scan.on { opacity: 1; animation: gc-sc 5s linear infinite; }
        @keyframes gc-sc { to { top: 100%; } }
        .gc-lb { position: absolute; left: 0; right: 0; height: 0; background: #000; z-index: 2; transition: height .8s; }
        .gc-lb.t { top: 0; } .gc-lb.b { bottom: 0; }
        .gc-stage.cine .gc-lb { height: 3%; }
        .gc-cv { position: absolute; inset: 0; width: 100%; height: 100%; z-index: 2; pointer-events: none; transition: opacity .35s; }
        .gc-hc {
          position: relative; z-index: 3; display: flex; flex-direction: column;
          justify-content: center; align-items: center; text-align: center;
          padding: 10px 14px; transition: transform .15s; will-change: transform;
        }
        .gc-word { display: flex; flex-wrap: wrap; justify-content: center; line-height: 1.05; transition: opacity .3s; opacity: 0; }
        .gc-ch { display: inline-block; animation-duration: .95s; animation-fill-mode: both; animation-timing-function: cubic-bezier(.2,.8,.2,1); }
        .gc-sp { display: inline-block; width: .3em; }
        .gc-sub {
          margin-top: 12px; font-size: 13px; letter-spacing: .14em; text-transform: uppercase;
          color: #fff; font-family: Poppins, system-ui, sans-serif;
          text-shadow: 0 2px 10px #000b, 0 0 3px #0008; transition: opacity .3s; opacity: 0;
        }
        @keyframes gci_hue { to { filter: hue-rotate(360deg); } }
        @keyframes gci_flo { 50% { transform: translateY(-9px); } }
        @keyframes gci_flk { 0%,100% { opacity: 1; } 8% { opacity: .4; } 12% { opacity: 1; } 55% { opacity: .85; } 58% { opacity: .2; } 62% { opacity: 1; } }
        @keyframes gci_shk { 0%,100% { transform: translate(0); } 25% { transform: translate(2px,-1px) rotate(.4deg); } 75% { transform: translate(-2px,1px) rotate(-.4deg); } }
        @keyframes gci_pul { 50% { filter: brightness(1.35) drop-shadow(0 0 14px currentColor); } }
        @keyframes gcin_blur { from { opacity: 0; filter: blur(16px); transform: translateY(14px) scale(1.3); } }
        @keyframes gcin_slam { from { opacity: 0; transform: scale(3.2) rotate(-8deg); } }
        @keyframes gcin_bounce { from { opacity: 0; transform: translateY(-140%); } }
        @keyframes gcin_rise { from { opacity: 0; transform: translateY(70%); } }
        @keyframes gcin_flick { 0%,20%,40% { opacity: 0; } 10%,30% { opacity: 1; } 50% { opacity: .2; } 60% { opacity: 1; } }
        @keyframes gcin_drip { from { opacity: 0; transform: translateY(-90%) scaleY(2); } }
        @keyframes gcin_write { from { opacity: 0; clip-path: inset(0 100% 0 0); } to { clip-path: inset(0 0 0 0); } }
        @keyframes gcin_glitch { 0% { opacity: 0; transform: translateX(-24px) skewX(40deg); } 40% { opacity: 1; transform: translateX(10px) skewX(-20deg); } 60% { opacity: .3; } 100% { transform: none; } }
        @keyframes gcin_type { 0% { opacity: 0; } 1%,100% { opacity: 1; } }
        @media (prefers-reduced-motion: reduce) {
          .gc-bg, .gc-word, .gc-flash, .gc-scan, .gc-cta::after, .gc-cta .gc-bgi { animation: none !important; }
        }

        /* =========================================================
           ✅ DESKTOP ONLY (768px+)
           Background + animation পুরো section জুড়ে ছড়িয়ে যায়:
           "Categories" লেখা থেকে শুরু করে একদম নিচের stage পর্যন্ত।
           Image desktop এর মাপে cover/crop হয়ে fit করে, আর theme dark।
           Title লেখাটা আগের জায়গাতেই (নিচে) থাকে।
           ========================================================= */
        @media (min-width: 768px) {
          .gc-root {
            position: relative;
            overflow: hidden;
            isolation: isolate;
            padding-top: 32px;
            padding-bottom: 8px;
          }

          /* stage নিজে আর background ধরে না — শুধু title এর জায়গা */
          .gc-stage {
            position: static;
            isolation: auto;
            overflow: visible;
            aspect-ratio: auto;
            height: clamp(230px, 26vw, 360px);
            min-height: 0;
            max-height: none;
            margin-top: 16px;
            -webkit-mask-image: none;
            mask-image: none;
          }

          /* background layer গুলো এখন .gc-root এর সাথে মাপে (সব absolute inset:0) */
          .gc-bgs { z-index: 0; }

          /* dark theme: পুরো area জুড়ে সমান গাঢ় overlay, নিচে আরও dark */
          .gc-shade {
            background: linear-gradient(
              180deg,
              rgba(0, 0, 0, .86) 0%,
              rgba(0, 0, 0, .66) 28%,
              rgba(0, 0, 0, .5) 55%,
              rgba(0, 0, 0, .72) 82%,
              rgba(0, 0, 0, .94) 100%
            );
          }
          .gc-vig { background: radial-gradient(ellipse at 50% 45%, transparent 35%, #000a); }
          .gc-tint { opacity: .4; }

          /* canvas/particles পুরো section জুড়ে */
          .gc-cv { z-index: 2; }

          /* heading, button, selector — সব background এর উপরে */
          .gc-h2 { position: relative; z-index: 3; }
          .category-btn { z-index: 3; }
          .filter-grid { position: relative; z-index: 4; }
        }
      `}</style>

      <div className="max-w-7xl mx-auto">
        <h2 className="gc-h2 text-white font-bold text-lg mb-4 md:text-center">
          Categories
        </h2>

        <div className="category-grid">
          <button
            onClick={(e) => {
              burstFrom(e.currentTarget, null)
              onGenreSelect(null)
            }}
            className={`${categoryBase} ${
              selectedGenre === null ? "active text-blue-200" : "text-slate-300"
            }`}
          >
            <TileBg url={THEMES.all.u} delay={0} />
            <span className="gc-bl">All</span>
            {selectedGenre === null && <CategoryHighlight />}
          </button>
          {categoryList.map((genre, idx) => (
            <button
              key={genre}
              onClick={(e) => {
                burstFrom(e.currentTarget, genre)
                onGenreSelect(genre)
              }}
              className={`${categoryBase} ${
                selectedGenre === genre ? "active text-blue-200" : "text-slate-300"
              }`}
            >
              <TileBg url={getTheme(genre).u} delay={(idx + 1) * 70} />
              <span className="gc-bl">{genre}</span>
              {selectedGenre === genre && <CategoryHighlight />}
            </button>
          ))}
          <span className="gc-br" aria-hidden="true" />
          <button
            type="button"
            onClick={() => setActiveModal("tutorial")}
            className={`${categoryBase} gc-cta gc-yt`}
          >
            <YouTubeLogo />
            <span className="gc-ct">mvbd mini app tutorial</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveModal("download")}
            className={`${categoryBase} gc-cta gc-an`}
          >
            <AndroidLogo />
            <span className="gc-ct">download app for better experience</span>
          </button>
        </div>

        {/* ========================================================= */}
        {/* ✅ Selectors: Year, Rating, Language, Type + Genre, Platforms */}
        {/* ========================================================= */}
        <div ref={filterBarRef} className="mt-5 filter-grid">
          {selectorTypes.map((type, idx) => {
            const selectedValue = getSelectedValue(type)
            const hasValue = type !== "platform" && selectedValue !== "All"
            const isOpen = openFilter === type

            // dropdown কোন দিকে খুলবে: বাম কলাম → বাম, ডান কলাম → ডান, মাঝের → center
            const col = idx % 3
            const alignClass =
              col === 0
                ? "left-0"
                : col === 2
                  ? "right-0"
                  : "left-0 right-0 mx-auto"

            return (
              <div key={type} className="relative">
                <button
                  type="button"
                  onClick={() => setOpenFilter(isOpen ? null : type)}
                  className={`filter-selector-btn w-full px-3 py-2 md:px-4 md:py-2.5 text-xs md:text-sm font-semibold flex items-center gap-1.5 md:gap-2 md:min-w-[130px] justify-between ${
                    isOpen ? "active" : hasValue ? "has-value" : ""
                  }`}
                >
                  <span className="truncate capitalize">
                    {getFilterLabel(type, selectedValue)}
                  </span>
                  <ChevronDown
                    className={`w-3.5 h-3.5 md:w-4 md:h-4 flex-shrink-0 transition-transform duration-300 ${
                      isOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {isOpen && (
                  <div
                    className={`filter-dropdown absolute bottom-full mb-2 w-48 md:w-56 max-h-72 overflow-y-auto rounded-xl border border-white/20 bg-slate-950/95 backdrop-blur-2xl shadow-2xl z-[100] ${alignClass}`}
                    style={{
                      scrollbarWidth: "thin",
                      scrollbarColor: "rgba(100,200,255,0.4) transparent",
                    }}
                  >
                    {type === "platform" ? (
                      <div className="py-1.5">
                        {platformItems.map((item, i) => (
                          <a
                            key={item.platform}
                            href={item.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={() => setOpenFilter(null)}
                            aria-label={`Visit MVBD on ${item.label}`}
                            className={`filter-item-anim platform-item platform-${item.platform}`}
                            style={{ animationDelay: `${i * 30}ms` }}
                          >
                            <span
                              className="platform-icon-box"
                              style={{ color: item.color }}
                            >
                              <PlatformIcon platform={item.platform} />
                            </span>
                            <span
                              className="text-sm font-semibold"
                              style={{ color: item.color }}
                            >
                              {item.label}
                            </span>
                          </a>
                        ))}
                      </div>
                    ) : (
                      <div className="py-1.5">
                        {getOptions(type).map((option, i) => {
                          const isSelected = selectedValue === option
                          return (
                            <button
                              key={option}
                              type="button"
                              onClick={() => handleFilterSelect(type, option)}
                              className={`filter-item-anim w-full text-left px-4 py-2.5 text-sm font-medium transition-colors ${
                                type === "genre" ? "capitalize" : ""
                              } ${
                                isSelected
                                  ? "bg-cyan-500/20 text-cyan-200"
                                  : "text-slate-300 hover:bg-white/10 hover:text-white"
                              }`}
                              style={{
                                animationDelay: `${Math.min(i, 15) * 20}ms`,
                              }}
                            >
                              {option === "All"
                                ? "All"
                                : type === "rating"
                                  ? `${option}+`
                                  : option}
                              {isSelected && (
                                <span className="ml-2 text-cyan-400">✓</span>
                              )}
                            </button>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* ========================================================= */}
        {/* ✅ Animated stage: "Recently Uploaded" এর জায়গা।           */}
        {/*    All = Recently Uploaded, বাকি category = তার নিজের animation */}
        {/*    Desktop এ background/particles পুরো section জুড়ে ছড়ায়    */}
        {/* ========================================================= */}
        <div
          ref={stageRef}
          className={`gc-stage ${theme.lb ? "cine" : ""}`}
        >
          <div className="gc-bgs">
            {layers.map((l) => (
              <BgLayerView key={l.id} layer={l} alt={l.id % 2 === 0} />
            ))}
          </div>
          <div className="gc-shade" />
          <div className="gc-tint" />
          <div className="gc-vig" />
          <div className="gc-grain" />
          <div
            className={`gc-flash ${theme.x ? "on" : ""}`}
            style={{ background: theme.fc || "#cfe0ff" }}
          />
          <div className={`gc-scan ${theme.sc ? "on" : ""}`} />
          <div className="gc-lb t" />
          <div className="gc-lb b" />
          <canvas ref={cvRef} className="gc-cv" />

          <div ref={hcRef} className="gc-hc">
            <div ref={wordRef} className="gc-word" aria-live="polite">
              {shown &&
                segs(shown.w).map((g, i) =>
                  g === " " ? (
                    <span key={shown.k + i} className="gc-sp" />
                  ) : (
                    <span
                      key={shown.k + i}
                      className="gc-ch"
                      style={{
                        animationName: `gcin_${shown.e}`,
                        animationDelay: `${i * 0.08}s`,
                      }}
                    >
                      {g}
                    </span>
                  )
                )}
            </div>
            <div ref={subRef} className="gc-sub">
              {shown?.s}
            </div>
          </div>
        </div>
      </div>

      {/* Tutorial / Download Modal */}
      {activeModal && typeof document !== "undefined" &&
        createPortal(
          <div
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 p-4 backdrop-blur-xl"
            role="presentation"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) setActiveModal(null)
            }}
          >
            <section
              role="dialog"
              aria-modal="true"
              aria-labelledby="app-feature-title"
              className="relative z-[10000] w-full max-w-2xl overflow-hidden rounded-2xl border border-white/20 bg-slate-950 text-white shadow-2xl ring-1 ring-black/40"
            >
              <button
                type="button"
                aria-label="Close popup"
                onClick={() => setActiveModal(null)}
                className="absolute right-3 top-3 z-10 rounded-full bg-black/60 px-3 py-1 text-2xl leading-none text-slate-200 transition hover:bg-white/15 hover:text-white"
              >
                ×
              </button>
              {activeModal === "tutorial" ? (
                <>
                  <div className="px-6 pb-4 pt-6 pr-14">
                    <h3 id="app-feature-title" className="text-xl font-bold text-balance">mvbd mini app tutorial</h3>
                    <p className="mt-1 text-sm text-slate-400">ভিডিওটি দেখে অ্যাপটি আরও সহজে ব্যবহার করুন।</p>
                  </div>
                  <div className="aspect-video w-full bg-black">
                    <iframe
                      className="h-full w-full"
                      src={`https://www.youtube.com/embed/${tutorialVideoId}?autoplay=1&rel=0`}
                      title="MVBD Mini App tutorial"
                      allow="autoplay; encrypted-media; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                </>
              ) : (
                <div className="px-6 pb-7 pt-8 pr-14">
                  <h3 id="app-feature-title" className="text-xl font-bold text-balance">Download app for better experience</h3>
                  <p className="mt-3 leading-6 text-slate-300">
                    MVBD Mini App ব্যবহার করলে মুভি ব্রাউজিং হবে আরও দ্রুত ও সুবিধাজনক। অ্যাপ থেকে সহজে মুভি খুঁজে পাবেন, স্মুথ নেভিগেশন উপভোগ করবেন এবং মোবাইলে আরও ভালো অভিজ্ঞতা পাবেন।
                  </p>
                  <ul className="mt-4 list-disc space-y-2 pl-5 leading-6 text-slate-400">
                    <li>দ্রুত ও সহজে মুভি এবং সিরিজ খুঁজে দেখুন</li>
                    <li>মোবাইলের জন্য তৈরি স্মুথ অ্যাপ অভিজ্ঞতা</li>
                    <li>অবশ্যই মিনি অ্যাপ টি ডাউনলোড করতে হলে আপনাকে chrome browser এ গিয়ে mvbds.xyz ওখান থেকে আমাদের সাইট এ প্রবেশ করে এরপর ডাউনলোড বাটন এ ক্লিক করলে ডিরেক্ট ডাউনলোড হবে।</li>
                  </ul>
                  <a
                    href={apkDownloadUrl}
                    download
                    className="mt-6 inline-flex rounded-lg bg-emerald-500 px-5 py-3 font-semibold text-slate-950 transition hover:bg-emerald-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300"
                  >
                    Download Now
                  </a>
                </div>
              )}
            </section>
          </div>,
          document.body,
        )}
    </div>
  )
}

function CategoryHighlight() {
  return (
    <div className="absolute inset-0 pointer-events-none">
      <div className="fire-continuous fire-continuous-1" />
      <div className="fire-continuous fire-continuous-2" />
      <div className="fire-continuous fire-continuous-3" />
      <div className="fire-continuous fire-continuous-4" />
      <div className="fire-continuous fire-continuous-5" />
    </div>
  )
        }
