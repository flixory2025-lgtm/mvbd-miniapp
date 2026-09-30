"use client"

import { useState, useRef, useEffect } from "react"
import { Eye, EyeOff, Loader2, Mail, Lock, User, Calendar, Gift, Check, X } from "lucide-react"

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

  // Refs for uncontrolled inputs — prevents re-render on every keystroke
  // which was causing the mobile keyboard to dismiss.
  const emailRef = useRef<HTMLInputElement>(null)
  const passwordRef = useRef<HTMLInputElement>(null)
  const nameRef = useRef<HTMLInputElement>(null)
  const dobRef = useRef<HTMLInputElement>(null)
  const referralRef = useRef<HTMLInputElement>(null)

  // Reset fields when modal closes
  useEffect(() => {
    if (!open) {
      if (emailRef.current) emailRef.current.value = ""
      if (passwordRef.current) passwordRef.current.value = ""
      if (nameRef.current) nameRef.current.value = ""
      if (dobRef.current) dobRef.current.value = ""
      if (referralRef.current) referralRef.current.value = ""
      setError("")
      setMode("sign-in")
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
        onPointerDownOutside={(e) => e.preventDefault()}
        className="overflow-hidden border-none bg-transparent p-0 text-white shadow-none sm:max-w-[440px] [&>button]:hidden"
      >
        {/* === iOS 27 style liquid glass card === */}
        <div className="auth-liquid-card relative overflow-hidden rounded-[32px] border border-white/15">
          {/* Background image with dark gradient overlay */}
          <div
            className="absolute inset-0 -z-10 bg-cover bg-center"
            style={{
              backgroundImage:
                "url('https://i.postimg.cc/gkRTC0Mg/9934115925457a81b67404e741f62ffc.jpg')",
            }}
          />
          <div className="absolute inset-0 -z-10 bg-gradient-to-br from-black/70 via-black/85 to-black/95" />
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_bottom_right,transparent_0%,rgba(0,0,0,0.4)_40%,rgba(0,0,0,0.95)_100%)]" />

          {/* Liquid glass tint layers */}
          <div className="absolute inset-0 -z-10 bg-white/[0.03] backdrop-blur-2xl" />
          <div className="absolute inset-x-0 top-0 -z-10 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent" />

          {/* Animated liquid orbs */}
          <div className="pointer-events-none absolute -left-20 -top-20 -z-10 size-60 rounded-full bg-emerald-500/25 blur-[80px] auth-orb-1" />
          <div className="pointer-events-none absolute -right-16 top-1/3 -z-10 size-56 rounded-full bg-cyan-400/20 blur-[80px] auth-orb-2" />
          <div className="pointer-events-none absolute -bottom-24 left-1/3 -z-10 size-64 rounded-full bg-emerald-300/15 blur-[90px] auth-orb-3" />

          {/* Close button */}
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            aria-label="Close"
            className="absolute right-4 top-4 z-20 flex size-8 items-center justify-center rounded-full border border-white/15 bg-white/10 text-slate-300 backdrop-blur-xl transition-all hover:scale-105 hover:bg-white/20 hover:text-white active:scale-95"
          >
            <X className="size-4" />
          </button>

          <div className="relative z-10 px-7 pb-7 pt-7">
            <DialogHeader className="space-y-4">
              {/* Logo + Branding */}
              <div className="flex items-center gap-3">
                <div className="relative flex size-14 shrink-0 items-center justify-center">
                  <div className="absolute inset-0 rounded-2xl bg-emerald-400/20 blur-md" />
                  <img
                    src="https://i.postimg.cc/V6GHC8yG/17773-removebg-preview.png"
                    alt="MoviesVerseBD"
                    className="relative size-14 object-contain drop-shadow-[0_0_12px_rgba(16,185,129,0.5)]"
                  />
                </div>
                <div className="leading-none">
                  <p className="font-extrabold tracking-tight text-[20px]">
                    <span className="bg-gradient-to-r from-white via-white to-slate-300 bg-clip-text text-transparent">
                      MoviesVerse
                    </span>
                    <span className="bg-gradient-to-r from-emerald-300 via-emerald-400 to-emerald-500 bg-clip-text text-transparent drop-shadow-[0_0_10px_rgba(16,185,129,0.5)]">
                      BD
                    </span>
                  </p>
                  <p className="mt-1.5 text-[10px] font-medium uppercase tracking-[0.25em] text-emerald-400/80">
                    Premium Streaming
                  </p>
                </div>
              </div>

              <DialogTitle className="!mt-5 text-[26px] font-bold leading-tight tracking-tight">
                <span className="bg-gradient-to-br from-white via-white to-slate-400 bg-clip-text text-transparent">
                  {mode === "sign-in" ? "Welcome back" : "Create account"}
                </span>
              </DialogTitle>
              <DialogDescription className="text-sm leading-relaxed text-slate-400">
                {mode === "sign-in"
                  ? "Sign in to continue your cinematic journey."
                  : "Join MVBD and unlock unlimited movies & shows."}
              </DialogDescription>
            </DialogHeader>

            {/* === Liquid mode switch === */}
            <div className="relative mt-6 mb-5 flex rounded-2xl border border-white/10 bg-white/[0.04] p-1 backdrop-blur-xl">
              {/* sliding pill */}
              <div
                className={`absolute top-1 bottom-1 w-[calc(50%-4px)] rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-[0_0_25px_-5px_rgba(16,185,129,0.7)] transition-all duration-[450ms] [transition-timing-function:cubic-bezier(0.22,1,0.36,1)] ${
                  mode === "sign-in" ? "left-1" : "left-[calc(50%+2px)]"
                }`}
              />
              <button
                type="button"
                onClick={() => switchMode("sign-in")}
                className={`relative z-10 flex-1 rounded-xl px-4 py-2 text-sm font-semibold transition-colors duration-300 ${
                  mode === "sign-in" ? "text-black" : "text-slate-400 hover:text-white"
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => switchMode("sign-up")}
                className={`relative z-10 flex-1 rounded-xl px-4 py-2 text-sm font-semibold transition-colors duration-300 ${
                  mode === "sign-up" ? "text-black" : "text-slate-400 hover:text-white"
                }`}
              >
                Sign Up
              </button>
            </div>

            <form className="flex flex-col gap-3.5" onSubmit={handleSubmit}>
              {/* === Sign-up extra fields with smooth reveal === */}
              <div
                className={`grid transition-all duration-500 [transition-timing-function:cubic-bezier(0.22,1,0.36,1)] ${
                  mode === "sign-up"
                    ? "grid-rows-[1fr] opacity-100"
                    : "grid-rows-[0fr] opacity-0"
                }`}
              >
                <div className="overflow-hidden">
                  <div className="flex flex-col gap-3.5 pb-3.5">
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
                          required={mode === "sign-up"}
                          placeholder="Enter your full name"
                          className="h-11 rounded-xl border-white/10 bg-white/[0.05] pl-10 text-white placeholder:text-slate-600 backdrop-blur-xl transition-all focus-visible:border-emerald-400/60 focus-visible:bg-white/[0.08] focus-visible:ring-2 focus-visible:ring-emerald-400/25"
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
                            required={mode === "sign-up"}
                            className="h-11 rounded-xl border-white/10 bg-white/[0.05] pl-10 text-white backdrop-blur-xl transition-all [color-scheme:dark] focus-visible:border-emerald-400/60 focus-visible:bg-white/[0.08] focus-visible:ring-2 focus-visible:ring-emerald-400/25"
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
                            className="h-11 rounded-xl border-white/10 bg-white/[0.05] pl-10 text-white placeholder:text-slate-600 backdrop-blur-xl transition-all focus-visible:border-emerald-400/60 focus-visible:bg-white/[0.08] focus-visible:ring-2 focus-visible:ring-emerald-400/25"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* === Email === */}
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
                    className="h-11 rounded-xl border-white/10 bg-white/[0.05] pl-10 text-white placeholder:text-slate-600 backdrop-blur-xl transition-all focus-visible:border-emerald-400/60 focus-visible:bg-white/[0.08] focus-visible:ring-2 focus-visible:ring-emerald-400/25"
                  />
                </div>
              </div>

              {/* === Password === */}
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
                    className="h-11 rounded-xl border-white/10 bg-white/[0.05] pl-10 pr-10 text-white placeholder:text-slate-600 backdrop-blur-xl transition-all focus-visible:border-emerald-400/60 focus-visible:bg-white/[0.08] focus-visible:ring-2 focus-visible:ring-emerald-400/25"
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
                <div
                  className={`flex items-center gap-1 overflow-hidden text-[11px] text-slate-500 transition-all duration-300 ${
                    mode === "sign-up" ? "max-h-6 opacity-100" : "max-h-0 opacity-0"
                  }`}
                >
                  <Check className="size-3 text-emerald-400" /> Minimum 6 characters
                </div>
              </div>

              {/* === Error === */}
              {error ? (
                <div
                  className="flex items-start gap-2 rounded-xl border border-red-500/25 bg-red-500/10 px-3 py-2.5 text-xs text-red-300 backdrop-blur-xl auth-shake"
                  role="alert"
                >
                  <span className="mt-0.5 size-1.5 shrink-0 rounded-full bg-red-400 shadow-[0_0_8px_rgba(248,113,113,0.8)]" />
                  {error}
                </div>
              ) : null}

              {/* === Submit === */}
              <Button
                type="submit"
                disabled={isSubmitting}
                className="group relative mt-1 h-11 w-full overflow-hidden rounded-xl bg-gradient-to-br from-emerald-400 via-emerald-500 to-emerald-600 font-semibold text-black shadow-[0_8px_30px_-6px_rgba(16,185,129,0.7)] transition-all duration-300 hover:scale-[1.015] hover:shadow-[0_10px_40px_-5px_rgba(16,185,129,0.9)] active:scale-[0.985] disabled:opacity-60"
              >
                <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/40 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
                <span className="relative z-10 flex items-center justify-center gap-2">
                  {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : null}
                  {mode === "sign-in" ? "Sign in" : "Create account"}
                </span>
              </Button>

              {/* === Divider === */}
              <div className="relative flex items-center gap-3 py-1 text-[10px] uppercase tracking-[0.2em] text-slate-600">
                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/15 to-transparent" />
                <span>or</span>
                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/15 to-transparent" />
              </div>

              {/* === Google === */}
              <Button
                type="button"
                variant="outline"
                disabled={isSubmitting}
                onClick={handleGoogleSignIn}
                className="h-11 w-full rounded-xl border-white/15 bg-white/[0.06] font-medium text-white backdrop-blur-xl transition-all duration-300 hover:scale-[1.015] hover:border-white/25 hover:bg-white/[0.12] active:scale-[0.985]"
              >
                <svg className="mr-2 size-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                Continue with Google
              </Button>

              {/* === Switch mode === */}
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
        </div>

        {/* === Local styles for liquid animations === */}
        <style jsx>{`
          @keyframes liquidOrb1 {
            0%, 100% { transform: translate(0, 0) scale(1); }
            33% { transform: translate(30px, 20px) scale(1.15); }
            66% { transform: translate(-15px, 35px) scale(0.95); }
          }
          @keyframes liquidOrb2 {
            0%, 100% { transform: translate(0, 0) scale(1); }
            50% { transform: translate(-25px, -20px) scale(1.2); }
          }
          @keyframes liquidOrb3 {
            0%, 100% { transform: translate(0, 0) scale(1); }
            50% { transform: translate(20px, -25px) scale(1.1); }
          }
          @keyframes shake {
            0%, 100% { transform: translateX(0); }
            25% { transform: translateX(-4px); }
            75% { transform: translateX(4px); }
          }
          @keyframes cardIn {
            0% { opacity: 0; transform: scale(0.92) translateY(20px); backdrop-filter: blur(0px); }
            100% { opacity: 1; transform: scale(1) translateY(0); backdrop-filter: blur(40px); }
          }
          @keyframes cardOut {
            0% { opacity: 1; transform: scale(1); }
            100% { opacity: 0; transform: scale(0.95); }
          }
          .auth-orb-1 { animation: liquidOrb1 9s ease-in-out infinite; }
          .auth-orb-2 { animation: liquidOrb2 11s ease-in-out infinite; }
          .auth-orb-3 { animation: liquidOrb3 13s ease-in-out infinite; }
          .auth-shake { animation: shake 0.3s ease-in-out; }
          .auth-liquid-card {
            animation: cardIn 0.55s cubic-bezier(0.22, 1, 0.36, 1);
            backdrop-filter: blur(40px) saturate(180%);
            -webkit-backdrop-filter: blur(40px) saturate(180%);
            box-shadow:
              0 0 0 1px rgba(255, 255, 255, 0.06) inset,
              0 30px 80px -20px rgba(0, 0, 0, 0.85),
              0 0 60px -10px rgba(16, 185, 129, 0.25);
          }
        `}</style>
      </DialogContent>
    </Dialog>
  )
}
