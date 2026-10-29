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
 * GLOW COLOR (R,G,B)  — MVBD logo-r "BD" er green
 * onno green chaile shudhu ei line ta change koro
 * =========================================
 */
const GLOW = "60,225,25"

/* Side poster image (sign in / sign up panel) */
const POSTER =
  "https://i.postimg.cc/7hLqB21s/Netflix-all-movies-and-series-featured-image.jpg"
const LOGO = "https://i.postimg.cc/V6GHC8yG/17773-removebg-preview.png"

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
  "peer-focus:top-[11px] peer-focus:translate-y-0 peer-focus:text-[10.5px] peer-focus:text-slate-300"
const FLOAT_ON_VALUE =
  "peer-[:not(:placeholder-shown)]:top-[11px] peer-[:not(:placeholder-shown)]:translate-y-0 peer-[:not(:placeholder-shown)]:text-[10.5px]"
const FLOAT_ALWAYS = "top-[11px] translate-y-0 text-[10.5px]"

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
      className="glow-field av-h group relative rounded-full border border-white/10 bg-white/[0.04] transition-all duration-300 focus-within:border-white/25 focus-within:bg-white/[0.07]"
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
            background: `radial-gradient(ellipse at 28% 50%, rgba(${GLOW},0.7) 0%, rgba(${GLOW},0.3) 40%, transparent 70%)`,
          }}
        />
        <div
          className="absolute inset-x-8 bottom-0 h-px opacity-0 transition-opacity duration-500 group-focus-within:opacity-100"
          style={{
            background: `linear-gradient(90deg, transparent, rgba(${GLOW},0.95), transparent)`,
          }}
        />
      </div>

      {/* outer soft glow */}
      <div
        className="pointer-events-none absolute inset-0 rounded-full opacity-0 transition-opacity duration-500 group-focus-within:opacity-100"
        style={{ boxShadow: `0 0 34px -8px rgba(${GLOW},0.55)` }}
      />

      <input
        id={id}
        ref={ref}
        placeholder=" "
        className={`peer relative z-10 h-full w-full rounded-full bg-transparent px-[22px] pb-[3px] pt-[18px] text-[15px] font-semibold text-white outline-none ${
          rightSlot ? "pr-14" : ""
        } ${alwaysFloat ? "[color-scheme:dark]" : ""} ${className}`}
        style={{ caretColor: `rgb(${GLOW})` }}
        {...props}
      />

      <label
        htmlFor={id}
        className={`pointer-events-none absolute left-[22px] z-10 top-1/2 -translate-y-1/2 text-sm font-medium text-slate-400 transition-all duration-300 ease-out ${
          alwaysFloat ? FLOAT_ALWAYS : `${FLOAT_ON_FOCUS} ${FLOAT_ON_VALUE}`
        }`}
      >
        {label}
      </label>

      {rightSlot ? (
        <div className="absolute right-3 top-1/2 z-20 -translate-y-1/2">{rightSlot}</div>
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
      className={`group/btn av-h relative flex w-full items-center rounded-full border border-white/10 bg-white/[0.04] pl-5 pr-2.5 text-[14.5px] font-semibold text-slate-200 transition-all duration-300 hover:border-white/25 hover:bg-white/[0.09] active:scale-[0.99] disabled:opacity-60 ${className}`}
    >
      {icon ? <span className="mr-3 flex size-6 items-center justify-center">{icon}</span> : null}
      <span className="flex-1 text-left">{children}</span>
      <span className="flex size-9 items-center justify-center rounded-full border border-white/15 bg-white/[0.06] transition-all duration-300 group-hover/btn:translate-x-0.5 group-hover/btn:bg-white/15">
        <ArrowRight className="size-4 text-white" />
      </span>
    </button>
  )
}

/* slide + blur animated wrapper (n = stagger index) */
function Anim({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <div className="av-anim" style={{ "--n": n } as React.CSSProperties}>
      {children}
    </div>
  )
}

function ErrorAlert({ message }: { message: string }) {
  if (!message) return null
  return (
    <div
      className="av-alert flex items-start gap-2 rounded-2xl border border-red-500/25 bg-red-500/10 px-3 py-2.5 text-xs text-red-300"
      role="alert"
    >
      <span className="mt-0.5 size-1.5 shrink-0 rounded-full bg-red-400" />
      {message}
    </div>
  )
}

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
  const [played, setPlayed] = useState(false) // sweep animation shuru hobe prothom switch-er por
  const [showPasswordIn, setShowPasswordIn] = useState(false)
  const [showPasswordUp, setShowPasswordUp] = useState(false)
  const [error, setError] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  // sign in fields
  const emailRef = useRef<HTMLInputElement>(null)
  const passwordRef = useRef<HTMLInputElement>(null)
  // sign up fields
  const upEmailRef = useRef<HTMLInputElement>(null)
  const upPasswordRef = useRef<HTMLInputElement>(null)
  const nameRef = useRef<HTMLInputElement>(null)
  const dobRef = useRef<HTMLInputElement>(null)
  const referralRef = useRef<HTMLInputElement>(null)

  const paneInRef = useRef<HTMLElement | null>(null)
  const paneUpRef = useRef<HTMLElement | null>(null)

  // Reset on close (exit animation shesh howar por)
  useEffect(() => {
    if (open) return
    const t = setTimeout(() => {
      if (emailRef.current) emailRef.current.value = ""
      if (passwordRef.current) passwordRef.current.value = ""
      if (upEmailRef.current) upEmailRef.current.value = ""
      if (upPasswordRef.current) upPasswordRef.current.value = ""
      if (nameRef.current) nameRef.current.value = ""
      if (dobRef.current) dobRef.current.value = ""
      if (referralRef.current) referralRef.current.value = ""
      setError("")
      setPlayed(false)
      setMode("sign-in")
      setShowPasswordIn(false)
      setShowPasswordUp(false)
    }, 350)
    return () => clearTimeout(t)
  }, [open])

  // Telegram Mini App: expand
  useEffect(() => {
    if (typeof window === "undefined") return
    const tg = (window as any).Telegram?.WebApp
    if (tg) {
      try {
        tg.expand?.()
        tg.enableClosingConfirmation?.()
      } catch {}
    }
  }, [])

  const handleSignIn = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError("")
    setIsSubmitting(true)

    const email = emailRef.current?.value.trim() ?? ""
    const password = passwordRef.current?.value ?? ""

    try {
      await signIn(email, password)
      onOpenChange(false)
    } catch (authError) {
      setError(getAuthErrorMessage(authError))
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSignUp = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError("")
    setIsSubmitting(true)

    const email = upEmailRef.current?.value.trim() ?? ""
    const password = upPasswordRef.current?.value ?? ""

    try {
      await signUp(email, password, {
        name: nameRef.current?.value.trim() ?? "",
        dateOfBirth: dobRef.current?.value ?? "",
        referralCode: (referralRef.current?.value ?? "").trim().toUpperCase(),
      })
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
    if (next === mode || isSubmitting) return
    setPlayed(true)
    setMode(next)
    setError("")
    if (paneInRef.current) paneInRef.current.scrollTop = 0
    if (paneUpRef.current) paneUpRef.current.scrollTop = 0
  }

  const isUp = mode === "sign-up"

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        onOpenAutoFocus={(e) => e.preventDefault()}
        onCloseAutoFocus={(e) => e.preventDefault()}
        onPointerDownOutside={(e) => {
          e.preventDefault()
        }}
        className={`av-modal fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 gap-0 overflow-hidden border border-white/10 p-0 text-white [&>button]:hidden ${
          isUp ? "av-is-up" : ""
        } ${played ? "av-play" : ""}`}
        style={
          {
            zIndex: 2147483647,
            "--glow": GLOW,
          } as React.CSSProperties
        }
      >
        {/* accessible title/description (screen reader only) */}
        <DialogHeader className="sr-only">
          <DialogTitle>{isUp ? "Create account" : "Welcome back"}</DialogTitle>
          <DialogDescription>
            {isUp
              ? "Join MVBD and unlock unlimited movies & shows"
              : "Sign in to your account"}
          </DialogDescription>
        </DialogHeader>

        {/* === POSTER PANEL (slides between sides) === */}
        <div className="av-art-wrap">
          <div className="av-art">
            <div className="av-art-img" style={{ backgroundImage: `url('${POSTER}')` }} />
            <div className="av-art-shade" />
          </div>
        </div>

        {/* === INFO on poster : sign-in === */}
        <section className="av-pane av-info av-info-login" aria-hidden={isUp}>
          <Anim n={0}>
            <div className="av-lockup">
              <img src={LOGO} alt="" />
              <span>
                Movies<b>Verse</b>BD
              </span>
            </div>
          </Anim>
          <Anim n={1}>
            <h2>Welcome back</h2>
          </Anim>
          <Anim n={2}>
            <p>Your movies and shows are waiting. Sign in and pick up right where you left off.</p>
          </Anim>
        </section>

        {/* === INFO on poster : sign-up === */}
        <section className="av-pane av-info av-info-register" aria-hidden={!isUp}>
          <Anim n={0}>
            <div className="av-lockup">
              <img src={LOGO} alt="" />
              <span>
                Movies<b>Verse</b>BD
              </span>
            </div>
          </Anim>
          <Anim n={1}>
            <h2>Join MVBD</h2>
          </Anim>
          <Anim n={2}>
            <p>Create your free account and unlock unlimited movies &amp; shows.</p>
          </Anim>
        </section>

        {/* === CLOSE BUTTON === */}
        <div className="absolute right-3.5 top-3.5" style={{ zIndex: 9999 }}>
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

        {/* === SIGN IN FORM === */}
        <section
          ref={(el) => {
            paneInRef.current = el
            if (el) (el as any).inert = isUp
          }}
          className="av-pane av-form av-form-login"
          aria-hidden={isUp}
        >
          <form className="av-form-inner" onSubmit={handleSignIn}>
            <Anim n={0}>
              <h2 className="av-title">Welcome back</h2>
            </Anim>
            <Anim n={1}>
              <p className="av-sub">Sign in to your account</p>
            </Anim>

            <div className="av-fields">
              <Anim n={2}>
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
              </Anim>

              <Anim n={3}>
                <GlowField
                  id="auth-password"
                  ref={passwordRef}
                  type={showPasswordIn ? "text" : "password"}
                  autoComplete="current-password"
                  autoCorrect="off"
                  autoCapitalize="off"
                  spellCheck={false}
                  required
                  minLength={6}
                  label="Password"
                  rightSlot={
                    <button
                      type="button"
                      aria-label={showPasswordIn ? "Hide password" : "Show password"}
                      onClick={() => setShowPasswordIn((v) => !v)}
                      className="flex size-8 items-center justify-center rounded-full text-slate-400 transition-colors hover:text-white"
                    >
                      {showPasswordIn ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  }
                />
              </Anim>

              {!isUp && error ? <ErrorAlert message={error} /> : null}

              <Anim n={4}>
                <PillButton type="submit" disabled={isSubmitting} className="av-primary">
                  Sign in
                </PillButton>
              </Anim>

              <Anim n={5}>
                <div className="av-or">
                  <span>or</span>
                </div>
              </Anim>

              <Anim n={5}>
                <PillButton
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleGoogleSignIn}
                  icon={GoogleIcon}
                >
                  Continue with Google
                </PillButton>
              </Anim>
            </div>

            <Anim n={6}>
              <p className="av-switch">
                Don’t have an account?{" "}
                <button type="button" onClick={() => switchMode("sign-up")}>
                  Sign up
                </button>
              </p>
            </Anim>
          </form>
        </section>

        {/* === SIGN UP FORM === */}
        <section
          ref={(el) => {
            paneUpRef.current = el
            if (el) (el as any).inert = !isUp
          }}
          className="av-pane av-form av-form-register"
          aria-hidden={!isUp}
        >
          <form className="av-form-inner" onSubmit={handleSignUp}>
            <Anim n={0}>
              <h2 className="av-title">Create account</h2>
            </Anim>
            <Anim n={1}>
              <p className="av-sub">Join MVBD and unlock unlimited movies &amp; shows</p>
            </Anim>

            <div className="av-fields">
              <Anim n={2}>
                <GlowField
                  id="auth-name"
                  ref={nameRef}
                  label="Full name"
                  autoComplete="name"
                  required
                />
              </Anim>
              <Anim n={3}>
                <GlowField
                  id="auth-dob"
                  ref={dobRef}
                  type="date"
                  label="Date of birth"
                  alwaysFloat
                  required
                />
              </Anim>
              <Anim n={4}>
                <GlowField
                  id="auth-referral"
                  ref={referralRef}
                  label="Referral code (optional)"
                  autoCapitalize="characters"
                />
              </Anim>
              <Anim n={5}>
                <GlowField
                  id="auth-up-email"
                  ref={upEmailRef}
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  autoCorrect="off"
                  autoCapitalize="off"
                  spellCheck={false}
                  required
                  label="Email"
                />
              </Anim>
              <Anim n={6}>
                <GlowField
                  id="auth-up-password"
                  ref={upPasswordRef}
                  type={showPasswordUp ? "text" : "password"}
                  autoComplete="new-password"
                  autoCorrect="off"
                  autoCapitalize="off"
                  spellCheck={false}
                  required
                  minLength={6}
                  label="Password"
                  rightSlot={
                    <button
                      type="button"
                      aria-label={showPasswordUp ? "Hide password" : "Show password"}
                      onClick={() => setShowPasswordUp((v) => !v)}
                      className="flex size-8 items-center justify-center rounded-full text-slate-400 transition-colors hover:text-white"
                    >
                      {showPasswordUp ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  }
                />
              </Anim>

              {isUp && error ? <ErrorAlert message={error} /> : null}

              <Anim n={7}>
                <PillButton type="submit" disabled={isSubmitting} className="av-primary">
                  Create account
                </PillButton>
              </Anim>

              <Anim n={8}>
                <div className="av-or">
                  <span>or</span>
                </div>
              </Anim>

              <Anim n={8}>
                <PillButton
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleGoogleSignIn}
                  icon={GoogleIcon}
                >
                  Continue with Google
                </PillButton>
              </Anim>
            </div>

            <Anim n={9}>
              <p className="av-switch">
                Already have an account?{" "}
                <button type="button" onClick={() => switchMode("sign-in")}>
                  Sign in
                </button>
              </p>
            </Anim>
          </form>
        </section>

        <style jsx global>{`
          /* ================= MODAL SHELL ================= */
          .av-modal {
            width: calc(100vw - 20px) !important;
            max-width: 960px !important;
            height: min(640px, calc(100dvh - 20px)) !important;
            max-height: none !important;
            padding: 0 !important;
            border-radius: 30px !important;
            background: #07100c !important;
            display: block !important;
            box-shadow: 0 40px 90px -20px rgba(0, 0, 0, 0.95),
              0 0 60px -20px rgba(var(--glow), 0.5) !important;
          }
          .av-modal[data-state="open"] {
            animation: authModalIn 0.5s cubic-bezier(0.22, 1.2, 0.36, 1) both;
          }
          .av-modal[data-state="closed"] {
            animation: authModalOut 0.3s cubic-bezier(0.4, 0, 1, 1) both;
          }
          .av-modal .av-h {
            height: 54px;
          }

          /* ================= POSTER PANEL ================= */
          .av-art-wrap {
            position: absolute;
            inset: 0;
            z-index: 0;
            pointer-events: none;
            filter: drop-shadow(0 0 7px rgba(var(--glow), 0.75));
          }
          .av-art {
            position: absolute;
            inset: 0;
            overflow: hidden;
            background: linear-gradient(45deg, #06120c, rgb(var(--glow)));
            clip-path: polygon(46% 0, 100% 0, 100% 100%, 70% 100%);
          }
          .av-art-img {
            position: absolute;
            inset: -4%;
            background-position: center;
            background-size: cover;
            background-repeat: no-repeat;
            animation: avKenburns 22s ease-in-out infinite alternate;
          }
          .av-art-shade {
            position: absolute;
            inset: 0;
            background: linear-gradient(
                180deg,
                rgba(0, 0, 0, 0.35) 0%,
                rgba(0, 0, 0, 0) 30%,
                rgba(0, 0, 0, 0.25) 55%,
                rgba(0, 0, 0, 0.82) 100%
              ),
              linear-gradient(135deg, rgba(var(--glow), 0.18), transparent 55%);
          }
          .av-is-up .av-art {
            clip-path: polygon(0 0, 54% 0, 30% 100%, 0 100%);
          }
          .av-play:not(.av-is-up) .av-art {
            animation: avSweepOut 1.5s ease both;
          }
          .av-play.av-is-up .av-art {
            animation: avSweepIn 1.5s ease both;
          }
          @keyframes avKenburns {
            from {
              transform: scale(1);
            }
            to {
              transform: scale(1.09) translate(-1.2%, 0.8%);
            }
          }
          @keyframes avSweepIn {
            0% {
              clip-path: polygon(46% 0, 100% 0, 100% 100%, 70% 100%);
            }
            45% {
              clip-path: polygon(0 0, 100% 0, 100% 100%, 0 100%);
            }
            100% {
              clip-path: polygon(0 0, 54% 0, 30% 100%, 0 100%);
            }
          }
          @keyframes avSweepOut {
            0% {
              clip-path: polygon(0 0, 54% 0, 30% 100%, 0 100%);
            }
            45% {
              clip-path: polygon(0 0, 100% 0, 100% 100%, 0 100%);
            }
            100% {
              clip-path: polygon(46% 0, 100% 0, 100% 100%, 70% 100%);
            }
          }

          /* ================= PANES ================= */
          .av-pane {
            position: absolute;
            top: 0;
            height: 100%;
            z-index: 2;
          }
          .av-info {
            width: 40%;
            padding: 0 40px;
            display: flex;
            flex-direction: column;
            justify-content: center;
            pointer-events: none;
            text-shadow: 0 2px 14px rgba(0, 0, 0, 0.8);
          }
          .av-info-login {
            right: 0;
            align-items: flex-end;
            text-align: right;
          }
          .av-info-register {
            left: 0;
            align-items: flex-start;
            text-align: left;
            width: 34%;
          }
          .av-lockup {
            display: flex;
            align-items: center;
            gap: 10px;
            margin-bottom: 18px;
          }
          .av-info-login .av-lockup {
            flex-direction: row-reverse;
          }
          .av-lockup img {
            width: 52px;
            height: 52px;
            object-fit: contain;
            filter: drop-shadow(0 0 12px rgba(255, 255, 255, 0.35));
          }
          .av-lockup span {
            font-weight: 800;
            font-size: 18px;
            letter-spacing: -0.02em;
          }
          .av-lockup span b {
            color: rgb(var(--glow));
          }
          .av-info h2 {
            font-size: 30px;
            line-height: 1.15;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: -0.01em;
          }
          .av-info p {
            font-size: 14px;
            line-height: 1.55;
            margin-top: 10px;
            color: #e6efe9;
          }

          .av-form {
            width: 46%;
            overflow-y: auto;
            overscroll-behavior: contain;
            -webkit-overflow-scrolling: touch;
            touch-action: pan-y;
            scrollbar-width: none;
            display: flex;
            flex-direction: column;
            padding: 0 36px;
          }
          .av-form::-webkit-scrollbar {
            display: none;
          }
          .av-form-login {
            left: 0;
          }
          .av-form-register {
            right: 0;
          }
          .av-is-up .av-form-login,
          .av-form-register {
            pointer-events: none;
          }
          .av-form-login,
          .av-is-up .av-form-register {
            pointer-events: auto;
          }
          .av-form-inner {
            margin: auto 0;
            padding: 26px 0;
          }
          .av-title {
            font-size: 28px;
            font-weight: 700;
            letter-spacing: -0.02em;
            text-align: center;
            line-height: 1.2;
          }
          .av-sub {
            font-size: 13px;
            color: #94a3b8;
            text-align: center;
            margin: 6px 0 22px;
            font-weight: 500;
          }
          .av-fields {
            display: flex;
            flex-direction: column;
            gap: 11px;
          }
          .av-form input,
          .av-form select,
          .av-form textarea {
            font-size: 16px !important;
          }
          /* browser autofill-er blue/white background remove */
          .av-form input:-webkit-autofill,
          .av-form input:-webkit-autofill:focus {
            -webkit-text-fill-color: #fff;
            transition: background-color 9999s ease-in-out 0s;
            box-shadow: 0 0 0 1000px transparent inset;
          }

          /* ================= SLIDE + BLUR CHOREOGRAPHY ================= */
          .av-anim {
            transition: transform 0.7s ease, opacity 0.7s ease, filter 0.7s ease;
          }
          /* sign-in visible by default */
          .av-form-login .av-anim,
          .av-info-login .av-anim {
            transform: none;
            opacity: 1;
            filter: blur(0);
            transition-delay: calc(0.8s + 0.06s * var(--n));
          }
          .av-is-up .av-form-login .av-anim {
            transform: translateX(-120%);
            opacity: 0;
            filter: blur(10px);
            transition-delay: calc(0.05s * var(--n));
          }
          .av-is-up .av-info-login .av-anim {
            transform: translateX(120%);
            opacity: 0;
            filter: blur(10px);
            transition-delay: calc(0.05s * var(--n));
          }
          /* sign-up hidden by default */
          .av-form-register .av-anim,
          .av-info-register .av-anim {
            transform: translateX(120%);
            opacity: 0;
            filter: blur(10px);
            transition-delay: calc(0.05s * var(--n));
          }
          .av-info-register .av-anim {
            transform: translateX(-120%);
          }
          .av-is-up .av-form-register .av-anim,
          .av-is-up .av-info-register .av-anim {
            transform: none;
            opacity: 1;
            filter: blur(0);
            transition-delay: calc(0.8s + 0.06s * var(--n));
          }
          .av-modal:not(.av-play) .av-anim {
            transition: none;
          }

          /* ================= BUTTONS / MISC ================= */
          .av-primary {
            margin-top: 3px;
            color: #fff !important;
            border-color: rgba(var(--glow), 0.55) !important;
            background: linear-gradient(
              135deg,
              rgba(var(--glow), 0.32),
              rgba(var(--glow), 0.12)
            ) !important;
            box-shadow: 0 10px 26px -12px rgba(var(--glow), 0.8);
          }
          .av-primary:hover:not(:disabled) {
            background: linear-gradient(
              135deg,
              rgba(var(--glow), 0.5),
              rgba(var(--glow), 0.2)
            ) !important;
          }
          .av-or {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 2px 0;
            font-size: 10px;
            font-weight: 600;
            letter-spacing: 0.2em;
            text-transform: uppercase;
            color: #64748b;
          }
          .av-or::before,
          .av-or::after {
            content: "";
            flex: 1;
            height: 1px;
            background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.16), transparent);
          }
          .av-switch {
            text-align: center;
            font-size: 13px;
            font-weight: 500;
            color: #94a3b8;
            padding-top: 12px;
          }
          .av-switch button {
            font-weight: 700;
            color: #fff;
            text-underline-offset: 4px;
            transition: color 0.2s;
          }
          .av-switch button:hover {
            text-decoration: underline;
            color: rgb(var(--glow));
          }
          .av-alert {
            animation: avShake 0.4s;
          }
          @keyframes avShake {
            20%,
            60% {
              transform: translateX(-4px);
            }
            40%,
            80% {
              transform: translateX(4px);
            }
          }

          /* ================= LOADER TEXT ================= */
          .shimmer-loading-text {
            font-size: 13px;
            font-weight: 600;
            letter-spacing: 0.15em;
            text-transform: uppercase;
            color: #b7ff00;
            text-shadow: 0 0 15px rgba(183, 255, 0, 0.5);
            animation: shimmerTextBlink 1.6s ease-in-out infinite;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif;
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

          /* ================= OPEN / CLOSE KEYFRAMES ================= */
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

          /* ================= MOBILE: poster band on top, form below ================= */
          @media (max-width: 720px) {
            .av-modal {
              max-width: 430px !important;
              height: min(720px, calc(100dvh - 20px)) !important;
              border-radius: 28px !important;
            }
            .av-modal .av-h {
              height: 50px;
            }
            .av-art {
              clip-path: polygon(0 0, 100% 0, 100% 20%, 0 28%);
            }
            .av-is-up .av-art {
              clip-path: polygon(0 0, 100% 0, 100% 28%, 0 20%);
            }
            @keyframes avSweepIn {
              0% {
                clip-path: polygon(0 0, 100% 0, 100% 20%, 0 28%);
              }
              45% {
                clip-path: polygon(0 0, 100% 0, 100% 100%, 0 100%);
              }
              100% {
                clip-path: polygon(0 0, 100% 0, 100% 28%, 0 20%);
              }
            }
            @keyframes avSweepOut {
              0% {
                clip-path: polygon(0 0, 100% 0, 100% 28%, 0 20%);
              }
              45% {
                clip-path: polygon(0 0, 100% 0, 100% 100%, 0 100%);
              }
              100% {
                clip-path: polygon(0 0, 100% 0, 100% 20%, 0 28%);
              }
            }
            .av-info,
            .av-info-register {
              width: 100%;
              height: 21%;
              top: 0;
              padding: 0 64px 0 22px;
              align-items: flex-start !important;
              text-align: left !important;
            }
            .av-info-login {
              right: auto;
              left: 0;
            }
            .av-info .av-lockup {
              margin-bottom: 6px;
              flex-direction: row !important;
            }
            .av-lockup img {
              width: 34px;
              height: 34px;
            }
            .av-lockup span {
              font-size: 15px;
            }
            .av-info h2 {
              font-size: 19px;
            }
            .av-info p {
              display: none;
            }
            .av-form {
              width: 100%;
              top: auto;
              bottom: 0;
              height: 72%;
              padding: 0 22px;
            }
            .av-form-login,
            .av-form-register {
              left: 0;
              right: auto;
            }
            .av-form-inner {
              padding: 14px 0 22px;
            }
            .av-title {
              font-size: 24px;
            }
            .av-sub {
              margin: 4px 0 16px;
              font-size: 12.5px;
            }
            .av-fields {
              gap: 9px;
            }
          }
          @media (prefers-reduced-motion: reduce) {
            .av-art-img {
              animation: none;
            }
          }
        `}</style>
      </DialogContent>
    </Dialog>
  )
}
