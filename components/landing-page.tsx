"use client";

import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

// ==================== DATA ====================
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
  { tag: "ORIGINAL SERIES", cat: "Trending #1", title: ["Nebula", "Protocol"], imdb: "9.1", year: "2025", extra: "Season 2 · 8 Episodes", desc: "When a rogue AI threatens to unravel reality itself, a fractured team of scientists must race across parallel universes to stop it — before every version of them ceases to exist." },
  { tag: "FEATURED FILM", cat: "Now Streaming", title: ["Deep", "Water"], imdb: "8.7", year: "2024", extra: "1h 58m · Thriller", desc: "A deep-sea salvage crew discovers a sunken vessel that shouldn't exist. As they descend further, they realize the ocean is hiding something far older than humanity itself." },
  { tag: "MV ORIGINAL", cat: "New Season", title: ["Scarlet", "Hour"], imdb: "9.4", year: "2025", extra: "Season 1 · 10 Episodes", desc: "In a city that never sleeps, a brilliant detective with a shattered past hunts a killer whose crimes are always committed at the exact moment the clock strikes scarlet." },
  { tag: "BLOCKBUSTER", cat: "Top Rated", title: ["Midnight", "Fall"], imdb: "8.9", year: "2025", extra: "2h 12m · Action", desc: "One night. One city. One man against an empire. A relentless ex-agent must dismantle a criminal network before sunrise — or lose everything he loves." },
  { tag: "SCI-FI EPIC", cat: "Fan Favorite", title: ["Echoes of", "Tomorrow"], imdb: "9.0", year: "2025", extra: "Season 1 · 12 Episodes", desc: "A physicist discovers her dreams are actually messages from a parallel version of herself — one that's warning her about an imminent catastrophe." },
  { tag: "CRIME DRAMA", cat: "Award Winner", title: ["Crimson", "Tide"], imdb: "8.8", year: "2024", extra: "1h 45m · Drama", desc: "A small coastal town hides a dark secret beneath its calm waves. When a stranger arrives, long-buried truths threaten to drown everyone involved." },
  { tag: "MYSTERY", cat: "New Release", title: ["Hidden", "Truth"], imdb: "8.3", year: "2025", extra: "1h 38m · Mystery", desc: "A journalist investigating a cold case discovers the victim was living a double life — and the killer may be closer to her than she ever imagined." },
  { tag: "NETFLIX SERIES", cat: "Global Hit", title: ["The Silent", "Sea"], imdb: "8.5", year: "2024", extra: "Season 1 · 8 Episodes", desc: "On a lunar research station, a team of elite astronauts is sent to retrieve a mysterious sample. What they find will change humanity forever." },
  { tag: "WEB SERIES", cat: "Just Added", title: ["Shadow", "Lines"], imdb: "8.6", year: "2025", extra: "Season 1 · 10 Episodes", desc: "A homicide detective and a convicted criminal form an unlikely alliance to solve a series of murders that have haunted the city for decades." },
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

const SITE_ROUTE = "/home"; // ← internal route to your streaming site

// ==================== MAIN COMPONENT ====================
export default function LandingPage() {
  const router = useRouter();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isScrolled, setIsScrolled] = useState(false);
  const [typingText, setTypingText] = useState("");
  const [heroAnimating, setHeroAnimating] = useState(false);

  const slideTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const msgIndexRef = useRef(0);
  const charIndexRef = useRef(0);
  const isDeletingRef = useRef(false);

  // ---------- NAV SCROLL ----------
  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 40);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // ---------- SCROLL REVEAL ----------
  useEffect(() => {
    const revealObs = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) entry.target.classList.add("visible");
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -60px 0px" }
    );
    const els = document.querySelectorAll(".mvbd-landing .reveal");
    els.forEach((el) => revealObs.observe(el));
    return () => revealObs.disconnect();
  }, []);

  // ---------- HERO SLIDESHOW ----------
  const goToSlide = (index: number) => {
    setCurrentSlide(index);
    setHeroAnimating(false);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => setHeroAnimating(true));
    });
  };

  useEffect(() => {
    const tick = () => {
      setCurrentSlide((prev) => {
        const next = (prev + 1) % SLIDE_DATA.length;
        setHeroAnimating(false);
        requestAnimationFrame(() => {
          requestAnimationFrame(() => setHeroAnimating(true));
        });
        return next;
      });
    };
    slideTimerRef.current = setInterval(tick, 4500);
    setHeroAnimating(true);
    return () => {
      if (slideTimerRef.current) clearInterval(slideTimerRef.current);
    };
  }, []);

  const resetSlideTimer = () => {
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
  };

  // ---------- TYPING ----------
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

  // ---------- ZOOM TRANSITION + NAVIGATE ----------
  const performZoomTransition = (
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
      router.push(SITE_ROUTE);
    }, 720);
  };

  const handleSiteClick = (
    e: React.MouseEvent<HTMLAnchorElement | HTMLButtonElement | HTMLDivElement>
  ) => {
    e.preventDefault();
    performZoomTransition(e.currentTarget as HTMLElement);
  };

  const handleCardClick = (e: React.MouseEvent<HTMLDivElement>) => {
    performZoomTransition(e.currentTarget);
  };

  // ---------- DRAG TO SCROLL ----------
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
    <div className="mvbd-landing">
      {/* Transition overlays */}
      <div className="zoom-vignette" />
      <div className="zoom-flash" />

      {/* NAV */}
      <nav className={`mv-nav ${isScrolled ? "scrolled" : ""}`}>
        <div className="mv-nav-left">
          <div className="mv-brand">
            <span className="mv-text">MoviesVerse</span>
            <span className="bd-text">BD</span>
            <small>STREAM</small>
          </div>
          <div className="mv-nav-links">
            <a href="#" className="active">Home</a>
            <a href="#trending">Trending</a>
            <a href="#top10">Top 10</a>
            <a href="#new">New</a>
            <a href="#how">How It Works</a>
          </div>
        </div>
        <div className="mv-nav-right">
          <button type="button" className="nav-cta" onClick={handleSiteClick}>
            <span>Visit Main Site</span>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M13 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </nav>

      {/* HERO */}
      <section className="mv-hero">
        <div>
          {SLIDE_DATA.map((_, i) => (
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
          <div className={`hero-tag ${heroAnimating ? "animate" : ""}`}>
            <span className="mv-logo">MV</span>
            <span className="divider" />
            <span>{currentData.tag}</span>
            <span className="divider" />
            <span className="cat">{currentData.cat}</span>
          </div>

          <h1 className={`hero-title ${heroAnimating ? "animate" : ""}`}>
            <span className="line"><span>{currentData.title[0]}</span></span>
            <span className="line"><span>{currentData.title[1]}</span></span>
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

          <div className="hero-actions">
            <button type="button" className="btn-site-main" onClick={handleSiteClick}>
              <span className="label">Visit Main Site</span>
              <span className="arrow">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14M13 5l7 7-7 7" />
                </svg>
              </span>
            </button>

            <button type="button" className="btn-icon-round" aria-label="More info">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 16v-4M12 8h.01" />
              </svg>
            </button>
          </div>

          <div className="site-hint">
            <svg className="check-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
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
                resetSlideTimer();
              }}
            />
          ))}
        </div>
      </section>

      {/* STEPS BAR */}
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

      {/* TRENDING */}
      <section className="row" id="trending">
        <div className="row-head reveal">
          <h2>Trending Now <span className="badge-genre">HOT</span></h2>
          <button type="button" className="see-all" onClick={handleSiteClick}>
            See All
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M13 5l7 7-7 7" />
            </svg>
          </button>
        </div>
        <div className="slider-wrap reveal reveal-delay-1">
          <MovieSlider movies={ROW_1} onCardClick={handleCardClick} setupSlider={setupSlider} />
        </div>
      </section>

      {/* FEATURES */}
      <section className="mv-section" id="features">
        <div className="section-head reveal">
          <span className="kicker">WHY MOVIESVERSEBD</span>
          <h2>Built for <span className="accent">True Movie Lovers</span></h2>
          <p>The fastest, cleanest way to watch movies &amp; series in Bangladesh. No signup, no buffering, no hassle.</p>
        </div>

        <div className="features">
          <div className="feature-card reveal reveal-delay-1">
            <div className="icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
              </svg>
            </div>
            <h3>Instant Streaming</h3>
            <p>Click any movie and stream instantly. No waiting, no registration — just pure entertainment.</p>
          </div>

          <div className="feature-card reveal reveal-delay-2">
            <div className="icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2 4 6v6c0 5 3.5 9 8 10 4.5-1 8-5 8-10V6l-8-4z" />
                <path d="m9 12 2 2 4-4" />
              </svg>
            </div>
            <h3>100% Free &amp; Safe</h3>
            <p>No hidden fees. No shady downloads. Just pure content streamed securely to your device.</p>
          </div>

          <div className="feature-card reveal reveal-delay-3">
            <div className="icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <path d="M2 12h20M12 2a15 15 0 0 1 0 20 15 15 0 0 1 0-20z" />
              </svg>
            </div>
            <h3>Bangla Subtitles</h3>
            <p>Most movies include Bangla subtitles. Enjoy Hollywood, Bollywood, South Indian and more.</p>
          </div>

          <div className="feature-card reveal reveal-delay-4">
            <div className="icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12a9 9 0 1 1-6.2-8.5" />
                <path d="M22 4v6h-6" />
              </svg>
            </div>
            <h3>Updated Daily</h3>
            <p>New releases land on MoviesVerseBD every single day. Never miss the latest hits again.</p>
          </div>
        </div>
      </section>

      {/* TOP 10 */}
      <section className="row" id="top10">
        <div className="row-head reveal">
          <h2>Top 10 in Bangladesh Today</h2>
          <button type="button" className="see-all" onClick={handleSiteClick}>
            See All
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M13 5l7 7-7 7" />
            </svg>
          </button>
        </div>
        <div className="slider-wrap reveal reveal-delay-1">
          <MovieSlider movies={ROW_2} onCardClick={handleCardClick} setupSlider={setupSlider} />
        </div>
      </section>

      {/* NEW RELEASES */}
      <section className="row" id="new">
        <div className="row-head reveal">
          <h2>New Releases</h2>
          <button type="button" className="see-all" onClick={handleSiteClick}>
            See All
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M13 5l7 7-7 7" />
            </svg>
          </button>
        </div>
        <div className="slider-wrap reveal reveal-delay-1">
          <MovieSlider movies={ROW_3} onCardClick={handleCardClick} setupSlider={setupSlider} />
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="mv-section" id="how">
        <div className="section-head reveal">
          <span className="kicker">SUPER SIMPLE</span>
          <h2>Enter in <span className="accent">3 Easy Steps</span></h2>
          <p>No signup. No email. No password. Just click the green button and start watching.</p>
        </div>

        <div className="features">
          <div className="feature-card reveal reveal-delay-1" style={{ textAlign: "center" }}>
            <div className="icon" style={{ margin: "0 auto 20px" }}>1</div>
            <h3>Click The Green Button</h3>
            <p>Tap the highlighted &quot;Visit Main Site&quot; button anywhere on this page to enter our official website.</p>
          </div>
          <div className="feature-card reveal reveal-delay-2" style={{ textAlign: "center" }}>
            <div className="icon" style={{ margin: "0 auto 20px" }}>2</div>
            <h3>Pick Your Movie</h3>
            <p>Browse hundreds of movies and web series. Use categories or search to find what you love.</p>
          </div>
          <div className="feature-card reveal reveal-delay-3" style={{ textAlign: "center" }}>
            <div className="icon" style={{ margin: "0 auto 20px" }}>3</div>
            <h3>Stream &amp; Enjoy</h3>
            <p>Hit play and enjoy. Download for offline or watch online — MoviesVerseBD has you covered.</p>
          </div>
        </div>
      </section>

      {/* BIG CTA */}
      <section className="big-cta reveal">
        <h2>Ready to <span className="accent">Start Watching?</span></h2>
        <p>Join thousands of Bangladeshi movie lovers already streaming on MoviesVerseBD. It&apos;s free, it&apos;s fast, and it&apos;s waiting for you.</p>
        <div className="cta-buttons">
          <button type="button" className="btn-site-main" onClick={handleSiteClick}>
            <span className="label">Visit Main Site</span>
            <span className="arrow">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M13 5l7 7-7 7" />
              </svg>
            </span>
          </button>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="mv-footer">
        <div className="foot-top">
          <div className="foot-brand reveal">
            <div className="brand-lg">
              <span className="mv-text">MoviesVerse</span>
              <span className="bd-text">BD</span>
            </div>
            <p>Bangladesh&apos;s most loved movie streaming experience. Fast, free, and endlessly entertaining — with new titles added every single day.</p>
            <div className="social-row">
              <a href="#" aria-label="Facebook" title="Facebook">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M22 12c0-5.5-4.5-10-10-10S2 6.5 2 12c0 5 3.6 9.1 8.4 9.9v-7H7.9V12h2.5V9.8c0-2.5 1.5-3.9 3.8-3.9 1.1 0 2.2.2 2.2.2v2.5h-1.3c-1.2 0-1.6.8-1.6 1.6V12h2.8l-.5 2.9h-2.3v7C18.4 21.1 22 17 22 12z" />
                </svg>
              </a>
              <a href="#" aria-label="Instagram" title="Instagram">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="2" width="20" height="20" rx="5" />
                  <path d="M16 11.4A4 4 0 1 1 12.6 8 4 4 0 0 1 16 11.4z" />
                  <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" />
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

        <div className="foot-bottom">
          <div className="legal">
            <a href="#">Terms</a>
            <a href="#">Privacy</a>
            <a href="#">DMCA</a>
            <a href="#">Sitemap</a>
          </div>
          <div className="made-with">
            © 2025 MoviesVerseBD · Crafted with <span className="heart">❤</span> in Bangladesh
          </div>
        </div>
      </footer>
    </div>
  );
}

// ==================== MOVIE SLIDER SUBCOMPONENT ====================
type MovieSliderProps = {
  movies: Movie[];
  onCardClick: (e: React.MouseEvent<HTMLDivElement>) => void;
  setupSlider: (el: HTMLDivElement | null) => void;
};

function MovieSlider({ movies, onCardClick, setupSlider }: MovieSliderProps) {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setupSlider(ref.current);
  }, [setupSlider]);

  return (
    <div className="mv-slider" ref={ref}>
      {movies.map((movie, idx) => (
        <div key={`${movie.title}-${idx}`} className="card" onClick={onCardClick}>
          <div className="card-poster">
            {movie.badge === "top10" && <span className="top10-badge">TOP 10</span>}
            {movie.badge === "new" && <span className="new-badge">NEW</span>}
            {movie.rank && <span className="top10-badge">#{movie.rank}</span>}
            <span className="hd-badge">HD</span>
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
