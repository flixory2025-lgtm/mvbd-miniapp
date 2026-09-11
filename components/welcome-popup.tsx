"use client"

import { useEffect, useState } from "react"
import { X, Send, Gift } from "lucide-react"

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
    <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 bg-black/65 backdrop-blur-xl">

      <style>{`
        @keyframes mvbdPopupIn {
          from {
            opacity: 0;
            transform: scale(.92) translateY(12px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }

        @keyframes mvbdFloat {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-4px);
          }
        }

        @keyframes mvbdWork1 {
          0%, 100% {
            transform: translateY(0) rotate(0deg);
          }
          45% {
            transform: translateY(-4px) rotate(-5deg);
          }
          70% {
            transform: translateY(0) rotate(3deg);
          }
        }

        @keyframes mvbdWork2 {
          0%, 100% {
            transform: translateY(0) rotate(0deg);
          }
          40% {
            transform: translateY(-3px) rotate(5deg);
          }
          70% {
            transform: translateY(0) rotate(-3deg);
          }
        }

        @keyframes mvbdTool {
          0%, 100% {
            transform: rotate(-12deg);
          }
          50% {
            transform: rotate(18deg);
          }
        }

        @keyframes mvbdPulse {
          0%, 100% {
            opacity: .35;
            transform: scale(.8);
          }
          50% {
            opacity: 1;
            transform: scale(1);
          }
        }

        @keyframes mvbdShine {
          0% {
            transform: translateX(-140%);
          }
          100% {
            transform: translateX(140%);
          }
        }

        @keyframes mvbdGift {
          0%, 100% {
            transform: translateY(0) rotate(0deg);
          }
          50% {
            transform: translateY(-3px) rotate(-4deg);
          }
        }

        .mvbd-popup {
          animation: mvbdPopupIn .42s cubic-bezier(.22,1,.36,1);
          background:
            linear-gradient(
              145deg,
              rgba(40,40,48,.78),
              rgba(18,18,24,.76)
            );
          backdrop-filter: blur(30px) saturate(170%);
          -webkit-backdrop-filter: blur(30px) saturate(170%);
          border: 1px solid rgba(255,255,255,.13);
          box-shadow:
            0 24px 70px rgba(0,0,0,.55),
            inset 0 1px 0 rgba(255,255,255,.10);
        }

        .mvbd-float {
          animation: mvbdFloat 2.8s ease-in-out infinite;
        }

        .mvbd-person-1 {
          transform-origin: bottom center;
          animation: mvbdWork1 1.8s ease-in-out infinite;
        }

        .mvbd-person-2 {
          transform-origin: bottom center;
          animation: mvbdWork2 1.8s ease-in-out infinite .35s;
        }

        .mvbd-tool {
          transform-origin: center;
          animation: mvbdTool 1.2s ease-in-out infinite;
        }

        .mvbd-pulse {
          animation: mvbdPulse 1.4s ease-in-out infinite;
        }

        .mvbd-gift {
          animation: mvbdGift 2s ease-in-out infinite;
        }

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
            rgba(255,255,255,.13),
            transparent
          );
        }

        .mvbd-button:hover::before {
          animation: mvbdShine .8s ease;
        }

        .mvbd-button:active {
          transform: scale(.97);
        }

        .mvbd-offer {
          background:
            linear-gradient(
              135deg,
              rgba(34,197,94,.10),
              rgba(16,185,129,.045)
            );
          border: 1px solid rgba(134,239,172,.14);
        }

        .mvbd-code {
          background: rgba(0,0,0,.22);
          border: 1px solid rgba(134,239,172,.18);
          box-shadow:
            inset 0 1px 0 rgba(255,255,255,.05);
        }
      `}</style>

      {/* Compact Popup */}
      <div
        className={`mvbd-popup relative w-full max-w-[350px] rounded-[26px] overflow-hidden ${
          visible ? "opacity-100" : "opacity-0"
        }`}
      >

        {/* Ambient Glow */}
        <div className="absolute -top-20 -right-20 w-40 h-40 rounded-full bg-green-400/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-40 h-40 rounded-full bg-cyan-400/10 blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="relative flex items-center justify-between px-4 py-3.5">

          <div className="flex items-center gap-2.5">

            <div className="mvbd-float flex items-center justify-center w-9 h-9 rounded-xl bg-white/[0.07] border border-white/[0.10]">
              <span className="text-green-400 text-lg font-bold">
                M
              </span>
            </div>

            <div>
              <h2 className="text-white text-[15px] font-bold">
                MoviesVerseBD
              </h2>

              <p className="text-white/40 text-[10px]">
                mvbd mini app
              </p>
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

        {/* Premium Offer Banner */}
        <div className="relative mx-4 rounded-2xl mvbd-offer overflow-hidden">

          <div className="flex items-center gap-3 px-3.5 py-3">

            <div className="mvbd-gift flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-xl bg-green-400/10 border border-green-300/10">
              <Gift className="w-5 h-5 text-green-400" />
            </div>

            <div className="min-w-0">

              <div className="flex items-center gap-1.5">

                <span className="text-green-400 text-[14px] font-bold">
                  MVBD Premium
                </span>

                <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-green-400/10 text-green-300 border border-green-300/10">
                  OFFER
                </span>

              </div>

              <p className="text-white/45 text-[10px] mt-0.5">
                পুরোনো Members-দের জন্য বিশেষ সুবিধা 🎁
              </p>

            </div>

          </div>

        </div>

        {/* Message */}
        <div className="relative px-4 pt-3.5 pb-4">

          <div className="px-1">

            <p className="text-white/80 text-[12.5px] leading-6 text-center">

              আমাদের{" "}
              <span className="text-green-400 font-semibold">
                MVBD Premium
              </span>{" "}
              সিস্টেম চালু করা হয়েছে শুধুমাত্র সামান্য
              <span className="text-white font-medium">
                {" "}Server খরচ
              </span>{" "}
              চালানোর জন্য। তাই বিষয়টি কেউ কঠিনভাবে নেবেন না। ❤️

            </p>

            <p className="text-white/55 text-[11px] leading-5 text-center mt-2">

              তবে আমাদের পুরোনো Members-দের জন্য থাকছে
              <span className="text-amber-300 font-semibold">
                {" "}বিশেষ ১ মাসের FREE Offer!
              </span>

            </p>

            {/* Offer Instruction */}
            <div className="mt-3 rounded-xl mvbd-code px-3 py-2.5">

              <p className="text-white/65 text-[10.5px] text-center leading-5">

                Subscription Plan থেকে{" "}
                <span className="text-cyan-300 font-semibold">
                  1 Month
                </span>{" "}
                সিলেক্ট করে নিচের Code-টি লিখে Admin-কে পাঠান

              </p>

              <div className="flex justify-center mt-1.5">

                <span className="text-green-300 text-[13px] font-bold tracking-[2px]">
                  MVBDPRO
                </span>

              </div>

            </div>

            <p className="text-white/45 text-[10.5px] leading-5 text-center mt-2">

              Admin দ্রুত আপনার Account-এ
              <span className="text-green-400">
                {" "}১ মাসের Free Subscription
              </span>{" "}
              চালু করে দেবে।

            </p>

            <p className="text-amber-300/90 text-[10.5px] text-center font-medium mt-2">
              ⏳ অফারটি সীমিত — তাই দেরি করবেন না!
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

          <p className="text-white/35 text-[9.5px] text-center mt-1.5">
            কিছু বুঝতে সমস্যা হলে Request Group-এ জানালেই Admin বুঝিয়ে দেবে।
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
        <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

      </div>
    </div>
  )
}
