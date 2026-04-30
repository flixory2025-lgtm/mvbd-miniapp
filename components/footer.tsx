"use client"

import { useState, useRef } from "react"

export default function Footer() {
  const [ripples, setRipples] = useState<Array<{ id: number; x: number; y: number }>>([])
  const rippleIdRef = useRef(0)

  const handleLinkClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    const id = rippleIdRef.current++
    setRipples((prev) => [...prev, { id, x, y }])

    setTimeout(() => {
      setRipples((prev) => prev.filter((r) => r.id !== id))
    }, 600)
  }

  return (
    <footer className="bg-black/40 backdrop-blur-xl border-t border-white/10 py-12 px-4 mt-12 relative overflow-hidden">
      <style>{`
        @keyframes waterRipple {
          0% {
            transform: scale(0);
            opacity: 1;
          }
          100% {
            transform: scale(2);
            opacity: 0;
          }
        }

        @keyframes networkMove1 {
          0% {
            transform: translate(0, 0);
          }
          100% {
            transform: translate(20px, -20px);
          }
        }

        @keyframes networkMove2 {
          0% {
            transform: translate(0, 0);
          }
          100% {
            transform: translate(-30px, 15px);
          }
        }

        @keyframes networkMove3 {
          0% {
            transform: translate(0, 0);
          }
          100% {
            transform: translate(25px, 25px);
          }
        }

        .network-bg {
          position: absolute;
          inset: 0;
          overflow: hidden;
          pointer-events: none;
          opacity: 0.15;
        }

        .network-line {
          position: absolute;
          background: linear-gradient(135deg, rgba(100, 200, 255, 0.4), transparent);
          border-radius: 50%;
        }

        .network-line-1 {
          width: 200px;
          height: 200px;
          top: -50px;
          left: 5%;
          border: 2px solid rgba(100, 200, 255, 0.3);
          animation: networkMove1 8s ease-in-out infinite;
        }

        .network-line-2 {
          width: 300px;
          height: 300px;
          top: 10%;
          right: 10%;
          border: 2px solid rgba(34, 197, 94, 0.2);
          animation: networkMove2 10s ease-in-out infinite;
        }

        .network-line-3 {
          width: 250px;
          height: 250px;
          bottom: -30px;
          right: 15%;
          border: 2px solid rgba(100, 200, 255, 0.25);
          animation: networkMove3 12s ease-in-out infinite;
        }

        .ripple {
          position: absolute;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(59, 130, 246, 0.4), transparent);
          pointer-events: none;
          animation: waterRipple 0.6s ease-out forwards;
        }

        .link-with-ripple {
          position: relative;
          overflow: hidden;
          z-index: 10;
        }

        .footer-content {
          position: relative;
          z-index: 20;
        }
      `}</style>

      {/* Network Background Animation */}
      <div className="network-bg">
        <div className="network-line network-line-1" />
        <div className="network-line network-line-2" />
        <div className="network-line network-line-3" />
      </div>
      <div className="footer-content max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          <div>
            <h3 className="text-white font-bold mb-4">আমাদের সম্পর্কে</h3>
            <p className="text-slate-400 text-sm">
              MoviesVerse হল বাংলাদেশের সেরা মুভি স্ট্রিমিং প্ল্যাটফর্ম যেখানে আপনি সর্বশেষ এবং ক্লাসিক মুভি উপভোগ করতে পারেন।
            </p>
          </div>
          <div>
            <h3 className="text-white font-bold mb-4">যোগাযোগ করুন</h3>
            <div className="space-y-2 text-slate-400 text-sm">
              <p>📧 Email: info@moviesverse.com</p>
              <p>📱 Telegram: @moviesversebdreq</p>
            </div>
          </div>
          <div>
            <h3 className="text-white font-bold mb-4">অনুসরণ করুন</h3>
            <div className="flex gap-4">
              <a
                href="https://www.facebook.com/groups/733950559669339/?ref=share&mibextid=NSMWBT"
                target="_blank"
                rel="noopener noreferrer"
                onClick={handleLinkClick}
                className="link-with-ripple text-blue-400 hover:text-blue-300 transition relative"
              >
                Facebook
                {ripples.map((ripple) => (
                  <div
                    key={ripple.id}
                    className="ripple"
                    style={{
                      width: "20px",
                      height: "20px",
                      left: `${ripple.x}px`,
                      top: `${ripple.y}px`,
                      marginLeft: "-10px",
                      marginTop: "-10px",
                    }}
                  />
                ))}
              </a>
              <a
                href="https://t.me/moviesversebdreq"
                target="_blank"
                rel="noopener noreferrer"
                onClick={handleLinkClick}
                className="link-with-ripple text-sky-400 hover:text-sky-300 transition relative"
              >
                Telegram
                {ripples.map((ripple) => (
                  <div
                    key={ripple.id}
                    className="ripple"
                    style={{
                      width: "20px",
                      height: "20px",
                      left: `${ripple.x}px`,
                      top: `${ripple.y}px`,
                      marginLeft: "-10px",
                      marginTop: "-10px",
                    }}
                  />
                ))}
              </a>
            </div>
          </div>
        </div>
        <div className="border-t border-slate-700 pt-8 text-center text-slate-400 text-sm">
          <p>&copy; 2025 MoviesVerse. সর্বাধিকার সংরক্ষিত।</p>
        </div>
      </div>
    </footer>
  )
}
