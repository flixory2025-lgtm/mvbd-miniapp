"use client"

import { useState, useEffect } from "react"
import { Bell, Volume2, Wifi, Moon, Lock, Database, Smartphone } from "lucide-react"
import UniversalFooter from "./universal-footer"

interface Settings {
  notifications: boolean
  darkMode: boolean
  autoPlay: boolean
  wifi_only: boolean
  sound: boolean
  cache: boolean
  quality: string
  subtitle: boolean
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings>({
    notifications: true,
    darkMode: true,
    autoPlay: true,
    wifi_only: false,
    sound: true,
    cache: true,
    quality: "hd",
    subtitle: true,
  })

  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const savedSettings = localStorage.getItem("mvbd_settings")
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings))
    }
    setIsLoading(false)
  }, [])

  const saveSettings = (newSettings: Settings) => {
    setSettings(newSettings)
    localStorage.setItem("mvbd_settings", JSON.stringify(newSettings))
  }

  const toggleSetting = (key: keyof Settings) => {
    const newSettings = { ...settings, [key]: !settings[key] }
    saveSettings(newSettings)
  }

  const updateQuality = (quality: string) => {
    const newSettings = { ...settings, quality }
    saveSettings(newSettings)
  }

  const SettingToggle = ({
    icon: Icon,
    label,
    description,
    value,
    onChange,
  }: {
    icon: any
    label: string
    description: string
    value: boolean
    onChange: () => void
  }) => (
    <button
      onClick={onChange}
      className="w-full flex items-center justify-between rounded-2xl backdrop-blur-md bg-white/5 border border-white/10 hover:bg-white/10 p-4 transition-all duration-300 group"
    >
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
          <Icon className="w-6 h-6 text-white" />
        </div>
        <div className="text-left">
          <p className="text-white font-semibold text-base">{label}</p>
          <p className="text-slate-400 text-xs">{description}</p>
        </div>
      </div>

      {/* Toggle Switch */}
      <div
        className={`relative flex-shrink-0 w-14 h-8 rounded-full transition-colors duration-300 ${
          value ? "bg-emerald-500" : "bg-slate-600"
        }`}
      >
        <div
          className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full shadow-md transition-transform duration-300 ${
            value ? "translate-x-6" : "translate-x-0"
          }`}
        ></div>
      </div>
    </button>
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a12] via-[#050508] to-[#020206] pb-24">
      {/* Header */}
      <div className="sticky top-0 z-40 backdrop-blur-2xl bg-black/40 border-b border-white/10 shadow-xl">
        <div className="px-4 py-4 flex items-center justify-center">
          <h1 className="text-white font-bold text-2xl bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent">
            Settings
          </h1>
        </div>
      </div>

      {!isLoading && (
        <div className="px-4 py-6 max-w-2xl mx-auto space-y-6">
          {/* Notifications Section */}
          <div className="relative overflow-hidden rounded-3xl backdrop-blur-xl bg-white/5 border border-white/10 shadow-2xl">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-cyan-500/5"></div>
            
            <div className="relative p-6">
              <h2 className="text-white font-bold text-lg mb-4">Notifications</h2>
              <div className="space-y-3">
                <SettingToggle
                  icon={Bell}
                  label="Push Notifications"
                  description="নতুন কন্টেন্ট সম্পর্কে জানুন"
                  value={settings.notifications}
                  onChange={() => toggleSetting("notifications")}
                />
              </div>
            </div>
          </div>

          {/* Display Section */}
          <div className="relative overflow-hidden rounded-3xl backdrop-blur-xl bg-white/5 border border-white/10 shadow-2xl">
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-transparent to-emerald-500/5"></div>
            
            <div className="relative p-6">
              <h2 className="text-white font-bold text-lg mb-4">Display</h2>
              <div className="space-y-3">
                <SettingToggle
                  icon={Moon}
                  label="Dark Mode"
                  description="আপনার চোখের যত্ন নিন"
                  value={settings.darkMode}
                  onChange={() => toggleSetting("darkMode")}
                />
                <SettingToggle
                  icon={Volume2}
                  label="Sound"
                  description="ভিডিও প্লেব্যাক সাউন্ড"
                  value={settings.sound}
                  onChange={() => toggleSetting("sound")}
                />
              </div>
            </div>
          </div>

          {/* Playback Section */}
          <div className="relative overflow-hidden rounded-3xl backdrop-blur-xl bg-white/5 border border-white/10 shadow-2xl">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-cyan-500/5"></div>
            
            <div className="relative p-6">
              <h2 className="text-white font-bold text-lg mb-4">Playback</h2>
              <div className="space-y-3">
                <SettingToggle
                  icon={Smartphone}
                  label="Auto Play"
                  description="পরবর্তী এপিসোড স্বয়ংক্রিয়ভাবে চালান"
                  value={settings.autoPlay}
                  onChange={() => toggleSetting("autoPlay")}
                />
                <SettingToggle
                  icon={Wifi}
                  label="WiFi Only"
                  description="শুধুমাত্র WiFi এ ভিডিও চালান"
                  value={settings.wifi_only}
                  onChange={() => toggleSetting("wifi_only")}
                />
                <SettingToggle
                  icon={Smartphone}
                  label="Subtitles"
                  description="সাবটাইটেল প্রদর্শন করুন"
                  value={settings.subtitle}
                  onChange={() => toggleSetting("subtitle")}
                />

                {/* Quality Selector */}
                <div className="rounded-2xl backdrop-blur-md bg-white/5 border border-white/10 hover:bg-white/10 p-4 transition-all duration-300">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                        <Smartphone className="w-6 h-6 text-white" />
                      </div>
                      <div className="text-left">
                        <p className="text-white font-semibold text-base">Video Quality</p>
                        <p className="text-slate-400 text-xs">আপনার পছন্দের মান নির্বাচন করুন</p>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { value: "sd", label: "SD" },
                      { value: "hd", label: "HD" },
                      { value: "4k", label: "4K" },
                    ].map((quality) => (
                      <button
                        key={quality.value}
                        onClick={() => updateQuality(quality.value)}
                        className={`py-2 rounded-lg font-semibold text-sm transition-all duration-300 ${
                          settings.quality === quality.value
                            ? "bg-emerald-500 text-white"
                            : "bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10"
                        }`}
                      >
                        {quality.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Storage Section */}
          <div className="relative overflow-hidden rounded-3xl backdrop-blur-xl bg-white/5 border border-white/10 shadow-2xl">
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-transparent to-emerald-500/5"></div>
            
            <div className="relative p-6">
              <h2 className="text-white font-bold text-lg mb-4">Storage</h2>
              <div className="space-y-3">
                <SettingToggle
                  icon={Database}
                  label="Cache Downloads"
                  description="ডাউনলোড করা ভিডিও সংরক্ষণ করুন"
                  value={settings.cache}
                  onChange={() => toggleSetting("cache")}
                />

                {/* Cache Clear Button */}
                <button className="w-full flex items-center justify-between rounded-2xl backdrop-blur-md bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 p-4 transition-all duration-300 group">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                      <Database className="w-6 h-6 text-white" />
                    </div>
                    <div className="text-left">
                      <p className="text-white font-semibold text-base">Clear Cache</p>
                      <p className="text-slate-400 text-xs">সমস্ত ক্যাশ ডেটা মুছে ফেলুন</p>
                    </div>
                  </div>
                  <svg
                    className="w-5 h-5 text-red-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {/* Privacy & Security Section */}
          <div className="relative overflow-hidden rounded-3xl backdrop-blur-xl bg-white/5 border border-white/10 shadow-2xl">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-cyan-500/5"></div>
            
            <div className="relative p-6">
              <h2 className="text-white font-bold text-lg mb-4">Privacy & Security</h2>
              <div className="space-y-3">
                <button className="w-full flex items-center justify-between rounded-2xl backdrop-blur-md bg-white/5 border border-white/10 hover:bg-white/10 p-4 transition-all duration-300 group">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                      <Lock className="w-6 h-6 text-white" />
                    </div>
                    <div className="text-left">
                      <p className="text-white font-semibold text-base">Change Password</p>
                      <p className="text-slate-400 text-xs">আপনার পাসওয়ার্ড আপডেট করুন</p>
                    </div>
                  </div>
                  <svg
                    className="w-5 h-5 text-white/60"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </button>

                <button className="w-full flex items-center justify-between rounded-2xl backdrop-blur-md bg-white/5 border border-white/10 hover:bg-white/10 p-4 transition-all duration-300 group">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                      <Lock className="w-6 h-6 text-white" />
                    </div>
                    <div className="text-left">
                      <p className="text-white font-semibold text-base">Privacy Policy</p>
                      <p className="text-slate-400 text-xs">আমাদের গোপনীয়তা নীতি পড়ুন</p>
                    </div>
                  </div>
                  <svg
                    className="w-5 h-5 text-white/60"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {/* About Section */}
          <div className="relative overflow-hidden rounded-3xl backdrop-blur-xl bg-white/5 border border-white/10 shadow-2xl">
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-transparent to-emerald-500/5"></div>
            
            <div className="relative p-6 text-center">
              <p className="text-slate-400 text-sm mb-2">Movies Verse Bangladesh</p>
              <p className="text-slate-500 text-xs">Version 1.0.0</p>
            </div>
          </div>
        </div>
      )}

      {/* Custom CSS */}
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
