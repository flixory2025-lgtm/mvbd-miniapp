"use client"

import { useState } from "react"
import { Play, Users, Zap, Target, Award, Heart } from "lucide-react"
import UniversalFooter from "./universal-footer"

export default function AboutUsPage() {
  const [activeTab, setActiveTab] = useState("mission")

  const tabs = [
    { id: "mission", label: "আমাদের মিশন", icon: Target },
    { id: "vision", label: "আমাদের ভিশন", icon: Zap },
    { id: "values", label: "আমাদের মূল্যবোধ", icon: Heart },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a12] via-[#050508] to-[#020206] pb-24">
      {/* Header */}
      <div className="sticky top-0 z-40 backdrop-blur-2xl bg-black/40 border-b border-white/10 shadow-xl">
        <div className="px-4 py-4 flex items-center justify-center">
          <h1 className="text-white font-bold text-2xl bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent">
            About Us
          </h1>
        </div>
      </div>

      <div className="px-4 py-6 max-w-2xl mx-auto space-y-6">
        {/* Hero Section */}
        <div className="relative overflow-hidden rounded-3xl backdrop-blur-xl bg-white/5 border border-white/10 shadow-2xl transition-all duration-300 hover:shadow-cyan-500/5">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 via-transparent to-cyan-500/10"></div>
          
          <div className="relative p-6">
            <h2 className="text-white font-bold text-2xl mb-3 bg-gradient-to-r from-emerald-300 to-cyan-300 bg-clip-text text-transparent">
              Movies Verse Bangladesh
            </h2>
            <p className="text-slate-300 text-sm leading-relaxed mb-4">
              আমরা একটি প্রিমিয়াম বিনোদন প্ল্যাটফর্ম যা বাংলাদেশীদের জন্য সর্বোত্তম মুভি এবং সিরিজ কন্টেন্ট প্রদান করে। আমাদের লক্ষ্য হল আপনার বিনোদনের অভিজ্ঞতাকে পরবর্তী স্তরে নিয়ে যাওয়া।
            </p>
            <p className="text-slate-300 text-sm leading-relaxed">
              প্রতিদিন হাজারো ব্যবহারকারী আমাদের প্ল্যাটফর্মে সর্বশেষ এবং সবচেয়ে জনপ্রিয় কন্টেন্ট উপভোগ করেন।
            </p>
          </div>
        </div>

        {/* Tabs Section */}
        <div className="relative overflow-hidden rounded-3xl backdrop-blur-xl bg-white/5 border border-white/10 shadow-2xl">
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-transparent to-emerald-500/5"></div>
          
          <div className="relative">
            {/* Tab Buttons */}
            <div className="flex border-b border-white/10">
              {tabs.map((tab) => {
                const Icon = tab.icon
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex-1 px-4 py-3 text-sm font-semibold transition-all duration-300 flex items-center justify-center gap-2 ${
                      activeTab === tab.id
                        ? "text-emerald-400 border-b-2 border-emerald-400 bg-emerald-400/5"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="hidden sm:inline">{tab.label}</span>
                  </button>
                )
              })}
            </div>

            {/* Tab Content */}
            <div className="p-6">
              {activeTab === "mission" && (
                <div className="space-y-3 animate-fadeIn">
                  <h3 className="text-white font-bold text-lg flex items-center gap-2">
                    <Play className="w-5 h-5 text-emerald-400" />
                    আমাদের মিশন
                  </h3>
                  <p className="text-slate-300 text-sm leading-relaxed">
                    বিশ্বমানের বিনোদন কন্টেন্ট প্রদান করে বাংলাদেশী দর্শকদের বৈশ্বিক পর্যায়ে নিয়ে যাওয়া আমাদের প্রধান লক্ষ্য।
                  </p>
                  <p className="text-slate-300 text-sm leading-relaxed">
                    আমরা বিশ্বাস করি যে প্রতিটি দর্শক সর্বোচ্চ মানের এবং বৈচিত্র্যময় কন্টেন্ট পাওয়ার যোগ্য। এজন্য আমরা ক্রমাগত আমাদের লাইব্রেরি আপডেট করি এবং নতুন এবং উত্তেজনাপূর্ণ শিরোনাম যোগ করি।
                  </p>
                </div>
              )}

              {activeTab === "vision" && (
                <div className="space-y-3 animate-fadeIn">
                  <h3 className="text-white font-bold text-lg flex items-center gap-2">
                    <Zap className="w-5 h-5 text-cyan-400" />
                    আমাদের ভিশন
                  </h3>
                  <p className="text-slate-300 text-sm leading-relaxed">
                    South Asia এর নেতৃস্থানীয় বিনোদন প্ল্যাটফর্ম হওয়ার স্বপ্ন দেখি আমরা।
                  </p>
                  <p className="text-slate-300 text-sm leading-relaxed">
                    প্রযুক্তি এবং সৃজনশীলতার সমন্বয়ে আমরা এমন একটি পরিবেশ তৈরি করছি যেখানে প্রতিটি ব্যবহারকারী তাদের পছন্দের কন্টেন্ট সহজেই খুঁজে পেতে পারে এবং উপভোগ করতে পারে।
                  </p>
                </div>
              )}

              {activeTab === "values" && (
                <div className="space-y-3 animate-fadeIn">
                  <h3 className="text-white font-bold text-lg flex items-center gap-2">
                    <Heart className="w-5 h-5 text-rose-400" />
                    আমাদের মূল্যবোধ
                  </h3>
                  <ul className="space-y-2">
                    {[
                      "গুণমান - আমরা কখনো মানে আপস করি না",
                      "স্বচ্ছতা - আমাদের সকল অপারেশন স্বচ্ছ এবং সৎ",
                      "উদ্ভাবন - নতুন এবং উন্নত সেবা প্রদানে প্রতিশ্রুতিবদ্ধ",
                      "সম্প্রদায় - আমাদের ব্যবহারকারীদের সাথে একটি শক্তিশালী সম্পর্ক বজায় রাখা",
                      "দায়িত্বশীলতা - সামাজিক এবং পরিবেশগত দায়বদ্ধতা",
                    ].map((value, idx) => (
                      <li
                        key={idx}
                        className="flex items-start gap-3 text-slate-300 text-sm"
                      >
                        <span className="text-emerald-400 font-bold mt-0.5">✓</span>
                        <span>{value}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-2 gap-4">
          {[
            { number: "1000+", label: "কন্টেন্ট" },
            { number: "50K+", label: "সক্রিয় ব্যবহারকারী" },
            { number: "24/7", label: "সেবা" },
            { number: "4.8★", label: "রেটিং" },
          ].map((stat, idx) => (
            <div
              key={idx}
              className="relative overflow-hidden rounded-2xl backdrop-blur-md bg-white/5 border border-white/10 p-4 text-center transition-all duration-300 hover:bg-white/10 hover:shadow-lg"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-cyan-500/10"></div>
              <div className="relative">
                <p className="text-emerald-400 font-bold text-2xl">{stat.number}</p>
                <p className="text-slate-400 text-xs mt-1">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Team Section */}
        <div className="relative overflow-hidden rounded-3xl backdrop-blur-xl bg-white/5 border border-white/10 shadow-2xl">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-cyan-500/5"></div>
          
          <div className="relative p-6">
            <h3 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
              <Users className="w-5 h-5 text-emerald-400" />
              আমাদের টিম
            </h3>
            <p className="text-slate-300 text-sm leading-relaxed">
              আমাদের দক্ষ এবং নিবেদিত টিম প্রতিদিন কঠোর পরিশ্রম করে আপনার বিনোদনের অভিজ্ঞতা উন্নত করতে। প্রতিটি সদস্য তাদের ক্ষেত্রে বিশেষজ্ঞ এবং আপনার সন্তুষ্টির জন্য প্রতিশ্রুতিবদ্ধ।
            </p>
          </div>
        </div>

        {/* Awards Section */}
        <div className="relative overflow-hidden rounded-3xl backdrop-blur-xl bg-white/5 border border-white/10 shadow-2xl">
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-transparent to-emerald-500/5"></div>
          
          <div className="relative p-6">
            <h3 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
              <Award className="w-5 h-5 text-yellow-400" />
              স্বীকৃতি
            </h3>
            <div className="space-y-2">
              {[
                "বাংলাদেশের সেরা স্ট্রিমিং সার্ভিস ২০২৫",
                "গ্রাহক সেবায় শ্রেষ্ঠত্বের জন্য পুরস্কৃত",
                "সেরা কন্টেন্ট কিউরেশন অ্যাওয়ার্ড",
              ].map((award, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-3 text-slate-300 text-sm p-3 rounded-lg bg-white/5 border border-white/5"
                >
                  <span className="text-yellow-400">★</span>
                  <span>{award}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Custom CSS */}
      <style jsx global>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }

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
