"use client"

import { useState, useRef } from "react"
import { Facebook, Send, Instagram, MessageCircle, Youtube, Music } from "lucide-react"

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

  const socialLinks = [
    {
      icon: Facebook,
      url: "https://www.facebook.com/moviesverse.bd",
      label: "Facebook",
      color: "hover:text-blue-400",
    },
    {
      icon: Send,
      url: "https://t.me/addlist/G-AjTDjHEW0yYTJl",
      label: "Telegram",
      color: "hover:text-sky-400",
    },
    {
      icon: Instagram,
      url: "https://www.instagram.com/moviesverse.bd?igsh=MWY1YTJqN2cwNDZlaA==",
      label: "Instagram",
      color: "hover:text-pink-400",
    },
    {
      icon: MessageCircle,
      url: "https://wa.me/qr/D2BVBPREHG4LH1",
      label: "WhatsApp",
      color: "hover:text-green-400",
    },
    {
      icon: Youtube,
      url: "https://youtube.com/@mvbdstudio?si=c5TXOD4la_YEYgkf",
      label: "YouTube",
      color: "hover:text-red-400",
    },
    {
      icon: Music,
      url: "https://www.tiktok.com/@mvbdstudio?is_from_webapp=1&sender_device=pc",
      label: "TikTok",
      color: "hover:text-slate-300",
    },
  ]

  return (
    <footer className="relative overflow-hidden backdrop-blur-xl bg-black/50 border-t border-white/10 mt-12">
      {/* Gradient Background Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-emerald-500/5 to-transparent pointer-events-none"></div>

      {/* Network Background Animation */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-15">
        <div className="absolute w-[200px] h-[200px] -top-[50px] left-[5%] border-2 border-cyan-400/30 rounded-full animate-networkMove1" />
        <div className="absolute w-[300px] h-[300px] top-[10%] right-[10%] border-2 border-emerald-400/20 rounded-full animate-networkMove2" />
        <div className="absolute w-[250px] h-[250px] -bottom-[30px] right-[15%] border-2 border-cyan-400/25 rounded-full animate-networkMove3" />
      </div>

      <div className="relative px-4 py-8 max-w-6xl mx-auto">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          {/* About Section */}
          <div className="space-y-4">
            <h3 className="text-white font-bold text-lg">Movies Verse BD</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              MoviesVerse হল বাংলাদেশের সেরা মুভি স্ট্রিমিং প্ল্যাটফর্ম যেখানে আপনি সর্বশেষ এবং ক্লাসিক মুভি উপভোগ করতে পারেন।
              <br />
              <span className="text-slate-500 text-xs mt-1 block">
                Your ultimate entertainment destination for the best movies, series, and exclusive content in Bangladesh.
              </span>
            </p>
          </div>

          {/* Contact & Quick Links */}
          <div className="space-y-4">
            <h3 className="text-white font-bold text-lg">যোগাযোগ করুন</h3>
            <div className="space-y-2 text-slate-400 text-sm">
              <p>📧 Email: info@moviesverse.com</p>
              <p>📱 Telegram: @moviesversebdreq</p>
            </div>
            <div className="pt-2 space-y-2">
              <h4 className="text-white/80 font-medium text-sm">Quick Links</h4>
              <div className="flex flex-wrap gap-4">
                <a
                  href="#profile"
                  className="text-slate-400 text-xs hover:text-emerald-400 transition-colors"
                >
                  Profile
                </a>
                <a
                  href="#about"
                  className="text-slate-400 text-xs hover:text-emerald-400 transition-colors"
                >
                  About Us
                </a>
                <a
                  href="#contact"
                  className="text-slate-400 text-xs hover:text-emerald-400 transition-colors"
                >
                  Contact Us
                </a>
              </div>
            </div>
          </div>

          {/* Social Links */}
          <div className="space-y-4">
            <h3 className="text-white font-bold text-lg">অনুসরণ করুন</h3>
            <div className="flex gap-3 flex-wrap">
              {socialLinks.map((social) => {
                const Icon = social.icon
                return (
                  <a
                    key={social.label}
                    href={social.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={handleLinkClick}
                    className={`relative overflow-hidden w-10 h-10 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-white transition-all duration-300 hover:bg-white/20 ${social.color}`}
                    title={social.label}
                  >
                    <Icon className="w-5 h-5" />
                    {ripples.map((ripple) => (
                      <div
                        key={ripple.id}
                        className="absolute w-5 h-5 rounded-full bg-gradient-radial from-blue-500/40 to-transparent pointer-events-none animate-waterRipple"
                        style={{
                          left: `${ripple.x}px`,
                          top: `${ripple.y}px`,
                          marginLeft: "-10px",
                          marginTop: "-10px",
                        }}
                      />
                    ))}
                  </a>
                )
              })}
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent mb-6"></div>

        {/* Bottom Section */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left">
          <div className="space-y-2">
            <p className="text-slate-500 text-xs">
              © 2025 MoviesVerse. সর্বাধিকার সংরক্ষিত। All rights reserved.
            </p>
            <div className="text-slate-600 text-xs">
              Made by{" "}
              <a
                href="https://wa.me/qr/R2ZGCQAMXWRPP1"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block ml-1 bg-gradient-to-r from-purple-400 via-pink-400 to-red-400 bg-clip-text text-transparent font-bold hover:opacity-80 transition-opacity cursor-pointer"
                style={{
                  fontStyle: "italic",
                  fontFamily: "cursive",
                  letterSpacing: "0.5px",
                }}
              >
                Abdul Mazid
              </a>
            </div>
          </div>

          <div className="flex gap-4 text-xs text-slate-500">
            <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
            <span>•</span>
            <a href="#" className="hover:text-white transition-colors">Terms & Conditions</a>
            <span>•</span>
            <a href="#" className="hover:text-white transition-colors">Contact</a>
          </div>
        </div>
      </div>

      {/* Global Animation Styles */}
      <style jsx global>{`
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

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-waterRipple {
          animation: waterRipple 0.6s ease-out forwards;
        }

        .animate-networkMove1 {
          animation: networkMove1 8s ease-in-out infinite alternate;
        }

        .animate-networkMove2 {
          animation: networkMove2 10s ease-in-out infinite alternate;
        }

        .animate-networkMove3 {
          animation: networkMove3 12s ease-in-out infinite alternate;
        }

        .animate-slideUp {
          animation: slideUp 0.5s ease-out;
        }

        .bg-gradient-radial {
          background: radial-gradient(circle, rgba(59, 130, 246, 0.4), transparent);
        }
      `}</style>
    </footer>
  )
}
