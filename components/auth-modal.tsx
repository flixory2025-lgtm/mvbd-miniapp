"use client"

import { forwardRef, useState, useRef, useEffect } from "react"
import { Eye, EyeOff, ArrowRight, X } from "lucide-react"

import { useAuth } from "@/components/auth-provider"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

/*
 * =========================================
 * GLOW COLOR (R,G,B)
 * লাল: "255,40,40"  |  সবুজ করতে চাইলে: "16,185,129"
 * =========================================
 */
const GLOW = "255,40,40"

/*
 * =========================================
 * SHIMMER ORB LOADER COMPONENT
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
          content: '';
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
          content: '';
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
          background: linear-gradient(
            135deg,
            #fff 0%,
            #B7FF00 50%,
            #20E000 100%
          );
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
          text-shadow: 0 0 20px rgba(183, 255, 0, 0.8);
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI",
            system-ui, sans-serif;
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
 * =========================================
 * GLOW FIELD (floating label + light effect)
 * - box e click korle label upore uthe jay + light jole
 * - onno jaygay click korle light off
 * =========================================
 */
const FLOAT_ON_FOCUS =
  "peer-focus:top-[13px] peer-focus:translate-y-0 peer-focus:text-[11px] peer-focus:text-slate-300"
const FLOAT_ON_VALUE =
  "peer-[:not(:placeholder-shown)]:top-[13px] peer-[:not(:placeholder-shown)]:translate-y-0 peer-[:not(:placeholder-shown)]:text-[11px]"
const FLOAT_ALWAYS = "top-[13px] translate-y-0 text-[11px]"

type GlowFieldProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, "id"> & {
  id: string
  label: string
  alwaysFloat?: boolean
  rightSlot?: React.ReactNode
}

const GlowField = forwardRef<HTMLInputElement, GlowFieldProps>(function GlowField(
  { id, label, alwaysFloat, rightSlot, className = "", ...props },
  ref
) {
  return (
    <div
      className="glow-field group relative h-[60px] rounded-full border border-white/10 bg-white/[0.04] transition-all duration-300 focus-within:border-white/25 focus-within:bg-white/[0.07]"
      style={
        {
          "--glow": GLOW,
        } as React.CSSProperties
      }
    >
      {/* light beam (focus-e jole othe) */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-full">
        <div
          className="absolute -left-6 top-1/2 h-[140%] w-[85%] -translate-y-1/2 opacity-0 blur-[14px] transition-opacity duration-500 ease-out group-focus-within:opacity-100"
          style={{
            background: `radial-gradient(ellipse at 28% 50%, rgba(${GLOW},0.75) 0%, rgba(${GLOW},0.35) 40%, transparent 70%)`,
          }}
        />
        <div
          className="absolute inset-x-8 bottom-0 h-px opacity-0 transition-opacity duration-500 group-focus-within:opacity-100"
          style={{
            background: `linear-gradient(90deg, transparent, rgba(${GLOW},0.9), transparent)`,
          }}
        />
      </div>

      {/* outer soft glow */}
      <div
        className="pointer-events-none absolute inset-0 rounded-full opacity-0 transition-opacity duration-500 group-focus-within:opacity-100"
        style={{ boxShadow: `0 0 36px -8px rgba(${GLOW},0.55)` }}
      />

      <input
        id={id}
        ref={ref}
        placeholder=" "
        className={`peer relative z-10 h-full w-full rounded-full bg-transparent px-6 pb-1 pt-5 text-[15px] font-semibold text-white outline-none ${
          rightSlot ? "pr-14" : ""
        } ${alwaysFloat ? "[color-scheme:dark]" : ""} ${className}`}
        style={{ caretColor: `rgb(${GLOW})` }}
        {...props}
      />

      <label
        htmlFor={id}
        className={`pointer-events-none absolute left-6 z-10 top-1/2 -translate-y-1/2 text-[15px] font-medium text-slate-400 transition-all duration-300 ease-out ${
          alwaysFloat ? FLOAT_ALWAYS : `${FLOAT_ON_FOCUS} ${FLOAT_ON_VALUE}`
        }`}
      >
        {label}
      </label>

      {rightSlot ? (
        <div className="absolute right-4 top-1/2 z-20 -translate-y-1/2">{rightSlot}</div>
      ) : null}
    </div>
  )
})

/* pill button (Google / Submit) with arrow circle */
function PillButton({
  children,
  icon,
  className = "",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { icon?: React.ReactNode }) {
  return (
    <button
      {...props}
      className={`group/btn relative flex h-[60px] w-full items-center rounded-full border border-white/10 bg-white/[0.04] px-5 text-[15px] font-semibold text-slate-200 transition-all duration-300 hover:border-white/25 hover:bg-white/[0.09] active:scale-[0.99] disabled:opacity-60 ${className}`}
    >
      {icon ? <span className="mr-3 flex size-6 items-center justify-center">{icon}</span> : null}
      <span className="flex-1 text-left">{children}</span>
      <span className="flex size-9 items-center justify-center rounded-full border border-white/15 bg-white/[0.06] transition-all duration-300 group-hover/btn:translate-x-0.5 group-hover/btn:bg-white/15">
        <ArrowRight className="size-4 text-white" />
      </span>
    </button>
  )
}

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

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        onOpenAutoFocus={(e) => e.preventDefault()}
        onCloseAutoFocus={(e) => e.preventDefault()}
        onPointerDownOutside={(e) => {
          e.preventDefault()
        }}
        className="fixed left-1/2 top-1/2 max-h-[92vh] w-[calc(100vw-2rem)] max-w-[400px] -translate-x-1/2 -translate-y-1/2 gap-0 overflow-hidden rounded-[36px] border border-white/10 bg-black/60 p-0 text-white shadow-[0_30px_80px_-20px_rgba(0,0,0,0.9)] backdrop-blur-2xl [&>button]:hidden"
        style={{
          zIndex: 2147483647,
        }}
      >
        {/* === Background (same image, dark glass overlay) === */}
        <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden rounded-[36px]">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage:
                "url('https://i.postimg.cc/gkRTC0Mg/9934115925457a81b67404e741f62ffc.jpg')",
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-br from-black/60 via-black/80 to-black/90" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.06)_0%,rgba(0,0,0,0.6)_75%)]" />
          {/* glass top highlight */}
          <div className="absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />
        </div>

        {/* === CLOSE BUTTON === */}
        <button
          type="button"
          onClick={() => onOpenChange(false)}
          aria-label="Close"
          style={{ zIndex: 9999 }}
          className="absolute right-4 top-4 flex size-9 items-center justify-center rounded-full border border-white/15 bg-white/[0.06] text-slate-300 backdrop-blur-sm transition-all duration-200 hover:scale-105 hover:bg-white/15 hover:text-white active:scale-95"
        >
          <X className="size-4" strokeWidth={2.5} />
        </button>

        {/* === SHIMMER ORB LOADING OVERLAY === */}
        {isSubmitting && (
          <div
            className="absolute inset-0 flex flex-col items-center justify-center gap-6 bg-black/85 backdrop-blur-sm"
            style={{ zIndex: 9998 }}
          >
            <ShimmerOrbLoader />
            <p className="shimmer-loading-text">
              {mode === "sign-in"
                ? "Signing you in..."
                : "Creating MVBD account..."}
            </p>
          </div>
        )}

        {/* === Scrollable content === */}
        <div
          ref={scrollRef}
          className="auth-scroll relative z-10 max-h-[92vh] overflow-y-auto overscroll-contain px-6 pb-8 pt-10"
        >
          <DialogHeader className="items-center space-y-2 text-center sm:text-center">
            <img
              src="https://i.postimg.cc/V6GHC8yG/17773-removebg-preview.png"
              alt="MoviesVerseBD"
              className="mb-1 size-12 shrink-0 object-contain drop-shadow-[0_0_10px_rgba(255,255,255,0.25)]"
            />
            <DialogTitle className="text-center text-[28px] font-bold leading-tight tracking-tight text-white">
              {mode === "sign-in" ? "Welcome back" : "Create account"}
            </DialogTitle>
            <DialogDescription className="text-center text-sm font-medium leading-relaxed text-slate-400">
              {mode === "sign-in"
                ? "Sign in to your account"
                : "Join MVBD and unlock unlimited movies & shows"}
            </DialogDescription>
          </DialogHeader>

          <form className="mt-8 flex flex-col gap-3.5" onSubmit={handleSubmit}>
            {mode === "sign-up" && (
              <>
                <GlowField
                  id="auth-name"
                  ref={nameRef}
                  label="Full name"
                  autoComplete="name"
                  required
                />
                <GlowField
                  id="auth-dob"
                  ref={dobRef}
                  type="date"
                  label="Date of birth"
                  alwaysFloat
                  required
                />
                <GlowField
                  id="auth-referral"
                  ref={referralRef}
                  label="Referral code (optional)"
                  autoCapitalize="characters"
                />
              </>
            )}

            <GlowField
              id="auth-email"
              ref={emailRef}
              type="email"
              inputMode="email"
              autoComplete="email"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck={false}
              required
              label="Email"
            />

            <GlowField
              id="auth-password"
              ref={passwordRef}
              type={showPassword ? "text" : "password"}
              autoComplete={mode === "sign-in" ? "current-password" : "new-password"}
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck={false}
              required
              minLength={6}
              label="Password"
              rightSlot={
                <button
                  type="button"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  onClick={() => setShowPassword((v) => !v)}
                  className="flex size-8 items-center justify-center rounded-full text-slate-400 transition-colors hover:text-white"
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              }
            />

            {error ? (
              <div
                className="flex items-start gap-2 rounded-2xl border border-red-500/25 bg-red-500/10 px-3 py-2.5 text-xs text-red-300"
                role="alert"
              >
                <span className="mt-0.5 size-1.5 shrink-0 rounded-full bg-red-400" />
                {error}
              </div>
            ) : null}

            <PillButton
              type="submit"
              disabled={isSubmitting}
              className="mt-1 border-white/20 bg-white/[0.10] text-white hover:bg-white/[0.16]"
            >
              {mode === "sign-in" ? "Sign in" : "Create account"}
            </PillButton>

            <div className="relative flex items-center gap-3 py-0.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/15 to-transparent" />
              <span>or</span>
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/15 to-transparent" />
            </div>

            <PillButton
              type="button"
              disabled={isSubmitting}
              onClick={handleGoogleSignIn}
              icon={
                <svg className="size-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
              }
            >
              Continue with Google
            </PillButton>

            <p className="pt-3 text-center text-[13px] font-medium text-slate-400">
              {mode === "sign-in" ? "Don’t have an account?" : "Already have an account?"}{" "}
              <button
                type="button"
                onClick={() => switchMode(mode === "sign-in" ? "sign-up" : "sign-in")}
                className="font-semibold text-white underline-offset-4 transition-colors hover:underline"
              >
                {mode === "sign-in" ? "Sign up" : "Sign in"}
              </button>
            </p>
          </form>
        </div>

        <style jsx>{`
          .auth-scroll {
            -webkit-overflow-scrolling: touch;
            overscroll-behavior: contain;
            scrollbar-width: none;
            touch-action: pan-y;
          }
          .auth-scroll::-webkit-scrollbar {
            display: none;
          }
          .auth-scroll input,
          .auth-scroll select,
          .auth-scroll textarea {
            font-size: 16px !important;
          }

          /* browser autofill-er blue/white background remove */
          .auth-scroll input:-webkit-autofill,
          .auth-scroll input:-webkit-autofill:focus {
            -webkit-text-fill-color: #fff;
            transition: background-color 9999s ease-in-out 0s;
            box-shadow: 0 0 0 1000px transparent inset;
          }

          .shimmer-loading-text {
            font-size: 13px;
            font-weight: 600;
            letter-spacing: 0.15em;
            text-transform: uppercase;
            color: #B7FF00;
            text-shadow: 0 0 15px rgba(183, 255, 0, 0.5);
            animation: shimmerTextBlink 1.6s ease-in-out infinite;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI",
              system-ui, sans-serif;
            text-align: center;
            padding: 0 20px;
          }

          @keyframes shimmerTextBlink {
            0%,
            100% {
              opacity: 0.6;
            }
            50% {
              opacity: 1;
            }
          }
        `}</style>
      </DialogContent>
    </Dialog>
  )
}
