"use client"

import {
  forwardRef,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type FormEvent,
  type InputHTMLAttributes,
  type ReactNode,
} from "react"
import { Poppins } from "next/font/google"
import { ArrowRight, Eye, EyeOff, X } from "lucide-react"

import { useAuth } from "@/components/auth-provider"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog"

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
})

/*
 * =========================================
 * SHIMMER ORB LOADER (আগের মতোই)
 * =========================================
 */
function ShimmerOrbLoader() {
  return (
    <div className="shimmer-orb-wrapper">
      <div className="shimmer-orb">
        <span className="shimmer-letter">M</span>
      </div>

      <style jsx>{`
        .shimmer-orb-wrapper {
          position: relative;
          width: 100px;
          height: 100px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .shimmer-orb {
          position: relative;
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .shimmer-orb::before {
          content: "";
          position: absolute;
          inset: 0;
          border-radius: 50%;
          background: conic-gradient(
            from 0deg,
            transparent 0deg,
            rgba(183, 255, 0, 0.8) 90deg,
            transparent 180deg,
            transparent 360deg
          );
          animation: shimmerSpin 1.8s linear infinite;
          filter: blur(8px);
        }
        .shimmer-orb::after {
          content: "";
          position: absolute;
          inset: 6px;
          border-radius: 50%;
          background: #0b0f14;
        }
        .shimmer-letter {
          position: relative;
          z-index: 3;
          font-size: 34px;
          font-weight: 900;
          background: linear-gradient(135deg, #fff 0%, #b7ff00 50%, #20e000 100%);
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
          text-shadow: 0 0 20px rgba(183, 255, 0, 0.8);
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui,
            sans-serif;
        }
        @keyframes shimmerSpin {
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  )
}

function getAuthErrorMessage(error: unknown) {
  if (typeof error !== "object" || error === null || !("code" in error)) {
    return "Something went wrong. Please try again."
  }
  switch (error.code) {
    case "auth/invalid-credential":
    case "auth/user-not-found":
    case "auth/wrong-password":
      return "The email or password is incorrect."
    case "auth/email-already-in-use":
      return "An account already exists with this email."
    case "auth/weak-password":
      return "Use a password with at least 6 characters."
    case "auth/invalid-email":
      return "Enter a valid email address."
    case "auth/popup-closed-by-user":
      return "The Google sign-in window was closed."
    case "auth/popup-blocked":
      return "Your browser blocked the Google sign-in window."
    default:
      return "Authentication failed. Please try again."
  }
}

/*
 * Glass input pill. Uncontrolled (ref based) — typing এ কোনো re-render হয় না, তাই lag নেই।
 * Label float + light glow সব CSS দিয়ে (:focus-within / :placeholder-shown)।
 */
type GlassFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string
  trailing?: ReactNode
  fieldClassName?: string
}

const GlassField = forwardRef<HTMLInputElement, GlassFieldProps>(
  function GlassField({ label, trailing, fieldClassName = "", ...props }, ref) {
    return (
      <div className={`mv-field ${fieldClassName}`}>
        <input ref={ref} {...props} placeholder=" " className="mv-input" />
        <label className="mv-label" htmlFor={props.id}>
          {label}
        </label>
        {trailing}
      </div>
    )
  },
)

type AuthModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function AuthModal({ open, onOpenChange }: AuthModalProps) {
  const { signIn, signUp, signInWithGoogle } = useAuth()
  const [mode, setMode] = useState<"sign-in" | "sign-up">("sign-in")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const emailRef = useRef<HTMLInputElement>(null)
  const passwordRef = useRef<HTMLInputElement>(null)
  const nameRef = useRef<HTMLInputElement>(null)
  const dobRef = useRef<HTMLInputElement>(null)
  const referralRef = useRef<HTMLInputElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  /*
   * Morph origin: user যেখানে ক্লিক/ট্যাপ করেছে (Sign in button) সেখান থেকে popup বড় হয়ে খোলে,
   * আবার ওখানেই ছোট হয়ে বন্ধ হয়। Open হওয়ার মুহূর্তের position freeze করা থাকে।
   */
  const pointerRef = useRef<{ x: number; y: number } | null>(null)
  const originRef = useRef({ dx: 0, dy: 0 })
  const wasOpenRef = useRef(false)

  useEffect(() => {
    const onDown = (e: PointerEvent) => {
      pointerRef.current = { x: e.clientX, y: e.clientY }
    }
    window.addEventListener("pointerdown", onDown, { capture: true, passive: true })
    return () => window.removeEventListener("pointerdown", onDown, { capture: true })
  }, [])

  if (open && !wasOpenRef.current && typeof window !== "undefined") {
    const p = pointerRef.current
    originRef.current = p
      ? { dx: p.x - window.innerWidth / 2, dy: p.y - window.innerHeight / 2 }
      : { dx: 0, dy: 0 }
  }
  wasOpenRef.current = open

  // Reset on close
  useEffect(() => {
    if (!open) {
      if (emailRef.current) emailRef.current.value = ""
      if (passwordRef.current) passwordRef.current.value = ""
      if (nameRef.current) nameRef.current.value = ""
      if (dobRef.current) dobRef.current.value = ""
      if (referralRef.current) referralRef.current.value = ""
      setError("")
      setMode("sign-in")
      setShowPassword(false)
    }
  }, [open])

  // Telegram Mini App: handle viewport resize (keyboard open/close)
  useEffect(() => {
    if (typeof window === "undefined") return

    const handleResize = () => {
      if (scrollRef.current) {
        scrollRef.current.style.height = ""
      }
    }

    window.addEventListener("resize", handleResize)

    const tg = (window as any).Telegram?.WebApp
    if (tg) {
      try {
        tg.expand?.()
        tg.enableClosingConfirmation?.()
      } catch {}
    }

    return () => window.removeEventListener("resize", handleResize)
  }, [])

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError("")
    setIsSubmitting(true)

    const email = emailRef.current?.value.trim() ?? ""
    const password = passwordRef.current?.value ?? ""

    try {
      if (mode === "sign-in") {
        await signIn(email, password)
      } else {
        await signUp(email, password, {
          name: nameRef.current?.value.trim() ?? "",
          dateOfBirth: dobRef.current?.value ?? "",
          referralCode: (referralRef.current?.value ?? "").trim().toUpperCase(),
        })
      }
      onOpenChange(false)
    } catch (authError) {
      setError(getAuthErrorMessage(authError))
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setError("")
    setIsSubmitting(true)
    try {
      await signInWithGoogle()
      onOpenChange(false)
    } catch (authError) {
      setError(getAuthErrorMessage(authError))
    } finally {
      setIsSubmitting(false)
    }
  }

  const switchMode = (next: "sign-in" | "sign-up") => {
    if (next === mode) return
    setMode(next)
    setError("")
  }

  // Position/animation vars — inline রাখা হয়েছে যাতে shadcn এর default class গুলো override হয়
  const rootStyle = {
    position: "fixed",
    inset: 0,
    margin: "auto",
    display: "block",
    width: "min(420px, calc(100vw - 2rem))",
    maxWidth: "none",
    height: "fit-content",
    padding: 0,
    border: 0,
    background: "transparent",
    boxShadow: "none",
    transform: "none",
    translate: "none",
    zIndex: 2147483647,
    "--mv-dx": `${originRef.current.dx}px`,
    "--mv-dy": `${originRef.current.dy}px`,
  } as CSSProperties

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          onOpenAutoFocus={(e) => e.preventDefault()}
          onCloseAutoFocus={(e) => e.preventDefault()}
          onPointerDownOutside={(e) => {
            e.preventDefault()
          }}
          className={`mv-root ${poppins.className} [&>button]:hidden`}
          style={rootStyle}
        >
          {/* Aurora halo (card এর বাইরের সবুজ আলো) */}
          <div className="mv-halo" aria-hidden="true">
            <i className="mv-aur mv-aur-a" />
            <i className="mv-aur mv-aur-b" />
            <i className="mv-aur mv-aur-c" />
            <i className="mv-grain" />
          </div>

          <div className="mv-card">
            <i className="mv-grain mv-grain-card" aria-hidden="true" />

            {/* Liquid glass close button */}
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              aria-label="Close"
              className="mv-close"
            >
              <X size={16} strokeWidth={2.4} />
            </button>

            {/* Loading overlay */}
            {isSubmitting && (
              <div className="mv-loading">
                <ShimmerOrbLoader />
                <p className="shimmer-loading-text">
                  {mode === "sign-in" ? "Signing you in..." : "Creating MVBD account..."}
                </p>
              </div>
            )}

            <div ref={scrollRef} className="auth-scroll mv-scroll">
              <div className="mv-inner">
                <header className="mv-head">
                  <img
                    src="https://i.postimg.cc/V6GHC8yG/17773-removebg-preview.png"
                    alt="MoviesVerseBD"
                    className="mv-logo"
                  />
                  <DialogTitle key={`t-${mode}`} className="mv-title mv-swap">
                    {mode === "sign-in" ? "Welcome back" : "Create account"}
                  </DialogTitle>
                  <DialogDescription key={`d-${mode}`} className="mv-sub mv-swap">
                    {mode === "sign-in"
                      ? "Sign in to continue your cinematic journey."
                      : "Join MVBD and unlock unlimited movies & shows."}
                  </DialogDescription>
                </header>

                <form className="mv-form" onSubmit={handleSubmit}>
                  {/* Sign up এর extra field — smooth expand/collapse। disabled হলে validation হয় না */}
                  <div
                    className="mv-extra"
                    data-open={mode === "sign-up"}
                    aria-hidden={mode !== "sign-up"}
                  >
                    <fieldset disabled={mode !== "sign-up"}>
                      <div className="mv-fields">
                        <GlassField
                          id="auth-name"
                          ref={nameRef}
                          label="Full name"
                          autoComplete="name"
                          required
                        />
                        <div className="mv-pair">
                          <GlassField
                            id="auth-dob"
                            ref={dobRef}
                            type="date"
                            label="Date of birth"
                            fieldClassName="mv-field--date"
                            required
                          />
                          <GlassField
                            id="auth-referral"
                            ref={referralRef}
                            label="Referral (opt.)"
                            autoCapitalize="characters"
                            fieldClassName="mv-field--code"
                          />
                        </div>
                      </div>
                    </fieldset>
                  </div>

                  <GlassField
                    id="auth-email"
                    ref={emailRef}
                    type="email"
                    inputMode="email"
                    label="Email address"
                    autoComplete="email"
                    autoCorrect="off"
                    autoCapitalize="off"
                    spellCheck={false}
                    required
                  />

                  <GlassField
                    id="auth-password"
                    ref={passwordRef}
                    type={showPassword ? "text" : "password"}
                    label="Password"
                    autoComplete={mode === "sign-in" ? "current-password" : "new-password"}
                    autoCorrect="off"
                    autoCapitalize="off"
                    spellCheck={false}
                    required
                    minLength={6}
                    trailing={
                      <button
                        type="button"
                        className="mv-go mv-eye"
                        aria-label={showPassword ? "Hide password" : "Show password"}
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => setShowPassword((v) => !v)}
                      >
                        {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                      </button>
                    }
                  />

                  {error ? (
                    <div className="mv-error mv-swap" role="alert">
                      <span className="mv-dot" />
                      {error}
                    </div>
                  ) : null}

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="mv-btn mv-btn-primary"
                  >
                    <span>{mode === "sign-in" ? "Sign in" : "Create account"}</span>
                    <span className="mv-go">
                      <ArrowRight size={18} strokeWidth={2.2} />
                    </span>
                  </button>

                  <div className="mv-or">
                    <span>OR</span>
                  </div>

                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={handleGoogleSignIn}
                    className="mv-btn"
                  >
                    <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                    <span>Continue with Google</span>
                    <span className="mv-go">
                      <ArrowRight size={18} strokeWidth={2.2} />
                    </span>
                  </button>

                  <p className="mv-foot">
                    {mode === "sign-in" ? "Don't have an account?" : "Already have an account?"}
                    <button
                      type="button"
                      onClick={() => switchMode(mode === "sign-in" ? "sign-up" : "sign-in")}
                    >
                      {mode === "sign-in" ? "Sign up" : "Sign in"}
                    </button>
                  </p>
                </form>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <style jsx global>{`
        /* ---------- tokens ----------
           Glow রঙ বদলাতে চাইলে শুধু এই দুটো লাইন বদলাও।
           Red light (ditio image) চাইলে: --mv-glow-rgb: 255, 48, 40; */
        .mv-root {
          --mv-glow-rgb: 110, 235, 35;
          --mv-g: 96, 220, 24;
          color: #fff;
          -webkit-font-smoothing: antialiased;
          will-change: transform, opacity;
        }

        /* ---------- popup morph (iOS liquid glass style) ---------- */
        .mv-root[data-state="open"] {
          animation: mvPanelIn 0.68s backwards !important;
        }
        .mv-root[data-state="closed"] {
          animation: mvPanelOut 0.46s both !important;
        }
        @keyframes mvPanelIn {
          0% {
            opacity: 0;
            transform: translate3d(var(--mv-dx, 0px), var(--mv-dy, 0px), 0) scale(0.14, 0.1);
            animation-timing-function: cubic-bezier(0.2, 0.85, 0.25, 1);
          }
          14% {
            opacity: 1;
          }
          58% {
            transform: translate3d(calc(var(--mv-dx, 0px) * 0.03), calc(var(--mv-dy, 0px) * 0.03), 0)
              scale(1.032, 1.045);
            animation-timing-function: cubic-bezier(0.4, 0, 0.3, 1);
          }
          80% {
            transform: translate3d(0, 0, 0) scale(0.994, 0.99);
            animation-timing-function: ease-out;
          }
          100% {
            opacity: 1;
            transform: translate3d(0, 0, 0) scale(1);
          }
        }
        @keyframes mvPanelOut {
          0% {
            opacity: 1;
            transform: translate3d(0, 0, 0) scale(1);
            animation-timing-function: ease-out;
          }
          16% {
            opacity: 1;
            transform: translate3d(0, 0, 0) scale(1.012, 1.02);
            animation-timing-function: cubic-bezier(0.6, 0, 0.25, 1);
          }
          72% {
            opacity: 1;
          }
          100% {
            opacity: 0;
            transform: translate3d(var(--mv-dx, 0px), var(--mv-dy, 0px), 0) scale(0.14, 0.1);
          }
        }

        /* card এর কোণা blob -> panel */
        .mv-root[data-state="open"] .mv-card {
          animation: mvRadiusIn 0.68s backwards;
        }
        .mv-root[data-state="closed"] .mv-card {
          animation: mvRadiusOut 0.46s both;
        }
        @keyframes mvRadiusIn {
          0% { border-radius: 170px; }
          60% { border-radius: 40px; }
          100% { border-radius: 34px; }
        }
        @keyframes mvRadiusOut {
          0% { border-radius: 34px; }
          100% { border-radius: 170px; }
        }

        /* ভেতরের content: blur + fade */
        .mv-root[data-state="open"] .mv-inner {
          animation: mvInnerIn 0.55s cubic-bezier(0.2, 0.8, 0.2, 1) 0.12s backwards;
        }
        .mv-root[data-state="closed"] .mv-inner {
          animation: mvInnerOut 0.2s ease-in forwards;
        }
        @keyframes mvInnerIn {
          from { opacity: 0; filter: blur(12px); transform: scale(0.94); }
          to { opacity: 1; filter: blur(0); transform: none; }
        }
        @keyframes mvInnerOut {
          to { opacity: 0; filter: blur(10px); }
        }
        .mv-root[data-state="open"] .mv-halo {
          animation: mvFade 0.7s ease 0.25s backwards;
        }
        .mv-root[data-state="closed"] .mv-halo {
          animation: mvFadeOut 0.18s ease forwards;
        }
        @keyframes mvFade { from { opacity: 0; } }
        @keyframes mvFadeOut { to { opacity: 0; } }

        /* ---------- halo / aurora (শুধু transform animate হয়, তাই হালকা) ---------- */
        .mv-root .mv-halo {
          position: absolute;
          inset: -120px -110px;
          z-index: 0;
          pointer-events: none;
        }
        .mv-root .mv-aur {
          position: absolute;
          display: block;
          border-radius: 50%;
          will-change: transform;
        }
        .mv-root .mv-aur-a {
          width: 420px; height: 250px; top: 0; right: 0;
          background: radial-gradient(closest-side, rgba(0,0,0,0) 46%, rgba(var(--mv-g), 0.1) 54%, rgba(var(--mv-g), 0.85) 74%, rgba(var(--mv-g), 0) 100%);
          animation: mvDriftA 16s ease-in-out infinite alternate;
        }
        .mv-root .mv-aur-b {
          width: 460px; height: 270px; bottom: 0; left: 6%;
          background: radial-gradient(closest-side, rgba(0,0,0,0) 44%, rgba(var(--mv-g), 0.1) 52%, rgba(var(--mv-g), 0.8) 72%, rgba(var(--mv-g), 0) 100%);
          animation: mvDriftB 19s ease-in-out infinite alternate;
        }
        .mv-root .mv-aur-c {
          width: 230px; height: 200px; left: 0; top: 46%;
          background: radial-gradient(closest-side, rgba(var(--mv-g), 0.75), rgba(var(--mv-g), 0) 100%);
          animation: mvDriftA 13s ease-in-out infinite alternate-reverse;
        }
        @keyframes mvDriftA {
          from { transform: translate3d(-10px, 6px, 0) rotate(-12deg) scale(1); }
          to { transform: translate3d(14px, -10px, 0) rotate(-4deg) scale(1.06); }
        }
        @keyframes mvDriftB {
          from { transform: translate3d(12px, -6px, 0) rotate(8deg) scale(1.04); }
          to { transform: translate3d(-14px, 10px, 0) rotate(14deg) scale(1); }
        }
        .mv-root .mv-grain {
          position: absolute;
          inset: 0;
          pointer-events: none;
          opacity: 0.5;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='1' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 .75 0 0 0 0 1 0 0 0 0 .55 1.6 0 0 0 -.55'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
        }

        /* ---------- glass card ---------- */
        .mv-root .mv-card {
          position: relative;
          z-index: 1;
          overflow: hidden;
          border-radius: 34px;
          max-height: calc(100vh - 2rem);
          max-height: calc(100dvh - 2rem);
          background:
            radial-gradient(120% 60% at 12% 18%, rgba(var(--mv-g), 0.2), transparent 62%),
            radial-gradient(90% 55% at 100% 100%, rgba(var(--mv-g), 0.26), transparent 66%),
            linear-gradient(160deg, rgba(20, 26, 16, 0.8), rgba(4, 7, 4, 0.88));
          box-shadow: 0 40px 90px -30px rgba(0, 0, 0, 0.9);
        }
        .mv-root .mv-card::before {
          content: "";
          position: absolute;
          inset: 0;
          z-index: 4;
          border-radius: inherit;
          padding: 1px;
          pointer-events: none;
          background: linear-gradient(135deg, rgba(255,255,255,0.38), rgba(255,255,255,0.06) 38%, rgba(255,255,255,0.02) 62%, rgba(255,255,255,0.2));
          -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
          -webkit-mask-composite: xor;
          mask: linear-gradient(#000 0 0) content-box exclude, linear-gradient(#000 0 0);
        }
        .mv-root .mv-grain-card {
          z-index: 0;
          opacity: 0.35;
        }
        .mv-root .mv-scroll {
          position: relative;
          z-index: 1;
          max-height: inherit;
          overflow-y: auto;
          overscroll-behavior: contain;
          -webkit-overflow-scrolling: touch;
          scrollbar-width: none;
          touch-action: pan-y;
          padding: 30px 22px 22px;
        }
        .mv-root .mv-scroll::-webkit-scrollbar { display: none; }

        /* ---------- header ---------- */
        .mv-root .mv-head { text-align: center; margin-bottom: 26px; }
        .mv-root .mv-logo {
          width: 42px; height: 42px; margin: 0 auto 14px; object-fit: contain;
          filter: drop-shadow(0 0 12px rgba(var(--mv-g), 0.5));
        }
        .mv-root .mv-title {
          margin: 0; font-size: 28px; font-weight: 600; line-height: 1.15;
          letter-spacing: -0.02em; color: #fff; text-align: center;
        }
        .mv-root .mv-sub {
          margin: 8px 0 0; font-size: 14px; line-height: 1.45; font-weight: 500;
          color: rgba(255, 255, 255, 0.5); text-align: center;
        }
        .mv-root .mv-swap { animation: mvSwap 0.4s cubic-bezier(0.2, 0.8, 0.2, 1) backwards; }
        @keyframes mvSwap {
          from { opacity: 0; filter: blur(6px); transform: translateY(4px); }
        }

        /* ---------- form ---------- */
        .mv-root .mv-form { display: flex; flex-direction: column; gap: 12px; }
        .mv-root .mv-extra {
          display: grid; grid-template-rows: 0fr; opacity: 0; margin-bottom: -12px;
          transition: grid-template-rows 0.55s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.35s ease,
            margin-bottom 0.55s cubic-bezier(0.22, 1, 0.36, 1);
        }
        .mv-root .mv-extra[data-open="true"] { grid-template-rows: 1fr; opacity: 1; margin-bottom: 0; }
        .mv-root .mv-extra > fieldset {
          min-height: 0; min-width: 0; overflow: hidden; border: 0; margin: -3px; padding: 3px;
        }
        .mv-root .mv-fields { display: flex; flex-direction: column; gap: 12px; }
        .mv-root .mv-pair {
          display: grid; gap: 12px;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
        }

        /* ---------- glass field + focus light (ditio image) ---------- */
        .mv-root .mv-field {
          position: relative; isolation: isolate; height: 58px; border-radius: 999px; overflow: hidden;
          background: linear-gradient(180deg, rgba(255,255,255,0.065), rgba(255,255,255,0.022));
          border: 1px solid rgba(255, 255, 255, 0.085);
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.07), 0 10px 20px -16px rgba(0,0,0,0.9);
          transition: border-color 0.4s ease, box-shadow 0.5s ease;
        }
        /* আলো: focus এ জ্বলে, বাইরে click করলে নিভে যায় */
        .mv-root .mv-field::before {
          content: ""; position: absolute; inset: -1px; z-index: 0; border-radius: inherit; pointer-events: none;
          opacity: 0; transform: translateX(-14%) scale(0.9);
          transition: opacity 0.5s ease, transform 0.6s cubic-bezier(0.22, 1.2, 0.36, 1);
          background:
            radial-gradient(70% 150% at 14% 50%, rgba(var(--mv-glow-rgb), 0.62) 0%, rgba(var(--mv-glow-rgb), 0.3) 38%, rgba(var(--mv-glow-rgb), 0) 74%);
        }
        /* জ্বলে ওঠার সময় এক ঝলক সাদা আলো (video 2 এর flash) */
        .mv-root .mv-field::after {
          content: ""; position: absolute; inset: 0; z-index: 0; border-radius: inherit; pointer-events: none;
          opacity: 0; transform-origin: 0 50%;
          background: radial-gradient(60% 170% at 14% 50%, rgba(255,255,255,0.7), rgba(var(--mv-glow-rgb), 0.35) 45%, transparent 76%);
        }
        .mv-root .mv-field:focus-within {
          border-color: rgba(var(--mv-glow-rgb), 0.5);
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.12), 0 0 0 1px rgba(var(--mv-glow-rgb), 0.14),
            0 10px 22px -16px rgba(var(--mv-glow-rgb), 0.7);
          animation: mvPop 0.62s cubic-bezier(0.22, 1.3, 0.36, 1);
        }
        .mv-root .mv-field:focus-within::before { opacity: 1; transform: none; }
        .mv-root .mv-field:focus-within::after { animation: mvFlash 0.7s cubic-bezier(0.2, 0.7, 0.2, 1) both; }
        @keyframes mvPop {
          0% { transform: scale(1); }
          30% { transform: scale(1.03, 0.965); }
          60% { transform: scale(0.994, 1.012); }
          100% { transform: scale(1); }
        }
        @keyframes mvFlash {
          0% { opacity: 0; transform: scaleX(0.4); }
          18% { opacity: 1; }
          100% { opacity: 0; transform: scaleX(1.25); }
        }
        .mv-root .mv-input {
          position: relative; z-index: 1; width: 100%; height: 100%; box-sizing: border-box;
          padding: 20px 58px 0 22px; border: 0; outline: 0; background: transparent; appearance: none;
          -webkit-appearance: none; color: #fff; font-family: inherit; font-size: 16px; font-weight: 500;
          caret-color: rgb(var(--mv-glow-rgb)); text-shadow: 0 1px 8px rgba(0,0,0,0.4); color-scheme: dark;
          border-radius: 999px;
        }
        .mv-root .mv-input:-webkit-autofill {
          -webkit-text-fill-color: #fff; transition: background-color 99999s ease-out;
          box-shadow: 0 0 0 100px #0c110a inset;
        }
        .mv-root .mv-input::-webkit-calendar-picker-indicator { filter: invert(1); opacity: 0.55; cursor: pointer; }
        .mv-root .mv-field--code .mv-input { text-transform: uppercase; }
        .mv-root .mv-label {
          position: absolute; left: 22px; top: 50%; z-index: 2; pointer-events: none; white-space: nowrap;
          transform-origin: 0 50%; transform: translateY(-50%);
          font-size: 16px; font-weight: 500; color: rgba(255, 255, 255, 0.5);
          transition: transform 0.35s cubic-bezier(0.22, 1, 0.36, 1), color 0.3s ease;
        }
        .mv-root .mv-input:focus + .mv-label,
        .mv-root .mv-input:not(:placeholder-shown) + .mv-label,
        .mv-root .mv-input:-webkit-autofill + .mv-label,
        .mv-root .mv-field--date .mv-label {
          transform: translateY(calc(-50% - 16px)) scale(0.72);
          color: rgba(255, 255, 255, 0.62);
        }

        /* ---------- circle icon + pill buttons ---------- */
        .mv-root .mv-go {
          display: grid; place-items: center; flex: none; width: 38px; height: 38px; border-radius: 999px;
          border: 0; padding: 0; cursor: pointer; color: rgba(255,255,255,0.7);
          background: rgba(255, 255, 255, 0.07); box-shadow: inset 0 1px 0 rgba(255,255,255,0.08);
        }
        .mv-root .mv-eye { position: absolute; right: 10px; top: 50%; transform: translateY(-50%); z-index: 3; }
        .mv-root .mv-btn {
          position: relative; display: flex; align-items: center; gap: 12px; width: 100%; height: 58px;
          padding: 0 10px 0 20px; border-radius: 999px; cursor: pointer; text-align: left;
          font-family: inherit; font-size: 16px; font-weight: 500; color: rgba(255,255,255,0.82);
          background: linear-gradient(180deg, rgba(255,255,255,0.065), rgba(255,255,255,0.022));
          border: 1px solid rgba(255, 255, 255, 0.085);
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.07);
          transition: transform 0.4s cubic-bezier(0.22, 1.4, 0.36, 1), border-color 0.3s ease, opacity 0.3s ease;
          -webkit-tap-highlight-color: transparent;
        }
        .mv-root .mv-btn .mv-go { margin-left: auto; }
        .mv-root .mv-btn:active { transform: scale(0.975); }
        .mv-root .mv-btn:disabled { opacity: 0.55; pointer-events: none; }
        .mv-root .mv-btn-primary {
          color: #07140a; font-weight: 600; border-color: rgba(255,255,255,0.3);
          background: linear-gradient(180deg, #a6ff4a, #3fb90f);
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.5), 0 14px 30px -14px rgba(var(--mv-glow-rgb), 0.8);
        }
        .mv-root .mv-btn-primary .mv-go { background: #0a1a07; color: rgb(var(--mv-glow-rgb)); }
        @media (hover: hover) {
          .mv-root .mv-btn:hover { border-color: rgba(255, 255, 255, 0.18); }
          .mv-root .mv-go:hover { color: #fff; }
        }

        .mv-root .mv-or {
          display: flex; align-items: center; gap: 14px; margin: 2px 0;
          font-size: 10px; font-weight: 500; letter-spacing: 0.14em; color: rgba(255,255,255,0.4);
        }
        .mv-root .mv-or::before, .mv-root .mv-or::after {
          content: ""; flex: 1; height: 1px;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.14), transparent);
        }
        .mv-root .mv-foot { margin: 8px 0 0; text-align: center; font-size: 14px; font-weight: 500; color: rgba(255,255,255,0.5); }
        .mv-root .mv-foot button {
          margin-left: 6px; padding: 2px 2px; border: 0; background: none; cursor: pointer;
          font-family: inherit; font-size: inherit; font-weight: 600; color: #fff;
          text-shadow: 0 0 14px rgba(var(--mv-glow-rgb), 0.7);
        }
        .mv-root .mv-error {
          display: flex; align-items: flex-start; gap: 8px; padding: 10px 14px; border-radius: 20px;
          font-size: 12.5px; line-height: 1.4; color: #fca5a5;
          border: 1px solid rgba(239, 68, 68, 0.28); background: rgba(239, 68, 68, 0.1);
        }
        .mv-root .mv-dot { margin-top: 5px; width: 6px; height: 6px; flex: none; border-radius: 50%; background: #f87171; }

        /* ---------- close button (liquid glass) ---------- */
        .mv-root .mv-close {
          position: absolute; top: 14px; right: 14px; z-index: 6; width: 40px; height: 40px;
          display: grid; place-items: center; padding: 0; border-radius: 999px; cursor: pointer; color: #fff;
          border: 1px solid rgba(255, 255, 255, 0.22);
          background: radial-gradient(120% 120% at 30% 15%, rgba(255,255,255,0.3), rgba(255,255,255,0.06) 55%, rgba(255,255,255,0.1));
          box-shadow: inset 0 1px 1px rgba(255,255,255,0.5), inset 0 -6px 10px -6px rgba(255,255,255,0.2),
            0 8px 20px -8px rgba(0,0,0,0.7);
          transition: transform 0.4s cubic-bezier(0.22, 1.5, 0.36, 1), filter 0.3s ease;
          -webkit-tap-highlight-color: transparent;
        }
        .mv-root .mv-close:active { transform: scale(0.84); filter: brightness(1.5); }

        /* ---------- loading overlay ---------- */
        .mv-root .mv-loading {
          position: absolute; inset: 0; z-index: 5; display: flex; flex-direction: column;
          align-items: center; justify-content: center; gap: 24px; background: rgba(3, 5, 3, 0.9);
          animation: mvFade 0.25s ease backwards;
        }
        .mv-root .shimmer-loading-text {
          margin: 0; padding: 0 20px; text-align: center; font-size: 13px; font-weight: 600;
          letter-spacing: 0.15em; text-transform: uppercase; color: #b7ff00;
          text-shadow: 0 0 15px rgba(183, 255, 0, 0.5);
          animation: shimmerTextBlink 1.6s ease-in-out infinite;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif;
        }
        @keyframes shimmerTextBlink {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 1; }
        }

        /* ---------- reduced motion: শুধু simple fade ---------- */
        @media (prefers-reduced-motion: reduce) {
          .mv-root[data-state="open"] { animation: mvFade 0.2s backwards !important; }
          .mv-root[data-state="closed"] { animation: mvFadeOut 0.15s both !important; }
          .mv-root .mv-card, .mv-root .mv-inner, .mv-root .mv-halo, .mv-root .mv-aur,
          .mv-root .mv-field, .mv-root .mv-field::after, .mv-root .mv-swap { animation: none !important; }
        }
      `}</style>
    </>
  )
}
