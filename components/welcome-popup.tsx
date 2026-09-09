"use client"

import { useEffect, useState } from "react"
import { X } from "lucide-react"

interface WelcomePopupProps {
  onClose: () => void
}

export default function WelcomePopup({ onClose }: WelcomePopupProps) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 80)
    return () => clearTimeout(timer)
  }, [])

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
      `}</style>

      {/* Compact Popup */}
      <div
        className={`mvbd-popup relative w-full max-w-[350px] rounded-[26px] overflow-hidden ${
          visible ? "opacity-100" : "opacity-0"
        }`}
      >

        {/* subtle ambient glow */}
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

        {/* Working Animation */}
        <div className="relative mx-4 rounded-2xl bg-white/[0.045] border border-white/[0.08] overflow-hidden">

          <div className="flex items-center px-3.5 py-3">

            {/* Animated people */}
            <div className="relative w-[82px] h-[62px] flex-shrink-0">

              <svg
                viewBox="0 0 100 70"
                className="w-full h-full"
                aria-hidden="true"
              >

                {/* Ground */}
                <path
                  d="M8 61 H92"
                  stroke="rgba(255,255,255,.12)"
                  strokeWidth="2"
                  strokeLinecap="round"
                />

                {/* Person 1 */}
                <g className="mvbd-person-1">

                  {/* head */}
                  <circle
                    cx="32"
                    cy="22"
                    r="6"
                    fill="rgba(255,255,255,.82)"
                  />

                  {/* body */}
                  <path
                    d="M32 29 L29 45"
                    stroke="rgba(255,255,255,.78)"
                    strokeWidth="4"
                    strokeLinecap="round"
                  />

                  {/* arm */}
                  <path
                    d="M30 33 L18 42 L13 38"
                    stroke="rgba(255,255,255,.78)"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />

                  {/* leg */}
                  <path
                    d="M29 45 L20 59"
                    stroke="rgba(255,255,255,.78)"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                  />

                  <path
                    d="M30 45 L39 58"
                    stroke="rgba(255,255,255,.78)"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                  />

                  {/* tool */}
                  <g className="mvbd-tool">
                    <path
                      d="M12 38 L7 32"
                      stroke="#86efac"
                      strokeWidth="3"
                      strokeLinecap="round"
                    />
                  </g>

                </g>

                {/* Person 2 */}
                <g className="mvbd-person-2">

                  {/* head */}
                  <circle
                    cx="67"
                    cy="20"
                    r="6"
                    fill="rgba(255,255,255,.82)"
                  />

                  {/* body */}
                  <path
                    d="M67 27 L69 44"
                    stroke="rgba(255,255,255,.78)"
                    strokeWidth="4"
                    strokeLinecap="round"
                  />

                  {/* arm reaching */}
                  <path
                    d="M68 31 L80 39 L88 35"
                    stroke="rgba(255,255,255,.78)"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />

                  {/* other arm */}
                  <path
                    d="M68 31 L58 38"
                    stroke="rgba(255,255,255,.78)"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                  />

                  {/* legs */}
                  <path
                    d="M69 44 L61 59"
                    stroke="rgba(255,255,255,.78)"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                  />

                  <path
                    d="M69 44 L78 58"
                    stroke="rgba(255,255,255,.78)"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                  />

                </g>

                {/* Small work box */}
                <rect
                  x="43"
                  y="48"
                  width="14"
                  height="10"
                  rx="2"
                  fill="rgba(34,197,94,.22)"
                  stroke="rgba(134,239,172,.45)"
                  strokeWidth="1"
                />

                {/* tiny spark */}
                <circle
                  className="mvbd-pulse"
                  cx="54"
                  cy="39"
                  r="2"
                  fill="#86efac"
                />

              </svg>

            </div>

            {/* Status */}
            <div className="ml-2">

              <div className="flex items-center gap-2">

                <span className="text-green-400 text-[14px] font-semibold">
                  কাজ চলছে
                </span>

                <span className="flex gap-1">
                  <i className="w-1 h-1 rounded-full bg-green-400 animate-pulse" />
                  <i
                    className="w-1 h-1 rounded-full bg-green-400 animate-pulse"
                    style={{ animationDelay: "200ms" }}
                  />
                  <i
                    className="w-1 h-1 rounded-full bg-green-400 animate-pulse"
                    style={{ animationDelay: "400ms" }}
                  />
                </span>

              </div>

              <p className="text-white/40 text-[10px] mt-1">
                Mini App উন্নয়নের কাজ চলছে
              </p>

            </div>

          </div>

        </div>

        {/* Short Message */}
        <div className="relative px-4 pt-3.5 pb-4">

          <div className="px-2">

            <p className="text-white/80 text-[13px] leading-6 text-center">

              <span className="text-white font-semibold">
                mvbd mini app
              </span>{" "}
              এর কাজ বর্তমানে চলমান রয়েছে।
              Mini App-এ থাকা কিছু{" "}

              <span className="text-amber-300">
                Bug ও Technical Issue
              </span>{" "}

              ঠিক করার পাশাপাশি{" "}

              <span className="text-green-400">
                Profile Section
              </span>{" "}
              এবং{" "}

              <span className="text-cyan-300">
                Subscriptions System
              </span>{" "}

              খুব শীঘ্রই চালু করে দেওয়া হবে।

            </p>

            <p className="text-white/45 text-[11px] leading-5 text-center mt-2">

              অনুগ্রহ করে আমাদের সাথেই থাকুন।
              কোনো সমস্যা হলে আমাদের{" "}

              <span className="text-cyan-300">
                Telegram Movie Request Group
              </span>{" "}

              এ জানিয়ে দিন।

            </p>

            <p className="text-green-400/90 text-[11px] text-center font-medium mt-2">
              আপনাদের সহযোগিতার জন্য আন্তরিক ধন্যবাদ ❤️
            </p>

          </div>

          {/* Single Button */}
          <button
            onClick={onClose}
            className="mvbd-button mt-4 w-full rounded-xl py-2.5 text-[13px] font-semibold text-white"
          >
            বুঝেছি
          </button>

        </div>

        {/* Bottom glass highlight */}
        <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

      </div>
    </div>
  )
}
