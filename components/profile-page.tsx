"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { Phone, User, Mail, Calendar, Settings, MessageCircle, Info } from "lucide-react"

interface ProfileData {
  name: string
  age: string
  email: string
  phone: string
}

interface ProfilePageProps {
  onNavigate?: (page: "contact" | "about" | "settings") => void
}

const socialLinks = [
  {
    id: "manager",
    title: "Manager",
    subtitle: "01945715199",
    icon: Phone,
    iconBg: "from-green-500 to-emerald-600",
    link: "tel:01945715199",
  },
  {
    id: "fb-page1",
    title: "Facebook Page 1",
    subtitle: "Visit our page",
    icon: () => (
      <svg viewBox="0 0 24 24" className="w-6 h-6 fill-white">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
      </svg>
    ),
    iconBg: "from-blue-500 to-blue-700",
    link: "https://www.facebook.com/share/14V2B4K8zkC/",
  },
  {
    id: "fb-page2",
    title: "Facebook Page 2",
    subtitle: "Visit our page",
    icon: () => (
      <svg viewBox="0 0 24 24" className="w-6 h-6 fill-white">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
      </svg>
    ),
    iconBg: "from-blue-500 to-blue-700",
    link: "https://www.facebook.com/share/1AWJvyVYZt/",
  },
  {
    id: "private-group",
    title: "Private Request Group",
    subtitle: "Join our private group",
    icon: () => (
      <svg viewBox="0 0 24 24" className="w-6 h-6 fill-white">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
      </svg>
    ),
    iconBg: "from-blue-500 to-blue-700",
    link: "https://www.facebook.com/groups/963258709145001/?ref=share&mibextid=NSMWBT",
  },
  {
    id: "public-group",
    title: "Public Request Group",
    subtitle: "Join our public group",
    icon: () => (
      <svg viewBox="0 0 24 24" className="w-6 h-6 fill-white">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
      </svg>
    ),
    iconBg: "from-blue-500 to-blue-700",
    link: "https://www.facebook.com/groups/733950559669339/?ref=share&mibextid=NSMWBT",
  },
  {
    id: "telegram",
    title: "Telegram Channels",
    subtitle: "Join all our channels",
    icon: () => (
      <svg viewBox="0 0 24 24" className="w-6 h-6 fill-white">
        <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
      </svg>
    ),
    iconBg: "from-sky-500 to-blue-500",
    link: "https://t.me/addlist/KsvYsf4YPzliZjY1",
  },
]

export default function ProfilePage({ onNavigate }: ProfilePageProps = {}) {
  const [profile, setProfile] = useState<ProfileData>({
    name: "",
    age: "",
    email: "",
    phone: "",
  })
  const [isEditing, setIsEditing] = useState(false)
  const [profileImage, setProfileImage] = useState("https://i.postimg.cc/HLmyFnnv/photo-2026-05-31-12-04-09-(2).jpg")
  const [showSocialLinks, setShowSocialLinks] = useState(false)

  useEffect(() => {
    const savedProfile = localStorage.getItem("mvbd_profile")
    if (savedProfile) {
      setProfile(JSON.parse(savedProfile))
    }
  }, [])

  const handleSave = () => {
    localStorage.setItem("mvbd_profile", JSON.stringify(profile))
    setIsEditing(false)
  }

  const handleLinkClick = (link: string) => {
    window.open(link, "_blank")
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a12] via-[#050508] to-[#020206]">
      <div className="px-4 py-6 max-w-2xl mx-auto space-y-6">
        {/* Profile Section - Liquid Glass Card */}
        <div className="relative overflow-hidden rounded-3xl backdrop-blur-xl bg-white/5 border border-white/10 shadow-2xl transition-all duration-300 hover:shadow-emerald-500/5">
          {/* Animated gradient background */}
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-cyan-500/5"></div>
          
          <div className="relative p-6">
            {/* Profile Picture with Liquid Glass Ring */}
            <div className="flex flex-col items-center mb-6">
              <div className="relative">
                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-emerald-400 to-cyan-500 blur-xl opacity-60 animate-pulse"></div>
                <div className="relative w-24 h-24 rounded-full overflow-hidden ring-4 ring-white/20 shadow-2xl">
                  <img src={profileImage} alt="Profile" className="w-full h-full object-cover bg-gradient-to-br from-slate-800 to-slate-900" />
                </div>
              </div>
              <h2 className="text-white font-bold text-2xl mt-4 bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent">
                {profile.name || "আপনার নাম"}
              </h2>
            </div>

            {/* Profile Fields - Liquid Glass Inputs */}
            <div className="space-y-3">
              <div className="group relative overflow-hidden rounded-xl backdrop-blur-md bg-white/5 border border-white/10 hover:bg-white/10 transition-all duration-300">
                <div className="flex items-center gap-2 p-3">
                  <User className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <div className="flex-1">
                    <label className="text-slate-300 text-xs font-medium tracking-wide">নাম</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={profile.name}
                        onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                        className="w-full bg-transparent text-white text-sm outline-none placeholder:text-slate-500"
                        placeholder="আপনার নাম লিখুন"
                      />
                    ) : (
                      <p className="text-white text-sm">{profile.name || <span className="text-slate-400">সেট করা হয়নি</span>}</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="group relative overflow-hidden rounded-xl backdrop-blur-md bg-white/5 border border-white/10 hover:bg-white/10 transition-all duration-300">
                <div className="flex items-center gap-2 p-3">
                  <Calendar className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <div className="flex-1">
                    <label className="text-slate-300 text-xs font-medium tracking-wide">বয়স</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={profile.age}
                        onChange={(e) => setProfile({ ...profile, age: e.target.value })}
                        className="w-full bg-transparent text-white text-sm outline-none placeholder:text-slate-500"
                        placeholder="আপনার বয়স লিখুন"
                      />
                    ) : (
                      <p className="text-white text-sm">{profile.age || <span className="text-slate-400">সেট করা হয়নি</span>}</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="group relative overflow-hidden rounded-xl backdrop-blur-md bg-white/5 border border-white/10 hover:bg-white/10 transition-all duration-300">
                <div className="flex items-center gap-2 p-3">
                  <Mail className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <div className="flex-1">
                    <label className="text-slate-300 text-xs font-medium tracking-wide">Email</label>
                    {isEditing ? (
                      <input
                        type="email"
                        value={profile.email}
                        onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                        className="w-full bg-transparent text-white text-sm outline-none placeholder:text-slate-500"
                        placeholder="আপনার email লিখুন"
                      />
                    ) : (
                      <p className="text-white text-sm">{profile.email || <span className="text-slate-400">সেট করা হয়নি</span>}</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="group relative overflow-hidden rounded-xl backdrop-blur-md bg-white/5 border border-white/10 hover:bg-white/10 transition-all duration-300">
                <div className="flex items-center gap-2 p-3">
                  <Phone className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <div className="flex-1">
                    <label className="text-slate-300 text-xs font-medium tracking-wide">Phone Number</label>
                    {isEditing ? (
                      <input
                        type="tel"
                        value={profile.phone}
                        onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                        className="w-full bg-transparent text-white text-sm outline-none placeholder:text-slate-500"
                        placeholder="আপনার নম্বর লিখুন"
                      />
                    ) : (
                      <p className="text-white text-sm">{profile.phone || <span className="text-slate-400">সেট করা হয়নি</span>}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Edit/Save Button - Liquid Glass Style - Smaller */}
              <button
                onClick={isEditing ? handleSave : () => setIsEditing(true)}
                className="relative w-full py-2.5 mt-4 rounded-xl font-bold text-white overflow-hidden group transition-all duration-300 transform active:scale-95"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-emerald-600 group-hover:from-emerald-600 group-hover:to-emerald-700 transition-all duration-300"></div>
                <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <span className="relative text-sm tracking-wide">
                  {isEditing ? "Save Profile" : "Edit Profile"}
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer Menu Section - Liquid Glass Card */}
        <div className="relative overflow-hidden rounded-3xl backdrop-blur-xl bg-white/5 border border-white/10 shadow-2xl transition-all duration-300 hover:shadow-cyan-500/5">
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-transparent to-emerald-500/5"></div>
          
          <div className="relative p-6">
            <h3 className="text-white font-bold text-2xl mb-6 bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent">Menu</h3>

            <div className="space-y-2.5">
              {/* Contact Us */}
              <button
                onClick={() => onNavigate?.("contact")}
                className="group w-full flex items-center gap-3 rounded-xl backdrop-blur-md bg-white/5 border border-white/10 hover:bg-white/10 p-3 transition-all duration-300 transform active:scale-98"
              >
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center flex-shrink-0 shadow-lg group-hover:scale-105 transition-transform duration-300">
                  <MessageCircle className="w-5 h-5 text-white" />
                </div>
                <div className="text-left flex-1">
                  <p className="text-white font-semibold text-sm">Contact Us</p>
                  <p className="text-slate-400 text-xs">Get in touch with us</p>
                </div>
                <svg className="w-4 h-4 text-white/60 group-hover:text-white/100 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>

              {/* About Us */}
              <button
                onClick={() => onNavigate?.("about")}
                className="group w-full flex items-center gap-3 rounded-xl backdrop-blur-md bg-white/5 border border-white/10 hover:bg-white/10 p-3 transition-all duration-300 transform active:scale-98"
              >
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-green-500 flex items-center justify-center flex-shrink-0 shadow-lg group-hover:scale-105 transition-transform duration-300">
                  <Info className="w-5 h-5 text-white" />
                </div>
                <div className="text-left flex-1">
                  <p className="text-white font-semibold text-sm">About Us</p>
                  <p className="text-slate-400 text-xs">Learn about our platform</p>
                </div>
                <svg className="w-4 h-4 text-white/60 group-hover:text-white/100 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>

              {/* Settings */}
              <button
                onClick={() => onNavigate?.("settings")}
                className="group w-full flex items-center gap-3 rounded-xl backdrop-blur-md bg-white/5 border border-white/10 hover:bg-white/10 p-3 transition-all duration-300 transform active:scale-98"
              >
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center flex-shrink-0 shadow-lg group-hover:scale-105 transition-transform duration-300">
                  <Settings className="w-5 h-5 text-white" />
                </div>
                <div className="text-left flex-1">
                  <p className="text-white font-semibold text-sm">Settings</p>
                  <p className="text-slate-400 text-xs">Customize your experience</p>
                </div>
                <svg className="w-4 h-4 text-white/60 group-hover:text-white/100 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 pt-6 border-t border-white/10">
          <p className="text-center text-slate-400 text-sm">© 2025 MoviesVerse. সর্বাধিকার সংরক্ষিত. All rights reserved.</p>
        </div>
      </div>

      {/* Custom CSS for scrollbar and animations */}
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
        @keyframes pulse {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 0.3; }
        }
        .animate-pulse {
          animation: pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
      `}</style>
    </div>
  )
}
