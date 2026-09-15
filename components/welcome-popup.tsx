"use client"

import { useEffect, useState } from "react"
import { X, Send, PartyPopper } from "lucide-react"

interface WelcomePopupProps {
  onClose: () => void
}

export default function WelcomePopup({ onClose }: WelcomePopupProps) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 80)
    return () => clearTimeout(timer)
  }, [])

  const openRequestGroup = () => {
    window.open("https://t.me/mvbdreq", "_blank", "noopener,noreferrer")
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 bg-black/75 backdrop-blur-xl">

      <style>{`
        @keyframes mvbdPopupIn {
          from { opacity: 0; transform: scale(.92) translateY(12px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes mvbdFloat {
          0%, 100% { transform: translateY(0); }
          50%      { transform: translateY(-4px); }
        }
        @keyframes mvbdCake {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          45%      { transform: translateY(-3px) rotate(-4deg); }
          70%      { transform: translateY(0) rotate(2deg); }
        }
        @keyframes mvbdShine {
          0%   { transform: translateX(-140%); }
          100% { transform: translateX(140%); }
        }
        @keyframes mvbdGlow {
          0%, 100% { opacity: .35; transform: scale(.85); }
          50%      { opacity: .9;  transform: scale(1.05); }
        }

        .mvbd-popup {
          animation: mvbdPopupIn .42s cubic-bezier(.22,1,.36,1);
          background:
            linear-gradient(
              145deg,
              rgba(16,40,26,.86),
              rgba(8,16,12,.92)
            );
          backdrop-filter: blur(30px) saturate(170%);
          -webkit-backdrop-filter: blur(30px) saturate(170%);
          border: 1px solid rgba(134,239,172,.20);
          box-shadow:
            0 24px 70px rgba(0,0,0,.65),
            0 0 55px rgba(34,197,94,.12),
            inset 0 1px 0 rgba(255,255,255,.10);
        }

        /* Background image layer — STILL, 60% visible */
        .mvbd-bg-image {
          position: absolute;
          inset: 0;
          background-image: url('https://i.postimg.cc/6Qt242z6/file-00000000f048821196ac168bdfceaa5a.png');
          background-size: cover;
          background-position: center;
          background-repeat: no-repeat;
          opacity: .60;
          pointer-events: none;
        }

        /* Soft dark gradient so text remains readable on top */
        .mvbd-bg-overlay {
          position: absolute;
          inset: 0;
          background:
            radial-gradient(
              circle at 50% 30%,
              rgba(16,185,129,.10),
              transparent 60%
            ),
            linear-gradient(
              180deg,
              rgba(0,0,0,.35) 0%,
              rgba(0,0,0,.55) 45%,
              rgba(0,0,0,.75) 100%
            );
          pointer-events: none;
        }

        .mvbd-float { animation: mvbdFloat 2.8s ease-in-out infinite; }
        .mvbd-cake { transform-origin: bottom center; animation: mvbdCake 2s ease-in-out infinite; }
        .mvbd-glow { animation: mvbdGlow 2.6s ease-in-out infinite; }

        .mvbd-button {
          position: relative;
          overflow: hidden;
          background: rgba(255,255,255,.075);
          border: 1px solid rgba(255,255,255,.13);
          box-shadow:
            inset 0 1px 0 rgba(255,255,255,.09),
            0 6px 18px rgba(0,0,0,.18);
          transition: all .22s ease;
        }
        .mvbd-button::before {
          content: "";
          position: absolute;
          inset: 0;
          width: 35%;
          transform: translateX(-140%) skewX(-20deg);
          background: linear-gradient(
            90deg,
            transparent,
            rgba(255,255,255,.16),
            transparent
          );
        }
        .mvbd-button:hover::before { animation: mvbdShine .8s ease; }
        .mvbd-button:active { transform: scale(.97); }

        .mvbd-offer {
          background:
            linear-gradient(
              135deg,
              rgba(34,197,94,.16),
              rgba(251,191,36,.08)
            );
          border: 1px solid rgba(134,239,172,.25);
        }

        .mvbd-code {
          background: rgba(0,0,0,.35);
          border: 1px solid rgba(134,239,172,.25);
          box-shadow: inset 0 1px 0 rgba(255,255,255,.05);
        }
      `}</style>

      {/* Popup */}
      <div
        className={`mvbd-popup relative w-full max-w-[350px] rounded-[26px] overflow-hidden ${
          visible ? "opacity-100" : "opacity-0"
        }`}
      >

        {/* === Background Poster Image (still, 60% visible) === */}
        <div className="mvbd-bg-image" />
        <div className="mvbd-bg-overlay" />

        {/* Ambient Glow */}
        <div className="absolute -top-20 -right-20 w-40 h-40 rounded-full bg-emerald-400/20 blur-3xl pointer-events-none mvbd-glow" />
        <div className="absolute -bottom-20 -left-20 w-40 h-40 rounded-full bg-amber-400/15 blur-3xl pointer-events-none mvbd-glow" />

        {/* Header */}
        <div className="relative flex items-center justify-between px-4 py-3.5">

          <div className="flex items-center gap-2.5">

            {/* Logo image (replaces M letter) */}
            <div className="mvbd-float flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400/25 to-amber-400/15 border border-emerald-300/30 overflow-hidden">
              <img
                src="https://i.postimg.cc/2SfxkxqH/16769-removebg-preview.png"
                alt="MoviesVerseBD Logo"
                className="w-7 h-7 object-contain drop-shadow-[0_0_6px_rgba(52,211,153,.45)]"
              />
            </div>

            <div>
              <h2 className="text-white text-[15px] font-bold">MoviesVerseBD</h2>
              <p className="text-emerald-200/60 text-[10px]">2nd Anniversary 🎉</p>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Close"
            className="w-8 h-8 rounded-full flex items-center justify-center bg-white/[0.06] border border-white/[0.08] text-white/55 hover:text-white hover:bg-white/[0.11] transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Anniversary Banner */}
        <div className="relative mx-4 rounded-2xl mvbd-offer overflow-hidden">
          <div className="flex items-center gap-3 px-3.5 py-3">
            <div className="mvbd-cake flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-xl bg-emerald-400/15 border border-emerald-300/25">
              <PartyPopper className="w-5 h-5 text-emerald-300" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-emerald-300 text-[14px] font-bold">2 Years of MVBD</span>
                <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-emerald-400/15 text-emerald-200 border border-emerald-300/25">
                  15 SEPT
                </span>
              </div>
              <p className="text-white/60 text-[10px] mt-0.5">
                আমাদের পথচলার ২ বছর পূর্তি 🎂
              </p>
            </div>
          </div>
        </div>

        {/* Message */}
        <div className="relative px-4 pt-3.5 pb-4">
          <div className="px-1">

            <p className="text-white/90 text-[12.5px] leading-6 text-center drop-shadow-[0_1px_2px_rgba(0,0,0,.6)]">
              <span className="text-emerald-300 font-semibold">MoviesVerseBD</span>{" "}
              এর সাথে থাকার জন্য আপনাকে অসংখ্য ধন্যবাদ। ❤️ আজ আমাদের{" "}
              <span className="text-white font-medium">২য় Anniversary</span> —
              এই পথচলা সহজ করেনি, কিন্তু আপনার ভালোবাসায় আমরা আজ এখানে।
            </p>

            <p className="text-white/65 text-[11px] leading-5 text-center mt-2 drop-shadow-[0_1px_2px_rgba(0,0,0,.5)]">
              এই বিশেষ দিনে আমাদের পুরোনো Members-দের জন্য থাকছে
              <span className="text-amber-300 font-semibold">
                {" "}বিশেষ ১ মাসের FREE Subscription!
              </span>
            </p>

            {/* Offer Instruction */}
            <div className="mt-3 rounded-xl mvbd-code px-3 py-2.5">
              <p className="text-white/70 text-[10.5px] text-center leading-5">
                Subscription Plan থেকে{" "}
                <span className="text-cyan-300 font-semibold">1 Month</span>{" "}
                সিলেক্ট করে নিচের Code-টি লিখে Admin-কে পাঠান
              </p>
              <div className="flex justify-center mt-1.5">
                <span className="text-emerald-300 text-[13px] font-bold tracking-[2px]">
                  MVBD2YEAR
                </span>
              </div>
            </div>

            <p className="text-white/55 text-[10.5px] leading-5 text-center mt-2 drop-shadow-[0_1px_2px_rgba(0,0,0,.5)]">
              Admin দ্রুত আপনার Account-এ
              <span className="text-emerald-300">
                {" "}১ মাসের Free Subscription
              </span>{" "}
              চালু করে দেবে।
            </p>

            <p className="text-amber-300/90 text-[10.5px] text-center font-medium mt-2">
              ⏳ অফারটি শুধুমাত্র ১৫ সেপ্টেম্বর পর্যন্ত — দেরি করবেন না!
            </p>
          </div>

          {/* Request Group Button */}
          <button
            onClick={openRequestGroup}
            className="mvbd-button mt-3 w-full rounded-xl py-2.5 text-[12px] font-semibold text-white flex items-center justify-center gap-2"
          >
            <Send className="w-3.5 h-3.5 text-cyan-300" />
            Request Group
          </button>

          <p className="text-white/45 text-[9.5px] text-center mt-1.5">
            কিছু বুঝতে সমস্যা হলে Request Group-এ জানালেই Admin বুঝিয়ে দেবে।
          </p>

          {/* Close Button */}
          <button
            onClick={onClose}
            className="mvbd-button mt-2 w-full rounded-xl py-2.5 text-[12px] font-semibold text-white"
          >
            বুঝেছি
          </button>
        </div>

        {/* Bottom Highlight */}
        <div className="h-px bg-gradient-to-r from-transparent via-emerald-200/25 to-transparent" />
      </div>
    </div>
  )
}
