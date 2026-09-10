"use client"

import { useState } from "react"
import { Eye, EyeOff, Loader2 } from "lucide-react"

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
      <DialogContent className="border-white/10 bg-[#0b0b14] text-white sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{mode === "sign-in" ? "Welcome back" : "Create your MVBD account"}</DialogTitle>
          <DialogDescription className="text-slate-400">
            {mode === "sign-in" ? "Sign in to continue to MoviesVerseBD." : "Create an account with email or Google."}
          </DialogDescription>
        </DialogHeader>

        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          {mode === "sign-up" && (
            <>
              <div className="flex flex-col gap-2">
                <label className="text-sm text-slate-300" htmlFor="auth-name">
                  Full name
                </label>
                <Input
                  id="auth-name"
                  autoComplete="name"
                  required
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  className="border-white/10 bg-white/5 text-white"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm text-slate-300" htmlFor="auth-dob">
                  Date of birth
                </label>
                <Input
                  id="auth-dob"
                  type="date"
                  required
                  value={dateOfBirth}
                  onChange={(event) => setDateOfBirth(event.target.value)}
                  className="border-white/10 bg-white/5 text-white"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm text-white/70" htmlFor="auth-referral">
                  Referral / Promo Code
                  <span className="ml-1 text-white/40">(Optional)</span>
                </label>
                <input
                  id="auth-referral"
                  type="text"
                  value={referralCode}
                  onChange={(event) =>
                    setReferralCode(event.target.value.toUpperCase())
                  }
                  placeholder="MVBD-XXXXXXXX"
                  autoCapitalize="characters"
                  spellCheck={false}
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none placeholder:text-white/30"
                />
              </div>
            </>
          )}

          <div className="flex flex-col gap-2">
            <label className="text-sm text-slate-300" htmlFor="auth-email">
              Email
            </label>
            <Input
              id="auth-email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="border-white/10 bg-white/5 text-white"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm text-slate-300" htmlFor="auth-password">
              Password
            </label>
            <div className="relative">
              <Input
                id="auth-password"
                type={showPassword ? "text" : "password"}
                autoComplete={mode === "sign-in" ? "current-password" : "new-password"}
                required
                minLength={6}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="border-white/10 bg-white/5 pr-10 text-white"
              />
              <button
                type="button"
                aria-label={showPassword ? "Hide password" : "Show password"}
                onClick={() => setShowPassword((visible) => !visible)}
                className="absolute top-1/2 right-3 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
          </div>

          {error ? (
            <p className="text-sm text-red-300" role="alert">
              {error}
            </p>
          ) : null}

          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-emerald-500 text-black hover:bg-emerald-400"
          >
            {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : null}
            {mode === "sign-in" ? "Sign in" : "Sign up"}
          </Button>

          <div className="relative flex items-center gap-3 text-xs text-slate-500">
            <div className="h-px flex-1 bg-white/10" />
            <span>or</span>
            <div className="h-px flex-1 bg-white/10" />
          </div>

          <Button
            type="button"
            variant="outline"
            disabled={isSubmitting}
            onClick={handleGoogleSignIn}
            className="w-full border-white/10 bg-white/5 text-white hover:bg-white/10 hover:text-white"
          >
            Continue with Google
          </Button>

          <p className="text-center text-sm text-slate-400">
            {mode === "sign-in" ? "New to MVBD?" : "Already have an account?"}{" "}
            <button
              type="button"
              onClick={switchMode}
              className="text-emerald-400 hover:text-emerald-300"
            >
              {mode === "sign-in" ? "Create one" : "Sign in"}
            </button>
          </p>
        </form>
      </DialogContent>
    </Dialog>
  )
}
