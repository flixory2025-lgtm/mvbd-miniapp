"use client"

import { useEffect, useState } from "react"
import { Eye, EyeOff, Loader2, X } from "lucide-react"
import { useAuth } from "@/components/auth-provider"

type AuthModalProps = {
  open: boolean
  onClose: () => void
}

export default function AuthModal({
  open,
  onClose,
}: AuthModalProps) {
  const { signIn, signUp } = useAuth()

  const [mode, setMode] = useState<"signin" | "signup">("signin")
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [dateOfBirth, setDateOfBirth] = useState("")
  const [promoCode, setPromoCode] = useState("")

  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (!open) return

    setError("")
    setLoading(false)
  }, [open])

  if (!open) return null

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    setError("")

    if (!email.trim()) {
      setError("Please enter your email address.")
      return
    }

    if (!password) {
      setError("Please enter your password.")
      return
    }

    if (mode === "signup") {
      if (!name.trim()) {
        setError("Please enter your full name.")
        return
      }

      if (!dateOfBirth) {
        setError("Please select your date of birth.")
        return
      }
    }

    try {
      setLoading(true)

      if (mode === "signin") {
        await signIn(email.trim(), password)
      } else {
        await signUp({
          email: email.trim(),
          password,
          name: name.trim(),
          dateOfBirth,
          promoCode: promoCode.trim() || undefined,
        })
      }

      onClose()

      setName("")
      setEmail("")
      setPassword("")
      setDateOfBirth("")
      setPromoCode("")
    } catch (err) {
      console.error("Authentication error:", err)

      const message =
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again."

      if (message.includes("auth/invalid-credential")) {
        setError("Incorrect email or password.")
      } else if (message.includes("auth/email-already-in-use")) {
        setError("This email is already registered.")
      } else if (message.includes("auth/weak-password")) {
        setError("Password should be at least 6 characters.")
      } else if (message.includes("auth/invalid-email")) {
        setError("Please enter a valid email address.")
      } else {
        setError(message.replace("Firebase: ", ""))
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 p-4 backdrop-blur-xl"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !loading) {
          onClose()
        }
      }}
    >
      <div className="relative w-full max-w-md overflow-hidden rounded-[30px] border border-white/15 bg-white/[0.07] p-6 shadow-2xl backdrop-blur-2xl">
        {/* Glow */}
        <div className="pointer-events-none absolute -right-20 -top-20 h-40 w-40 rounded-full bg-emerald-400/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 -left-20 h-40 w-40 rounded-full bg-cyan-400/10 blur-3xl" />

        {/* Close */}
        <button
          type="button"
          onClick={onClose}
          disabled={loading}
          className="absolute right-4 top-4 rounded-full border border-white/10 bg-white/5 p-2 text-white/60 transition hover:bg-white/10 hover:text-white disabled:opacity-40"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Header */}
        <div className="relative mb-6 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-emerald-400/20 bg-emerald-400/10 shadow-lg shadow-emerald-500/10">
            <span className="text-2xl font-black text-emerald-400">
              M
            </span>
          </div>

          <h2 className="text-2xl font-bold text-white">
            {mode === "signin" ? "Welcome Back" : "Create Account"}
          </h2>

          <p className="mt-1 text-sm text-white/50">
            {mode === "signin"
              ? "Sign in to continue watching"
              : "Create your MoviesVerseBD account"}
          </p>
        </div>

        {/* Mode switch */}
        <div className="relative mb-5 grid grid-cols-2 rounded-2xl border border-white/10 bg-black/20 p-1">
          <button
            type="button"
            onClick={() => {
              setMode("signin")
              setError("")
            }}
            className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
              mode === "signin"
                ? "bg-white/10 text-white shadow"
                : "text-white/40 hover:text-white/70"
            }`}
          >
            Sign In
          </button>

          <button
            type="button"
            onClick={() => {
              setMode("signup")
              setError("")
            }}
            className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
              mode === "signup"
                ? "bg-emerald-500/20 text-emerald-300 shadow"
                : "text-white/40 hover:text-white/70"
            }`}
          >
            Sign Up
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="relative space-y-3.5"
        >
          {mode === "signup" && (
            <>
              <input
                type="text"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Full name"
                disabled={loading}
                autoComplete="name"
                className="h-12 w-full rounded-2xl border border-white/10 bg-white/5 px-4 text-sm text-white outline-none transition placeholder:text-white/30 focus:border-emerald-400/50 focus:bg-white/[0.07]"
              />

              <input
                type="date"
                value={dateOfBirth}
                onChange={(event) => setDateOfBirth(event.target.value)}
                disabled={loading}
                className="h-12 w-full rounded-2xl border border-white/10 bg-white/5 px-4 text-sm text-white outline-none transition focus:border-emerald-400/50 focus:bg-white/[0.07]"
              />
            </>
          )}

          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="Email address"
            disabled={loading}
            autoComplete="email"
            className="h-12 w-full rounded-2xl border border-white/10 bg-white/5 px-4 text-sm text-white outline-none transition placeholder:text-white/30 focus:border-emerald-400/50 focus:bg-white/[0.07]"
          />

          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Password"
              disabled={loading}
              autoComplete={
                mode === "signin"
                  ? "current-password"
                  : "new-password"
              }
              className="h-12 w-full rounded-2xl border border-white/10 bg-white/5 px-4 pr-12 text-sm text-white outline-none transition placeholder:text-white/30 focus:border-emerald-400/50 focus:bg-white/[0.07]"
            />

            <button
              type="button"
              onClick={() => setShowPassword((value) => !value)}
              disabled={loading}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-white/40 hover:text-white"
              aria-label={
                showPassword
                  ? "Hide password"
                  : "Show password"
              }
            >
              {showPassword ? (
                <EyeOff className="h-5 w-5" />
              ) : (
                <Eye className="h-5 w-5" />
              )}
            </button>
          </div>

          {mode === "signup" && (
            <input
              type="text"
              value={promoCode}
              onChange={(event) =>
                setPromoCode(event.target.value.toUpperCase())
              }
              placeholder="Promo / referral code (optional)"
              disabled={loading}
              className="h-12 w-full rounded-2xl border border-white/10 bg-white/5 px-4 text-sm uppercase text-white outline-none transition placeholder:normal-case placeholder:text-white/30 focus:border-emerald-400/50 focus:bg-white/[0.07]"
            />
          )}

          {error && (
            <div className="rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm leading-5 text-red-300">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-emerald-500 px-5 text-sm font-bold text-black shadow-lg shadow-emerald-500/20 transition hover:bg-emerald-400 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                {mode === "signin"
                  ? "Signing in..."
                  : "Creating account..."}
              </>
            ) : mode === "signin" ? (
              "Sign In"
            ) : (
              "Create Account"
            )}
          </button>
        </form>

        <p className="relative mt-5 text-center text-xs leading-5 text-white/30">
          By continuing, you agree to use MoviesVerseBD
          responsibly.
        </p>
      </div>
    </div>
  )
}
