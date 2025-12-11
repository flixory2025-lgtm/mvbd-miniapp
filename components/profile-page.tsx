"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { Phone, User, Mail, Calendar } from "lucide-react"

interface ProfileData {
  name: string
  age: string
  email: string
  phone: string
}

const socialLinks = [
  {
    id: "manager",
    title: "Manager",
    subtitle: "01945715199",
    icon: Phone,
    iconBg: "bg-green-500",
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
    iconBg: "bg-blue-600",
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
    iconBg: "bg-blue-600",
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
    iconBg: "bg-blue-600",
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
    iconBg: "bg-blue-600",
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
    iconBg: "bg-gradient-to-r from-blue-500 to-cyan-400",
    link: "https://t.me/addlist/KsvYsf4YPzliZjY1",
  },
]

export default function ProfilePage() {
  const [profile, setProfile] = useState<ProfileData>({
    name: "",
    age: "",
    email: "",
    phone: "",
  })
  const [isEditing, setIsEditing] = useState(false)

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
    <div className="min-h-screen bg-black pb-24">
      {/* Header with Logo */}
      <div className="sticky top-0 z-40 bg-black border-b border-slate-700 px-4 py-4">
        <div className="flex items-center justify-center">
          <Image src="/mvbd-logo.png" alt="MVBD Logo" width={120} height={120} className="w-24 h-24 object-contain" />
        </div>
      </div>

      <div className="px-4 py-6">
        {/* Profile Section */}
        <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800 mb-6">
          {/* Profile Picture */}
          <div className="flex flex-col items-center mb-6">
            <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-green-500 mb-3">
              <Image src="/mvbd-logo.png" alt="Profile" width={96} height={96} className="w-full h-full object-cover" />
            </div>
            <h2 className="text-white font-bold text-xl">{profile.name || "আপনার নাম"}</h2>
          </div>

          {/* Profile Fields */}
          <div className="space-y-4">
            <div className="flex items-center gap-3 bg-slate-800 rounded-xl p-4">
              <User className="w-5 h-5 text-green-500" />
              <div className="flex-1">
                <label className="text-slate-400 text-xs">নাম</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={profile.name}
                    onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                    className="w-full bg-transparent text-white border-none outline-none"
                    placeholder="আপনার নাম লিখুন"
                  />
                ) : (
                  <p className="text-white">{profile.name || "সেট করা হয়নি"}</p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3 bg-slate-800 rounded-xl p-4">
              <Calendar className="w-5 h-5 text-green-500" />
              <div className="flex-1">
                <label className="text-slate-400 text-xs">বয়স</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={profile.age}
                    onChange={(e) => setProfile({ ...profile, age: e.target.value })}
                    className="w-full bg-transparent text-white border-none outline-none"
                    placeholder="আপনার বয়স লিখুন"
                  />
                ) : (
                  <p className="text-white">{profile.age || "সেট করা হয়নি"}</p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3 bg-slate-800 rounded-xl p-4">
              <Mail className="w-5 h-5 text-green-500" />
              <div className="flex-1">
                <label className="text-slate-400 text-xs">Email</label>
                {isEditing ? (
                  <input
                    type="email"
                    value={profile.email}
                    onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                    className="w-full bg-transparent text-white border-none outline-none"
                    placeholder="আপনার email লিখুন"
                  />
                ) : (
                  <p className="text-white">{profile.email || "সেট করা হয়নি"}</p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3 bg-slate-800 rounded-xl p-4">
              <Phone className="w-5 h-5 text-green-500" />
              <div className="flex-1">
                <label className="text-slate-400 text-xs">Phone Number</label>
                {isEditing ? (
                  <input
                    type="tel"
                    value={profile.phone}
                    onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                    className="w-full bg-transparent text-white border-none outline-none"
                    placeholder="আপনার নম্বর লিখুন"
                  />
                ) : (
                  <p className="text-white">{profile.phone || "সেট করা হয়নি"}</p>
                )}
              </div>
            </div>

            {/* Edit/Save Button */}
            <button
              onClick={isEditing ? handleSave : () => setIsEditing(true)}
              className="w-full py-3 bg-green-500 hover:bg-green-600 text-white font-bold rounded-xl transition"
            >
              {isEditing ? "Save" : "Edit Profile"}
            </button>
          </div>
        </div>

        {/* Contact Us Section */}
        <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800">
          <h3 className="text-white font-bold text-xl mb-2">Contact Us</h3>
          <p className="text-slate-400 text-sm mb-6">Get in touch with us</p>

          <div className="space-y-3">
            {socialLinks.map((item) => {
              const Icon = item.icon
              return (
                <button
                  key={item.id}
                  onClick={() => handleLinkClick(item.link)}
                  className="w-full flex items-center gap-4 bg-slate-800 hover:bg-slate-700 rounded-xl p-4 transition"
                >
                  <div
                    className={`w-12 h-12 rounded-full ${item.iconBg} flex items-center justify-center flex-shrink-0`}
                  >
                    {typeof Icon === "function" ? <Icon /> : <Icon className="w-6 h-6 text-white" />}
                  </div>
                  <div className="text-left">
                    <p className="text-white font-semibold">{item.title}</p>
                    <p className="text-slate-400 text-sm">{item.subtitle}</p>
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
