"use client"

import { Film, Zap, ShieldCheck, Sparkles } from "lucide-react"

const FEATURES = [
  { icon: Zap, title: "Fast", text: "দ্রুত লোড হয়, কোনো অপেক্ষা নেই।" },
  { icon: Film, title: "Rich library", text: "মুভি আর সিরিজের বড় সংগ্রহ।" },
  { icon: ShieldCheck, title: "Safe", text: "নিরাপদ এবং ঝামেলামুক্ত অভিজ্ঞতা।" },
]

export default function ModexPage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-gradient-to-br from-[#0a0a12] via-[#050508] to-[#020206] text-white">
      <div className="pointer-events-none absolute -top-40 left-1/2 h-[480px] w-[480px] -translate-x-1/2 rounded-full bg-cyan-500/20 blur-[120px]" />
      <div className="pointer-events-none absolute bottom-0 right-0 h-[360px] w-[360px] rounded-full bg-emerald-500/10 blur-[120px]" />

      <section className="relative mx-auto flex max-w-3xl flex-col items-center px-6 pb-16 pt-20 text-center">
        <div className="mb-6 flex h-32 w-32 items-center justify-center rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-2xl">
          <img
            src="https://i.postimg.cc/YqKw8FTB/24592-removebg-preview.png"
            alt="Modex"
            className="h-24 w-24 object-contain"
          />
        </div>

        <h1 className="bg-gradient-to-r from-white to-cyan-200 bg-clip-text text-5xl font-extrabold text-transparent sm:text-6xl">
          Modex
        </h1>
        <p className="mt-4 max-w-xl text-slate-300">
          Modex পেজ এখানে। এই লেখাগুলো আপনার নিজের কন্টেন্ট দিয়ে বদলে নিন।
        </p>

        <a
          href="/"
          className="mt-8 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-emerald-500 to-cyan-500 px-6 py-3 font-semibold text-white shadow-lg transition-transform hover:scale-105 active:scale-95"
        >
          <Sparkles className="h-4 w-4" />
          Back to Home
        </a>
      </section>

      <section className="relative mx-auto grid max-w-4xl gap-4 px-6 pb-24 sm:grid-cols-3">
        {FEATURES.map(({ icon: Icon, title, text }) => (
          <div
            key={title}
            className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl transition-colors hover:bg-white/10"
          >
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-cyan-500">
              <Icon className="h-6 w-6" />
            </div>
            <h2 className="text-lg font-bold">{title}</h2>
            <p className="mt-1 text-sm text-slate-400">{text}</p>
          </div>
        ))}
      </section>
    </main>
  )
}
