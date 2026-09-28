"use client";

import React, { useEffect, useRef, useState } from "react";

// ==================== DATA ====================
const SITE_URL = "https://moviesversebd.com";

const POSTERS = [
  "https://i.postimg.cc/qBG6ydw2/MV5BMTk4NTk4MTk1OF5BMl5Ban-Bn-Xk-Ft-ZTcw-NTE2MDIw-NA-V1.jpg",
  "https://i.postimg.cc/J44DQdd1/MV5BYm-I3Yj-Jk-N2It-Y2Zm-YS00Y2Jh-LTk2YTQt-Yz-E5YWU5ODI1Mz-Jm-Xk-Ey-Xk-Fqc-Gc-V1.jpg",
  "https://i.postimg.cc/65j7bLDQ/MV5BZGVm-Nz-Rl-ZTct-NTU2OS00MTQw-LWI2ZWQt-OGVi-Mjc4ODNl-Nz-Vm-Xk-Ey-Xk-Fqc-Gc-V1-QL75-UX1080.jpg",
  "https://i.postimg.cc/bwZZ7Shb/c27aec8ab39db4bed60c8bc5e5b0f02d.jpg",
  "https://i.postimg.cc/4xjYs44x/MV5BNDg3ZGMw-ODAt-MGQ0YS00Ym-Mw-LWI3Nm-Ut-MWYz-NDE3Zj-Y1ODRk-Xk-Ey-Xk-Fqc-Gc-V1.jpg",
  "https://i.postimg.cc/Wzp3Xh85/MV5BMDBm-Zm-Rl-OWEt-YWZl-Yi00Nz-Vk-LTk5Zj-Et-YTVm-MDQ3ODZk-MGNh-Xk-Ey-Xk-Fqc-Gc-V1.jpg",
  "https://i.postimg.cc/9Mhzwxqn/images.jpg",
  "https://i.postimg.cc/Y28jjz2n/netflix-the-silent-sea-character-poster-bae-doona-gong-yoo-v0-2eb5ltwohf281.jpg",
  "https://i.postimg.cc/yxfN5srV/MV5BOTk5YWY5MDAt-NGZm-OC00Mj-E4LWEz-MWYt-MTJj-ODNi-MTVj-M2Uw-Xk-Ey-Xk-Fqc-Gc-V1.jpg",
];

type Slide = {
  tag: string;
  cat: string;
  title: [string, string];
  imdb: string;
  year: string;
  extra: string;
  desc: string;
};

const SLIDE_DATA: Slide[] = [
  {
    tag: "ORIGINAL SERIES",
    cat: "Trending #1",
    title: ["Nebula", "Protocol"],
    imdb: "9.1",
    year: "2025",
    extra: "Season 2 · 8 Episodes",
    desc: "When a rogue AI threatens to unravel reality itself, a fractured team of scientists must race across parallel universes to stop it — before every version of them ceases to exist.",
  },
  {
    tag: "FEATURED FILM",
    cat: "Now Streaming",
    title: ["Deep", "Water"],
    imdb: "8.7",
    year: "2024",
    extra: "1h 58m · Thriller",
    desc: "A deep-sea salvage crew discovers a sunken vessel that shouldn't exist. As they descend further, they realize the ocean is hiding something far older than humanity itself.",
  },
  {
    tag: "MV ORIGINAL",
    cat: "New Season",
    title: ["Scarlet", "Hour"],
    imdb: "9.4",
    year: "2025",
    extra: "Season 1 · 10 Episodes",
    desc: "In a city that never sleeps, a brilliant detective with a shattered past hunts a killer whose crimes are always committed at the exact moment the clock strikes scarlet.",
  },
  {
    tag: "BLOCKBUSTER",
    cat: "Top Rated",
    title: ["Midnight", "Fall"],
    imdb: "8.9",
    year: "2025",
    extra: "2h 12m · Action",
    desc: "One night. One city. One man against an empire. A relentless ex-agent must dismantle a criminal network before sunrise — or lose everything he loves.",
  },
  {
    tag: "SCI-FI EPIC",
    cat: "Fan Favorite",
    title: ["Echoes of", "Tomorrow"],
    imdb: "9.0",
    year: "2025",
    extra: "Season 1 · 12 Episodes",
    desc: "A physicist discovers her dreams are actually messages from a parallel version of herself — one that's warning her about an imminent catastrophe.",
  },
  {
    tag: "CRIME DRAMA",
    cat: "Award Winner",
    title: ["Crimson", "Tide"],
    imdb: "8.8",
    year: "2024",
    extra: "1h 45m · Drama",
    desc: "A small coastal town hides a dark secret beneath its calm waves. When a stranger arrives, long-buried truths threaten to drown everyone involved.",
  },
  {
    tag: "MYSTERY",
    cat: "New Release",
    title: ["Hidden", "Truth"],
    imdb: "8.3",
    year: "2025",
    extra: "1h 38m · Mystery",
    desc: "A journalist investigating a cold case discovers the victim was living a double life — and the killer may be closer to her than she ever imagined.",
  },
  {
    tag: "NETFLIX SERIES",
    cat: "Global Hit",
    title: ["The Silent", "Sea"],
    imdb: "8.5",
    year: "2024",
    extra: "Season 1 · 8 Episodes",
    desc: "On a lunar research station, a team of elite astronauts is sent to retrieve a mysterious sample. What they find will change humanity forever.",
  },
  {
    tag: "WEB SERIES",
    cat: "Just Added",
    title: ["Shadow", "Lines"],
    imdb: "8.6",
    year: "2025",
    extra: "Season 1 · 10 Episodes",
    desc: "A homicide detective and a convicted criminal form an unlikely alliance to solve a series of murders that have haunted the city for decades.",
  },
];

type Movie = {
  title: string;
  rating: string;
  poster: string;
  badge?: "top10" | "new";
  rank?: number;
};

const ROW_1: Movie[] = [
  { title: "Nebula Protocol", rating: "9.1", badge: "top10", poster: POSTERS[0] },
  { title: "Deep Water", rating: "8.7", badge: "new", poster: POSTERS[1] },
  { title: "Scarlet Hour", rating: "9.4", badge: "top10", poster: POSTERS[2] },
  { title: "Midnight Fall", rating: "8.9", poster: POSTERS[3] },
  { title: "The Silent Sea", rating: "8.5", badge: "new", poster: POSTERS[7] },
  { title: "Echoes of Tomorrow", rating: "9.0", badge: "top10", poster: POSTERS[4] },
  { title: "Hidden Truth", rating: "8.3", poster: POSTERS[6] },
  { title: "Crimson Tide", rating: "8.8", poster: POSTERS[5] },
  { title: "Shadow Lines", rating: "8.6", badge: "new", poster: POSTERS[8] },
];

const ROW_2: Movie[] = [
  { title: "Scarlet Hour", rating: "9.4", rank: 1, poster: POSTERS[2] },
  { title: "Nebula Protocol", rating: "9.1", rank: 2, poster: POSTERS[0] },
  { title: "Echoes of Tomorrow", rating: "9.0", rank: 3, poster: POSTERS[4] },
  { title: "Midnight Fall", rating: "8.9", rank: 4, poster: POSTERS[3] },
  { title: "Crimson Tide", rating: "8.8", rank: 5, poster: POSTERS[5] },
  { title: "Deep Water", rating: "8.7", rank: 6, poster: POSTERS[1] },
  { title: "Shadow Lines", rating: "8.6", rank: 7, poster: POSTERS[8] },
  { title: "The Silent Sea", rating: "8.5", rank: 8, poster: POSTERS[7] },
  { title: "Hidden Truth", rating: "8.3", rank: 9, poster: POSTERS[6] },
];

const ROW_3: Movie[] = [
  { title: "Velvet Empire", rating: "8.4", badge: "new", poster: POSTERS[3] },
  { title: "Zero Gravity", rating: "8.6", badge: "new", poster: POSTERS[0] },
  { title: "Iron Lotus", rating: "8.2", badge: "new", poster: POSTERS[5] },
  { title: "Last Train to Dhaka", rating: "9.0", badge: "new", poster: POSTERS[2] },
  { title: "The Glass Prince", rating: "8.5", badge: "new", poster: POSTERS[7] },
  { title: "Neon Harvest", rating: "8.3", badge: "new", poster: POSTERS[1] },
  { title: "Broken Compass", rating: "8.1", badge: "new", poster: POSTERS[4] },
  { title: "Silent Symphony", rating: "8.7", badge: "new", poster: POSTERS[8] },
  { title: "Ghost Frequency", rating: "8.4", badge: "new", poster: POSTERS[6] },
];

const TYPING_MESSAGES = [
  "Click the green button above to enter MoviesVerseBD",
  "Stream thousands of movies in HD — completely free",
  "Bangla subtitles available for most titles",
  "New releases added every single day",
  "No signup required. Just click and watch.",
  "Bangladesh's most loved streaming experience",
  "Hollywood · Bollywood · South Indian · Web Series",
  "Your next favourite movie is one click away",
];

// ==================== MAIN COMPONENT ====================
export default function LandingPage() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isScrolled, setIsScrolled] = useState(false);
  const [typingText, setTypingText] = useState("");
  const [heroAnimating, setHeroAnimating] = useState(false);

  const slideTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const msgIndexRef = useRef(0);
  const charIndexRef = useRef(0);
  const isDeletingRef = useRef(false);

  // ==================== NAV SCROLL ====================
  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 40);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // ==================== SCROLL REVEAL ====================
  useEffect(() => {
    const revealObs = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -60px 0px" }
    );

    const revealElements = document.querySelectorAll(".reveal");
    revealElements.forEach((el) => revealObs.observe(el));

    return () => revealObs.disconnect();
  }, []);

  // ==================== HERO SLIDESHOW ====================
  const goToSlide = (index: number) => {
    setCurrentSlide(index);
    setHeroAnimating(false);
    // Trigger re-animation
    requestAnimationFrame(() => {
      requestAnimationFrame(() => setHeroAnimating(true));
    });
  };

  useEffect(() => {
    slideTimerRef.current = setInterval(() => {
      setCurrentSlide((prev) => {
        const next = (prev + 1) % SLIDE_DATA.length;
        setHeroAnimating(false);
        requestAnimationFrame(() => {
          requestAnimationFrame(() => setHeroAnimating(true));
        });
        return next;
      });
    }, 4500);

    return () => {
      if (slideTimerRef.current) clearInterval(slideTimerRef.current);
    };
  }, []);

  // Start hero animation on mount
  useEffect(() => {
    setHeroAnimating(true);
  }, []);

  // ==================== TYPING ANIMATION ====================
  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>;

    const typeLoop = () => {
      const currentMsg = TYPING_MESSAGES[msgIndexRef.current];
      const typingSpeed = isDeletingRef.current ? 25 : 55;
      const pauseAfter = isDeletingRef.current ? 300 : 1800;

      if (!isDeletingRef.current) {
        setTypingText(currentMsg.substring(0, charIndexRef.current + 1));
        charIndexRef.current++;
        if (charIndexRef.current === currentMsg.length) {
          isDeletingRef.current = true;
          timeoutId = setTimeout(typeLoop, pauseAfter);
          return;
        }
        timeoutId = setTimeout(typeLoop, typingSpeed);
      } else {
        setTypingText(currentMsg.substring(0, charIndexRef.current - 1));
        charIndexRef.current--;
        if (charIndexRef.current === 0) {
          isDeletingRef.current = false;
          msgIndexRef.current = (msgIndexRef.current + 1) % TYPING_MESSAGES.length;
          timeoutId = setTimeout(typeLoop, 400);
          return;
        }
        timeoutId = setTimeout(typeLoop, typingSpeed);
      }
    };

    const initialTimeout = setTimeout(typeLoop, 1600);
    return () => {
      clearTimeout(initialTimeout);
      clearTimeout(timeoutId);
    };
  }, []);

  // ==================== ZOOM TRANSITION ====================
  const performZoomTransition = (
    url: string,
    sourceElement?: HTMLElement | null
  ) => {
    if (document.documentElement.classList.contains("zooming")) return;

    let clickX = window.innerWidth / 2;
    let clickY = window.innerHeight / 2;
    if (sourceElement) {
      const rect = sourceElement.getBoundingClientRect();
      clickX = rect.left + rect.width / 2;
      clickY = rect.top + rect.height / 2;
    }

    const ripple = document.createElement("div");
    ripple.className = "click-ripple";
    const size = 40;
    ripple.style.width = size + "px";
    ripple.style.height = size + "px";
    ripple.style.left = clickX + "px";
    ripple.style.top = clickY + "px";
    document.body.appendChild(ripple);

    document.documentElement.classList.add("zooming");

    setTimeout(() => {
      window.location.href = url;
    }, 720);
  };

  const handleSiteClick = (
    e: React.MouseEvent<HTMLAnchorElement | HTMLDivElement>,
    url: string = SITE_URL
  ) => {
    e.preventDefault();
    performZoomTransition(url, e.currentTarget as HTMLElement);
  };

  const handleCardClick = (
    e: React.MouseEvent<HTMLDivElement>,
    _movie: Movie
  ) => {
    performZoomTransition(SITE_URL, e.currentTarget);
  };

  // ==================== DRAG TO SCROLL ====================
  const setupSlider = (slider: HTMLDivElement | null) => {
    if (!slider || (slider as any).__setup) return;
    (slider as any).__setup = true;

    let isDown = false;
    let startX = 0;
    let scrollLeft = 0;
    let moved = false;

    slider.addEventListener("mousedown", (e) => {
      isDown = true;
      moved = false;
      slider.style.cursor = "grabbing";
      startX = e.pageX - slider.offsetLeft;
      scrollLeft = slider.scrollLeft;
    });

    slider.addEventListener("mouseleave", () => {
      isDown = false;
      slider.style.cursor = "grab";
    });

    slider.addEventListener("mouseup", () => {
      isDown = false;
      slider.style.cursor = "grab";
    });

    slider.addEventListener("mousemove", (e) => {
      if (!isDown) return;
      e.preventDefault();
      const x = e.pageX - slider.offsetLeft;
      const walk = (x - startX) * 1.6;
      if (Math.abs(walk) > 5) moved = true;
      slider.scrollLeft = scrollLeft - walk;
    });

    slider.addEventListener(
      "click",
      (e) => {
        if (moved) {
          e.preventDefault();
          e.stopPropagation();
        }
      },
      true
    );

    slider.addEventListener(
      "wheel",
      (e) => {
        if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
          e.preventDefault();
          slider.scrollLeft += e.deltaY;
        }
      },
      { passive: false }
    );

    slider.style.cursor = "grab";
  };

  const currentData = SLIDE_DATA[currentSlide];

  // ==================== RENDER ====================
  return (
    <>
      {/* ==================== STYLES ==================== */}
      <style jsx global>{`
        /* ---------- PAGE ZOOM TRANSITION ---------- */
        html.zooming body {
          animation: bodyZoomOut 0.75s cubic-bezier(0.5, 0, 0.75, 0) forwards;
          transform-origin: 50% 45%;
          overflow: hidden;
        }
        @keyframes bodyZoomOut {
          0% {
            transform: scale(1);
            filter: blur(0px) brightness(1);
            opacity: 1;
          }
          60% {
            filter: blur(2px) brightness(1.15);
          }
          100% {
            transform: scale(2.6);
            filter: blur(14px) brightness(1.6);
            opacity: 0;
          }
        }

        .zoom-flash {
          position: fixed;
          inset: 0;
          z-index: 9998;
          pointer-events: none;
          opacity: 0;
          background: radial-gradient(
              circle at 50% 45%,
              rgba(255, 255, 255, 0.9) 0%,
              rgba(0, 213, 99, 0.7) 12%,
              rgba(0, 150, 80, 0.35) 28%,
              transparent 55%
            ),
            radial-gradient(
              circle at 50% 45%,
              rgba(0, 213, 99, 0.6) 0%,
              transparent 60%
            );
          mix-blend-mode: screen;
        }
        html.zooming .zoom-flash {
          animation: zoomFlash 0.75s cubic-bezier(0.4, 0, 0.6, 1) forwards;
        }
        @keyframes zoomFlash {
          0% {
            opacity: 0;
            transform: scale(0.4);
          }
          40% {
            opacity: 1;
            transform: scale(1.1);
          }
          100% {
            opacity: 0;
            transform: scale(2.4);
          }
        }

        .zoom-vignette {
          position: fixed;
          inset: 0;
          z-index: 9997;
          pointer-events: none;
          opacity: 0;
          background: radial-gradient(
            circle at 50% 45%,
            transparent 0%,
            transparent 30%,
            rgba(0, 0, 0, 0.6) 70%,
            #050810 100%
          );
        }
        html.zooming .zoom-vignette {
          animation: vignetteClose 0.75s cubic-bezier(0.4, 0, 0.6, 1) forwards;
        }
        @keyframes vignetteClose {
          0% {
            opacity: 0;
          }
          100% {
            opacity: 1;
          }
        }

        .click-ripple {
          position: fixed;
          z-index: 9999;
          pointer-events: none;
          border-radius: 50%;
          background: radial-gradient(
            circle,
            rgba(0, 213, 99, 0.7) 0%,
            rgba(0, 213, 99, 0.3) 40%,
            transparent 70%
          );
          transform: translate(-50%, -50%) scale(0);
          animation: rippleExpand 0.7s cubic-bezier(0.3, 0, 0.7, 0) forwards;
          mix-blend-mode: screen;
        }
        @keyframes rippleExpand {
          0% {
            transform: translate(-50%, -50%) scale(0);
            opacity: 1;
          }
          100% {
            transform: translate(-50%, -50%) scale(18);
            opacity: 0;
          }
        }

        /* ---------- SCROLL REVEAL ---------- */
        .reveal {
          opacity: 0;
          transform: translateY(40px);
          transition: opacity 1s cubic-bezier(0.2, 0.8, 0.2, 1),
            transform 1s cubic-bezier(0.2, 0.8, 0.2, 1);
        }
        .reveal.visible {
          opacity: 1;
          transform: translateY(0);
        }
        .reveal-delay-1 {
          transition-delay: 0.12s;
        }
        .reveal-delay-2 {
          transition-delay: 0.22s;
        }
        .reveal-delay-3 {
          transition-delay: 0.32s;
        }
        .reveal-delay-4 {
          transition-delay: 0.42s;
        }

        /* ---------- NAV ---------- */
        .mv-nav {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          z-index: 100;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 18px 4%;
          background: linear-gradient(
            180deg,
            rgba(0, 0, 0, 0.85) 0%,
            rgba(0, 0, 0, 0) 100%
          );
          transition: background 0.4s ease, backdrop-filter 0.4s ease;
        }
        .mv-nav.scrolled {
          background: rgba(11, 11, 15, 0.92);
          backdrop-filter: blur(14px);
          -webkit-backdrop-filter: blur(14px);
          box-shadow: 0 4px 24px rgba(0, 0, 0, 0.6);
        }
        .mv-nav-left {
          display: flex;
          align-items: center;
          gap: 40px;
        }
        .mv-brand {
          font-family: "Bebas Neue", sans-serif;
          font-size: 30px;
          letter-spacing: 1.5px;
          display: flex;
          align-items: baseline;
          gap: 2px;
          user-select: none;
          line-height: 1;
        }
        .mv-brand .mv-text {
          color: #ffffff;
          text-shadow: 0 0 24px rgba(255, 255, 255, 0.15);
        }
        .mv-brand .bd-text {
          background: linear-gradient(
            135deg,
            #00d563 0%,
            #22c55e 45%,
            #86efac 100%
          );
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
          font-weight: 900;
          filter: drop-shadow(0 0 12px rgba(0, 213, 99, 0.55));
        }
        .mv-brand small {
          font-family: "Inter", sans-serif;
          font-size: 9px;
          color: #a3a3ad;
          letter-spacing: 3px;
          font-weight: 600;
          margin-left: 4px;
        }
        .mv-nav-links {
          display: flex;
          gap: 26px;
          font-size: 14px;
          color: #e5e5e5;
          font-weight: 500;
        }
        .mv-nav-links a {
          color: inherit;
          text-decoration: none;
          transition: color 0.25s ease;
        }
        .mv-nav-links a:hover {
          color: #fff;
        }
        .mv-nav-links a.active {
          color: #fff;
          font-weight: 600;
        }
        .mv-nav-right {
          display: flex;
          align-items: center;
          gap: 18px;
        }
        .nav-cta {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 10px 20px;
          background: linear-gradient(
            135deg,
            #0d3320 0%,
            #145a35 45%,
            #0a8a3e 100%
          );
          color: #fff;
          border: none;
          border-radius: 8px;
          font-family: inherit;
          font-weight: 800;
          font-size: 13px;
          cursor: pointer;
          text-decoration: none;
          transition: all 0.3s ease;
          box-shadow: 0 4px 18px rgba(0, 80, 40, 0.6),
            inset 0 1px 0 rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(0, 213, 99, 0.35);
        }
        .nav-cta:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 30px rgba(0, 120, 60, 0.7),
            inset 0 1px 0 rgba(255, 255, 255, 0.15);
          border-color: rgba(0, 213, 99, 0.7);
        }
        .nav-cta svg {
          width: 14px;
          height: 14px;
        }

        /* ---------- HERO ---------- */
        .mv-hero {
          position: relative;
          height: 92vh;
          min-height: 620px;
          width: 100%;
          overflow: hidden;
        }
        .mv-hero-slide {
          position: absolute;
          inset: 0;
          opacity: 0;
          background-size: cover;
          background-position: center;
          transform: scale(1.06);
          transition: opacity 1.4s cubic-bezier(0.4, 0, 0.2, 1),
            transform 6s ease-out;
        }
        .mv-hero-slide.active {
          opacity: 1;
          transform: scale(1);
        }
        .mv-hero-slide::after {
          content: "";
          position: absolute;
          inset: 0;
          background: linear-gradient(
              to top,
              #0b0b0f 0%,
              rgba(11, 11, 15, 0.75) 18%,
              rgba(11, 11, 15, 0.35) 55%,
              rgba(11, 11, 15, 0.75) 100%
            ),
            linear-gradient(
              to right,
              rgba(11, 11, 15, 0.88) 0%,
              rgba(11, 11, 15, 0.4) 45%,
              transparent 75%
            );
        }
        .mv-hero-content {
          position: absolute;
          left: 4%;
          bottom: 22%;
          max-width: 640px;
          z-index: 3;
          padding-right: 24px;
        }

        .hero-tag {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          font-size: 12px;
          letter-spacing: 2.5px;
          font-weight: 700;
          color: #fff;
          margin-bottom: 16px;
        }
        .hero-tag .mv-logo {
          font-family: "Bebas Neue", sans-serif;
          color: #00d563;
          font-size: 16px;
          letter-spacing: 2px;
        }
        .hero-tag .divider {
          width: 1px;
          height: 12px;
          background: rgba(255, 255, 255, 0.4);
        }
        .hero-tag .cat {
          color: #a3a3ad;
          font-size: 11px;
        }

        .hero-title {
          font-family: "Bebas Neue", sans-serif;
          font-size: clamp(48px, 7vw, 96px);
          line-height: 0.9;
          letter-spacing: 2px;
          margin-bottom: 18px;
          text-transform: uppercase;
          text-shadow: 0 4px 30px rgba(0, 0, 0, 0.8);
          color: #fff;
          font-weight: 400;
        }
        .hero-title .line {
          display: block;
          overflow: hidden;
        }
        .hero-title .line > span {
          display: inline-block;
          transform: translateY(105%);
          opacity: 0;
        }

        .hero-meta {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 20px;
          font-size: 13px;
          color: #d1d1d1;
          flex-wrap: wrap;
          opacity: 0;
        }
        .hero-meta .imdb {
          color: #ffc107;
          font-weight: 700;
          letter-spacing: 0.5px;
        }
        .hero-meta .chip {
          padding: 2px 8px;
          border: 1px solid rgba(255, 255, 255, 0.3);
          border-radius: 2px;
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.5px;
        }
        .hero-meta .chip.hd {
          border-color: #00d563;
          color: #00d563;
        }
        .hero-meta .chip.uahd {
          border-color: #ffc107;
          color: #ffc107;
        }

        .hero-desc {
          font-size: 15px;
          line-height: 1.55;
          color: #d1d1d1;
          max-width: 540px;
          margin-bottom: 32px;
          text-shadow: 0 2px 8px rgba(0, 0, 0, 0.6);
          opacity: 0;
        }

        .hero-tag.animate,
        .hero-meta.animate,
        .hero-desc.animate,
        .hero-title.animate .line > span {
          animation: riseUp 0.8s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
        }
        .hero-tag.animate {
          animation-delay: 0.1s;
        }
        .hero-title.animate .line:nth-child(1) > span {
          animation-delay: 0.2s;
        }
        .hero-title.animate .line:nth-child(2) > span {
          animation-delay: 0.35s;
        }
        .hero-meta.animate {
          animation-delay: 0.5s;
        }
        .hero-desc.animate {
          animation-delay: 0.65s;
        }
        @keyframes riseUp {
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }

        /* ---------- STATIC ACTIONS ---------- */
        .hero-actions {
          display: flex;
          gap: 16px;
          align-items: center;
          flex-wrap: wrap;
        }

        .btn-site-main {
          position: relative;
          display: inline-flex;
          align-items: center;
          gap: 12px;
          padding: 18px 42px;
          background: linear-gradient(
            135deg,
            #052e16 0%,
            #0a4a26 35%,
            #0e7038 70%,
            #0a8a3e 100%
          );
          color: #ffffff;
          border: 1px solid rgba(0, 213, 99, 0.35);
          border-radius: 999px;
          font-family: inherit;
          font-weight: 800;
          font-size: 17px;
          letter-spacing: 0.3px;
          cursor: pointer;
          text-decoration: none;
          transition: all 0.35s cubic-bezier(0.2, 0.8, 0.2, 1);
          box-shadow: 0 12px 45px rgba(0, 80, 40, 0.7),
            0 4px 14px rgba(0, 80, 40, 0.5),
            inset 0 1px 0 rgba(255, 255, 255, 0.12),
            inset 0 -8px 20px rgba(0, 0, 0, 0.35);
          overflow: hidden;
          animation: darkGreenPulse 2.8s ease-in-out infinite;
          isolation: isolate;
        }
        @keyframes darkGreenPulse {
          0%,
          100% {
            box-shadow: 0 12px 45px rgba(0, 80, 40, 0.7),
              0 4px 14px rgba(0, 80, 40, 0.5), 0 0 0 0 rgba(0, 213, 99, 0.5),
              inset 0 1px 0 rgba(255, 255, 255, 0.12),
              inset 0 -8px 20px rgba(0, 0, 0, 0.35);
          }
          50% {
            box-shadow: 0 12px 45px rgba(0, 140, 60, 0.9),
              0 4px 14px rgba(0, 140, 60, 0.6), 0 0 0 22px rgba(0, 213, 99, 0),
              inset 0 1px 0 rgba(255, 255, 255, 0.15),
              inset 0 -8px 20px rgba(0, 0, 0, 0.35);
          }
        }
        .btn-site-main::before {
          content: "";
          position: absolute;
          top: 0;
          left: -130%;
          width: 90%;
          height: 100%;
          background: linear-gradient(
            90deg,
            transparent 0%,
            rgba(120, 255, 180, 0.12) 40%,
            rgba(180, 255, 210, 0.32) 50%,
            rgba(120, 255, 180, 0.12) 60%,
            transparent 100%
          );
          transform: skewX(-22deg);
          animation: darkSweep 3.4s cubic-bezier(0.4, 0, 0.2, 1) infinite;
          z-index: 1;
          pointer-events: none;
        }
        @keyframes darkSweep {
          0% {
            left: -130%;
          }
          60% {
            left: 130%;
          }
          100% {
            left: 130%;
          }
        }
        .btn-site-main::after {
          content: "";
          position: absolute;
          inset: 1px;
          border-radius: 999px;
          background: radial-gradient(
            circle at 50% 120%,
            rgba(0, 213, 99, 0.4) 0%,
            transparent 60%
          );
          opacity: 0;
          transition: opacity 0.4s ease;
          z-index: 0;
          pointer-events: none;
        }
        .btn-site-main:hover::after {
          opacity: 1;
        }
        .btn-site-main .arrow {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: rgba(0, 213, 99, 0.25);
          border: 1px solid rgba(0, 213, 99, 0.5);
          transition: transform 0.35s cubic-bezier(0.2, 0.8, 0.2, 1),
            background 0.3s ease;
          z-index: 2;
          position: relative;
        }
        .btn-site-main .arrow svg {
          width: 14px;
          height: 14px;
          stroke-width: 3;
          animation: arrowSlide 1.6s ease-in-out infinite;
        }
        @keyframes arrowSlide {
          0%,
          100% {
            transform: translateX(0);
          }
          50% {
            transform: translateX(4px);
          }
        }
        .btn-site-main .label {
          z-index: 2;
          position: relative;
          text-shadow: 0 2px 8px rgba(0, 0, 0, 0.6);
        }
        .btn-site-main:hover {
          transform: translateY(-4px) scale(1.04);
          border-color: rgba(0, 213, 99, 0.9);
          box-shadow: 0 24px 60px rgba(0, 140, 60, 1),
            0 8px 24px rgba(0, 120, 50, 0.7), 0 0 0 12px rgba(0, 213, 99, 0.12),
            inset 0 1px 0 rgba(255, 255, 255, 0.2),
            inset 0 -8px 20px rgba(0, 0, 0, 0.3);
        }
        .btn-site-main:hover .arrow {
          background: #ffffff;
          transform: rotate(-45deg) scale(1.1);
        }
        .btn-site-main:hover .arrow svg {
          stroke: #0a4a26;
          animation: none;
        }
        .btn-site-main:active {
          transform: translateY(-2px) scale(1.02);
        }

        /* Typing hint */
        .site-hint {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-top: 20px;
          font-size: 13.5px;
          color: rgba(255, 255, 255, 0.85);
          font-weight: 500;
          min-height: 22px;
        }
        .site-hint .check-icon {
          width: 16px;
          height: 16px;
          flex-shrink: 0;
          color: #00d563;
          filter: drop-shadow(0 0 8px rgba(0, 213, 99, 0.6));
        }
        .site-hint .typing-text {
          color: rgba(255, 255, 255, 0.85);
          letter-spacing: 0.2px;
        }
        .site-hint .caret {
          display: inline-block;
          width: 2px;
          height: 16px;
          background: #00d563;
          margin-left: 2px;
          vertical-align: middle;
          animation: caretBlink 0.85s step-end infinite;
          box-shadow: 0 0 8px #00d563;
        }
        @keyframes caretBlink {
          50% {
            opacity: 0;
          }
        }

        .btn-icon-round {
          width: 52px;
          height: 52px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.08);
          border: 1.5px solid rgba(255, 255, 255, 0.35);
          display: grid;
          place-items: center;
          cursor: pointer;
          transition: all 0.25s ease;
          color: #fff;
          backdrop-filter: blur(6px);
        }
        .btn-icon-round:hover {
          background: rgba(255, 255, 255, 0.18);
          border-color: #fff;
          transform: scale(1.08);
        }

        .hero-indicator {
          position: absolute;
          right: 4%;
          bottom: 24%;
          display: flex;
          gap: 6px;
          z-index: 4;
          flex-wrap: wrap;
          max-width: 220px;
          justify-content: flex-end;
        }
        .dot {
          width: 22px;
          height: 3px;
          background: rgba(255, 255, 255, 0.3);
          border-radius: 2px;
          cursor: pointer;
          transition: all 0.4s ease;
          position: relative;
          overflow: hidden;
        }
        .dot.active {
          background: #e50914;
          width: 40px;
        }
        .dot.active::after {
          content: "";
          position: absolute;
          inset: 0;
          background: #ff2d55;
          transform-origin: left;
          animation: dotFill 4.5s linear;
        }
        @keyframes dotFill {
          from {
            transform: scaleX(0);
          }
          to {
            transform: scaleX(1);
          }
        }

        .hero-rating {
          position: absolute;
          right: 4%;
          bottom: 24%;
          z-index: 3;
          transform: translateY(48px);
        }
        .hero-rating .age {
          border-left: 3px solid #fff;
          padding: 4px 12px;
          font-size: 14px;
          background: rgba(0, 0, 0, 0.4);
          letter-spacing: 1px;
          color: #fff;
        }

        /* ---------- STEPS BAR ---------- */
        .steps-bar {
          position: relative;
          z-index: 5;
          margin: -50px auto 0;
          max-width: 1200px;
          padding: 22px 26px;
          background: linear-gradient(
            135deg,
            rgba(0, 213, 99, 0.12),
            rgba(34, 158, 217, 0.06)
          );
          border: 1px solid rgba(0, 213, 99, 0.35);
          border-radius: 16px;
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 22px;
          backdrop-filter: blur(14px);
          -webkit-backdrop-filter: blur(14px);
        }
        .step-item {
          display: flex;
          align-items: center;
          gap: 14px;
        }
        .step-item .num-badge {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: linear-gradient(135deg, #0d3320, #0a8a3e);
          color: #fff;
          font-weight: 800;
          font-size: 16px;
          display: grid;
          place-items: center;
          flex-shrink: 0;
          box-shadow: 0 6px 20px rgba(0, 80, 40, 0.6);
          border: 1px solid rgba(0, 213, 99, 0.4);
        }
        .step-item .text strong {
          display: block;
          font-size: 14px;
          font-weight: 700;
          color: #fff;
          margin-bottom: 2px;
        }
        .step-item .text span {
          font-size: 12.5px;
          color: #a3a3ad;
          line-height: 1.4;
        }

        /* ---------- SECTION HEADS ---------- */
        .section-head {
          max-width: 760px;
          margin: 0 auto 60px;
          text-align: center;
          padding: 0 4%;
        }
        .section-head .kicker {
          display: inline-block;
          font-size: 11px;
          letter-spacing: 4px;
          font-weight: 700;
          color: #00d563;
          margin-bottom: 18px;
          padding: 6px 14px;
          background: rgba(0, 213, 99, 0.08);
          border: 1px solid rgba(0, 213, 99, 0.25);
          border-radius: 999px;
        }
        .section-head h2 {
          font-family: "Bebas Neue", sans-serif;
          font-size: clamp(36px, 5vw, 64px);
          line-height: 1.05;
          letter-spacing: 1px;
          margin-bottom: 16px;
          color: #fff;
          font-weight: 400;
        }
        .section-head h2 .accent {
          background: linear-gradient(135deg, #00d563, #86efac);
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
        }
        .section-head p {
          font-size: 16px;
          color: #a3a3ad;
          line-height: 1.6;
        }

        /* ---------- FEATURES ---------- */
        .mv-section {
          padding: 100px 4%;
          position: relative;
        }
        .features {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
          gap: 22px;
          max-width: 1200px;
          margin: 0 auto;
        }
        .feature-card {
          padding: 32px 26px;
          background: linear-gradient(
            160deg,
            rgba(255, 255, 255, 0.04),
            rgba(255, 255, 255, 0.01)
          );
          border: 1px solid rgba(255, 255, 255, 0.07);
          border-radius: 16px;
          transition: all 0.4s cubic-bezier(0.2, 0.8, 0.2, 1);
        }
        .feature-card:hover {
          transform: translateY(-8px);
          border-color: rgba(0, 213, 99, 0.3);
          background: linear-gradient(
            160deg,
            rgba(0, 213, 99, 0.05),
            rgba(255, 255, 255, 0.02)
          );
          box-shadow: 0 20px 50px rgba(0, 0, 0, 0.5);
        }
        .feature-card .icon {
          width: 52px;
          height: 52px;
          border-radius: 14px;
          background: linear-gradient(
            135deg,
            rgba(0, 213, 99, 0.2),
            rgba(34, 158, 217, 0.15)
          );
          border: 1px solid rgba(0, 213, 99, 0.3);
          display: grid;
          place-items: center;
          margin-bottom: 20px;
          color: #00d563;
          font-weight: 800;
          font-size: 18px;
        }
        .feature-card .icon svg {
          width: 24px;
          height: 24px;
        }
        .feature-card h3 {
          font-size: 17px;
          font-weight: 700;
          margin-bottom: 10px;
          color: #fff;
        }
        .feature-card p {
          font-size: 13.5px;
          color: #a3a3ad;
          line-height: 1.6;
        }

        /* ---------- ROWS ---------- */
        .row {
          position: relative;
          padding: 20px 0 40px;
          z-index: 5;
        }
        .row-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 4%;
          margin-bottom: 14px;
        }
        .row-head h2 {
          font-size: 22px;
          font-weight: 700;
          letter-spacing: -0.3px;
          display: flex;
          align-items: center;
          gap: 10px;
          color: #fff;
        }
        .row-head h2 .badge-genre {
          font-size: 10px;
          letter-spacing: 2px;
          padding: 3px 8px;
          background: #e50914;
          border-radius: 3px;
          font-weight: 800;
        }
        .row-head .see-all {
          font-size: 13px;
          color: #a3a3ad;
          font-weight: 600;
          cursor: pointer;
          transition: color 0.25s ease;
          display: flex;
          align-items: center;
          gap: 6px;
          text-decoration: none;
          background: none;
          border: none;
          font-family: inherit;
        }
        .row-head .see-all:hover {
          color: #fff;
        }
        .row-head .see-all:hover svg {
          transform: translateX(3px);
        }
        .row-head .see-all svg {
          width: 14px;
          height: 14px;
          transition: transform 0.25s ease;
        }
        .slider-wrap {
          position: relative;
          padding: 0 4%;
        }
        .mv-slider {
          display: flex;
          gap: 14px;
          overflow-x: auto;
          overflow-y: visible;
          scroll-behavior: smooth;
          padding: 40px 0 60px;
          scrollbar-width: none;
        }
        .mv-slider::-webkit-scrollbar {
          display: none;
        }

        .card {
          flex: 0 0 auto;
          width: 200px;
          position: relative;
          cursor: pointer;
          transition: transform 0.4s cubic-bezier(0.2, 0.8, 0.2, 1);
        }
        .card-poster {
          width: 100%;
          aspect-ratio: 2/3;
          border-radius: 10px;
          overflow: hidden;
          position: relative;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.6);
          transition: all 0.4s cubic-bezier(0.2, 0.8, 0.2, 1);
          background: #131826;
        }
        .card-poster img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
          transition: transform 0.6s cubic-bezier(0.2, 0.8, 0.2, 1);
        }
        .card:hover .card-poster img {
          transform: scale(1.08);
        }
        .card-poster::after {
          content: "";
          position: absolute;
          inset: 0;
          background: linear-gradient(
            to top,
            rgba(0, 0, 0, 0.85) 0%,
            rgba(0, 0, 0, 0.15) 40%,
            transparent 65%
          );
          pointer-events: none;
          z-index: 1;
        }
        .card-poster .play-overlay {
          position: absolute;
          inset: 0;
          display: grid;
          place-items: center;
          background: rgba(0, 0, 0, 0.35);
          opacity: 0;
          transition: opacity 0.35s ease;
          z-index: 3;
        }
        .card:hover .card-poster .play-overlay {
          opacity: 1;
        }
        .play-overlay .play-circle {
          width: 56px;
          height: 56px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.95);
          display: grid;
          place-items: center;
          box-shadow: 0 0 30px rgba(255, 255, 255, 0.5);
          transform: scale(0.7);
          transition: transform 0.35s cubic-bezier(0.2, 0.8, 0.2, 1);
        }
        .card:hover .play-overlay .play-circle {
          transform: scale(1);
        }
        .play-circle svg {
          width: 24px;
          height: 24px;
          fill: #000;
          margin-left: 3px;
        }
        .top10-badge {
          position: absolute;
          top: 8px;
          left: 8px;
          background: #e50914;
          color: #fff;
          font-size: 10px;
          font-weight: 900;
          letter-spacing: 1.5px;
          padding: 3px 8px;
          border-radius: 3px;
          z-index: 4;
          box-shadow: 0 4px 12px rgba(229, 9, 20, 0.5);
        }
        .new-badge {
          position: absolute;
          top: 8px;
          left: 8px;
          background: linear-gradient(135deg, #ffc107, #ff9500);
          color: #000;
          font-size: 10px;
          font-weight: 900;
          letter-spacing: 1.5px;
          padding: 3px 8px;
          border-radius: 3px;
          z-index: 4;
          box-shadow: 0 4px 12px rgba(255, 193, 7, 0.5);
        }
        .hd-badge {
          position: absolute;
          top: 8px;
          right: 8px;
          background: rgba(0, 0, 0, 0.7);
          border: 1px solid rgba(255, 255, 255, 0.4);
          color: #fff;
          font-size: 9px;
          font-weight: 800;
          letter-spacing: 1px;
          padding: 3px 6px;
          border-radius: 3px;
          z-index: 4;
          backdrop-filter: blur(6px);
        }
        .card-title-overlay {
          position: absolute;
          left: 10px;
          right: 10px;
          bottom: 10px;
          z-index: 2;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .card-title-overlay .title-line {
          font-size: 13px;
          font-weight: 700;
          color: #fff;
          line-height: 1.2;
          text-shadow: 0 2px 6px rgba(0, 0, 0, 0.9);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .card-title-overlay .meta-line {
          font-size: 11px;
          color: rgba(255, 255, 255, 0.75);
          display: flex;
          gap: 8px;
          align-items: center;
          font-weight: 500;
        }
        .card-title-overlay .meta-line .star {
          color: #ffc107;
          font-weight: 700;
        }
        .card:hover {
          transform: scale(1.08) translateY(-8px);
          z-index: 20;
        }
        .card:hover .card-poster {
          box-shadow: 0 24px 60px rgba(0, 0, 0, 0.9),
            0 0 0 1.5px rgba(0, 213, 99, 0.4);
        }

        /* ---------- BIG CTA ---------- */
        .big-cta {
          margin: 60px 4% 80px;
          padding: 80px 40px;
          border-radius: 24px;
          background: radial-gradient(
              ellipse at 20% 30%,
              rgba(0, 213, 99, 0.15),
              transparent 50%
            ),
            radial-gradient(
              ellipse at 80% 70%,
              rgba(34, 158, 217, 0.1),
              transparent 50%
            ),
            linear-gradient(135deg, #0d0d14 0%, #0a1810 100%);
          border: 1px solid rgba(0, 213, 99, 0.15);
          text-align: center;
          position: relative;
          overflow: hidden;
        }
        .big-cta h2 {
          font-family: "Bebas Neue", sans-serif;
          font-size: clamp(40px, 5.5vw, 76px);
          line-height: 1;
          letter-spacing: 1px;
          margin-bottom: 20px;
          position: relative;
          color: #fff;
          font-weight: 400;
        }
        .big-cta h2 .accent {
          background: linear-gradient(135deg, #00d563, #86efac);
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
          filter: drop-shadow(0 0 20px rgba(0, 213, 99, 0.4));
        }
        .big-cta p {
          font-size: 16px;
          color: #a3a3ad;
          max-width: 620px;
          margin: 0 auto 40px;
          line-height: 1.6;
          position: relative;
        }
        .big-cta .cta-buttons {
          display: flex;
          gap: 18px;
          justify-content: center;
          flex-wrap: wrap;
          position: relative;
          align-items: center;
        }

        /* ---------- FOOTER ---------- */
        .mv-footer {
          position: relative;
          padding: 90px 4% 30px;
          background: radial-gradient(
              ellipse at 50% 0%,
              rgba(0, 213, 99, 0.06),
              transparent 60%
            ),
            linear-gradient(180deg, #08080b 0%, #050508 100%);
          border-top: 1px solid rgba(255, 255, 255, 0.06);
          color: #a3a3ad;
          font-size: 13px;
          overflow: hidden;
        }
        .mv-footer::before {
          content: "";
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 1px;
          background: linear-gradient(
            90deg,
            transparent,
            rgba(0, 213, 99, 0.6),
            rgba(34, 158, 217, 0.6),
            transparent
          );
        }
        .foot-top {
          display: grid;
          grid-template-columns: 1.4fr repeat(4, 1fr);
          gap: 40px;
          max-width: 1400px;
          margin: 0 auto 60px;
        }
        .foot-brand {
          padding-right: 30px;
        }
        .foot-brand .brand-lg {
          font-family: "Bebas Neue", sans-serif;
          font-size: 36px;
          letter-spacing: 2px;
          display: flex;
          align-items: baseline;
          gap: 2px;
          margin-bottom: 18px;
          line-height: 1;
        }
        .foot-brand .brand-lg .mv-text {
          color: #fff;
        }
        .foot-brand .brand-lg .bd-text {
          background: linear-gradient(
            135deg,
            #00d563 0%,
            #22c55e 45%,
            #86efac 100%
          );
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
          filter: drop-shadow(0 0 12px rgba(0, 213, 99, 0.5));
        }
        .foot-brand p {
          font-size: 13px;
          line-height: 1.7;
          margin-bottom: 22px;
          max-width: 340px;
        }
        .foot-brand .social-row {
          display: flex;
          gap: 10px;
        }
        .foot-brand .social-row a {
          width: 38px;
          height: 38px;
          border-radius: 10px;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.08);
          display: grid;
          place-items: center;
          color: #a3a3ad;
          transition: all 0.3s ease;
          text-decoration: none;
        }
        .foot-brand .social-row a:hover {
          color: #fff;
          background: linear-gradient(
            135deg,
            rgba(0, 213, 99, 0.2),
            rgba(34, 158, 217, 0.2)
          );
          border-color: rgba(0, 213, 99, 0.5);
          transform: translateY(-3px);
        }
        .foot-brand .social-row a svg {
          width: 16px;
          height: 16px;
        }
        .foot-col h5 {
          font-size: 13px;
          color: #fff;
          font-weight: 700;
          margin-bottom: 20px;
          letter-spacing: 0.3px;
          text-transform: uppercase;
        }
        .foot-col a {
          display: block;
          color: #a3a3ad;
          text-decoration: none;
          margin-bottom: 12px;
          font-size: 12.5px;
          transition: all 0.25s ease;
          position: relative;
        }
        .foot-col a:hover {
          color: #fff;
          padding-left: 6px;
        }
        .foot-col a:hover::before {
          content: "→";
          position: absolute;
          left: -10px;
          color: #00d563;
          font-size: 12px;
        }
        .foot-newsletter {
          max-width: 1400px;
          margin: 0 auto 60px;
          padding: 32px 36px;
          background: linear-gradient(
            135deg,
            rgba(255, 255, 255, 0.04),
            rgba(255, 255, 255, 0.01)
          );
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 18px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 30px;
          flex-wrap: wrap;
          position: relative;
          overflow: hidden;
        }
        .foot-newsletter::before {
          content: "";
          position: absolute;
          inset: 0;
          background: radial-gradient(
            circle at 80% 50%,
            rgba(0, 213, 99, 0.1),
            transparent 50%
          );
          pointer-events: none;
        }
        .foot-newsletter div h4 {
          font-size: 18px;
          font-weight: 700;
          color: #fff;
          margin-bottom: 6px;
          position: relative;
        }
        .foot-newsletter div p {
          font-size: 13px;
          color: #a3a3ad;
          position: relative;
        }
        .foot-newsletter form {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
          position: relative;
        }
        .foot-newsletter input {
          background: rgba(0, 0, 0, 0.5);
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 10px;
          padding: 12px 18px;
          color: #fff;
          font-family: inherit;
          font-size: 13.5px;
          width: 260px;
          outline: none;
          transition: border-color 0.3s ease;
        }
        .foot-newsletter input:focus {
          border-color: #00d563;
        }
        .foot-newsletter button {
          background: linear-gradient(135deg, #0d3320, #0a8a3e);
          color: #fff;
          border: 1px solid rgba(0, 213, 99, 0.4);
          padding: 12px 26px;
          border-radius: 10px;
          font-family: inherit;
          font-weight: 700;
          font-size: 13.5px;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 6px 20px rgba(0, 80, 40, 0.5);
        }
        .foot-newsletter button:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 30px rgba(0, 120, 60, 0.7);
          border-color: rgba(0, 213, 99, 0.8);
        }
        .foot-bottom {
          max-width: 1400px;
          margin: 0 auto;
          padding-top: 32px;
          border-top: 1px solid rgba(255, 255, 255, 0.06);
          display: flex;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 20px;
          font-size: 12px;
          align-items: center;
        }
        .foot-bottom .legal {
          display: flex;
          gap: 22px;
          flex-wrap: wrap;
        }
        .foot-bottom .legal a {
          color: #a3a3ad;
          text-decoration: none;
          transition: color 0.25s ease;
        }
        .foot-bottom .legal a:hover {
          color: #fff;
        }
        .foot-bottom .made-with {
          display: flex;
          align-items: center;
          gap: 6px;
          color: #a3a3ad;
        }
        .foot-bottom .made-with .heart {
          color: #e50914;
          animation: heartbeat 1.6s ease-in-out infinite;
          display: inline-block;
        }
        @keyframes heartbeat {
          0%,
          100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.25);
          }
        }

        /* ---------- RESPONSIVE ---------- */
        @media (max-width: 1000px) {
          .foot-top {
            grid-template-columns: 1fr 1fr;
            gap: 32px;
          }
          .foot-brand {
            grid-column: 1 / -1;
            padding-right: 0;
          }
          .steps-bar {
            grid-template-columns: 1fr;
          }
        }
        @media (max-width: 900px) {
          .mv-nav-links {
            display: none;
          }
          .mv-hero-content {
            bottom: 15%;
          }
          .hero-indicator,
          .hero-rating {
            bottom: 12%;
          }
          .hero-indicator {
            max-width: 160px;
          }
        }
        @media (max-width: 600px) {
          .mv-brand {
            font-size: 24px;
          }
          .mv-brand small {
            display: none;
          }
          .card {
            width: 150px;
          }
          .row {
            margin-top: 0;
          }
          .mv-hero {
            height: 82vh;
            min-height: 540px;
          }
          .mv-hero-content {
            bottom: 10%;
          }
          .hero-rating {
            display: none;
          }
          .foot-top {
            grid-template-columns: 1fr;
          }
          .foot-newsletter {
            padding: 24px;
          }
          .foot-newsletter input {
            width: 100%;
          }
          .steps-bar {
            margin: -30px 16px 0;
            padding: 18px;
          }
          .big-cta {
            padding: 50px 24px;
          }
          .btn-site-main {
            padding: 15px 32px;
            font-size: 15px;
          }
          .nav-cta {
            padding: 8px 14px;
            font-size: 12px;
          }
        }
      `}</style>

      {/* ==================== TRANSITION OVERLAYS ==================== */}
      <div className="zoom-vignette" />
      <div className="zoom-flash" />

      {/* ==================== NAV ==================== */}
      <nav className={`mv-nav ${isScrolled ? "scrolled" : ""}`}>
        <div className="mv-nav-left">
          <div className="mv-brand">
            <span className="mv-text">MoviesVerse</span>
            <span className="bd-text">BD</span>
            <small>STREAM</small>
          </div>
          <div className="mv-nav-links">
            <a href="#" className="active">
              Home
            </a>
            <a href="#trending">Trending</a>
            <a href="#top10">Top 10</a>
            <a href="#new">New</a>
            <a href="#how">How It Works</a>
          </div>
        </div>
        <div className="mv-nav-right">
          <a
            href={SITE_URL}
            className="nav-cta"
            onClick={(e) => handleSiteClick(e, SITE_URL)}
          >
            <span>Visit Main Site</span>
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M5 12h14M13 5l7 7-7 7" />
            </svg>
          </a>
        </div>
      </nav>

      {/* ==================== HERO ==================== */}
      <section className="mv-hero">
        <div>
          {SLIDE_DATA.map((slide, i) => (
            <div
              key={i}
              className={`mv-hero-slide ${currentSlide === i ? "active" : ""}`}
              style={{
                backgroundImage: `
                  linear-gradient(to top, #0b0b0f 0%, rgba(11,11,15,0.75) 18%, rgba(11,11,15,0.35) 55%, rgba(11,11,15,0.75) 100%),
                  linear-gradient(to right, rgba(11,11,15,0.88) 0%, rgba(11,11,15,0.4) 45%, transparent 75%),
                  url('${POSTERS[i]}')
                `,
                backgroundSize: "cover, cover, cover",
                backgroundPosition: "center, center, center 20%",
              }}
            />
          ))}
        </div>

        <div className="mv-hero-content">
          {/* DYNAMIC — changes with slide */}
          <div className={`hero-tag ${heroAnimating ? "animate" : ""}`}>
            <span className="mv-logo">MV</span>
            <span className="divider" />
            <span>{currentData.tag}</span>
            <span className="divider" />
            <span className="cat">{currentData.cat}</span>
          </div>

          <h1 className={`hero-title ${heroAnimating ? "animate" : ""}`}>
            <span className="line">
              <span>{currentData.title[0]}</span>
            </span>
            <span className="line">
              <span>{currentData.title[1]}</span>
            </span>
          </h1>

          <div className={`hero-meta ${heroAnimating ? "animate" : ""}`}>
            <span className="imdb">IMDb {currentData.imdb}</span>
            <span>{currentData.year}</span>
            <span>·</span>
            <span>{currentData.extra}</span>
            <span className="chip hd">HD</span>
            <span className="chip uahd">4K UHD</span>
          </div>

          <p className={`hero-desc ${heroAnimating ? "animate" : ""}`}>
            {currentData.desc}
          </p>

          {/* STATIC — never re-animates */}
          <div className="hero-actions">
            <a
              href={SITE_URL}
              className="btn-site-main"
              onClick={(e) => handleSiteClick(e, SITE_URL)}
            >
              <span className="label">Visit Main Site</span>
              <span className="arrow">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M5 12h14M13 5l7 7-7 7" />
                </svg>
              </span>
            </a>

            <button className="btn-icon-round" aria-label="More info">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                width="20"
                height="20"
              >
                <circle cx="12" cy="12" r="10" />
                <path d="M12 16v-4M12 8h.01" />
              </svg>
            </button>
          </div>

          {/* Typing hint */}
          <div className="site-hint">
            <svg
              className="check-icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m9 12 2 2 4-4" />
              <circle cx="12" cy="12" r="10" />
            </svg>
            <span className="typing-text">{typingText}</span>
            <span className="caret" />
          </div>
        </div>

        <div className="hero-rating">
          <span className="age">16+</span>
        </div>

        <div className="hero-indicator">
          {SLIDE_DATA.map((_, i) => (
            <div
              key={i}
              className={`dot ${currentSlide === i ? "active" : ""}`}
              onClick={() => {
                goToSlide(i);
                if (slideTimerRef.current) clearInterval(slideTimerRef.current);
                slideTimerRef.current = setInterval(() => {
                  setCurrentSlide((prev) => {
                    const next = (prev + 1) % SLIDE_DATA.length;
                    setHeroAnimating(false);
                    requestAnimationFrame(() => {
                      requestAnimationFrame(() => setHeroAnimating(true));
                    });
                    return next;
                  });
                }, 4500);
              }}
            />
          ))}
        </div>
      </section>

      {/* ==================== STEPS BAR ==================== */}
      <div className="steps-bar reveal">
        <div className="step-item">
          <div className="num-badge">1</div>
          <div className="text">
            <strong>Click &quot;Visit Main Site&quot;</strong>
            <span>The green button takes you to our official website</span>
          </div>
        </div>
        <div className="step-item">
          <div className="num-badge">2</div>
          <div className="text">
            <strong>Browse Movies &amp; Series</strong>
            <span>Explore thousands of titles across all genres</span>
          </div>
        </div>
        <div className="step-item">
          <div className="num-badge">3</div>
          <div className="text">
            <strong>Stream &amp; Enjoy</strong>
            <span>Watch instantly in HD — no signup, no ads</span>
          </div>
        </div>
      </div>

      {/* ==================== TRENDING ==================== */}
      <section className="row" id="trending">
        <div className="row-head reveal">
          <h2>
            Trending Now <span className="badge-genre">HOT</span>
          </h2>
          <button
            className="see-all"
            onClick={(e) => handleSiteClick(e as any, SITE_URL)}
          >
            See All
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M5 12h14M13 5l7 7-7 7" />
            </svg>
          </button>
        </div>
        <div className="slider-wrap reveal reveal-delay-1">
          <MovieSlider movies={ROW_1} onCardClick={handleCardClick} setupSlider={setupSlider} />
        </div>
      </section>

      {/* ==================== FEATURES ==================== */}
      <section className="mv-section" id="features">
        <div className="section-head reveal">
          <span className="kicker">WHY MOVIESVERSEBD</span>
          <h2>
            Built for <span className="accent">True Movie Lovers</span>
          </h2>
          <p>
            The fastest, cleanest way to watch movies &amp; series in Bangladesh.
            No signup, no buffering, no hassle.
          </p>
        </div>

        <div className="features">
          <div className="feature-card reveal reveal-delay-1">
            <div className="icon">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
              </svg>
            </div>
            <h3>Instant Streaming</h3>
            <p>
              Click any movie and stream instantly. No waiting, no registration —
              just pure entertainment.
            </p>
          </div>

          <div className="feature-card reveal reveal-delay-2">
            <div className="icon">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 2 4 6v6c0 5 3.5 9 8 10 4.5-1 8-5 8-10V6l-8-4z" />
                <path d="m9 12 2 2 4-4" />
              </svg>
            </div>
            <h3>100% Free &amp; Safe</h3>
            <p>
              No hidden fees. No shady downloads. Just pure content streamed
              securely to your device.
            </p>
          </div>

          <div className="feature-card reveal reveal-delay-3">
            <div className="icon">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10" />
                <path d="M2 12h20M12 2a15 15 0 0 1 0 20 15 15 0 0 1 0-20z" />
              </svg>
            </div>
            <h3>Bangla Subtitles</h3>
            <p>
              Most movies include Bangla subtitles. Enjoy Hollywood, Bollywood,
              South Indian and more.
            </p>
          </div>

          <div className="feature-card reveal reveal-delay-4">
            <div className="icon">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21 12a9 9 0 1 1-6.2-8.5" />
                <path d="M22 4v6h-6" />
              </svg>
            </div>
            <h3>Updated Daily</h3>
            <p>
              New releases land on MoviesVerseBD every single day. Never miss the
              latest hits again.
            </p>
          </div>
        </div>
      </section>

      {/* ==================== TOP 10 ==================== */}
      <section className="row" id="top10">
        <div className="row-head reveal">
          <h2>Top 10 in Bangladesh Today</h2>
          <button
            className="see-all"
            onClick={(e) => handleSiteClick(e as any, SITE_URL)}
          >
            See All
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M5 12h14M13 5l7 7-7 7" />
            </svg>
          </button>
        </div>
        <div className="slider-wrap reveal reveal-delay-1">
          <MovieSlider movies={ROW_2} onCardClick={handleCardClick} setupSlider={setupSlider} />
        </div>
      </section>

      {/* ==================== NEW RELEASES ==================== */}
      <section className="row" id="new">
        <div className="row-head reveal">
          <h2>New Releases</h2>
          <button
            className="see-all"
            onClick={(e) => handleSiteClick(e as any, SITE_URL)}
          >
            See All
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M5 12h14M13 5l7 7-7 7" />
            </svg>
          </button>
        </div>
        <div className="slider-wrap reveal reveal-delay-1">
          <MovieSlider movies={ROW_3} onCardClick={handleCardClick} setupSlider={setupSlider} />
        </div>
      </section>

      {/* ==================== HOW IT WORKS ==================== */}
      <section className="mv-section" id="how">
        <div className="section-head reveal">
          <span className="kicker">SUPER SIMPLE</span>
          <h2>
            Enter in <span className="accent">3 Easy Steps</span>
          </h2>
          <p>
            No signup. No email. No password. Just click the green button and
            start watching.
          </p>
        </div>

        <div className="features">
          <div
            className="feature-card reveal reveal-delay-1"
            style={{ textAlign: "center" }}
          >
            <div className="icon" style={{ margin: "0 auto 20px" }}>
              1
            </div>
            <h3>Click The Green Button</h3>
            <p>
              Tap the highlighted &quot;Visit Main Site&quot; button anywhere on
              this page to enter our official website.
            </p>
          </div>

          <div
            className="feature-card reveal reveal-delay-2"
            style={{ textAlign: "center" }}
          >
            <div className="icon" style={{ margin: "0 auto 20px" }}>
              2
            </div>
            <h3>Pick Your Movie</h3>
            <p>
              Browse hundreds of movies and web series. Use categories or search
              to find what you love.
            </p>
          </div>

          <div
            className="feature-card reveal reveal-delay-3"
            style={{ textAlign: "center" }}
          >
            <div className="icon" style={{ margin: "0 auto 20px" }}>
              3
            </div>
            <h3>Stream &amp; Enjoy</h3>
            <p>
              Hit play and enjoy. Download for offline or watch online —
              MoviesVerseBD has you covered.
            </p>
          </div>
        </div>
      </section>

      {/* ==================== BIG CTA ==================== */}
      <section className="big-cta reveal">
        <h2>
          Ready to <span className="accent">Start Watching?</span>
        </h2>
        <p>
          Join thousands of Bangladeshi movie lovers already streaming on
          MoviesVerseBD. It&apos;s free, it&apos;s fast, and it&apos;s waiting for
          you.
        </p>
        <div className="cta-buttons">
          <a
            href={SITE_URL}
            className="btn-site-main"
            onClick={(e) => handleSiteClick(e, SITE_URL)}
          >
            <span className="label">Visit Main Site</span>
            <span className="arrow">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M5 12h14M13 5l7 7-7 7" />
              </svg>
            </span>
          </a>
        </div>
      </section>

      {/* ==================== FOOTER ==================== */}
      <footer className="mv-footer">
        <div className="foot-top">
          <div className="foot-brand reveal">
            <div className="brand-lg">
              <span className="mv-text">MoviesVerse</span>
              <span className="bd-text">BD</span>
            </div>
            <p>
              Bangladesh&apos;s most loved movie streaming experience. Fast, free,
              and endlessly entertaining — with new titles added every single day.
            </p>
            <div className="social-row">
              <a href="#" aria-label="Facebook" title="Facebook">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M22 12c0-5.5-4.5-10-10-10S2 6.5 2 12c0 5 3.6 9.1 8.4 9.9v-7H7.9V12h2.5V9.8c0-2.5 1.5-3.9 3.8-3.9 1.1 0 2.2.2 2.2.2v2.5h-1.3c-1.2 0-1.6.8-1.6 1.6V12h2.8l-.5 2.9h-2.3v7C18.4 21.1 22 17 22 12z" />
                </svg>
              </a>
              <a href="#" aria-label="Instagram" title="Instagram">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="2" y="2" width="20" height="20" rx="5" />
                  <path d="M16 11.4A4 4 0 1 1 12.6 8 4 4 0 0 1 16 11.4z" />
                  <circle
                    cx="17.5"
                    cy="6.5"
                    r="0.5"
                    fill="currentColor"
                  />
                </svg>
              </a>
              <a href="#" aria-label="YouTube" title="YouTube">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M23 12s0-3.4-.4-5c-.2-.9-1-1.6-1.9-1.8C19 5 12 5 12 5s-7 0-8.7.4c-.9.2-1.6 1-1.8 1.9C1 9 1 12 1 12s0 3.4.4 5c.2.9 1 1.6 1.9 1.8C5 19 12 19 12 19s7 0 8.7-.4c.9-.2 1.6-1 1.8-1.9.5-1.5.5-4.7.5-4.7zM10 15V9l5 3-5 3z" />
                </svg>
              </a>
              <a href="#" aria-label="Telegram" title="Telegram">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M22 4.01c0-.79-.63-1.43-1.4-1.4-6.6.25-13.2.5-19.8.75-.74.03-1.3.66-1.3 1.4 0 2.98.02 5.96.05 8.94.01.55.4 1.01.93 1.15 2.6.68 5.2 1.36 7.8 2.04.32.08.44.47.22.71-.98 1.06-1.96 2.13-2.94 3.19-.36.4-.06 1.05.48.98 2.35-.29 4.7-.58 7.05-.87.55-.07.9-.6.78-1.13-.46-2.05-.92-4.1-1.38-6.15-.08-.36.2-.7.57-.68 1.94.1 3.87.19 5.8.29.85.04 1.5-.71 1.34-1.55-.72-3.75-1.44-7.5-2.16-11.25-.09-.45.08-.91.44-1.19.65-.5 1.34-1.03 2.05-1.57.35-.27.44-.76.22-1.14z" />
                </svg>
              </a>
            </div>
          </div>

          <div className="foot-col reveal reveal-delay-1">
            <h5>Browse</h5>
            <a href="#trending">Trending</a>
            <a href="#top10">Top 10 Today</a>
            <a href="#new">New Releases</a>
            <a href="#">Hollywood</a>
            <a href="#">Bollywood</a>
            <a href="#">Web Series</a>
          </div>

          <div className="foot-col reveal reveal-delay-2">
            <h5>Genres</h5>
            <a href="#">Action</a>
            <a href="#">Thriller</a>
            <a href="#">Drama</a>
            <a href="#">Sci-Fi</a>
            <a href="#">Romance</a>
            <a href="#">Horror</a>
          </div>

          <div className="foot-col reveal reveal-delay-3">
            <h5>Support</h5>
            <a href="#">How To Watch</a>
            <a href="#">FAQ</a>
            <a href="#">Request a Movie</a>
            <a href="#">Report Issue</a>
            <a href="#">Contact Us</a>
          </div>

          <div className="foot-col reveal reveal-delay-4">
            <h5>Legal</h5>
            <a href="#">Terms of Use</a>
            <a href="#">Privacy Policy</a>
            <a href="#">DMCA</a>
            <a href="#">Disclaimer</a>
            <a href="#">Cookies</a>
          </div>
        </div>

        <div className="foot-newsletter reveal">
          <div>
            <h4>Get notified about new releases</h4>
            <p>
              Drop your email and we&apos;ll ping you when the hottest movies go
              live.
            </p>
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const form = e.currentTarget;
              const input = form.querySelector(
                "input"
              ) as HTMLInputElement;
              const btn = form.querySelector("button") as HTMLButtonElement;
              if (input) input.value = "";
              if (btn) btn.textContent = "Subscribed ✓";
            }}
          >
            <input type="email" placeholder="your@email.com" required />
            <button type="submit">Notify Me</button>
          </form>
        </div>

        <div className="foot-bottom">
          <div className="legal">
            <a href="#">Terms</a>
            <a href="#">Privacy</a>
            <a href="#">DMCA</a>
            <a href="#">Sitemap</a>
          </div>
          <div className="made-with">
            © 2025 MoviesVerseBD · Crafted with{" "}
            <span className="heart">❤</span> in Bangladesh
          </div>
        </div>
      </footer>
    </>
  );
}

// ==================== SUB-COMPONENT: MOVIE SLIDER ====================
type MovieSliderProps = {
  movies: Movie[];
  onCardClick: (e: React.MouseEvent<HTMLDivElement>, movie: Movie) => void;
  setupSlider: (el: HTMLDivElement | null) => void;
};

function MovieSlider({ movies, onCardClick, setupSlider }: MovieSliderProps) {
  const sliderRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setupSlider(sliderRef.current);
  }, [setupSlider]);

  return (
    <div className="mv-slider" ref={sliderRef}>
      {movies.map((movie, idx) => (
        <div
          key={`${movie.title}-${idx}`}
          className="card"
          onClick={(e) => onCardClick(e, movie)}
        >
          <div className="card-poster">
            {movie.badge === "top10" && (
              <span className="top10-badge">TOP 10</span>
            )}
            {movie.badge === "new" && <span className="new-badge">NEW</span>}
            {movie.rank && (
              <span className="top10-badge">#{movie.rank}</span>
            )}
            <span className="hd-badge">HD</span>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={movie.poster}
              alt={movie.title}
              loading="lazy"
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
            <div className="card-title-overlay">
              <div className="title-line">{movie.title}</div>
              <div className="meta-line">
                <span className="star">★ {movie.rating}</span>
              </div>
            </div>
            <div className="play-overlay">
              <div className="play-circle">
                <svg viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
        }
