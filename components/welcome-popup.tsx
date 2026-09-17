"use client"

import { useEffect, useState } from "react"
import { X, Send, PartyPopper, PlayCircle, CheckCircle2 } from "lucide-react"

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

  const openTutorial = () => {
    window.open("https://t.me/MVBDtutorial/31", "_blank", "noopener,noreferrer")
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
        @keyframes mvbdPulseRing {
          0%   { box-shadow: 0 0 0 0 rgba(34,211,238,.45); }
          70%  { box-shadow: 0 0 0 10px rgba(34,211,238,0); }
          100% { box-shadow: 0 0 0 0 rgba(34,211,238,0); }
        }
        @keyframes mvbdPulseRingGreen {
          0%   { box-shadow: 0 0 0 0 rgba(52,211,153,.45); }
          70%  { box-shadow: 0 0 0 10px rgba(52,211,153,0); }
          100% { box-shadow: 0 0 0 0 rgba(52,211,153,0); }
        }
        @keyframes mvbdArrow {
          0%, 100% { transform: translateX(0); }
          50%      { transform: translateX(3px); }
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
          background-image: url('https://i.postimg.cc/MKR8ytf1/file-0000000079a48211af89ed713cf918ca.png');
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

        /* Request Group button — cyan themed */
        .mvbd-btn-request {
          background: linear-gradient(135deg, rgba(34,211,238,.20), rgba(59,130,246,.14));
          border: 1px solid rgba(103,232,249,.35);
          box-shadow:
            inset 0 1px 0 rgba(255,255,255,.12),
            0 6px 20px rgba(34,211,238,.18);
          transition: all .25s cubic-bezier(.22,1,.36,1);
          animation: mvbdPulseRing 2.6s ease-in-out infinite;
        }
        .mvbd-btn-request:hover {
          background: linear-gradient(135deg, rgba(34,211,238,.32), rgba(59,130,246,.24));
          border-color: rgba(103,232,249,.6);
          box-shadow:
            inset 0 1px 0 rgba(255,255,255,.18),
            0 8px 28px rgba(34,211,238,.35);
          transform: translateY(-1px);
        }

        /* Watch Tutorial button — emerald themed */
        .mvbd-btn-tutorial {
          background: linear-gradient(135deg, rgba(52,211,153,.20), rgba(16,185,129,.12));
          border: 1px solid rgba(134,239,172,.35);
          box-shadow:
            inset 0 1px 0 rgba(255,255,255,.12),
            0 6px 20px rgba(52,211,153,.18);
          transition: all .25s cubic-bezier(.22,1,.36,1);
          animation: mvbdPulseRingGreen 2.6s ease-in-out infinite .4s;
        }
        .mvbd-btn-tutorial:hover {
          background: linear-gradient(135deg, rgba(52,211,153,.32), rgba(16,185,129,.22));
          border-color: rgba(134,239,172,.6);
          box-shadow:
            inset 0 1px 0 rgba(255,255,255,.18),
            0 8px 28px rgba(52,211,153,.35);
          transform: translateY(-1px);
        }

        .mvbd-btn-tutorial:hover .mvbd-arrow { animation: mvbdArrow 1s ease-in-out infinite; }
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

            {/* Logo image */}
            <div className="mvbd-float flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400/25 to-amber-400/15 border border-emerald-300/30 overflow-hidden">
              <img
                src="https://i.postimg.cc/2SfxkxqH/16769-removebg-preview.png"
                alt="MoviesVerseBD Logo"
                className="w-7 h-7 object-contain drop-shadow-[0_0_6px_rgba(52,211,153,.45)]"
              />
            </div>

            <div>
              <h2 className="text-white text-[15px] font-bold">MoviesVerseBD</h2>
              <p className="text-emerald-200/60 text-[10px]">MVBD OFFICIAL</p>
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
                MVBD OFFICIAL 🎂
              </p>
            </div>
          </div>
        </div>

        {/* Message */}
        <div className="relative px-4 pt-3.5 pb-4">
          <div className="px-1">

            {/* Important Notice */}
            <p className="text-white/90 text-[12.5px] leading-6 text-center drop-shadow-[0_1px_2px_rgba(0,0,0,.6)]">
              <span className="text-emerald-300 font-semibold">MoviesVerseBD</span>{" "}
              এর সকল Movie Telegram এর Cloud Bot-এ Upload করা থাকে, তাই আমাদের
              Mini App ব্যবহার করতে হলে আপনাকে অবশ্যই{" "}
              <span className="text-cyan-300 font-semibold">Telegram</span>{" "}
              ব্যবহার করতে হবে।
            </p>

            {/* Tutorial Instruction */}
            <p className="text-white/70 text-[11px] leading-5 text-center mt-3 drop-shadow-[0_1px_2px_rgba(0,0,0,.5)]">
              MoviesVerseBD Mini App এর ব্যবহার যদি আপনি না বুঝে থাকেন, তাহলে{" "}
              <span className="text-emerald-300 font-medium">Category</span>{" "}
              থেকে Tutorial Video টি দেখে নিন। আর যদি Telegram থেকে দেখতে চান,
              তাহলে নিচের{" "}
              <span className="text-emerald-300 font-semibold">Watch Tutorial</span>{" "}
              Button-এ ক্লিক করুন। 👇
            </p>

          </div>

          {/* Request Group Button */}
          <button
            onClick={openRequestGroup}
            className="mvbd-btn-request mt-4 w-full rounded-xl py-2.5 text-[12px] font-semibold text-white flex items-center justify-center gap-2"
          >
            <Send className="w-3.5 h-3.5 text-cyan-300" />
            Request Group
          </button>

          <p className="text-white/45 text-[9.5px] text-center mt-1.5">
            কিছু বুঝতে সমস্যা হলে Request Group-এ জানালেই Admin বুঝিয়ে দেবে।
          </p>

          {/* Watch Tutorial Button */}
          <button
            onClick={openTutorial}
            className="mvbd-btn-tutorial mt-2.5 w-full rounded-xl py-2.5 text-[12px] font-semibold text-white flex items-center justify-center gap-2"
          >
            <PlayCircle className="w-4 h-4 text-emerald-300" />
            Watch Tutorial
            <span className="mvbd-arrow inline-flex">→</span>
          </button>

          {/* Close Button */}
          <button
            onClick={onClose}
            className="mvbd-button mt-2.5 w-full rounded-xl py-2.5 text-[12px] font-semibold text-white flex items-center justify-center gap-2"
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
            বুঝেছি
          </button>
        </div>

        {/* Bottom Highlight */}
        <div className="h-px bg-gradient-to-r from-transparent via-emerald-200/25 to-transparent" />
      </div>
    </div>
  )
}
