"use client";

import React, { useEffect, useRef, useState } from "react";
import { movies } from "@/lib/movie-data";

type LandingPageProps = {
  onEnterSite?: () => void;
  onMovieClick?: (movie: (typeof movies)[0]) => void;
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
  "Welcome to MoviesVerseBD — Your Ultimate Destination for Movies, Web Series, and Endless Entertainment. Discover Your Next Favourite Story Today!",

  "From Hollywood Blockbusters to Bollywood Hits, South Indian Action, Korean Dramas, and Trending Web Series — Explore the World of Entertainment with MoviesVerseBD!",

  "Every Movie Has a Story, Every Story Creates a Memory. Dive Into Amazing Adventures, Powerful Performances, Mind-Blowing Thrillers, and Unforgettable Cinematic Moments!",

  "Your Next Binge-Worthy Series Is Waiting! Explore Exciting Stories, Discover New Releases, Revisit Your Favourite Movies, and Make Every Moment an Entertainment Experience!",

  "Welcome to a World Where Entertainment Never Ends! MoviesVerseBD Brings Movie Lovers Closer to the Stories, Characters, and Cinematic Universes They Love!",

  "Love Action, Horror, Romance, Comedy, or Sci-Fi? Whatever Your Mood, Discover Different Genres, Explore New Stories, and Find Something Exciting to Watch on MoviesVerseBD!",

  "From Legendary Classics to the Latest Trending Titles, MoviesVerseBD Is Your Place to Explore the Incredible World of Cinema and Discover Entertainment Beyond Boundaries!",

  "Lights Off, Screen On, Entertainment Begins! Get Ready to Explore Fascinating Movies, Thrilling Mysteries, Epic Adventures, and Stories That Keep You Watching!",

  "Made for Movie Lovers, Inspired by Great Stories! Explore Hollywood, Bollywood, South Indian Cinema, Korean Dramas, and Web Series — All in One MoviesVerseBD Experience!",

  "Your Entertainment Journey Starts Here! Discover New Favourites, Explore Different Cinematic Worlds, and Join the MoviesVerseBD Community Where Every Movie Lover Belongs!",
];
export default function LandingPage({
  onEnterSite,
  onMovieClick,
}: LandingPageProps = {}) {
  const onEnterSiteRef = useRef(onEnterSite);
  useEffect(() => {
    onEnterSiteRef.current = onEnterSite;
  }, [onEnterSite]);

  /* ============================================================
     ✅ TYPING ANIMATION
  ============================================================ */
  const [displayedText, setDisplayedText] = useState("");
  const [msgIndex, setMsgIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout>>();

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
        typingTimeoutRef.current = setTimeout(() => {
          setIsDeleting(true);
        }, pauseAfter);
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

  /* ============================================================
     ✅ VISIT MAIN SITE HANDLER
  ============================================================ */
  const handleHeroEnterSite = (e: React.MouseEvent) => {
    e.preventDefault();
    if (document.documentElement.classList.contains("zooming")) return;

    const root = document.querySelector(
      ".landing-page-root"
    ) as HTMLElement | null;
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

  /* ============================================================
     ✅ MOVIE ROWS + DRAG + VISIT MAIN SITE + REVEAL
  ============================================================ */
  useEffect(() => {
    const trendingMovies = movies.filter((m) => trendingIds.includes(m.id));

    const row1 = trendingMovies.map((m) => ({
      title: m.title,
      rating: m.rating,
      poster: m.poster,
      movie: m,
    }));

    const row2 = [
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

    const row3 = [
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

    function buildCard(movie: any) {
      const card = document.createElement("div");
      card.className = "card";

      let badgeHTML = "";
      if (movie.badge === "new") badgeHTML = `<span class="new-badge">NEW</span>`;
      else if (movie.rank) badgeHTML = `<span class="top10-badge">#${movie.rank}</span>`;

      card.innerHTML = `
        <div class="card-poster">
          ${badgeHTML}
          <span class="hd-badge">HD</span>
          <img src="${movie.poster}" alt="${movie.title}" loading="lazy" />
          <div class="card-title-overlay">
            <div class="title-line">${movie.title}</div>
            <div class="meta-line"><span class="star">★ ${movie.rating}</span></div>
          </div>
          <div class="play-overlay">
            <div class="play-circle">
              <svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
            </div>
          </div>
        </div>
      `;

      card.addEventListener("click", () => {
        if (movie.movie && onMovieClick) onMovieClick(movie.movie);
        else if (onEnterSiteRef.current) onEnterSiteRef.current();
      });

      return card;
    }

    const s1 = document.getElementById("slider1");
    const s2 = document.getElementById("slider2");
    const s3 = document.getElementById("slider3");
    if (s1 && s1.children.length === 0) s1.append(...row1.map(buildCard));
    if (s2 && s2.children.length === 0) s2.append(...row2.map(buildCard));
    if (s3 && s3.children.length === 0) s3.append(...row3.map(buildCard));

    // Drag to scroll
    const sliders = document.querySelectorAll(".slider");
    const cleanupFns: Array<() => void> = [];

    sliders.forEach((slider) => {
      let isDown = false,
        startX = 0,
        scrollLeft = 0,
        moved = false;
      const onMouseDown = (e: any) => {
        isDown = true;
        moved = false;
        (slider as HTMLElement).style.cursor = "grabbing";
        startX = e.pageX - (slider as HTMLElement).offsetLeft;
        scrollLeft = (slider as HTMLElement).scrollLeft;
      };
      const onMouseLeave = () => {
        isDown = false;
        (slider as HTMLElement).style.cursor = "grab";
      };
      const onMouseUp = () => {
        isDown = false;
        (slider as HTMLElement).style.cursor = "grab";
      };
      const onMouseMove = (e: any) => {
        if (!isDown) return;
        e.preventDefault();
        const x = e.pageX - (slider as HTMLElement).offsetLeft;
        const walk = (x - startX) * 1.6;
        if (Math.abs(walk) > 5) moved = true;
        (slider as HTMLElement).scrollLeft = scrollLeft - walk;
      };
      const onClick = (e: any) => {
        if (moved) {
          e.preventDefault();
          e.stopPropagation();
        }
      };
      const onWheel = (e: any) => {
        if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
          e.preventDefault();
          (slider as HTMLElement).scrollLeft += e.deltaY;
        }
      };

      slider.addEventListener("mousedown", onMouseDown);
      slider.addEventListener("mouseleave", onMouseLeave);
      slider.addEventListener("mouseup", onMouseUp);
      slider.addEventListener("mousemove", onMouseMove);
      slider.addEventListener("click", onClick, true);
      slider.addEventListener("wheel", onWheel, { passive: false });
      (slider as HTMLElement).style.cursor = "grab";

      cleanupFns.push(() => {
        slider.removeEventListener("mousedown", onMouseDown);
        slider.removeEventListener("mouseleave", onMouseLeave);
        slider.removeEventListener("mouseup", onMouseUp);
        slider.removeEventListener("mousemove", onMouseMove);
        slider.removeEventListener("click", onClick, true);
        slider.removeEventListener("wheel", onWheel);
      });
    });

    // Visit Main Site (nav + footer er jonno)
    function handleEnterSiteClick(e: Event) {
      e.preventDefault();
      if (document.documentElement.classList.contains("zooming")) return;
      const root = document.querySelector(
        ".landing-page-root"
      ) as HTMLElement | null;
      if (root) {
        root.style.transition = "opacity 400ms ease, transform 400ms ease";
        root.style.opacity = "0";
        root.style.transform = "scale(0.98)";
      }
      setTimeout(() => {
        if (onEnterSiteRef.current) onEnterSiteRef.current();
        else window.location.reload();
      }, 420);
    }

    const siteLinks = document.querySelectorAll("[data-site-link]");
    siteLinks.forEach((link) =>
      link.addEventListener("click", handleEnterSiteClick)
    );

    const nav = document.getElementById("nav");
    const handleScroll = () => {
      if (window.scrollY > 40) nav?.classList.add("scrolled");
      else nav?.classList.remove("scrolled");
    };
    window.addEventListener("scroll", handleScroll);

    const revealObs = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) entry.target.classList.add("visible");
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -60px 0px" }
    );
    document.querySelectorAll(".reveal").forEach((el) => revealObs.observe(el));

    return () => {
      window.removeEventListener("scroll", handleScroll);
      revealObs.disconnect();
      siteLinks.forEach((link) =>
        link.removeEventListener("click", handleEnterSiteClick)
      );
      cleanupFns.forEach((fn) => fn());
    };
  }, [onMovieClick]);

  return (
    <div className="landing-page-root" style={{ background: "#000000" }}>
      <div className="zoom-vignette"></div>
      <div className="zoom-flash"></div>

      {/* ✅ Nav — obhabei */}
      <nav id="nav">
        <div className="nav-left">
          <div className="brand">
            <span className="mv-text">MoviesVerse</span>
            <span className="bd-text">BD</span>
            <small>STREAM</small>
          </div>
          <div className="nav-links">
            <a href="#" className="active">Home</a>
            <a href="#trending">Trending</a>
            <a href="#top10">Top 10</a>
            <a href="#new">New</a>
            <a href="#how">How It Works</a>
          </div>
        </div>
        <div className="nav-right">
          <a href="#" className="nav-cta" data-site-link>
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

      {/* ✅✅✅ HERO SECTION — Background image extended to cover typing animation ✅✅✅ */}
      <section
        className="relative overflow-hidden"
        style={{ background: "#000000" }}
      >
        {/* Background image — boro kora hoyeche jate typing animation er porjonto stretch kore */}
        <div
          className="absolute top-0 left-0 w-full h-[700px] md:h-[900px] z-0 pointer-events-none"
          style={{
            backgroundImage:
              "url('https://i.postimg.cc/7hLqB21s/Netflix-all-movies-and-series-featured-image.jpg')",
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
          }}
        >
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(to bottom, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.85) 40%, rgba(0,0,0,0.95) 70%, #000000 100%)",
            }}
          />
        </div>

        {/* Content */}
        <div className="relative z-10 px-4 pt-2 pb-16">
          {/* MoviesVerseBD Logo */}
          <div className="relative flex justify-center -mt-2 mb-8">
            <img
              src="https://i.postimg.cc/Bn4cPRwz/20288-removebg-preview.png"
              alt="MoviesVerseBD Logo"
              className="relative z-20 w-64 h-64 md:w-80 md:h-80 object-contain"
            />
          </div>

          {/* ✅ Visit Main Site Button */}
          <div className="flex justify-center mb-8">
            <a
              href="#"
              onClick={handleHeroEnterSite}
              className="btn-site-main"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "14px",
                padding: "14px 18px 14px 28px",
                borderRadius: "9999px",
                background:
                  "linear-gradient(135deg, #16a34a 0%, #22c55e 50%, #16a34a 100%)",
                color: "white",
                fontWeight: 700,
                fontSize: "18px",
                textDecoration: "none",
                boxShadow:
                  "0 8px 30px rgba(34, 197, 94, 0.5), 0 0 60px rgba(34, 197, 94, 0.3), inset 0 1px 0 rgba(255,255,255,0.3)",
                border: "1px solid rgba(34, 197, 94, 0.6)",
                transition: "all 0.3s ease",
              }}
            >
              <span>Visit Main Site</span>
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "36px",
                  height: "36px",
                  borderRadius: "9999px",
                  background: "rgba(255, 255, 255, 0.15)",
                  border: "1px solid rgba(255, 255, 255, 0.3)",
                }}
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{ width: "18px", height: "18px" }}
                >
                  <path d="M5 12h14M13 5l7 7-7 7" />
                </svg>
              </span>
            </a>
          </div>

          {/* ✅ Typing animation — EKHON HERO SECTION ER VITORE, background transparent */}
          <div
            className="flex justify-center items-center gap-2"
            style={{
              paddingTop: "120px",
              paddingBottom: "80px",
            }}
          >
            <svg
              className="w-5 h-5 text-green-400 flex-shrink-0"
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
            <span className="text-green-400 text-sm md:text-base font-medium">
              {displayedText}
            </span>
            <span className="inline-block w-[2px] h-[18px] bg-green-400 animate-pulse" />
          </div>
        </div>
      </section>

      {/* ✅ Trending Now — obhabei niche */}
      <section
        className="relative"
        id="trending"
        style={{ background: "#000000", marginTop: "60px" }}
      >
        {/* Netflix-style curved top edge */}
        <div
          className="absolute top-0 left-0 w-full h-[60px] pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 120% 100% at 50% 100%, rgba(20, 20, 50, 0.6) 0%, transparent 70%)",
            borderTop: "2px solid transparent",
            borderImage:
              "linear-gradient(to right, transparent, rgba(100, 100, 200, 0.3), transparent) 1",
          }}
        />

        <div className="relative z-10 pt-10">
          {/* Row head — Netflix style */}
          <div className="row-head reveal px-4 mb-4">
            <h2
              className="text-white text-2xl md:text-3xl font-bold"
              style={{ letterSpacing: "0.01em" }}
            >
              Trending Now
            </h2>
            <a href="#" className="see-all" data-site-link>
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
            </a>
          </div>

          <div className="slider-wrap reveal reveal-delay-1">
            <div className="slider" id="slider1"></div>
          </div>
        </div>
      </section>

      {/* ✅ Features */}
      <section className="section" id="features">
        <div className="section-head reveal">
          <span className="kicker">WHY MOVIESVERSEBD</span>
          <h2>Built for <span className="accent">True Movie Lovers</span></h2>
          <p>The fastest, cleanest way to watch movies &amp; series in Bangladesh. No signup, no buffering, no hassle.</p>
        </div>

        <div className="features">
          <div className="feature-card reveal reveal-delay-1">
            <div className="icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></svg>
            </div>
            <h3>Instant Streaming</h3>
            <p>Click any movie and stream instantly. No waiting, no registration — just pure entertainment.</p>
          </div>

          <div className="feature-card reveal reveal-delay-2">
            <div className="icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2 4 6v6c0 5 3.5 9 8 10 4.5-1 8-5 8-10V6l-8-4z" /><path d="m9 12 2 2 4-4" /></svg>
            </div>
            <h3>100% Free &amp; Safe</h3>
            <p>No hidden fees. No shady downloads. Just pure content streamed securely to your device.</p>
          </div>

          <div className="feature-card reveal reveal-delay-3">
            <div className="icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M2 12h20M12 2a15 15 0 0 1 0 20 15 15 0 0 1 0-20z" /></svg>
            </div>
            <h3>Bangla Subtitles</h3>
            <p>Most movies include Bangla subtitles. Enjoy Hollywood, Bollywood, South Indian and more.</p>
          </div>

          <div className="feature-card reveal reveal-delay-4">
            <div className="icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 1 1-6.2-8.5" /><path d="M22 4v6h-6" /></svg>
            </div>
            <h3>Updated Daily</h3>
            <p>New releases land on MoviesVerseBD every single day. Never miss the latest hits again.</p>
          </div>
        </div>
      </section>

      {/* ✅ Top 10 */}
      <section className="row" id="top10">
        <div className="row-head reveal">
          <h2>Top 10 in Bangladesh Today</h2>
          <a href="#" className="see-all" data-site-link>
            See All
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 5l7 7-7 7" /></svg>
          </a>
        </div>
        <div className="slider-wrap reveal reveal-delay-1">
          <div className="slider" id="slider2"></div>
        </div>
      </section>

      {/* ✅ New Releases */}
      <section className="row" id="new">
        <div className="row-head reveal">
          <h2>New Releases</h2>
          <a href="#" className="see-all" data-site-link>
            See All
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 5l7 7-7 7" /></svg>
          </a>
        </div>
        <div className="slider-wrap reveal reveal-delay-1">
          <div className="slider" id="slider3"></div>
        </div>
      </section>

      {/* ✅ How It Works */}
      <section className="section" id="how">
        <div className="section-head reveal">
          <span className="kicker">SUPER SIMPLE</span>
          <h2>Enter in <span className="accent">3 Easy Steps</span></h2>
          <p>No signup. No email. No password. Just click the green button and start watching.</p>
        </div>

        <div className="features">
          <div className="feature-card reveal reveal-delay-1" style={{ textAlign: "center" }}>
            <div className="icon" style={{ margin: "0 auto 20px" }}>1</div>
            <h3>Click The Green Button</h3>
            <p>Tap the highlighted "Visit Main Site" button anywhere on this page to enter our official website.</p>
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

      {/* ✅ Big CTA */}
      <section className="big-cta reveal">
        <h2>Ready to <span className="accent">Start Watching?</span></h2>
        <p>Join thousands of Bangladeshi movie lovers already streaming on MoviesVerseBD. It's free, it's fast, and it's waiting for you.</p>
        <div className="cta-buttons">
          <a href="#" className="btn-site-main" data-site-link>
            <span className="label">Visit Main Site</span>
            <span className="arrow">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 5l7 7-7 7" /></svg>
            </span>
          </a>
        </div>
      </section>

      {/* ✅ Footer */}
      <footer>
        <div className="foot-top">
          <div className="foot-brand reveal">
            <div className="brand-lg">
              <span className="mv-text">MoviesVerse</span>
              <span className="bd-text">BD</span>
            </div>
            <p>Bangladesh's most loved movie streaming experience. Fast, free, and endlessly entertaining — with new titles added every single day.</p>
            <div className="social-row">
              <a href="#" aria-label="Facebook"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M22 12c0-5.5-4.5-10-10-10S2 6.5 2 12c0 5 3.6 9.1 8.4 9.9v-7H7.9V12h2.5V9.8c0-2.5 1.5-3.9 3.8-3.9 1.1 0 2.2.2 2.2.2v2.5h-1.3c-1.2 0-1.6.8-1.6 1.6V12h2.8l-.5 2.9h-2.3v7C18.4 21.1 22 17 22 12z" /></svg></a>
              <a href="#" aria-label="Instagram"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" /><path d="M16 11.4A4 4 0 1 1 12.6 8 4 4 0 0 1 16 11.4z" /><circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" /></svg></a>
              <a href="#" aria-label="YouTube"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M23 12s0-3.4-.4-5c-.2-.9-1-1.6-1.9-1.8C19 5 12 5 12 5s-7 0-8.7.4c-.9.2-1.6 1-1.8 1.9C1 9 1 12 1 12s0 3.4.4 5c.2.9 1 1.6 1.9 1.8C5 19 12 19 12 19s7 0 8.7-.4c.9-.2 1.6-1 1.8-1.9.5-1.5.5-4.7.5-4.7zM10 15V9l5 3-5 3z" /></svg></a>
              <a href="#" aria-label="Telegram"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M22 4.01c0-.79-.63-1.43-1.4-1.4-6.6.25-13.2.5-19.8.75-.74.03-1.3.66-1.3 1.4 0 2.98.02 5.96.05 8.94.01.55.4 1.01.93 1.15 2.6.68 5.2 1.36 7.8 2.04.32.08.44.47.22.71-.98 1.06-1.96 2.13-2.94 3.19-.36.4-.06 1.05.48.98 2.35-.29 4.7-.58 7.05-.87.55-.07.9-.6.78-1.13-.46-2.05-.92-4.1-1.38-6.15-.08-.36.2-.7.57-.68 1.94.1 3.87.19 5.8.29.85.04 1.5-.71 1.34-1.55-.72-3.75-1.44-7.5-2.16-11.25-.09-.45.08-.91.44-1.19.65-.5 1.34-1.03 2.05-1.57.35-.27.44-.76.22-1.14z" /></svg></a>
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
