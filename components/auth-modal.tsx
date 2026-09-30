"use client"

import { useState, useRef, useEffect } from "react"
import { Eye, EyeOff, Loader2, Mail, Lock, User, Calendar, Gift, X } from "lucide-react"

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

  // Uncontrolled inputs — prevents re-render on every keystroke,
  // which was dismissing the mobile keyboard.
  const emailRef = useRef<HTMLInputElement>(null)
  const passwordRef = useRef<HTMLInputElement>(null)
  const nameRef = useRef<HTMLInputElement>(null)
  const dobRef = useRef<HTMLInputElement>(null)
  const referralRef = useRef<HTMLInputElement>(null)

  // Reset everything when the modal closes
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
        className="max-h-[92vh] w-[calc(100vw-2rem)] max-w-[420px] gap-0 overflow-hidden rounded-3xl border border-white/10 bg-[#0b0f14] p-0 text-white shadow-2xl [&>button]:hidden"
      >
        {/* === Background image + dark overlay (fixed, non-scrolling) === */}
        <div className="pointer-events-none absolute inset-0 -z-10 rounded-3xl overflow-hidden">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage:
                "url('https://i.postimg.cc/gkRTC0Mg/9934115925457a81b67404e741f62ffc.jpg')",
            }}
          />
          {/* Top-left lighter → bottom-right very dark */}
          <div className="absolute inset-0 bg-gradient-to-br from-black/60 via-black/80 to-black/95" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(0,0,0,0.2)_0%,rgba(0,0,0,0.95)_75%)]" />
          {/* Subtle glass tint */}
          <div className="absolute inset-0 bg-white/[0.02] backdrop-blur-xl" />
        </div>

        {/* Close button */}
        <button
          type="button"
          onClick={() => onOpenChange(false)}
          aria-label="Close"
          className="absolute right-3 top-3 z-30 flex size-8 items-center justify-center rounded-full border border-white/15 bg-white/10 text-slate-300 backdrop-blur-md transition-colors hover:bg-white/20 hover:text-white"
        >
          <X className="size-4" />
        </button>

        {/* === Scrollable body === */}
        <div className="auth-scroll relative z-10 max-h-[92vh] overflow-y-auto overscroll-contain px-6 pb-6 pt-6">
          <DialogHeader className="space-y-3 text-left">
            {/* Branding */}
            <div className="flex items-center gap-3">
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

          {/* === Mode toggle (simple, reliable) === */}
          <div className="relative mt-5 mb-4 grid grid-cols-2 gap-1 rounded-2xl border border-white/10 bg-white/[0.04] p-1">
            <button
              type="button"
              onClick={() => switchMode("sign-in")}
              className={`rounded-xl px-4 py-2 text-sm font-semibold transition-all duration-200 ${
                mode === "sign-in"
                  ? "bg-gradient-to-br from-emerald-400 to-emerald-600 text-black shadow-[0_0_18px_-4px_rgba(16,185,129,0.7)]"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => switchMode("sign-up")}
              className={`rounded-xl px-4 py-2 text-sm font-semibold transition-all duration-200 ${
                mode === "sign-up"
                  ? "bg-gradient-to-br from-emerald-400 to-emerald-600 text-black shadow-[0_0_18px_-4px_rgba(16,185,129,0.7)]"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Sign Up
            </button>
          </div>

          <form className="flex flex-col gap-3.5" onSubmit={handleSubmit}>
            {/* Sign-up extra fields */}
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

            {/* Email */}
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
                  autoComplete="email"
                  required
                  placeholder="you@example.com"
                  className="h-11 rounded-xl border-white/10 bg-white/[0.05] pl-10 text-white placeholder:text-slate-600 transition-colors focus-visible:border-emerald-400/60 focus-visible:bg-white/[0.08] focus-visible:ring-2 focus-visible:ring-emerald-400/25"
                />
              </div>
            </div>

            {/* Password */}
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

            {/* Error */}
            {error ? (
              <div
                className="flex items-start gap-2 rounded-xl border border-red-500/25 bg-red-500/10 px-3 py-2.5 text-xs text-red-300"
                role="alert"
              >
                <span className="mt-0.5 size-1.5 shrink-0 rounded-full bg-red-400" />
                {error}
              </div>
            ) : null}

            {/* Submit */}
            <Button
              type="submit"
              disabled={isSubmitting}
              className="mt-1 h-11 w-full rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 font-semibold text-black shadow-[0_8px_24px_-6px_rgba(16,185,129,0.6)] transition-all duration-200 hover:brightness-110 active:scale-[0.99] disabled:opacity-60"
            >
              {isSubmitting ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
              {mode === "sign-in" ? "Sign in" : "Create account"}
            </Button>

            {/* Divider */}
            <div className="relative flex items-center gap-3 py-1 text-[10px] uppercase tracking-[0.2em] text-slate-600">
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/15 to-transparent" />
              <span>or</span>
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/15 to-transparent" />
            </div>

            {/* Google */}
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

            {/* Switch mode */}
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
            scrollbar-width: thin;
            scrollbar-color: rgba(16, 185, 129, 0.4) transparent;
          }
          .auth-scroll::-webkit-scrollbar {
            width: 6px;
          }
          .auth-scroll::-webkit-scrollbar-track {
            background: transparent;
          }
          .auth-scroll::-webkit-scrollbar-thumb {
            background: rgba(16, 185, 129, 0.35);
            border-radius: 999px;
          }
          .auth-scroll::-webkit-scrollbar-thumb:hover {
            background: rgba(16, 185, 129, 0.6);
          }
          @media (max-width: 640px) {
            .auth-scroll::-webkit-scrollbar {
              display: none;
            }
            .auth-scroll {
              scrollbar-width: none;
            }
          }
        `}</style>
      </DialogContent>
    </Dialog>
  )
                }
