"use client"

import { useState, useRef, useEffect } from "react"
import { Eye, EyeOff, Mail, Lock, User, Calendar, Gift, X } from "lucide-react"
import dynamic from "next/dynamic" // Lottie ডাইনামিক ইমপোর্টের জন্য

import { useAuth } from "@/components/auth-provider"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

// === Lottie Player ডাইনামিক ইমপোর্ট (SSR এড়ানোর জন্য) ===
const LottiePlayer = dynamic(
  () => import("@lottiefiles/react-lottie-player").then((mod) => mod.Player),
  { ssr: false }
)

// === আপনার Lottie অ্যানিমেশনের লিংক ===
const LOTTIE_URL = "https://lottie.host/8a215834-6979-4dbf-8545-f5301fea1d7d/fFW4jEp53d.lottie"

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
        className="fixed left-1/2 top-1/2 max-h-[92vh] w-[calc(100vw-2rem)] max-w-[420px] -translate-x-1/2 -translate-y-1/2 gap-0 overflow-hidden rounded-3xl border border-white/10 bg-[#0b0f14] p-0 text-white shadow-2xl [&>button]:hidden"
        style={{
          zIndex: 2147483647,
        }}
      >
        {/* === Background === */}
        <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden rounded-3xl">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage:
                "url('https://i.postimg.cc/gkRTC0Mg/9934115925457a81b67404e741f62ffc.jpg')",
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-br from-black/70 via-black/85 to-black/98" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(0,0,0,0.3)_0%,rgba(0,0,0,0.98)_75%)]" />
        </div>

        {/* === Close button === */}
        <button
          type="button"
          onClick={() => onOpenChange(false)}
          aria-label="Close"
          style={{ zIndex: 9999 }}
          className="absolute right-3 top-3 flex size-9 items-center justify-center rounded-full border border-white/25 bg-black/70 text-white shadow-lg transition-colors hover:bg-black/90 active:scale-95"
        >
          <X className="size-4" strokeWidth={2.5} />
        </button>

        {/* === LOTTIE OVERLAY — শুধু লোডিং অবস্থায় দেখাবে === */}
        {isSubmitting && (
          <div 
            className="absolute inset-0 z-[9998] flex flex-col items-center justify-center gap-4 bg-black/80 backdrop-blur-sm"
            style={{ zIndex: 9998 }}
          >
            <div className="size-32">
              <LottiePlayer
                autoplay
                loop
                src={LOTTIE_URL}
                style={{ width: "100%", height: "100%" }}
              />
            </div>
            <p className="text-sm font-medium text-emerald-400 animate-pulse">
              {mode === "sign-in" ? "Signing you in..." : "Creating your account..."}
            </p>
          </div>
        )}

        {/* === Scrollable content === */}
        <div
          ref={scrollRef}
          className="auth-scroll relative z-10 max-h-[92vh] overflow-y-auto overscroll-contain px-6 pb-6 pt-6"
        >
          <DialogHeader className="space-y-3 text-left">
            <div className="flex items-center gap-3 pr-12">
              <img
                src="https://i.postimg.cc/V6GHC8yG/17773-removebg-preview.png"
                alt="MoviesVerseBD"
                className="size-12 shrink-0 object-contain drop-shadow-[0_0_10px_rgba(16,185,129,0.45)]"
              />
              <div className="leading-tight">
                <p className="text-[19px] font-extrabold tracking-tight">
                  <span className="text-white">MoviesVerse</span>
                  <span className="bg-gradient-to-r from-emerald-300 to-emerald-500 bg-clip-text text-transparent">
                    BD
                  </span>
                </p>
                <p className="mt-0.5 text-[10px] font-medium uppercase tracking-[0.22em] text-emerald-400/80">
                  Premium Streaming
                </p>
              </div>
            </div>

            <DialogTitle className="!mt-4 text-[24px] font-bold leading-tight tracking-tight text-white">
              {mode === "sign-in" ? "Welcome back" : "Create account"}
            </DialogTitle>
            <DialogDescription className="text-sm leading-relaxed text-slate-400">
              {mode === "sign-in"
                ? "Sign in to continue your cinematic journey."
                : "Join MVBD and unlock unlimited movies & shows."}
            </DialogDescription>
          </DialogHeader>

          {/* === Liquid segmented control === */}
          <div className="relative mt-5 mb-4 grid grid-cols-2 rounded-2xl border border-white/10 bg-white/[0.04] p-1">
            <div
              className={`pointer-events-none absolute top-1 bottom-1 left-1 w-[calc(50%-4px)] rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-[0_4px_20px_-4px_rgba(16,185,129,0.7)] transition-transform duration-[450ms] [transition-timing-function:cubic-bezier(0.22,1.4,0.36,1)] ${
                mode === "sign-up" ? "translate-x-[calc(100%+4px)]" : "translate-x-0"
              }`}
            />
            <button
              type="button"
              onClick={() => switchMode("sign-in")}
              className={`relative z-10 rounded-xl px-4 py-2 text-sm font-semibold transition-all duration-300 ${
                mode === "sign-in"
                  ? "scale-105 text-black"
                  : "scale-100 text-slate-400 hover:text-white"
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => switchMode("sign-up")}
              className={`relative z-10 rounded-xl px-4 py-2 text-sm font-semibold transition-all duration-300 ${
                mode === "sign-up"
                  ? "scale-105 text-black"
                  : "scale-100 text-slate-400 hover:text-white"
              }`}
            >
              Sign Up
            </button>
          </div>

          <form className="flex flex-col gap-3.5" onSubmit={handleSubmit}>
            {mode === "sign-up" && (
              <div className="flex flex-col gap-3.5">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-slate-400" htmlFor="auth-name">
                    Full name
                  </label>
                  <div className="group relative">
                    <User className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-500 transition-colors group-focus-within:text-emerald-400" />
                    <Input
                      id="auth-name"
                      ref={nameRef}
                      autoComplete="name"
                      required
                      placeholder="Enter your full name"
                      className="h-11 rounded-xl border-white/10 bg-white/[0.05] pl-10 text-white placeholder:text-slate-600 transition-colors focus-visible:border-emerald-400/60 focus-visible:bg-white/[0.08] focus-visible:ring-2 focus-visible:ring-emerald-400/25"
                    />
                  </div>
                </div>

                <div className="grid gap-3.5 sm:grid-cols-2">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium text-slate-400" htmlFor="auth-dob">
                      Date of birth
                    </label>
                    <div className="group relative">
                      <Calendar className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-500 transition-colors group-focus-within:text-emerald-400" />
                      <Input
                        id="auth-dob"
                        ref={dobRef}
                        type="date"
                        required
                        className="h-11 rounded-xl border-white/10 bg-white/[0.05] pl-10 text-white transition-colors [color-scheme:dark] focus-visible:border-emerald-400/60 focus-visible:bg-white/[0.08] focus-visible:ring-2 focus-visible:ring-emerald-400/25"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium text-slate-400" htmlFor="auth-referral">
                      Referral <span className="text-slate-600">(opt.)</span>
                    </label>
                    <div className="group relative">
                      <Gift className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-500 transition-colors group-focus-within:text-emerald-400" />
                      <Input
                        id="auth-referral"
                        ref={referralRef}
                        placeholder="CODE"
                        className="h-11 rounded-xl border-white/10 bg-white/[0.05] pl-10 text-white placeholder:text-slate-600 transition-colors focus-visible:border-emerald-400/60 focus-visible:bg-white/[0.08] focus-visible:ring-2 focus-visible:ring-emerald-400/25"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-slate-400" htmlFor="auth-email">
                Email address
              </label>
              <div className="group relative">
                <Mail className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-500 transition-colors group-focus-within:text-emerald-400" />
                <Input
                  id="auth-email"
                  ref={emailRef}
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  autoCorrect="off"
                  autoCapitalize="off"
                  spellCheck={false}
                  required
                  placeholder="you@example.com"
                  className="h-11 rounded-xl border-white/10 bg-white/[0.05] pl-10 text-white placeholder:text-slate-600 transition-colors focus-visible:border-emerald-400/60 focus-visible:bg-white/[0.08] focus-visible:ring-2 focus-visible:ring-emerald-400/25"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-slate-400" htmlFor="auth-password">
                Password
              </label>
              <div className="group relative">
                <Lock className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-500 transition-colors group-focus-within:text-emerald-400" />
                <Input
                  id="auth-password"
                  ref={passwordRef}
                  type={showPassword ? "text" : "password"}
                  autoComplete={mode === "sign-in" ? "current-password" : "new-password"}
                  autoCorrect="off"
                  autoCapitalize="off"
                  spellCheck={false}
                  required
                  minLength={6}
                  placeholder="••••••••"
                  className="h-11 rounded-xl border-white/10 bg-white/[0.05] pl-10 pr-10 text-white placeholder:text-slate-600 transition-colors focus-visible:border-emerald-400/60 focus-visible:bg-white/[0.08] focus-visible:ring-2 focus-visible:ring-emerald-400/25"
                />
                <button
                  type="button"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 transition-colors hover:text-white"
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>

            {error ? (
              <div
                className="flex items-start gap-2 rounded-xl border border-red-500/25 bg-red-500/10 px-3 py-2.5 text-xs text-red-300"
                role="alert"
              >
                <span className="mt-0.5 size-1.5 shrink-0 rounded-full bg-red-400" />
                {error}
              </div>
            ) : null}

            <Button
              type="submit"
              disabled={isSubmitting}
              className="mt-1 h-11 w-full rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 font-semibold text-black shadow-[0_8px_24px_-6px_rgba(16,185,129,0.6)] transition-all duration-200 hover:brightness-110 active:scale-[0.99] disabled:opacity-60"
            >
              {mode === "sign-in" ? "Sign in" : "Create account"}
            </Button>

            <div className="relative flex items-center gap-3 py-1 text-[10px] uppercase tracking-[0.2em] text-slate-600">
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/15 to-transparent" />
              <span>or</span>
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/15 to-transparent" />
            </div>

            <Button
              type="button"
              variant="outline"
              disabled={isSubmitting}
              onClick={handleGoogleSignIn}
              className="h-11 w-full rounded-xl border-white/15 bg-white/[0.06] font-medium text-white transition-colors hover:border-white/25 hover:bg-white/[0.12]"
            >
              <svg className="mr-2 size-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Continue with Google
            </Button>

            <p className="pt-1 text-center text-xs text-slate-500">
              {mode === "sign-in" ? "New to MVBD?" : "Already have an account?"}{" "}
              <button
                type="button"
                onClick={() => switchMode(mode === "sign-in" ? "sign-up" : "sign-in")}
                className="font-semibold text-emerald-400 transition-colors hover:text-emerald-300"
              >
                {mode === "sign-in" ? "Create one" : "Sign in"}
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
          .auth-scroll button,
          .auth-scroll select,
          .auth-scroll textarea {
            font-size: 16px !important;
          }
        `}</style>
      </DialogContent>
    </Dialog>
  )
}
