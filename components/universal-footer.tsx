"use client"

import Link from "next/link"
import { Facebook, Send, Instagram, MessageCircle, Youtube, Music } from "lucide-react"

export default function UniversalFooter() {
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
      url: "https://www.tiktok.com/@moviesversebd?_r=1&_t=ZS-96egIldETCO",
      label: "TikTok",
      color: "hover:text-slate-300",
    },
  ]

  return (
    <footer className="relative overflow-hidden backdrop-blur-xl bg-black/50 border-t border-white/10">
      <div className="absolute inset-0 bg-gradient-to-t from-emerald-500/5 to-transparent pointer-events-none"></div>

      <div className="relative px-4 py-8 max-w-6xl mx-auto">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          {/* About Section */}
          <div className="space-y-4">
            <h3 className="text-white font-bold text-lg">Movies Verse BD</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Your ultimate entertainment destination for the best movies, series, and exclusive content in Bangladesh.
            </p>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h3 className="text-white font-bold text-lg">Quick Links</h3>
            <div className="space-y-2">
              <a
                href="#profile"
                className="text-slate-400 text-sm hover:text-emerald-400 transition-colors"
              >
                Profile
              </a>
              <a
                href="#about"
                className="text-slate-400 text-sm hover:text-emerald-400 transition-colors block"
              >
                About Us
              </a>
              <a
                href="#contact"
                className="text-slate-400 text-sm hover:text-emerald-400 transition-colors block"
              >
                Contact Us
              </a>
            </div>
          </div>

          {/* Social Links */}
          <div className="space-y-4">
            <h3 className="text-white font-bold text-lg">Follow Us</h3>
            <div className="flex gap-3 flex-wrap">
              {socialLinks.map((social) => {
                const Icon = social.icon
                return (
                  <a
                    key={social.label}
                    href={social.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`w-10 h-10 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-white transition-all duration-300 hover:bg-white/20 ${social.color}`}
                    title={social.label}
                  >
                    <Icon className="w-5 h-5" />
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
              © 2025 Movies Verse Bangladesh. All rights reserved.
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

      {/* Custom CSS for smooth animations */}
      <style jsx global>{`
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

        .animate-slideUp {
          animation: slideUp 0.5s ease-out;
        }
      `}</style>
    </footer>
  )
}
