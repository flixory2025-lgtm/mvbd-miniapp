"use client"

import { useState } from "react"
import { Eye, EyeOff, Loader2, Mail, Lock, User, Calendar, Gift, Film, Sparkles, Check } from "lucide-react"

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
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [name, setName] = useState("")
  const [dateOfBirth, setDateOfBirth] = useState("")
  const [referralCode, setReferralCode] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError("")
    setIsSubmitting(true)

    try {
      if (mode === "sign-in") {
        await signIn(email.trim(), password)
      } else {
        await signUp(email.trim(), password, {
          name: name.trim(),
          dateOfBirth,
          referralCode: referralCode.trim().toUpperCase(),
        })
      }
      onOpenChange(false)
      setPassword("")
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

  const switchMode = () => {
    setMode((currentMode) => (currentMode === "sign-in" ? "sign-up" : "sign-in"))
    setError("")
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/* Animated gradient glow behind modal */}
      <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center">
        <div className="absolute h-[500px] w-[500px] animate-pulse rounded-full bg-emerald-500/20 blur-[120px]" />
        <div className="absolute h-[400px] w-[400px] translate-x-32 animate-pulse rounded-full bg-purple-500/20 blur-[120px] [animation-delay:1s]" />
        <div className="absolute h-[350px] w-[350px] -translate-x-32 animate-pulse rounded-full bg-blue-500/20 blur-[120px] [animation-delay:2s]" />
      </div>

      <DialogContent className="overflow-hidden border border-white/10 bg-[#0a0a12]/80 p-0 text-white shadow-[0_0_60px_-15px_rgba(16,185,129,0.3)] backdrop-blur-2xl sm:max-w-[440px] [&>button]:right-5 [&>button]:top-5 [&>button]:z-20 [&>button]:text-slate-400 [&>button]:transition-colors [&>button]:hover:text-white">
        {/* Decorative top gradient bar */}
        <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-emerald-400 to-transparent" />

        {/* Subtle grid pattern overlay */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.5) 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        />

        <div className="relative z-10 p-7">
          <DialogHeader className="space-y-3">
            {/* Logo / Icon */}
            <div className="mb-2 flex items-center gap-3">
              <div className="relative flex size-11 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-[0_0_30px_-5px_rgba(16,185,129,0.6)]">
                <Film className="size-5 text-black" />
                <div className="absolute -right-1 -top-1 flex size-4 items-center justify-center rounded-full bg-purple-500">
                  <Sparkles className="size-2.5 text-white" />
                </div>
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-emerald-400">
                  MoviesVerseBD
                </p>
                <p className="text-[10px] text-slate-500">Premium Streaming</p>
              </div>
            </div>

            <DialogTitle className="text-2xl font-bold tracking-tight">
              {mode === "sign-in" ? (
                <span className="bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
                  Welcome back
                </span>
              ) : (
                <span className="bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
                  Create your account
                </span>
              )}
            </DialogTitle>
            <DialogDescription className="text-sm text-slate-400">
              {mode === "sign-in"
                ? "Sign in to continue your cinematic journey."
                : "Join MVBD and unlock unlimited movies & shows."}
            </DialogDescription>
          </DialogHeader>

          {/* Mode toggle pills */}
          <div className="mt-6 mb-5 flex rounded-xl border border-white/10 bg-white/5 p-1">
            <button
              type="button"
              onClick={() => { setMode("sign-in"); setError("") }}
              className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium transition-all duration-300 ${
                mode === "sign-in"
                  ? "bg-gradient-to-r from-emerald-500 to-emerald-600 text-black shadow-[0_0_20px_-5px_rgba(16,185,129,0.5)]"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => { setMode("sign-up"); setError("") }}
              className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium transition-all duration-300 ${
                mode === "sign-up"
                  ? "bg-gradient-to-r from-emerald-500 to-emerald-600 text-black shadow-[0_0_20px_-5px_rgba(16,185,129,0.5)]"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Sign Up
            </button>
          </div>

          <form className="flex flex-col gap-3.5" onSubmit={handleSubmit}>
            {mode === "sign-up" && (
              <div className="flex flex-col gap-3.5">
                {/* Name */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-slate-400" htmlFor="auth-name">
                    Full name
                  </label>
                  <div className="group relative">
                    <User className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-500 transition-colors group-focus-within:text-emerald-400" />
                    <Input
                      id="auth-name"
                      autoComplete="name"
                      required
                      value={name}
                      onChange={(event) => setName(event.target.value)}
                      placeholder="Enter your full name"
                      className="h-11 border-white/10 bg-white/5 pl-10 text-white placeholder:text-slate-600 transition-all focus-visible:border-emerald-400/50 focus-visible:bg-white/[0.07] focus-visible:ring-2 focus-visible:ring-emerald-400/20"
                    />
                  </div>
                </div>

                <div className="grid gap-3.5 sm:grid-cols-2">
                  {/* DOB */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium text-slate-400" htmlFor="auth-dob">
                      Date of birth
                    </label>
                    <div className="group relative">
                      <Calendar className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-500 transition-colors group-focus-within:text-emerald-400" />
                      <Input
                        id="auth-dob"
                        type="date"
                        required
                        value={dateOfBirth}
                        onChange={(event) => setDateOfBirth(event.target.value)}
                        className="h-11 border-white/10 bg-white/5 pl-10 text-white transition-all [color-scheme:dark] focus-visible:border-emerald-400/50 focus-visible:bg-white/[0.07] focus-visible:ring-2 focus-visible:ring-emerald-400/20"
                      />
                    </div>
                  </div>

                  {/* Referral */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium text-slate-400" htmlFor="auth-referral">
                      Referral <span className="text-slate-600">(optional)</span>
                    </label>
                    <div className="group relative">
                      <Gift className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-500 transition-colors group-focus-within:text-emerald-400" />
                      <Input
                        id="auth-referral"
                        value={referralCode}
                        onChange={(event) => setReferralCode(event.target.value)}
                        placeholder="CODE"
                        className="h-11 border-white/10 bg-white/5 pl-10 text-white placeholder:text-slate-600 transition-all focus-visible:border-emerald-400/50 focus-visible:bg-white/[0.07] focus-visible:ring-2 focus-visible:ring-emerald-400/20"
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
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@example.com"
                  className="h-11 border-white/10 bg-white/5 pl-10 text-white placeholder:text-slate-600 transition-all focus-visible:border-emerald-400/50 focus-visible:bg-white/[0.07] focus-visible:ring-2 focus-visible:ring-emerald-400/20"
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
                  type={showPassword ? "text" : "password"}
                  autoComplete={mode === "sign-in" ? "current-password" : "new-password"}
                  required
                  minLength={6}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="••••••••"
                  className="h-11 border-white/10 bg-white/5 pl-10 pr-10 text-white placeholder:text-slate-600 transition-all focus-visible:border-emerald-400/50 focus-visible:bg-white/[0.07] focus-visible:ring-2 focus-visible:ring-emerald-400/20"
                />
                <button
                  type="button"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  onClick={() => setShowPassword((visible) => !visible)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 transition-colors hover:text-white"
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
              {mode === "sign-up" && (
                <p className="flex items-center gap-1 text-[11px] text-slate-500">
                  <Check className="size-3 text-emerald-400" /> Minimum 6 characters
                </p>
              )}
            </div>

            {/* Error */}
            {error ? (
              <div
                className="flex items-start gap-2 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2.5 text-xs text-red-300"
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
              className="group relative mt-1 h-11 w-full overflow-hidden bg-gradient-to-r from-emerald-400 to-emerald-600 font-semibold text-black shadow-[0_0_30px_-8px_rgba(16,185,129,0.6)] transition-all hover:shadow-[0_0_40px_-5px_rgba(16,185,129,0.8)] disabled:opacity-60"
            >
              <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/30 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
              {isSubmitting ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
              {mode === "sign-in" ? "Sign in" : "Create account"}
            </Button>

            {/* Divider */}
            <div className="relative flex items-center gap-3 py-1 text-[10px] uppercase tracking-widest text-slate-600">
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/15 to-transparent" />
              <span>or continue with</span>
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/15 to-transparent" />
            </div>

            {/* Google */}
            <Button
              type="button"
              variant="outline"
              disabled={isSubmitting}
              onClick={handleGoogleSignIn}
              className="h-11 w-full border-white/10 bg-white/5 font-medium text-white transition-all hover:border-white/20 hover:bg-white/10"
            >
              <svg className="mr-2 size-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Google
            </Button>

            {/* Switch mode */}
            <p className="pt-1 text-center text-xs text-slate-500">
              {mode === "sign-in" ? "New to MVBD?" : "Already have an account?"}{" "}
              <button
                type="button"
                onClick={switchMode}
                className="font-semibold text-emerald-400 transition-colors hover:text-emerald-300"
              >
                {mode === "sign-in" ? "Create one" : "Sign in"}
              </button>
            </p>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  )
}
