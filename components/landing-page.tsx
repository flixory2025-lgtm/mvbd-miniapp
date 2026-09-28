"use client";

import React, { useEffect, useRef } from "react";

export default function LandingPage() {
  const slidesRef = useRef<HTMLDivElement>(null);
  const dotsRef = useRef<HTMLDivElement>(null);
  const typingRef = useRef<HTMLSpanElement>(null);

  // সব inline HTML inject করার জন্য (dangerouslySetInnerHTML approach)
  const htmlContent = `
    <div class="zoom-vignette"></div>
    <div class="zoom-flash"></div>

    <nav id="nav">
      <div class="nav-left">
        <div class="brand">
          <span class="mv-text">MoviesVerse</span><span class="bd-text">BD</span>
          <small>STREAM</small>
        </div>
        <div class="nav-links">
          <a href="#" class="active">Home</a>
          <a href="#trending">Trending</a>
          <a href="#top10">Top 10</a>
          <a href="#new">New</a>
          <a href="#how">How It Works</a>
        </div>
      </div>
      <div class="nav-right">
        <a href="#" class="nav-cta" data-site-link>
          <span>Visit Main Site</span>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 5l7 7-7 7"/></svg>
        </a>
      </div>
    </nav>

    <section class="hero">
      <div id="heroSlides"></div>

      <div class="hero-content">
        <div class="hero-tag animate">
          <span class="mv-logo">MV</span>
          <span class="divider"></span>
          <span class="tag-text">ORIGINAL SERIES</span>
          <span class="divider"></span>
          <span class="cat">Trending #1</span>
        </div>

        <h1 class="hero-title animate">
          <span class="line"><span>Nebula</span></span>
          <span class="line"><span>Protocol</span></span>
        </h1>

        <div class="hero-meta animate">
          <span class="imdb">IMDb 9.1</span>
          <span>2025</span>
          <span>·</span>
          <span>Season 2 · 8 Episodes</span>
          <span class="chip hd">HD</span>
          <span class="chip uahd">4K UHD</span>
        </div>

        <p class="hero-desc animate">
          When a rogue AI threatens to unravel reality itself, a fractured team of
          scientists must race across parallel universes to stop it — before every
          version of them ceases to exist.
        </p>

        <div class="hero-actions">
          <a href="#" class="btn-site-main" data-site-link>
            <span class="label">Visit Main Site</span>
            <span class="arrow">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 5l7 7-7 7"/></svg>
            </span>
          </a>

          <button class="btn-icon-round" aria-label="More info">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="20" height="20"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>
          </button>
        </div>

        <div class="site-hint">
          <svg class="check-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m9 12 2 2 4-4"/><circle cx="12" cy="12" r="10"/></svg>
          <span class="typing-text" id="typingText"></span>
          <span class="caret"></span>
        </div>
      </div>

      <div class="hero-rating">
        <span class="age">16+</span>
      </div>

      <div class="hero-indicator" id="heroDots"></div>
    </section>

    <div class="steps-bar reveal">
      <div class="step-item">
        <div class="num-badge">1</div>
        <div class="text">
          <strong>Click "Visit Main Site"</strong>
          <span>The green button takes you to our official website</span>
        </div>
      </div>
      <div class="step-item">
        <div class="num-badge">2</div>
        <div class="text">
          <strong>Browse Movies &amp; Series</strong>
          <span>Explore thousands of titles across all genres</span>
        </div>
      </div>
      <div class="step-item">
        <div class="num-badge">3</div>
        <div class="text">
          <strong>Stream &amp; Enjoy</strong>
          <span>Watch instantly in HD — no signup, no ads</span>
        </div>
      </div>
    </div>

    <section class="row" id="trending">
      <div class="row-head reveal">
        <h2>Trending Now <span class="badge-genre">HOT</span></h2>
        <a href="#" class="see-all" data-site-link>
          See All
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 5l7 7-7 7"/></svg>
        </a>
      </div>
      <div class="slider-wrap reveal reveal-delay-1">
        <div class="slider" id="slider1"></div>
      </div>
    </section>

    <section class="section" id="features">
      <div class="section-head reveal">
        <span class="kicker">WHY MOVIESVERSEBD</span>
        <h2>Built for <span class="accent">True Movie Lovers</span></h2>
        <p>The fastest, cleanest way to watch movies &amp; series in Bangladesh. No signup, no buffering, no hassle.</p>
      </div>

      <div class="features">
        <div class="feature-card reveal reveal-delay-1">
          <div class="icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
          </div>
          <h3>Instant Streaming</h3>
          <p>Click any movie and stream instantly. No waiting, no registration — just pure entertainment.</p>
        </div>

        <div class="feature-card reveal reveal-delay-2">
          <div class="icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2 4 6v6c0 5 3.5 9 8 10 4.5-1 8-5 8-10V6l-8-4z"/><path d="m9 12 2 2 4-4"/></svg>
          </div>
          <h3>100% Free &amp; Safe</h3>
          <p>No hidden fees. No shady downloads. Just pure content streamed securely to your device.</p>
        </div>

        <div class="feature-card reveal reveal-delay-3">
          <div class="icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15 15 0 0 1 0 20 15 15 0 0 1 0-20z"/></svg>
          </div>
          <h3>Bangla Subtitles</h3>
          <p>Most movies include Bangla subtitles. Enjoy Hollywood, Bollywood, South Indian and more.</p>
        </div>

        <div class="feature-card reveal reveal-delay-4">
          <div class="icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-6.2-8.5"/><path d="M22 4v6h-6"/></svg>
          </div>
          <h3>Updated Daily</h3>
          <p>New releases land on MoviesVerseBD every single day. Never miss the latest hits again.</p>
        </div>
      </div>
    </section>

    <section class="row" id="top10">
      <div class="row-head reveal">
        <h2>Top 10 in Bangladesh Today</h2>
        <a href="#" class="see-all" data-site-link>
          See All
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 5l7 7-7 7"/></svg>
        </a>
      </div>
      <div class="slider-wrap reveal reveal-delay-1">
        <div class="slider" id="slider2"></div>
      </div>
    </section>

    <section class="row" id="new">
      <div class="row-head reveal">
        <h2>New Releases</h2>
        <a href="#" class="see-all" data-site-link>
          See All
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 5l7 7-7 7"/></svg>
        </a>
      </div>
      <div class="slider-wrap reveal reveal-delay-1">
        <div class="slider" id="slider3"></div>
      </div>
    </section>

    <section class="section" id="how">
      <div class="section-head reveal">
        <span class="kicker">SUPER SIMPLE</span>
        <h2>Enter in <span class="accent">3 Easy Steps</span></h2>
        <p>No signup. No email. No password. Just click the green button and start watching.</p>
      </div>

      <div class="features">
        <div class="feature-card reveal reveal-delay-1" style="text-align:center;">
          <div class="icon" style="margin: 0 auto 20px;">1</div>
          <h3>Click The Green Button</h3>
          <p>Tap the highlighted "Visit Main Site" button anywhere on this page to enter our official website.</p>
        </div>

        <div class="feature-card reveal reveal-delay-2" style="text-align:center;">
          <div class="icon" style="margin: 0 auto 20px;">2</div>
          <h3>Pick Your Movie</h3>
          <p>Browse hundreds of movies and web series. Use categories or search to find what you love.</p>
        </div>

        <div class="feature-card reveal reveal-delay-3" style="text-align:center;">
          <div class="icon" style="margin: 0 auto 20px;">3</div>
          <h3>Stream &amp; Enjoy</h3>
          <p>Hit play and enjoy. Download for offline or watch online — MoviesVerseBD has you covered.</p>
        </div>
      </div>
    </section>

    <section class="big-cta reveal">
      <h2>Ready to <span class="accent">Start Watching?</span></h2>
      <p>Join thousands of Bangladeshi movie lovers already streaming on MoviesVerseBD. It's free, it's fast, and it's waiting for you.</p>
      <div class="cta-buttons">
        <a href="#" class="btn-site-main" data-site-link>
          <span class="label">Visit Main Site</span>
          <span class="arrow">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 5l7 7-7 7"/></svg>
          </span>
        </a>
      </div>
    </section>

    <footer>
      <div class="foot-top">
        <div class="foot-brand reveal">
          <div class="brand-lg">
            <span class="mv-text">MoviesVerse</span><span class="bd-text">BD</span>
          </div>
          <p>Bangladesh's most loved movie streaming experience. Fast, free, and endlessly entertaining — with new titles added every single day.</p>
          <div class="social-row">
            <a href="#" aria-label="Facebook"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M22 12c0-5.5-4.5-10-10-10S2 6.5 2 12c0 5 3.6 9.1 8.4 9.9v-7H7.9V12h2.5V9.8c0-2.5 1.5-3.9 3.8-3.9 1.1 0 2.2.2 2.2.2v2.5h-1.3c-1.2 0-1.6.8-1.6 1.6V12h2.8l-.5 2.9h-2.3v7C18.4 21.1 22 17 22 12z"/></svg></a>
            <a href="#" aria-label="Instagram"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="20" rx="5"/><path d="M16 11.4A4 4 0 1 1 12.6 8 4 4 0 0 1 16 11.4z"/><circle cx="17.5" cy="6.5" r="0.5" fill="currentColor"/></svg></a>
            <a href="#" aria-label="YouTube"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M23 12s0-3.4-.4-5c-.2-.9-1-1.6-1.9-1.8C19 5 12 5 12 5s-7 0-8.7.4c-.9.2-1.6 1-1.8 1.9C1 9 1 12 1 12s0 3.4.4 5c.2.9 1 1.6 1.9 1.8C5 19 12 19 12 19s7 0 8.7-.4c.9-.2 1.6-1 1.8-1.9.5-1.5.5-4.7.5-4.7zM10 15V9l5 3-5 3z"/></svg></a>
            <a href="#" aria-label="Telegram"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M22 4.01c0-.79-.63-1.43-1.4-1.4-6.6.25-13.2.5-19.8.75-.74.03-1.3.66-1.3 1.4 0 2.98.02 5.96.05 8.94.01.55.4 1.01.93 1.15 2.6.68 5.2 1.36 7.8 2.04.32.08.44.47.22.71-.98 1.06-1.96 2.13-2.94 3.19-.36.4-.06 1.05.48.98 2.35-.29 4.7-.58 7.05-.87.55-.07.9-.6.78-1.13-.46-2.05-.92-4.1-1.38-6.15-.08-.36.2-.7.57-.68 1.94.1 3.87.19 5.8.29.85.04 1.5-.71 1.34-1.55-.72-3.75-1.44-7.5-2.16-11.25-.09-.45.08-.91.44-1.19.65-.5 1.34-1.03 2.05-1.57.35-.27.44-.76.22-1.14z"/></svg></a>
          </div>
        </div>

        <div class="foot-col reveal reveal-delay-1">
          <h5>Browse</h5>
          <a href="#trending">Trending</a>
          <a href="#top10">Top 10 Today</a>
          <a href="#new">New Releases</a>
          <a href="#">Hollywood</a>
          <a href="#">Bollywood</a>
          <a href="#">Web Series</a>
        </div>

        <div class="foot-col reveal reveal-delay-2">
          <h5>Genres</h5>
          <a href="#">Action</a>
          <a href="#">Thriller</a>
          <a href="#">Drama</a>
          <a href="#">Sci-Fi</a>
          <a href="#">Romance</a>
          <a href="#">Horror</a>
        </div>

        <div class="foot-col reveal reveal-delay-3">
          <h5>Support</h5>
          <a href="#">How To Watch</a>
          <a href="#">FAQ</a>
          <a href="#">Request a Movie</a>
          <a href="#">Report Issue</a>
          <a href="#">Contact Us</a>
        </div>

        <div class="foot-col reveal reveal-delay-4">
          <h5>Legal</h5>
          <a href="#">Terms of Use</a>
          <a href="#">Privacy Policy</a>
          <a href="#">DMCA</a>
          <a href="#">Disclaimer</a>
          <a href="#">Cookies</a>
        </div>
      </div>

      <div class="foot-bottom">
        <div class="legal">
          <a href="#">Terms</a>
          <a href="#">Privacy</a>
          <a href="#">DMCA</a>
          <a href="#">Sitemap</a>
        </div>
        <div class="made-with">
          © 2025 MoviesVerseBD · Crafted with <span class="heart">❤</span> in Bangladesh
        </div>
      </div>
    </footer>
  `;

  useEffect(() => {
    // ==================== DATA ====================
    const posters = [
      "https://i.postimg.cc/qBG6ydw2/MV5BMTk4NTk4MTk1OF5BMl5Ban-Bn-Xk-Ft-ZTcw-NTE2MDIw-NA-V1.jpg",
      "https://i.postimg.cc/J44DQdd1/MV5BYm-I3Yj-Jk-N2It-Y2Zm-YS00Y2Jh-LTk2YTQt-Yz-E5YWU5ODI1Mz-Jm-Xk-Ey-Xk-Fqc-Gc-V1.jpg",
      "https://i.postimg.cc/65j7bLDQ/MV5BZGVm-Nz-Rl-ZTct-NTU2OS00MTQw-LWI2ZWQt-OGVi-Mjc4ODNl-Nz-Vm-Xk-Ey-Xk-Fqc-Gc-V1-QL75-UX1080.jpg",
      "https://i.postimg.cc/bwZZ7Shb/c27aec8ab39db4bed60c8bc5e5b0f02d.jpg",
      "https://i.postimg.cc/4xjYs44x/MV5BNDg3ZGMw-ODAt-MGQ0YS00Ym-Mw-LWI3Nm-Ut-MWYz-NDE3Zj-Y1ODRk-Xk-Ey-Xk-Fqc-Gc-V1.jpg",
      "https://i.postimg.cc/Wzp3Xh85/MV5BMDBm-Zm-Rl-OWEt-YWZl-Yi00Nz-Vk-LTk5Zj-Et-YTVm-MDQ3ODZk-MGNh-Xk-Ey-Xk-Fqc-Gc-V1.jpg",
      "https://i.postimg.cc/9Mhzwxqn/images.jpg",
      "https://i.postimg.cc/Y28jjz2n/netflix-the-silent-sea-character-poster-bae-doona-gong-yoo-v0-2eb5ltwohf281.jpg",
      "https://i.postimg.cc/yxfN5srV/MV5BOTk5YWY5MDAt-NGZm-OC00Mj-E4LWEz-MWYt-MTJj-ODNi-MTVj-M2Uw-Xk-Ey-Xk-Fqc-Gc-V1.jpg"
    ];

    const slideData = [
      { tag: "ORIGINAL SERIES", cat: "Trending #1", title: ["Nebula", "Protocol"], imdb: "9.1", year: "2025", extra: "Season 2 · 8 Episodes", desc: "When a rogue AI threatens to unravel reality itself, a fractured team of scientists must race across parallel universes to stop it — before every version of them ceases to exist." },
      { tag: "FEATURED FILM", cat: "Now Streaming", title: ["Deep", "Water"], imdb: "8.7", year: "2024", extra: "1h 58m · Thriller", desc: "A deep-sea salvage crew discovers a sunken vessel that shouldn't exist. As they descend further, they realize the ocean is hiding something far older than humanity itself." },
      { tag: "MV ORIGINAL", cat: "New Season", title: ["Scarlet", "Hour"], imdb: "9.4", year: "2025", extra: "Season 1 · 10 Episodes", desc: "In a city that never sleeps, a brilliant detective with a shattered past hunts a killer whose crimes are always committed at the exact moment the clock strikes scarlet." },
      { tag: "BLOCKBUSTER", cat: "Top Rated", title: ["Midnight", "Fall"], imdb: "8.9", year: "2025", extra: "2h 12m · Action", desc: "One night. One city. One man against an empire. A relentless ex-agent must dismantle a criminal network before sunrise — or lose everything he loves." },
      { tag: "SCI-FI EPIC", cat: "Fan Favorite", title: ["Echoes of", "Tomorrow"], imdb: "9.0", year: "2025", extra: "Season 1 · 12 Episodes", desc: "A physicist discovers her dreams are actually messages from a parallel version of herself — one that's warning her about an imminent catastrophe." },
      { tag: "CRIME DRAMA", cat: "Award Winner", title: ["Crimson", "Tide"], imdb: "8.8", year: "2024", extra: "1h 45m · Drama", desc: "A small coastal town hides a dark secret beneath its calm waves. When a stranger arrives, long-buried truths threaten to drown everyone involved." },
      { tag: "MYSTERY", cat: "New Release", title: ["Hidden", "Truth"], imdb: "8.3", year: "2025", extra: "1h 38m · Mystery", desc: "A journalist investigating a cold case discovers the victim was living a double life — and the killer may be closer to her than she ever imagined." },
      { tag: "NETFLIX SERIES", cat: "Global Hit", title: ["The Silent", "Sea"], imdb: "8.5", year: "2024", extra: "Season 1 · 8 Episodes", desc: "On a lunar research station, a team of elite astronauts is sent to retrieve a mysterious sample. What they find will change humanity forever." },
      { tag: "WEB SERIES", cat: "Just Added", title: ["Shadow", "Lines"], imdb: "8.6", year: "2025", extra: "Season 1 · 10 Episodes", desc: "A homicide detective and a convicted criminal form an unlikely alliance to solve a series of murders that have haunted the city for decades." }
    ];

    // ==================== BUILD HERO SLIDES ====================
    const heroSlidesContainer = document.getElementById('heroSlides');
    const heroDotsContainer = document.getElementById('heroDots');

    if (heroSlidesContainer && heroDotsContainer) {
      slideData.forEach((slide, i) => {
        const slideEl = document.createElement('div');
        slideEl.className = 'hero-slide' + (i === 0 ? ' active' : '');
        slideEl.dataset.slide = String(i);
        slideEl.style.backgroundImage = `
          linear-gradient(to top, #0b0b0f 0%, rgba(11,11,15,0.75) 18%, rgba(11,11,15,0.35) 55%, rgba(11,11,15,0.75) 100%),
          linear-gradient(to right, rgba(11,11,15,0.88) 0%, rgba(11,11,15,0.4) 45%, transparent 75%),
          url('${posters[i]}')
        `;
        slideEl.style.backgroundSize = 'cover, cover, cover';
        slideEl.style.backgroundPosition = 'center, center, center 20%';
        heroSlidesContainer.appendChild(slideEl);

        const dotEl = document.createElement('div');
        dotEl.className = 'dot' + (i === 0 ? ' active' : '');
        dotEl.dataset.dot = String(i);
        dotEl.addEventListener('click', () => {
          goToSlide(i);
          startTimer();
        });
        heroDotsContainer.appendChild(dotEl);
      });
    }

    const slides = document.querySelectorAll('.hero-slide');
    const dots = document.querySelectorAll('.dot');

    let currentSlide = 0;
    let slideTimer: ReturnType<typeof setInterval> | null = null;

    function goToSlide(i: number) {
      slides.forEach((s, idx) => s.classList.toggle('active', idx === i));
      dots.forEach((d, idx) => d.classList.toggle('active', idx === i));

      const data = slideData[i];
      const tagEl = document.querySelector('.hero-tag');
      const titleEl = document.querySelector('.hero-title');
      const metaEl = document.querySelector('.hero-meta');
      const descEl = document.querySelector('.hero-desc');

      [tagEl, titleEl, metaEl, descEl].forEach((el) => {
        if (el) {
          el.classList.remove('animate');
          void (el as HTMLElement).offsetWidth;
        }
      });

      if (tagEl) {
        tagEl.innerHTML = `
          <span class="mv-logo">MV</span>
          <span class="divider"></span>
          <span>${data.tag}</span>
          <span class="divider"></span>
          <span class="cat">${data.cat}</span>
        `;
      }

      if (titleEl) {
        titleEl.innerHTML = `
          <span class="line"><span>${data.title[0]}</span></span>
          <span class="line"><span>${data.title[1]}</span></span>
        `;
      }

      if (metaEl) {
        metaEl.innerHTML = `
          <span class="imdb">IMDb ${data.imdb}</span>
          <span>${data.year}</span>
          <span>·</span>
          <span>${data.extra}</span>
          <span class="chip hd">HD</span>
          <span class="chip uahd">4K UHD</span>
        `;
      }

      if (descEl) descEl.textContent = data.desc;

      void (tagEl as HTMLElement)?.offsetWidth;
      tagEl?.classList.add('animate');
      titleEl?.classList.add('animate');
      metaEl?.classList.add('animate');
      descEl?.classList.add('animate');
    }

    function nextSlide() {
      currentSlide = (currentSlide + 1) % slides.length;
      goToSlide(currentSlide);
    }

    function startTimer() {
      if (slideTimer) clearInterval(slideTimer);
      slideTimer = setInterval(nextSlide, 4500);
    }

    startTimer();

    // ==================== TYPING ====================
    const typingMessages = [
      "Click the green button above to enter MoviesVerseBD",
      "Stream thousands of movies in HD — completely free",
      "Bangla subtitles available for most titles",
      "New releases added every single day",
      "No signup required. Just click and watch.",
      "Bangladesh's most loved streaming experience",
      "Hollywood · Bollywood · South Indian · Web Series",
      "Your next favourite movie is one click away"
    ];

    const typingEl = document.getElementById('typingText');
    let msgIndex = 0;
    let charIndex = 0;
    let isDeleting = false;
    let typingTimeout: ReturnType<typeof setTimeout>;

    function typeLoop() {
      if (!typingEl) return;
      const currentMsg = typingMessages[msgIndex];
      const typingSpeed = isDeleting ? 25 : 55;
      const pauseAfter = isDeleting ? 300 : 1800;

      if (!isDeleting) {
        typingEl.textContent = currentMsg.substring(0, charIndex + 1);
        charIndex++;
        if (charIndex === currentMsg.length) {
          isDeleting = true;
          typingTimeout = setTimeout(typeLoop, pauseAfter);
          return;
        }
        typingTimeout = setTimeout(typeLoop, typingSpeed);
      } else {
        typingEl.textContent = currentMsg.substring(0, charIndex - 1);
        charIndex--;
        if (charIndex === 0) {
          isDeleting = false;
          msgIndex = (msgIndex + 1) % typingMessages.length;
          typingTimeout = setTimeout(typeLoop, 400);
          return;
        }
        typingTimeout = setTimeout(typeLoop, typingSpeed);
      }
    }

    typingTimeout = setTimeout(typeLoop, 1600);

    // ==================== ZOOM TRANSITION ====================
    function performZoomTransition(sourceElement?: HTMLElement | null) {
      if (document.documentElement.classList.contains('zooming')) return;

      let clickX = window.innerWidth / 2;
      let clickY = window.innerHeight / 2;
      if (sourceElement) {
        const rect = sourceElement.getBoundingClientRect();
        clickX = rect.left + rect.width / 2;
        clickY = rect.top + rect.height / 2;
      }

      const ripple = document.createElement('div');
      ripple.className = 'click-ripple';
      const size = 40;
      ripple.style.width = size + 'px';
      ripple.style.height = size + 'px';
      ripple.style.left = clickX + 'px';
      ripple.style.top = clickY + 'px';
      document.body.appendChild(ripple);

      document.documentElement.classList.add('zooming');

      setTimeout(() => {
        // Navigate to actual home page
        window.location.href = "/home";
      }, 720);
    }

    document.querySelectorAll('[data-site-link]').forEach((link) => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        performZoomTransition(link as HTMLElement);
      });
    });

    // ==================== NAV SCROLL ====================
    const nav = document.getElementById('nav');
    const handleScroll = () => {
      if (window.scrollY > 40) nav?.classList.add('scrolled');
      else nav?.classList.remove('scrolled');
    };
    window.addEventListener('scroll', handleScroll);

    // ==================== SCROLL REVEAL ====================
    const revealObs = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) entry.target.classList.add('visible');
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -60px 0px' }
    );
    document.querySelectorAll('.reveal').forEach((el) => revealObs.observe(el));

    // ==================== MOVIE ROWS ====================
    const row1 = [
      { title: "Nebula Protocol", rating: "9.1", badge: "top10", poster: posters[0] },
      { title: "Deep Water", rating: "8.7", badge: "new", poster: posters[1] },
      { title: "Scarlet Hour", rating: "9.4", badge: "top10", poster: posters[2] },
      { title: "Midnight Fall", rating: "8.9", poster: posters[3] },
      { title: "The Silent Sea", rating: "8.5", badge: "new", poster: posters[7] },
      { title: "Echoes of Tomorrow", rating: "9.0", badge: "top10", poster: posters[4] },
      { title: "Hidden Truth", rating: "8.3", poster: posters[6] },
      { title: "Crimson Tide", rating: "8.8", poster: posters[5] },
      { title: "Shadow Lines", rating: "8.6", badge: "new", poster: posters[8] }
    ];

    const row2 = [
      { title: "Scarlet Hour", rating: "9.4", rank: 1, poster: posters[2] },
      { title: "Nebula Protocol", rating: "9.1", rank: 2, poster: posters[0] },
      { title: "Echoes of Tomorrow", rating: "9.0", rank: 3, poster: posters[4] },
      { title: "Midnight Fall", rating: "8.9", rank: 4, poster: posters[3] },
      { title: "Crimson Tide", rating: "8.8", rank: 5, poster: posters[5] },
      { title: "Deep Water", rating: "8.7", rank: 6, poster: posters[1] },
      { title: "Shadow Lines", rating: "8.6", rank: 7, poster: posters[8] },
      { title: "The Silent Sea", rating: "8.5", rank: 8, poster: posters[7] },
      { title: "Hidden Truth", rating: "8.3", rank: 9, poster: posters[6] }
    ];

    const row3 = [
      { title: "Velvet Empire", rating: "8.4", badge: "new", poster: posters[3] },
      { title: "Zero Gravity", rating: "8.6", badge: "new", poster: posters[0] },
      { title: "Iron Lotus", rating: "8.2", badge: "new", poster: posters[5] },
      { title: "Last Train to Dhaka", rating: "9.0", badge: "new", poster: posters[2] },
      { title: "The Glass Prince", rating: "8.5", badge: "new", poster: posters[7] },
      { title: "Neon Harvest", rating: "8.3", badge: "new", poster: posters[1] },
      { title: "Broken Compass", rating: "8.1", badge: "new", poster: posters[4] },
      { title: "Silent Symphony", rating: "8.7", badge: "new", poster: posters[8] },
      { title: "Ghost Frequency", rating: "8.4", badge: "new", poster: posters[6] }
    ];

    function buildCard(movie: any) {
      const card = document.createElement('div');
      card.className = 'card';

      let badgeHTML = '';
      if (movie.badge === 'top10') badgeHTML = `<span class="top10-badge">TOP 10</span>`;
      else if (movie.badge === 'new') badgeHTML = `<span class="new-badge">NEW</span>`;
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

      card.addEventListener('click', () => {
        performZoomTransition(card);
      });

      return card;
    }

    document.getElementById('slider1')?.append(...row1.map(buildCard));
    document.getElementById('slider2')?.append(...row2.map(buildCard));
    document.getElementById('slider3')?.append(...row3.map(buildCard));

    // ==================== DRAG TO SCROLL ====================
    document.querySelectorAll('.slider').forEach((slider) => {
      let isDown = false;
      let startX = 0;
      let scrollLeft = 0;
      let moved = false;

      slider.addEventListener('mousedown', (e: any) => {
        isDown = true;
        moved = false;
        (slider as HTMLElement).style.cursor = 'grabbing';
        startX = e.pageX - (slider as HTMLElement).offsetLeft;
        scrollLeft = (slider as HTMLElement).scrollLeft;
      });
      slider.addEventListener('mouseleave', () => {
        isDown = false;
        (slider as HTMLElement).style.cursor = 'grab';
      });
      slider.addEventListener('mouseup', () => {
        isDown = false;
        (slider as HTMLElement).style.cursor = 'grab';
      });
      slider.addEventListener('mousemove', (e: any) => {
        if (!isDown) return;
        e.preventDefault();
        const x = e.pageX - (slider as HTMLElement).offsetLeft;
        const walk = (x - startX) * 1.6;
        if (Math.abs(walk) > 5) moved = true;
        (slider as HTMLElement).scrollLeft = scrollLeft - walk;
      });
      slider.addEventListener(
        'click',
        (e: any) => {
          if (moved) {
            e.preventDefault();
            e.stopPropagation();
          }
        },
        true
      );
      (slider as HTMLElement).style.cursor = 'grab';

      slider.addEventListener(
        'wheel',
        (e: any) => {
          if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
            e.preventDefault();
            (slider as HTMLElement).scrollLeft += e.deltaY;
          }
        },
        { passive: false }
      );
    });

    // Cleanup
    return () => {
      if (slideTimer) clearInterval(slideTimer);
      clearTimeout(typingTimeout);
      window.removeEventListener('scroll', handleScroll);
      revealObs.disconnect();
    };
  }, []);

  return (
    <div
      className="landing-page-root"
      dangerouslySetInnerHTML={{ __html: htmlContent }}
    />
  );
}
