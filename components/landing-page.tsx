'use client';

import { useEffect } from 'react';

interface LandingPageProps {
  onEnter: () => void;
}

export default function LandingPage({ onEnter }: LandingPageProps) {
  useEffect(() => {
    // ==== Floating Particles Generator ====
    const particleContainer = document.getElementById('landing-particles');
    if (!particleContainer) return;

    particleContainer.innerHTML = '';
    const PARTICLE_COUNT = 35;

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const p = document.createElement('div');
      p.classList.add('landing-particle');
      p.style.left = Math.random() * 100 + '%';
      p.style.animationDuration = Math.random() * 10 + 8 + 's';
      p.style.animationDelay = Math.random() * 10 + 's';
      const size = Math.random() * 4 + 2;
      p.style.width = size + 'px';
      p.style.height = size + 'px';
      const colors = ['#e50914', '#ff6b6b', '#ffb3b3', '#ffffff'];
      const c = colors[Math.floor(Math.random() * colors.length)];
      p.style.background = c;
      p.style.boxShadow = `0 0 10px ${c}, 0 0 20px ${c}`;
      particleContainer.appendChild(p);
    }

    // ==== Parallax effect on mouse move (desktop) ====
    const handleMouseMove = (e: MouseEvent) => {
      if (!window.matchMedia('(min-width: 768px)').matches) return;
      const x = (e.clientX / window.innerWidth - 0.5) * 20;
      const y = (e.clientY / window.innerHeight - 0.5) * 20;
      const container = document.querySelector('.landing-container') as HTMLElement;
      if (container) {
        container.style.transform = `translate(${x}px, ${y}px)`;
      }
    };

    document.addEventListener('mousemove', handleMouseMove);
    return () => document.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div className="landing-wrap">
      {/* Floating particles */}
      <div className="landing-particles" id="landing-particles"></div>

      <div className="landing-container">
        {/* Logo */}
        <a
          href="https://mvbds.xyz"
          className="landing-logo-wrap"
          aria-label="MVBDS Home"
        >
          <img
            src="https://i.postimg.cc/LXBMvk6B/photo-2025-12-11-09-16-17-removebg-preview.png"
            alt="MVBDS Logo"
            className="landing-logo"
          />
        </a>

        <h1 className="landing-title">Unlimited Movies &amp; Series</h1>

        <p className="landing-subtitle">
          Watch your favourite <span>movies</span>, <span>web series</span> &amp;{' '}
          <span>TV shows</span> in HD quality — anytime, anywhere. No ads. No
          limits. Just pure entertainment.
        </p>

        {/* CTA Button */}
        <button onClick={onEnter} className="landing-cta-btn">
          <span className="landing-icon-btn">🚀</span>
          <span>Enter Website</span>
          <span className="landing-arrow">→</span>
        </button>

        {/* 🖥️ DEVICE SHOWCASE */}
        <div className="landing-device-showcase">
          {/* Laptop Mockup */}
          <div className="landing-laptop">
            <div className="landing-laptop-screen">
              <div className="landing-laptop-camera"></div>
              <img
                src="https://i.postimg.cc/28rC9gGj/Screenshot-2026-09-26-134807.jpg"
                alt="MVBDS Desktop Preview"
                className="landing-laptop-img"
              />
            </div>
            <div className="landing-laptop-base">
              <div className="landing-laptop-notch"></div>
            </div>
          </div>

          {/* Mobile Mockup */}
          <div className="landing-mobile">
            <div className="landing-mobile-notch"></div>
            <div className="landing-mobile-screen">
              <img
                src="https://i.postimg.cc/VNdfBMRZ/Screenshot-20260926-134833-Chrome.jpg"
                alt="MVBDS Mobile Preview"
                className="landing-mobile-img"
              />
            </div>
            <div className="landing-mobile-home-bar"></div>
          </div>
        </div>

        {/* Features */}
        <div className="landing-features">
          <div className="landing-feature">
            <span className="landing-icon">🎬</span> HD Quality
          </div>
          <div className="landing-feature">
            <span className="landing-icon">⚡</span> Fast Streaming
          </div>
          <div className="landing-feature">
            <span className="landing-icon">🆓</span> Free Access
          </div>
          <div className="landing-feature">
            <span className="landing-icon">📱</span> All Devices
          </div>
        </div>
      </div>

      <footer className="landing-footer">
        Made with ❤️ for{' '}
        <a href="https://mvbds.xyz" target="_blank" rel="noopener noreferrer">
          MVBDS.xyz
        </a>{' '}
        • © 2025 All Rights Reserved
      </footer>
    </div>
  );
}
