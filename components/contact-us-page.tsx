"use client"

import { useState } from "react"
import { Phone, Mail, MessageCircle, Youtube, Music, Send } from "lucide-react"
import UniversalFooter from "./universal-footer"

interface ContactLink {
  id: string
  title: string
  subtitle: string
  icon: any
  iconBg: string
  link: string
}

const contactLinks: ContactLink[] = [
  {
    id: "manager",
    title: "Manager",
    subtitle: "01945715199",
    icon: Phone,
    iconBg: "from-green-500 to-emerald-600",
    link: "tel:01945715199",
  },
  {
    id: "facebook",
    title: "Facebook",
    subtitle: "Visit our page",
    icon: () => (
      <svg viewBox="0 0 24 24" className="w-6 h-6 fill-white">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
      </svg>
    ),
    iconBg: "from-blue-500 to-blue-700",
    link: "https://www.facebook.com/moviesverse.bd",
  },
  {
    id: "telegram",
    title: "Telegram",
    subtitle: "All Channels",
    icon: () => (
      <svg viewBox="0 0 24 24" className="w-6 h-6 fill-white">
        <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
      </svg>
    ),
    iconBg: "from-sky-500 to-blue-500",
    link: "https://t.me/addlist/G-AjTDjHEW0yYTJl",
  },
  {
    id: "instagram",
    title: "Instagram",
    subtitle: "Follow us",
    icon: () => (
      <svg viewBox="0 0 24 24" className="w-6 h-6 fill-white">
        <path d="M12 0C8.74 0 8.333.015 7.053.072 5.775.132 4.905.333 4.117.6c-.788.306-1.459.717-2.126 1.384S.957 2.329.65 3.117c-.266.788-.468 1.658-.527 2.936C.008 8.333 0 8.74 0 12s.015 3.667.072 4.947c.06 1.277.261 2.148.528 2.936.306.788.717 1.459 1.384 2.126.667.667 1.339 1.078 2.126 1.384.788.266 1.658.468 2.936.527C8.333 23.992 8.74 24 12 24s3.667-.015 4.947-.072c1.277-.06 2.148-.261 2.936-.528.788-.306 1.459-.717 2.126-1.384.667-.667 1.078-1.339 1.384-2.126.266-.788.468-1.658.527-2.936.048-1.28.063-1.687.063-4.947s-.015-3.667-.072-4.947c-.06-1.277-.261-2.148-.528-2.936-.306-.788-.717-1.459-1.384-2.126C21.319 1.347 20.651.935 19.863.63c-.788-.266-1.658-.468-2.936-.527C15.667.008 15.26 0 12 0zm0 2.16c3.203 0 3.585.009 4.849.070 1.171.054 1.805.244 2.227.408.562.217.96.477 1.382.896.419.42.679.819.896 1.381.164.422.354 1.057.408 2.227.061 1.264.07 1.646.07 4.849s-.009 3.585-.07 4.849c-.054 1.171-.244 1.805-.408 2.227-.217.562-.477.96-.896 1.382-.42.419-.819.679-1.381.896-.422.164-1.057.354-2.227.408-1.264.061-1.646.07-4.849.07s-3.585-.009-4.849-.07c-1.171-.054-1.805-.244-2.227-.408-.562-.217-.96-.477-1.382-.896-.419-.42-.679-.819-.896-1.381-.164-.422-.354-1.057-.408-2.227-.061-1.264-.07-1.646-.07-4.849s.009-3.585.07-4.849c.054-1.171.244-1.805.408-2.227.217-.562.477-.96.896-1.382.42-.419.819-.679 1.381-.896.422-.164 1.057-.354 2.227-.408 1.264-.061 1.646-.07 4.849-.07z" />
        <circle cx="12" cy="12" r="3.6" />
        <circle cx="18.406" cy="5.594" r="0.864" />
      </svg>
    ),
    iconBg: "from-pink-500 to-rose-500",
    link: "https://www.instagram.com/moviesverse.bd?igsh=MWY1YTJqN2cwNDZlaA==",
  },
  {
    id: "whatsapp",
    title: "WhatsApp",
    subtitle: "Contact us",
    icon: () => (
      <svg viewBox="0 0 24 24" className="w-6 h-6 fill-white">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.67-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.076 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421-7.403h-.004c-1.426 0-2.753-.491-3.74-1.348l-.268-.202-2.772.722.732 2.653-.172.275c-.915 1.379-1.395 2.982-1.395 4.665 0 4.595 3.739 8.332 8.334 8.332 2.234 0 4.334-.862 5.923-2.422 1.588-1.56 2.462-3.645 2.462-5.909 0-4.595-3.739-8.332-8.335-8.332m6.487 15.413A9.982 9.982 0 0 1 12.073 21c-5.516 0-10-4.486-10-10 0-1.871.52-3.68 1.509-5.23l-1.61-5.808 5.981 1.551A9.986 9.986 0 0 1 12.073 1c5.516 0 10 4.486 10 10s-4.486 10-10 10" />
      </svg>
    ),
    iconBg: "from-green-500 to-emerald-600",
    link: "https://wa.me/qr/D2BVBPREHG4LH1",
  },
  {
    id: "youtube",
    title: "YouTube",
    subtitle: "Subscribe us",
    icon: Youtube,
    iconBg: "from-red-500 to-red-700",
    link: "https://youtube.com/@mvbdstudio?si=c5TXOD4la_YEYgkf",
  },
  {
    id: "tiktok",
    title: "TikTok",
    subtitle: "Follow us",
    icon: Music,
    iconBg: "from-slate-800 to-slate-900",
    link: "https://www.tiktok.com/@moviesversebd?_r=1&_t=ZS-96egIldETCO",
  },
]

export default function ContactUsPage() {
  const [hoveredId, setHoveredId] = useState<string | null>(null)

  const handleLinkClick = (link: string) => {
    window.open(link, "_blank")
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a12] via-[#050508] to-[#020206] pb-24">
      {/* Header */}
      <div className="sticky top-0 z-40 backdrop-blur-2xl bg-black/40 border-b border-white/10 shadow-xl">
        <div className="px-4 py-4 flex items-center justify-center">
          <h1 className="text-white font-bold text-2xl bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent">
            Contact Us
          </h1>
        </div>
      </div>

      <div className="px-4 py-6 max-w-2xl mx-auto space-y-6">
        {/* Introduction Card */}
        <div className="relative overflow-hidden rounded-3xl backdrop-blur-xl bg-white/5 border border-white/10 shadow-2xl transition-all duration-300 hover:shadow-cyan-500/5">
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-transparent to-emerald-500/5"></div>
          
          <div className="relative p-6">
            <h2 className="text-white font-bold text-xl mb-2 bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent">
              Get In Touch
            </h2>
            <p className="text-slate-300 text-sm leading-relaxed">
              Connect with us through any of our social media channels or contact our manager directly. We&apos;re always happy to hear from you!
            </p>
          </div>
        </div>

        {/* Contact Links */}
        <div className="relative overflow-hidden rounded-3xl backdrop-blur-xl bg-white/5 border border-white/10 shadow-2xl transition-all duration-300 hover:shadow-cyan-500/5">
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-transparent to-emerald-500/5"></div>
          
          <div className="relative p-6">
            <h3 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
              <Send className="w-5 h-5 text-emerald-400" />
              Connect With Us
            </h3>

            <div className="space-y-3">
              {contactLinks.map((item) => {
                const Icon = item.icon
                return (
                  <button
                    key={item.id}
                    onClick={() => handleLinkClick(item.link)}
                    onMouseEnter={() => setHoveredId(item.id)}
                    onMouseLeave={() => setHoveredId(null)}
                    className="group w-full flex items-center gap-4 rounded-2xl backdrop-blur-md bg-white/5 border border-white/10 hover:bg-white/10 p-4 transition-all duration-300 transform hover:scale-105 active:scale-95 cursor-pointer"
                  >
                    <div
                      className={`w-14 h-14 rounded-full bg-gradient-to-br ${item.iconBg} flex items-center justify-center flex-shrink-0 shadow-lg group-hover:scale-110 transition-transform duration-300`}
                    >
                      {typeof Icon === "function" ? <Icon /> : <Icon className="w-6 h-6 text-white" />}
                    </div>
                    <div className="text-left flex-1">
                      <p className="text-white font-semibold text-base group-hover:text-emerald-300 transition-colors">{item.title}</p>
                      <p className="text-slate-300 text-sm group-hover:text-slate-200 transition-colors">{item.subtitle}</p>
                    </div>
                    <div className={`transition-all duration-300 ${hoveredId === item.id ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-2"}`}>
                      <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* Info Card */}
        <div className="relative overflow-hidden rounded-3xl backdrop-blur-xl bg-white/5 border border-white/10 shadow-2xl transition-all duration-300 hover:shadow-emerald-500/5">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-cyan-500/5"></div>
          
          <div className="relative p-6">
            <h3 className="text-white font-bold text-lg mb-3">Quick Info</h3>
            <div className="space-y-2">
              <div className="flex items-start gap-3 text-slate-300 text-sm">
                <span className="text-emerald-400 mt-1">•</span>
                <p>Available on all major social platforms</p>
              </div>
              <div className="flex items-start gap-3 text-slate-300 text-sm">
                <span className="text-emerald-400 mt-1">•</span>
                <p>Direct contact through manager&apos;s phone number</p>
              </div>
              <div className="flex items-start gap-3 text-slate-300 text-sm">
                <span className="text-emerald-400 mt-1">•</span>
                <p>Fast response time on all channels</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Custom CSS for animations */}
      <style jsx global>{`
        ::-webkit-scrollbar {
          width: 8px;
        }
        ::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 10px;
        }
        ::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.2);
          border-radius: 10px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.3);
        }
      `}</style>
      <UniversalFooter />
    </div>
  )
}
