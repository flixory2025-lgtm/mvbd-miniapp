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
 * MVBD logo-r "BD" er green: "20,205,25"
 * লাল: "255,40,40"  |  emerald: "16,185,129"
 * =========================================
 */
const GLOW = "20,205,25"

/*
 * =========================================
 * IMAGES
 * POSTER = sign in / sign up panel-er poster
 * LOGO   = site logo
 * =========================================
 */
const POSTER =
  "https://i.postimg.cc/7hLqB21s/Netflix-all-movies-and-series-featured-image.jpg"
const LOGO = "https://i.postimg.cc/V6GHC8yG/17773-removebg-preview.png"

/* animation delay helper (--i = going out, --li = coming in) */
const d = (i: number, li: number) =>
  ({ "--i": i, "--li": li }) as React.CSSProperties

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

/* Google icon (same as before) */
const GoogleIcon = (
  <svg className="size-5" viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
  </svg>
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
  // poster panel sweep animation (first open e animation cholbe na, sudhu switch korle)
  const [played, setPlayed] = useState(false)
  const [logoFailed, setLogoFailed] = useState(false)

  // Sign-in pane inputs
  const emailRef = useRef<HTMLInputElement>(null)
  const passwordRef = useRef<HTMLInputElement>(null)
  // Sign-up pane inputs (email/password alada pane-e tai alada ref)
  const emailUpRef = useRef<HTMLInputElement>(null)
  const passwordUpRef = useRef<HTMLInputElement>(null)
  const nameRef = useRef<HTMLInputElement>(null)
  const dobRef = useRef<HTMLInputElement>(null)
  const referralRef = useRef<HTMLInputElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const signInPaneRef = useRef<HTMLDivElement>(null)
  const signUpPaneRef = useRef<HTMLDivElement>(null)

  // Reset on close
  useEffect(() => {
    if (!open) {
      if (emailRef.current) emailRef.current.value = ""
      if (passwordRef.current) passwordRef.current.value = ""
      if (emailUpRef.current) emailUpRef.current.value = ""
      if (passwordUpRef.current) passwordUpRef.current.value = ""
      if (nameRef.current) nameRef.current.value = ""
      if (dobRef.current) dobRef.current.value = ""
      if (referralRef.current) referralRef.current.value = ""
      setError("")
      setPlayed(false)
      setMode("sign-in")
      setShowPassword(false)
    }
  }, [open])

  // Hidden pane-er input e Tab / click jeno na jay
  useEffect(() => {
    const up = mode === "sign-up"
    const inPane = signInPaneRef.current as (HTMLDivElement & { inert?: boolean }) | null
    const upPane = signUpPaneRef.current as (HTMLDivElement & { inert?: boolean }) | null
    if (inPane) inPane.inert = up
    if (upPane) upPane.inert = !up
    if (inPane) inPane.scrollTop = 0
    if (upPane) upPane.scrollTop = 0
  }, [mode, open])

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

    const emailInput = mode === "sign-in" ? emailRef : emailUpRef
    const passwordInput = mode === "sign-in" ? passwordRef : passwordUpRef
    const email = emailInput.current?.value.trim() ?? ""
    const password = passwordInput.current?.value ?? ""

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
    // email / password jeno mode badlale hariye na jay
    const from = mode === "sign-in" ? [emailRef, passwordRef] : [emailUpRef, passwordUpRef]
    const to = next === "sign-in" ? [emailRef, passwordRef] : [emailUpRef, passwordUpRef]
    if (to[0].current && from[0].current) to[0].current.value = from[0].current.value
    if (to[1].current && from[1].current) to[1].current.value = from[1].current.value
    setPlayed(true)
    setMode(next)
    setError("")
  }

  const passwordToggle = (
    <button
      type="button"
      aria-label={showPassword ? "Hide password" : "Show password"}
      onClick={() => setShowPassword((v) => !v)}
      className="flex size-8 items-center justify-center rounded-full text-slate-400 transition-colors hover:text-white"
    >
      {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
    </button>
  )

  const errorBox = (
    <div
      className="av-anim flex items-start gap-2 rounded-2xl border border-red-500/25 bg-red-500/10 px-3 py-2.5 text-xs text-red-300"
      style={d(4, 16)}
      role="alert"
    >
      <span className="mt-0.5 size-1.5 shrink-0 rounded-full bg-red-400" />
      {error}
    </div>
  )

  const lockup = (
    <div className="av-lockup">
      {!logoFailed ? (
        <img src={LOGO} alt="MoviesVerseBD" onError={() => setLogoFailed(true)} />
      ) : (
        <div className="av-mark">MV</div>
      )}
      <span>
        Movies<b>Verse</b>BD
      </span>
    </div>
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        onOpenAutoFocus={(e) => e.preventDefault()}
        onCloseAutoFocus={(e) => e.preventDefault()}
        onPointerDownOutside={(e) => {
          e.preventDefault()
        }}
        className="fixed left-1/2 top-1/2 h-[min(640px,calc(100dvh-20px))] max-h-none w-[calc(100vw-1.25rem)] max-w-[430px] -translate-x-1/2 -translate-y-1/2 gap-0 overflow-hidden rounded-[30px] border border-white/10 bg-[#07100c] p-0 text-white shadow-[0_30px_80px_-20px_rgba(0,0,0,0.9)] sm:max-w-[430px] min-[721px]:max-w-[960px] [&>button]:hidden data-[state=open]:animate-[authModalIn_0.5s_cubic-bezier(0.22,1.2,0.36,1)_both] data-[state=closed]:animate-[authModalOut_0.3s_cubic-bezier(0.4,0,1,1)_both]"
        style={{
          zIndex: 2147483647,
        }}
      >
        {/* accessibility (screen reader only) */}
        <DialogHeader className="sr-only">
          <DialogTitle>{mode === "sign-in" ? "Welcome back" : "Create account"}</DialogTitle>
          <DialogDescription>
            {mode === "sign-in"
              ? "Sign in to your account"
              : "Join MVBD and unlock unlimited movies & shows"}
          </DialogDescription>
        </DialogHeader>

        {/* === CLOSE BUTTON === */}
        <div className="absolute right-4 top-4" style={{ zIndex: 9999 }}>
        <button
          type="button"
          onClick={() => onOpenChange(false)}
          aria-label="Close"
          className="auth-close-btn group/close flex size-10 items-center justify-center rounded-full border border-white/25 bg-black/60 text-white shadow-lg backdrop-blur-md transition-all duration-300 hover:scale-110 hover:border-white/50 hover:bg-white/15 active:scale-90"
        >
          <X
            className="size-[18px] transition-transform duration-500 ease-[cubic-bezier(0.22,1.4,0.36,1)] group-hover/close:rotate-180"
            strokeWidth={2.5}
          />
        </button>
        </div>

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

        {/* === Sign in <-> Sign up animated layout === */}
        <div
          ref={scrollRef}
          className={`av-root ${mode === "sign-up" ? "av-up" : ""} ${played ? "av-play" : ""}`}
          style={{ "--glow": GLOW, "--poster": `url('${POSTER}')` } as React.CSSProperties}
        >
          {/* poster panel (animation-er sathe ghore) */}
          <div className="av-art-wrap">
            <div className="av-art">
              <div className="av-art-img" />
              <div className="av-art-shade" />
            </div>
          </div>

          {/* text on poster : sign-in */}
          <section className="av-pane av-info av-info-login" aria-hidden="true">
            <div className="av-anim" style={d(0, 14)}>{lockup}</div>
            <h2 className="av-anim" style={d(1, 15)}>Welcome back</h2>
            <p className="av-anim" style={d(2, 16)}>
              Your movies and shows are waiting. Sign in and pick up right where you left off.
            </p>
          </section>

          {/* text on poster : sign-up */}
          <section className="av-pane av-info av-info-register" aria-hidden="true">
            <div className="av-anim" style={d(17, 0)}>{lockup}</div>
            <h2 className="av-anim" style={d(18, 1)}>Join MVBD</h2>
            <p className="av-anim" style={d(19, 2)}>
              Create your free account and unlock unlimited movies &amp; shows.
            </p>
          </section>

          {/* ================= SIGN IN FORM ================= */}
          <div ref={signInPaneRef} className="av-pane av-form av-form-login auth-scroll">
            <form className="av-form-inner" onSubmit={handleSubmit}>
              <h2 className="av-title av-anim" style={d(0, 14)}>Welcome back</h2>
              <p className="av-sub av-anim" style={d(1, 15)}>Sign in to your account</p>

              <div className="flex flex-col gap-3.5">
                <div className="av-anim" style={d(2, 16)}>
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
                </div>

                <div className="av-anim" style={d(3, 17)}>
                  <GlowField
                    id="auth-password"
                    ref={passwordRef}
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    autoCorrect="off"
                    autoCapitalize="off"
                    spellCheck={false}
                    required
                    minLength={6}
                    label="Password"
                    rightSlot={passwordToggle}
                  />
                </div>

                {error && mode === "sign-in" ? errorBox : null}

                <div className="av-anim" style={d(4, 18)}>
                  <PillButton
                    type="submit"
                    disabled={isSubmitting}
                    className="av-primary mt-1"
                  >
                    Sign in
                  </PillButton>
                </div>

                <div
                  className="av-anim relative flex items-center gap-3 py-0.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500"
                  style={d(5, 19)}
                >
                  <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/15 to-transparent" />
                  <span>or</span>
                  <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/15 to-transparent" />
                </div>

                <div className="av-anim" style={d(5, 19)}>
                  <PillButton
                    type="button"
                    disabled={isSubmitting}
                    onClick={handleGoogleSignIn}
                    icon={GoogleIcon}
                  >
                    Continue with Google
                  </PillButton>
                </div>

                <p
                  className="av-anim pt-3 text-center text-[13px] font-medium text-slate-400"
                  style={d(6, 20)}
                >
                  Don’t have an account?{" "}
                  <button
                    type="button"
                    onClick={() => switchMode("sign-up")}
                    className="font-semibold text-white underline-offset-4 transition-colors hover:underline"
                  >
                    Sign up
                  </button>
                </p>
              </div>
            </form>
          </div>

          {/* ================= SIGN UP FORM ================= */}
          <div ref={signUpPaneRef} className="av-pane av-form av-form-register auth-scroll">
            <form className="av-form-inner" onSubmit={handleSubmit}>
              <h2 className="av-title av-anim" style={d(17, 0)}>Create account</h2>
              <p className="av-sub av-anim" style={d(18, 1)}>
                Join MVBD and unlock unlimited movies &amp; shows
              </p>

              <div className="flex flex-col gap-3.5">
                <div className="av-anim" style={d(19, 2)}>
                  <GlowField
                    id="auth-name"
                    ref={nameRef}
                    label="Full name"
                    autoComplete="name"
                    required
                  />
                </div>
                <div className="av-anim" style={d(20, 3)}>
                  <GlowField
                    id="auth-dob"
                    ref={dobRef}
                    type="date"
                    label="Date of birth"
                    alwaysFloat
                    required
                  />
                </div>
                <div className="av-anim" style={d(21, 4)}>
                  <GlowField
                    id="auth-referral"
                    ref={referralRef}
                    label="Referral code (optional)"
                    autoCapitalize="characters"
                  />
                </div>

                <div className="av-anim" style={d(22, 5)}>
                  <GlowField
                    id="auth-email-up"
                    ref={emailUpRef}
                    type="email"
                    inputMode="email"
                    autoComplete="email"
                    autoCorrect="off"
                    autoCapitalize="off"
                    spellCheck={false}
                    required
                    label="Email"
                  />
                </div>

                <div className="av-anim" style={d(23, 6)}>
                  <GlowField
                    id="auth-password-up"
                    ref={passwordUpRef}
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    autoCorrect="off"
                    autoCapitalize="off"
                    spellCheck={false}
                    required
                    minLength={6}
                    label="Password"
                    rightSlot={passwordToggle}
                  />
                </div>

                {error && mode === "sign-up" ? errorBox : null}

                <div className="av-anim" style={d(24, 7)}>
                  <PillButton
                    type="submit"
                    disabled={isSubmitting}
                    className="av-primary mt-1"
                  >
                    Create account
                  </PillButton>
                </div>

                <div
                  className="av-anim relative flex items-center gap-3 py-0.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500"
                  style={d(25, 8)}
                >
                  <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/15 to-transparent" />
                  <span>or</span>
                  <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/15 to-transparent" />
                </div>

                <div className="av-anim" style={d(25, 8)}>
                  <PillButton
                    type="button"
                    disabled={isSubmitting}
                    onClick={handleGoogleSignIn}
                    icon={GoogleIcon}
                  >
                    Continue with Google
                  </PillButton>
                </div>

                <p
                  className="av-anim pt-3 text-center text-[13px] font-medium text-slate-400"
                  style={d(26, 9)}
                >
                  Already have an account?{" "}
                  <button
                    type="button"
                    onClick={() => switchMode("sign-in")}
                    className="font-semibold text-white underline-offset-4 transition-colors hover:underline"
                  >
                    Sign in
                  </button>
                </p>
              </div>
            </form>
          </div>
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

        {/* open / close animation keyframes + poster panel animation */}
        <style jsx global>{`
          @keyframes authModalIn {
            0% {
              opacity: 0;
              transform: translate(-50%, -44%) scale(0.9);
              filter: blur(6px);
            }
            100% {
              opacity: 1;
              transform: translate(-50%, -50%) scale(1);
              filter: blur(0);
            }
          }
          @keyframes authModalOut {
            0% {
              opacity: 1;
              transform: translate(-50%, -50%) scale(1);
              filter: blur(0);
            }
            100% {
              opacity: 0;
              transform: translate(-50%, -46%) scale(0.92);
              filter: blur(6px);
            }
          }
          @keyframes authCloseIn {
            0% {
              opacity: 0;
              transform: rotate(-90deg) scale(0.4);
            }
            100% {
              opacity: 1;
              transform: rotate(0) scale(1);
            }
          }
          .auth-close-btn {
            animation: authCloseIn 0.55s cubic-bezier(0.22, 1.4, 0.36, 1) 0.2s both;
          }

          /* ===================================================
             SIGN IN <-> SIGN UP  (poster panel + slide/blur)
             =================================================== */
          .av-root {
            position: absolute;
            inset: 0;
            overflow: hidden;
          }

          /* ---- poster panel ---- */
          .av-root .av-art-wrap {
            position: absolute;
            inset: 0;
            z-index: 0;
            pointer-events: none;
            filter: drop-shadow(0 0 7px rgba(var(--glow), 0.75));
          }
          .av-root .av-art {
            position: absolute;
            inset: 0;
            overflow: hidden;
            background: linear-gradient(45deg, #06120c, rgb(var(--glow)));
            clip-path: polygon(46% 0, 100% 0, 100% 100%, 70% 100%);
          }
          .av-root .av-art-img {
            position: absolute;
            inset: -4%;
            background: var(--poster) center / cover no-repeat;
            animation: avKenburns 22s ease-in-out infinite alternate;
          }
          .av-root .av-art-shade {
            position: absolute;
            inset: 0;
            background:
              linear-gradient(180deg, rgba(0, 0, 0, 0.35) 0%, rgba(0, 0, 0, 0) 30%, rgba(0, 0, 0, 0.25) 55%, rgba(0, 0, 0, 0.82) 100%),
              linear-gradient(135deg, rgba(var(--glow), 0.18), transparent 55%);
          }
          @keyframes avKenburns {
            from { transform: scale(1); }
            to { transform: scale(1.09) translate(-1.2%, 0.8%); }
          }
          .av-root.av-up .av-art {
            clip-path: polygon(0 0, 54% 0, 30% 100%, 0 100%);
          }
          .av-root.av-play:not(.av-up) .av-art {
            animation: avSweepOut 1.5s ease both;
          }
          .av-root.av-play.av-up .av-art {
            animation: avSweepIn 1.5s ease both;
          }
          @keyframes avSweepIn {
            0% { clip-path: polygon(46% 0, 100% 0, 100% 100%, 70% 100%); }
            45% { clip-path: polygon(0 0, 100% 0, 100% 100%, 0 100%); }
            100% { clip-path: polygon(0 0, 54% 0, 30% 100%, 0 100%); }
          }
          @keyframes avSweepOut {
            0% { clip-path: polygon(0 0, 54% 0, 30% 100%, 0 100%); }
            45% { clip-path: polygon(0 0, 100% 0, 100% 100%, 0 100%); }
            100% { clip-path: polygon(46% 0, 100% 0, 100% 100%, 70% 100%); }
          }

          /* ---- panes ---- */
          .av-root .av-pane {
            position: absolute;
            top: 0;
            height: 100%;
            z-index: 2;
          }
          .av-root .av-info {
            width: 40%;
            padding: 0 40px;
            display: flex;
            flex-direction: column;
            justify-content: center;
            pointer-events: none;
            text-shadow: 0 2px 14px rgba(0, 0, 0, 0.8);
          }
          .av-root .av-info-login {
            right: 0;
            align-items: flex-end;
            text-align: right;
          }
          .av-root .av-info-register {
            left: 0;
            width: 34%;
            align-items: flex-start;
            text-align: left;
          }
          .av-root .av-lockup {
            display: flex;
            align-items: center;
            gap: 10px;
            margin-bottom: 18px;
          }
          .av-root .av-info-login .av-lockup {
            flex-direction: row-reverse;
          }
          .av-root .av-lockup img {
            width: 52px;
            height: 52px;
            object-fit: contain;
            filter: drop-shadow(0 0 12px rgba(255, 255, 255, 0.35));
          }
          .av-root .av-mark {
            width: 52px;
            height: 52px;
            border-radius: 14px;
            display: grid;
            place-items: center;
            font-weight: 800;
            background: rgba(var(--glow), 0.16);
            border: 1px solid rgba(var(--glow), 0.6);
          }
          .av-root .av-lockup span {
            font-weight: 800;
            font-size: 18px;
            letter-spacing: -0.02em;
          }
          .av-root .av-lockup span b {
            color: rgb(var(--glow));
          }
          .av-root .av-info h2 {
            font-size: 30px;
            line-height: 1.15;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: -0.01em;
          }
          .av-root .av-info p {
            font-size: 14px;
            line-height: 1.55;
            margin-top: 10px;
            color: #e6efe9;
          }

          .av-root .av-form {
            width: 46%;
            padding: 0 36px;
            overflow-x: hidden;
            overflow-y: auto;
            display: flex;
            flex-direction: column;
          }
          .av-root .av-form-login { left: 0; }
          .av-root .av-form-register { right: 0; }
          .av-root .av-form-inner {
            margin: auto 0;
            padding: 26px 0;
          }
          .av-root .av-title {
            font-size: 28px;
            font-weight: 700;
            letter-spacing: -0.02em;
            line-height: 1.2;
            text-align: center;
            color: #fff;
          }
          .av-root .av-sub {
            font-size: 14px;
            font-weight: 500;
            color: #94a3b8;
            text-align: center;
            margin: 6px 0 22px;
          }

          /* submit button (green) */
          .av-root .av-primary {
            color: #fff !important;
            border-color: rgba(var(--glow), 0.55) !important;
            background: linear-gradient(135deg, rgba(var(--glow), 0.32), rgba(var(--glow), 0.12)) !important;
            box-shadow: 0 10px 26px -12px rgba(var(--glow), 0.8);
          }
          .av-root .av-primary:hover:not(:disabled) {
            background: linear-gradient(135deg, rgba(var(--glow), 0.5), rgba(var(--glow), 0.2)) !important;
          }

          /* ---- slide + blur choreography ---- */
          .av-root .av-anim {
            transition: transform 0.7s ease, opacity 0.7s ease, filter 0.7s ease;
          }
          .av-root:not(.av-play) .av-anim { transition: none; }

          .av-root .av-form-login .av-anim,
          .av-root .av-info-login .av-anim {
            transform: none;
            opacity: 1;
            filter: blur(0);
            transition-delay: calc(0.1s * var(--li));
          }
          .av-root.av-up .av-form-login .av-anim {
            transform: translateX(-120%);
            opacity: 0;
            filter: blur(10px);
            transition-delay: calc(0.1s * var(--i));
          }
          .av-root.av-up .av-info-login .av-anim {
            transform: translateX(120%);
            opacity: 0;
            filter: blur(10px);
            transition-delay: calc(0.1s * var(--i));
          }
          .av-root .av-form-register .av-anim {
            transform: translateX(120%);
            opacity: 0;
            filter: blur(10px);
            transition-delay: calc(0.1s * var(--i));
          }
          .av-root .av-info-register .av-anim {
            transform: translateX(-120%);
            opacity: 0;
            filter: blur(10px);
            transition-delay: calc(0.1s * var(--i));
          }
          .av-root.av-up .av-form-register .av-anim,
          .av-root.av-up .av-info-register .av-anim {
            transform: none;
            opacity: 1;
            filter: blur(0);
            transition-delay: calc(0.1s * var(--li));
          }

          /* ===================== MOBILE ===================== */
          @media (max-width: 720px) {
            .av-root .av-art {
              clip-path: polygon(0 0, 100% 0, 100% 20%, 0 28%);
            }
            .av-root.av-up .av-art {
              clip-path: polygon(0 0, 100% 0, 100% 28%, 0 20%);
            }
            @keyframes avSweepIn {
              0% { clip-path: polygon(0 0, 100% 0, 100% 20%, 0 28%); }
              45% { clip-path: polygon(0 0, 100% 0, 100% 100%, 0 100%); }
              100% { clip-path: polygon(0 0, 100% 0, 100% 28%, 0 20%); }
            }
            @keyframes avSweepOut {
              0% { clip-path: polygon(0 0, 100% 0, 100% 28%, 0 20%); }
              45% { clip-path: polygon(0 0, 100% 0, 100% 100%, 0 100%); }
              100% { clip-path: polygon(0 0, 100% 0, 100% 20%, 0 28%); }
            }
            .av-root .av-info,
            .av-root .av-info-register {
              width: 100%;
              height: 21%;
              top: 0;
              padding: 0 64px 0 22px;
              align-items: flex-start;
              text-align: left;
            }
            .av-root .av-info-login {
              right: auto;
              left: 0;
            }
            .av-root .av-info .av-lockup,
            .av-root .av-info-login .av-lockup {
              margin-bottom: 6px;
              flex-direction: row;
            }
            .av-root .av-lockup img,
            .av-root .av-mark {
              width: 34px;
              height: 34px;
            }
            .av-root .av-lockup span { font-size: 15px; }
            .av-root .av-info h2 { font-size: 19px; }
            .av-root .av-info p { display: none; }
            .av-root .av-form {
              width: 100%;
              top: auto;
              bottom: 0;
              height: 72%;
              padding: 0 22px;
            }
            .av-root .av-form-login,
            .av-root .av-form-register {
              left: 0;
              right: auto;
            }
            .av-root .av-form-inner { padding: 14px 0 22px; }
            .av-root .av-title { font-size: 24px; }
            .av-root .av-sub { margin: 4px 0 16px; font-size: 12.5px; }
          }

          @media (prefers-reduced-motion: reduce) {
            .av-root .av-art-img { animation: none; }
          }
        `}</style>
      </DialogContent>
    </Dialog>
  )
        }
