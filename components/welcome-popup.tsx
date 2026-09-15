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
    <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 bg-black/70 backdrop-blur-xl">

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

        @keyframes mvbdCake {
          0%, 100% {
            transform: translateY(0) rotate(0deg);
          }
          45% {
            transform: translateY(-3px) rotate(-4deg);
          }
          70% {
            transform: translateY(0) rotate(2deg);
          }
        }

        @keyframes mvbdCandle {
          0%, 100% {
            transform: scaleY(1) translateY(0);
            opacity: .9;
          }
          50% {
            transform: scaleY(1.15) translateY(-1px);
            opacity: 1;
          }
        }

        @keyframes mvbdConfetti {
          0% {
            transform: translateY(-10px) rotate(0deg);
            opacity: 0;
          }
          15% {
            opacity: 1;
          }
          100% {
            transform: translateY(120px) rotate(320deg);
            opacity: 0;
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

        @keyframes mvbdGlow {
          0%, 100% {
            opacity: .35;
            transform: scale(.85);
          }
          50% {
            opacity: .9;
            transform: scale(1.05);
          }
        }

        @keyframes mvbdRibbon {
          0%, 100% {
            transform: rotate(-6deg);
          }
          50% {
            transform: rotate(6deg);
          }
        }

        .mvbd-popup {
          animation: mvbdPopupIn .42s cubic-bezier(.22,1,.36,1);
          background:
            linear-gradient(
              145deg,
              rgba(48,34,58,.82),
              rgba(20,16,28,.80)
            );
          backdrop-filter: blur(30px) saturate(170%);
          -webkit-backdrop-filter: blur(30px) saturate(170%);
          border: 1px solid rgba(255,215,140,.16);
          box-shadow:
            0 24px 70px rgba(0,0,0,.60),
            0 0 45px rgba(255,180,80,.10),
            inset 0 1px 0 rgba(255,255,255,.10);
        }

        .mvbd-float {
          animation: mvbdFloat 2.8s ease-in-out infinite;
        }

        .mvbd-cake {
          transform-origin: bottom center;
          animation: mvbdCake 2s ease-in-out infinite;
        }

        .mvbd-candle {
          transform-origin: bottom center;
          animation: mvbdCandle 1s ease-in-out infinite;
        }

        .mvbd-confetti {
          animation: mvbdConfetti 2.6s linear infinite;
        }

        .mvbd-glow {
          animation: mvbdGlow 2.6s ease-in-out infinite;
        }

        .mvbd-ribbon {
          transform-origin: center;
          animation: mvbdRibbon 2.2s ease-in-out infinite;
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
            rgba(255,255,255,.16),
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
              rgba(251,191,36,.14),
              rgba(244,114,182,.06)
            );
          border: 1px solid rgba(253,224,71,.20);
        }

        .mvbd-code {
          background: rgba(0,0,0,.25);
          border: 1px solid rgba(253,224,71,.22);
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
        <div className="absolute -top-20 -right-20 w-40 h-40 rounded-full bg-amber-400/15 blur-3xl pointer-events-none mvbd-glow" />
        <div className="absolute -bottom-20 -left-20 w-40 h-40 rounded-full bg-pink-400/15 blur-3xl pointer-events-none mvbd-glow" />

        {/* Confetti Dots */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <span className="mvbd-confetti absolute left-[12%] top-0 w-1.5 h-1.5 rounded-full bg-amber-300/80" style={{ animationDelay: "0s" }} />
          <span className="mvbd-confetti absolute left-[28%] top-0 w-1 h-1 rounded-full bg-pink-300/80" style={{ animationDelay: ".6s" }} />
          <span className="mvbd-confetti absolute left-[46%] top-0 w-1.5 h-1.5 rounded-full bg-cyan-300/80" style={{ animationDelay: "1.1s" }} />
          <span className="mvbd-confetti absolute left-[64%] top-0 w-1 h-1 rounded-full bg-amber-200/80" style={{ animationDelay: ".3s" }} />
          <span className="mvbd-confetti absolute left-[82%] top-0 w-1.5 h-1.5 rounded-full bg-fuchsia-300/80" style={{ animationDelay: "1.5s" }} />
        </div>

        {/* Header */}
        <div className="relative flex items-center justify-between px-4 py-3.5">

          <div className="flex items-center gap-2.5">

            <div className="mvbd-float flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400/20 to-pink-500/20 border border-amber-300/25">
              <span className="text-amber-300 text-lg font-bold">
                M
              </span>
            </div>

            <div>
              <h2 className="text-white text-[15px] font-bold">
                MoviesVerseBD
              </h2>

              <p className="text-amber-200/60 text-[10px]">
                2nd Anniversary 🎉
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

        {/* Anniversary Banner */}
        <div className="relative mx-4 rounded-2xl mvbd-offer overflow-hidden">

          <div className="flex items-center gap-3 px-3.5 py-3">

            <div className="mvbd-cake flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-xl bg-amber-400/10 border border-amber-300/15">
              <PartyPopper className="w-5 h-5 text-amber-300" />
            </div>

            <div className="min-w-0">

              <div className="flex items-center gap-1.5">

                <span className="text-amber-300 text-[14px] font-bold">
                  2 Years of MVBD
                </span>

                <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-amber-400/10 text-amber-200 border border-amber-300/20">
                  15 SEPT
                </span>

              </div>

              <p className="text-white/45 text-[10px] mt-0.5">
                আমাদের পথচলার ২ বছর পূর্তি 🎂
              </p>

            </div>

          </div>

        </div>

        {/* Message */}
        <div className="relative px-4 pt-3.5 pb-4">

          <div className="px-1">

            <p className="text-white/80 text-[12.5px] leading-6 text-center">

              <span className="text-amber-300 font-semibold">
                MoviesVerseBD
              </span>{" "}
              এর সাথে থাকার জন্য আপনাকে অসংখ্য ধন্যবাদ। ❤️
              আজ আমাদের{" "}
              <span className="text-white font-medium">
                ২য় Anniversary
              </span>{" "}
              — এই পথচলা সহজ করেনি, কিন্তু আপনার ভালোবাসায় আমরা আজ এখানে।

            </p>

            <p className="text-white/55 text-[11px] leading-5 text-center mt-2">

              এই বিশেষ দিনে আমাদের পুরোনো Members-দের জন্য থাকছে
              <span className="text-amber-300 font-semibold">
                {" "}বিশেষ ১ মাসের FREE Subscription!
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

                <span className="text-amber-300 text-[13px] font-bold tracking-[2px]">
                  MVBD2YEAR
                </span>

              </div>

            </div>

            <p className="text-white/45 text-[10.5px] leading-5 text-center mt-2">

              Admin দ্রুত আপনার Account-এ
              <span className="text-amber-300">
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

          <p className="text-white/35 text-[9.5px] text-center mt-1.5">
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
        <div className="h-px bg-gradient-to-r from-transparent via-amber-200/20 to-transparent" />

      </div>
    </div>
  )
}
